SHIFT_DIVIDEBYZERO = 0
SHIFT_OVERFLOW = 3
SHIFT_UNDERFLOW = 6
SHIFT_INVALID = 9

ERR_IGNORE = 0
ERR_WARN = 1
ERR_RAISE = 2
ERR_CALL = 3
ERR_PRINT = 4
ERR_LOG = 5

ERR_DEFAULT = 521

FPE_DIVIDEBYZERO = 1
FPE_OVERFLOW = 2
FPE_UNDERFLOW = 4
FPE_INVALID = 8

UFUNC_BUFSIZE_DEFAULT = 8192

PZERO = float('0.0')
NZERO = float('-0.0')
PINF = float('inf')
NINF = float('-inf')
NAN = float('nan')
euler_gamma = 0.577215664901532860606512090082402431 # from npy_math.h
from math import e, pi

def geterrobj():
    return [UFUNC_BUFSIZE_DEFAULT, ERR_DEFAULT, None]

def seterrobj(val):
    pass

from _numpypy.umath import *

def NotImplementedFunc(func):
    def tmp(*args, **kwargs):
        raise NotImplementedError("%s not implemented yet" % func)
    return tmp

for name in '''
hypot remainder frompyfunc ldexp nextafter _arg mod _add_newdoc_ufunc
'''.split():
    if name not in globals():
        globals()[name] = NotImplementedFunc(name)
