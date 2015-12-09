(function(globalScope) {
//
//  pypyjs:  an experimental in-browser python environment.
//

// When transpiled from es6 to es5, this code will get wrapped
// in a function that takes the encosing global scope as argument.
// This might be the 'window' object in a browser, or the 'global'
// object in nodejs.

'use strict';

if (typeof globalScope === 'undefined') {
  globalScope = {};
}

var _dirname = undefined;

// Find the directory containing this very file.
// It can be quite difficult depending on execution environment...
if (typeof __dirname === 'undefined') {
  _dirname = './';

  // A little hackery to find the URL of this very file.
  // Throw an error, then parse the stack trace looking for filenames.
  var errlines = new Error().stack.split('\n');
  errlines.forEach(function (line) {
    var match = /(at Anonymous function \(|at |@)(.+\/)pypyjs.js/.exec(line);
    if (match) {
      _dirname = match[2];
    }
  });
} else {
  _dirname = __dirname;
}

if (_dirname.charAt(_dirname.length - 1) !== '/') {
  _dirname += '/';
}

// Ensure we have references to 'Promise' and 'FunctionPromise'
// constructors, pulling them in from global scope if possible.
var Promise = undefined;
var FunctionPromise = undefined;

// Ensure we have reference to a 'Promise' constructor.
if (typeof Promise === 'undefined') {
  if (globalScope && typeof globalScope.Promise !== 'undefined') {
    Promise = globalScope.Promise;
  } else if (typeof require === 'function') {
    Promise = require('./Promise.min.js');
  } else if (typeof load === 'function') {
    load(_dirname + 'Promise.min.js');
    if (typeof Promise === 'undefined') {
      if (globalScope && typeof globalScope.Promise !== 'undefined') {
        Promise = globalScope.Promise;
      }
    }
  }
}

if (typeof Promise === 'undefined') {
  throw new Error('Promise object not found');
}

// Ensure we have reference to a 'FunctionPromise' constructor.
if (typeof FunctionPromise === 'undefined') {
  if (globalScope && typeof globalScope.FunctionPromise !== 'undefined') {
    FunctionPromise = globalScope.FunctionPromise;
  } else if (typeof require === 'function') {
    FunctionPromise = require('./FunctionPromise.js');
  } else if (typeof load === 'function') {
    load(_dirname + 'FunctionPromise.js');
    if (typeof FunctionPromise === 'undefined') {
      if (globalScope && typeof globalScope.FunctionPromise !== 'undefined') {
        FunctionPromise = globalScope.FunctionPromise;
      }
    }
  }
}

if (typeof FunctionPromise === 'undefined') {
  throw new Error('FunctionPromise object not found');
}

var fs = undefined;
var path = undefined;
// Some extra goodies for nodejs.
if (typeof process !== 'undefined') {
  if (Object.prototype.toString.call(process) === '[object process]') {
    fs = require('fs');
    path = require('path');
  }
}

// Create functions for handling default stdio streams.
// These will be shared by all VM instances by default.
//
// We default stdout and stderr to process outputs if available,
// printing/logging functions otherwise, and /dev/null if nothing
// else is available.  Unfortunately there's no good way to read
// synchronously from stdin in javascript, so that's always /dev/null.

var devNull = {
  stdin: function stdin() {
    return null;
  },
  stdout: function stdout() {},
  stderr: function stderr() {}
};

var stdio = {
  stdin: null,
  stdout: null,
  stderr: null
};

stdio.stdin = devNull.stdin;

if (typeof process !== 'undefined') {
  if (typeof process.stdout !== 'undefined') {
    stdio.stdout = function stdout(byte) {
      process.stdout.write(byte);
    };
  }

  if (typeof process.stderr !== 'undefined') {
    stdio.stderr = function stderr(byte) {
      process.stderr.write(byte);
    };
  }
}

var _print = undefined;
var _printErr = undefined;
if (typeof window === 'undefined') {
  // print, printErr from v8, spidermonkey
  if (typeof print !== 'undefined') {
    _print = print;
  }

  if (typeof printErr !== 'undefined') {
    _printErr = printErr;
  }
}

if (typeof console !== 'undefined') {
  if (typeof _print === 'undefined') {
    _print = console.log.bind(console);
  }

  if (typeof _printErr === 'undefined') {
    _printErr = console.error.bind(console);
  }
}

if (stdio.stdout === null && typeof _print !== 'undefined') {
  (function () {
    // print()/console.log() will add a newline, so we buffer until we
    // receive one and then let it add it for us.
    var buffer = [];
    stdio.stdout = function stdout(data) {
      for (var i = 0; i < data.length; i++) {
        var byte = data.charAt(i);
        if (byte !== '\n') {
          buffer.push(byte);
        } else {
          _print(buffer.join(''));
          buffer.splice(undefined, buffer.length);
        }
      }
    };
  })();
}

if (stdio.stderr === null && typeof _printErr !== 'undefined') {
  (function () {
    // printErr()/console.error() will add a newline, so we buffer until we
    // receive one and then let it add it for us.
    var buffer = [];
    stdio.stderr = function stderr(data) {
      for (var i = 0; i < data.length; i++) {
        var byte = data.charAt(i);
        if (byte !== '\n') {
          buffer.push(byte);
        } else {
          _printErr(buffer.join(''));
          buffer.splice(undefined, buffer.length);
        }
      }
    };
  })();
}

if (stdio.stdout === null) {
  stdio.stdout = devNull.stdout;
}

if (stdio.stderr === null) {
  stdio.stderr = devNull.stderr;
}

// Main class representing the PyPy VM.
// This is our primary export and return value.

function pypyjs(opts) {
  var _this = this;

  var _opts = opts || {};
  this.rootURL = _opts.rootURL;
  this.totalMemory = _opts.totalMemory || 128 * 1024 * 1024;
  this.autoLoadModules = _opts.autoLoadModules || true;
  this._pendingModules = {};
  this._loadedModules = {};
  this._allModules = {};

  // Allow opts to override default IO streams.
  this.stdin = _opts.stdin || stdio.stdin;
  this.stdout = _opts.stdout || stdio.stdout;
  this.stderr = _opts.stderr || stdio.stderr;

  // Default to finding files relative to this very file.
  if (!this.rootURL && !pypyjs.rootURL) {
    pypyjs.rootURL = _dirname;
  }

  if (this.rootURL && this.rootURL.charAt(this.rootURL.length - 1) !== '/') {
    this.rootURL += '/';
  }

  // If we haven't already done so, fetch and load the code for the VM.
  // We do this once and cache the result for re-use, so that we don't
  // have to pay asmjs compilation overhead each time we create the VM.

  if (!pypyjs._vmBuilderPromise) {
    pypyjs._vmBuilderPromise = this.fetch('pypyjs.vm.js').then(function (xhr) {
      // Parse the compiled code, hopefully asynchronously.
      // Unfortunately our use of Function constructor here doesn't
      // play very well with nodejs, where things like 'module' and
      // 'require' are not in the global scope.  We have to pass them
      // in explicitly as arguments.
      var funcBody = [

      // This is the compiled code for the VM.
      xhr.responseText, '\n',

      // Ensure that some functions are available on the Module,
      // for linking with jitted code.
      'if (!Module._jitInvoke && typeof _jitInvoke !== \'undefined\') {', '  Module._jitInvoke = _jitInvoke;', '}',

      // Keep some functions that are not exported by default, but
      // which appear in this scope when evaluating the above.
      'Module._emjs_make_handle = _emjs_make_handle;', 'Module._emjs_free = _emjs_free;',

      // Call dependenciesFulfilled if it won't be done automatically.
      'dependenciesFulfilled=function() { inDependenciesFulfilled(FS); };', 'if(!memoryInitializer||(!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_WORKER))dependenciesFulfilled();'].join('\r\n');
      return new FunctionPromise('Module', 'inDependenciesFulfilled', 'require', 'module', '__filename', '_dirname', funcBody);
    });
  }

  // Create a new instance of the compiled VM, bound to local state
  // and a local Module object.
  this._ready = new Promise(function (resolve, reject) {
    // Initialize the Module object.
    // We make it available on this object so that we can use
    // its methods to execute code in the VM.
    var Module = {};
    _this._module = Module;
    Module.TOTAL_MEMORY = _this.totalMemory;

    // We will set up the filesystem manually when we're ready.
    Module.noFSInit = true;
    Module.thisProgram = '/lib/pypyjs/pypyjs.js';
    Module.filePackagePrefixURL = _this.rootURL || pypyjs.rootURL;
    Module.memoryInitializerPrefixURL = _this.rootURL || pypyjs.rootURL;
    Module.locateFile = function locateFile(name) {
      return (this.rootURL || pypyjs.rootURL) + name;
    };

    // Don't start or stop the program, just set it up.
    // We'll call the API functions ourself.
    Module.noInitialRun = true;
    Module.noExitRuntime = true;

    var stdoutBuffer = [];
    // Route stdin to an overridable method on the object.
    var stdin = function stdin() {
      if (stdoutBuffer.length) {
        _this.stdout(stdoutBuffer.join(''));
        stdoutBuffer = [];
      }
      return _this.stdin();
    };

    // Route stdout to an overridable method on the object.
    // We buffer the output for efficiency.
    var stdout = function stdout(byte) {
      var char = String.fromCharCode(byte);
      stdoutBuffer.push(char);
      if (char === '\n' || stdoutBuffer.length >= 128) {
        _this.stdout(stdoutBuffer.join(''));
        stdoutBuffer = [];
      }
    };

    // Route stderr to an overridable method on the object.
    // We do not buffer stderr.
    var stderr = function stderr(byte) {
      return _this.stderr(String.fromCharCode(byte));
    };

    // This is where execution will continue after loading
    // the memory initialization data, if any.
    var initializedResolve = undefined;
    var initializedReject = undefined;
    var initializedP = new Promise(function promise(_resolve, _reject) {
      initializedResolve = _resolve;
      initializedReject = _reject;
    });

    var dependenciesFulfilled = function dependenciesFulfilled(_fs) {
      _this.FS = _fs;

      // Initialize the filesystem state.
      try {
        _this.FS.init(stdin, stdout, stderr);
        Module.FS_createPath('/', 'lib/pypyjs/lib_pypy', true, false);
        // Hackery so the same file will work with py2 and py3.
        // We only ever put our module files into lib_pypy.
        Module.FS_createPath('/', 'lib/pypyjs/lib-python/2.7', true, false);
        Module.FS_createPath('/', 'lib/pypyjs/lib-python/3', true, false);
        initializedResolve();
      } catch (err) {
        initializedReject(err);
      }
    };

    // Begin fetching the metadata for available python modules.
    // With luck these can download while we jank around compiling
    // all of that javascript.
    // XXX TODO: also load memory initializer this way.
    var moduleDataP = _this.fetch('modules/index.json');

    pypyjs._vmBuilderPromise.then(function (vmBuilder) {
      var args = [Module, dependenciesFulfilled, typeof require === 'undefined' ? undefined : require, typeof module === 'undefined' ? undefined : module, typeof __filename === 'undefined' ? undefined : __filename, typeof _dirname === 'undefined' ? undefined : _dirname];

      // This links the async-compiled module into our Module object.
      vmBuilder.apply(null, args);
      return initializedP;
    }).then(function () {
      // Continue with processing the downloaded module metadata.
      return moduleDataP.then(function (xhr) {
        // Store the module index, and load any preload modules.
        var modIndex = JSON.parse(xhr.responseText);
        _this._allModules = modIndex.modules;
        if (modIndex.preload) {
          Object.keys(modIndex.preload).forEach(function (name) {
            _this._writeModuleFile(name, modIndex.preload[name]);
          });
        }

        // It's finally safe to launch the VM.
        Module.run();
        Module._rpython_startup_code();
        var pypy_home = Module.intArrayFromString('/lib/pypyjs/pypyjs.js');
        pypy_home = Module.allocate(pypy_home, 'i8', Module.ALLOC_NORMAL);
        Module._pypy_setup_home(pypy_home, 0);
        Module._free(pypy_home);
        var initCode = '\nimport js\nimport traceback\nimport sys; sys.platform = \'js\'\n# For python3, pypy does some lazy-initialization stuff\n# with stdio streams that isn\'t triggered when you use\n# it as a library instead of an exe.  Fix it up.\ndef create_stdio(fd, mode, name, errors=None):\n  import io\n  return io.open(fd, mode, buffering=1, errors=errors, closefd=False)\nif not hasattr(sys, \'stdin\'):\n  sys.stdin = sys.__stdin__ = create_stdio(0, \'r\', \'<stdin>\')\n  sys.stdout = sys.__stdout__ = create_stdio(1, \'w\', \'<stdout>\')\n  sys.stderr = sys.__stderr = create_stdio(2, \'w\', \'<stderr>\', \'backslashreplace\')\n# Create a "__main__" module in which we\'ll execute code.\nimport types\ntop_level_scope = {\'__name__\': \'__main__\', \'__package__\': None}\nmain = types.ModuleType(\'__main__\')\nmain.__dict__.update(top_level_scope)\nsys.modules[\'__main__\'] = main\ntop_level_scope = main';

        var code = Module.intArrayFromString(initCode);
        code = Module.allocate(code, 'i8', Module.ALLOC_NORMAL);
        if (!code) {
          throw new pypyjs.Error('Failed to allocate memory');
        }

        var res = Module._pypy_execute_source(code);
        if (res < 0) {
          throw new pypyjs.Error('Failed to execute python code');
        }

        Module._free(code);
      });
    }).then(resolve, reject);
  });
}

// A simple file-fetching wrapper around XMLHttpRequest,
// that treats paths as relative to the pypyjs.js root url.
//
pypyjs.prototype.fetch = function fetch(relpath, responseType) {
  var rootURL = this.rootURL || pypyjs.rootURL;

  // For the web, use XMLHttpRequest.
  if (typeof XMLHttpRequest !== 'undefined') {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function onload() {
        if (xhr.status >= 400) {
          reject(xhr);
        } else {
          resolve(xhr);
        }
      };

      xhr.open('GET', rootURL + relpath, true);
      xhr.responseType = responseType || 'text';
      xhr.send(null);
    });
  }

  // For nodejs, use fs.readFile.
  if (typeof fs !== 'undefined' && typeof fs.readFile !== 'undefined') {
    return new Promise(function (resolve, reject) {
      fs.readFile(path.join(rootURL, relpath), function (err, data) {
        if (err) return reject(err);
        resolve({ responseText: data.toString() });
      });
    });
  }

  // For spidermonkey, use snarf (which has a binary read mode).
  if (typeof snarf !== 'undefined') {
    return new Promise(function (resolve) {
      var data = snarf(rootURL + relpath);
      resolve({ responseText: data });
    });
  }

  // For d8, use read() and readbuffer().
  if (typeof read !== 'undefined' && typeof readbuffer !== 'undefined') {
    return new Promise(function (resolve) {
      var data = read(rootURL + relpath);
      resolve({ responseText: data });
    });
  }

  return new Promise(function (resolve, reject) {
    reject('unable to fetch files');
  });
};

function _escape(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
}

// Method to execute python source directly in the VM.
//
// This is the basic way to push code into the pypyjs VM.
// Calling code should not use it directly; rather we use it
// as a primitive to build up a nicer execution API.
//
pypyjs.prototype._execute_source = function _execute_source(code) {
  var Module = this._module;
  var code_ptr = undefined;

  return new Promise(function promise(resolve, reject) {
    var _code = 'try:\n  ' + code.trim() + '\nexcept Exception:\n  typ, val, tb = sys.exc_info()\n  err_name = getattr(typ, \'__name__\', str(typ))\n  err_msg = str(val)\n  err_trace = traceback.format_exception(typ, val, tb)\n  err_trace = err_trace[:1] + err_trace[2:]\n  err_trace = \'\'.join(err_trace)\n  js.globals[\'pypyjs\']._lastErrorName = err_name\n  js.globals[\'pypyjs\']._lastErrorMessage = err_msg\n  js.globals[\'pypyjs\']._lastErrorTrace = err_trace\n';

    var code_chars = Module.intArrayFromString(_code);
    code_ptr = Module.allocate(code_chars, 'i8', Module.ALLOC_NORMAL);
    if (!code_ptr) {
      throw new pypyjs.Error('Failed to allocate memory');
    }

    var res = Module._pypy_execute_source(code_ptr);
    if (res < 0) {
      throw new pypyjs.Error('Error executing python code');
    }

    Module._free(code_ptr);

    // XXX TODO: races/re-entrancy on _lastError?
    if (pypyjs._lastErrorName) {
      var err = new pypyjs.Error(pypyjs._lastErrorName, pypyjs._lastErrorMessage, pypyjs._lastErrorTrace);
      pypyjs._lastErrorName = null;
      pypyjs._lastErrorMessage = null;
      pypyjs._lastErrorTrace = null;
      reject(err);
    }

    resolve(null);
  });
};

// Method to determine when the interpreter is ready.
//
// This method returns a promise that will resolve once the interpreter
// is ready for use.
//
pypyjs.prototype.ready = function ready() {
  return this._ready;
};

// Method to execute some python code.
//
// This passes the given python code to the VM for execution.
// It's fairly directly analogous to the 'exec" statement in python.
// It is not possible to directly access the result of the code, if any.
// Rather you should store it into a variable and then use the get() method.
//
pypyjs.prototype.exec = function exec(code, options) {
  var _this2 = this;

  return this._ready.then(function () {
    var promise = Promise.resolve();

    // Find any "import" statements in the code,
    // and ensure the modules are ready for loading.
    if (_this2.autoLoadModules) {
      promise = promise.then(function () {
        return _this2.findImportedNames(code);
      }).then(function (imports) {
        return _this2.loadModuleData.apply(_this2, imports);
      });
    }

    var _code = undefined;

    if (options && options.file) {
      try {
        _this2.Module.FS.unlink(options.file);
      } catch (e) {
        if (e.errno !== 2) {
          console.error(e);
        }
      }
      _this2.Module.FS_createDataFile(options.file, '', code, true, false, true);
      // Now we can execute the code in custom top-level scope.
      _code = 'top_level_scope[\'__file__\'] = \'' + options.file + '\'; execfile(\'' + options.file + '\', top_level_scope.__dict__)';
    } else {
      _code = 'exec(\'\'\'' + _escape(code) + '\'\'\', top_level_scope.__dict__)';
    }

    return promise.then(function () {
      return _this2._execute_source(_code);
    });
  });
};

// Method to evaluate an expression.
//
// This method evaluates an expression and returns its value (assuming the
// value can be translated into javascript).  It's fairly directly analogous
// to the "eval" function in python.
//
// For backwards-compatibility reasons, it will also evaluate statements.
// This behaviour is deprecated and will be removed in a future release.
//
pypyjs.prototype.eval = function evaluate(expr) {
  var _this3 = this;

  return this._ready.then(function () {
    // First try to execute it as an expression.
    var code = 'r = eval(\'' + _escape(expr) + '\', top_level_scope.__dict__)';
    return _this3._execute_source(code);
  }).then(function () {
    return _this3.get('r', true);
  }, function (err) {
    if (err && err.name && err.name !== 'SyntaxError') {
      throw err;
    }

    // If that failed, try again via exec().
    if (typeof console !== 'undefined') {
      console.warn('Calling pypyjs.eval() with statements is deprecated.');
      console.warn('Use eval() for expressions, exec() for statements.');
    }

    return _this3.exec(expr);
  });
};

// Method to evaluate some python code from a file..
//
// This fetches the named file and passes it to the VM for execution.
//
pypyjs.prototype.execfile = function execfile(filename) {
  var _this4 = this;

  return this.fetch(filename).then(function (xhr) {
    var code = xhr.responseText;
    return _this4.exec(code, { file: '/lib/pypyjs/lib_pypy/' + filename });
  });
};

// Method to read a python variable.
//
// This tries to convert the value in the named python variable into an
// equivalent javascript value and returns it.  It will fail if the variable
// does not exist or contains a value that cannot be converted.
//
pypyjs._resultsID = 0;
pypyjs._resultsMap = {};
pypyjs.prototype.get = function get(name, _fromGlobals) {
  var _this5 = this;

  var resid = '' + pypyjs._resultsID++;
  var reference = undefined;
  // We can read from global scope for internal use; don't do this from calling code!
  if (_fromGlobals) {
    reference = 'globals()[\'' + escape(name) + '\']';
  } else {
    reference = 'top_level_scope.' + _escape(name);
  }

  return this._ready.then(function () {
    var code = '\n  try:\n    _pypyjs_getting = ' + reference + '\n  except (KeyError, AttributeError):\n    _pypyjs_getting = js.undefined\n  js.globals[\'pypyjs\']._resultsMap[\'' + resid + '\'] = js.convert(_pypyjs_getting)\n  del _pypyjs_getting';
    return _this5._execute_source(code);
  }).then(function () {
    var res = pypyjs._resultsMap[resid];
    delete pypyjs._resultsMap[resid];
    return res;
  });
};

// Method to set a python variable to a javascript value.
//
// This generates a handle to the given object, and arranges for the named
// python variable to reference it via that handle.
//
pypyjs.prototype.set = function set(name, value) {
  var _this6 = this;

  return this._ready.then(function () {
    var Module = _this6._module;
    var handle = Module._emjs_make_handle(value);
    var _name = _escape(name);
    var code = 'top_level_scope.' + _name + ' = js.Value(' + handle + ')';
    return _this6._execute_source(code);
  });
};

// Method to run an interactive REPL.
//
// This method takes takes callback function implementing the user
// input prompt, and runs a REPL loop using it.  The prompt function
// may either return the input as a string, or a promise resolving to
// the input as a string.  If not specified, we read from stdin (which
// works fine in e.g. nodejs, but is almost certainly not what you want
// in the browser, because it's blocking).
//
pypyjs.prototype.repl = function repl(prmpt) {
  var _this7 = this;

  var _prmpt = undefined;
  if (!prmpt) {
    (function () {
      // By default we read from the provided stdin function, but unfortunately
      // it defaults to a closed file.
      var buffer = '';
      _prmpt = function (ps1) {
        var input = undefined;
        _this7.stdout(ps1);
        var char = _this7.stdin();
        while (char) {
          var idx = char.indexOf('\n');
          if (idx >= 0) {
            input = buffer + char.substr(0, idx + 1);
            buffer = char.substr(idx + 1);
            return input;
          }
          buffer += char;
          char = _this7.stdin();
        }
        input = buffer;
        buffer = '';
        return input;
      };
      // For nodejs, we can do an async prompt atop process.stdin,
      // unless we're using a custom stdin function.
      var useProcessStdin = true;
      if (typeof process === 'undefined') {
        useProcessStdin = false;
      } else if (typeof process.stdin === 'undefined') {
        useProcessStdin = false;
      } else {
        if (_this7.stdin !== devNull.stdin) {
          if (_this7.stdin !== pypyjs._defaultStdin) {
            useProcessStdin = false;
          } else if (pypyjs.stdin !== devNull.stdin) {
            useProcessStdin = false;
          }
        }
      }
      if (useProcessStdin) {
        _prmpt = function (ps1) {
          return new Promise(function (resolve) {
            _this7.stdout(ps1);
            var slurp = function slurp() {
              process.stdin.once('readable', function () {
                var chunk = process.stdin.read();
                if (chunk === null) {
                  slurp();
                } else {
                  chunk = chunk.toString();
                  var idx = chunk.indexOf('\n');
                  if (idx < 0) {
                    buffer += chunk;
                    slurp();
                  } else {
                    resolve(buffer + chunk.substr(0, idx + 1));
                    buffer = chunk.substr(idx + 1);
                  }
                }
              });
            };

            slurp();
          });
        };
      }
    })();
  }

  // Set up an InteractiveConsole instance,
  // then loop forever via recursive promises.
  return this._ready.then(function () {
    return _this7.loadModuleData('code');
  }).then(function () {
    return _this7._execute_source('import code');
  }).then(function () {
    return _this7._execute_source('c = code.InteractiveConsole(top_level_scope.__dict__)');
  }).then(function () {
    return _this7._repl_loop(_prmpt, '>>> ');
  });
};

pypyjs.prototype._repl_loop = function _repl_loop(prmpt, ps1) {
  var _this8 = this;

  // Prompt for input, which may happen via async promise.
  return Promise.resolve().then(function () {
    return prmpt.call(_this8, ps1);
  }).then(function (input) {
    // Push it into the InteractiveConsole, a line at a time.
    var p = Promise.resolve();
    input.split('\n').forEach(function (line) {
      // Find any "import" statements in the code,
      // and ensure the modules are ready for loading.
      if (_this8.autoLoadModules) {
        p = p.then(function () {
          return _this8.findImportedNames(line);
        }).then(function (imports) {
          return _this8.loadModuleData.apply(_this8, imports);
        });
      }

      var code = 'r = c.push(\'' + _escape(line) + '\')';
      p = p.then(function () {
        return _this8._execute_source(code);
      });
    });
    return p;
  }).then(function () {
    return _this8.get('r', true);
  }).then(function (r) {
    // If r == 1, we're in a multi-line definition.
    // Adjust the prompt accordingly.
    if (r) {
      return _this8._repl_loop(prmpt, '... ');
    }
    return _this8._repl_loop(prmpt, '>>> ');
  });
};

// Method to look for "import" statements in a code string.
// Returns a promise that will resolve to a list of imported module names.
//
// XXX TODO: this is far from complete and should not be done with a regex.
// Perhaps we can call into python's "ast" module for this parsing?
//
var importStatementRE = /(from\s+([a-zA-Z0-9_\.]+)\s+)?import\s+\(?\s*([a-zA-Z0-9_\.\*]+(\s+as\s+[a-zA-Z0-9_]+)?[ \t]*,?[ \t]*)+[ \t]*\)?/g;
pypyjs.prototype.findImportedNames = function findImportedNames(code) {
  var imports = [];
  var match = undefined;
  importStatementRE.lastIndex = 0;

  var pushImport = function pushImport(relmod) {
    return function (submod) {
      return imports.push(relmod + submod.split(/\s*as\s*/)[0]);
    };
  };

  while ((match = importStatementRE.exec(code)) !== null) {
    var relmod = match[2];
    if (relmod) {
      relmod = relmod + '.';
    } else {
      relmod = '';
    }

    var submods = match[0].split('import')[1];
    while (submods && /[\s(]/.test(submods.charAt(0))) {
      submods = submods.substr(1);
    }

    while (submods && /[\s)]/.test(submods.charAt(submods.length - 1))) {
      submods = submods.substr(0, submods.length - 1);
    }

    submods = submods.split(/\s*,\s*/);
    submods.forEach(pushImport(relmod));
  }
  return Promise.resolve(imports);
};

// Method to load the contents of a python module, along with
// any dependencies.  This populates the relevant paths within
// the VMs simulated filesystem so that is can find and import
// the specified module.
//
pypyjs.prototype.loadModuleData = function loadModuleData() /* names */{
  var _this9 = this;

  // Each argument is a name that we want to import.
  // We must find the longest prefix that is an available module
  // and load it along with all its dependencies.
  var modules = Array.prototype.slice.call(arguments);
  return this._ready.then(function () {
    var toLoad = {};
    NEXTNAME: for (var i = 0; i < modules.length; i++) {
      var _name2 = modules[i];

      // Find the nearest containing module for the given name.
      // Note that it may not match a module at all, in which case we ignore it.
      while (true) {
        if (_this9._allModules[_name2]) {
          break;
        }

        _name2 = _name2.substr(0, _name2.lastIndexOf('.'));
        if (!_name2) continue NEXTNAME;
      }

      _this9._findModuleDeps(_name2, toLoad);
    }

    return Promise.all(Object.keys(toLoad).map(function (name) {
      return _this9._loadModuleData(name);
    }));
  });
};

pypyjs.prototype._findModuleDeps = function _findModuleDeps(name, seen) {
  var _seen = seen ? seen : {};
  var deps = [];

  // If we don't know about this module, ignore it.
  if (!this._allModules[name]) {
    return _seen;
  }

  // Depend on any explicitly-named imports.
  var imports = this._allModules[name].imports;
  if (imports) {
    for (var i = 0; i < imports.length; i++) {
      deps.push(imports[i]);
    }
  }

  // Depend on the __init__.py for packages.
  if (this._allModules[name].dir) {
    deps.push(name + '.__init__');
  }

  // Include the parent package, if any.
  var idx = name.lastIndexOf('.');
  if (idx !== -1) {
    deps.push(name.substr(0, idx));
  }

  // Recurse for any previously-unseen dependencies.
  _seen[name] = true;
  for (var i = 0; i < deps.length; i++) {
    if (!_seen[deps[i]]) {
      this._findModuleDeps(deps[i], _seen);
    }
  }

  return _seen;
};

pypyjs.prototype._loadModuleData = function _loadModuleData(name) {
  var _this10 = this;

  // If we've already loaded this module, we're done.
  if (this._loadedModules[name]) {
    return Promise.resolve();
  }

  // If we're already in the process of loading it, use the existing promise.
  if (this._pendingModules[name]) {
    return this._pendingModules[name];
  }

  // If it's a package directory, there's not actually anything to do.
  if (this._allModules[name].dir) {
    return Promise.resolve();
  }

  // We need to fetch the module file and write it out.
  var modfile = this._allModules[name].file;
  var promise = this.fetch('modules/' + modfile).then(function (xhr) {
    var contents = xhr.responseText;
    _this10._writeModuleFile(name, contents);
    delete _this10._pendingModules[name];
  });
  this._pendingModules[name] = promise;
  return promise;
};

pypyjs.prototype._writeModuleFile = function _writeModuleFile(name, data) {
  var Module = this._module;
  var file = this._allModules[name].file;

  // Create the containing directory first.
  var dir = file.split('/').slice(0, -1).join('/');
  try {
    Module.FS_createPath('/lib/pypyjs/lib_pypy', dir, true, false);
  } catch (err) {
    console.error(err);
  }

  // Now we can safely create the file.
  // To ensure proper utf8 encoding we need to write it as bytes.
  // XXX TODO: find a way to avoid this overhead.
  var fullpath = '/lib/pypyjs/lib_pypy/' + file;
  var len = Module.lengthBytesUTF8(data);
  var arr = new Uint8Array(len);
  Module.stringToUTF8Array(data, arr, 0, len + 1);
  try {
    this.FS.unlink(fullpath);
  } catch (err) {
    if (err.errno !== 2) {
      console.error(err);
    }
  }
  Module.FS_createDataFile(fullpath, '', arr, true, false, true);
  this._loadedModules[name] = true;
};

// An error class for reporting python exceptions back to calling code.
// XXX TODO: this could be a lot more user-friendly than a opaque error...

pypyjs.Error = function pypyjsError(name, message, trace) {
  var message_ = message;
  var name_ = name;
  if (name_ && typeof message_ === 'undefined') {
    message_ = name_;
    name_ = '';
  }

  this.name = name_ || 'pypyjs.Error';
  this.message = message_ || 'pypyjs Unknown Error';
  this.trace = trace || '';
};

pypyjs.Error.prototype = new Error();
pypyjs.Error.prototype.constructor = pypyjs.Error;

// XXX TODO: expose the filesystem for manipulation by calling code.

// Add convenience methods directly on the 'pypyjs' function, that
// will invoke corresponding methods on a default VM instance.
// This makes it look like 'pypyjs' is a singleton VM instance.

pypyjs.stdin = stdio.stdin;
pypyjs.stdout = stdio.stdout;
pypyjs.stderr = stdio.stderr;

pypyjs._defaultVM = null;
pypyjs._defaultStdin = function defaultStdin() {
  return pypyjs.stdin.apply(pypyjs, arguments);
};
pypyjs._defaultStdout = function defaultStdout() {
  return pypyjs.stdout.apply(pypyjs, arguments);
};
pypyjs._defaultStderr = function defaultStderr() {
  return pypyjs.stderr.apply(pypyjs, arguments);
};

var PUBLIC_NAMES = ['ready', 'exec', 'eval', 'execfile', 'get', 'set', 'repl', 'loadModuleData'];

PUBLIC_NAMES.forEach(function (name) {
  pypyjs[name] = function () {
    if (!pypyjs._defaultVM) {
      pypyjs._defaultVM = new pypyjs({
        stdin: pypyjs._defaultStdin,
        stdout: pypyjs._defaultStdout,
        stderr: pypyjs._defaultStderr
      });
    }
    return pypyjs._defaultVM[name].apply(pypyjs._defaultVM, arguments);
  };
});

// For nodejs, run a repl when invoked directly from the command-line.
if (typeof require !== 'undefined' && typeof module !== 'undefined') {
  if (require.main === module) {
    pypyjs.repl()['catch'](function (err) {
      console.log(err);
    });
  }
}

if (typeof globalScope.pypyjs === 'undefined') {
  globalScope.pypyjs = pypyjs;
}

if (typeof module !== 'undefined') {
  if (typeof module.exports !== 'undefined') {
    module.exports = pypyjs;
  }
}
return pypyjs;
}(typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this));
//# sourceMappingURL=pypyjs.js.map
