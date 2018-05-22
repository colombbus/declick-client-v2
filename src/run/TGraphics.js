import $ from 'jquery'
import Quintus from 'quintus'

function TGraphics() {
    const Q = Quintus()
    Q.include('Sprites, Scenes, 2D, UI, Anim, Input, Touch, Audio').enableSound()

    // Tweak Quintus to be able to look for sprites while skipping some of them
    Q._TdetectSkip = (obj, iterator, context, arg1, arg2, skip) => {
        let result
        if (obj == null) {
            return
        }
        if (obj.length === +obj.length) {
            for (let i = 0, l = obj.length; i < l; i++) {
                result = iterator.call(context, obj[i], i, arg1, arg2)
                if (result) {
                    skip--
                    if (skip < 0) {
                        return result
                    }
                }
            }
            return false
        } else {
            for (const key in obj) {
                result = iterator.call(context, obj[key], key, arg1, arg2)
                if (result) {
                    skip--
                    if (skip < 0) {
                        return result
                    }
                }
            }
            return false
        }
    }

    Q.Stage.prototype._TgridCellCheckSkip = function(type, id, obj, collisionMask, skip) {
        if (Q._isUndefined(collisionMask) || collisionMask & type) {
            const obj2 = this.index[id]
            if (obj2 && obj2 !== obj && Q.overlap(obj, obj2)) {
                const col = Q.collision(obj, obj2)
                if (col) {
                    col.obj = obj2
                    return col
                } else {
                    return false
                }
            }
        }
    }


    Q.Stage.prototype.TsearchSkip = function(obj, collisionMask, skip, regrid) {
        var col

        if (regrid) {
            Q._generateCollisionPoints(obj)
            this.regrid(obj, obj.stage !== this)
        }

        if (typeof skip === 'undefined') {
            skip = 0
        }

        const grid = obj.grid
        let gridCell
        var col

        for (let y = grid.Y1; y <= grid.Y2; y++) {
            if (this.grid[y]) {
                for (let x = grid.X1; x <= grid.X2; x++) {
                    gridCell = this.grid[y][x]
                    if (gridCell) {
                        col = Q._TdetectSkip(gridCell, this._TgridCellCheckSkip, this, obj, collisionMask, skip)
                        if (col) {
                            return col
                        }
                    }
                }
            }
        }
        return false
    }

    // Tweak Quintus to be able to remove a collisionlayer
    Q.Stage.prototype.removeCollisionLayer = function(layer) {
    	const index = this._collisionLayers.indexOf(layer)
    	if (index !== -1) {
    		this._collisionLayers.splice(index, 1)
    	}
    }

    // Tweak Quintus to be able to look for sprite with highest id
    Q.touchStage = [0]
    Q.touchType = 0

    Q._TdetectTouch = (obj, iterator, context, arg1, arg2) => {
        let result = false
        let id = -1
        let col
        if (obj == null) {
            return
        }

        if (obj.length === +obj.length) {
            for (let i = 0, l = obj.length; i < l; i++) {
                col = iterator.call(context, obj[i], i, arg1, arg2, id)
                if (col) {
                    id = col.obj.p.id
                    result = col
                }
            }
            return result
        } else {
            for (const key in obj) {
                col = iterator.call(context, obj[key], key, arg1, arg2, id)
                if (col) {
                    id = col.obj.p.id
                    result = col
                }
            }
            return result
        }
    }

    Q.Stage.prototype._TgridCellCheckTouch = function(type, id, obj, collisionMask, minId) {
        if (Q._isUndefined(collisionMask) || collisionMask & type) {
            const obj2 = this.index[id]
            if (obj2 && obj2 !== obj && !obj2.p.hidden && obj2.p.id > minId && Q.overlap(obj, obj2)) {
                const col = Q.collision(obj, obj2)
                if (col) {
                    col.obj = obj2
                    return col
                } else {
                    return false
                }
            }
        }
    }

    Q.Stage.prototype.TsearchTouch = function(obj, collisionMask) {
        var col

        // If the object doesn't have a grid, regrid it
        // so we know where to search
        // and skip adding it to the grid only if it's not on this stage
        if (!obj.grid) {
            this.regrid(obj, obj.stage !== this)
        }

        const grid = obj.grid
        let gridCell
        var col

        for (let y = grid.Y1; y <= grid.Y2; y++) {
            if (this.grid[y]) {
                for (let x = grid.X1; x <= grid.X2; x++) {
                    gridCell = this.grid[y][x]
                    if (gridCell) {
                        col = Q._TdetectTouch(gridCell, this._TgridCellCheckTouch, this, obj, collisionMask)
                        if (col) {
                            return col
                        }
                    }
                }
            }
        }
        return false
    }

    Q.TouchSystem.prototype.touch = function(e) {
        const touches = e.changedTouches || [e]

        for (let i = 0; i < touches.length; i++) {

            for (let stageIdx = 0; stageIdx < Q.touchStage.length; stageIdx++) {
                const touch = touches[i]
                const stage = Q.stage(Q.touchStage[stageIdx])

                if (!stage) {
                    continue
                }

                touch.identifier = touch.identifier || 0
                const pos = this.normalizeTouch(touch, stage)

                stage.regrid(pos, true)
                const col = stage.TsearchTouch(pos, Q.touchType)
                let obj

                if (col || stageIdx === Q.touchStage.length - 1) {
                    obj = col && col.obj
                    pos.obj = obj
                    this.trigger('touch', pos)
                }

                if (obj && !this.touchedObjects[obj]) {
                    this.activeTouches[touch.identifier] = {
                        x: pos.p.px,
                        y: pos.p.py,
                        origX: obj.p.x,
                        origY: obj.p.y,
                        sx: pos.p.ox,
                        sy: pos.p.oy,
                        identifier: touch.identifier,
                        obj,
                        stage
                    }
                    this.touchedObjects[obj.p.id] = true
                    obj.trigger('touch', this.activeTouches[touch.identifier])
                    break
                }
            }

        }
        //e.preventDefault();
    }

    Q.touch = (type, stage) => {
        Q.untouch()
        Q.touchType = type || Q.SPRITE_UI
        Q.touchStage = stage || [2, 1, 0]
        if (!Q._isArray(Q.touchStage)) {
            touchStage = [Q.touchStage]
        }

        if (!Q._touch) {
            Q.touchInput = new Q.TouchSystem()
        }
        return Q
    }

    this.getInstance = () => Q

    this.pause = () => {
        if (Q.loop) {
            Q.pauseGame()
        }
    }

    this.unpause = () => {
        if (!Q.loop) {
            Q.unpauseGame()
        }
    }

    this.preload = (resources, progress, callback) => {
        Q.load(resources, callback, {progressCallback: progress})
    }

    this.load = (resources, callback) => {
        Q.load(resources, callback)
    }

    this.addClass = (param1, param2, param3) => {
        let ancestor
        let name
        let object
        if (typeof param3 !== 'undefined') {
            ancestor = param1
            name = param2
            object = param3
        } else {
            ancestor = 'Sprite'
            name = param1
            object = param2
        }
        Q[ancestor].extend(name, object)
        return Q[name]
    }

    this.getEasing = name => Q.Easing[name]

    this.insertObject = (object, into) => {
        Q.stage().insert(object, into)
    }

    this.removeObject = object => {
        Q.stage().remove(object)
    }

function drawGrid(context)
{
    const stage = Q.stage()
    const canvas = Q.el
    const position = {X : 0, Y: 0}
    const dimensions = {width: canvas.width, height: canvas.height}
    if (stage.has('viewport'))
    {
	const viewport = stage.viewport
	position.X = viewport.x
	position.Y = viewport.y
	dimensions.width = (viewport.centerX - viewport.x) * 2
	dimensions.height = (viewport.centerY - viewport.y) * 2
    }
    context.beginPath()
    const interval = 40
    var linesCount
    let index
    // mark vertical lines
    var offset = interval - (position.X % interval)
    if (offset > interval)
    {
	offset -= interval
    }
    var linesCount = Math.floor((dimensions.width - offset) / interval) + 1
    for (index = 0; index < linesCount; index++)
    {
	context.moveTo(offset + (index * interval) - 0.5, 0)
	context.lineTo(offset + (index * interval) - 0.5, dimensions.height)
    }
    // mark horizontal lines
    var offset = interval - (position.Y % interval)
    if (offset > interval)
    {
	offset -= interval
    }
    var linesCount = Math.floor((dimensions.height - offset) / interval) + 1
    for (index = 0; index < linesCount; index++)
    {
	context.moveTo(0, offset + (index * interval) + 0.5)
	context.lineTo(dimensions.width, offset + (index * interval) + 0.5)
    }
    // paint lines
    context.lineWidth = 1
    context.strokeStyle = '#C8DEE5'
    context.stroke()
}

let gridDisplay = false

this.displayGrid = () => {
    gridDisplay = true
}

this.maskGrid = () => {
    gridDisplay = false
}

    this.setCanvas = id => {
        Q.setup(id, {maximize: true}).touch(Q.SPRITE_ALL)
        Q.stageScene(null)
    const renderer = Q.stage().render
    Q.stage().render = context => {
	if (gridDisplay === true)
	{
	    drawGrid(context)
	}
	renderer.apply(Q.stage(), [context])
    }
    }

    this.resize = (width, height) => {
        Q.el.style.height = `${height}px`
        Q.el.style.width = `${width}px`
        Q.el.width = width
        Q.el.height = height
        Q.wrapper.style.width = `${width}px`
        Q.wrapper.style.height = `${height}px`
        Q.width = width
        Q.height = height
        Q.cssWidth = width
        Q.cssHeight = height
        const stage = Q.stage()
        stage.defaults['w'] = width
        stage.defaults['h'] = height
    }

    this.objectResized = object => {
        object.size(true)
        Q._generatePoints(object, true)
    }

    this.regridObject = object => {
        Q._generateCollisionPoints(object)
        object.stage.regrid(object)
    }

    this.searchCollisionLayer = (object, collisionMask, regrid) => {
        const stage = object.stage
        if (regrid) {
            Q._generateCollisionPoints(object)
            stage.regrid(object, false)
        }
        return stage._collideCollisionLayer(object,collisionMask)
    }

    this.getAsset = name => Q.asset(name)

    this.getContext = () => Q.ctx

    this.getElement = () => Q.el

    this.getAudio = () => Q.audio

}

export default TGraphics