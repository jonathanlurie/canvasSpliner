# how to use

```javascript
// create a new CanvasSpliner, with a parent DIV id, a width and a heigh
var cs = new CanvasSpliner("parent", 300, 300);

// Add points, with unit coordinates
cs.add( {x:0, y: 0, xLocked: true, yLocked: true, safe: true} );
cs.add( {x:0.1, y: 0.4} );
cs.add( {x:0.3, y: 0.45} );
cs.add( {x:0.6, y: 1} );
cs.add( {x:1, y: 0.6, xLocked: true, safe: true} );

/*
for each point we have:
  x: its position on x axis
  y: its position on y axis
  xLocked: cannot be dragged along x axis when true
  yLocked: cannot be dragged along y axis when true
  safe: cannot be deleted when hovering and pressing "d"
*/

```

Other usage:
Get the interpolated value for a given `x`:
```javascript
...
var interpolatedVal = cs.getValue( 0.123 )
...
```

## Controls
- **click on a point**: it is selected, you can move it (unless it is `xLocked` or `yLocked`)
- **double click on a point**: deletes it (unless it is `safe`)
- **double click somewhere else in the canvas**: add a point

# TODO
- Add a way to get a large sample of interpolated values
- add custom callbacks when moving/creating/deleting/mouserelease the points
- make styling accessible
- Make a nice bundle

# other infos
cubic-spline-browser.js is browserified from https://github.com/morganherlocker/cubic-spline using

```bash
browserify cubic-spline.js -s spline  -o cubic-spline-browser.jsbrowserify cubic-spline.js -s spline  -o cubic-spline-browser.js
```
