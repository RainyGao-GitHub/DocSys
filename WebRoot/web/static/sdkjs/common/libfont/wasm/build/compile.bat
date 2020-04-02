SET SCRIPTPATH=%~dp0
CD /D %~dp0

call emsdk/emsdk_env.bat

call emcc -o fonts.js^
 -O3^
 -fno-exceptions^
 -fno-rtti^
 -s WASM=1^
 -s ALLOW_MEMORY_GROWTH=1^
 -s FILESYSTEM=0^
 -s ENVIRONMENT='web'^
 -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_ASC_FT_Malloc', '_ASC_FT_Free', '_ASC_FT_Init', '_ASC_FT_Open_Face', '_ASC_FT_SetCMapForCharCode', '_FT_Done_FreeType', '_FT_Done_Face', '_FT_Load_Glyph', '_FT_Get_Glyph', '_FT_Set_Transform', '_FT_Set_Char_Size', '_ASC_FT_GetFaceInfo', '_ASC_FT_GetFaceMaxAdvanceX', '_ASC_FT_GetKerningX', '_ASC_FT_Glyph_Get_CBox', '_ASC_FT_Get_Glyph_Measure_Params', '_ASC_FT_Get_Glyph_Render_Params', '_ASC_FT_Get_Glyph_Render_Buffer', '_ASC_FT_Set_Transform', '_ASC_FT_Set_TrueType_HintProp']"^
 "freetype-2.9.1\builds\windows\ftdebug.c"^
 "freetype-2.9.1\src\autofit\autofit.c"^
 "freetype-2.9.1\src\bdf\bdf.c"^
 "freetype-2.9.1\src\cff\cff.c"^
 "freetype-2.9.1\src\base\ftbase.c"^
 "freetype-2.9.1\src\base\ftbitmap.c"^
 "freetype-2.9.1\src\base\ftfstype.c"^
 "freetype-2.9.1\src\base\ftgasp.c"^
 "freetype-2.9.1\src\cache\ftcache.c"^
 "freetype-2.9.1\src\base\ftglyph.c"^
 "freetype-2.9.1\src\gzip\ftgzip.c"^
 "freetype-2.9.1\src\base\ftinit.c"^
 "freetype-2.9.1\src\lzw\ftlzw.c"^
 "freetype-2.9.1\src\base\ftstroke.c"^
 "freetype-2.9.1\src\base\ftsystem.c"^
 "freetype-2.9.1\src\smooth\smooth.c"^
 "freetype-2.9.1\src\base\ftbbox.c"^
 "freetype-2.9.1\src\base\ftbdf.c"^
 "freetype-2.9.1\src\base\ftcid.c"^
 "freetype-2.9.1\src\base\ftmm.c"^
 "freetype-2.9.1\src\base\ftpfr.c"^
 "freetype-2.9.1\src\base\ftsynth.c"^
 "freetype-2.9.1\src\base\fttype1.c"^
 "freetype-2.9.1\src\base\ftwinfnt.c"^
 "freetype-2.9.1\src\base\ftgxval.c"^
 "freetype-2.9.1\src\base\ftotval.c"^
 "freetype-2.9.1\src\base\ftpatent.c"^
 "freetype-2.9.1\src\pcf\pcf.c"^
 "freetype-2.9.1\src\pfr\pfr.c"^
 "freetype-2.9.1\src\psaux\psaux.c"^
 "freetype-2.9.1\src\pshinter\pshinter.c"^
 "freetype-2.9.1\src\psnames\psmodule.c"^
 "freetype-2.9.1\src\raster\raster.c"^
 "freetype-2.9.1\src\sfnt\sfnt.c"^
 "freetype-2.9.1\src\truetype\truetype.c"^
 "freetype-2.9.1\src\type1\type1.c"^
 "freetype-2.9.1\src\cid\type1cid.c"^
 "freetype-2.9.1\src\type42\type42.c"^
 "freetype-2.9.1\src\winfonts\winfnt.c"^
 "freetype-common\freetype.c"^
 -Ifreetype-2.9.1\include^
 -Ifreetype-2.9.1\include\freetype^
 -Ifreetype-2.9.1\include\freetype\internal^
 -DWIN32^
 -DNDEBUG^
 -D_LIB^
 -D_CRT_SECURE_NO_WARNINGS^
 -DFT2_BUILD_LIBRARY
 
echo "finalize..."

call powershell -Command "(Get-Content ./fonts.js) -replace '__ATPOSTRUN__=\[\];', '__ATPOSTRUN__=[function(){window[\"AscFonts\"].onLoadModule();}];' | Set-Content ./fonts.js"
call powershell -Command "(Get-Content ./fonts.js) -replace 'function getBinaryPromise\(\){', 'function getBinaryPromise2(){' | Set-Content ./fonts.js"

call powershell -Command "(Get-Content ./../engine_base.js) -replace '//module', (Get-Content ./fonts.js) | Set-Content ./../engine.js"
call echo f | xcopy /b/v/y/f "fonts.wasm" "../fonts.wasm"