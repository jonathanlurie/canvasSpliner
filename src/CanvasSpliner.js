/*
* Author    Jonathan Lurie - http://me.jonahanlurie.fr
* License   MIT
* Link      https://github.com/jonathanlurie/es6module
* Lab       MCIN - http://mcin.ca/ - Montreal Neurological Institute
*/

import splines from 'splines'
import MonotonicCubicSpline from 'splines'
import { PointCollection } from './PointCollection.js'


/**
* events:
*   - "movePoint" called everytime the pointer moves a point, with argument x and y normalized arrays
*   - "releasePoint" called everytime the pointers is released after moving a point, with argument x and y normalized arrays
*   - "pointAdded"
*/
class CanvasSpliner {

  /**
  * @param {Object} parentContainer - can be a String: the ID of the parent DIV, or can be directly the DOM element that will host the CanvasSpliner
  * @param {Number} width - width of the canvas where CanvasSpliner draws 
  * @param {Number} height - height of the canvas where CanvasSpliner draws
  * @param {String} splineType - "natural" or "monotonic"
  */
  constructor(parentContainer, width, height, splineType = 'natural'){
    // some styling

    // borders of the canvas element
    this._borderStyle = {
      in: "1px solid #d3d3ff",
      out: "1px solid #e3e3e3"
    }

    // radius of the control points
    this._controlPointRadius = 8;

    // color of the control points
    this._controlPointColor = {
      idle: "rgba(244, 66, 167, 0.5)",
      hovered: "rgba(0, 0, 255, 0.5)",
      grabbed: "rgba(0, 200, 0, 0.5)"
    }

    // style of the curve
    this._curveColor = {
      idle: 'rgba(0, 128, 255, 1)',
      moving: 'rgba(255, 128, 0, 1)'
    }
    
    // color of the grid
    this._gridColor = "rgba(0, 0, 0, 0.3)";
    
    // color of the text
    this._textColor = "rgba(0, 0, 0, 0.1)";

    // thickness of the curve
    this._curveThickness = 1;
    
    // color of the background
    this._backgroundColor = false;
    

    this._mouse = null;
    this._pointHoveredIndex = -1; // index of the grabbed point. -1 if none
    this._pointGrabbedIndex = -1;
    this._mouseDown = false; // says if the mouse is maintained clicked

    this._canvas = null;
    this._ctx = null;

    this._screenRatio = window.devicePixelRatio;

    var parentElem = null;
    
    if (typeof parentContainer === 'string' || parentContainer instanceof String){
      parentElem = document.getElementById( parentContainer );
    }else{
      parentElem = parentContainer;
    }
    
    
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
    this._canvas.onselectstart = function () { return false; }
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
    this._splineConstructor = splines.CubicSpline;
    if(splineType === "monotonic"){
      this._splineConstructor = splines.MonotonicCubicSpline;
    }

    // the point collection
    this._pointCollection = new PointCollection();
    this._pointCollection.setBoundary("max", "x", width);
    this._pointCollection.setBoundary("max", "y", height);

    // interpolated values in a buffer
    this._xSeriesInterpolated = new Float32Array(this._width).fill(0);
    this._ySeriesInterpolated = new Float32Array(this._width).fill(0);

    this._gridStep = 1/3;

    // events
    this._onEvents = {
      movePoint: null,
      releasePoint: null,
      pointAdded: null
    };
    
    this.draw();
  }

  
  /**
  * Get an array of all the x coordinates that CanvasSpliner computed an interpolation of.
  * See getYSeriesInterpolated to get the corresponding interpolated values.
  * @return {Array} of x values with regular interval in [0, 1]
  */
  getXSeriesInterpolated(){
    return this._xSeriesInterpolated;
  }
  
  
  /**
  * Get all the interpolated values for each x given by getXSeriesInterpolated.
  * @return {Array} of interpolated y
  */
  getYSeriesInterpolated(){
    return this._ySeriesInterpolated;
  }
  
  /**
  * Change the radius of the control points
  * @param {Number} r - the radius in pixel
  */
  setControlPointRadius( r ){
    this._controlPointRadius = r;
  }
  
  
  /**
  * Set the color of the control point in a specific state
  * @param {String} state - must be one of: "idle", "hovered" or "grabbed"
  * @param {String} color - must be css style best is of form "rgba(244, 66, 167, 0.5)"
  */
  setControlPointColor( state, color ){
    this._controlPointColor[ state ] = color;
  }
  
  /**
  * Set the color of the curve in a specific state
  * @param {String} state - must be one of: "idle" or "moving"
  * @param {String} color - must be css style best is of form "rgba(244, 66, 167, 0.5)"
  */
  setCurveColor( state, color ){
    this._curveColor[ state ] = color;
  }


  /**
  * Set the color of the grid
  * @param {String} color - must be css style best is of form "rgba(244, 66, 167, 0.5)"
  */
  setGridColor( color ){
    this._gridColor = color;
  }

  /**
  * Define the grid step in unit coodinate. Default: 0.33
  * @param {Number}
  */
  setGridStep( gs ){
    if( gs<=0 || gs >=1){
      this._gridStep = 0;
    }else{
      this._gridStep = gs;
    }

    this.draw();
  }
  
  
  /**
  * Set the color of the text
  * @param {String} color - must be css style best is of form "rgba(244, 66, 167, 0.5)"
  */
  setTextColor( color ){
    this._textColor = color;
  }
  
  
  /**
  * Define the thickness of the curve
  * @param {Number} t - thickness in pixel
  */
  setCurveThickness( t ){
    this._curveThickness = t;
  }

  
  /**
  * Define the canvas background color
  * @param {String} color - must be css style best is of form "rgba(244, 66, 167, 0.5)" 
  * Can allso be null/0/false to leave a blank background
  */
  setBackgroundColor( color ){
    this._backgroundColor = color;
  }
  

  /**
  * @param {String} splineType - "natural" or "monotonic"
  */
  setSplineType( splineType ){
    if(splineType === "monotonic"){
      this._splineConstructor = splines.MonotonicCubicSpline;
    }else{
      this._splineConstructor = splines.CubicSpline;
    }
  }


  /**
  * [PRIVATE]
  * Refresh the position of the pointer we store internally (relative to the canvas)
  */
  _updateMousePosition(evt) {
    var rect = this._canvas.getBoundingClientRect();

    this._mouse = {
      x: evt.clientX - rect.left,
      y: this._height - (evt.clientY - rect.top)
    }
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
    
    if(!closestPointInfo)
      return;

    // no point is currently grabbed
    if(this._pointGrabbedIndex == -1){
      // the pointer hovers a point
      if( closestPointInfo.distance <= this._controlPointRadius){
        this._pointHoveredIndex = closestPointInfo.index;
      }
      // the pointer does not hover a point
      else{
        // ... but maybe it used to hove a point, in this case we want to redraw
        // to change back the color to idle mode
        var mustRedraw = false;
        if( this._pointHoveredIndex != -1)
          mustRedraw = true;
          
        this._pointHoveredIndex = -1;
        
        if(mustRedraw)
          this.draw();
          
      }

    }
    // a point is grabbed
    else{
      this._pointGrabbedIndex = this._pointCollection.updatePoint( this._pointGrabbedIndex, this._mouse )
      this._pointHoveredIndex = this._pointGrabbedIndex;

    }

    // reduce usless drawing
    if( this._pointHoveredIndex != -1 || this._pointGrabbedIndex != -1){
      this.draw();

    }


    // now the buffer is filled (after draw)
    if( this._pointGrabbedIndex != -1 ){
      var grabbedPoint = this._pointCollection.getPoint( this._pointGrabbedIndex );
      this._drawCoordinates(
        Math.round((grabbedPoint.x / this._width)*1000 ) / 1000,
        Math.round((grabbedPoint.y/this._height)*1000 ) / 1000
      );

      if(this._onEvents.movePoint)
        this._onEvents.movePoint( this );

    }

  }




  /**
  * [EVENT] [PRIVATE]
  * for when the mouse is clicked over the canvas
  */
  _onCanvasMouseDown(evt){
    //console.log( 'down ');
    this._mouseDown = true;

    if( this._pointHoveredIndex != -1 ){
      //console.log("grabing a point");
      this._pointGrabbedIndex = this._pointHoveredIndex
    }
  }


  /**
  * [EVENT] [PRIVATE]
  * for when the mouse is released over the canvas
  */
  _onCanvasMouseUp(evt){
    //console.log( 'up ' );
    var aPointWasGrabbed = (this._pointGrabbedIndex != -1)
    this._mouseDown = false;
    this._pointGrabbedIndex = -1;

    this.draw();

    if(this._onEvents.releasePoint && aPointWasGrabbed)
      this._onEvents.releasePoint( this );
  }


  /**
  * [EVENT] [PRIVATE]
  * for when we double click on the canvas
  */
  _onCanvasMouseDbclick(evt){
    //console.log("dbclick");
    this._canvas.focus();

    if(this._pointHoveredIndex == -1 ){
      var index = this.add( {x: this._mouse.x / this._width, y: this._mouse.y / this._height} );
      this._pointHoveredIndex = index;
    }else{
      this.remove( this._pointHoveredIndex );
      this._pointHoveredIndex = -1;
      this._pointGrabbedIndex = -1;
    }

  }


  /**
  * [EVENT] [PRIVATE]
  * for when the mouse is leaving the canvas
  */
  _onCanvasMouseLeave(evt){
    this._mouse = null;
    //console.log( "leave" );
    this._canvas.blur();
    this._canvas.style.border = this._borderStyle.out;

    this._mouseDown = false;
    this._pointGrabbedIndex = -1;
    this._pointHoveredIndex = -1;

    this.draw();
  }


  /**
  * [EVENT] [PRIVATE]
  * The mouse enters the canvas
  */
  _onCanvasMouseEnter(evt){
    //console.log("enter");
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

    //console.log("pressed: " + evt.key);

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
    var index = null;

    if("x" in pt && "y" in pt){
      pt.x *= this._width;
      pt.y *= this._height;
      index = this._pointCollection.add( pt );
      //console.log("a point is added");
    }

    if( draw ){
      this.draw();
    }
    
    if(this._onEvents.pointAdded)
      this._onEvents.pointAdded( this );

    return index;
  }


  /**
  * Remove a point using its index
  * @param {Number} index - index of the point to remove (from left to right, starting at 0)
  */
  remove( index ){
    var removedPoint = this._pointCollection.remove( index );
    this.draw();
    
    if(this._onEvents.pointRemoved)
      this._onEvents.pointRemoved( this );
  }


  /**
  * Draw the whole canvas
  */
  draw(){
    this._ctx.clearRect(0, 0, this._width, this._height);
    this._fillBackground();
    this._drawGrid();
    this._drawData();
  }
  
  
  /**
  * [PRIVATE]
  * Paint the background with a given color
  */
  _fillBackground(){
    if(! this._backgroundColor)
      return;
    
    this._ctx.beginPath();
    this._ctx.rect(0, 0, this._width, this._height);
    this._ctx.fillStyle = this._backgroundColor;
    this._ctx.fill();
  }


  /**
  * [PRIVATE]
  * Display xy coordinates on the upper left corner
  */
  _drawCoordinates(x, y){
    var textSize = 14 / this._screenRatio;
    this._ctx.fillStyle = this._textColor;
    this._ctx.font = textSize + "px courier";
    this._ctx.fillText("x: " + x, 10/this._screenRatio, 20/this._screenRatio);
    this._ctx.fillText("y: " + y, 10/this._screenRatio, 35/this._screenRatio);
  }


  /**
  * [PRIVATE]
  * Draw the background grid
  */
  _drawGrid(){
    var step = this._gridStep;

    if( step == 0)
      return;

    // horitontal grid
    this._ctx.beginPath();
    this._ctx.moveTo(0, 0);

    for(var i=step*this._height/this._screenRatio; i<this._height/this._screenRatio; i += step*this._height/this._screenRatio){
      this._ctx.moveTo(0, Math.round(i) + 0.5/this._screenRatio);
      this._ctx.lineTo(this._width ,Math.round(i) + 0.5/this._screenRatio );
    }

    this._ctx.moveTo(0, 0);
    for(var i=step*this._width/this._screenRatio; i<this._width/this._screenRatio; i += step*this._width/this._screenRatio){
      this._ctx.moveTo(Math.round(i) + 0.5/this._screenRatio, 0);
      this._ctx.lineTo(Math.round(i) + 0.5/this._screenRatio , this._height );
    }

    this._ctx.strokeStyle = this._gridColor;
    this._ctx.lineWidth = 0.5;
    this._ctx.stroke();
    this._ctx.closePath()
  }


  /**
  * [PRIVATE]
  * Draw the data on the canvas
  * @param {Boolean} curve - whether or not we draw the curve
  * @param {Boolean} control - whether or not we draw the control points
  */
  _drawData( curve = true, control = true){
    var xSeries = this._pointCollection.getXseries();
    var ySeries = this._pointCollection.getYseries();
    var w = this._width;
    var h = this._height;
    
    if(!xSeries.length)
      return;

    // drawing the curve
    if( curve ){

      //console.log("draw curve");

      this._ctx.beginPath();
      this._ctx.moveTo(xSeries[0] / this._screenRatio, (h - ySeries[0]) / this._screenRatio);

      var splineInterpolator = new this._splineConstructor(xSeries, ySeries);
      this._xSeriesInterpolated.fill(0);
      this._ySeriesInterpolated.fill(0);

      // before the first point (if not at the left of the canvas)
      for(var x=0; x<Math.ceil(xSeries[0]); x++){
        var y = ySeries[0]

        // copying the inteprolated values in a buffer
        this._xSeriesInterpolated[x] = x / w;
        this._ySeriesInterpolated[x] = y / h;

        // adjusting y for visual purpose
        y = y < 0 ? 0.5 : y > h ? h - 0.5 : y;
        this._ctx.lineTo(x/this._screenRatio, (h - y)/this._screenRatio);
      }

      // between the first and the last point
      for(var x=Math.ceil(xSeries[0]); x<Math.ceil(xSeries[ xSeries.length - 1]); x++){
        var y = splineInterpolator.interpolate(x)

        // copying the inteprolated values in a buffer
        this._xSeriesInterpolated[x] = x / w;
        this._ySeriesInterpolated[x] = y / h;

        // adjusting y for visual purpose
        y = y < 0 ? 0.5 : y > h ? h - 0.5 : y;
        this._ctx.lineTo(x/this._screenRatio, (h - y)/this._screenRatio);
      }

      // after the last point (if not at the right of the canvas)
      for(var x=Math.ceil(xSeries[xSeries.length - 1]); x<w; x++){
        var y = ySeries[ySeries.length - 1]

        // copying the inteprolated values in a buffer
        this._xSeriesInterpolated[x] = x / w;
        this._ySeriesInterpolated[x] = y / h;

        // adjusting y for visual purpose
        y = y < 0 ? 0.5 : y > h ? h - 0.5 : y;
        this._ctx.lineTo(x/this._screenRatio, (h - y)/this._screenRatio);
      }

      this._ctx.strokeStyle = this._pointGrabbedIndex == -1 ?  this._curveColor.idle : this._curveColor.moving;
      this._ctx.lineWidth = this._curveThickness / this._screenRatio;
      this._ctx.stroke();
      this._ctx.closePath()
    }

    // drawing the control points
    if( control ){
      // control points
      for(var i=0; i<xSeries.length; i++){
        this._ctx.beginPath();

        this._ctx.arc(
          xSeries[i]/this._screenRatio,
          (h - ySeries[i]) / this._screenRatio,
          this._controlPointRadius/this._screenRatio,
          0,
          2*Math.PI
        );

        // drawing a point that is neither hovered nor grabbed
        if( this._pointHoveredIndex == -1 ){
          this._ctx.fillStyle = this._controlPointColor.idle;
        }else{
          // drawing a point that is hovered or grabbed
          if( i == this._pointHoveredIndex){

            // the point is grabbed
            if( this._mouseDown ){
              this._ctx.fillStyle = this._controlPointColor.grabbed;
            }
            // the point is hovered
            else{
              this._ctx.fillStyle = this._controlPointColor.hovered;
            }

          }else{
            this._ctx.fillStyle = this._controlPointColor.idle;
          }
        }

        this._ctx.fill();
        this._ctx.closePath()
      }
    }
  }


  /**
  * Get a single interpolated value
  * @param {Number} x - normalized x (in [0, 1])
  * @return {number} the normalized interpolated value
  */
  getValue( x ){
    var xSeries = this._pointCollection.getXseries();
    var ySeries = this._pointCollection.getYseries();

    // before the first x, we return the fist y
    if( x<= (xSeries[0]/this._width) ){
      return ySeries[0] / this._height;
    }else
    // after the last x, we return the last y
    if(x>= (xSeries[xSeries.length-1]/this._width)){
      return ySeries[ySeries.length-1] / this._height;
    }
    // somwhere in the the series, we interpolate
    else{
      var splineInterpolator = new this._splineConstructor(xSeries, ySeries);
      return splineInterpolator.interpolate( x * this._width ) / this._height;
    }

  }


  /**
  * Define an event
  * @param {String} eventName - name of the event. "movePoint", "releasePoint", "pointAdded" or "pointRemoved". They are both called with this in argument
  */
  on( eventName, callback ){
    this._onEvents[ eventName ] = callback;
  }


} /* END of class CanvasSpliner */

export { CanvasSpliner };
// Note: we chose not to export PointCollection
