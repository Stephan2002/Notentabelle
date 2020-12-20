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


const TEXT_ERROR_OCCURED = "Es ist ein Fehler aufgetreten.";
const TEXT_ERROR_NO_CHANGE = TEXT_ERROR_OCCURED + "\nMöglicherweise besteht ein Problem mit der Internetverbindung oder lokale Daten sind nicht mehr auf aktuellem Stand.\n\nFehlercode: ";
const TEXT_ERROR_UNCHANGED = TEXT_ERROR_OCCURED + "\nEs wurden keine Veränderungen gespeichert. Möglicherweise sind lokalen Daten nicht mehr auf aktuellem Stand.\n\nFehlercode: ";
const TEXT_ERROR_CHANGED = TEXT_ERROR_OCCURED + "\nJedoch wurde ein Teil der Veränderungen gespeichert. Möglicherweise sind lokalen Daten nicht mehr auf aktuellem Stand.\n\nFehlercode: ";

const MAX_LENGTH_NAME = 64;
const MAX_LENGTH_NOTES = 256;

const MAX_MARK = 100;
const MAX_OTHER = 10000;

const REGEX_STD_DATE = /^[1-9]\d{3}-\d\d-\d\d$/;
const REGEX_ALT_DATE = /^(\d\d?)\.(\d\d?)\.([1-9]\d{3}|\d\d)$/;

var publishInstalled = false;
var isLoading = false;
var isBlocked = false;

var editMarks = false;

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
    classes: false,
    studentMarks: false

};

var currentElement;


var semesterInfoDialog;
var testInfoDialog;

var editSemesterDialog;
var editTestDialog;

var permissionsDialog;

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

function copy(arg) {

    if(typeof(arg) === "object") {

        if(Array.isArray(arg)) {

            var newArr = new Array(arg.length);

            for(var i = 0; i < arg.length; i++) {

                newArr[i] = typeof(arg[i]) === "object" ? copy(arg[i]) : arg[i];

            }

            return newArr;

        }

        var newObj = {};

        for(var key in arg) {

            newObj[key] = typeof(arg[key]) === "object" ? copy(arg[key]) : arg[key];

        }

        return newObj;

    } else {

        return arg;

    }

}

function assignProperties(target, source) {

    for(var key in source) {

        if(source[key] !== undefined) {

            target[key] = source[key];

        }

    }

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

    isBlocked = true;

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
    var hasErrorFunc = typeof(error) === "function";

    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", url);
    xhttp.responseType = "json";

    xhttp.onload = function () {

        if(this.response === null) {

            if(this.status) {

                if(hasErrorFunc) error(this.status);

            } else {

                if(hasErrorFunc) error(-1);

            }

            return;

        }

        if (this.status == 200) {

            if (this.response.error === 0) {

                success(this.response);

            } else {

                if(hasErrorFunc) error(this.response.error, this.response);

            }

        } else {

            if(hasErrorFunc) error(this.status);

        }

    };

    if(hasErrorFunc) xhttp.onerror = function () { error(-1); };

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
                        "<button class='button_square negative table_big'><img src='/img/icons/delete.svg' alt='X'></button>" +
                        "<button class='button_square positive table_big' onclick='event.stopPropagation(); editSemesterDialog.openEdit(" + currentChildData.semesterID + ")'><img src='/img/icons/edit.svg' alt='.'></button>" +
                        "<button class='button_square neutral' onclick='event.stopPropagation(); semesterInfoDialog.open(" + currentChildData.semesterID + ")'><img src='/img/icons/info.svg' alt='i'></button>" + 
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

            document.getElementById("semesters_controlButtons").style.display = "none";
            document.getElementById("title").innerHTML = "Semesterauswahl";
            document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - App";
            document.getElementById("returnButton").style.display = "none";

        } else {

            document.getElementById("semesters_controlButtons").style.display = "block";
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
            
            document.getElementById("tests_visibilityButton").style.display = "inline-block";

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

                if(currentElement.data.round === null) {

                    document.getElementById("tests_empty_templateButton").style.display = "none";
                    document.getElementById("tests_empty_instruction").style.display = "none";

                } else {

                    document.getElementById("tests_empty_templateButton").style.display = "inline-block";
                    document.getElementById("tests_empty_instruction").style.display = "block";

                }

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

                document.getElementById("tests_visibilityButton").style.display = "inline-block";

            } else {

                document.getElementById("tests_deletedButton").style.display = "none";
                document.getElementById("tests_table").style.display = "none";
                document.getElementById("tests_visibilityButton").style.display = "none";
                
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
            var unroundedUsed = false;
            var dateUsed = false;
            
            if(currentElement.isRoot || (currentElement.data.round != null && currentElement.data.formula == null)) {

                document.getElementById("tests_table_mark").innerHTML = "Note";
                document.getElementById("tests_table_weight").innerHTML = "Gew.";

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

                        referenceString = "<td><img src='/img/icons/warning.svg' alt='!' title='Kein Zugriff mehr!'>"

                    } else if(currentChildData.referenceState === "removed") {

                        referenceString = "<td><img src='/img/icons/warning.svg' alt='!' title='Element entfernt!'>"

                    } else if(currentChildData.referenceState === "outdated") {

                        referenceString = "<td><img src='/img/icons/warning.svg' alt='!' title='Nicht mehr auf aktuellem Stand!'>"

                    } else if(currentChildData.referenceState === "template" && !currentElement.isTemplate) {

                        referenceString = "<td><img src='/img/icons/warning.svg' alt='!' title='Kein zu referenzierendes Element bestimmt!'>"

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
                        "<td>" + (currentChildData.formula !== null ? formatNumber(currentChildData.points) : "") + "</td>" +
                        "<td>" + ((currentElement.data.classID === null && currentChildData.round !== null && currentChildData.round != 0) ? formatNumber(currentChildData.mark_unrounded) : "") + "</td>" +
                        "<td class='table_mark'>" + (currentChildData.round !== null ? formatNumber(currentChildData.mark) : formatNumber(currentChildData.points)) + "</td>" +
                        referenceString +
                        "<td class='table_buttons'>" +
                            (currentElement.writingPermission ? (
                            "<button class='button_square negative table_big'><img src='/img/icons/delete.svg' alt='X'></button>" +
                            "<button class='button_square positive table_big' onclick='event.stopPropagation(); editTestDialog.openEdit(" + currentChildData.testID + ")'><img src='/img/icons/edit.svg' alt='.'></button>"
                            ) : "") +
                            "<button class='button_square neutral' onclick='event.stopPropagation(); testInfoDialog.open(" + currentChildData.testID + ")'><img src='/img/icons/info.svg' alt='i'></button>" +
                        "</td>" +
                    "</tr>";

                if(!pointsUsed) pointsUsed = currentChildData.formula !== null;
                if(currentElement.data.classID === null && !unroundedUsed) unroundedUsed = currentChildData.round !== null && currentChildData.round != 0;
                if(!dateUsed) dateUsed = currentChildData.date !== null;

            }

            document.getElementById("tests_table_points").innerHTML = pointsUsed ? "<span class='table_big'>Punkte</span><span class='table_small'>Pkte.</span>" : "";
            document.getElementById("tests_table_date").innerHTML = dateUsed ? "Datum" : "";
            
            if(unroundedUsed) {

                document.getElementById("tests_table_mark_unrounded").style.display = "none";
                document.getElementById("tests_table_mark").colSpan = "2";

            } else {

                document.getElementById("tests_table_mark_unrounded").style.display = "table-cell";
                document.getElementById("tests_table_mark").colSpan = "1";

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

            if(editMarks) {

                document.getElementById("tests_markControlButtons").style.display = "block";

            } else {

                document.getElementById("tests_markControlButtons").style.display = "none";

            }

            if(currentElement.isRoot) {

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

                    if(!editMarks && currentElement.data.formula === "manual") {

                        document.getElementById("tests_editMarksButton").style.display = "inline-block";

                    } else {

                        document.getElementById("tests_editMarksButton").style.display = "none";

                    }

                } else {

                    if(!editMarks) {
                        
                        document.getElementById("tests_editMarksButton").style.display = "inline-block";

                    } else {

                        document.getElementById("tests_editMarksButton").style.display = "none";

                    }

                }

                if(tableString !== "") {

                    document.getElementById("tests_markPaperButton").style.display = "inline-block";

                } else {

                    document.getElementById("tests_markPaperButton").style.display = "none";

                }

            }

            if(!currentElement.isRoot || currentElement.accessType !== ACCESS_TEACHER) {

                updateStudentMarkError();

                var studentTableString = "";

                var isTest = !currentElement.data.isFolder && currentElement.data.referenceState === null;

                if(currentElement.writingPermission && !currentElement.isRoot) {

                    var getButtonString = function(studentID) {

                        return (
                            "<td class='studentTable_buttons'>" +
                                "<button class='button_square positive table_big' onclick='event.stopPropagation(); editStudentMarkDialog.open(" + studentID + ")'><img src='/img/icons/edit.svg' alt='.'></button>" +
                                "<button class='button_square neutral' onclick='event.stopPropagation(); studentInfoDialog.open(" + studentID + ", true)'><img src='/img/icons/info.svg' alt='i'></button>" +
                            "</td>"
                        );

                    }

                } else {

                    var getButtonString = function(studentID) {

                        return (
                            "<td class='studentTable_buttons'>" +
                                "<button class='button_square neutral' onclick='event.stopPropagation(); studentInfoDialog.open(" + studentID + ", true)'><img src='/img/icons/info.svg' alt='i'></button>" +
                            "</td>"
                        );

                    }

                }
                
                if(currentElement.isRoot) {
                    
                    document.getElementById("tests_studentTable_mark").innerHTML = "<span class='table_big'>Hochpunkte</span><span class='table_small'>Hochp.</span>";
                    document.getElementById("tests_studentTable_mark_unrounded").innerHTML = "Schnitt";

                } else if(currentElement.data.round !== null) {

                    document.getElementById("tests_studentTable_mark").innerHTML = "Note";
                    document.getElementById("tests_studentTable_mark_unrounded").innerHTML = "";

                } else {

                    document.getElementById("tests_studentTable_mark").innerHTML = "<span class='table_big'>Punkte</span><span class='table_small'>Pkte.</span>";
                    document.getElementById("tests_studentTable_mark_unrounded").innerHTML = "";

                }

                if(currentElement.isRoot || currentElement.data.round == 0 || currentElement.data.round === null) {

                    document.getElementById("tests_studentTable_mark").colSpan = "1";
                    document.getElementById("tests_studentTable_mark_unrounded").style.display = "table-cell";

                } else {

                    document.getElementById("tests_studentTable_mark").colSpan = "2";
                    document.getElementById("tests_studentTable_mark_unrounded").style.display = "none";

                }

                if(!currentElement.isRoot && (currentElement.data.formula !== null)) {

                    document.getElementById("tests_studentTable_points").innerHTML = "<span class='table_big'>Punkte</span><span class='table_small'>Pkte.</span>";

                } else {

                    document.getElementById("tests_studentTable_points").innerHTML = "";

                }

                var printStudent;

                if(currentElement.isRoot) {

                    printStudent = function(currentStudentData, markData, colorClass) {

                        if(currentStudentData.plusPoints == null && !showStudentsWithoutMark) return;

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
                                "<td>" + formatNumber(currentStudentData.mark_unrounded) + "</td>" +
                                "<td class='table_mark'>" + formatNumber(currentStudentData.plusPoints) + "</td>" +
                                getButtonString(currentStudentData.studentID) +
                            "</tr>";

                    }

                } else if(currentElement.data.round === null) {

                    if(isTest) {

                        printStudent = function(currentStudentData, markData, colorClass) {

                            if(currentStudentData.points == null && !showStudentsWithoutMark) return;

                            studentTableString +=
                                "<tr class='noSelect'>" +
                                    "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                    "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                    "<td></td>" + 
                                    "<td></td>" +
                                    "<td class='table_mark studentTable_input'><input type='text'" + (markData && markData.pointsError ? " class='error'" : "") + " oninput='updateMarkOrPoints(this, true, " + currentStudentData.studentID + ")' readonly value='" + (markData && markData.points !== undefined ? markData.points : formatNumber(currentStudentData.points)) + "'></td>" +
                                    getButtonString(currentStudentData.studentID) +
                                "</tr>";

                        }

                    } else {

                        printStudent = function(currentStudentData, markData, colorClass) {

                            if(currentStudentData.points == null && !showStudentsWithoutMark) return;

                            studentTableString +=
                                "<tr class='noSelect'>" +
                                    "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                    "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                    "<td></td>" + 
                                    "<td></td>" +
                                    "<td class='table_mark'>" + formatNumber(currentStudentData.points) + "</td>" +
                                    getButtonString(currentStudentData.studentID) +
                                "</tr>";

                        }

                    }

                } else if(currentElement.data.formula === null) {

                    if(currentElement.data.round == 0) {

                        if(isTest) {

                            printStudent = function(currentStudentData, markData, colorClass) {

                                if(currentStudentData.mark == null && !showStudentsWithoutMark) return;

                                studentTableString +=
                                    "<tr class='noSelect " + colorClass + "'>" +
                                        "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                        "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                        "<td></td>" +
                                        "<td></td>" +
                                        "<td class='table_mark studentTable_input'><input type='text'" + (markData && markData.markError ? " class='error'" : "") + " oninput='updateMarkOrPoints(this, false, " + currentStudentData.studentID + ")' readonly value='" + (markData && markData.mark !== undefined ? markData.mark : formatNumber(currentStudentData.mark)) + "'></td>" +
                                        getButtonString(currentStudentData.studentID) +
                                    "</tr>";
        
                            }

                        } else {

                            printStudent = function(currentStudentData, markData, colorClass) {

                                if(currentStudentData.mark == null && !showStudentsWithoutMark) return;

                                studentTableString +=
                                    "<tr class='noSelect " + colorClass + "'>" +
                                        "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                        "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                        "<td></td>" +
                                        "<td></td>" +
                                        "<td class='table_mark'>" + formatNumber(currentStudentData.mark) + "</td>" +
                                        getButtonString(currentStudentData.studentID) +
                                    "</tr>";
        
                            }

                        }

                    } else {

                        if(isTest) {

                            printStudent = function(currentStudentData, markData, colorClass) {

                                if(currentStudentData.mark == null && !showStudentsWithoutMark) return;

                                studentTableString +=
                                    "<tr class='noSelect " + colorClass + "'>" +
                                        "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                        "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                        "<td></td>" +
                                        "<td class='studentTable_input'><input type='text'" + (markData && markData.markError ? " class='error'" : "") + " oninput='updateMarkOrPoints(this, false, " + currentStudentData.studentID + ")' readonly value='" + (markData && markData.mark !== undefined ? markData.mark : formatNumber(currentStudentData.mark_unrounded)) + "'></td>" +
                                        "<td class='table_mark'>" + formatNumber(currentStudentData.mark) + "</td>" +
                                        getButtonString(currentStudentData.studentID) +
                                    "</tr>";
        
                            }

                        } else {

                            printStudent = function(currentStudentData, markData, colorClass) {

                                if(currentStudentData.mark == null && !showStudentsWithoutMark) return;

                                studentTableString +=
                                    "<tr class='noSelect " + colorClass + "'>" +
                                        "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                        "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                        "<td></td>" +
                                        "<td>" + formatNumber(currentStudentData.mark_unrounded) + "</td>" +
                                        "<td class='table_mark'>" + formatNumber(currentStudentData.mark) + "</td>" +
                                        getButtonString(currentStudentData.studentID) +
                                    "</tr>";
        
                            }

                        }

                    }

                } else {

                    if(currentElement.data.formula === "manual") {

                        if(currentElement.data.round == 0) {

                            if(isTest) {

                                printStudent = function(currentStudentData, markData, colorClass) {

                                    if(currentStudentData.points == null && !showStudentsWithoutMark) return;
            
                                    studentTableString +=
                                        "<tr class='noSelect " + colorClass + "'>" +
                                            "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                            "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                            "<td class='studentTable_input'><input type='text'" + (markData && markData.pointsError ? " class='error'" : "") + " oninput='updateMarkOrPoints(this, true, " + currentStudentData.studentID + ")' readonly value='" + (markData && markData.points !== undefined ? markData.points : formatNumber(currentStudentData.points)) + "'></td>" +
                                            "<td></td>" +
                                            "<td class='table_mark studentTable_input'><input type='text'" + (markData && markData.markError ? " class='error'" : "") + " oninput='updateMarkOrPoints(this, false, " + currentStudentData.studentID + ")' readonly value='" + (markData && markData.mark !== undefined ? markData.mark : formatNumber(currentStudentData.mark)) + "'></td>" +
                                            getButtonString(currentStudentData.studentID) +
                                        "</tr>";
            
                                }

                            } else {

                                printStudent = function(currentStudentData, markData, colorClass) {

                                    if(currentStudentData.points == null && !showStudentsWithoutMark) return;
            
                                    studentTableString +=
                                        "<tr class='noSelect " + colorClass + "'>" +
                                            "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                            "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                            "<td>" + formatNumber(currentStudentData.points) + "</td>" +
                                            "<td></td>" +
                                            "<td class='table_mark studentTable_input'><input type='text'" + (markData && markData.markError ? " class='error'" : "") + " oninput='updateMarkOrPoints(this, false, " + currentStudentData.studentID + ")' readonly value='" + (markData && markData.mark !== undefined ? markData.mark : formatNumber(currentStudentData.mark)) + "'></td>" +
                                            getButtonString(currentStudentData.studentID) +
                                        "</tr>";
            
                                }

                            }

                        } else {

                            if(isTest) {

                                printStudent = function(currentStudentData, markData, colorClass) {
    
                                    if(currentStudentData.points == null && !showStudentsWithoutMark) return;
            
                                    studentTableString +=
                                        "<tr class='noSelect " + colorClass + "'>" +
                                            "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                            "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                            "<td class='studentTable_input'><input type='text'" + (markData && markData.pointsError ? " class='error'" : "") + " oninput='updateMarkOrPoints(this, true, " + currentStudentData.studentID + ")' readonly value='" + (markData && markData.points !== undefined ? markData.points : formatNumber(currentStudentData.points)) + "'></td>" +
                                            "<td class='studentTable_input'><input type='text'" + (markData && markData.markError ? " class='error'" : "") + " oninput='updateMarkOrPoints(this, false, " + currentStudentData.studentID + ")' readonly value='" + (markData && markData.mark !== undefined ? markData.mark : formatNumber(currentStudentData.mark_unrounded)) + "'></td>" +
                                            "<td class='table_mark'>" + formatNumber(currentStudentData.mark) + "</td>" +
                                            getButtonString(currentStudentData.studentID) +
                                        "</tr>";
            
                                }
    
                            } else {
    
                                printStudent = function(currentStudentData, markData, colorClass) {
    
                                    if(currentStudentData.points == null && !showStudentsWithoutMark) return;
            
                                    studentTableString +=
                                        "<tr class='noSelect " + colorClass + "'>" +
                                            "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                            "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                            "<td>" + formatNumber(currentStudentData.points) + "</td>" +
                                            "<td class='studentTable_input'><input type='text' oninput='updateMarkOrPoints(this, false, " + currentStudentData.studentID + ")' readonly value='" + (markData && markData.mark !== undefined ? markData.mark : formatNumber(currentStudentData.mark_unrounded)) + "'></td>" +
                                            "<td class='table_mark'>" + formatNumber(currentStudentData.mark) + "</td>" +
                                            getButtonString(currentStudentData.studentID) +
                                        "</tr>";
            
                                }
    
                            }

                        }

                    } else {

                        if(currentElement.data.round == 0) {

                            if(isTest) {

                                printStudent = function(currentStudentData, markData, colorClass) {
    
                                    if(currentStudentData.points == null && !showStudentsWithoutMark) return;
            
                                    studentTableString +=
                                        "<tr class='noSelect " + colorClass + "'>" +
                                            "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                            "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                            "<td class='studentTable_input'><input type='text'" + (markData && markData.pointsError ? " class='error'" : "") + " oninput='updateMarkOrPoints(this, true, " + currentStudentData.studentID + ")' readonly value='" + (markData && markData.points !== undefined ? markData.points : formatNumber(currentStudentData.points)) + "'></td>" +
                                            "<td></td>" +
                                            "<td class='table_mark'>" + formatNumber(currentStudentData.mark) + "</td>" +
                                            getButtonString(currentStudentData.studentID) +
                                        "</tr>";
            
                                }
    
                            } else {
    
                                printStudent = function(currentStudentData, markData, colorClass) {
    
                                    if(currentStudentData.points == null && !showStudentsWithoutMark) return;
            
                                    studentTableString +=
                                        "<tr class='noSelect " + colorClass + "'>" +
                                            "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                            "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                            "<td>" + formatNumber(currentStudentData.points) + "</td>" +
                                            "<td></td>" +
                                            "<td class='table_mark'>" + formatNumber(currentStudentData.mark) + "</td>" +
                                            getButtonString(currentStudentData.studentID) +
                                        "</tr>";
            
                                }
    
                            }

                        } else {

                            if(isTest) {

                                printStudent = function(currentStudentData, markData, colorClass) {
    
                                    if(currentStudentData.points == null && !showStudentsWithoutMark) return;
            
                                    studentTableString +=
                                        "<tr class='noSelect " + colorClass + "'>" +
                                            "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                            "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                            "<td class='studentTable_input'><input type='text'" + (markData && markData.pointsError ? " class='error'" : "") + " oninput='updateMarkOrPoints(this, true, " + currentStudentData.studentID + ")' readonly value='" + (markData && markData.points !== undefined ? markData.points : formatNumber(currentStudentData.points)) + "'></td>" +
                                            "<td>" + formatNumber(currentStudentData.mark_unrounded) + "</td>" +
                                            "<td class='table_mark'>" + formatNumber(currentStudentData.mark) + "</td>" +
                                            getButtonString(currentStudentData.studentID) +
                                        "</tr>";
            
                                }
    
                            } else {
    
                                printStudent = function(currentStudentData, markData, colorClass) {
    
                                    if(currentStudentData.points == null && !showStudentsWithoutMark) return;
            
                                    studentTableString +=
                                        "<tr class='noSelect " + colorClass + "'>" +
                                            "<td class='table_name'>" + escapeHTML(currentStudentData.lastName) + "</td>" +
                                            "<td>" + escapeHTML(currentStudentData.firstName) + "</td>" +
                                            "<td>" + formatNumber(currentStudentData.points) + "</td>" +
                                            "<td>" + formatNumber(currentStudentData.mark_unrounded) + "</td>" +
                                            "<td class='table_mark'>" + formatNumber(currentStudentData.mark) + "</td>" +
                                            getButtonString(currentStudentData.studentID) +
                                        "</tr>";
            
                                }
    
                            }

                        }

                    }

                }

                for(var i = 0; i < currentElement.data.students.length; i++) {

                    var currentChildData = currentElement.data.students[i];

                    if(!showHidden.studentMarks && currentChildData.isHidden) {

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

                    printStudent(currentElement.data.students[i], markData[currentElement.data.students[i].studentID], colorClass);

                }

                if(editMarks) {

                    studentTableString = studentTableString.replace(/readonly /g, "");

                }

                document.getElementById("tests_studentTableBody").innerHTML = studentTableString;

                if(studentTableString === "") {

                    document.getElementById("tests_studentTable").style.display = "none";
                    document.getElementById("tests_noMarks").style.display = "inline-block";
                    
                    if(
                        currentElement.writingPermission &&
                        !editMarks && 
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
                        "<button class='button_square positive table_big'><img src='/img/icons/save.svg' alt='S'></button>" +
                        "<button class='button_square neutral' onclick='event.stopPropagation(); semesterInfoDialog.open(" + currentChildData.semesterID + ")'><img src='/img/icons/info.svg' alt='i'></button>" +
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
                        "<button class='button_square negative table_big'><img src='/img/icons/delete.svg' alt='X'></button>" +
                        "<button class='button_square positive table_big' onclick='event.stopPropagation(); editClassDialog.openEdit(" + currentChildData.classID + ")'><img src='/img/icons/edit.svg' alt='.'></button>" +
                        "<button class='button_square neutral' onclick='event.stopPropagation(); classInfoDialog.open(" + currentChildData.classID + ")'><img src='/img/icons/info.svg' alt='i'></button>" +
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
                        "<button class='button_square positive table_big'><img src='/img/icons/save.svg' alt='S'></button>" +
                        "<button class='button_square neutral' onclick='event.stopPropagation(); classInfoDialog.open(" + currentChildData.classID + ")'><img src='/img/icons/info.svg' alt='i'></button>" +
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
                            "<button class='button_square negative table_big'><img src='/img/icons/delete.svg' alt='X'></button>" +
                            "<button class='button_square positive table_big' onclick='editStudentDialog.openEdit(" + currentChildData.studentID + ")'><img src='/img/icons/edit.svg' alt='.'></button>"
                        ) : "") +
                        "<button class='button_square neutral' onclick='event.stopPropagation(); studentInfoDialog.open(" + currentChildData.studentID + ")'><img src='/img/icons/info.svg' alt='i'></button>" +
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

function printMarkInfo(elementPrefix, properties, data, singleMark) {

    document.getElementById(elementPrefix + "_averageContainer").style.display = "none";
    document.getElementById(elementPrefix + "_markContainer").style.display = "none";
    document.getElementById(elementPrefix + "_pointsContainer").style.display = "none";

    if(properties.formula !== null) {

        document.getElementById(elementPrefix + "_pointsContainer").style.display = "table-row";
        document.getElementById(elementPrefix + "_points").innerHTML = formatNumber(data.points, "-");

        document.getElementById(elementPrefix + "_markContainer").style.display = "table-row";
        document.getElementById(elementPrefix + "_mark").innerHTML = formatNumber(data.mark, "-");

        if(properties.round != 0 && (singleMark || currentElement.data.classID === null || currentElement.accessType === ACCESS_STUDENT)) {

            document.getElementById(elementPrefix + "_averageContainer").style.display = "table-row";
            document.getElementById(elementPrefix + "_average").innerHTML = formatNumber(data.mark_unrounded, "-");
        
        }

    } else if(properties.round === null) {

        document.getElementById(elementPrefix + "_pointsContainer").style.display = "table-row";

        document.getElementById(elementPrefix + "_points").innerHTML = formatNumber(data.points, "-");

    } else if(properties.round == 0 || (!singleMark && currentElement.data.classID !== null && currentElement.accessType !== ACCESS_STUDENT)) {

        document.getElementById(elementPrefix + "_markContainer").style.display = "table-row";

        document.getElementById(elementPrefix + "_mark").innerHTML = formatNumber(data.mark, "-");

    } else {

        document.getElementById(elementPrefix + "_averageContainer").style.display = "table-row";
        document.getElementById(elementPrefix + "_markContainer").style.display = "table-row";

        document.getElementById(elementPrefix + "_average").innerHTML = formatNumber(data.mark_unrounded, "-");
        document.getElementById(elementPrefix + "_mark").innerHTML = formatNumber(data.mark, "-");

    }

}

function printTestInfo(elementPrefix, testData) {

    if(testData.formula !== null) {

        document.getElementById(elementPrefix + "_type").innerHTML = "Punkte zu Note";

    } else if(testData.round === null) {

        document.getElementById(elementPrefix + "_type").innerHTML = "Nur Punkte";

    } else {

        document.getElementById(elementPrefix + "_type").innerHTML = "Nur Note";

    }

    if(currentElement.data.classID === null || currentElement.accessType === ACCESS_STUDENT) {

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

    document.getElementById(elementPrefix + "_isHiddenIcon").src = "/img/icons/" + (testData.isHidden ? "checked.svg" : "cross.svg");
    document.getElementById(elementPrefix + "_markCountsIcon").src = "/img/icons/" + (testData.markCounts ? "checked.svg" : "cross.svg");

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

    if(!currentElement.isTemplate) {

        printMarkInfo(elementPrefix, testData, testData);

        document.getElementById(elementPrefix + "_markAndPointsContainer").style.display = "table";

    } else {

        document.getElementById(elementPrefix + "_testInfoDialog_markAndPointsContainer").style.display = "none";

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
                            "<td><img src=\"/img/icons/" + (currentPermission.writingPermission ? "edit_black.svg" : "view.svg") + "\"></td>" +
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

        loadMoreButton.innerHTML = "<img src=\"/img/icons/info.svg\">Mehr laden";
        loadMoreButton.disabled = false;
        loadMoreButton.style.display = "inline-block";

        visibilityButton.classList.remove("button_big");
        visibilityButton.classList.add("button_medium");

    }

}

function loadMoreTestInfo() {

    var loadMoreButton = document.getElementById("tests_testInfo_loadMoreButton");

    loadMoreButton.innerHTML = "<img src=\"/img/icons/loading.svg\">Laden...";
    loadMoreButton.disabled = true;

    var testID = currentElement.data.testID;

    additionalTestInfoRequest = loadData("/phpScripts/getInfo/getTestInfo.php", { testID: testID }, function(data) {

        additionalInfo.tests[testID] = data;

        printAdditionalTestInfo("tests_testInfo", currentElement.data);
        testInfoDialog.resize();

    }, function(errorCode) {

        printAdditionalTestInfo("tests_testInfo", currentElement.data);
        showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode);

    });

}

// Wird aufgerufen, wenn ein Element ausgewaehlt wurde
function select(elementType, elementID, isRoot = false, isFolder = false, checkOnlyForTemplate = false) {

    if(isBlocked) return

    if(editMarks) {

        confirmMarkCancel(select.bind(this, elementType, elementID, isRoot, isFolder, checkOnlyForTemplate), true);
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

    if(isBlocked) return;

    if(editMarks) {

        confirmMarkCancel(returnFolder, true);
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


function changeVisibilty(element, type) {

    var spanElement = element.children[0];

    if(showHidden[type]) {

        spanElement.innerHTML = "anzeigen";
        showHidden[type] = false;

    } else {

        spanElement.innerHTML = "ausblenden";
        showHidden[type] = true;

    }

    hidePanelsAndPrint();

}


function showErrorMessage(description, forceReload) {

    var options = {
        type: "info",
        icon: "error",
        title: "Fehler",
        description: description
    }

    if(forceReload) {

        options.OKButtonText = "Seite neuladen";
        options.OKAction = function() { location.reload(); };

    }

    new Alert(options);

}



function updateErrors(errorObj, errorContainer, button, keepButtonSelectable) {
    
    var errorString = "";
    var hasError = false;

    for(var errorID in errorObj) {

        hasError = true;

        if(errorObj[errorID]) {

            errorString += "<p class='blankLine_small'>" + errorObj[errorID] + "</p>";

        }

    }
    
    if(errorString === "") {

        errorContainer.style.display = "none";

    } else {

        errorContainer.style.display = "inline-block";
        errorContainer.innerHTML = errorString;

    }

    if(button instanceof HTMLButtonElement) {

        if(keepButtonSelectable) {

            if(hasError) {

                button.classList.add("deactivated");

            } else {

                button.classList.remove("deactivated");

            }

        } else {

            button.disabled = hasError;

        }

    }

    return !hasError;

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


    semesterInfoDialog      = new Dialog(document.getElementById("semesterInfoDialog"), false, false, undefined, function() { semesterInfoDialog.close(); }, "semesterInfoDialog");
    testInfoDialog          = new Dialog(document.getElementById("testInfoDialog"),     false, false, undefined, function() { testInfoDialog.close(); }, "testInfoDialog");

    editSemesterDialog      = new EditDialog(document.getElementById("editSemesterDialog"), false, false, function() { editSemesterDialog.save(); }, function() { editSemesterDialog.close(); }, "editSemesterDialog");
    editTestDialog          = new EditDialog(document.getElementById("editTestDialog"),     false, false, function() { editTestDialog.save(); }, function() { editTestDialog.close(); }, "editTestDialog");

    permissionsDialog       = new Dialog(document.getElementById("permissionsDialog"),  false, false, function() { permissionsDialog.save(); }, function() { permissionsDialog.close();}, "permissionsDialog")


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

        this.printInfo();

        document.getElementById("semesterInfoDialog_editButton").onclick = editSemesterDialog.openEdit.bind(editSemesterDialog, this.semesterData);

        this.show();

    };

    semesterInfoDialog.close = function() {

        this.semesterData = undefined;

        if(this.additionalInfoRequest !== undefined) {

            if(this.additionalInfoRequest.readyState !== XMLHttpRequest.DONE) {

                this.additionalInfoRequest.abort();

            }

            this.additionalInfoRequest = undefined;

        }

        this.hide();

    };

    semesterInfoDialog.printInfo = function() {

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

        if(this.semesterData.classID == undefined || currentElement.accessType === ACCESS_STUDENT) {

            document.getElementById("classFlagStyles").innerHTML = ".classFlag_private { display: inline; }";
    
        } else {
    
            document.getElementById("classFlagStyles").innerHTML = ".classFlag_class { display: inline; }";
    
        }

        document.getElementById("semesterInfoDialog_name").innerHTML = escapeHTML(this.semesterData.name);

        if(this.semesterData.referenceID === null) {

            document.getElementById("semesterInfoDialog_type").innerHTML = type;
            document.getElementById("semesterInfoDialog_typeContainer").style.display = "table";

        } else {

            document.getElementById("semesterInfoDialog_typeContainer").style.display = "none";

        }

        document.getElementById("semesterInfoDialog_isHiddenIcon").src = "/img/icons/" + (this.semesterData.isHidden ? "checked.svg" : "cross.svg");

        if(this.semesterData.notes === null) {

            document.getElementById("semesterInfoDialog_notesContainer").style.display = "none";

        } else {

            document.getElementById("semesterInfoDialog_notesContainer").style.display = "block";
            document.getElementById("semesterInfoDialog_notes").innerHTML = escapeHTML(this.semesterData.notes);

        }

        if(this.semesterData.plusPoints == null) {

            document.getElementById("semesterInfoDialog_markAndPointsContainer").style.display = "none";

        } else {

            document.getElementById("semesterInfoDialog_plusPoints").innerHTML = formatNumber(this.semesterData.plusPoints, "-");
            document.getElementById("semesterInfoDialog_mark").innerHTML = formatNumber(this.semesterData.mark_unrounded, "-");            

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

    }

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
                                "<td><img src=\"/img/icons/" + (currentPermission.writingPermission ? "edit_black.svg" : "view.svg") + "\"></td>" +
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

            loadMoreButton.innerHTML = "<img src=\"/img/icons/info.svg\">Mehr laden";
            loadMoreButton.disabled = false;
            loadMoreButton.style.display = "inline-block";

            visibilityButton.classList.remove("button_big");
            visibilityButton.classList.add("button_medium");

        }

    }

    semesterInfoDialog.loadMore = function() {

        var loadMoreButton = document.getElementById("semesterInfoDialog_loadMoreButton");

        loadMoreButton.innerHTML = "<img src=\"/img/icons/loading.svg\">Laden...";
        loadMoreButton.disabled = true;

        var semesterID = this.semesterData.semesterID;

        this.additionalInfoRequest = loadData("/phpScripts/getInfo/getSemesterInfo.php", { semesterID: semesterID }, function(data) {

            additionalInfo.semesters[semesterID] = data;

            semesterInfoDialog.printAdditionalInfo();
            semesterInfoDialog.resize();

        }, function(errorCode) {

            semesterInfoDialog.printAdditionalInfo();

            showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode);

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

        this.printInfo();

        document.getElementById("testInfoDialog_editButton").onclick = editTestDialog.openEdit.bind(editTestDialog, this.testData);

        this.show();

    };

    testInfoDialog.close = function() {

        this.testData = undefined;

        if(this.additionalInfoRequest !== undefined) {

            if(this.additionalInfoRequest.readyState !== XMLHttpRequest.DONE) {
    
                this.additionalInfoRequest.abort();

            }

            this.additionalInfoRequest = undefined;

        }

        this.hide();

    };

    testInfoDialog.printInfo = function() {

        if(this.testData.referenceState !== null) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_ref { display: inline; }";

        } else if(!this.testData.isFolder) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_test { display: inline; }";

        } else if(this.testData.parentID === null) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_subject { display: inline; }";

        } else {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_folder { display: inline; }";

        }

        document.getElementById("testInfoDialog_name").innerHTML = escapeHTML(this.testData.name);

        printTestInfo("testInfoDialog", this.testData);
        printAdditionalTestInfo("testInfoDialog", this.testData);

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

    };

    testInfoDialog.printAdditionalInfo = function() {

        printAdditionalTestInfo("testInfoDialog", this.testData);


    };

    testInfoDialog.loadMore = function() {

        var loadMoreButton = document.getElementById("testInfoDialog_loadMoreButton");

        loadMoreButton.innerHTML = "<img src=\"/img/icons/loading.svg\">Laden...";
        loadMoreButton.disabled = true;

        var testID = this.testData.testID;

        this.additionalInfoRequest = loadData("/phpScripts/getInfo/getTestInfo.php", { testID: testID }, function(data) {

            additionalInfo.tests[testID] = data;

            printAdditionalTestInfo("testInfoDialog", testInfoDialog.testData);
            testInfoDialog.resize();

        }, function(errorCode) {

            printAdditionalTestInfo("testInfoDialog", testInfoDialog.testData);

            showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode);

        });

    };





    editSemesterDialog.openEdit = function(arg) {

        if(editMarks) {

            confirmMarkCancel(this.openEdit.bind(this, arg));
            return;
    
        }

        this.errors = {};
        this.warnings = {};
        this.isNew = false;

        if(typeof(arg) === "object") {

            this.semesterData = arg;

        } else if(arg === undefined) {

            this.semesterData = currentElement.data;

        } else {

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

        }

        if(this.semesterData.parentID === null) {

            if(cache.rootSemesters !== undefined) {

                this.siblingData = cache.rootSemesters.childrenData;

            }

        } else if(cache.semesters[this.semesterData.parentID] !== undefined) {

            this.siblingData = cache.semesters[this.semesterData.parentID].childrenData;

        }


        document.getElementById("modeFlagStyles").innerHTML = ".modeFlag_edit { display: inline; }";

        var nameElement = document.getElementById("editSemesterDialog_name")

        nameElement.value = this.semesterData.name;
        nameElement.classList.remove("error");
        nameElement.classList.remove("warning");

        document.getElementById("editSemesterDialog_semesterType").style.display = "none";
        document.getElementById("editSemesterDialog_classButton").style.display = "none";
        document.getElementById("editSemesterDialog_teacherButton").style.display = "none";
        document.getElementById("editSemesterDialog_templateButton").style.display = "none";

        if(this.semesterData.isFolder) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_semesterFolder { display: inline; }";

            document.getElementById("editSemesterDialog_templateType").style.display = "none";
            document.getElementById("editSemesterDialog_permissionsButton").style.display = "none";
            document.getElementById("editSemesterDialog_refTestButton").style.display = "none";

        } else if(this.semesterData.referenceID !== null) {

            document.getElementById("editSemesterDialog_permissionsButton").style.display = "none";
            document.getElementById("editSemesterDialog_refTestButton").style.display = "inline-block";

            if(this.semesterData.templateType === null) {

                document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_semesterRef { display: inline; }";

            } else {

                document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_templateRef { display: inline; }";

            }

        } else {

            document.getElementById("editSemesterDialog_permissionsButton").style.display = "inline-block";
            document.getElementById("editSemesterDialog_refTestButton").style.display = "none";

            if(this.semesterData.templateType === null) {

                document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_semester { display: inline; }";

            } else {

                document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_template { display: inline; }";

            }

        }

        if(this.semesterData.templateType === null) {

            document.getElementById("editSemesterDialog_templateType").style.display = "none";

        } else {

            document.getElementById("editSemesterDialog_templateType").style.display = "flex";

            this.templateTypeSelect.select(this.semesterData.templateType === "semesterTemplate" ? 0 : 1);

        }

        if(this.semesterData.notes === null) {
            
            document.getElementById("editSemesterDialog_with_notes").checked = false;
            document.getElementById("editSemesterDialog_notes").value = "";

        } else {
            
            document.getElementById("editSemesterDialog_with_notes").checked = true;
            document.getElementById("editSemesterDialog_notes").value = this.semesterData.notes;

        }

        this.updateCheckbox("notes");

        document.getElementById("editSemesterDialog_OKButton").classList.remove("deactivated");

        this.updateWarnings();
        this.updateErrors();
        
        this.show();

    };

    editSemesterDialog.openAdd = function(isFolder, isTemplate) {

        this.errors = { name: false };
        this.warnings = {};
        
        this.isNew = true;

        this.semesterData = {
            isFolder: isFolder,
            templateType: isTemplate ? (this.templateTypeSelect.getState(0) ? "semesterTemplate" : "subjectTemplate") : null
        };

        if(!currentElement.isRoot) {

            this.semesterData.parentID = currentElement.data.semesterID;

        }

        this.siblingData = currentElement.childrenData;

        document.getElementById("modeFlagStyles").innerHTML = ".modeFlag_add { display: inline; }";

        document.getElementById("editSemesterDialog_refTestButton").style.display = "none";

        //var baseName;

        if(isFolder) {

            //baseName = "Ordner ";

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_semesterFolder { display: inline; }";

            document.getElementById("editSemesterDialog_permissionsButton").style.display = "none";

            document.getElementById("editSemesterDialog_templateButton").style.display = "none";
            document.getElementById("editSemesterDialog_templateType").style.display = "none";
            document.getElementById("editSemesterDialog_semesterType").style.display = "none";
            document.getElementById("editSemesterDialog_classButton").style.display = "none";
            document.getElementById("editSemesterDialog_teacherButton").style.display = "none";

        } else {

            document.getElementById("editSemesterDialog_permissionsButton").style.display = "inline-block";

            if(isTemplate) {

                //baseName = "Vorlage ";

                document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_template { display: inline; }";

                document.getElementById("editSemesterDialog_templateButton").style.display = "none";
                document.getElementById("editSemesterDialog_templateType").style.display = "flex";
                document.getElementById("editSemesterDialog_semesterType").style.display = "none";

                document.getElementById("editSemesterDialog_classButton").style.display = "none";
                document.getElementById("editSemesterDialog_teacherButton").style.display = "none";

            } else {

                //baseName = "Semester ";

                document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_semester { display: inline; }";

                document.getElementById("editSemesterDialog_templateButton").style.display = "inline-block";
                document.getElementById("editSemesterDialog_templateType").style.display = "none";

                if(user.isTeacher) {

                    document.getElementById("editSemesterDialog_semesterType").style.display = "flex";
                    this.updateSemesterType(this.semesterTypeSelect.getSelected());

                } else {

                    document.getElementById("editSemesterDialog_semesterType").style.display = "none";
                    document.getElementById("editSemesterDialog_classButton").style.display = "none";
                    document.getElementById("editSemesterDialog_teacherButton").style.display = "none";

                }

            }

        }

        // Möglicher Benennungsalgorithmus
        /* var counter = 1;

        nameNotFound:
        while(true) {

            for(var i = 0; i < this.siblingData; i++) {

                if(this.siblingData[i].name === baseName + counter) {

                    continue nameNotFound;

                }

            }

            break;

        }

        */

        var nameElement = document.getElementById("editSemesterDialog_name");

        nameElement.value = "";
        nameElement.classList.remove("error");
        nameElement.classList.remove("warning");

        var notesElement = document.getElementById("editSemesterDialog_notes");

        notesElement.value = "";
        notesElement.classList.remove("error");
        
        this.updateCheckbox("notes");
        
        document.getElementById("editSemesterDialog_OKButton").disabled = false;

        this.updateWarnings();
        this.updateErrors(true);
        
        this.show();


    };

    editSemesterDialog.check = function(ID, printAll = true, callErrorUpdate = true) {
        
        if(ID === undefined) {

            var checkAll = true;

        } else {

            var checkAll = false;

        }

        if(checkAll || ID === "name") {

            this.checkName(TYPE_SEMESTER, printAll);

        }

        if(checkAll || ID === "notes") {

            this.checkNotes();

        }
        
        if(this.isNew && this.semesterData.templateType === null) {
            
            if(checkAll || ID === "class") {
                
                if(this.semesterTypeSelect.getState(1) && this.classID === undefined) {
                    
                    this.errors.class = printAll ? "Es wurde keine Klasse ausgewählt." : false;

                } else {

                    delete this.errors.class;

                }

            }

        }

        if(callErrorUpdate) {

            this.updateWarnings();
            return this.updateErrors(this.isNew);

        }

    };

    editSemesterDialog.close = function() {

        this.semesterData = undefined;
        this.siblingData = undefined;
        this.permissionsData = undefined;

        if(this.nameCheckRequest !== undefined) {

            this.nameCheckRequest.abort();
            this.nameCheckRequest = undefined;

        }

        this.hide();

    };

    editSemesterDialog.save = function() {

        if((this.isNew && !this.check()) || Object.keys(this.errors).length > 0) {

            return;

        }

        var properties = {};

        properties.name = document.getElementById("editSemesterDialog_name").value;
        
        if(this.semesterData.templateType !== null) {

            properties.templateType = this.templateTypeSelect.getState(0) ? "semesterTemplate" : "subjectTemplate";

        }

        if(document.getElementById("editSemesterDialog_with_notes").checked) {

            var element = document.getElementById("editSemesterDialog_notes");

            if(element.value.trim() !== "") {

                properties.notes = element.value;

            }

        }

        if(this.isNew) {

            this.saveAdd(properties);

        } else {

            this.saveEdit(properties);

        }

    }

    editSemesterDialog.saveEdit = function(properties) {

        var changedProperties = {};
        var permissionUpdates;
        var semesterData = this.semesterData;

        if(properties.name !== this.semesterData.name) changedProperties.name = properties.name;

        if(this.semesterData.notes === null) {

            if(properties.notes !== undefined) {
                
                changedProperties.notes = properties.notes;

            }

        } else if(this.semesterData.notes !== properties.notes) {

            changedProperties.notes = properties.notes || null;

        }

        if(this.semesterData.templateType !== null) {

            if(properties.templateType !== this.semesterData.templateType) changedProperties.templateType = properties.templateType;

        }

        if(this.permissionsData !== undefined) {

            permissionUpdates = this.getPermissionUpdates(additionalInfo.semesters[semesterData.semesterID].permissions);
            changedProperties.permissions = permissionUpdates.updates;

        }

        if(semesterData.referenceID !== null) {

            if(this.referenceTestID != semesterData.referenceTestID) changedProperties.referenceTestID = this.referenceTestID;

        }

        this.referenceTestID = undefined;

        if(Object.keys(changedProperties).length <= 0) {

            this.close();
            return;

        }

        changedProperties.semesterID = semesterData.semesterID;

        loadData("/phpScripts/edit/editSemester.php", [ changedProperties ], function(result) {

            var currentAdditionalInfo = additionalInfo.semesters[semesterData.semesterID];

            if(permissionUpdates !== undefined) {

                currentAdditionalInfo.permissions = permissionUpdates.cleaned;

            }

            additionalInfo.semesters = [];
            additionalInfo.tests = [];

            if(currentAdditionalInfo !== undefined) additionalInfo.semesters[semesterData.semesterID] = currentAdditionalInfo;

            delete changedProperties.permissions;
            assignProperties(semesterData, changedProperties);

            if(semesterInfoDialog.isVisible()) {

                semesterInfoDialog.printInfo();
                Loading.hide(semesterInfoDialog.dialogElement);
    
            } 

            hidePanelsAndPrint();

        }, function(errorCode, result) {

            if(result === undefined || result.result === undefined || result.result[0] !== false) {

                if(result !== undefined && result.result !== undefined && result.result[0] === null) {

                    showErrorMessage(TEXT_ERROR_UNCHANGED + errorCode, true);

                } else {

                    showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);

                }

            } else {

                showErrorMessage(TEXT_ERROR_CHANGED + errorCode, true);

            }

        });

        if(currentElement.type === TYPE_TEST) {
            
            if(semesterData.parentID === null) {

                cache.rootSemesters = undefined;

            } else {

                delete cache.semesters[semesterData.parentID];

            }

        } else {

            delete cache.semesters[semesterData.semesterID];

        }

        if(semesterInfoDialog.isVisible()) {

            Loading.show(semesterInfoDialog.dialogElement);

        } else {

            Loading.show(null, "semi-transparent");

        }

        this.close();

    };

    editSemesterDialog.saveAdd = function(properties) {

        if(this.templateID !== undefined) properties.templateID = this.templateID;

        if(this.semesterData.templateType !== null) {

            if(this.semesterTypeSelect.getState(1)) {
                // Klassensemester

                properties.classID = this.classID;

                if(this.copyTeacherID !== undefined) properties.copyTeacherID = this.copyTeacherID;

            }

        }

        if(this.permissionsData !== undefined) {

            var cleanedPermissions = this.permissionsData.filter(function(element) { return element !== undefined } );

            properties.permissions = cleanedPermissions;

        }

        properties.parentID = this.semesterData.parentID;
        properties.isFolder = this.semesterData.isFolder;

        loadData("/phpScripts/create/createSemester.php", properties, function(result) {

            properties.semesterID = result.newID;

            currentElement.childrenData.push(properties);

            hidePanelsAndPrint();

        }, function(errorCode) {

            showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);

        });

        if(properties.classID === undefined) properties.classID = null;
        if(properties.templateType === undefined) properties.templateType = null;
        if(properties.notes === undefined) properties.notes = null;
        
        properties.isHidden = 0;
        properties.isFolder = Number(properties.isFolder);
        properties.referenceID = null;
        properties.referenceTestID = null;
        properties.deleteTimestamp = null;

        delete properties.templateID;

        Loading.show(null, "semi-transparent");

        this.classID = undefined;
        this.templateID = undefined;
        this.copyTeacherID = undefined;

        this.close();

    };

    editSemesterDialog.updateSemesterType = function(index) {

        if(index === 0) {

            document.getElementById("editSemesterDialog_classButton").style.display = "none";
            document.getElementById("editSemesterDialog_teacherButton").style.display = "none";

        } else {

            document.getElementById("editSemesterDialog_classButton").style.display = "inline-block";
            document.getElementById("editSemesterDialog_teacherButton").style.display = "inline-block";

        }

        this.check("class", false);

    };





    editTestDialog.openEdit = function(arg) {

        if(editMarks) {

            confirmMarkCancel(this.openEdit.bind(this, arg));
            return;
    
        }

        this.errors = {};
        this.warnings = {};
        this.isNew = false;

        if(typeof(arg) === "object") {

            this.testData = arg;

        } else if(arg === undefined) {

            this.testData = currentElement.data;

        } else {

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

        }

        if(this.testData.parentID === null) {

            if(cache.semesters[this.testData.semesterID] !== undefined) {

                this.siblingData = cache.semesters[this.testData.semesterID].childrenData;

            }

        } else if(cache.tests[this.testData.parentID] !== undefined) {

            this.siblingData = cache.tests[this.testData.parentID].childrenData;

        }


        document.getElementById("modeFlagStyles").innerHTML = ".modeFlag_edit { display: inline; }";

        if(this.testData.referenceState !== null) {

            this.referenceID = this.testData.referenceID;
            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_ref { display: inline; }";

        } else if(!this.testData.isFolder) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_test { display: inline; }";

        } else if(this.testData.parentID === null) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_subject { display: inline; }";

        } else {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_folder { display: inline; }";
            
        }

        var nameElement = document.getElementById("editTestDialog_name");

        nameElement.value = this.testData.name;
        nameElement.classList.remove("error");
        nameElement.classList.remove("warning");

        document.getElementById("editTestDialog_templateButton").style.display = "none";
        document.getElementById("editTestDialog_type").style.display = "none";

        document.getElementById("editTestDialog_markCounts").checked = this.testData.markCounts;

        if(this.testData.referenceState === null) {

            document.getElementById("editTestDialog_refTestButton").style.display = "none";

        } else {

            document.getElementById("editTestDialog_refTestButton").style.display = "inline-block";

        }

        if(this.testData.parentID === null && currentElement.data.classID !== null) {

            document.getElementById("editTestDialog_permissionsButton").style.display = "inline-block";

        } else {

            document.getElementById("editTestDialog_permissionsButton").style.display = "none";

        }

        // Gewichtung & Rundung
        if(this.testData.round !== null) {

            document.getElementById("editTestDialog_weightContainer").style.display = "block";
            document.getElementById("editTestDialog_weight").value = Number(this.testData.weight);
            document.getElementById("editTestDialog_weight").classList.remove("error");

            document.getElementById("editTestDialog_roundContainer").style.display = "block";

            var roundSelectValue = "-1";

            if(this.testData.round == 0) roundSelectValue = "0";
            if(this.testData.round == 0.5) roundSelectValue = "0.5";
            if(this.testData.round == 0.25) roundSelectValue = "0.25";
            if(this.testData.round == 0.1) roundSelectValue = "0.1";

            document.getElementById("editTestDialog_roundSelect").value = roundSelectValue;
            document.getElementById("editTestDialog_roundCustom").value = roundSelectValue === "-1" ? this.testData.round : "0.125";
            document.getElementById("editTestDialog_roundCustom").classList.remove("error");
            
            this.updateRoundSelect();

        } else {

            document.getElementById("editTestDialog_weightContainer").style.display = "none";
            document.getElementById("editTestDialog_roundContainer").style.display = "none";

        }

        // Formel / Notenberechnung
        if(this.testData.formula !== null) {

            document.getElementById("editTestDialog_formulaContainer").style.display = "inline-block";
            document.getElementById("editTestDialog_formula").value = this.testData.formula;

        } else {

            document.getElementById("editTestDialog_formulaContainer").style.display = "none";

        }

        // Maximalpunktzahl
        if(this.testData.round === null || this.testData.formula !== null) {

            document.getElementById("editTestDialog_maxPointsContainer").style.display = "block";
            document.getElementById("editTestDialog_maxPoints").value = Number(this.testData.maxPoints) || "";
            document.getElementById("editTestDialog_maxPoints").classList.remove("error");
            

        } else {

            document.getElementById("editTestDialog_maxPointsContainer").style.display = "none";

        }
        
        if(currentElement.data.classID === null && !currentElement.isTemplate) {
            // Punkte und Noten evtl. bearbeitbar

            var isTest = !this.testData.isFolder && this.testData.referenceState === null;
            
            if(isTest && (this.testData.round === null || this.testData.formula !== null)) {
                // Punkte bearbeitbar


                document.getElementById("editTestDialog_pointsContainer").style.display = "block";
                document.getElementById("editTestDialog_points").value = this.testData.points != null ? Number(this.testData.points) : "";

            } else {
    
                document.getElementById("editTestDialog_pointsContainer").style.display = "none";
    
            }

            if(this.testData.round !== null && ((isTest && this.testData.formula === null) || this.testData.formula === "manual")) {
                // Note bearbeitbar

                document.getElementById("editTestDialog_markContainer").style.display = "block";
                document.getElementById("editTestDialog_mark").value = this.testData.mark != null ? Number(this.testData.mark) : "";

            } else {

                document.getElementById("editTestDialog_markContainer").style.display = "none";

            }

            document.getElementById("editTestDialog_markAndPointsContainer").style.display = "flex";

        } else {

            document.getElementById("editTestDialog_markAndPointsContainer").style.display = "none";

        }


        if(this.testData.notes === null) {
            
            document.getElementById("editTestDialog_with_notes").checked = false;
            document.getElementById("editTestDialog_notes").value = "";

        } else {
            
            document.getElementById("editTestDialog_with_notes").checked = true;
            document.getElementById("editTestDialog_notes").value = this.testData.notes;

        }

        this.updateCheckbox("notes");

        if(this.testData.date === null) {
            
            document.getElementById("editTestDialog_with_date").checked = false;
            document.getElementById("editTestDialog_date").value = (new Date()).toISOString().substr(0, 10);

        } else {
            
            document.getElementById("editTestDialog_with_date").checked = true;
            document.getElementById("editTestDialog_date").value = this.testData.date;

        }

        this.updateCheckbox("date");

        document.getElementById("editTestDialog_OKButton").classList.remove("deactivated");
        
        this.updateWarnings();
        this.updateErrors();
        
        this.show();

    };

    editTestDialog.openAdd = function(isFolder, isReference) {

        if(editMarks) {

            confirmMarkCancel(this.openAdd.bind(this, isFolder, isReference));
            return;
    
        }

        this.errors = {};
        this.warnings = {};
        
        this.isNew = true;

        this.testData = {
            isFolder: isFolder,
            referenceState: isReference ? "template" : null,
            round: currentElement.isRoot || (currentElement.data.round !== null && currentElement.data.formula === null) ? "0.000" : null,
            semesterID: currentElement.data.semesterID,
            parentID: currentElement.isRoot ? null : currentElement.data.testID
        };

        this.siblingData = currentElement.childrenData;

        document.getElementById("modeFlagStyles").innerHTML = ".modeFlag_add { display: inline; }";

        if(this.testData.referenceState !== null) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_ref { display: inline; }";

        } else if(!this.testData.isFolder) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_test { display: inline; }";

        } else if(this.testData.parentID === null) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_subject { display: inline; }";

        } else {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_folder { display: inline; }";
            
        }

        var nameElement = document.getElementById("editTestDialog_name");

        nameElement.value = "";
        nameElement.classList.remove("error");
        nameElement.classList.remove("warning");

        document.getElementById("editTestDialog_templateButton").style.display = this.testData.isFolder && this.testData.round !== null ? "inline-block" : "none";
        document.getElementById("editTestDialog_refTestButton").style.display = this.testData.referenceState !== null ? "inline-block" : "none";
        document.getElementById("editTestDialog_permissionsButton").style.display = (this.testData.parentID === null && currentElement.data.classID !== null) ? "inline-block" : "none";
        
        if(this.testData.round === null) {

            document.getElementById("editTestDialog_type").style.display = "none";
            document.getElementById("editTestDialog_roundContainer").style.display = "none";
            document.getElementById("editTestDialog_weightContainer").style.display = "none";
            document.getElementById("editTestDialog_formulaContainer").style.display = "none";

            document.getElementById("editTestDialog_maxPointsContainer").style.display = "block";

        } else {

            this.check("weight", false, false);

            if(this.errors.weight !== undefined) {

                document.getElementById("editTestDialog_weight").value = 1;
                document.getElementById("editTestDialog_weight").classList.remove("error");
                

            }

            var roundSelect = document.getElementById("editTestDialog_roundSelect").value;

            if(roundSelect === "-1") {

                this.check("roundCustom", false, false);
                
            }

            if(roundSelect !== "-1" || this.errors.roundCustom !== undefined) {

                document.getElementById("editTestDialog_roundCustom").value = 0.125;
                document.getElementById("editTestDialog_roundCustom").classList.remove("error");

            }

            this.updateRoundSelect();

            document.getElementById("editTestDialog_weightContainer").style.display = "block";
            document.getElementById("editTestDialog_roundContainer").style.display = "block";

            document.getElementById("editTestDialog_type").style.display = "flex";
            this.updateType(this.typeSelect.getSelected());

        }

        document.getElementById("editTestDialog_maxPoints").value = "";
        document.getElementById("editTestDialog_maxPoints").classList.remove("error");

        document.getElementById("editTestDialog_notes").value = "";

        this.updateCheckbox("notes");

        document.getElementById("editTestDialog_date").value = (new Date()).toISOString().substr(0, 10);
        document.getElementById("editTestDialog_with_date").checked = !isFolder && !isReference;

        this.updateCheckbox("date");

        if(currentElement.data.classID === null && !currentElement.isTemplate) {

            document.getElementById("editTestDialog_mark").value = "";
            document.getElementById("editTestDialog_mark").classList.remove("error");

            if(!isFolder && !isReference) {

                document.getElementById("editTestDialog_points").value = "";
                document.getElementById("editTestDialog_points").classList.remove("error");

                if(this.testData.round === null) {

                    document.getElementById("editTestDialog_pointsContainer").style.display = "block";

                }

            } else {

                document.getElementById("editTestDialog_pointsContainer").style.display = "none";

            }

        } else {

            document.getElementById("editTestDialog_pointsContainer").style.display = "none";
            document.getElementById("editTestDialog_markContainer").style.display = "none";

        }
        
        document.getElementById("editTestDialog_OKButton").disabled = false;

        this.errors = { name: false };
        this.warnings = {};

        this.updateWarnings();
        this.updateErrors(true);

        this.show();

    };

    editTestDialog.close = function() {

        this.testData = undefined;
        this.referenceID = undefined;
        this.permissionsData = undefined;

        if(this.nameCheckRequest !== undefined) {

            this.nameCheckRequest.abort();
            this.nameCheckRequest = undefined;

        }

        this.hide();

    };

    editTestDialog.check = function(ID, printAll = true, callErrorUpdate = true) {
        
        if(ID === undefined) {

            var checkAll = true;

        } else {

            var checkAll = false;

        }

        if(checkAll || ID === "name") {

            this.checkName(TYPE_TEST, printAll);

        }

        if(checkAll || ID === "date") {

            if(document.getElementById("editTestDialog_with_date").checked) {

                var element = document.getElementById("editTestDialog_date");
                var localError = false;
        
                if(element.value.trim() === "") {

                    this.warnings.date = "Es wurde kein oder ein falsches Datum angegeben.";
                    element.classList.add("warning");

                } else {

                    delete this.warnings.date;
                    element.classList.remove("warning");

                    if(REGEX_STD_DATE.test(element.value)) {

                        localError = isNaN(Date.parse(element.value));
                        
                    } else {
    
                        var result = REGEX_ALT_DATE.exec(element.value);
    
                        if(result === null) {
    
                            localError = true;
    
                        } else {
    
                            var year = result[3].length == 2 ? ((result[3] > 50 ? "19" : "20") + result[3]) : result[3];
                            var month = result[2].length == 1 ? ("0" + result[2]) : result[2];
                            var day = result[1].length == 1 ? ("0" + result[1]) : result[1];
    
                            localError = isNaN(Date.parse(year + "-" + month + "-" + day));
    
                        }
    
                    }

                }

                if(localError) {

                    this.errors.date = "Das Datum ist fehlerhaft.";
                    element.classList.add("error");
    
                } else {
            
                    delete this.errors.date;
                    element.classList.remove("error");
            
                }
        
            } else {

                delete this.warnings.date;
                delete this.errors.date;

            }

        }

        if(this.testData.round !== null) {
            // Gewichtung, Rundung kann angegeben werden

            if(checkAll || ID === "weight") {

                var element = document.getElementById("editTestDialog_weight");
                var localError = false;

                var weight = Number(element.value.replace(/,/g, "."));

                if(element.value.trim() === "") {

                    this.errors.weight = "Die Notengewichtung fehlt oder ist fehlerhaft.";
                    localError = true;

                } else if(isNaN(weight)) {

                    this.errors.weight = "Die Notengewichtung muss eine Zahl sein.";
                    localError = true;

                } else if(weight < 0) {

                    this.errors.weight = "Die Notengewichtung muss eine positive Zahl sein.";
                    localError = true;

                } else if(weight >= MAX_OTHER) {

                    this.errors.weight = "Die Notengewichtung muss kleiner als " + MAX_OTHER + " sein.";
                    localError = true;

                }

                if(localError) {

                    element.classList.add("error");
    
                } else {
            
                    delete this.errors.weight;
                    element.classList.remove("error");
            
                }

            }


            if(checkAll || ID === "roundCustom") {

                if(document.getElementById("editTestDialog_roundSelect").value === "-1") {

                    var element = document.getElementById("editTestDialog_roundCustom");
                    var localError = false;

                    var roundCustom = Number(element.value.replace(/,/g, "."));

                    if(element.value.trim() === "") {

                        this.errors.roundCustom = "Die Rundungszahl fehlt oder ist fehlerhaft.";
                        localError = true;

                    } else if(isNaN(roundCustom)) {

                        this.errors.roundCustom = "Die Rundungszahl muss eine Zahl sein.";
                        localError = true;

                    } else if(roundCustom < 0) {

                        this.errors.roundCustom = "Die Rundungszahl muss eine positive Zahl sein.";
                        localError = true;

                    } else if(roundCustom >= MAX_OTHER) {

                        this.errors.roundCustom = "Die Rundungszahl muss kleiner als " + MAX_OTHER + " sein.";
                        localError = true;

                    }

                    if(localError) {

                        element.classList.add("error");
        
                    } else {
                
                        delete this.errors.roundCustom;
                        element.classList.remove("error");
                
                    }

                } else {

                    delete this.errors.roundCustom;

                }

            }

        }

        var withFormula =
            this.testData.round !== null && (
                (this.isNew && this.typeSelect.getState(1)) ||
                (!this.isNew && this.testData.formula !== null)
            );

        if(
            this.testData.round === null ||
            this.isNew ||
            this.testData.formula !== null
        ) {
            // Maximalpunktzahl-Eingabe evtl. moeglich

            if(checkAll || ID === "maxPoints") {
                
                if(this.testData.round === null || withFormula) {
                    // Maximalpunktzahl-Eingabe sicher moeglich
                    
                    var element = document.getElementById("editTestDialog_maxPoints");
                    var localError = false;

                    var maxPoints = Number(element.value.replace(/,/g, "."));

                    if(element.value.trim() === "") {

                        if(
                            this.testData.round !== null &&
                            document.getElementById("editTestDialog_formula").value !== "manual"
                        ) {
                            // Maximalpunktzahl-Eingabe zwingend noetig

                            this.errors.maxPoints = printAll ? "Die Maximalpunktzahl fehlt oder ist fehlerhaft." : false;
                            localError = printAll || undefined;

                        }

                    } else if(isNaN(maxPoints)) {

                        this.errors.maxPoints = "Die Maximalpunktzahl muss eine Zahl sein.";
                        localError = true;

                    } else if(maxPoints >= MAX_OTHER) {

                        this.errors.maxPoints = "Die Maximalpunktzahl muss kleiner als " + MAX_OTHER + " sein.";
                        localError = true;

                    } else if(maxPoints <= -MAX_OTHER) {

                        this.errors.maxPoints = "Die Maximalpunktzahl muss grösser als " + -MAX_OTHER + " sein.";
                        localError = true;
    
                    }

                    if(localError) {

                        element.classList.add("error");

                    } else {
                
                        if(localError === false) {

                            delete this.errors.maxPoints;

                        }

                        element.classList.remove("error");
                
                    }

                } else {

                    delete this.errors.maxPoints;

                }

            }

        }


        if(checkAll || ID === "notes") {

            this.checkNotes();

        }

        if(currentElement.data.classID === null && !currentElement.isTemplate) {
            // Punkte und Noten evtl. bearbeitbar

            var isTest = !this.testData.isFolder && this.testData.referenceState === null;
            
            if(checkAll || ID === "points") {

                if(
                    isTest && 
                    (
                        this.testData.round === null || 
                        withFormula
                    )
                ) {
                    // Punkte bearbeitbar

                    var element = document.getElementById("editTestDialog_points");
                    var localError = false;

                    if(element.value.trim() !== "") {

                        var points = Number(element.value.replace(/,/g, "."));

                        if(isNaN(points)) {

                            this.errors.points = "Die Punktzahl muss eine Zahl sein.";
                            localError = true;
        
                        } else if(points >= MAX_OTHER) {
        
                            this.errors.points = "Die Punktzahl muss kleiner als " + MAX_OTHER + " sein.";
                            localError = true;
        
                        } else if(points <= -MAX_OTHER) {

                            this.errors.points = "Die Punktzahl muss grösser als " + -MAX_OTHER + " sein.";
                            localError = true;
        
                        }

                    }

                    if(localError) {

                        element.classList.add("error");

                    } else {
                
                        delete this.errors.points;
                        element.classList.remove("error");
                
                    }

                } else {

                    delete this.errors.points;

                }

            }
            
            if(checkAll || ID === "mark") {

                if(
                    this.testData.round !== null && 
                    (
                        (isTest && !withFormula) || 
                        (withFormula && document.getElementById("editTestDialog_formula").value === "manual")
                    )
                ) {
                    // Note bearbeitbar

                    var element = document.getElementById("editTestDialog_mark");
                    var localError = false;

                    if(element.value.trim() !== "") {

                        var mark = Number(element.value.replace(/,/g, "."));

                        if(isNaN(mark)) {

                            this.errors.mark = "Die Note muss eine Zahl sein.";
                            localError = true;
        
                        } else if(mark >= MAX_MARK) {
        
                            this.errors.mark = "Die Note muss kleiner als " + MAX_MARK + " sein.";
                            localError = true;
        
                        } else if(mark <= -MAX_MARK) {

                            this.errors.mark = "Die Note muss grösser als " + -MAX_MARK + " sein.";
                            localError = true;
        
                        }

                    }

                    if(localError) {

                        element.classList.add("error");

                    } else {
                
                        delete this.errors.mark;
                        element.classList.remove("error");
                
                    }

                } else {

                    delete this.errors.mark;

                }

            }

        }

        if(callErrorUpdate) {

            this.updateWarnings();
            return this.updateErrors(this.isNew);

        }

    };

    editTestDialog.save = function() {
        
        if((this.isNew && !this.check()) || Object.keys(this.errors).length > 0) {

            return;

        }

        var properties = {};

        properties.name = document.getElementById("editTestDialog_name").value;

        if(this.referenceID !== undefined) properties.referenceID = this.referenceID;

        if(document.getElementById("editTestDialog_with_date").checked) {

            var element = document.getElementById("editTestDialog_date");

            if(element.value.trim() !== "") {

                var timeStamp = Date.parse(element.value);

                if(isNaN(timeStamp)) {

                    var result = REGEX_ALT_DATE.exec(element.value);
    
                    var year = result[3].length == 2 ? ((result[3] > 50 ? "19" : "20") + result[3]) : result[3];
                    var month = result[2].length == 1 ? ("0" + result[2]) : result[2];
                    var day = result[1].length == 1 ? ("0" + result[1]) : result[1];

                    timeStamp = Date.UTC(year, month - 1, day);

                }

                properties.date = timeStamp / 1000;

            }

        }

        properties.markCounts = document.getElementById("editTestDialog_markCounts").checked;
        
        if(this.testData.round !== null) {

            properties.weight = Number(document.getElementById("editTestDialog_weight").value).toFixed(3);

            var round = document.getElementById("editTestDialog_roundSelect").value;

            if(round === "0")       round = "0.000";
            else if(round === "0.5")     round = "0.500";
            else if(round === "0.25")    round = "0.250";
            else if(round === "0.1")     round = "0.100";
            else {

                round = Number(document.getElementById("editTestDialog_roundCustom").value).toFixed(3);

            }

            properties.round = round;

        }

        var withFormula =
            this.testData.round !== null && (
                (this.isNew && this.typeSelect.getState(1)) ||
                (!this.isNew && this.testData.formula !== null)
            );

        if(withFormula) {

            properties.formula = document.getElementById("editTestDialog_formula").value;

        }

        if(this.testData.round === null || withFormula) {

            var value = document.getElementById("editTestDialog_maxPoints").value;
            
            if(value.trim() !== "") properties.maxPoints = Number(value).toFixed(3);

        }

        if(currentElement.data.classID === null && !currentElement.isTemplate) {

            var isTest = !this.testData.isFolder && this.testData.referenceState === null;
            
            if(
                isTest && 
                (
                    this.testData.round === null || 
                    withFormula
                )
            ) {

                var value = document.getElementById("editTestDialog_points").value;
            
                properties.points = value.trim() !== "" ? Number(value).toFixed(3) : null;

            }


            if(
                this.testData.round !== null && 
                (
                    (isTest && !withFormula) || 
                    (withFormula && document.getElementById("editTestDialog_formula").value === "manual")
                )
            ) {

                var value = document.getElementById("editTestDialog_mark").value;
            
                properties.mark = value.trim() !== "" ? Number(value).toFixed(6) : null;

            }

        }

        if(document.getElementById("editTestDialog_with_notes").checked) {

            var element = document.getElementById("editTestDialog_notes");

            if(element.value.trim() !== "") {

                properties.notes = element.value;

            }

        }

        if(this.isNew) {

            this.saveAdd(properties, withFormula);

        } else {

            this.saveEdit(properties, withFormula);

        }

    };

    editTestDialog.saveEdit = function(properties, withFormula) {

        var changedProperties = {};
        var testData = this.testData;
        var permissionUpdates;

        if(properties.name !== this.testData.name) changedProperties.name = properties.name;
        if(properties.markCounts != this.testData.markCounts) changedProperties.markCounts = properties.markCounts;
        
        if(properties.weight !== undefined && properties.weight != this.testData.weight) changedProperties.weight = properties.weight;
        if(properties.formula !== undefined && properties.formula !== this.testData.formula) changedProperties.formula = properties.formula;
        if(properties.round !== undefined && properties.round != this.testData.round) changedProperties.round = properties.round;

        if(this.testData.maxPoints === null) {
            if(properties.maxPoints !== undefined) {
                changedProperties.maxPoints = properties.maxPoints;
            }
        } else if(this.testData.maxPoints != properties.maxPoints) {
            changedProperties.maxPoints = properties.maxPoints || null;
        }

        if(this.testData.referenceID === null) {
            if(properties.referenceID !== undefined) {
                changedProperties.referenceID = properties.referenceID;
            }
        } else if(this.testData.referenceID !== properties.referenceID) {
            changedProperties.referenceID = properties.referenceID || null;
        }

        if(this.testData.date === null) {
            if(properties.date !== undefined) {
                changedProperties.date = properties.date;
            }
        } else if(Date.parse(this.testData.date) !== properties.date * 1000) {
            changedProperties.date = properties.date || null;
        }

        if(this.testData.notes === null) {
            if(properties.notes !== undefined) {
                changedProperties.notes = properties.notes;
            }
        } else if(this.testData.notes !== properties.notes) {
            changedProperties.notes = properties.notes || null;
        }

        if(this.permissionsData !== undefined) {

            permissionUpdates = this.getPermissionUpdates(additionalInfo.tests[this.testData.testID].permissions);
            changedProperties.permissions = permissionUpdates.updates;

        }

        if(currentElement.data.classID === null && !currentElement.isTemplate) {

            var isTest = !this.testData.isFolder && this.testData.referenceState === null;
            
            if(
                isTest && 
                (
                    this.testData.round === null || 
                    withFormula
                )
            ) {

                if(this.testData.points == null) {
                    if(properties.points !== undefined) {
                        changedProperties.points = properties.points;
                    }
                } else if(this.testData.points != properties.points) {
                    changedProperties.points = properties.points || null;
                }

            }

            if(
                this.testData.round !== null && 
                (
                    (isTest && !withFormula) || 
                    (withFormula && document.getElementById("editTestDialog_formula").value === "manual")
                )
            ) {

                if(this.testData.mark == null) {
                    if(properties.mark !== undefined) {
                        changedProperties.mark = properties.mark;
                    }
                } else if(this.testData.mark != properties.mark) {
                    changedProperties.mark = properties.mark || null;
                }

            }

        }

        if(Object.keys(changedProperties).length <= 0) {

            this.close();
            return;

        }

        changedProperties.testID = this.testData.testID;
        
        loadData("/phpScripts/edit/editTest.php", [ changedProperties ], function(result) {

            var currentAdditionalInfo = additionalInfo.tests[testData.testID];

            if(permissionUpdates !== undefined) {

                currentAdditionalInfo.permissions = permissionUpdates.cleaned;

            }

            additionalInfo.semesters = [];
            additionalInfo.tests = [];

            if(currentAdditionalInfo !== undefined) additionalInfo.tests[testData.testID] = currentAdditionalInfo;

            if(changedProperties.date !== undefined && changedProperties.date !== null) changedProperties.date = (new Date(changedProperties.date * 1000)).toISOString().substr(0, 10);
            if(changedProperties.markCounts !== undefined) changedProperties.markCounts = Number(changedProperties.markCounts);
            
            delete changedProperties.permissions;

            assignProperties(testData, changedProperties);

            if(result.result[0]) {

                // Element sollte dadurch nach Bearbeitung nicht unbedingt neugeladen werden muessen
                /* if(result.result[0] !== true) {

                    if(result.result[0].mark            !== undefined) testData.mark            = result.result[0].mark;
                    if(result.result[0].mark_unrounded  !== undefined) testData.mark_unrounded  = result.result[0].mark_unrounded;
                    if(result.result[0].points          !== undefined) testData.points          = result.result[0].points;
                    if(result.result[0].students        !== undefined) testData.students        = result.result[0].students;

                }*/ 

                cache.semesters = [];
                cache.tests = [];

                if(testInfoDialog.isVisible()) {

                    Loading.hide(testInfoDialog.dialogElement);
                    testInfoDialog.close();
        
                } 

                loadElementAndPrint();

            } else {

                if(testInfoDialog.isVisible()) {

                    testInfoDialog.printInfo();
                    Loading.hide(testInfoDialog.dialogElement);
        
                }

                hidePanelsAndPrint();

            }

        }, function(errorCode, result) {

            if(result === undefined || result.result === undefined || result.result[0] == undefined) {

                if(result !== undefined && result.result !== undefined && result.result[0] === null) {

                    showErrorMessage(TEXT_ERROR_UNCHANGED + errorCode, true);

                } else {

                    showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);

                }

            } else {

                showErrorMessage(TEXT_ERROR_CHANGED + errorCode, true);

            }

        });

        if(currentElement.data.testID !== undefined && currentElement.data.testID === testData.testID) {
            // Element wird von innen bearbeitet

            if(testData.parentID === null) {

                delete cache.semesters[testData.semesterID];

            } else {

                delete cache.tests[testData.parentID];

            }

        } else {

            delete cache.tests[testData.testID];

        }

        if(testInfoDialog.isVisible()) {

            Loading.show(testInfoDialog.dialogElement);

        } else {

            Loading.show(null, "semi-transparent");

        }

        this.close();
        

    };

    editTestDialog.saveAdd = function(properties) {

        if(this.templateID !== undefined) properties.templateID = this.templateID;
        
        if(this.testData.parentID === null) {
            
            properties.parentID = this.testData.semesterID;
            properties.isSubject = true;

        } else {
            
            properties.parentID = this.testData.parentID;
            properties.isSubject = false;

        }
        
        properties.isFolder = this.testData.isFolder;

        loadData("/phpScripts/create/createTest.php", properties, function(result) {

            properties.testID = result.newID;

            currentElement.childrenData.push(properties);

            if(result.result) {

                cache.tests = [];
                cache.semesters = [];

            }

            loadElementAndPrint();

        }, function(errorCode) {

            showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);

        });

        if(properties.weight === undefined) properties.weight = null;
        if(properties.round === undefined) properties.round = null;
        if(properties.maxPoints === undefined) properties.maxPoints = null;
        if(properties.formula === undefined) properties.formula = null;
        if(properties.notes === undefined) properties.notes = null;

        if(properties.date === undefined) {
            
            properties.date = null;

        } else {

            properties.date = (new Date(properties.date * 1000)).toISOString().substr(0, 10);

        }

        if(this.referenceID === undefined) {

            properties.referenceID = null;
            properties.referenceState = this.testData.referenceState;

        } else {

            properties.referenceID = this.referenceID;
            properties.referenceState = "ok";

        }
        
        properties.subjectID = this.testData.parentID === null ? null : (currentElement.data.subjectID || currentElement.data.testID);
        properties.isHidden = 0;
        properties.isFolder = Number(properties.isFolder);
        properties.markCounts = Number(properties.markCounts);
        properties.isReferenced = 0;
        properties.deleteTimestamp = null;

        delete properties.templateID;
        delete properties.permissions;

        Loading.show(null, "semi-transparent");

        this.templateID = undefined;

        this.close();

    };

    editTestDialog.updateRoundSelect = function() {

        var roundSelectElement = document.getElementById("editTestDialog_roundSelect");
        var roundCustomElement = document.getElementById("editTestDialog_roundCustom");

        if(roundSelectElement.value === "-1") {

            roundCustomElement.style.borderRadius = "0px 5px 5px 0px";
            roundSelectElement.style.borderRadius = "5px 0px 0px 5px";

            roundCustomElement.style.display = "block";

            this.check("roundCustom");

        } else {

            roundSelectElement.style.borderRadius = "5px";

            roundCustomElement.style.display = "none";

            delete this.errors.roundCustom;
            this.updateErrors(this.isNew);

        }

    };

    editTestDialog.updateType = function(index) {

        if(index === 0) {

            delete this.errors.formula;
            delete this.errors.maxPoints;
            delete this.errors.points;

            if(currentElement.data.classID === null && !currentElement.isTemplate) {

                var isTest = !this.testData.isFolder && this.testData.referenceState === null;

                if(isTest) {

                    this.check("mark");
                    document.getElementById("editTestDialog_markContainer").style.display = "block";

                } else {

                    delete this.errors.mark;
                    document.getElementById("editTestDialog_markContainer").style.display = "none";

                }

            }

            document.getElementById("editTestDialog_pointsContainer").style.display = "none";

            document.getElementById("editTestDialog_formulaContainer").style.display = "none";
            document.getElementById("editTestDialog_maxPointsContainer").style.display = "none";

        } else {

            if(currentElement.data.classID === null && !currentElement.isTemplate) {

                var isTest = !this.testData.isFolder && this.testData.referenceState === null;

                if(isTest) {

                    this.check("points", true, false);
                    document.getElementById("editTestDialog_pointsContainer").style.display = "block";

                } else {

                    delete this.errors.points;
                    document.getElementById("editTestDialog_pointsContainer").style.display = "none";

                }

                if(document.getElementById("editTestDialog_formula").value === "manual") {

                    this.check("mark", true, false);
                    document.getElementById("editTestDialog_markContainer").style.display = "block";

                } else {

                    delete this.errors.mark;
                    document.getElementById("editTestDialog_markContainer").style.display = "none";

                }

            }

            this.check("maxPoints", false, true);

            document.getElementById("editTestDialog_formulaContainer").style.display = "block";
            document.getElementById("editTestDialog_maxPointsContainer").style.display = "block";

        }

    };

    editTestDialog.updateFormula = function() {

        var value = document.getElementById("editTestDialog_formula").value;

        if(value === "manual") {

            this.check("mark", true, false);
            document.getElementById("editTestDialog_markContainer").style.display = "block";

        } else {

            delete this.errors.mark;
            document.getElementById("editTestDialog_markContainer").style.display = "none";

        }

        this.check("maxPoints", value !== "manual");

    }







    permissionsDialog.open = function(type) {

        this.type = type;
        this.errors = { newName: false };

        if(type === TYPE_SEMESTER) {

            var editDialog = editSemesterDialog;
            var infoDialog = semesterInfoDialog;
            var additionalElementInfos = additionalInfo.semesters;

            this.elementID = editSemesterDialog.semesterData.semesterID;

        } else if(type === TYPE_TEST) {

            var editDialog = editTestDialog;
            var infoDialog = testInfoDialog;
            var additionalElementInfos = additionalInfo.tests;

            this.elementID = editTestDialog.testData.testID;

        } else {

            var editDialog = editClassDialog;
            var infoDialog = classInfoDialog;
            var additionalElementInfos = additionalInfo.classes;

            this.elementID = editClassDialog.classData.classID;

        }
            
        if(editDialog.permissionsData !== undefined) {
            
            this.data = copy(editDialog.permissionsData);

        } else if(this.elementID === undefined) {
            
            this.data = [];
            
        } else if(additionalElementInfos[this.elementID] !== undefined) {

            this.data = copy(additionalElementInfos[this.elementID].permissions);

        } else {

            var contentElement = document.getElementById("permissionsDialog_content");

            var requestObj = {};
            var requestTarget;

            switch(type) {

                case TYPE_SEMESTER: requestObj.semesterID   = this.elementID; requestTarget = "getSemesterInfo.php";   break;
                case TYPE_TEST:     requestObj.testID       = this.elementID; requestTarget = "getTestInfo.php";       break;
                case TYPE_CLASS:    requestObj.classID      = this.elementID; requestTarget = "getClassInfo.php";      break;

            }

            this.additionalInfoRequest = loadData("/phpScripts/getInfo/" + requestTarget, requestObj, function(data) {

                additionalElementInfos[permissionsDialog.elementID] = data;
                permissionsDialog.data = copy(data.permissions);

                Loading.hide(permissionsDialog.contentElement);
                contentElement.style.opacity = "1";
                
                if(permissionsDialog.type === TYPE_SEMESTER && infoDialog.isVisible()) {
                    
                    infoDialog.printAdditionalInfo();

                }

                setTimeout(permissionsDialog.showContent.bind(permissionsDialog), 200);

            }, function(errorCode) {
    
                showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode);

                Loading.hide(permissionsDialog.contentElement);
    
            });

            Loading.show(this.contentElement, "transparent");
            
            contentElement.style.visibility = "hidden";
            contentElement.style.opacity = "0";

        }

        document.getElementById("permissionsDialog_newName").classList.remove("error");
        document.getElementById("permissionsDialog_newName").value = "";
        document.getElementById("permissionsDialog_addButton").disabled = true;

        document.getElementById("permissionsDialog_OKButton").style.display = "none";

        document.getElementById("permissionsDialog_cancelButton").classList.remove("button_medium");
        document.getElementById("permissionsDialog_cancelButton").classList.add("button_big");

        updateErrors(this.errors, document.getElementById("permissionsDialog_errorContainer"), document.getElementById("permissionsDialog_addButton"));

        if(this.data !== undefined) {

            this.showContent();

        }

        this.show();

    };

    permissionsDialog.showContent = function() {

        var contentElement = document.getElementById("permissionsDialog_content");

        contentElement.style.opacity = "1";
        contentElement.style.visibility = "visible";

        var tableString = "";

        for(var i = 0; i < this.data.length; i++) {

            var currentPermission = this.data[i];

            if(currentPermission) {

                tableString +=
                "<tr>" +
                    "<td>" + escapeHTML(currentPermission.userName) + "</td>" +
                    "<td>" + (currentPermission.lastName === undefined ? "" : ((currentPermission.firstName === undefined ? "" : escapeHTML(currentPermission.firstName)) + " " + escapeHTML(currentPermission.lastName))) + "</td>" +
                    "<td><img src='" + (currentPermission.writingPermission ? "/img/icons/edit_black.svg" : "/img/icons/view.svg") + "' /></td>" +
                    "<td>" +
                        "<label class='checkboxSwitch'>" +
                            "<input type='checkbox' " + (currentPermission.writingPermission ? "checked" : "") + " onchange='permissionsDialog.changeWritingPermission(" + i + ", this);' />" +
                            "<span></span>" +
                        "</label>" +
                    "</td>" +
                    "<td>" +
                        "<button class='button_square negative' onclick='permissionsDialog.deletePermission(" + i + ", this);'><img src='/img/icons/delete.svg' /></button>" +
                    "</td>" +
                "</tr>";

            }

        }
            
        if(tableString !== "") {

            document.getElementById("permissionsDialog_noPermission").style.display = "none";
            document.getElementById("permissionsDialog_table").style.display = "table";
            document.getElementById("permissionsDialog_table").innerHTML = tableString;

        } else {

            document.getElementById("permissionsDialog_noPermission").style.display = "block";
            document.getElementById("permissionsDialog_table").style.display = "none";
            document.getElementById("permissionsDialog_table").innerHTML = "";

        }

    };

    permissionsDialog.changeWritingPermission = function(rowNumber, element) {
        
        this.data[rowNumber].writingPermission = element.checked;

        element.parentNode.parentNode.previousElementSibling.children[0].src = element.checked ? "/img/icons/edit_black.svg" : "/img/icons/view.svg";

        var cancelButton = document.getElementById("permissionsDialog_cancelButton");

        if(cancelButton.classList.contains("button_big")) {

            document.getElementById("permissionsDialog_OKButton").style.display = "inline-block";
            cancelButton.classList.remove("button_big");
            cancelButton.classList.add("button_medium");

        }

    };

    permissionsDialog.deletePermission = function(rowNumber, element) {
        
        this.data[rowNumber] = undefined;

        var rowElement = element.parentNode.parentNode;
        rowElement.parentNode.removeChild(rowElement);

        var cancelButton = document.getElementById("permissionsDialog_cancelButton");

        if(cancelButton.classList.contains("button_big")) {

            document.getElementById("permissionsDialog_OKButton").style.display = "inline-block";
            cancelButton.classList.remove("button_big");
            cancelButton.classList.add("button_medium");

        }

        for(var i = 0; i < this.data.length; i++) {

            if(this.data[i] !== undefined) {

                return;

            }

        }

        document.getElementById("permissionsDialog_noPermission").style.display = "block";
        document.getElementById("permissionsDialog_table").style.display = "none";

    }

    permissionsDialog.check = function(callErrorUpdate = true) {

        var element = document.getElementById("permissionsDialog_newName");

        if(element.value.trim() === "") {

            element.classList.remove("error");

            this.errors.newName = false;
            this.needsNameCheck = false;

        } else if(element.value.toLowerCase() === user.userName.toLowerCase()) {
            
            element.classList.add("error");

            this.errors.newName = "Man kann sich nicht selbst hinzufügen.";
            this.needsNameCheck = false;
            
        } else {

            var found = false;
            var userName = element.value.toLowerCase();

            for(var i = 0; i < this.data.length; i++) {

                if(this.data[i] !== undefined && this.data[i].userName.toLowerCase() === userName) {

                    found = true;
                    element.classList.add("error");

                    this.errors.newName = "Dieser Benutzer hat bereits Zugriff.";
                    this.needsNameCheck = false;

                    break;

                }

            }
            
            if(!found) {

                this.errors.newName = false;
                this.needsNameCheck = true;

            }
            

        }

        if(callErrorUpdate) {

            updateErrors(this.errors, document.getElementById("permissionsDialog_errorContainer"), document.getElementById("permissionsDialog_addButton"));
            this.resize();

        }
        
    }

    permissionsDialog.checkUserNameExistance = function() {

        this.needsNameCheck = false;

        var requestObj = { userName: document.getElementById("permissionsDialog_newName").value };

        if(this.type !== TYPE_SEMESTER) {

            requestObj.needsTeacher = true;

        }

        this.nameCheckRequest = loadData("/phpScripts/checkUserName", requestObj, function(data) {

            if(data.result) {

                document.getElementById("permissionsDialog_newName").classList.remove("error");
                delete permissionsDialog.errors.newName;

            } else {

                document.getElementById("permissionsDialog_newName").classList.add("error");

                if(permissionsDialog.type === TYPE_SEMESTER) {

                    permissionsDialog.errors.newName = "Dieser Benutzername existiert nicht.";

                } else {

                    permissionsDialog.errors.newName = "Dieser Benutzername existiert nicht oder ist keine Lehrperson.";

                }

            }

            updateErrors(permissionsDialog.errors, document.getElementById("permissionsDialog_errorContainer"), document.getElementById("permissionsDialog_addButton"));

        }, function() {

            document.getElementById("permissionsDialog_newName").classList.add("error");
            this.errors.newName = "Beim Überprüfen des Benutzernamens ist ein Fehler aufgetreten.";

        });

    };

    permissionsDialog.newNameInput = function() {

        if(this.nameCheckRequest !== undefined) {

            this.nameCheckRequest.abort();
            this.nameCheckRequest = undefined;

        }

        if(this.nameCheckTimeoutID !== undefined) {

            clearTimeout(this.nameCheckTimeoutID);
            this.nameCheckTimeoutID = undefined;

        }

        this.check();

        if(this.needsNameCheck) {

            this.nameCheckTimeoutID = setTimeout(this.checkUserNameExistance.bind(this), 1000);

        }

    };

    permissionsDialog.newNameChange = function() {

        if(this.nameCheckTimeoutID !== undefined) {

            clearTimeout(this.nameCheckTimeoutID);
            this.nameCheckTimeoutID = undefined;

        }

        if(this.needsNameCheck) {

            this.checkUserNameExistance();

        }


    };

    permissionsDialog.addPermission = function() {

        var inputElement = document.getElementById("permissionsDialog_newName");

        var newIndex = this.data.length;

        this.data[newIndex] = { userName: inputElement.value, writingPermission: false };

        var cancelButton = document.getElementById("permissionsDialog_cancelButton");

        if(cancelButton.classList.contains("button_big")) {

            document.getElementById("permissionsDialog_OKButton").style.display = "inline-block";
            cancelButton.classList.remove("button_big");
            cancelButton.classList.add("button_medium");

        }

        var rowString =
        "<td>" + escapeHTML(inputElement.value) + "</td>" +
        "<td></td>" +
        "<td><img src='/img/icons/view.svg' /></td>" +
        "<td>" +
            "<label class='checkboxSwitch'>" +
                "<input type='checkbox' onchange='permissionsDialog.changeWritingPermission(" + newIndex + ", this);' />" +
                "<span></span>" +
            "</label>" +
        "</td>" +
        "<td>" +
            "<button class='button_square negative' onclick='permissionsDialog.deletePermission(" + newIndex + ", this);'><img src='/img/icons/delete.svg' /></button>" +
        "</td>";

        var rowElement = document.createElement("tr");
        rowElement.innerHTML = rowString;

        document.getElementById("permissionsDialog_table").appendChild(rowElement);

        document.getElementById("permissionsDialog_noPermission").style.display = "none";
        document.getElementById("permissionsDialog_table").style.display = "table";

        inputElement.classList.remove("error");
        inputElement.value = "";
        
        this.errors.newName = false;
        updateErrors(this.errors, document.getElementById("permissionsDialog_errorContainer"), document.getElementById("permissionsDialog_addButton"));
        this.resize();

    };

    permissionsDialog.close = function() {

        this.elementID = undefined;
        this.data = undefined;
        this.needsNameCheck = false;

        if(this.additionalInfoRequest !== undefined) {

            this.additionalInfoRequest.abort();
            this.additionalInfoRequest = undefined;

        }

        if(this.nameCheckRequest !== undefined) {

            this.nameCheckRequest.abort();
            this.nameCheckRequest = undefined;

        }

        if(this.nameCheckTimeoutID !== undefined) {

            clearTimeout(this.nameCheckTimeoutID);
            this.nameCheckTimeoutID = undefined;

        }

        Loading.hide(permissionsDialog.contentElement);

        this.hide();

    };

    permissionsDialog.save = function() {

        if(this.type === TYPE_SEMESTER) {

            editSemesterDialog.permissionsData = this.data;

        } else if(this.type === TYPE_TEST) {

            editTestDialog.permissionsData = this.data;

        } else {

            editClassDialog.permissionsData = this.data;

        }

        this.close();

    };


    document.getElementById("semesterInfoDialog_closeButton").addEventListener("click", semesterInfoDialog.close.bind(semesterInfoDialog));
    document.getElementById("semesterInfoDialog_loadMoreButton").addEventListener("click", semesterInfoDialog.loadMore.bind(semesterInfoDialog));

    document.getElementById("testInfoDialog_closeButton").addEventListener("click", testInfoDialog.close.bind(testInfoDialog));
    document.getElementById("testInfoDialog_loadMoreButton").addEventListener("click", testInfoDialog.loadMore.bind(testInfoDialog));


    editSemesterDialog.templateTypeSelect = new ButtonSelect(document.getElementById("editSemesterDialog_templateType"));
    editSemesterDialog.semesterTypeSelect = new ButtonSelect(document.getElementById("editSemesterDialog_semesterType"), editSemesterDialog.updateSemesterType.bind(editSemesterDialog));

    document.getElementById("editSemesterDialog_with_notes")        .addEventListener("change", editSemesterDialog.updateCheckbox.bind(editSemesterDialog, "notes"));
    document.getElementById("editSemesterDialog_name")              .addEventListener("input",  editSemesterDialog.check.bind(editSemesterDialog, "name"));
    document.getElementById("editSemesterDialog_notes")             .addEventListener("input",  editSemesterDialog.check.bind(editSemesterDialog, "notes"));
    document.getElementById("editSemesterDialog_permissionsButton") .addEventListener("click",  permissionsDialog.open.bind(permissionsDialog, TYPE_SEMESTER));
    document.getElementById("editSemesterDialog_cancelButton")      .addEventListener("click",  editSemesterDialog.close.bind(editSemesterDialog));
    document.getElementById("editSemesterDialog_OKButton")          .addEventListener("click",  editSemesterDialog.save.bind(editSemesterDialog));


    editTestDialog.typeSelect = new ButtonSelect(document.getElementById("editTestDialog_type"), editTestDialog.updateType.bind(editTestDialog));

    document.getElementById("editTestDialog_with_date")         .addEventListener("change", editTestDialog.updateCheckbox.bind(editTestDialog, "date"));
    document.getElementById("editTestDialog_with_notes")        .addEventListener("change", editTestDialog.updateCheckbox.bind(editTestDialog, "notes"));
    document.getElementById("editTestDialog_roundSelect")       .addEventListener("input",  editTestDialog.updateRoundSelect.bind(editTestDialog));
    document.getElementById("editTestDialog_name")              .addEventListener("input",  editTestDialog.check.bind(editTestDialog, "name"));
    document.getElementById("editTestDialog_date")              .addEventListener("input",  editTestDialog.check.bind(editTestDialog, "date"));
    document.getElementById("editTestDialog_weight")            .addEventListener("input",  editTestDialog.check.bind(editTestDialog, "weight"));
    document.getElementById("editTestDialog_roundCustom")       .addEventListener("input",  editTestDialog.check.bind(editTestDialog, "roundCustom"));
    document.getElementById("editTestDialog_maxPoints")         .addEventListener("input",  editTestDialog.check.bind(editTestDialog, "maxPoints"));
    document.getElementById("editTestDialog_notes")             .addEventListener("input",  editTestDialog.check.bind(editTestDialog, "notes"));
    document.getElementById("editTestDialog_points")            .addEventListener("input",  editTestDialog.check.bind(editTestDialog, "points"));
    document.getElementById("editTestDialog_mark")              .addEventListener("input",  editTestDialog.check.bind(editTestDialog, "mark"));
    document.getElementById("editTestDialog_formula")           .addEventListener("input",  editTestDialog.updateFormula.bind(editTestDialog));
    document.getElementById("editTestDialog_permissionsButton") .addEventListener("click",  permissionsDialog.open.bind(permissionsDialog, TYPE_TEST));
    document.getElementById("editTestDialog_cancelButton")      .addEventListener("click",  editTestDialog.close.bind(editTestDialog));
    document.getElementById("editTestDialog_OKButton")          .addEventListener("click",  editTestDialog.save.bind(editTestDialog));


    document.getElementById("permissionsDialog_cancelButton")   .addEventListener("click",  permissionsDialog.close.bind(permissionsDialog));
    document.getElementById("permissionsDialog_addButton")      .addEventListener("click",  permissionsDialog.addPermission.bind(permissionsDialog));
    document.getElementById("permissionsDialog_OKButton")       .addEventListener("click",  permissionsDialog.save.bind(permissionsDialog));
    document.getElementById("permissionsDialog_newName")        .addEventListener("input",  permissionsDialog.newNameInput.bind(permissionsDialog));
    document.getElementById("permissionsDialog_newName")        .addEventListener("change", permissionsDialog.newNameChange.bind(permissionsDialog));



    document.getElementById("semesters_addSemesterButton")  .addEventListener("click", editSemesterDialog.openAdd.bind(editSemesterDialog, false, false));
    document.getElementById("semesters_addTemplateButton")  .addEventListener("click", editSemesterDialog.openAdd.bind(editSemesterDialog, false, true));
    document.getElementById("semesters_addFolderButton")    .addEventListener("click", editSemesterDialog.openAdd.bind(editSemesterDialog, true,  false));

    document.getElementById("semesters_editButton").addEventListener("click", editSemesterDialog.openEdit.bind(editSemesterDialog, undefined));

    document.getElementById("tests_addSubjectButton")   .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, true,    false));
    document.getElementById("tests_addRootTestButton")  .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, false,   false));
    document.getElementById("tests_addRootRefButton")   .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, false,   true));
    document.getElementById("tests_addTestButton")      .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, false,   false));
    document.getElementById("tests_addFolderButton")    .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, true,    false));
    document.getElementById("tests_addRefButton")       .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, false,   true));

    document.getElementById("tests_semesterInfoButton").addEventListener("click", semesterInfoDialog.open.bind(semesterInfoDialog));
    document.getElementById("tests_elementInfoButton") .addEventListener("click", testInfoDialog.open.bind(testInfoDialog));
    
    document.getElementById("tests_editSemesterButton").addEventListener("click", editSemesterDialog.openEdit.bind(editSemesterDialog, undefined));
    document.getElementById("tests_editElementButton") .addEventListener("click", editTestDialog.openEdit.bind(editTestDialog, undefined));

    document.getElementById("tests_testInfo_loadMoreButton").addEventListener("click", loadMoreTestInfo);

    document.getElementById("semesters_visibilityButton")     .addEventListener("click", function() { changeVisibilty(this, "semesters"); });
    document.getElementById("tests_visibilityButton")         .addEventListener("click", function() { changeVisibilty(this, "tests"); });

    // setTimeout(function() { editTestDialog.openEdit(1) }, 500);

    loadElementAndPrint();

});

