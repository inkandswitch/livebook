var React = require("react");

var Uploader = React.createClass({
  render() {
    return (
      <div id="upload">
         <h1>Drag files here</h1>
         <ul>
           <li className="ipynb"><code>.ipynb</code> notebook</li>
           <li className="csv">CSV data</li>
         </ul>
      </div>
    );
  },
});

module.exports = Uploader;