##  1.克隆项目

克隆项目到本地,这个路径是源路径，如没有权限，请fork,然后取自己的仓库地址

git clone https://gitee.com/RainyGao/DocSys.git

 ![image-20210714091943328](DocSystem如何在idea中启动/img/image-20210714091943328.png)

克隆完成如下（我改了名字）：

 ![image-20210714092027604](DocSystem如何在idea中启动/img/image-20210714092027604.png)

## 2.导入项目到idea

打开idea,点击open，选择DocSytem项目路径打开

+ 打开idea

  ![image-20210714092158959](DocSystem如何在idea中启动/img/image-20210714092158959.png)

+ 点击open

   ![image-20210714092235381](DocSystem如何在idea中启动/img/image-20210714092235381.png)

+ 选择DocSytem项目路径打开

   ![image-20210714092400381](DocSystem如何在idea中启动/img/image-20210714092400381.png)

+ 报jdk错误，不用管，点ok

  ![image-20210714092459854](DocSystem如何在idea中启动/img/image-20210714092459854.png)

+ 视图如下

   ![image-20210714092552358](DocSystem如何在idea中启动/img/image-20210714092552358.png)

## 3.idea项目配置

+ 配置快捷键

  快捷提示：File => Settings => Keymap => Main menu => Code => Completion => Basic

   ![image-20210714092836621](DocSystem如何在idea中启动/img/image-20210714092836621.png)

  ![image-20210714095033742](DocSystem如何在idea中启动/img/image-20210714095033742.png)

  修改快捷健即可

  ![image-20210714095137143](DocSystem如何在idea中启动/img/image-20210714095137143.png)

+ 配置项目编码格式

  ![image-20210714095242917](DocSystem如何在idea中启动/img/image-20210714095242917.png)

+ 项目配置

   ![image-20210714095327102](DocSystem如何在idea中启动/img/image-20210714095327102.png)

+ 配置jdk和编译输出路径

  ![image-20210714095425497](DocSystem如何在idea中启动/img/image-20210714095425497.png)

+ web配置

  ![image-20210714095525049](DocSystem如何在idea中启动/img/image-20210714095525049.png)

  ![image-20210714095546042](DocSystem如何在idea中启动/img/image-20210714095546042.png)

  仔细看，下面路径不对

  ![image-20210714095651677](DocSystem如何在idea中启动/img/image-20210714095651677.png)

  修改为正确路径

  ![image-20210714095738933](DocSystem如何在idea中启动/img/image-20210714095738933.png)

  点击create  Artifact

  ![image-20210714095847224](DocSystem如何在idea中启动/img/image-20210714095847224.png)

  出现如下界面，单击apply

  ![image-20210714095941885](DocSystem如何在idea中启动/img/image-20210714095941885.png)

  指定正确jdk的位置，去除多余项目依赖

  ![image-20210714100115011](DocSystem如何在idea中启动/img/image-20210714100115011.png)

  ![image-20210714100145083](DocSystem如何在idea中启动/img/image-20210714100145083.png)

  创建项目依赖库

   ![image-20210714100252903](DocSystem如何在idea中启动/img/image-20210714100252903.png)

  ![image-20210714100333811](DocSystem如何在idea中启动/img/image-20210714100333811.png)

  在弹出框加载选择项目，单击ok

  ![image-20210714100416228](DocSystem如何在idea中启动/img/image-20210714100416228.png)

  ![image-20210714100432161](DocSystem如何在idea中启动/img/image-20210714100432161.png)

  检查该依赖是否已添加上

  ![image-20210714100514201](DocSystem如何在idea中启动/img/image-20210714100514201.png)

  如果没有，单击旁边的+号添加

   ![image-20210714100550959](DocSystem如何在idea中启动/img/image-20210714100550959.png)

  包配置界面将库加入到项目包中

  ![image-20210714100702374](DocSystem如何在idea中启动/img/image-20210714100702374.png)

  完成后，结构如下，如不对，请重新创建

  ![image-20210714100757244](DocSystem如何在idea中启动/img/image-20210714100757244.png)

  重新创建，可以按如下步骤操作，如果上一步正确，这里忽略

   ![image-20210714100835400](DocSystem如何在idea中启动/img/image-20210714100835400.png)

   ![image-20210714100913697](DocSystem如何在idea中启动/img/image-20210714100913697.png)

  最后单击ok,完成即可

  ![image-20210714101006900](DocSystem如何在idea中启动/img/image-20210714101006900.png)

## 4.项目配置

+ 配置数据源地址

  ![image-20210714101231012](DocSystem如何在idea中启动/img/image-20210714101231012.png)

+ 配置tomcat

  ![image-20210714101318769](DocSystem如何在idea中启动/img/image-20210714101318769.png)

  ![image-20210714101424478](DocSystem如何在idea中启动/img/image-20210714101424478.png)

  ![image-20210714101456578](DocSystem如何在idea中启动/img/image-20210714101456578.png)

   ![image-20210714101602833](DocSystem如何在idea中启动/img/image-20210714101602833.png)

  ![image-20210714101626602](DocSystem如何在idea中启动/img/image-20210714101626602.png)

  ![image-20210714101648490](DocSystem如何在idea中启动/img/image-20210714101648490.png)

  ![image-20210714101701149](DocSystem如何在idea中启动/img/image-20210714101701149.png)

  ![image-20210714101745003](DocSystem如何在idea中启动/img/image-20210714101745003.png)

  注意，Application context请和图内保持一致

  ![image-20210714101918933](DocSystem如何在idea中启动/img/image-20210714101918933.png)

  最后一步，配置后，按F10可以达到热部署效果

  ![image-20210714102107692](DocSystem如何在idea中启动/img/image-20210714102107692.png)

## 5.启动项目

![image-20210714102219471](DocSystem如何在idea中启动/img/image-20210714102219471.png)

![image-20210714102356056](DocSystem如何在idea中启动/img/image-20210714102356056.png)

创建用户即可使用

![image-20210714102409029](DocSystem如何在idea中启动/img/image-20210714102409029.png)