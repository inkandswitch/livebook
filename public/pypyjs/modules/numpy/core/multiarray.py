from _numpypy.multiarray import *
from _numpypy.multiarray import _reconstruct

def _fastCopyAndTranspose(a):
    return a.T.copy()

def _copyto(dst, src, casting='same_kind', where=None):
    if not isinstance(dst, ndarray):
        raise TypeError('argument 1 must be numpy.ndarray, not %s' % type(dst).__name__)
    src = array(src)
    if not can_cast(src.dtype, dst.dtype, casting=casting):
        raise TypeError('Cannot cast from %s to %s according to the rule %s' % (
                        src.dtype, dst.dtype, casting))
    src = src.astype(dst.dtype, casting=casting)
    if where is None and src.size < 2:
        dst.fill(src)
    elif where is None or where is True:
        dst[:] = src
    elif where is False:
        return
    else:
        where = array(where, dtype=bool)
        broadcast_dims = len(dst.shape) - len(where.shape)
        if broadcast_dims < 0:
            raise ValueError('could not broadcast where mask from shape'
                '%s into shape %s' % (str(where.shape), str(dst.shape)))
        if dst.shape[broadcast_dims:] != where.shape:
            raise ValueError('could not broadcast where mask from shape'
                '%s into shape %s' % (str(where.shape), str(dst.shape)))
        # Repeat 'where' so it broadcasts into dst
        where.shape = (1,)*broadcast_dims + where.shape
        for i in range(broadcast_dims):
            where = where.repeat(dst.shape[i], axis=i)
        if src.size > 1:
            dst[where] = src[where]
        else:
            dst[where] = src

if 'copyto' not in globals():
    copyto = _copyto

def format_longfloat(x, precision):
    return "%%.%df" % precision % x

def set_typeDict(d):
    pass

def may_share_memory(a, b):
    """
    Determine if two arrays can share memory

    The memory-bounds of a and b are computed.  If they overlap then
    this function returns True.  Otherwise, it returns False.

    A return of True does not necessarily mean that the two arrays
    share any element.  It just means that they *might*.

    Parameters
    ----------
    a, b : ndarray

    Returns
    -------
    out : bool

    Examples
    --------
    >>> np.may_share_memory(np.array([1,2]), np.array([5,8,9]))
    False

    """
    from ..lib import byte_bounds
    a_low, a_high = byte_bounds(a)
    b_low, b_high = byte_bounds(b)
    if b_low >= a_high or a_low >= b_high:
        return False
    return True

def NotImplementedFunc(func):
    def tmp(*args, **kwargs):
        raise NotImplementedError("%s not implemented yet" % func)
    return tmp

def NotImplementedType(name):
    clsname = 'numpy.%s' % (name,)
    class FakeType(object):
        def __init__(self, *args, **kwargs):
            raise NotImplementedError("%s not implemented yet" % func)
    FakeType.__name__ = clsname
    return FakeType

for name in '''
CLIP WRAP RAISE MAXDIMS ALLOW_THREADS BUFSIZE
'''.split():
    if name not in globals():
        globals()[name] = None

for name in '''
nested_iters
broadcast empty_like fromiter fromfile frombuffer newbuffer getbuffer
int_asbuffer set_numeric_ops promote_types digitize
lexsort compare_chararrays putmask einsum inner bincount interp
_vec_string datetime_data correlate correlate2 vdot matmul _insert
datetime_as_string busday_offset busday_count is_busday busdaycalendar
ravel_multi_index unravel_index packbits unpackbits
'''.split():
    if name not in globals():
        globals()[name] = NotImplementedFunc(name)

for name in '''
nditer flagsobj
'''.split():
    if name not in globals():
        globals()[name] = NotImplementedType(name)

# As a fallback, use cnumpy 1.9.2 _flagdict
if '_flagdict' not in globals():
    _flagdict = {'A': 256, 'ALIGNED': 256, 'C': 1, 'CONTIGUOUS': 1,
                 'C_CONTIGUOUS': 1, 'F': 2, 'FORTRAN': 2, 'F_CONTIGUOUS': 2,
                 'O': 4, 'OWNDATA': 4, 'U': 4096, 'UPDATEIFCOPY': 4096,
                 'W': 1024, 'WRITEABLE': 1024}
