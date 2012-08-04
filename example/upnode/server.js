var http = require('http')
    , path = require("path")
    , through = require("through")
    , browserify = require("browserify")
    , upnode = require("upnode")

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

var boot = require("../..")

var sock = boot(function (stream) {
    if (stream.meta.match(/upnode-/)) {
        var up = upnode(function (client, conn) {
            this.time = function (cb) {
                cb(new Date().toString())
            }
        })
        up.pipe(stream).pipe(up)
    }
})

sock.install(server, "/boot")