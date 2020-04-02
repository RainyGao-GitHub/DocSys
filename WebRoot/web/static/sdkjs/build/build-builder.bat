CD /D %~dp0
call npm install -g grunt-cli
call npm install

SET PRODUCT_VERSION=4.4.1
SET BUILD_NUMBER=1

rem call grunt --level=WHITESPACE_ONLY --formatting=PRETTY_PRINT
call grunt --level=ADVANCED

copy ..\word\sdk-all.js ..\..\core\build\jsbuilder\sdkjs\word\sdk-all.js
copy ..\word\sdk-all-min.js ..\..\core\build\jsbuilder\sdkjs\word\sdk-all-min.js
copy ..\slide\sdk-all.js ..\..\core\build\jsbuilder\sdkjs\slide\sdk-all.js
copy ..\slide\sdk-all-min.js ..\..\core\build\jsbuilder\sdkjs\slide\sdk-all-min.js
copy ..\cell\sdk-all.js ..\..\core\build\jsbuilder\sdkjs\cell\sdk-all.js
copy ..\cell\sdk-all-min.js ..\..\core\build\jsbuilder\sdkjs\cell\sdk-all-min.js
copy ..\common\Native\native.js ..\..\core\build\jsbuilder\sdkjs\common\Native\native.js
copy ..\common\libfont\js\fonts.js ..\..\core\build\jsbuilder\sdkjs\common\libfont\js\fonts.js
copy ..\common\libfont\wasm\fonts.js ..\..\core\build\jsbuilder\sdkjs\common\libfont\wasm\fonts.js
copy ..\common\libfont\wasm\fonts.wasm ..\..\core\build\jsbuilder\sdkjs\common\libfont\wasm\fonts.wasm

pause