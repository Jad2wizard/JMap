const request = require('request-promise')
const { add } = require('./../ZoneModel')

const delay = (delay = 500) =>
    new Promise(resolve => setTimeout(resolve, delay))

const genUrl = (adcode, full = true) =>
    `https://geo.datav.aliyun.com/areas/bound/${adcode}${
        full ? '_full' : ''
    }.json`

const fetchData = async (adcode, full = true) => {
    try {
        return await request(genUrl(adcode, full)).then(res => JSON.parse(res))
    } catch (e) {
        return null
    }
}

const getChildrenAdcode = async adcode => {
    try {
        const data = await fetchData(adcode)
        return data.features
            .filter(f => f.properties.adcode != 100000)
            .map(f => f.properties.adcode)
    } catch (e) {
        console.log('error adcode: ', adcode)
        console.log(adcode)
        console.log(e)
        return []
    }
}

const getTelecode = async adcode => {
    try {
        const data = await fetchData(adcode, false)
        return data.features[0].properties.telecode
    } catch (e) {
        console.log('error adcode: ', adcode)
        console.log(e)
        return ''
    }
}

async function insertSubZone(adcode, parentTelecode) {
    const fullData = await fetchData(adcode)
    if (fullData) {
        for (let item of fullData.features) {
            const props = item.properties
            const geometry = item.geometry

            if (props.adcode != 100000) {
                const isDistrict = props.level === 'district'

                const telecode = isDistrict
                    ? parentTelecode
                    : await getTelecode(props.adcode)

                const children = isDistrict
                    ? []
                    : await getChildrenAdcode(props.adcode)

                await delay(100)
                console.log(props.adcode)
                await add({
                    adcode: props.adcode,
                    telecode: telecode || '',
                    level: props.level,
                    name: props.name,
                    center: props.center,
                    centroid: props.centroid || props.center,
                    geoType: geometry.type,
                    parent: props.parent.adcode,
                    children: children,
                    acroutes: props.acroutes,
                    coordinates: geometry.coordinates
                })

                if (!isDistrict && props.adcode != 710000)
                    await insertSubZone(props.adcode, telecode)
            }
        }
    }
}

insertSubZone(100000)
