echo.
echo [DocSys]: Stop
set "CATALINA_HOME=tomcatPath"
set "JAVA_HOME=javaHome"
set "JRE_HOME=javaHome"

echo [DocSys]: Stop Tomcat
"%CATALINA_HOME%\bin\catalina.bat" stop

echo done.
pause


