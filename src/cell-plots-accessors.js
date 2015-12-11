var CELL_PLOTS_PROPERTY_NAME = "_PLOTS";

function getCellPlots(cell) {
  return cell[CELL_PLOTS_PROPERTY_NAME];
}

function setCellPlots(cell, plots) {
  // We keep the plot data on the javascript iPython object's cell `source` field
  // The `enumerable: false` part of the descriptor means THIS FIELD IS NOT STRINGIFIED INTO JSON
  let propertyName = CELL_PLOTS_PROPERTY_NAME;
  let propertyDescriptor = {
    enumerable: false,
    value: plots,
  };
  Object.defineProperty(cell, propertyName, propertyDescriptor)
}

module.exports = {
  getCellPlots,
  setCellPlots,
};