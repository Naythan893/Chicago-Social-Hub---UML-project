import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';


import { Station } from '../station';
import { PlacesService } from '../places.service';
import { Place } from '../place';

import { Http, Response, RequestOptions, Headers } from '@angular/http';

import { Input, ViewChild, NgZone } from '@angular/core';
import { MapsAPILoader, AgmMap } from '@agm/core';
import { GoogleMapsAPIWrapper } from '@agm/core/services';
import { AgmCoreModule } from '@agm/core';
import { AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import * as heatmap from 'heatmap.js'
import { google } from 'google-maps';

declare var google: any;



@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.css'],
  styles: ['agm-map { width: 1682px; height: 700px; /* height is required */ }']


})
export class HeatmapComponent implements OnInit {
  title = "Divvy HeatMap";
  latitude = 41.878;
  longitude = -87.629;
  mapType = 'satellite';
  zoom: number = 15;
  heatmapData = [];
  google: google;
  private map: google.maps.Map = null;
  heatmap: google.maps.visualization.HeatmapLayer = null;
  stn: Station[];
  private hours: any;
  constructor(private placesService: PlacesService, private router: Router) { }



  ngOnInit() {

    this.fetchPlaces();
  }


  show_line_chart(hours) {
    this.hours=hours
            this.placesService.divvy_heatmap(this.hours).subscribe(() => {
                this.fetchPlaces();

            });

        }

  fetchPlaces() {
    let coords1=[];
    this.placesService
      .getDivvy_heatmap()
      .subscribe((data: Station[]) => {
        this.stn = data;
        console.log("data:", this.stn)
        for (let i = 0; i < this.stn.length; i++) {
              let locationArry = {
                location: new google.maps.LatLng(this.stn[i].latitude, this.stn[i].longitude),
                weight: this.stn[i].availableDocks
              }

             coords1.push(locationArry);
            }
              this.heatmapData=coords1;
              console.log("a",this.heatmapData);
              this.heatmap = new google.maps.visualization.HeatmapLayer({

                data: this.heatmapData
            });
            this.heatmap.setMap(this.map);

     });
  }

  onMapLoad(mapInstance: google.maps.Map) {
    this.map = mapInstance;

    const coords: any = [
      { location: new google.maps.LatLng(41.878, -87.629), weight: 10 },
      new google.maps.LatLng(41.878, -629.445),
      { location: new google.maps.LatLng(41.878, -87.623), weight: 20 },
      { location: new google.maps.LatLng(41.878, -87.611), weight: 30 },
      { location: new google.maps.LatLng(41.878, -87.620), weight: 20 },
      new google.maps.LatLng(41.878, -87.437),
      { location: new google.maps.LatLng(41.878, -87.635), weight: 0.5 },

      { location: new google.maps.LatLng(41.878, -87.640), weight: 30 },
      { location: new google.maps.LatLng(41.878, -87.638), weight: 20 },
      new google.maps.LatLng(41.878, -87.443),
      { location: new google.maps.LatLng(41.878, -87.611), weight: 0.5 },
      new google.maps.LatLng(41.878, -620.439),
      { location: new google.maps.LatLng(41.878, -87.634), weight: 20 },
      { location: new google.maps.LatLng(41.878, -87.670), weight: 30 }];

    this.heatmap = new google.maps.visualization.HeatmapLayer({
      map: this.map,
      data: coords
    });
    console.log(this.heatmap);

  }
}
////////////
// let coords1=[];
// this.placesService.getAllDocks().subscribe((data: Station[]) => {
//   this.stations = data;
//   for (let i = 0; i < this.stations.length; i++) {
//     let locationArry = {
//       location: new google.maps.LatLng(this.stations[i].latitude, this.stations[i].longitude),
//       weight: this.stations[i].availableDocks
//     }
//    // console.log(locationArry);
//    coords1.push(locationArry);

//   }
//   this.heatMapData=coords1;
//   //this.heatMapData=[];
//   console.log("a",this.heatMapData);
//   this.heatmap = new google.maps.visualization.HeatmapLayer({
//     //map: this.map,
//     //radius: 50,
//     data: this.heatMapData
// });
// this.heatmap.setMap(this.map);
// //this.setGradient();
// //setTimeout(() =>this.modulateGradient(this.gradient), 10000);

// //google.maps.event.addListenerOnce(this.map, 'tilesloaded', this.modulateGradient(this.gradient));
// });
