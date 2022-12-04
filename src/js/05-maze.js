import Base from './base'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import CannonDebugRenderer from './cannonDebugRenderer'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'

import maze from '../models/maze.glb?url'

gsap.registerPlugin(Observer)

class Main extends Base {
  constructor() {
    super()
    this.controlsEnabled = false
    this.hasLoaded = false
    this.world = new CANNON.World()
    this.rotationVec = new THREE.Vector3(0, 0, 0)
    this.world.gravity.set(0, -20, 0)
    // this.world.quatNormalizeSkip = 0
    // this.world.quatNormalizeFast = true
    // this.world.defaultContactMaterial.contactEquationStiffness = 1e9
    // this.world.defaultContactMaterial.contactEquationRelaxation = 4
    this.world.solver.iterations = 20
    // const solver = new CANNON.GSSolver()
    // solver.iterations = 1000
    // solver.tolerance = 0.01
    // this.world.solver = new CANNON.SplitSolver(solver)
    this.group = new THREE.Group()
    this.cannonDebugRenderer = new CannonDebugRenderer(this.scene, this.world)

    this.quatX = new CANNON.Quaternion()
    this.quatZ = new CANNON.Quaternion()
    this.quatXMaze = new CANNON.Quaternion()
    this.quatZMaze = new CANNON.Quaternion()

    const physicsFolder = this.gui.addFolder('Physics')
    physicsFolder.add(this.world.gravity, 'x', -2, 2, 0.1)
    physicsFolder.add(this.world.gravity, 'z', -2, 2, 0.1)
    physicsFolder.open()
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputEncoding = THREE.sRGBEncoding
    this.camera.position.x = 0
    this.camera.position.y = 4
    this.camera.position.z = 0
    this.cameraContainer = new THREE.Group()
    this.cameraContainer.add(this.camera)
    this.scene.add(this.cameraContainer)

    this.scene.add(new THREE.AmbientLight(0x404040, 1))
    const spotLight = new THREE.SpotLight(0xffffff)
    spotLight.position.set(0, 2, 5)
    this.scene.add(spotLight)

    this.gltfLoader.load(maze, (data) => {
      this.maze = data.scene
      this.maze.traverse((obj) => {
        const material = new THREE.MeshPhongMaterial({
          color: 0xaaaaaa,
          side: THREE.DoubleSide,
        })

        if (obj.type === 'Mesh') {
          obj.material = material
          obj.castShadow = true
          obj.receiveShadow = true
          const vertices = obj.geometry.clone().toNonIndexed().attributes
            .position.array
          const indices = Object.keys(vertices).map(Number)
          const mesh = new CANNON.Trimesh(vertices, indices)

          this.mazeBody = new CANNON.Body({ mass: 0 })
          this.mazeBody.addShape(mesh)
          this.world.addBody(this.mazeBody)
        }
      })

      this.group.add(this.maze)
      this.maze.rotation.order = 'ZXY'
      this.scene.add(this.group)
      this.camera.lookAt(this.maze.position)

      this.addObjects()
      this.addEvents()
    })
  }

  addObjects() {
    const sphereSize = 0.03
    this.sphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(sphereSize),
      new THREE.MeshNormalMaterial()
    )
    this.sphereMesh.position.x = 0
    // this.sphereMesh.position.y = 2
    this.sphereMesh.position.z = 0.4
    this.sphereMesh.castShadow = true
    this.scene.add(this.sphereMesh)

    const sphereShape = new CANNON.Sphere(sphereSize * 1.2)
    this.sphereBody = new CANNON.Body({ mass: 1 })
    this.sphereBody.addShape(sphereShape)
    this.sphereBody.position.x = this.sphereMesh.position.x
    this.sphereBody.position.y = this.sphereMesh.position.y
    this.sphereBody.position.z = this.sphereMesh.position.z
    this.world.addBody(this.sphereBody)

    // Top cover, this way the ball wont jump out of play area
    const topPlaneShape = new CANNON.Box(new CANNON.Vec3(1.55, 1.55, 0.2))
    this.topPlaneBody = new CANNON.Body({ mass: 0, shape: topPlaneShape })
    this.topPlaneBody.position.y = 0.4
    this.topPlaneBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    )
    this.world.addBody(this.topPlaneBody)

    const planeShape = new CANNON.Plane()
    this.planeBody = new CANNON.Body({ mass: 0, shape: planeShape })
    this.planeBody.position.y = 0.01
    this.planeBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    )
    this.world.addBody(this.planeBody)
  }

  updateWorldMeshes(delta) {
    this.quatX.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2 + this.maze.rotation.x
    )
    let xRotation = THREE.MathUtils.lerp(
      this.cameraContainer.rotation.x,
      this.rotationVec.x,
      delta
    )
    let zRotation = THREE.MathUtils.lerp(
      this.cameraContainer.rotation.z,
      this.rotationVec.z,
      delta
    )
    this.world.gravity.z = -xRotation * 20
    this.world.gravity.x = zRotation * 20
    this.cameraContainer.rotation.z = zRotation * 0.9
    this.cameraContainer.rotation.x = xRotation * 0.9
    this.quatZ.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), this.maze.rotation.z)
    this.quatXMaze.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      this.maze.rotation.x
    )
    this.quatZMaze.setFromAxisAngle(
      new CANNON.Vec3(0, 0, 1),
      this.maze.rotation.z
    )
    const quaternion = this.quatZ.mult(this.quatX)
    const quaternionMaze = this.quatZMaze.mult(this.quatXMaze)
    quaternion.normalize()
    quaternionMaze.normalize()
    this.planeBody.quaternion.copy(quaternion)
    // this.topPlaneBody.quaternion.copy(quaternion)
    this.mazeBody.quaternion.copy(quaternionMaze)

    if (this.sphereBody) {
      this.sphereMesh.position.copy(this.sphereBody.position)
      this.sphereMesh.quaternion.copy(this.sphereBody.quaternion)
    }
  }

  addEvents() {
    // window.addEventListener('keydown', (e) => {
    //   const amount = 0.05

    //   if (e.key === 'ArrowUp') {
    //     this.maze.rotation.x -= amount
    //   }
    //   if (e.key === 'ArrowDown') {
    //     this.maze.rotation.x += amount
    //   }
    //   if (e.key === 'ArrowRight') {
    //     this.maze.rotation.z -= amount
    //   }
    //   if (e.key === 'ArrowLeft') {
    //     this.maze.rotation.z += amount
    //   }
    // })

    Observer.create({
      target: window, // can be any element (selector text is fine)
      type: 'pointer,touch', // comma-delimited list of what to listen for ("wheel,touch,scroll,pointer")
      onMove: (self) => {
        const x = (self.x / window.innerWidth) * 2 - 1
        const y = -(self.y / window.innerHeight) * 2 + 1
        this.rotationVec.set(y, 0, x)
      },
    })
  }

  tick() {
    if (this.maze && this.world) {
      // this.cannonDebugRenderer.update()

      if (this.sphereBody) {
        this.sphereMesh.position.copy(this.sphereBody.position)
        this.sphereMesh.quaternion.copy(this.sphereBody.quaternion)
      }
      this.updateWorldMeshes(this.delta)
      this.world.fixedStep()
      // this.world.step(this.delta)
    }
  }
}

const main = new Main()
