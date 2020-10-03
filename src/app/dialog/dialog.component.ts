import { Component, Inject } from '@angular/core'
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { LocationService } from '../services/location.service'
import { l } from '../helpers/common'

interface Location { type: string }

@Component({
  selector: 'dialog-carousel',
  template: '',
})
export class DialogComponent {
  
  constructor(
    public dialog: MatDialog,
    private locationService: LocationService
  ) {
    this.locationService.locationSet$.subscribe((location:Location) => {
      if(location.type === "gallery") this.openDialog(location)
    })
  }

  openDialog(data) {
    const dialogRef = this.dialog.open(DialogCarouselContent, { data })
    dialogRef.afterClosed().subscribe(result => {
      l(`Dialog result: ${result}`)
    })
  }
}

@Component({
  selector: 'dialog-carousel-content',
  templateUrl: 'dialog-carousel-content.html',
})
export class DialogCarouselContent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}