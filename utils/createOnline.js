const puppeteer = require('puppeteer')
const Path = require('path')
const sleep = require('../utils/sleep')

const createOnline = async (path, lazy) => {
  const pdfIndex = Math.round(Math.random() * 10)
  const browser = await puppeteer.launch({
    // args: ['--no-sandbox'],
    args: [
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ]
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
  }  catch (e) {
    await browser.close();
    return
  }

  try {
    await page.goto(path, {
      waitUntil: ['load', // Remove the timeout
        'domcontentloaded',  //等待 “domcontentloaded” 事件触发
        // 'networkidle2', // 500ms内请求数不超过2个
      ],
      timeout: 1000 * 60,
    })
  } catch (e) {
    await page.close()
    await browser.close();
    return
  }
  await page.waitForNavigation();
  await page.addStyleTag({
    content: 'tr,img{page-break-before: always;page-break-inside:avoid;}'
  })
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
    console.log(lazy)
    if (lazy) {
      // 滚动页面，显示懒加载图片
      const height = document.body.scrollHeight
      const page = Math.ceil(height / 700)
      if (page < 30) {
        for (let a = 0; a < page; a++) {
          window.scrollTo({
            top: (a + 1) * 700,
            left: 0,
            behavior: 'smooth'
          })
          await Sleep(500)
        }
      }
    }
    return {
      arr: widthArr,
      width: widthArr[widthArr.length - 1] + 100,
      height: document.body.scrollHeight
    };
  }, lazy);
  await sleep(2000)
  const headerTemplate = `<div
        style="width:80%;margin:0 auto;font-size:8px;border-bottom:1px solid #ddd;padding:10px 0;display: flex; justify-content: space-between;">
        <span>我是页眉</span>
        <span>我也是页眉</span>
        </div>`
  const footerTemplate = `<div 
        style="width:80%;margin:0 auto;font-size:8px;border-top:1px solid #ddd;padding:10px 0;display: flex; justify-content: space-between; ">
        <span style="">我是页脚</span>
        <div><span class="pageNumber">
        </span> / <span class="totalPages"></span></div>
        </div>`
  console.log(Path.resolve(__dirname, '../views/myResume.pdf'))

  await page.pdf({
    // format: 'A4',
    path: Path.resolve(__dirname, `../views/screen${pdfIndex}.pdf`),
    printBackground: true,
    // preferCSSPageSize: true,
    fullPage: true,
    displayHeaderFooter: false,
    headerTemplate,
    footerTemplate,
    margin: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
    width: dimensions.width
  });
  // await page.close()
  const pages = await browser.pages()
  if (pages && pages.length > 0) {
    for (let b = 0; b < pages.length; b++) {
      await pages[b].close()
    }
  }
  // console.log(pages)
  await browser.close();
  return pdfIndex
}
module.exports = createOnline
