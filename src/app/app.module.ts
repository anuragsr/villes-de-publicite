import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppComponent } from './app.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatGridListModule } from '@angular/material/grid-list';
import { ThreeSceneComponent } from './three-scene/three-scene.component'

@NgModule({
  declarations: [
    AppComponent,
    ThreeSceneComponent
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
