from __future__ import division, print_function


def configuration(parent_package='',top_path=None):
    from numpy.distutils.misc_util import Configuration
    config = Configuration('fft', parent_package, top_path)

    config.add_data_dir('tests')

    # Configure fftpack_lite
    import sys
    if '__pypy__' not in sys.builtin_module_names:
        config.add_extension('fftpack_lite',
                         sources=['fftpack_litemodule.c', 'fftpack.c']
                         )
    else:
        from _fft_build import ffi
        config.add_cffi_extension(ffi, sources=['fftpack.c'])
    return config

if __name__ == '__main__':
    from numpy.distutils.core import setup
    setup(configuration=configuration)
