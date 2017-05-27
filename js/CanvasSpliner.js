

class CanvasSpliner {

  constructor(parentID, width, height){
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

    // the point collection
    this._pointCollection = new PointCollection();
    this._pointCollection.setBoundary("max", "x", width);
    this._pointCollection.setBoundary("max", "y", height);
  }


  /**
  *
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

    this.draw();
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

    this.draw();
  }


  /**
  * [EVENT] [PRIVATE]
  * for when the mouse is released over the canvas
  */
  _onCanvasMouseUp(evt){
    console.log( 'up ' );
    this._mouseDown = false;
    this._pointGrabedIndex = -1;

    this.draw();
  }

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

    this._drawData()
  }


  _drawData( curve = true, control = true){
    var xSeries = this._pointCollection.getXseries();
    var ySeries = this._pointCollection.getYseries();

    if(!xSeries.length)
      return;

    if( curve ){

      this._ctx.beginPath();
      this._ctx.moveTo(xSeries[0] / this._screenRatio, (this._height - ySeries[0]) / this._screenRatio);

      var xRange = 500;
      for(var x=xSeries[0]; x<xSeries[ xSeries.length - 1]; x++){
        var y = spline(x, xSeries, ySeries);
        y = y < 0 ? 0.5 : y > this._height ? this._height - 0.5 : y;
        this._ctx.lineTo(x/this._screenRatio, (this._height - y)/this._screenRatio);

      }

      this._ctx.strokeStyle = this._curveStyle.idle;
      this._ctx.lineWidth = this._curveThickness.idle / this._screenRatio;
      this._ctx.stroke();
      this._ctx.closePath()
    }

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


  getValue( x ){
    var xSeries = this._pointCollection.getXseries();
    var ySeries = this._pointCollection.getYseries();
    return spline(x, xSeries, ySeries);
  }



} /* END of class CanvasSpliner */


/**
*
*/
class PointCollection {
  constructor(){
    this._points = [];

    this._min = {
      x: 0,
      y: 0,
    }

    this._max = {
      x: Infinity,
      y: Infinity
    }
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
      newIndex = this._points.indexOf( p )
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
        newIndex = this._points.indexOf( thePointInArray )
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
