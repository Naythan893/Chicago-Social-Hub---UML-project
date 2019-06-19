import {  Component, OnInit, Input, ViewChild, ElementRef, OnChanges, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Data } from './dashboarddata';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';

import { Place } from '../place';
import { PlacesService } from '../places.service';


const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json'
  })
};

@Component({
  selector: 'app-bar-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  @ViewChild('barChart')
  private chartContainer: ElementRef;
  @Input()
  data: Data[];

  title='Dashboard';
  margin = { top: 20, right: 20, bottom: 30, left: 40 };
  uri = 'http://localhost:4000';
  svg;
  width;
  height;
  g;
  x;
  y;
  line;
  
  places: Place[]=[];
  displayedColumns = ['name', 'display_phone', 'address1', 'is_closed', 'rating','review_count', 'Divvy'];

  constructor(private placesService: PlacesService, private router: Router, private http: HttpClient) { }
  //constructor() { }

  ngOnInit() {
    this.fetchPlaces();
    if (!this.data) { return; }


  }
  ngOnChanges(): void {
    if (!this.data) { return; }


  }

  fetchPlaces() {
    this.placesService
      .getPlaces()
      .subscribe((data: Place[]) => {
        this.places = data;

        this.createBartChart();
        this.createLineChart();

        //this.newplaces=data;

      });

  }


  private createBartChart(): void {
    const element = this.chartContainer.nativeElement;
    const data = this.places;

    var set = new Set()
    var index = 1;

    for (var i = 0,len = this.places.length; i < len; i++) {
      if(set.has(this.places[i].name)){
        var temp = this.places[i];
        temp.name = temp.name + "_" + index;
        index++;
        data[i] = temp;
      }else{
        data[i]=this.places[i];
        set.add(this.places[i].name);
      }

    }

    //d3.select(element).select('svg').remove();
    console.log(data)
    const svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight)
      .attr('visibility','visible');

    const contentWidth = element.offsetWidth - this.margin.left - this.margin.right;
    const contentHeight = element.offsetHeight - this.margin.top - this.margin.bottom ;

    const x = d3
      .scaleBand()
      .rangeRound([0, contentWidth])
      .padding(0.1)
      .domain(data.map(d => d.name.toString()));

    const y = d3
      .scaleLinear()
      .rangeRound([contentHeight, 0])
      .domain([0, d3.max(data, d => parseFloat(d.rating.toString()) )]);

    const g = svg.append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + contentHeight + ')')
      //.attr('transform', 'rotate(0)')
      .call(d3.axisBottom(x));

    g.append('g')
      .attr('class', 'axis axis--y')
      .call(d3.axisLeft(y).ticks(10, ''))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .text('Frequency');
      
      

    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('fill','#A569BD')

      .attr('x', d => x(d.name.toString()))
      .attr('y', d => y(parseFloat(d.rating.toString())))
      .attr('width', x.bandwidth())
      .attr('height', d => contentHeight - y(parseFloat(d.rating.toString())));

      g.append('text')
      
    .attr('x', -(contentHeight/ 2) - this.margin.left+30)
    .attr('y', this.margin.right / 2.4 -34)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'top')
    .text('Rating')
    

    // this.ShowBarChart();
  }

  createLineChart() : void{

    //d3.selectAll("svg > *").remove();\

    this.svg = d3.select("#line-chart").append('svg')
                .attr('width', 1152)
                .attr('height', 200)
                .attr('visibility','visible');
    this.width = +this.svg.attr('width') - this.margin.left - this.margin.right;
    this.height = +this.svg.attr('height') - this.margin.top - this.margin.bottom;
    this.g = this.svg.append('g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
    this.x = d3Scale.scaleBand().rangeRound([0, this.width]).padding(0.1);
    this.y = d3Scale.scaleLinear().rangeRound([this.height, 0]);

    this.x.domain(this.places.map((d) => d.name));
    this.y.domain([0, d3Array.max(this.places, (d) => +d.review_count)]);

    this.g.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(-80,' + this.height + ')')
        .text('Places')
        .call(d3Axis.axisBottom(this.x))
        .selectAll("text")
        .style("text-anchor", "begin")
        .attr("dx", "-.18em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(0)");
    this.g.append('g')
        .attr('class', 'y axis')
        .call(d3Axis.axisLeft(this.y))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(0)");
        this.g.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", this.width)
        .attr("y", this.height - 6)
        .text("name of the Restaurants");


    this.line = d3Shape.line()
        .x((d: any) => this.x(d.name))//d.loggingtime
        .y((d: any) => this.y(d.review_count));


    this.g.append("path")
        .datum(this.places)
        .attr("fill", "none")
        .attr("class", "line")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", this.line);
        this.g.append('text')
        .text("Review count");
        

  }



  onResize() {
    this.createBartChart();
    this.createLineChart();
  }
  // ShowBarChart()
  // {
  //   var a = 0;
  //   const element = this.chartContainer.nativeElement;
  //   if(a==0)
  //   {
  //     d3.select(element).select('svg').attr('visibility','visible');
  //   }
  //   if(a==1)
  //   {
  //     d3.select(element).select('svg').attr('visibility','hidden');
  //   }
  //
  // }
  //
  // ShowLineChart()
  // {
  //   var a = 0;
  //   const element = this.chartContainer.nativeElement;
  //   if(a==0)
  //   {
  //     d3.select(element).select('svg').attr('visibility','visible');
  //   }
  //   if(a==1)
  //   {
  //     d3.select(element).select('svg').attr('visibility','hidden');
  //   }
  //
  // }
  // hidechart()
  // {
  //   var a = 0;
  //   const element = this.chartContainer.nativeElement;
  //   if(a==0)
  //   {
  //     d3.select(element).select('svg').attr('visibility','hidden');
  //   }
  // }

}
