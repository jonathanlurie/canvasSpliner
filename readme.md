[DEMO 1](http://me.jonathanlurie.fr/canvasSpliner/) - 
[DEMO 2](http://me.jonathanlurie.fr/canvasSpliner/examples/)

# Features
- create a nice canvas-based spline editor widget
- add/remove points both programmatically and with the UI
- interpolate points using cubic splines the graphic way (a-la Photoshop)
- use both natural cubic splines and monotonic cubic splines
- use unit coordinates
- programmatically get single interpolated values (as Numbers) or along the whole x axis (as an Array)
- no dependency
- Retina automatically adjusted
- *lock* a point over the x and/or the y axis when adding programmatically
- make a point *safe* when adding programmatically so that it cannot be removed

# How to install
Directly in the browser:
```html
<script src="dist/CanvasSpliner.min.js"></script>
```

Or with a bundler
```bash
npm install --save jonathanlurie/CanvasSpliner
```

# how to use

```javascript
// create a new CanvasSpliner, with a parent DIV id, a width and a heigh
var cs = new CanvasSpliner("parent", 300, 300);

// Optional: Add points (with unit coordinates)
cs.add( {x:0, y: 0, xLocked: true, yLocked: true, safe: true} );
cs.add( {x:0.1, y: 0.4} );
cs.add( {x:0.3, y: 0.45} );
cs.add( {x:0.6, y: 1} );
cs.add( {x:1, y: 0.6, xLocked: true, safe: true} );
```

## Adding points programmatically
As shown above, we can add points directly from the code. Those points can have other attributes than *(x, y)* coordinates.
- we can lock a point so that it does not move along the *x* axis:
```javascript
s.add( {x:0.1, y: 0.5, xLocked: true} );
```
- we can lock a point so that it does not move along the *y* axis:
```javascript
s.add( {x:0.12, y: 0.6, yLocked: true} );
```
- We can make a point *safe* so that the user cannot remove it with a *double-click*:
```javascript
s.add( {x:0.8, y: 0.4, safe: true} );
```
- We could also use all that together:
```javascript
cs.add( {x:0.4, y: 0.1, xLocked: true, yLocked: true, safe: true} );
```

## What kind of cubic spline to use?
CanvasSpliner allows two kinds of cubic spline: [natural](https://www.math.ntnu.no/emner/TMA4215/2008h/cubicsplines.pdf) and [monotonic](https://pdfs.semanticscholar.org/1664/13fd0aafcfda08f1af133e10301aa64fd960.pdf). The math behind does not matter, just remember the *natural* is a bit curvyer and the *monotonic* is a bit stiffer. You can enable one mode or the other two diferent ways:
- with the constructor optional last argument:
```javascript
var cs = new CanvasSpliner("parent", 300, 300, "natural");
```
Note that this is the default mode when the argument is omited.

- with the setter
```javascript
cs.setSplineType( "monotonic" );
// or
cs.setSplineType( "natural" );
```

## Control the UI
- **click on a point**: it is selected, you can move it (unless it is `xLocked` or `yLocked`)
- **double click on a point**: deletes it (unless it is `safe`)
- **double click somewhere else in the canvas**: adds a point

## Other methods
Get an interpolated value, in unit coordinates:
```javascript
var interpolatedY = cs.getValue( 0.15 );
```

Get all the spectrum of *x* coordinates, in a normalized space:
```javascript
var arrayOfX = cs.getXSeriesInterpolated();
```
Note that if your canvas is 500px wide, you will get 500 values from 0 to 1 with regular spacing.

Along with this regular *x* go the interpolated *y* array:
```javascript
var interpolatedYs = cs.getYSeriesInterpolated();
```


## Events
CanvasSpliner can trigger two events:
- When grabbing a point and moving it, called at every *mousemove* event
```javascript
cs.on( "move", function(xInterpolated, yInterpolated){
  // here, the argument xInterpolated and yInterpolated
  // are the same as if doing:
  // cs.getXSeriesInterpolated() and
  // cs.getYSeriesInterpolated()
})
```
- When a point was grabed but id just released
```javascript
cs.on( "released", function(xInterpolated, yInterpolated){
  // here, the argument xInterpolated and yInterpolated
  // are the same as if doing:
  // cs.getXSeriesInterpolated() and
  // cs.getYSeriesInterpolated()
})
```

## Styling
If you want to adapt the styling of CanvasSpliner to match you own project, you can.
- Change the size of the control point with a number of pixels:
```javascript
cs.setControlPointRadius( 6 )
```

- Set the color of the control points, depending on the state. The state can be "idle", "hovered" or "grabbed" and the color must be a css-like string (ie. "rgba(244, 66, 167, 0.5)")
```javascript
cs.setControlPointColor( state, color )
```

- Set the color of the curve, depending on its state. The state can be "idle" or "moving" and the color must be a css-like string (ie. "rgba(244, 66, 167, 0.5)")
```javascript
cs.setCurveColor( state, color )
```

- Set the color of the grid with a css-like string (ie. "rgba(244, 66, 167, 0.5)")
```javascript
cs.setGridColor( color )
```

- Set the step of the grid (both horizontal and vertical) in normalized size ( in [0, 1])
```javascript
cs.setGridStep( gs )
```

- Set the color of the text with a css-like string (ie. "rgba(244, 66, 167, 0.5)")
```javascript
cs.setTextColor( color )
```

- Set the thickness of the curve in pixel
```javascript
cs.setCurveThickness( t )
```

- Set the color of the background with a css-like string (ie. "rgba(244, 66, 167, 0.5)") of set it to `null` / `false` or `0` to have a transparent background.
```javascript
cs.setBackgroundColor( color )
```

# Bundled in this module
CanvasSpliner uses [George MacKerron](http://mackerron.com/home/)'s [splines](http://blog.mackerron.com/2011/01/01/javascript-cubic-splines/), wrapped in a [propper npm package](https://github.com/edgebr/splines) by [Marcio Augusto Guimarães](https://github.com/marcioaug).
