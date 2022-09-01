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
            // resonance: 0.5
        };

        this.source = source;
        this.source.disconnect();

        this.#createNewFilter();
        this.#createNewDistrortion();
        this.#createNewDelay();
        this.#createNewReverb();

        //this.#chainEffects();
    }

    #createNewDelay() {
        this.delay = new p5.Delay();
    }

    delayOn() {
        if (this.delay == null)
            this.#createNewDelay();
        this.delay.process(this.distortion, this.currentState.delay, this.currentState.feedback, this.currentState.filterFreq); // source, delayTime, feedback, filter frequency
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
        this.reverb.process(this.distortion, 2, 1);
    }

    reverbOff() {
        this.reverb.disconnect();
        this.reverb = null;

        console.log(this.currentState);
    }

    #createNewFilter() {
        this.filter = new p5.Filter();
        this.source.connect(this.filter);
        this.filter.drywet(0);
    }

    filterOn() {
        if (this.filter == null)
            this.#createNewFilter();
        //this.filter.process(this.source, 5000);
        this.filter.drywet(1);
    }

    filterOff() {
        //this.filter.disconnect();
        //this.filter = null;
        this.filter.drywet(0);
        console.log(this.currentState);
    }

    #createNewDistrortion() {
        this.distortion = new p5.Distortion();
        this.filter.connect(this.distortion);
        this.distortion.drywet(0);
    }

    distortionOn() {
        console.log(this.currentState);

        if (this.distortion == null)
            this.#createNewDistrortion();
        //this.distortion.process(this.filter, 0.10);
        this.distortion.drywet(1);
    }

    distortionOff() {
        //this.distortion.disconnect();
        //this.distortion = null;
        this.distortion.drywet(0);
        console.log(this.currentState);
    }

    setDelayTime(time) {            //from 0 to 1
        this.#updateCurrentState({ delay: time });
        if (this.delay != null)
            this.delay.delayTime(this.currentState.delay); // se è null setto solo il current, che verrà ripreso quando ricreo l'oggetto
    }

    setDelayFeedback(feedback) {    //from 0 to 0.75
        this.#updateCurrentState({ feedback: feedback });
        if (this.delay != null)
            this.delay.feedback(this.currentState.feedback);
    }

    setReverbDecayTime(time) {      //from 0 to 10
        this.#updateCurrentState({ decay: time });
        if (this.reverb != null)
            this.reverb.set(this.currentState.decay);
    }

    setDistrotionAmount(amount) {   //from 0.02 to 0.1
        this.#updateCurrentState({ amount: amount * 0.005 })
        if (this.distortion != null)
            this.distortion.set(this.currentState.amount);
    }

    setFilterCutoff(freq) {         //from 10 to 9999
        this.#updateCurrentState({ freq: freq });
        if (this.filter != null)
            this.filter.freq(this.currentState.freq);
    }

    setFilterResonance(resonance) { //from 1 to 30
        this.#updateCurrentState({ resonance: resonance * 30 })
        if (this.filter != null)
            this.filter.res(this.currentState.resonance);
    }

    #updateCurrentState(state) {
        this.currentState = merge(this.currentState, state);
    }

}