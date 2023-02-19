import {
  HemisphereLight,
  DirectionalLight,
  AmbientLight,
  MeshStandardMaterial,
  Vector3,
} from 'three'
import { gsap } from 'gsap'

import Base from './base'
import text from '@/assets/models/v.glb?url'

export default class ExplodingText extends Base {
  constructor() {
    super({
      controls: true,
      camera: { fov: 75, near: 1, far: 1000, position: new Vector3(0, 0, 40) },
    })

    this.init()
  }

  async init() {
    const model = await this.gltfLoader.loadAsync(text)
    const random = gsap.utils.random
    this.renderer.setClearColor('#eee')
    this.model = model.scene.clone()
    this.model.scale.setScalar(30)
    this.model.rotation.y = Math.PI / -2
    this.model.position.x = -5
    this.model.position.y = -10

    this.model.traverse((obj) => {
      if (obj.isMesh) {
        obj.userData.position = obj.position.clone()
        obj.rotation.set(random(-5, 5), random(-5, 5), random(-5, 5))
        obj.position.set(0, random(-10, 10), random(0, 10))
        obj.material = new MeshStandardMaterial({
          flatShading: true,
          color: '#3E54AC',
        })
      }
    })
    this.scene.add(this.model)

    const light = new HemisphereLight('white', 'darkslategrey', 2)
    this.scene.add(light)
    // const ambientLight = new AmbientLight('white', 1)

    // const mainLight = new DirectionalLight('white', 1)
    // mainLight.position.set(10, 10, 10)
    // this.scene.add(ambientLight)
    // this.scene.add(mainLight)

    const tl = gsap.timeline()

    this.model.traverse((obj) => {
      if (!obj.userData.position) {
        return
      }

      const duration = 4
      const ease = 'power4.out'
      tl.to(
        obj.position,
        {
          duration,
          x: obj.userData.position.x,
          y: obj.userData.position.y,
          z: obj.userData.position.z,
          ease,
        },
        '0'
      )
      tl.to(
        obj.rotation,
        {
          duration,
          x: 0,
          y: 0,
          z: 0,
          ease,
        },
        '0'
      )
    })

    document.body.classList.remove('loading')
  }

  tick() {
    this.model && (this.model.rotation.y += 0.001)
  }
}

new ExplodingText()
