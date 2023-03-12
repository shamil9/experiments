import * as THREE from 'three'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'

import logo from '../assets/models/epic-hollow-logo.glb?url'
import Base from './base'

gsap.registerPlugin(Observer)

class Refraction extends Base {
  constructor() {
    super({ controls: false })

    this.camera.position.z = 3.5
    this.newCameraPos = new THREE.Vector3().copy(this.camera.position)

    this.addLights()

    this.gltfLoader.load(logo, (data) => {
      this.logo = data.scene.children[0]
      this.logo.material = new THREE.MeshPhysicalMaterial({
        transmission: 1,
        thickness: 2,
        transparent: true,
        roughness: 0,
        // wireframe: true,
        side: THREE.DoubleSide,
      })
      // this.logo.material = new THREE.MeshBasicMaterial({
      //   color: 'cyan',
      //   side: THREE.DoubleSide,
      // })

      this.logo.scale.setScalar(80)
      this.logo.position.z = 1
      this.scene.add(this.logo)

      this.initObserver()

      this.isReady = true
      document.body.classList.remove('loading')
    })
  }

  createLight(color) {
    const light = new THREE.PointLight(color, 100)
    this.lights.push(light)
    this.scene.add(light)
  }

  addLights() {
    this.lights = []
    const lights = [0x3a1078, 0x4e31aa, 0x2f58cd, 0x3795bd]
    lights.forEach((color) => this.createLight(color))
  }

  initObserver() {
    const x = gsap.utils.mapRange(
      0,
      window.innerWidth,
      this.camera.position.x + 1,
      this.camera.position.x - 1
    )
    const y = gsap.utils.mapRange(
      0,
      window.innerHeight,
      this.camera.position.y - 1,
      this.camera.position.y + 1
    )
    Observer.create({
      target: window,
      onMove: (observer) => {
        this.newCameraPos.x = x(observer.x)
        this.newCameraPos.y = y(observer.y)
      },
    })
  }

  tick() {
    if (!this.isReady) {
      return
    }
    this.camera.position.lerp(this.newCameraPos, this.delta * 1.5)
    this.camera.lookAt(this.logo.position)
    this.lights.forEach((light, index) => {
      light.position.x = Math.sin(this.elapsedTime * 0.7 + index)
      light.position.y = Math.cos(this.elapsedTime * 0.5 + index)
      light.position.z = Math.sin(this.elapsedTime * 0.3 + index)
    })
  }
}

new Refraction()
