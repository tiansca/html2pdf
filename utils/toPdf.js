const toPdf = async function (page, option) {
    return new Promise(async (resolve, reject) => {
        try {
            const file = await page.pdf(option);
            return resolve(file)
        } catch (e) {
            console.log('**********', e.message)
            if (e.message.indexOf('Page range exceeds page count') !== -1) {
                return resolve(null)
            }
            return reject(e)
        }
    })
}
module.exports = toPdf
