console.log(process.env.NODE_ENV)
if(!process.env.NODE_ENV){
    process.env.NODE_ENV = 'development';
}

const Koa = require('koa');
const path = require('path');
const fs = require('fs');
const koaStatic = require('koa-static');
const bodyParser = require('koa-bodyparser');
const config = JSON.parse(fs.readFileSync('./config.json'));
const app = new Koa();


const NODE_ENV = process.env.NODE_ENV;

// 配置热加载
if(NODE_ENV == 'development' && config.hotUpdate) {
    const webpackHotMiddleware = require('koa-webpack-hot-middleware');
    const webpackDevMiddleware = require('koa-webpack-dev-middleware');
    const webpack = require('webpack');
    let webpackConfig = require(path.resolve(__dirname, './webpack.config'));
    if(typeof webpackConfig == 'function') {
        webpackConfig = webpackConfig({}, {mode: NODE_ENV});
    }
    const compiler = webpack(webpackConfig);
    app.use(webpackDevMiddleware(compiler, {
        noInfo: false,
        quiet: false,
        publicPath: webpackConfig.output.publicPath
    }));
    app.use(webpackHotMiddleware(compiler, {}));
}

app.use(async (ctx, next) => {
    if(ctx.request.path.includes('test')){
        setImmediate(() => {
            throw(new Error('uncaught error'));
        });
    }

    await next();
});


app.use(bodyParser({
    formLimit: '5000kb'
}));

//静态路由中间件
app.use(koaStatic(
    path.join(__dirname , './res')
));

// 初始化路由中间件
app.use(async (ctx, next) => {
    if(ctx.method === 'GET' && ctx.request.path.includes('daping/tiles')){
        await getTile(ctx);
    } else if(ctx.method === 'POST' && ctx.request.path.includes('tile')){
        await postTile(ctx);
    }

    await next();
});

app.use(async (ctx) => {
    ctx.response.type = 'html';
    ctx.response.body = fs.createReadStream('./res/index.html');
});

app.listen(config.port);
console.log(`Listening on ${config.port}...`);

const postTile = async (ctx) => {
    try {
        const filename = ctx.request.body.filename;
        const data = ctx.request.body.data;
        const dataBuffer = new Buffer(data, 'base64');
        const tileFile = path.resolve(TILE_PATH, filename);
        if (fs.existsSync(tileFile)) {
            fs.unlinkSync(tileFile);
        }
        fs.writeFileSync(tileFile, dataBuffer);
        ctx.body = '1'
    }catch(error){
        console.error(error);
        ctx.throw(500);
    }
};

const getTile = async ctx => {
    try{
        const reqPath = ctx.request.path;
        ctx.type = 'image/png';
        const zxy = reqPath.match(/([^\/]+)$/g)[0].match(/.*(?=\.png)/g)[0].split('_');
        const tileFile = path.resolve(TILE_PATH, `${zxy.join('_')}.png`);
        if(fs.existsSync(tileFile)){
            ctx.body = fs.createReadStream(tileFile);
        } else {
            ctx.throw(404);
        }
    }catch (e){
        if(ctx.status) ctx.throw(ctx.status);
        console.log(e);
        ctx.throw(500);
    }
};

