import Granular from '../libs/Granular/Granular';

import p5 from 'p5';
import 'p5/lib/addons/p5.sound';

import Vue from "vue";
import App from "./App.vue";

window.onload = function () {
	new Vue({
		render: h => h(App)
	}).$mount("#app");
}

//PROCESSO GENERALE: creo un granular con vari parametri, gli passo un bufer audio con setBuffer, al click di un bottone faccio startVoice (passando posizione iniziale e volume)

// questa funzione crea e fa suonare delle Voice (che a loro volta creano e fanno suonare dei grain).

//IN QUESTO CASO: ogni tot ms abasso il pitch dei grain

async function getData(url) { //funzione da modificare in modo da prendere il file drag & droppato dall'utente
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

async function init() {
	const audioContext = p5.prototype.getAudioContext();

	const granular = new Granular({
		audioContext,
		envelope: {
			attack: 0,
			release: 0.5
		},
		density: 0.1,
		spread: 0.1,
		pitch: 1
	});

	//usa p5.js che è molto simile a WebAudio
	const delay = new p5.Delay();

	delay.process(granular, 0.5, 0.5, 3000); // source, delayTime, feedback, filter frequency

	const reverb = new p5.Reverb();

	// due to a bug setting parameters will throw error
	// https://github.com/processing/p5.js/issues/3090
	reverb.process(delay); // source, reverbTime, decayRate in %, reverse

	reverb.amp(3);

	const compressor = new p5.Compressor();

	compressor.process(reverb, 0.005, 6, 10, -24, 0.05); // [attack], [knee], [ratio], [threshold], [release]

	granular.on('settingBuffer', () => console.log('setting buffer'));
	granular.on('bufferSet', () => console.log('buffer set'));
	granular.on('grainCreated', () => console.log('grain created'));

	const data = await getData('example.wav');
	console.log(data)

	await granular.setBuffer(data);

	const resume = document.getElementById('resume');

	resume.addEventListener('click', () => {
		const id = granular.startVoice({ //passo a startVoice una posizione e un volume, lei la passerà a sua volta a una voice che viene creata al suo interno 
			//(guarda Granular.js -> startVoice).
			//Nel momento in cui viene chiamata play su questa voice essa creerà e suonerà un grain nel modo opportuno (guarda Granular.js -> createGain)

			position: 0.1,
			volume: 0.5
		});

		let pitch = 1;

		const interval = setInterval(() => { //ogni 200ms abbasso il pitch di 0.05, esso andrà a influire il playbackRate.value del buffer (guarda Granular.js -> createGain)
			pitch -= 0.05;

			granular.set({
				pitch
			});
		}, 200);

		setTimeout(() => {
			clearInterval(interval);

			granular.stopVoice(id);

			granular.set({
				pitch: 1
			});
		}, 2000);
	})
}

init();