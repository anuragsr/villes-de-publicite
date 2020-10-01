import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { CSS3DRenderer, CSS3DObject, CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer'

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
  controls2: OrbitControls
  origin: THREE.Vector3
  cameraStartPos: THREE.Vector3
  cameraHelper: THREE.CameraHelper
  axesHelper: THREE.AxesHelper
  gridHelper: THREE.GridHelper  
  currentCamera: any
  stats: any
  mainCamera: any
  spotLight1: THREE.DirectionalLight
  lightPos1: THREE.Vector3
  spotLightMesh1: THREE.Mesh<THREE.SphereBufferGeometry, THREE.MeshPhongMaterial>
    
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  scene = new THREE.Scene()
  rendererCSS = new CSS3DRenderer()
  sceneCSS = new THREE.Scene()
  orbitCamera = null
  camera = null
  count = 0

  ngOnInit(): void {}

  constructor() {
    
    // this.renderer.shadowMap.enabled = true
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

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

    this.orbitCamera = new THREE.PerspectiveCamera(45, w / h, 1, 5000)
    this.controls = new OrbitControls(this.orbitCamera, this.renderer.domElement)
    this.controls2 = new OrbitControls(this.orbitCamera, this.rendererCSS.domElement)

    this.currentCamera = this.orbitCamera

    this.spotLight1 = new THREE.DirectionalLight(0xffffff, 1)
    // this.spotLight1.castShadow = true
    // //Set up shadow properties for the light
    // this.spotLight1.shadow.mapSize.width = 512;  // default
    // this.spotLight1.shadow.mapSize.height = 512; // default
    // this.spotLight1.shadow.camera.near = 0.5;    // default
    // this.spotLight1.shadow.camera.far = 500;     // default

    this.lightPos1 = new THREE.Vector3(500, 150, -500)
    this.spotLightMesh1 = new THREE.Mesh(
      new THREE.SphereBufferGeometry(5, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2),
      new THREE.MeshPhongMaterial({ color: 0xffff00 })
    )

    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)

    // this.enableInspector()
  }    

  enableInspector(){
    // For THREE Inspector    
    (<any>window).THREE = THREE;
    (<any>window).scene = this.scene
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
      scene, renderer, sceneCSS, rendererCSS,
      rendererContainer, origin, camera, 
      orbitCamera, cameraStartPos,
      spotLightMesh1, spotLight1, lightPos1
    } = this

    renderer.setClearColor(0x000000, 0)
    renderer.domElement.className = "canvas-webGL"
    rendererContainer.nativeElement.appendChild(renderer.domElement)

    rendererCSS.domElement.className = "canvas-css3D"
    rendererContainer.nativeElement.appendChild(rendererCSS.domElement)
    
    orbitCamera.position.copy(cameraStartPos)
    orbitCamera.lookAt(origin)
    scene.add(orbitCamera)

    camera.position.set(200, 150, 200)
    // camera.position.y = 300
    // camera.position.z = 300
    // camera.rotation.x = -Math.PI / 2
    camera.lookAt(origin)
    scene.add(camera)

    // Spotlight and representational mesh
    spotLightMesh1.position.copy(lightPos1)  
    spotLight1.position.copy(lightPos1)
    scene.add(
      spotLight1, 
      spotLightMesh1
    )

    scene.add(new THREE.AmbientLight(0xffffff, .5))
    // scene.fog = new THREE.Fog(0xffffff, 500, 1200)
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
      rendererCSS, camera, orbitCamera
    } = this
    , el =  rendererContainer.nativeElement
    , w = el.clientWidth
    , h = el.clientHeight

    renderer.setSize(w, h)
    rendererCSS.setSize(w, h)

    camera.aspect = w / h
    camera.updateProjectionMatrix()

    orbitCamera.aspect = w / h
    orbitCamera.updateProjectionMatrix()
  }
  
  render() {
    const { 
      renderer, rendererCSS,
      stats, scene, sceneCSS,
      currentCamera
    } = this

    try{
      stats.begin()

      // monitored code goes here      
      renderer.render(scene, currentCamera)
      rendererCSS.render(sceneCSS, currentCamera)

      stats.end()
      // requestAnimationFrame(() => this.render())
    } catch (err){
      l(err)
      gsap.ticker.remove(this.render.bind(this))
    }
  }

  introduce(obj){
    const { scene } = this, total = 4
    scene.add(obj)
    this.count++
    
    l(`${this.count} of ${total} items added : ${obj.name}`)
    l(
      `Loading ${Math.round(this.count*100/total)}%`
    );
    (this.count === total) && l("All items added!")    
  }  

  introduceCSS3D(obj){ this.sceneCSS.add(obj) }

  createMesh(geometry, material, materialOptions = null){
    if(materialOptions) {
      let { wrapping, repeat, minFilter } = materialOptions
      material.map.wrapS = material.map.wrapT = wrapping
      material.map.repeat = repeat
      material.map.minFilter = minFilter
    }

    return new THREE.Mesh(geometry, material)
  }

  addObjects(){
    const { scene, renderer, createMesh } = this
    , obj = new OBJLoader()
    , mtl = new MTLLoader()
    , tex = new THREE.TextureLoader()
    , addMesh = () => {
      const geometry = new THREE.BoxGeometry(50, 50, 50);
      // const material = new THREE.MeshBasicMaterial({color: 0xf0d203, wireframe: true});
      const material = new THREE.MeshNormalMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = -100
      scene.add(mesh);
  
      gsap.to(mesh.rotation, {
        x: Math.PI, y: Math.PI,
        duration: 2, repeat: -1, yoyo: true
      })
    }
    , addBg = () => {
      
      // Cubemap
      // const path = 'assets/textures/skybox2_'
      // , format = '.jpg'
      // , urls = [
      //   path + 'px' + format, path + 'nx' + format,
      //   path + 'py' + format, path + 'ny' + format,
      //   path + 'pz' + format, path + 'nz' + format
      // ]
      // const reflectionCube = new THREE.CubeTextureLoader().load( urls )
      // scene.background = reflectionCube

      // Equirect
      // const texture = tex.load(
      //   'assets/textures/sunset.jpeg',
      //   () => {
      //     const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
      //     rt.fromEquirectangularTexture(renderer, texture);
      //     scene.background = rt;
      //   });

      // tex.load('assets/textures/infinitemirrorspace_spherical.jpg', sph => {
      // tex.load('assets/textures/spherical.jpg', sph => {
      // tex.load('assets/textures/stolanuten.jpg', sph => {
        
      tex.load('assets/textures/sunset.jpeg', sph => {
        const bg = createMesh(
          new THREE.SphereBufferGeometry(500, 50, 50),
          new THREE.MeshBasicMaterial({ 
            map: sph, side: THREE.BackSide
          })
        )
        scene.add(bg)
        bg.position.y = 70
      })
    }
    , addCity = () => {
      tex.load('assets/textures/road2.jpg', road => {
        const floor = createMesh(
          new THREE.CircleGeometry( 500, 64 ),
          new THREE.MeshPhongMaterial({ 
            // color: 0x000000,
            // color: 0xffffff,
            map: road, 
            // bumpMap: floorBump, 
            // bumpScale: .1
          }),
          {
            minFilter: THREE.LinearFilter,
            wrapping: THREE.MirroredRepeatWrapping,
            repeat: new THREE.Vector2(12, 12),
          }
        )
  
        // floor.receiveShadow = true
        floor.rotation.set(-Math.PI / 2, 0, -Math.PI / 2)
        floor.name = "Floor"
  
        this.introduce(floor)
      })

      mtl.load('assets/models/city/city.mtl', materials => {
        materials.preload()
        obj.setMaterials(materials)
        .load('assets/models/city/city.obj', city => {
          city.name = "City"
          city.scale.multiplyScalar(150)
          city.traverse(child => {
            if((<any>child).isMesh){
              // child.castShadow = true;
              (<any>child).material.shininess = 0
            }
          })
          this.introduce(city)
        })
      })
    }
    , addBillboards = () => {
      // create the plane mesh
      var material = new THREE.MeshBasicMaterial({ 
        color: 0x000000, transparent: true, opacity: 0,
        blending: THREE.NoBlending
      });
      // material.color.set('black')
      // material.opacity   = 0;
      // material.blending  = ;

      var geometry = new THREE.PlaneGeometry();
      var planeMesh= new THREE.Mesh( geometry, material );
      // add it to the WebGL scene
      planeMesh.name = "Banner 1"
      this.introduce(planeMesh);
      planeMesh.scale.set(25, 90, 0)
      planeMesh.position.y = 50
      planeMesh.position.z = 10

      const cssObject = new CSS3DObject(document.getElementById("bill1"))
      cssObject.position.copy(planeMesh.position)
      cssObject.scale.multiplyScalar(.15)
      this.introduceCSS3D(cssObject)


      var planeMesh2= new THREE.Mesh( geometry.clone(), material );
      // add it to the WebGL scene
      planeMesh2.name = "Banner 2"
      this.introduce(planeMesh2);
      planeMesh2.scale.set(15, 75, 0)
      planeMesh2.rotation.y = -Math.PI
      planeMesh2.position.y = 50
      planeMesh2.position.z = -70

      const cssObject2 = new CSS3DObject(document.getElementById("bill2"))
      // cssObject2.position.set(0, 0, -100)
      // cssObject2.rotation.set(0, -Math.PI, 0)
      // cssObject2.scale.multiplyScalar(.18)
      cssObject2.rotation.copy(planeMesh2.rotation)
      cssObject2.position.copy(planeMesh2.position)
      cssObject2.scale.multiplyScalar(.15)
      this.introduceCSS3D(cssObject2)
      
      var planeMesh3= new THREE.Mesh( geometry.clone(), material );
      planeMesh3.name = "Banner 3"
      
      planeMesh3.scale.set(18, 90, 0)
      planeMesh3.position.y = 50
      planeMesh3.position.x = 20
      planeMesh3.rotation.y = Math.PI / 2
      
      this.introduce(planeMesh3);

      const cssObject3 = new CSS3DObject(document.getElementById("bill3"))
      cssObject3.rotation.copy(planeMesh3.rotation)
      cssObject3.position.copy(planeMesh3.position)
      cssObject3.scale.multiplyScalar(.15)
      this.introduceCSS3D(cssObject3)

      var planeMesh4 = new THREE.Mesh( geometry.clone(), material );
      planeMesh4.name = "Banner 4"
      
      planeMesh4.scale.set(18, 90, 0)
      planeMesh4.position.y = 50
      planeMesh4.position.z = -60
      planeMesh4.position.x = -15
      planeMesh4.rotation.y = - Math.PI / 2
      
      this.introduce(planeMesh4);

      const cssObject4 = new CSS3DObject(document.getElementById("bill4"))
      cssObject4.rotation.copy(planeMesh4.rotation)
      cssObject4.position.copy(planeMesh4.position)
      cssObject4.scale.multiplyScalar(.15)
      this.introduceCSS3D(cssObject4)
    }
    (() => {
      // Mesh for test
      // addMesh()
      // Background
      addBg()
      // City
      addCity()
      // Billboard
      addBillboards()
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
