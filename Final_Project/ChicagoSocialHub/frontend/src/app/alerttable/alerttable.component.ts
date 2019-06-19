import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material';
import { PlacesService } from '../places.service';
import * as io from 'socket.io-client';
import { Input, ViewChild, NgZone} from '@angular/core';
import { MapsAPILoader, AgmMap } from '@agm/core';
import { GoogleMapsAPIWrapper } from '@agm/core/services';
import { Place } from 'src/app/place';
import { Station } from '../station';


@Component({
  selector: 'app-alerttable',
  templateUrl: './alerttable.component.html',
  styleUrls: ['./alerttable.component.css']
})
export class AlerttableComponent implements OnInit {
  stations: Station[];
  socket: SocketIOClient.Socket;

  temp_stations : Station[];
  displayedColumns = ['id', 'stationName', 'availableBikes', 'availableDocks', 'is_renting', 'lastCommunicationTime', 'latitude',  'longitude', 'status', 'totalDocks'];

  constructor(private placesService: PlacesService, private router: Router) {

    this.socket = io.connect('http://localhost:3000');
 }

  ngOnInit() {
    this.fetchStations();
    this.socket.on(`live_data_stations` ,data => {


        var res = data['data'];
        this.stations = this.processStations(res);

    });
  }
  processStations(stations){

    var set = new Set();

    for(var i = 0 ;i < stations.length ; i++){

      if(set.has(stations[i].id)){
        stations[i].id = -1;
      }else{
        set.add(stations[i].id);
      }
    }


    stations = stations.filter(function(el) { return el.id != -1; });


    for(var i = 0 ; i < stations.length ; i++){
      var green = stations[i]['totalDocks'] * .90 ;
      var red = stations[i]['totalDocks'] * .10 ;

      if(stations[i]['availableDocks'] < green && stations[i]['availableDocks'] > red){
        stations[i]['ID'] = -1;


      }else if(stations[i]['availableDocks'] <= red){
        stations[i]["red"] = true;
      }else if(stations[i]['availableDocks'] >= green ){
        stations[i]["green"] = true;
      }
    }

    stations = stations.filter(function(el) { return el.ID != -1; });

    return stations;

  }
  fetchStations() {
    this.placesService
      .getAllStations()
      .subscribe((data: Station[]) => {
        this.temp_stations = data['total_stations_found'];



        this.stations  = this.processStations(this.temp_stations);

      });


  }




}
