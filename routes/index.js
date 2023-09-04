const router = require('koa-router')()
const puppeteer = require('puppeteer')
const send = require('koa-send')
const createOnline = require('../utils/createOnline')
const path = require('path')


const creat = async (pdf_string) => {
  const browser = await puppeteer.launch({

    args: ['--disable-dev-shm-usage', '--no-sandbox'],

  });

  const page = await browser.newPage();

  await page.setContent(pdf_string)
  // await page.addStyleTag({
  //   content: 'body{padding-right: 50px}'
  // })
  // 添加css样式
  // await page.addStyleTag({
  //
  //   path: 'views/index.css'
  //
  // })
  const dimensions = await page.evaluate(() => {
    return {
      width: document.querySelector("#app").scrollWidth + 100,
      height: document.getElementById("app").scrollHeight + 100,
      deviceScaleFactor: window.devicePixelRatio
    };
  });

  // console.log(dimensions.width)

  await page.pdf({
    format: 'A4',
    path: 'views/myResume.pdf',
    printBackground: true,
    width: dimensions.width,
    margin: {
      top: '0.5cm',
      bottom: '0.5cm',
      left: '0.5cm',
      right: '0.5cm',
    }

  });

  await browser.close();
}

router.get('/', async (ctx, next) => {
  let url = 'https://www.baidu.com'
  let fileName = '下载.pdf'
  let type = 'preview'
  const headLeft = ctx.query.headLeft
  const headLRight = ctx.query.headRight
  const cover = ctx.query.cover === 'true'
  if (ctx.query.path) {
    url = ctx.query.path
  }
  if (ctx.query.fileName) {
    fileName = ctx.query.fileName
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

    ctx.set('Content-Type', 'application/pdf')
    if (type === 'preview') {
      ctx.set("Content-Disposition", "inline;filename=" + encodeURIComponent(fileName)); // 预览
    } else {
      ctx.set("Content-Disposition", "attachment;filename=" + encodeURIComponent(fileName)); // 下载
    }
    ctx.body = pdfFile
  } catch (e) {
    console.log(e)
    ctx.response.body = {
      code: -1,
      error: e
    }
  }

})

router.get('/download', async (ctx, next) => {
  const pdfIndex = ctx.query.index || 0
  await send(ctx, `screen${pdfIndex}.pdf`, {
    root:path.resolve(__dirname, '../views/')
  })
})
router.get('/page', async (ctx, next) => {
  // await ctx.render('index.ejs', {title: 'html2pdf', ip: '47.95.5.207'})  // ip为部署服务器外网ip
  await ctx.render('index.ejs', {title: 'html2pdf', ip: 'localhost'})  // 本地运行ip为localhost
})

module.exports = router
