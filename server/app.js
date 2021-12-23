const Koa = require('koa')
const router = require('koa-router')()
const cors = require('koa2-cors')
const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')
const static = require('koa-static')
const dbo = require('./db.js')
const path = require('path')
const fs = require('fs')

const app = new Koa()
// 跨域
app.use(cors())
// 静态文件
app.use(static(`${process.cwd()}/static`))
// 上传文件
app.use(koaBody({
    // 支持文件格式
    multipart: true,
    formidable: {
        maxFileSize: 200*1024*1024,
        // 保留文件扩展名
        keepExtensions: true
    }
}))
// 上传表单（有对象有文件（图片））
router.post('/add', async (ctx) => {
    let { title, slogo, evaluate, labels, rating, friend } = ctx.request.body
    // 处理收藏状态
    let collected = false
    if (friend) {collected = true}
    // 保存图片
    const file = ctx.request.files.file
    const basename = path.basename(file.path)
    const reader = fs.createReadStream(file.path)
    let filePath = process.cwd() + `/static/${basename}`
    const upStream = fs.createWriteStream(filePath)
    reader.pipe(upStream)
    // 图片保存后的地址
    let pic = `${ctx.origin}/${basename}`
    // 将信息保存到数据库
    let data = new dbo({
        title, pic, slogo, evaluate, labels, rating, collected
    })
    data.save(err => {
        if (err) throw err
    })
})
// 获取列表
router.get('/top25', async (ctx) => {
    let start = ctx.query.start || 0
    let limit = ctx.query.limit || 5
    let data = await dbo.find().skip(Number(start)).limit(Number(limit))
    let total = await dbo.find().count()
    ctx.body = {
        code: 200,
        total,
        res: data,
        msg: 'get /top25'
    }
})
// 收藏
router.post('/collected', async ctx => {
    const id = ctx.request.body.id
    const data  = await dbo.find({_id: id})
    let coll = !data[0].collected
    let res = await dbo.updateOne({_id: id}, {collected: coll})
    if (res.modifiedCount) {
        ctx.body = {
            code: 200,
            msg: '修改收藏状态成功'
        }
    } else {
        ctx.body = {
            code: 400,
            msg: '修改收藏状态失败'
        }
    }
})
// 删除
router.post('/delete', async ctx => {
    const id = ctx.request.body.id
    let res = await dbo.deleteOne({_id: id})
    if (res.deletedCount) {
        ctx.body = {
            code: 200,
            msg: '删除成功'
        }
    } else {
        ctx.body = {
            code: 400,
            msg: '删除失败'
        }
    }
})
// 详情页(获取_id对应的数据)
router.get('/detail', async ctx => {
    let id = ctx.query.id
    let data = await dbo.find({_id: id})
    ctx.body = {
        code: 200,
        data,
        msg: 'success 详情页'
    }
})


// post参数获取
app.use(bodyParser())
app.use(router.routes())
app.listen(8080)
