// event-stream ~_~
window.Buffer = require("buffer").Buffer

var shoe = require("mux-demux-shoe")
    , PauseStream = require("pause-stream")
    , through = require("through")
    , duplex = require("duplexer")
    , Backoff = require("backoff").FibonacciStrategy
    , BACKOFF_OPTIONS = {
        initialDelay: 500,
        maxDelay: 10000
    }

module.exports = reconnecter

function reconnecter(uri, options) {
    if (!options) {
        options = {}
    }

    if (!options.backoff) {
        options.backoff = BACKOFF_OPTIONS
    }

    // Proxy stream that does not close
    var proxyWrite = PauseStream().pause()
        , proxyRead = through()
        , proxy = duplex(proxyWrite, proxyRead)
        // Hold all the MD streams we open so we can re-open them transparently
        , metaStreams = []
        , stream
        , connected = false
        // Create a backoff scheme
        , backoff = new Backoff(options.backoff)

    uri = uri || "/boot"

    proxy.createStream = createStream
    proxy.createWriteStream = createWriteStream
    proxy.createReadStream = createReadStream

    // Open the initial connection
    createShoeStream()

    return proxy

    function createShoeStream() {
        // create a new stream to the server
        stream = shoe(uri, options)

        // re-open proxy MDM streams for all the open ones
        metaStreams.forEach(proxyMdmStream)

        stream.once("connect", onconnect)

        // connect the proxy to the stream. The proxy is not allowed to end
        proxyWrite.pipe(stream).pipe(proxyRead, {
            end: false
        })

        // if the stream ends and is not connected repoll
        stream.on("end", repoll)
    }

    function repoll(wasOpen) {
        proxy.emit("ended", wasOpen)
        // wait a second otherwise it spin locks
        var delay = backoff.next()
        proxy.emit("poll", delay)
        setTimeout(createShoeStream, delay)
    }

    function onconnect() {
        stream.removeListener("end", repoll)
        stream.once("end", handleDisconnect)

        backoff.reset()

        // resume all the buffered state because the connection is open
        proxyWrite.resume()
        metaStreams.forEach(resume)

        proxy.emit("connect")
        connected = true
    }

    function handleDisconnect() {
        // pause existing proxy streams
        proxyWrite.pause()
        metaStreams.forEach(pause)

        // boolean on ended means it's a disconnect rather then just a server
        // closing the stream
        proxy.emit("disconnect")
        connected = false

        // repoll server for open connection
        repoll(true)
    }

    function proxyMdmStream(details) {
        // grab the proxy streams
        var proxyMdmRead = details.proxyMdmRead
            , proxyMdmWrite = details.proxyMdmWrite
            , proxy = details.proxy
            , meta = details.meta
            , opts = details.opts

        var mdm = stream.createStream(meta, opts)

        // proxy MDM stream can't be closed
        proxyMdmWrite.pipe(mdm).pipe(proxyMdmRead, {
            end: false
        })

        mdm.on("error", reemit)

        // if this stream was destroyed then don't close the proxy
        mdm.once("end", onend)

        function reemit(err) {
            proxy.emit("error", err)
        }

        function onend() {
            if (!mdm.destroyed) {
                // it ended cleanly so end the proxy
                proxyMdmRead.end()
                proxyMdmWrite.end()
                proxy.end()
            } else {
                // ended means there is a temporary disconnect from the server
                proxy.emit("ended")
            }
        }
    }

    function createStream(meta, opts) {
        // create proxy for MDM
        var proxyMdmRead = through()
            , proxyMdmWrite = PauseStream()
            , proxy = duplex(proxyMdmWrite, proxyMdmRead)
            , details = {
                proxy: proxy
                , proxyMdmRead: proxyMdmRead
                , proxyMdmWrite: proxyMdmWrite
                , meta: meta
                , opts: opts
            }

        proxyMdmStream(details)

        var index = metaStreams.push(details)

        proxyMdmWrite.on("end", removeFromCache)

        proxy.purge = removeFromCache

        return proxy

        function removeFromCache() {
            metaStreams.splice(index - 1, 1)
        }
    }

    function createWriteStream(meta) {
        return createStream(meta, {
            writable: true
            , readable: false
        })
    }

    function createReadStream(meta) {
        return createStream(meta, {
            writable: false
            , readable: true
        })
    }
}

function pause(details) {
    details.proxyMdmWrite.pause()
    details.proxy.emit("disconnect")
}

function resume(details) {
    details.proxyMdmWrite.resume()
    details.proxy.emit("connect")
}