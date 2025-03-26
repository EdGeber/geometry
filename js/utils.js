export const epsilon = 1e-8;

export function lerp(from, to, t) {
	return (to - from)*t + from;
}

export function clamp(low, x, high) {
	if(x <= low) return low;
	if(x >= high) return high;
	return x;
}

export function isZero(x) {
	return Math.abs(x) <= epsilon;
}

export function radToDeg(rad) {
	return rad*(180/Math.PI);
}
