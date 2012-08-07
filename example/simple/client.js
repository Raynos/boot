var boot = require('../../browser.js')
    , mdm = boot("/boot")

var one = window.one = mdm.createStream("one")

mdm.on("connect", function () {
    // Race condition here :(
    one.write("die!")
})

one.on("data", function (data) {
    console.log("message", data)
})

one.write("hello world")