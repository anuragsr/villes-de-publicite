import { Component } from '@angular/core'
import { CarouselItem } from './carouselItem'
import { l } from './helpers/common'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  carouselsLeft: CarouselItem[]
  carouselsRight: CarouselItem[]

  constructor(){
    this.carouselsLeft = [
      { url: "img1.jpg" },
      { url: "img2.jpg" }
    ]
    this.carouselsRight = [
      { url: "img1.jpg" },
      { url: "img2.jpg" }
    ]
  }
}
