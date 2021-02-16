/* tslint:disable:semicolon typedef use-lifecycle-interface one-variable-per-declaration no-shadowed-variable */
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
const posData = { x: 0, y: 0, z: 0, yRot : 0, scaleX: 1, scaleY: 1 };

@Component({
  selector: 'app-three-scene',
  templateUrl: './three-scene.component.html',
  styleUrls: ['./three-scene.component.scss']
})
export class ThreeSceneComponent implements OnInit {
  @ViewChild('rendererContainer') rendererContainer: ElementRef;
  mapOpts: any;
  controls: OrbitControls;
  controls2: OrbitControls;
  origin: THREE.Vector3;
  cameraStartPos: THREE.Vector3;
  cameraHelper: THREE.CameraHelper;
  axesHelper: THREE.AxesHelper;
  gridHelper: THREE.GridHelper;
  currentCamera: any;
  stats: any;
  mainCamera: any;
  spotLight1: THREE.DirectionalLight;
  lightPos1: THREE.Vector3;
  spotLightMesh1: THREE.Mesh<THREE.SphereBufferGeometry, THREE.MeshPhongMaterial>;
  mixer: THREE.AnimationMixer;
  mixer2: THREE.AnimationMixer;
  currentMesh: THREE.Object3D;

  clock = new THREE.Clock();
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene = new THREE.Scene();
  rendererCSS = new CSS3DRenderer();
  sceneCSS = new THREE.Scene();
  orbitCamera = null;
  camera = null;
  count = 0;
  cameraParentOuter: THREE.Mesh
  cameraParentInner: THREE.Mesh

  ngOnInit(): void {}

  constructor(private locationService: LocationService) {

    this.locationService.locationSet$.subscribe((location: Location) => {
      if (location.type === 'map') { this.showLocation(location) }
    });

    const w = window.innerWidth, h = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, w / h, 1, 800);
    this.camera.name = 'Main Camera';
    this.camera.position.z = 1000;
    this.cameraHelper = new THREE.CameraHelper(this.camera);
    this.cameraParentOuter = new THREE.Mesh(
      new THREE.SphereGeometry(355, 16, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0x0ff0f0, wireframe: true, 
        transparent: true, opacity: .8 
      })
    );
    this.cameraParentInner = new THREE.Mesh(
      new THREE.SphereGeometry(350, 16, 16), 
      new THREE.MeshStandardMaterial({ 
        color: 0xfff000, wireframe: true,
        transparent: true, opacity: .3
      })
    );

    this.origin = new THREE.Vector3(0, 0, 0);
    // this.cameraStartPos = new THREE.Vector3(0, 150, 200)
    this.cameraStartPos = new THREE.Vector3(0, 500, 0);
    this.axesHelper = new THREE.AxesHelper(500);
    (this.axesHelper.material as any).opacity = .5;
    (this.axesHelper.material as any).transparent = true;

    this.gridHelper = new THREE.GridHelper( 1000, 50 );
    (this.gridHelper.material as any).opacity = .3;
    (this.gridHelper.material as any).transparent = true;
    this.gridHelper.name = 'Grid Helper';

    this.orbitCamera = new THREE.PerspectiveCamera(45, w / h, 1, 5000);
    // this.controls2 = new OrbitControls(this.orbitCamera, this.rendererCSS.domElement);
    this.initMapControls();    
    this.currentCamera = this.orbitCamera;
    (window as any).currentCamera = this.currentCamera

    this.spotLight1 = new THREE.DirectionalLight(0xffffff, 1);

    this.lightPos1 = new THREE.Vector3(-500, 150, 0);
    this.spotLightMesh1 = new THREE.Mesh(
      new THREE.SphereBufferGeometry(5, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2),
      new THREE.MeshPhongMaterial({ color: 0xffff00 })
    );

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
    this.stats.showPanel(-1);
    
    // this.enableInspector();
  }

  enableInspector(){
    // For THREE Inspector
    (window as any).THREE = THREE;
    (window as any).scene = this.scene;
    (window as any).cameraParentOuter = this.cameraParentOuter
  }

  ngAfterViewInit() { this.init() }

  init(){
    let show = false;
    // Initialize the scene
    this.initScene();
    // Uncomment below 2 lines for testing
    show = true;
    this.initGUI();
    this.toggleHelpers(show);
    this.addListeners();
    this.resize();
    this.addObjects()
  }

  initScene(){
    const {
      scene, renderer, sceneCSS, rendererCSS,
      rendererContainer, origin, camera,
      orbitCamera, cameraStartPos, cameraParentInner, cameraParentOuter,
      spotLightMesh1, spotLight1, lightPos1
    } = this;

    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = 'canvas-webGL';
    rendererContainer.nativeElement.appendChild(renderer.domElement);

    rendererCSS.domElement.className = 'canvas-css3D';
    rendererContainer.nativeElement.appendChild(rendererCSS.domElement);

    orbitCamera.position.copy(cameraStartPos);
    orbitCamera.lookAt(origin);
    scene.add(orbitCamera);

    // Spotlight and representational mesh
    spotLightMesh1.position.copy(lightPos1);
    spotLight1.position.copy(lightPos1);
    scene.add(
      spotLight1,
      spotLightMesh1
    );

    scene.add(new THREE.AmbientLight(0xffffff, .5))
    // scene.fog = new THREE.Fog(0xffffff, 500, 1200)


    cameraParentInner.add(camera);
    // camera.position.set(200, 150, 200);
    camera.position.set(0, 350, 0);
    camera.lookAt(origin);

    cameraParentInner.rotation.y = Math.PI
    cameraParentInner.rotation.x = -Math.PI/4
    cameraParentOuter.add(cameraParentInner)
    
    cameraParentOuter.position.y = 50
    cameraParentOuter.rotation.y = Math.PI/2
    
    scene.add(cameraParentOuter)
  }

  initGUI(){
    const gui = new dat.GUI()
    // , { currentMesh } = this
    , params =  {
      helpers: true
      , orbitCamera() { }
      , mainCamera() { }
      , getState() { l(this, posData) }
    };

    gui.add(params, 'helpers').onChange(value => this.toggleHelpers(value));
    gui.add(params, 'orbitCamera').onChange(() => { this.currentCamera = this.orbitCamera });
    gui.add(params, 'mainCamera').onChange(() => { this.currentCamera = this.camera });

    const folder = gui.addFolder('Current Mesh');
    folder.add(posData, 'scaleX', -200, 200, .1).onChange(() => this.updateMesh()).listen();
    folder.add(posData, 'scaleY', -200, 200, .1).onChange(() => this.updateMesh()).listen();
    folder.add(posData, 'x', -500, 500, .1).onChange(() => this.updateMesh()).listen();
    folder.add(posData, 'y', -500, 500, .1).onChange(() => this.updateMesh()).listen();
    folder.add(posData, 'z', -500, 500, .1).onChange(() => this.updateMesh()).listen();
    folder.add(posData, 'yRot', -Math.PI, Math.PI, .01).onChange(() => this.updateMesh()).listen();
    // folder.open();

    gui.add(params, 'getState')
  }

  toggleHelpers(val) {
    const {
      scene, gridHelper, axesHelper,
      cameraHelper, stats
    } = this;
    if (val){
      scene.add(gridHelper);
      scene.add(axesHelper);
      scene.add(cameraHelper);
      stats.showPanel(0)
      this.cameraParentOuter.visible = true
    } else{
      scene.remove(gridHelper);
      scene.remove(axesHelper);
      scene.remove(cameraHelper);
      stats.showPanel(-1)
      this.cameraParentOuter.visible = false
    }
  }

  initMapControls(){
    this.controls = new OrbitControls(this.orbitCamera, this.renderer.domElement);
    this.mapOpts = {
      toggleControls: true,
      rotateScene: false,
      greyScale: false,
      isFS: false
    }
    const changeHandler = () => { this.mapOpts.isFS = !this.mapOpts.isFS }
    document.addEventListener('fullscreenchange', changeHandler, false)
    document.addEventListener('mozfullscreenchange', changeHandler, false)
    document.addEventListener('MSFullscreenChange', changeHandler, false)
    document.addEventListener('webkitfullscreenchange', changeHandler, false)
  }
  
  toggleFullscreen(type){
    const elem = this.rendererContainer.nativeElement    
    if(type === "open"){
      if (elem.requestFullscreen) { elem.requestFullscreen() } 
      else if (elem.msRequestFullscreen) { elem.msRequestFullscreen() } 
      else if (elem.mozRequestFullScreen) { elem.mozRequestFullScreen() } 
      else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen() }
    } else{
      if (document.exitFullscreen) { document.exitFullscreen() } 
      else if ((document as any).webkitExitFullscreen) { (document as any).webkitExitFullscreen() }
      else if ((document as any).mozCancelFullScreen) { (document as any).mozCancelFullScreen() } 
      else if ((document as any).msExitFullscreen) { (document as any).msExitFullscreen() }
    }
  }

  adjustCamera(type, subtype){
    const { camera, cameraParentInner, cameraParentOuter } = this
    switch(type){
      case 'rotate':
        gsap.to(cameraParentOuter.rotation, { duration: .5, y: subtype === "right"?"+=.2":"-=.2"})
        break;
      case 'zoom':
        let { zoom } = camera 
        gsap.to(camera, { 
          duration: .5, 
          zoom: subtype === "in" ? "+=.2" : ( zoom > 1 ? "-=.2" : 1),
          onUpdate: function () {
            camera.updateProjectionMatrix();
          }
        })
        break;
      default: // position
        switch(subtype){
          case 'NORTH': 
            gsap.to(cameraParentOuter.rotation, { duration: .5, y: Math.PI })
            gsap.to(cameraParentInner.rotation, { duration: .5, x: -Math.PI/4 })
            break;
          case 'EAST': 
            gsap.to(cameraParentOuter.rotation, { duration: .5, y: Math.PI * 1.5 })
            gsap.to(cameraParentInner.rotation, { duration: .5, x: -Math.PI/4 })
            break;
          case 'SOUTH': 
            gsap.to(cameraParentOuter.rotation, { duration: .5, y: Math.PI * 2 })
            gsap.to(cameraParentInner.rotation, { duration: .5, x: -Math.PI/4 })
            break;
          case 'WEST': 
            gsap.to(cameraParentOuter.rotation, { duration: .5, y: Math.PI * .5 })
            gsap.to(cameraParentInner.rotation, { duration: .5, x: -Math.PI/4 })
            break;
          default: // TOP
            gsap.to(cameraParentOuter.rotation, { duration: .5, y: 0 })
            gsap.to(cameraParentInner.rotation, { duration: .5, x: 0 })
            break;
        }
        break;
    }
  }

  addListeners(){
    gsap.ticker.add(this.render.bind(this));
    window.addEventListener('resize', this.resize.bind(this), false)
  }

  resize(){
    const {
      rendererContainer, renderer,
      rendererCSS, camera, orbitCamera
    } = this
    , el =  rendererContainer.nativeElement
    , w = el.clientWidth
    , h = el.clientHeight;

    renderer.setSize(w, h);
    rendererCSS.setSize(w, h);

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    orbitCamera.aspect = w / h;
    orbitCamera.updateProjectionMatrix()
  }

  render() {
    const {
      renderer, rendererCSS, mapOpts,
      stats, scene, sceneCSS, cameraParentOuter,
      currentCamera, mixer, mixer2, clock
    } = this;

    try{
      stats.begin();

      // monitored code goes here
      renderer.render(scene, currentCamera);
      rendererCSS.render(sceneCSS, currentCamera);

      if (mixer) { mixer.update(clock.getDelta()) }
      if (mixer2) { mixer2.update(clock.getDelta()) }
      mapOpts.rotateScene && (cameraParentOuter.rotation.y+= .001)

      stats.end()
    } catch (err){
      l(err);
      gsap.ticker.remove(this.render.bind(this))
    }
  }

  introduce(obj){
    const { scene } = this, total = 6;
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
    if (materialOptions) {
      const { wrapping, repeat, minFilter } = materialOptions;
      material.map.wrapS = material.map.wrapT = wrapping;
      material.map.repeat = repeat;
      material.map.minFilter = minFilter
    }

    return new THREE.Mesh(geometry, material)
  }

  updateMesh(){
    // l(this.currentMesh, posData)
    this.currentMesh.position.set(posData.x, posData.y, posData.z);
    this.currentMesh.scale.set(posData.scaleX, posData.scaleY, 1);
    this.currentMesh.rotation.set(0, posData.yRot, 0)
  }

  setCurrentMesh(gr){
    this.currentMesh = gr;

    posData.x = gr.position.x;
    posData.y = gr.position.y;
    posData.z = gr.position.z;
    posData.scaleX = gr.scale.x;
    posData.scaleY = gr.scale.y;
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
      // const geometry = new THREE.BoxGeometry(50, 50, 50);
      // const material = new THREE.MeshNormalMaterial();
      const geometry = new THREE.BoxGeometry(50, 50, 50);
      const material = new THREE.MeshBasicMaterial({
        // map: gif.load('assets/gifs/buildings/building2.gif'),
        wireframe: true, color: 0xff0000,
        transparent: true
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = -100;
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
        );
        scene.add(bg);
        bg.position.y = 70
        bg.rotation.y = Math.PI - .65
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
        );

        // floor.receiveShadow = true
        floor.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
        floor.name = 'Floor';

        this.introduce(floor)
      });

      mtl.load('assets/models/city/city.mtl', materials => {
        materials.preload();
        obj.setMaterials(materials)
        .load('assets/models/city/city.obj', city => {
          city.name = 'City';
          city.scale.multiplyScalar(150);
          city.traverse(child => {
            if ((child as any).isMesh){
              // child.castShadow = true;
              (child as any).material.shininess = 0
            }
          });
          this.introduce(city)
        })
      })
    }
    , createBuildingAd = ({ name, plane, css }) => {
      // l(name, plane, css)
      // Group to move ad mesh
      const builGr = new THREE.Group();
      this.introduce(builGr);
      builGr.name = name;

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
      );
      adMesh.name = 'Plane';
      builGr.add(adMesh);

      const { scale, pos, rot } = plane;

      // Set scale to fit ad gif
      builGr.scale.set(scale[0], scale[1], scale[2]);
      // transforms for the group
      builGr.position.set(pos[0], pos[1], pos[2]);
      builGr.rotation.set(rot[0], rot[1], rot[2]);
      builGr.updateMatrixWorld();

      // Get world coordinates of the ad mesh
      const targetPos = new THREE.Vector3();
      adMesh.getWorldPosition(targetPos);

      // Add ad gif to CSS3D scene
      const { id, scale: sc, offset } = css;
      const cssObject = new CSS3DObject(document.getElementById(id));
      this.introduceCSS3D(cssObject);

      // Copy world coordinates of the ad mesh to the ad gif
      cssObject.position.copy(targetPos);
      if (offset){
        cssObject.position.x += offset[0];
        cssObject.position.y += offset[1];
        cssObject.position.z += offset[2]
      }
      cssObject.rotation.copy(builGr.rotation);
      // To fit into the ad mesh
      cssObject.scale.multiplyScalar(sc);

      // l(builGr);
      return builGr
    }
    , addBuildingAds = () => {
      const gr = createBuildingAd({
        name: 'Building Ad Group 1 (McDonalds)',
        plane: { scale: [16.7, 62, 0], pos: [60, 56, 60], rot: [0, 0, 0] },
        css: { scale: .12, offset: [0, 5, 0], id: 'buil1' }
      })
      , gr2 = createBuildingAd({
        name: 'Building Ad Group 2 (Coke)',
        plane: { scale: [17.1, 17.2, 0], pos: [-50, 33, 124], rot: [0, 0, 0] },
        css: { scale: .07, id: 'buil2' }
      })
      , gr3 = createBuildingAd({
        name: 'Building Ad Group 3 (KFC)',
        plane: { scale: [17.1, 12.4, 0], pos: [50, 32, 113.5], rot: [0, 0, 0] },
        css: { scale: .05, id: 'buil3' }
      })
      , gr4 = createBuildingAd({
        name: 'Building Ad Group 4 (ArcBlue)',
        plane: { scale: [14.3, 13.1, 0], pos: [131.4, 17., 102.9], rot: [0, Math.PI / 2, 0] },
        css: { scale: .05, id: 'buil4' }
      })
      , gr5 = createBuildingAd({
        name: 'Building Ad Group 5 (Nation Hospice Month)',
        plane: { scale: [16, 65.4, 0], pos: [69.1, 48.9, 50.8], rot: [0, Math.PI / 2, 0] },
        css: { scale: .07, id: 'buil5' }
      })
      , gr6 = createBuildingAd({
        name: 'Building Ad Group 6 (BudLight)',
        plane: { scale: [17.1, 26.8, 0], pos: [-119, 33.8, 61.8], rot: [0, -Math.PI / 2, 0] },
        css: { scale: .07, id: 'buil6' }
      })
      , gr7 = createBuildingAd({
        name: 'Building Ad Group 7 (BAR DIY)',
        plane: { scale: [16.9, 84.1, 0], pos: [70.5, 44.5, -47.4], rot: [0, Math.PI / 2, 0] },
        css: { scale: .14, id: 'buil7' }
      })
      , gr8 = createBuildingAd({
        name: 'Building Ad Group 8 (Placetech)',
        plane: { scale: [16.6, 61.5, 0], pos: [52.6, 33, -67.4], rot: [0, Math.PI, 0] },
        css: { scale: .14, offset: [0, 2, 0], id: 'buil8' }
      })
      , gr9 = createBuildingAd({
        name: 'Building Ad Group 9 (Sale Generic)',
        plane: { scale: [25.5, 56.8, 0], pos: [2.2, 55, -69.1], rot: [0, Math.PI, 0] },
        css: { scale: .05, id: 'buil9' }
      })
      , gr10 = createBuildingAd({
        name: 'Building Ad Group 10 (Spotify)',
        plane: { scale: [16.3, 37.3, 0], pos: [-52, 45.8, -57.4], rot: [0, Math.PI, 0] },
        css: { scale: .04, offset: [0, -2, 0], id: 'buil10' }
      })
      , gr11 = createBuildingAd({
        name: 'Building Ad Group 11 (Lobster)',
        plane: { scale: [15.5, 59.8, 0], pos: [-70.2, 33.6, -5.4], rot: [0, -Math.PI / 2, 0] },
        css: { scale: .16, offset: [0, -2, 0], id: 'buil11' }
      })
      , gr12 = createBuildingAd({
        name: 'Building Ad Group 12 (Adidas)',
        plane: { scale: [16.5, 26.9, 0], pos: [-131.7, 34.8, -59], rot: [0, -Math.PI / 2, 0] },
        css: { scale: .07, id: 'buil12' }
      })
      , gr13 = createBuildingAd({
        name: 'Building Ad Group 13 (Knee)',
        plane: { scale: [15, 58.4, 0], pos: [-1.1, 36.9, 69.6], rot: [0, 0, 0] },
        css: { scale: .12, id: 'buil13' }
      })
      , gr14 = createBuildingAd({
        name: 'Building Ad Group 14 (Job)',
        plane: { scale: [16, 61.2, 0], pos: [-247.4, 51.8, -181.8], rot: [0, Math.PI / 2, 0] },
        css: { scale: .12, id: 'buil14' }
      })
      , gr15 = createBuildingAd({
        name: 'Building Ad Group 15 (Playforce)',
        plane: { scale: [16.8, 58.9, 0], pos: [207.4, 32.8, 259.5], rot: [0, -Math.PI / 2, 0] },
        css: { scale: .07, id: 'buil15' }
      })

      // this.setCurrentMesh(gr15)
    }
    , createBillBoard = ({ name, billboard, plane, css, scaleFactor }) => {
      // l(name, billboard, plane, css, scaleFactor)
      // Group to move billboard and ad mesh together
      const billGr = new THREE.Group();
      this.introduce(billGr);
      billGr.name = name;
      billGr.add(billboard.mesh);

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
      );
      adMesh.name = 'Plane';
      billGr.add(adMesh);

      const { scale: sc, pos: ps } = plane;
      // Set scale to fit ad gif
      adMesh.scale.set(sc[0], sc[1], sc[2]);
      // Set position relative to billboard model
      adMesh.position.set(ps[0], ps[1], ps[2]);

      // transforms for the group
      const { pos, rot } = billboard;
      billGr.position.set(pos[0], pos[1], pos[2]);
      billGr.rotation.set(rot[0], rot[1], rot[2]);
      billGr.scale.multiplyScalar(scaleFactor);
      billGr.updateMatrixWorld();

      // Get world coordinates of the ad mesh
      const targetPos = new THREE.Vector3();
      adMesh.getWorldPosition(targetPos);

      // Add ad gif to CSS3D scene
      const { id, scale, offset } = css;
      const cssObject = new CSS3DObject(document.getElementById(id));
      this.introduceCSS3D(cssObject);

      // Copy world coordinates of the ad mesh to the ad gif
      cssObject.position.copy(targetPos);
      if (offset){
        cssObject.position.x += offset[0];
        cssObject.position.y += offset[1];
        cssObject.position.z += offset[2]
      }
      cssObject.rotation.copy(billGr.rotation);
      // To fit into the ad mesh
      cssObject.scale.multiplyScalar(scale);
      // To scale with the billboard group
      cssObject.scale.multiplyScalar(scaleFactor);

      // l(billGr);
      return billGr
    }
    , addBillboards = () => {

      mtl.load('assets/models/billboards/b1/untitled.mtl', materials => {
        materials.preload();
        new OBJLoader().setMaterials(materials)
        .load('assets/models/billboards/b1/untitled.obj', object => {
          // Billboard model - normalize size, scale down later
          const bb = object;
          bb.name = 'Billboard';
          bb.scale.multiplyScalar(20);
          bb.rotation.y = Math.PI;

          const gr = createBillBoard({
            name: 'Billboard Group 1 (Adidas)',
            billboard: { mesh: bb, pos: [-137, 0, -30], rot: [0, -.57, 0] },
            plane: { scale: [160, 65, 0], pos: [0, 148, 8] },
            css: { scale: .27, id: 'bill1' }, scaleFactor: .2
          })
          , gr2 = createBillBoard({
            name: 'Billboard Group 4 (Converse)',
            billboard: { mesh: bb.clone(), pos: [-90, 0, 137], rot: [0, -.36, 0] },
            plane: { scale: [129, 65, 0], pos: [0, 148, 8] },
            css: { scale: .27, offset: [-.15, 0, 0], id: 'bill4' }, scaleFactor: .3
          })
          , gr3 = createBillBoard({
            name: 'Billboard Group 6 (Nike)',
            billboard: { mesh: bb.clone(), pos: [159, 0, 0], rot: [0, 2.63, 0] },
            plane: { scale: [129, 65, 0], pos: [0, 148, 8] },
            css: { scale: .28, offset: [-.15, 0, 0], id: 'bill6' }, scaleFactor: .3
          })
          , gr4 = createBillBoard({
            name: 'Billboard Group 7 (KFC)',
            billboard: { mesh: bb.clone(), pos: [-33, 0, -177], rot: [0, 1.2, 0] },
            plane: { scale: [129, 65, 0], pos: [0, 148, 8] },
            css: { scale: .28, offset: [-.15, 0, 0], id: 'bill7' }, scaleFactor: .25
          })

        })
      });

      // Double Sided billboard
      gltf.load('assets/models/billboards/b2/scene.glb', obj => {
        // Billboard model - normalize size, scale down later
        const bb = obj.scene;
        bb.name = 'Billboard';
        bb.scale.multiplyScalar(10);
        bb.rotation.y = - Math.PI / 2;

        const gr = createBillBoard({
          name: 'Billboard Group 2 (Nike)',
          billboard: { mesh: bb, pos: [166, 0, -150], rot: [0, -.63, 0] },
          plane: { scale: [75, 44, 0], pos: [0, 100, 2] },
          css: { scale: .05, id: 'bill2' }, scaleFactor: .5
        })
        , gr2 = createBillBoard({
          name: 'Billboard Group 3 (Coca Cola)',
          billboard: { mesh: bb.clone(), pos: [-86, 0, -130], rot: [0, 1.82, 0] },
          plane: { scale: [80, 42, 0], pos: [0, 100, 2] },
          css: { scale: .2, offset: [0, -4.8, 0], id: 'bill3' }, scaleFactor: .5
        })
        , gr3 = createBillBoard({
          name: 'Billboard Group 5 (North Face)',
          billboard: { mesh: bb.clone(), pos: [152, 0, 127], rot: [0, .52, 0] },
          plane: { scale: [80, 42, 0], pos: [0, 100, 2] },
          css: { scale: .14, id: 'bill5' }, scaleFactor: .65
        })
      });

      // Auto animated billboard
      gltf.load('assets/models/billboards/b3/scene.gltf', obj => {
        const bb = obj.scene;
        bb.name = 'Billboard Animated';
        bb.scale.multiplyScalar(.08);
        bb.position.set(38, 65, 200);
        bb.rotation.set(0, -2.34, 0);
        this.introduce(bb);

        this.mixer = new THREE.AnimationMixer(bb);
        // Play a specific animation
        const clips = obj.animations
        , clip = THREE.AnimationClip.findByName(clips, 'Take 001' )
        , action = this.mixer.clipAction(clip);
        action.play();

        // Second billboard
        const bb2 = bb.clone();
        bb2.name = 'Billboard Animated 2';
        bb2.position.set(-181, 65, -168);
        bb2.rotation.set(0, -.8, 0);
        this.introduce(bb2);

        this.mixer2 = new THREE.AnimationMixer(bb2);
        const clips2 = obj.animations
        , clip2 = THREE.AnimationClip.findByName(clips2, 'Take 001' )
        , action2 = this.mixer2.clipAction(clip2);
        action2.play()
      });

      mtl.load('assets/models/billboards/b4/untitled.mtl', materials => {
        materials.preload();
        new OBJLoader().setMaterials(materials)
        .load('assets/models/billboards/b4/untitled.obj', object => {
          // Billboard model - normalize size, scale down later
          const bb = object;
          bb.name = 'Billboard';
          bb.scale.multiplyScalar(20);
          bb.rotation.y = Math.PI;

          const gr = createBillBoard({
            name: 'Billboard Group 8 (Adidas)',
            billboard: { mesh: bb, pos: [202, 0, 83], rot: [0, -2.88, 0] },
            plane: { scale: [143, 108, 0], pos: [0, 167.5, 8] },
            css: { scale: .18, id: 'bill8' }, scaleFactor: .25
          })
          , gr2 = createBillBoard({
            name: 'Billboard Group 9 (Zeta Office)',
            billboard: { mesh: bb.clone(), pos: [-188, 0, 28], rot: [0, 2.92, 0] },
            plane: { scale: [109, 107, 0], pos: [0, 167.5, 8] },
            css: { scale: .17, id: 'bill9' }, scaleFactor: .3
          })
        })
      })

    }

    mgr.onError = url => { l('There was an error loading ' + url) };
    mgr.onLoad = () => { l('All models loaded') };

    (() => {
      // // Mesh for test
      // addMesh();
      // Background
      addBg();
      // City
      addCity();
      // Building ads
      addBuildingAds();
      // Billboards
      addBillboards();
    })()
  }

  showLocation(location){
    // l(location, "From service")
    this.currentCamera = this.camera;
    gsap.to(this.currentCamera.position, {
      duration: 1,
      x: location.camPos[0],
      y: location.camPos[1],
      z: location.camPos[2],
      onUpdate: () => {
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
