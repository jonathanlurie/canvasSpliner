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
    }

    // radius of the control points
    this._controlPointRadius = {
      idle: 6,
      grabed: 12
    }

    // color of the control points
    this._controlPointStyle = {
      idle: "rgba(255, 0, 0, 0.5)",
      hovered: "rgba(0, 0, 255, 0.5)",
      grabed: "rgba(0, 200, 0, 0.5)"
    }

    // style of the curve
    this._curveStyle = {
      idle: 'rgba(0, 128, 255, 1)',
      moving: 'rgba(255, 128, 0, 1)'
    }

    this._curveThickness = {
      idle: 1,
      moving: 2
    }

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
    this._xSeriesInterpolated = new Array(this._width).fill(0);
    this._ySeriesInterpolated = new Array(this._width).fill(0);
    
    this._gridStep = 0.33;
    
    // events
    this._onEvents = {
      move: null,
      released: null
    };
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
  * @param {String} splineType - "natural" or "monotonic" 
  */
  setSplineType( splineType ){
    this._splineConstructor = splines.CubicSpline;
    if(splineType === "monotonic"){
      this._splineConstructor = splines.MonotonicCubicSpline;
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
      this._pointGrabedIndex = this._pointCollection.updatePoint( this._pointGrabedIndex, this._mouse )
      this._pointHoveredIndex = this._pointGrabedIndex;
      
    }

    // reduce usless drawing
    if( this._pointHoveredIndex != -1 || this._pointGrabedIndex != -1){ 
      this.draw();
      
    }
    
    
    // now the buffer is filled (after draw)
    if( this._pointGrabedIndex != -1 ){
      var grabedPoint = this._pointCollection.getPoint( this._pointGrabedIndex );
      this._drawCoordinates( 
        Math.round((grabedPoint.x / this._width)*1000 ) / 1000,
        Math.round((grabedPoint.y/this._height)*1000 ) / 1000
      );
      
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
      this._pointGrabedIndex = this._pointHoveredIndex
    }
  }


  /**
  * [EVENT] [PRIVATE]
  * for when the mouse is released over the canvas
  */
  _onCanvasMouseUp(evt){
    console.log( 'up ' );  
    var aPointWasGrabed = (this._pointGrabedIndex != -1)
    this._mouseDown = false;
    this._pointGrabedIndex = -1;

    this.draw();
    
    if(this._onEvents.released && aPointWasGrabed)
      this._onEvents.released( this._xSeriesInterpolated, this._ySeriesInterpolated );
  }

  
  /**
  * [EVENT] [PRIVATE]
  * for when we double click on the canvas
  */
  _onCanvasMouseDbclick(evt){
    console.log("dbclick");
    this._canvas.focus();

    if(this._pointHoveredIndex == -1 ){
      var index = this.add( {x: this._mouse.x / this._width, y: this._mouse.y / this._height} );
      this._pointHoveredIndex = index;
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
    var index = null;

    if("x" in pt && "y" in pt){
      pt.x *= this._width;
      pt.y *= this._height;
      index = this._pointCollection.add( pt );
      console.log("a point is added");
    }

    if( draw ){
      this.draw();
    }

    return index;
  }


  remove( index ){
    this._pointCollection.remove( index );
    this.draw();
  }

  draw(){
    this._ctx.clearRect(0, 0, this._width, this._height);
    
    this._drawGrid();
    
    this._drawData();
    
    
  }


  _drawCoordinates(x, y){
    this._ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this._ctx.font = "14px courier";
    this._ctx.fillText("x: " + x, 10,20);
    this._ctx.fillText("y: " + y, 10,35);
  }

  /**
  * Draw the background grid
  */
  _drawGrid(){
    var step = this._gridStep;
    
    if( step == 0)
      return;
    
    // horitontal grid
    this._ctx.beginPath();
    this._ctx.moveTo(0, 0);
    
    for(var i=step*this._height; i<=(1-step)*this._height; i += step*this._height){
      this._ctx.moveTo(0, i + 0.5);
      this._ctx.lineTo(this._width ,i + 0.5 );
    }
    
    this._ctx.moveTo(0, 0);
    for(var i=step*this._width; i<=(1-step)*this._width; i += step*this._width){
      this._ctx.moveTo(i + 0.5, 0);
      this._ctx.lineTo(i + 0.5 , this._height );
    }
    
    this._ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    this._ctx.lineWidth = 0.5;
    this._ctx.stroke();
    this._ctx.closePath()
  }


  /**
  * Draw the data on the canvas
  * @param {Boolean} curve - whether or not we draw the curve
  * @param {Boolean} control - whether or not we draw the control points
  */
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
      
      // before the first point (if not at the left of the canvas)
      for(var x=0; x<Math.ceil(xSeries[0]); x++){
        var y = ySeries[0]
        
        // copying the inteprolated values in a buffer
        this._xSeriesInterpolated[x] = x / this._width;
        this._ySeriesInterpolated[x] = y / this._height;
        
        // adjusting y for visual purpose
        y = y < 0 ? 0.5 : y > this._height ? this._height - 0.5 : y;
        this._ctx.lineTo(x/this._screenRatio, (this._height - y)/this._screenRatio);
      }
      
      // between the first and the last point
      for(var x=Math.ceil(xSeries[0]); x<Math.ceil(xSeries[ xSeries.length - 1]); x++){
        var y = splineInterpolator.interpolate(x)
        
        // copying the inteprolated values in a buffer
        this._xSeriesInterpolated[x] = x / this._width;
        this._ySeriesInterpolated[x] = y / this._height;
        
        // adjusting y for visual purpose
        y = y < 0 ? 0.5 : y > this._height ? this._height - 0.5 : y;
        this._ctx.lineTo(x/this._screenRatio, (this._height - y)/this._screenRatio);
      }
      
      // after the last point (if not at the right of the canvas)
      for(var x=Math.ceil(xSeries[xSeries.length - 1]); x<this._width; x++){
        var y = ySeries[ySeries.length - 1]
        
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
      this._ctx.closePath()
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
      return splineInterpolator.interpolate( x / this._width ) / this._height;
    }
    
  }

  
  /**
  * Define an event
  * @param {String} eventName - name of the event. "move" and "released". They are both called with the interpolated x and y series
  */
  on( eventName, callback ){
    this._onEvents[ eventName ] = callback;
  }


} /* END of class CanvasSpliner */

export { CanvasSpliner };
// Note: we chose not to export PointCollection
