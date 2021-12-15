import {
  find,
  merge
} from 'lodash';

import Events from './Events';
import Ids from './Ids';

const ids = new Ids();

export default class Granular {
  //la classe Granular ha come campi (1) un oggetto istanza della classe Events (2) uno stato che comprende: boolean isBufferSet, oggetto envelope(con A e R), density, spread, pitch
  //e un array di voices. Nota come al constructor, quando istanzo l'oggetto, si può passare un oggetto di nome options che può specificare vari parametri,
  //i parametri che non vengono specificati vengono impostati con dei valori di default presi dalla costante InistialState (3) un AudioContext (4) un gain

  //in futuro se viene chiamato setBuffer(data) avrà anche (5) un buffer di dati audio, in JS posso definire campi di una classe anche nei metodi della classe stessa
  constructor(options = {}) {
    this.events = new Events();

    const initialState = {
      envelope: {
        attack: random(0.1, 0.9),
        release: random(0.1, 0.9)
      },
      density: random(0.1, 0.9),
      spread: random(0.1, 0.9),
      pitch: 1
    };

    this.state = {
      isBufferSet: false,
      envelope: {
        attack: (options.envelope && options.envelope.attack) ||
          initialState.envelope.attack,
        release: (options.envelope && options.envelope.release) ||
          initialState.envelope.release
      },
      density: options.density || initialState.density,
      spread: options.spread || initialState.spread,
      pitch: options.pitch || initialState.pitch,
      voices: [] //diventerà un array di oggetti fatti così {voce, posizione, volume, id}, l'oggetto "voce" viene definito dopo
    };

    // audio
    this.context = options.audioContext || new AudioContext();

    this.gain = this.context.createGain();
    this.gain.gain.value = 1;

    // connect to destination by default
    this.gain.connect(this.context.destination);
  }

  connect(audioNode) {
    this.gain.connect(audioNode);
  }

  disconnect() {
    this.gain.disconnect();
  }

  on(events, listener) { //aggiungo listener a determinati eventi da me creati
    this.events.on(events, listener);
  }

  off(events, listener) {
    this.events.off(events, listener);
  }

  set(state) { //aggiorna lo state
    this.state = merge(this.state, state);
  }

  /**
   *
   * @param {*} data 
   */
  setBuffer(data) { //crea e setta un buffer audio 
    this.set({ isBufferSet: false });

    this.events.fire('settingBuffer', {
      buffer: data
    });

    if (data instanceof AudioBuffer) { //se il data è già un AudioBuffer imposto semplicemente

      // AudioBuffer
      this.buffer = data; //posso creare e impostare nuovi campi per le classi anche all'interno di funzioni diverse da constructor

      this.set({ isBufferSet: true });

      this.events.fire('bufferSet', {
        buffer: data
      });

      return;
    }

    return new Promise(resolve => {

      // ArrayBuffer
      this.context.decodeAudioData(data, buffer => { //se il data non è di tipo AudioBuffer viene decodato e poi impostato come campo buffer.
                                                      //decodeAudioData decoda il primo parametro e passa il risultato decodato alla lambda fun al secondo parametro
        this.buffer = buffer;

        this.set({ isBufferSet: true });

        this.events.fire('bufferSet', {
          buffer
        });

        resolve(buffer);
      });
    });
  }

  getVoice(id) {
    return find(this.state.voices, voice => voice.id === id);
  }

  /**
   *
   * @param {Object} options - Options.
   * @param {Object} [options.id] - Optional ID.
   * @param {Object} [options.volume] - Optional volume (0.0 - 1.0).
   * @param {Object} [options.position] - Optional position (0.0 - 1-0).
   */
  startVoice(options = {}) { //all'interno di startVoice definiamo la classe Voice, creiamo un oggetto voice e lo facciamo suonare,
                            // posso passare position e volume della voice come options
    if (!this.state.isBufferSet) {
      return;
    }

    // keep reference of the Granular object
    const self = this;

    class Voice { //classe Voice a come campi (1) posizione nel file audio (2) volume (3) array di grani (4) indice dei grani (5) timeout
      constructor(position, volume) {
        this.position = position;
        this.volume = volume;

        this.grains = [];
        this.grainsCount = 0;

        this.timeout = null;
      }

      update(options = {}) {
        if (options.position) {
          this.position = options.position;
        }

        if (options.volume) {
          this.volume = options.volume;
        }
      }

      play() { //creo e suono il grain
        const _innerPlay = () => {
          const grain = self.createGrain(this.position, this.volume); 
          console.log("position in startVoice: " + this.position)

          this.grains[ this.grainsCount ] = grain;
          this.grainsCount++;

          if (this.grainsCount > 20) {
            this.grainsCount = 0;
          }


          // next interval
          const density = map(self.state.density, 1, 0, 0, 1); 
          //mappa il valore di density dell'oggetto granular in modo che più sia alto self.state.density più sia bassa
          //questa const density, così facendo interval verrà più corto e quindi setTimeout chiamerà più spesso _innerPlay
          //In particolare se self.state.density è compreso tra 0 e 1
          // mappa self.state.density in 1-self.state.density
          const interval = (density * 500) + 70;
          //console.log("interval del setTimeout in play()" + interval)

          this.timeout = setTimeout(_innerPlay, interval); //se interval viene fuori negativo perchè self.state.density è troppo grande allora viene usato un valore minimo
                                                          //di default, in tal caso _innerPlay verrà chiamato MOLTO spesso
        }

        _innerPlay();
      }

      stop() {
        clearTimeout(this.timeout);
      }
    } //FINE DEFINIZIONE CLASSE VOICE

    //o passo position e volume quando chiamo la funzion startVoice oppure vengono usati dei valori di default
    let {
      position,
      volume,
      id
    } = options;

    if (!position) {
      position = 0;
    }

    if (!volume) {
      volume = 1;
    }

    if (!id) {
      id = ids.next()
    }

    const voice = new Voice(position, volume); 

    voice.play();

    this.state.voices = [ //aggiunge all'array di voci un nuovo oggetto così fatto: {voce, posizione, volume, id}
      ...this.state.voices,
      {
        voice,
        position,
        volume,
        id
      }
    ];

    return id; //returna id della voce così da poterla fermare in futuro

  } //FINE DEFINIZIONE FUNZIONE startVoice

  updateVoice(id, options) {
    this.state.voices.forEach(voice => {
      if (voice.id === id) {
        voice.voice.update(options);
      }
    });
  }

  stopVoice(id) { //stoppa la voce e la leva dall'array
    this.state.voices.forEach(voice => {
      if (voice.id === id) {
        voice.voice.stop();
      }
    });

    const voices = this.state.voices.filter(v => v.id !== id); //filter crea un nuovo array con gli elementi che hanno passato il test

    this.set({
      voices
    });
  }

  createGrain(position, volume) { // dentro la funzione _innerplay() viene passata la posizione e il volume della voice che sta suonando.
    //Creo un grain e lo faccio suonare, lo spread decide il range di randomness 

    const now = this.context.currentTime;

    // source
    const source = this.context.createBufferSource();
    source.playbackRate.value = source.playbackRate.value * this.state.pitch; //il pitch dell'intero granular influisce sulla velocità di riproduzione del singolo grain
    source.buffer = this.buffer;

    // gain
    const gain = this.context.createGain();
    source.connect(gain);
    gain.connect(this.gain);

    // update position and calcuate offset
    const offset = map(position, 0, 1, 0, this.buffer.duration); //mappa la posizione che viene data da 0 a 1 in una posizione da 0 a durata del buffer audio

    // volume
    volume = clamp(volume, 0, 1); //se volume è minore di 0 lo setta a zero, se valore è maggiore di 1 lo setta a 1

    // parameters
    let attack = this.state.envelope.attack * 0.4;
    let release = this.state.envelope.release * 1.5;

    if (release < 0) {
      release = 0.1;
    }

    const randomoffset = (Math.random() * this.state.spread) - (this.state.spread / 2); //va da -spread/2 a +spread/2

    // envelope
    source.start(now, Math.max(0, offset + randomoffset), attack + release); //inizia ora, parte da offset+randomoffset ms all'interno del buffer (0 se offset+randomoffset è negativo)
                                                                              // finisce a attack + release
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(0, now + (attack + release));

    // garbage collection
    source.stop(now + attack + release + 0.1);

    const disconnectTime = (attack + release) * 1000;

    setTimeout(() => {
      gain.disconnect();
    }, disconnectTime + 200);

    this.events.fire('grainCreated', {
      position,
      volume,
      pitch: this.state.pitch
    });
  } //FINE CREAZIONE GRAIN

} // FINE DEFINIZIONE CLASSE GRANULAR

function map(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function random(min, max) {
  return Math.floor((Math.random() * (max - min)) * 10) / 10 + min
}