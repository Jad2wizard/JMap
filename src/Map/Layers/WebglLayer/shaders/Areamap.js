/**
 * Created by yaojia7 on 2019/5/13.
 */

export const vertexShader = `
    precision mediump float;
    
    void main(){
    
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        
    }
    
`;


export const fragmentShader = `
    precision mediump float;
    
    uniform vec3 uColor;
    uniform vec3 uHoverColor;
    uniform float uOpacity;
    
    void main(){
    
        #ifdef HOVER
            gl_FragColor = vec4(uHoverColor, 1.0);
        #else
            gl_FragColor = vec4(uColor, uOpacity);
        #endif
        
    }
`;
