DATE=$(date '+%Y-%m-%d-%H-%M-%S')

#BackUp Old DataBase
mysqldump -u root -p DocSystem > ~/bkpDocSystem/DocSystemAll$DATE.sql
mysqldump -u root -p -d DocSystem > ~/bkpDocSystem/DocSystemStruct$DATE.sql 
mysqldump -u root -p -t DocSystem > ~/bkpDocSystem/DocSystemData$DATE.sql

#Upgrade DataBase 
mysql -u root -prainy DocSystem < DocSystemUpgrade.sql
