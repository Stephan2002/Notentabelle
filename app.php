<?php

/* Kernseite der Applikation, hier werden alle Semester/Noten angezeigt. */

$loginRequired = true;
include("phpScripts/login.php");

?>

<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0"> 
		<title>Notentabelle</title>
		<link rel="stylesheet" href="css/basicStylesheet.css">
        <link rel="stylesheet" href="dialog/dialogStylesheet.css">
        <link rel="stylesheet" href="loading/loadingStylesheet.css">
		<link rel="stylesheet" href="css/stylesheet.css">

        <!-- Icons -->
		<link rel="icon" type="image/png" href="img/logo/logo_low.png">
		<link rel="icon" type="image/vnd.microsoft.icon" href="img/logo/logo.ico">
		<link rel="apple-touch-icon" href="img/logo/logo_white.png">

		<script language="javascript" type="text/javascript" src="dialog/dialogScript.js"></script>
        <script language="javascript" type="text/javascript" src="dialog/alertScript.js"></script>
        <script language="javascript" type="text/javascript" src="loading/loadingScript.js"></script>
        <script language="javascript" type="text/javascript" src="js/menu.js"></script>
		<script language="javascript" type="text/javascript" src="js/app.js"></script>
		
		<noscript><meta http-equiv="refresh" content="0; error?error=1&origin=app"></noscript>
		
	</head>
	
	<body>
        <?php include("phpScripts/preload.php"); ?>
		<nav>
			<div id="header">
				<h1>Semesterauswahl</h1>
            </div>
            <?php include("phpScripts/menu.php"); ?>
		</nav>
	</body>
</html>