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
  if (ctx.query.path) {
    url = ctx.query.path
  }
  const lazy = ctx.query.lazy || false
  console.log('url', url)
  await createOnline(url,  lazy)
  // 已stream传输，前端下载而非预览，自定义文件名
  // ctx.set('Content-Type', 'application/octet-stream')
  // ctx.set("Content-Disposition", "attachment;filename=" + 'report.pdf');
  await send(ctx, 'myResume.pdf', {
    root:path.resolve(__dirname, '../views/')
  })
})

router.get('/download', async (ctx, next) => {
  await send(ctx, 'myResume.pdf', {
    root:path.resolve(__dirname, '../views/')
  })
})
router.get('/page', async (ctx, next) => {
  // await ctx.render('index.ejs', {title: 'html2pdf', ip: '182.92.210.246'})
  await ctx.render('index.ejs', {title: 'html2pdf', ip: 'localhost'})
})

module.exports = router
