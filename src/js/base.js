import {
  Scene,
  TextureLoader,
  WebGLRenderer,
  Clock,
  PerspectiveCamera,
  Vector3,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

export default class Base {
  constructor(
    settings = {
      controls: true,
      camera: { fov: 75, near: 0.1, far: 100, position: new Vector3(0) },
    }
  ) {
    this.controlsEnabled = settings.controls
    this.gui = new dat.GUI()
    this.canvas = document.querySelector('canvas.webgl')
    this.scene = new Scene()
    this.textureLoader = new TextureLoader()
    this.gltfLoader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.3.6/'
    )
    this.gltfLoader.setDRACOLoader(dracoLoader)

    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
    })
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.clock = new Clock()
    this.setCamera(settings.camera)
    this.setListeners()
    this.render()
  }

  setCamera(settings) {
    this.camera = new PerspectiveCamera(
      settings.fov,
      this.sizes.width / this.sizes.height,
      settings.near,
      settings.far
    )
    this.camera.position.copy(settings.position)
    this.scene.add(this.camera)

    // Controls
    if (this.controlsEnabled) {
      this.controls = new OrbitControls(this.camera, this.canvas)
      this.controls.enableDamping = true
    }
  }

  setListeners() {
    window.addEventListener('resize', () => {
      // Update sizes
      this.sizes.width = window.innerWidth
      this.sizes.height = window.innerHeight

      // Update camera
      this.camera.aspect = this.sizes.width / this.sizes.height
      this.camera.updateProjectionMatrix()

      // Update renderer
      this.renderer.setSize(this.sizes.width, this.sizes.height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })
  }

  tick() {}

  render() {
    this.delta = this.clock.getDelta()
    this.elapsedTime = this.clock.getElapsedTime()
    this.tick()
    if (this.controlsEnabled) {
      this.controls.update()
    }
    this.renderer.render(this.scene, this.camera)
    window.requestAnimationFrame(this.render.bind(this))
  }
}
