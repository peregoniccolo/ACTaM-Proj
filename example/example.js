import Granular from '../libs/Granular/Granular';

import p5 from 'p5';
import 'p5/lib/addons/p5.sound';

// model
var myDensity, mySpread, myPitch = 0.5;
var myEnvelope = {
    attack: 0.1,
    release: 0.5
}


// jquery knobs setup
$('.knob').each(function () {

    var $this = $(this);
    var myVal = $this.attr("rel");
    var elementId = $this.attr("id");

    $this.knob({
        // onclick
        'change': function (v) {
            updateModelValues(elementId, v);
        },
        'release': function (v) {
            updateModelValues(elementId, v);
        }, // entrambi perchè altrimenti lo scroll non modifica i valori

        'step': 0.01,
        'angleArc': 270,
        'angleOffset': -135,
        'lineCap': 'round',
        'width': '100%',
        'heigth': '80%',
        'fgColor': '#222222',
    });

    $({
        value: 0,
    }).animate({
        value: myVal
    }, {
        duration: 1000,
        easing: 'swing',
        step: function () {
            $this.val(this.value).trigger('change');
        }
    })

});

function updateModelValues(id, newVal) {
    switch (id) {
        case 'density-knob':
            //console.log("density", newVal);
            myDensity = newVal;
            break;
        case 'spread-knob':
            //console.log("spread", newVal);
            mySpread = newVal;
            break;
        case 'pitch-knob':
            //console.log("pitch", newVal);
            myPitch = newVal;
            break;
        case 'attack-knob':
            // console.log("attack", newVal);
            myEnvelope.attack = newVal;
            break;
        case 'release-knob':
            // console.log("release", newVal);
            myEnvelope.release = newVal;
            break;
        default:
            break;
    }
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
            attack: myEnvelope.attack,
            release: myEnvelope.release
        },
        density: myDensity,
        spread: mySpread,
        pitch: myPitch
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

    await granular.setBuffer(data);

    const resume = document.getElementById('resume');

    resume.addEventListener('click', () => {

        updateGranState();

        const id = granular.startVoice({
            //passo a startVoice una posizione e un volume, lei la passerà a sua volta a una voice che viene creata al suo interno 
            //(guarda Granular.js -> startVoice).
            //Nel momento in cui viene chiamata play su questa voice essa creerà e suonerà un grain nel modo opportuno (guarda Granular.js -> createGain)

            position: 0.1,
            volume: 0.5
        });

        const interval = setInterval(() => {
            updateGranState()
        }, 200);

        setTimeout(() => {

            clearInterval(interval);
            updateGranState()
            granular.stopVoice(id);
        }, 2000);
    })

    function updateGranState() {
        var state = {
            envelope: {
                attack: myEnvelope.attack,
                release: myEnvelope.release,
            },
            density: myDensity,
            spread: mySpread,
            pitch: myPitch
        }
        granular.set(state);
    }
}

init();