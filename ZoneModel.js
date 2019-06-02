const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dbConfig = {
    HOST: 'localhost',
    PORT: 27017,
    DATABASE: 'Geo',
    USERNAME: '',
    PASSWORD: ''
}

const connectDB = uri =>
    new Promise((resolve, reject) => {
        mongoose.connection
            .on('error', error => reject(error))
            .on('close', () => {})
            .on('open', () => resolve(mongoose.connection))
        mongoose.connect(uri)
    })

connectDB(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DATABASE}`)

const model = mongoose.model(
    'zone',
    new Schema({
        adcode: {
            type: String,
            required: true
        },
        telecode: {
            type: String,
            default: ''
        },
        level: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        parent: {
            type: String,
            default: ''
        },
        children: {
            type: Array,
            default: []
        },
        geoType: {
            type: String,
            required: true
        },
        center: {
            type: Array,
            default: []
        },
        centroid: {
            type: Array,
            default: []
        },
        acroutes: {
            type: Array,
            default: []
        },
        coordinates: {
            type: Array,
            default: []
        }
    })
)

const add = async content => {
    const newZone = new model(content)
    await newZone.save().catch(err => {
        console.error(err)
    })
}

const find = adcode =>
    new Promise((resolve, reject) => {
        model.findOne({ adcode }, {}, (err, zone) => {
            if (err) {
                reject(err)
            } else {
                resolve(zone)
            }
        })
    })

module.exports = { add, find }
