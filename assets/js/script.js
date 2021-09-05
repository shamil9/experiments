import * as THREE from "three"
import Base from './base'

import vertexShader from "../shaders/vertex.vert"
import fragmentShader from "../shaders/fragment.frag"

class Main extends Base {
	constructor() {
		super()
		this.geometry = new THREE.PlaneGeometry(1, 1, 32, 32)
		this.material = new THREE.ShaderMaterial({
		  vertexShader,
		  fragmentShader,
		  side: THREE.DoubleSide,
		  uniforms: {
		    uTime: { value: 0 },
		  },
		})
		this.mesh = new THREE.Mesh(this.geometry, this.material)
		this.scene.add(this.mesh)
	}

	tick() {
		console.log('tick')
	}
}

const main = new Main()
