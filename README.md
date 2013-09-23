NAME
=========

KossyNote - Note management system based on Kossy and MySQL

#TUTORIAL

Change MySQL username and password in KossyNote/lib/KossyNote/Web.pm.

Create database and table.

	> mysqladmin -uYourUserName create kossynote -p
	> mysql -uYourUserName kossynote < sqls/notes.sql -p

Install modules and execute

	> carton install
	> carton exec -- plackup app.psgi
