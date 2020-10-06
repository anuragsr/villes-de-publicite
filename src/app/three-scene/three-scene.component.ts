import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { CSS3DRenderer, CSS3DObject, CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer'

import gsap from 'gsap'
import * as dat from 'dat.gui'
import Stats from 'stats.js'

import { LocationService } from '../services/location.service'
import { l } from '../helpers/common'

interface Location { type: string }
const posData = { x: 0, y: 0, z: 0, yRot : 0 }

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
  mixer: THREE.AnimationMixer
  mixer2: THREE.AnimationMixer
  currentMesh: THREE.Object3D

  clock = new THREE.Clock()
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  scene = new THREE.Scene()
  rendererCSS = new CSS3DRenderer()
  sceneCSS = new THREE.Scene()
  orbitCamera = null
  camera = null
  count = 0

  ngOnInit(): void {}

  constructor(private locationService: LocationService) {
    
    this.locationService.locationSet$.subscribe((location:Location) => {
      if(location.type === "map") this.showLocation(location)
    })
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

    this.lightPos1 = new THREE.Vector3(500, 150, -500)
    this.spotLightMesh1 = new THREE.Mesh(
      new THREE.SphereBufferGeometry(5, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2),
      new THREE.MeshPhongMaterial({ color: 0xffff00 })
    )

    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)
    this.stats.showPanel(-1)

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
    // , { currentMesh } = this
    , params =  {
      helpers: true
      , orbitCamera: function () { }
      , mainCamera: function () { }
      , getState: function () { l(this) }
    }

    gui.add(params, 'helpers').onChange(value => this.toggleHelpers(value))
    gui.add(params, 'orbitCamera').onChange(() => { this.currentCamera = this.orbitCamera })
    gui.add(params, 'mainCamera').onChange(() => { this.currentCamera = this.camera })

    gui.add(posData, 'x', -500, 500).onChange(() => this.updateMesh()).listen()
    gui.add(posData, 'y', -500, 500).onChange(() => this.updateMesh()).listen()
    gui.add(posData, 'z', -500, 500).onChange(() => this.updateMesh()).listen()
    gui.add(posData, 'yRot', -Math.PI, Math.PI, .01).onChange(() => this.updateMesh()).listen()
    
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
      currentCamera, mixer, mixer2, clock
    } = this

    try{
      stats.begin()

      // monitored code goes here      
      renderer.render(scene, currentCamera)
      rendererCSS.render(sceneCSS, currentCamera)
      
      if (mixer) mixer.update(clock.getDelta())
      if (mixer2) mixer2.update(clock.getDelta())

      stats.end()
    } catch (err){
      l(err)
      gsap.ticker.remove(this.render.bind(this))
    }
  }

  introduce(obj){
    const { scene } = this, total = 6
    scene.add(obj)
    
    // this.count++
    // l(`${this.count} of ${total} items added : ${obj.name}`)
    // l(
    //   `Loading ${Math.round(this.count*100/total)}%`
    // );
    // (this.count === total) && l("All items added!")    
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

  updateMesh(){
    // l(this.currentMesh, posData)
    this.currentMesh.position.set(posData.x, posData.y, posData.z)
    this.currentMesh.rotation.set(0, posData.yRot, 0)
  }

  setCurrentMesh(gr){
    this.currentMesh = gr

    posData.x = gr.position.x
    posData.y = gr.position.y
    posData.z = gr.position.z
    posData.yRot = gr.rotation.y
  }

  addObjects(){
    const { scene, createMesh } = this
    , mgr = new THREE.LoadingManager()
    , obj = new OBJLoader(mgr)
    , mtl = new MTLLoader(mgr)
    , tex = new THREE.TextureLoader(mgr)
    , gltf = new GLTFLoader(mgr)
    , addMesh = () => {
      const geometry = new THREE.BoxGeometry(50, 50, 50);
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
          new THREE.MeshPhongMaterial({ map: road }),
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
    , addBuildingAds = () => {
      // create the plane mesh
      var material = new THREE.MeshBasicMaterial({ 
        color: 0x000000, transparent: true, opacity: 0,
        blending: THREE.NoBlending
      });

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
    , createBillBoard = ({ name, billboard, plane, css, scaleFactor }) => {
      // l(name, billboard, plane, css, scaleFactor)
      // Group to move billboard and ad mesh together
      const billGr = new THREE.Group()
      this.introduce(billGr)
      billGr.name = name
      billGr.add(billboard.mesh)

      // Mesh to blend with ad gif
      const adMesh = createMesh(
        new THREE.PlaneGeometry(),
        // Essentially this material creates a 'hole' in our webgl scene to peek 
        // into the CSS scene behind it
        new THREE.MeshBasicMaterial({ 
          // wireframe: true,
          // color: 0xff0000, 
          transparent: true, opacity: 0,
          color: 0x000000, blending: THREE.NoBlending 
        })
      )
      adMesh.name = "Plane"
      billGr.add(adMesh)

      const { scale: sc, pos: ps } = plane
      // Set scale to fit ad gif
      adMesh.scale.set(sc[0], sc[1], sc[2])
      // Set position relative to billboard model
      adMesh.position.set(ps[0], ps[1], ps[2])

      // transforms for the group
      const { pos, rot } = billboard
      billGr.position.set(pos[0], pos[1], pos[2])
      billGr.rotation.set(rot[0], rot[1], rot[2])
      billGr.scale.multiplyScalar(scaleFactor)
      billGr.updateMatrixWorld()

      // Get world coordinates of the ad mesh 
      const targetPos = new THREE.Vector3()
      adMesh.getWorldPosition(targetPos)

      // Add ad gif to CSS3D scene
      const { id, scale, offset } = css
      const cssObject = new CSS3DObject(document.getElementById(id))
      this.introduceCSS3D(cssObject)
      
      // Copy world coordinates of the ad mesh to the ad gif
      cssObject.position.copy(targetPos)
      if(offset){
        cssObject.position.x+= offset[0]
        cssObject.position.y+= offset[1]
        cssObject.position.z+= offset[2]
      }
      cssObject.rotation.copy(billGr.rotation)
      // To fit into the ad mesh
      cssObject.scale.multiplyScalar(scale)
      // To scale with the billboard group
      cssObject.scale.multiplyScalar(scaleFactor)

      l(billGr)
      return billGr
    }
    , addBillboards = () => {

      mtl.load("assets/models/billboards/b1/untitled.mtl", materials => {
        materials.preload()
        new OBJLoader().setMaterials(materials)
        .load("assets/models/billboards/b1/untitled.obj", object => {
          // Billboard model - normalize size, scale down later
          const bb = object 
          bb.name = "Billboard"
          bb.scale.multiplyScalar(20)
          bb.rotation.y = Math.PI 
          
          const gr = createBillBoard({
            name: "Billboard Group 1 (Adidas)",
            billboard: { mesh: bb, pos: [-137, 0, -30], rot: [0, -.57, 0] },
            plane: { scale: [160, 65, 0], pos: [0, 148, 8] },
            css: { scale: .27, id: "bill1" }, scaleFactor: .2
          })
          , gr2 = createBillBoard({
            name: "Billboard Group 4 (Converse)",
            billboard: { mesh: bb.clone(), pos: [-90, 0, 137], rot: [0, -.36, 0] },
            plane: { scale: [129, 65, 0], pos: [0, 148, 8] },
            css: { scale: .27, offset: [-.15, 0, 0], id: "bill4" }, scaleFactor: .3
          })
          , gr3 = createBillBoard({
            name: "Billboard Group 6 (Nike)",
            billboard: { mesh: bb.clone(), pos: [159, 0, 0], rot: [0, 2.63, 0] },
            plane: { scale: [129, 65, 0], pos: [0, 148, 8] },
            css: { scale: .28, offset: [-.15, 0, 0], id: "bill6" }, scaleFactor: .3
          })
          , gr4 = createBillBoard({
            name: "Billboard Group 7 (KFC)",
            billboard: { mesh: bb.clone(), pos: [-33, 0, -177], rot: [0, 1.2, 0] },
            plane: { scale: [129, 65, 0], pos: [0, 148, 8] },
            css: { scale: .28, offset: [-.15, 0, 0], id: "bill7" }, scaleFactor: .25
          })

        })
      })
      
      // Double Sided billboard
      gltf.load('assets/models/billboards/b2/scene.glb', obj => { 
        // Billboard model - normalize size, scale down later
        const bb = obj.scene
        bb.name = "Billboard"
        bb.scale.multiplyScalar(10)
        bb.rotation.y = - Math.PI / 2

        const gr = createBillBoard({
          name: "Billboard Group 2 (Nike)",
          billboard: { mesh: bb, pos: [166, 0, -150], rot: [0, -.63, 0] },
          plane: { scale: [75, 44, 0], pos: [0, 100, 2] },
          css: { scale: .05, id: "bill2" }, scaleFactor: .5
        })
        , gr2 = createBillBoard({
          name: "Billboard Group 3 (Coca Cola)",
          billboard: { mesh: bb.clone(), pos: [-86, 0, -130], rot: [0, 1.82, 0] },
          plane: { scale: [80, 42, 0], pos: [0, 100, 2] },
          css: { scale: .2, offset: [0, -4.8, 0], id: "bill3" }, scaleFactor: .5
        })
        , gr3 = createBillBoard({
          name: "Billboard Group 5 (North Face)",
          billboard: { mesh: bb.clone(), pos: [152, 0, 127], rot: [0, .52, 0] },
          plane: { scale: [80, 42, 0], pos: [0, 100, 2] },
          css: { scale: .14, id: "bill5" }, scaleFactor: .65
        })        
      })

      // Auto animated billboard
      gltf.load('assets/models/billboards/b3/scene.gltf', obj => { 
        const bb = obj.scene 
        this.mixer = new THREE.AnimationMixer(bb)   

        // Play a specific animation
        const clips = obj.animations
        , clip = THREE.AnimationClip.findByName(clips, 'Take 001' )
        , action = this.mixer.clipAction(clip)
        action.play()

        bb.name = "Billboard Animated"
        bb.scale.multiplyScalar(.08)
        bb.position.set(38, 65, 200)
        bb.rotation.set(0, -2.34, 0)

        this.introduce(bb)

        const bb2 = bb.clone()
        bb2.position.set(38, 65, 100)
        this.mixer2 = new THREE.AnimationMixer(bb2)
        
        const clips2 = obj.animations
        , clip2 = THREE.AnimationClip.findByName(clips2, 'Take 001' )
        const action2 = this.mixer2.clipAction(clip2)
        action2.play()

        this.introduce(bb2)

        this.setCurrentMesh(bb2)
      })

      mtl.load("assets/models/billboards/b4/untitled.mtl", materials => {
        materials.preload()
        new OBJLoader().setMaterials(materials)
        .load("assets/models/billboards/b4/untitled.obj", object => {
          // Billboard model - normalize size, scale down later
          const bb = object 
          bb.name = "Billboard"
          bb.scale.multiplyScalar(20)
          bb.rotation.y = Math.PI 
          
          // const gr = createBillBoard({
          //   name: "Billboard Group 8 (Adidas)",
          //   billboard: { mesh: bb, pos: [-200, 100, 0], rot: [0, 0, 0] },
          //   plane: { scale: [143, 108, 0], pos: [0, 167.5, 8] },
          //   css: { scale: .18, id: "bill8" }, scaleFactor: .5
          // })
          // , gr2 = createBillBoard({
          //   name: "Billboard Group 9 (Zeta Office)",
          //   billboard: { mesh: bb.clone(), pos: [0, 200, 0], rot: [0, 0, 0] },
          //   plane: { scale: [109, 107, 0], pos: [0, 167.5, 8] },
          //   css: { scale: .17, id: "bill9" }, scaleFactor: .5
          // })
        })
      })
      
    }
    
    mgr.onError = url => {
      l('There was an error loading ' + url)
    }

    (() => {
      // Mesh for test
      // addMesh()
      // Background
      addBg()
      // City
      addCity()
      // Building ads
      // addBuildingAds()
      // Billboards
      addBillboards()
    })()
  }
  showLocation(location){
    // l(location, "From service")
    this.currentCamera = this.camera
    gsap.to(this.currentCamera.position, {
      duration: 2, 
      x: location.camPos[0],
      y: location.camPos[1],
      z: location.camPos[2],
      onUpdate:() =>{
        this.currentCamera.lookAt(
          new THREE.Vector3(
            location.xyzPos[0],
            location.xyzPos[1],
            location.xyzPos[2],
          )
        )
      }
    })
  }
}
