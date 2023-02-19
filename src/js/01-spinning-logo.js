import Base from './base'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js'
import { LayerMaterial, Depth } from 'lamina/vanilla'

import logo from '../assets/models/epic-logo.glb?url'

class Main extends Base {
  constructor() {
    super({ controls: true })
    this.renderer.setClearColor(new THREE.Color('#F2EFE5'))
    this.gltfLoader.load(logo, (data) => {
      this.logo = data.scene.children[0]
      this.logo.traverse((obj) => {
        if (obj.material) {
          this.material = new LayerMaterial({
            lighting: 'physical',
            transmission: 1,
            layers: [
              new Depth({
                colorA: '#ff0080',
                colorB: 'black',
                alpha: 1,
                mode: 'normal',
                near: 0.2,
                far: 0.8,
                origin: new THREE.Vector3(0, 0, 0),
              }),
              new Depth({
                colorA: 'blue',
                colorB: 'cyan',
                alpha: 1,
                mode: 'add',
                near: 1.5,
                far: 2.5,
                origin: new THREE.Vector3(0, 1, 1),
              }),
              new Depth({
                colorA: 'green',
                colorB: '#f7b955',
                alpha: 1,
                mode: 'add',
                near: 3.5,
                far: 4.5,
                origin: new THREE.Vector3(0, 1, -1),
              }),
            ],
          })
          obj.material = this.material
        }
      })
      this.scene.add(this.logo)
      this.addComposer()
    })

    this.camera.position.set(0, -0.5, -2)
  }

  addComposer() {
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    const afterimagePass = new AfterimagePass()
    afterimagePass.uniforms.damp.value = 0.98
    this.composer.addPass(afterimagePass)
  }

  tick() {
    if (this.logo) {
      this.logo.rotation.y += (Math.PI / 2) * this.delta * 0.5
      const sin = Math.sin(this.clock.elapsedTime / 2)
      const cos = Math.cos(this.clock.elapsedTime / 2)
      this.material.layers[0].origin.set(cos / 2, 0, 0)
      this.material.layers[1].origin.set(cos, sin, cos)
      this.material.layers[2].origin.set(sin, cos, sin)
    }

    if (this.composer) {
      this.composer.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }
}

const main = new Main()
