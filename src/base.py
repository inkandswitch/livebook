import js

import matplotlib.pyplot as pt

def mark(n):
    print "CELL %s" % n


def render(cell,val):
    if hasattr(val, 'to_js'):
        val2 = ["html", val.to_js()]
    elif type(val) == list:
        val2 = ["list", val]
    else:
        val2 = ["text", str(val)]
    plots = pt.get_plots()
    if (len(plots) > 0):
        js.globals['PLOTS'][cell] = js.convert(plots)
    js.globals['RESULTS'][cell] = js.convert(val2)
