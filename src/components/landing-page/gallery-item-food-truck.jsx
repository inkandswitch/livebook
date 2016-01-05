let React = require("react");

let GalleryItem = require("./gallery-item");

let FoodTruck = React.createClass({
    render() {
        return (
          <GalleryItem csvURL="/forkable/mlex1.csv" 
              ipynbURL="/forkable/mlex1.ipynb" 
              clickHandler={this.props.clickHandler}>
              <header className="gallery-item-header">
                <div className="gallery-item-logo">
                  <img src="/img/food-truck.png" />
                </div>
                <div className="gallery-item-title">
                  <h3> Food Truck Stuff! </h3>
                  <p> by <span className="text-green"> Someone </span> </p>
                </div>
              </header>
              <footer className="gallery-item-footer">
                <i>
                  linear regression • numpy • scatter-charts
                </i>
              </footer>
              <figure className="gallery-item-preview">
                <img src="/img/food-truck-preview.png" />
              </figure>
          </GalleryItem>
        );
    },
});

module.exports = FoodTruck;