
const createGrid = (squareSize, canvas, offset = { x: 0, y: 0 }, color = 'red') => {
	return ({
		draw: context => {

			context.strokeStyle = color
			context.lineWidth = 2
			context.beginPath()
			const { width, height } = canvas
			// Draw vertical lines
			for (let x = offset.x; x <= width; x += squareSize) {
				context.moveTo(x, offset.y)
				context.lineTo(x, height + offset.y)
			}
			// Draw horizontal lines
			for (let y = offset.y; y <= height; y += squareSize) {
				context.moveTo(offset.x, y)
				context.lineTo(width + offset.x, y)
			}
			context.stroke()
		}
	})
}

export { createGrid }