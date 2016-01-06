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
        <a>{this.props.children}</a>
      </article>
    );
  },
});

let Starter = React.createClass({
    render() {
        return (
          <GalleryItem csvURL="/forkable/starter.csv" 
              ipynbURL="/forkable/starter.ipynb" 
              clickHandler={this.props.clickHandler}
              starter={true}>
            Get a copy of the starter notebook
          </GalleryItem>
        );
    },
});


let LandingPage = React.createClass({

  clickHandler(urls) {
    this.props.fork(urls);
  },

  getStyles() {
    return this.isHidden() ? { display: "none"} : {};
  },

  isHidden() {
    return window.location.pathname !== "/";
  },

  render() {
      let styles = this.getStyles();
      return (
        <div style={styles} className="landing-page-container">
          <Starter clickHandler={this.clickHandler} />
        </div>
      );
  },
});

module.exports = LandingPage;