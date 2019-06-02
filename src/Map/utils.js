/**
 * Created by yaojia7 on 2019/4/17.
 */
import THREE from '../three';
import * as extent from 'ol/extent';

export const initScene = () => {
    const scene = new THREE.Scene();

    return scene;
}

export const initCamera = ({
    scene,
    initPosition = new THREE.Vector3(0, 0, 100),
    clientWidth = window.innerWidth,
    clientHeight = window.innerHeight,
}) => {
    if(scene){
        const camera = new THREE.OrthographicCamera(
            clientWidth / -2,
            clientWidth / 2,
            clientHeight / 2,
            clientHeight / -2,
            1,
            10000
        );
        camera.position.copy(initPosition);
        camera.lookAt(scene.position);
        return camera;
    }
    return null;
};

export const initRenderer = ({
    canvas,
    enableAntialias = true,
    enableAlpha = true,
    alpha = 0.5,
    clearColor = 0xffffff,
    clientWidth = window.innerWidth,
    clientHeight = window.innerHeight
}) => {
    const renderer = new THREE.WebGLRenderer({
        antialias: enableAntialias,
        alpha: enableAlpha,
        canvas
    });

    renderer.setClearColor(clearColor, alpha);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(clientWidth, clientHeight);
    renderer.autoClear = true;

    const gl = renderer.context;
    if (!gl.getExtension('OES_texture_float')) {
        alert('OES_texture_float not supported');
        throw 'missing webgl extension';
    }

    if (!gl.getExtension('OES_texture_float_linear') ) {
        alert('OES_texture_float_linear not supported');
        throw 'missing webgl extension';
    }

    return renderer;
};

export const render3 = (renderer, scene, camera) => {
    renderer.render(scene, camera);
};

export const debounce = (func, timeout) => {
    let timer = null;
    return function(){
        const args = Array.from(arguments);
        if(timer)
            clearTimeout(timer);

        timer = setTimeout(function(){
            func.apply(this, Array.from(args));
            timer = null;
        }, timeout);
    }
};


export const lonDeltaDeg = (lon1, lon2) => {
    let res = 0;
    if(lon1 * lon2 > 0)
        res =Math.abs(lon2 - lon1);

    else if(lon1 > 0)
        res =(lon2 + 360) - lon1;

    else if(lon2 > 0)
        res = (lon1 + 360) - lon2;

    if(res > 180)
        return 180 - res % 180;
    return res;
};

//计算 westLon 与 eastLon 之间的中间数
export const middleLon = (westLon, eastLon) => {
    const hd = lonDeltaDeg(westLon, eastLon) / 2;
    return ( westLon + hd ) % 180;
};

export const middleLat = (southLat, northLat) => {
    return ( northLat - southLat ) / 2 + southLat;
};

export const calcCenter = (extent) => {
    return [
        middleLon(extent[0], extent[2]),
        middleLat(extent[1], extent[3])
    ]
};

export const containsCoordinate = (_extent, center) => {
    return extent.containsCoordinate(_extent, center);
}

export const distance = (s, e) => {
    try {
        return Math.pow(Math.pow(e[0] - s[0], 2) + Math.pow(e[1] - s[1], 2), 0.5);
    }catch (e){
        console.log(e);
        return 0;
    }
};

//数组乱序
export const randomOrderArr = (arr) => {
    const res = arr.slice();

    for(let i = 0; i < res.length; ++i){
        const randIndex = i + 1 + Math.floor(Math.random() * (res.length - i - 1));
        const tmp = res[i];
        res[i] = res[randIndex];
        res[randIndex] = tmp;
    }

    return res;
};

// export const EXTENT = [119, 29, 121, 31];
export const EXTENT = [73.3, 3.5, 135.3, 53.4];

export const numToColor = (num) => {
    const r = ( num & 0xff0000 ) >> 16;
    const g = ( num & 0x00ff00 ) >> 8;
    const b = num & 0x0000ff;
    return [
        r / 255,
        g / 255,
        b / 255,
    ];
}

export const formatColor = (color) => {
    switch(typeof color){
        case 'number':
            return numToColor(color);
        case 'string':
            return numToColor(
                color.replace('#', '0x')
            );
        case 'object':{
            if(Array.isArray(color)) {
                let res = color.slice();
                if (res.some(i => i > 1))
                    res = res.map(i => i / 255);
                return res;
            }
            return [0, 0, 0];
        }
        default:
            return [0, 0, 0];
    }
}

export const genGeoJsonPath = code => `/zone/${code}`;

export const _fetch = (url) => {
    return fetch(url, {
        method: 'GET',
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        mode: 'cors'
    }).then(res => res.json());
};
