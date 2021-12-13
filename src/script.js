import { init, stopGrain } from "./modules/granular_module";
import { setPosition } from "./modules/granular_module";
import { ClickAndHold } from "./modules/ClickAndHold";
import { playGrain } from "./modules/granular_module";


window.AudioContext = window.AudioContext || window.webkitAudioContext;
var inputBuffer, currentAudio;  
var c = new AudioContext();
var waveformDiv = document.getElementById('waveform')
// Classe che gestisce il click and hold della waveform.
var click_hold_waveformplay = new ClickAndHold(waveformDiv, playGrain, stopGrain, 500);
// Wave Representation Object
var wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#9fa9a3',
    progressColor: '#e3e0cc',
    cursorColor: 'c5d5c5',
    height: 256,
    responsive: true,
    cursorWidth: 2,
  
});

c.resume()

waveformDiv.addEventListener('mousedown', (e, progress) => {
    waveformDiv.addEventListener('mousemove', () => {
        console.log('piedi')
    } )
    //setTimeout(() => wavesurfer.seekTo(progress), 0);

})

waveformDiv.addEventListener('mouseup', (e, progress) => {
    waveformDiv.removeEventListener('mousemove', () => {
        console.log('gomiti')
    } , false)
    //setTimeout(() => wavesurfer.seekTo(progress), 0);

})


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

waveformDiv.addEventListener('click', e => {
    setTimeout(setGranTime,5);
});

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



/**
// Scrivete cosa fa, grazie.
function filterData(audioBuffer) {
    const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
    const samples = 200; // Number of samples we want to have in our final data set
    const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum = sum + Math.abs(rawData[blockStart + j]) // find the sum of all the samples in the block
      }
      filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
    }
    return filteredData;
}

function normalizeData(filteredData) {
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map(n => n * multiplier);
}

function drawLineSegment(ctx, x, y, width, isEven){
    console.log("qui!!")
    console.log(ctx)
    console.log(x)
    console.log(y)
    console.log(width)
    console.log(isEven)
    ctx.lineWidth = 1; // how thick the line is
    ctx.strokeStyle = "#F0090E"; // what color our line is
    ctx.beginPath();
    y = isEven ? y : -y;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, y);
    ctx.arc(x + width / 2, y, width / 2, Math.PI, 0, isEven);
    ctx.lineTo(x + width, 0);
    ctx.stroke();
};

function draw(normalizedData) {
  // Set up the canvas
  const canvas = document.getElementById("audiocanvas");
  const dpr = window.devicePixelRatio || 1;
  const padding = 20;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = (canvas.offsetHeight + padding * 2) * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.translate(0, canvas.offsetHeight / 2 + padding); // Set Y = 0 to be in the middle of the canvas

  // draw the line segments
  const width = canvas.offsetWidth / normalizedData.length;
  for (let i = 0; i < normalizedData.length; i++) {
    const x = width * i;
    let height = normalizedData[i] * canvas.offsetHeight - padding;
    if (height < 0) {
        height = 0;
    } else if (height > canvas.offsetHeight / 2) {
        height = height > canvas.offsetHeight / 2;
    }
    drawLineSegment(ctx, x, height, width, (i + 1) % 2);
  }
};

*/

/*

const canvas = document.getElementById("audiocanvas");
canvasCtx = canvas.getContext("2d");
var bindex = 0;

function drawBuffer() {
    canvasCtx.beginPath();
    canvasCtx.clearRect(0,0,canvas.width,canvas.height);
    canvasCtx.moveTo(0,canvas.height/2);
    dataIn = inputBuffer.getChannelData(0)
    step = canvas.width/inputBuffer.length;
    for(var i=0;i<inputBuffer.length;i++) {
        canvasCtx.lineTo(Math.round(i*step), 
            canvas.height/2+200*dataIn[i])};
    
    markPosition = Math.round((bindex % inputBuffer.length)/step)
    canvasCtx.moveTo(markPosition, 0)
    canvasCtx.lineTo(markPosition, canvas.height)
    canvasCtx.stroke();

    //draw a couple of vertical lines corresponding to sampling start and end

    
    canvasCtx.strokeStyle = "#00FF00"
    canvasCtx.beginPath()
    canvasCtx.moveTo(canvas.width*sliceStart,0);
    canvasCtx.lineTo(canvas.width*sliceStart,canvas.height)
    canvasCtx.moveTo(canvas.width*sliceEnd,0);
    canvasCtx.lineTo(canvas.width*sliceEnd,canvas.height)
    canvasCtx.stroke()
    canvasCtx.strokeStyle = "#000000"
    

    window.requestAnimationFrame(drawBuffer)
}

*/


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

function handleInput(input){
    const command = input.data[0]
    const note = input.data[1]
    const velocity = input.data[2]

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
