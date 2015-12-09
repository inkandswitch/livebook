# calls the functions from linalg/umath_linalg.c.src via cffi rather than cpyext
# As opposed to the numpy version, this version leaves broadcasting to the responsibility
# of the pypy extended frompyfunc, so the _umath_linag_capi functions are always called
# with the final arguments, no broadcasting needed.
import os, sys

from ._umath_linalg_build import all_four, three
from ._umath_linalg_cffi import ffi, lib

lib.init_constants()

import numpy as np

# dtype has not been imported yet. Fake it.
from numpy.core.multiarray import dtype
class Dummy(object):
    pass
nt = Dummy()
nt.int32 = dtype('int32')
nt.int8 = dtype('int8')
nt.float32 = dtype('float32')
nt.float64 = dtype('float64')
nt.complex64 = dtype('complex64')
nt.complex128 = dtype('complex128')

from numpy.core.umath import frompyfunc
__version__ = '0.1.4'

def toCharP(src):
    if src is None:
        return ffi.cast('void*', 0)
    pData = src.__array_interface__['data'][0]
    return ffi.cast('char *', pData)

VOIDP = ffi.cast('void *', 0)

npy_clear_floatstatus = lib._npy_clear_floatstatus
npy_set_floatstatus_invalid = lib._npy_set_floatstatus_invalid

def get_fp_invalid_and_clear():
    return bool(npy_clear_floatstatus() & np.FPE_INVALID)

def set_fp_invalid_or_clear(error_occurred):
    if error_occurred:
        npy_set_floatstatus_invalid()
    else:
        npy_clear_floatstatus()

# --------------------------------------------------------------------------
# Determinants

def wrap_slogdet(typ0, typ1, func):
    def slogdet(in0):
        ''' notes:
            *   in must have shape [m, m], out[0] and out[1] scalar
        '''
        n = in0.shape[0]
        sign = np.empty(1, typ0)
        logdet = np.empty(1, typ1)
        f_args = [toCharP(in0), toCharP(sign), toCharP(logdet)]
        dims = ffi.new('intptr_t[2]', [1, n])
        steps = ffi.new('intptr_t[5]', [1, 1, 1, in0.strides[0], in0.strides[1]])
        func(f_args, dims, steps, VOIDP)
        return sign[0], logdet[0]
    return slogdet

FLOAT_slogdet  =   wrap_slogdet(nt.float32,   nt.float32,
                                lib.FLOAT_slogdet)
DOUBLE_slogdet  =  wrap_slogdet(nt.float64,   nt.float64,
                                lib.DOUBLE_slogdet)
CFLOAT_slogdet  =  wrap_slogdet(nt.complex64, nt.float32,
                                lib.CFLOAT_slogdet)
CDOUBLE_slogdet  = wrap_slogdet(nt.complex128, nt.float64,
                                lib.CDOUBLE_slogdet)

def wrap_det(typ, func):
    def det(in0):
        ''' notes:
            *   in must have shape [m, m], out is scalar
        '''
        n = in0.shape[0]
        retval = np.empty([1],typ)
        f_args = [toCharP(in0), toCharP(retval)]
        dims = ffi.new('intptr_t[2]', [1, n])
        steps = ffi.new('intptr_t[4]', [1, 1, in0.strides[0], in0.strides[1]])
        func(f_args, dims, steps, VOIDP)
        return retval
    return det

FLOAT_det  =   wrap_det(nt.float32,    lib.FLOAT_det)
DOUBLE_det  =  wrap_det(nt.float64,    lib.DOUBLE_det)
CFLOAT_det  =  wrap_det(nt.complex64,  lib.CFLOAT_det)
CDOUBLE_det  = wrap_det(nt.complex128, lib.CDOUBLE_det)

slogdet = frompyfunc([FLOAT_slogdet, DOUBLE_slogdet, CFLOAT_slogdet, CDOUBLE_slogdet],
                        1, 2, dtypes=[nt.float32, nt.float32, nt.float32,
                                    nt.float64, nt.float64, nt.float64,
                                    nt.complex64, nt.complex64, nt.float32,
                                    nt.complex128, nt.complex128, nt.float64],
                        signature='(m,m)->(),()', name='slogdet', stack_inputs=False,
                doc="slogdet on the last two dimensions and broadcast on the rest. \n"\
                    "Results in two arrays, one with sign and the other with log of the"\
                    " determinants. \n"\
                    "    \"(m,m)->(),()\" \n",
            )

det = frompyfunc([FLOAT_det, DOUBLE_det, CFLOAT_det, CDOUBLE_det],
                        1, 1, dtypes=[nt.float32, nt.float32,
                                    nt.float64, nt.float64,
                                    nt.complex64, nt.float32,
                                    nt.complex128, nt.float64],
                        doc="det on the last two dimensions and broadcast"\
                            " on the rest. \n    \"(m,m)->()\" \n",
                        signature='(m,m)->()', name='det', stack_inputs=False,
                    )

# --------------------------------------------------------------------------
# Eigh family

def wrap_1inVoutMout(func):
    # in0 - 2d, out0 - 1d, out1 - 2d
    def MinVoutMout(in0, *out):
        n = in0.shape[0]
        f_args = [toCharP(in0)] + [toCharP(o) for o in out]
        dims = ffi.new('intptr_t[2]', [1, n])
        steps = ffi.new('intptr_t[8]')
        steps[0:3] = [1] * 3
        steps[3] = in0.strides[0]
        steps[4] = in0.strides[1]
        steps[5] = out[0].strides[0]
        steps[6] = out[1].strides[0]
        steps[7] = out[1].strides[1]
        func(f_args, dims, steps, VOIDP)
    return MinVoutMout

def wrap_1inVout(func):
    def MinVout(in0, out):
        n = in0.shape[0]
        m = in0.shape[1]
        f_args = [toCharP(in0), toCharP(out)]
        dims = ffi.new('intptr_t[3]', [1, n, m])
        steps = ffi.new('intptr_t[8]')
        steps[0:2] = [1, 1]
        steps[2] = in0.strides[0]
        steps[3] = in0.strides[1]
        steps[4] = out.strides[0]
        func(f_args, dims, steps, VOIDP)
    return MinVout

eigh_lo_funcs = \
        [wrap_1inVoutMout(getattr(lib, f + 'eighlo')) for f in all_four]
eigh_up_funcs = \
        [wrap_1inVoutMout(getattr(lib, f + 'eighup')) for f in all_four]
eig_shlo_funcs = \
        [wrap_1inVout(getattr(lib, f + 'eigvalshlo')) for f in all_four]
eig_shup_funcs = \
        [wrap_1inVout(getattr(lib, f + 'eigvalshup')) for f in all_four]

eigh_lo = frompyfunc(eigh_lo_funcs, 1, 2, dtypes=[ \
                                    nt.float32, nt.float32, nt.float32,
                                    nt.float64, nt.float64, nt.float64,
                                    nt.complex64, nt.float32, nt.complex64,
                                    nt.complex128, nt.float64, nt.complex128],
                    signature='(m,m)->(m),(m,m)', name='eigh_lo', stack_inputs=True,
                    doc = "eigh on the last two dimension and broadcast to the rest, using"\
                    " lower triangle \n"\
                    "Results in a vector of eigenvalues and a matrix with the"\
                    "eigenvectors. \n"\
                    "    \"(m,m)->(m),(m,m)\" \n",
                    )

eigh_up = frompyfunc(eigh_up_funcs, 1, 2, dtypes=[ \
                                    nt.float32, nt.float32, nt.float32,
                                    nt.float64, nt.float64, nt.float64,
                                    nt.complex64, nt.float32, nt.complex64,
                                    nt.complex128, nt.float64, nt.complex128],
                    signature='(m,m)->(m),(m,m)', name='eigh_up', stack_inputs=True,
                    doc = "eigh on the last two dimension and broadcast to the rest, using"\
                    " upper triangle \n"\
                    "Results in a vector of eigenvalues and a matrix with the"\
                    "eigenvectors. \n"\
                    "    \"(m,m)->(m),(m,m)\" \n",
                    )

eigvalsh_lo = frompyfunc(eig_shlo_funcs, 1, 1, dtypes=[ \
                                    nt.float32, nt.float32,
                                    nt.float64, nt.float64,
                                    nt.complex64, nt.float32,
                                    nt.complex128, nt.float64],
                    signature='(m,m)->(m)', name='eigvaslh_lo', stack_inputs=True,
                    doc = "eigh on the last two dimension and broadcast to the rest, using"\
                    " lower triangle \n"\
                    "Results in a vector of eigenvalues. \n"\
                    "    \"(m,m)->(m)\" \n",
                    )

eigvalsh_up = frompyfunc(eig_shup_funcs, 1, 1, dtypes=[ \
                                    nt.float32, nt.float32,
                                    nt.float64, nt.float64,
                                    nt.complex64, nt.float32,
                                    nt.complex128, nt.float64],
                    signature='(m,m)->(m)', name='eigvaslh_up', stack_inputs=True,
                    doc = "eigh on the last two dimension and broadcast to the rest, using"\
                    " upper triangle \n"\
                    "Results in a vector of eigenvalues. \n"\
                    "    \"(m,m)->(m)\" \n",
                    )

# --------------------------------------------------------------------------
# Solve family (includes inv)

def wrap_solve(func):
    def solve(in0, in1, out0):
        n = in0.shape[0]
        nrhs = in1.shape[1]
        in0stride = in0.strides
        in1stride = in1.strides
        out0stride = out0.strides
        f_args = [toCharP(in0), toCharP(in1), toCharP(out0)]

        dims = ffi.new('intptr_t[3]', [1, n, nrhs])
        steps = ffi.new('intptr_t[9]', [1, 1, 1, in0stride[0], in0stride[1],
                                    in1stride[0], in1stride[1],
                                    out0stride[0], out0stride[1]])
        func(f_args, dims, steps, VOIDP)
    return solve

solve_funcs = \
        [wrap_solve(getattr(lib, f + 'solve')) for f in all_four]

def wrap_solve1(func):
    def solve1(in0, in1, out0):
        n = in0.shape[0]
        in0stride = in0.strides
        in1stride = in1.strides
        out0stride = out0.strides
        f_args = [toCharP(in0), toCharP(in1), toCharP(out0)]
        dims = ffi.new('intptr_t[2]', [1, n])
        steps = ffi.new('intptr_t[7]', [1, 1, 1, in0stride[0], in0stride[1],
                                    in1stride[0], out0stride[0]])
        func(f_args, dims, steps, VOIDP)
    return solve1

solve1_funcs = \
        [wrap_solve1(getattr(lib, f + 'solve1')) for f in all_four]

def wrap_1in1out(func):
    def one_in_one_out(inarg, outarg):
        n = inarg.shape[0]
        instride = inarg.strides
        outstride = outarg.strides
        f_args = [toCharP(inarg), toCharP(outarg)]
        dims = ffi.new('intptr_t[2]', [1, n])
        steps = ffi.new('intptr_t[6]', [1, 1, instride[0], instride[1],
                                    outstride[0], outstride[1]])
        func(f_args, dims, steps, VOIDP)
    return one_in_one_out

inv_funcs = \
        [wrap_1in1out(getattr(lib, f + 'inv')) for f in all_four]

solve = frompyfunc(solve_funcs, 2, 1, dtypes=[ \
                                    nt.float32, nt.float32, nt.float32,
                                    nt.float64, nt.float64, nt.float64,
                                    nt.complex64, nt.complex64, nt.complex64,
                                    nt.complex128, nt.complex128, nt.complex128],
                        signature='(m,m),(m,n)->(m,n)', name='solve', stack_inputs=True,
                        doc = "solve the system a x = b, on the last two dimensions, broadcast"\
                            " to the rest. \n"\
                            "Results in a matrices with the solutions. \n"\
                            "    \"(m,m),(m,n)->(m,n)\" \n",
                    )

solve1 = frompyfunc(solve1_funcs, 2, 1, dtypes=[ \
                                    nt.float32, nt.float32, nt.float32,
                                    nt.float64, nt.float64, nt.float64,
                                    nt.complex64, nt.complex64, nt.complex64,
                                    nt.complex128, nt.complex128, nt.complex128],
                        signature='(m,m),(m)->(m)', name='solve1', stack_inputs=True,
                        doc = "solve the system a x = b, for b being a vector, broadcast in"\
                            " the outer dimensions. \n"\
                            "Results in the vectors with the solutions. \n"\
                            "    \"(m,m),(m)->(m)\" \n",
                        )

inv = frompyfunc(inv_funcs, 1, 1, dtypes=[ \
                                    nt.float32, nt.float32,
                                    nt.float64, nt.float64,
                                    nt.complex64, nt.complex64,
                                    nt.complex128, nt.complex128],
                        signature='(m,m)->(m,m)', name='inv', stack_inputs=True,
                doc="compute the inverse of the last two dimensions and broadcast "\
                    " to the rest. \n"\
                    "Results in the inverse matrices. \n"\
                    "    \"(m,m)->(m,m)\" \n",
            )

# --------------------------------------------------------------------------
# Cholesky decomposition

cholesky_lo_funcs = [wrap_1in1out(getattr(lib, f + 'cholesky_lo')) for f in all_four]

cholesky_lo = frompyfunc(cholesky_lo_funcs, 1, 1, dtypes=[ \
                                    nt.float32, nt.float32,
                                    nt.float64, nt.float64,
                                    nt.complex64, nt.float32,
                                    nt.complex128, nt.float64],
                        signature='(m,m)->(m,m)', name='cholesky_lo', stack_inputs=True,
                        doc = "cholesky decomposition of hermitian positive-definite matrices. \n"\
                            "Broadcast to all outer dimensions. \n"\
                            "    \"(m,m)->(m,m)\" \n",
                        )

# --------------------------------------------------------------------------
# eig family

#  There are problems with eig in complex single precision.
#  That kernel is disabled

eig_funcs = [wrap_1inVoutMout(getattr(lib, f + 'eig')) for f in three]
eigval_funcs = [wrap_1inVout(getattr(lib, f + 'eigvals')) for f in three]

eig = frompyfunc(eig_funcs, 1, 2, dtypes=[ \
                                nt.float32, nt.complex64, nt.complex64,
                                nt.float64, nt.complex128, nt.complex128,
                                nt.complex128, nt.complex128, nt.complex128],
                    signature='(m,m)->(m),(m,m)', name='eig', stack_inputs=True,
                    doc = "eig on the last two dimension and broadcast to the rest. \n"\
                        "Results in a vector with the  eigenvalues and a matrix with the"\
                        " eigenvectors. \n"\
                        "    \"(m,m)->(m),(m,m)\" \n",
                    )

eigvals = frompyfunc(eigval_funcs, 1, 1, dtypes=[ \
                                nt.float32, nt.complex64,
                                nt.float64, nt.complex128,
                                nt.complex128, nt.complex128],
                    signature='(m,m)->(m)', name='eig', stack_inputs=True,
                    doc = "eig on the last two dimension and broadcast to the rest. \n"\
                        "Results in a vector of eigenvalues. \n"\
                        "    \"(m,m)->(m)\" \n",
                    )

# --------------------------------------------------------------------------
# SVD family of singular value decomposition
def wrap_1inMoutVoutMout(func):
    # in0 - 2d, out0 - 2d, out1 - 1d out2 - 2d
    def MinMoutVoutMout(in0, *out):
        m = in0.shape[0]
        n = in0.shape[1]
        f_args = [toCharP(in0)] + [toCharP(o) for o in out]
        dims = ffi.new('intptr_t[3]', [1, m, n])
        steps = ffi.new('intptr_t[11]')
        steps[0:4] = [1] * 4
        steps[4]  = in0.strides[0]
        steps[5]  = in0.strides[1]
        steps[6]  = out[0].strides[0]
        steps[7]  = out[0].strides[1]
        steps[8]  = out[1].strides[0]
        steps[9]  = out[2].strides[0]
        steps[10] = out[2].strides[1]
        func(f_args, dims, steps, VOIDP)
    return MinMoutVoutMout

svd_m_funcs = [wrap_1inVout(getattr(lib, f + 'svd_N')) for f in all_four]
svd_n_funcs = [wrap_1inVout(getattr(lib, f + 'svd_N')) for f in all_four]
svd_m_s_funcs = [wrap_1inMoutVoutMout(getattr(lib, f + 'svd_S')) for f in all_four]
svd_n_s_funcs = [wrap_1inMoutVoutMout(getattr(lib, f + 'svd_S')) for f in all_four]
svd_m_f_funcs = [wrap_1inMoutVoutMout(getattr(lib, f + 'svd_A')) for f in all_four]
svd_n_f_funcs = [wrap_1inMoutVoutMout(getattr(lib, f + 'svd_A')) for f in all_four]


svd_m = frompyfunc(svd_m_funcs, 1, 1, dtypes=[ \
                                nt.float32, nt.float32,
                                nt.float64, nt.float64,
                                nt.complex64, nt.float32,
                                nt.complex128, nt.float64],
                    signature='(m,n)->(m)', name='svd_m', stack_inputs=True,
                    doc = "svd when n>=m. ",
                    )

svd_n = frompyfunc(svd_n_funcs, 1, 1, dtypes=[ \
                                nt.float32, nt.float32,
                                nt.float64, nt.float64,
                                nt.complex64, nt.float32,
                                nt.complex128, nt.float64],
                    signature='(m,n)->(n)', name='svd_n', stack_inputs=True,
                    doc = "svd when n<=m. ",
                    )
svd_1_3_types =[ nt.float32, nt.float32, nt.float32, nt.float32,
                    nt.float64, nt.float64, nt.float64, nt.float64,
                    nt.complex64, nt.complex64, nt.float32, nt.complex64,
                    nt.complex128, nt.complex128, nt.float64, nt.complex128]

svd_m_s = frompyfunc(svd_m_s_funcs, 1, 3, dtypes=svd_1_3_types,
                    signature='(m,n)->(m,n),(m),(m,n)', name='svd_m_s', stack_inputs=True,
                    doc = "svd when m>=n. ",
                    )

svd_n_s = frompyfunc(svd_n_s_funcs, 1, 3, dtypes=svd_1_3_types,
                    signature='(m,n)->(m,n),(n),(n,n)', name='svd_n_s', stack_inputs=True,
                    doc = "svd when m>=n. ",
                    )

svd_m_f = frompyfunc(svd_m_f_funcs, 1, 3, dtypes=svd_1_3_types,
                    signature='(m,n)->(m,m),(m),(n,n)', name='svd_m_f', stack_inputs=True,
                    doc = "svd when m>=n. ",
                    )

svd_n_f = frompyfunc(svd_n_f_funcs, 1, 3, dtypes=svd_1_3_types,
                    signature='(m,n)->(m,m),(n),(n,n)', name='svd_n_f', stack_inputs=True,
                    doc = "svd when m>=n. ",
                    )
