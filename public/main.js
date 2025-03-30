
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
	
	const xRemainder = canvas.width % circleDistance
	const yRemainder = canvas.height % circleDistance
	const xAdjustment = (xRemainder + gap) / 2
	const yAdjustment = (yRemainder + gap) / 2

	const numberOfAnimationRows = gridSize.height > gridSize.width ? gridSize.height : gridSize.width
	const animationIndices = [...Array(numberOfAnimationRows).keys()]
	const interpolationTime = 5 // seconds for a full loop of the row
	const adjacentDelay = 0.25 // seconds for adjacent rows to start their animation
	const changeImageOnWrap = true
	const changeColorOnWrap = true

	const getRandomRowAndColumn = disallow => {
		const getIndex = dimension => {
			const index = Math.floor(Math.random() * (gridSize[dimension] - 2)) + 1
			return (index === disallow) ? getIndex(dimension) : index
		}

		const column = getIndex('width')
		const row = getIndex('height')
		return { column, row }
	}

	const resetAnimation = () => {
		console.log('resetAnimation')
		const delay = Math.random() * 2 + 1 // random delay between 1 and 6 seconds
		const isHorizontal = Math.random() < 0.66 // 2/3 chance of horizontal movement
		const { column, row } = getRandomRowAndColumn()
		const index = isHorizontal ? row : column
		const direction = Math.random() < 0.5 ? 1 : -1

		const offsetTimes = animationIndices.map((i) => -i * adjacentDelay)

		return { delay, isHorizontal, index, direction, offsetTimes }
	}

	let animation = resetAnimation()

	const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(value, max))

	const update = delta => {
		animation.delay -= delta
		if (animation.delay > 0) return

		const { index, isHorizontal, direction, offsetTimes } = animation

		animationIndices.forEach(i => {
			offsetTimes[i] += delta
			if (offsetTimes[i] >= interpolationTime) {
				offsetTimes[i] = interpolationTime
			}
		})

		const animationComplete = offsetTimes[offsetTimes.length - 1] === interpolationTime
		if (animationComplete) animation = resetAnimation()

		// compute easing values for each offset based on the current time
		const tValues = offsetTimes.map(t => clamp(t / interpolationTime))

		const isDistanceFromIndex = (c, distance) => Math.abs((isHorizontal ? c.row : c.column) - index) === distance
		const circleGroups = animationIndices.map(i => circles.filter(c => isDistanceFromIndex(c, i)))

		const axis = isHorizontal ? 'x' : 'y'
		const fullWidth = circleGroups[0].length * circleDistance

		if (animationComplete) {
			circles.forEach(circle => {
				const { column, row } = circle
				circle.position.x = column * circleDistance
				circle.position.y = row * circleDistance
				circle.offset = { x: 0, y: 0 }
			})
			return
		}

		const move = (circle, offset) => {
			circle.offset[axis] = offset

			const wrappedPositive = circle.offset[axis] + circle.position[axis] >= fullWidth
			const wrappedNegative = circle.offset[axis] + circle.position[axis] < 0

			if (wrappedPositive || wrappedNegative) {
				circle.position[axis] -= (fullWidth * direction)
				if (changeImageOnWrap) circle.image = getRandomImage()
				if (changeColorOnWrap) circle.color = getRandomColor()
			}
		}

		circleGroups.forEach((group, i) => {
			const offset = interpolateEaseInOut(0, fullWidth, tValues[i]) * direction
			group.forEach(circle => move(circle, offset))
		})
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