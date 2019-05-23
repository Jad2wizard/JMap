/**
 * Created by yaojia7 on 2018/5/9.
 */
import THREE from './three';
import {W_TILE_NUM} from './Earth/constants';
const {min, atan, sinh, sin, tan, cos, log, pow, PI, floor} = Math;
export const MAX_LON = PI - 0.001;
export const MIN_LON = -1 * PI;
export const MAX_LAT = 85.05 * PI / 180;
export const MIN_LAT = -85.05 * PI / 180;
export const MERCATOR_ORIGIN = [MIN_LON,MAX_LAT]; //地球展开为墨卡托投影后，坐标系的原点，即 x=0,y=0 的Tile图片
export const TILE_WIDTH_LON_LIST = []; //每层tile中，单个tile的纬度宽
for(let i = 0; i <= 20; ++i){
    TILE_WIDTH_LON_LIST.push(2 * PI / pow(2, i));
}
/**
 * 经度转换为墨卡托投影坐标系X坐标
 * @param {number} lon
 * @param {number} zoom
 * @return {number}
 */
export const lon2x = (lon, zoom) => {
    if(lon > MAX_LON) lon -= 2 * PI;
    if(lon < MIN_LON) lon += 2 * PI;
    zoom = min(zoom, 19);
    const n = pow(2, zoom);
    return floor(n * (lon + PI) / (2 * PI));
};
/**
 * 纬度转换为墨卡托投影坐标系Y坐标
 * @param {number} lat
 * @param {number} zoom
 * @return {number}
 */
export const lat2y = (lat, zoom) => {
    zoom = min(zoom, 19);
    const n = pow(2, zoom);
    if(lat > MAX_LAT) return 0;
    if(lat < MIN_LAT) return n - 1;
    return floor((1.0 - log(tan(lat) + 1/cos(lat)) / PI) * n / 2);
};
/**
 * 获取某个zoom下，一个Tile图片的度跨度
 * @param {number} zoom
 * @return {number}
 */
export const lonStep = (zoom) => {
    zoom = min(zoom, 19);
    const n = pow(2, zoom);
    return (MAX_LON - MIN_LON) / n;
};
/**
 * 获取某个tile对应的经纬度区域
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @return {Object} | {north_lat, west_lon, south_lat, east_lon}
 */
export const tile2LonLat = (x, y, z) => {
    z = min(z, 19);
    const n = pow(2, z);
    if(x > n - 1 || x < 0) return null;
    if(y > n - 1 || y < 0) return null;
    let northLat = y === 0 ? Math.PI / 2 : atan(sinh(PI * (1 - 2 * y / n)));
    let westLon =  2 * PI * x / n - PI;
    let southLat = y === (n - 1) ? -1 * PI / 2 : atan(sinh(PI * (1 - 2 * (y + 1) / n)));
    let eastLon = westLon + lonStep(z);
    return {northLat, westLon, southLat, eastLon};
};
const numX = (minX, maxX, n) => {
    if(maxX > minX) return maxX - minX + 1;
    return maxX - minX + n + 1;
};

/**
 * 根据给定的经纬度范围以及地图zoom，计算覆盖该范围需要的各个Tile图片的编号
 * @param {number} northLat
 * @param {number} eastLon
 * @param {number} southLat
 * @param {number} westLon
 * @param {number} zoom
 * @return {Object}
 */
export const computeTiles = (northLat, eastLon, southLat, westLon, zoom) => {
    if(northLat < southLat) return {};
    const n = Math.pow(2, zoom);
    let minX = lon2x(westLon, zoom);
    let maxX = lon2x(eastLon, zoom);
    let minY = lat2y(northLat, zoom);
    let maxY = lat2y(southLat, zoom);
    console.log('minY: ', minY);
    console.log('maxY: ', maxY);

    //因为地图纹理长宽必须为2的n次幂，故对tile区域进行调整
    let flag = true; //设置flag在可视区域边界上下或者左右交替增加tile
    while(!isInteger(Math.log2(numX(minX, maxX, n)))){
        if(flag) {
            if(minX === 0)
                minX = n - 1;
            if(numX(minX, maxX, n) < W_TILE_NUM)
                minX--;
            else
                minX++;
            flag = false;
            continue;
        } else {
            if(numX(minX, maxX, n) < W_TILE_NUM)
                maxX++;
            else
                maxX--;
            flag = true;
            continue;
        }
    }
    minX = minX % n;
    maxX = maxX % n;

    flag = true;
    while(!isInteger(Math.log2(maxY - minY + 1)) || (maxY - minY + 1) < 8){
        if(flag) {
            minY--;
            flag = false;
            continue;
        }
        if(!flag) {
            maxY++;
            flag = true;
            continue;
        }
    }
    return {minX: minX % n, maxX: maxX % n, minY: minY % n, maxY: maxY % n};
};

const isInteger = num => num % 1 === 0;

/**
 * 世界坐标系转经纬度
 * @param {*} vector
 * @return {Array}
 */
export const world2LonLat = (vector) => {
    const {x, y, z} = vector;
    let xz = new THREE.Vector2(x, z).length();
    let lat = atan(y/xz);
    let lon = atan(x/z);
    if(x > 0 && z < 0){
        lon += PI;
    }
    if(x < 0 && z < 0){
        lon = lon - PI;
    }
    return [lon, lat];
};

/**
 * 经纬度转世界坐标
 * @param number lon | 角度值
 * @param number lat | 角度值
 * @param number radius
 * @returns {THREE.Vector3}
 */
export const lonLat2World = ([lon, lat], radius) => {
    try{
        const y = sin(lat * PI / 180) * radius;
        const xz = cos(lat * PI / 180) * radius;
        const z = cos(lon * PI / 180) * xz;
        const x = sin(lon * PI / 180) * xz;
        return new THREE.Vector3(x, y, z);
    } catch(e){
        console.log(e);
        return new THREE.Vector3(0, 0, 0);
    }
};

export const runGenerator = (iter) => {
    let lastRes = iter.next();
    const go = (res) => {
        if(res.done) return lastRes.value;
        lastRes = res;
        return res.value.then(() => go(iter.next()));
    };
    return go(lastRes);
};

export const deltaLon = (lonA, lonB) => {
    if(lonA * lonB > 0) return Math.abs(lonA - lonB);
    return Math.abs(lonA - lonB + 2 * PI) % (2 * PI);
};

