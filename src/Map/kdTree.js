/**
 * Created by yaojia7 on 2019/5/9.
 */
import { kdTree } from 'kd-tree-javascript/kdTree.js';


class KDTree{
    constructor(points, distance){
        this.refresh(points);
        this.distance = distance;
    }

    refresh(points){
        this.tree = new kdTree(points.map(p => ({
            ...p,
            lon: p.coord[0],
            lat: p.coord[1]
        })), this.distance, ['lon', 'lat']);
        window.tree = this.tree;
    }

    nearest(coord){
        if(!this.tree.root)
            return [];

        const nearestPoints = this.tree.nearest({lon: coord[0], lat: coord[1]}, 10);

        return nearestPoints
            .filter(p => p[1] < 0)
            .map(p => p[0]);
    }
}

export default KDTree;
