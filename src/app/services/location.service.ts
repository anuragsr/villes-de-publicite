import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  constructor() { }
  
  // Observable string sources
  private locationSetSource = new Subject<object>()
  private locationGetSource = new Subject<object>()

  // Observable string streams
  locationSet$ = this.locationSetSource.asObservable()
  locationGet$ = this.locationGetSource.asObservable()

  // Service message commands
  setLocation(location: object) {
    this.locationSetSource.next(location)
  }

  getLocation(location: object) {
    this.locationGetSource.next(location)
  }
}
