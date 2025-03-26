// nested-axle 3D camera

import { Direction2, Plane, Vector3 } from './geometry.js';
import {lerp, clamp, epsilon, radToDeg, isZero} from './utils.js';

export default class NA3DCamera {

	// All public API is meant to communicate with Construct 3, which is left-handed

	/* A traditional graphics software would require these. That's the logical -> implementational mapping
	get u() { return this.#right; }
	get v() { return this.#up; }
	get w() { return this.#look.opposite(); }
	*/

	#position;
	#pedestal;
	// Horizontal reference. The vector perpendicular to the pedestal
	// which is by convention considered to be at x angle 0. For
	// Construct 3, it is appropriate to have the pedestal be aligned
	// with the Z axis and the hRef to be (1, 0, 0), which is considered
	// to be the direction of the initial angle in C3.
	#horizontal;
	#look;
	#right;
	#up;
	#t = 1;
	#s = 1;

	#xAng;
	#yAng;
	#targetXang;
	#targetYang;

	#rInclinAng;  // right inclination angle   (of the pedestal)
	#fInclinAng;  // forward inclination angle (of the pedestal)
	#targetRInclinAng;
	#targetFInclinAng;
	#targetPosition;

	#maxUpAng;
	#minUpAng;
	
	get construct3Position() {
		return this.#changeHand(this.#position);
	}
	get construct3Forward() {
		return this.#changeHand(this.#look);
	}
	get construct3Up() {
		// I'm not sure why the up vector doesn't need hand changing
		return this.#up.copy();
	}
	get construct3Right() {
		return this.#changeHand(this.#right);
	}

	get pedestal() {
		return this.#pedestal.copy();
	}
	get look() {
		return this.#look.copy();
	}
	get right() {
		return this.#right.copy();
	}
	get up() {
		return this.#up.copy();
	}
	get position() {
		return this.#position.copy();
	}
	get xAngle() {
		return this.#changeAngleHand(this.#xAng);  // this is the correspondent value for C3
	}
	get xAngleDegrees() {
		return radToDeg(this.xAngle);  // this is the correspondent value for C3
	}
	get yAngle() {
		return this.#yAng;
	}
	get forwardInclination() {
		return this.#fInclinAng;
	}
	get rightInclination() {
		return this.#rInclinAng;
	}

	#changeHand(v) {
		// This camera implementation assumes a right-handed coordinate system, but
		// Construct 3 is left-handed, so conversion is necessary in and out.
		return new Vector3(v.x, -v.y, v.z);
	}
	#changeAngleHand(a) {
		return -a;
	}
	getSmoothness() {
		return 1.1 - (this.#t*1.1 - 0.1);
	}
	setSmoothness(look, position) {
		const min = 0.001;
		const max = 0.999;
		this.#t = 1 - clamp(min, look, max);
		this.#s = 1 - clamp(min, position, max);
	}
	
	constructor(position, pedestal, look, xAng=0, maxAbsUpAng=Math.PI/3) {
		this.#position = this.#changeHand(position);
		this.#pedestal = this.#changeHand(pedestal).normalize();
		this.#look     = this.#changeHand(look)    .normalize();
		this.#updateRight();
		this.#updateUp();

		
		this.#rInclinAng = 0;
		this.#targetRInclinAng = 0;
		this.#fInclinAng = 0;
		this.#targetFInclinAng = 0;
		this.#targetPosition = this.#position.copy();

		this.#yAng = Math.PI/2 - Vector3.angleBetween(this.#pedestal, this.#look);
		xAng = this.#changeAngleHand(xAng);
		this.#horizontal = this.#look.copy().rotateAboutOrthogonal(this.#right, -this.#yAng);
		this.#horizontal.rotateAboutOrthogonal(this.#pedestal, -xAng);
		this.#xAng = xAng;
		
		this.#targetXang = this.#xAng;
		this.#targetYang = this.#yAng;
		this.#minUpAng = -maxAbsUpAng;
		this.#maxUpAng = maxAbsUpAng;
	}
	
	#updateRight() {
		this.#right = Vector3.cross(this.#look, this.#pedestal).normalize();
	}
	
	#updateUp() {
		this.#up = Vector3.cross(this.#right, this.#look);
	}

	#updateAngles() {
		const direction = Direction2.fromVector3(this.#look, this.#pedestal, this.#horizontal);
		this.#xAng = direction.h;
		this.#yAng = direction.v;
		this.#targetXang = this.#xAng;
		this.#targetYang = this.#yAng;
	}

	setLook(look) {
		this.#look = this.#changeHand(look).normalize();
		this.#updateAngles();
		this.#updateRight();
		this.#updateUp();
	}

	setLookSmooth(look) {
		look = this.#changeHand(look).normalize();
		const direction = Direction2.fromVector3(look, this.#pedestal, this.#horizontal);
		this.#targetXang = direction.h;
		this.#targetYang = direction.v;
	}

	lookAt(target) {
		this.setLook(Vector3.difference(this.#changeHand(this.#position), target));
	}

	lookAtSmooth(target) {
		this.setLookSmooth(Vector3.difference(this.#changeHand(this.#position), target));
	}
	
	rotateLeft(radians) {
		// future versions should start using angle interpolation
		this.#targetXang += radians;
	}

	#actuallyRotateLeft(radians) {
		// Here, we use the interpretation that a positive rotation rotates the view towards the
		// right vector. However, this is clockwise rotation around the pedestal, i.e., a
		// negative rotation around the pedestal.
		if(isZero(radians)) return;
		this.#look.rotateAbout(this.#pedestal, radians);
		this.#updateRight();
		this.#updateUp();
		// TODO: decrease the xAng, and the return -xAng at a getter
		this.#xAng += radians;
	}
	
	rotateUp(radians) {
		this.#targetYang = clamp(this.#minUpAng, this.#targetYang+radians, this.#maxUpAng);
	}

	#actuallyRotateUp(radians) {
		if(isZero(radians)) return;
		if(this.#yAng + radians > this.#maxUpAng) {
			this.#look.rotateAboutOrthogonal(this.#right, this.#maxUpAng - this.#yAng);
			this.#yAng = this.#maxUpAng;
		} else if(this.#yAng + radians < this.#minUpAng) {
			this.#look.rotateAboutOrthogonal(this.#right, this.#minUpAng - this.#yAng);
			this.#yAng = this.#minUpAng;
		} else {
			this.#look.rotateAboutOrthogonal(this.#right, radians);
			this.#yAng += radians;
		}
		this.#updateUp();
	}
	
	inclineRight(radians) {
		this.#targetRInclinAng += radians;
	}
	#actuallyInclineRight(radians) {
		if(Math.abs(radians) < epsilon) return;
		const axis = Vector3.cross(this.#pedestal, this.#right);
		this.#pedestal.rotateAboutOrthogonal(axis, radians);
		this.#look.rotateAbout(axis, radians);
		this.#updateRight();
		this.#updateUp();
		this.#rInclinAng += radians;
	}
	
	inclineForward(radians) {
		this.#targetFInclinAng += radians;
	}
	#actuallyInclineForward(radians) {
		if(Math.abs(radians) < epsilon) return;
		this.#pedestal.rotateAbout(this.#right, radians);
		this.#look.rotateAboutOrthogonal(this.#right, radians);
		this.#updateUp();
		this.#fInclinAng += radians;
	}

	#setXangle(radians) {
		const delta = radians - this.#xAng;
		this.#actuallyRotateLeft(delta);
	}
	#setYangle(radians) {
		const delta = radians - this.#yAng;
		this.#actuallyRotateUp(delta);
	}
	#setRInclinAng(radians) {
		const delta = radians - this.#rInclinAng;
		this.#actuallyInclineRight(delta);
	}
	#setFInclinAng(radians) {
		const delta = radians - this.#fInclinAng;
		this.#actuallyInclineForward(delta);
	}
	
	setPosition(position) {
		this.#position = this.#changeHand(position);
		this.#targetPosition = this.#position.copy();
	}
	setPositionSmooth(position) {
		this.#targetPosition = this.#changeHand(position);
	}
	moveRight(amount) {
		this.#position.increaseBy(this.#right.times(amount));
	}
	moveForward(amount) {
		this.#position.increaseBy(this.#look.times(amount));
	}
	moveUp(amount) {
		this.#position.increaseBy(this.#up.times(amount));
	}
	
	update() {
		this.#setXangle(lerp(this.#xAng, this.#targetXang, this.#t));
		this.#setYangle(lerp(this.#yAng, this.#targetYang, this.#t));
		this.#setRInclinAng(lerp(this.#rInclinAng, this.#targetRInclinAng, this.#t));
		this.#setFInclinAng(lerp(this.#fInclinAng, this.#targetFInclinAng, this.#t));
		this.#position = Vector3.lerp(this.#position, this.#targetPosition, this.#s);
	}
}
