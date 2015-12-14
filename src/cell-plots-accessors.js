var CELL_PLOTS_PROPERTY_NAME = "_PLOTS";

function getCellPlots(cell) {
  return cell[CELL_PLOTS_PROPERTY_NAME];
}

function setCellPlots(cell, plots) {
  let propertyName = CELL_PLOTS_PROPERTY_NAME;
  let propertyDescriptor = {
    configurable: true, // allows us to redefine the property
    enumerable: false,  // prevents property from being serialized into JSON
    value: plots,
  };
  Object.defineProperty(cell, propertyName, propertyDescriptor)
}

module.exports = {
  getCellPlots,
  setCellPlots,
};