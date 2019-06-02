/**
 * Created by yaojia7 on 2019/4/16.
 */
import 'ol/ol.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { Fill, Stroke, Style, Text} from 'ol/style.js';
import {Group as LayerGroup} from 'ol/layer.js';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import {genGeoJsonPath} from './../../utils';

class OlLayer{

    constructor(props){

        this.width = props.width || window.innerWidth;
        this.height = props.height || window.innerHeight;
        this.initCode = props.adcode || 100000;
        this.target = props.target;
        this.postrenderCallback = props.postrenderCallback;

        this.map = null;
        this.view = null;

        this.render();
    }

    async loadUrl(code, full = false){
        try{
            const data = fetch(
                genGeoJsonPath(code, full)
            ).then(data => data.json());

            return data;
        } catch (e){
            console.log(e);
            return null;
        }
    }

    style({fillColor, stroke, textColor}){
        return new Style({
            fill: new Fill({
                color: fillColor
            }),
            stroke: new Stroke({
                color: '#000',
                width: 1,
                lineDash: [5],
                ...stroke
            }),
            text: new Text({
                font: '12px',
                fill: new Fill({
                    color: textColor || '#fff'
                }),
            })
        });
    }

    genGeoLayer = () => {
        const layer = new TileLayer({
            source: new XYZ({
                // url: 'https://api.mapbox.com/styles/v1/doudoulaiye/cj8smxtzfbjx22rs5nwfb7srz/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZG91ZG91bGFpeWUiLCJhIjoiY2oxazN0MTd6MDIxazJxcGptcjhkMGNiYSJ9.N1TxfoQ-kKfKJkGuQ7F42Q'
                url: 'http://localhost:3001/img/tiles/{z}_{x}_{y}.png'
            })
        })

        return new LayerGroup({layers: [layer]});
    };

    render(){
        this.map = new Map({
            interactions: [],
            view: new View({
                center: [120.1459, 30.2200],
                zoom: 13,
                minZoom: 1,
                maxZoom: 19,
                projection: 'EPSG:4326'
            }),
            target: this.target,
            layers: [],
        });
        this.map;

        window.map = this.map;

        this.view = this.map.getView();

        this.getCoordinateFromPixel = this.map.getCoordinateFromPixel.bind(this.map);
        this.on = this.map.on.bind(this.map);
        this.once = this.map.once.bind(this.map);

        this.map.once('postrender', async () => {

            this.map.addLayer(
                this.genGeoLayer()
            );

            //该回调中，frameState.pixelToCoordinateTransform 中存在NaN分量，
            //导致 getCoordinateFromPixel返回NaN。
            //故人为等半秒
            setTimeout(() => {
                if(this.postrenderCallback)
                    this.postrenderCallback();
            }, 500);

        })
    }

}

export default OlLayer;
