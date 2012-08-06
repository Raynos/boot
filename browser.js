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

        stream.once("connect", onconnect)

        proxyRead.pipe(stream).pipe(proxyWrite, {
            end: false
        })

        stream.once("end", onend)
    }

    function onconnect() {
        proxyWrite.resume()
        proxy.emit("connect")
    }

    function onend() {
        proxyWrite.pause()
        proxy.emit("disconnect")
        // wait a second otherwise it spin locks
        setTimeout(createShoeStream, 1000)
    }

    function proxyMdmStream(details) {
        var proxyWrite = details.proxyWrite
            , proxyRead = details.proxyRead

        var mdm = stream.createStream(details.meta, details.opts)

        proxyRead.pipe(mdm).pipe(proxyWrite, {
            end: false
        })

        stream.once("end", mdm.end.bind(mdm))
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

        stream.once("end", mdm.end.bind(mdm))

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