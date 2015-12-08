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
        <ForkButton csvURL="/forkable/waldo.csv" ipynbURL="/forkable/waldo.ipynb" clickHandler={this.clickHandler}>
          Here's Waldo
        </ForkButton>

        <ForkButton csvURL="" ipynbURL="" clickHandler={this.clickHandler}>
          Linear regression
        </ForkButton>

        <ForkButton csvURL="" ipynbURL="" clickHandler={this.clickHandler}>
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

  render() {
      let clickHandler = this.clickHandler;

      return (
        <div>
          <p>Click on a notebook to get your own fork and start editing!</p>
          <ForkButtons clickHandler={this.clickHandler}/>
          </div>
      );
  },
});

module.exports = LandingPage;