
const canvas = document.getElementById('background-canvas')
const context = canvas.getContext('2d')

const circleDiameter = 120
const gap = 10
const circles = [ ]

const baseSpeed = 100


const getCurrentDimensions = () => {
	const width = Math.ceil(canvas.width / circleDiameter) + 2
	const height = Math.ceil(canvas.height / circleDiameter) + 2
	return { width, height }
}

let gridSize = [ 0, 0 ]
let previousTime = 0
// let currentDimensions = getCurrentDimensions()

const createCircle = (x, y) => {
	const color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
	return { x, y, color }
}

// const findLastCircles = () => {
// 	const rows = { }
// }

// const generateCircles = (growingOnX, growingOnY) => {
// 	// temporary solution
// 	const { width, height } = currentDimensions
// 	currentDimensions = getCurrentDimensions()

// 	const circlesX = growingOnX ? currentDimensions.width - width : 0
// 	const circlesY = growingOnY ? currentDimensions.height - height : 0

// 	// new circles on X


// 	circles.push(createCircle(x, y))
// }

const initializeCircles = () => {
	const { width, height } = getCurrentDimensions()
	gridSize = [ width, height ]
	console.log(width, height)
	const offset = (circleDiameter + gap)

	const baseOffset = -(offset / 2)

	;[...Array(width * height).keys()].forEach(i => {
		const x = (i % width) * offset + baseOffset
		const y = (Math.floor(i / width)) * offset + baseOffset
		circles.push(createCircle(x, y))
	})
}

const update = currentTime => {
	const delta = (currentTime - previousTime) / 1000
	previousTime = currentTime

	circles.forEach(circle => {
		const rowIndex = Math.floor(circle.y / (circleDiameter + gap))
		let direction = rowIndex % 2 === 0 ? 1 : -1

		const speed = baseSpeed * delta * direction

		circle.x += speed


		if (direction > 0 && circle.x - circleDiameter > canvas.width) {
			circle.x -= (gridSize[0] - 1) * (circleDiameter + gap)
		}

		if (direction < 0 && circle.x + circleDiameter < 0) {
			circle.x += (gridSize[0] - 1) * (circleDiameter + gap)
		}

		// if (circle.x < -circleDiameter && direction === -1) {
		// 	circle.x += (gridSize[0] - 1) * (circleDiameter + gap) + gap
		// }
		// else if (circle.x > canvas.width - 50 && direction === 1) {
		// 	circle.x = -circleDiameter - gap
		// }
	})

	draw()
	requestAnimationFrame(update)
}


const resizeCanvas = () => {
	const growingOnX = canvas.width < window.innerWidth
	const growingOnY = canvas.height < window.innerHeight

	canvas.width = window.innerWidth
	canvas.height = window.innerHeight

	// // first generation or larger size
	// const noCircles = circles.length === 0
	// if (noCircles && (!growingOnX || !growingOnY)) return draw()

	// generateCircles(noCircles || growingOnX, noCircles || growingOnY)

	// draw()
}

const draw = () => {
	context.clearRect(0, 0, canvas.width, canvas.height)
	context.fillStyle = 'white'
	context.fillRect(0, 0, canvas.width, canvas.height)

	circles.forEach(({ x, y, color }) => {
		context.fillStyle = color

		// draw a circle
		context.beginPath()
		context.arc(x, y, circleDiameter / 2, 0, Math.PI * 2)
		
		// draw a square instead of a circle
		//context.fillRect(x, y, circleDiameter, circleDiameter)
		context.fill()
	})
}

window.addEventListener('resize', resizeCanvas)
resizeCanvas()
initializeCircles()
requestAnimationFrame(update)