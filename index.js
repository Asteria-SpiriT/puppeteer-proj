const puppeteer = require('puppeteer')
const nodemailer = require('nodemailer')
const Koa = require('koa')
const router = require('koa-router')()
const app = new Koa()

const mailTransport = nodemailer.createTransport({
  host: 'smtp.qq.com',
  secureConnection: true, // 使用SSL方式（安全方式，防止被窃取信息）
  auth : {
      user : '124xxx5461@qq.com',
      pass : 'key'
  },
});

let htmlContent = '';

(async () => {
  // 打开浏览器
  // const options = {
    // 如果使用headless会启用可视化模式，也就是启动chrome浏览器，并且会有头部地址栏等工具
    // headless: false,
    // execcutablepath: getNPMConfig('chrome')
  // }
  const browser = await puppeteer.launch();
  // 创建一个tab
  const page = await browser.newPage();
  await page.goto('https://www.xxxx.com/group/topic/120193864/');
  
  // await page.screenshot({path: 'cat.png'})
  // await browser.close()
  // 最好用比较外层的元素来判定是否加载完成，因为如果用比较内层的元素来判定的话，如果超过Puppeteer的判定时间（可以自己设定）那么就会报错
  await page.waitForSelector('.topic-doc .topic-richtext');
  // $$eval：第一个参数为选择器：选择要获取的DOM元素；第二个参数为回调函数：对获取的DOM元素的操作
  const content = await page.$$eval('.topic-doc .topic-richtext .image-container', items => {
    let arr = items.map(item => {
      return item.querySelector('.image-wrapper').firstChild.src
    })
    return arr
  });
  
  htmlContent = content.reduce((acc, cur) => {
    acc += `<img style='height: 100px' src='${cur}' alt='' />`
    return acc
  }, '')
})();

router.get('/send', async (ctx, next) => {
  await new Promise((resolve, reject) => {
    let timerId = setInterval(() => {
      htmlContent !== '' && (clearInterval(timerId), resolve())
    }, 500)
  })
  ctx.body = `${htmlContent}`
  const options = {
    from: '124xxx5461@qq.com',
    to: '124xxx5461@qq.com',
    subject: '来自node的猫咪邮件',
    html: htmlContent
  };
  mailTransport.sendMail(options, (err, info) => {
    console.info('Enter sendmail')
    if (err) {
      console.warn('send mail failed')
    } else {
      console.info(info)
    }
  })
  next()
});

app.use(router.routes());

app.listen(3000, () => {
  console.log(`server is running at: http://localhost:3000`)
});