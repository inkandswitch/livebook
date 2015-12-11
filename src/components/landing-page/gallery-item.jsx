let React = require("react"); 

let GalleryItem = React.createClass({
  clickHandler(event) {
    event.preventDefault();
    event.stopPropagation();

    this.props.clickHandler({
      ipynb: this.props.ipynbURL,
      csv: this.props.csvURL,
    });
  },

  getClassNames() {
    let result = "gallery-item";
    if (this.props.starter) {
      result += " gallery-item--starter";
    }
    return result;
  },

  render() {
    return (
      <article className={this.getClassNames()} onClick={this.clickHandler}>
        {this.props.children}
      </article>
    );
  },
});

module.exports = GalleryItem;