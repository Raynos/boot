// event stream -.-
window.Buffer = require("buffer").Buffer

var shoe = require("mux-demux-shoe")
    , through = require("through")
    , PauseStream = require("pause-stream")
    , es = require("event-stream")

module.exports = reconnecter

function reconnecter(uri) {
    var proxyWrite = PauseStream()
        , proxyRead = through()
        , proxy = es.duplex(proxyWrite, proxyRead)
        , metaStreams = []
        , stream

    proxy.createStream = createStream
    proxy.createWriteStream = createWriteStream
    proxy.createReadStream = createReadStream

    createShoeStream()

    return proxy

    function createShoeStream() {
        stream = shoe(uri)

        metaStreams.forEach(proxyMdmStream)

        stream.on("connect", onconnect)

        proxyWrite.pipe(stream).pipe(proxyRead)

        stream.on("end", onend)
    }

    function onconnect() {
        proxyWrite.resume()
        proxy.emit("connect")
    }

    function onend() {
        proxyWrite.pause()
        proxy.emit("disconnect")
        createShoeStream()
    }

    function proxyMdmStream(details) {
        var proxyWrite = details.proxyWrite
            , proxyRead = details.proxyRead

        var mdm = stream.createStream(details.meta, details.opts)

        proxyWrite.pipe(mdm).pipe(proxyRead)
    }

    function createStream(meta, opts) {
        var proxyWrite = PauseStream()
            , proxyRead = through()
            , proxy = es.duplex(proxyWrite, proxyRead)

        var mdm = stream.createStream(meta, opts)

        proxyWrite.pipe(mdm).pipe(proxyRead)

        metaStreams.push({
            proxy: proxy
            , proxyRead: proxyRead
            , proxyWrite: proxyWrite
            , meta: meta
            , opts: opts
        })

        return proxy
    }

    function createWriteStream(meta) {
        createStream(meta, {
            writable: true
            , readable: false
        })
    }

    function createReadStream(meta) {
        createStream(meta, {
            writable: false
            , readable: true
        })
    }
}