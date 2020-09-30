import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { l } from '../helpers/common'

@Component({
  selector: 'app-three-scene',
  templateUrl: './three-scene.component.html',
  styleUrls: ['./three-scene.component.scss']
})
export class ThreeSceneComponent implements OnInit {
  origin: THREE.Vector3
  cameraStartPos: THREE.Vector3
  axesHelper: THREE.AxesHelper
  gridHelper: THREE.GridHelper
  frameId: number
  ngZone: any

  ngOnInit(): void {
    // this.animate()
  }

  @ViewChild('rendererContainer') rendererContainer: ElementRef

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  scene = null
  camera = null
  mesh = null

  public constructor(private ngZone: NgZone) {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000)
    this.camera.position.z = 1000

    const geometry = new THREE.BoxGeometry(20, 20, 20)
    const material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true})
    this.mesh = new THREE.Mesh(geometry, material)

    this.scene.add(this.mesh)
    
    this.origin = new THREE.Vector3(0, 0, 0)
    // this.cameraStartPos = new THREE.Vector3(0, 150, 200)
    this.cameraStartPos = new THREE.Vector3(0, 500, 0)
    this.axesHelper = new THREE.AxesHelper(500)
    this.axesHelper.material.opacity = .5
    this.axesHelper.material.transparent = true

    this.gridHelper = new THREE.GridHelper( 1000, 50 )
    this.gridHelper.material.opacity = .3
    this.gridHelper.material.transparent = true
    this.gridHelper.name = "Grid Helper"

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
  }

  ngAfterViewInit() {
    this.init()
  }
  
  init(){
    let show = false
    // Initialize the scene
    this.initScene()
    // Uncomment below 2 lines for testing
    show = true
    this.initGUI()
    this.toggleHelpers(show)
    this.addListeners()
    this.resize()
  }

  initScene(){
    this.renderer.setClearColor(0x000000, 0)
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement)
  }
  
  initGUI(){

  }
  
  toggleHelpers(val) {
    const {
      scene, gridHelper, axesHelper,
      // mouseCameraHelper, stats,
    } = this
    if(val){
      scene.add(gridHelper)
      scene.add(axesHelper)
      // scene.add(mouseCameraHelper)
      // stats.showPanel(0)
    } else{
      scene.remove(gridHelper)
      scene.remove(axesHelper)
      // scene.remove(mouseCameraHelper)
      // stats.showPanel(-1)
    }
  }

  addListeners(){
    this.animate()
  }

  resize(){
    const el =  this.rendererContainer.nativeElement
    , w = el.clientWidth
    , h = el.clientHeight

    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }
  
  render() {
    this.frameId = requestAnimationFrame(() => {
      this.render()
    })
    // this.mesh.rotation.y+= .01
    this.renderer.render(this.scene, this.camera)
  }

  animate() {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('DOMContentLoaded', () => {
        this.render()
      })

      window.addEventListener('resize', () => {
        this.resize()
      })
    })
  }
}

