# boot

An automatic reconnect mux-demux-shoe

The mdm connection you get from shoe will magically handle reconnection
logic for you under the hood. You just play with streams

## Client Example

``` js
var boot = require('boot')
    , mdm = boot("/boot")

var one = mdm.createStream("one")

one.on("data", console.log.bind(console, "client"))

one.write("hello world")
```

## Server Example

``` js
var boot = require("boot")
    , through = require("through")
    , echoStream = through()

var sock = boot(function (stream) {
    // stream from MuxDemux with the meta property set
    if (stream.meta === "one") {
        stream.on("data", console.log.bind(console, "server"))
        stream.pipe(echoStream, { end: false }).pipe(stream)
    }
})

sock.install(server, "/boot")
```

## Installation

`npm install boot`

## Contributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Raynos/boot.png
  [2]: http://travis-ci.org/Raynos/boot