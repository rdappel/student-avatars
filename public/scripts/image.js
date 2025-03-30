

const loadImage = async source => {
	const image = new Image()
	image.src = source
	image.crossOrigin = 'anonymous'

	return new Promise((resolve, reject) => {
		image.onload = () => resolve(image)
		image.onerror = err => reject(err)
	})
}

const loadImages = async sources => {
	const imagePromises = sources.map(source => loadImage(source))
	return await Promise.all(imagePromises)
}

const createImageClipper = radius => image => {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	const diameter = radius * 2

	canvas.width = diameter
	canvas.height = diameter

	context.beginPath()
	context.arc(radius, radius, radius, 0, Math.PI * 2)
	context.clip()

	context.drawImage(image, 0, 0, diameter, diameter)

	return canvas
}


export { loadImage, loadImages, createImageClipper }