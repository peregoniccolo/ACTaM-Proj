import p5 from "p5";

export default class Effects{
    constructor(source){
        this.reverb = new p5.Reverb();
        this.delay = new p5.Delay();
        this.filter = new p5.Filter(['lowpass']);
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
	    this.filter.process(this.source, 3000, 0.3);
    }

    filterOff(){
	    this.filter.disconnect();
    }

    distortionOn(){
        this.distortion.process(this.source, 0.20);
    }
    
}

