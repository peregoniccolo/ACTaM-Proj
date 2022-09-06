import p5 from "p5";
import {
    merge
} from 'lodash';

export default class Effects {

    constructor(source) {
        this.currentState = {
            // defaults are loaded in html 
            // delay
            // delay: 0.5,
            // feedback: 0.5,
            // filterFreq: 3000,
            // reverb
            // decay: 5,
            // distortion
            // amount: 0.05,
            // lpf
            // freq: 3000,
            // resonance: 0.5
        };

        this.source = source;
        this.source.disconnect();

        this.#createNewFilter();
        this.#createNewDistrortion();
        this.#createNewDelay();
        this.#createNewReverb();
    }

    #createNewDelay() {
        this.delay = new p5.Delay();
    }

    delayOn() {
        // if necessary create new delay with current state values and connect it in the chain
        if (this.delay == null)
            this.#createNewDelay();
        
        this.delay.process(this.distortion, this.currentState.delay, this.currentState.feedback, this.currentState.filterFreq);
                           // source, delayTime, feedback, filter frequency
    }

    delayOff() {
        // disconnect and delete current delay 
        this.delay.disconnect();
        this.delay = null; // needed for chaining purposes

        // console.log(this.currentState);
    }

    #createNewReverb() {
        this.reverb = new p5.Reverb();
    }

    reverbOn() {
        // if necessary create new reverb with current state values and connect it in the chain
        if (this.reverb == null)
            this.#createNewReverb();

        this.reverb.process(this.distortion, this.currentState.decay, 1);
                            // source, seconds, decay rate
    }

    reverbOff() {
        // disconnect and delete current reverb 
        this.reverb.disconnect();
        this.reverb = null;

        // console.log(this.currentState);
    }

    #createNewFilter() {
        // create new lpf
        this.filter = new p5.Filter();
        this.source.connect(this.filter);   // chain it
        this.filter.drywet(0);              // set only dry
    }

    filterOn() {
        if (this.filter == null)
            this.#createNewFilter();

        this.filter.drywet(1); // set only wet
    }

    filterOff() {
        this.filter.drywet(0); // set only dry

        // console.log(this.currentState);
    }

    #createNewDistrortion() {
        // create new distortion
        this.distortion = new p5.Distortion();
        this.filter.connect(this.distortion);   // chain it
        this.distortion.drywet(0);              // set only dry
    }

    distortionOn() {
        if (this.distortion == null)
            this.#createNewDistrortion();

        this.distortion.drywet(1); // set only wet

        // console.log(this.currentState);
    }

    distortionOff() {
        this.distortion.drywet(0); // set only dry

        // console.log(this.currentState);
    }

    setDelayTime(time) {            //from 0 to 1 (true to input)
        this.#updateCurrentState({ delay: time });
        if (this.delay != null)     // if null, only update the current state variable
            this.delay.delayTime(this.currentState.delay);
    }

    setDelayFeedback(feedback) {    //from 0 to 0.75 (true to input)
        this.#updateCurrentState({ feedback: feedback });
        if (this.delay != null)
            this.delay.feedback(this.currentState.feedback);
    }

    setReverbDecayTime(time) {      //from 0 to 10 (true to input)
        this.#updateCurrentState({ decay: Math.floor(time) });
        if (this.reverb != null)
            this.reverb.set(this.currentState.decay);
    }

    setDistrotionAmount(amount) {   //from 0.02 to 0.1 (input 1-10)
        this.#updateCurrentState({ amount: Math.floor(amount) * 0.005 })
        if (this.distortion != null)
            this.distortion.set(this.currentState.amount);
    }

    setFilterCutoff(freq) {         //from 10 to 9999 (true to input)
        this.#updateCurrentState({ freq: freq });
        if (this.filter != null)
            this.filter.freq(this.currentState.freq);
    }

    setFilterResonance(resonance) { //from 1 to 30 (input 0.01 - 1)
        this.#updateCurrentState({ resonance: resonance * 30 })
        if (this.filter != null)
            this.filter.res(this.currentState.resonance);
    }

    #updateCurrentState(state) {
        // merge incoming modified values to the effect state 
        this.currentState = merge(this.currentState, state);
    }
}