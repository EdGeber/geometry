import * as Utils from './utils.js';

export class Vector3 {
	static RIGHT = new Vector3(1, 0, 0);
	static FRONT = new Vector3(0, 1, 0);
	static UP    = new Vector3(0, 0, 1);

	static cross(a, b) {
		return new Vector3(
			a.y*b.z - a.z*b.y,
			a.z*b.x - a.x*b.z,
			a.x*b.y - a.y*b.x
		)
	}
	static dot(a, b) {
		return a.x*b.x + a.y*b.y + a.z*b.z;
	}
	static lerp(from, to, t) {
		return new Vector3(
			Utils.lerp(from.x, to.x, t),
			Utils.lerp(from.y, to.y, t),
			Utils.lerp(from.z, to.z, t),
		)
	}
	// the vectors must be normalized
	static angleBetween(a, b) {
		return Math.acos(Vector3.dot(a, b));
	}
	static signedAngleBetween(from, to, rotationAxis) {
		// the angle in (-pi, pi] by which `from` can be rotated around
		// rotationAxis to give `to`
		let ang = Vector3.angleBetween(from, to);
		if(Vector3.dot(Vector3.cross(from, to), rotationAxis) < 0)
			ang = -ang;
		return ang;
	}
	static difference(from, to) {
		return to.increasedBy(from.times(-1));
	}

	// either the 3 components or an array with the 3 components can be passed
	constructor(x, y, z=0) {
		if(Array.isArray(x)) {
			this.x = x[0];
			this.y = x[1];
			this.z = x[2] == undefined? 0 : x[2];
		} else {
			this.x = x;
			this.y = y;
			this.z = z;
		}
	}

	isZero() {
		return Utils.isZero(this.x) && Utils.isZero(this.y) && Utils.isZero(this.z);
	}
	
	asArray() {
		return [this.x, this.y, this.z];
	}
	
	opposite() {
		return new Vector3(-this.x, -this.y, -this.z);
	}
	
	increaseBy(v) {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		return this;
	}
	
	increasedBy(v) {
		return new Vector3(this.x+v.x, this.y+v.y, this.z+v.z);
	}
	
	// pure
	times(a) {
		return new Vector3(a*this.x, a*this.y, a*this.z);
	}

	// impure
	decreaseBy(v) {
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		return this;
	}

	// pure
	decreasedBy(v) {
		return new Vector3(this.x-v.x, this.y-v.y, this.z-v.z);
	}
	
	norm() {
		return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
	}
	
	// impure
	normalize() {
		if(this.isZero()) return this;
		const norm_ = this.norm();
		this.x /= norm_;
		this.y /= norm_;
		this.z /= norm_;
		return this;
	}

	sqrDistanceTo(other) {
		const diff = Vector3.difference(this, other);
		return Vector3.dot(diff, diff);
	}

	distanceTo(other) {
		return Vector3.difference(this, other).norm();
	}
	
	// impure
	rotateAboutOrthogonal(other, radians) {
		if(this.isZero()) return this;
		const z = Vector3.cross(other, this);
		const result = this.times(Math.cos(radians)).increasedBy(z.times(Math.sin(radians)));
		this.x = result.x;
		this.y = result.y;
		this.z = result.z;
		return this;
	}
	
	// impure
	rotateAbout(other, radians) {
		// MNKY (https://math.stackexchange.com/users/142437/mnky), How to rotate one vector about another?, URL (version: 2018-04-05): https://math.stackexchange.com/q/1432182
		const a = this;
		const b = other;
		const aParallel = b.times((Vector3.dot(a, b))/Vector3.dot(b, b));
		const aOrth = a.increasedBy(aParallel.times(-1));
		const w = Vector3.cross(b, aOrth);
		const aOrthNorm = aOrth.norm();
		if(aOrthNorm < Utils.epsilon) return;
		const x1 = Math.cos(radians)/aOrthNorm;
		const x2 = Math.sin(radians)/w.norm();
		const aOrthRotated = (aOrth.times(x1).increasedBy(w.times(x2))).times(aOrthNorm);
		const result = aOrthRotated.increasedBy(aParallel);
		this.x = result.x;
		this.y = result.y;
		this.z = result.z;
	}

	// pure
	projectedOntoVector(v) {
		const u = this;
		return v.times(u.dot(v)/v.dot(v));
	}

	// pure
	// the plane is assumed to have d = 0, since vectors are not localized
	projectedOntoPlane(plane) {
		const u = this;
		return u.decreasedBy(u.projectedOntoVector(plane.n));
	}

	copy() {
		return new Vector3(this.x, this.y, this.z);
	}
}

/*
A Rotation is a directional displacement.
It's the same duality as the one between a Vector (displacement) and
a Point (position). However, be careful: a vector is a positional
displacement, but as such it can be interpreted as a direction, i.e.,
an angulor, while there is no such direct map to a directional
displacement. This is another advantages of Angulors: they can be
used to generally and arbitrarily represent directional displacement
(you can apply the same rotation to various Angulors) in a way that
cannot be done with Vectors, even though vectors can represent
directions. The resort would be using rotation matrices, but they
are much more complicated than Rotations
*/
export class Direction2 {
	static fromVector3(u, vertical=Vector3.UP, horizontal=Vector3.RIGHT) {
		/* optmized
		const v = Vector3.angleBetween(u, vertical);
		const horizon = new Plane(vertical);
		const projected = u.projectedOntoPlane(horizon);
		const h = Vector3.signedAngleBetween(projected.normalize(), horizontal, vertical);
		return new Direction2(h, v);
		*/
		const v = Math.PI/2 - Vector3.angleBetween(u, vertical);
		const right = Vector3.cross(u, vertical);
		const hDirection = u.copy().rotateAboutOrthogonal(right, -v);
		const h = Vector3.signedAngleBetween(horizontal, hDirection, vertical);
		return new Direction2(h, v);
	}

	constructor(h, v) {
		this.h = h;
		this.v = v;
	}

	toVector3(vertical=Vector3.UP, horizontal=Vector3.RIGHT) {
		let result = horizontal.copy().rotateAboutOrthogonal(vertical, this.h);
		const right = Vector3.cross(result, vertical);
		result.rotateAboutOrthogonal(right, this.v);
		return result;
	}

	rotateLeft(radians) {
		this.h += radians;
		return this;
	}

	rotateUp(radians) {
		this.v += radians;
		return this;
	}

	rotateBy(hDelta, vDelta) {
		this.h += hDelta;
		this.v += vDelta;
		return this;
	}

	rotate(rotation) {
		this.h += rotation.h;
		this.v += rotation.v;
		return this;
	}

	opposite() {
		return new Direction2(this.h + Math.PI, -this.v);
	}


}

export class Plane {
	constructor (n, d=0) {
		this.n = n.copy();
		this.d = d;
	}
}

/*
rect interface: Vector3[3], assumes non-colinearity
plane interface: { n: Vector3, d: Vector3 }, assumes non-zero n
ray interface: { P: Vector3, v: Vector3 }, assumes non-zero v
*/

function rectToPlane(rect) {
	const [A, B, C] = rect;
	const n = Vector3.cross(Vector3.difference(A, B), Vector3.difference(A, C));
	const d = -Vector3.dot(n, A);
	return { n: n, d: d };
}

function rayPlaneIntersection(ray, plane) {
	const den = Vector3.dot(plane.n, ray.v);
	if(Utils.isZero(den)) return null;
	const t = -(Vector3.dot(plane.n, ray.P) + plane.d)/den;
	if(t < 0) return null;
	return ray.P.increasedBy(ray.v.times(t));
}

export function rayIntersectsRect(ray, rect) {
	const threshold = 0.1;
	const Q = rayPlaneIntersection(ray, rectToPlane(rect));
	if(Q == null) return false;
	const [A, B, C] = rect;
	
	for(let axis of ['x', 'y', 'z']) {
		let min = Math.min(A[axis], B[axis], C[axis]);
		let max = Math.max(A[axis], B[axis], C[axis]);
		if(Q[axis] < min - threshold || Q[axis] > max + threshold)
			return false;
	}

	return Q;
}
