var http = require('http')
    , path = require("path")
    , through = require("through")
    , browserify = require("browserify")

var server = http.createServer(function (req, res) {
    if (req.url === "/bundle.js") {
        var b = browserify()
        b.addEntry(path.join(__dirname, "./client.js"))
        res.end(b.bundle())
    } else {
        res.end("<script src='bundle.js'></script>")
    }
})
server.listen(8081)

var shoe = require("..")
    , echoStream = through()

var sock = shoe(function (stream) {
    // stream from MuxDemux with the meta property set
    if (stream.meta === "one") {
        stream.on("data", console.log.bind(console))
        stream.pipe(echoStream).pipe(stream)
    }
})

sock.install(server, "/shoe")