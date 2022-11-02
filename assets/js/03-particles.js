import * as THREE from "three"
import Base from './base'

class Particles extends Base {
  constructor() {
    super()
    this.camera.position.z = 20
    this.geometry = new THREE.BufferGeometry();
    this.particlesNumber = 100
    const vertices = [];

    for (let i = 0; i < this.particlesNumber; i++) {
      const x = 0.5 * Math.random() - 0.5;
      vertices.push(x, 0, 0);
    }

    const maxDistance = [];
    for (let i = 1; i <= this.particlesNumber; i++) {
      const y = this.getRandomIntInclusive(i * 0.001, i * 0.005)
      const z = this.getRandomIntInclusive(i * 0.01, 5)

      maxDistance.push(0, y, z);
    }

    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.geometry.setAttribute('maxDistance', new THREE.Float32BufferAttribute(maxDistance, 3));

    const material = new THREE.PointsMaterial({ size: 0.05, sizeAttenuation: true, });
    material.color.setHSL(1.0, 0.3, 0.7);

    const particles = new THREE.Points(this.geometry, material);
    particles.rotateX(-0.05)
    this.scene.add(particles);
    console.log(particles)
  }

  getRandomIntInclusive(min, max) {
    return Math.random() * (max - min) + min;
  }

  tick() {
    if (this.geometry) {
      const position = this.geometry.attributes.position.array;

      for (let i = 0; i < this.particlesNumber * 3; i += 3) {
        const maxYdistance = this.geometry.attributes.maxDistance.array[i + 1]
        const maxZdistance = this.geometry.attributes.maxDistance.array[i + 2]

        position[i + 1] = Math.min(position[i + 1] + 0.02 + maxYdistance * 0.01, maxYdistance) // y
        position[i + 2] = Math.min(position[i + 2] + 0.02 + maxZdistance * 0.01, maxZdistance) // z

        if (position[i + 1] === maxYdistance && position[i + 2] === maxZdistance) {
          position[i + 1] = 0
          position[i + 2] = 0
        }
      }

      this.geometry.attributes.position.needsUpdate = true
    }
  }
}

new Particles()
