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

		<div id="semesters_div" style="display: none">
			<div class="container">
				<div class="buttonGroup">
					<button class="button_medium positive">Neues Semester</button>
					<button class="button_medium positive">Neuer Ordner</button>
				</div>
			</div>

			<div id="semesters_folders" style="display: none">
				<h2>Ordner</h2>
				<table>
					<tbody id="semesters_folders_table">
					</tbody>
				</table>
			</div>

			<div id="semesters_semesters" style="display: none">
				<h2>Semester</h2>
				<table>
					<tbody id="semesters_folders_table">
					</tbody>
				</table>
			</div>

			<div class="container">
				<div class="buttonGroup">
					<?php 
						if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") {
							echo "<button class='button_medium positive'>Vorlagen</button>";
							echo "<button class='button_medium positive'>Klassen</button>";
						} else {
							echo "<button class='button_big positive'>Vorlagen</button>";
						} 
					?>
				</div>
				
				<div class="buttonGroup" id="semesters_templateButtons">
					<button class="button_big positive">Öffentliche Vorlagen</button>
					<button class="button_big positive">Eigene veröffentlichte Vorlagen</button>
				</div>

				<button class="button_big positive withMargin">Geteilte Semester</button>
				<button class="button_big positive" style="margin-top: 50px;">Versteckte Semester anzeigen</button>

				<div class="buttonGroup" id="semesters_editButtons">
					<button class="button_medium positive">Ordner bearbeiten</button>
					<button class="button_medium negative">Ordner löschen</button>
				</div>
			</div>
		</div>

		<div id="tests_div" style="display: block">
            <div class="container">
                <div id="tests_addSubjectButtons">
                    <button class="button_big positive withMargin">Neues Fach / Neuer Ordner</button>

                    <div class="buttonGroup noMargin">
                        <button class="button_medium positive">Neue Prüfung</button>
                        <button class="button_medium positive">Neue Veknüpf.</button>
                    </div>
                </div>

                <div id="tests_addFolderButtons" style="display: none">
                    <button class="button_big positive withMargin">Neue Prüfung</button>

                    <div class="buttonGroup noMargin">
                        <button class="button_medium positive">Neuer Ordner</button>
                        <button class="button_medium positive">Neue Veknüpf.</button>
                    </div>
                </div>
			</div>

            <table>
                <thead>
					<tr>
						<th>Name</th>
						<th>Datum</th>
                        <th>Gewichtung</th>
                        <th colspan="2">Note</th>
						<th></th>
					</tr>
				</thead>
				<tbody id="tests_table">
				</tbody>
			</table>

            <div class="container">
                <?php if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") { ?>
                    
                <button class="button_big positive withMargin">Noten / Punkte bearbeiten</button>
                <button class="button_big positive withMargin">Versteckte Schüler/innen anzeigen</button>

                <?php } ?>

                <button class="button_big neutral withMargin">Semesterinfo</button>

                <div class="buttonGroup noMargin" id="tests_editButtons">
                    <button class="button_medium positive">Semester bearbeiten</button>
                    <button class="button_medium negative">Semester löschen</button>
                </div>

                <button class="button_big positive" style="margin-top: 50px;">Notenrechner</button>
                <button class="button_big positive withMargin">Notenblatt</button>
            </div>
		</div>

		<div id="foreignSemesters_div" style="display: none">
			<table style="margin-top: 50px;">
                <thead>
					<tr>
						<th>Name</th>
						<th>Ersteller</th>
						<th></th>
					</tr>
				</thead>
				<tbody id="foreignSemesters_table">
				</tbody>
			</table>
		</div>

		<?php if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") { ?>

		<div id="classes_div" style="display: none">
			<div class="container">
				<button class="button_big positive withMargin">Neue Klasse</button>
			</div>

			<table>
				<tbody id="classes_table">
				</tbody>
			</table>

			<div class="container">
				<div class="buttonGroup">
					<button class='button_medium positive'>Semester</button>
					<button class='button_medium positive'>Vorlagen</button>
				</div>

				<button class='button_big positive withMargin'>Geteilte Klassen</button>

				<button class="button_big positive" style="margin-top: 50px;">Versteckte / alte Klassen anzeigen</button>
			</div>
		</div>

		<div id="students_div" style="display: none">
			<div class="container">
				<button class="button_big positive withMargin">Neue/r Schüler/in</button>
			</div>

			<table>
                <thead>
					<tr>
						<th>Vorname</th>
                        <th>Nachname</th>
						<th>Benutzername</th>
						<th></th>
					</tr>
				</thead>
				<tbody id="students_table">
				</tbody>
			</table>

			<div class="container">
				<button class="button_big positive">Versteckte Schüler/innen anzeigen</button>

				<button class="button_big neutral withMargin">Klasseninfo</button>

				<div class="buttonGroup noMargin" id="students_editButtons">
					<button class="button_medium positive">Klasse bearbeiten</button>
					<button class="button_medium negative">Klasse löschen</button>
				</div>
			</div>
		</div>

		<div id="foreignClasses_div" style="display: none">
            <table style="margin-top: 50px;">
                <thead>
					<tr>
						<th>Name</th>
						<th>Ersteller</th>
						<th></th>
					</tr>
				</thead>
				<tbody id="foreignClasses_table">
				</tbody>
			</table>
		</div>

		<?php } ?>

		<div id="publicTemplates_div" style="display: none">
			<div class="container">
				<input type="text">
				<!-- Suchfelder -->
			</div>

			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Typ</th>
						<th>Ersteller</th>
						<th>Schule</th>
						<th></th>
					</tr>
				</thead>
				<tbody id="publicTemplates_table">
				</tbody>
			</table>
		</div>

		<div id="publishedTemplates_div" style="display: none">
			<div class="container">
				<button class="button_big positive withMargin">Vorlage veröffentlichen</button>
			</div>

			<table>
				<tbody id="publishedTemplates_table">
				</tbody>
			</table>
		</div>
	</body>
</html>