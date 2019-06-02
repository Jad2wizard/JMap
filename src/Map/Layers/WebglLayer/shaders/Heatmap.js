/**
 * Created by yaojia7 on 2019/5/13.
 */

export const vertexShader = `
    precision mediump float;
    
    uniform float uScale;
    uniform float uRadius;
    uniform vec2 originCoord;
    
    varying float vValue;
    
    attribute float value;
    
    vec3 transformCoord(vec3);
    
    void main(){
    
        vValue = value;
    
        gl_PointSize = uRadius * 2.0;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4( transformCoord(position), 1.0 );
        
    }
    
    vec3 transformCoord(vec3 coord){
    
        float dLon = coord.x - originCoord.x;
        float dLat = coord.y - originCoord.y;
        
        float x = dLon * uScale;
        float y = dLat * uScale;
        
        return vec3(x, y, 0);
    }
    
`;


export const fragmentShader = `
    precision mediump float;
    
    uniform float uBlurFactor;
    uniform float uMax;//value最大值
    uniform float uMin;
    
    varying float vValue;
    
    float calcAlpha(vec2);
    
    float calcHeatValue(vec2);
    
    float _distance(vec2 coord){
        vec2 xy = 2.0 * coord - 1.0;
        return sqrt(dot(xy, xy));
    }
    
    void main(){
    
        float alpha = calcAlpha(gl_PointCoord);
        
        gl_FragColor = vec4(calcHeatValue(gl_PointCoord), 0.0, 0.0, 1.0) * alpha;
    }
    
    float calcAlpha(vec2 pointCoord){
    
        float d = _distance(pointCoord);
        float alpha = 1.0;
        float delta = 0.0;
        
        if(d > 1.0){
            discard;
        }
        
        delta = fwidth(d);
        alpha = 1.0 - smoothstep(1.0 - delta, 1.0, d);
        
        return alpha;
    }
    
    float calcHeatValue( vec2 pointCoord){
    
        #ifdef SAME_VALUE
            float value = 0.1;
        #else
            float value = (vValue - uMin) / (uMax - uMin);
        #endif
        
        float dist = _distance(pointCoord);
        
        if(dist > 1.0){
            discard;
        }
        
        return value * clamp( ( 1.0 - dist ) / uBlurFactor, 0.0, 1.0 );
    }
`;

export const GaussianPass = {
    uniforms: {
        tDiffuse: {value: null},
        uResolution: {
            type: 'vec2',
            value: [1, 1]
        }
    },
    vertexShader: `
        varying vec2 vUV;
        
        void main(){
        
            vUV = uv;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragmentShader: `
        precision mediump float;
        
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        
        varying vec2 vUV;
        
        void main(){
            float dx = 1.0 / uResolution.x;
            float dy = 1.0 / uResolution.y;
            
            vec4 c11 = texture2D(tDiffuse, vUV - vec2(1.0 * dx, 1.0 * dy)) * 0.02748805872886607;
            vec4 c12 = texture2D(tDiffuse, vUV - vec2(0.0 * dx, 1.0 * dy)) * 0.11023787943830274;
            vec4 c13 = texture2D(tDiffuse, vUV - vec2(-1.0 * dx, 1.0 * dy)) * 0.02748805872886607;
            vec4 c21 = texture2D(tDiffuse, vUV - vec2(1.0 * dx, 0.0 * dy)) * 0.11023787943830274;
            vec4 c22 = texture2D(tDiffuse, vUV - vec2(0.0 * dx, 0.0 * dy)) * 0.44209706414415373;
            vec4 c23 = texture2D(tDiffuse, vUV - vec2(-1.0 * dx, 0.0 * dy)) * 0.11023787943830274;
            vec4 c31 = texture2D(tDiffuse, vUV - vec2(1.0 * dx, -1.0 * dy)) * 0.02748805872886607;
            vec4 c32 = texture2D(tDiffuse, vUV - vec2(0.0 * dx, -1.0 * dy)) * 0.11023787943830274;
            vec4 c33 = texture2D(tDiffuse, vUV - vec2(-1.0 * dx, -1.0 * dy)) * 0.02748805872886607;
            
            gl_FragColor = c11 + c12 + c13 + c21 + c22 + c23 + c31 + c32 + c33;
        }
    `
};

export const RTTShaderPass = {
    uniforms: {
        tDiffuse: {value: null},
        gradientTexture: {value: null},
    },
    vertexShader: `
        varying vec2 vUv;

        void main() {
        
            vUv = uv;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D gradientTexture;
        
        varying vec2 vUv;

        float fade(float, float, float);
        
        vec3 getColor(float);
        
        vec3 fetchColor(float);
    
        void main() {

            float heatValue = smoothstep( 0.0, 1.0, texture2D(tDiffuse, vUv).r );
            float alpha = heatValue;
            
            gl_FragColor = vec4(getColor(heatValue) * alpha, alpha);
            // gl_FragColor = vec4(fetchColor(heatValue) * alpha, alpha);
            // gl_FragColor = texture2D(tDiffuse, vUv);

        }
        
        vec3 fetchColor(float value){
            return texture2D(gradientTexture, vec2(value, 0.0)).rgb;
        }
        
        float fade(float low, float high, float value){
            float mid = (low + high) / 2.0;
            float range = abs(high - low) / 2.0;
            float x = 1.0 - clamp(abs(mid - value) / range, 0.0, 1.0);
            
            return smoothstep(0.0, 1.0, x);
        }
        
        vec3 getColor(float value){
            vec3 blue = vec3(0.0, 0.0, 1.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            vec3 red = vec3(1.0, 0.0, 0.0);
            
            vec3 color = (
                fade(-0.25, 0.25, value) * blue +
                fade(0.0, 0.5, value) * cyan +
                fade(0.25, 0.75, value) * green +
                fade(0.5, 1.0, value) * yellow +
                smoothstep(0.75, 1.0, value) * red
            );
            
            return color;
        }
    `
};
