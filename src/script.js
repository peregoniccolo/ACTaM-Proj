import { init, stopGrain, playGrain, setVolume, setPosition, updateState, effects, getBuffer, setRawFile, getState } from "./modules/granular_module";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDoc, getDocs, doc, setDoc } from "firebase/firestore";


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
const presetCollection = collection(dbRef, "presets");
const userSetCollection = collection(dbRef, "user_presets");
const docPresetNumRef = doc(dbRef, "preset_num", "counter_doc");

var presetMap = {};

async function populateSetList(collection) {
    // for each user_preset and create a new options in the select
    const querySnapshot = await getDocs(collection);
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        presetMap[doc.id] = doc.data();
        var newOption = document.createElement('option');
        newOption.value = doc.id;
        newOption.innerHTML = doc.data().name;
        presetSelect.appendChild(newOption);
    });
}

populateSetList(presetCollection).then(() => {
    populateSetList(userSetCollection);
}); // first population

// bind onchange listener to the preset-select HTML element
presetSelect.addEventListener("change", e => {

    if (presetSelect.value == "default") {  // default has been selected
        animateToDefaultValue(true);        // reset only par & env knobs
        return;
    }

    // get the selected preset from the presetMap through its id (name)
    var chosenPreset = presetMap[presetSelect.value];

    // handle envelope update animation
    var chosenEnv = chosenPreset["envelope"];
    if (chosenEnv != null)
        Object.keys(chosenEnv).forEach(key => {
            //updateGranEnvValue(key, chosenEnv[key]);
            animateToValue(key, chosenEnv[key]);
        })

    // handle parameters update animation
    Object.keys(chosenPreset).filter(function ($key) {
        return $key != "envelope";
    }).forEach(key => {
        animateToValue(key, chosenPreset[key]);
    });

})


// user saved preset handling
var savePresetBtn = document.getElementById("save-preset");
var presetNum;

async function getCurrNumOfPresets() {
    // read current number of elements on the preset_num collection in firebase

    const docSnap = await getDoc(docPresetNumRef);
    presetNum = docSnap.data()['counter'];
}

// add save preset button listener
savePresetBtn.addEventListener('click', e => {

    getCurrNumOfPresets().then(() => {

        // get the state from the granular object in granular_modules
        var stateToSave = getState();
        var id = "userPreset" + presetNum;

        // create new document with specific id
        const docRefNewPreset = doc(dbRef, "user_presets", id);

        const dataNewPreset = {
            name: id,
            density: stateToSave.density,
            spread: stateToSave.spread,
            pitch: stateToSave.pitch,
            envelope: {
                attack: stateToSave.envelope.attack,
                release: stateToSave.envelope.release
            }
        };

        // write document on db
        setDoc(docRefNewPreset, dataNewPreset).then(() => {
            // when the document is saved

            // depopulate user sets
            var i, L = presetSelect.options.length - 1;
            for (i = L; i >= 5; i--) // leave the first 4
                presetSelect.remove(i);

            // repopulate list
            populateSetList(userSetCollection).then(() => {
                // select newly added item
                presetSelect.value = id;
            });

            // increment number of presets
            setDoc(docPresetNumRef, { counter: presetNum + 1 });
        });

    });

});

// audio context
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var ctx = new AudioContext();
var inputBuffer, currentAudio;

// KNOBS

// jquery knobs setup and update methods
$('.knob').each(function () {
    // basic setup for each knob, other parameters are specified directly in the HTML

    var $this = $(this);

    $this.knob({
        'step': 0.01,
        'angleArc': 270,
        'angleOffset': -135,
        'lineCap': 'round',
        'fgColor': '#33383a',
    });

});

$(".par-knob").each(function () {
    // specifications for granular parameter knobs

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
            }, // both to let the scroll modify the value
        }
    );

});

$(".env-knob").each(function () {
    // specifications for granular parameter envelope knobs

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
            }, // both to let the scroll modify the value
        }
    );

});

$("#volume-knob").each(function () {
    // specifications for the master volume knobs

    var $this = $(this);

    $this.trigger(
        'configure',
        {
            'change': function (v) {
                setVolume(v);
            },
            'release': function (v) {
                setVolume(v);
            }, // both to let the scroll modify the value
        }
    );

});

// EFFECT knobs and buttons

// handle style of toggle button for all the effects
document.querySelectorAll('.toggle').forEach(inputElement => {
    inputElement.addEventListener('click', () => {
        inputElement.classList.toggle('toggle-active');
    });
});

// delay
var isSetDelay = false;
var delayButton = document.getElementById('delay-toggle');
delayButton.addEventListener('click', () => { // delay effect toggle
    if (isSetDelay)
        effects.delayOff();
    else
        effects.delayOn();
    isSetDelay = !isSetDelay;
});

// delay: feedback & delay time knobs
$("#feedback-knob").each(function () {
    // specifications for the feedback knob

    var $this = $(this);

    $this.trigger(
        'configure',
        {
            'change': function (v) {
                effects.setDelayFeedback(v);
            },
            'release': function (v) {
                effects.setDelayFeedback(v);
            }, // both to let the scroll modify the value
        }
    );

});

$("#delay-knob").each(function () {
    // specifications for the time delay knob

    var $this = $(this);

    $this.trigger(
        'configure',
        {
            'change': function (v) {
                effects.setDelayTime(v)
            },
            'release': function (v) {
                effects.setDelayTime(v);
            }, // both to let the scroll modify the value
        }
    );

});

// reverb
var isSetReverb = false;
var reverbButton = document.getElementById('reverb-toggle');
reverbButton.addEventListener('click', () => { // reverb effect toggle
    if (isSetReverb)
        effects.reverbOff();
    else
        effects.reverbOn();
    isSetReverb = !isSetReverb;
});

// reverb: time decay knob
$("#decay-knob").each(function () {
    // specifications for the time decay knob

    var $this = $(this);

    $this.trigger(
        'configure',
        {
            'step': 1,
            'change': function (v) {
                effects.setReverbDecayTime(v)
            },
            'release': function (v) {
                effects.setReverbDecayTime(v);
            }, // both to let the scroll modify the value
        }
    );

});

// distortion
var isSetDistortion = false;
var distortionButton = document.getElementById('distortion-toggle');
distortionButton.addEventListener('click', () => { // distortion effect toggle
    if (isSetDistortion)
        effects.distortionOff();
    else
        effects.distortionOn();
    isSetDistortion = !isSetDistortion;
});

// distortion: amount knob
$("#amount-knob").each(function () {
    // specifications for the distortion amount knob

    var $this = $(this);

    $this.trigger(
        'configure',
        {
            'step': 1,
            'change': function (v) {
                effects.setDistrotionAmount(v)
            },
            'release': function (v) {
                effects.setDistrotionAmount(v);
            }, // both to let the scroll modify the value
        }
    );

});

// lpf
var isSetLPF = false;
var lpfButton = document.getElementById('lpf-toggle');
lpfButton.addEventListener('click', () => { // lpf effect toggle
    if (isSetLPF)
        effects.filterOff();
    else
        effects.filterOn();
    isSetLPF = !isSetLPF;
});

// lfp: frequency and resonance knobs
$("#freq-knob").each(function () {
    // specifications for the cutoff frequency knob

    var $this = $(this);

    $this.trigger(
        'configure',
        {
            'step': 1,
            'change': function (v) {
                effects.setFilterCutoff(v)
            },
            'release': function (v) {
                effects.setFilterCutoff(v);
            }, // both to let the scroll modify the value
        }
    );

});

$("#resonance-knob").each(function () {
    // specifications for the resonance knob

    var $this = $(this);

    $this.trigger(
        'configure',
        {
            'change': function (v) {
                effects.setFilterResonance(v)
            },
            'release': function (v) {
                effects.setFilterResonance(v);
            }, // both to let the scroll modify the value
        }
    );

});


function updateGranParValue(id, newVal) {
    // upgrade of granular state with granular_module method 
    updateState({
        [id]: newVal
    });
}

function updateGranEnvValue(id, newVal) {
    // upgrade of granular state envelope with granular_module method
    updateState({
        "envelope": { [id]: newVal }
    });
}

function animateToDefaultValue(isPresets = false) {
    // starts the default value knobs animation 
    // values updated with change, back to default 

    var knobs;

    if (isPresets)
        knobs = $(".par-knob, .env-knob"); // only the main parameters are defaulted
    else
        knobs = $(".knob");

    knobs.each(function () {

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

function animateToValue(id, newValue, duration = 1000) {
    // starts the default value knobs animation 

    id = "#" + id + "-knob";

    var $this = $(id);

    $this.animate({
        value: newValue
    }, {
        duration: duration,
        easing: 'swing',
        step: function () {
            $this.val(this.value).trigger('change');
        }
    })

}

function toggleBarContainer() {
    // display the main bar container
    var barContainer = document.querySelector("#bar-container");
    barContainer.classList.toggle("nodisplay");

    // then animate to default value
    if (!barContainer.classList.contains("nodisplay"))
        animateToDefaultValue();
}


// waveform bar
var waveformDiv = document.getElementById('waveform');

var wavesurfer = WaveSurfer.create({
    container: document.querySelector('#waveform'),
    waveColor: '#9fa9a3',
    progressColor: '#e3e0cc',
    cursorColor: '#405d27',
    height: 185,
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

ctx.resume();


// Waveform event listeners
var mouseState = false;

waveformDiv.addEventListener('mousedown', (e) => {
    // sets correct position and updates it correctly based on the normalization and movement

    mouseState = true;
    var bnds = e.target.getBoundingClientRect();
    var x = e.clientX - bnds.left;
    var posX = updateCursorPosition(x);
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
            // console.log("pos in mousemove: " + posX);
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

// pixels and seconds position
function updateCursorPosition(xpos) {
    // returns time corresponding to xpos on the waveform 

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
    // returns normalized time 

    var fileLen = wavesurfer.getDuration();
    return time / fileLen
}

// DROP ZONE
document.querySelectorAll('.drop_zone_input').forEach(inputElement => {
    // handle the interaction of the user with the drag & drop upload zone

    const dropZoneElement = inputElement.closest(".drop_zone");

    // click upload
    dropZoneElement.addEventListener('click', e => {
        inputElement.click()

        // reset FileList
        if (inputElement.files.length) {
            inputElement.value = '';
        }
    });

    inputElement.addEventListener('change', e => {
        if (inputElement.files.length) {
            var file = inputElement.files[0]
            setRawFile(file); // fotl
            if (fileValidation(file)) {
                // conversion to data buffer (inputBuffer)
                file.arrayBuffer().then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer)).then((decodedAudio) => {
                    inputBuffer = decodedAudio

                    init(inputBuffer) // inizialize granular

                    // removes dropzone and button container
                    dropZoneElement.classList.toggle("nodisplay");
                    document.getElementById("button-container").classList.toggle("nodisplay");

                    // display necessary containers
                    document.getElementById('wave-container').classList.toggle('nodisplay');
                    document.getElementById('sample-container').classList.toggle('nodisplay');

                    // show bar-container
                    toggleBarContainer();

                    loadFile(file); // shows waveform 
                });
            }

            dropZoneElement.classList.remove('drop_zone--over');
        }
    })

    // drag and drop upload
    dropZoneElement.addEventListener('dragover', e => {
        e.preventDefault();
        dropZoneElement.classList.add("drop_zone--over");
    });

    // event handler for drag animation
    ['dragleave', 'dragend'].forEach(type => {
        dropZoneElement.addEventListener(type, e => {
            dropZoneElement.classList.remove('drop_zone--over');
        });
    });

    // file handling
    dropZoneElement.addEventListener('drop', e => {
        e.preventDefault();

        if (e.dataTransfer.files.length) {
            // dropped file is handled here
            var file = e.dataTransfer.files[0];
            setRawFile(file);
            if (fileValidation(file)) {
                // conversion to data buffer (inputBuffer)
                file.arrayBuffer().then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer)).then((decodedAudio) => {
                    inputBuffer = decodedAudio;
                    init(inputBuffer)
                    // removes dropzone
                    dropZoneElement.classList.toggle("nodisplay");

                    // display necessary containers
                    document.getElementById("button-container").classList.toggle("nodisplay");
                    document.getElementById('wave-container').classList.toggle('nodisplay');
                    document.getElementById('sample-container').classList.toggle('nodisplay');

                    // show bar-container
                    toggleBarContainer();

                    loadFile(file); // shows waveform
                });
            }

            dropZoneElement.classList.remove('drop_zone--over');
        }
    });
});

// change sample button handler
const new_sample_button = document.getElementById('new_sample_but');

new_sample_button.addEventListener('click', () => {
    //set position to 0
    setPosition(0);

    // shows dropzone
    document.getElementsByClassName("drop_zone")[0].classList.toggle("nodisplay");

    // hide necessary bars
    document.getElementById("button-container").classList.toggle("nodisplay");
    document.getElementById('wave-container').classList.toggle('nodisplay');
    document.getElementById('sample-container').classList.toggle('nodisplay');
    if (!document.getElementById('popup-container').classList.contains("nodisplay"))
        document.getElementById('popup-container').classList.toggle("nodisplay");

    // show bar-container
    toggleBarContainer();

    $("#preset-select").val("default");
})

// sample-container buttons: default audio files
const defaultSample1 = document.getElementById('sample1');
const defaultSample2 = document.getElementById('sample2');
// audio files
const audioUrl1 = require('../media/Distort.wav');
const audioUrl2 = require('../media/pipa.wav');
var sampleLoaded1 = false;
var sampleLoaded2 = false;
let audio;
let audio2;


// add listeners to default sample buttons
defaultSample1.addEventListener('click', () => {

    if (!sampleLoaded1) {

        // fetch the audio file
        fetch(audioUrl1)
            .then(data => {
                setRawFile(data)
                return data.arrayBuffer()
            })
            .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
            .then(decodedAudio => {
                audio = decodedAudio
                init(audio); // create granular object
                wavesurfer.load(audioUrl1) // load wavesurfer object

                // hide dropzone and show other containers
                document.getElementsByClassName("drop_zone")[0].classList.toggle("nodisplay");
                document.getElementById("button-container").classList.toggle("nodisplay");
                document.getElementById('wave-container').classList.toggle('nodisplay');
                document.getElementById('sample-container').classList.toggle('nodisplay');
                toggleBarContainer();

            });

    }
});

defaultSample2.addEventListener('click', () => {

    if (!sampleLoaded2) {

        // fetch the audio file
        fetch(audioUrl2)
            .then(data => {
                setRawFile(data)
                return data.arrayBuffer()
            })
            .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
            .then(decodedAudio => {
                audio2 = decodedAudio
                init(audio2); // create granular object
                wavesurfer.load(audioUrl2) // load wavesurfer object

                // hide dropzone and show other containers
                document.getElementsByClassName("drop_zone")[0].classList.toggle("nodisplay");
                document.getElementById("button-container").classList.toggle("nodisplay");
                document.getElementById('wave-container').classList.toggle('nodisplay');
                document.getElementById('sample-container').classList.toggle('nodisplay');
                toggleBarContainer();

            });

    }

});

// reverse sample button listener
document.getElementById('reverse').addEventListener('click', () => {

    if (getBuffer() != null) {
        // reverse the current audio buffer
        var buffer = getBuffer();
        Array.prototype.reverse.call(buffer.getChannelData(0));
        Array.prototype.reverse.call(buffer.getChannelData(1));

        init(buffer); // init new granular

        wavesurfer.loadDecodedBuffer(buffer); // load new buffer on the waveform
    }

})


// create a new waveform representation based on the audio file passed as an argument
function loadFile(file) {
    wavesurfer.loadBlob(file);
}

function fileValidation(file) {
    // checks that the audio file to be selected is indeed an audio file

    var fileInput = file;

    var filePath = fileInput.name;

    // allowing file type
    var allowedExtensions =
        /(\.mp3|\.wav|\.ogg|\.aac)$/i;

    if (!allowedExtensions.exec(filePath)) {
        alert('Invalid file type: please upload only audio file with extension .mp3, .wav, .ogg, .aac');
        fileInput.value = '';
        return false;
    } else {
        return true;
    }
}

// MIDI PROTOCOL

var controllerArray = [0, 0, 0];
var numnotes = 0;

if (navigator.requestMIDIAccess) {
    // assign methods to dynamically handle midi access requests
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
}

function onMIDISuccess(midiAccess) {
    console.log('MIDI available.');

    midiAccess.onstatechange =  (event) => {
        updateDevices(event.target)
    };
    updateDevices(midiAccess);
}

function onMIDIFailure() {
    console.log("Failed to get MIDI access. Try reloading the page.");
}

function updateDevices(midiAccess) {
    // update list of devices once requested 
    midiAccess.inputs.forEach((input) => {
        input.addEventListener('midimessage', handleInput);
    })
}

function handleVelocity(velocity) {
    // normalize velocity value
    return velocity / 128
}

function handleInput(input) {
    // main midi input handling method

    if (document.querySelector("#bar-container").classList.contains("nodisplay"))
        return; // if so, im not ready to play or i'm changing sample

    var command = input.data[0]
    var note = input.data[1]
    var velocity = handleVelocity(input.data[2])
    // console.log(command + "|" + note + "|" + velocity)

    // setting a new midi knob for the parameters
    if (contr1enabled && command == 176) {  // first parameter setting
        controllerArray[0] = { [note]: select1.value };
        contr1.value = note;
        // console.log("CONTRARRAY[0] ", controllerArray[0])
    }

    else if (contr2enabled && command == 176) { // second parameter setting
        controllerArray[1] = { [note]: select2.value };
        contr2.value = note;
        // console.log("CONTRARRAY[1] ", controllerArray[1])
    }

    else if (contr3enabled && command == 176) { // third parameter setting
        controllerArray[2] = { [note]: select3.value };
        contr3.value = note;
        // console.log("CONTRARRAY[2] ", controllerArray[2])
    }

    else {

        switch (command) {
            case 144: // keyboard note on message
                numnotes += 1;
                if (velocity > 0) {
                    noteon(note, velocity);
                }
                else {
                    noteoff(note);
                }
                break;

            case 128: // note off
                numnotes -= 1;
                if (numnotes < 1) {
                    noteoff(note);
                }
                break;

            case 176: // knob/slider control message

                if (controllerArray[0]) {

                    var scale = 1;

                    var knobname = controllerArray[0][input.data[1]];
                    var paramvalue = input.data[2] / 127 * scale;
                    $("#" + knobname).val(paramvalue).trigger("change");

                }

                if (controllerArray[1]) {

                    var scale = 1;

                    var knobname = controllerArray[1][input.data[1]];
                    var paramvalue = input.data[2] / 127 * scale;
                    $("#" + knobname).val(paramvalue).trigger("change");

                }

                if (controllerArray[2]) {

                    var scale = 1;

                    var knobname = controllerArray[2][input.data[1]];
                    var paramvalue = input.data[2] / 127 * scale;
                    $("#" + knobname).val(paramvalue).trigger("change");

                }
                break;
        }

    }

}

function noteon(note, velocity) {
    // calculate pitch shift due to midi note numeber and play new grain 

    var frequency = Math.pow(2, (note - 48) / 12);
    // console.log("freq: " + frequency)
    playGrain(null, velocity, frequency);
}

function noteoff(note, velocity) {
    stopGrain();
}


// CONTROLLER POPUP

const popupCont = document.getElementById("popup-container");
const popupB = document.getElementById('popupButton');
const contrSet = document.getElementById('controllerset');
const contr1 = document.getElementById('controller1');
const contr2 = document.getElementById('controller2');
const contr3 = document.getElementById('controller3');
const select1 = document.getElementById('select1');
const select2 = document.getElementById('select2');
const select3 = document.getElementById('select3');
var contr1enabled = false;
var contr2enabled = false;
var contr3enabled = false;

// controller popup button handler
popupB.addEventListener('click', () => {
    // show popup

    popupCont.classList.toggle("nodisplay");
});

contrSet.addEventListener('click', () => {
    // set specified knobs and remove popup display

    contr1enabled = false;
    contr2enabled = false;
    contr3enabled = false;

    popupCont.classList.toggle("nodisplay");
});

contr1.addEventListener('click', () => {
    // reset first parameter and change it

    // console.log("1")

    controllerArray[0] = 0;
    contr1.value = "";

    contr1enabled = true;
    contr2enabled = false;
    contr3enabled = false;
});

contr2.addEventListener('click', () => {
    // reset second parameter and change it

    // console.log("2")

    controllerArray[1] = 0;
    contr2.value = "";

    contr2enabled = true;
    contr1enabled = false;
    contr3enabled = false;
});

contr3.addEventListener('click', () => {
    // reset third parameter and let us change it

    // console.log("3")

    controllerArray[2] = 0;
    contr3.value = "";

    contr3enabled = true;
    contr2enabled = false;
    contr1enabled = false;
});

// reset selected parameter name to preper new set for input
select1.addEventListener('change', () => {
    controllerArray[0] = 0;
    contr1.value = "";
});

select2.addEventListener('change', () => {
    controllerArray[1] = 0;
    contr2.value = "";
});

select3.addEventListener('change', () => {
    controllerArray[2] = 0;
    contr3.value = "";
});