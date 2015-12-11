let React = require("react");

let GalleryItem = require("./gallery-item");

let Waldo = React.createClass({
    render() {
        return (
          <GalleryItem csvURL="/forkable/waldo.csv" 
              ipynbURL="/forkable/waldo.ipynb" 
              clickHandler={this.props.clickHandler}>
              <header className="gallery-item-header">
                <div className="gallery-item-logo">
                  <img src="/img/waldo.png" />
                </div>
                <div className="gallery-item-title">
                  <h3> Here's Waldo </h3>
                  <p> by Randy Olson </p>            
                </div>
              </header>
              <footer className="gallery-item-footer">
                <i>
                  pathfinding • genetic algorithm • matplotlib
                </i>
              </footer>
              <figure className="gallery-item-preview">
                <img src="/img/waldo-preview.png" />
              </figure>
          </GalleryItem>
        );
    },
});

module.exports = Waldo;