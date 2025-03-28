
const start = ({ canvas, clearColor = 'black' }) => ({
	start: (update, draw) => {
		let lastTime = 0
		const context = canvas.getContext('2d')

		const loop = currentTime => {
			const delta = (currentTime - lastTime) / 1000
			lastTime = currentTime

			update(delta)

			context.clearRect(0, 0, canvas.width, canvas.height)
			context.fillStyle = clearColor
			context.fillRect(0, 0, canvas.width, canvas.height)

			draw(context)

			requestAnimationFrame(loop)
		}

		requestAnimationFrame(loop)
	}
})

const getGameLoop = options => start(options)

export { getGameLoop }