import { Component, Input, OnInit, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core'
import { ThemePalette } from '@angular/material/core'
import { MatCarouselSlideComponent } from '@ngbmodule/material-carousel'
import { l } from '../helpers/common'

interface Location { images: object[] }

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CarouselComponent implements OnInit {
  @Input() location: Location

  slidesList = new Array<any>(7)
  showContent = true
  parentHeight = 'auto'
  timings = '250ms ease-in'
  autoplay = true
  interval = 5000
  loop = true
  hideArrows = false
  hideIndicators = false
  color: ThemePalette = 'warn'
  // public color: ThemePalette = 'accent'
  maxWidth = 'auto'
  maintainAspectRatio = true
  proportion = 37
  slideHeight = '200px'
  slides = this.slidesList.length
  overlayColor = 'rgba(0, 0, 0, .4)'
  hideOverlay = false
  useKeyboard = true
  useMouseWheel = false

  @ViewChildren(MatCarouselSlideComponent) public carouselSlides: QueryList<MatCarouselSlideComponent>

  constructor() {}
  
  ngOnInit(): void {
    // l(this.location)
    this.slidesList = this.location.images
  }
}