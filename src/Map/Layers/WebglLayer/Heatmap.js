/**
 * data: [
 *  {
 *    coord: [1.0, 1.0],
 *    value: 1.0,
 *  }
 * ]
 *
 * style: {
 *  blur: 1.0,
 *  radius: 1.0,
 * }
 *
 * Created by yaojia7 on 2019/4/28.
 */
import THREE from '../../../three';
import BaseLayer from './index';
import {
    vertexShader,
    fragmentShader,
    RTTShaderPass
} from './shaders/Heatmap';
import testData from './../../../../res/hangzhou-tracks.json';

const mockData = testData.map(i => ({
    coord: i.coord
}));

// const mockData = [];
// const dLon = EXTENT[2] - EXTENT[0];
// const dLat = EXTENT[3] - EXTENT[1];
// for(let i = 0; i < 10000; ++i){
//     mockData.push({
//         coord: [
//             Math.random() * dLon + EXTENT[0],
//             Math.random() * dLat + EXTENT[1],
//         ],
//         // color: [Math.random(), Math.random(), Math.random()],
//         value: Math.random() * 25 + 5
//     })
// }

const mockStyle = {
    radius: 5.0,
    blur: 1
}; //webgl图层的元素样式

// const colorGradient = {
//     0.3: 'blue',
//     0.5: 'lime',
//     0.7: 'yellow',
//     1.0: 'red'
// };

class Heatmap extends BaseLayer{
    constructor(props){
        super(props);
        this.points = null; //Points Mesh
    }

    init(){
        super.init();

        this.rtt = new THREE.WebGLRenderTarget( this.width, this.height );
        this.composer = new THREE.EffectComposer(this.renderer, this.rtt);
        this.composer.setSize(this.width, this.height);
        const renderEffect = new THREE.RenderPass(this.scene, this.camera);
        // renderEffect.renderToScreen = true;
        this.composer.addPass(renderEffect);
        const effect = new THREE.ShaderPass( RTTShaderPass );
        // effect.uniforms.gradientTexture.value = this.createColorGradientTextre()
        effect.renderToScreen = true;
        this.composer.addPass(effect);

        const geometry = new THREE.BufferGeometry();
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uRadius: {
                    type: 'f',
                    value: mockStyle.radius
                },
                uBlurFactor: {
                    type: 'f',
                    value: mockStyle.blur
                },
                uScale: {
                    type: 'f',
                    value: this.map.scale
                },
                originCoord: {
                    type: 'vec2',
                    value: this.worldOriginCoord
                },
                uMax: {
                    type: 'f',
                    value: 1.0
                },
                uMin: {
                    type: 'f',
                    value: 0.0
                }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });

        material.transparent = true;
        material.blending = THREE.CustomBlending;
        material.blendEquation = THREE.AddEquation;
        material.blendSrc = THREE.OneFactor;
        material.blendDst = THREE.OneFactor;
        material.extensions.derivatives = true;

        this.points = new THREE.Points(
            geometry,
            material
        );
        this.points.frustumCulled = false;
        this.scene.add( this.points );
    }

    render(data = mockData, style = mockStyle){
        const positions = [];
        const values = [];

        const {geometry, material} = this.points;

        //geometry
        if(geometry) {
            for (let p of data) {
                positions.push(...p.coord, 0);
                if(p.value) {
                    values.push(p.value);
                }
            }

            geometry.addAttribute(
                'position',
                new THREE.BufferAttribute(
                    new Float32Array(positions),
                    3
                )
            );

            if(values.length > 0) {
                geometry.addAttribute(
                    'value',
                    new THREE.BufferAttribute(
                        new Float32Array(values),
                        1
                    )
                );
            }
        }

        //material
        if(material){
            material.vertexShader = this.genVS(vertexShader);
            material.fragmentShader = this.genFS(fragmentShader);

            if(style.radius)
                material.uniforms.uRadius.value = style.radius;
            if(style.blur)
                material.uniforms.uBlurFactor.value = style.blur;
            if(this.camera)
                material.uniforms.uScale.value = this.map.scale / this.camera.zoom;

            let max = Number.MIN_VALUE;
            let min = Number.MAX_VALUE;
            if(values.length > 0) {
                for (let d of data) {
                    if (d.value > max)
                        max = d.value;
                    if (d.value < min)
                        min = d.value;
                }
            }

            if(max <= min)
                material.fragmentShader = this.genFS(fragmentShader, true);
            else{
                material.uniforms.uMax.value = max;
                material.uniforms.uMin.value = min;
            }
        }

        this.points.geometry.needsUpdate = true;
        this.points.material.needsUpdate = true;
    }

    genVS = (vs) => {
        let res = vs;
        return res;
    };

    genFS = (fs, sameValue = false) => {
        let res = fs;
        if(sameValue)
            res = '#define SAME_VALUE\n' + res;

        return res;
    };

    // createColorGradientTextre = () => {
    //     const canvas = document.createElement('canvas');
    //     canvas.width = 256;
    //     canvas.height = 1;
    //     const ctx = canvas.getContext('2d');
    //     const rect = [0, 0, 256, 1];
    //
    //     const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    //     for(let k in colorGradient)
    //         gradient.addColorStop(parseFloat(k), colorGradient[k]);
    //
    //     ctx.fillStyle = gradient;
    //     ctx.fillRect(...rect);
    //
    //     return new THREE.CanvasTexture(canvas);
    // };

    handleViewChange(extent){
        super.handleViewChange(extent);

        if(this.points && this.points.material)
            this.points.material.needsUpdate = true;
    }

}

export default Heatmap;