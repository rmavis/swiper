/*
  SWIPER

  This is a simple class to detect swipes. Its core is largely
  inspired by / adapted from:
  http://www.javascriptkit.com/javatutors/touchevents2.shtml


  USAGE

  To initialize a swiper, pass Swiper an object:

  var swiper = new Swiper({
    target: document.getElementById('whatever'),
    onDrag: someCoolFunction(),
    onEnd: someOtherFunction(),
    distMin: 200
  });


  DEPENDENCIES

  None.


  DETAILS

  Swiper adds event listeners to the `target` that check the start
  and end times and touch/click points of the touch or click-and-drag
  event. It then does some simple calculations and returns an object
  containing a summary of the event.

  If `onDrag` or `onEnd` are specified, then Swiper will fire those
  functions, passing the return from Swiper as the parameter.

  The object returned by Swiper looks like:
  {
    x.start: $delta.x.start,  // The starting coordinates.
    startY: $delta.startY,
    startT: $delta.startT,  // The starting time.
    endX: $delta.endX,  // The ending coordinates.
    endY: $delta.endY,
    endT: $delta.endT,  // The ending time.
    runX: $delta.runX,  // The gross distance between the starting
    runY: $delta.runY,  // and ending coordinates.
    runT: $delta.runT,
    magX: $delta.x.mag,  // The net distance between the
    magY: $delta.magY,  // starting and ending points.
    runDir: $delta.runDir,  // The overall direction ran.
    magDir: $delta.magDir,  // The initial up/down or left/right trajectory.
    swipeDir: $delta.swipeDir  // The swipe direction.
  }

  All properties are integers except the *Dir properties, which will be
  'up', 'down', 'left', or 'right'.
*/


function Swiper(params) {

    /*
     * Init, config, etc.
     */

    var $conf = { },
        $delta = { };



    function getDefaultConf() {
        return {
            // The target element.
            target: null,
            // Limit the swipe direction to left/right or up/down.
            // Valid values are `x`, `y`, or falsy.
            dirLim: null,
            // The minimum number of pixels traveled required to
            // register the swipe direction.
            distMin: 150,
            // The number of pixels the swipe can deviate from a
            // trajectory before changing trajectories.
            distDevLimit: 100,
            // The maximum number of milliseconds a swipe can take.
            // This is not currently checked.
            runTimeMax: false,
            // Neither is this.
            runTimeMin: 100,
            // A function to fire as the swipe occurs.
            onDrag: false,
            // A function to fire when the swipe ends.
            onEnd: false,
            // Want to see messages in the console?
            log: false,
        };
    }



    function getNewDeltas() {
        return {
            x: {
                start: 0,
                end: 0,
                run: 0,
                mag: 0,
            },

            y: {
                start: 0,
                end: 0,
                run: 0,
                mag: 0,
            },

            t: {
                start: 0,
                end: 0,
                run: 0,
            },

            v: {
                dir: null,
                over: false,
            },
        };
    }



    function getPublicProperties() {
        return {
            set: setConfProperty,
            stats: getCurrentDeltas,
            stop: stopTracking,
        };
    }



    function stopTracking() {
        removeListeners($conf.target);
    }



    function getCurrentDeltas() {
        return $delta;
    }



    function setConfProperty(key, val) {
        if ($conf.hasOwnProperty(key)) {
            $conf[key] = val;
            return true;
        }
        else {
            return false;
        }
    }



    function init(arg) {
        $conf = mergeObjects(getDefaultConf(), arg);

        if ($conf.target) {
            addListeners($conf.target);
        }
        else {
            console.log("SWIPER ERROR: no `target` element given.")
        }

        return getPublicProperties();
    }





    /*
     * Swipe functions.
     */

    function startSwipe(evt) {
        $delta = getNewDeltas();

        $delta.t.start = new Date().getTime();

        $delta.x.start = evt.clientX;
        $delta.y.start = evt.clientY;

        trackChanges(evt);

        setElemDraggable($conf.target);
    }



    function trackSwipe(evt) {
        trackChanges(evt);

        if ($conf.onDrag) {
            $conf.onDrag($delta);
        }
    }



    function endSwipe(evt) {
        trackChanges(evt);

        $delta.t.end = new Date().getTime();

        unsetElemDraggable($conf.target);

        if ($conf.onEnd) {
            $conf.onEnd($delta);
        }
    }



    function trackChanges(evt) {
        // The magnitude must be signed. Left/right and up/down only
        // make sense if it's signed.
        $delta.x.mag = (evt.clientX - $delta.x.start);
        $delta.y.mag = (evt.clientY - $delta.y.start);

        // Increment the run before setting the new ends because the
        // previous ends are needed to calculate the run.
        $delta.x.run += Math.abs(evt.clientX - $delta.x.end);
        $delta.y.run += Math.abs(evt.clientY - $delta.y.end);

        // Just record the new end points.
        $delta.x.end = evt.clientX;
        $delta.y.end = evt.clientY;

        $delta.t.run = (new Date().getTime() - $delta.t.start);

        if ($conf.dirLim) {
            if ($conf.dirLim == 'y') {
                $delta.v.dir = ($delta.y.mag > 0) ? 'down' : 'up';
            }
            else {
                $delta.v.dir = ($delta.x.mag > 0) ? 'right' : 'left';
            }

            var dist_check = $delta[$conf.dirLim].mag;
        }
        else {
            if (Math.abs($delta.x.mag) > Math.abs($delta.y.mag)) {
                $delta.v.dir = ($delta.x.mag > 0) ? 'right' : 'left';
                var dist_check = $delta.x.mag;
            }
            else {
                $delta.v.dir = ($delta.y.mag > 0) ? 'down' : 'up';
                var dist_check = $delta.y.mag;
            }
        }

        $delta.v.over = (Math.abs(dist_check) > $conf.distMin) ? true : false;

        // console.log($delta.runDir + ' && ' + $delta.magDir);
    }





    /*
     * Event-related functions.
     */

    function addListeners(elem) {
        elem.addEventListener('touchstart', handleTouchStart, false);
        elem.addEventListener('mousedown', handleMouseDown, false);

        elem.addEventListener('touchmove', handleTouchMove, false);
        elem.addEventListener('mousemove', handleMouseMove, false);

        elem.addEventListener('touchend', handleTouchEnd, false);
        elem.addEventListener('mouseup', handleMouseUp, false);

        elem.addEventListener('touchcancel', handleTouchEnd, false);
        elem.addEventListener('mouseout', handleMouseOut, false);
    }


    function removeListeners(elem) {
        elem.removeEventListener('touchstart', handleTouchStart);
        elem.removeEventListener('mousedown', handleMouseDown);

        elem.removeEventListener('touchmove', handleTouchMove);
        elem.removeEventListener('mousemove', handleMouseMove);

        elem.removeEventListener('touchend', handleTouchEnd);
        elem.removeEventListener('mouseup', handleMouseUp);

        elem.removeEventListener('touchcancel', handleTouchEnd);
        elem.removeEventListener('mouseout', handleMouseOut);
    }


    function checkEvent(evt) {
        if (!evt) {var evt = window.event;}
        evt.stopPropagation();
        return evt;
    }


    function handleTouchStart(evt) {
        evt = checkEvent(evt);
        startSwipe(evt.changedTouches[0]);
    }


    function handleMouseDown(evt) {
        evt = checkEvent(evt);

        if (shouldPreventDefault(evt)) {
            evt.preventDefault();
        }

        startSwipe(evt);
    }


    function handleTouchMove(evt) {
        evt = checkEvent(evt);

        // Why?  #HERE
        // if (($delta.runDir == 'left') ||
        //     ($delta.runDir == 'right')) {
        //     evt.preventDefault();
        // }

        // Send the touch object instead of the event. Touch objects
        // have `client(X|Y)` properties, which `trackChanges` needs.
        trackSwipe(evt.changedTouches[0]);
    }


    function handleMouseMove(evt) {
        if (isDragging($conf.target)) {
            evt.preventDefault();
            trackSwipe(checkEvent(evt));
        }
    }


    function handleTouchEnd(evt) {
        endSwipe(checkEvent(evt));
    }


    function handleMouseUp(evt) {
        if (isDragging($conf.target)) {
            endSwipe(checkEvent(evt));
        }
    }


    function handleMouseOut(evt) {
        evt = checkEvent(evt);

        if ((isDragging($conf.target)) &&
            (isMouseOffTarget(evt, $conf.target))) {
            endSwipe(evt);
        }
    }





    /*
     * Utility functions.
     */

    function mergeObjects(obj1, obj2) {
        if ($conf.log) {
            console.log('Merging this object:');
            console.log(obj1);
            console.log('with this one:');
            console.log(obj2);
        }

        var merged = { };

        for (var key in obj1) {
            if (obj1.hasOwnProperty(key)) {
                if (obj2.hasOwnProperty(key)) {
                    if ((obj1[key]) &&
                        (obj1[key].constructor == Object) &&
                        (obj2[key].constructor == Object)) {
                        merged[key] = mergeObjects(obj1[key], obj2[key]);
                    }
                    else {
                        merged[key] = obj2[key];
                    }
                }
                else {
                    merged[key] = obj1[key];
                }
            }
        }

        return merged;
    }



    function shouldPreventDefault(evt) {
        var tagName = evt.target.tagName;

        // This could be expanded.
        var badTags = ['IMG'];

        for (var i = 0; i < badTags.length; i++) {
            if (badTags[i] == tagName) {
                return true;
            }
        }

        return false;
    }



    function setElemDraggable(elem) {
        elem.setAttribute('draggable', 'draggable');
    }



    function unsetElemDraggable(elem) {
        elem.removeAttribute('draggable');
    }



    function isDragging(elem) {
        return (elem.getAttribute('draggable'));
    }



    function isMouseOffTarget(evt, elem) {
        var targ = null;

        if (evt.type == 'mouseout') {
            targ = evt.relatedTarget || evt.fromElement;
        }
        else if (evt.type == 'mouseover') {
            targ = evt.target;
        }

        if (targ) {
            while ((targ != elem) &&
                   (targ != document) &&
                   (targ != document.body)) {
                targ = targ.parentNode;
            }
        }

        return (targ !== elem);
    }





    // This needs to stay down here.
    return init(params);
}
