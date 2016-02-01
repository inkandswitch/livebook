
BASE_LOCALS  = {'__name__': 'livebook', '__doc__': None, '__builtins__': __builtins__ }
BASE_GLOBALS = {'__name__': 'livebook', '__doc__': None, '__builtins__': __builtins__ }

import sys
import string
import ast
import copy
import inspect
import traceback
import keyword
import random
import re

LOCALS = {}
SEEDS = {}
ERROR = None


def type_name(n):
    # uh fix this plz
    # to clarify: reason i didn't use __name__ was bc i wanted to preserve module namespacing on type name
    # e.g., if x is a pandas.DataFrame
    #    type(x).__name__ simply returned "DataFrame"
    return str(type(n)).split("'")[1]


def inspect_default():
    return None


def inspect_int_float(x):
    return {
        "type": type_name(x),
        "value": x,
        "docs": "https://docs.python.org/3/library/stdtypes.html#numeric-types-int-float-complex"
    }


def inspect_bool(x):
    return {
        "type": type_name(x),
        "value": "True" if x else "False",
        "docs": "https://docs.python.org/3/library/stdtypes.html#truth-value-testing"
    }


def inspect_str(x):
    chars = '({} chars)'.format(len(x))
    name = '"{}"'.format(x)
    return {
        "type": type_name(x),
        "value": ' '.join([name, chars]),
        "docs": "https://docs.python.org/3.1/library/stdtypes.html#string-methods"
    }


def inspect_list(x):
    items = "{} items".format(len(x))
    return {
        "type": type_name(x),
        "value": [items],
        "docs": "https://docs.python.org/3.1/tutorial/datastructures.html#more-on-lists"
    }


def inspect_dict(x):
    items = "{} items".format(len(x))
    return {
        "type": type_name(x),
        "value": [items],
        "docs": "https://docs.python.org/3.1/tutorial/datastructures.html#dictionaries"
    }


def inspect_function(x):
    nr_args = "{} arguments".format(len(inspect.getargspec(x)[0]))
    return {
        "type": type_name(x),
        "value": [nr_args],
        "docs": "https://docs.python.org/3/reference/compound_stmts.html#function"
    }


def inspect_module(x):
    default_doc = "https://docs.python.org/3/library/stdtypes.html#modules"
    dict_doc = {
        "pandas": "http://pandas.pydata.org/pandas-docs/version/0.17.1/",
        "matplotlib.pyplot": "http://matplotlib.org/api/pyplot_api.html"
    }
    return {
        "type": type_name(x),
        "value": x.__name__,
        "docs": dict_doc.get(x.__name__, default_doc)
    }


def inspect_pandas_DataFrame(df):
    records = "%d Records" % len(df)
    columns = "%d Columns" % len(df.columns())
    return {
        "type": type_name(df),
        "value": [records, columns],
        "docs": "http://pandas.pydata.org/pandas-docs/stable/generated/pandas.DataFrame.html"
    }

def inspect_pandas_Series(s):
    records = "%d Records" % len(s)
    return {
        "type": type_name(s),
        "value": [records],
        "docs": "http://pandas.pydata.org/pandas-docs/version/0.17.1/generated/pandas.Series.html"
    }

TYPES_TO_INSPECT = {
    "int": inspect_int_float,
    "float": inspect_int_float,
    "str": inspect_str,
    "bool": inspect_bool,
    "list": inspect_list,
    "tuple": inspect_list,
    "dict": inspect_dict,
    "function": inspect_function,
    "module": inspect_module,
    "pandas.DataFrame": inspect_pandas_DataFrame,
    "pandas.Series": inspect_pandas_Series
}


def livebook_inspect(local_var):
    local_var_type = type_name(local_var)
    if local_var_type in TYPES_TO_INSPECT:
        inspector = TYPES_TO_INSPECT[local_var_type]
        if callable(inspector):
            return inspector(local_var)
    return inspect_default()


def checkpoint(cell, val, local):
    import js
    import matplotlib.pyplot as pt
    if hasattr(val, 'to_js') and type(val) != type:
        val2 = ["html", val.to_js()]
    elif type(val) == list:
        val2 = ["list", val]
    else:
        val2 = ["text", str(val)]
    plots = pt.get_plots()
    if (len(plots) > 0):
        js.globals['PLOTS'] = js.convert(plots)
    js.globals['RESULTS'] = js.convert(val2)
    types = dict([[k, {"name": k, "reflection": livebook_inspect(local[k])}] for k in local.keys()])
    js.globals['LOCALS'][cell] = js.convert(types)
#    LOCALS[cell] = dict([[k, copy.deepcopy(local[k])] for k in local.keys()])

def capture_error(tb, name, message):
    if tb == None: return (None,None)
    if tb.tb_frame.f_code.co_filename == name:
        return (int(tb.tb_frame.f_lineno),tb)
    else:
        return capture_error(tb.tb_next, name, message)


#def tb_line(tr):
#    if tr == None: return
#    if (tr.tb_frame.f_code.co_filename == "livebook.py"):
#        print "%s %d" % (tr.tb_frame.f_code.co_filename, tr.tb_frame.f_lineno)
#    tb_line(tr.tb_next)


def prep_code(code):
    keyword = '^(assert|pass|del|print|return|yield|raise|break|continue|import|global|exec|class|from)'
    assignment1 = '^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))='
    assignment2 = '^[.a-zA-Z0-9_"\[\]]*\s*=\s*'
    chunks = code.strip().split("\n")
    if (chunks[-1][0] == " " or re.search(keyword,chunks[-1]) or re.search(assignment1,chunks[-1]) or re.search(assignment2,chunks[-1])):
        return code
    else:
        chunks[-1] = "__return__ = " + chunks[-1]
        return string.join(chunks,"\n")

def execute():
    import js
    cell = int(js.globals['CELL'])
    code = str(js.globals['CODE'])
    (val,err,local) = do(code,cell)
    if err == None:
        checkpoint(cell,val,local)
    else:
        js.globals['ERROR'] = js.convert(err)
    
def partial_keyword(word):
    return any([ word == k[0:len(word)] for k in keyword.kwlist ])

def under_construction(t,e,tb,line):
    if t == NameError:
        search = re.search('global name .(.*). is not defined',e.message)
        if search and partial_keyword(search.group(1)):
            return line
    return None

def do(code, cell):
    data_to_copy = LOCALS[cell - 1] if (cell - 1) in LOCALS else BASE_LOCALS
    local = copy.deepcopy(data_to_copy)
    name = "<cell %d>" %cell
    try:
        if (cell-1) in SEEDS:
            random.setstate(SEEDS[cell-1])
        else:
            random.seed('NOT_SO_RANDOM_AFTER_ALL')
        preped = prep_code(code)
        parsed = ast.parse(preped)
        compiled = compile(parsed,name,"exec")
        eval(compiled,BASE_GLOBALS,local)
        result = local.pop("__return__",None)
        LOCALS[cell] = local
        SEEDS[cell] = random.getstate()
        return (result, None, local)
    except:
        (t,e,tb) = sys.exc_info()
        match = re.search('invalid syntax .<unknown>, line (\d*)',str(e))
        if match:
            (line,mtb) = (int(match.group(1)),tb)
        else:
            (line,mtb) = capture_error(tb,name,"ERROR")
        error  = { "name": type_name(e), "message": e.message, "cell": cell, "line": line, "under_construction": under_construction(t,e,mtb,line) }
        return (None, error, local)

