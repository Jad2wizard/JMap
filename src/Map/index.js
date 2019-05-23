/**
 * Created by yaojia7 on 2019/4/16.
 */
import React from 'react';
import styles from './index.less';
import Map from './Map';
import ScatterLayer from './Layers/WebglLayer/Scatter';
import HeatmapLayer from './Layers/WebglLayer/Heatmap';

export default class extends React.Component{

    constructor(props){
        super(props);
        this.mapDom = null;
    }

    componentDidMount(){
        this.Map = new Map({
            target: this.mapDom,
            ref: this
        });
        this.Map.addLayer(
            new ScatterLayer({
                container: this.mapDom,
                map: this.Map
            })
        );
        this.Map.addLayer(
            new HeatmapLayer({
                container: this.mapDom,
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

