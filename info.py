from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from threading import Thread
import urllib.request
import feedparser
import json
import time
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

smallNewsJSON = {}
smallWeatherJSON = {}

icons = {
	'day': {
		'clear': 'wi-day-sunny',
		'cloudy': 'wi-day-cloudy',
		'flurries': 'wi-snow',
		'fog': 'wi-fog',
		'hazy': 'wi-day-haze',
		'mostlycloudy': 'wi-day-cloudy',
		'mostlysunny': 'wi-day-cloudy',
		'partlycloudy': 'wi-day-cloudy',
		'partlysunny': 'wi-day-cloudy',
		'sleet': 'wi-sleet',
		'rain': 'wi-rain',
		'snow': 'wi-snow',
		'sunny': 'wi-day-sunny',
		'tstorms': 'wi-day-thunderstorm'
	}, 
	'night': {
		'clear': 'wi-night-clear',
		'cloudy': 'wi-night-alt-cloudy',
		'flurries': 'wi-night-alt-snow',
		'fog': 'wi-night-fog',
		'hazy': 'wi-night-fog',
		'mostlycloudy': 'wi-night-alt-cloudy',
		'mostlysunny': 'wi-night-alt-cloudy',
		'partlycloudy': 'wi-night-alt-cloudy',
		'partlysunny': 'wi-night-alt-cloudy',
		'sleet': 'wi-night-alt-sleet',
		'rain': 'wi-night-alt-rain',
		'snow': 'wi-night-alt-snow',
		'sunny': 'wi-night-clear',
		'tstorms': 'wi-night-alt-thunderstorm'
	}
}

@socketio.on('connect')
def connected():
	global newsThreadStarted
	global weatherThreadStarted
	
	wait_for_internet_connection()
	
	if not newsThreadStarted:
		newsThread.start()
		newsThreadStarted = True
	else:
		socketio.emit('weather', smallWeatherJSON)
	
	if not weatherThreadStarted:
		weatherThread.start()
		weatherThreadStarted = True
	else:
		socketio.emit('news', smallNewsJSON)

@app.route("/")
def index():
    return render_template('index.html')

	
def newsThread():
	while True:
		newsFeed = feedparser.parse("http://feeds.bbci.co.uk/news/rss.xml?edition=uk")
		#newsFeed = feedparser.parse(r'bbc.xml')
		for i, entry in enumerate(newsFeed.entries):
			smallNewsJSON[i] = {
				'summary' : entry.summary
			}
			if i == 30:
				break
		
		socketio.emit('news', smallNewsJSON)
		time.sleep(600)

def weatherThread():
	while True:
		print("making API call to wunderground")
		API_KEY = "b4bb5522c38b311b" #http://api.wunderground.com/api/b4bb5522c38b311b/astronomy/conditions/forecast/q/autoip.json
		resource = urllib.request.urlopen("http://api.wunderground.com/api/" + API_KEY + "/astronomy/conditions/forecast/q/autoip.json")
		content =  resource.read().decode(resource.headers.get_content_charset())
		weatherJSON = json.loads(content)
		#with open('weather.json') as weather:
		#	weatherJSON = json.load(weather)
		global smallWeatherJSON
		global icons
		smallWeatherJSON['temperature'] = weatherJSON['current_observation']['temp_c']
		smallWeatherJSON['temperatureHigh'] = weatherJSON['forecast']['simpleforecast']['forecastday'][0]['high']['celsius']
		smallWeatherJSON['temperatureLow'] = weatherJSON['forecast']['simpleforecast']['forecastday'][0]['low']['celsius']
		smallWeatherJSON['sunrise'] = "%02d" % int(weatherJSON['sun_phase']['sunrise']['hour']) + ':' + "%02d" % int(weatherJSON['sun_phase']['sunrise']['minute'])
		smallWeatherJSON['location'] = weatherJSON['current_observation']['display_location']['city'] + ", " + weatherJSON['current_observation']['display_location']['country']
		smallWeatherJSON['sunset'] = "%02d" % int(weatherJSON['sun_phase']['sunset']['hour']) + ':' + "%02d" % int(weatherJSON['sun_phase']['sunset']['minute'])
		smallWeatherJSON['forecastString'] = weatherJSON['forecast']['txt_forecast']['forecastday'][0]['fcttext_metric']
		smallWeatherJSON['currentWeather'] = weatherJSON['current_observation']['weather']
		
		currentTime = "%02d" % int(datetime.now().hour) + ':' + "%02d" % int(datetime.now().minute)
		currentIcon = weatherJSON['current_observation']['icon']
		
		if currentTime > smallWeatherJSON['sunrise'] and currentTime < smallWeatherJSON['sunset']:
			smallWeatherJSON['weatherIcon'] = icons['day'][currentIcon]
		else :
			smallWeatherJSON['weatherIcon'] = icons['night'][currentIcon]
		
		
		socketio.emit('weather', smallWeatherJSON)
		time.sleep(1800)

def wait_for_internet_connection():
	while True:
		try:
			response = urllib.request.urlopen('http://87.237.66.2',timeout=1)
			return
		except urllib.request.URLError:
			pass

newsThread = Thread(target=newsThread)
newsThread.daemon = True
newsThreadStarted = False

weatherThread = Thread(target=weatherThread)
weatherThread.daemon = True
weatherThreadStarted = False
	
if __name__ == "__main__":
    socketio.run(app)