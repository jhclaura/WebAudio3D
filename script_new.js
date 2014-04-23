
//SET_UP--------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------

//Web Speech API
var msg = new SpeechSynthesisUtterance('That\'s high');


//Wave
var time = Math.PI/2;
var frequency = 0.01;
var amplitude = 3;
var offset = 0;
var tanW = new TanWave(time, frequency, amplitude, offset);
var sinW = [];
var spin;

//Three.js
var container;
var width = window.innerWidth;
var height = window.innerHeight;
var renderer, scene, camera, controls, stats, light;
var clock = new THREE.Clock();

var objects = [];
var materials = [];
var mouse = new THREE.Vector2();

//FOR_FILTERED_DATA
var objectsB = [], materialsB = [];
var objectsC = [], materialsC = [];


//Clickable!
var projector = new THREE.Projector();
var mouseVector = new THREE.Vector3();
var click = false;
var INTERSECTED, SELECTED;
var mouseClickObject;

//Web Audio API
var context, source, analyser, buffer, audioBuffer;
var analyserView1;
var bufferLoader;

var isPlaying = false;
var sourceNode = null;
var analyser = null;
var theBuffer = null;
var detectorElem, canvasContext, pitchElem, noteElem, detuneElem, detuneAmount;
var confidence = 0;
var currentPitch = 0;

var buf, fft;
var samples = 64;
var setup = false;

var high = false;
var highTime;

window.AudioContext = window.AudioContext || window.webkitAudioContext;
context = new AudioContext();

navigator.getUserMedia ||
      (navigator.getUserMedia = navigator.mozGetUserMedia ||
      navigator.webkitGetUserMedia || navigator.msGetUserMedia);
     
if (navigator.getUserMedia) {
    navigator.getUserMedia( {audio: true}, gotStream, onError );
} else {
    alert('getUserMedia is not supported in this browser.');
}
 
function onSuccess() {
    alert('Successful!');
}
 
function onError() {
    alert('There has been a problem retrieving the streams - did you allow access?');
}

//INIT--------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------

// window.addEventListener('load', init, false);
window.onload = init; //use which one???


function init(){

	//WEB AUDIO API
	bufferLoader = new BufferLoader(
    	context, ['../sounds/Deeper.mp3'], finishedLoading
	);
	bufferLoader.load();
	// setupCanvas();

	//THREE.JS
	container = document.createElement('div');
	document.body.appendChild(container);

	//scene
	scene = new THREE.Scene();
	//camera
	camera = new THREE.PerspectiveCamera( 55, width/height, 0.1, 100000 );
	scene.add(camera);
	camera.position.set(0,50,50);
	camera.lookAt(scene.position);

	//stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '5px';
	stats.domElement.style.zIndex = 100;
	stats.domElement.children[ 0 ].style.background = "transparent";
	stats.domElement.children[ 0 ].children[1].style.display = "none";
	container.appendChild(stats.domElement);

	scene.fog = new THREE.FogExp2(0xcccccc, 0.0005);

	//light
	light = new THREE.DirectionalLight(0xffffff);
	light.position.set(1,1,1);
	scene.add(light);

	light = new THREE.DirectionalLight(0xf0db00);
	light.position.set(-1,-1,-1);
	scene.add(light);

	//renderer
	renderer = new THREE.WebGLRenderer( {antialias: true} );
	renderer.setClearColor(scene.fog.color, 1);
	renderer.setSize(width, height);
	container.appendChild(renderer.domElement);

	//controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );

	//waves
	for(var i=0; i<3; i++) {
		var sw = new SinWave(time, frequency*4, amplitude, offset);
		sinW.push(sw);
	}

	//sphere
	// var sphereGeometry = new THREE.SphereGeometry(5, 32, 16);
	// var sphereMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
	// var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

	//cube
	var cubeGeometry = new THREE.CubeGeometry(10,10,10);
	
	for(var i=0; i<samples; i++){
		var cubeMaterial = new THREE.MeshLambertMaterial({color: 0x35d8c0});
		var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		
		cube.position.x = 10*i;

		scene.add(cube);

		objects.push(cube);
		materials.push(cubeMaterial);



		//FILTERED_DATA_B
		cubeMaterial = new THREE.MeshLambertMaterial({color: 0x00ffff});
		cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		
		cube.position.x = 10*i;
		cube.position.z = 100;
		cube.position.y = 0;

		scene.add(cube);

		objectsB.push(cube);
		materialsB.push(cubeMaterial);

	}

	for(var i=0; i<samples/4; i++){
		//FILTERED_DATA_C
		cubeMaterial = new THREE.MeshLambertMaterial({color: 0xc4f084});
		cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		
		cube.position.x = 10*i;
		cube.position.z = 200;
		cube.position.y = 0;

		scene.add(cube);

		objectsC.push(cube);
		materialsC.push(cubeMaterial);		
	}

	// setupMouse();

}


var rafID = null;
var tracks = null;
var buflen = 2048;
var buf = new Uint8Array(buflen);
var MINVAL = 134;


//live
function gotStream(stream){

  //create audioNode from stream
  var mediaStreamSource = context.createMediaStreamSource(stream);
  var filter = context.createBiquadFilter();

  fft = context.createAnalyser();
  fft.fftSize = buflen;

  //FILTER_FIRST
  // mediaStreamSource.connect(filter);
  // filter.connect(fft);

  //SEND_TO_ANALYSER
  mediaStreamSource.connect(fft);

  //send to destination --> make sound
  fft.connect(context.destination);

  //SET_UP_FILTER
  filter.type = 0;
  filter.frequency.value = 30;

  // updatePitch();

  // analyserView1 = new AudioAnalyser("view1");
  // analyserView1.initByteBuffer();

  // window.requestAnimationFrame(draw);
}




function noteFromPitch(frequency){
  var noteNum = 12*(Math.log(frequency/440)/Math.log(2));
  return Math.round(noteNum)+69;
}

function freqencyFromNote(note){
  return 440* Math.pow(2, (note+69)/12);
}

function centsOffFromPitch(frequency){
  return ( 1200 * Math.log(frequency/freqencyFromNote(note) ) / Math.log(2) );
}



// function draw(){
//   analyserView1.doFrequencyAnalysis();

// }



function updatePitch(time){
	var cycles = [];
	analyser.getByteTimeDomainData(buf);
	// autoCorrelate(buf, audioContext.sampleRate);
}



//mp3
function finishedLoading(bufferList){
	var source1 = context.createBufferSource();
	source1.buffer = bufferList[0];

	fft = context.createAnalyser();
	fft.fftSize = samples;

	source1.connect(fft);
	fft.connect(context.destination);

	// source1.start(0);

	setup = true;

	animate();
}

// draw 3D
function animate(){
	requestAnimationFrame(animate);
	update();
	render();
}

function render(){
	renderer.render(scene, camera);
}


var filteredData = [];

function update(){
	var time = clock.getElapsedTime();
	var delta = clock.getDelta();

	controls.update();
	stats.update();

	var data = new Uint8Array(samples);
	fft.getByteFrequencyData(data);
	var count = 0;


	
	for(var i=0; i<objects.length; i++){
		if(data[i]>250){
			objects[i].material.color.setHex(0xffff00);
			count ++;

			
			objectsB[i].material.color.setHex(0xffff00);
			objectsB[i].position.y = data[i];


			objectsC[count].position.y = data[count];

		} else if(data[i]>200){
			objects[i].material.color.setHex(0xff0000);
			// window.speechSynthesis.cancel();

			objectsB[i].material.color.setHex(0xf084e9);
			// objectsB[i].position.y = data[i];
		} else {
			objects[i].material.color.setHex(0x35d8c0);
			// window.speechSynthesis.cancel();

			if (objectsB[i].position.y>0)
				objectsB[i].position.y --;
			objectsB[i].material.color.setHex(0x00ffff);

		}
		objects[i].position.y = data[i];
	}

	for(var i=0; i<objectsC.length; i++){
		if (objectsC[i].position.y>0)
			objectsC[i].position.y --;		
	}



	//---------------------------------------------
	//voice
	if (count > 0) {
		highTime = time;
		high = true;
	}
	else if(time > highTime + 0.5) {
		high = false;
	}
	
	if(high)
		window.speechSynthesis.speak(msg);
	else
		window.speechSynthesis.cancel();
}

// draw 2D
var gfx; 

function setupCanvas() { 
    var canvas = document.getElementById('canvas'); 
    gfx = canvas.getContext('2d'); 
    webkitRequestAnimationFrame(update2D); 
}


function update2D(){
  webkitRequestAnimationFrame(update2D);
  if(!setup) return;

  gfx.clearRect(0,0,800,600);
  // gfx.fillStyle = 'gray'; 
  // gfx.fillRect(0,0,800,600); 
   
  var data = new Uint8Array(samples); 
  fft.getByteFrequencyData(data); 
  gfx.fillStyle = 'green'; 
  for(var i=0; i<data.length; i++) { 
      gfx.fillRect(100+i*4,100+256-data[i]*2,3,100); 
  } 
}








