const BLUE   = "#678FB5";
const VIOLET = "#944770";
const GREEN  = "#88A555";
const BROWN  = "#CCA978";

const COLORS = [
    BLUE,
    VIOLET,
    GREEN,
    BROWN,
];
const getColors = () => d3.shuffle([...COLORS]);


module.exports = {
    getColors
};