window.onload = function() {
	
	startTime();
	
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

















