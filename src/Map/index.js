/**
 * Created by yaojia7 on 2019/4/16.
 */
/* eslint-disable */
import React from 'react';
import styles from './index.less';
import Map from './Map';
import ScatterLayer from './Layers/WebglLayer/Scatter';
import HeatmapLayer from './Layers/WebglLayer/Heatmap';
import AreamapLayer from './Layers/WebglLayer/Areamap';

export default class extends React.Component{

    constructor(props){
        super(props);
        this.mapDom = null;
    }

    componentDidMount(){
        this.Map = new Map({
            target: this.mapDom,
            center: [120.134913671875, 28.8082568359375],
            // center: [120.1459, 30.2200],
            zoom: 7.6,
            // zoom: 13,
            ref: this
        });
        // this.Map.addLayer(
        //     new ScatterLayer({
        //         container: this.mapDom,
        //         map: this.Map
        //     })
        // );
        this.Map.addLayer(
            new AreamapLayer({
                map: this.Map
            })
        );
    }

    componentWillUnmount(){
        this.Map.destructor();
    }

    render(){
        return <div
            ref={e => this.mapDom = e}
            className={styles.container}
        >
        </div>
    }
}

/* eslint-enable */
