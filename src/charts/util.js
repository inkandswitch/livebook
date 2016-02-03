module.exports = {
    hasLayerXNameConflict,
};

function hasLayerXNameConflict(layer, index, layers) {
    if (index < 1) return false;
    layers = layers.slice(0, index);
    return layers.some((other_layer) => {
        return getXNameFromLayer(other_layer) === getXNameFromLayer(layer);
    });
}

function getXNameFromLayer(layer) {
    return layer.data.x.column;
}