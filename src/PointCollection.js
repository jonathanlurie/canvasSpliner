

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


export { PointCollection }
