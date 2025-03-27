
(async () => {

const canvas = document.getElementById('background-canvas')
const context = canvas.getContext('2d')

const circleDiameter = 120
const borderWidth = 5
const gap = 10
const circles = []

const baseSpeed = 30
const backgroundColor = (Math.random() * 255).toFixed(0)

const getCurrentDimensions = () => {
	const width = Math.ceil(canvas.width / circleDiameter) + 2
	const height = Math.ceil(canvas.height / circleDiameter) + 2
	return { width, height }
}

let gridSize = [0, 0]
let previousTime = 0


const clipImage = (image, resolve) => {
	const tempCanvas = document.createElement('canvas')
	const tempContext = tempCanvas.getContext('2d')

	const radius = circleDiameter / 2 - borderWidth

	tempCanvas.width = circleDiameter
	tempCanvas.height = circleDiameter

	tempContext.beginPath()
	tempContext.arc(circleDiameter / 2, circleDiameter / 2, radius, 0, Math.PI * 2)
	tempContext.clip()

	tempContext.drawImage(image, 0, 0, circleDiameter, circleDiameter)

	resolve(tempCanvas)
}

const clipImages = async images => {

	const clippedImages = []
	const imageLoadPromises = images.map(image => {
		return new Promise(resolve => {
			if (image.complete) clipImage(image, resolve)
			else image.onload = () => clipImage(image, resolve)
		})
	})

	return await Promise.all(imageLoadPromises)
}


const images = await clipImages([...document.querySelectorAll('img')])

const createCircle = (x, y) => {
	const color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`

	const randomIndex = Math.floor(Math.random() * images.length)
	console.log(randomIndex)
	const image = images[randomIndex]
	return { x, y, color, image }
}


const initializeCircles = () => {
	const { width, height } = getCurrentDimensions()
	gridSize = [width, height]
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

	const oldGridSize = gridSize
	const { width, height } = getCurrentDimensions()

	// if (growingOnX) {
	// 	const circlesToAddX = width - oldGridSize[0]
	// 	console.log(circlesToAddX)
	// }

	const circlesToAddX = growingOnX ? width - oldGridSize[0] : 0
	const circlesToAddY = growingOnY ? height - oldGridSize[1] : 0

	// // first generation or larger size
	// const noCircles = circles.length === 0
	// if (noCircles && (!growingOnX || !growingOnY)) return draw()

	// generateCircles(noCircles || growingOnX, noCircles || growingOnY)

	// draw()
}

const draw = () => {
	context.clearRect(0, 0, canvas.width, canvas.height)
	context.fillStyle = backgroundColor
	context.fillRect(0, 0, canvas.width, canvas.height)


	// draw grid
	const drawGrid = () => {
		context.strokeStyle = 'black'
		context.lineWidth = 1
		context.beginPath()
		const offset = circleDiameter + gap
		const { width, height } = getCurrentDimensions()
		for (let i = 0; i < width; i++) {
			context.moveTo(i * offset, 0)
			context.lineTo(i * offset, canvas.height)
		}

		for (let i = 0; i < height; i++) {
			context.moveTo(0, i * offset)
			context.lineTo(canvas.width, i * offset)
		}

		context.stroke()
	}

	//drawGrid()

	const radius = circleDiameter / 2
	const drawCircle = (({ x, y, color, image }) => {
		context.fillStyle = color

		context.beginPath()
		context.arc(x, y, circleDiameter / 2, 0, Math.PI * 2)
		context.fill()

		// draw the image on top
		context.drawImage(image, x - radius, y - radius, circleDiameter, circleDiameter)
	})


	circles.forEach(drawCircle)

}

window.addEventListener('resize', resizeCanvas)
resizeCanvas()
initializeCircles()
requestAnimationFrame(update)

})()