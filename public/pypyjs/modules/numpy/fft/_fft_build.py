from cffi import FFI
ffi = FFI()


ffi.cdef('''
void npy_cffti(int n, double wsave[]);
void npy_rffti(int n, double wsave[]);
void npy_cfftf(int n, double c[], double wsave[]);
void npy_cfftb(int n, double c[], double wsave[]);
void npy_rfftf(int n, double r[], double wsave[]);
void npy_rfftb(int n, double r[], double wsave[]);
''')


ffi.set_source('numpy.fft._fft_cffi', '''
    #define NPY_VISIBILITY_HIDDEN
    #include "fftpack.h"
''')
