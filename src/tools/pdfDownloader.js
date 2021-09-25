import PdfPrinter from "pdfmake";

export const getPdfReadableStream = (mediaObject) => {
  const fonts = {
    Roboto: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
    },
  };

  const printer = new PdfPrinter(fonts);

  const docDefinition = {
    content: [
      { text: mediaObject.Title, style: "header" },
      { text: mediaObject.Year, style: "subHeader" },
      { text: mediaObject.Type, style: "subHeader" },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: 10,
      },
      subHeader: {
        fontSize: 13,
        bold: true,
        margin: 10,
      },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition, {});
  pdfDoc.end();

  return pdfDoc;
};
