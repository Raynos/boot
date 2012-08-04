var shoe = require('../browser.js')
    , mdm = shoe("/shoe")

var one = window.one = mdm.createStream("one")

one.on("data", function (data) {
    console.log("message", data)
})

one.write("hello world")