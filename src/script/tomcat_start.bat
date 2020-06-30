echo.
echo [DocSys]: Start
set "CATALINA_HOME=tomcatPath"
set "JAVA_HOME=javaHome"
set "JRE_HOME=javaHome"

echo [DocSys]: Start Tomcat
"%CATALINA_HOME%\bin\catalina.bat" start

echo done.
pause


