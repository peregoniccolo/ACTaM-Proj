import { init, stopGrain } from "./modules/granular_module";
import { setPosition } from "./modules/granular_module";
import { ClickAndHold } from "./modules/ClickAndHold";
import { playGrain } from "./modules/granular_module";


window.AudioContext = window.AudioContext || window.webkitAudioContext;
var inputBuffer, currentAudio;  
var c = new AudioContext();
var waveformDiv = document.getElementById('waveform')
// Classe che gestisce il click and hold della waveform.

//var click_hold_waveformplay = new ClickAndHold(waveformDiv, playGrain, stopGrain, 0);

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
                'font-family' : 'Sans-Serif'
            },
            hideOnBlur: true,
            showTime : true,
            followCursorY : true,
        })
    ]
  
});

c.resume()

var mouseState = false;


waveformDiv.addEventListener('mousedown', (e) => {
    mouseState = true;
    var bnds = e.target.getBoundingClientRect();
    var x = e.clientX - bnds.left;
    var posX = updateCursorPosition(x);
    console.log("pos in sec: " + posX)
    //console.log("pos normalizzata: " + normalizeTime(posX));

    if(mouseState){
        playGrain(normalizeTime(posX))
    }
    waveformDiv.addEventListener('mousemove', (e) => {
        bnds = e.target.getBoundingClientRect();
        x = e.clientX - bnds.left;
        posX = updateCursorPosition(x);

        if(mouseState){
            playGrain(normalizeTime(posX));
            console.log("pos in mousemove: " + posX);
        }
    })
})

waveformDiv.addEventListener('mouseup', (e) => {
    mouseState = false;
    stopGrain()

})

waveformDiv.addEventListener('mouseout', (e) => {
    mouseState = false;
    stopGrain()

})

//Da posizione in pixel a posizione in secondi
function updateCursorPosition(xpos) {
        const  duration = wavesurfer.getDuration();
        const elementWidth =
            wavesurfer.drawer.width /
            wavesurfer.params.pixelRatio;
        const scrollWidth = wavesurfer.drawer.getScrollX();

        const scrollTime =
            (duration / wavesurfer.drawer.width) * scrollWidth;

        const timeValue = Math.max(0, (xpos / elementWidth) * duration) + scrollTime;

        return timeValue
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
        if (inputElement.files.length) {
            updateThumbnail(dropZoneElement, inputElement.files[0]);
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
            file.arrayBuffer().then((arrayBuffer) => c.decodeAudioData(arrayBuffer)).then((decodedAudio) => {
                inputBuffer = decodedAudio
                init(inputBuffer)
                loadFile(file);
          
                //startProcessing()
                // updateThumbnail(dropZoneElement, e.dataTransfer.files[0]);
            });
        }
        
        dropZoneElement.classList.remove('drop_zone--over');
        document.getElementById('waveform').classList.remove('nodisplay')

        //dropZoneElement.classList.add('drop_zone_input');  // La drop zone scompare dopo aver droppato un sample.

    });
});



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

function loadWave(file) {
    url = URL.createObjectURL(file);
    wavesurfer.load(url);
}

//GESTIONE EVENTO CLICK SULLA WAVEFORM


//prende il current time (dove è il cursore), lo normalizza e lo setta come posizione iniziale della voice
function setGranTime() {
    setPosition(normalizeTime(wavesurfer.getCurrentTime()))
}

function normalizeTime(time) {
    var fileLen = wavesurfer.getDuration();
    return time/fileLen
}


function startProcessing() {
    // TODO load new page / modify page
    // TODO link to gran js

    // play test
    
    if (currentAudio != null){
        // if the context was already playing
        c.close()
        c = new AudioContext()
        c.resume()
    }
    currentAudio = c.createBufferSource();
    currentAudio.buffer = inputBuffer;
    currentAudio.connect(c.destination);
    currentAudio.start(c.currentTime); 
    draw(normalizeData(filterData(inputBuffer)))
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

if(navigator.requestMIDIAccess){
    navigator.requestMIDIAccess().then( onMIDISuccess, onMIDIFailure );
}


function onMIDISuccess( midiAccess ) {
    midiAccess.addEventListener('statechange', updateDevices)
    const input = midiAccess.inputs;
    inputs.forEach((input) => {
        input.addEventListener('midimessage', handleInput);
  })
}

function handleVelocity(velocity){
    return velocity/128
}

function handleInput(input){
    const command = input.data[0]
    const note = input.data[1]
    const velocity = handleVelocity(input.data[2])

    switch(command){
        case 144:
        if (velocity > 0){
        noteon(note, velocity);
        } 
        else{
        noteoff(note);
        }
        break;
        case 128:
        noteoff(note);
        break;
    }
}

function noteon(note, velocity){

}
function noteon(note, velocity){
    
}

function onMIDIFailure() {
  console.log( "Failed to get MIDI access " );
}
*/

