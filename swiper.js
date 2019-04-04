// Swiper :: args -> api
// args, api = see note on `init`
function Swiper(args) {

    /*
     * Init, config, etc.
     */

    var $conf = { },
        $delta = { };

    // getDefaultConf :: void -> conf
    // conf = an object as defined below
    function getDefaultConf() {
        return {
            // Element
            target: null,
            // string/boolean
            // Limit the swipe direction to left/right or up/down.
            // Valid values are `x`, `y`, or falsy. If a truthy value
            // is present and is not `y`, then `x` will be assumed.
            dirLim: null,
            // int
            // The minimum number of pixels traveled required to
            // register the swipe direction.
            distMin: 150,
            // int
            // The number of pixels the swipe can deviate from a
            // trajectory before changing trajectories.
            distDevLimit: 100,
            // int/bool
            // The maximum number of milliseconds a swipe can take.
            // This is not currently checked.
            runTimeMax: false,
            // int
            // Neither is this.
            runTimeMin: 100,
            // deltas -> void
            // deltas = see note on `getNewDeltas`
            // A function to fire as the swipe occurs.
            onDrag: false,
            // delta -> void
            // A function to fire when the swipe ends.
            onEnd: false,
        };
    }

    // getNewDeltas :: void -> deltas
    // deltas = an object as defined below
    function getNewDeltas() {
        return {
            x: {
                start: 0,  // int
                end: 0,  // int
                run: 0,  // int
                mag: 0,  // int
                inc: 0,  // int
            },

            y: {
                start: 0,  // int
                end: 0,  // int
                run: 0,  // int
                mag: 0,  // int
                inc: 0,  // int
            },

            t: {
                start: 0,  // int
                end: 0,  // int
                run: 0,  // int
                inc: 0,  // int
            },

            v: {
                run: null,  // string (up|down|left|right)
                mag: null,  // string (up|down|left|right)
                over: false,  // boolean
            },
        };
    }

    // getPublicProperties :: void -> api
    // api = an object as defined below
    // The `api` object is intended to define Swiper's public API.
    function getPublicProperties() {
        return {
            set: setConfProperty,
            stats: getCurrentDeltas,
            stop: stopTracking,
        };
    }

    // stopTracking :: void -> void
    function stopTracking() {
        removeListeners($conf.target);
    }

    // getCurrentDeltas :: void -> deltas
    // deltas = see `getNewDeltas`
    function getCurrentDeltas() {
        return $delta;
    }

    // setConfProperty :: (string, a) -> bool
    function setConfProperty(key, val) {
        if ($conf.hasOwnProperty(key)) {
            $conf[key] = val;
            return true;
        } else {
            return false;
        }
    }

    // init :: args -> api
    // args = an object that can be merged with the default `conf`
    // api = see `getPublicProperties`
    function init(arg) {
        $conf = mergeObjects(getDefaultConf(), arg);

        if ($conf.target) {
            addListeners($conf.target);
        } else {
            console.log("SWIPER ERROR: no `target` element given.")
        }

        return getPublicProperties();
    }


    /*
     * Swipe functions.
     */

    // startSwipe :: Event -> void
    function startSwipe(evt) {
        $delta = getNewDeltas();

        $delta.t.start = new Date().getTime();

        $delta.x.start = evt.clientX;
        $delta.y.start = evt.clientY;

        trackChanges(evt);

        setElemDraggable($conf.target);
    }

    // trackSwipe :: Event -> void
    function trackSwipe(evt) {
        if (trackChanges(evt)) {
            if ($conf.onDrag) {
                $conf.onDrag($delta);
            }
        }
    }

    // endSwipe :: Event -> void
    function endSwipe(evt) {
        trackChanges(evt);

        $delta.t.end = new Date().getTime();

        unsetElemDraggable($conf.target);

        if ($conf.onEnd) {
            $conf.onEnd($delta);
        }
    }

    // trackChanges :: Event -> bool
    function trackChanges(evt) {
        // The change since the last change tracked.
        var _delta = {
            x: (evt.clientX - $delta.x.end),
            y: (evt.clientY - $delta.y.end),
        };
        _delta.absX = Math.abs(_delta.x);
        _delta.absY = Math.abs(_delta.y);

        // If there hasn't been a change, don't bother.
        if ((_delta.absX > 0) || (_delta.absY > 0)) {
            // The magnitude must be signed. Left/right and up/down only
            // make sense if it's signed.
            $delta.x.mag = (evt.clientX - $delta.x.start);
            $delta.y.mag = (evt.clientY - $delta.y.start);

            // Increment the run before setting the new ends because the
            // previous ends are needed to calculate the run.
            $delta.x.run += _delta.absX;
            $delta.y.run += _delta.absY;

            // The difference between the current end and the last.
            $delta.x.inc = (evt.clientX - $delta.x.end);
            $delta.y.inc = (evt.clientY - $delta.y.end);

            // Just record the new end points.
            $delta.x.end = evt.clientX;
            $delta.y.end = evt.clientY;

            var _t = new Date().getTime();
            $delta.t.inc = (_t - $delta.t.run);
            $delta.t.run = (_t - $delta.t.start);

            if ($conf.dirLim) {
                if ($conf.dirLim == 'y') {
                    $delta.v.run = (_delta.y < 0) ? 'up' : 'down';
                    $delta.v.mag = ($delta.y.mag < 0) ? 'up' : 'down';
                    var dist_check = $delta.y.mag;
                }
                else {
                    $delta.v.run = (_delta.x < 0) ? 'left' : 'right';
                    $delta.v.mag = ($delta.x.mag < 0) ? 'left' : 'right';
                    var dist_check = $delta.x.mag;
                }
            }
            else {
                $delta.v.run = checkDirection(
                    [_delta.x, 'left', 'right'],
                    [_delta.y, 'up', 'down']
                )[1];

                var _check = checkDirection(
                    [$delta.x.mag, 'left', 'right'],
                    [$delta.y.mag, 'up', 'down']
                );
                var dist_check = _check[0];
                $delta.v.mag = _check[1];
            }

            $delta.v.over = (Math.abs(dist_check) > $conf.distMin);

            return true;
        }
        else {
            return false;
        }
    }

    // checkDirection :: (nav, nav) -> dir
    // nav = [int, string, string]
    // dir = [int, string]
    // Pass this two three-item arrays. Each array must contain an
    // integer in its 0th spot, direction names in its 1st and 2nd.
    // The 1st direction should be the result when the integer is
    // negative (left, up). It returns a two-item array containing,
    // 0th, the greater distance, and, 1st, the matching direction.
    function checkDirection(dirA, dirB) {
        if (Math.abs(dirB[0]) < Math.abs(dirA[0])) {
            return [dirA[0], (dirA[0] < 0) ? dirA[1] : dirA[2]];
        } else {
            return [dirB[0], (dirB[0] < 0) ? dirB[1] : dirB[2]];
        }
    }


    /*
     * Event-related functions.
     */
    // addListeners :: Element -> void
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

    // removeListeners :: Element -> void
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

    // checkEvent :: Event -> Event
    function checkEvent(evt) {
        if (!evt) {var evt = window.event;}
        evt.stopPropagation();
        return evt;
    }

    // handleTouchEnd :: Event -> void
    function handleTouchStart(evt) {
        evt = checkEvent(evt);
        evt.preventDefault();
        startSwipe(evt.changedTouches[0]);
    }

    // handleMouseOut :: Event -> void
    function handleMouseDown(evt) {
        evt = checkEvent(evt);
        evt.preventDefault();
        startSwipe(evt);
    }

    // handleTouchMove :: Event -> void
    function handleTouchMove(evt) {
        evt = checkEvent(evt);
        // evt.preventDefault();

        // Send the touch object instead of the event. Touch objects
        // have `client(X|Y)` properties, which `trackChanges` needs.
        trackSwipe(evt.changedTouches[0]);
    }

    // handleMouseMove :: Event -> void
    function handleMouseMove(evt) {
        if (isDragging($conf.target)) {
            evt = checkEvent(evt);
            evt.preventDefault();
            trackSwipe(evt);
        }
    }

    // handleTouchEnd :: Event -> void
    function handleTouchEnd(evt) {
        endSwipe(checkEvent(evt));
    }

    // handleMouseUp :: Event -> void
    function handleMouseUp(evt) {
        if (isDragging($conf.target)) {
            endSwipe(checkEvent(evt));
        }
    }

    // handleMouseOut :: Event -> void
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

    // mergeObjects :: (object, object) -> object
    function mergeObjects(obj1, obj2) {
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

    // setElemDraggable :: Element -> void
    function setElemDraggable(elem) {
        elem.setAttribute('draggable', 'draggable');
    }

    // unsetElemDraggable :: Element -> void
    function unsetElemDraggable(elem) {
        elem.removeAttribute('draggable');
    }

    // isDragging :: Element -> bool
    function isDragging(elem) {
        return (elem.getAttribute('draggable'));
    }

    // isMouseOffTarget :: (Event, Element) -> bool
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
    return init(args);
}
