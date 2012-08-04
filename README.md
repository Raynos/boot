# boot

An automatic reconnect mux-demux-shoe

The mdm connection you get from shoe will magically handle reconnection
logic for you under the hood. You just play with streams

## Client Example

    var shoe = require('../browser.js')
        , mdm = shoe("/shoe")

    var one = window.one = mdm.createStream("one")

    one.on("data", function (data) {
        console.log("message", data)
    })

    one.write("hello world")

## Server Example

    var shoe = require("..")
        , through = require("through")
        , echoStream = through()

    var sock = shoe(function (stream) {
        // stream from MuxDemux with the meta property set
        if (stream.meta === "one") {
            stream.on("data", console.log.bind(console))
            stream.pipe(echoStream).pipe(stream)
        }
    })

    sock.install(server, "/shoe")

## Installation

`npm install boot`

## Contributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Raynos/boot.png
  [2]: http://travis-ci.org/Raynos/boot