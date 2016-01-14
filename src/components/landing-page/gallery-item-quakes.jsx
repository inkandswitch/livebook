let React = require("react");

let GalleryItem = require("./gallery-item");

let Quakes = React.createClass({
    render() {
        return (
            <GalleryItem csvURL="/forkable/earthquake_states.csv" 
                ipynbURL="/forkable/earthquakes.ipynb" 
                clickHandler={this.props.clickHandler}>
              <header className="gallery-item-header">
                <div className="gallery-item-logo">
                  <img src="/img/oklahoma.png" />
                </div>
                <div className="gallery-item-title">
                  <h3> Midwest Earthquakes </h3>
                  <p> by John Templon </p>            
                </div>
              </header>
              <footer className="gallery-item-footer">
                <i>
                  110K record CSV • pandas • time-series data • line charts
                </i>
              </footer>
              <figure className="gallery-item-preview">
                <img src="/img/quakes-preview.png" />
              </figure>
            </GalleryItem>
        );
    },
});

module.exports = Quakes;