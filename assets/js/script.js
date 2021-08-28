import Base from './base'

class Main extends Base {
	constructor() {
		super()
	}

	tick() {
		console.log('tick')
	}
}

const main = new Main()
