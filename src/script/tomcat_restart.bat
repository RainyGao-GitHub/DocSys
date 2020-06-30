echo.
echo [DocSys]: ReStart
set "CATALINA_HOME=tomcatPath"
set "JAVA_HOME=javaHome"
set "JRE_HOME=javaHome"

echo [DocSys]: Stop Tomcat
"%CATALINA_HOME%\bin\catalina.bat" stop

echo [DocSys]: Start Tomcat
"%CATALINA_HOME%\bin\catalina.bat" run

echo done.
pause


