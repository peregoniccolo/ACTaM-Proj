<div style="background-color: rgb(167, 202, 212); border-radius: 15px; padding: 5px">
<image src="media/images/logo.png" style="margin-left: -2px; border-radius: 15px"></image>
</div>

## Run with Parcel!
* Download/clone the project
* In the project folder:
```console
npm i
npm start
```
* In case this error occurs:
```console
Browserslist: caniuse-lite is outdated. Please run next command `npm update caniuse-lite browserslist`
Browserslist: caniuse-lite is outdated. Please run next command `npm update caniuse-lite browserslist`
```

* Solve with:
    
```
npm update caniuse-lite browserslist
```

NB: mainly tested on Chrome

# Functionalities

<div>
<image src="media/images/gui.png" style="border-radius: 15px"></image>
</div>


* Granular synthesizer with customizable parameters
* 4 effects parametric to play with: Delay, Reverb, Distortion and a LPF
* Default parameter presets
* Possibility to save you very own parameter presets
* MIDI controls to play and control the synthesizer

## Used libs
* Granular
* Wavesurfer
* Firebase & Firestore
* P5
* JQuery & JQuery-Knob
* Bootstrap & Popper

## DB structure
Collections:
* presets: contains all 4 presets chosen by us for you to play with
* user_presets: contains all sets of parameters saved by the users
* preset_num: contains the counter for the saved presets

# Authors
#### Gargiulo - Morena - Orsatti - Perego
![getirs](media/images/getir.png) 