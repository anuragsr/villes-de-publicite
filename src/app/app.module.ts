/* tslint:disable:semicolon */
import { BrowserModule } from '@angular/platform-browser'
import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'

import { AppComponent } from './app.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialogModule } from '@angular/material/dialog'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field'
import { MatCarouselModule } from '@ngbmodule/material-carousel'

import { ThreeSceneComponent } from './three-scene/three-scene.component'
import { LocationComponent } from './locations/location.component'
import { DialogComponent, DialogCarouselContent } from './dialog/dialog.component'
import { CarouselComponent } from './carousel/carousel.component'

@NgModule({
  declarations: [
    AppComponent,
    ThreeSceneComponent,
    LocationComponent,
    DialogCarouselContent,
    DialogComponent,
    CarouselComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatFormFieldModule, 
    MatCarouselModule.forRoot(),
  ],
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill' } },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
