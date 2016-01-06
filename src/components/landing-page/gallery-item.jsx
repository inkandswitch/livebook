let React = require("react"); 

let GalleryItem = React.createClass({
  clickHandler(event) {
    event.preventDefault();
    event.stopPropagation();

    this.props.fork({
      ipynb: this.props.ipynbURL,
      csv: this.props.csvURL,
    });
  },

  render() {
    return (
      <article onClick={this.clickHandler}>
        <a>{this.props.children}</a>
      </article>
    );
  },
});

module.exports = GalleryItem;