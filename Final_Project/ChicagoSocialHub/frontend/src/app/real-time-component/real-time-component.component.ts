import { Component, OnInit } from '@angular/core';
import { PlacesService } from '../places.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Router } from '@angular/router';
import * as io from 'socket.io-client';
import { Place } from '../place';
import { Station } from '../station';
import { Datas } from '../datas';
import { RealTimeData } from '../realTimeData';


import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';
import * as d3Time from 'd3-time';


@Component({
  selector: 'app-real-time-component',
  templateUrl: './real-time-component.component.html',
  styleUrls: ['./real-time-component.component.css']
})


export class RealTimeComponentComponent implements OnInit {


  socket: SocketIOClient.Socket;
  private id;


  liveStations :  Station[] = [];


  public data : Array<RealTimeData> = [];


  datas = {
    stations : []

  }
  private valueline;
  private  x;
  private  y;
  private  xAxisG;
  private  yAxisG;
  private svg;
  private line;
  smaData_1hour: any = [];
  smaData_24hour: any = [];
  private sma_red: d3Shape.Line<[number, number]>;
  private sma_blue: d3Shape.Line<[number, number]>;
  private sma_1 = false;
  private sma_24 = false;

  constructor(private placesService: PlacesService, private fb: FormBuilder, private router: Router, private route: ActivatedRoute) {
    this.socket = io.connect('http://localhost:3000');

  }

  ngOnInit() {


    this.route.queryParams.subscribe((data) => {
      this.id =  data.id;
    });
    this.setupGraph();
    this.getStationsData(0);


    this.socket.on(`live_data${this.id}` ,data => {



      this.liveStations = [];

      for(var i =0 ;i < data.data.length; i++){
        this.liveStations.push(data.data[i]);

      }



      this.parseMessage(data);



      console.log("Drawing new Map");
    })


  }
  onChange(val){
    d3.select("#chart > * ").remove();
    this.data.length =0;
    this.liveStations = [];

    this.setupGraph();
    this.getStationsData(val)



  }
  compare(a,b){
    a = new Date(a);
    b = new Date(b);
    if (a.timeInterval < b.timeInterval)
        return -1;
    if (a.timeInterval > b.timeInterval)
      return 1;
    return 0;
  }
  parseMessage(data){
    var data = data.data;

    this.parseDataM(data);
    this.data.sort(this.compare);

    this.plotLineGraph();

  }

  parseDataM(data){
    var parseDate = d3.timeFormat("%Y-%m-%dT%H:%M:%S%Z");
      var time = data['lastcommunicationtime'];
      var docks = data['availabledocks'];
      var cand = {timeInterval : parseDate(new Date(time)), docks: docks}

      this.data.push(cand);
    //this.plotLineGraph();

  }
  parseData(){

    var orig = this.liveStations;
    var parseDate = d3.timeFormat("%Y-%m-%dT%H:%M:%S%Z");
    for(var i = 0 ;i <   orig.length; i++){
      var time = orig[i]['lastcommunicationtime'];
      var docks = orig[i]['availabledocks'];
      var cand = {timeInterval : parseDate(new Date(time)), docks: docks}
      this.data.push(cand);
    }
    this.plotLineGraph();

  }
  getStationsData(val){
    if(val == 0){

      this.placesService.
        getStationsLive(this.id)
        .subscribe((data : Datas) =>{
          this.liveStations = data.stations
          this.smaData_1hour = this.calculateAverage(this.liveStations);

          this.parseData();
          this.plotSma();
        });
    }else if(val == 1){
      this.placesService.
        getStationsLive1(this.id)
        .subscribe((data : Datas) =>{
          this.liveStations = data.stations
          this.smaData_24hour = this.calculateAverage(this.liveStations);

          this.parseData();
          this.plotSma();
        });
    }else{
      this.placesService.
        getStationsLive2(this.id)
        .subscribe((data : Datas) =>{
          this.liveStations = data.stations
          //this.smaData_24hour = this.calculateAverage(this.liveStations);

          this.parseData();
          //this.plotSma();
        });
    }

  }


  plotSma(){

    this.sma_blue = d3Shape.line()
          .x((d: any) => this.x(new Date(d.lastcommunicationtime))) //d.loggingtime
          .y((d: any) => this.y(d.availabledocks_avg));


    this.svg.append("path")
        .datum(this.smaData_1hour)
        .attr("fill", "none")
        .attr("class", "sma_blue")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", this.sma_blue);




        //720-past 24 hr
        this.sma_red = d3Shape.line()
            .x((d: any) => this.x(new Date(d.lastcommunicationtime))) //d.loggingtime
            .y((d: any) => this.y(d.availabledocks_avg));

            console.log(this.smaData_24hour)
        this.svg.append("path")
            .datum(this.smaData_24hour)
            .attr("fill", "none")
            .attr("class", "sma_red")
            .attr("stroke", "Red")
            .attr("stroke-width", 5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", this.sma_red);

        let legend24 = this.svg.append('g')
        .attr('x', 20)
        .attr('y', 10)
        .attr('width', 18)
        .attr('height', 10)


        legend24.append('rect')
        .attr('x',20)
        .attr('y',5)
        .attr('width',18)
        .attr('height',10)
        .attr('fill','#FF0000');

        legend24.append('text')
        .attr('x', 40)
        .attr('y', 5)
        .attr('dy','0.32em')
        .text("SMA 24 Hour Data")


        legend24.append('rect')
        .attr('x',20)
        .attr('y',20)
        .attr('width',18)
        .attr('height',10)
        .attr('fill','steelblue');

        legend24.append('text')
        .attr('x',40)
        .attr('y',20)
        .attr('dy','0.32em')
        .text("SMA 1 Hour Data")


        this.SMAFunction('sma_blue')
        this.SMAFunction('sma_red')
  }

  setupGraph() {
    // Set the dimensions of the canvas / graph
    var margin = {
        top: 30,
        right: 20,
        bottom: 30,
        left: 50
      },
      width = 700 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom;

    // Set the ranges
    this.x = d3.scaleTime().range([0, width]);
    this.y = d3.scaleLinear().range([height , 0]);

    var x1 = this.x
    var y1 =  this.y
    // Define the line


    this.valueline = d3.line()
      .x(function(d : any) {

        return x1(new Date(d.timeInterval));
      })
      .y(function(d : any) {
        return y1(parseInt(d.docks));
      });

    // Adds the svg canvas
    var svg = d3.select("#chart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add the X Axis
    this.xAxisG = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")");

    // Add the Y Axis
    this.yAxisG = svg.append("g")
      .attr("class", "y axis")

      svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height - 6)
      .text("Time");

      svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Available Docks");



    this.line = svg.append("path").style('stroke-width', '5px').style('fill','none').style('stroke','green');
    this.svg = svg;


  }

  plotLineGraph() {
      console.log("Plotting...")


      var line = this.valueline;
      var data = this.data
      var x = this.x;
      var y = this.y;
      // Scale the range of the data
      this.x.domain(d3.extent(data, function(d) {
        return new Date(d.timeInterval);
      }));
      this.y.domain([0, d3.max(this.data, function(d) {
        return parseInt(d.docks);
      })+ 5]);

      // transistion axis
      this.xAxisG
        .transition()
        .duration(500)
        .ease(d3.easeLinear,2)
        .call(d3.axisBottom(x));


      this.yAxisG
        .transition()
        .duration(500)
        .ease(d3.easeLinear,2)
        .call(d3.axisLeft(y));

      // change the line
      this.line.transition()
        .duration(500)
        .attr("d", line(data));




          console.log("Reached Here");

    }

    calculateAverage(arr) {
      // console.log(arr);

      var result = []

        var sum = 0;
        var count = 1;
        for (var i = 0; i < arr.length; i++) {
            sum += arr[i].availabledocks;

            var cand = { lastcommunicationtime: arr[i].lastcommunicationtime, availabledocks_avg:  sum / count };
            count++;
            result.push(cand);
        }
        return result;
    }

    SMAFunction(c) {
        if (c == 'sma_blue') {
            if (this.sma_1) {
                d3.selectAll('.sma_blue').attr('style', 'display:block')
            }
            else {
                d3.selectAll('.sma_blue').attr('style', 'display:none')
            }
        }
        if (c == 'sma_red') {
            if (this.sma_24) {
                d3.selectAll('.sma_red').attr('style', 'display:block')
            }
            else {
                d3.selectAll('.sma_red').attr('style', 'display:none')
            }
        }


    }
}
