/**
 * Created by yaojia7 on 2019/4/16.
 */
import EventEmitter from 'event-emitter'
import OlLayer from './Layers/BaseMapLayer/OlLayer'
import DOMLayer from './Layers/DOMLayer'
import View from './View'
import { tweenWrap, TWEEN } from './tween'
import { lonDeltaDeg } from './utils'
import './preDefines'

class Map {
    constructor(props) {
        //Layer 左上角在屏幕坐标系中的坐标
        this.top = props.top || 0
        this.left = props.left || 0
        this.width = props.width || window.innerWidth
        this.height = props.height || window.innerHeight

        this.worldOriginCoord = [] //世界空间原点的经纬度坐标
        this.scale = 1 //世界空间x轴和屏幕横轴像素的比例

        this.target = props.target
        if (!this.target) throw new Error('the target canvas is undefined')

        this.baseLayer = null
        this.createBaseLayer(props)

        this.domLayer = null
        this.createDOMLayer(props)

        this.view = new View({
            map: this,
            width: this.width
        })

        //监听 View 的 center 和 zoom 的变化;
        // this.baseLayer.on('moveend', this.view.handleViewChange);

        this.layers = []
    }

    destructor() {
        this.emit('destroy')
    }

    createBaseLayer(props) {
        //创建openlayers图层
        this.baseLayer = new OlLayer({
            target: props.target,
            width: this.width,
            height: this.height,
            center: props.center,
            zoom: props.zoom,
            adcode: 100000,
            postrenderCallback: this.init
        })

        window.map = this
    }

    createDOMLayer(props) {
        //创建顶部的dom图层
        this.domLayer = new DOMLayer({
            container: props.target,
            map: this,
            width: this.width,
            height: this.height
        })
    }

    init = () => {
        //绑定openlayers地图上的部分方法到Map
        this.getCoordinateFromPixel = this.baseLayer.getCoordinateFromPixel
        this.setCenter = this.baseLayer.view.setCenter.bind(this.baseLayer.view)
        this.getCenter = this.baseLayer.view.getCenter.bind(this.baseLayer.view)
        this.setZoom = this.baseLayer.view.setZoom.bind(this.baseLayer.view)
        this.getZoom = this.baseLayer.view.getZoom.bind(this.baseLayer.view)
        //[westLon, southLat, eastLon, northLat]
        this.getExtent = this.baseLayer.view.calculateExtent.bind(
            this.baseLayer.view
        )

        this.on('viewChange', () => {
            const extent = this.getExtent()
            this.scale = this.width / Math.abs(extent[0] - extent[2])
        })

        this.on('zoom', newZoom =>
            tweenWrap({
                start: { zoom: this.getZoom() },
                end: { zoom: newZoom },
                delay: 150,
                onUpdate: obj => {
                    this.setZoom(obj.zoom)
                    this.emit('viewChange')
                }
            })
        )

        const originCoord = this.getCoordinateFromPixel([
            this.width / 2,
            this.height / 2
        ])
        this.worldOriginCoord[0] = originCoord[0]
        this.worldOriginCoord[1] = originCoord[1]

        this.emit('init')
        this.emit('viewChange')

        this.render()

        const animate = () => {
            requestAnimationFrame(animate)
            TWEEN.update()
        }

        animate()
    }

    setExtent = newFitExtent =>
        new Promise(resolve => {
            tweenWrap({
                start: this.getExtent(),
                end: newFitExtent,
                delay: 500,
                onUpdate: extent => {
                    this.baseLayer.view.fit(extent, {
                        constrainResolution: false
                    })
                    this.emit('viewChange')
                },
                onEnd: resolve
            })
        })

    transformCoordToPixel = coord => {
        const screen = [0, 0]
        const extent = this.getExtent()
        try {
            const coordWidth = lonDeltaDeg(extent[0], extent[2])
            const coordHeight = Math.abs(extent[1] - extent[3])
            const { width, height } = this

            screen[0] = ((coord[0] - extent[0]) * width) / coordWidth
            screen[1] = ((-coord[1] + extent[3]) * height) / coordHeight

            return screen
        } catch (e) {
            console.log(e)
            return screen
        }
    }

    render() {
        this.emit('render')
    }

    addLayer(layer) {
        if (!this.layers.includes(layer)) this.layers.push(layer)
    }

    removeLayer(layer) {
        const index = this.layers.findIndex(l => l === layer)
        if (index > -1) this.layers.splice(index, 1)
    }

    handleMouseCoordUpdate = (x, y) => {
        const mouseCoord = this.getCoordinateFromPixel([x, y])
        let text = ''

        this.emit('mousehover', {
            mouseCoord,
            mousePos: [x, y],
            updateText: t => (text = t)
        })

        this.domLayer.renderHoverText(text, mouseCoord)
    }

    renderAreaNames(areaList = []) {
        this.domLayer.renderAreaNames(areaList)
    }
}

EventEmitter(Map.prototype)

export default Map
