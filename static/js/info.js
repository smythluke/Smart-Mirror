window.onload = function() {
	
	startTime();
	recognition.start()
	
	socket = io.connect('http://' + document.domain + ':' + location.port + '/');	
	socket.on('weather', function(json){
		weather = json;
		$('#temperature').html(json.temperature + "&deg;C");
		$('#temperatureHigh').html('<i class="wi wi-direction-up"></i> ' + json.temperatureHigh + "&deg;C");
		$('#temperatureLow').html('<i class="wi wi-direction-down"></i> ' + json.temperatureLow + "&deg;C");
		$('#weatherIcon').html('<i class="wi ' + json.weatherIcon + '"></i>');
		$('#sunrise').html('<i class="wi wi-sunrise"></i> ' + json.sunrise);
		$('#sunset').html('<i class="wi wi-sunset"></i> ' + json.sunset);
		$('#location').html(json.location);
	});
	
	socket.on('news', function(json){
		news = json;
		smallNewsJSON = json;
		rollNews();
	});
	
	socket.on('setting', function(json){
		for (var key in json) {
			if (json.hasOwnProperty(key)) {
				switch(key){
					case "light":
						if (json[key] == "on"){
							$(".light").show();
							$("body").css("color", "#000");
						} else {
							$(".light").hide();
							$("body").css("color", "#fff");
						}
						break;
					case "lightLevel":
						$("#left-light, #right-light").width(json[key] + "%");
						$("#top-light, #bottom-light").height(json[key] + "%");
						break;
					case "alarm":
						nextAlarm = new Date(json[key]);
						break;
				}
			}
		}
	});
};
var weather = {};
var news = {};
var days=['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var months=['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'Novermber', 'December'];
var nextAlarm = new Date(0);

function startTime() {
	var today = new Date();
	var h = checkTime(today.getHours());
	var m = checkTime(today.getMinutes());
	var s = checkTime(today.getSeconds());
	$('#time').html(h + ":" + m);
	$('#date').html(days[today.getDay()] + ", " + ordinal_suffix_of(today.getDate()) + " " + months[today.getMonth()])
	if(today.getTime().toString().slice(0, -3) == nextAlarm.getTime().toString().slice(0, -3)){
		if(!window.speechSynthesis.speaking){
			speak("Hello. The forecast for today is " + weather.forecastString + ". The current weather is " + weather.currentWeather);
		}
	}
	var t = setTimeout(startTime, 500);
}

function checkTime(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}

var currentNewsItem = 0;

function rollNews(){
	$("#news").html(smallNewsJSON[currentNewsItem].summary);
	currentNewsItem = (currentNewsItem + 1) % (Object.keys(smallNewsJSON).length)
	var x = setTimeout(rollNews, 20000);
}

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "<sup>st</sup>";
    }
    if (j == 2 && k != 12) {
        return i + "<sup>nd</sup>";
    }
    if (j == 3 && k != 13) {
        return i + "<sup>rd</sup>";
    }
    return i + "<sup>th</sup>";
}

function speak(text){
	if(window.speechSynthesis.speaking){
		window.speechSynthesis.pause();
		window.speechSynthesis.cancel();
	}
	var msg = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(msg);
	window.speechSynthesis.resume();
}

var recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

recognition.onstart = function() {
	
}

recognition.onresult = function(event) {
	var interimTranscript = '';

	for (var i = event.resultIndex; i < event.results.length; ++i) {
		if (!event.results[i].isFinal) {
			interimTranscript += event.results[i][0].transcript;
		}
	}
	if (interimTranscript != ""){
		reactToVoice(interimTranscript.trim());
	}
}

recognition.onerror = function(event) {
	console.log("Error: " + event.error);
}

recognition.onend = function() {
	setTimeout(recognition.start(), 100);
}

function reactToVoice(speech){
	switch(speech){
		case "lights on":
		case "light on":
		case "turn the lights on":
			$(".light").show();
			$("body").css("color", "#000");
			socket.emit("setting", {"light":"on"});
			break;
		case "lights off":
		case "light off":
		case "turn the lights off":
			$(".light").hide();
			$("body").css("color", "#fff");
			socket.emit("setting", {"light":"off"});
			break;
		case "25%":
		case "25% light":
		case "25% lights":
			$("#left-light, #right-light").width("12.5%");
			$("#top-light, #bottom-light").height("12.5%");
			socket.emit("setting", {"lightLevel":12.5});
			break;
		case "50%":
		case "50% light":
		case "50% lights":
			$("#left-light, #right-light").width("25%");
			$("#top-light, #bottom-light").height("25%");
			socket.emit("setting", {"lightLevel":25});
			break;
		case "75%":
		case "75% light":
		case "75% lights":
			$("#left-light, #right-light").width("37.5%");
			$("#top-light, #bottom-light").height("37.5%");
			socket.emit("setting", {"lightLevel":37.5});
			break;
		case "100%":
		case "100% light":
		case "100% lights":
			$("#left-light, #right-light").width("50%");
			$("#top-light, #bottom-light").height("50%");
			socket.emit("setting", {"lightLevel":50});
			break;
		case "time":
		case "what's the time":
		case "tell me the time":
			speak("The time is " + $("#time").html());
			break;
		case "date":
		case "what's the date":
		case "tell me the date":
			speak("The date is " + new Date().toLocaleDateString());
			break;
		case "weather":
		case "what's the weather":
		case "what's the weather like":
			speak("It's currently " + weather['currentWeather'] + " and " + $("#temperature").html());
			break;
		case "sunrise":
		case "when does the sunrise":
		case "when will the sunrise":
			if($("#time").html() < $("#sunrise").text().trim()){
				speak("The sun will rise at " + $("#sunrise").text().trim());
			} else {
				speak("The sun rose at " + $("#sunrise").text().trim());
			}
			break;
		case "sunset":
		case "when does the sunset":
		case "when will the sunset":
			if($("#time").html() < $("#sunset").text().trim()){
				speak("The sun will set at " + $("#sunset").text().trim());
			} else {
				speak("The sun set at " + $("#sunset").text().trim());
			}
			break;
		case "alarm":
		case "when's the next alarm":
			if (nextAlarm.getMilliseconds() != 0){
				speak(nextAlarm.toLocaleTimeString().slice(0, -3) + " on " + nextAlarm.toLocaleDateString())
			} else {
				speak("There is no alarm set");
			}
			break;
	}
}















