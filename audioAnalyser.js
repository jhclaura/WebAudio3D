
function AudioAnalyser(canvasElementID){

	this.canvasElementID = canvasElementID;

	this.freqByteData = 0;


	// this.initThreejs();
	// this.initByteBuffer();
}

AudioAnalyser.prototype.initThreejs = function(){

}

AudioAnalyser.prototype.initByteBuffer = function(){

}

AudioAnalyser.prototype.doFrequencyAnalysis = function(event){

	var freqByteData = this.freqByteData;
	analyser.smoothingTimeConstain = 0.1;
	analyser.getByteFrequencyData(freqByteData);
}