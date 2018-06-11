package util.DocConvertUtil;

//参考资料: https://www.cnblogs.com/studyzy/p/5338398.html

public class DocConvertUtil{

	/// <summary> 
	/// 将word文档转换成PDF格式 
	/// </summary> 
	/// <param name="sourcePath"></param> 
	/// <param name="targetPath"></param> 
	/// <returns></returns> 
	public static boolean ConvertWord2Pdf(String sourcePath, String targetPath) 
	{ 
	    boolean result; 
	    Word.WdExportFormat exportFormat= Word.WdExportFormat.wdExportFormatPDF; 
	    object paramMissing = Type.Missing; 
	    Word.Application wordApplication = new Word.Application(); 
	    Word.Document wordDocument = null; 
	    try 
	    { 
	        object paramSourceDocPath = sourcePath; 
	        String paramExportFilePath = targetPath;
	        Word.WdExportFormat paramExportFormat = exportFormat; 
	        Word.WdExportOptimizeFor paramExportOptimizeFor = 
	                Word.WdExportOptimizeFor.wdExportOptimizeForPrint; 
	        Word.WdExportRange paramExportRange = Word.WdExportRange.wdExportAllDocument; 
	        int paramStartPage = 0; 
	        int paramEndPage = 0; 
	        Word.WdExportItem paramExportItem = Word.WdExportItem.wdExportDocumentContent; 
	        Word.WdExportCreateBookmarks paramCreateBookmarks = 
	                Word.WdExportCreateBookmarks.wdExportCreateWordBookmarks; 
	    
	        wordDocument = wordApplication.Documents.Open( 
	                ref paramSourceDocPath, ref paramMissing, ref paramMissing, 
	                ref paramMissing, ref paramMissing, ref paramMissing, 
	                ref paramMissing, ref paramMissing, ref paramMissing, 
	                ref paramMissing, ref paramMissing, ref paramMissing, 
	                ref paramMissing, ref paramMissing, ref paramMissing, 
	                ref paramMissing);
	        if (wordDocument != null) 
	            wordDocument.ExportAsFixedFormat(paramExportFilePath, 
	                    paramExportFormat, false, 
	                    paramExportOptimizeFor, paramExportRange, paramStartPage, 
	                    paramEndPage, paramExportItem, true, 
	                    true, paramCreateBookmarks, true, 
	                    true, false, 
	                    ref paramMissing); 
	        result = true; 
	    } 
	    finally 
	    { 
	        if (wordDocument != null) 
	        { 
	            wordDocument.Close(ref paramMissing, ref paramMissing, ref paramMissing); 
	            wordDocument = null; 
	        } 
	        if (wordApplication != null) 
	        { 
	            wordApplication.Quit(ref paramMissing, ref paramMissing, ref paramMissing); 
	            wordApplication = null; 
	        } 
	        GC.Collect(); 
	        GC.WaitForPendingFinalizers(); 
	        GC.Collect(); 
	        GC.WaitForPendingFinalizers(); 
	    } 
	    return result; 
	}
	/// <summary> 
	/// 将excel文档转换成PDF格式 
	/// </summary> 
	/// <param name="sourcePath"></param> 
	/// <param name="targetPath"></param> 
	/// <returns></returns> 
	public static boolean ConvertExcel2Pdf(String sourcePath, String targetPath) 
	{ 
	    boolean result; 
	    object missing = Type.Missing; 
	    Excel.XlFixedFormatType targetType= Excel.XlFixedFormatType.xlTypePDF; 
	    Excel.Application application = null; 
	    Excel.Workbook workBook = null; 
	    try 
	    { 
	        application = new Excel.Application(); 
	        object target = targetPath; 
	        workBook = application.Workbooks.Open(sourcePath, missing, missing, missing, missing, missing, 
	                missing, missing, missing, missing, missing, missing, missing, missing, missing);
	        workBook.ExportAsFixedFormat(targetType, target, Excel.XlFixedFormatQuality.xlQualityStandard, true, false, missing, missing, missing, missing); 
	        result = true; 
	    } 
	    catch 
	    { 
	        result = false; 
	    } 
	    finally 
	    { 
	        if (workBook != null) 
	        { 
	            workBook.Close(true, missing, missing); 
	            workBook = null; 
	        } 
	        if (application != null) 
	        { 
	            application.Quit(); 
	            application = null; 
	        } 
	        GC.Collect(); 
	        GC.WaitForPendingFinalizers(); 
	        GC.Collect(); 
	        GC.WaitForPendingFinalizers(); 
	    } 
	    return result; 
	}
	/// <summary> 
	/// 将ppt文档转换成PDF格式 
	/// </summary> 
	/// <param name="sourcePath"></param> 
	/// <param name="targetPath"></param> 
	/// <returns></returns> 
	public static boolean ConvertPowerPoint2Pdf(String sourcePath, String targetPath) 
	{ 
	    boolean result; 
	    PowerPoint.PpSaveAsFileType targetFileType= PowerPoint.PpSaveAsFileType.ppSaveAsPDF; 
	    PowerPoint.Application application = null; 
	    PowerPoint.Presentation persentation = null; 
	    try 
	    { 
	        application = new PowerPoint.Application(); 
	        persentation = application.Presentations.Open(sourcePath, MsoTriState.msoTrue, MsoTriState.msoFalse, MsoTriState.msoFalse); 
	        persentation.SaveAs(targetPath, targetFileType, MsoTriState.msoTrue);
	        result = true; 
	    } 
	    catch 
	    { 
	        result = false; 
	    } 
	    finally 
	    { 
	        if (persentation != null) 
	        { 
	            persentation.Close(); 
	            persentation = null; 
	        } 
	        if (application != null) 
	        { 
	            application.Quit(); 
	            application = null; 
	        } 
	        GC.Collect(); 
	        GC.WaitForPendingFinalizers(); 
	        GC.Collect(); 
	        GC.WaitForPendingFinalizers(); 
	    } 
	    return result; 
}
}