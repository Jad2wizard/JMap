/**
 * Created by yaojia on 2019/5/24.
 */

import THREE from './../../../three'
import Base from './index'
import { vertexShader, fragmentShader } from './shaders/Areamap'
import { genGeoJsonPath, formatColor } from './../../utils'
import { fade, smoothstep } from './../../Math'

window.three = THREE
class Areamap extends Base {
    constructor(props) {
        super(props)
        this.hoverZone = null //鼠标悬浮的区域Mesh

        this.areaList = new THREE.Group()
        this.zoneCentroidList = new THREE.Group()

        this.lastRenderZoom = 0 //最近一次render时，fit extent时的zoom
        this.initZoom = 1

        this.resetExtent()
    }

    init() {
        super.init()
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uColor: {
                    type: 'vec3',
                    value: [0.8, 0.8, 0.8]
                },
                uOpacity: {
                    type: 'f',
                    value: 0.85
                },
                uHoverColor: {
                    type: 'vec3',
                    value: formatColor(0xfddd52)
                }
            },
            vertexShader,
            fragmentShader
        })
        this.material.transparent = true
        this.material.extensions.derivatives = true

        this.scene.add(this.areaList)
        this.scene.add(this.zoneCentroidList)
        this.initZoom = this.camera.zoom
    }

    async render(data = mockData) {
        this.resetExtent()
        this.clearAreas()
        const maxValue = Math.max(...data.map(i => i.value || 1))
        const minValue = Math.min(...data.map(i => i.value || 0))

        const nameCoordList = []

        for (let zone of data) {
            if (zone.adcode) {
                const value = zone.value
                    ? (zone.value - minValue) / (maxValue - minValue)
                    : 1

                const color = this.getColor(value)
                const material = this.material.clone()
                material.uniforms.uColor.value = color
                material.needsUpdate = true

                const zoneData = await fetch(genGeoJsonPath(zone.adcode)).then(
                    res => res.json()
                )

                let coordinates = zoneData.coordinates
                const shapeList = []

                if (zoneData.geoType === 'MultiPolygon') {
                    coordinates = coordinates.map(polygon => polygon[0])
                }
                for (let coordArr of coordinates) {
                    const pts = []
                    for (let p of coordArr) {
                        this.updateExtent(p)

                        pts.push(
                            new THREE.Vector2(
                                ...this.transformCoordToWorld(p).slice(0, 2)
                            )
                        )
                    }
                    shapeList.push(new THREE.Shape(pts))
                }

                const zoneMesh = new THREE.Mesh(
                    new THREE.ShapeBufferGeometry(shapeList),
                    material
                )
                zoneMesh.adcode = zone.adcode
                zoneMesh.name = zoneData.name
                zoneMesh.level = zoneData.level
                zoneMesh.zoneCenter = zoneData.center
                if (zone.value) zoneMesh.value = zone.value
                this.areaList.add(zoneMesh)

                //center point
                if (zoneData.centroid.length == 2) {
                    nameCoordList.push({
                        name: zoneData.name,
                        coord: zoneData.centroid
                    })

                    const centralPos = this.transformCoordToWorld(
                        zoneData.centroid
                    )
                    const circle = new THREE.Mesh(
                        new THREE.CircleGeometry(3, 32),
                        new THREE.MeshBasicMaterial({ color: '#4e4e4e' })
                    )
                    circle.position.x = centralPos[0]
                    circle.position.y = centralPos[1]
                    circle.position.z = 1.0
                    circle.frustumCulled = false
                    this.zoneCentroidList.add(circle)
                }
            }
        }

        if (data.length > 0) this.fitExtent()

        this.map.renderAreaNames(nameCoordList)
    }

    fitExtent() {
        this.map
            .setExtent([this.west, this.south, this.east, this.north])
            .then(() => {
                this.lastRenderZoom = this.map.getZoom()

                //根据zoom调整center点大小
                for (let zc of this.zoneCentroidList.children) {
                    const scaleRatio = this.initZoom / this.camera.zoom
                    zc.scale.x = scaleRatio
                    zc.scale.y = scaleRatio
                }
            })
    }

    resetExtent() {
        //当前显示区域点边界
        this.west = 180
        this.east = -180
        this.north = -90
        this.south = 90
    }

    updateExtent(p) {
        if (p[0] < this.west) this.west = p[0]
        if (p[0] > this.east) this.east = p[0]
        if (p[1] < this.south) this.south = p[1]
        if (p[1] > this.north) this.north = p[1]
    }

    clearAreas() {
        const areas = this.areaList.children.slice()
        for (let a of areas) this.areaList.remove(a)

        const centroids = this.zoneCentroidList.children.slice()
        for (let c of centroids) this.zoneCentroidList.remove(c)
    }

    clickHandling = false
    async handleClick(coord) {
        if (this.clickHandling) return

        const intersections = this.getObjsAtCoord(coord, this.areaList)
        if (intersections && intersections.length > 0) {
            const zone = intersections[0].object
            //非区级行政区域可以展开
            if (zone.level !== 'district') {
                this.clickHandling = true

                const data = await fetch(genGeoJsonPath(zone.adcode)).then(
                    res => res.json()
                )
                const res = []
                for (let code of data.children) {
                    res.push({
                        adcode: code,
                        value: Math.random()
                    })
                }

                if (res.length > 0) await this.render(res)
                this.clickHandling = false
            }
        }
    }

    handleHover({ mouseCoord, updateText }) {
        const intersects = this.getObjsAtCoord(mouseCoord, this.areaList)

        if (intersects && intersects.length > 0) {
            const obj = intersects[0].object
            updateText(`${obj.name}\n${obj.value}`)
            if (obj !== this.hoverZone) {
                //悬浮高亮处理
                if (this.hoverZone) {
                    this.removeHover(this.hoverZone.material)
                    this.hoverZone.material.needsUpdate = true
                }
                this.addHover(obj.material)
                obj.material.needsUpdate = true
                this.hoverZone = obj
            }
        } else if (this.hoverZone) {
            this.removeHover(this.hoverZone.material)
            this.hoverZone.material.needsUpdate = true
            this.hoverZone = null
        }
    }

    zoomHandling = false
    async handleZoom() {
        const zoom = this.map.getZoom()
        const firstAreaMesh = this.areaList.children[0]
        const level = firstAreaMesh.level
        //上卷操作
        if (
            (level === 'district' && this.lastRenderZoom - zoom > 1) ||
            (level === 'city' && this.lastRenderZoom - zoom > 1.5)
        ) {
            if (this.zoomHandling) return

            this.zoomHandling = true

            const firstZoneData = await fetch(
                genGeoJsonPath(firstAreaMesh.adcode)
            ).then(res => res.json())

            const data = await fetch(
                genGeoJsonPath(
                    firstZoneData.acroutes[firstZoneData.acroutes.length - 2]
                )
            ).then(res => res.json())

            const res = []
            for (let code of data.children) {
                res.push({
                    adcode: code,
                    value: Math.random()
                })
            }

            if (res.length > 0) await this.render(res)
            this.zoomHandling = false
        }

        //根据zoom调整center点大小
        for (let zc of this.zoneCentroidList.children) {
            const scaleRatio = this.initZoom / this.camera.zoom
            zc.scale.x = scaleRatio
            zc.scale.y = scaleRatio
        }
    }

    addHover(material) {
        material.vertextShader = '#define HOVER\n' + vertexShader
        material.fragmentShader = '#define HOVER\n' + fragmentShader
    }

    removeHover(material) {
        material.vertextShader = vertexShader
        material.fragmentShader = fragmentShader
    }

    getColor(value) {
        const c1 = formatColor(0x87cef9)
        const c2 = formatColor(0xc9e971)
        const c3 = formatColor(0xfefe00)
        const c4 = formatColor(0xffa100)
        const c5 = formatColor(0xff4600)

        const f1 = fade(-0.25, 0.25, value)
        const f2 = fade(0, 0.5, value)
        const f3 = fade(0.25, 0.75, value)
        const f4 = fade(0.5, 1.0, value)
        const f5 = smoothstep(0.75, 1.0, value)

        const color = c1
            ._mul(f1)
            ._add(c2._mul(f2))
            ._add(c3._mul(f3))
            ._add(c4._mul(f4))
            ._add(c5._mul(f5))
        return color
    }
}

export default Areamap

var mockData = [
    {
        adcode: 330100,
        value: Math.random()
    },
    {
        adcode: 330200,
        value: Math.random()
    },
    {
        adcode: 330300,
        value: Math.random()
    },
    {
        adcode: 330400,
        value: Math.random()
    },
    {
        adcode: 330500,
        value: Math.random()
    },
    {
        adcode: 330600,
        value: Math.random()
    },
    {
        adcode: 330700,
        value: Math.random()
    },
    {
        adcode: 330800,
        value: Math.random()
    },
    {
        adcode: 330900,
        value: Math.random()
    },
    {
        adcode: 331000,
        value: Math.random()
    },
    {
        adcode: 331100,
        value: Math.random()
    }
]

// var mockStyle = { colorRange: [] }
