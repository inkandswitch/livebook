import js
import copy
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


def inspect_int(x):
    return {
        "type": type_name(x),
        "value": x,
        "docs": "http://readthedocs.com"
    }


def inspect_pandas_DataFrame(df):
    records = "%d Records" % len(df)
    columns = "%d Columns" % len(df.columns())
    return {
        "type": type_name(df),
        "value": [records, columns],
        "docs": "http://pandas.pydata.org/pandas-docs/stable/generated/pandas.DataFrame.html"
    }


TYPES_TO_INSPECT = {
    "int": inspect_int,
    "pandas.DataFrame": inspect_pandas_DataFrame
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
    types = dict([[k, {"name": k, "reflection": livebook_inspect(local[k])}] for k in local.keys()])
    print types
    js.globals['LOCALS'][cell] = js.convert(types)
    LOCALS[cell] = dict([[k, copy.deepcopy(local[k])] for k in local.keys()])

