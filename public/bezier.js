
// Bezier curve interpolation functions for easing animations by Ryan Appel
// https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Quadratic_B%C3%A9zier_curves

const interpolateBezier = ({ p0, p1, p2, p3 }, t) => {
	return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3
}

const interpolateEaseIn = (start, end, t) => interpolateBezier({
	p0: start,
	p1: start + (end - start) * 0.3,
	p2: end, // agressive at the end
	p3: end
}, t)

const interpolateEaseOut = (start, end, t) => interpolateBezier({
	p0: start,
	p1: start, // agressive at the end
	p2: start + (end - start) * 0.7,
	p3: end
}, t)

const interpolateEaseInOut = (start, end, t) =>  interpolateBezier({
	p0: start,
	p1: start + (end - start) * 0.05,
	p2: start + (end - start) * 0.95,
	p3: end
}, t)

const interpolateLinear = (start, end, t) => start + (end - start) * t

export {
	interpolateBezier,
	interpolateEaseIn,
	interpolateEaseOut,
	interpolateEaseInOut,
	interpolateLinear
}