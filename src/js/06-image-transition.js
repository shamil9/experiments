import { Mesh, MeshBasicMaterial, PlaneBufferGeometry, Vector3 } from 'three'

import Base from './base'
import t1 from '@/assets/images/06-image-transition/01.jpg?url'

export default class ImageTransition extends Base {
  constructor() {
    super({
      controls: true,
      camera: { fov: 75, near: 1, far: 1000, position: new Vector3(0, 0, 650) },
    })

    this.width = 1920
    this.height = 1080
    this.init()
  }

  async init() {
    const map = await this.textureLoader.load(t1)
    const geometry = new PlaneBufferGeometry(1, 1)
    const material = new MeshBasicMaterial({
      map,
    })
    const mesh = new Mesh(geometry, material)
    mesh.scale.set(this.width, this.height, 1)
    this.scene.add(mesh)
  }
}

new ImageTransition()
