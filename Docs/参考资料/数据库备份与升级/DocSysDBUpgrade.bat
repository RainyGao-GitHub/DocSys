copy /y DocSystemUpgrade.sql C:\xampp\mysql\bin\  
cd C:\xampp\mysql\bin


:BackUp
mysqldump -u root DocSystem > DocSystemAll.sql
mysqldump -u root -d DocSystem > DocSystemStruct.sql 
mysqldump -u root -t DocSystem > DocSystemData.sql

:login DocSystem 
mysql -u root DocSystem < DocSystemUpgrade.sql

pause