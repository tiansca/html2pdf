const { PDFDocument } = require('pdf-lib');
// 合并封面和正文
const mergePdf = async function (res) {
    if (!res[1]) {
        return res[0]
    }
    try {
        const pdfDoc = await PDFDocument.create();
        const coverDoc = await PDFDocument.load(res[0]);
        const [coverPage] = await pdfDoc.copyPages(coverDoc, [0]);
        pdfDoc.addPage(coverPage);
        const reportDoc = await PDFDocument.load(res[1]);
        const reportPages = await pdfDoc.copyPages(reportDoc, reportDoc.getPageIndices());
        reportPages.forEach((page) => {
            pdfDoc.addPage(page);
        });
        const pdfBytes = await pdfDoc.save()
        return Buffer.from(pdfBytes)
    } catch (e) {
        return Promise.reject(e)
    }
}
module.exports = mergePdf
