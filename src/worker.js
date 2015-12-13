
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

self.READY     = false
self.NEXT_JOB  = undefined
self.INTERRUPT = false
let RAW_DATA   = undefined

onmessage = function(e) {
  console.log("worker got message:",e)
  switch(e.data.type) {
    case "exec":
      self.NEXT_JOB = e.data
      maybeDoWork()
      break;
    case "data":
      RAW_DATA = e.data.data
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
    console.log("pypyjs is ready")
    pypyjs.exec(base)
    self.READY = true
    maybeDoWork()
  }).catch((e) => {
    console.log("CATCH",e)
  })
}).catch((e) => {
  console.log("CATCH",e)
})

function handleResult(doc, results, plots, error) {
  for (let cell in results) {
    results[cell] = python_render(results[cell])
  }
  console.log("About to send",doc)
  postMessage({ plots: plots, results: results, error: error })
}

function completeWork() {
  self.READY = true
  nextTick(maybeDoWork)
}

function execPython(doc,ctxs) {
  console.log("CTX",ctxs)
  if (ctxs.length == 0) {
    completeWork()
    return;
  }
  if (self.NEXT_JOB) {
    console.log("Interrupt work... new task in queue")
    completeWork()
    return;
  }
  let ctx = ctxs.shift()
  pypyjs.ready().then(function() {
    self.RESULTS = {}
    self.PLOTS = {}
    pypyjs.exec(ctx.code).then(() => {
      handleResult(doc, self.RESULTS, self.PLOTS)
      nextTick(() => execPython(doc,ctxs))
    }).catch((e) => {
      console.log("ERR",e)
      let match = re.exec(e.trace);
      if (match && match[1] !== '') {
        let error = { name: e.name, message: e.message, cell: ctx.map[match[1]].cell, line: ctx.map[match[1]].line }
        handleResult(doc, self.RESULTS, self.PLOTS, error)
      } else {
        console.log("Unknown ERROR",e)
      }
      completeWork()
    })
  }).catch((e) => {
    console.log("Error in pypyjs promise",e)
    completeWork()
  })
}

var re = /File .<string>., line (\d*)/
function generateAndExecPython(doc) {
  self.READY = false
  let ctxs = generatePythonCTX(doc)
  execPython(doc,ctxs)
}

function generatePythonCTX(doc) {
  //let lines = ["def usercode():"];
  let ctxs = []
  doc.cells.forEach((c, i) => {
    let lineno = 0;
    let lines = [];
    let lineno_map = {}; // keeps track of line number on which to print error
    if (c.cell_type == "code") {

      lines.push("mark("+i+")")
      lineno += 1

      c.source.forEach((line,line_number) => {
        if (!line.match(/^\s*$/) &&
            !line.match(/^\s*%/)) {  // skip directive like "%matplotlib inline"
          lineno += 1
          lineno_map[lineno] = { cell: i, line: line_number }
          lines.push(line.replace(/[\r\n]$/,""))
        }
      })
      let line = lines.pop()
      if (!keyword.test(line) && !assignmentTest(line) && !defre.test(line) && !importre.test(line) && !indent.test(line)) {
        lines.push(`render(${i},${line})   ## line ${lineno}`)
      } else {
        lineno += 1
        lines.push(line)
        lines.push(`render(${i},None)    ## line ${lineno}`)
      }
    }
    let code = lines.join("\n") + "\n"
    ctxs.push({ map: lineno_map, code: code, length: lines.length })
  })
//  let code = lines.join("\n") + "\n"
//  console.log(code)
//  return { map: lineno_map, code: code, length: lines.length }
  return ctxs
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
  console.log("RENDER", text)
  var html;
  var text

  switch (result[0]) {
    case "html":
      html = resultToHtml(result[1])
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
