
var resultToHtml  = require("./util").resultToHtml;

//let base = require("!!raw!./base.py");

let importre = new RegExp("\\s*import")
let defre = new RegExp("def.*|class.*")
let assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/;
let keyword = /^(assert|pass|del|print|return|yield|raise|break|continue|import|global|exec|class)/
let indent = /^\s+/
let assignment2 = /^[.a-zA-Z0-9_"\[\]]*\s*=\s*/;
function assignmentTest(line) {
  let a = assignment.test(line)
  let b = assignment2.test(line)
  return a || b
}

let START = Date.now()

function mark(id,str) {
  console.log("MARK " + (Date.now() - START)/1000.0 + ": " + id + " :: " + str)
}

self.READY    = false
self.NEXT_JOB = undefined
self.LOCALS   = {}
self.URL      = undefined
let RAW_DATA  = undefined

onmessage = function(e) {
  switch(e.data.type) {
    case "exec":
      self.NEXT_JOB = e.data
      mark(e.data.editID, "MAYBE_DO_WORK")
      maybeDoWork()
      break;
    case "data":
      RAW_DATA = e.data.data
      self.URL = e.data.url
      START    = e.data.start
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
    generateAndExecPython(work.doc, work.editID);
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
  mark(undefined,data)
//  console.log("STDOUT::" , data)
}

pypyjs.stderr = function(data) {
  console.log("STDERR::" , data)
}


pypyjs.loadModuleData("pandas").then(function() {
  pypyjs.loadModuleData("matplotlib").then(function() {
    pypyjs.loadModuleData("livebook").then(function() {
      pypyjs.exec("import livebook\n").then(function() {
        self.READY = true
        mark(undefined,"pypy.js is ready")
        maybeDoWork()
      }).catch((e) => {
        console.log("CATCH",e)
      })
    }).catch((e) => {
      console.log("CATCH",e)
    })
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

function execPython(doc,index,code,next) {
  pypyjs.ready().then(function() {
    self.RESULTS = undefined
    self.PLOTS = undefined
    self.ERROR = undefined
    self.CODE = code
    self.CELL = index
    pypyjs.exec("print 'A1'\nlivebook.execute()\nprint 'A2'\n").then(() => {
      if (self.ERROR) { console.log("PyErr:",self.ERROR) }
      handleResult(doc, index, self.RESULTS, self.PLOTS, self.LOCALS[index], self.ERROR)
      next()
    }).catch((e) => {
      console.log("ERR",e)
      error = { name: "Unknown Error", message: "see logs", cell: index, line: 0 }
      handleResult(doc, index, self.RESULTS, self.PLOTS, self.LOCALS[index], error)
      next(e)
    })
  }).catch((e) => {
    console.log("Error in pypyjs promise",e)
    next(e)
  })
}

var re = /File .<string>., line (\d*)/
function generateAndExecPython(doc, editID) {
  self.READY = false
  generateAndExecPythonStep(doc,0,false, editID)
}

let CODE_CACHE = {}

function generateAndExecPythonStep(doc,i,started,editID) {
  if (doc.length == 0) { mark(editID,"EXEC DONE"); completeWork(); return }
  mark(editID,"EXEC " + i)
  let code = doc.shift()
  if (!started && CODE_CACHE[i] == code) {
    console.log("REPEAT - SKIPPING",i)
    generateAndExecPythonStep(doc,i+1,started,editID)
    return
  }
  delete CODE_CACHE[i]
  execPython(doc,i,code, (err) => {
    if (err) { // there was an error - stop execution
      completeWork()
    } else if (self.NEXT_JOB) { // new code has arrived - stop execution
      completeWork()
    } else {
      CODE_CACHE[i] = code
      // next tick prevents the stack from blowing up
      // also allows new messages to be processed before the next block of code is executed
      nextTick(() => generateAndExecPythonStep(doc,i+1,true, editID))
    }
  })
}

self.parse_raw_data = function(filename,headerRow,names) {
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
