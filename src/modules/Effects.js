import p5 from "p5";
import {
    merge
} from 'lodash';

export default class Effects {

    constructor(source) {
        this.currentState = {
            // defaults are loaded 
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
            // resonance: 10
        };

        this.#createNewDelay();
        this.#createNewReverb();
        this.#createNewDistrortion();
        this.#createNewFilter();
        this.source = source;

        this.#chainEffects();
    }

    #createNewDelay() {
        this.delay = new p5.Delay();
    }

    delayOn() {
        if (this.delay == null)
            this.#createNewDelay();
        this.delay.process(this.source, this.currentState.delay, this.currentState.feedback, this.currentState.filterFreq); // source, delayTime, feedback, filter frequency
    }

    delayOff() {
        this.delay.disconnect();
        this.delay = null;

        console.log(this.currentState);
    }

    #createNewReverb() {
        this.reverb = new p5.Reverb();
    }

    reverbOn() {
        if (this.reverb == null)
            this.#createNewReverb();
        this.reverb.process(this.source, 2, 1);
    }

    reverbOff() {
        this.reverb.disconnect();
        this.reverb = null;

        console.log(this.currentState);
    }

    #createNewFilter() {
        this.filter = new p5.Filter();
    }

    filterOn() {
        if (this.filter == null)
            this.#createNewFilter();
        this.filter.process(this.source, 5000);
    }

    filterOff() {
        this.filter.disconnect();
        this.filter = null;

        console.log(this.currentState);
    }

    #createNewDistrortion() {
        this.distortion = new p5.Distortion();
    }

    distortionOn() {
        if (this.distortion == null)
            this.#createNewDistrortion();
        this.distortion.process(this.source, 0.10);
    }

    distortionOff() {
        this.distortion.disconnect();
        this.distortion = null;

        console.log(this.currentState);
    }

    #chainEffects() {
        this.distortion.chain(this.delay);
        this.delay.chain(this.reverb);
        this.reverb.chain(this.filter);
    }

    setDelayTime(time) {            //from 0 to 1
        this.#updateCurrentState({ delay: time });
        if (this.delay != null)
            this.delay.delayTime(time); // se è null setto solo il current, che verrà ripreso quando ricreo l'oggetto
    }

    setDelayFeedback(feedback) {    //from 0 to 0.75
        this.#updateCurrentState({ feedback: feedback });
        if (this.delay != null)
            this.delay.feedback(feedback);
    }

    setReverbDecayTime(time) {      //from 0 to 10
        this.#updateCurrentState({ decay: time });
        if (this.reverb != null)
            this.reverb.set(time);
    }

    setDistrotionAmount(amount) {   //from 0 to 0.15
        this.#updateCurrentState({ amount: amount })
        if (this.distortion != null)
            this.distortion.set(amount);
    }

    setFilterCutoff(freq) {         //from 10 to 9999
        this.#updateCurrentState({ freq: freq });
        if (this.filter != null)
            this.filter.freq(freq);
    }

    setFilterResonance(resonance) { //from 0.01 to 100
        this.#updateCurrentState({ resonance })
        if (this.filter != null)
            this.filter.res(resonance);
    }

    #updateCurrentState(state) {
        this.currentState = merge(this.currentState, state);
    }

}

