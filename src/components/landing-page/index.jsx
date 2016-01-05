let React = require("react");
let Gallery = require("./gallery");

let LandingPage = React.createClass({

  clickHandler(urls) {
    this.props.fork(urls);
  },

  getStyles() {
    if (this.isHidden()) {
      return { display: "none", };
    }
    return {};
  },

  isHidden() {
    return window.location.pathname !== "/";
  },

  render() {
      let styles = this.getStyles();
      return (
        <div ref="self" style={styles} className="landing-page-container">
          <header className="livebook-header">
            <div className="layout-container">
              <div className="livebook-logo">
                <img src="/img/livebook-logo.svg" />
              </div>
              <div className="livebook-lede">
                <h1>Livebook</h1>
                <h2>IPython-compatible notebook editor</h2>
                <p>
                  featuring live coding and realtime collaboration 
                  for researchers, journalists, and data scientists
                </p>
              </div>
            </div>
          </header>
          <Gallery clickHandler={this.clickHandler} />
        </div>
      );
  },
});

module.exports = LandingPage;