# This script will poll Divvy servers every 2 minutes 
# and write the data to logstash that will subsequently write the data
# to index divvy_stations_logs on ElasticSearch servers
# Execute this script from the command line by typing the following:
# python divvy_stations_status_logs.py


import json
import socket
import time
import urllib.request


# specify the port number that we will write into
# this should be the same port number that is configured in logstash.conf

HOST = "127.0.0.1"
PORT = 5044

try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
except Exception as e:
    print(e)

try:
    sock.connect((HOST, PORT))
except Exception as e:
    print(e)
	  

while True:
    
    response = urllib.request.urlopen('https://feeds.divvybikes.com/stations/stations.json')

    # Extract the body of the reply
    response_body = response.read()

    # Decode the format in json format
    stations_json = json.loads(response_body.decode("utf-8"))


    for stations in stations_json['stationBeanList']: 
        sock.send(json.dumps(stations).encode('utf-8'))
        sock.send(b'\n')
     
    
  # Sleep for 125 seconds; divvy updates its stations status every 2 minutes
    print('Sent Heartbeat to Divvy Servers and Going to sleep for 125 seconds now ...')
    time.sleep(125)    
    continue
	
sock.close()
