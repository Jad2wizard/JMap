/**
 * data: [
 *  {
 *    coord: [1.0, 1.0],
 *    size: 1.0,
 *    color: [1.0, 1.0, 1.0]
 *  }
 * ]
 *
 * style: {
 *  color: 1.0,
 *  size: 1.0
 * }
 *
 * Created by yaojia7 on 2019/4/28.
 */
import THREE from '../../../three';
import BaseLayer from './index';
import {vertexShader, fragmentShader} from './shaders/Scatter';
import KDTree from './../../kdTree';
import {distance as _distance} from './../../utils';
import {EXTENT, formatColor} from './../../utils';

const mockData = [];
const dLon = EXTENT[2] - EXTENT[0];
const dLat = EXTENT[3] - EXTENT[1];
for(let i = 0; i < 10000; ++i){
    mockData.push({
        coord: [
            Math.random() * dLon + EXTENT[0],
            Math.random() * dLat + EXTENT[1],
        ],
        // color: [Math.random(), Math.random(), Math.random()],
        size: parseInt(Math.random() * 3) + 2
    })
}

const mockStyle = {
    color: [Math.random(), Math.random(), Math.random()],
    size: 24
}; //webgl图层的元素样式

class Scatter extends BaseLayer{
    constructor(props){
        super(props);
        this.points = null; //Points Mesh
        this.kdTree = new KDTree([], this.distance);

    }

    init(){
        super.init();
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColor: {
                    type: 'vec4',
                    value: [0.0, 0.0, 0.0, 0.0]
                },
                uSize: {
                    type: 'f',
                    value: 15.0
                },
                uScale: {
                    type: 'f',
                    value: this.map.scale
                },
                originCoord: {
                    type: 'vec2',
                    value: this.worldOriginCoord
                }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });

        material.extensions.derivatives = true;

        this.points = new THREE.Points(
            geometry,
            material
        );
        this.points.frustumCulled = false;
        this.scene.add( this.points );
    }

    render(data = mockData, style = mockStyle){
        const colors = [];
        const sizes = [];
        const positions = [];

        this.kdTree.refresh(data);

        const {geometry, material} = this.points;

        //geometry
        if(geometry) {
            for (let p of data) {
                positions.push(...p.coord, 0);
                if (p.color)
                    colors.push(...p.color);
                if (p.size)
                    sizes.push(p.size);
            }

            geometry.addAttribute(
                'position',
                new THREE.BufferAttribute(
                    new Float32Array(positions),
                    3
                )
            );

            if (colors.length > 0)
                geometry.addAttribute(
                    'color',
                    new THREE.BufferAttribute(
                        new Float32Array(colors),
                        3
                    )
                );

            if (sizes.length > 0)
                geometry.addAttribute(
                    'size',
                    new THREE.BufferAttribute(
                        new Float32Array(sizes),
                        1
                    )
                );
        }

        //material
        if(material){
            material.vertexShader = this.genVS(vertexShader, colors, sizes);
            material.fragmentShader = this.genFS(fragmentShader, colors);

            if(style.color)
                material.uniforms.uColor.value = formatColor(style.color);
            if(style.size)
                material.uniforms.uSize.value = style.size;
            if(this.camera)
                material.uniforms.uScale.value = this.map.scale / this.camera.zoom;
        }

        this.points.geometry.needsUpdate = true;
        this.points.material.needsUpdate = true;
    }

    genVS = (vs, colors, sizes) => {
        let res = vs;
        if(colors.length > 0)
            res = '#define USE_ATTRIBUTE_COLOR\n' + res;
        if(sizes.length > 0)
            res = '#define USE_ATTRIBUTE_SIZE\n' + res;

        return res;
    };

    genFS = (fs, colors) => {
        let res = fs;
        if(colors.length > 0)
            res = '#define USE_ATTRIBUTE_COLOR\n' + res;

        return res;
    };

    handleViewChange(extent){
        super.handleViewChange(extent);

        if(this.points && this.points.material)
            this.points.material.needsUpdate = true;
    }

    distance = (a, b) => {
        return _distance([a.lon, a.lat], [b.lon, b.lat]) * this.map.scale - b.size;
    };

    //返回当前鼠标指向的所有点
    handleHover(mouseCoord, labels){
        const hoverPoints = this.kdTree.nearest(mouseCoord);
        labels.push(...hoverPoints);
    }
}

export default Scatter;