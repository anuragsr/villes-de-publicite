import { Component, Input, OnInit } from '@angular/core'
import { CarouselItem } from '../carouselItem'
import { l } from '../helpers/common'

@Component({
  selector: 'app-carousel-parent',
  templateUrl: './carousel-parent.component.html',
  styleUrls: ['./carousel-parent.component.scss']
})
export class CarouselParentComponent implements OnInit {
  @Input()
  carousels: CarouselItem[]

  dummyCarousels: number[] = [...Array(6)]
  
  constructor() { }

  ngOnInit(): void {
    l(this.carousels)
  }

}
