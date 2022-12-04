import Base from './base'
import {
  BoxBufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Scene,
  WebGLRenderTarget,
} from 'three'

class Main extends Base {
  constructor() {
    super()
    this.texture = new WebGLRenderTarget(this.sizes.width, this.sizes.height)
    this.fboScene = new Scene()
    this.fboBox = new BoxBufferGeometry(2, 2, 2)
    this.fboMaterial = new MeshBasicMaterial({
      color: 'red',
    })
    this.fboMesh = new Mesh(this.fboBox, this.fboMaterial)
    this.fboScene.add(this.fboMesh)
    this.renderer.render(this.fboScene, this.camera, this.texture)

    this.box = new BoxBufferGeometry(2, 2, 2)
    this.material = new MeshBasicMaterial({
      map: this.texture.texture,
      // color: 'red',
      wireframe: true,
    })
    this.mesh = new Mesh(this.box, this.material)
    setTimeout(() => {
      this.scene.add(this.mesh)
    }, 1000)
  }

  tick() {
    if (this.texture) {
      this.renderer.render(this.fboScene, this.camera, this.texture)
    }
  }
}

const main = new Main()
