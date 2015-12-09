from __future__ import division, print_function

import os
import sys

def configuration(parent_package='',top_path=None):
    from numpy.distutils.misc_util import Configuration
    from numpy.distutils.system_info import get_info
    config = Configuration('linalg', parent_package, top_path)

    config.add_data_dir('tests')

    # Configure lapack_lite

    src_dir = 'lapack_lite'
    lapack_lite_src = [
        os.path.join(src_dir, 'python_xerbla.c'),
        os.path.join(src_dir, 'zlapack_lite.c'),
        os.path.join(src_dir, 'dlapack_lite.c'),
        os.path.join(src_dir, 'blas_lite.c'),
        os.path.join(src_dir, 'dlamch.c'),
        os.path.join(src_dir, 'f2c_lite.c'),
        os.path.join(src_dir, 'f2c.h'),
    ]

    lapack_info = get_info('lapack_opt', 0) # and {}
    def get_lapack_lite_sources(ext, build_dir):
        if not lapack_info:
            print("### Warning:  Using unoptimized lapack ###")
            return ext.depends[:-1]
        else:
            if sys.platform=='win32':
                print("### Warning:  python_xerbla.c is disabled ###")
                return ext.depends[:1]
            return ext.depends[:2]
    try:
        import cffi
        have_cffi = True
    except ImportError:
        have_cffi = False
    build__capi_modules = True
    if have_cffi and '__pypy__' in sys.builtin_module_names:
        # pypy prefers cffi, cpython prefers capi
        build__capi_modules = False
    if build__capi_modules:
        config.add_extension('lapack_lite',
                         sources = [get_lapack_lite_sources],
                         depends = ['lapack_litemodule.c'] + lapack_lite_src,
                         extra_info = lapack_info
                         )
        # umath_linalg module
        config.add_extension('_umath_linalg',
                         sources = [get_lapack_lite_sources],
                         depends =  ['umath_linalg.c.src'] + lapack_lite_src,
                         extra_info = lapack_info,
                         libraries = ['npymath']
                         )
    else:
        from _lapack_lite_build import ffi, LAPACK_DEFS
        c_source_name = os.path.join(os.path.dirname(__file__), "_lapack_lite.c")
        ffi.emit_c_code(c_source_name)
        config.add_extension('_lapack_lite',
                         sources = [get_lapack_lite_sources],
                         depends = [c_source_name] + lapack_lite_src,
                         extra_info = lapack_info
                         )

        # link in Python27.lib, on pypy this is in include
        if sys.platform == 'win32':
            library_dirs = [sys.prefix + '/include',
                            sys.prefix + '/Libs']
            macros = [('_UMATH_LINALG_CAPI_DLL', None)]
        elif sys.platform == 'darwin':
            library_dirs = []
            macros = [('_UMATH_LINALG_CAPI_DLL', None)] + lapack_info.get(
                      'define_macros', [])
        else:
            library_dirs = []
            macros = [('_UMATH_LINALG_CAPI_DLL', None)]
        from _umath_linalg_build import ffi
        c_source_name = os.path.join(os.path.dirname(__file__),
                                     "_umath_linalg_cffi.c")
        ffi.emit_c_code(c_source_name)

        config.add_extension(
            '_umath_linalg_cffi',
            sources=[get_lapack_lite_sources, 'umath_linalg.c.src'],
            depends=[c_source_name] + lapack_lite_src,
            libraries=['npymath'],
            library_dirs=library_dirs,
            define_macros=macros,
            extra_info=lapack_info)
    return config

if __name__ == '__main__':
    from numpy.distutils.core import setup
    setup(configuration=configuration)
