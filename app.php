<?php

/* Kernseite der Applikation, hier werden alle Semester/Noten angezeigt. */

$loginRequired = true;
include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/login.php");

?>

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"> 

        <title>Notentabelle - App</title>

        <link rel="stylesheet" href="/css/basicStylesheet.css">
        <link rel="stylesheet" href="/modules/dialog/dialogStylesheet.css">
        <link rel="stylesheet" href="/modules/loading/loadingStylesheet.css">
        <link rel="stylesheet" href="/modules/buttonSelect/buttonSelectStylesheet.css">
        <link rel="stylesheet" href="/css/stylesheet.css">
        <link rel="stylesheet" href="/css/appStylesheet.css">

        <!-- Icons -->
        <link rel="icon" href="/img/logo/logo.ico" sizes="48x48">
        <link rel="icon" type="image/png" href="/img/logo/logo_192x192.png" sizes="192x192">
        <link rel="icon" type="image/svg+xml" href="/img/logo/logo.svg">
        <link rel="apple-touch-icon" href="/img/logo/logo_white_180x180.png">
        
        <link rel="manifest" href="/manifest.json">

        <meta name="apple-mobile-web-app-capable" content="yes">

        <noscript><meta http-equiv="refresh" content="0; /error?error=1&origin=app"></noscript>

        <script>
            window.addEventListener("pageshow", function(event) { if(event.persisted) window.location.reload()});
            if("serviceWorker" in navigator && navigator.serviceWorker.controller) navigator.serviceWorker.oncontrollerchange = function() { alert("Updates wurden durchgeführt. Die Webapp wird neugeladen, damit sie richtig funktioniert."); window.location.reload(); };
        </script>

        <script>
            var user = {
                userName: <?php echo json_encode($_SESSION["username"]); ?>,
                isTeacher: <?php echo ($_SESSION["isTeacher"] ? "true" : "false") ?>,
                lowerDisplayBound: <?php echo $_SESSION["lowerDisplayBound"]; ?>,
                upperDisplayBound: <?php echo $_SESSION["upperDisplayBound"]; ?>
            };

            if("serviceWorker" in navigator) {
                navigator.serviceWorker.register("/serviceWorker.js");
            }
        </script>

        <script language="javascript" type="text/javascript" src="/modules/dialog/dialogScript.js"></script>
        <script language="javascript" type="text/javascript" src="/modules/dialog/alertScript.js"></script>
        <script language="javascript" type="text/javascript" src="/modules/loading/loadingScript.js"></script>
        <script language="javascript" type="text/javascript" src="/modules/buttonSelect/buttonSelectScript.js"></script>
        <script language="javascript" type="text/javascript" src="/js/main.js"></script>
        <script language="javascript" type="text/javascript" src="/js/editDialog.js"></script>
        <script language="javascript" type="text/javascript" src="/js/app/app.js"></script>

        <?php if($_SESSION["isTeacher"]) { ?>
            <script language="javascript" type="text/javascript" src="/js/app/appTeacher.js"></script>
        <?php } ?>

        <link rel="preload" href="/img/icons/loading.svg" as="image">
        <link rel="prefetch" href="/img/icons/loading.svg">

        <style id="parentTypeStyles"></style>
        <style id="typeStyles"></style>
        <style id="dialogTypeStyles"></style>
        <style id="classFlagStyles"></style>
        <style id="modeFlagStyles"></style>
    </head>
    
    <body>
        <?php include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/preload.php"); ?>
        
        <nav>
            <img id="returnButton" src="/img/icons/arrow_back.svg" alt="<" tabindex="0">
            <div id="header">
                <h1 id="title">Semesterauswahl</h1>
            </div>
            <script language="javascript" type="text/javascript" src="/js/menu.js"></script>
        </nav>

        <div class="panel" id="semesters_div" style="display: none">
            <div class="container">
                <button id="semesters_addSemesterButton" class="button_big positive withMargin">Neues Semester</button>

                <div class="buttonGroup noMargin">
                    <button id="semesters_addTemplateButton" class="button_medium positive">Neue Vorlage</button>
                    <button id="semesters_addFolderButton" class="button_medium positive">Neuer Ordner</button>
                </div>
                
                <div id="semesters_empty" class="info gray bigMargin">
                    <p class="blankLine_small">Kein Element vorhanden.</p>
                    <p>Fügen Sie ein Semester, eine Vorlage oder einen Ordner mit den obigen Knöpfen ein.</p>
                </div>
            </div>

            <div id="semesters_folders" style="display: none">
                <h2>Ordner</h2>
                <table class="mainTable">
                    <tbody id="semesters_folders_tableBody">
                    </tbody>
                </table>
            </div>

            <div id="semesters_semesters" style="display: none">
                <h2>Semester</h2>
                <table class="mainTable">
                    <tbody id="semesters_semesters_tableBody">
                    </tbody>
                </table>
            </div>

            <div id="semesters_templates" style="display: none">
                <h2>Vorlagen</h2>
                <table class="mainTable">
                    <tbody id="semesters_templates_tableBody">
                    </tbody>
                </table>
            </div>

            <div class="container">
                <?php 
                    if($_SESSION["isTeacher"]) {
                        echo "<button id='semesters_classButton' class='button_big positive withMargin'>Klassen</button>";
                    }
                ?>
                
                <!--<div class="buttonGroup" id="semesters_templateButtons">
                    <button class="button_big positive">Öffentliche Vorlagen</button>
                    <button class="button_big positive">Eigene veröffentlichte Vorlagen</button>
                </div>-->

                <button id="semesters_foreignSemestersButton" class="button_big positive withMargin">Geteilte Semester / Vorlagen</button>
                
                <button id="semesters_visibilityButton" class="button_big positive bigMargin">Archivierte Elemente <span>anzeigen</span></button>
                <button id="semesters_deletedButton" class="button_big positive">Gelöschte Elemente</button>

                <div id="semesters_folderButtons" class="withMargin">
                    <button class="button_big neutral withImage" id="semesters_infoButton"><img src="/img/icons/info.svg" alt="">Ordnereigenschaften</button>

                    <div class="buttonGroup noMargin">
                        <button class="button_medium positive withImage" id="semesters_editButton"><img src="/img/icons/edit.svg" alt="">Ordner umbenennen</button>
                        <button class="button_medium negative withImage" id="semesters_deleteButton"><img src="/img/icons/delete.svg" alt="">Ordner löschen</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="panel" id="tests_div" style="display: none">
            <div class="container">
                <div id="tests_addSubjectButtons">
                    <button id="tests_addSubjectButton" class="button_big positive withMargin">Neues Fach / Neuer Ordner</button>

                    <div class="buttonGroup noMargin">
                        <button id="tests_addRootTestButton" class="button_medium positive">Neue Prüfung</button>
                        <button id="tests_addRootRefButton" class="button_medium positive">Neue Veknüpf.</button>
                    </div>
                </div>

                <div id="tests_addFolderButtons" style="display: none">
                    <button id="tests_addTestButton" class="button_big positive withMargin">Neue Prüfung</button>

                    <div class="buttonGroup noMargin">
                        <button id="tests_addFolderButton" class="button_medium positive">Neuer Ordner</button>
                        <button id="tests_addRefButton" class="button_medium positive">Neue Veknüpf.</button>
                    </div>
                </div>

                <button class="button_big positive" id="tests_followRefButton" style="display: none">Zum referenzierten Element</button>

                <div id="tests_empty">
                    <div class="info gray bigMargin">
                        <p class="blankLine_small">Kein Element vorhanden.</p>
                        <p id="tests_empty_instruction">Fügen Sie <span class="type_root">ein Fach</span><span class="type_folder type_subject">einen Ordner</span>, eine Prüfung oder eine Verknüpfung mit den obigen Knöpfen ein</p>
                        <!--<p id="tests_empty_templateInstruction">oder benutzen Sie eine Vorlage.</p>-->
                    </div>
                    <button id="tests_empty_templateButton" class="button_big positive withMargin notImplemented">Vorlage verwenden</button>
                </div>
            </div>

            <table class="mainTable" id="tests_table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th id="tests_table_date">Datum</th>
                        <th id="tests_table_weight">Gew.</th>
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

            <div id="tests_testInfo_div" class="container" style="display:none;">
                <h2>Eigenschaften der <span class="type_test">Prüfung</span><span class="type_ref"><br>Verknüpfung</span></h2>

                <table>
                    <tr>
                        <td>Typ:</td>
                        <td><i id="tests_testInfo_type"></i></td>
                    </tr>
                </table>

                <table id="tests_testInfo_generalInfoContainer" class="smallMargin">
                    <tr id="tests_testInfo_subjectNameContainer">
                        <td>Fach:</td>
                        <td id="tests_testInfo_subjectName"></td>
                    </tr>
                    <tr id="tests_testInfo_semesterNameContainer">
                        <td>Semester:</td>
                        <td id="tests_testInfo_semesterName"></td>
                    </tr>
                    <tr id="tests_testInfo_classNameContainer">
                        <td>Klasse:</td>
                        <td id="tests_testInfo_className"></td>
                    </tr>
                    <tr id="tests_testInfo_dateContainer">
                        <td>Datum:</td>
                        <td id="tests_testInfo_date"></td>
                    </tr>
                </table>

                <table id="tests_testInfo_refContainer" class="mediumMargin">
                    <tr>
                        <td>Verknüpfungsstatus:</td>
                        <td id="tests_testInfo_referenceState"></td>
                    </tr>
                    <tr id="tests_testInfo_refTestNameContainer">
                        <td>Referenziertes Element:</td>
                        <td id="tests_testInfo_refTestName"></td>
                    </tr>
                    <tr id="tests_testInfo_refUserNameContainer">
                        <td>Besitzer des ref. Elements:</td>
                        <td id="tests_testInfo_refUserName"></td>
                    </tr>
                </table>

                <div class="inputGroup mediumMargin">
                    <div>
                        <table>
                            <tr>
                                <td>Ausgeblendet:</td>
                                <td><img id="tests_testInfo_isHiddenIcon" src="/img/icons/checked.svg"></td>
                            </tr>
                        </table>
                    </div>
                    <div>
                        <table>
                            <tr>
                                <td>Zählt:</td>
                                <td><img id="tests_testInfo_markCountsIcon" src="/img/icons/checked.svg"></td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="inputGroup mediumMargin">
                    <div id="tests_testInfo_markSettingsContainer">
                        <table>
                            <tr id="tests_testInfo_weightContainer">
                                <td>Gewichtung:</td>
                                <td id="tests_testInfo_weight"></td>
                            </tr>
                            <tr>
                                <td>Rundung:</td>
                                <td id="tests_testInfo_round"></td>
                            </tr>
                        </table>
                    </div>
                    <div id="tests_testInfo_pointsSettingsContainer">
                        <table>
                            <tr id="tests_testInfo_formulaContainer">
                                <td>Formel:</td>
                                <td id="tests_testInfo_formula"></td>
                            </tr>
                            <tr id="tests_testInfo_maxPointsContainer">
                                <td>Maximalpkte.:</td>
                                <td id="tests_testInfo_maxPoints"></td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div id="tests_testInfo_notesContainer" class="mediumMargin notes leftAlign">
                    <p>Notizen:</p>
                    <div style="white-space: pre;" id="tests_testInfo_notes"></div>
                </div>

                <div id="tests_testInfo_studentNotesContainer" class="mediumMargin notes leftAlign">
                    <p>Persönliche Anmerkungen:</p>
                    <div style="white-space: pre;" id="tests_testInfo_studentNotes"></div>
                </div>

                <div id="tests_testInfo_permissionsContainer" class="mediumMargin leftAlign">
                    <p>Lehrpersonen / Zugriffsberechtigungen:</p>
                    <p id="tests_testInfo_noPermissions" class="smallMargin"><i>Keine Lehrpersonen angegeben.</i></p>
                    <table id="tests_testInfo_permissions" class="smallMargin"></table>
                </div>

                <table class="mediumMargin" id="tests_testInfo_markAndPointsContainer">
                    <tr id="tests_testInfo_pointsContainer">
                        <td>Punkte:</td>
                        <td id="tests_testInfo_points"></td>
                    </tr>
                    <tr id="tests_testInfo_averageContainer">
                        <td>Ungerundete Note:</td>
                        <td id="tests_testInfo_average"></td>
                    </tr>
                    <tr id="tests_testInfo_markContainer">
                        <td>Note:</td>
                        <td id="tests_testInfo_mark"></td>
                    </tr>
                </table>

                <div class="buttonGroup mediumMargin">
                    <button id="tests_testInfo_loadMoreButton" class="button_medium neutral withImage"><img src="/img/icons/info.svg">Mehr laden</button>
                    <button id="tests_testInfo_visibilityButton" class="button_medium negativeNeutral"></button>
                </div>
                <div class="buttonGroup noMargin" style="margin-bottom: -40px;">
                    <!--<button id="tests_testInfo_actionButton" class="button_medium positive">Verschieben</button>-->
                    <!--<button id="tests_testInfo_otherButton" class="button_medium positive">Anderes</button>-->
                </div>
            </div>

            <?php if($_SESSION["isTeacher"]) { ?>

            <table id="tests_studentTable" class="bigMargin mainTable">
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
                <?php if($_SESSION["isTeacher"]) { ?>

                <div class="info red bigMargin" id="tests_noClass">
                    <p class="blankLine_small">Die zu diesem Klassensemester gehörende Klasse ist gelöscht worden. Entsprechend sind alle Noten/Punkte der Schüler/innen auch gelöscht und Sie können keine Änderungen mehr vornehmen.</p>
                </div>
                    
                <div id="tests_studentButtons">
                    <div class="info gray bigMargin" id="tests_noMarks" style="display: none;">
                        <p class="blankLine_small">Kein/e Schüler/in hat Noten oder Punkte oder es gibt keine Schüler/innen in dieser Klasse.</p>
                        <p id="tests_noMarks_instruction">Fügen Sie Noten/Punkte hinzu, indem Sie Knopf unten benutzen.</p>
                    </div>

                    <button id="tests_editMarksButton" class="button_big positive withMargin">Noten / Punkte bearbeiten</button>
                    <div class="info red" id="tests_errorContainer"></div>
                    <div id="tests_markControlButtons" class="buttonGroup withMargin" style="display: none;">
                        <button id="tests_cancelButton" class="button_medium negative">Veränderungen verwerfen</button>
                        <button id="tests_OKButton" class="button_medium positive">Veränderungen speichern</button>
                    </div>
                    
                    <button id="tests_studentVisibilityButton" class="button_big positive withMargin">Archivierte Schüler/innen <span>anzeigen</span></button>
                    <button id="tests_studentMarkVisibiltyButton" class="button_big positive">Schüler/innen ohne Daten <span>anzeigen</span></button>
                </div>

                <?php } ?>

                <button id="tests_visibilityButton" class="button_big positive withMargin">Auszublendende Elemente <span>anzeigen</span></button>
                <button id="tests_deletedButton" class="button_big positive">Gelöschte Elemente</button>

                <div id="tests_semesterButtons" style="display: block;">
                    <button class="button_big neutral withMargin withImage" id="tests_semesterInfoButton"><img src="/img/icons/info.svg" alt=""><span class="parentType_semester">Semester</span><span class="parentType_template">Vorlage</span>-Eigenschaften</button>

                    <div class="buttonGroup noMargin" id="tests_semesterControlButtons">
                        <button class="button_medium positive withImage" id="tests_editSemesterButton"><img src="/img/icons/edit.svg" alt=""><span class="parentType_semester">Semester</span><span class="parentType_template">Vorlage</span> bearbeiten</button>
                        <button class="button_medium negative withImage" id="tests_deleteSemesterButton"><img src="/img/icons/delete.svg" alt=""><span class="parentType_semester">Semester</span><span class="parentType_template">Vorlage</span> löschen</button>
                    </div>
                </div>

                <div id="tests_elementButtons" style="display: none;">
                    <button class="button_big neutral withMargin withImage" id="tests_elementInfoButton"><img src="/img/icons/info.svg" alt=""><span class="type_subject">Fach</span><span class="type_folder">Ordner</span><span class="type_test">Prüfungs</span><span class="type_ref">Verknüpfungs</span>-Eigenschaften</button>

                    <div class="buttonGroup noMargin" id="tests_elementControlButtons">
                        <button class="button_medium positive withImage" id="tests_editElementButton"><img src="/img/icons/edit.svg" alt=""><span class="type_subject">Fach</span><span class="type_folder">Ordner</span><span class="type_test">Prüfung</span><span class="type_ref">Verknüpfung</span> bearbeiten</button>
                        <button class="button_medium negative withImage" id="tests_deleteElementButton"><img src="/img/icons/delete.svg" alt=""><span class="type_subject">Fach<br></span><span class="type_folder">Ordner</span><span class="type_test">Prüfung</span><span class="type_ref">Verknüpfung</span> löschen</button>
                    </div>
                </div>

                <button id="tests_calculatorButton" class="button_big positive bigMargin notImplemented">Notenrechner</button>
                <button id="tests_markPaperButton" class="button_big positive withMargin notImplemented">Notenblatt</button>
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
                <h2>Geteilte Semester und Vorlagen:</h2>
                <table class="bigMargin mainTable">
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

            <?php if($_SESSION["isTeacher"]) { ?>

            <div id="foreignSemesters_teacher">
                <h2>Mit Zugriff als Lehrperson</h2>
                <table class="bigMargin mainTable">
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
                <table class="bigMargin mainTable">
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

            <div class="container">
                <button id="foreignSemesters_visibilityButton" class="button_big positive withMargin">Archivierte Elemente <span><?php echo ($_SESSION["isTeacher"] ? "anzeigen" : "ausblenden") ?></span></button>
            </div>
        </div>

        <?php if($_SESSION["isTeacher"]) { ?>

        <div class="panel" id="classes_div" style="display: none">
            <div class="container">
                <button id="classes_addClassButton" class="button_big positive withMargin">Neue Klasse</button>

                <div id="classes_empty">
                    <div class="info gray bigMargin">
                        <p class="blankLine_small">Keine Klasse vorhanden.</p>
                        <p>Fügen Sie eine Klasse mit dem obigen Knopf ein.</p>
                    </div>
                </div>
            </div>

            <table id="classes_table" class="mainTable">
                <tbody id="classes_tableBody">
                </tbody>
            </table>

            <div class="container">
                <button id="classes_foreignClassesButton" class='button_big positive withMargin'>Geteilte Klassen</button>

                <button id="classes_visibilityButton" class="button_big positive bigMargin">Archivierte Klassen <span>anzeigen</span></button>
                <button id="classes_deletedButton" class="button_big positive">Gelöschte Klassen</button>
            </div>
        </div>

        <div class="panel" id="students_div" style="display: none">
            <div class="container">
                <button id="students_addStudentButton" class="button_big positive withMargin">Neue/r Schüler/in</button>

                <div id="students_empty">
                    <div class="info gray bigMargin">
                        <p class="blankLine_small">Keine Schüler/innen vorhanden.</p>
                        <p id="students_empty_instruction">Fügen Sie eine/n Schüler/in mit dem obigen Knopf ein.</p>
                    </div>
                </div>
            </div>

            <table id="students_table" class="mainTable">
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
                <button id="students_visibilityButton" class="button_big positive">Archivierte Schüler/innen <span>anzeigen</span></button>
                <button id="students_deletedButton" class="button_big positive">Gelöschte Schüler/innen</button>

                <button class="button_big neutral withMargin withImage" id="students_classInfoButton"><img src="/img/icons/info.svg" alt=" ">Klassen-Eigenschaften</button>

                <div class="buttonGroup noMargin" id="students_classControlButtons">
                    <button class="button_medium positive withImage" id="students_editClassButton"><img src="/img/icons/edit.svg" alt=" ">Klasse bearbeiten</button>
                    <button class="button_medium negative withImage" id="students_deleteClassButton"><img src="/img/icons/delete.svg" alt=" ">Klasse löschen</button>
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

            <table class="bigMargin mainTable" id="foreignClasses_table">
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

            <div class="container">
                <button id="foreignClasses_visibilityButton" class="button_big positive withMargin">Archivierte Klassen <span>anzeigen</span></button>
            </div>
        </div>

        <?php } ?>

        <div class="panel" id="publicTemplates_div" style="display: none">
            <div class="container">
                <input type="text">
                <!-- Suchfelder -->
            </div>

            <table class="mainTable">
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

            <table class="mainTable">
                <tbody id="publishedTemplates_tableBody">
                </tbody>
            </table>
        </div>
        
        <div class="panel" id="error_div" style="display: none;">
            <img id="error" src="/img/icons/error.svg" alt="">

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
                    <p>Dieses Element existiert nicht (mehr) oder Sie haben keinen Zugriff (mehr) darauf.</p>
                </div>
            </div>

            <button class="button_small positive bigMargin" id="error_returnButton">Zurück</button>
        </div>

        <div id="semesterInfoDialog" class="dialog infoDialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
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
                        <td>Archiviert / ausgeblendet:</td>
                        <td><img id="semesterInfoDialog_isHiddenIcon" src="/img/icons/checked.svg"></td>
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
                        <td><span class="classFlag_private">Notenschnitt:</span><span class="classFlag_class">Klassenschnitt:</span></td>
                        <td id="semesterInfoDialog_mark"></td>
                    </tr>
                    <tr>
                        <td><span class="classFlag_private">Hochpunkte:</span><span class="classFlag_class">Durchschnitt. Hochpunktzahl:</span></td>
                        <td id="semesterInfoDialog_plusPoints"></td>
                    </tr>
                </table>

                <div class="buttonGroup mediumMargin">
                    <button id="semesterInfoDialog_loadMoreButton" class="button_medium neutral withImage"><img src="/img/icons/info.svg">Mehr laden</button>
                    <button id="semesterInfoDialog_visibilityButton" class="button_medium negativeNeutral withImage" style="display: inline-block;"><img src="/img/icons/archive.svg">Archivieren</button>
                </div>
                <div class="buttonGroup noMargin">
                    <button id="semesterInfoDialog_actionButton" class="button_big positive withImage"><img src="/img/icons/save.svg">Verknüpfung erstellen</button>
                    <!--<button id="semesterInfoDialog_actionButton" class="button_medium positive">Verschieben</button>-->
                    <!--<button id="semesterInfoDialog_otherButton" class="button_medium positive">Anderes</button>-->
                </div>
                <div id="semesterInfoDialog_controlButtons" class="buttonGroup noMargin">
                    <button id="semesterInfoDialog_editButton" class="button_medium positive withImage"><img src="/img/icons/edit.svg">Bearbeiten</button>
                    <button id="semesterInfoDialog_deleteButton" class="button_medium negative withImage"><img src="/img/icons/delete.svg">Löschen</button>
                </div>

                <button id="semesterInfoDialog_closeButton" class="button_big negative smallMargin">Schliessen</button>
            </div>
        </div>

        <div id="testInfoDialog" class="dialog infoDialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
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
                                <td><img id="testInfoDialog_isHiddenIcon" src="/img/icons/checked.svg"></td>
                            </tr>
                        </table>
                    </div>
                    <div>
                        <table>
                            <tr>
                                <td>Zählt:</td>
                                <td><img id="testInfoDialog_markCountsIcon" src="/img/icons/checked.svg"></td>
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
                    <button id="testInfoDialog_loadMoreButton" class="button_medium neutral withImage"><img src="/img/icons/info.svg">Mehr laden</button>
                    <button id="testInfoDialog_visibilityButton" class="button_medium negativeNeutral"></button>
                </div>
                <div class="buttonGroup noMargin">
                    <!--<button id="testInfoDialog_actionButton" class="button_medium positive">Verschieben</button>-->
                    <!--<button id="testInfoDialog_otherButton" class="button_medium positive">Anderes</button>-->
                </div>
                <div id="testInfoDialog_controlButtons" class="buttonGroup noMargin">
                    <button id="testInfoDialog_editButton" class="button_medium positive withImage"><img src="/img/icons/edit.svg">Bearbeiten</button>
                    <button id="testInfoDialog_deleteButton" class="button_medium negative withImage"><img src="/img/icons/delete.svg">Löschen</button>
                </div>
                
                <button id="testInfoDialog_closeButton" class="button_big negative smallMargin">Schliessen</button>
            </div>
        </div>

        <?php if($_SESSION["isTeacher"]) { ?>

        <div id="classInfoDialog" class="dialog infoDialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
                <h2><span class="dialogType_class">Klassen</span><span class="dialogType_classRef">Verknüpfungs</span>-Eigenschaften</h3>

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
                        <td>Archiviert / ausgeblendet:</td>
                        <td><img id="classInfoDialog_isHiddenIcon" src="/img/icons/checked.svg"></td>
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
                    <button id="classInfoDialog_loadMoreButton" class="button_medium neutral withImage"><img src="/img/icons/info.svg">Mehr laden</button>
                    <button id="classInfoDialog_visibilityButton" class="button_medium negativeNeutral"></button>
                </div>
                <div class="buttonGroup noMargin">
                <button id="classInfoDialog_actionButton" class="button_big positive withImage"><img src="/img/icons/save.svg" alt=" ">Verknüpfung erstellen</button>
                    <!--<button id="classInfoDialog_actionButton" class="button_medium positive">Kopieren</button>-->
                    <!--<button id="classInfoDialog_action2Button" class="button_medium positive">Übertragen</button>-->
                </div>
                <div id="classInfoDialog_controlButtons" class="buttonGroup noMargin">
                    <button id="classInfoDialog_editButton" class="button_medium positive withImage"><img src="/img/icons/edit.svg">Bearbeiten</button>
                    <button id="classInfoDialog_deleteButton" class="button_medium negative withImage"><img src="/img/icons/delete.svg">Löschen</button>
                </div>

               <button id="classInfoDialog_closeButton" class="button_big negative smallMargin">Schliessen</button>
            </div>
        </div>

        <div id="studentInfoDialog" class="dialog infoDialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
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
                        <td>Archiviert / ausgeblendet:</td>
                        <td><img id="studentInfoDialog_isHiddenIcon" src="/img/icons/checked.svg"></td>
                    </tr>
                </table>

                <table class="mediumMargin" id="studentInfoDialog_markAndPointsContainer">
                    <tr id="studentInfoDialog_pointsContainer">
                        <td>Punkte<span id="studentInfoDialog_pointsLabelFragment"> vor Änderung</span>:</td>
                        <td id="studentInfoDialog_points"></td>
                    </tr>
                    <tr id="studentInfoDialog_averageContainer">
                        <td><span class="type_subject type_folder type_root">Notenschnitt</span><span class="type_test type_ref">Ungerundete Note</span><span id="studentInfoDialog_averageLabelFragment"> vor Änderung</span>:</td>
                        <td id="studentInfoDialog_average"></td>
                    </tr>
                    <tr id="studentInfoDialog_markContainer">
                        <td>Note<span id="studentInfoDialog_markLabelFragment"> vor Änderung</span>:</td>
                        <td id="studentInfoDialog_mark"></td>
                    </tr>
                    <tr id="studentInfoDialog_plusPointsContainer">
                        <td>Hochpunkte:</td>
                        <td id="studentInfoDialog_plusPoints"></td>
                    </tr>
                </table>

                <div id="studentInfoDialog_notesContainer" class="mediumMargin notes leftAlign">
                    <p>Anmerkungen<span id="studentInfoDialog_notesLabelFragment"> vor Änderung</span>:</p>
                    <div style="white-space: pre;" id="studentInfoDialog_notes"></div>
                </div>

                <div class="buttonGroup mediumMargin">
                    <button id="studentInfoDialog_visibilityButton" class="button_big negativeNeutral"></button>
                </div>

                <div id="studentInfoDialog_controlButtons" class="buttonGroup noMargin">
                    <button id="studentInfoDialog_editButton" class="button_medium positive withImage"><img src="/img/icons/edit.svg">Bearbeiten</button>
                    <button id="studentInfoDialog_deleteButton" class="button_medium negative withImage"><img src="/img/icons/delete.svg">Löschen</button>
                </div>

               <button id="studentInfoDialog_closeButton" class="button_big negative smallMargin">Schliessen</button>
            </div>
        </div>

        <?php } ?>

        <div id="editSemesterDialog" class="dialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
                <h2><span class="dialogType_semesterFolder">Ordner</span><span class="dialogType_semester">Semester</span><span class="dialogType_template">Vorlage</span><span class="dialogType_semesterRef dialogType_templateRef">Verknüpfung</span> <span class="modeFlag_edit">bearbeiten</span><span class="modeFlag_add">hinzufügen</span></h2>

                <label for="editSemesterDialog_name">Name:</label>
                <input type="text" id="editSemesterDialog_name" placeholder="Name" />

                <div class="buttonSelectGroup single" id="editSemesterDialog_templateType">
                    <button class="positive">Semestervorlage</button>
                    <button class="positive unselected">Fachvorlage</button>
                </div>

                <div class="buttonSelectGroup single" id="editSemesterDialog_semesterType">
                    <button class="positive">privates Semester</button>
                    <button class="positive unselected">Klassensemester</button>
                </div>

                <button class="button_big positive withMargin" id="editSemesterDialog_classButton">Klasse auswählen</button>
                <button class="button_big positive notImlemented" id="editSemesterDialog_teacherButton">Lehrpersonen kopieren aus...</button>

                <button class="button_big positive withMargin" id="editSemesterDialog_templateButton">Vorlage auswählen</button>

                <button class="button_big positive withMargin notImplemented" id="editSemesterDialog_refTestButton">Einstiegspunkt festlegen</button>

                <label><input type="checkbox" id="editSemesterDialog_with_notes"/>Notizen</label>
                <textarea id="editSemesterDialog_notes" placeholder="Notizen"></textarea>

                <button class="button_big positive withMargin" id="editSemesterDialog_permissionsButton">Zugriffsberechtigungen</button>

                <div class="info orange" id="editSemesterDialog_warningContainer"></div>
                <div class="info red" id="editSemesterDialog_errorContainer"></div>

                <div class="buttonGroup">
                    <button class="button_medium negative" id="editSemesterDialog_cancelButton">Abbrechen</button>
                    <button class="button_medium positive" id="editSemesterDialog_OKButton"><span class="modeFlag_edit">Speichern</span><span class="modeFlag_add">Hinzufügen</span></button>
                </div>
            </div>
        </div>

        <div id="editTestDialog" class="dialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
                <h2><span class="dialogType_subject">Fach</span><span class="dialogType_folder">Ordner</span><span class="dialogType_test">Prüfung</span><span class="dialogType_ref">Verknüpfung</span> <span class="modeFlag_edit">bearbeiten</span><span class="modeFlag_add">hinzufügen</span></h2>

                <label for="editTestDialog_name">Name:</label>
                <input type="text" id="editTestDialog_name" placeholder="Name" />

                <div class="buttonSelectGroup single" id="editTestDialog_type">
                    <button class="positive">Nur Note</button>
                    <button class="positive unselected">Punkte & Note</button>
                </div>

                <button class="button_big positive withMargin" id="editTestDialog_refTestButton">Referenziertes Element</button>
                <button class="button_big positive withMargin" id="editTestDialog_templateButton">Vorlage auswählen</button>

                <label><input type="checkbox" id="editTestDialog_with_date" />Datum</label>
                <input type="date" id="editTestDialog_date" placeholder="Datum" />

                <div id="editTestDialog_markCountsContainer" class="withMargin checkboxSwitchContainer">
                    <span>Zählt:</span>
                    <label class="checkboxSwitch">
                        <input type="checkbox" id="editTestDialog_markCounts" checked />
                        <span></span>
                    </label>
                </div>

                <div class="inputGroup">
                    <div id="editTestDialog_weightContainer">
                        <label for="editTestDialog_weight">Gewichtung:</label>
                        <input type="number" step="any" min="0" id="editTestDialog_weight" placeholder="Gewichtung" />
                    </div>

                    <div id="editTestDialog_formulaContainer">
                        <label for="editTestDialog_formula">Notenberechnung:</label>
                        <select id="editTestDialog_formula" value="linear">
                            <option value="linear">linear</option>
                            <option value="manual">manuell</option>
                        </select>
                    </div>

                    <div id="editTestDialog_roundContainer">
                        <label for="editTestDialog_roundSelect">Rundung:</label>
                        <div>
                            <select id="editTestDialog_roundSelect" value="0">
                                <option value="0">keine</option>
                                <option value="0.5">auf Halbe</option>
                                <option value="0.25">auf Viertel</option>
                                <option value="0.1">auf 0.1</option>
                                <option value="-1">Anders</option>
                            </select>
                            <input type="number" step="any" min="0" id="editTestDialog_roundCustom" placeholder="Rund." />
                        </div>
                    </div>

                    <div id="editTestDialog_maxPointsContainer">
                        <label for="editTestDialog_maxPoints">Maximalpunktzahl</label>
                        <input type="number" step="any" id="editTestDialog_maxPoints" placeholder="Maximalpkte." />
                    </div>
                </div>

                <label><input type="checkbox" id="editTestDialog_with_notes" />Notizen</label>
                <textarea id="editTestDialog_notes" placeholder="Notizen"></textarea>

                <button class="button_big positive withMargin" id="editTestDialog_permissionsButton">Lehrpersonen</button>

                <div class="inputGroup" id="editTestDialog_markAndPointsContainer">
                    <div id="editTestDialog_pointsContainer">
                        <label for="editTestDialog_points">Punkte:</label>
                        <input type="number" step="any" id="editTestDialog_points" placeholder="Punktzahl" />
                    </div>

                    <div id="editTestDialog_markContainer">
                        <label for="editTestDialog_mark">Note:</label>
                        <input type="number" step="any" id="editTestDialog_mark" placeholder="Note">
                    </div>
                </div>

                <div class="info orange" id="editTestDialog_warningContainer"></div>
                <div class="info red" id="editTestDialog_errorContainer"></div>

                <div class="buttonGroup">
                    <button class="button_medium negative" id="editTestDialog_cancelButton">Abbrechen</button>
                    <button class="button_medium positive" id="editTestDialog_OKButton"><span class="modeFlag_edit">Speichern</span><span class="modeFlag_add">Hinzufügen</span></button>
                </div>
            </div>
        </div>

        <div id="permissionsDialog" class="dialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
                <h2 id="permissionsDialog_header">Zugriffsberechtigungen</h2>
                <div id="permissionsDialog_innerContent">
                    <p id="permissionsDialog_noPermission" class="mediumMargin">Keine Zugriffsberechtigungen erteilt</p>
                    <table id="permissionsDialog_table" class="dialogTable mediumMargin" style="display: none;"></table>

                    <input type="text" placeholder="Benutzername von neuer Person" class="mediumMargin" id="permissionsDialog_newName">
                    <div class="info red" id="permissionsDialog_errorContainer"></div>
                    <button id="permissionsDialog_addButton" class="button_big positive smallMargin">Hinzufügen</button>

                    <!--<button id="permissionsDialog_copyButton" class="button_big positive withMargin">Von anderem Element übernehmen</button>-->
                </div>
                <!--<div class="buttonGroup noMargin">--><div class="buttonGroup withMargin">
                    <button class="button_medium negative" id="permissionsDialog_cancelButton">Abbrechen</button>
                    <button class="button_medium positive" id="permissionsDialog_OKButton">OK</button>
                </div>
            </div>
        </div>

        <div id="selectDialog" class="dialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
                <h2 id="selectDialog_header"></h2>
                <div id="selectDialog_innerContent" style="opacity: 0;">
                    <h3 id="selectDialog_name"></h3>
                    <p id="selectDialog_parentFolder" class="withMargin">Ebene nach oben</p>
                    <p id="selectDialog_noFolders"></p>
                    <p id="selectDialog_folderError">.</p>
                    <table id="selectDialog_folderTable" class="dialogTable"></table>

                    <p id="selectDialog_noElements" class="mediumMargin"></p>
                    <table id="selectDialog_elementTable" class="dialogTable mediumMargin"></table>

                    <div class="withMargin">
                        <button id="selectDialog_deselectButton" class="button_big negative">Auswahl aufheben</button>
                        <button id="selectDialog_selectFolderButton" class="button_big positive">Diesen Ordner auswählen</button>
                    </div>

                    <input type="text" placeholder="Neuer Name" class="mediumMargin" id="selectDialog_newName">
                    <div class="info red" id="selectDialog_errorContainer"></div>
                </div>
                <div class="buttonGroup withMargin">
                    <button class="button_medium negative" id="selectDialog_cancelButton">Abbrechen</button>
                    <button class="button_medium positive" id="selectDialog_OKButton">OK</button>
                </div>
            </div>
        </div>

        <div id="deleteDialog" class="dialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
                <h2 id="deleteDialog_header">Gelöschte Elemente</h2>

                <p id="deleteDialog_noElements" class="mediumMargin">Keine gelöschte Elemente</p>
                <table id="deleteDialog_table" class="dialogTable mediumMargin">
                    <tr>
                        <td>Name</td>
                        <td>
                            <button class="button_square positive"><img src='/img/icons/restore.svg'></button>
                            <button class="button_square negative"><img src='/img/icons/delete.svg'></button>
                        </td>
                    </tr>
                </table>

                <button class="button_big negative mediumMargin" id="deleteDialog_cancelButton">Abbrechen</button>
            </div>
        </div>

        <?php if($_SESSION["isTeacher"]) { ?>

        <div id="editClassDialog" class="dialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
                <h2><span class="dialogType_class">Klasse</span><span class="dialogType_classRef">Verknüpfung</span> <span class="modeFlag_edit">bearbeiten</span><span class="modeFlag_add">hinzufügen</span></h2>

                <label for="editClassDialog_name">Name:</label>
                <input type="text" id="editClassDialog_name" placeholder="Name" />

                <label><input type="checkbox" id="editClassDialog_with_notes" />Notizen</label>
                <textarea id="editClassDialog_notes" placeholder="Notizen"></textarea>

                <button class="button_big positive withMargin" id="editClassDialog_permissionsButton">Zugriffsberechtigungen</button>
                
                <div class="info orange" id="editClassDialog_warningContainer"></div>
                <div class="info red" id="editClassDialog_errorContainer"></div>

                <div class="buttonGroup">
                    <button class="button_medium negative" id="editClassDialog_cancelButton">Abbrechen</button>
                    <button class="button_medium positive" id="editClassDialog_OKButton"><span class="modeFlag_edit">Speichern</span><span class="modeFlag_add">Hinzufügen</span></button>
                </div>
            </div>
        </div>

        <div id="editStudentDialog" class="dialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
                <h2>Schüler/in <span class="modeFlag_edit">bearbeiten</span><span class="modeFlag_add">hinzufügen</span></h2>

                <label for="editStudentDialog_lastNname">Nachname:</label>
                <input type="text" id="editStudentDialog_lastName" placeholder="Nachname" />

                <div class="inputGroup">
                    <div>
                        <label for="editStudentDialog_firstName">Vorname:</label>
                        <input type="text" id="editStudentDialog_firstName" placeholder="Vorname" />
                    </div>
                    <div>
                        <label for="editStudentDialog_gender">Geschlecht:</label>
                        <select type="text" id="editStudentDialog_gender" value="">
                            <option value="">...</option>
                            <option value="m">männlich</option>
                            <option value="f">weiblich</option>
                            <!--<option value="d">divers</option>-->
                        </select>
                    </div>
                </div>

                <label><input type="checkbox" id="editStudentDialog_with_userName" checked />Verknüpftes Schülerkonto</label>
                <input type="text" id="editStudentDialog_userName" placeholder="Benutzername" />

                <label><input type="checkbox" id="editStudentDialog_with_notes" />Anmerkungen / Notizen</label>
                <textarea id="editStudentDialog_notes" placeholder="Notizen"></textarea>
                
                <div class="info orange" id="editStudentDialog_warningContainer"></div>
                <div class="info red" id="editStudentDialog_errorContainer"></div>

                <div class="buttonGroup">
                    <button class="button_medium negative" id="editStudentDialog_cancelButton">Abbrechen</button>
                    <button class="button_medium positive" id="editStudentDialog_OKButton"><span class="modeFlag_edit">Speichern</span><span class="modeFlag_add">Hinzufügen</span></button>
                </div>
            </div>
        </div>

        <div id="editStudentMarkDialog" class="dialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
                <h2>Daten bearbeiten</h2>

                <label><input type="checkbox" id="editStudentMarkDialog_with_notes" checked />Kommentar / Anmerkungen</label>
                <textarea id="editStudentMarkDialog_notes" placeholder="Notizen"></textarea>

                <div class="inputGroup">
                    <div id="editStudentMarkDialog_pointsContainer">
                        <label for="editStudentMarkDialog_points">Punkte:</label>
                        <input type="number" step="any" id="editStudentMarkDialog_points" placeholder="Punktzahl" />
                    </div>

                    <div id="editStudentMarkDialog_markContainer">
                        <label for="editStudentMarkDialog_mark">Note:</label>
                        <input type="number" step="any" id="editStudentMarkDialog_mark" placeholder="Note">
                    </div>
                </div>

                <div class="info red" id="editStudentMarkDialog_errorContainer"></div>

                <div class="buttonGroup">
                    <button class="button_medium negative" id="editStudentMarkDialog_cancelButton">Abbrechen</button>
                    <button class="button_medium positive" id="editStudentMarkDialog_OKButton">OK</button>
                </div>
            </div>
        </div>

        <?php } ?>
    </body>
</html>