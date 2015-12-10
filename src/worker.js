let working = true
let work_queue = []

var resultToHtml  = require("./util").resultToHtml;

let base = require("!!raw!./base.py");

let importre = new RegExp("\\s*import")
let defre = new RegExp("def.*|class.*")
let assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/;
let keyword = /^(assert|pass|del|print|return|yield|raise|break|continue|import|global|exec)/
let indent = /^\s+/
let assignment2 = /^[.a-zA-Z0-9_"\[\]]*\s*=\s*/;
function assignment_test(line) {
  let a = assignment.test(line)
  let b = assignment2.test(line)
  return a || b
}

let RAW_DATA = undefined 

onmessage = function(e) {
  console.log("worker got message:",e)
  switch(e.data.type) {
    case "exec":
      work_queue.push(e.data)
      do_work()
      break;
    case "data":
      RAW_DATA = e.data.data
      break
    default:
      console.log("unknown message for worker",e)
  }
}

function execute_work() {
  working = true
  if (work_queue.length > 0) {
    let job = work_queue.shift()
    console.log("DO JOB",job)
    execute_python(job.doc)
  }
  working = false
}

function do_work() {
  if (working) return;
  while(work_queue.length > 0) {
    console.log("executing work item")
    execute_work();
  }
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
    working = false
    pypyjs.exec(base)
    do_work()
  }).catch((e) => {
    console.log("CATCH",e)
  })
}).catch((e) => {
  console.log("CATCH",e)
})

function handle_result(doc, results, error) {
  for (let cell in results) {
    python_render(doc, cell, results[cell])
  }
  console.log("About to send",doc)
  postMessage({ doc: doc, error: error })
}

var re = /File .<string>., line (\d*)/
function execute_python(doc) {
  let ctx = generate_python_ctx(doc)
  console.log("CTX",ctx)
  pypyjs.ready().then(function() {
    self.RESULTS = {}
    pypyjs.exec(ctx.code).then(() => {
      handle_result(doc, self.RESULTS)
    }).catch((e) => {
      let match = re.exec(e.trace)
      if (match[1] !== '') {
        let error = { name: e.name, message: e.message, cell: ctx.map[match[1]].cell, line: ctx.map[match[1]].line }
        handle_result(doc, self.RESULTS, error)
      } else {
        console.log("Unknown ERROR",e)
      }
    })
  }).catch((e) => {
    console.log("Error in pypyjs promise",e)
  })
}

function generate_python_ctx(doc) {
  let lines = [];
  //let lines = ["def usercode():"];
  let lineno = 0;
  let lineno_map = {}; // keeps track of line number on which to print error
  doc.cells.forEach((c, i) => {
    if (c.cell_type == "code") {

      lines.push("mark("+i+")")
      lineno += 1

      c.source.forEach((line,line_number) => {
        if (!line.match(/^\s*$/) &&
            !line.match(/^\s*%/)) {  // skip directive like "%matplotlib inline" that skulpt doesn't parse
          lineno += 1
          lineno_map[lineno] = { cell: i, line: line_number }
          lines.push(line.replace(/[\r\n]$/,""))
        }
      })
      let line = lines.pop()
      if (!keyword.test(line) && !assignment_test(line) && !defre.test(line) && !importre.test(line) && !indent.test(line)) {
        lines.push(`render(${i},${line})   ## line ${lineno}`)
      } else {
        lineno += 1
        lines.push(line)
        lines.push(`render(${i},None)    ## line ${lineno}`)
      }
    }
  })
  let code = lines.join("\n") + "\n"
  console.log(code)
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

function python_render(doc, cell, result) {
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
    doc.cells[cell].outputs = [
      {
       "data": {
         "text/html": [ html ]
       },
       "execution_count": 1,
       "metadata": {},
       "output_type": "execute_result"
      },
    ]
  } else {
    doc.cells[cell].outputs = [
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
