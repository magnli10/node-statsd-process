# node-statsd-process
Monitor your process, sends data to statsd.

This is a fork of numbat-process, changing from using numbat to using statsd

```js
var statsdproc = require('node-statsd-process');
var lynx = require('lynx');
var metrics = new lynx('localhost', 8125, {
    scope: 'myapplication',
});

numproc({
    metrics: metrics,
    timeout: 10000, // default is 10000
})

```

now every 10 seconds your application will emit these metrics!

```js

'myapplication.memory.rss'
'myapplication.memory.heapTotal'
'myapplication.memory.heapUsed'
'myapplication.js.eventloop'
'myapplication.js.handles'
'myapplication.js.requests'
'myapplication.fds.count'
'myapplication.cpu.percent'

```

## API

- `var stop = module.exports(options)`
  - options, config
  - options.interval, number ms to poll and report stats. default 10000
  - options.metrics, statsd metrics instance. For example using lynx or node-statsd
  - RETURN: stop function. call it to stop emitting metrics.

