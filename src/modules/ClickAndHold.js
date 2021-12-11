export class ClickAndHold {
    constructor(target, callback, callbackEnd=null ,ms_interval){
        this.target = target;
        this.callback = callback;
        this.callbackEnd = callbackEnd;
        this.isHeld = false;
        this.activeHoldTimeoutId = null;
        this.ms_interval = ms_interval;

        ['mousedown', 'touchstart'].forEach(type => {
            this.target.addEventListener(type, this._onHoldStart.bind(this));

        });

        ['mouseup', 'mouseleave', 'mouseout', 'touchend'].forEach(type => {
            this.target.addEventListener(type, this._onHoldEnd.bind(this));
            
        });
         
    }

    // You can change the time interval here.
    _onHoldStart() {
        this.isHeld = true;

        this.activeHoldTimeoutId = setTimeout(() => {
            if (this.isHeld) {
                this.callback();
            }
        }, this.ms_interval)
    }

    _onHoldEnd() {
        this.isHeld = false;
        this.callbackEnd();
        clearTimeout(this.activeHoldTimeoutId);
    }

}