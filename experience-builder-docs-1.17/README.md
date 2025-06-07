# Using the ArcGIS Experience Builder Documentation Locally

The ArcGIS Experience Builder documentation must be hosted on a web server at `/experience-builder/`. You cannot access the ArcGIS Experience Builder documentation over a `file://` URL.

## Windows with IIS

1. Open `Control Panel`
2. Navigate to `Programs -> Programs and Features -> Turn Windows features on or off`
3. Find "Internet Information Services" and turn it on.
4. Copy the `experience-builder` folder to the `htdocs` folder. `C:\inetpub\wwwroot\`
5. You should be able to access the documentation at http://localhost/experience-builder/

## Linux with Apache

1. Install Apache with `sudo apt-get install apache2` (Ubuntu) or `sudo yum install httpd` (CentOs/Redhat)
2. Start apache with `service apache2 start` (Ubuntu) or `service httpd start` (CentOs/Redhat)
3. Visit http://localhost:80. You should see a basic web page.
4. Copy the `experience-builder` folder to `/var/www/html`
5. You should now be able to view the documentation at http://localhost:80/experience-builder/

## With XAMPP

1. [Install XAMPP](https://www.apachefriends.org/index.html)
2. Open XAMPP and click "Start"
3. Wait for XAMPP to start then go to "Volumes" and mount the default volume.
4. Click "Explore" to open the volume.
5. Copy the `experience-builder` folder to the `htdocs` folder.
6. You should be able to access the documentation at `{XAMPP_URL}/experience-builder/`

## With Node JS

1. [Install NodeJS](https://nodejs.org/en/)
2. `npm i -g http-server`
3. Run `http-server . -o /experience-builder/`
