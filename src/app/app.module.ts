import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppComponent } from './app.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatGridListModule } from '@angular/material/grid-list';
import { ThreeSceneComponent } from './three-scene/three-scene.component';
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
    MatGridListModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
