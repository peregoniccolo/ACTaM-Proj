var inputBuffer, currentAudio;  
var ctx = new AudioContext();
ctx.resume()

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
            // dropped file is handled here
            var file = e.dataTransfer.files[0];

            // conversion to data buffer (inputBuffer)
            file.arrayBuffer().then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer)).then((decodedAudio) => {
                inputBuffer = decodedAudio
                startProcessing()
                updateThumbnail(dropZoneElement, e.dataTransfer.files[0]);
            });
        }

        dropZoneElement.classList.remove('drop_zone--over');

    });
});

function startProcessing() {

    // TODO load new page / modify page
    // TODO link to gran js

    // play test
    
    if (currentAudio != null){
        // if the context was already playing
        ctx.close()
        ctx = new AudioContext()
        ctx.resume()
    }
    currentAudio = ctx.createBufferSource();
    currentAudio.buffer = inputBuffer;
    currentAudio.connect(ctx.destination);
    currentAudio.start(ctx.currentTime); 
}

/**
 * 
 * @param {HTMLElement} dropZoneElement 
 * @param {File} file 
 */
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






/*
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