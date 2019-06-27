//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");
var loadingButton = document.getElementById("loadingButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);


function startRecording() {
	console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: true, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

	recordButton.disabled = true;
	stopButton.disabled = false;
	pauseButton.disabled = false
	
	
	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		
		
		// ME
		//fa-microphone
		recordButton.classList.remove("fa-microphone");
		recordButton.classList.add("fa-microphone-slash");
		//recordButton.style.display = "none";
		stopButton.style.display = "inline-block";
		pauseButton.style.display = "inline-block";
		// End ME
		
		
		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext();

		//update the format 
//		document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;
		
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})
		console.log('Here');

		//start the recording process
		rec.record()

		console.log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
    	recordButton.disabled = false;
    	stopButton.disabled = true;
    	pauseButton.disabled = true
	});
}

function pauseRecording(){
	console.log("pauseButton clicked rec.recording=",rec.recording );
	if (rec.recording){
		//pause
		rec.stop();
		pauseButton.innerHTML="Resume";
	}else{
		//resume
		rec.record()
		pauseButton.innerHTML="Pause";

	}
}

function stopRecording() {
	console.log("stopButton clicked");
	
	
	// XF.insertIntoEditor( $('.input.js-editor.u-jsOnly'), "[audio]545[/audio] <br/>" );
	
	
	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;
	pauseButton.disabled = true;

	
	// ME
	//fa-microphone
	recordButton.classList.remove("fa-microphone-slash");
	recordButton.classList.add("fa-microphone");
	//recordButton.style.display = "none";
	stopButton.style.display = "none";
	pauseButton.style.display = "none";
	// End ME
	
	
	//reset button just in case the recording is stopped while paused
	pauseButton.innerHTML="Pause";
	
	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) 
{
	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');
	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString();

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;
	//save to disk link
	link.href = url;
	link.download = filename+".mp3"; //download forces the browser to donwload the file using the  filename
///	link.innerHTML = "Save to disk";
	//add the new audio element to li
///	li.appendChild(au);
	//add the filename to the li
///	li.appendChild(document.createTextNode(filename+".wav "))
	//add the save to disk link to li
///	li.appendChild(link);
	
	//upload link
	var upload = document.createElement('a');
	upload.href="#";
///	upload.innerHTML = "Upload";
///	upload.addEventListener("click", function(event){
	
	loadingButton.style.display = "inline-block";
	
		  var xhr=new XMLHttpRequest();
		  xhr.onload=function(e) {
		      if(this.readyState === 4) {
				  
				  loadingButton.style.display = "none"; //loading icon manage
				  
				  let jsonDecode = JSON.parse(e.target.responseText);
		          //console.log( jsonDecode.attachment_id );
		          console.log("Server returned: ",e.target.responseText);
				  
				  if( typeof jsonDecode.attachment_id !== 'undefined' ){
					XF.insertIntoEditor( $('.input.js-editor.u-jsOnly'), "[voice_message]"+jsonDecode.attachment_id+"[/voice_message]<br/>" );
				  }else{
					  alert('There is an error. Please try again later.');
				  }
				  
		      }
		  };
		  
		  var href = document.getElementsByClassName("js-attachmentUpload")[0].href;    
		  var token = document.getElementsByClassName("js-attachmentUpload")[0].nextSibling.form[30].value;
		  
		 // console.log(href);
		  
		 // console.log( pregMatch(/type=(.*?)&/g, href) );
		  //console.log(document.getElementsByClassName("js-attachmentUpload"));
		  
		  //console.log(href);
		  //console.log( document.getElementsByClassName("js-attachmentUpload")[0].nextSibling.form[30].value );
		  
		  var fd=new FormData();
		  fd.append("audio",blob, filename+'.mp3');
		 
		  //fd.append("attachment_hash", getParameterByName('hash', href) );
		  //fd.append("attachment_hash_combined",'{"type":"post","context":{"thread_id":39},"hash":"'+getParameterByName('hash', href)+'"}' );
		  //fd.append("_xfToken", token );
		  
		  
		  xhr.open("POST", XF.config.url.fullBase+'index.php?lgxupload' ,true);
		  xhr.send(fd);
///	})
	
	
	li.appendChild(document.createTextNode (" "))//add a space in between
	li.appendChild(upload)//add the upload link to li
	//add the li element to the ol
	recordingsList.appendChild(li);
	
}




function getParameterByName(name, url)
{
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}



function pregMatch(regex, str)
{
	let m;
	while ((m = regex.exec(str)) !== null) {
		// This is necessary to avoid infinite loops with zero-width matches
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}
		return m[1]; //Return the Group 1
		// The result can be accessed through the `m`-variable.
		///m.forEach((match, groupIndex) => {
		///	console.log(`Found match, group ${groupIndex}: ${match}`);
		///});
	}
}


