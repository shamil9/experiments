import * as THREE from 'three'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'

import Base from './base'
import city from '@/assets/models/la-city.glb?url'
import cityDest from '@/assets/models/la-city-dest.glb?url'
import vertexShader from '@/shaders/render-target/vertex.vert?raw'
import fragmentShader from '@/shaders/render-target/fragment.frag?raw'

gsap.registerPlugin(Observer)

class RenderTarget extends Base {
  constructor() {
    super({ controls: false })

    this.camera.position.set(0, 3, 14)
    this.cameraX = this.camera.position.x
    this.cameraY = this.camera.position.y
    this.initObserver()

    Promise.all([this.initCity(), this.initTargetCity()]).then(() => {
      document.body.classList.remove('loading')
      this.isReady = true
    })
  }

  async initTargetCity() {
    const model = await this.gltfLoader.loadAsync(cityDest)
    this.destCity = model.scene
    this.destCity.rotateY(-0.25)

    const planePosition = new THREE.Vector3(
      0,
      this.camera.position.y,
      this.camera.position.z - 4
    )
    this.planeSize = this.calculateUnitSize(
      this.camera.position.z - planePosition.z
    )

    this.targetRenderer = new THREE.WebGLRenderTarget(
      this.planeSize.width * 512,
      this.planeSize.height * 512
    )

    this.targetPlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(
        this.planeSize.width,
        this.planeSize.height
      ),
      new THREE.ShaderMaterial({
        uniforms: {
          map: { value: this.targetRenderer.texture },
          color: { value: new THREE.Color('#ff7b7b') },
        },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
      })
    )
    this.targetPlane.position.copy(planePosition)
    this.scene.add(this.targetPlane)

    this.targetCamera = new THREE.PerspectiveCamera(
      this.camera.fov,
      this.targetRenderer.width / this.targetRenderer.height,
      this.camera.near,
      this.camera.far
    )
    this.targetCamera.position.copy(this.camera.position)
    this.targetScene = new THREE.Scene()
    this.targetScene.fog = new THREE.FogExp2('#ff5252', 0.05)

    this.targetScene.add(this.destCity)

    this.targetBackDropMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#ff7b7b') },
        lightning: { value: 1.0 },
      },
      vertexShader,
      fragmentShader: `
        uniform vec3 color;
        uniform float lightning;
        varying vec2 vUv;

        // 2D Random
        float random (in vec2 st) {
          return fract(sin(dot(st.xy,
                                vec2(12.9898,78.233)))
                        * 43758.5453123);
        }

        // 2D Noise based on Morgan McGuire @morgan3d
        // https://www.shadertoy.com/view/4dS3Wd
        float noise (in vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);

          // Four corners in 2D of a tile
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));

          // Smooth Interpolation

          // Cubic Hermine Curve.  Same as SmoothStep()
          vec2 u = f*f*(3.0-2.0*f);
          // u = smoothstep(0.,1.,f);

          // Mix 4 coorners percentages
          return mix(a, b, u.x) +
                  (c - a)* u.y * (1.0 - u.x) +
                  (d - b) * u.x * u.y;
        }

        void main() {
          vec2 pos = vec2(vUv*10.0);
          float n = noise(pos * cos(lightning) * sin(lightning));
          vec3 white = vec3(255., 255., 255.) / 255.0;
          vec3 color = mix(color, white, n);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })
    const mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 20),
      this.targetBackDropMaterial
    )
    mesh.position.y = 10
    mesh.position.z = -10
    this.targetScene.add(mesh)

    for (let index = 0; index < 8; index++) {
      this.addDebris(index)
    }
  }

  animateDebris(mesh, delay) {
    const duration = 10
    gsap.to(mesh.position, {
      delay: delay * duration * 0.2,
      duration,
      x: this.planeSize.width + gsap.utils.random(1, 5),
      y: 'random(0.5, 8, 1)',
      repeat: -1,
      ease: 'none',
    })
    gsap.to(mesh.rotation, {
      delay: delay * duration * 0.2,
      duration,
      x: 'random(1, 10, 3)',
      y: 'random(1, 10, 3)',
      repeat: -1,
      ease: 'none',
    })
  }

  addDebris(delay) {
    const plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(
        gsap.utils.random(0.1, 0.5, 0.1),
        gsap.utils.random(0.1, 0.3, 0.1)
      ),
      new THREE.MeshBasicMaterial({ color: 'black' })
    )
    plane.position.x = -this.planeSize.width
    plane.position.y = gsap.utils.random(3, 5)
    plane.position.z = gsap.utils.random(3, 5)
    this.animateDebris(plane, delay)

    this.targetScene.add(plane)
  }

  initObserver() {
    const x = gsap.utils.mapRange(
      0,
      window.innerWidth,
      this.camera.position.x - 2,
      this.camera.position.x + 2
    )
    const y = gsap.utils.mapRange(
      0,
      window.innerHeight,
      this.camera.position.y + 1,
      this.camera.position.y - 1
    )
    Observer.create({
      target: window,
      onMove: (observer) => {
        this.cameraX = x(observer.x)
        this.cameraY = y(observer.y)
      },
    })
  }

  async initCity() {
    const model = await this.gltfLoader.loadAsync(city)
    this.city = model.scene
    this.city.rotateY(-0.25)
    this.scene.add(this.city)
  }

  tick() {
    if (!this.isReady) {
      return
    }

    const cameraLerp = this.delta * 1.5
    const cameraX = THREE.MathUtils.lerp(
      this.camera.position.x,
      this.cameraX,
      cameraLerp
    )
    const cameraY = THREE.MathUtils.lerp(
      this.camera.position.y,
      this.cameraY,
      cameraLerp
    )

    this.camera.lookAt(0, 0, 0)
    this.camera.position.x = cameraX
    this.camera.position.y = cameraY
    this.targetPlane.position.x = cameraX
    this.targetPlane.position.y = cameraY
    this.targetCamera.position.x = cameraX
    this.targetCamera.position.y = cameraY

    this.targetBackDropMaterial.uniforms.lightning.value =
      this.elapsedTime * 0.5

    this.renderer.setRenderTarget(this.targetRenderer)
    this.renderer.render(this.targetScene, this.targetCamera)
    this.renderer.setRenderTarget(null)
  }
}

new RenderTarget()
