var React = require("react");

var rawMarkup = require("../util").rawMarkup;

var MarkdownCell = React.createClass({
  render: function() {
    var displayClass = this.props.notebook.displayClass;
    return (
      <div className="cell switch">
        <div className={displayClass(this)} dangerouslySetInnerHTML={rawMarkup(this.props.data.source)} />
      </div>
    );
  }
});

module.exports = MarkdownCell;
