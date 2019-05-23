/**
 * Created by yaojia7 on 2019/4/25.
 */
import moment from 'moment';
import {EXTENT, distance, debounce, containsCoordinate} from './utils';

class View {

    constructor(props){

        this.map = props.map;

        this.width = props.width;

        this.bindEvents();

        this.map.on('destroy', this.destructor.bind(this));
    }

    destructor(){
        this.unBindEvent();
    }

    handleClick = (e) => {
        if(!this.enableClick)
            return;

        const coord = this.map.getCoordinateFromPixel([
            e.clientX,
            e.clientY
        ]);

        this.map.emit('click', coord);
    };

    dragging = false;
    startXY = [0, 0]; //记录开始拖动时的鼠标像素坐标
    handleMousedown = e => {
        this.dragging = true;
        this.startXY = [e.clientX, e.clientY];
        e.stopPropagation();
    };

    handleMouseup = e => {
        this.dragging = false;
        if(
            distance(
                [e.clientX, e.clientY],
                this.startXY
            ) > 1
        )
            this.enableClick = false;
        else
            this.enableClick = true;
        e.stopPropagation();
    };

    mouseX = 0;
    mouseY = 0;
    handleMousemove = e => {
        if(this.dragging)
            this.pan(
                -e.clientX + this.mouseX,
                e.clientY - this.mouseY
            );

        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.map.handleMouseCoordUpdate(this.mouseX, this.mouseY);

        e.stopPropagation();
    };

    getPanRatio = () => {
        const extent = this.map.getExtent();
        const lon1 = extent[0];
        const lon2 = extent[2];

        return Math.abs(lon2 - lon1) / this.width;
    };

    pan = (dx, dy) => {
        const panRatio = this.getPanRatio();
        const center = this.map.getCenter();

        const newCenter = [
            center[0] + dx * panRatio,
            center[1] + dy * panRatio
        ];

        if(containsCoordinate(EXTENT, newCenter)) {
            this.map.setCenter(newCenter);
            this.map.emit('viewChange', this.map.getExtent())
        }
    };

    zoomSpeed = 1.0;
    getZoomScale = (s) => {
        return Math.pow(0.95, s * this.zoomSpeed);
    };

    prevTime = moment().valueOf();
    prevDeltaY = 1;

    handleMousewheel = debounce(e => {

        const zoom = this.map.getZoom();
        const time = moment().valueOf();

        const deltaY = e.deltaY / Math.abs(e.deltaY);

        this.map.setZoom(
            zoom *
            this.getZoomScale(deltaY)
        );
        this.map.emit('viewChange', this.map.getExtent());

        this.prevDeltaY = deltaY;
        this.prevTime = time;

        e.stopPropagation();
    }, 50);

    bindEvents = () => {
        window.addEventListener('click', this.handleClick, false);
        window.addEventListener('wheel', this.handleMousewheel, false);
        window.addEventListener('mousedown', this.handleMousedown, false);
        window.addEventListener('mousemove', this.handleMousemove, false);
        window.addEventListener('mouseup', this.handleMouseup, false);
    };

    unBindEvent = () => {
        window.removeEventListener('click', this.handleClick, false);
        window.removeEventListener('wheel', this.handleMousewheel, false);
        window.removeEventListener('mousedown', this.handleMousedown, false);
        window.removeEventListener('mousemove', this.handleMousemove, false);
        window.removeEventListener('mouseup', this.handleMouseup, false);
    };

    enableClick = true;
}

export default View;
