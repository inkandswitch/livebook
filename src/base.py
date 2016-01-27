import js
import copy
import inspect
import matplotlib.pyplot as pt

LOCALS = {}


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
        "type": type_name(df),
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
    print "CHECKPOINT %s" % cell
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
    local.pop("__return__",None)
    local.pop("__random__",None)
    types = dict([[k, {"name": k, "reflection": livebook_inspect(local[k])}] for k in local.keys()])
    print types
    js.globals['LOCALS'][cell] = js.convert(types)
    LOCALS[cell] = dict([[k, copy.deepcopy(local[k])] for k in local.keys()])

