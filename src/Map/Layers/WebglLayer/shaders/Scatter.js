/**
 * Created by yaojia7 on 2019/4/28.
 */

export const vertexShader = `
    uniform vec2 originCoord; //世界空间原点所在的经纬度坐标
    uniform float uSize; //散点的默认半径
    uniform float uScale; //屏幕像素宽度与屏幕区域经度宽度比例
    
    #ifdef USE_ATTRIBUTE_COLOR
        varying vec4 vColor;
        attribute vec3 color;
    #endif
    
    #ifdef USE_ATTRIBUTE_SIZE
        attribute float size;
    #endif
    
    vec3 transformCoord(vec3 coord){
    
        float dLon = coord.x - originCoord.x;
        float dLat = coord.y - originCoord.y;
        
        float x = dLon * uScale;
        float y = dLat * uScale;
        
        return vec3(x, y, 0);
    }
    
    void main(){
    
        #ifdef USE_ATTRIBUTE_COLOR
            vColor = vec4(color, 1.0);
        #endif
        
        #ifdef USE_ATTRIBUTE_SIZE
            gl_PointSize = size * 2.0;
        #else
            gl_PointSize = uSize * 2.0;
        #endif
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4( transformCoord(position), 1.0 );
        
    }
`;

export const fragmentShader = `
    precision mediump float;
    
    uniform vec4 uColor;
    
    #ifdef USE_ATTRIBUTE_COLOR
        varying vec4 vColor;
    #endif
    
    float _distance(vec2 coord){
        vec2 xy = 2.0 * coord - 1.0;
        return dot(xy, xy);
    }
    
    void main(){
        #ifdef USE_ATTRIBUTE_COLOR
            vec4 color = vColor;
        #else
            vec4 color = uColor;
        #endif
    
        float d = _distance(gl_PointCoord);
        float alpha = 1.0;
        float delta = 0.0;
        
        if(d > 1.0){
            discard;
        }
        
        delta = fwidth(d);
        alpha = 1.0 - smoothstep(1.0 - delta, 1.0, d);
        
        gl_FragColor = color * alpha;
    }
`;