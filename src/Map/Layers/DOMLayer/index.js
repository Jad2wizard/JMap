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

        this.labelClone = document.createElement('div');
        this.labelClone.className = styles.label;
    }

    render(labels, coord){
        let labelDom = this.container.querySelector(`.${styles.label}`);
        if(labelDom)
            this.container.removeChild(labelDom);

        if(labels.length > 0) {
            const pos  = this.transformCoordToScreen(coord);
            let text = '';
            for (let l of labels)
                text += `经纬度: ${l.coord[0]}-${l.coord[1]}<br>`;

            labelDom = this.labelClone.cloneNode(true);
            labelDom.innerHTML = text;
            labelDom.style.left = pos[0] + 'px';
            labelDom.style.top = pos[1] + 'px';
            labelDom.style.transform = 'translateX(-50%) translateY(-100%)';
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

