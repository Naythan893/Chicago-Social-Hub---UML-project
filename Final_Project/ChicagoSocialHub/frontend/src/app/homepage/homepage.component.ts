import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PlacesService } from '../places.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  title = 'Welcome HomePage';
  constructor(private placesService: PlacesService, private router: Router) { }
  private hours: any;


  ngOnInit() {
  }

  divvy_heatmap(){
    this.placesService.divvy_heatmap(this.hours).subscribe(() => {
      this.router.navigate(['/heatmap']);
    });
  }
}
