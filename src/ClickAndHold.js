export class ClickAndHold {
    constructor(target, callback, callbackEnd){
        this.target = target;
        this.callback = callback;
        this.callbackEnd = callbackEnd;
        this.isHeld = false;
        this.activeHoldTimeoutId = null;

        ['mousedown', 'touchstart'].forEach(type => {
            this.target.addEventListener(type, this._onHoldStart.bind(this));

        });

        ['mouseup', 'mouseleave', 'mouseout', 'touchend'].forEach(type => {
            this.target.addEventListener(type, this._onHoldEnd.bind(this));
            
        });
         
    }

    _onHoldStart() {
        this.isHeld = true;

        this.activeHoldTimeoutId = setTimeout(() => {
            if (this.isHeld) {
                this.callback();
            }
        }, 1000)
    }

    _onHoldEnd() {
        this.isHeld = false;
        this.callbackEnd();
        clearTimeout(this.activeHoldTimeoutId);
    }

}