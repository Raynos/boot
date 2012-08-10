var boot = require('../../browser.js')
    , mdm = boot("/boot")
    , lazynode = require("lazynode")
    , uuid = require("node-uuid")

var remote = lazynode.connect({
    createStream: createStream
    , methods: ["time"]
})

setInterval(function () {
    remote.time(function (t) {
        console.log('time = ' + t)
    })
}, 1000)

function createStream() {
    return mdm.createStream("upnode-" + uuid())
}