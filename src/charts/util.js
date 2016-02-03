module.exports = {
    hasLayerYNameConflict,
    transformConflictingName
};

function parseChartArgs(selector, layer, { maxWidth }) {
    throw new Error("NYI");
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

function getXNameFromLayer(layer) {
    return layer.data.x.column;
}

function getYNameFromLayer(layer) {
    return layer.data.y.column;
}