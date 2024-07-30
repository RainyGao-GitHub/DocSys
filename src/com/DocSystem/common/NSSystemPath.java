package com.DocSystem.common;

//namespace NSSystemPath
public class NSSystemPath
{
//	std::wstring GetDirectoryName(const std::wstring& strFileName)
//	{
//		std::wstring sRes;
//		//_wsplitpath return directory path, including trailing slash.
//		//dirname() returns the string up to, but not including, the final '/',
//#if defined(_WIN32) || defined (_WIN64)
//		wchar_t tDrive[256];
//		wchar_t tFolder[256];
//		_wsplitpath( strFileName.c_str(), tDrive, tFolder, NULL, NULL );
//		sRes.append(tDrive);
//		sRes.append(tFolder);
//		if(sRes.length() > 0)
//			sRes.erase(sRes.length()-1);
//#elif __linux__ || MAC
//		BYTE* pUtf8 = NULL;
//		LONG lLen = 0;
//		NSFile::CUtf8Converter::GetUtf8StringFromUnicode(strFileName.c_str(), strFileName.length(), pUtf8, lLen, false);
//		char* pDirName = dirname((char*)pUtf8);
//		sRes = NSFile::CUtf8Converter::GetUnicodeStringFromUTF8((BYTE*)pDirName, strlen(pDirName));
//		delete [] pUtf8;
//#endif
//		return sRes;
//	}
	public static String GetDirectoryName(String strFileName)
	{
		String sRes = strFileName;
		//文件末尾是分隔符
		if(strFileName.charAt(strFileName.length() -1) == '/')
		{
			sRes = strFileName.substring(0, strFileName.length() - 1); //去掉末尾的 /
		}
		
		int n1 = sRes.lastIndexOf('/');
		if (n1 < 0)
		{
			return "";
		}
		
		return sRes.substring(0, n1);	//不包含斜杠
	}
//	std::wstring GetFileName(const std::wstring& strFileName)
//	{
//		std::wstring sRes;
//#if defined(_WIN32) || defined (_WIN64)
//		wchar_t tFilename[256];
//		wchar_t tExt[256];
//		_wsplitpath( strFileName.c_str(), NULL, NULL, tFilename, tExt );
//		sRes.append(tFilename);
//		sRes.append(tExt);
//		return sRes;
//#elif __linux__ || MAC
//		BYTE* pUtf8 = NULL;
//		LONG lLen = 0;
//		NSFile::CUtf8Converter::GetUtf8StringFromUnicode(strFileName.c_str(), strFileName.length(), pUtf8, lLen, false);
//		char* pBaseName = basename((char*)pUtf8);
//		sRes = NSFile::CUtf8Converter::GetUnicodeStringFromUTF8((BYTE*)pBaseName, strlen(pBaseName));
//		delete [] pUtf8;
//#endif
//		return sRes;
//	}
	String GetFileName(String strFileName)
	{
		String sRes = strFileName;
		//文件末尾是分隔符
		if(strFileName.charAt(strFileName.length() -1) == '/')
		{
			sRes = strFileName.substring(0, strFileName.length() - 1); //去掉末尾的 /
		}
		
		int n1 = sRes.lastIndexOf('/');
		if (n1 < 0)
		{
			return sRes;
		}
		
		return sRes.substring(n1 + 1); //不包含斜杠
	}
//	std::wstring Combine(const std::wstring& strLeft, const std::wstring& strRight)
//	{
//		std::wstring sRes;
//		bool bLeftSlash = false;
//		bool bRightSlash = false;
//		if(strLeft.length() > 0)
//		{
//			wchar_t cLeft = strLeft[strLeft.length() - 1];
//			bLeftSlash = ('/' == cLeft) || ('\\' == cLeft);
//		}
//		if(strRight.length() > 0)
//		{
//			wchar_t cRight = strRight[0];
//			bRightSlash = ('/' == cRight) || ('\\' == cRight);
//		}
//		if(bLeftSlash && bRightSlash)
//		{
//			sRes = strLeft + strRight.substr(1);
//		}
//		else if(!bLeftSlash && !bRightSlash)
//			sRes = strLeft + L"/" + strRight;
//		else
//			sRes = strLeft + strRight;
//		return sRes;
//	}
	String Combine(String strLeft, String strRight)
	{
		String sRes;
		boolean bLeftSlash = false;
		boolean bRightSlash = false;
		if(strLeft.length() > 0)
		{
			if(strLeft.charAt(strLeft.length() - 1) == '/')  // 不判断 \\
			{
				bLeftSlash = true;
			}
		}
		if(strRight.length() > 0)
		{
			if(strRight.charAt(0) == '/') //不判断 \\
			{
				bRightSlash = true;				
			}
		}
		if(bLeftSlash && bRightSlash)
		{
			sRes = strLeft + strRight.substring(1);
		}
		else if(!bLeftSlash && !bRightSlash)
			sRes = strLeft + "/" + strRight;
		else
			sRes = strLeft + strRight;
		return sRes;
	}
/*	
	template<class CHAR, class STRING = std::basic_string<CHAR, std::char_traits<CHAR>, std::allocator<CHAR>>>
	STRING NormalizePathTemplate(const STRING& strFileName)
	{
		const CHAR* pData = strFileName.c_str();
		int nLen          = (int) strFileName.length();

		CHAR* pDataNorm       = new CHAR[nLen + 1];
		int*  pSlashPoints    = new int[nLen + 1];

		int nStart          = 0;
		int nCurrent        = 0;
		int nCurrentSlash   = -1;
		int nCurrentW       = 0;
		bool bIsUp          = false;

		if (pData[nCurrent] == '/' || pData[nCurrent] == '\\')
		{
#if !defined(_WIN32) && !defined (_WIN64)
			pDataNorm[nCurrentW++] = pData[nCurrent];
#endif
			++nCurrentSlash;
			pSlashPoints[nCurrentSlash] = nCurrentW;
		}

		while (nCurrent < nLen)
		{
			if (pData[nCurrent] == '/' || pData[nCurrent] == '\\')
			{
				if (nStart < nCurrent)
				{
					bIsUp = false;
					if ((nCurrent - nStart) == 2)
					{
						if (pData[nStart] == (CHAR)'.' && pData[nStart + 1] == (CHAR)'.')
						{
							if (nCurrentSlash > 0)
							{
								--nCurrentSlash;
								nCurrentW = pSlashPoints[nCurrentSlash];
								bIsUp = true;
							}
						}
					}
					if (!bIsUp)
					{
						pDataNorm[nCurrentW++] = (CHAR)'/';
						++nCurrentSlash;
						pSlashPoints[nCurrentSlash] = nCurrentW;
					}
				}
				nStart = nCurrent + 1;
				++nCurrent;
				continue;
			}
			pDataNorm[nCurrentW++] = pData[nCurrent];
			++nCurrent;
		}

		pDataNorm[nCurrentW] = (CHAR)'\0';

		STRING result = STRING(pDataNorm, nCurrentW);

		delete[] pDataNorm;
		delete[] pSlashPoints;

		return result;
	}

	std::string NormalizePath(const std::string& strFileName)
	{
		return NormalizePathTemplate<char>(strFileName);
	}
	std::wstring NormalizePath(const std::wstring& strFileName)
	{
		return NormalizePathTemplate<wchar_t>(strFileName);
	}
*/	
}

//namespace NSSystemPath
//{
//	KERNEL_DECL std::wstring GetDirectoryName(const std::wstring& strFileName);
//	KERNEL_DECL std::wstring GetFileName(const std::wstring& strFileName);
//	KERNEL_DECL std::wstring Combine(const std::wstring& strLeft, const std::wstring& strRight);
//	KERNEL_DECL std::string NormalizePath(const std::string& strFileName);
//	KERNEL_DECL std::wstring NormalizePath(const std::wstring& strFileName);
//}