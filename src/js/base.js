import {
  Scene,
  TextureLoader,
  WebGLRenderer,
  Clock,
  PerspectiveCamera,
  Vector3,
  sRGBEncoding,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

export default class Base {
  constructor(params = {}) {
    const settings = {
      controls: true,
      camera: { fov: 75, near: 0.1, far: 100, position: new Vector3(0) },
      ...params,
    }
    this.settings = settings
    this.controlsEnabled = this.settings.controls
    this.gui = new dat.GUI()
    this.canvas = document.querySelector('canvas.webgl')
    this.scene = new Scene()
    this.textureLoader = new TextureLoader()
    this.gltfLoader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    this.gltfLoader.setDRACOLoader(dracoLoader)

    this.sizes = {
      width: this.canvas.offsetWidth,
      height: this.canvas.offsetHeight,
    }
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputEncoding = sRGBEncoding
    this.clock = new Clock()
    this.setCamera()
    this.setListeners()
    this.render()
  }

  setCamera() {
    this.camera = new PerspectiveCamera(
      this.settings.camera.fov,
      this.sizes.width / this.sizes.height,
      this.settings.camera.near,
      this.settings.camera.far
    )
    this.camera.position.copy(this.settings.camera.position)
    this.scene.add(this.camera)

    // Controls
    if (this.controlsEnabled) {
      this.controls = new OrbitControls(this.camera, this.canvas)
      this.controls.enableDamping = true
    }
  }

  calculateUnitSize(distance = this.camera.position.z) {
    const vFov = (this.camera.fov * Math.PI) / 180
    const height = 2 * Math.tan(vFov / 2) * distance
    const width = height * this.camera.aspect

    return {
      width,
      height,
    }
  }

  setListeners() {
    window.addEventListener('resize', () => {
      // Update sizes
      this.sizes.width = this.canvas.offsetWidth
      this.sizes.height = this.canvas.offsetHeight

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
