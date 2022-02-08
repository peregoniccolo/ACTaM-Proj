//import "../libs/jquery-knobs/jquery.knob";
import { init, stopGrain, setPosition, playGrain, setVolume, updateState } from "./modules/granular_module";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// firebase configuration and initialization
const firebaseConfig = {
    apiKey: "AIzaSyAEldmbWYo9NJi_oQ_Hd4wwH5YFcqamZdg",
    authDomain: "actam-proj.firebaseapp.com",
    projectId: "actam-proj",
    storageBucket: "actam-proj.appspot.com",
    messagingSenderId: "281307123752",
    appId: "1:281307123752:web:c69bde0572ae3e7141251d"
};

const firebaseApp = initializeApp(firebaseConfig);
const dbRef = getFirestore();

// preset list population
const presetSelect = document.getElementById("preset-select");
const preset_collection = collection(dbRef, "presets");
var presetMap = {};

async function populatePresetList() {
    const querySnapshot = await getDocs(preset_collection);
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        presetMap[doc.id] = doc.data();
        var newOption = document.createElement('option');
        newOption.value = doc.id;
        newOption.innerHTML = doc.id;
        presetSelect.appendChild(newOption);
    });
    // console.log(presetMap);

}

populatePresetList();

// bind onchange listener

presetSelect.addEventListener("change", e => {

    if(presetSelect.value == "default"){
        animateToDefaultValue();
        return;
    }

    var chosenPreset = presetMap[presetSelect.value];

    // envelope
    var chosenEnv = chosenPreset["envelope"];
    if (chosenEnv != null)
        Object.keys(chosenEnv).forEach(key => {
            //updateGranEnvValue(key, chosenEnv[key]);
            animateToValue(key, chosenEnv[key]);
        })

    // parameters
    Object.keys(chosenPreset).filter(function ($key) {
        return $key != "envelope";
    }).forEach(key => {
        //updateGranParValue(key, chosenPreset[key]);
        animateToValue(key, chosenPreset[key]);
    });

})

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var ctx = new AudioContext();
var inputBuffer, currentAudio;
var waveformDiv = document.getElementById('waveform');

// jquery knobs setup e metodi di update e altro
$('.knob').each(function () {

    var $this = $(this);

    $this.knob({
        'step': 0.01,
        'angleArc': 270,
        'angleOffset': -135,
        'lineCap': 'round',
        'heigth': '80%',
        'fgColor': '#222222',
    });

});

$(".par-knob").each(function () {

    var $this = $(this);
    var elementId = $this.attr("id").split("-")[0];

    $this.trigger(
        'configure',
        {
            'change': function (v) {
                updateGranParValue(elementId, v);
            },
            'release': function (v) {
                updateGranParValue(elementId, v);
            }, // entrambi perchè altrimenti lo scroll non modifica i valori
        }
    );

});

$(".env-knob").each(function () {

    var $this = $(this);
    var elementId = $this.attr("id").split("-")[0];

    $this.trigger(
        'configure',
        {
            'change': function (v) {
                updateGranEnvValue(elementId, v);
            },
            'release': function (v) {
                updateGranEnvValue(elementId, v);
            }, // entrambi perchè altrimenti lo scroll non modifica i valori
        }
    );

});

function updateGranParValue(id, newVal) {
    // fa l'update dello stato di granular tramite un metodo di granular_module
    updateState({
        [id]: newVal
    });
}

function updateGranEnvValue(id, newVal) {
    // fa l'update dello stato di granular tramite un metodo di granular_module
    updateState({
        "envelope": { [id]: newVal }
    });
}

// il log per controllare i valori è in Granular.set()

function animateToDefaultValue() {
    // fa partire l'animazione che porta ai valori di default i knobs quando compaiono
    // contestualmente i valori vengono updatati nello stato (da change), riportandolo al default 

    $('.knob').each(function () {

        var $this = $(this);
        var myVal = $this.attr("default");

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
}

function animateToValue(id, newValue) {
    // fa partire l'animazione che porta ai valori di default i knobs quando compaiono
    // contestualmente i valori vengono updatati nello stato (da change), riportandolo al default 

    // $('.knob').each(function (newState) {

    //     var $this = $(this);
    //     var myVal = $this.attr("default");

    //     //console.log($this, myVal);

    //     $({
    //         value: 0,
    //     }).animate({
    //         value: myVal
    //     }, {
    //         duration: 1000,
    //         easing: 'swing',
    //         step: function () {
    //             $this.val(this.value).trigger('change');
    //         }
    //     })

    // });

    id = "#" + id + "-knob";

    var $this = $(id);

    $this.animate({
        value: newValue
    },{
        duration: 1000,
        easing: 'swing',
        step: function() {
            $this.val(this.value).trigger('change');
        }
    })

}

function toggleKnobs() {
    // compare e scompare gli knobs
    var bars = document.querySelectorAll(".bar");
    bars.forEach(e => {
        e.classList.toggle("nodisplay");
        e.classList.toggle("display-flex");
    });

    if (bars[0].classList.contains("display-flex"))
        animateToDefaultValue();
}






// Wave Representation Object
var wavesurfer = WaveSurfer.create({
    container: document.querySelector('#waveform'),
    waveColor: '#9fa9a3',
    progressColor: '#e3e0cc',
    cursorColor: '#405d27',
    height: 256,
    responsive: true,
    cursorWidth: 2,
    plugins: [
        WaveSurfer.cursor.create({
            showTime: true,
            opacity: 1,
            customShowTimeStyle: {
                'background-color': '484f4f',
                color: '8ca3a3',
                padding: '2px',
                'font-size': '8px',
                'font-family': 'Sans-Serif'
            },
            hideOnBlur: true,
            showTime: true,
            followCursorY: true,
        })
    ]

});

ctx.resume()


// WAVEFORM EVENT LISTENERS
var mouseState = false;

waveformDiv.addEventListener('mousedown', (e) => {
    mouseState = true;
    var bnds = e.target.getBoundingClientRect();
    var x = e.clientX - bnds.left;
    var posX = updateCursorPosition(x);
    //console.log("pos in sec: " + posX)
    //console.log("pos normalizzata: " + normalizeTime(posX));
    wavesurfer.drawer.progress(normalizeTime(posX));

    if (mouseState) {
        playGrain(normalizeTime(posX))
    }
    waveformDiv.addEventListener('mousemove', (e) => {
        bnds = e.target.getBoundingClientRect();
        x = e.clientX - bnds.left;
        posX = updateCursorPosition(x);

        if (mouseState) {
            playGrain(normalizeTime(posX));
            wavesurfer.drawer.progress(normalizeTime(posX));

            //console.log("pos in mousemove: " + posX);
        }
    })
})

waveformDiv.addEventListener('mouseup', (e) => {
    mouseState = false;
    stopGrain()
})


waveformDiv.addEventListener('mouseout', (e) => {
    if (mouseState) {
        mouseState = false;
        stopGrain()
    }
})

//Da posizione in pixel a posizione in secondi
function updateCursorPosition(xpos) {
    const duration = wavesurfer.getDuration();
    const elementWidth =
        wavesurfer.drawer.width /
        wavesurfer.params.pixelRatio;
    const scrollWidth = wavesurfer.drawer.getScrollX();

    const scrollTime =
        (duration / wavesurfer.drawer.width) * scrollWidth;

    const timeValue = Math.max(0, (xpos / elementWidth) * duration) + scrollTime;

    return timeValue
}

function normalizeTime(time) {
    var fileLen = wavesurfer.getDuration();
    return time / fileLen
}








// VIEW
// The methods below handle the interaction of the user with the drag & drop upload zone.
document.querySelectorAll('.drop_zone_input').forEach(inputElement => {
    const dropZoneElement = inputElement.closest(".drop_zone");

    // Manual upload by clicking the drop-zone
    dropZoneElement.addEventListener('click', e => {
        inputElement.click();

    });

    inputElement.addEventListener('change', e => {
        console.log(inputElement.files)
        if (inputElement.files.length) {
            var file = inputElement.files[0]

            // Conversion to data buffer (inputBuffer)
            file.arrayBuffer().then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer)).then((decodedAudio) => {
                inputBuffer = decodedAudio
                init(inputBuffer)

                // rimuovi dropzone e mostra change button
                dropZoneElement.classList.toggle("nodisplay");
                document.getElementById("container_button").classList.toggle("nodisplay");
                document.getElementById("container_button").classList.toggle("display-flex");

                // mostra knobs
                toggleKnobs();

                loadFile(file); // mostra wavesurfer
            });

            dropZoneElement.classList.remove('drop_zone--over');
            document.getElementById('wave_container').classList.toggle('nodisplay');

        }
    })

    // Callback function called when the user drag a file in drop zone. 
    dropZoneElement.addEventListener('dragover', e => {
        e.preventDefault();
        dropZoneElement.classList.add("drop_zone--over");
    });

    // Event handler for drag animation.
    ['dragleave', 'dragend'].forEach(type => {
        dropZoneElement.addEventListener(type, e => {
            dropZoneElement.classList.remove('drop_zone--over');
        });
    });

    // File handling
    dropZoneElement.addEventListener('drop', e => {
        e.preventDefault();

        if (e.dataTransfer.files.length) {
            // Dropped file is handled here
            var file = e.dataTransfer.files[0];


            // Conversion to data buffer (inputBuffer)
            file.arrayBuffer().then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer)).then((decodedAudio) => {
                inputBuffer = decodedAudio
                init(inputBuffer)

                // rimuovi dropzone e mostra change button
                dropZoneElement.classList.toggle("nodisplay");

                document.getElementById("container_button").classList.toggle("display-flex");
                document.getElementById("container_button").classList.toggle("nodisplay");
                document.getElementById('wave_container').classList.toggle('nodisplay');

                // mostra knobs
                toggleKnobs();

                loadFile(file); // mostra wavesurfer
            });
        }

        dropZoneElement.classList.remove('drop_zone--over');
        document.getElementById('waveform').classList.remove('nodisplay')
    });
});

// GESTIONE change button
const new_sample_button = document.getElementById('new_sample_but');

new_sample_button.addEventListener('click', () => {
    // mostra dropzone e rimuovi change button
    document.getElementsByClassName("drop_zone")[0].classList.toggle("nodisplay");

    document.getElementById("container_button").classList.toggle("display-flex");
    document.getElementById("container_button").classList.toggle("nodisplay");
    document.getElementById('wave_container').classList.toggle('nodisplay');

    // mostra knobs
    toggleKnobs()
})

/**
 * 
 * @param {HTMLElement} dropZoneElement 
 * @param {File} file 
 */

/*
function updateThumbnail(dropZoneElement, file) {

    let thumbnailElement = dropZoneElement.querySelector('.drop_zone_thumb');

    // First time: remove the prompt.
    if (dropZoneElement.querySelector('.drop_zone_prompt')) {
        dropZoneElement.querySelector('.drop_zone_prompt').remove();
    }

    // If the thumbnail do not exists, we create it
    if (!thumbnailElement) {
        thumbnailElement = document.createElement('div');
        thumbnailElement.classList.add('drop_zone_thumb');
        dropZoneElement.appendChild(thumbnailElement);
    }

    thumbnailElement.dataset.label = file.name;

    if (file.type.startsWith("audio/")) {
        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = () => {

            // TODO handle audio tumbnail

        }

    } else {
        thumbnailElement.style.backgroundImage = null;
    }

}
*/


// CONTROLLER

// Utility: create a new waveform representation based on the audio file passed as an argument.
function loadFile(file) {
    wavesurfer.loadBlob(file);
}

/* MIDI PROTOCOL

function dropHandler(ev) {
    console.log('File dropped');

    ev.preventDefault()

    if (ev.dataTransfer.items) {
        // We use DataTransferItemList interface to access the file
        for (var i=0; i < ev.dataTransfer.items.length; i++){
            if (ev.dataTransfer.items.kind === 'file') {
                var file = ev.dataTransfer.items[i].getAsFile();
                console.log('file '+i+' : ' + file.name)
            }
        }
    }

    else {
        // Use DataTransfer interface to access the file
        for(var i = 0; i< ev.dataTransfer.files.length; i++){
            console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
        }
    }
}

function dragOverHandler(ev) {
    console.log('Files in drop zone')

    ev.preventDefault()
}

*/

/*

window.AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx;
const startButton = document.querySelector('button'); // need a button to create the audio context
startButton.addEventListener('click', () =>{
    ctx = new AudioContext;
})

*/


if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    console.log('connesso');
}



function onMIDISuccess(midiAccess) {

    console.log(midiAccess)

    midiAccess.addEventListener('statechange', updateDevices)
    const input = midiAccess.inputs;
    input.forEach((input) => {
        input.addEventListener('midimessage', handleInput);
    })
}

function onMIDIFailure() {
    console.log("Failed to get MIDI access ");
}

function updateDevices(event) {
    console.log(event);
}


function handleVelocity(velocity) {
    return velocity / 128
}

function handleInput(input) {
    const command = input.data[0]
    const note = input.data[1]
    const velocity = handleVelocity(input.data[2])
    console.log(command + "|" + note + "|" + velocity)

    switch (command) {
        case 144:
            if (velocity > 0) {
                noteon(note, velocity);
            }
            else {
                noteoff(note);
            }
            break;
        case 128:
            noteoff(note);
            break;
    }

}


function noteon(note, velocity) {

    var frequency = Math.pow(2, (note - 48) / 12);
    console.log("freq: " + frequency)
    playGrain(null, velocity, frequency);

}

function noteoff(note, velocity) {
    stopGrain();
}


