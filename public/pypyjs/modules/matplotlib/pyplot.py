class Static:
    CURRENT_PLOT = None
    PLOTS_V2 = []
    PLOTS = []


class Plot:
    def __init__(self, **kwargs):
        # TODO - fix how chart type is assuigned. the use of messy right now
        self.layers = []
        if "chart_type" in kwargs:
            self.chart_type = kwargs["chart_type"]
        else:
            self.chart_type = "line"

    def add_layer(self, *args, **kwargs):
        if (len(args) == 1):
            # TODO - how do we parse dims?
            data = args[0]
            self.layers.append({"data": data})
        elif (len(args) == 2):
            x = args[0]
            y = args[1]
            data = {"x": x, "y": y}
            self.layers.append({"data": data})
        elif (len(args) == 3):
            # We don't know format strings
            pass


def get_current_plot(**kwargs):
    if Static.CURRENT_PLOT is None:
        Static.CURRENT_PLOT = Plot(**kwargs)
    return Static.CURRENT_PLOT


def close():
    """ closes the current plot """
    if Static.CURRENT_PLOT is not None:
        Static.PLOTS_V2.append(Static.CURRENT_PLOT)
    Static.CURRENT_PLOT = None


def get_plots_v2():
    close()
    old = map(lambda p: p.__dict__, Static.PLOTS_V2)
    Static.PLOTS_V2 = []
    return old


def plot_v2(*args, **kwargs):
    current_plot = get_current_plot(**kwargs)
    current_plot.add_layer(*args, **kwargs)


def get_plots():
    old = Static.PLOTS
    Static.PLOTS = []
    return old


def __plot_js__(*args, **kwargs):
    if (len(args) == 1):
        arg1 = args[0]
        Static.PLOTS.append(["plot", arg1, None])
    if (len(args) > 1):
        arg1 = args[0]
        arg2 = args[1]
        Static.PLOTS.append(["plot", arg1, arg2])


def plot(*args, **kwargs):
    """
        from: http://matplotlib.org/api/pyplot_api.html
        plot(x, y)
        plot(x, y, 'formatstring')
        plot(y) # plot y using x as index array

        if first argument (?) is 2-dim, those columns will be plotted
    """
    plot_v2(*args, **kwargs)
    if (len(args) == 1):
        data = args[0]
        __plot_js__(data.to_plot_data())
    elif (len(args) == 2):
        x = args[0]
        y = args[1]
        __plot_js__(["x"] + x, ["y"] + y)
    elif (len(args) == 3):
        # We don't know how to do format strings!
        pass


def scatter(x, y):
    try:
        xData = [x.column] + x.data[x.column]
        yData = [y.column] + y.data[y.column]
        __plot_js__(xData, yData)
        plot_v2(xData, yData, chart_type="scatter")
    except:
        xData = ["x"] + x
        yData = ["y"] + y
        __plot_js__(xData, yData)
        plot_v2(x, y, chart_type="scatter")
