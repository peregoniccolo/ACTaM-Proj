import Granular from '../../libs/Granular/Granular';
import p5 from 'p5';
import 'p5/lib/addons/p5.sound';
import Effects from './Effects';

// PROCESS: a granular object is built with various parameters,
// an audio buffer is passed with setBuffer, with the click of a button startVoice passes initial position and volume 
// this function creates and plays a Voice.

const audioContext = p5.prototype.getAudioContext();

var grainIds = []
var voiceState = false;
var voiceRef = null;
var rawFile = null;

var granular = new Granular({
	audioContext
	// all default values for granular state are uploaded by reading their values from html
	// the granular object is part of the model
	// envelope: {
	// attack: 0.1, 
	// release: 0.5
	// },
	// density: 0.5,
	// spread 0.5,
	// pitch: 0.5
});

granular.setMaster(1);

// set initial values
var voiceOption = {
	position: 0,
	volume: 0.5
};

export var freq;

// Effects object to work the audio effects
export var effects = new Effects(granular);

// setter methods for the voice options and the granular state
export function setPosition(pos) {
	voiceOption.position = pos;
}

export function setVolume(vol) {
	voiceOption.volume = Math.max(vol,0.00001);
}

export function updateState(state) {
	granular.set(state);
}

// getters
export function getVolume(){
	return voiceOption.volume;
}

export function getState() {
	return granular.getState();
}

export function playGrain(position = null, velocity = 1, frequency = null) {
	// infers the creation of a new voice with the correct settings, depending on the way the synth is played (MIDI / mouse)

	if (position) {
		setPosition(position)
	}

	if (frequency) {
		freq =  frequency;
	} else {
		freq = 1;
	}

	if (voiceState) {
		voiceRef.voice.update(voiceOption);
	} else {
		var id = granular.startVoice(voiceOption, velocity)
		voiceRef = granular.getVoice(id);
		voiceState = true;
		grainIds.push(id)
	}
}

export function stopGrain() {
	// stops the current playing voice

	voiceState = false;
	granular.stopVoice(grainIds[0]);
	grainIds = [];
}

// methods used to display the waveform
export function setRawFile(file){
	rawFile = file;
}

export function getRawFile(){
	return rawFile;
}

export function getBuffer() {
	return granular.buffer;
}

export async function init(file) {
	const data = file;

	// console.log(data)
	
	await granular.setBuffer(data);
}


export async function getDataURL(url) {
	return new Promise((resolve) => {
		const request = new XMLHttpRequest();

		request.open('GET', url, true);

		request.responseType = 'arraybuffer';

		request.onload = function () {
			const audioData = request.response;

			resolve(audioData);
		}
		request.send();
	});
}