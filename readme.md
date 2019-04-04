# Swiper

This is a simple class to detect swipes. Its core is largely inspired by / adapted from http://www.javascriptkit.com/javatutors/touchevents2.shtml


## Usage

To initialize a swiper, pass Swiper an object:

    var swiper = new Swiper({
        target: document.getElementById('whatever'),
        onDrag: someCoolFunction(),
        onEnd: someOtherFunction(),
        distMin: 200,
    });

Swiper will add mosue and touch event listeners to the `target` element. As the user drags around on the element, it will call the `onDrag` function, passing it an object that looks like:

    {
        x: {  // The x coordinate.
            start: int,  // The start of the event.
            end: int,  // The end of the event.
            run: int,  // The gross distance traveled.
            mag: int,  // The net distance traveled.
            inc: int,  // The difference between the last event.
        },
        y: {  // The y coordinate.
            start: int,
            end: int,
            run: int,
            mag: int,
            inc: int,
        },
        t: {  // Timestamps.
            start: int,  // When the event started.
            end: int,  // When the event ended.
            run: int,  // The duration.
            inc: int,  // The difference between the last event.
        },
        v: {  // Vector.
            run: string,  // 'left', 'right', 'up', or 'down'
            mag: string,  // same
            over: bool,  // Whether the distance traveled surpassed the `distMin`.
        },
    }

It will pass the same object to the `onEnd` function when the event cancels or ends naturally.


## Dependencies

None.


## TODO
- general cleanup
- test on touch devices
- improve documentation
- debounce the events?
