import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core'
import { LocationService } from '../services/location.service'
import { l } from '../helpers/common'

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LocationComponent implements OnInit {
  @Input() carousels: any[]

  constructor(private locationService: LocationService) {}
  ngOnInit(): void {}
  selectLocation(location, type){
    // l(location)
    location.type = type
    this.locationService.getLocation(location)
  }
}