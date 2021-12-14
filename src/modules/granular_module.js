import Granular from '../../libs/Granular/Granular';
import p5 from 'p5';
import 'p5/lib/addons/p5.sound';

//PROCESSO GENERALE: creo un oggetto granular con vari parametri,
// a cui passo un buffer audio con setBuffer, al click di un bottone faccio startVoice (passando posizione iniziale e volume)
// questa funzione crea e fa suonare delle Voice (che a loro volta creano e fanno suonare dei grain).

//IN QUESTO CASO: ogni tot ms abasso il pitch dei grain

var grainIds = []

const audioContext = p5.prototype.getAudioContext();

var granular = new Granular({
  audioContext,
  envelope: {
    attack: 0.001, //occhio a mettere attack 0 perchè poi verrà impostato random
    release: 0.1
  },
  density: 0.1,
  spread: 10,
  pitch: 1
});

var voiceOption = {
  position:0.5,
  volume: 0.5
};

export function setPosition(pos){
  voiceOption.position=pos;
}

export function setVolume(vol){
  voiceOption.volume=vol;
}

export function playGrain(){
  var id = granular.startVoice(voiceOption)
  grainIds.push(id)
}

export function stopGrain(){
  granular.stopVoice(grainIds[0]);
}



function setGranular() {
    /*usa p5.js che è molto simile a WebAudio
    const delay = new p5.Delay();

    delay.process(granular, 0.1, 0.5, 3000); // source, delayTime, feedback, filter frequency

    const reverb = new p5.Reverb();

  // due to a bug setting parameters will throw error
  // https://github.com/processing/p5.js/issues/3090
    reverb.process(delay); // source, reverbTime, decayRate in %, reverse

    reverb.amp(3);

    const compressor = new p5.Compressor();

    compressor.process(reverb, 0.005, 6, 10, -24, 0.05); // [attack], [knee], [ratio], [threshold], [release]

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


  // GESTIONE BOTTONE TRYME
  const resume = document.getElementById('resume');
   
  resume.addEventListener('click', () => {
      const id = granular.startVoice( //passo a startVoice una posizione e un volume, lei la passerà a sua volta a una voice che viene creata al suo interno 
       //(guarda Granular.js -> startVoice).
       //Nel momento in cui viene chiamata play su questa voice essa creerà e suonerà un grain nel modo opportuno (guarda Granular.js -> createGain)
       voiceOption
      
   );
   
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

  /**
   EVENT LISTENER PER BOTTONE
  
*/
