/**
 * Created by yaojia7 on 2019/4/25.
 */
import THREE from '../../../three'
import {
    initCamera,
    initScene,
    initRenderer,
    render3,
    lonDeltaDeg,
    calcCenter
} from '../../utils'

class WebGLLayer {
    constructor(props) {
        this.alive = true

        this.width = props.width || window.innerWidth
        this.height = props.height || window.innerHeight

        this.map = props.map
        if (!this.map) throw 'the map is undefined'

        this.container = props.container || this.map.target
        if (!this.container) throw 'the container dom is undefined'

        this.camera = null

        this.worldOriginCoord = props.map.worldOriginCoord //世界空间原点对应的经纬度

        this.animate = this.animate.bind(this)

        //event
        this.map.on('init', this.init.bind(this))
        this.map.on('render', this.render.bind(this))
        this.map.on('viewChange', this.handleViewChange.bind(this))
        this.map.on('mousehover', this.handleHover.bind(this))
        this.map.on('click', this.handleClick.bind(this))
        this.map.on('zoom', this.handleZoom.bind(this))
        this.map.on('destroy', this.destructor.bind(this))
    }

    destructor() {
        this.alive = false
    }

    render() {
        console.error('the function render is undefined')
    }

    init() {
        const canvas = document.createElement('canvas')
        canvas.setAttribute('width', this.width)
        canvas.setAttribute('height', this.height)
        canvas.style.position = 'absolute'
        canvas.style.top = '0px'
        canvas.style.left = '0px'
        this.container.appendChild(canvas)

        this.scene = initScene()
        this.camera = initCamera({
            scene: this.scene,
            clientWidth: this.width,
            clientHeight: this.height
        })
        this.renderer = initRenderer({
            scene: this.scene,
            canvas,
            clearColor: 0xffffff,
            alpha: 0.05,
            clientWidth: this.width,
            clientHeight: this.height
        })

        window.camera3 = this.camera
        window.scene = this.scene

        this.animate()

        return canvas
    }

    animate() {
        if (this.alive) {
            requestAnimationFrame(this.animate)
            if (this.composer) this.composer.render()
            else render3(this.renderer, this.scene, this.camera)
        }
    }

    addBox = (
        x = (Math.random() - 0.5) * this.width,
        y = (Math.random() - 0.5) * this.width,
        z = 0
    ) => {
        const size = Math.random() * 20 + 10
        const Box = new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshBasicMaterial({
                color: parseInt(Math.random() * 0xffffff)
            })
        )

        Box.position.x = x
        Box.position.y = y
        Box.position.z = z
        Box.rotation.y += Math.random()
        Box.rotation.z += Math.random()

        this.scene.add(Box)
    }

    lastExtent = []
    handleViewChange() {
        const extent = this.map.getExtent()
        const dx = Math.abs(extent[0] - extent[2])

        if (this.camera) {
            if (this.lastExtent.length == 4) {
                const prevDx = Math.abs(this.lastExtent[0] - this.lastExtent[2])
                const scaleZoom = prevDx / dx
                this.camera.zoom *= scaleZoom
            }

            const center = calcCenter(extent)
            this.camera.position.x =
                ((1 / this.camera.zoom) *
                    (center[0] - this.worldOriginCoord[0]) *
                    this.width) /
                dx
            this.camera.position.y =
                ((1 / this.camera.zoom) *
                    (center[1] - this.worldOriginCoord[1]) *
                    this.width) /
                dx

            this.camera.updateProjectionMatrix()
        }

        this.lastExtent = extent.slice()
    }

    handleClick(coord) {
        const position = this.transformCoordToWorld(coord)
        this.addBox(...position)
    }

    handleHover() {}

    handleZoom() {}

    getObjsAtCoord(coord, group = this.scene) {
        if (!this.scene) return

        const mousePos = this.map.transformCoordToPixel(coord)

        const vector = new THREE.Vector2(
            (mousePos[0] / this.width) * 2 - 1,
            (-mousePos[1] / this.height) * 2 + 1
        )
        const rayCaster = new THREE.Raycaster()
        rayCaster.setFromCamera(vector, this.camera)
        const intersections = rayCaster.intersectObjects(group.children)

        return intersections
    }

    transformCoordToWorld = coord => {
        try {
            const extent = this.map.getExtent()
            let dLon = lonDeltaDeg(coord[0], this.worldOriginCoord[0])
            dLon = coord[0] > this.worldOriginCoord[0] ? dLon : -1 * dLon
            const dLat = coord[1] - this.worldOriginCoord[1]

            const scale = this.width / lonDeltaDeg(extent[0], extent[2])
            return [
                (dLon * scale) / this.camera.zoom, //x
                (dLat * scale) / this.camera.zoom, //y
                0 //z
            ]
        } catch (e) {
            return [0, 0, 0]
        }
    }
}

export default WebGLLayer
