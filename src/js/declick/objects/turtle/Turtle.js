import $ from 'jquery'

import TEnvironment from '@/env/TEnvironment'
import Sprite from '@/objects/sprite/Sprite'
import TGraphicalObject from '@/objects/tgraphicalobject/TGraphicalObject'
import SynchronousManager from '@/utils/SynchronousManager'
import TUtils from '@/utils/TUtils'

/**
 * Defines Turtle, inherited from Sprite.
 * Turtle can move forward or backward in any direction.
 * It can draw the path that it has taken.
 * @exports Turtle
 */
class Turtle extends Sprite {
    constructor() {
        super()
        this.addImage('turtle.png', '', false)
        this.setDisplayedImage('turtle.png')
        this.synchronousManager = new SynchronousManager()
        this.gObject.synchronousManager = this.synchronousManager
        const gObject = this.gObject
    }

    /**
     * Move Turtle of "value" pixels forward, depending of its angle.
     * @param {Number} value
     */
    _walk(value) {
        if (typeof value !== 'undefined') {
            value = TUtils.getInteger(value)
            this.gObject.walk(value)
        }
    }

    /**
     * Change the color of the path.</br>
     * Default value : red | [255, 0, 0]
     * @param {String|Number} red
     * @param {Number} green
     * @param {Number} blue
     */
    _colorPath(red, green, blue) {
        this.gObject.colorPath(red, green, blue)
    }

    /**
     * Set trackPath to false.
     * See _trackPath() for more information.
     */
    _untrackPath() {
        this.gObject.trackPath(false)
    }

    /**
     * Set trackPath to true.
     * When trackPath is at true, the path borrowed by Turtle is tracked.
     * When trackPath is at false, the path borrowed by Turtle is not tracked.
     * The tracked path is drawn.
     */
    _trackPath() {
        this.gObject.trackPath(true)
    }

    /**
     * Set the width of the path.
     * Default value : 1.
     * @param {Number} value
     */
    _pathWidth(value) {
        if (typeof value !== 'undefined') {
            value = TUtils.getInteger(value)
            this.gObject.pathWidth(value)
        }
    }
}

Turtle.prototype.className = 'Turtle'

const graphics = Turtle.prototype.graphics

Turtle.prototype.gClass = graphics.addClass('TSprite', 'TTurtle', {
    init(props, defaultProps) {
        this._super(TUtils.extend({
            inMovement: false,
            type: TGraphicalObject.TYPE_TURTLE,
            tangle: 90,
            tx: 50,
            ty: 50,
            stroke: true,
            strokeColor: '#FF0000',
            trackPath: true,
            pathWidth: 1,
            coordinates: [],
            velocity: 200
        }, props), defaultProps)
    },
    walk(value) {
        this.synchronousManager.begin()
        this.perform(function(value) {
            const x = Math.cos((this.p.tangle - 90) / 180 * Math.PI) * value
            const y = Math.sin((this.p.tangle - 90) / 180 * Math.PI) * value
            if (this.p.trackPath) {
                this.p.coordinates.push([this.p.destinationX, this.p.destinationY, this.p.strokeColor])
            }
            if (Math.abs(x) > Math.abs(y)) {
                this.p.velocityY = this.p.velocity * (Math.abs(y) / Math.abs(x))
                this.p.velocityX = this.p.velocity
            } else {
                this.p.velocityX = this.p.velocity * (Math.abs(x) / Math.abs(y))
                this.p.velocityY = this.p.velocity
            }
            this.p.inMovement = true
            this.p.destinationX += x
            this.p.destinationY += y
            if (this.p.trackPath) {
                this.p.coordinates.push([this.p.destinationX, this.p.destinationY, this.p.strokeColor])
            }
        }, [value])

    },
    rotate(angle) {
        this.perform(function(angle) {
            this.p.tangle = this.p.tangle + angle
        }, [angle])
    },
    step(dt) {
        const p = this.p
        if (p.inMovement)
        {
            p.moving = false
            if (!p.dragging && !p.frozen) {
                const stepX = p.velocityX * dt
                const stepY = p.velocityY * dt
                if (p.tx < p.destinationX) {
                    p.tx = Math.min(p.tx + stepX, p.destinationX)
                    p.moving = true
                } else if (p.tx > p.destinationX) {
                    p.tx = Math.max(p.tx - stepX, p.destinationX)
                    p.moving = true
                }
                if (p.ty < p.destinationY) {
                    p.ty = Math.min(p.ty + stepY, p.destinationY)
                    p.moving = true
                } else if (p.ty > p.destinationY) {
                    p.ty = Math.max(p.ty - stepY, p.destinationY)
                    p.moving = true
                }
                if (TUtils.equalNumbers(p.tx - p.destinationX)) {
                    p.tx = p.destinationX
                }
                if (TUtils.equalNumbers(p.ty - p.destinationY)) {
                    p.ty = p.destinationY
                }
            }
            if (!p.moving) {
                p.inMovement = false
                this.synchronousManager.end()
            }
        }
    },
    draw(ctx) {
        const p = this.p
        for (let i = 0 ; i < p.coordinates.length ; i += 2) {
            ctx.beginPath()
            ctx.moveTo(p.coordinates[i][0] - p.cx + 50, p.coordinates[i][1] - p.cy + 50)
            if (i >= p.coordinates.length - 2 && p.trackPath) {
                ctx.lineTo(p.tx - p.cx + 50, p.ty - p.cy + 50)
            } else {
                ctx.lineTo(p.coordinates[i + 1][0] - p.cx + 50, p.coordinates[i + 1][1] - p.cy + 50)
            }
            ctx.closePath()
            ctx.strokeStyle = p.coordinates[i][2]
            ctx.lineWidth = p.pathWidth
            ctx.stroke()
        }
        
        ctx.translate(p.tx, p.ty)
        ctx.rotate(this.p.tangle / 180 * Math.PI)
        if (p.asset) {
            ctx.drawImage(this.resources.getUnchecked(p.asset), -p.cx, -p.cy)
        }
    },
    colorPath(red, green, blue) {
       this.p.strokeColor = TUtils.rgbToHex(TUtils.getColor(red, green, blue))
    },
    trackPath(value) {
        this.perform(function(value) {
            this.p.trackPath = value
        }, [value])
    },
    pathWidth(value) {
        this.perform(function(value) {
            this.p.pathWidth = value
        }, [value])
    }
})

/**
 * Rotate Turtle to the right.
 */
TGraphicalObject.prototype._rotateRight = function() {
    //TODO: parseFloat
    this.gObject.rotate(90)
}

/**
 * Rotate Turtle to the left.
 */
TGraphicalObject.prototype._rotateLeft = function() {
    //TODO: parseFloat
    this.gObject.rotate(270)
}

/**
 * Rotate Turtle behind.
 */
TGraphicalObject.prototype._rotateBehind = function() {
    //TODO: parseFloat
    this.gObject.rotate(180)
}

export default Turtle
