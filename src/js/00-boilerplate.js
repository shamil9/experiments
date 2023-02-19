import * as THREE from 'three'
import Base from './base'

class Boilerplate extends Base {
  constructor() {
    super()
    document.body.classList.remove('loading')
  }
}

new Boilerplate()
