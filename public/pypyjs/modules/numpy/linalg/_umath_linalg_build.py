import sys, os
import cffi

ffi = cffi.FFI()
defs = ['''
    void init_constants(void);
    int _npy_clear_floatstatus(void);
    void _npy_set_floatstatus_invalid(void);
''']

ufunc_cdef = 'extern void %s(char **args, intptr_t * dimensions, intptr_t * steps, void*);'
all_four = ['FLOAT_', 'DOUBLE_', 'CFLOAT_', 'CDOUBLE_']
three = ['FLOAT_', 'DOUBLE_', 'CDOUBLE_']
base_four_names = [
    'slogdet', 'det', 'inv', 'solve1', 'solve', 'eighup', 'eighlo',
    'eigvalshlo', 'eigvalshup', 'cholesky_lo', 'svd_A', 'svd_S', 'svd_N']
base_three_names = ['eig', 'eigvals']
names = []
for name in base_four_names:
    names += [pre + name for pre in all_four]
for name in base_three_names:
    names += [pre + name for pre in three]

for name in names:
    defs.append(ufunc_cdef % name)
defs = '\n'.join(defs)
ffi.cdef(defs)
ffi.set_source('numpy.linalg._umath_linalg_cffi', defs)
