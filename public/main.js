
import { getGameLoop } from './game-loop.js'
import { loadImages, createImageClipper } from './image.js'
//import { createGrid } from './grid.js'
import { interpolateEaseInOut } from './bezier.js'


(async () => {

	// testing images
	const imageSources = [
		'images/building1.jpg',
		'images/fox-logo.gif',
		'images/logo.png',
		'https://avatars.githubusercontent.com/u/5315168?v=4',
		'https://avatars.githubusercontent.com/u/1252813?v=4',
		'https://avatars.githubusercontent.com/u/1778599?v=4',
		'https://avatars.githubusercontent.com/u/16659436?v=4',
		'https://avatars.githubusercontent.com/u/171260387?v=4'
	]

	const getByte = () => Math.floor(Math.random() * 255)
	const getRandomColor = () => `rgb(${getByte()}, ${getByte()}, ${getByte()})`

	const canvas = document.querySelector('#background-canvas')
	const clearColor = getRandomColor()
	const gameLoop = getGameLoop({ canvas, clearColor })
	const githubCorner = document.querySelector('.github-corner svg')
	githubCorner.style.color = clearColor

	const radius = 64
	const borderWidth = 8
	const gap = 12
	const circleDistance = radius * 2 + gap
	const circles = []

	const availableScreenSize = {
		width: window.screen.availWidth,
		height: window.screen.availHeight
	}

	const resizeCanvas = () => {
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight
	}
	window.addEventListener('resize', resizeCanvas)
	resizeCanvas()

	//const grid = createGrid(circleDistance, canvas)
	

	const clipImage = createImageClipper(radius - borderWidth)
	const images = (await loadImages(imageSources)).map(clipImage)

	const getRandomImage = () => images[Math.floor(Math.random() * images.length)]

	const createCircle = (position, column, row) => {
		const color = getRandomColor()
		const offset = { x: 0, y: 0 }
		const image = getRandomImage()
		return { position, color, image, column, row, offset }
	}

	const initializeCircles = () => {
		const { width, height } = availableScreenSize

		const circlesPerRow = Math.ceil(width / circleDistance) + 2
		const circlesPerColumn = Math.ceil(height / circleDistance) + 2
		const circleCount = circlesPerRow * circlesPerColumn

		;[...Array(circleCount).keys()].forEach(i => {
			const column = (i % circlesPerRow)
			const row = Math.floor(i / circlesPerRow)
			const position = {
				x: column * circleDistance,
				y: row * circleDistance
			}
			circles.push(createCircle(position, column, row))
		})

		return { width: circlesPerRow, height: circlesPerColumn }
	}

	const gridSize = initializeCircles()
	
	//const centeringOffsetX = (gridSize.width * circleDistance - canvas.width) / 2
	const xRemainder = canvas.width % circleDistance
	const yRemainder = canvas.height % circleDistance
	const xAdjustment = (xRemainder + gap) / 2
	const yAdjustment = (yRemainder + gap) / 2



	const interpolationTime = 5 // seconds for a full loop of the row
	const adjacentDelay = 0.25 // seconds for adjacent rows to start their animation

	const getRandomRowAndColumn = disallow => {
		const getIndex = dimension => {
			const index = Math.floor(Math.random() * (gridSize[dimension] - 2)) + 1
			return (index === disallow) ? getIndex(dimension) : index
		}
		// avoid edges to prevent out of bounds errors

		const column = getIndex('width')
		const row = getIndex('height')
		return { column, row }
	}

	const resetAnimation = () => {
		const delay = Math.random() * 5 + 1 // random delay between 1 and 6 seconds
		const isHorizontal = Math.random() < 0.66 // 2/3 chance of horizontal movement
		const { column, row } = getRandomRowAndColumn()
		const index = isHorizontal ? row : column
		const direction = Math.random() < 0.5 ? 1 : -1
		const currentTime = 0
		const adjacentTime = -adjacentDelay

		console.log({ delay, isHorizontal, index, direction, currentTime, adjacentTime })
		return { delay, isHorizontal, index, direction, currentTime, adjacentTime }
	}

	let animation = resetAnimation()

	const clamp = (value, min = 0, max = 1) => {
		return Math.max(min, Math.min(value, max))
	}

	const update = delta => {
		animation.delay -= delta
		if (animation.delay > 0) return

		const { index, isHorizontal, direction } = animation

		animation.currentTime += delta
		animation.adjacentTime += delta

		const animationComplete = animation.adjacentTime >= interpolationTime

		if (animation.currentTime >= interpolationTime) animation.currentTime = interpolationTime
		if (animation.adjacentTime >= interpolationTime) animation = resetAnimation()

		const tMain = clamp(animation.currentTime / interpolationTime)
		const tAdjacent = clamp(animation.adjacentTime / interpolationTime)

		const rowMatchesIndex = ({ row }) => row === index
		const columnMatchesIndex = ({ column }) => column === index
		const rowIsAdjacentToIndex = ({ row }) => Math.abs(row - index) === 1
		const columnIsAdjacentToIndex = ({ column }) => Math.abs(column - index) === 1

		const find = {
			match: isHorizontal ? rowMatchesIndex : columnMatchesIndex,
			adjacent: isHorizontal ? rowIsAdjacentToIndex : columnIsAdjacentToIndex
		}

		const selectedCircles = circles.filter(c => find.match(c))
		const adjacentCircles = circles.filter(c => find.adjacent(c))

		const axis = isHorizontal ? 'x' : 'y'
		const fullWidth = selectedCircles.length * circleDistance

		if (animationComplete) {
			// move circles back to their original positions after the animation completes
			selectedCircles.forEach(circle => circle.position[axis] += circle.offset[axis])
			adjacentCircles.forEach(circle => circle.position[axis] += circle.offset[axis])
		}


		const mainOffset = interpolateEaseInOut(0, fullWidth, tMain) * direction
		const adjacentOffset = interpolateEaseInOut(0, fullWidth, tAdjacent) * direction

		const move = (circle, offset) => {
			circle.offset[axis] = offset

			if (direction > 0 && circle.offset[axis] + circle.position[axis] >= fullWidth) {
				circle.position[axis] -= fullWidth
				circle.image = getRandomImage()
			}

			if (direction < 0 && circle.offset[axis] + circle.position[axis] < 0) {
				circle.position[axis] += fullWidth
				circle.image = getRandomImage()
			}
		}

		selectedCircles.forEach(circle => move(circle, mainOffset))
		adjacentCircles.forEach(circle => move(circle, adjacentOffset))

	}

	const draw = context => {

		//grid.draw(context)

		const smallRadius = radius - borderWidth
		const diameter = (smallRadius) * 2
		const drawCircle = (({ position, color, image, offset }) => {

			const { width, height } = availableScreenSize
			if (position.x + offset.x - radius > width + circleDistance) return
			if (position.y + offset.y - radius > height + circleDistance) return
			if (position.x + offset.x + radius < 0) return
			if (position.y + offset.y + radius < 0) return

			context.fillStyle = color

			context.beginPath()
			const x = position.x + offset.x - circleDistance + radius - (circleDistance - xAdjustment)
			const y = position.y + offset.y - circleDistance + radius - (circleDistance - yAdjustment)
			context.arc(x, y, radius, 0, Math.PI * 2)
			context.fill()

			const insetX = x - smallRadius
			const insetY = y - smallRadius

			context.drawImage(image, insetX, insetY, diameter, diameter)
		})


		circles.forEach(drawCircle)

	}

	gameLoop.start(update, draw)
})()