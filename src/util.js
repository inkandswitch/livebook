var marked = require("marked")

module.exports = {
    rawMarkup     : rawMarkup,
    $resultToHtml : $resultToHtml, 
    zip           : zip,
};

function rawMarkup(lines) {
  return {
    __html: marked(lines.join(""), { sanitize: true, })
  };
}

function $resultToHtml($result) {
    var table = "<table><thead><tr><th>&nbsp;</th>";
    $result.cols.forEach(col => table += "<th>" + col + "</th>")
    table += "</tr></thead>"
    table += "<tbody>"
    $result.rows.forEach(row => {
      table += "<tr><th>" + row + "</th>"
      $result.cols.forEach(col => table += "<td>" + $result.data[row][col].toFixed(6) + "</td>")
      table += "</tr>"
    })
    table += "</tbody>"
    table += "</table>";
    
    return table;
}

function zip(a, b) {
    return a.map((v, i) => [v, b[i]]);
}