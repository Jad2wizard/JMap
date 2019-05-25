/**
 * Created by yaojia on 2019/5/24.
 */

import THREE from './../../../three';
import Base from './index';
import {
    vertexShader,
    fragmentShader
} from './shaders/Areamap';
import {
    genGeoJsonPath,
    formatColor,
    _fetch
} from './../../utils';
import {
    fade,
    smoothstep
} from './../../Math';

window.three = THREE;
class Areamap extends Base{
    constructor(props){
        super(props);
        this.zoneList = [];
        this.hoverZone = null; //鼠标悬浮的区域Mesh
    }

    init(){
        super.init();
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
        });
        this.material.transparent = true;
        this.material.extensions.derivatives = true;
    }

    async render(data = mockData, style = mockStyle){
        console.log(style);

        this.zoneList = [];
        const maxValue = Math.max(...data.map(i => i.value || 1));
        const minValue = Math.min(...data.map(i => i.value || 0));

        for(let zone of data){
            if(zone.adcode){
                const value = zone.value ? ( zone.value - minValue ) / ( maxValue - minValue ) : 1;
                const material = this.material.clone();
                const color = this.getColor(value);
                material.uniforms.uColor.value = color;
                material.needsUpdate = true;

                const res = await _fetch(genGeoJsonPath(zone.adcode));
                const geoData = res.features[0];
                const pts = [];
                for(let p of geoData.geometry.coordinates[0]){
                    pts.push(
                        new THREE.Vector2(...this.transformCoordToWorld(p))
                    )
                }

                const zoneMesh = new THREE.Mesh(
                    new THREE.ShapeBufferGeometry(
                        new THREE.Shape(pts)
                    ),
                    material
                );
                zoneMesh.adcode = zone.adcode;
                zoneMesh.name = geoData.properties.name;
                zoneMesh.value = zone.value;
                zoneMesh.level = geoData.properties.level;
                zoneMesh.zoneCenter = geoData.properties.center;
                this.zoneList.push(zoneMesh);
                this.scene.add(zoneMesh);
            }
        }
    }

    handleHover({mousePos, updateText}){
        const [x, y] = mousePos;
        const vector = {
            x: 2 * ( x / this.width ) - 1,
            y: -2 * ( y / this.height ) + 1
        };
        const rayCaster = new THREE.Raycaster();
        rayCaster.setFromCamera( vector, this.camera );
        const intersects = rayCaster.intersectObjects(this.scene.children);
        if(intersects && intersects.length > 0){
            const obj = intersects[0].object;
            updateText(`${obj.name}\n${obj.value}`);
            if(obj !== this.hoverZone) {
                //悬浮高亮处理
                if(this.hoverZone){
                    this.removeHover(this.hoverZone.material);
                    this.hoverZone.material.needsUpdate = true;
                }
                this.addHover(obj.material);
                obj.material.needsUpdate = true;
                this.hoverZone = obj;
            }
        } else if(this.hoverZone){
            this.removeHover(this.hoverZone.material);
            this.hoverZone.material.needsUpdate = true;
            this.hoverZone = null;
        }
    }

    addHover(material){
        material.vertextShader = '#define HOVER\n' + vertexShader;
        material.fragmentShader = '#define HOVER\n' + fragmentShader;
    }

    removeHover(material){
        material.vertextShader = vertexShader;
        material.fragmentShader = fragmentShader;
    }

    getColor(value){
        const c1 = formatColor(0xff4600);
        const c2 = formatColor(0xffa100);
        const c3 = formatColor(0xfefe00);
        const c4 = formatColor(0xc9e971);
        const c5 = formatColor(0x87cef9);
        const f1 = fade(-0.25, 0.25, value);
        const f2 = fade(0, 0.5, value);
        const f3 = fade(0.25, 0.75, value);
        const f4 = fade(0.5, 1.0, value);
        const f5 = smoothstep(0.75, 1.0, value);

        const color = c1._mul(f1)
            ._add(c2._mul(f2))
            ._add(c3._mul(f3))
            ._add(c4._mul(f4))
            ._add(c5._mul(f5));
        return color;
    }
}

export default Areamap;

var mockData = [
    {
        adcode: 330102,
        value: Math.random()
    },
    {
        adcode: 330103,
        value: Math.random()
    },
    {
        adcode: 330104,
        value: Math.random()
    },
    {
        adcode: 330105,
        value: Math.random()
    },
    {
        adcode: 330106,
        value: Math.random()
    },
    {
        adcode: 330108,
        value: Math.random()
    },
    {
        adcode: 330109,
        value: Math.random()
    },
    {
        adcode: 330110,
        value: Math.random()
    },
    {
        adcode: 330111,
        value: Math.random()
    },
    {
        adcode: 330122,
        value: Math.random()
    },
    {
        adcode: 330127,
        value: Math.random()
    },
    {
        adcode: 330182,
        value: Math.random()
    },
    {
        adcode: 330185,
        value: Math.random()
    },
];

var mockStyle = {colorRange: []};
