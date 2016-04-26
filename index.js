
var blocked = require('blocked')
var cpuPercent = require('cpu-percent')
var procfs = require('procfs-stats')

var DEFAULT_TIMEOUT = 10000

var lagIdInc = 0
var eventLoopLag = {}

module.exports = function(options){

  options = options||{}

  var metrics = options.metrics;

  if (!metrics) {
      throw new Error("options.metrics should exist")
  }

  var procStats = procfs(process.pid)

  // cpu - never reports 0.  on a graph zero means it's failing to report anything

  var percent = 0

  var cpuStop = cpuPercent.pid(process.pid,function(err,_percent){
      debugger;
    if(err) percent = 0
    percent = _percent<1?1:_percent
  },options.cpuInterval||1000)

  cpuStop.unref()

  // get new event loop lag data array
  var lagId = ++lagIdInc
  eventLoopLag[lagId] = []
 
  var stop = _interval(function(cb){

    metric(metrics,'cpu.percent',percent)

    // memory
    var mem = process.memoryUsage();
    Object.keys(mem).forEach(function(k){
      metric(metrics,'memory.'+k,mem[k])
    });

    // event loop lag
    var lag = computeLag(lagId)  

    metric(metrics,'js.eventloop',lag)
    metric(metrics,'js.handles',process._getActiveHandles().length)
    metric(metrics,'js.requests',process._getActiveRequests().length)

    // fds
    procStats.fds(function(err,fds){
      if(fds) metric(metrics,'fds.count',fds.length||0)
      cb();
    })

},options.interval||DEFAULT_TIMEOUT)

  return function(){
    stop()
    cpuStop()
    delete eventLoopLag[lagId]   
  }

}

blocked(function(ms){
  
  var keys = Object.keys(eventLoopLag);
  var k;
  for(var i=0;i<keys.length;++i){
    k = keys[i]
    eventLoopLag[k].push(ms)
    if(eventLoopLag[k].length > 20) eventLoopLag[k].shift()
  }
})

function computeLag(id){

  var lag = eventLoopLag[id]
  if(!lag) return -1
  if(!lag.length) return 0

  eventLoopLag[id] = []
  var sum = 0;
  for(var i=0;i<lag.length;++i){
    sum += lag[i]
  }

  return sum/lag.length

}

// setTimeout loop with callback to prevent metrics gathering cycles from stacking.
function _interval(fn,duration){
  var i, stopped;
  (function loop(){
    if(stopped) return;
    i = setTimeout(function(){
      fn(loop)
    },duration)
    i.unref()
  }())

  return function(){
    stopped = true;
    clearTimeout(i)
  }

}


function metric(metrics,name,value){
  metrics.gauge(name, value === undefined?1:value)
}
