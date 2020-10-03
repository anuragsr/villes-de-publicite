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
    const { scene } = this, total = 6
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
    , addBillboards = () => {
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
    , addBillboards2 = () => {
      // gltf.load('assets/models/billboards/b1/scene.gltf', obj => { 
      //   // l(obj)
      //   const billboard1 = obj.scene 
      //   billboard1.name = "Billboard 1"
      //   billboard1.traverse(child => {
      //     if(child.name === "Billboard_Mat_1"){
      //       l(child)
      //       (<any>child).material = new THREE.MeshPhongMaterial({
      //         color: 0xffffff
      //       })
      //     }
      //   })
      //   // billboard1.position.z = -250
      //   // router.scale.multiplyScalar(.03)
      //   // router.rotation.set(0, Math.PI / 2 + .2, 0)
      //   // router.position.set(-36.54, 27.6, -120)
      //   this.introduce(billboard1)
      // })
      mtl.load("assets/models/billboards/b2-mod/untitled.mtl", materials => {
        materials.preload()
        new OBJLoader()
        .setMaterials( materials )
        .load( 'assets/models/billboards/b2-mod/untitled.obj', object => {
          // const stool = object
          // stool.name = "Stool"
          // stool.children[0].castShadow = true
          // stool.scale.multiplyScalar(.2)
          // stool.rotation.set(-Math.PI / 2, 0, -Math.PI / 2)
          // stool.position.set(120, 0, -70)
          // this.introduce(stool)
          const billGr1 = new THREE.Group()
          billGr1.name = "Billboard Gr 1"
          this.introduce(billGr1)
          const billboard2 = object 
          billboard2.name = "Billboard 2"
          billboard2.scale.multiplyScalar(20)
          billboard2.rotation.y = Math.PI 
          billGr1.add(billboard2)
          // this.introduce(billboard2)

          var material = new THREE.MeshBasicMaterial({ 
            transparent: true, 
            // wireframe: true,
            // color: 0xff0000, 
            color: 0x000000, 
            opacity: 0,
            blending: THREE.NoBlending
          });
    
          var geometry = new THREE.PlaneGeometry();
          var planeMesh= new THREE.Mesh( geometry, material );
          // add it to the WebGL scene
          // planeMesh.scale.multiplyScalar(150)
          planeMesh.name = "Banner 1"
          planeMesh.scale.set(160, 65, 0)
          // planeMesh.updateMatrix(); 
          // planeMesh.geometry.applyMatrix4( planeMesh.matrix );
          // planeMesh.matrix.identity();
          // planeMesh.scale.set( 1, 1, 1 );
          planeMesh.position.y = 148
          planeMesh.position.z = 8
          this.introduce(planeMesh)
          billGr1.add(planeMesh)
          l(planeMesh)
          // planeMesh.position.z = 10

          billGr1.position.x = 100
          billGr1.rotation.y = Math.PI / 2
          billGr1.scale.multiplyScalar(.5)
          billGr1.updateMatrixWorld()

          var targetPos = new THREE.Vector3(); 
          var targetRot = new THREE.Vector3(); 
          planeMesh.getWorldPosition( targetPos );
          // planeMesh.getWorldRotation( targetRot );
          l(targetPos, targetRot)
          const cssObject = new CSS3DObject(document.getElementById("bill1"))
          // cssObject.position.copy(planeMesh.position)
          cssObject.position.copy(targetPos)
          cssObject.position.x-= .25
          cssObject.rotation.copy(billGr1.rotation)
          cssObject.scale.multiplyScalar(.27*.5)
          // cssObject.updateMatrix(); 
          // cssObject.geometry.applyMatrix4( cssObject.matrix );
          // cssObject.matrix.identity();
          // cssObject.scale.set( 1, 1, 1 );
          // l(cssObject.scale)
          this.introduceCSS3D(cssObject)

        })
      })
      // gltf.load('assets/models/billboards/b2-mod/scene.glb', obj => { 
      //   // l(obj)
      //   const billboard2 = obj.scene 
      //   billboard2.name = "Billboard 2"
      //   // billboard2.position.z = 250
      //   billboard2.scale.multiplyScalar(20)
      //   // router.rotation.set(0, Math.PI / 2 + .2, 0)
      //   // router.position.set(-36.54, 27.6, -120)
      //   this.introduce(billboard2)
      // })

      // gltf.load('assets/models/billboards/b3/scene.gltf', obj => { 
      //   // l(obj)
      //   const billboard3 = obj.scene 
      //   billboard3.name = "Billboard 3"
      //   // billboard3.position.z = 250
      //   billboard3.scale.multiplyScalar(.75)
      //   // router.rotation.set(0, Math.PI / 2 + .2, 0)
      //   // router.position.set(-36.54, 27.6, -120)
      //   this.introduce(billboard3)
      // })

      // gltf.load('assets/models/billboards/b4/scene.gltf', obj => { 
      //   // l(obj)
      //   const billboard4 = obj.scene 
      //   billboard4.name = "Billboard 4"
      //   billboard4.position.x = 250
      //   billboard4.position.y = 150
      //   billboard4.scale.multiplyScalar(.5)
      //   // router.rotation.set(0, Math.PI / 2 + .2, 0)
      //   // router.position.set(-36.54, 27.6, -120)
      //   this.introduce(billboard4)
      // })
      
      // gltf.load('assets/models/billboards/b5/scene.gltf', obj => { 
      //   // l(obj)
      //   const billboard5 = obj.scene 
      //   billboard5.name = "Billboard 5"
      //   billboard5.position.x = -250
      //   // billboard4.position.y = 150
      //   billboard5.scale.multiplyScalar(20)
      //   // router.rotation.set(0, Math.PI / 2 + .2, 0)
      //   // router.position.set(-36.54, 27.6, -120)
      //   this.introduce(billboard5)
      // })
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
      // addCity()
      // Billboard
      // addBillboards()
      // Billboards roadside
      addBillboards2()
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
