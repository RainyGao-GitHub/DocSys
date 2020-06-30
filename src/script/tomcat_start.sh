#!/bin/sh

JAVA_HOME=`javaHome`
JRE_HOME=`javaHome`
CATALINA_HOME=`tomcatPath`

exec "$CATALINA_HOME"/catalina.sh start
