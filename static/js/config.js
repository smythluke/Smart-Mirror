window.onload = function() {
	
	socket = io.connect('http://' + document.domain + ':' + location.port + '/');	
	
	socket.on('setting', function(json){
		for (var key in json) {
			if (json.hasOwnProperty(key)) {
				switch(key){
					case "light":
						if (json[key] == "on"){
							$("#lightOn").addClass("active");
							$("#lightOff").removeClass("active");
						} else {
							$("#lightOn").removeClass("active");
							$("#lightOff").addClass("active");
						}
						break;
					case "lightLevel":
						percentage = json[key] * 2;
						$(".lightLevelButton").removeClass("active");
						$("#lightLevel" + percentage).addClass("active");
						break;
					case "alarm":
						if (json[key] == 0){
							$("#alarm").val("");
						} else {
							date = new Date(json[key]);
							$("#alarm").val(date.toISOString().slice(0, 10) + "T" + date.toTimeString().slice(0, 5));
						}
						break;
				}
			}
		}
	});
		
};

function submitAlarm(){
	value = $("#alarm").val();
	if(value != ""){
		newAlarm = new Date(value).toUTCString().slice(0, -4);
	} else {
		newAlarm = 0;
	}
	socket.emit("setting", {"alarm": newAlarm});
	notie.alert(1, "New alarm set!", 3);
}

$(function(){
	$('#lightOn').click(function() {
		$("#lightOn").addClass("active");
		$("#lightOff").removeClass("active");
		socket.emit("setting", {"light":"on"});
	});
});

$(function(){
	$('#lightOff').click(function() {
		$("#lightOn").removeClass("active");
		$("#lightOff").addClass("active");
		socket.emit("setting", {"light":"off"});
	});
});

function lightLevel(percent){
	$(".lightLevelButton").removeClass("active");
	$("#lightLevel" + percent *2).addClass("active");
	socket.emit("setting", {"lightLevel":percent});
}









