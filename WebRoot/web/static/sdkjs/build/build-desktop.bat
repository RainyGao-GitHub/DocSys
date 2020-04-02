CD /D %~dp0
call npm install -g grunt-cli
call npm install
rem call grunt --level=WHITESPACE_ONLY --desktop=true --formatting=PRETTY_PRINT
call grunt --level=ADVANCED --desktop=true

rmdir "..\..\core-ext\desktop-sdk-wrapper\test\build\win_64\Debug\editors\sdkjs"
xcopy /s/e/k/c/y/q/i "..\deploy\sdkjs" "..\..\core-ext\desktop-sdk-wrapper\test\build\win_64\debug\editors\sdkjs"

pause