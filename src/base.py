import js

def mark(n):
    print "mark %s" % n

def render(cell,n):
    js.globals['RESULTS'][cell] = js.convert(n)
    print "render %s" % n
