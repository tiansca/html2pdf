const puppeteer = require('puppeteer')
const Path = require('path')
const sleep = require('../utils/sleep')
const toPdf = require('./toPdf')
const mergePdf = require('../utils/mergePdf')

const createOnline = async (path, lazy, css, headLeft, headRight, cover, pageRange = '1-') => {
  // path 网页链接
  // lazy 是否懒加载
  // css 添加指定的css样式
  // headLeft 页面左侧文案
  // headRight 页面右侧文案
  // cover 是否为封面，封面页边距为0并且无页眉页脚
  // pageRange 打印范围，默认整个文档
  console.log('url', path)
  const pdfIndex = Math.round(Math.random() * 10)
  const browser = await puppeteer.launch({
    // args: ['--no-sandbox'],
    args: [
      '--disable-dev-shm-usage', // docker部署时，这将会写入共享内存文件/tmp而不是/dev/shm.
      // '--disable-gpu',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--no-first-run',
      '--no-zygote',
      '-disable-features=site-per-process',  //禁用站点单独进程 如页面嵌套iframe需要
      '–disable-infobars', // 关闭自动化提示框
    ],
    headless: true
    // args: ['--disable-setuid-sandbox', '--no-sandbox'],
    // args: ['--disable-setuid-sandbox', '--no-sandbox', '--disable-dev-shm-usage'],
  });
  // const pages1 = await browser.pages()
  // if (pages1 && pages1.length > 0) {
  //   for (let b = 0; b < pages1.length; b++) {
  //     await pages1[b].close()
  //   }
  // }
  let page = null
  try {
    page = await browser.newPage();
    page.setViewport({width: 800, height: 1080})
  }  catch (e) {
    console.log('newPageError', e)
    await browser.close();
    return Promise.resolve(e)
  }

  try {
    await page.goto(path, {
      waitUntil: ['load', // Remove the timeout
        'domcontentloaded',  //等待 “domcontentloaded” 事件触发
        'networkidle0', // 500ms内请求数不超过0个
      ],
      timeout: 1000 * 60,
    })
  } catch (e) {
    console.log('gotoError', e)
    await page.close()
    browser.close()
    return Promise.resolve(e)
  }
  // await page.emulateMediaType('screen');
  let cssContent = 'tr,img,canvas,code,pre,span,p,li{page-break-inside:avoid!important;break-inside: avoid!important}.Modal-wrapper{display: none!important;opacity: 0;}'
  if (css) {
    cssContent = `${cssContent}${css}`
  }
  await page.addStyleTag({
    content: cssContent
  })
  // await sleep(500)
  // await page.waitForNavigation();
  console.log('lazy', lazy)
  const dimensions = await page.evaluate(async (lazy) => {
    const Sleep = function (time){
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('')
        }, time || 1000)
      })
    }
    const widthArr = []
    const bodyWidth = document.querySelector("body")
    const htmlWidth = document.querySelector("html")
    const appWidth = document.querySelector("#app")
    const wrapperWidth = document.querySelector("#wrapper")
    const wrapWidth = document.querySelector("#wrap")
    if (bodyWidth) {
      widthArr.push(bodyWidth.scrollWidth)
    }
    if (htmlWidth) {
      widthArr.push(htmlWidth.scrollWidth)
    }
    if (appWidth) {
      widthArr.push(appWidth.scrollWidth)
    }
    if (wrapperWidth) {
      widthArr.push(wrapperWidth.scrollWidth)
    }
    if (wrapWidth) {
      widthArr.push(wrapWidth.scrollWidth)
    }
    widthArr.sort()
    console.log('lazy', lazy)
    let page = 0
    if (lazy) {
      // 滚动页面，显示懒加载图片
      const height = document.body.scrollHeight
      page = Math.ceil(height / 1080)
      if (page < 30) {
        for (let a = 0; a < page; a++) {
          window.scrollTo({
            top: (a + 1) * 1080,
            left: 0,
            // behavior: 'smooth'
          })
          console.log(top)
          await Sleep(200)
        }
        window.scrollTo({
          top: 0,
          left: 0
        })
        await Sleep(5000)
      }

    }
    return {
      arr: widthArr,
      width: widthArr[widthArr.length - 1],
      height: document.body.scrollHeight,
      deviceScaleFactor: window.devicePixelRatio,
      page
    };
  }, lazy);
  // await sleep(2000)
  const headerTemplate = `<div
        style="width: 595px;height: 30px;box-sizing: border-box;color: #fff;font-size:12px;padding:0  10px;display: flex; align-items: center;justify-content: space-between;background-color: #5897fa;-webkit-print-color-adjust:exact;position: fixed;top: 0">
        <div style="width: 100%; display: flex;justify-content: space-between">
          <span>${headLeft}</span>
          <span>${headRight}</span>
        </div>
        
        </div>`
  const footerTemplate = '<div style="box-sizing: border-box;height: 18px;text-align: right;width: 595px;padding-right: 20px;font-size: 10px; margin-bottom: -10px;color: #666"> <span class="pageNumber"></span> / <span class="totalPages"></span> </div>'

  const showHeader = !!headLeft || !!headRight
  const defaultMargin = {
    top: showHeader? 50 : 30,
    bottom: showHeader?  40 : 30,
    left: 20,
    right: 20,
  }
  const coverMargin = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }
  let pdfFile = ''
  if (!cover) {
    console.log()
    // 正常导出
    try {
      pdfFile = await toPdf(page, {
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
          fullPage: true,
          displayHeaderFooter: showHeader,
          headerTemplate,
          footerTemplate,
          margin: defaultMargin,
          scale: 1,
          pageRanges: '1-'
      })
    } catch (e) {
      console.log(e)
      pdfFile = Promise.reject(e)
    }
  } else {
    try {
      const res = await Promise.all([toPdf(page, {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        fullPage: true,
        displayHeaderFooter: false,
        headerTemplate,
        footerTemplate,
        margin: coverMargin,
        scale: 1,
        pageRanges: '1'
      }), toPdf(page, {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        fullPage: true,
        displayHeaderFooter: showHeader,
        headerTemplate,
        footerTemplate,
        margin: defaultMargin,
        scale: 1,
        pageRanges: '2-'
      })])
      pdfFile = await mergePdf(res)
    } catch (e) {
      console.log(e)
      pdfFile = Promise.reject(e)
    }
  }
  page.close()
  browser.close()
  console.log(dimensions)
  return pdfFile
}
module.exports = createOnline
