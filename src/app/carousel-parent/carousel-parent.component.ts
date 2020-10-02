import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core'
import { l } from '../helpers/common'
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-carousel-parent',
  templateUrl: './carousel-parent.component.html',
  styleUrls: ['./carousel-parent.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [NgbCarouselConfig]
})
export class CarouselParentComponent implements OnInit {
  @Input() carousels: any[]

  constructor(config: NgbCarouselConfig) {
    config.interval = 0
    config.showNavigationIndicators = false
  }

  ngOnInit(): void {
    // l(this.carousels)
  }
  selectLocation(location){
    l(location)
  }
}
