(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.pixpipeUI = global.pixpipeUI || {})));
}(this, (function (exports) { 'use strict';

/**
 * by George MacKerron, mackerron.com
 *
 * Monotonic Cubic Spline:
 *
 *  adapted from:
 *     http://sourceforge.net/mailarchive/forum.php?thread_name=EC90C5C6-C982-4F49-8D46-A64F270C5247%40gmail.com&forum_name=matplotlib-users
 *     (easier to read at http://old.nabble.com/%22Piecewise-Cubic-Hermite-Interpolating-Polynomial%22-in-python-td25204843.html)
 *
 *  with help from:
 *      F N Fritsch & R E Carlson (1980) 'Monotone Piecewise Cubic Interpolation', SIAM Journal of Numerical Analysis 17(2), 238 - 246.
 *      http://en.wikipedia.org/wiki/Monotone_cubic_interpolation
 *      http://en.wikipedia.org/wiki/Cubic_Hermite_spline
 *
 *
 *  Natural and Clamped:
 *
 *  adapted from:
 *      http://www.michonline.com/ryan/csc/m510/splinepresent.html
 **/

var CubicSpline;
var MonotonicCubicSpline;


MonotonicCubicSpline = function () {
    function MonotonicCubicSpline(x, y) {

        var alpha, beta, delta, dist, i, m, n, tau, to_fix, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4;

        n = x.length;
        delta = [];
        m = [];
        alpha = [];
        beta = [];
        dist = [];
        tau = [];

        for (i = 0, _ref = n - 1; (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
            delta[i] = (y[i + 1] - y[i]) / (x[i + 1] - x[i]);
            if (i > 0) {
                m[i] = (delta[i - 1] + delta[i]) / 2;
            }
        }

        m[0] = delta[0];
        m[n - 1] = delta[n - 2];
        to_fix = [];

        for (i = 0, _ref2 = n - 1; (0 <= _ref2 ? i < _ref2 : i > _ref2); (0 <= _ref2 ? i += 1 : i -= 1)) {
            if (delta[i] === 0) {
                to_fix.push(i);
            }
        }

        for (_i = 0, _len = to_fix.length; _i < _len; _i++) {
            i = to_fix[_i];
            m[i] = m[i + 1] = 0;
        }

        for (i = 0, _ref3 = n - 1; (0 <= _ref3 ? i < _ref3 : i > _ref3); (0 <= _ref3 ? i += 1 : i -= 1)) {
            alpha[i] = m[i] / delta[i];
            beta[i] = m[i + 1] / delta[i];
            dist[i] = Math.pow(alpha[i], 2) + Math.pow(beta[i], 2);
            tau[i] = 3 / Math.sqrt(dist[i]);
        }


        to_fix = [];

        for (i = 0, _ref4 = n - 1; (0 <= _ref4 ? i < _ref4 : i > _ref4); (0 <= _ref4 ? i += 1 : i -= 1)) {
            if (dist[i] > 9) {
                to_fix.push(i);
            }
        }

        for (_j = 0, _len2 = to_fix.length; _j < _len2; _j++) {
            i = to_fix[_j];
            m[i] = tau[i] * alpha[i] * delta[i];
            m[i + 1] = tau[i] * beta[i] * delta[i];
        }

        this.x = x.slice(0, n);
        this.y = y.slice(0, n);
        this.m = m;
    }

    MonotonicCubicSpline.prototype.interpolate = function (x) {
        var h, h00, h01, h10, h11, i, t, t2, t3, y, _ref;

        for (i = _ref = this.x.length - 2; (_ref <= 0 ? i <= 0 : i >= 0); (_ref <= 0 ? i += 1 : i -= 1)) {
            if (this.x[i] <= x) {
                break;
            }
        }

        h = this.x[i + 1] - this.x[i];
        t = (x - this.x[i]) / h;
        t2 = Math.pow(t, 2);
        t3 = Math.pow(t, 3);
        h00 = 2 * t3 - 3 * t2 + 1;
        h10 = t3 - 2 * t2 + t;
        h01 = -2 * t3 + 3 * t2;
        h11 = t3 - t2;
        y = h00 * this.y[i] + h10 * h * this.m[i] + h01 * this.y[i + 1] + h11 * h * this.m[i + 1];

        return y;
    };

    return MonotonicCubicSpline;
}();


CubicSpline = function () {
    function CubicSpline(x, a, d0, dn) {

        var b, c, clamped, d, h, i, k, l, n, s, u, y, z, _ref;

        if (!((x != null) && (a != null))) {
            return;
        }

        clamped = (d0 != null) && (dn != null);
        n = x.length - 1;
        h = [];
        y = [];
        l = [];
        u = [];
        z = [];
        c = [];
        b = [];
        d = [];
        k = [];
        s = [];

        for (i = 0; (0 <= n ? i < n : i > n); (0 <= n ? i += 1 : i -= 1)) {
            h[i] = x[i + 1] - x[i];
            k[i] = a[i + 1] - a[i];
            s[i] = k[i] / h[i];
        }

        if (clamped) {
            y[0] = 3 * (a[1] - a[0]) / h[0] - 3 * d0;
            y[n] = 3 * dn - 3 * (a[n] - a[n - 1]) / h[n - 1];
        }

        for (i = 1; (1 <= n ? i < n : i > n); (1 <= n ? i += 1 : i -= 1)) {
            y[i] = 3 / h[i] * (a[i + 1] - a[i]) - 3 / h[i - 1] * (a[i] - a[i - 1]);
        }

        if (clamped) {
            l[0] = 2 * h[0];
            u[0] = 0.5;
            z[0] = y[0] / l[0];
        } else {
            l[0] = 1;
            u[0] = 0;
            z[0] = 0;
        }

        for (i = 1; (1 <= n ? i < n : i > n); (1 <= n ? i += 1 : i -= 1)) {
            l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * u[i - 1];
            u[i] = h[i] / l[i];
            z[i] = (y[i] - h[i - 1] * z[i - 1]) / l[i];
        }

        if (clamped) {
            l[n] = h[n - 1] * (2 - u[n - 1]);
            z[n] = (y[n] - h[n - 1] * z[n - 1]) / l[n];
            c[n] = z[n];
        } else {
            l[n] = 1;
            z[n] = 0;
            c[n] = 0;
        }

        for (i = _ref = n - 1; (_ref <= 0 ? i <= 0 : i >= 0); (_ref <= 0 ? i += 1 : i -= 1)) {
            c[i] = z[i] - u[i] * c[i + 1];
            b[i] = (a[i + 1] - a[i]) / h[i] - h[i] * (c[i + 1] + 2 * c[i]) / 3;
            d[i] = (c[i + 1] - c[i]) / (3 * h[i]);
        }

        this.x = x.slice(0, n + 1);
        this.a = a.slice(0, n);
        this.b = b;
        this.c = c.slice(0, n);
        this.d = d;
    }

    CubicSpline.prototype.derivative = function () {

        var c, d, s, x, _i, _j, _len, _len2, _ref, _ref2, _ref3;

        s = new this.constructor();
        s.x = this.x.slice(0, this.x.length);
        s.a = this.b.slice(0, this.b.length);
        _ref = this.c;

        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            c = _ref[_i];
            s.b = 2 * c;
        }
        _ref2 = this.d;

        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            d = _ref2[_j];
            s.c = 3 * d;
        }

        for (x = 0, _ref3 = this.d.length; (0 <= _ref3 ? x < _ref3 : x > _ref3); (0 <= _ref3 ? x += 1 : x -= 1)) {
            s.d = 0;
        }

        return s;
    };


    CubicSpline.prototype.interpolate = function (x) {

        var deltaX, i, y, _ref;

        for (i = _ref = this.x.length - 1; (_ref <= 0 ? i <= 0 : i >= 0); (_ref <= 0 ? i += 1 : i -= 1)) {
            if (this.x[i] <= x) {
                break;
            }
        }

        deltaX = x - this.x[i];
        y = this.a[i] + this.b[i] * deltaX + this.c[i] * Math.pow(deltaX, 2) + this.d[i] * Math.pow(deltaX, 3);

        return y;
    };

    return CubicSpline;
}();

var index = {
    CubicSpline: CubicSpline,
    MonotonicCubicSpline: MonotonicCubicSpline
};

/**
*
*/
class PointCollection {
  constructor(){
    this._points = [];

    this._min = {
      x: 0,
      y: 0,
    };

    this._max = {
      x: Infinity,
      y: Infinity
    };
  }


  /**
  * Define the acceptable min and max bot both axis.
  * @param {String} bound - can be "min" or "max"
  * @param {String} axis - can be "x" or "y"
  * @param {Number} value - a number
  * Note that minimum boudaries are inclusive while max are exclusive
  */
  setBoundary( bound, axis, value ){
    this["_" + bound][axis] = value;
  }

  /**
  *
  */
  add( p ){
    var newIndex = null;

    if(p.x >= this._min.x && p.x <= this._max.x && p.y >= this._min.y && p.y <= this._max.y)
    {

      if( !("xLocked" in p) )
        p.xLocked = false;

      if( !("yLocked" in p) )
        p.yLocked = false;

      if( !("safe" in p) )
        p.safe = false;

      // adding the point
      this._points.push( p );
      this._sortPoints();
      newIndex = this._points.indexOf( p );
    }
    return newIndex;
  }


  _sortPoints(){
    // sorting the array upon x
    this._points.sort(function(p1, p2) {
      return p1.x - p2.x;
    });
  }


  /**
  * Remove the points at the given index.
  * @param {Number} index - index of the point to remove
  * @return {Object} the point that was just removed or null if out of bound
  */
  remove( index ){
    var removedPoint = null;

    if(index >= 0 && index < this._points.length && !this._points[index].safe){
      removedPoint = this._points.splice(index, 1);
    }

    return removedPoint;
  }


  /**
  * Get the index within the collection of the point that is the closest from
  * the one given in argument. Returns also the euclidiant distance to this point.
  * @return {Object} like {index: Number, distance: Number}, or null if there is
  * no point in this collection.
  */
  getClosestFrom( p ){

    if(!this._points.length)
      return null;

    var closestDistance = Infinity;
    var closestPointIndex = null;

    for(var i=0; i<this._points.length; i++){
      var d = Math.sqrt( Math.pow(p.x - this._points[i].x, 2) + Math.pow(p.y - this._points[i].y, 2) );

      if( d < closestDistance ){
        closestDistance = d;
        closestPointIndex = i;
      }
    }

    return {
      index: closestPointIndex,
      distance: closestDistance
    }
  }


  /**
  * Gets the point at such index
  * @param {Number} index - the index of the point we want
  * @return {Object} point that contains at least "x" and "y" properties.
  */
  getPoint( index ){
    if(index > 0 && index < this._points.length){
      return this._points[index];
    }else{
      return null;
    }
  }


  /**
  * Get the number of points in the collection
  * @return {Number} the number of points
  */
  getNumberOfPoints(){
    return this._points.length;
  }


  /**
  * Update the posiiton of an existing point
  * @param {Number} index - index of the existing point to update
  * @param {Object} p - point that has coord we want to use as new coord. x and y values will be copied, no pointer association
  * @return {Number} new index, the changed point may have changed its index among the x-ordered list
  */
  updatePoint( index, p ){
    var newIndex = index;

    if(index >= 0 && index < this._points.length){
      if(p.x >= this._min.x && p.x < this._max.x && p.y >= this._min.y && p.y < this._max.y){

        if(!this._points[index].xLocked)
          this._points[index].x = p.x;

        if(!this._points[index].yLocked)
          this._points[index].y = p.y;

        var thePointInArray = this._points[index];
        this._sortPoints();

        // the point may have changed its index
        newIndex = this._points.indexOf( thePointInArray );
      }
    }

    return newIndex;
  }


  /**
  * Get all "x" coordinates of the collection as an array of Number
  * @return {Array} of Number
  */
  getXseries(){
    var xSeries = [];
    for(var i=0; i<this._points.length; i++){
      xSeries.push( this._points[i].x );
    }
    return xSeries;
  }


  /**
  * Get all "y" coordinates of the collection as an array of Number
  * @return {Array} of Number
  */
  getYseries(){
    var ySeries = [];
    for(var i=0; i<this._points.length; i++){
      ySeries.push( this._points[i].y );
    }
    return ySeries;
  }

} /* END of class PointCollection */

/*
* Author    Jonathan Lurie - http://me.jonahanlurie.fr
* License   MIT
* Link      https://github.com/jonathanlurie/es6module
* Lab       MCIN - http://mcin.ca/ - Montreal Neurological Institute
*/

/**
* events:
*   - "move" called everytime the pointer moves a point, with argument x and y normalized arrays
*   - "released" called everytime the pointers is released after moving a point, with argument x and y normalized arrays
*/
class CanvasSpliner {

  /**
  * @param {String} splineType - "natural" or "monotonic" 
  */
  constructor(parentID, width, height, splineType = 'natural'){
    // some styling

    // borders of the canvas element
    this._borderStyle = {
      in: "1px solid #d3d3ff",
      out: "1px solid #e3e3e3"
    };

    // radius of the control points
    this._controlPointRadius = {
      idle: 6,
      grabed: 12
    };

    // color of the control points
    this._controlPointStyle = {
      idle: "rgba(255, 0, 0, 0.5)",
      hovered: "rgba(0, 0, 255, 0.5)",
      grabed: "rgba(0, 200, 0, 0.5)"
    };

    // style of the curve
    this._curveStyle = {
      idle: 'rgba(0, 128, 255, 1)',
      moving: 'rgba(255, 128, 0, 1)'
    };

    this._curveThickness = {
      idle: 1,
      moving: 2
    };

    this._mouse = null;
    this._pointHoveredIndex = -1; // index of the grabed point. -1 if none
    this._pointGrabedIndex = -1;
    this._mouseDown = false; // says if the mouse is maintained clicked

    this._canvas = null;
    this._ctx = null;

    this._screenRatio = window.devicePixelRatio;

    var parentElem = document.getElementById(parentID);

    // abort if parent div does not exist
    if(!parentElem)
      return;

    // creating the canvas
    this._canvas = document.createElement('canvas');
    this._canvas.width  = width;
    this._canvas.height = height;
    this._canvas.setAttribute("tabIndex", 1);
    this._canvas.style.outline = "none";
    this._canvas.style.cursor = "default";
    this._canvas.style.border = this._borderStyle.out;
    this._canvas.onselectstart = function () { return false; };
    this._width = width;
    this._height = height;

    // adding the canvas to the parent div
    parentElem.appendChild(this._canvas);

    this._ctx = this._canvas.getContext("2d");
    //this._ctx.scale( 1.1, 1.1)
    this._ctx.scale( this._screenRatio , this._screenRatio );

    // init the mouse and keyboard events
    this._canvas.addEventListener('mousemove', this._onCanvasMouseMove.bind(this), false);
    this._canvas.addEventListener('mousedown', this._onCanvasMouseDown.bind(this), false);
    this._canvas.addEventListener('mouseup', this._onCanvasMouseUp.bind(this), false);
    this._canvas.addEventListener('dblclick', this._onCanvasMouseDbclick.bind(this), false);
    this._canvas.addEventListener('mouseleave', this._onCanvasMouseLeave.bind(this), false);
    this._canvas.addEventListener('mouseenter', this._onCanvasMouseEnter.bind(this), false);
    this._canvas.addEventListener( 'keyup', this._onKeyUp.bind(this), false );
    //this._canvas.addEventListener( 'keydown', this._onKeyDown.bind(this), false );

    // dealing with cubic spline type
    this._splineConstructor = index.CubicSpline;
    if(splineType === "monotonic"){
      this._splineConstructor = index.MonotonicCubicSpline;
    }

    // the point collection
    this._pointCollection = new PointCollection();
    this._pointCollection.setBoundary("max", "x", width);
    this._pointCollection.setBoundary("max", "y", height);
    
    // interpolated values in a buffer
    this._xSeriesInterpolated = new Array(this._width).fill(0);
    this._ySeriesInterpolated = new Array(this._width).fill(0);
    
    // events
    this._onEvents = {
      move: null,
      released: null
    };
  }


  /**
  * @param {String} splineType - "natural" or "monotonic" 
  */
  setSplineType( splineType ){
    this._splineConstructor = monot_spline.CubicSpline;
    if(splineType === "monotonic"){
      this._splineConstructor = monot_spline.MonotonicCubicSpline;
    }
  }

  /**
  *
  */
  _updateMousePosition(evt) {
    var rect = this._canvas.getBoundingClientRect();

    this._mouse = {
      x: evt.clientX - rect.left,
      y: this._height - (evt.clientY - rect.top)
    };
  }


  /**
  * [EVENT] [PRIVATE]
  * for when the mouse is moving over the canvas
  */
  _onCanvasMouseMove(evt){
    this._updateMousePosition(evt);
    //console.log( 'moving: ' + this._mouse.x + ',' + this._mouse.y );

    // check what control point is the closest from the pointer position
    var closestPointInfo = this._pointCollection.getClosestFrom( this._mouse );

    // no point is currently grabbed
    if(this._pointGrabedIndex == -1){
      // the pointer hovers a point
      if( closestPointInfo.distance <= this._controlPointRadius.idle){
        this._pointHoveredIndex = closestPointInfo.index;
      }
      // the pointer does not hover a point
      else{
        this._pointHoveredIndex = -1;
      }

    }
    // a point is grabbed
    else{
      this._pointGrabedIndex = this._pointCollection.updatePoint( this._pointGrabedIndex, this._mouse );
      this._pointHoveredIndex = this._pointGrabedIndex;
    }

    // reduce usless drawing
    if( this._pointHoveredIndex != -1 || this._pointGrabedIndex != -1){ 
      this.draw();
    }
    
    
    // now the buffer is filled (after draw)
    if( this._pointGrabedIndex != -1 ){
      
      if(this._onEvents.move)
        this._onEvents.move( this._xSeriesInterpolated, this._ySeriesInterpolated );
      
    }
    
  }




  /**
  * [EVENT] [PRIVATE]
  * for when the mouse is clicked over the canvas
  */
  _onCanvasMouseDown(evt){
    console.log( 'down ');
    this._mouseDown = true;

    if( this._pointHoveredIndex != -1 ){
      console.log("grabing a point");
      this._pointGrabedIndex = this._pointHoveredIndex;
    }
  }


  /**
  * [EVENT] [PRIVATE]
  * for when the mouse is released over the canvas
  */
  _onCanvasMouseUp(evt){
    console.log( 'up ' );  
    var aPointWasGrabed = (this._pointGrabedIndex != -1);
    this._mouseDown = false;
    this._pointGrabedIndex = -1;

    this.draw();
    
    if(this._onEvents.released && aPointWasGrabed)
      this._onEvents.released( this._xSeriesInterpolated, this._ySeriesInterpolated );
  }

  
  _onCanvasMouseDbclick(evt){
    console.log("dbclick");
    this._canvas.focus();

    if(this._pointHoveredIndex == -1 ){
      var index$$1 = this.add( {x: this._mouse.x / this._width, y: this._mouse.y / this._height} );
      this._pointHoveredIndex = index$$1;
    }else{
      this.remove( this._pointHoveredIndex );
      this._pointHoveredIndex = -1;
      this._pointGrabedIndex = -1;
    }

  }

  /**
  * [EVENT] [PRIVATE]
  * for when the mouse is leaving the canvas
  */
  _onCanvasMouseLeave(evt){
    this._mouse = null;
    console.log( "leave" );
    this._canvas.blur();
    this._canvas.style.border = this._borderStyle.out;

    this._mouseDown = false;
    this._pointGrabedIndex = -1;
    this._pointHoveredIndex = -1;

    this.draw();
  }


  /**
  * [EVENT] [PRIVATE]
  * The mouse enters the canvas
  */
  _onCanvasMouseEnter(evt){
    console.log("enter");
    this._canvas.focus();
    this._canvas.style.border = this._borderStyle.in;
  }


  /**
  * [EVENT] [PRIVATE]
  * A keyboard key is released
  */
  _onKeyUp(evt){
    // mouse must be inside
    if(! this._mouse)
      return;

    console.log("pressed: " + evt.key);

    switch (evt.key) {
      case "d":
        this.remove( this._pointHoveredIndex );
        break;
      default:

    }
  }



  /**
  * Add a point to the collection
  * @param {Object} pt - of type {x: Number, y: Number} and optionnally the boolean properties "xLocked" and "yLocked". x and y must be in [0, 1]
  */
  add( pt, draw = true ){
    var index$$1 = null;

    if("x" in pt && "y" in pt){
      pt.x *= this._width;
      pt.y *= this._height;
      index$$1 = this._pointCollection.add( pt );
      console.log("a point is added");
    }

    if( draw ){
      this.draw();
    }

    return index$$1;
  }


  remove( index$$1 ){
    this._pointCollection.remove( index$$1 );
    this.draw();
  }

  draw(){
    this._ctx.clearRect(0, 0, this._width, this._height);

    this._drawData();
  }


  _drawData( curve = true, control = true){
    var xSeries = this._pointCollection.getXseries();
    var ySeries = this._pointCollection.getYseries();

    if(!xSeries.length)
      return;

    // drawing the curve
    if( curve ){

      console.log("draw curve");

      this._ctx.beginPath();
      this._ctx.moveTo(xSeries[0] / this._screenRatio, (this._height - ySeries[0]) / this._screenRatio);

      var splineInterpolator = new this._splineConstructor(xSeries, ySeries);
      this._xSeriesInterpolated.fill(0);
      this._ySeriesInterpolated.fill(0);
      
      for(var x=0; x<Math.ceil(xSeries[0]); x++){
        var y = ySeries[0];
        
        // copying the inteprolated values in a buffer
        this._xSeriesInterpolated[x] = x / this._width;
        this._ySeriesInterpolated[x] = y / this._height;
        
        // adjusting y for visual purpose
        y = y < 0 ? 0.5 : y > this._height ? this._height - 0.5 : y;
        this._ctx.lineTo(x/this._screenRatio, (this._height - y)/this._screenRatio);
      }
      
      for(var x=Math.ceil(xSeries[0]); x<Math.ceil(xSeries[ xSeries.length - 1]); x++){
        var y = splineInterpolator.interpolate(x);
        
        // copying the inteprolated values in a buffer
        this._xSeriesInterpolated[x] = x / this._width;
        this._ySeriesInterpolated[x] = y / this._height;
        
        // adjusting y for visual purpose
        y = y < 0 ? 0.5 : y > this._height ? this._height - 0.5 : y;
        this._ctx.lineTo(x/this._screenRatio, (this._height - y)/this._screenRatio);
      }
      
      
      for(var x=Math.ceil(xSeries[xSeries.length - 1]); x<this._width; x++){
        var y = ySeries[ySeries.length - 1];
        
        // copying the inteprolated values in a buffer
        this._xSeriesInterpolated[x] = x / this._width;
        this._ySeriesInterpolated[x] = y / this._height;
        
        // adjusting y for visual purpose
        y = y < 0 ? 0.5 : y > this._height ? this._height - 0.5 : y;
        this._ctx.lineTo(x/this._screenRatio, (this._height - y)/this._screenRatio);
      }
      

      this._ctx.strokeStyle = this._curveStyle.idle;
      this._ctx.lineWidth = this._curveThickness.idle / this._screenRatio;
      this._ctx.stroke();
      this._ctx.closePath();
    }

    // drawing the control points
    if( control ){
      // control points
      for(var i=0; i<xSeries.length; i++){
        this._ctx.beginPath();

        this._ctx.arc(
          xSeries[i]/this._screenRatio,
          (this._height - ySeries[i]) / this._screenRatio,
          this._controlPointRadius.idle/this._screenRatio,
          0,
          2*Math.PI
        );

        // drawing a point that is neither hovered nor grabed
        if( this._pointHoveredIndex == -1 ){
          this._ctx.fillStyle = this._controlPointStyle.idle;
        }else{
          // drawing a point that is hovered or grabed
          if( i == this._pointHoveredIndex){

            // the point is grabed
            if( this._mouseDown ){
              this._ctx.fillStyle = this._controlPointStyle.grabed;
            }
            // the point is hovered
            else{
              this._ctx.fillStyle = this._controlPointStyle.hovered;
            }

          }else{
            this._ctx.fillStyle = this._controlPointStyle.idle;
          }
        }



        this._ctx.fill();
        this._ctx.closePath();
      }
    }

  }


  getValue( x ){
    var xSeries = this._pointCollection.getXseries();
    var ySeries = this._pointCollection.getYseries();
    var splineInterpolator = new this._splineConstructor(xSeries, ySeries);
    return splineInterpolator.interpolate( x )
    //return spline(x, xSeries, ySeries);
  }

  
  on( eventName, callback ){
    this._onEvents[ eventName ] = callback;
  }


} /* END of class CanvasSpliner */





// Note: we chose not to export PointCollection

exports.CanvasSpliner = CanvasSpliner;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=CanvasSpliner.js.map
