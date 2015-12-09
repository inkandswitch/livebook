import numpy as np
from ._fft_cffi import ffi, lib

def cffti(n):
    '''
    void cffti(int n, Treal wsave[])
    '''
    wsave = np.empty(4*n+15, 'double') # don't even ask me why 4 and why 15. Just took them from C-ext wrapper "as is".
    wsave_ptr = wsave.__array_interface__['data'][0]
    lib.npy_cffti(n, ffi.cast('double*', wsave_ptr))
    return wsave

def rffti(n):
    '''
    void rffti(int n, Treal wsave[])
    '''
    wsave = np.empty(2*n+15, 'double')
    wsave_ptr = wsave.__array_interface__['data'][0]
    lib.npy_rffti(n, ffi.cast('double*', wsave_ptr))
    return wsave


def cfftf(a, wsave):
    '''
    void cfftf(int n, Troeal c[], Treal wsave[]);
    '''
    data = a.astype('complex128').copy()
    npts = a.shape[-1]
    if wsave.shape[0] != npts * 4 + 15:
        raise ValueError("invalid work array for fft size")
    nrepeats = data.size / npts
    n = ffi.cast('int', npts)
    wsave_ptr = wsave.__array_interface__['data'][0]
    dptr = data.__array_interface__['data'][0]
    for i in range(nrepeats):
        #print 'npts,i,a.shape',npts,i,a.shape,a.dtype
        data_cdata = ffi.cast('double*', dptr)
        lib.npy_cfftf(n, data_cdata, ffi.cast('double*', wsave_ptr))
        dptr += npts *2 * ffi.sizeof('double')
    return data

def cfftb(a, wsave):
    '''
    void cfftb(int n, Troeal c[], Treal wsave[]);
    '''
    data = a.astype('complex128').copy()
    npts = a.shape[-1]
    if wsave.dtype != 'double':
        raise ValueError("invalid work array for fft size")
    if wsave.size != npts * 4 + 15:
        raise ValueError("invalid work array for fft size")
    nrepeats = data.size / npts
    n = ffi.cast('int', npts)
    wsave_ptr = wsave.__array_interface__['data'][0]
    dptr = data.__array_interface__['data'][0]
    for i in range(nrepeats):
        #print 'npts,i,a.shape',npts,i,a.shape,a.dtype
        data_cdata = ffi.cast('double*', dptr)
        lib.npy_cfftb(n, data_cdata, ffi.cast('double*', wsave_ptr))
        dptr += npts * 2 * ffi.sizeof('double')
    return data

def rfftf(a, wsave):
    if a.flags.c_contiguous:
        data = a.astype('float64')
    else:
        data = a.copy().astype('float64')
    npts = data.shape[-1]
    ret_shape = list(data.shape)
    ret_shape[-1] = npts / 2 + 1
    ret = np.zeros(ret_shape, 'complex128')
    ret_d = ret.view('float64')
    rstep = ret.shape[-1] * 2
    if wsave.dtype != 'float64':
        raise ValueError('wsave must be "float64" dtype')
    if wsave.size != npts * 2 + 15:
        raise ValueError("invalid work array for fft size")
    nrepeats = data.size / npts
    n = ffi.cast('int', npts)
    wsave_ptr = ffi.cast('double *', wsave.__array_interface__['data'][0])
    rptr = ret.__array_interface__['data'][0]
    double_t = ffi.sizeof('double')
    for i in range(nrepeats):
        start = i * rstep
        dstart = i * npts
        ret_d.flat[start + 1: start + 1 + npts] = data.flat[dstart:dstart + npts]
        lib.npy_rfftf(n, ffi.cast('double *', rptr + double_t), wsave_ptr)
        ret_d.flat[start] = ret_d.flat[start + 1]
        ret_d.flat[start + 1] = 0.0
        rptr += rstep * double_t
    return ret

def rfftb(a, wsave):
    if a.flags.c_contiguous:
        data = a.astype('complex128')
    else:
        data = a.copy().astype('complex128')
    npts = data.shape[-1]
    ret = np.zeros(data.shape, 'float64')
    if wsave.dtype != 'float64':
        raise ValueError('wsave must be "float64" dtype')
    if wsave.size != npts * 2 + 15:
        raise ValueError("invalid work array for fft size")
    nrepeats = data.size / npts
    n = ffi.cast('int', npts)
    wsave_ptr = ffi.cast('double *', wsave.__array_interface__['data'][0])
    rptr = ret.__array_interface__['data'][0]
    data_double = data.view('double')
    for i in range(nrepeats):
        start = i * npts
        dstart = i * npts * 2
        ret.flat[start + 1: start + npts] = data_double.flat[dstart + 2:dstart + npts + 1]
        ret.flat[start] = data_double.flat[dstart]
        lib.npy_rfftb(n, ffi.cast('double *', rptr), wsave_ptr)
        rptr += npts * ffi.sizeof('double')
    return ret


