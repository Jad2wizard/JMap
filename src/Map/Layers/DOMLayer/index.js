/**
 * Created by yaojia7 on 2019/5/8.
 */
import {lonDeltaDeg} from '../../utils';
import styles from './index.less';

class DOMLayer{

    constructor(props){
        this.width = props.width || window.innerWidth;
        this.height = props.height || window.innerHeight;

        this.container = props.container;
        if(!this.container)
            throw('the container dom is undefined');

        this.map = props.map;
        if(!this.map)
            throw('the map is undefined');

        this.labelClone = document.createElement('pre');
        this.labelClone.className = styles.label;
    }

    render(text = '', coord){
        let labelDom = this.container.querySelector(`.${styles.label}`);
        if(labelDom)
            this.container.removeChild(labelDom);

        if(text) {
            const pos  = this.transformCoordToScreen(coord);
            labelDom = this.labelClone.cloneNode(true);
            labelDom.innerHTML = text;
            labelDom.style.left = pos[0] + 'px';
            labelDom.style.top = pos[1] + 'px';
            labelDom.style.transform = 'translateX(-50%) translateY(-150%)';
            this.container.appendChild(labelDom);
        }
    }

    transformCoordToScreen = (coord) => {
        const screen = [0, 0];
        const extent = this.map.getExtent();
        try {
            const coordWidth = lonDeltaDeg(extent[0], extent[2]);
            const coordHeight = Math.abs(extent[1] - extent[3]);
            const {width, height} = this;

            screen[0] = ( coord[0] - extent[0] ) * width / coordWidth;
            screen[1] = (-coord[1] + extent[3] ) * height / coordHeight;

            return screen;
        } catch(e){
            console.log(e);
            return screen;
        }
    };
}

export default DOMLayer;

