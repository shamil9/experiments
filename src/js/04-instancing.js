import Base from './base'
import { gsap } from 'gsap'
import * as THREE from "three"


class Main extends Base {
	constructor() {
		super()
    this.count = 30
    this.currentOjb = 0
    this.camera.position.y = 10
    this.camera.position.z = 10
    this.isMoving = false
    this.previousPosition = new THREE.Vector3(0)
    this.tls = []
    this.initRaycaster()
    this.initObjects()
    this.addPlane()
	}

  addPlane() {
    const geometry = new THREE.PlaneBufferGeometry(20, 10)
    const material = new THREE.MeshBasicMaterial({
      color: 'white',
      side: THREE.DoubleSide
    })
    this.plane = new THREE.Mesh(geometry, material)
    this.plane.name = 'plane'
    this.plane.rotateX(Math.PI / 2)
    this.scene.add(this.plane)
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
  }

  initObjects() {
    this.defaultMatrix = new THREE.Matrix4()
    const geometry = new THREE.SphereGeometry(0.3, 7, 7)
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000
    })
    this.instance = new THREE.InstancedMesh(geometry, material, this.count)
    this.instance.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.scene.add(this.instance)
  }

  onMouseMove( event ) {
    this.isMoving = true
    this.currentOjb += 1

    if (this.currentOjb >= this.count) {
      this.currentOjb = 0
    }
    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  }

  animation(position, index) {
    const matrix = new THREE.Matrix4()
    const scale = [1]
    const tl = gsap.timeline({
      onUpdate: () => {
        matrix.makeScale(scale, scale, scale)
        matrix.setPosition(position)
        this.instance.setMatrixAt(index, matrix)
      },
      onComplete: () => {
        tl.kill()
      }
    })

    tl.to(position, {
      duration: 1,
      x: index % 2 ? '+=0.5': '-=0.5',
      y: '+=2',
    })
    .to(scale, {
      duration: 1,
      '0': 0,
    }, 0)
  }

	tick() {
    if (!this.raycaster || !this.instance) {
      return
    }

    this.raycaster.setFromCamera( this.mouse, this.camera );

    const intersects = this.raycaster.intersectObjects( this.scene.children );
    const [item] = intersects

    if (intersects.length && item && item.object.name === 'plane' && this.previousPosition.length() !== item.point.length()) {
      this.defaultMatrix.setPosition(item.point)
      this.instance.setMatrixAt(this.currentOjb, this.defaultMatrix)
      this.animation(item.point, this.currentOjb)
      this.previousPosition = item.point.clone()
    }

    this.instance.instanceMatrix.needsUpdate = true;
	}
}

const main = new Main()
