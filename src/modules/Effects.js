import p5 from "p5";

export default class Effects{
    constructor(source){
        this.reverb = new p5.Reverb();
        this.delay = new p5.Delay();
        this.filter = new p5.Filter();
        this.distortion = new p5.Distortion();
        this.source = source
    }

    delayOn(){
        // Parametri di default
        this.delay.process(this.source, 0.1, 0.5, 3000); // source, delayTime, feedback, filter frequency
    }

    delayOff(){
        this.delay.disconnect();
    }

    reverbOn(){
        this.reverb.process(this.source,2,1);
    }
    
    reverbOff(){
        this.reverb.disconnect();
    }
    
    filterOn(){
        this.filter.process(this.source,5000);
    }

    filterOff(){
	    this.filter.disconnect();
    }

    distortionOn(){
        this.distortion.process(this.source, 0.10);
    }

    distortionOff(){
        this.distortion.disconnect();
    }

    chainEffects(){
        this.distortion.chain(this.delay);
        this.delay.chain(this.reverb);
        this.reverb.chain(this.filter);
    }

    //Exporting parameters

    setDelayTime(time) { //from 0 to 1
        this.delay.delayTime(time);
    }

    setDelayFeedback(feedback) { //from 0 to 1
        this.delay.feedback(feedback);
    }

    setReverbDecayTime(time){ //from 0 to 10
        this.reverb.set(time)
    }

    setDistrotionAmount(amount){ //from 0 to 0.15
        this.distortion.set(amount);
    }

    setFilterCutoff(freq){ //from 10 to 22000
        this.filter.freq(freq);
    }

    setFilterResonance(resonance){ //from 0.001 to 100
        this.filter.res(resonance);
    }
    
}

