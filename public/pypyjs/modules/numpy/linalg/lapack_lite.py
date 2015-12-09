# A CFFI version of numpy/linalg/lapack_module.c
from ._lapack_lite import ffi, lib
import numpy as np
# dtype has not been imported yet
from numpy.core.multiarray import dtype

# XXX: This should be set during install, but on PyPy, the value is (probably!)
# always the same.
macros = {'pfx':'', 'sfx': '_'}

class Dummy(object):
    pass
nt = Dummy()
nt.int32 = dtype('int32')
nt.int8 = dtype('int8')
nt.float32 = dtype('float32')
nt.float64 = dtype('float64')
nt.complex64 = dtype('complex64')
nt.complex128 = dtype('complex128')

__version__ = '0.1.4'

'''
Since numpy expects to be able to call these functions with python objects,
create a mapping mechanism:
  ndarray -> equivalent pointer to its data based on dtype
  numpy scalar -> equivalent pointer based on ffi.cast
  ffi.CData -> ready to be called
  arbitrary cpython type -> use ffi.new to create a pointer to a type
                            determined from the function signature
'''

toCtypeP = {nt.int32: 'int*', nt.float32: 'float*', nt.float64: 'double*',
           nt.complex64: 'f2c_complex*', nt.complex128: 'f2c_doublecomplex*',
           nt.int8: 'char *'}
toCtypeA = {nt.int32: 'int[1]', nt.float32: 'float[1]', nt.float64: 'double[1]',
           nt.complex64: 'f2c_complex[1]', nt.complex128: 'f2c_doublecomplex[1]'}

def toCptr(src):
    if src is None:
        return ffi.cast('void*', 0)
    pData = src.__array_interface__['data'][0]
    return ffi.cast(toCtypeP[src.dtype], pData)

def convert_arg(inarg, ffitype):
    '''
    try to convert the inarg to an appropriate c pointer
    '''
    if isinstance(inarg, np.ndarray):
        return toCptr(inarg)
    elif type(inarg) in toCtypeA:
        return ffi.cast(toCtypeA[inarg], inarg)
    elif isinstance(inarg, ffi.CData):
        return inarg
    # Hope for the best...
    ctyp_p = ffi.getctype(ffitype)
    ctyp = ctyp_p[:-2]
    return ffi.new( ctyp + '[1]', [inarg])

def call_func(name):
    c_name = macros['pfx'] + name + macros['sfx']
    def call_with_convert(*args):
        func = getattr(lib, c_name)
        fargs = ffi.typeof(func).args
        converted_args = [convert_arg(a,b) for a,b in zip(args, fargs)]
        res = func(*converted_args)
        retval = {'info':converted_args[-1][0]}
        # numpy expects a dictionary
        if 'gelsd' in c_name:
            # special case, the rank argument is returned as well
            retval['rank'] = converted_args[9][0]
        return retval
    return call_with_convert

def not_implemented(*args):
    raise NotImplementedError('function not found, does lapack_lite object exist?')

for name in ['dgelsd', 'dgeqrf', 'dorgqr', 'zgelsd', 'zgeqrf', 'zungqr',
             'xerbla']:
    globals()[name] = call_func(name)
