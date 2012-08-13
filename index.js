var shoe = require("mux-demux-shoe")

shoe.install = install

module.exports = shoe

function install(server, options, uri, callback) {
    if (typeof options === "function") {
        callback = options
        uri = "/boot"
        options = {}
    } else if (typeof options === "string") {
        callback = uri
        uri = options
        options = {}
    } else if (typeof uri === "function") {
        callback = uri
        uri = "/boot"
    }

    var sock = shoe(options, callback)
    sock.install(server, uri)
    return sock
}