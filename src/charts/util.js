const { getColors } = require("./defaults");

module.exports = {
    parseLayer,
};

function parseLayer(layer, index, layers) {
    const { data, options } = layer;

    let { x, y } = data;
    let xName = x.column;
    let yName = y.column;

    if (index !== undefined && layers !== undefined) {
        if (hasLayerYNameConflict(layer, index, layers)) {
          yName = transformConflictingName(yName, index);
        }
    }

    let xData = x.list;
    let yData = y.list;

    const xs = {};
    xs[yName] = xName;

    let columns = [
      [xName, ...xData],
      [yName, ...yData]
    ];

    const color = { pattern: getColors() };
    if (options && options.color) {
      color.pattern.unshift(options.color);
    }

    return { xName, yName, color, xs, columns };
}

function transformConflictingName(name, index) {
    return name + " (" + index + ")";
}

function hasLayerYNameConflict(layer, index, layers) {
    if (index < 1) return false;
    layers = layers.slice(0, index);
    return layers.some((other_layer) => {
        return getYNameFromLayer(other_layer) === getYNameFromLayer(layer);
    });
}

function getYNameFromLayer(layer) {
    return layer.data.y.column;
}