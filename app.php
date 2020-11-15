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

        <link rel="preload" href="/img/loading.svg" as="image">
        <link rel="prefetch" href="/img/loading.svg">

        <style id="parentTypeStyles"></style>
        <style id="typeStyles"></style>
        <style id="dialogTypeStyles"></style>
        <style id="classFlagStyles"></style>
    </head>
    
    <body>
        <?php include("phpScripts/preload.php"); ?>
        <nav>
            <img id="returnButton" src="/img/arrow_back.svg" alt="<" tabindex="0">
            <div id="header">
                <h1 id="title">Semesterauswahl</h1>
            </div>
            <script language="javascript" type="text/javascript" src="js/menu.js"></script>
        </nav>

        <div class="panel" id="semesters_div" style="display: none">
            <div class="container">
                <button class="button_big positive withMargin">Neues Semester</button>

                <div class="buttonGroup noMargin">
                    <button class="button_medium positive">Neue Vorlage</button>
                    <button class="button_medium positive">Neuer Ordner</button>
                </div>
                
                <div id="semesters_empty" class="info gray bigMargin">
                    <p class="blankLine_small">Kein sichtbares Element vorhanden.</p>
                    <p>Fügen Sie ein Semester, eine Vorlage oder einen Ordner mit den obigen Knöpfen ein.</p>
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

            <div id="semesters_templates" style="display: none">
                <h2>Vorlagen</h2>
                <table>
                    <tbody id="semesters_templates_tableBody">
                    </tbody>
                </table>
            </div>

            <div class="container">
                <?php 
                    if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") {
                        echo "<button id='semesters_classButton' class='button_big positive withMargin'>Klassen</button>";
                    }
                ?>
                
                <div class="buttonGroup" id="semesters_templateButtons">
                    <button class="button_big positive">Öffentliche Vorlagen</button>
                    <button class="button_big positive">Eigene veröffentlichte Vorlagen</button>
                </div>

                <button id="semesters_foreignSemestersButton" class="button_big positive withMargin">Geteilte Semester / Vorlagen</button>
                
                <button class="button_big positive bigMargin">Versteckte Elemente anzeigen</button>
                <button class="button_big positive">Gelöschte Elemente</button>

                <div class="buttonGroup" id="semesters_editButtons">
                    <button class="button_medium positive doubleLine"><img src="/img/edit.svg" alt="">Ordner umbenennen</button>
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

                <button class="button_big positive" id="tests_followRefButton" style="display: none">Zum referenzierten Element</button>

                <div id="tests_empty">
                    <div class="info gray bigMargin">
                        <p class="blankLine_small">Kein sichtbares Element vorhanden.</p>
                        <p id="tests_empty_instruction">Fügen Sie <span class="type_root">ein Fach</span><span class="type_folder type_subject">einen Ordner</span>, eine Prüfung oder eine Verknüpfung mit den obigen Knöpfen ein oder benutzen Sie eine Vorlage.</p>
                    </div>
                    <button id="tests_empty_templateButton" class="button_big positive withMargin">Vorlage verwenden</button>
                </div>
            </div>

            <table id="tests_table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Datum</th>
                        <th id="tests_table_weight"><span class="table_big">Gewichtung</span><span class="table_small">Gew.</span></th>
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
                        <th>Nachname</th>
                        <th>Vorname</th>
                        <th id="tests_studentTable_points"><span class="table_big">Punkte</span><span class="table_small">Pkte.</span></th>
                        <th id="tests_studentTable_mark_unrounded">Schnitt</th>
                        <th id="tests_studentTable_mark">Note</th>
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
                    <div class="info gray bigMargin" id="tests_noMarks" style="display: none;">
                        <p class="blankLine_small">Kein/e Schüler/in hat Noten oder Punkte.</p>
                        <p id="tests_noMarks_instruction">Fügen Sie Noten/Punkte hinzu, indem Sie Knopf unten benutzen.</p>
                    </div>
                    <button id="tests_editStudentButton" class="button_big positive withMargin">Noten / Punkte bearbeiten</button>
                    <button class="button_big positive withMargin">Versteckte Schüler/innen anzeigen</button>
                    <button class="button_big positive">Schüler/innen ohne Noten anzeigen</button>
                </div>

                <?php } ?>

                <button id="tests_showHiddenTests" class="button_big positive withMargin">Versteckte Elemente anzeigen</button>
                <button id="tests_deletedButton" class="button_big positive">Gelöschte Elemente</button>

                <div id="tests_semesterButtons" style="display: block;">
                    <button class="button_big neutral withMargin" id="tests_semesterInfoButton"><img src="/img/info.svg" alt=""><span class="parentType_semester">Semester</span><span class="parentType_template">Vorlage</span>-Eigenschaften</button>

                    <div class="buttonGroup noMargin" id="tests_semesterControlButtons">
                        <button class="button_medium positive doubleLine" id="tests_editSemesterButton"><img src="/img/edit.svg" alt=""><span class="parentType_semester">Semester</span><span class="parentType_template">Vorlage</span> bearbeiten</button>
                        <button class="button_medium negative doubleLine" id="tests_deleteSemesterButton"><img src="/img/delete.svg" alt=""><span class="parentType_semester">Semester</span><span class="parentType_template">Vorlage</span> löschen</button>
                    </div>
                </div>

                <div id="tests_elementButtons" style="display: none;">
                    <button class="button_big neutral withMargin" id="tests_elementInfoButton"><img src="/img/info.svg" alt=""><span class="type_subject">Fach</span><span class="type_folder">Ordner</span><span class="type_test">Prüfungs</span><span class="type_ref">Verknüpfungs</span>-Eigenschaften</button>

                    <div class="buttonGroup noMargin" id="tests_elementControlButtons">
                        <button class="button_medium positive doubleLine" id="tests_editElementButton"><img src="/img/edit.svg" alt=""><span class="type_subject">Fach</span><span class="type_folder">Ordner</span><span class="type_test">Prüfung</span><span class="type_ref">Verknüpfung</span> bearbeiten</button>
                        <button class="button_medium negative doubleLine" id="tests_deleteElementButton"><img src="/img/delete.svg" alt=""><span class="type_subject">Fach<br></span><span class="type_folder">Ordner</span><span class="type_test">Prüfung</span><span class="type_ref">Verknüpfung</span> löschen</button>
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
            <div class="container">
                <div id="foreignSemesters_empty">
                    <div class="info gray bigMargin">
                        <p class="blankLine_small">Es gibt keine mit Ihnen geteilten oder Ihnen zugewiesene Semester oder Vorlagen.</p>
                    </div>
                </div>
            </div>

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

                <div id="classes_empty">
                    <div class="info gray bigMargin">
                        <p class="blankLine_small">Keine sichtbare Klasse vorhanden.</p>
                        <p>Fügen Sie eine Klasse oder eine Verknüpfung mit den obigen Knöpfen ein.</p>
                    </div>
                </div>
            </div>

            <table id="classes_table">
                <tbody id="classes_tableBody">
                </tbody>
            </table>

            <div class="container">
                <button id="classes_foreignClassesButton" class='button_big positive withMargin'>Geteilte Klassen</button>

                <button class="button_big positive bigMargin">Versteckte / alte Klassen anzeigen</button>
                <button class="button_big positive">Gelöschte Klassen</button>
            </div>
        </div>

        <div class="panel" id="students_div" style="display: none">
            <div class="container">
                <button id="students_addStudentButton" class="button_big positive withMargin">Neue/r Schüler/in</button>

                <div id="students_empty">
                    <div class="info gray bigMargin">
                        <p class="blankLine_small">Keine sichtbaren Schüler/innen vorhanden.</p>
                        <p id="students_empty_instruction">Fügen Sie eine/n Schüler/in mit dem obigen Knopf ein.</p>
                    </div>
                </div>
            </div>

            <table id="students_table">
                <thead>
                    <tr>
                        <th>Nachname</th>
                        <th>Vorname</th>
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

                <button class="button_big neutral withMargin" id="students_classInfoButton"><img src="/img/info.svg" alt="">Klasseninfo</button>

                <div class="buttonGroup noMargin" id="students_classControlButtons">
                    <button class="button_medium positive doubleLine" id="students_editClassButton"><img src="/img/edit.svg" alt="">Klasse bearbeiten</button>
                    <button class="button_medium negative doubleLine" id="students_deleteClassButton"><img src="/img/delete.svg" alt="">Klasse löschen</button>
                </div>
            </div>
        </div>

        <div class="panel" id="foreignClasses_div" style="display: none">
            <div class="container">
                <div id="foreignClasses_empty">
                    <div class="info gray bigMargin">
                        <p class="blankLine_small">Es gibt keine mit Ihnen geteilten oder Ihnen zugewiesene Klassen.</p>
                    </div>
                </div>
            </div>

            <table class="bigMargin" id="foreignClasses_table">
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

        <div id="semesterInfoDialog" class="dialog infoDialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent" tabindex="0">
                <h2><span class="dialogType_semesterFolder">Ordner</span><span class="dialogType_semester">Semester</span><span class="dialogType_template">Vorlage</span><span class="dialogType_semesterRef dialogType_templateRef">Verknüpfungs</span>-Eigenschaften</h3>

                <h3 id="semesterInfoDialog_name">Name</h3>

                <table id="semesterInfoDialog_typeContainer">
                    <tr>
                        <td>Typ:</td>
                        <td><i id="semesterInfoDialog_type"></i></td>
                    </tr>
                </table>

                <table id="semesterInfoDialog_classNameContainer" class="smallMargin">
                    <tr>
                        <td>Klasse:</td>
                        <td id="semesterInfoDialog_className"></td>
                    </tr>
                </table>

                <table id="semesterInfoDialog_refContainer" class="mediumMargin">
                    <tr>
                        <td>Referenziertes Element:</td>
                        <td id="semesterInfoDialog_refName"></td>
                    </tr>
                    <tr id="semesterInfoDialog_refSemesterNameContainer">
                        <td><span class="dialogType_semesterRef">Semester</span><span class="dialogType_templateRef">Vorlage</span> des ref. Elements:</td>
                        <td id="semesterInfoDialog_refSemesterName"></td>
                    </tr>
                    <tr id="semesterInfoDialog_refUserNameContainer">
                        <td>Besitzer des ref. Elements:</td>
                        <td id="semesterInfoDialog_refUserName"></td>
                    </tr>
                </table>

                <table class="mediumMargin">
                    <tr>
                        <td>Ausgeblendet:</td>
                        <td><img id="semesterInfoDialog_isHiddenIcon" src="/img/checked.svg"></td>
                    </tr>
                </table>

                <div id="semesterInfoDialog_notesContainer" class="mediumMargin notes leftAlign">
                    <p>Notizen:</p>
                    <div style="white-space: pre;" id="semesterInfoDialog_notes"></div>
                </div>

                <div id="semesterInfoDialog_permissionsContainer" class="mediumMargin leftAlign">
                    <p>Zugriffsberechtigungen:</p>
                    <p id="semesterInfoDialog_noPermissions" class="smallMargin"><i>Keine weiteren Zugriffsberechtigungen erteilt.</i></p>
                    <table id="semesterInfoDialog_permissions" class="smallMargin"></table>
                </div>

                <table class="mediumMargin" id="semesterInfoDialog_markAndPointsContainer">
                    <tr>
                        <td>Notenschnitt:</td>
                        <td id="semesterInfoDialog_mark"></td>
                    </tr>
                    <tr>
                        <td>Hochpunkte:</td>
                        <td id="semesterInfoDialog_plusPoints"></td>
                    </tr>
                </table>

                <div class="buttonGroup mediumMargin">
                    <button id="semesterInfoDialog_loadMoreButton" class="button_medium neutral"><img src="/img/info.svg">Mehr laden</button>
                    <button id="semesterInfoDialog_visibilityButton" class="button_medium positive">Ausblenden</button>
                </div>
                <div class="buttonGroup noMargin">
                    <button id="semesterInfoDialog_actionButton" class="button_medium positive">Verschieben</button>
                    <button id="semesterInfoDialog_otherButton" class="button_medium positive">Anderes</button>
                </div>
                <div id="semesterInfoDialog_controlButtons" class="buttonGroup noMargin">
                    <button id="semesterInfoDialog_editButton" class="button_medium positive"><img src="/img/edit.svg">Bearbeiten</button>
                    <button id="semesterInfoDialog_deleteButton" class="button_medium negative"><img src="/img/delete.svg">Löschen</button>
                </div>

                <button id="semesterInfoDialog_closeButton" class="button_big negative smallMargin">Schliessen</button>
            </div>
        </div>

        <div id="testInfoDialog" class="dialog infoDialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent" tabindex="0">
                <h2><span class="dialogType_subject">Fach</span><span class="dialogType_folder">Ordner</span><span class="dialogType_test">Prüfungs</span><span class="dialogType_ref">Verknüpfungs</span>-Eigenschaften</h3>

                <h3 id="testInfoDialog_name">Name</h3>

                <table>
                    <tr>
                        <td>Typ:</td>
                        <td><i id="testInfoDialog_type"></i></td>
                    </tr>
                </table>

                <table id="testInfoDialog_generalInfoContainer" class="smallMargin">
                    <tr id="testInfoDialog_subjectNameContainer">
                        <td>Fach:</td>
                        <td id="testInfoDialog_subjectName"></td>
                    </tr>
                    <tr id="testInfoDialog_semesterNameContainer">
                        <td>Semester:</td>
                        <td id="testInfoDialog_semesterName"></td>
                    </tr>
                    <tr id="testInfoDialog_classNameContainer">
                        <td>Klasse:</td>
                        <td id="testInfoDialog_className"></td>
                    </tr>
                    <tr id="testInfoDialog_dateContainer">
                        <td>Datum:</td>
                        <td id="testInfoDialog_date"></td>
                    </tr>
                </table>

                <table id="testInfoDialog_refContainer" class="mediumMargin">
                    <tr>
                        <td>Verknüpfungsstatus:</td>
                        <td id="testInfoDialog_referenceState"></td>
                    </tr>
                    <tr id="testInfoDialog_refTestNameContainer">
                        <td>Referenziertes Element:</td>
                        <td id="testInfoDialog_refTestName"></td>
                    </tr>
                    <tr id="testInfoDialog_refUserNameContainer">
                        <td>Besitzer des ref. Elements:</td>
                        <td id="testInfoDialog_refUserName"></td>
                    </tr>
                </table>

                <div class="inputGroup mediumMargin">
                    <div>
                        <table>
                            <tr>
                                <td>Ausgeblendet:</td>
                                <td><img id="testInfoDialog_isHiddenIcon" src="/img/checked.svg"></td>
                            </tr>
                        </table>
                    </div>
                    <div>
                        <table>
                            <tr>
                                <td>Zählt:</td>
                                <td><img id="testInfoDialog_markCountsIcon" src="/img/checked.svg"></td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="inputGroup mediumMargin">
                    <div id="testInfoDialog_markSettingsContainer">
                        <table>
                            <tr id="testInfoDialog_weightContainer">
                                <td>Gewichtung:</td>
                                <td id="testInfoDialog_weight"></td>
                            </tr>
                            <tr>
                                <td>Rundung:</td>
                                <td id="testInfoDialog_round"></td>
                            </tr>
                        </table>
                    </div>
                    <div id="testInfoDialog_pointsSettingsContainer">
                        <table>
                            <tr id="testInfoDialog_formulaContainer">
                                <td>Formel:</td>
                                <td id="testInfoDialog_formula"></td>
                            </tr>
                            <tr id="testInfoDialog_maxPointsContainer">
                                <td>Maximalpkte.:</td>
                                <td id="testInfoDialog_maxPoints"></td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div id="testInfoDialog_notesContainer" class="mediumMargin notes leftAlign">
                    <p>Notizen:</p>
                    <div style="white-space: pre;" id="testInfoDialog_notes"></div>
                </div>

                <div id="testInfoDialog_studentNotesContainer" class="mediumMargin notes leftAlign">
                    <p>Persönliche Anmerkungen:</p>
                    <div style="white-space: pre;" id="testInfoDialog_studentNotes"></div>
                </div>

                <div id="testInfoDialog_permissionsContainer" class="mediumMargin leftAlign">
                    <p>Lehrpersonen / Zugriffsberechtigungen:</p>
                    <p id="testInfoDialog_noPermissions" class="smallMargin"><i>Keine Lehrpersonen angegeben.</i></p>
                    <table id="testInfoDialog_permissions" class="smallMargin"></table>
                </div>

                <table class="mediumMargin" id="testInfoDialog_markAndPointsContainer">
                    <tr id="testInfoDialog_pointsContainer">
                        <td><span class="classFlag_private">Punkte:</span><span class="classFlag_class">Durchschnittspunktzahl:</span></td>
                        <td id="testInfoDialog_points"></td>
                    </tr>
                    <tr id="testInfoDialog_averageContainer">
                        <td><span class="dialogType_subject dialogType_folder">Notenschnitt:</span><span class="dialogType_test dialogType_ref">Ungerundete Note:</span></td>
                        <td id="testInfoDialog_average"></td>
                    </tr>
                    <tr id="testInfoDialog_markContainer">
                        <td><span class="classFlag_private">Note:</span><span class="classFlag_class">Klassenschnitt:</span></td>
                        <td id="testInfoDialog_mark"></td>
                    </tr>
                </table>

                <div class="buttonGroup mediumMargin">
                    <button id="testInfoDialog_loadMoreButton" class="button_medium neutral"><img src="/img/info.svg">Mehr laden</button>
                    <button id="testInfoDialog_visibilityButton" class="button_medium positive">Ausblenden</button>
                </div>
                <div class="buttonGroup noMargin">
                    <button id="testInfoDialog_actionButton" class="button_medium positive">Verschieben</button>
                    <button id="testInfoDialog_otherButton" class="button_medium positive">Anderes</button>
                </div>
                <div id="testInfoDialog_controlButtons" class="buttonGroup noMargin">
                    <button id="testInfoDialog_editButton" class="button_medium positive"><img src="/img/edit.svg">Bearbeiten</button>
                    <button id="testInfoDialog_deleteButton" class="button_medium negative"><img src="/img/delete.svg">Löschen</button>
                </div>
                
                <button id="testInfoDialog_closeButton" class="button_big negative smallMargin">Schliessen</button>
            </div>
        </div>

        <?php if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") { ?>

        <div id="classInfoDialog" class="dialog infoDialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent" tabindex="0">
                <h2>Klassen-Eigenschaften</h3>

                <h3 id="classInfoDialog_name">Name</h3>

                <table id="classInfoDialog_refContainer" class="mediumMargin">
                    <tr>
                        <td>Referenzierte Klasse:</td>
                        <td id="classInfoDialog_refClassName">Originalname</td>
                    </tr>
                    <tr id="classInfoDialog_refUserNameContainer">
                        <td>Besitzer der referenzierten Klasse:</td>
                        <td id="classInfoDialog_refUserName">Besitzer</td>
                    </tr>
                </table>

                <table class="mediumMargin">
                    <tr>
                        <td>Ausgeblendet:</td>
                        <td><img id="classInfoDialog_isHiddenIcon" src="/img/checked.svg"></td>
                    </tr>
                </table>

                <div id="classInfoDialog_notesContainer" class="mediumMargin notes leftAlign">
                    <p>Notizen:</p>
                    <div style="white-space: pre;" id="classInfoDialog_notes"></div>
                </div>

                <div id="classInfoDialog_permissionsContainer" class="mediumMargin leftAlign">
                    <p>Zugriffsberechtigungen:</p>
                    <p id="classInfoDialog_noPermissions" class="smallMargin"><i>Keine weiteren Zugriffsberechtigungen erteilt.</i></p>
                    <table id="classInfoDialog_permissions" class="smallMargin"></table>
                </div>

                <div class="buttonGroup mediumMargin">
                    <button id="classInfoDialog_loadMoreButton" class="button_medium neutral"><img src="/img/info.svg">Mehr laden</button>
                    <button id="classInfoDialog_visibilityButton" class="button_medium positive">Ausblenden</button>
                </div>
                <div class="buttonGroup noMargin">
                    <button id="classInfoDialog_actionButton" class="button_medium positive">Kopieren</button>
                    <button id="classInfoDialog_action2Button" class="button_medium positive">Übertragen</button>
                </div>
                <div id="classInfoDialog_controlButtons" class="buttonGroup noMargin">
                    <button id="classInfoDialog_editButton" class="button_medium positive"><img src="/img/edit.svg">Bearbeiten</button>
                    <button id="classInfoDialog_deleteButton" class="button_medium negative"><img src="/img/delete.svg">Löschen</button>
                </div>

               <button id="classInfoDialog_closeButton" class="button_big negative smallMargin">Schliessen</button>
            </div>
        </div>

        <div id="studentInfoDialog" class="dialog infoDialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent" tabindex="0">
                <h2 id="studentInfoDialog_header">Schüler-Eigenschaften</h3>

                <h3 id="studentInfoDialog_name">Name</h3>

                <table class="mediumMargin">
                    <tr id="studentInfoDialog_firstNameContainer">
                        <td>Vorname:</td>
                        <td id="studentInfoDialog_firstName"></td>
                    </tr>
                    <tr>
                        <td>Nachname:</td>
                        <td id="studentInfoDialog_lastName"></td>
                    </tr>
                    <tr id="studentInfoDialog_genderContainer">
                        <td>Geschlecht:</td>
                        <td id="studentInfoDialog_gender"></td>
                    </tr>
                </table>

                <table class="mediumMargin" id="studentInfoDialog_userNameContainer">
                    <tr>
                        <td>Verknüpftes Konto:</td>
                        <td id="studentInfoDialog_userName"></td>
                    </tr>
                </table>

                <table class="mediumMargin">
                    <tr>
                        <td>Ausgeblendet:</td>
                        <td><img id="studentInfoDialog_isHiddenIcon" src="/img/checked.svg"></td>
                    </tr>
                </table>

                <table class="mediumMargin" id="studentInfoDialog_markAndPointsContainer">
                    <tr id="studentInfoDialog_pointsContainer">
                        <td>Punkte:</td>
                        <td id="studentInfoDialog_points"></td>
                    </tr>
                    <tr id="studentInfoDialog_averageContainer">
                        <td><span class="type_subject type_folder type_root">Notenschnitt:</span><span class="type_test type_ref">Ungerundete Note:</span></td>
                        <td id="studentInfoDialog_average"></td>
                    </tr>
                    <tr id="studentInfoDialog_markContainer">
                        <td>Note:</td>
                        <td id="studentInfoDialog_mark"></td>
                    </tr>
                    <tr id="studentInfoDialog_plusPointsContainer">
                        <td>Hochpunkte:</td>
                        <td id="studentInfoDialog_plusPoints"></td>
                    </tr>
                </table>

                <div id="studentInfoDialog_notesContainer" class="mediumMargin notes leftAlign">
                    <p>Anmerkungen:</p>
                    <div style="white-space: pre;" id="studentInfoDialog_notes"></div>
                </div>

                <div class="buttonGroup mediumMargin">
                    <button id="studentInfoDialog_visibilityButton" class="button_big positive">Ausblenden</button>
                </div>

                <div id="studentInfoDialog_controlButtons" class="buttonGroup noMargin">
                    <button id="studentInfoDialog_editButton" class="button_medium positive"><img src="/img/edit.svg">Bearbeiten</button>
                    <button id="studentInfoDialog_deleteButton" class="button_medium negative"><img src="/img/delete.svg">Löschen</button>
                </div>

               <button id="studentInfoDialog_closeButton" class="button_big negative smallMargin">Schliessen</button>
            </div>
        </div>

        <?php } ?>
    </body>
</html>