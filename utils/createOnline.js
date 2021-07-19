const puppeteer = require('puppeteer')
const Path = require('path')
const createOnline = async (path) => {
  const browser = await puppeteer.launch({

    args: ['--disable-dev-shm-usage', '--no-sandbox'],

  });

  const page = await browser.newPage();

  await page.goto(path, {
    waitUntil: ['load', // Remove the timeout
      'domcontentloaded',  //等待 “domcontentloaded” 事件触发
      'networkidle0',
    ],
    timeout: 0,
  })

  // 添加css样式
  // await page.addStyleTag({
  //
  //   path: 'views/index.css'
  //
  // })
  // const dimensions = await page.evaluate(() => {
  //   return {
  //     width: document.querySelector("#app").scrollWidth + 100,
  //     height: document.getElementById("app").scrollHeight + 100,
  //     deviceScaleFactor: window.devicePixelRatio
  //   };
  // });
  await page.addStyleTag({
    content: 'tr,img{page-break-before: always;page-break-inside:avoid;}'
  })
  const dimensions = await page.evaluate(() => {
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
    return {
      arr: widthArr,
      width: widthArr[widthArr.length - 1] + 100,
    };
  });
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
    path: Path.resolve(__dirname, '../views/myResume.pdf'),
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

  await browser.close();
}
module.exports = createOnline
