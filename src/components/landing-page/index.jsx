let $ = require("jquery");
let React = require("react");
// let asyncRunParallel = require("../util").asyncRunParallel;

let ForkButton = React.createClass({
  clickHandler(event) {
    this.props.clickHandler({
      ipynb: this.props.ipynbURL,
      csv: this.props.csvURL,
    });
    event.preventDefault();
    event.stopPropagation();
  },

  render() {
    return (
      <li onClick={this.clickHandler}>
        <a href="#">{this.props.children}</a>
      </li>
    );
  },
});

let ForkButtons = React.createClass({
  clickHandler(urls) {
    this.props.clickHandler(urls);
  },

  render() {
    return (
      <ul>
        <ForkButton csvURL="/forkable/waldo.csv" 
            ipynbURL="/forkable/waldo.ipynb" 
            clickHandler={this.clickHandler}>
          Here's Waldo
        </ForkButton>

        <ForkButton csvURL="/forkable/mlex1.csv" 
            ipynbURL="/forkable/mlex1.ipynb" 
            clickHandler={this.clickHandler}>
          Linear regression
        </ForkButton>

        <ForkButton csvURL="/forkable/quakes.csv" 
            ipynbURL="/forkable/quakes.ipynb" 
            clickHandler={this.clickHandler}>
          Earthquakes in the midwest
        </ForkButton>
      </ul>
    );
  },
})


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
    return !this.props.show;
  },

  render() {
      let clickHandler = this.clickHandler;
      let styles = this.getStyles();
      return (
        <div ref="self" style={styles} className="landing-page-container">
          <header className="livebook-header">
            <div className="layout-container">
              <hgroup>
                <h1>Livebook</h1>
                <h2>iPython-compatible notebook editor</h2>
              </hgroup>
              <p>
                featuring live coding and realtime collaboration 
                for researchers, journalists, and data scientists
              </p>
            </div>
          </header>
          <section className="layout-container gallery-container">
            <ForkButtons clickHandler={this.clickHandler}/>
          </section>
        </div>
      );
  },
});

module.exports = LandingPage;