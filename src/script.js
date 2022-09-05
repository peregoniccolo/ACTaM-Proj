import { init, stopGrain, setPosition, playGrain, setVolume, updateState, effects, deleteGranular, getBuffer, setRawFile, getRawFile, getVolume, getState } from "./modules/granular_module";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";


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
const initialPresetNum = 5;

var presetMap = {};

async function populatePresetList() {
    const querySnapshot = await getDocs(preset_collection);
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        presetMap[doc.id] = doc.data();
        var newOption = document.createElement('option');
        newOption.value = doc.id;
        newOption.innerHTML = doc.data().name;
        presetSelect.appendChild(newOption);
    });
}

populatePresetList();

// bind onchange listener
presetSelect.addEventListener("change", e => {

    if (presetSelect.value == "default") {
        animateToDefaultValue(true); // reset only par & env knobs
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
        console.log(key);
        animateToValue(key, chosenPreset[key]);
    });

})

var savePresetBtn = document.getElementById("save-preset");

savePresetBtn.addEventListener('click', e => {
    var presetCounter = presetSelect.length - initialPresetNum;
    console.log(presetCounter);
    var stateToSave = getState();
    console.log(stateToSave);

    const docRef = doc(dbRef, "presets", "userPreset" + presetCounter);

    const data = {
        name: "userPreset" + presetCounter,
        density: stateToSave.density,
        spread: stateToSave.spread,
        pitch: stateToSave.pitch,
        envelope: {
            attack: stateToSave.envelope.attack,
            release: stateToSave.envelope.release
        }
    };

    setDoc(docRef, data).then(() => {
        var i, L = presetSelect.options.length - 1;
        for (i = L; i >= 0; i--) {
            presetSelect.remove(i);
        }
        populatePresetList().then(() => {
            presetSelect.value = "userPreset" + presetCounter;
        });
    });
});

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var ctx = new AudioContext();
var inputBuffer, currentAudio;
var waveformDiv = document.getElementById('waveform');

// jquery knobs setup and update methods
$('.knob').each(function () {

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

// delay
var isSetDelay = false;
var delayButton = document.getElementById('delay-toggle');
delayButton.addEventListener('click', () => {
    if (isSetDelay)
        effects.delayOff();
    else
        effects.delayOn();
    isSetDelay = !isSetDelay;
});

// feedback & delay time

$("#feedback-knob").each(function () {

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
reverbButton.addEventListener('click', () => {
    if (isSetReverb)
        effects.reverbOff();
    else
        effects.reverbOn();
    isSetReverb = !isSetReverb;
});

$("#decay-knob").each(function () {

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
distortionButton.addEventListener('click', () => {
    if (isSetDistortion)
        effects.distortionOff();
    else
        effects.distortionOn();
    isSetDistortion = !isSetDistortion;
});

$("#amount-knob").each(function () {

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

$("#freq-knob").each(function () {

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

// lpf
var isSetLPF = false;
var lpfButton = document.getElementById('lpf-toggle');
lpfButton.addEventListener('click', () => {
    if (isSetLPF)
        effects.filterOff();
    else
        effects.filterOn();
    isSetLPF = !isSetLPF;
});

function updateGranParValue(id, newVal) {
    // upgrade of granular state with granular_module method 
    updateState({
        [id]: newVal
    });
}

function updateGranEnvValue(id, newVal) {
    // upgrade of granular state with granular_module method
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
    var barContainer = document.querySelector("#bar-container");
    barContainer.classList.toggle("nodisplay");

    $(barContainer).trigger('resize');

    if (!barContainer.classList.contains("nodisplay"))
        animateToDefaultValue();

    window.dispatchEvent(new Event('resize'));
}



// Wave Representation Object
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

ctx.resume()


// WAVEFORM EVENT LISTENERS
var mouseState = false;

waveformDiv.addEventListener('mousedown', (e) => {
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

//pixels and seconds position
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

        inputElement.click()

        // in case of a file uploaded multiple times:
        // https://stackoverflow.com/questions/3144419/how-do-i-remove-a-file-from-the-filelist
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
                // Conversion to data buffer (inputBuffer)
                file.arrayBuffer().then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer)).then((decodedAudio) => {
                    inputBuffer = decodedAudio

                    init(inputBuffer) // inizialize granular

                    // removes dropzone and shows change button
                    dropZoneElement.classList.toggle("nodisplay");
                    document.getElementById("button-container").classList.toggle("nodisplay");

                    loadFile(file); // shows wavesurfer
                });

                dropZoneElement.classList.remove('drop_zone--over');
                document.getElementById('wave-container').classList.toggle('nodisplay');
                document.getElementById('sample-container').classList.toggle('nodisplay');



                // shows bar-container
                toggleBarContainer();
            }

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
            setRawFile(file);
            if (fileValidation(file)) {
                // Conversion to data buffer (inputBuffer)
                file.arrayBuffer().then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer)).then((decodedAudio) => {
                    inputBuffer = decodedAudio;
                    init(inputBuffer)
                    // removes dropzone and shows change button
                    dropZoneElement.classList.toggle("nodisplay");

                    document.getElementById("button-container").classList.toggle("nodisplay");
                    document.getElementById('wave-container').classList.toggle('nodisplay');
                    document.getElementById('sample-container').classList.toggle('nodisplay');


                    // shows knobs
                    toggleBarContainer();

                    loadFile(file); // shows wavesurfer
                });
            }

            dropZoneElement.classList.remove('drop_zone--over');
        }
    });
});

// change button handle
const new_sample_button = document.getElementById('new_sample_but');

new_sample_button.addEventListener('click', () => {
    // shows dropzone and removes change button
    document.getElementsByClassName("drop_zone")[0].classList.toggle("nodisplay");

    document.getElementById("button-container").classList.toggle("nodisplay");
    document.getElementById('wave-container').classList.toggle('nodisplay');
    document.getElementById('sample-container').classList.toggle('nodisplay');
    if (!document.getElementById('popup-container').classList.contains("nodisplay"))
        document.getElementById('popup-container').classList.toggle("nodisplay");

    // shows knobs
    toggleBarContainer();

    $("#preset-select").val("default");
})

// Default sample-container buttons

const defaultSample1 = document.getElementById('sample1');
const defaultSample2 = document.getElementById('sample2');
const audioUrl1 = require('../media/Distort.wav');
const audioUrl2 = require('../media/pipa.wav');
var sampleLoaded1 = false;
var sampleLoaded2 = false;
let audio;
let audio2;

// To fetch a file parcel needs you to build the url with 'require'
// https://github.com/parcel-bundler/parcel/issues/1911

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

                document.getElementsByClassName("drop_zone")[0].classList.toggle("nodisplay");
                document.getElementById("button-container").classList.toggle("nodisplay");
                document.getElementById('wave-container').classList.toggle('nodisplay');
                document.getElementById('sample-container').classList.toggle('nodisplay');
                toggleBarContainer();

            });

        // shows bar-container

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

                document.getElementsByClassName("drop_zone")[0].classList.toggle("nodisplay");
                document.getElementById("button-container").classList.toggle("nodisplay");
                document.getElementById('wave-container').classList.toggle('nodisplay');
                document.getElementById('sample-container').classList.toggle('nodisplay');
                toggleBarContainer();

            });

    }

});

// effects toggle handle

document.querySelectorAll('.toggle').forEach(inputElement => {
    inputElement.addEventListener('click', () => {
        inputElement.classList.toggle('toggle-active');
    });
});

// reverse sample
document.getElementById('reverse').addEventListener('click', () => {

    if (getBuffer() != null) {

        var buffer = getBuffer();
        Array.prototype.reverse.call(buffer.getChannelData(0));
        Array.prototype.reverse.call(buffer.getChannelData(1));

        init(buffer);

        wavesurfer.loadDecodedBuffer(buffer);
    }

})



// Utility: create a new waveform representation based on the audio file passed as an argument.
function loadFile(file) {
    wavesurfer.loadBlob(file);
}

function fileValidation(file) {
    var fileInput = file;

    var filePath = fileInput.name;

    // Allowing file type
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
    var command = input.data[0]
    var note = input.data[1]
    var velocity = handleVelocity(input.data[2])
    console.log(command + "|" + note + "|" + velocity)

    // setting a new midi knob for the parameters
    if (contr1enabled && command == 176) {  // first parameter setting
        controllerArray[0] = { [note]: select1.value };
        contr1.value = note;
        console.log("CONTRARRAY[0] ", controllerArray[0])
    }

    else if (contr2enabled && command == 176) { // second parameter setting
        controllerArray[1] = { [note]: select2.value };
        contr2.value = note;
        console.log("CONTRARRAY[1] ", controllerArray[1])
    }

    else if (contr3enabled && command == 176) { // third parameter setting
        controllerArray[2] = { [note]: select3.value };
        contr3.value = note;
        console.log("CONTRARRAY[2] ", controllerArray[2])
    }

    else {

        switch (command) {
            case 144:
                numnotes += 1;
                if (velocity > 0) {
                    noteon(note, velocity);
                }
                else {
                    noteoff(note);
                }
                break;

            case 128:
                numnotes -= 1;
                if (numnotes < 1) {
                    noteoff(note);
                }
                break;

            case 176: // knob/slider control


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

        }

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


// handles popup

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

// shows popup
popupB.addEventListener('click', () => {
    var popup = document.getElementById("popup-container");
    popup.classList.toggle("nodisplay");
}
);

contrSet.addEventListener('click', () => {
    contr1enabled = false;
    contr2enabled = false;
    contr3enabled = false;

    var popup = document.getElementById("popup-container");
    popup.classList.toggle("nodisplay");
}
);

// reset first parameter and let us change it
contr1.addEventListener('click', () => {
    console.log("1")

    controllerArray[0] = 0;
    contr1.value = "";

    contr1enabled = true;
    contr2enabled = false;
    contr3enabled = false;
}
);

// reset second parameter and let us change it
contr2.addEventListener('click', () => {
    console.log("2")

    controllerArray[1] = 0;
    contr2.value = "";

    contr2enabled = true;
    contr1enabled = false;
    contr3enabled = false;
}
);

// reset third parameter and let us change it
contr3.addEventListener('click', () => {
    console.log("3")

    controllerArray[2] = 0;
    contr3.value = "";

    contr3enabled = true;
    contr2enabled = false;
    contr1enabled = false;
}
);


select1.addEventListener('change', () => {
    controllerArray[0] = 0;
    contr1.value = "";
}
);

select2.addEventListener('change', () => {
    controllerArray[1] = 0;
    contr2.value = "";
}
);

select3.addEventListener('change', () => {
    controllerArray[2] = 0;
    contr3.value = "";
}
);