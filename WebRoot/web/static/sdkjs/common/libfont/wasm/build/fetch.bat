SET SCRIPTPATH=%~dp0
CD /D %~dp0

git clone https://github.com/emscripten-core/emsdk.git
CD emsdk
call emsdk install latest
call emsdk activate latest