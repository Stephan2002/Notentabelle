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
        <script language="javascript" type="text/javascript" src="js/app/app.js"></script>

        <?php if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") { ?>
            <script language="javascript" type="text/javascript" src="js/app/appTeacher.js"></script>
        <?php } ?>

        <script>
            var user = {
                userName: "<?php echo addslashes($_SESSION["username"]); ?>",
                isTeacher: <?php echo ($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin" ? "true" : "false") ?>,
				lowerDisplayBound: <?php echo $_SESSION["lowerDisplayBound"]; ?>,
				upperDisplayBound: <?php echo $_SESSION["upperDisplayBound"]; ?>
            };
        </script>

		<noscript><meta http-equiv="refresh" content="0; error?error=1&origin=app"></noscript>
		
	</head>
	
	<body>
        <?php include("phpScripts/preload.php"); ?>
		<nav>
			<img id="returnButton" src="/img/arrow_back.svg" alt="<">
			<div id="header">
				<h1 id="title">Semesterauswahl</h1>
            </div>
            <script language="javascript" type="text/javascript" src="js/menu.js"></script>
		</nav>

		<div class="panel" id="semesters_div" style="display: none">
			<div class="container">
				<div class="buttonGroup">
					<button id="semesters_button_newSemester" class="button_medium positive">Neues Semester</button>
					<button class="button_medium positive">Neuer Ordner</button>
                </div>
                
                <div id="semesters_empty_semesters" class="info gray bigMargin">
                    <p class="blankLine_small">Kein sichtbares Semester vorhanden.</p>
                    <p>Fügen Sie ein Semester oder einen Ordner mit den obigen Knöpfen ein.</p>
                </div>

                <div id="semesters_empty_templates" class="info gray bigMargin">
                    <p class="blankLine_small">Keine sichtbare Vorlage vorhanden.</p>
                    <p>Fügen Sie eine Vorlage oder einen Ordner mit den obigen Knöpfen ein.</p>
                </div>
			</div>

			<div id="semesters_folders" style="display: none">
				<h2>Ordner</h2>
				<table>
					<tbody id="semesters_folders_tableBody">
					</tbody>
				</table>
			</div>

			<div id="semesters_semesters" style="display: none">
				<h2>Semester</h2>
				<table>
					<tbody id="semesters_semesters_tableBody">
					</tbody>
				</table>
			</div>

			<div class="container">
				<div class="buttonGroup" id="semesters_linkButtons">
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

                <button class="button_big positive withMargin">Geteilte Semester / Vorlagen</button>
                
                <button class="button_big positive bigMargin">Versteckte Elemente anzeigen</button>
                <button class="button_big positive">Gelöschte Elemente</button>

				<div class="buttonGroup" id="semesters_editButtons">
					<button class="button_medium positive doubleLine"><img src="/img/edit.svg" alt="">Ordner bearbeiten</button>
					<button class="button_medium negative doubleLine"><img src="/img/delete.svg" alt="">Ordner löschen</button>
				</div>
			</div>
		</div>

		<div class="panel" id="tests_div" style="display: none">
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

                <div id="tests_empty_subjects">
                    <div class="info gray bigMargin">
                        <p class="blankLine_small">Kein sichtbares Fach vorhanden.</p>
                        <p id="tests_empty_subjects_instruction">Fügen Sie ein Fach, eine Prüfung oder eine Verknüpfung mit den obigen Knöpfen ein oder benutzen Sie eine Vorlage.</p>
                    </div>
                    <button id="tests_empty_subjects_templateButton" class="button_big positive withMargin">Vorlage verwenden</button>
                </div>

                <div id="tests_empty_folders">
                    <div class="info gray bigMargin">
                        <p class="blankLine_small">Kein sichtbares Element vorhanden.</p>
                        <p id="tests_empty_folders_instruction">Fügen Sie einen Ordner, eine Prüfung oder eine Verknüpfung mit den obigen Knöpfen ein oder benutzen Sie eine Vorlage.</p>
                    </div>
                    <button id="tests_empty_folders_templateButton" class="button_big positive withMargin">Vorlage verwenden</button>
                </div>
			</div>

            <table id="tests_table">
                <thead>
					<tr>
						<th>Name</th>
						<th>Datum</th>
                        <th><span class="table_big">Gewichtung</span><span class="table_small">Gew.</span></th>
						<th id="tests_table_points"><span class="table_big" style="display: none;">Punkte</span><span class="table_small" style="display: none;">Pkte.</span></th>
						<th id="tests_table_mark_unrounded"></th>
						<th id="tests_table_mark">Note</th>
						<th></th>
						<th></th>
					</tr>
				</thead>
				<tbody id="tests_tableBody">
				</tbody>
			</table>

			<div id="tests_testInfo_div" style="display:none;">
                <h2>Prüfungsinformationen</h2>
                <table>
                    <tbody id="tests_testInfo_tableBody">
                    </tbody>
                </table>
			</div>

			<?php if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") { ?>

			<table id="tests_studentTable" class="bigMargin">
                <thead>
					<tr>
						<th>Vorname</th>
						<th>Nachname</th>
                        <th id="tests_studentTable_points" style="display: none;"><span class="table_big">Punkte</span><span class="table_small">Pkte.</span></th>
						<th id="tests_studentTable_mark" colspan="2">Note</th>
						<th></th>
					</tr>
				</thead>
				<tbody id="tests_studentTableBody">
				</tbody>
			</table>

			<?php } ?>

            <div class="container" style="margin-bottom: 100px;">
                <?php if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") { ?>
                    
				<div id="tests_studentButtons">
					<button id="tests_editStudentButton" class="button_big positive withMargin">Noten / Punkte bearbeiten</button>
					<button class="button_big positive withMargin">Versteckte Schüler/innen anzeigen</button>
				</div>

                <?php } ?>

				<button id="tests_showHiddenTests" class="button_big positive withMargin">Versteckte Elemente anzeigen</button>
				<button id="tests_deletedButton" class="button_big positive">Gelöschte Elemente</button>

				<div id="tests_semesterButtons" style="display: block;">
					<button class="button_big neutral withMargin"><img src="/img/info.svg" alt="">Semesterinfo</button>

					<div class="buttonGroup noMargin" id="tests_editSemesterButtons">
						<button class="button_medium positive doubleLine"><img src="/img/edit.svg" alt="">Semester bearbeiten</button>
						<button class="button_medium negative doubleLine"><img src="/img/delete.svg" alt="">Semester löschen</button>
					</div>
				</div>

				<div id="tests_folderButtons" style="display: none;">
					<button class="button_big neutral withMargin"><img src="/img/info.svg" alt="">Fach- / Ordnerinfo</button>

					<div class="buttonGroup noMargin" id="tests_editFolderButtons">
						<button class="button_medium positive doubleLine"><img src="/img/edit.svg" alt="">Fach/Ordner bearbeiten</button>
						<button class="button_medium negative doubleLine"><img src="/img/delete.svg" alt="">Fach/Ordner löschen</button>
					</div>
				</div>

				<div id="tests_testButtons" style="display: none;">
					<button id="tests_testInfoButton" class="button_big neutral withMargin"><img src="/img/info.svg" alt="">Prüfungsinfo</button>

					<div class="buttonGroup noMargin" id="tests_editTestButtons">
						<button class="button_medium positive doubleLine"><img src="/img/edit.svg" alt="">Prüfung bearbeiten</button>
						<button class="button_medium negative doubleLine"><img src="/img/delete.svg" alt="">Prüfung löschen</button>
					</div>
				</div>

                <button id="tests_calculatorButton" class="button_big positive bigMargin">Notenrechner</button>
                <button id="tests_markPaperButton" class="button_big positive withMargin">Notenblatt</button>
            </div>

            <div id="averageFooter">
                <p id="averageFooter_points">Punkte:</p>
                <p id="averageFooter_average">Schnitt:</p>
                <p id="averageFooter_points_big" class="averageFooter_big">Punkte:</p>
                <p id="averageFooter_mark_big" class="averageFooter_big">Note:</p>
                <p id="averageFooter_plusPoints_big" class="averageFooter_big">Hochpunkte:</p>
            </div>
		</div>

		<div class="panel" id="foreignSemesters_div" style="display: none">
			<div id="foreignSemesters_shared">
				<h2>Geteilte Semester</h2>
				<table class="bigMargin">
					<thead>
						<tr>
							<th>Name</th>
							<th>Ersteller</th>
							<th></th>
						</tr>
					</thead>
					<tbody id="foreignSemesters_shared_tableBody">
					</tbody>
				</table>
			</div>

			<?php if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") { ?>

			<div id="foreignSemesters_teacher">
				<h2>Mit Zugriff als Lehrperson</h2>
				<table class="bigMargin">
					<thead>
						<tr>
							<th>Name</th>
							<th>Ersteller</th>
							<th></th>
						</tr>
					</thead>
					<tbody id="foreignSemesters_teacher_tableBody">
					</tbody>
				</table>
			</div>

			<?php } ?>

			<div id="foreignSemesters_student">
				<h2>Mit Zugriff als Schüler/in</h2>
				<table class="bigMargin">
					<thead>
						<tr>
							<th>Name</th>
							<th>Ersteller</th>
							<th></th>
						</tr>
					</thead>
					<tbody id="foreignSemesters_student_tableBody">
					</tbody>
				</table>
			</div>
		</div>

		<?php if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") { ?>

		<div class="panel" id="classes_div" style="display: none">
			<div class="container">
				<button class="button_big positive withMargin">Neue Klasse</button>
			</div>

			<table>
				<tbody id="classes_tableBody">
				</tbody>
			</table>

			<div class="container">
				<div class="buttonGroup">
					<button class='button_medium positive'>Semester</button>
					<button class='button_medium positive'>Vorlagen</button>
				</div>

				<button class='button_big positive withMargin'>Geteilte Klassen</button>

                <button class="button_big positive bigMargin">Versteckte / alte Klassen anzeigen</button>
                <button class="button_big positive">Gelöschte Klassen</button>
			</div>
		</div>

		<div class="panel" id="students_div" style="display: none">
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
				<tbody id="students_tableBody">
				</tbody>
			</table>

			<div class="container">
                <button class="button_big positive">Versteckte Schüler/innen anzeigen</button>
                <button class="button_big positive">Gelöschte Schüler/innen</button>

				<button class="button_big neutral withMargin"><img src="/img/info.svg" alt="">Klasseninfo</button>

				<div class="buttonGroup noMargin" id="students_editButtons">
					<button class="button_medium positive doubleLine"><img src="/img/edit.svg" alt="">Klasse bearbeiten</button>
					<button class="button_medium negative doubleLine"><img src="/img/delete.svg" alt="">Klasse löschen</button>
				</div>
			</div>
		</div>

		<div class="panel" id="foreignClasses_div" style="display: none">
            <table class="bigMargin">
                <thead>
					<tr>
						<th>Name</th>
						<th>Ersteller</th>
						<th></th>
					</tr>
				</thead>
				<tbody id="foreignClasses_tableBody">
				</tbody>
			</table>
		</div>

		<?php } ?>

		<div class="panel" id="publicTemplates_div" style="display: none">
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
				<tbody id="publicTemplates_tableBody">
				</tbody>
			</table>
		</div>

		<div class="panel" id="publishedTemplates_div" style="display: none">
			<div class="container">
				<button class="button_big positive withMargin">Vorlage veröffentlichen</button>
			</div>

			<table>
				<tbody id="publishedTemplates_tableBody">
				</tbody>
			</table>
        </div>
        
        <div class="panel" id="error_div" style="display: none;">
            <img id="error" src="/img/error.svg" alt="">

            <div id="error_other">
                <h2>Fehler</h2>
                <div class="text">
                    <p>Ein Fehler ist aufgetreten.</p>
                    <p>Möglicherweise besteht ein Problem mit der Internetverbindung</p>
                    <p>Bei wiederholten Auftreten kontaktieren Sie...</p>
                    <p class="blankLine">Fehlercode: <span id="error_code"></span></p>
                </div>
            </div>

            <div id="error_forbidden">
                <h2>Kein Zugriff</h2>
                <div class="text">
                    <p>Das Element existiert nicht (mehr) oder Sie haben keinen Zugriff (mehr) darauf.</p>
                </div>
            </div>

            <button class="button_small positive bigMargin" id="error_returnButton">Zurück</button>
        </div>
	</body>
</html>