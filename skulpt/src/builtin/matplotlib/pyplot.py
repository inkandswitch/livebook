
import sys

#import matplotlib
#from matplotlib.figure import Figure, figaspect
#from matplotlib.figure import Figure

def gca(**kwargs):
    ax =  gcf().gca(**kwargs)
    return ax

def gcf():
    "Return a reference to the current figure."

    figManager = _pylab_helpers.Gcf.get_active()
    if figManager is not None:
        return figManager.canvas.figure
    else:
        return figure()


def figure(num=None, # autoincrement if None, else integer from 1-N
           figsize   = None, # defaults to rc figure.figsize
           dpi       = None, # defaults to rc figure.dpi
           facecolor = None, # defaults to rc figure.facecolor
           edgecolor = None, # defaults to rc figure.edgecolor
           frameon = True,
#           FigureClass = Figure,
           FigureClass = None,
           **kwargs
           ):
    if figsize is None:
        figsize = (12.75,8)
    __figure_js__(figsize[0],figsize[1])

def figure_real(num=None, # autoincrement if None, else integer from 1-N
           figsize   = None, # defaults to rc figure.figsize
           dpi       = None, # defaults to rc figure.dpi
           facecolor = None, # defaults to rc figure.facecolor
           edgecolor = None, # defaults to rc figure.edgecolor
           frameon = True,
#           FigureClass = Figure,
           FigureClass = None,
           **kwargs
           ):
    """
    Creates a new figure.

    Parameters
    ----------

    num : integer or string, optional, default: none
        If not provided, a new figure will be created, and a the figure number
        will be increamted. The figure objects holds this number in a `number`
        attribute.
        If num is provided, and a figure with this id already exists, make
        it active, and returns a reference to it. If this figure does not
        exists, create it and returns it.
        If num is a string, the window title will be set to this figure's
        `num`.

    figsize : tuple of integers, optional, default : None
        width, height in inches. If not provided, defaults to rc
        figure.figsize.

    dpi : integer, optional, default ; None
        resolution of the figure. If not provided, defaults to rc figure.dpi.

    facecolor :
        the background color; If not provided, defaults to rc figure.facecolor

    edgecolor :
        the border color. If not provided, defaults to rc figure.edgecolor

    Returns
    -------
    figure : Figure
        The Figure instance returned will also be passed to new_figure_manager
        in the backends, which allows to hook custom Figure classes into the
        pylab interface. Additional kwargs will be passed to the figure init
        function.

    Note
    ----
    If you are creating many figures, make sure you explicitly call "close"
    on the figures you are not using, because this will enable pylab
    to properly clean up the memory.

    rcParams defines the default values, which can be modified in the
    matplotlibrc file

    """

    if figsize is None:
        figsize = rcParams['figure.figsize']
    if dpi is None:
        dpi = rcParams['figure.dpi']
    if facecolor is None:
        facecolor = rcParams['figure.facecolor']
    if edgecolor is None:
        edgecolor = rcParams['figure.edgecolor']


    allnums = get_fignums()
    next_num = max(allnums) + 1 if allnums else 1
    figLabel = ''
    if num is None:
        num = next_num
    elif is_string_like(num):
        figLabel = num
        allLabels = get_figlabels()
        if figLabel not in allLabels:
            if figLabel == 'all':
                warnings.warn("close('all') closes all existing figures")
            num = next_num
        else:
            inum = allLabels.index(figLabel)
            num = allnums[inum]
    else:
        num = int(num)  # crude validation of num argument

    figManager = _pylab_helpers.Gcf.get_fig_manager(num)
    if figManager is None:
        max_open_warning = rcParams['figure.max_open_warning']

        if (max_open_warning >= 1 and
            len(allnums) >= max_open_warning):
            warnings.warn(
                "More than %d figures have been opened. Figures "
                "created through the pyplot interface "
                "(`matplotlib.pyplot.figure`) are retained until "
                "explicitly closed and may consume too much memory. "
                "(To control this warning, see the rcParam "
                "`figure.max_num_figures`)." %
                max_open_warning, RuntimeWarning)


        if get_backend().lower() == 'ps':
            dpi = 72

        figManager = new_figure_manager(num, figsize=figsize,
                                        dpi=dpi,
                                        facecolor=facecolor,
                                        edgecolor=edgecolor,
                                        frameon=frameon,
                                        FigureClass=FigureClass,
                                        **kwargs)

        if figLabel:
            figManager.set_window_title(figLabel)
            figManager.canvas.figure.set_label(figLabel)

        # make this figure current on button press event
        def make_active(event):
            _pylab_helpers.Gcf.set_active(figManager)

        cid = figManager.canvas.mpl_connect('button_press_event', make_active)
        figManager._cidgcf = cid

        _pylab_helpers.Gcf.set_active(figManager)
        figManager.canvas.figure.number = num

    draw_if_interactive()
    return figManager.canvas.figure


def plot(data):
    __plot_js__(data.to_plot_data())


def scatter(x, y):
    print "sup duder"
    xData = [x.column] + x.data[x.column]
    yData = [y.column] + y.data[y.column]
    __plot_js__(xData, yData)


def legend(*args, **kwargs):
#    ret = gca().legend(*args, **kwargs)
#    draw_if_interactive()
#    return ret
    return  123

def xlim(*args, **kwargs):
    """
    Get or set the *x* limits of the current axes.

    ::

      xmin, xmax = xlim()   # return the current xlim
      xlim( (xmin, xmax) )  # set the xlim to xmin, xmax
      xlim( xmin, xmax )    # set the xlim to xmin, xmax

    If you do not specify args, you can pass the xmin and xmax as
    kwargs, e.g.::

      xlim(xmax=3) # adjust the max leaving min unchanged
      xlim(xmin=1) # adjust the min leaving max unchanged

    Setting limits turns autoscaling off for the x-axis.

    The new axis limits are returned as a length 2 tuple.

    """
#    ax = gca()
#    if not args and not kwargs:
#        return ax.get_xlim()
#    ret = ax.set_xlim(*args, **kwargs)
#    draw_if_interactive()
#    return ret
    return 100

def ylim(*args, **kwargs):
    """
    Get or set the *y*-limits of the current axes.

    ::

      ymin, ymax = ylim()   # return the current ylim
      ylim( (ymin, ymax) )  # set the ylim to ymin, ymax
      ylim( ymin, ymax )    # set the ylim to ymin, ymax

    If you do not specify args, you can pass the *ymin* and *ymax* as
    kwargs, e.g.::

      ylim(ymax=3) # adjust the max leaving min unchanged
      ylim(ymin=1) # adjust the min leaving max unchanged

    Setting limits turns autoscaling off for the y-axis.

    The new axis limits are returned as a length 2 tuple.
    """
#    ax = gca()
#    if not args and not kwargs:
#        return ax.get_ylim()
#    ret = ax.set_ylim(*args, **kwargs)
#    draw_if_interactive()
#    return ret
    return ret

def xticks(*args, **kwargs):
    return 100

def xticks2(*args, **kwargs):
    ax = gca()

    if len(args)==0:
        locs = ax.get_xticks()
        labels = ax.get_xticklabels()
    elif len(args)==1:
        locs = ax.set_xticks(args[0])
        labels = ax.get_xticklabels()
    elif len(args)==2:
        locs = ax.set_xticks(args[0])
        labels = ax.set_xticklabels(args[1], **kwargs)
    else: raise TypeError('Illegal number of arguments to xticks')
    if len(kwargs):
        for l in labels:
            l.update(kwargs)

    draw_if_interactive()
    return locs, silent_list('Text xticklabel', labels)

def yticks(*args, **kwargs):
    """
    Get or set the *y*-limits of the current tick locations and labels.

    ::

      # return locs, labels where locs is an array of tick locations and
      # labels is an array of tick labels.
      locs, labels = yticks()

      # set the locations of the yticks
      yticks( arange(6) )

      # set the locations and labels of the yticks
      yticks( arange(5), ('Tom', 'Dick', 'Harry', 'Sally', 'Sue') )

    The keyword args, if any, are :class:`~matplotlib.text.Text`
    properties. For example, to rotate long labels::

      yticks( arange(12), calendar.month_name[1:13], rotation=45 )
    """
#    ax = gca()
#
#    if len(args)==0:
#        locs = ax.get_yticks()
#        labels = ax.get_yticklabels()
#    elif len(args)==1:
#        locs = ax.set_yticks(args[0])
#        labels = ax.get_yticklabels()
#    elif len(args)==2:
#        locs = ax.set_yticks(args[0])
#        labels = ax.set_yticklabels(args[1], **kwargs)
#    else: raise TypeError('Illegal number of arguments to yticks')
#    if len(kwargs):
#        for l in labels:
#            l.update(kwargs)
#
#    draw_if_interactive()
#
#    return ( locs,
#             silent_list('Text yticklabel', labels)
#             )
    return 100

