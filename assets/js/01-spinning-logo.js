import Base from './base'
import * as THREE from "three"

import logo from "../models/epic-logo.glb?url"

class Main extends Base {
  constructor() {
    super()
    this.gltfLoader.load(logo, data => {
      this.logo = data.scene
      this.logo.traverse(obj => {
        if (obj.material) {
          const material = new THREE.MeshBasicMaterial()
          material.color.set(0xBC994E)
          obj.material = material
        }
      })
      this.scene.add(this.logo)
    })
  }

  tick() {
    if (this.logo) {
      this.logo.rotation.y += Math.PI / 2 * 0.01
    }
  }
}

const main = new Main()
