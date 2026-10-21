import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

//set thai font
pdfMake.fonts = {
  THSarabunNew: {
    normal: "https://codingthailand.com/site/fonts/th/THSarabunNew.ttf",
    bold: "https://codingthailand.com/site/fonts/th/THSarabunNewBold.ttf",
    italics: "https://codingthailand.com/site/fonts/th/THSarabunNewItalic.ttf",
  },
};

export { pdfMake };