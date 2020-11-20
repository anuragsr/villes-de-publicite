/* tslint:disable:semicolon */
import { Component } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { LocationService } from './services/location.service'
import { l } from './helpers/common'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [LocationService]
})
export class AppComponent {
  carouselsLeft: any[]
  carouselsRight: any[]
  location: object

  constructor(
    private http: HttpClient,
    private locationService: LocationService
  ){
    this.http
    .get('assets/data/locations.json')
    .subscribe((data:any) => {
      const { locations }  = data, len = locations.length
      this.carouselsLeft = locations.slice(0, len / 2)
      this.carouselsRight = locations.slice(len / 2, len)
    })

    this.locationService.locationGet$.subscribe(location => {
      this.location = location
      this.broadcast()
    })
  }

  broadcast() {
    this.locationService.setLocation(this.location)
  }
}
