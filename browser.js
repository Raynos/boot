// event-stream ~_~
window.Buffer = require("buffer").Buffer

var shoe = require("mux-demux-shoe")
    , PauseStream = require("pause-stream")
    , through = require("through")
    , duplex = require("duplexer")
    , Backoff = require("backoff").fibonnaci
    , BACKOFF_OPTIONS = {
        initialDelay: 500,
        maxDelay: 10000
    }

module.exports = reconnecter

function reconnecter(uri) {
    var proxyWrite = PauseStream()
        , proxyRead = through()
        , proxy = duplex(proxyWrite, proxyRead)
        , metaStreams = []
        , stream
        , connected = false
        , backoff = Backoff(BACKOFF_OPTIONS)

    if (!connected) {
        proxyWrite.pause()
    }

    proxy.createStream = createStream
    proxy.createWriteStream = createWriteStream
    proxy.createReadStream = createReadStream

    createShoeStream()

    return proxy

    function createShoeStream() {
        stream = shoe(uri)

        metaStreams.forEach(proxyMdmStream)

        stream.once("connect", onconnect)

        proxyWrite.pipe(stream).pipe(proxyRead, {
            end: false
        })

        stream.once("end", onend)
    }

    function onconnect() {
        backoff.reset()

        proxyWrite.resume()
        metaStreams.forEach(resume)

        proxy.emit("connect")
        connected = true
    }

    function onend() {
        proxyWrite.pause()
        metaStreams.forEach(pause)

        proxy.emit("disconnect")
        connected = false

        // wait a second otherwise it spin locks
        var delay = backoff.backoffStrategy_.next()
        setTimeout(createShoeStream, delay)
    }

    function proxyMdmStream(details) {
        var proxyMdmRead = details.proxyMdmRead
            , proxyMdmWrite = details.proxyMdmWrite
            , meta = details.meta
            , opts = details.opts

        var mdm = stream.createStream(meta, opts)

        proxyMdmWrite.pipe(mdm).pipe(proxyMdmRead, {
            end: false
        })

        stream.once("end", mdm.end.bind(mdm))
    }

    function createStream(meta, opts) {
        var proxyMdmRead = through()
            , proxyMdmWrite = PauseStream()
            , proxy = duplex(proxyMdmWrite, proxyMdmRead)

        var mdm = stream.createStream(meta, opts)

        if (!connected) {
            proxyMdmWrite.pause()
        }

        proxyMdmWrite.pipe(mdm).pipe(proxyMdmRead, {
            end: false
        })

        var index = metaStreams.push({
            proxy: proxy
            , proxyMdmRead: proxyMdmRead
            , proxyMdmWrite: proxyMdmWrite
            , meta: meta
            , opts: opts
        })

        proxy.on("end", removeFromCache)
        stream.once("end", cleanup)

        function cleanup() {
            mdm.end()
        }

        function removeFromCache() {
            metaStreams.splice(index, 1)
        }

        return proxy
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
}

function resume(details) {
    details.proxyMdmWrite.resume()
}