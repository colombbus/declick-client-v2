import $ from 'jquery'

import TObject from '@/objects/tobject/TObject'
import TUI from '@/ui/TUI'

/**
 * Defines Mouse, inherited from TObject.
 * Mouse is an object created automatically with the launch of Mouse.
 * It allows several interactions.
 * @exports Mouse
 */
class Mouse extends TObject {
    constructor() {
        super()
        this.getX = () => TUI.getCanvasCursorX()
        this.getY = () => TUI.getCanvasCursorY()
    }

    /**
     * Get mouse X "value".
     */
    _getX() {
        return this.getX()
    }

    /**
     * Get mouse Width "value" in logs.
     */
    _getY() {
        return this.getY()
    }
}

Mouse.prototype.className = 'Mouse'

const mouseInstance = new Mouse()
export default mouseInstance
