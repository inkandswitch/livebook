let React = require("react");

let GalleryItem = require("./gallery-item");

let Starter = React.createClass({
    render() {
        return (
          <GalleryItem csvURL="/forkable/starter.csv" 
              ipynbURL="/forkable/starter.ipynb" 
              fork={this.props.clickHandler}>
            Starter notebook
          </GalleryItem>
        );
    },
});

let Quakes = React.createClass({
    render() {
        return (
            <GalleryItem csvURL="/forkable/earthquake_states_lite.csv" 
                ipynbURL="/forkable/earthquakes.ipynb" 
                fork={this.props.clickHandler}>
              Earthquakes in the midwest
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
          <h1>Try a sample notebook</h1>
          <ul>
          <li><Quakes clickHandler={this.clickHandler} /></li>
          <li><a href="#">Monte Carlo simulations (<b>todo</b>)</a></li>
          <li><Starter clickHandler={this.clickHandler} /></li>
          </ul>

          <h1>&hellip;or:</h1>
          <ul>
          <li><a href="/upload">Upload your own .ipynb and .csv</a></li>
          <li><a href="#">New blank notebook (<b>todo</b>)</a></li>
          </ul>
        </div>
      );
  },
});

module.exports = LandingPage;