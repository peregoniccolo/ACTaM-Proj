import Granular from '../../libs/Granular/Granular';
import p5, { Effect } from 'p5';
import 'p5/lib/addons/p5.sound';
import Effects from './Effects';
// import { async } from '@firebase/util';

// PROCESSO GENERALE: creo un oggetto granular con vari parametri,
// a cui passo un buffer audio con setBuffer, al click di un bottone faccio startVoice (passando posizione iniziale e volume)
// questa funzione crea e fa suonare delle Voice (che a loro volta creano e fanno suonare dei grain).

const audioContext = p5.prototype.getAudioContext();

var grainIds = []
var voiceState = false;
var voiceRef = null;
var rawFile = null;

var granular = new Granular({
	audioContext
	// i default values per il granular state vengono caricati leggendo il valore da html
	// l'oggetto granular è parte del model
	// envelope: {
	// 	attack: , //occhio a mettere attack 0 perchè poi verrà impostato random, ma ho messo il minimo a 0.01
	// 	release: 
	// },
	// density: ,
	// spread ,
	// pitch: 
});

granular.setMaster(1);

var voiceOption = {
	position: 0.5,
	volume: 0.5
};

export var freq;

// Effects

export var effects = new Effects(granular);

export function setPosition(pos) {
	voiceOption.position = pos;
}

export function setVolume(vol) {
	voiceOption.volume = vol;
}

export function updateState(state) {
	granular.set(state);
}

export function playGrain(position = null, volume = null, frequency = null) {

	if (position) {
		setPosition(position)
	}

	if (volume) {
		setVolume(volume)
	}

	if (frequency) {
		freq =  frequency;
	} else {
		freq = 1;
	}

	if (voiceState) {
		voiceRef.voice.update(voiceOption);
	} else {
		var id = granular.startVoice(voiceOption)
		voiceRef = granular.getVoice(id);
		voiceState = true;
		grainIds.push(id)
	}
}

export function stopGrain() {
	voiceState = false;
	granular.stopVoice(grainIds[0]);
	grainIds = [];
}

//used for displaying the waveform
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
	// setGranular();
	const data = file;
	//await getDataFromFile(file);
	//console.log(data)
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