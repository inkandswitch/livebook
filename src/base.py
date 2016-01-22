import js
import copy
import matplotlib.pyplot as pt

LOCALS = {}

def checkpoint(cell,val,local):
    print "CHECKPOINT %s"%cell
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
    types = dict([[k,{ "name": k, "type": str(type(local[k])), "desc": "a wild variable"}] for k in local.keys()])
    print types
    js.globals['LOCALS'][cell] = js.convert(types)
    LOCALS[cell] = dict([[k,copy.deepcopy(local[k])] for k in local.keys()])
