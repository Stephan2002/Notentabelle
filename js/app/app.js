// Javascript fuer app.php
// Wird immer hinzugefuegt, auch bei Lehrpersonen

const ERROR_NONE                  = 0;     // kein Fehler
const ERROR_NOT_LOGGED_IN         = 1;     // Nutzer ist nicht eingeloggt
const ERROR_BAD_INPUT             = 2;     // Schlechter User-Input
const ERROR_UNSUITABLE_INPUT      = 3;     // Unpassender (fehlerhafter), aber richtig angegebener User-Input
const ERROR_MISSING_INPUT         = 4;     // Fehlender User-Input
const ERROR_FORBIDDEN_FIELD       = 5;     // User-Input, der angegeben, aber (in jenem Fall) nicht unterstuetzt wird
const ERROR_FORBIDDEN             = 6;     // Element existiert nicht oder Nutzer hat kein Zugriffsrecht
const ERROR_ONLY_TEACHER          = 7;     // Aktion nur fuer Lehrpersonen verfuegbar
const ERROR_NO_WRITING_PERMISSION = 8;     // Benutzer hat nur Leserecht
const ERROR_UNKNOWN               = 10;    // Unbekannter / anderer Fehler

const INFO_NO_CHANGE              = 11;    // Keine Veraenderungen vorgenommen

const TYPE_SEMESTER = 0;
const TYPE_TEST = 1;
const TYPE_CLASS = 2;
const TYPE_STUDENT = 3;
const TYPE_PUBLIC_TEMPLATES = 4;

const ACCESS_UNDEFINED = -1;
const ACCESS_OWNER = 0;
const ACCESS_SHARED = 1;
const ACCESS_TEACHER = 2;
const ACCESS_STUDENT = 3;
const ACCESS_PUBLIC = 4;

var publishInstalled = false;
var isLoading = false;
var isBlocked = false;

var path = [];

var cache = {

    semesters: [],
    tests: [],
    rootSemesters: undefined

};

var additionalInfo = {

    semesters: [],
    tests: []

}

var showHidden = {

    semesters: false,
    tests: false,
    students: false,
    classes: false

};

var editStudents = false;
var showStudentsWithoutMark = false;

var currentElement;


var semesterInfoDialog;
var testInfoDialog;

var additionalTestInfoRequest;

// Maskiert die speziellen HTML-Zeichen
function escapeHTML(text) {

    if (text == null) {

        return "";

    }

    text = text.toString();

    text = text.replace(/&/g, "&amp;");
    text = text.replace(/\"/g, "&quot;");
    text = text.replace(/'/g, "&#039;");
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");

    return text;

}

function formatDate(input) {

    if(input == null) {

        return "";

    }

    var year = input.substr(0, 4);
    var month = input.substr(5, 2);
    var day = input.substr(8, 2);

    return day + "." + month + "." + year;

}

function formatNumber(input, alternativeText = "", digits = 3) {

    if(input == null) {

        return alternativeText;

    }

    return Number(Number(input).toFixed(digits)).toString();

}

function showLoadingOrPrint() {

    if(isLoading) {

        Loading.show(null, "transparent");

    } else {

        printElement();

    }

}

function hideLoading() {

    isLoading = false;

    if(Loading.isVisible()) {

        Loading.hide();
        setTimeout(printElement, 200);

    }

}

function hidePanelsAndPrint() {

    var elements = document.body.children;

    for (var i = 0; i < elements.length; i++) {

        if (elements[i].classList.contains("panel")) {

            elements[i].style.opacity = "0";

        }

    }

    document.getElementById("title").style.opacity = "0";
    document.getElementById("returnButton").style.opacity = "0";

    setTimeout(showLoadingOrPrint, 200);

}

// Funktion zum Laden von Elementen vom Server
function loadData(url, data, success, error) {

    var dataString = data === undefined ? "" : JSON.stringify(data);

    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", url);
    xhttp.responseType = "json";

    xhttp.onload = function () {

        if(this.response === null) {

            if(this.status) {

                error(this.status);

            } else {

                error(-1);

            }

            return;

        }

        if (this.status == 200) {

            if (this.response.error === 0) {

                success(this.response);

            } else {

                error(this.response.error);

            }

        } else {

            error(this.status);

        }

    };

    xhttp.onerror = function () { error(-1); };

    xhttp.send(dataString);

    return xhttp;

}

function loadingError(errorCode) {

    hideLoading();

    currentElement = { error: errorCode };

}

// Zeigt das aktuelle Element an
function printElement() {
    
    isLoading = false;
    isBlocked = false;

    var elements = document.body.children;

    for (var i = 0; i < elements.length; i++) {

        if (elements[i].classList.contains("panel")) {

            elements[i].style.display = "none";

        }

    }

    document.getElementById("returnButton").style.display = "block";

    Loading.hide();

    var panelName = "";

    if(currentElement.error !== 0) {
        
        if (currentElement.error === ERROR_FORBIDDEN) {

            document.getElementById("error_other").style.display = "none";
            document.getElementById("error_forbidden").style.display = "initial";
    
        } else {
    
            document.getElementById("error_other").style.display = "initial";
            document.getElementById("error_forbidden").style.display = "none";

            document.getElementById("error_code").innerHTML = currentElement.error;
    
        }

        document.getElementById("title").innerHTML = "Fehler";
        document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - Fehler";

        panelName = "error_div";
        
    } else if (currentElement.type === TYPE_SEMESTER && !currentElement.isForeign) {
        // Semesterauswahl / Vorlagenauswahl

        var semesterString = "";
        var templateString = "";
        var folderString = "";

        for (var i = 0; i < currentElement.childrenData.length; i++) {

            var currentChildData = currentElement.childrenData[i];

            if(!showHidden.semesters && currentChildData.isHidden) {

                continue;

            }

            var currentString =
                "<tr onclick='select(" + (currentChildData.isFolder ? TYPE_SEMESTER : TYPE_TEST) + ", " + (currentChildData.referenceTestID ? (currentChildData.referenceTestID + ", false, true") : ((currentChildData.referenceID ? currentChildData.referenceID : currentChildData.semesterID) + ", " + !currentChildData.isFolder + ", " + currentChildData.isFolder)) + ")'>" +
                    "<td class='table_name'>" + escapeHTML(currentChildData.name) + "</td>" +
                    "<td class='table_buttons'>" +
                        "<button class='button_square negative table_big'><img src='/img/delete.svg' alt='X'></button>" +
                        "<button class='button_square positive table_big'><img src='/img/edit.svg' alt='.'></button>" +
                        "<button class='button_square neutral' onclick='event.stopPropagation(); semesterInfoDialog.open(" + currentChildData.semesterID + ")'><img src='/img/info.svg' alt='i'></button>" + 
                    "</td>" +
                "</tr>";

            if (currentChildData.isFolder) {

                folderString += currentString;

            } else if(currentChildData.templateType !== null) {

                templateString += currentString;

            } else {

                semesterString += currentString;

            }

        }

        if (semesterString === "") {

            document.getElementById("semesters_semesters").style.display = "none";

        } else {

            document.getElementById("semesters_semesters").style.display = "initial";
            document.getElementById("semesters_semesters_tableBody").innerHTML = semesterString;

        }

        if (templateString === "") {

            document.getElementById("semesters_templates").style.display = "none";

        } else {

            document.getElementById("semesters_templates").style.display = "initial";
            document.getElementById("semesters_templates_tableBody").innerHTML = templateString;

        }

        if (folderString === "") {

            document.getElementById("semesters_folders").style.display = "none";

        } else {

            document.getElementById("semesters_folders").style.display = "initial";
            document.getElementById("semesters_folders_tableBody").innerHTML = folderString;

        }

        if (semesterString === "" && templateString === "" && folderString === "") {

            document.getElementById("semesters_empty").style.display = "inline-block";

        } else {

            document.getElementById("semesters_empty").style.display = "none";

        }

        if (currentElement.isRoot) {

            document.getElementById("semesters_editButtons").style.display = "none";
            document.getElementById("title").innerHTML = "Semester";
            document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - Semester";
            document.getElementById("returnButton").style.display = "none";

        } else {

            document.getElementById("semesters_editButtons").style.display = "block";
            document.getElementById("title").innerHTML = escapeHTML(currentElement.data.name);
            document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - " + escapeHTML(currentElement.data.name);

        }

        panelName = "semesters_div";

    } else if (currentElement.type === TYPE_TEST) {
        // Im Semester

        panelName = "tests_div";

        if(currentElement.isTemplate) {

            document.getElementById("averageFooter").style.display = "none";

            document.getElementById("parentTypeStyles").innerHTML = ".parentType_template { display: inline; }";

        } else {

            document.getElementById("averageFooter_points").style.display = "none";
            document.getElementById("averageFooter_average").style.display = "none";
            document.getElementById("averageFooter_points_big").style.display = "none";
            document.getElementById("averageFooter_mark_big").style.display = "none";

            document.getElementById("averageFooter").style.display = "block";

            document.getElementById("parentTypeStyles").innerHTML = ".parentType_semester { display: inline; }";

        }

        if(currentElement.isRoot) {

            document.getElementById("tests_addFolderButtons").style.display = "none";
            document.getElementById("tests_followRefButton").style.display = "none";

            document.getElementById("tests_elementButtons").style.display = "none";
            document.getElementById("tests_semesterButtons").style.display = "block";

            document.getElementById("typeStyles").innerHTML = ".type_root { display: inline; }";
            
            if(currentElement.accessType !== ACCESS_STUDENT) {

                document.getElementById("tests_showHiddenTests").style.display = "inline-block";

            } else {

                document.getElementById("tests_showHiddenTests").style.display = "none";

            }

            if(currentElement.writingPermission) {

                document.getElementById("tests_addSubjectButtons").style.display = "block";
                document.getElementById("tests_deletedButton").style.display = "inline-block";

                document.getElementById("tests_empty_templateButton").style.display = "inline-block";
                document.getElementById("tests_empty_instruction").style.display = "block";

            } else {

                document.getElementById("tests_addSubjectButtons").style.display = "none";
                document.getElementById("tests_deletedButton").style.display = "none";

                document.getElementById("tests_empty_templateButton").style.display = "none";
                document.getElementById("tests_empty_instruction").style.display = "none";

            }

            var isClass = currentElement.data.classID !== null && currentElement.accessType !== ACCESS_STUDENT;

            if(currentElement.accessType === ACCESS_TEACHER || currentElement.isTemplate) {

                document.getElementById("averageFooter").style.display = "none";

            } else {

                document.getElementById("averageFooter_plusPoints_big").style.display = "block";
                document.getElementById("averageFooter_average").style.display = "block";

                document.getElementById("averageFooter_plusPoints_big").innerHTML = (isClass ? "Durchschnitt. Hochpunktzahl: " : "Hochpunkte: ") + formatNumber(currentElement.data.plusPoints, "-");
                document.getElementById("averageFooter_average").innerHTML = (isClass ? "Klassenschnitt: " : "Notenschnitt: ") + formatNumber(currentElement.data.mark_unrounded, "-");
                

            }

            if(currentElement.accessType === ACCESS_OWNER) {

                document.getElementById("tests_semesterControlButtons").style.display = "block";

            } else {

                document.getElementById("tests_semesterControlButtons").style.display = "none";

            }

        } else {

            document.getElementById("tests_addSubjectButtons").style.display = "none";

            document.getElementById("tests_elementButtons").style.display = "block";
            document.getElementById("tests_semesterButtons").style.display = "none";

            if(currentElement.writingPermission && currentElement.isFolder) {

                document.getElementById("tests_addFolderButtons").style.display = "block";
                document.getElementById("tests_empty_templateButton").style.display = "inline-block";
                document.getElementById("tests_empty_instruction").style.display = "block";

            } else {

                document.getElementById("tests_addFolderButtons").style.display = "none";
                document.getElementById("tests_empty_templateButton").style.display = "none";
                document.getElementById("tests_empty_instruction").style.display = "none";

            }

            document.getElementById("averageFooter_plusPoints_big").style.display = "none";
            document.getElementById("tests_followRefButton").style.display = "none";

            document.getElementById("typeStyles").innerHTML = ".type_subject { display: inline; }";

            if(currentElement.isFolder) {

                document.getElementById("tests_followRefButton").style.display = "none";

                if(currentElement.data.parentID === null) {

                    document.getElementById("typeStyles").innerHTML = ".type_subject { display: inline; }";

                } else {

                    document.getElementById("typeStyles").innerHTML = ".type_folder { display: inline; }";

                }

                if(currentElement.writingPermission && (currentElement.accessType !== ACCESS_TEACHER || currentElement.data.subjectID !== null)) {

                    document.getElementById("tests_deletedButton").style.display = "inline-block";

                } else {

                    document.getElementById("tests_deletedButton").style.display = "none";

                }

                if(currentElement.accessType !== ACCESS_STUDENT) {

                    document.getElementById("tests_showHiddenTests").style.display = "inline-block";

                } else {

                    document.getElementById("tests_showHiddenTests").style.display = "none";

                }

            } else {

                document.getElementById("tests_deletedButton").style.display = "none";
                document.getElementById("tests_table").style.display = "none";
                document.getElementById("tests_showHiddenTests").style.display = "none";
                
                if(currentElement.data.referenceState === null) {

                    document.getElementById("typeStyles").innerHTML = ".type_test { display: inline; }";

                } else {

                    document.getElementById("typeStyles").innerHTML = ".type_ref { display: inline; }";

                    if(currentElement.data.referenceState === "ok" || currentElement.data.referenceState === "outdated" || currentElement.data.referenceState === "forbidden") {
                        
                        document.getElementById("tests_followRefButton").style.display = "inline-block";
                        document.getElementById("tests_followRefButton").onclick = function() { select(TYPE_TEST, currentElement.data.referenceID); };

                    }

                }

            }

            if(currentElement.writingPermission && (currentElement.accessType !== ACCESS_TEACHER || currentElement.data.subjectID !== null)) {

                document.getElementById("tests_elementControlButtons").style.display = "block";

            } else {

                document.getElementById("tests_elementControlButtons").style.display = "none";

            }

            

            // Noten einfuellen

            if(!currentElement.isTemplate) {

                var isClass = currentElement.data.classID !== null && currentElement.accessType !== ACCESS_STUDENT;

                if(currentElement.data.formula !== null) {

                    document.getElementById("averageFooter_points").style.display = "block";
                    document.getElementById("averageFooter_mark_big").style.display = "block";

                    document.getElementById("averageFooter_points").innerHTML = (isClass ? "Durchschnittspunktzahl: " : "Punkte: ") + formatNumber(currentElement.data.points, "-");
                    document.getElementById("averageFooter_mark_big").innerHTML = (isClass ? "Klassenschnitt: " : "Note: ") + formatNumber(currentElement.data.mark, "-");

                } else if(currentElement.data.round === null) {

                    document.getElementById("averageFooter_points_big").style.display = "block";

                    document.getElementById("averageFooter_points_big").innerHTML = (isClass ? "Durchschnittspunktzahl: " : "Punkte: ") + formatNumber(currentElement.data.points, "-");

                } else if(currentElement.data.round == 0 || (currentElement.data.classID !== null && currentElement.accessType !== ACCESS_STUDENT)) {

                    document.getElementById("averageFooter_mark_big").style.display = "block";

                    document.getElementById("averageFooter_mark_big").innerHTML = (isClass ? "Klassenschnitt: " : "Note: ") + formatNumber(currentElement.data.mark, "-");


                } else {

                    document.getElementById("averageFooter_average").style.display = "block";
                    document.getElementById("averageFooter_mark_big").style.display = "block";

                    document.getElementById("averageFooter_average").innerHTML = (currentElement.isFolder ? "Notenschnitt: " : "ungerundete Note: ") + formatNumber(currentElement.data.mark_unrounded, "-");
                    document.getElementById("averageFooter_mark_big").innerHTML = "Note: " + formatNumber(currentElement.data.mark, "-");


                }

            }

        }

        if(currentElement.isFolder || currentElement.isRoot) {

            // Tabelle mit Tests fuellen

            var tableString = "";
            var pointsUsed = false;
            
            if(currentElement.isRoot || (currentElement.data.round != null && currentElement.data.formula == null)) {

                document.getElementById("tests_table_mark").innerHTML = "Note";
                document.getElementById("tests_table_weight").innerHTML = "<span class='table_big'>Gewichtung</span><span class='table_small'>Gew.</span>";

            } else {

                document.getElementById("tests_table_mark").innerHTML = "<span class='table_big'>Punkte</span><span class='table_small'>Pkte.</span>";
                document.getElementById("tests_table_weight").innerHTML = "";

            }

            for(var i = 0; i < currentElement.childrenData.length; i++) {

                var currentChildData = currentElement.childrenData[i];

                if(!showHidden.tests && currentChildData.isHidden) {

                    continue;
    
                }

                var referenceString = "<td></td>";

                if(currentChildData.referenceState) {

                    if(currentChildData.referenceState === "forbidden") {

                        referenceString = "<td><img src='/img/warning.svg' alt='!' title='Kein Zugriff mehr!'>"

                    } else if(currentChildData.referenceState === "removed") {

                        referenceString = "<td><img src='/img/warning.svg' alt='!' title='Element entfernt!'>"

                    } else if(currentChildData.referenceState === "outdated") {

                        referenceString = "<td><img src='/img/warning.svg' alt='!' title='Nicht mehr auf aktuellem Stand!'>"

                    } else if(currentChildData.referenceState === "template" && !currentElement.isTemplate) {

                        referenceString = "<td><img src='/img/warning.svg' alt='!' title='Kein zu referenzierendes Element bestimmt!'>"

                    }

                }

                var colorClass = "";

                if(currentChildData.mark != null) {

                    if(currentChildData.mark < user.lowerDisplayBound) {

                        colorClass = "red";

                    } else if(currentChildData.mark >= user.upperDisplayBound) {

                        colorClass = "green";

                    } else {

                        colorClass = "yellow";

                    }

                }

                tableString +=
                    "<tr class='" + colorClass + "' onclick='select(TYPE_TEST, " + currentChildData.testID + ", false, " + currentChildData.isFolder + ")'>" +
                        "<td class='table_name'>" + escapeHTML(currentChildData.name) + "</td>" +
                        "<td>" + formatDate(currentChildData.date) + "</td>" +
                        "<td>" + (currentChildData.weight !== null ? (currentChildData.markCounts ? formatNumber(currentChildData.weight) : ("(" + formatNumber(currentChildData.weight) + ")")) : "") + "</td>" +
                        "<td>" + (currentChildData.formula != null ? (currentChildData.points != null ? formatNumber(currentChildData.points) : "") : "") + "</td>" +
                        "<td>" + ((currentElement.data.classID === null && currentChildData.round != null && currentChildData.round != 0 && currentChildData.formula == null) ? (currentChildData.mark_unrounded != null ? formatNumber(currentChildData.mark_unrounded) : "") : "") + "</td>" +
                        "<td class='table_mark'>" + (currentChildData.round != null ? (currentChildData.mark != null ? formatNumber(currentChildData.mark) : "") : (currentChildData.points != null ? formatNumber(currentChildData.points) : "")) + "</td>" +
                        referenceString +
                        "<td class='table_buttons'>" +
                            (currentElement.writingPermission ? (
                            "<button class='button_square negative table_big'><img src='/img/delete.svg' alt='X'></button>" +
                            "<button class='button_square positive table_big'><img src='/img/edit.svg' alt='.'></button>"
                            ) : "") +
                            "<button class='button_square neutral' onclick='event.stopPropagation(); testInfoDialog.open(" + currentChildData.testID + ")'><img src='/img/info.svg' alt='i'></button>" +
                        "</td>" +
                    "</tr>";

                if(!pointsUsed) {

                    pointsUsed = currentChildData.formula != null;

                }

            }

            if(pointsUsed) {

                document.getElementById("tests_table_points").innerHTML = "<span class='table_big'>Punkte</span><span class='table_small'>Pkte.</span>";

            } else {

                document.getElementById("tests_table_points").innerHTML = "";

            }

            if(currentElement.isTemplate || (currentElement.isRoot && currentElement.accessType === ACCESS_TEACHER)) {

                document.getElementById("tests_table_mark").innerHTML = "";

            } else {

                document.getElementById("tests_table_mark").innerHTML = "Note";

            }

            document.getElementById("tests_tableBody").innerHTML = tableString;

            if(tableString === "") {

                document.getElementById("tests_empty").style.display = "block";
                document.getElementById("tests_table").style.display = "none";

            } else {

                document.getElementById("tests_empty").style.display = "none";
                document.getElementById("tests_table").style.display = "table";

            }

        } else {

            document.getElementById("tests_empty").style.display = "none";

        }

        if(currentElement.data.classID !== null && currentElement.accessType !== ACCESS_STUDENT) {

            document.getElementById("tests_testInfo_div").style.display = "none";
            document.getElementById("tests_calculatorButton").style.display = "none";

            document.getElementById("tests_elementInfoButton").style.display = "inline-block";

            if(currentElement.isRoot) {

                document.getElementById("tests_editStudentButton").style.display = "none";

                if(currentElement.accessType === ACCESS_TEACHER) {

                    document.getElementById("tests_studentTable").style.display = "none";
                    document.getElementById("tests_markPaperButton").style.display = "none";
                    document.getElementById("tests_studentButtons").style.display = "none";

                } else {

                    document.getElementById("tests_studentButtons").style.display = "block";

                    if(tableString !== "") {

                        document.getElementById("tests_markPaperButton").style.display = "inline-block";

                    } else {

                        document.getElementById("tests_markPaperButton").style.display = "none";
    
                    }

                }

            } else {

                document.getElementById("tests_studentButtons").style.display = "block";

                if(currentElement.isFolder || currentElement.data.referenceState !== null) {

                    if(currentElement.data.formula === "manual") {

                        document.getElementById("tests_editStudentButton").style.display = "inline-block";

                    } else {

                        document.getElementById("tests_editStudentButton").style.display = "none";

                    }

                } else {

                    document.getElementById("tests_editStudentButton").style.display = "inline-block";

                }

                if(tableString !== "") {

                    document.getElementById("tests_markPaperButton").style.display = "inline-block";

                } else {

                    document.getElementById("tests_markPaperButton").style.display = "none";

                }

            }

            if(!currentElement.isRoot || currentElement.accessType !== ACCESS_TEACHER) {

                var studentTableString = "";

                if(currentElement.writingPermission) {

                    var getButtonString = function(studentID) {

                        return (
                            "<td class='studentTable_buttons'>" +
                                "<button class='button_square positive table_big'><img src='/img/edit.svg' alt='.'></button>" +
                                "<button class='button_square neutral' onclick='event.stopPropagation(); studentInfoDialog.open(" + studentID + ", true)'><img src='/img/info.svg' alt='i'></button>" +
                            "</td>"
                        );

                    }

                } else {

                    var getButtonString = function(studentID) {

                        return (
                            "<td class='studentTable_buttons'>" +
                                "<button class='button_square neutral' onclick='event.stopPropagation(); studentInfoDialog.open(" + studentID + ", true)'><img src='/img/info.svg' alt='i'></button>" +
                            "</td>"
                        );

                    }

                }
                
                if(currentElement.isRoot) {
                    
                    document.getElementById("tests_studentTable_mark").innerHTML = "<span class='table_big'>Hochpunkte</span><span class='table_small'>Hochp.</span>";
                    document.getElementById("tests_studentTable_mark_unrounded").innerHTML = "Schnitt";

                } else if(currentElement.data.round != null) {

                    document.getElementById("tests_studentTable_mark").innerHTML = "Note";
                    document.getElementById("tests_studentTable_mark_unrounded").innerHTML = "";

                } else {

                    document.getElementById("tests_studentTable_mark").innerHTML = "<span class='table_big'>Punkte</span><span class='table_small'>Pkte.</span>";
                    document.getElementById("tests_studentTable_mark_unrounded").innerHTML = "";

                }

                if(!currentElement.isRoot && (currentElement.data.formula != null)) {

                    document.getElementById("tests_studentTable_points").innerHTML = "<span class='table_big'>Punkte</span><span class='table_small'>Pkte.</span>";

                } else {

                    document.getElementById("tests_studentTable_points").innerHTML = "";

                }

                var printStudent;

                if(currentElement.isRoot) {

                    printStudent = function(currentStudentData, colorClass) {

                        if(currentStudentData.plusPoints == null && !editStudents && !showStudentsWithoutMark) {

                            return;

                        }

                        colorClass = 0;

                        if(currentStudentData.plusPoints != null) {

                            if(currentStudentData.plusPoints >= 0) {

                                colorClass = "green";

                            } else {

                                colorClass = "red";

                            }

                        }

                        studentTableString +=
                            "<tr class='noSelect " + colorClass + "'>" +
                                "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                "<td></td>" +
                                "<td>" + (currentStudentData.mark_unrounded != null ? formatNumber(currentStudentData.mark_unrounded) : "") + "</td>" +
                                "<td class='table_mark'>" + (currentStudentData.plusPoints != null ? formatNumber(currentStudentData.plusPoints) : "") + "</td>" +
                                getButtonString(currentStudentData.studentID) +
                            "</tr>";

                    }

                } else if(currentElement.data.round == null) {

                    printStudent = function(currentStudentData, colorClass) {

                        if(currentStudentData.points == null && !editStudents && !showStudentsWithoutMark) {

                            return;

                        }

                        studentTableString +=
                            "<tr class='noSelect'>" +
                                "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                "<td></td>" + 
                                "<td></td>" +
                                "<td class='table_mark studentTable_input'><input type='text' readonly value='" + (currentStudentData.points != null ? formatNumber(currentStudentData.points) : "") + "'></td>" +
                                getButtonString(currentStudentData.studentID) +
                            "</tr>";

                    }

                } else if(currentElement.data.formula == null) {

                    if(currentElement.data.round == 0) {

                        printStudent = function(currentStudentData, colorClass) {

                            if(currentStudentData.mark == null && !editStudents && !showStudentsWithoutMark) {

                                return;
    
                            }

                            studentTableString +=
                                "<tr class='noSelect " + colorClass + "'>" +
                                    "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                    "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                    "<td></td>" +
                                    "<td></td>" +
                                    "<td class='table_mark studentTable_input'><input type='text' readonly value='" + (currentStudentData.mark != null ? formatNumber(currentStudentData.mark) : "") + "'></td>" +
                                    getButtonString(currentStudentData.studentID) +
                                "</tr>";
    
                        }

                    } else {

                        printStudent = function(currentStudentData, colorClass) {

                            if(currentStudentData.mark == null && !editStudents && !showStudentsWithoutMark) {

                                return;
    
                            }

                            studentTableString +=
                                "<tr class='noSelect " + colorClass + "'>" +
                                    "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                    "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                    "<td></td>" +
                                    "<td class='studentTable_input'><input type='text' readonly value='" + (currentStudentData.mark_unrounded != null ? formatNumber(currentStudentData.mark_unrounded) : "") + "'></td>" +
                                    "<td class='table_mark'>" + (currentStudentData.mark != null ? formatNumber(currentStudentData.mark) : "") + "</td>" +
                                    getButtonString(currentStudentData.studentID) +
                                "</tr>";
    
                        }

                    }

                } else {

                    if(currentElement.data.formula === "manual") {

                        if(currentElement.isFolder) {

                            printStudent = function(currentStudentData, colorClass) {

                                if(currentStudentData.points == null && !editStudents && !showStudentsWithoutMark) {
        
                                    return;
        
                                }
        
                                studentTableString +=
                                    "<tr class='noSelect " + colorClass + "'>" +
                                        "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                        "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                        "<td>" + (currentStudentData.points != null ? formatNumber(currentStudentData.points) : "") + "</td>" +
                                        "<td></td>" +
                                        "<td class='table_mark studentTable_input'><input type='text' readonly value='" +  (currentStudentData.mark != null ? formatNumber(currentStudentData.mark) : "") + "'></td>" +
                                        getButtonString(currentStudentData.studentID) +
                                    "</tr>";
        
                            }

                        } else {

                            printStudent = function(currentStudentData, colorClass) {

                                if(currentStudentData.points == null && !editStudents && !showStudentsWithoutMark) {
        
                                    return;
        
                                }
        
                                studentTableString +=
                                    "<tr class='noSelect " + colorClass + "'>" +
                                        "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                        "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                        "<td class='studentTable_input'><input type='text' readonly value='" + (currentStudentData.points != null ? formatNumber(currentStudentData.points) : "") + "'></td>" +
                                        "<td></td>" +
                                        "<td class='table_mark studentTable_input'><input type='text' readonly value='" +  (currentStudentData.mark != null ? formatNumber(currentStudentData.mark) : "") + "'></td>" +
                                        getButtonString(currentStudentData.studentID) +
                                    "</tr>";
        
                            }

                        }

                    } else {

                        printStudent = function(currentStudentData, colorClass) {

                            if(currentStudentData.points == null && !editStudents && !showStudentsWithoutMark) {
    
                                return;
    
                            }
    
                            studentTableString +=
                                "<tr class='noSelect " + colorClass + "'>" +
                                    "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                    "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                    "<td class='studentTable_input'><input type='text' readonly value='" + (currentStudentData.points != null ? formatNumber(currentStudentData.points) : "") + "'></td>" +
                                    "<td></td>" +
                                    "<td class='table_mark'>" + (currentStudentData.mark != null ? formatNumber(currentStudentData.mark) : "") + "</td>" +
                                    getButtonString(currentStudentData.studentID) +
                                "</tr>";
    
                        }

                    }

                }

                for(var i = 0; i < currentElement.data.students.length; i++) {

                    var currentChildData = currentElement.data.students[i];

                    if(!showHidden.students && currentChildData.isHidden) {

                        continue;
        
                    }

                    var colorClass = "";

                    if(currentChildData.mark != null) {

                        if(currentChildData.mark < user.lowerDisplayBound) {

                            colorClass = "red";

                        } else if(currentChildData.mark >= user.upperDisplayBound) {

                            colorClass = "green";

                        } else {

                            colorClass = "yellow";

                        }

                    }

                    printStudent(currentElement.data.students[i], colorClass);

                }

                if(editStudents) {

                    studentTableString = studentTableString.replace(/readonly /g, "");

                }

                document.getElementById("tests_studentTableBody").innerHTML = studentTableString;

                if(studentTableString === "") {

                    document.getElementById("tests_studentTable").style.display = "none";
                    document.getElementById("tests_noMarks").style.display = "inline-block";
                    
                    if(
                        currentElement.writingPermission && 
                        ((
                            !currentElement.isFolder &&
                            currentElement.data.referenceState === null
                        ) || currentElement.data.formula === "manual")
                    ) {

                        document.getElementById("tests_noMarks_instruction").style.display = "block";

                    } else {

                        document.getElementById("tests_noMarks_instruction").style.display = "none";

                    }

                } else {

                    document.getElementById("tests_studentTable").style.display = "table";
                    document.getElementById("tests_noMarks").style.display = "none";

                }

            }

        } else {

            if(tableString !== "") {

                document.getElementById("tests_markPaperButton").style.display = "inline-block";

            } else {

                document.getElementById("tests_markPaperButton").style.display = "none";

            }

            if(user.isTeacher) {

                document.getElementById("tests_studentTable").style.display = "none";
                document.getElementById("tests_studentButtons").style.display = "none";
                
            }

            if(currentElement.isRoot) {

                document.getElementById("tests_testInfo_div").style.display = "none";
                document.getElementById("tests_elementInfoButton").style.display = "inline-block";
                
            } else {

                if(currentElement.isFolder) {

                    document.getElementById("tests_testInfo_div").style.display = "none";
                    document.getElementById("tests_elementInfoButton").style.display = "inline-block";
                    
                    if(tableString !== "") {
                    
                        document.getElementById("tests_calculatorButton").style.display = "inline-block";

                    } else {

                        document.getElementById("tests_calculatorButton").style.display = "none";
    
                    }

                } else {

                    document.getElementById("tests_calculatorButton").style.display = "none";
                    document.getElementById("tests_elementInfoButton").style.display = "none";
                    
                    printTestInfo("tests_testInfo", currentElement.data);
                    printAdditionalTestInfo("tests_testInfo", currentElement.data);

                    document.getElementById("tests_testInfo_div").style.display = "block";

                }

            }

        }

        document.getElementById("title").innerHTML = escapeHTML(currentElement.data.name);
        document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - " + escapeHTML(currentElement.data.name);

    } else if (currentElement.type === TYPE_SEMESTER && currentElement.isForeign) {
        // Fremde Semester  

        var sharedString = "";
        var teacherString = "";
        var studentString = "";

        for(var i = 0; i < currentElement.childrenData.length; i++) {

            var currentChildData = currentElement.childrenData[i];

            var currentString = 
                "<tr onclick='select(TYPE_TEST, " + currentChildData.semesterID + ", true, true)'>" +
                    "<td class='table_name'>" + escapeHTML(currentChildData.name) + "</td>" +
                    "<td>" + escapeHTML(currentChildData.userName) + "</td>" +
                    "<td class='table_buttons'>" +
                        "<button class='button_square positive table_big'><img src='/img/save.svg' alt='S'></button>" +
                        "<button class='button_square neutral' onclick='event.stopPropagation(); classInfoDialog.open(" + currentChildData.semesterID + ")'><img src='/img/info.svg' alt='i'></button>" +
                    "</td>" +
                "</tr>";

            if(currentChildData.category === ACCESS_SHARED) {

                sharedString += currentString;

            } else if(currentChildData.category === ACCESS_STUDENT) {

                studentString += currentString;

            } else {

                teacherString += currentString;

            }

        }
        
        document.getElementById("foreignSemesters_shared_tableBody").innerHTML = sharedString;
        document.getElementById("foreignSemesters_student_tableBody").innerHTML = studentString;

        if(sharedString === "") {

            document.getElementById("foreignSemesters_shared").style.display = "none";

        } else {

            document.getElementById("foreignSemesters_shared").style.display = "block";

        }

        if(studentString === "") {

            document.getElementById("foreignSemesters_student").style.display = "none";

        } else {

            document.getElementById("foreignSemesters_student").style.display = "block";

        }

        if(user.isTeacher) {

            document.getElementById("foreignSemesters_teacher_tableBody").innerHTML = teacherString;

            if(teacherString === "") {

                document.getElementById("foreignSemesters_teacher").style.display = "none";
    
            } else {
    
                document.getElementById("foreignSemesters_teacher").style.display = "block";
    
            }

        }

        if(sharedString === "" && teacherString === "" && studentString === "") {

            document.getElementById("foreignSemesters_empty").style.display = "inline-block";

        } else {

            document.getElementById("foreignSemesters_empty").style.display = "none";

        }

        document.getElementById("title").innerHTML = "Geteilte Semester";
        document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - Geteilte Semester";
        
        panelName = "foreignSemesters_div";

    } else if (currentElement.type === TYPE_PUBLIC_TEMPLATES && currentElement.isForeign) {
        // Oeffenliche Vorlagen

        panelName = "publicTemplates_div";

    } else if (currentElement.type === TYPE_PUBLIC_TEMPLATES) {
        // Eigene veroeffentlichte Vorlagen

        panelName = "publishedTemplates_div";

    } else if (user.isTeacher && currentElement.type === TYPE_CLASS && currentElement.isRoot && !currentElement.isForeign) {
        // Klassenauswahl

        var tableString = "";

        for (var i = 0; i < currentElement.childrenData.length; i++) {
            
            var currentChildData = currentElement.childrenData[i];

            if(!showHidden.classes && currentChildData.isHidden) {

                continue;

            }

            tableString +=
                "<tr onclick='select(TYPE_CLASS, " + (currentChildData.referenceID ? currentChildData.referenceID : currentChildData.classID) + ", false, true)'>" +
                    "<td class='table_name'>" + escapeHTML(currentChildData.name) + "</td>" +
                    "<td class='table_buttons'>" +
                        "<button class='button_square negative table_big'><img src='/img/delete.svg' alt='X'></button>" +
                        "<button class='button_square positive table_big'><img src='/img/edit.svg' alt='.'></button>" +
                        "<button class='button_square neutral' onclick='event.stopPropagation(); classInfoDialog.open(" + currentChildData.classID + ")'><img src='/img/info.svg' alt='i'></button>" +
                    "</td>" +
                "</tr>";

        }

        document.getElementById("classes_tableBody").innerHTML = tableString;

        if (tableString === "") {

            document.getElementById("classes_table").style.display = "none";
            document.getElementById("classes_empty").style.display = "inline-block";

        } else {

            document.getElementById("classes_table").style.display = "table";
            document.getElementById("classes_empty").style.display = "none";

        }

        document.getElementById("title").innerHTML = "Klassen";
        document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - Klassen";

        panelName = "classes_div";

    } else if (user.isTeacher && currentElement.type === TYPE_CLASS && currentElement.isRoot) {
        // Fremde Klassen

        var tableString = "";

        for(var i = 0; i < currentElement.childrenData.length; i++) {

            var currentChildData = currentElement.childrenData[i];

            tableString += 
                "<tr onclick='select(TYPE_CLASS, " + currentChildData.classID + ", false, true)'>" +
                    "<td class='table_name'>" + escapeHTML(currentChildData.name) + "</td>" +
                    "<td>" + escapeHTML(currentChildData.userName) + "</td>" +
                    "<td class='table_buttons'>" +
                        "<button class='button_square positive table_big'><img src='/img/save.svg' alt='S'></button>" +
                        "<button class='button_square neutral' onclick='event.stopPropagation(); classInfoDialog.open(" + currentChildData.classID + ")'><img src='/img/info.svg' alt='i'></button>" +
                    "</td>" +
                "</tr>";

        }
        
        document.getElementById("foreignClasses_tableBody").innerHTML = tableString;

        if(tableString === "") {

            document.getElementById("foreignClasses_empty").style.display = "inline-block";
            document.getElementById("foreignClasses_table").style.display = "none";

        } else {

            document.getElementById("foreignClasses_empty").style.display = "none";
            document.getElementById("foreignClasses_table").style.display = "table";

        }

        document.getElementById("title").innerHTML = "Geteilte Klassen";
        document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - Geteilte Klassen";

        panelName = "foreignClasses_div";

    } else if (user.isTeacher && currentElement.type === TYPE_CLASS && !currentElement.isRoot) {
        // In Klasse

        if(currentElement.writingPermission) {

            document.getElementById("students_addStudentButton").style.display = "inline-block";               

        } else {

            document.getElementById("students_addStudentButton").style.display = "none";              

        }

        if(currentElement.accessType === ACCESS_OWNER) {

            document.getElementById("students_classControlButtons").style.display = "block";

        } else {

            document.getElementById("students_classControlButtons").style.display = "none";

        }

        var tableString = "";

        for(var i = 0; i < currentElement.childrenData.length; i++) {

            var currentChildData = currentElement.childrenData[i];

            if(!showHidden.students && currentChildData.isHidden) {

                continue;

            }

            tableString += 
                "<tr class='noSelect'>" +
                    "<td class='table_name'>" + escapeHTML(currentChildData.lastName) + "</td>" +
                    "<td>" + escapeHTML(currentChildData.firstName) + "</td>" +
                    "<td>" + escapeHTML(currentChildData.userName) + "</td>" +
                    "<td class='table_buttons'>" +
                        (currentElement.writingPermission ? (
                            "<button class='button_square negative table_big'><img src='/img/delete.svg' alt='X'></button>" +
                            "<button class='button_square positive table_big'><img src='/img/edit.svg' alt='.'></button>"
                        ) : "") +
                        "<button class='button_square neutral' onclick='event.stopPropagation(); studentInfoDialog.open(" + currentChildData.studentID + ")'><img src='/img/info.svg' alt='i'></button>" +
                    "</td>" +
                "</tr>";

        }
        
        document.getElementById("students_tableBody").innerHTML = tableString;

        if(tableString === "") {

            document.getElementById("students_empty").style.display = "inline-block";
            document.getElementById("students_table").style.display = "none";

            if(currentElement.writingPermission) {

                document.getElementById("students_empty_instruction").style.display = "block";

            } else {

                document.getElementById("students_empty_instruction").style.display = "none";

            }

        } else {

            document.getElementById("students_empty").style.display = "none";
            document.getElementById("students_table").style.display = "table";

        }

        document.getElementById("title").innerHTML = escapeHTML(currentElement.data.name);
        document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - " + escapeHTML(currentElement.data.name);

        panelName = "students_div";

    }

    document.getElementById(panelName).style.display = "block";
    document.getElementById(panelName).style.opacity = "1";
    document.getElementById("title").style.opacity = "1";

    if(document.getElementById("returnButton").style.display !== "none") {
        
        document.getElementById("returnButton").style.opacity = "1";

    }

}

// Ueberprueft, ob das aktuelle Element schon im "Cache" ist und laedt es ansonsten, laesst schlussendlich Element anzeigen
function loadElementAndPrint() {

    if(additionalTestInfoRequest !== undefined) {

        additionalTestInfoRequest.abort();
        additionalTestInfoRequest = undefined;

    }

    isBlocked = true;

    if (path.length === 0) {
        // Semesterauswahl

        if (!cache.rootSemesters) {

            loadData("/phpScripts/get/getSemesters.php", {}, function (data) {

                currentElement = data;
                cache.rootSemesters = data;

                hideLoading();

            }, loadingError);

            isLoading = true;

        } else {

            currentElement = cache.rootSemesters;

            isLoading = false;

        }

        hidePanelsAndPrint();

        return;

    }

    var pathElement = path[path.length - 1];

    if (pathElement.type === TYPE_SEMESTER && !pathElement.isForeign) {
        // Semester
        
        if (!cache.semesters[pathElement.ID]) {
            
            loadData("/phpScripts/get/getSemesters.php", { semesterID: pathElement.ID }, function (data) {
                
                currentElement = data;
                cache.semesters[pathElement.ID] = data;

                hideLoading();

            }, loadingError);

            isLoading = true;

        } else {

            currentElement = cache.semesters[pathElement.ID];

            isLoading = false;

        }

    } else if (pathElement.type === TYPE_TEST) {
        // Im Semester

        if(pathElement.isRoot) {

            if (!cache.semesters[pathElement.ID]) {

                var requestObject = { semesterID: pathElement.ID, withMarks: true };

                if(pathElement.checkOnlyForTemplate) {

                    requestObject.checkOnlyForTemplate = true;
    
                }
            
                loadData("/phpScripts/get/getTests.php", requestObject, function (data) {
                    
                    currentElement = data;
                    cache.semesters[pathElement.ID] = data;
    
                    hideLoading();
    
                }, loadingError);
    
                isLoading = true;
    
            } else {
    
                currentElement = cache.semesters[pathElement.ID];
    
                isLoading = false;
    
            }

        } else {

            if(pathElement.isFolder) {

                var url = "/phpScripts/get/getTests.php";

            } else {

                var url = "/phpScripts/get/getTest.php";

            }

            if (!cache.tests[pathElement.ID]) {

                var requestObject = { testID: pathElement.ID, withMarks: true };

                if(pathElement.checkOnlyForTemplate) {

                    requestObject.checkOnlyForTemplate = true;
    
                }
                
                loadData(url, requestObject, function (data) {
                    
                    currentElement = data;
                    cache.tests[pathElement.ID] = data;
    
                    hideLoading();
    
                }, loadingError);
    
                isLoading = true;
    
            } else {
    
                currentElement = cache.tests[pathElement.ID];
    
                isLoading = false;
    
            }

        }


    } else if (pathElement.type === TYPE_SEMESTER && pathElement.isForeign) {
        // Fremde Semester

        loadData("/phpScripts/get/getForeignSemesters.php", {}, function (data) {

            currentElement = data;

            hideLoading();

        }, loadingError);

        isLoading = true;

    } else if (pathElement.type === TYPE_PUBLIC_TEMPLATES && pathElement.isForeign) {
        // Oeffenliche Vorlagen

        if (!publishInstalled) {

            loadPublish();
            Loading.show(null, "semi-transparent");
            return;

        }

    } else if (pathElement.type === TYPE_PUBLIC_TEMPLATES) {
        // Eigene veroeffentlichte Vorlagen

        if (!publishInstalled) {

            loadPublish();
            Loading.show(null, "semi-transparent");
            return;

        }

    } else if (user.isTeacher && pathElement.type === TYPE_CLASS && pathElement.isRoot && !pathElement.isForeign) {
        // Klassenauswahl

        if (!cache.rootClasses) {

            loadData("/phpScripts/get/getClasses.php", {}, function (data) {

                currentElement = data;
                cache.rootClasses = data;

                hideLoading();

            }, loadingError);

            isLoading = true;

        } else {

            currentElement = cache.rootClasses;

            isLoading = false;

        }

    } else if (user.isTeacher && pathElement.type === TYPE_CLASS && pathElement.isRoot) {
        // Fremde Klassen

        loadData("/phpScripts/get/getForeignClasses.php", {}, function (data) {

            currentElement = data;

            hideLoading();

        }, loadingError);

        isLoading = true;

    } else if (user.isTeacher && pathElement.type === TYPE_CLASS) {
        // In Klasse

        if (!cache.classes[pathElement.ID]) {
            
            loadData("/phpScripts/get/getStudents.php", { classID: pathElement.ID }, function (data) {
                
                currentElement = data;
                cache.classes[pathElement.ID] = data;

                hideLoading();

            }, loadingError);

            isLoading = true;

        } else {

            currentElement = cache.classes[pathElement.ID];

            isLoading = false;

        }

    }

    hidePanelsAndPrint();


}


function printTestInfo(elementPrefix, testData) {

    if(testData.formula !== null) {

        document.getElementById(elementPrefix + "_type").innerHTML = "Punkte zu Note";

    } else if(testData.round === null) {

        document.getElementById(elementPrefix + "_type").innerHTML = "Nur Punkte";

    } else {

        document.getElementById(elementPrefix + "_type").innerHTML = "Nur Note";

    }

    if(testData.classID == undefined || currentElement.accessType === ACCESS_STUDENT) {

        document.getElementById("classFlagStyles").innerHTML = ".classFlag_private { display: inline; }";

    } else {

        document.getElementById("classFlagStyles").innerHTML = ".classFlag_class { display: inline; }";

    }

    if(testData.date !== null) {

        document.getElementById(elementPrefix + "_dateContainer").style.display = "table-row";
        document.getElementById(elementPrefix + "_date").innerHTML = formatDate(testData.date);

    } else {

        document.getElementById(elementPrefix + "_dateContainer").style.display = "none";

    }

    if(testData.referenceState !== null) {

        document.getElementById(elementPrefix + "_refContainer").style.display = "table";

        var refState = "";

        switch(testData.referenceState) {

            case "ok":          refState = "OK"; break;
            case "outdated":    refState = "Stand veraltet"; break;
            case "template":    refState = "unverknüpft"; break;
            case "forbidden":   refState = "kein Zugriff"; break;
            case "deleted":     refState = "gelöscht"; break;

        }

        document.getElementById(elementPrefix + "_referenceState").innerHTML = refState;

    } else {

        document.getElementById(elementPrefix + "_refContainer").style.display = "none";

    }

    document.getElementById(elementPrefix + "_isHiddenIcon").src = "/img/" + (testData.isHidden ? "checked.svg" : "cross.svg");
    document.getElementById(elementPrefix + "_markCountsIcon").src = "/img/" + (testData.markCounts ? "checked.svg" : "cross.svg");

    if(testData.round === null) {

        document.getElementById(elementPrefix + "_markSettingsContainer").style.display = "none";

    } else {

        var roundString;

        if(testData.round == 0) {

            roundString = "keine";

        } else if(testData.round == 0.5) {

            roundString = "auf Halbe";

        } else if(testData.round == 0.25) {

            roundString = "auf Viertel";

        } else {

            roundString = "auf " + formatNumber(testData.round);

        }

        document.getElementById(elementPrefix + "_round").innerHTML = roundString;

        if(testData.weight === null) {

            document.getElementById(elementPrefix + "_weightContainer").style.display = "none";

        } else {

            document.getElementById(elementPrefix + "_weightContainer").style.display = "table-row";
            document.getElementById(elementPrefix + "_weight").innerHTML = formatNumber(testData.weight);

        }

        document.getElementById(elementPrefix + "_markSettingsContainer").style.display = "block";

    }

    if(testData.round !== null && testData.formula === null) {

        document.getElementById(elementPrefix + "_pointsSettingsContainer").style.display = "none";

    } else {

        if(testData.formula === null) {

            document.getElementById(elementPrefix + "_formulaContainer").style.display = "none";

        } else {

            var formula;

            if(testData.formula === "linear") {

                formula = "linear";

            } else {

                formula = "manuell";

            }

            document.getElementById(elementPrefix + "_formula").innerHTML = formula;
            document.getElementById(elementPrefix + "_formulaContainer").style.display = "table-row";

        }

        if(testData.maxPoints === null) {

            document.getElementById(elementPrefix + "_maxPointsContainer").style.display = "none";

        } else {
            
            document.getElementById(elementPrefix + "_maxPointsContainer").style.display = "table-row";
            document.getElementById(elementPrefix + "_maxPoints").innerHTML = formatNumber(testData.maxPoints);

        }

        document.getElementById(elementPrefix + "_pointsSettingsContainer").style.display = "block";

    }

    if(testData.notes === null) {

        document.getElementById(elementPrefix + "_notesContainer").style.display = "none";

    } else {

        document.getElementById(elementPrefix + "_notesContainer").style.display = "block";
        document.getElementById(elementPrefix + "_notes").innerHTML = escapeHTML(testData.notes);

    }

    if(testData.studentNotes == undefined) {

        document.getElementById(elementPrefix + "_studentNotesContainer").style.display = "none";

    } else {

        document.getElementById(elementPrefix + "_studentNotesContainer").style.display = "block";
        document.getElementById(elementPrefix + "_studentNotes").innerHTML = escapeHTML(testData.studentNotes);

    }

    var loadMoreButton = document.getElementById(elementPrefix + "_loadMoreButton");
    var visibilityButton = document.getElementById(elementPrefix + "_visibilityButton");
    var actionButton = document.getElementById(elementPrefix + "_actionButton");

    if(
        currentElement.writingPermission && (
            testData.parentID !== null ||
            currentElement.accessType !== ACCESS_TEACHER
        )
    ) {

        loadMoreButton.classList.remove("button_big");
        loadMoreButton.classList.add("button_medium");

        visibilityButton.style.display = "inline-block";

    } else {

        loadMoreButton.classList.remove("button_medium");
        loadMoreButton.classList.add("button_big");

        visibilityButton.style.display = "none";

    }

}

function printAdditionalTestInfo(elementPrefix, testData) {

    var permissionsContainer = document.getElementById(elementPrefix + "_permissionsContainer");
    var generalInfoContainer = document.getElementById(elementPrefix + "_generalInfoContainer");

    var loadMoreButton = document.getElementById(elementPrefix + "_loadMoreButton");
    var visibilityButton = document.getElementById(elementPrefix + "_visibilityButton");
    
    if(additionalInfo.tests[testData.testID] !== undefined) {

        var currentInfo = additionalInfo.tests[testData.testID];

        if(testData.referenceState !== null && (testData.referenceState === "ok" || testData.referenceState === "outdated")) {

            document.getElementById(elementPrefix + "_refTestName").innerHTML = escapeHTML(currentInfo.refTestName);
            document.getElementById(elementPrefix + "_refUserName").innerHTML = escapeHTML(currentInfo.refUserName);

            document.getElementById(elementPrefix + "_refTestNameContainer").style.display = "table-row";
            document.getElementById(elementPrefix + "_refUserNameContainer").style.display = "table-row";

        } else {

            document.getElementById(elementPrefix + "_refTestNameContainer").style.display = "none";
            document.getElementById(elementPrefix + "_refUserNameContainer").style.display = "none";

        }

        if(currentInfo.className !== undefined) {

            document.getElementById(elementPrefix + "_classNameContainer").style.display = "table-row";
            document.getElementById(elementPrefix + "_className").innerHTML = escapeHTML(currentInfo.className);

        } else {

            document.getElementById(elementPrefix + "_classNameContainer").style.display = "none";

        }

        document.getElementById(elementPrefix + "_semesterNameContainer").style.display = "table-row";
        document.getElementById(elementPrefix + "_semesterName").innerHTML = escapeHTML(currentInfo.semesterName);

        if(currentInfo.subjectName !== undefined) {

            document.getElementById(elementPrefix + "_subjectNameContainer").style.display = "table-row";
            document.getElementById(elementPrefix + "_subjectName").innerHTML = escapeHTML(currentInfo.subjectName);

        } else {

            document.getElementById(elementPrefix + "_subjectNameContainer").style.display = "none";

        }

        if(currentInfo.permissions === undefined) {

            permissionsContainer.style.display = "none";

        } else {

            permissionsContainer.style.display = "block";

            if(currentInfo.permissions.length === 0) {

                document.getElementById(elementPrefix + "_noPermissions").style.display = "block";
                document.getElementById(elementPrefix + "_permissions").style.display = "none";

            } else {

                var permissionsString = "";

                var len = currentInfo.permissions.length;

                for(var i = 0; i < len; i++) {

                    var currentPermission = currentInfo.permissions[i];

                    permissionsString +=
                        "<tr>" +
                            "<td>" + escapeHTML(currentPermission.userName) + "</td>" +
                            "<td>" + escapeHTML(currentPermission.firstName + " " + currentPermission.lastName) + "</td>" +
                            "<td><img src=\"/img/" + (currentPermission.writingPermission ? "edit_black.svg" : "view.svg") + "\"></td>" +
                        "</tr>";

                }

                document.getElementById(elementPrefix + "_noPermissions").style.display = "none";

                document.getElementById(elementPrefix + "_permissions").innerHTML = permissionsString;
                document.getElementById(elementPrefix + "_permissions").style.display = "table";

            }

        }

        generalInfoContainer.style.display = "table";

        loadMoreButton.style.display = "none";
        loadMoreButton.disabled = false;

        visibilityButton.classList.remove("button_medium");
        visibilityButton.classList.add("button_big");

    } else {

        permissionsContainer.style.display = "none";

        if(testData.date === null) {

            generalInfoContainer.style.display = "none";

        } else {

            generalInfoContainer.style.display = "table";

        }

        document.getElementById(elementPrefix + "_classNameContainer").style.display = "none";
        document.getElementById(elementPrefix + "_semesterNameContainer").style.display = "none";
        document.getElementById(elementPrefix + "_subjectNameContainer").style.display = "none";

        if(testData.referenceState !== null) {

            document.getElementById(elementPrefix + "_refTestNameContainer").style.display = "none";
            document.getElementById(elementPrefix + "_refUserNameContainer").style.display = "none";

        }

        loadMoreButton.innerHTML = "<img src=\"/img/info.svg\">Mehr laden";
        loadMoreButton.disabled = false;
        loadMoreButton.style.display = "inline-block";

        visibilityButton.classList.remove("button_big");
        visibilityButton.classList.add("button_medium");

    }

}

function loadMoreTestInfo() {

    var loadMoreButton = document.getElementById("tests_testInfo_loadMoreButton");

    loadMoreButton.innerHTML = "<img src=\"/img/loading.svg\">Laden...";
    loadMoreButton.disabled = true;

    var testID = currentElement.data.testID;

    additionalTestInfoRequest = loadData("/phpScripts/getInfo/getTestInfo.php", { testID: testID }, function(data) {

        additionalInfo.tests[testID] = data;

        printAdditionalTestInfo("tests_testInfo", currentElement.data);
        testInfoDialog.resize();

    }, function(errorCode) {

        printAdditionalTestInfo("tests_testInfo", currentElement.data);

        new Alert({
            type: "info",
            icon: "error",
            title: "Fehler",
            description: "Es ist ein Fehler aufgetreten. Versuchen Sie es später wieder.\nFehlercode: " + errorCode
        });

    });

}

// Wird aufgerufen, wenn ein Element ausgewaehlt wurde
function select(elementType, elementID, isRoot = false, isFolder = false, checkOnlyForTemplate = false) {

    if(isBlocked) {

        return;

    }

    if(checkOnlyForTemplate || (path.length > 0 && path[path.length - 1].checkOnlyForTemplate)) {

        path.push({ type: elementType, ID: elementID, isRoot: isRoot, isFolder: isFolder, checkOnlyForTemplate: true });

    } else {

        path.push({ type: elementType, ID: elementID, isRoot: isRoot, isFolder: isFolder });

    }

    if (typeof (localStorage) !== undefined) localStorage.setItem("path", JSON.stringify(path));

    loadElementAndPrint();

}


function showForeignSemesters() {

    path.push({ type: TYPE_SEMESTER, isRoot: true, isFolder: true, isForeign: true });

    if (typeof (localStorage) !== undefined) localStorage.setItem("path", JSON.stringify(path));

    loadElementAndPrint();

}

function returnFolder() {

    if(isBlocked) {

        return;

    }

    path.pop();
    if (typeof (localStorage) !== undefined) localStorage.setItem("path", JSON.stringify(path));
    loadElementAndPrint();

}

function loadPublish() {

    var scriptElement = document.createElement("script");
    scriptElement.language = "javascript";
    scriptElement.type = "text/javascript";
    scriptElement.onload = function() { Loading.hide(); loadElementAndPrint(); };
    scriptElement.src = "/js/app/appPublish.js";

    document.getElementsByTagName("head")[0].appendChild(scriptElement);

}

// Wird aufgerufen, wenn DOM-Baum vollstaendig geladen
document.addEventListener("DOMContentLoaded", function () {

    if (typeof (localStorage) !== undefined && localStorage.getItem("path") !== null) {

        path = JSON.parse(localStorage.getItem("path"));

    }

    document.getElementById("returnButton").onclick = returnFolder;
    document.getElementById("error_returnButton").onclick = returnFolder;

    document.getElementById("semesters_foreignSemestersButton").onclick = showForeignSemesters;

    if(user.isTeacher) {

        document.getElementById("semesters_classButton").onclick = showRootClasses;
        document.getElementById("classes_foreignClassesButton").onclick = showForeignClasses;

    }


    semesterInfoDialog      = new Dialog(document.getElementById("semesterInfoDialog"), false, false, undefined, function() { semesterInfoDialog.close(); });
    testInfoDialog          = new Dialog(document.getElementById("testInfoDialog"),     false, false, undefined, function() { testInfoDialog.close(); });

    semesterInfoDialog.open = function(arg) {

        if(typeof(arg) === "number") {

            var len = currentElement.childrenData.length;
            var found = false;

            for(var i = 0; i < len; i++) {

                if(currentElement.childrenData[i].semesterID === arg) {

                    this.semesterData = currentElement.childrenData[i];
                    found = true;
                    break;

                }

            }

            if(!found) return;

        } else {

            this.semesterData = currentElement.data;

        }

        var type;

        if(this.semesterData.isFolder) {

            type = "Ordner";
            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_semesterFolder { display: inline; }";

        } else if(this.semesterData.templateType === null) {

            if(this.semesterData.classID === null) {

                type = "Privates Semester";

            } else {

                type = "Klassensemester";

            }

            if(this.semesterData.referenceID === null) {

                document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_semester { display: inline; }";

            } else {

                document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_semesterRef { display: inline; }";

            }

        } else {

            if(this.semesterData.templateType === "semesterTemplate") {

                type = "Semestervorlage";

            } else {

                type = "Fachvorlage";

            }

            if(this.semesterData.referenceID === null) {

                document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_template { display: inline; }";

            } else {

                document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_templateRef { display: inline; }";

            }

        }

        document.getElementById("semesterInfoDialog_name").innerHTML = escapeHTML(this.semesterData.name);

        if(this.semesterData.referenceID === null) {

            document.getElementById("semesterInfoDialog_type").innerHTML = type;
            document.getElementById("semesterInfoDialog_typeContainer").style.display = "table";

        } else {

            document.getElementById("semesterInfoDialog_typeContainer").style.display = "none";

        }

        document.getElementById("semesterInfoDialog_isHiddenIcon").src = "/img/" + (this.semesterData.isHidden ? "checked.svg" : "cross.svg");

        if(this.semesterData.notes === null) {

            document.getElementById("semesterInfoDialog_notesContainer").style.display = "none";

        } else {

            document.getElementById("semesterInfoDialog_notesContainer").style.display = "block";
            document.getElementById("semesterInfoDialog_notes").innerHTML = escapeHTML(this.semesterData.notes);

        }

        if(this.semesterData.plusPoints == undefined) {

            document.getElementById("semesterInfoDialog_markAndPointsContainer").style.display = "none";

        } else {

            document.getElementById("semesterInfoDialog_plusPoints").innerHTML = formatNumber(this.semesterData.plusPoints);
            document.getElementById("semesterInfoDialog_mark").innerHTML = formatNumber(this.semesterData.mark_unrounded);            

            document.getElementById("semesterInfoDialog_markAndPointsContainer").style.display = "table";

        }

        this.printAdditionalInfo();

        var loadMoreButton = document.getElementById("semesterInfoDialog_loadMoreButton");
        var visibilityButton = document.getElementById("semesterInfoDialog_visibilityButton");
        var otherButton = document.getElementById("semesterInfoDialog_otherButton");
        var actionButton = document.getElementById("semesterInfoDialog_actionButton");
        
        if(this.semesterData.isFolder) {

            loadMoreButton.style.display = "none";
            visibilityButton.style.display = "inline-block";
            otherButton.style.display = "none";

            actionButton.classList.remove("button_medium");
            actionButton.classList.add("button_big");

            visibilityButton.classList.remove("button_medium");
            visibilityButton.classList.add("button_big");

            document.getElementById("semesterInfoDialog_controlButtons").style.display = "block";

        } else {

            otherButton.style.display = "inline-block";
            
            actionButton.classList.remove("button_big");
            actionButton.classList.add("button_medium");
        
            if(currentElement.accessType === ACCESS_OWNER) {

                loadMoreButton.classList.remove("button_big");
                loadMoreButton.classList.add("button_medium");

                visibilityButton.style.display = "inline-block";

                document.getElementById("semesterInfoDialog_controlButtons").style.display = "block";

            } else {

                loadMoreButton.classList.remove("button_medium");
                loadMoreButton.classList.add("button_big");

                visibilityButton.style.display = "none";

                document.getElementById("semesterInfoDialog_controlButtons").style.display = "none";

                if(this.semesterData.classID === null) {

                    loadMoreButton.style.display = "none";

                }

            }

        }

        this.show();

    };

    semesterInfoDialog.close = function() {

        this.semesterData = undefined;

        if(this.additionalInfoRequest !== undefined) {

            this.additionalInfoRequest.abort();
            this.additionalInfoRequest = undefined;

        }

        this.hide();

    };

    semesterInfoDialog.printAdditionalInfo = function() {

        var permissionsContainer = document.getElementById("semesterInfoDialog_permissionsContainer");
        var refContainer = document.getElementById("semesterInfoDialog_refContainer");
        var classNameContainer = document.getElementById("semesterInfoDialog_classNameContainer");

        var loadMoreButton = document.getElementById("semesterInfoDialog_loadMoreButton");
        var visibilityButton = document.getElementById("semesterInfoDialog_visibilityButton");
        
        if(!this.semesterData.isFolder && additionalInfo.semesters[this.semesterData.semesterID] !== undefined) {

            var currentInfo = additionalInfo.semesters[this.semesterData.semesterID];

            if(this.semesterData.referenceID === null) {

                refContainer.style.display = "none";

            } else {

                if(currentInfo.refError == undefined) {

                    document.getElementById("semesterInfoDialog_refUserNameContainer").style.display = "table-row";
                    document.getElementById("semesterInfoDialog_refUserName").innerHTML = escapeHTML(currentInfo.refUserName);

                    if(currentInfo.refTestName == undefined) {

                        document.getElementById("semesterInfoDialog_refSemesterNameContainer").style.display = "none";
                        document.getElementById("semesterInfoDialog_refName").innerHTML = escapeHTML(currentInfo.refSemesterName);

                    } else {

                        document.getElementById("semesterInfoDialog_refSemesterNameContainer").style.display = "table-row";
                        document.getElementById("semesterInfoDialog_refName").innerHTML = escapeHTML(currentInfo.refTestName);
                        document.getElementById("semesterInfoDialog_refSemesterName").innerHTML = escapeHTML(currentInfo.refSemesterName);

                    }

                } else {

                    document.getElementById("semesterInfoDialog_refName").innerHTML = "<i>ungültig</i>";

                    if(currentInfo.refSemesterName == undefined) {

                        document.getElementById("semesterInfoDialog_refSemesterNameContainer").style.display = "none";
                        document.getElementById("semesterInfoDialog_refUserNameContainer").style.display = "none";

                    } else {

                        document.getElementById("semesterInfoDialog_refSemesterNameContainer").style.display = "table-row";
                        document.getElementById("semesterInfoDialog_refSemesterName").innerHTML = escapeHTML(currentInfo.refSemesterName);

                        document.getElementById("semesterInfoDialog_refUserNameContainer").style.display = "table-row";
                        document.getElementById("semesterInfoDialog_refUserName").innerHTML = escapeHTML(currentInfo.refUserName);

                    }

                }

                refContainer.style.display = "table";

            }

            if(currentInfo.className !== undefined) {

                classNameContainer.style.display = "table";

                document.getElementById("semesterInfoDialog_className").innerHTML = escapeHTML(currentInfo.className);

            } else {

                classNameContainer.style.display = "none";

            }

            if(currentInfo.permissions === undefined) {

                permissionsContainer.style.display = "none";

            } else {

                permissionsContainer.style.display = "block";

                if(currentInfo.permissions.length === 0) {

                    document.getElementById("semesterInfoDialog_noPermissions").style.display = "block";
                    document.getElementById("semesterInfoDialog_permissions").style.display = "none";

                } else {

                    var permissionsString = "";

                    var len = currentInfo.permissions.length;

                    for(var i = 0; i < len; i++) {

                        var currentPermission = currentInfo.permissions[i];

                        permissionsString +=
                            "<tr>" +
                                "<td>" + escapeHTML(currentPermission.userName) + "</td>" +
                                "<td><img src=\"/img/" + (currentPermission.writingPermission ? "edit_black.svg" : "view.svg") + "\"></td>" +
                            "</tr>";

                    }

                    document.getElementById("semesterInfoDialog_noPermissions").style.display = "none";

                    document.getElementById("semesterInfoDialog_permissions").innerHTML = permissionsString;
                    document.getElementById("semesterInfoDialog_permissions").style.display = "table";

                }

            }

            loadMoreButton.style.display = "none";
            loadMoreButton.disabled = false;

            visibilityButton.classList.remove("button_medium");
            visibilityButton.classList.add("button_big");

        } else {

            permissionsContainer.style.display = "none";
            refContainer.style.display = "none";
            classNameContainer.style.display = "none";

            loadMoreButton.innerHTML = "<img src=\"/img/info.svg\">Mehr laden";
            loadMoreButton.disabled = false;
            loadMoreButton.style.display = "inline-block";

            visibilityButton.classList.remove("button_big");
            visibilityButton.classList.add("button_medium");

        }

    }

    semesterInfoDialog.loadMore = function() {

        var loadMoreButton = document.getElementById("semesterInfoDialog_loadMoreButton");

        loadMoreButton.innerHTML = "<img src=\"/img/loading.svg\">Laden...";
        loadMoreButton.disabled = true;

        var semesterID = this.semesterData.semesterID;

        this.additionalInfoRequest = loadData("/phpScripts/getInfo/getSemesterInfo.php", { semesterID: semesterID }, function(data) {

            additionalInfo.semesters[semesterID] = data;

            semesterInfoDialog.printAdditionalInfo();
            semesterInfoDialog.resize();

        }, function(errorCode) {

            semesterInfoDialog.printAdditionalInfo();

            new Alert({
                type: "info",
                icon: "error",
                title: "Fehler",
                description: "Es ist ein Fehler aufgetreten. Versuchen Sie es später wieder.\nFehlercode: " + errorCode
            });

        });

    }





    testInfoDialog.open = function(arg) {

        if(typeof(arg) === "number") {

            var len = currentElement.childrenData.length;
            var found = false;

            for(var i = 0; i < len; i++) {

                if(currentElement.childrenData[i].testID === arg) {

                    this.testData = currentElement.childrenData[i];
                    found = true;
                    break;

                }

            }

            if(!found) return;

        } else {

            this.testData = currentElement.data;

        }

        if(this.testData.parentID === null) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_subject { display: inline; }";

        } else if(this.testData.isFolder) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_folder { display: inline; }";

        } else if(this.testData.referenceState !== null) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_ref { display: inline; }";

        } else {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_test { display: inline; }";

        }

        document.getElementById("testInfoDialog_name").innerHTML = escapeHTML(this.testData.name);

        printTestInfo("testInfoDialog", this.testData);
        printAdditionalTestInfo("testInfoDialog", this.testData);

        if(!currentElement.isTemplate) {
        
            document.getElementById("testInfoDialog_averageContainer").style.display = "none";
            document.getElementById("testInfoDialog_markContainer").style.display = "none";
            document.getElementById("testInfoDialog_pointsContainer").style.display = "none";

            if(this.testData.formula !== null) {

                document.getElementById("testInfoDialog_pointsContainer").style.display = "table-row";
                document.getElementById("testInfoDialog_markContainer").style.display = "table-row";

                document.getElementById("testInfoDialog_points").innerHTML = formatNumber(this.testData.points, "-");
                document.getElementById("testInfoDialog_mark").innerHTML = formatNumber(this.testData.mark, "-");

            } else if(this.testData.round === null) {

                document.getElementById("testInfoDialog_pointsContainer").style.display = "table-row";

                document.getElementById("testInfoDialog_points").innerHTML = formatNumber(this.testData.points, "-");

            } else if(this.testData.round == 0 || (this.testData.classID !== null && currentElement.accessType !== ACCESS_STUDENT)) {

                document.getElementById("testInfoDialog_markContainer").style.display = "table-row";

                document.getElementById("testInfoDialog_mark").innerHTML = formatNumber(this.testData.mark, "-");

            } else {

                document.getElementById("testInfoDialog_averageContainer").style.display = "table-row";
                document.getElementById("testInfoDialog_markContainer").style.display = "table-row";

                document.getElementById("testInfoDialog_average").innerHTML = formatNumber(this.testData.mark_unrounded, "-");
                document.getElementById("testInfoDialog_mark").innerHTML = formatNumber(this.testData.mark, "-");

            }

            document.getElementById("testInfoDialog_markAndPointsContainer").style.display = "table";

        } else {

            document.getElementById("testInfoDialog_markAndPointsContainer").style.display = "none";

        }

        if(
            currentElement.writingPermission && (
                this.testData.parentID !== null ||
                currentElement.accessType !== ACCESS_TEACHER
            )
        ) {
    
            document.getElementById("testInfoDialog_controlButtons").style.display = "block";
    
        } else {
    
            document.getElementById("testInfoDialog_controlButtons").style.display = "none";
    
        }

        this.show();

    };

    testInfoDialog.close = function() {

        this.testData = undefined;

        if(this.additionalInfoRequest !== undefined) {

            this.additionalInfoRequest.abort();
            this.additionalInfoRequest = undefined;

        }

        this.hide();

    };

    testInfoDialog.printAdditionalInfo = function() {

        printAdditionalTestInfo("testInfoDialog", this.testData);


    };

    testInfoDialog.loadMore = function() {

        var loadMoreButton = document.getElementById("testInfoDialog_loadMoreButton");

        loadMoreButton.innerHTML = "<img src=\"/img/loading.svg\">Laden...";
        loadMoreButton.disabled = true;

        var testID = this.testData.testID;

        this.additionalInfoRequest = loadData("/phpScripts/getInfo/getTestInfo.php", { testID: testID }, function(data) {

            additionalInfo.tests[testID] = data;

            printAdditionalTestInfo("testInfoDialog", testInfoDialog.testData);
            testInfoDialog.resize();

        }, function(errorCode) {

            printAdditionalTestInfo("testInfoDialog", testInfoDialog.testData);

            new Alert({
                type: "info",
                icon: "error",
                title: "Fehler",
                description: "Es ist ein Fehler aufgetreten. Versuchen Sie es später wieder.\nFehlercode: " + errorCode
            });

        });

    };


    document.getElementById("semesterInfoDialog_closeButton").addEventListener("click", semesterInfoDialog.close.bind(semesterInfoDialog));
    document.getElementById("semesterInfoDialog_loadMoreButton").addEventListener("click", semesterInfoDialog.loadMore.bind(semesterInfoDialog));

    document.getElementById("testInfoDialog_closeButton").addEventListener("click", testInfoDialog.close.bind(testInfoDialog));
    document.getElementById("testInfoDialog_loadMoreButton").addEventListener("click", testInfoDialog.loadMore.bind(testInfoDialog));

    document.getElementById("tests_semesterInfoButton").addEventListener("click", semesterInfoDialog.open.bind(semesterInfoDialog));
    document.getElementById("tests_elementInfoButton").addEventListener("click", testInfoDialog.open.bind(testInfoDialog));

    document.getElementById("tests_testInfo_loadMoreButton").addEventListener("click", loadMoreTestInfo);

    loadElementAndPrint();

});

