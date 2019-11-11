package com.DocSystem.test;
import util.DocConvertUtil.Office2PDF;

class OpenOfficeTest  
{  

    public static void main(String[] args) {
        Office2PDF.openOfficeToPDF("D:/Office2PDF/友宾体检套餐.docx","D:/Office2PDF/友宾体检套餐.pdf", null, null);
    }
}
