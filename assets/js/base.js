import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

export default class Base {
  constructor() {
    this.gui = new dat.GUI()
    this.canvas = document.querySelector('canvas.webgl')
    this.scene = new THREE.Scene()
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
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
    })
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.clock = new THREE.Clock()
    this.setCamera()
    this.setListeners()
    this.render()
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      100
    )
    this.camera.position.x = 1
    this.camera.position.y = 1
    this.camera.position.z = 2
    this.scene.add(this.camera)

    // Controls
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true
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
    this.elapsedTime = this.clock.getElapsedTime()
    this.tick()
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
    window.requestAnimationFrame(this.render.bind(this))
  }
}
