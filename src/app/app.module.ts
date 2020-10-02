import { BrowserModule } from '@angular/platform-browser'
import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'

import { AppComponent } from './app.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatGridListModule } from '@angular/material/grid-list'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'

import { ThreeSceneComponent } from './three-scene/three-scene.component'
import { CarouselParentComponent } from './carousel-parent/carousel-parent.component'

@NgModule({
  declarations: [
    AppComponent,
    ThreeSceneComponent,
    CarouselParentComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatGridListModule,
    NgbModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
