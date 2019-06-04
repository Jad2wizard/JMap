/**
 * Created by yaojia7 on 2019/5/8.
 */
import styles from './index.less'

class DOMLayer {
    constructor(props) {
        this.width = props.width || window.innerWidth
        this.height = props.height || window.innerHeight

        this.container = props.container
        if (!this.container) throw 'the container dom is undefined'

        this.map = props.map
        if (!this.map) throw 'the map is undefined'

        this.labelClone = document.createElement('pre')
        this.labelClone.className = styles.label

        this.areaNameClone = document.createElement('span')
        this.areaNameClone.className = styles.areaName
        //manage the area name DOM of the areamap
        this.areaNameList = [
            /**
             * name: '',
             * coord: [],
             * dom: DOM
             */
        ]

        this.animate()
    }

    animate = () => {
        requestAnimationFrame(this.animate)
        for (let area of this.areaNameList) {
            const pos = this.map.transformCoordToPixel(area.coord)
            const areaNameDom = area.dom
            if (areaNameDom) {
                areaNameDom.style.left = pos[0] + 'px'
                areaNameDom.style.top = pos[1] + 'px'
            }
        }
    }

    renderAreaNames(areaList = []) {
        const areaNameDomList = document.querySelectorAll(`.${styles.areaName}`)
        for (let a of areaNameDomList) this.container.removeChild(a)

        this.areaNameList = areaList.slice()
        for (let area of this.areaNameList) {
            let areaNameDom = this.areaNameClone.cloneNode(true)
            areaNameDom.innerText = area.name
            area.dom = areaNameDom
            this.container.appendChild(areaNameDom)
        }
    }

    renderHoverText(text = '', coord) {
        let labelDom = this.container.querySelector(`.${styles.label}`)
        if (labelDom) this.container.removeChild(labelDom)

        if (text) {
            const pos = this.map.transformCoordToPixel(coord)
            labelDom = this.labelClone.cloneNode(true)
            labelDom.innerHTML = text
            labelDom.style.left = pos[0] + 'px'
            labelDom.style.top = pos[1] + 'px'
            this.container.appendChild(labelDom)
        }
    }
}

export default DOMLayer
