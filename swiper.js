/*
  SWIPER
  This is a simple class to detect swipes.
  It's core is largely inspired by / adapted from:
  http://www.javascriptkit.com/javatutors/touchevents2.shtml


  To initialize the Swiper, pass it an object:

  var swpr = new Swiper({
  element: document.getElementById('whatever-is-good'),
  onDrag: someCoolFunction(),
  onEnd: someCoolFunction()
  });


  Swiper adds event listeners to the 'element' that check the start and end times
  and touch/click points of the touch or click-and-drag event. It then does some
  simple calculations and returns an object containing a summary of the event.

  If 'onDrag' or 'onEnd' are specified, Swiper will fire those functions with the
  direction string as the parameter.

  The object returned by Swiper looks like:
  {
  startX: this.startX,  // The starting coordinates.
  startY: this.startY,
  startT: this.startT,  // The starting time.
  endX: this.endX,  // The ending coordinates.
  endY: this.endY,
  endT: this.endT,  // The ending time.
  runX: this.runX,  // The net distance between the starting
  runY: this.runY,  // and ending coordinates.
  runT: this.runT,
  magX: this.magX,  // The gross distance between the
  magY: this.magY,  // starting and ending points.
  runDir: this.runDir,  // The overall direction ran.
  magDir: this.magDir,  // The initial up/down or left/right trajectory.
  swipeDir: this.swipeDir  // The swipe direction.
  }

  All properties are integers except the *Dir properties, which will be
  'up', 'down', 'left', or 'right'.

*/



function Swiper(params) {


    this.init = function(pobj) {
        // The element. This is required.
        this.target = pobj.element;

        // The minimum distance required to register a swipe.
        this.distMinLimit = pobj.distanceMin || 150;

        // The maximum deviation from that direction.
        this.distDevLimit = pobj.distanceDev || 100;
        this.distMagLimit = (this.distDevLimit / 4);

        // The min and max time required to register a swipe.
        this.runTimeMin = pobj.runtimeMin || 100;
        this.runTimeMax = pobj.runtimeMax || false;

        // The callback functions.
        this.fireOnDrag = pobj.onDrag || null;
        this.fireOnEnd = pobj.onEnd || null;

        // For testing.
        // this.cntbox = document.getElementById('event-counter');
        // this.outbox = document.getElementById('event-logger');

        this.addListeners();
        this.reset();
    };



    /* handleEvent is a special function that gets called by `this`
     * when the element's listener is bound only to `this`. This allows
     * the functions in `this` to access the variables declared above.
     * See more: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener */

    this.handleEvent = function(evt) {
        if (!evt) {var evt = window.event;}
        this.evt = evt;
        this.evt.stopPropagation();

        // For testing.
        // this.cntbox.innerHTML = parseInt(this.cntbox.innerHTML) + 1;
        // this.outbox.innerHTML = this.evt.type + ' && ' + window.event.type;

        // Touch events.
        if (this.evt.type.indexOf('touch') == 0) {
            if (this.evt.type == 'touchstart') {
                this.start();
            }
            else if (this.evt.type == 'touchmove') {
                this.move();
            }
            else if ((this.evt.type == 'touchend') ||
                     (this.evt.type == 'touchcancel')) {
                this.end();
            }
            else {
                // console.log("Unhandled touch event type: " + this.evt.type);
            }
        }

        // Mouse events.
        else {
            if (this.evt.type == 'mousedown') {
                this.start();
            }
            else if ((this.evt.type == 'mousemove') && (this.isDragging())) {
                this.move();
            }
            else if (this.evt.type == 'mouseup') {
                this.end();
            }
            else if ((this.evt.type == 'mouseout') && (this.isMouseOffTarget())) {
                this.end();
            }
            else {
                // console.log("Unhandled mouse event type: " + this.evt.type);
            }
        }
    };



    this.start = function() {
        if ((this.evt.type == 'mousedown') && (this.shouldPreventDefault())) {
            this.evt.preventDefault();
        }

        this.startT = new Date().getTime();

        if (this.evt.changedTouches) {
            var touchObj = this.evt.changedTouches[0];
            this.startX = touchObj.pageX;
            this.startY = touchObj.pageY;
        }
        else {
            this.startX = this.evt.clientX;
            this.startY = this.evt.clientY;
        }

        this.prepForDrag();
    };



    this.move = function() {
        this.trackChanges();

        if ((this.evt.type == 'touchmove') &&
            ((this.runDir == 'left') || (this.runDir == 'right'))) {
            this.evt.preventDefault();
        }

        if (this.fireOnDrag) {
            this.fireOnDrag(this.callbackObj());
        }

        // For testing.
        // this.outbox.innerHTML += ' && ' + this.runDir + ' && ' + this.magDir;
    };



    this.end = function() {
        this.trackChanges(true);
        this.dragIsDone();

        if ((!this.runTimeMax) ||
            ((this.runTimeMax) && (this.runT <= this.runTimeMax))) {
            this.getSwipeDir();
        }

        if (this.fireOnEnd) {
            this.fireOnEnd(this.callbackObj());
        }

        this.reset();
    };



    this.trackChanges = function(last) {
        if (this.evt.changedTouches) {
            var touchObj = this.evt.changedTouches[0];
            this.endX = touchObj.pageX;
            this.endY = touchObj.pageY;
        }
        else {
            this.endX = this.evt.clientX;
            this.endY = this.evt.clientY;
        }

        this.runX = (this.endX - this.startX);
        this.runY = (this.endY - this.startY);
        this.runT = (this.endT - this.startT);

        this.magX += Math.abs(this.endX - this.startX);
        this.magY += Math.abs(this.endY - this.startY);

        this.setTrajectories();

        if (last) {
            this.endT = new Date().getTime();
        }
    };



    this.setTrajectories = function() {
        if (Math.abs(this.runX) > Math.abs(this.runY)) {
            this.runDir = (this.runX > 0) ? 'right' : 'left';
        }
        else {
            this.runDir = (this.runY > 0) ? 'down' : 'up';
        }

        if ((!this.magDir) &&
            ((this.magX >= this.distMagLimit) || (this.magY >= this.distMagLimit))) {
            if (this.magX > this.magY) {
                this.magDir = (this.runX > 0) ? 'right' : 'left';
            }
            else {
                this.magDir = (this.runY > 0) ? 'down' : 'up';
            }
        }
        // console.log(this.runDir + ' && ' + this.magDir);
    };



    this.getSwipeDir = function() {
        if ((Math.abs(this.runX) >= this.distMinLimit) && 
            (Math.abs(this.runY) <= this.distDevLimit)) {
            this.swipeDir = (this.runX < 0) ? 'left' : 'right';
        }
        else if ((Math.abs(this.runY) >= this.distMinLimit) &&
                 (Math.abs(this.runX) <= this.distDevLimit)) {
            this.swipeDir = (this.runY < 0) ? 'up' : 'down';
        }
    };



    this.callbackObj = function() {
        var ret = {
            startX: this.startX,
            startY: this.startY,
            startT: this.startT,
            runX: this.runX,
            runY: this.runY,
            runT: this.runT,
            magX: this.magX,
            magY: this.magY,
        };

        ret.runDir = this.runDir;
        ret.magDir = this.magDir;

        if (this.endT) {
            ret.endX = this.endX;
            ret.endY = this.endY;
            ret.endT = this.endT;
        }

        if (this.swipeDir) {
            ret.swipeDir = this.swipeDir;
        }

        return ret;
    };



    this.shouldPreventDefault = function() {
        var ret = false,
            tagName = this.evt.target.tagName;

        // This could be expanded.
        var badTags = ['IMG'];

        for (var i = 0; i < badTags.length; i++) {
            if (badTags[i] == tagName) {
                ret = true;
            }
        }

        return true;
    };



    this.prepForDrag = function() {
        this.target.setAttribute('draggable', 'draggable');
    };

    this.dragIsDone = function() {
        this.target.removeAttribute('draggable');
    };

    this.isDragging = function() {
        var ret = (this.target.getAttribute('draggable')) ? true : false;
        return ret;
    };



    this.reset = function() {
        this.startX = null;  // The initial X coordinate.
        this.startY = null;  // The initial Y coordinate.
        this.startT = null;  // The initial time.
        this.endX = null;
        this.endY = null;
        this.endT = null;
        this.runX = null;
        this.runY = null;
        this.runT = null;
        this.magX = 0;  // These are 0 so they don't need to be checked as null in trackChanged.
        this.magY = 0;

        this.magDir = null;
        this.runDir = null;
        this.swipeDir = null;

        this.evt = null;  // The event object.

        this.dragIsDone();

        // For testing.
        // this.cntbox.innerHTML = '0';
    };



    this.addListeners = function() {
        this.target.addEventListener('touchstart', this, false);
        this.target.addEventListener('mousedown', this, false);

        this.target.addEventListener('touchmove', this, false);
        this.target.addEventListener('mousemove', this, false);

        this.target.addEventListener('touchend', this, false);
        this.target.addEventListener('mouseup', this, false);

        this.target.addEventListener('touchcancel', this, false);
        this.target.addEventListener('mouseout', this, false);
    };


    this.removeListeners = function() {
        this.target.removeEventListener('touchstart');
        this.target.removeEventListener('mousedown');

        this.target.removeEventListener('touchmove');
        this.target.removeEventListener('mousemove');

        this.target.removeEventListener('touchend');
        this.target.removeEventListener('mouseup');

        this.target.removeEventListener('touchcancel');
        this.target.removeEventListener('mouseout');
    };



    this.isMouseOffTarget = function() {
        return isMouseOffTarget(this.evt, this.target);

        // var ret = false;

        // if ((this.evt.type == 'mouseout') || (this.evt.type == 'mouseover')) {
        //     var targ = this.evt.relatedTarget || this.evt.fromElement;
        //     if (targ) {
        //         while ((targ != document) && (targ != document.body) && (targ != this.target)) {
        //             targ = targ.parentNode;
        //         }
        //         ret = (targ == this.target) ? false : true;
        //     }
        // }

        // return ret;
    };




    /* This needs to stay down here. */
    this.init(params);
}
