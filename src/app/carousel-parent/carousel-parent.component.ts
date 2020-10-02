import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core'
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap'

import { l } from '../helpers/common'
import { LocationService } from '../services/location.service'

@Component({
  selector: 'app-carousel-parent',
  templateUrl: './carousel-parent.component.html',
  styleUrls: ['./carousel-parent.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CarouselParentComponent implements OnInit {
  @Input() carousels: any[]

  constructor(
    private config: NgbCarouselConfig,
    private locationService: LocationService
  ) {
    this.config.interval = 0
    this.config.showNavigationIndicators = false
  }

  ngOnInit(): void {}

  selectLocation(location){
    // l(location)
    this.locationService.getLocation(location);
  }
}
