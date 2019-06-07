import styles from './ColorSlider.less'

const CLEAR_COLOR = '#aaaaaa'
const TOP_OFFSET = 17
const BOTTOM_OFFSET = 32

export default class {
    constructor({
        colorRange = ['#ff4600', '#ffa100', '#fefe00', '#c9e971', '#87cef9'],
        onUpdate = () => {}
    }) {
        this.onUpdate = onUpdate

        this.colorRange = colorRange
        this.width = 15
        this.height = 200
        this.cursor = [1, 0]

        this.canvas = null
        this.ctx = null
        this.topDom = null
        this.bottomDom = null

        this.element = this.initDom()

        this.initEvent()
    }

    initDom() {
        const div = document.createElement('div')
        div.className = styles.container

        const high = document.createElement('div')
        high.innerText = 'High'
        high.className = styles.text
        div.appendChild(high)

        this.canvas = document.createElement('canvas')
        this.canvas.width = this.width
        this.canvas.height = this.height
        this.canvas.className = styles.canvas
        div.appendChild(this.canvas)

        const low = document.createElement('div')
        low.innerText = 'High'
        low.className = styles.text
        div.appendChild(low)

        const top = document.createElement('div')
        top.className = styles.top
        div.appendChild(top)
        this.topDom = top

        const bottom = document.createElement('div')
        bottom.className = styles.bottom
        div.appendChild(bottom)
        this.bottomDom = bottom

        this.ctx = this.canvas.getContext('2d')
        this.grdStyle = this.ctx.createLinearGradient(0, 0, 0, this.height)
        const step = 1.0 / (this.colorRange.length - 1)
        for (let i = 0; i < this.colorRange.length - 1; ++i)
            this.grdStyle.addColorStop(i * step, this.colorRange[i])

        this.render()

        return div
    }

    render() {
        let [top, bottom] = this.cursor

        top = (1 - top) * this.height
        bottom = (1 - bottom) * this.height

        if (top > 0) this.fill(CLEAR_COLOR, 0, top)

        if (bottom < this.height) this.fill(CLEAR_COLOR, bottom, this.height)

        this.fill(this.grdStyle, top, bottom)

        //update the position of top cursor and bottom cursor
        this.topDom.style.top = TOP_OFFSET + top + 'px'
        this.bottomDom.style.top = BOTTOM_OFFSET + bottom + 'px'
        const topCursorColor = this.ctx.getImageData(1, top + 1, 1, 1).data
        this.topDom.style.borderColor = `transparent transparent transparent rgb(${
            topCursorColor[0]
        }, ${topCursorColor[1]}, ${topCursorColor[2]})`
        const bottomCursorColor = this.ctx.getImageData(1, bottom - 1, 1, 1).data
        this.bottomDom.style.borderColor = `transparent transparent transparent rgb(${
            bottomCursorColor[0]
        }, ${bottomCursorColor[1]}, ${bottomCursorColor[2]})`
    }

    fill(style, startY, endY) {
        this.ctx.fillStyle = style
        this.ctx.fillRect(0, startY, this.width, endY - startY)
    }

    initEvent() {
        if (this.canvas) {
            this.element.addEventListener(
                'mousedown',
                this.handleMousedown,
                false
            )
            window.addEventListener('mousemove', this.handleMousemove, false)
            window.addEventListener('mouseup', this.handleMouseup, false)
        }
    }

    //the ID of dom dragged by both top cursor and bottom cursor
    moveTarget = '' // 'canvas' | 'top' | 'bottom'
    lastCursor = []
    startTop = 0
    handleMousedown = e => {
        switch (e.target) {
            case this.canvas: {
                this.moveTarget = 'canvas'
                this.lastCursor = this.cursor.slice()
                break
            }
            case this.topDom: {
                this.moveTarget = 'top'
                this.lastCursor[0] = this.cursor[0]
                break
            }
            case this.bottomDom: {
                this.moveTarget = 'bottom'
                this.lastCursor[1] = this.cursor[1]
                break
            }
            default:
                return
        }
        this.startTop = e.screenY
        e.stopPropagation()
    }

    handleMousemove = e => {
        const deltaY = (this.startTop - e.screenY) / this.height
        switch (this.moveTarget) {
            case 'canvas': {
                const newCursor = [
                    this.lastCursor[0] + deltaY,
                    this.lastCursor[1] + deltaY
                ]
                if (
                    newCursor[0] <= 1 &&
                    newCursor[1] >= 0 &&
                    newCursor[0] > newCursor[1]
                ) {
                    this.cursor = newCursor.slice()
                }
                break
            }
            case 'top': {
                const newCursor0 = this.lastCursor[0] + deltaY
                if (newCursor0 > this.cursor[1] && newCursor0 <= 1)
                    this.cursor[0] = newCursor0
                break
            }
            case 'bottom': {
                const newCursor1 = this.lastCursor[1] + deltaY
                if(newCursor1 < this.cursor[0] && newCursor1 >= 0)
                    this.cursor[1] = newCursor1
                break
            }
            default:
                return;
        }

        this.render()
    }

    handleMouseup = () => {
        this.moveTarget = ''
        this.onUpdate(...this.cursor)
    }

    resetCursor(){
        this.cursor = [1, 0]
        this.render()
    }
}
