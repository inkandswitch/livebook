var React = require("react");

var rawMarkup = require("../util").rawMarkup;

function requireGlobalDeps() {
  return require("../notebook.jsx");
}

/**
 * [Global Deps]
 * `displayClass`
 */
var MarkdownCell = React.createClass({
  render: function() {
    var displayClass = requireGlobalDeps().displayClass;
    return (
      <div className="cell switch">
        <div className={displayClass(this)} dangerouslySetInnerHTML={rawMarkup(this.props.data.source)} />
      </div>
    );
  }
});

module.exports = MarkdownCell;