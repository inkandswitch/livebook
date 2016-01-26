
var resultToHtml  = require("./util").resultToHtml;

let base = require("!!raw!./base.py");

let importre = new RegExp("\\s*import")
let defre = new RegExp("def.*|class.*")
let assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/;
let keyword = /^(assert|pass|del|print|return|yield|raise|break|continue|import|global|exec)/
let indent = /^\s+/
let assignment2 = /^[.a-zA-Z0-9_"\[\]]*\s*=\s*/;
function assignmentTest(line) {
  let a = assignment.test(line)
  let b = assignment2.test(line)
  return a || b
}

self.READY    = false
self.NEXT_JOB = undefined
self.LOCALS   = {}
self.URL      = undefined
let RAW_DATA  = undefined

onmessage = function(e) {
  switch(e.data.type) {
    case "exec":
      console.log("NEW EXEC")
      self.NEXT_JOB = e.data
      maybeDoWork()
      break;
    case "data":
      RAW_DATA = e.data.data
      self.URL = e.data.url
      break
    default:
      console.log("unknown message for worker",e)
  }
}

function maybeDoWork() {
  if (!self.READY) return;
  if (self.NEXT_JOB) {
    let work = self.NEXT_JOB
    self.NEXT_JOB = undefined
    generateAndExecPython(work.doc);
  }
}

// this allows
// 1. IO to happen before the code is executed
// 2. Allows infinite recursion since this blows the stack
function nextTick(func) {
  setTimeout(func,0)
}

self.importScripts("/pypyjs/FunctionPromise.js", "/pypyjs/pypyjs.js", "/d3/d3.js")

pypyjs.stdout = function(data) {
  console.log("STDOUT::" , data)
}

pypyjs.stderr = function(data) {
  console.log("STDERR::" , data)
}

pypyjs.loadModuleData("pandas").then(function() {
  pypyjs.loadModuleData("matplotlib").then(function() {
    self.READY = true
    maybeDoWork()
  }).catch((e) => {
    console.log("CATCH",e)
  })
}).catch((e) => {
  console.log("CATCH",e)
})

function handleResult(doc, index, raw_results, plots, locals, error) {
  let results = python_render(raw_results)
  postMessage({ plots, index, results, error, locals })
}

function completeWork() {
  self.READY = true
  nextTick(maybeDoWork)
}

function execPython(doc,index,ctx,next) {
  pypyjs.ready().then(function() {
    self.RESULTS = undefined
    self.PLOTS = undefined
    console.log("---")
    console.log(ctx.code)
    console.log("---")
    pypyjs.exec(ctx.code).then(() => {
      handleResult(doc, index, self.RESULTS, self.PLOTS, self.LOCALS[index])
      next()
    }).catch((e) => {
      console.log("ERR",e,ctx)
      let match = re.exec(e.trace);
      if (match && match[1] !== '') {
        console.log("match[1]",match[1])
        let n = ctx.map[match[1]]
        let error
        if (ctx.map[match[1]] == undefined) {
          console.log("Error line number bug - pick the first line so we dont crash",e,ctx.map)
          error  = { name: "Unknown Error", message: "see logs", cell: index, line: 0 }
        } else {
          error  = { name: e.name, message: e.message, cell: ctx.map[match[1]].cell, line: ctx.map[match[1]].line }
        }
        handleResult(doc, index, self.RESULTS, self.PLOTS, self.LOCALS[index], error)
      } else {
        console.log("Unknown ERROR",e)
      }
      next(e)
    })
  }).catch((e) => {
    console.log("Error in pypyjs promise",e)
    next(e)
  })
}

let BASE = false
function basePY(next) {
  if (BASE === false) {
    console.log(base)
    pypyjs.exec(base).then(() => {
      BASE = true
      next()
    }).catch((e) => {
      console.log("Error running base.py")
    })
  } else {
    next()
  }
}

var re = /File .<string>., line (\d*)/
function generateAndExecPython(doc) {
  self.READY = false
  basePY(() => {
    generateAndExecPythonStep(doc,0,false)
  })
}

let CODE_CACHE = {}
function generateAndExecPythonStep(doc,i,started) {
  let c = doc.shift()
  let ctx = generatePythonCTX(c,i)
  if (!started && CODE_CACHE[i] == ctx.code) {
    console.log("REPEAT - SKIPPING",i)
    generateAndExecPythonStep(doc,i+1,started)
    return
  }
  console.log("NEW CODE - RUNNING",i)
  delete CODE_CACHE[i]
  execPython(doc,i,ctx, (err) => {
    if (err) { // there was an error - stop execution
      completeWork()
    } else if (self.NEXT_JOB) { // new code has arrived - stop execution
      completeWork()
    } else if (doc.length == 0) { // we finished the last block of code - stop execution
      completeWork()
    } else {
      CODE_CACHE[i] = ctx.code
      // next tick prevents the stack from blowing up
      // also allows new messages to be processed before the next block of code is executed
      nextTick(() => generateAndExecPythonStep(doc,i+1,true))
    }
  })
}

function generatePythonCTX(c,i) {
  let lineno = 2;
  let lines = [`def code():  ## line ${lineno}`];
  let lineno_map = {}; // keeps track of line number on which to print error
  let pad = "  "

  lineno += 1
  lines.push(`import random as __rand__`) // dont know why i need to do this!

  if (self.LOCALS[i - 1]) { // import locals from the last code block
    for (let x in self.LOCALS[i - 1]) {
      lineno += 1
      if (x === "__seed__") {
        lines.push(`__rand__.setstate(LOCALS[${i - 1}]['${x}'])  # line ${lineno}`)
      } else {
        lines.push(`${x} = LOCALS[${i - 1}]['${x}']  # line ${lineno}`)
      }
    }
  } else {
    lineno += 1
    lines.push(`__rand__.seed('${self.URL}')`)
  }

  let map
  c.split("\n").forEach((line,line_number) => {
    if (!line.match(/^\s*$/) && !line.match(/^\s*%/) && !line.match(/^\s*#/)) {  // skip directive like "%matplotlib inline"
      lineno += 1
      map = { cell: i, line: line_number, code: line }
      lineno_map[lineno] = map
      lines.push(line.replace(/[\r\n]$/,""))
     }
   })
   lineno_map[lineno+1] = map // somethimes the error is on the line after
   let line = lines.pop()
   if (!keyword.test(line) && !assignmentTest(line) && !defre.test(line) && !importre.test(line) && !indent.test(line)) {
     lines.push(`__return__ = ${line}`)
     lineno += 1
     lines.push(`__seed__ = __rand__.getstate() # ${lineno}`)
     lineno += 1
     lines.push(`checkpoint(${i},__return__,locals())   ## line ${lineno}`)
   } else {
     lines.push(line)
     lineno += 1
     lines.push(`__seed__ = random.getstate() # ${lineno}`)
     lineno += 1
     lines.push(`checkpoint(${i},None,locals())    ## line ${lineno}`)
   }
   let code = lines.join("\n  ") + "\ncode()"
   return { map: lineno_map, code: code, length: lines.length }
}

self.parse_raw_data = function(filename,headerRow,names) {
  console.log("PARSE",filename,headerRow,names)
  var head = undefined
  var body = {}
  var length = 0

  if (names) {
    head = names;
    head.forEach((h) => body[h] = [])
  }

  d3.csv.parseRows(RAW_DATA, (row, i) => {
    if (headerRow !== undefined && headerRow === i) {
      head = row;
      head.forEach((h) => body[h] = [])
    } else {
      length++;
      if (row.length != head.length) {
        console.log("MISMATCH!",row,head)
        throw "CSV BROKEN LINE " + length
      }
      row.forEach((d,i) => {
        if (d == "") {
          body[head[i]].push(undefined)
        } else if (d == "0") {
          body[head[i]].push(0)
        } else {
          body[head[i]].push(+d || d)
        }
      })
    }
  })

  return JSON.stringify({ head: head, body: body, length: length })
}

function python_render(result) {
  var html;
  var text

  if (result == undefined) return undefined;

  switch(result[0]) {
    case "html":
      html = resultToHtml(result[1]) // do we still use this?
      break;
    default:
      text = String(result[1])
  }

  if (html) {
    return [
      {
       "data": {
         "text/html": [ html ]
       },
       "execution_count": 1,
       "metadata": {},
       "output_type": "execute_result"
      }
    ]
  } else {
    return [
      {
       "data": {
         "text/plain": [text]
       },
       "execution_count": 1,
       "metadata": {},
       "output_type": "execute_result"
      }
    ]
  }
}
