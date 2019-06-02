if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development'
}

const Koa = require('koa')
const path = require('path')
const fs = require('fs')
const request = require('request-promise')
const koaStatic = require('koa-static')
const bodyParser = require('koa-bodyparser')
const config = JSON.parse(fs.readFileSync('./config.json'))
const { find } = require('./ZoneModel')

const app = new Koa()
const NODE_ENV = process.env.NODE_ENV

// create geoData folder and tiles folder
const geoDataPath = path.resolve(__dirname, './res/data')
const imgPath = path.resolve(__dirname, './res/img')
const tilePath = path.resolve(__dirname, './res/img/tiles')
if (!fs.existsSync(geoDataPath)) {
    fs.mkdirSync(geoDataPath)
}
if (!fs.existsSync(imgPath)) {
    fs.mkdirSync(imgPath)
}
if (!fs.existsSync(tilePath)) {
    fs.mkdirSync(tilePath)
}

// 配置热加载
if (NODE_ENV == 'development' && config.hotUpdate) {
    const webpackHotMiddleware = require('koa-webpack-hot-middleware')
    const webpackDevMiddleware = require('koa-webpack-dev-middleware')
    const webpack = require('webpack')
    let webpackConfig = require(path.resolve(__dirname, './webpack.config'))
    if (typeof webpackConfig == 'function') {
        webpackConfig = webpackConfig({}, { mode: NODE_ENV })
    }
    const compiler = webpack(webpackConfig)
    app.use(
        webpackDevMiddleware(compiler, {
            noInfo: false,
            quiet: false,
            publicPath: webpackConfig.output.publicPath
        })
    )
    app.use(webpackHotMiddleware(compiler, {}))
}

app.use(async (ctx, next) => {
    if (ctx.request.path.includes('test')) {
        setImmediate(() => {
            throw new Error('uncaught error')
        })
    }

    await next()
})

app.use(
    bodyParser({
        formLimit: '5000kb'
    })
)

//静态路由中间件
app.use(koaStatic(path.join(__dirname, './res')))

//获取GeoJson请求代理
app.use(async (ctx, next) => {
    if (ctx.method === 'GET' && ctx.request.path.startsWith('/areas/bound')) {
        const tmp = ctx.url.split('/')
        const filename = tmp[tmp.length - 1]
        const res = await request({
            url: `${config.geoJsonUrl}${ctx.url}`,
            method: 'GET',
            encoding: null,
            headers: {
                'Content-type': 'text/plain'
            }
        }).then(body => {
            const writeStream = fs.createWriteStream(
                path.resolve(geoDataPath, filename)
            )
            writeStream.write(body, 'binary')
            writeStream.end()
            return body
        })

        ctx.body = res
        ctx.response.type = 'text/plain'
    } else await next()
})

app.use(async (ctx, next) => {
    if (ctx.method === 'GET' && ctx.request.path.includes('/zone/')) {
        await getZoneData(ctx)
    } else {
        await next()
    }
})

// 初始化路由中间件
app.use(async (ctx, next) => {
    if (ctx.method === 'GET' && ctx.request.path.includes('img/tiles'))
        await getTile(ctx)
    else await next()
})

app.use(async ctx => {
    ctx.response.type = 'html'
    ctx.response.body = fs.createReadStream('./res/index.html')
})

app.listen(config.port)
console.log(`Listening on ${config.port}...`)

const getZoneData = async ctx => {
    try {
        const adcode = ctx.request.path.split('zone/')[1]
        console.log(adcode)
        ctx.body = await find(adcode)
    } catch (e) {
        ctx.throw(e.toString())
    }
}

const postTile = (filename, tileData) => {
    try {
        const tileFile = path.resolve(tilePath, filename)
        fs.writeFileSync(tileFile, tileData)
    } catch (error) {
        console.error(error)
    }
}

const getTile = async ctx => {
    try {
        const reqPath = ctx.request.path
        ctx.type = 'image/png'
        const [z, x, y] = reqPath
            .match(/([^\/]+)$/g)[0]
            .match(/.*(?=\.png)/g)[0]
            .split('_')
        const tileUrl = config.tileUrlTemplate
            .replace('{z}', z)
            .replace('{x}', x)
            .replace('{y}', y)

        const res = await request({
            url: tileUrl,
            method: 'GET',
            encoding: null,
            headers: {
                'Content-type': 'image/png'
            }
        }).then(body => {
            const writeStream = fs.createWriteStream(
                path.resolve(tilePath, `${z}_${x}_${y}.png`)
            )
            writeStream.write(body, 'binary')
            writeStream.end()
            return body
        })

        ctx.body = res
        ctx.response.type = 'image/png'
    } catch (e) {
        if (ctx.status) ctx.throw(ctx.status)
        console.log(e)
        ctx.throw(500)
    }
}
