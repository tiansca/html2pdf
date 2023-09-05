const router = require('koa-router')()
const puppeteer = require('puppeteer')
const send = require('koa-send')
const createOnline = require('../utils/createOnline')
const path = require('path')
const crypto = require("crypto");
const saveFile = require('../utils/saveFile')
const moment = require('moment')
const rmdirPromise = require('../utils/rmDir')


// 导出pdf并返回下载链接
router.get('/', async (ctx, next) => {
  ctx.request.socket.setTimeout(60 * 1000);
  let url = 'https://www.baidu.com'
  let fileName = '下载'
  let type = 'preview'
  const headLeft = ctx.query.headLeft
  const headLRight = ctx.query.headRight
  const cover = ctx.query.cover === 'true'
  if (ctx.query.path) {
    url = ctx.query.path
  }
  if (ctx.query.fileName) {
    fileName = ctx.query.fileName
    fileName = fileName.split('.')[0]
  }
  if(ctx.query.type) {
    type = ctx.query.type
  }
  const lazy = ctx.query.lazy || false
  let css = ctx.query.css || ''
  if (css) {
    css = decodeURIComponent(css)
  }
  try {
      const pdfFile = await createOnline(decodeURIComponent(url),  lazy, css, headLeft, headLRight, cover)

    // 已stream传输，前端下载而非预览，自定义文件名
    // ctx.set('Content-Type', 'application/octet-stream')
    // ctx.set("Content-Disposition", "attachment;filename=" + 'report.pdf');
    // await send(ctx, `screen${pdfIndex}.pdf`, {
    //   root:path.resolve(__dirname, '../views/')
    // })

    // 返回文件流
    /*ctx.set('Content-Type', 'application/pdf')
    if (type === 'preview') {
      ctx.set("Content-Disposition", "inline;filename=" + encodeURIComponent(fileName)); // 预览
    } else {
      ctx.set("Content-Disposition", "attachment;filename=" + encodeURIComponent(fileName)); // 下载
    }
    ctx.body = pdfFile*/
    // 保存文件并重定向到下载链接
    // 生成随机文件名
    const newFileName = crypto.randomUUID() + `_${fileName}_${moment().format('YYYYMMDD')}.pdf`
    console.log(__dirname)
    try {
      await saveFile(newFileName, pdfFile)
      ctx.status = 302
      ctx.redirect(`/download?name=${newFileName}&type=${type}&fileName=${fileName}`)
    } catch (e) {
      ctx.response.body = {
        code: -1,
        error: e
      }
    }

    // await
  } catch (e) {
    console.log(e)
    ctx.response.body = {
      code: -1,
      error: e
    }
  }

})

// 下载文件
router.get('/download', async (ctx, next) => {
  const name = ctx.query.name || ''
  const type = ctx.query.type || 'preview'
  let fileName = ctx.query.fileName || '下载'
  fileName = fileName.split('.')[0]
  if (!name) {
    ctx.staus = 404
    ctx.response.body = '文件不存在'
  }
  try {
    if (type === 'preview') {
      ctx.set("Content-Disposition", "inline;filename=" + encodeURIComponent(fileName + '.pdf')); // 预览
    } else {
      ctx.set("Content-Disposition", "attachment;filename=" + encodeURIComponent(fileName + '.pdf')); // 下载
    }
    await send(ctx, name, {
      root:path.resolve(__dirname, '../files/')
    })
  } catch (e) {
    ctx.response.body = {
      code: -1,
      error: e
    }
  }

})

// 在线生成操作页面
router.get('/page', async (ctx, next) => {
  // await ctx.render('index.ejs', {title: 'html2pdf', ip: '47.95.5.207'})  // ip为部署服务器外网ip
  await ctx.render('index.ejs', {title: 'html2pdf', ip: 'localhost'})  // 本地运行ip为localhost
})


router.get('/clear-files', async (ctx, next) => {
  try {
    await rmdirPromise(path.resolve(__dirname, '../files'), false)
    ctx.response.body = {
      code: 0,
      data: '删除成功'
    }
  } catch (e) {
    ctx.response.body = {
      code: -1,
      error: e
    }
  }
})

module.exports = router
