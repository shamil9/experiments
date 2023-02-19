import Base from './base'
import * as THREE from 'three'
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js'
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Observer } from 'gsap/Observer'

gsap.registerPlugin(ScrollTrigger, Observer)

// import graniteAo from '../assets/textures/granite/granite-gray-white-ao.png'
// import graniteHeight from '../assets/textures/granite/granite-gray-white-Height.png'
// import graniteNormal from '../assets/textures/granite/granite-gray-white-Normal-ogl.png'
// import graniteMetalic from '../assets/textures/granite/granite-gray-white-Metallic.png'
// import graniteRoughness from '../assets/textures/granite/granite-gray-white-Roughness.png'
// import graniteAlbedo from '../assets/textures/granite/granite-gray-white-albedo.png'

const PLANE_WIDTH = 2.5
const PLANE_HEIGHT = 2.5
const CAMERA_HEIGHT = 0.8
const state = {
  shadow: {
    blur: 10,
    darkness: 1,
    opacity: 1,
  },
  plane: {
    color: '#f5f5f5',
    opacity: 1,
  },
  showWireframe: false,
}

class PBR extends Base {
  constructor() {
    super({ controls: false })
    this.materials = []
    this.maps = ['granite', 'blue', 'rock']
    this.loadTextures().then(() => {
      this.init()
      document.body.classList.remove('loading')
    })
  }

  async loadTextures() {
    await Promise.all(
      this.maps.map(async (mapName) => {
        let base = await import(
          `../assets/textures/stone/${mapName}/base.jpeg`
        ).then((module) => module.default)
        let normal = await import(
          `../assets/textures/stone/${mapName}/normal.jpeg`
        ).then((module) => module.default)
        let height = await import(
          `../assets/textures/stone/${mapName}/height.jpeg`
        ).then((module) => module.default)
        let rough = await import(
          `../assets/textures/stone/${mapName}/rough.jpeg`
        ).then((module) => module.default)

        base = await this.textureLoader.loadAsync(base)
        normal = await this.textureLoader.loadAsync(normal)
        height = await this.textureLoader.loadAsync(height)
        rough = await this.textureLoader.loadAsync(rough)

        this.materials[mapName] = new THREE.MeshStandardMaterial({
          map: base,
          normalMap: normal,
          roughnessMap: rough,
          bumpMap: height,
        })
      })
    )
  }

  init() {
    this.renderer.physicallyCorrectLights = true
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.camera.far = 100
    this.camera.near = 0.1
    this.camera.fov = 30
    this.camera.updateProjectionMatrix()

    this.camera.position.set(0, 0, 8)
    this.scene.background = new THREE.Color(0xf5f5f5)
    this.addContainer()
    this.addCube()
    this.addLight()
    this.addFloor()
    this.initScrollAnimation()
    this.isReady = true
  }

  initScrollAnimation() {
    const sections = document.querySelectorAll('.section')
    const duration = 1
    const ease = 'power2.out'

    sections.forEach((el, index) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'bottom center',
        end: 'bottom center',
        onLeave: () => {
          gsap.killTweensOf(this.animationContainer.position)
          gsap.to(this.animationContainer.position, {
            duration,
            x: index % 2 === 0 ? -1.3 : 1.3,
            ease,
          })
          gsap.to(this.cube.rotation, {
            duration,
            x: '+=5',
            y: '+=5',
            yoyo: true,
            onStart: () => {
              this.cube.material = this.materials[this.maps[index + 1]]
            },
          })
        },
        onLeaveBack: () => {
          gsap.killTweensOf(this.animationContainer.position)
          gsap.to(this.animationContainer.position, {
            duration,
            x: index % 2 === 0 ? 1.3 : -1.3,
            ease,
          })
          gsap.to(this.cube.rotation, {
            duration,
            x: '+=5',
            y: '+=5',
            yoyo: true,
            onStart: () => {
              this.cube.material = this.materials[this.maps[index]]
            },
          })
        },
      })
    })
  }

  addContainer() {
    this.animationContainer = new THREE.Group()
    this.container = new THREE.Group()
    // this.container.position.y = -0.3
    this.container.rotateX(0.5)
    this.animationContainer.add(this.container)
    this.animationContainer.position.set(1.5, 0, 0)
    this.scene.add(this.animationContainer)
  }

  addRenderTargets() {
    this.renderTarget = new THREE.WebGLRenderTarget(512, 512)
    this.renderTarget.texture.generateMipmaps = false

    // the render target that we will use to blur the first render target
    this.renderTargetBlur = new THREE.WebGLRenderTarget(512, 512)
    this.renderTargetBlur.texture.generateMipmaps = false
  }

  addFloor() {
    this.addRenderTargets()
    const planeGeometry = new THREE.PlaneGeometry(
      PLANE_WIDTH,
      PLANE_HEIGHT
    ).rotateX(Math.PI / 2)
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: this.renderTarget.texture,
      opacity: state.shadow.opacity,
      transparent: true,
      depthWrite: false,
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.renderOrder = 1
    this.container.add(plane)
    plane.scale.y = -1

    // the plane onto which to blur the texture
    this.blurPlane = new THREE.Mesh(planeGeometry)
    this.blurPlane.visible = false
    this.container.add(this.blurPlane)

    // the plane with the color of the ground
    const fillPlaneMaterial = new THREE.MeshBasicMaterial({
      color: state.plane.color,
      opacity: state.plane.opacity,
      transparent: true,
      depthWrite: false,
    })
    this.fillPlane = new THREE.Mesh(planeGeometry, fillPlaneMaterial)
    this.fillPlane.rotateX(Math.PI)
    this.container.add(this.fillPlane)

    // the camera to render the depth material from
    this.shadowCamera = new THREE.OrthographicCamera(
      -PLANE_WIDTH / 2,
      PLANE_WIDTH / 2,
      PLANE_HEIGHT / 2,
      -PLANE_HEIGHT / 2,
      0,
      CAMERA_HEIGHT
    )
    this.shadowCamera.rotation.x = Math.PI / 2 // get the camera to look up
    this.container.add(this.shadowCamera)

    this.cameraHelper = new THREE.CameraHelper(this.shadowCamera)
    // this.scene.add(this.cameraHelper)

    // like MeshDepthMaterial, but goes from black to transparent
    this.depthMaterial = new THREE.MeshDepthMaterial()
    this.depthMaterial.userData.darkness = { value: state.shadow.darkness }
    this.depthMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.darkness = this.depthMaterial.userData.darkness
      shader.fragmentShader = /* glsl */ `
						uniform float darkness;
						${shader.fragmentShader.replace(
              'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
              'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );'
            )}
					`
    }

    this.depthMaterial.depthTest = false
    this.depthMaterial.depthWrite = false

    this.horizontalBlurMaterial = new THREE.ShaderMaterial(HorizontalBlurShader)
    this.horizontalBlurMaterial.depthTest = false

    this.verticalBlurMaterial = new THREE.ShaderMaterial(VerticalBlurShader)
    this.verticalBlurMaterial.depthTest = false
  }

  addCube() {
    const geometry = new THREE.BoxGeometry(1, 1)
    const material = this.materials.granite

    this.cube = new THREE.Mesh(geometry, material)
    this.cube.receiveShadow = true
    this.cube.castShadow = true
    this.cube.position.y = 1
    this.camera.lookAt(this.cube.position)
    this.container.add(this.cube)
  }

  addLight() {
    const light = new THREE.AmbientLight(0x404040, 4) // soft white light
    const hemilight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)

    hemilight.position.z = 2

    this.dirLight = new THREE.DirectionalLight(0xffffff, 2)
    this.cube && this.dirLight.position.copy(this.cube.position)
    this.dirLight.position.z = 2

    this.scene.add(light)
    this.container.add(this.dirLight)
    this.container.add(hemilight)
  }

  blurShadow(amount) {
    this.blurPlane.visible = true

    // blur horizontally and draw in the renderTargetBlur
    this.blurPlane.material = this.horizontalBlurMaterial
    this.blurPlane.material.uniforms.tDiffuse.value = this.renderTarget.texture
    this.horizontalBlurMaterial.uniforms.h.value = (amount * 1) / 256

    this.renderer.setRenderTarget(this.renderTargetBlur)
    this.renderer.render(this.blurPlane, this.shadowCamera)

    // blur vertically and draw in the main renderTarget
    this.blurPlane.material = this.verticalBlurMaterial
    this.blurPlane.material.uniforms.tDiffuse.value =
      this.renderTargetBlur.texture
    this.verticalBlurMaterial.uniforms.v.value = (amount * 1) / 256

    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(this.blurPlane, this.shadowCamera)

    this.blurPlane.visible = false
  }

  tick() {
    if (!this.isReady) {
      return
    }

    this.cube.rotation.x += 0.002
    this.cube.rotation.y += 0.002
    // remove the background
    const initialBackground = this.scene.background
    this.scene.background = null

    // force the depthMaterial to everything
    this.scene.overrideMaterial = this.depthMaterial

    // set renderer clear alpha
    const initialClearAlpha = this.renderer.getClearAlpha()
    this.renderer.setClearAlpha(0)

    // render to the render target to get the depths
    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(this.scene, this.shadowCamera)

    // and reset the override material
    this.scene.overrideMaterial = null

    this.blurShadow(state.shadow.blur)

    // a second pass to reduce the artifacts
    // (0.4 is the minimum blur amout so that the artifacts are gone)
    this.blurShadow(state.shadow.blur * 0.4)

    // reset and render the normal scene
    this.renderer.setRenderTarget(null)
    this.renderer.setClearAlpha(initialClearAlpha)
    this.scene.background = initialBackground
    this.renderer.render(this.scene, this.camera)
  }
}

new PBR()
