var shoe = require("mux-demux-shoe")
    , through = require("through")
    , PauseStream = require("pause-stream")
    , es = require("event-stream")

module.exports = shoeProxy

function shoeProxy(uri) {
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

        metaStreams.forEach(function (details) {
            var proxyWrite = details.proxyWrite
                , proxyRead = details.proxyRead

            var mdm = stream.createStream(details.meta, details.opts)

            proxyWrite.pipe(mdm).pipe(proxyRead)
        })

        stream.on("connect", function () {
            proxyWrite.resume()
            proxy.emit("connect")
        })

        proxyWrite.pipe(stream).pipe(proxyRead)

        stream.on("end", function () {
            console.log("stream ended")
            proxyWrite.pause()
            proxy.emit("disconnect")
            createShoeStream()
        })
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