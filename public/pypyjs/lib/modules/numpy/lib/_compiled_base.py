import numpy

# translated from numpy/lib/src/_compiled_base.c
def binary_search(key, arr, length):
    imin = 0
    imax = length

    if key > arr[length - 1]:
        return length

    while imin < imax:
        imid = imin + ((imax - imin) >> 1);
        if key >= arr[imid]:
            imin = imid + 1;
        else:
            imax = imid;

    return imin - 1;


# translated from numpy/lib/src/_compiled_base.c
def interp(x, xp, fp, left=None, right=None):
    lenxp = len(xp)
    if lenxp == 0:
        raise ValueError("array of sample points is empty")
    if lenxp != len(fp):
        raise ValueError("fp and xp are not of the same length.")

    af = numpy.array(x, dtype=numpy.double)
    ax = numpy.array(x, dtype=numpy.double)
    axp = numpy.array(xp, dtype=numpy.double)

    dy = numpy.array(fp, dtype=numpy.double)
    dx = axp
    dz = ax
    dres = af

    if left is not None:
        lval = left
    else:
        lval = dy[0]
    if right is not None:
        rval = right
    else:
        rval = dy[-1]

    for i, el in enumerate(af):
        if numpy.isnan(el):
            dres[i] = el
            continue
        j = binary_search(x[i], axp, lenxp)

        if (j == -1):
            dres[i] = lval
        elif (j == lenxp - 1):
            dres[i] = dy[j]
        elif (j == lenxp):
            dres[i] = rval
        else:
            slope = (dy[j + 1] - dy[j])/(dx[j + 1] - dx[j]);
            dres[i] = slope*(dz[i] - dx[j]) + dy[j];

    return af

try:
    from _numpypy.multiarray import add_docstring
except ImportError:
    pass


def NotImplementedFunc(func):
    def tmp(*args, **kwargs):
        raise NotImplementedError("%s not implemented yet" % func)
    return tmp

for name in '''
_insert add_docstring digitize bincount interp add_newdoc_ufunc
ravel_multi_index unravel_index packbits unpackbits
'''.split():
    if name not in globals():
        globals()[name] = NotImplementedFunc(name)
