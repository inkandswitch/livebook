import js

def mark(n):
    print "mark %s" % n

def render(cell,val):
    print "about to convert 2 %s" % val
    if hasattr(val, 'to_js'):
        val2 = ["html", val.to_js()]
    elif type(val) == list:
        val2 = ["list", val]
    else:
        val2 = ["text", str(val)]
    print "val2 = %s" % val2
    js.globals['RESULTS'][cell] = js.convert(val2)
