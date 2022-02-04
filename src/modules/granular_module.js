import Granular from '../../libs/Granular/Granular';
import p5 from 'p5';
import 'p5/lib/addons/p5.sound';

//PROCESSO GENERALE: creo un oggetto granular con vari parametri,
// a cui passo un buffer audio con setBuffer, al click di un bottone faccio startVoice (passando posizione iniziale e volume)
// questa funzione crea e fa suonare delle Voice (che a loro volta creano e fanno suonare dei grain).

//IN QUESTO CASO: ogni tot ms abasso il pitch dei grain

const audioContext = p5.prototype.getAudioContext();

var grainIds = []
var voiceState = false;
var voiceRef = null;

// defaults
// var myDensity, mySpread, myPitch = 0.5;
// var myEnvelope = {
//     attack: 0.1,
//     release: 0.5
// }

var granular = new Granular({
	audioContext // i default vengono caricati leggento il valore da html, il model è effettivamente contenuto nell'oggetto granular
	// envelope: {
	// 	attack: myEnvelope.attack, //occhio a mettere attack 0 perchè poi verrà impostato random
	// 	release: myEnvelope.release
	// },
	// density: myDensity,
	// spread: mySpread,
	// pitch: myPitch
});


var voiceOption = {
	position: 0.5,
	volume: 0.5
};

// Effects

var delay = new p5.Delay();
var reverb = new p5.Reverb();
var compressor = new p5.Compressor();
var lowpass = new p5.Filter(['lowpass']);

export function delayOn(){
	// Parametri di default
	delay.process(granular, 0.1, 0.5, 3000); // source, delayTime, feedback, filter frequency
}

export function delayOff(){
	delay.disconnect();
}

export function reverbOn(){
	reverb.process(granular,2,1);
}

export function reverbOff(){
	reverb.disconnect();
}

export function compressorOn(){
	compressor.process(granular, 0.005, 6, 10, -24, 0.05); // [attack], [knee], [ratio], [threshold], [release]
}

export function compressorOff(){
	compressor.disconnect();
}

export function filterOn(){
	lowpass.process(granular, 3000, 0.3);
}

export function filterOff(){
	lowpass.disconnect();
}


export function setPosition(pos) {
	voiceOption.position = pos;
}

export function setVolume(vol) {
	voiceOption.volume = vol;
}

export function updateState(state) {
	granular.set(state);
}

export function playGrain(position = null, volume = null) {

	if (position) {
		setPosition(position)
	}

	if (volume) {
		setVolume(volume)
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


// In questo metodo vengono settati eventuali effetti.
function setGranular() {
	/*
	//usa p5.js che è molto simile a WebAudio

	// DELAY
	const delay = new p5.Delay();
	delay.process(granular, 0.1, 0.5, 3000); // source, delayTime, feedback, filter frequency


	// REVERB
	const reverb = new p5.Reverb();
  // due to a bug setting parameters will throw error
  // https://github.com/processing/p5.js/issues/3090
	reverb.process(delay); // source, reverbTime, decayRate in %, reverse

	reverb.amp(3);

	// COMPRESSOR
	const compressor = new p5.Compressor();

	compressor.process(reverb, 0.005, 6, 10, -24, 0.05); // [attack], [knee], [ratio], [threshold], [release]

	// LOWPASS FILTER
	const lowpass = new p5.Filter(['lowpass']);
	lowpass.freq(2000);
	lowpass.res(0);
	//granular.on('settingBuffer', () => console.log('setting buffer'));
	//granular.on('bufferSet', () => console.log('buffer set'));
	//granular.on('grainCreated', () => console.log('grain created'));
	*/

}

export async function init(file) {

	setGranular();
	const data = file;
	//await getDataFromFile(file);
	//console.log(data)
	await granular.setBuffer(data);
}

export async function getDataURL(url) { //funzione da modificare in modo da prendere il file drag & droppato dall'utente
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