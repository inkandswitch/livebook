
## Skulpt 

In order to get Skulpt working in node.js and also in the browser I needed to do this...

This line here worked fine in the browser and also in the node REPL, but broke in webpacker and in a non-repl version of node.  It relies on `this` always being the global object.

```javascript
    var goog = goog || {};
    goog.global = this;
```

This version works well everywhere I've tested

```javascript
var goog = {};
goog.global = ((typeof global !== 'undefined' && global) || (typeof window !== 'undefined' && window) || this);
goog.global.goog = goog;
```

I changed the code by hand in skulpt.js.  If we move to a newer version of Skulpt we will need to hand copy this change over.  Possibly look into getting this change adopted upstream in Skulpt.

## Compiled JS 

Checked compiled js into the repo.  Shouldn't this be part of the buildpack?  Look into options.

## Go needs a Make command

In dev it's nice to use go run so we dont need a make command.  Had to drop that to work on heroku.  Custom build pack?

