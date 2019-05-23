/**
 * Created by yaojia7 on 2019/5/9.
 */
import { distance, randomOrderArr } from './utils';

class Node{
    constructor(props){
        this.lon = props.coord[0];
        this.lat = props.coord[1];
        this.radius = props.size;
        this.data = props;
        this.rt = props.rt || null; //右上节点
        this.lt = props.lt || null; //左上节点
        this.lb = props.lb || null; //左下节点
        this.rb = props.rb || null; //右下节点
    }

    inCircle(trgLon, trgLat){
        return distance(
            [this.lon, this.lat],
            [trgLon, trgLat]
        ) < this.radius
    }
}

class QuadTree{
    constructor(points){
        this.initTree(points);
        this.root = null;
    }

    initTree(points){
        const randOrderPoints = randomOrderArr(points);

        this.root = new Node(randOrderPoints[0]);

        for(let point of randOrderPoints.slice(1, randOrderPoints.length)){
            this.insertNode(point);
        }

    }

    // findPoints(coord){
    //     const res = [];
    //     let parent = this.root;
    //
    //     while(parent){
    //
    //     }
    // }

    insertNode(point){

        function traverse(parent, point){
            const quadrant = this.calcQuadrant(parent, point);
            const child = parent[quadrant];

            if(!child)
                return [parent, quadrant];

            return this.traverse(child, point);
        }

        const [targetParent, quadrant] = traverse(this.root, point);
        targetParent[quadrant] = new Node(point);
    }

    calcQuadrant(parent, point){
        if(
            point.coord[0] > parent.lat &&
            point.coord[1] > parent.lon
        )
            return 'rt';
        if(
            point.coord[0] > parent.lat &&
            point.coord[1] < parent.lon
        )
            return 'lt';
        if(
            point.coord[0] < parent.lat &&
            point.coord[1] > parent.lon
        )
            return 'rb';
        if(
            point.coord[0] < parent.lat &&
            point.coord[1] < parent.lon
        )
            return 'lb';
    }

    clearTree(){
        this.root = null;
    }
}

export default new QuadTree([]);
