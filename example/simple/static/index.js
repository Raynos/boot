var boot = require('../../browser.js')
    , mdm = boot("/boot")

var one = window.one = mdm.createStream("one")

one.on("data", function (data) {
    console.log("[CLIENT]", data)
})

one.write("hello world")