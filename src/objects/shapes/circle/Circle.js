import $ from 'jquery'

import TEnvironment from '@/env/TEnvironment'
import TGraphicalObject from '@/objects/tgraphicalobject/TGraphicalObject'
import Arc from '@/objects/shapes/arc/Arc'
import TUtils from '@/utils/TUtils'

/**
 * Defines Circle, inherited from Arc.
 * @exports Circle
 */
class Circle extends Arc {
    constructor() {
        super()
    }
}

Circle.prototype.className = 'Circle'

const graphics = Circle.prototype.graphics

Circle.prototype.gClass = graphics.addClass('TArc', 'TCircle', {
    init(props, defaultProps) {
        this._super(TUtils.extend({
        }, props), defaultProps)
    },
    draw(ctx) {
        const p = this.p
        if (p.ray !== false) {
            ctx.beginPath()
            ctx.translate(p.tx, p.ty)
            ctx.arc(0, 0, p.ray, 0, 2 * Math.PI)
            if (this.p.fill) {
                ctx.closePath()
                ctx.fillStyle = p.fillColor
                ctx.fill()
            }
            ctx.strokeStyle = p.color
            ctx.lineWidth = p.width
            ctx.stroke()
            
        }
    }
})

export default Circle