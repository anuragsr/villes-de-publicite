import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'

import gsap from 'gsap'

import * as dat from 'dat.gui'
import Stats from 'stats.js'

import { l } from '../helpers/common'

@Component({
  selector: 'app-three-scene',
  templateUrl: './three-scene.component.html',
  styleUrls: ['./three-scene.component.scss']
})
export class ThreeSceneComponent implements OnInit {
  @ViewChild('rendererContainer') rendererContainer: ElementRef
  controls: OrbitControls
  origin: THREE.Vector3
  cameraStartPos: THREE.Vector3
  cameraHelper: THREE.CameraHelper
  axesHelper: THREE.AxesHelper
  gridHelper: THREE.GridHelper  
  currentCamera: any
  stats: any
  mainCamera: any
    
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  scene = new THREE.Scene()
  orbitCamera = null
  camera = null
  count = 0
  spotLight1: THREE.DirectionalLight
  lightPos1: THREE.Vector3
  spotLightMesh1: THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhongMaterial>

  ngOnInit(): void {}

  constructor() {
    const w = window.innerWidth, h = window.innerHeight
        
    this.camera = new THREE.PerspectiveCamera(45, w / h, 1, 2000)
    this.camera.name = "Main Camera"
    this.camera.position.z = 1000
    this.cameraHelper = new THREE.CameraHelper(this.camera)
    
    this.origin = new THREE.Vector3(0, 0, 0)
    // this.cameraStartPos = new THREE.Vector3(0, 150, 200)
    this.cameraStartPos = new THREE.Vector3(0, 500, 0)
    this.axesHelper = new THREE.AxesHelper(500);
    (<any>this.axesHelper.material).opacity = .5;
    (<any>this.axesHelper.material).transparent = true

    this.gridHelper = new THREE.GridHelper( 1000, 50 );
    (<any>this.gridHelper.material).opacity = .3;
    (<any>this.gridHelper.material).transparent = true
    this.gridHelper.name = "Grid Helper"

    this.orbitCamera = new THREE.PerspectiveCamera(45, w / h, 1, 2000)
    this.controls = new OrbitControls(this.orbitCamera, this.renderer.domElement)
    this.currentCamera = this.orbitCamera

    this.spotLight1 = new THREE.DirectionalLight(0xffffff, 1)
    this.lightPos1 = new THREE.Vector3(500, 350, 500)
    this.spotLightMesh1 = new THREE.Mesh(
      new THREE.SphereGeometry(5, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2),
      new THREE.MeshPhongMaterial({ color: 0xffff00 })
    )

    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)
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
    this.addObjects()
  }

  initScene(){
    const {
      scene, renderer, rendererContainer, origin,
      camera, orbitCamera, cameraStartPos,
      spotLightMesh1, spotLight1, lightPos1
    } = this

    renderer.setClearColor(0x000000, 0)
    rendererContainer.nativeElement.appendChild(renderer.domElement)
    
    orbitCamera.position.copy(cameraStartPos)
    orbitCamera.lookAt(origin)
    scene.add(orbitCamera)

    camera.position.copy(origin)
    camera.position.y = 100
    camera.rotation.x = -Math.PI / 2
    scene.add(camera)

    // Spotlight and representational mesh
    spotLightMesh1.position.copy(lightPos1)  
    spotLight1.position.copy(lightPos1)
    scene.add(
      spotLight1, 
      spotLightMesh1
    )

    scene.add(new THREE.AmbientLight(0xffffff, .5))
  } 
  
  initGUI(){
    const gui = new dat.GUI()
    , params =  {
      helpers: true
      , orbitCamera: function () { }
      , mainCamera: function () { }
      , getState: function () { l(this) }
    }
    , he = gui.add(params, 'helpers')
    , orbitCamera = gui.add(params, 'orbitCamera')
    , mainCamera = gui.add(params, 'mainCamera')

    he.onChange(value => this.toggleHelpers(value))
    orbitCamera.onChange(() => { this.currentCamera = this.orbitCamera })
    mainCamera.onChange(() => { this.currentCamera = this.camera })

    gui.add(params, 'getState')
  }
  
  toggleHelpers(val) {
    const {
      scene, gridHelper, axesHelper,
      cameraHelper, stats
    } = this
    if(val){
      scene.add(gridHelper)
      scene.add(axesHelper)
      scene.add(cameraHelper)
      stats.showPanel(0)
    } else{
      scene.remove(gridHelper)
      scene.remove(axesHelper)
      scene.remove(cameraHelper)
      stats.showPanel(-1)
    }
  }

  addListeners(){
    gsap.ticker.add(this.render.bind(this))
    window.addEventListener('resize', this.resize.bind(this), false)
  }

  resize(){
    const {
      rendererContainer, renderer,
      camera, orbitCamera
    } = this
    , el =  rendererContainer.nativeElement
    , w = el.clientWidth
    , h = el.clientHeight

    renderer.setSize(w, h)

    camera.aspect = w / h
    camera.updateProjectionMatrix()

    orbitCamera.aspect = w / h
    orbitCamera.updateProjectionMatrix()
  }
  
  render() {
    const { 
      renderer,
      stats, scene,
      currentCamera
    } = this

    try{
      stats.begin()

      // monitored code goes here      
      renderer.render(scene, currentCamera)
      
      stats.end()
      // requestAnimationFrame(() => this.render())
    } catch (err){
      l(err)
      gsap.ticker.remove(this.render.bind(this))
    }
  }

  introduce(obj){
    let { count, scene } = this
    scene.add(obj)
    count++
    
    l(`${count} of 1 items added : ${obj.name}`)
    l(
      `Loading ${Math.round(count*100)}%`
    )
    if(count === 1){
      l("All items added!")
      // this.enableEnter()
    }
    // l(obj)
  }  

  addObjects(){
    const { scene, renderer } = this
    , obj = new OBJLoader()
    , mtl = new MTLLoader()
    , addMesh = () => {
      const geometry = new THREE.BoxGeometry(50, 50, 50);
      const material = new THREE.MeshBasicMaterial({color: 0xf0d203, wireframe: true});
      const mesh = new THREE.Mesh(geometry, material);
  
      scene.add(mesh);
  
      gsap.to(mesh.rotation, {
        x: Math.PI, y: Math.PI,
        duration: 2, repeat: -1, yoyo: true
      })
    }
    , addBg = () => {
      const path = 'assets/textures/skybox2_'
      , format = '.jpg'
      , urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
      ]

      // Cubemap
      // const reflectionCube = new THREE.CubeTextureLoader().load( urls )
      // scene.background = reflectionCube

      // Equirect
      // const loader = new THREE.TextureLoader();
      // const texture = loader.load(
      //   'assets/textures/skybox.jpg',
      //   () => {
      //     const rt = new THREE.WebGLCubeRenderTarget(500);
      //     rt.fromEquirectangularTexture(renderer, texture);
      //     scene.background = rt;
      //   });
    }
    , addCity = () => {
      mtl.load('assets/models/city/metro1.mtl', materials => {
        materials.preload()
        obj.setMaterials(materials)
        .load('assets/models/city/metro1.obj', city => {
          city.name = "City"
          city.scale.multiplyScalar(100)
          city.traverse(child => {
            if((<any>child).isMesh){
              (<any>child).material.shininess = 0      
            }
          })
          this.introduce(city)
        })
      })
    }

    (() => {
      // addMesh()
      
      // Background
      addBg()
      // City
      addCity()
    })()
  }
  
  // animate() {          
  //   // We have to run this outside angular zones,
  //   // because it could trigger heavy changeDetection cycles.
  //   this.ngZone.runOutsideAngular(() => {
  //     gsap.ticker.add(this.render.bind(this))
  //     // window.addEventListener('DOMContentLoaded', this.resize.bind(this), false)
  //     window.addEventListener('resize', this.resize.bind(this), false)
  //   })
  // }
}
