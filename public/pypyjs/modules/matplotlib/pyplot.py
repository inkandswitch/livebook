import json


class Static:
    PLOTS_V2 = []
    PLOTS = []


class Plot:
    def __init__(self, *args):
        self.data = []
        self.chart_type = "line"

        if (len(args) == 1):
            # TODO - how do we parse dims?
            self.data.append(args[0])
        elif (len(args) == 2):
            x = args[0]
            y = args[1]
            self.data.append({"x": x, "y": y})
        elif (len(args) == 3):
            # We don't know format strings
            pass


def get_plots_v2():
    old = map(lambda p: p.__dict__, Static.PLOTS_V2)
    Static.PLOTS_V2 = []
    return old


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

    Static.PLOTS_V2.append(Plot(*args))


def plot(*args, **kwargs):
    """
        from: http://matplotlib.org/api/pyplot_api.html
        plot(x, y)
        plot(x, y, 'formatstring')
        plot(y) # plot y using x as index array

        if first argument (?) is 2-dim, those columns will be plotted
    """
    global __plot_js__
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
    global __plot_js__
    try:
        xData = [x.column] + x.data[x.column]
        yData = [y.column] + y.data[y.column]
        __plot_js__(xData, yData)
    except:
        __plot_js__(["x"] + x, ["y"] + y)
