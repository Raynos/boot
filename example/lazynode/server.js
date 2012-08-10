var http = require('http')
    , path = require("path")
    , browserifyServer = require("browserify-server")
    , boot = require("../..")
    , lazynode = require("lazynode")

var handler = browserifyServer(path.join(__dirname, "static"))
    , server = http.createServer(handler).listen(8080)
    , sock = boot(handleStream)
    , methods = {
        time: function (cb) {
            cb(new Date().toString())
        }
    }

sock.install(server, "/boot")

function handleStream(stream) {
    var up = lazynode(methods)
    stream.pipe(up).pipe(stream)
}