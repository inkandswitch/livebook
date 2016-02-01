import pandas

class Static:
    CURRENT_PLOT = None
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
            data = pandas.Series(args[0]).to_plot_data_v2()
            self.layers.append({"data": data, "options": kwargs})
        elif (len(args) == 2):
            x = pandas.Series(args[0],name="x").to_plot_data_v2()
            y = pandas.Series(args[1],name="y").to_plot_data_v2()
            data = {"x": x, "y": y}
            self.layers.append({"data": data, "options": kwargs})
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
        Static.PLOTS.append(Static.CURRENT_PLOT)
    Static.CURRENT_PLOT = None


def get_plots():
    close()
    old = map(lambda p: p.__dict__, Static.PLOTS)
    Static.PLOTS = []
    return old


def plot(*args, **kwargs):  # kwargs could include (linewidth, lw, color, marker, linestyle, ls)
    """
        from: http://matplotlib.org/api/pyplot_api.html
        plot(x, y)
        plot(x, y, 'formatstring')
        plot(y) # plot y using x as index array

        if first argument (?) is 2-dim, those columns will be plotted
    """
    current_plot = get_current_plot(**kwargs)
    current_plot.add_layer(*args, **kwargs)


def scatter(x, y, **kwargs):
    plot(x, y, chart_type="scatter", **kwargs)


def bar(left, height, **kwargs):
    plot(left, height, chart_type="bar", **kwargs)


def hist(*args, **kwargs):
    pass
