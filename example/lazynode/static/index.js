var boot = require('../../browser.js')
    , mdm = boot("/boot")
    , upnode = require("upnode")
    , uuid = require("node-uuid")

var up = upnode.connect({
    createStream: createStream
})

setInterval(function () {
    up(function (remote) {
        remote.time(function (t) {
            console.log('time = ' + t)
        })
    })
}, 1000)

function createStream() {
    return mdm.createStream("upnode-" + uuid())
}