// event stream -.-
window.Buffer = require("buffer").Buffer

var shoe = require("mux-demux-shoe")
    , through = require("through")
    , es = require("event-stream")
    , Backoff = require("backoff").fibonnaci
    , BACKOFF_OPTIONS = {
        initialDelay: 500,
        maxDelay: 10000
    }

module.exports = reconnecter

function reconnecter(uri) {
    var proxyWrite = through()
        , proxyRead = through()
        , proxy = es.duplex(proxyWrite, proxyRead)
        , metaStreams = []
        , stream
        , backoff = Backoff(BACKOFF_OPTIONS)

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
        proxy.emit("connect")
    }

    function onend() {
        proxy.emit("disconnect")

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
            , proxyMdmWrite = through()
            , proxy = es.duplex(proxyMdmWrite, proxyMdmRead)

        var mdm = stream.createStream(meta, opts)

        proxyMdmWrite.pipe(mdm).pipe(proxyMdmRead, {
            end: false
        })

        metaStreams.push({
            proxy: proxy
            , proxyMdmRead: proxyMdmRead
            , proxyMdmWrite: proxyMdmWrite
            , meta: meta
            , opts: opts
        })

        stream.once("end", mdm.end.bind(mdm))

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