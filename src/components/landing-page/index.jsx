const React = require("react");

const GalleryItem = require("./gallery-item");

const MonteCarlo = () => ({
  render() {
    return (
      <GalleryItem csvURL="/forkable/montecarlo.csv" 
          ipynbURL="/forkable/montecarlo.ipynb" 
          fork={this.props.fork}>
        Monte Carlo simulation
      </GalleryItem>
    );
  },
});

const Quakes = () => ({
  render() {
    return (
      <GalleryItem csvURL="/forkable/earthquake_states_lite.csv" 
          ipynbURL="/forkable/earthquakes.ipynb" 
          fork={this.props.fork}>
        Earthquakes in the midwest
      </GalleryItem>
    );
  },
});

const Starter = () => ({
  render() {
    return (
      <GalleryItem csvURL="/forkable/starter.csv" 
          ipynbURL="/forkable/starter.ipynb" 
          fork={this.props.fork}>
        Starter notebook
      </GalleryItem>
    );
  },
});


const LandingPage = React.createClass({

  getStyles() {
    return this.isHidden() ? { display: "none"} : {};
  },

  isHidden() {
    return window.location.pathname !== "/";
  },

  render() {
      const styles = this.getStyles();
      return (
        <div style={styles} className="landing-page-container">
          <h1>Try a sample notebook</h1>
          <ul>
            <li><Quakes fork={this.props.fork} /></li>
            <li><MonteCarlo fork={this.props.fork} /></li>
            <li><Starter fork={this.props.fork} /></li>
          </ul>

          <h1>&hellip;or:</h1>
          <ul>
            <li><a href="/upload">Upload your own .ipynb and .csv</a></li>
            <li style={{ display: "none" }}><a href="#">New blank notebook</a></li>
          </ul>
        </div>
      );
  },
});

module.exports = LandingPage;