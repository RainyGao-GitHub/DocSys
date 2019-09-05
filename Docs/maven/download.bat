call apache-maven-3.6.0\bin\mvn -f pom.xml dependency:copy-dependencies
call apache-maven-3.6.0\bin\mvn -f pom.xml dependency:sources
call apache-maven-3.6.0\bin\mvn -f pom.xml dependency:resolve -Dclassifier=javadoc
@pause
