// Javascript fuer app.php
// Wird immer hinzugefuegt, auch bei Lehrpersonen

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
    studentMarks: false,
    foreignSemesters: !user.isTeacher,
    foreignClasses: false

};

var currentElement;


var semesterInfoDialog;
var testInfoDialog;

var editSemesterDialog;
var editTestDialog;

var permissionsDialog;
var selectDialog;
var deleteDialog;

var additionalTestInfoRequest;


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
                        (currentChildData.isHidden ? "<button class='button_square negative table_big'><img src='/img/icons/delete.svg' alt='X' onclick='event.stopPropagation(); deleteElement(TYPE_SEMESTER, " + currentChildData.semesterID + ", " + (currentChildData.classID > 0) + ", " + currentChildData.isFolder + ");'></button>" : "<button class='button_square negativeNeutral table_big'><img src='/img/icons/archive.svg' alt='A' onclick='event.stopPropagation(); changeVisibility(TYPE_SEMESTER, " + currentChildData.semesterID + ");'></button>") +
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

            document.getElementById("semesters_folderButtons").style.display = "none";
            document.getElementById("title").innerHTML = "Semesterauswahl";
            document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - App";
            document.getElementById("returnButton").style.display = "none";

        } else {

            var deleteButton = document.getElementById("semesters_deleteButton");

            if(currentElement.data.isHidden) {

                deleteButton.innerHTML = "<img src='/img/icons/delete.svg' alt=' '>Ordner löschen";
                deleteButton.classList.remove("negativeNeutral");
                deleteButton.classList.add("negative");

                deleteButton.onclick = deleteElement.bind(this, TYPE_SEMESTER, currentElement.data.semesterID, false, true);

            } else {

                deleteButton.innerHTML = "<img src='/img/icons/archive.svg' alt=' '>Ordner archivieren";
                deleteButton.classList.remove("negative");
                deleteButton.classList.add("negativeNeutral");

                deleteButton.onclick = changeVisibility.bind(this, TYPE_SEMESTER, currentElement.data.semesterID);

            }

            document.getElementById("semesters_folderButtons").style.display = "block";
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

            if(currentElement.data.classID !== null && currentElement.data.classID <= 0) {

                document.getElementById("averageFooter").style.display = "none";

            } else {

                document.getElementById("averageFooter").style.display = "block";

            }

            document.getElementById("parentTypeStyles").innerHTML = ".parentType_semester { display: inline; }";

        }

        if(user.isTeacher) {

            if(currentElement.data.classID !== null && currentElement.data.classID <= 0) {

                document.getElementById("tests_noClass").style.display = "inline-block";

            } else {

                document.getElementById("tests_noClass").style.display = "none";

            }

        }

        if(currentElement.isRoot) {

            document.getElementById("tests_followRefButton").style.display = "none";

            document.getElementById("tests_elementButtons").style.display = "none";
            document.getElementById("tests_semesterButtons").style.display = "block";

            document.getElementById("typeStyles").innerHTML = ".type_root { display: inline; }";
            
            document.getElementById("tests_visibilityButton").style.display = "inline-block";

            if(currentElement.writingPermission && (currentElement.data.classID === null || currentElement.data.classID > 0)) {

                if(currentElement.data.templateType === "subjectTemplate") {

                    document.getElementById("tests_addFolderButtons").style.display = "block";
                    document.getElementById("tests_addSubjectButtons").style.display = "none";
                
                } else {

                    document.getElementById("tests_addFolderButtons").style.display = "none";
                    document.getElementById("tests_addSubjectButtons").style.display = "block";

                }

                document.getElementById("tests_deletedButton").style.display = "inline-block";

                //document.getElementById("tests_empty_templateButton").style.display = "inline-block";
                document.getElementById("tests_empty_instruction").style.display = "block";

            } else {

                document.getElementById("tests_addSubjectButtons").style.display = "none";
                document.getElementById("tests_addFolderButtons").style.display = "none";
                document.getElementById("tests_deletedButton").style.display = "none";

                document.getElementById("tests_empty_templateButton").style.display = "none";
                document.getElementById("tests_empty_instruction").style.display = "none";

            }

            var isClass = currentElement.data.classID !== null && currentElement.accessType !== ACCESS_STUDENT;

            if(currentElement.accessType === ACCESS_TEACHER || currentElement.isTemplate || (currentElement.data.classID !== null && currentElement.data.classID <= 0)) {

                document.getElementById("averageFooter").style.display = "none";

            } else {

                document.getElementById("averageFooter_plusPoints_big").style.display = "block";
                document.getElementById("averageFooter_average").style.display = "block";

                document.getElementById("averageFooter_plusPoints_big").innerHTML = (isClass ? "Durchschnitt. Hochpunktzahl: " : "Hochpunkte: ") + formatNumber(currentElement.data.plusPoints, "-");
                document.getElementById("averageFooter_average").innerHTML = (isClass ? "Klassenschnitt: " : "Notenschnitt: ") + formatNumber(currentElement.data.mark_unrounded, "-");
                

            }

            if(currentElement.accessType === ACCESS_OWNER) {

                document.getElementById("tests_semesterControlButtons").style.display = "block";

                var deleteButton = document.getElementById("tests_deleteSemesterButton");

                if(currentElement.data.isHidden) {

                    deleteButton.innerHTML = "<img src='/img/icons/delete.svg' alt=' '><span class='parentType_semester'>Semester</span><span class='parentType_template'>Vorlage</span> löschen</span>";
                    deleteButton.classList.remove("negativeNeutral");
                    deleteButton.classList.add("negative");

                    deleteButton.onclick = deleteElement.bind(this, TYPE_SEMESTER, currentElement.data.semesterID, currentElement.data.classID > 0, false);

                } else {

                    deleteButton.innerHTML = "<img src='/img/icons/archive.svg' alt=' '><span class='parentType_semester'>Semester</span><span class='parentType_template'>Vorlage</span> archivieren</span>";
                    deleteButton.classList.remove("negative");
                    deleteButton.classList.add("negativeNeutral");

                    deleteButton.onclick = changeVisibility.bind(this, TYPE_SEMESTER, currentElement.data.semesterID);

                }

            } else {

                document.getElementById("tests_semesterControlButtons").style.display = "none";

            }

        } else {

            document.getElementById("tests_addSubjectButtons").style.display = "none";

            document.getElementById("tests_elementButtons").style.display = "block";
            document.getElementById("tests_semesterButtons").style.display = "none";

            if(currentElement.writingPermission && currentElement.isFolder) {

                document.getElementById("tests_addFolderButtons").style.display = "block";

                /*if(currentElement.data.round === null) {

                    document.getElementById("tests_empty_templateButton").style.display = "none";
                    document.getElementById("tests_empty_instruction").style.display = "none";

                } else {

                    document.getElementById("tests_empty_templateButton").style.display = "inline-block";
                    document.getElementById("tests_empty_instruction").style.display = "block";

                }*/

            } else {

                document.getElementById("tests_addFolderButtons").style.display = "none";
                document.getElementById("tests_empty_templateButton").style.display = "none";
                document.getElementById("tests_empty_instruction").style.display = "none";

            }

            document.getElementById("averageFooter_plusPoints_big").style.display = "none";
            document.getElementById("tests_followRefButton").style.display = "none";

            if(currentElement.isFolder) {

                if(currentElement.data.parentID === null && currentElement.data.templateType !== "subjectTemplate") {

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

                    if(currentElement.data.referenceState === "ok" || currentElement.data.referenceState === "outdated") {
                        
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

                    } else if(currentChildData.referenceState === "deleted" || currentChildData.referenceState === "delTemp" || currentChildData.referenceState === "delForbidden") {

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
                            (currentElement.writingPermission && (currentElement.data.classID === null || currentElement.data.classID > 0) ? (
                            "<button class='button_square negative table_big'><img src='/img/icons/delete.svg' alt='X' onclick='event.stopPropagation(); deleteElement(TYPE_TEST, " + currentChildData.testID + ");'></button>" +
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

            if(currentElement.isRoot || currentElement.data.classID <= 0) {

                if(currentElement.accessType === ACCESS_TEACHER || currentElement.data.classID <= 0) {

                    document.getElementById("tests_studentTable").style.display = "none";
                    document.getElementById("tests_markPaperButton").style.display = "none";
                    document.getElementById("tests_studentButtons").style.display = "none";

                } else {

                    document.getElementById("tests_editMarksButton").style.display = "none";
                    document.getElementById("tests_studentButtons").style.display = "block";

                    if(tableString !== "") {

                        //document.getElementById("tests_markPaperButton").style.display = "inline-block";

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

                    //document.getElementById("tests_markPaperButton").style.display = "inline-block";

                } else {

                    document.getElementById("tests_markPaperButton").style.display = "none";

                }

            }

            if((!currentElement.isRoot || currentElement.accessType !== ACCESS_TEACHER) && currentElement.data.classID > 0) {

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

                //document.getElementById("tests_markPaperButton").style.display = "inline-block";

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
                    
                        //document.getElementById("tests_calculatorButton").style.display = "inline-block";

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

            if(!showHidden.foreignSemesters && currentChildData.isHidden) {

                continue;

            }

            var currentString = 
                "<tr onclick='select(TYPE_TEST, " + currentChildData.semesterID + ", true, true)'>" +
                    "<td class='table_name'>" + escapeHTML(currentChildData.name) + "</td>" +
                    "<td>" + escapeHTML(currentChildData.userName) + "</td>" +
                    "<td class='table_buttons'>" +
                        "<button class='button_square positive table_big' onclick='event.stopPropagation(); selectDialog.openSelectActionLocation(TYPE_SEMESTER, selectDialog.ACTION_REF, undefined, TYPE_SEMESTER, undefined, true, " + currentChildData.semesterID + ");'><img src='/img/icons/save.svg' alt='S'></button>" +
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
                    (currentChildData.isHidden ? "<button class='button_square negative table_big'><img src='/img/icons/delete.svg' alt='X' onclick='event.stopPropagation(); deleteElement(TYPE_CLASS, " + currentChildData.classID + ", true);'></button>" : "<button class='button_square negativeNeutral table_big'><img src='/img/icons/archive.svg' alt='A' onclick='event.stopPropagation(); changeVisibility(TYPE_CLASS, " + currentChildData.classID + ");'></button>") +
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

            if(!showHidden.foreignClasses && currentChildData.isHidden) {

                continue;

            }

            tableString += 
                "<tr onclick='select(TYPE_CLASS, " + currentChildData.classID + ", false, true)'>" +
                    "<td class='table_name'>" + escapeHTML(currentChildData.name) + "</td>" +
                    "<td>" + escapeHTML(currentChildData.userName) + "</td>" +
                    "<td class='table_buttons'>" +
                        "<button class='button_square positive table_big' onclick='event.stopPropagation(); selectDialog.openSelectActionLocation(TYPE_CLASS, selectDialog.ACTION_REF, undefined, TYPE_CLASS, undefined, true, " + currentChildData.classID + ");'><img src='/img/icons/save.svg' alt='S'></button>" +
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
            document.getElementById("students_deletedButton").style.display = "inline-block";

        } else {

            document.getElementById("students_addStudentButton").style.display = "none";
            document.getElementById("students_deletedButton").style.display = "none";              

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
                            (currentChildData.isHidden ? "<button class='button_square negative table_big'><img src='/img/icons/delete.svg' alt='X' onclick='event.stopPropagation(); deleteElement(TYPE_STUDENT, " + currentChildData.studentID + ", true);'></button>" : "<button class='button_square negativeNeutral table_big'><img src='/img/icons/archive.svg' alt='A' onclick='event.stopPropagation(); changeVisibility(TYPE_STUDENT, " + currentChildData.studentID + ");'></button>") +
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

        var deleteButton = document.getElementById("students_deleteClassButton");

        if(currentElement.data.isHidden) {

            deleteButton.innerHTML = "<img src='/img/icons/delete.svg' alt=' '>Klasse löschen";
            deleteButton.classList.remove("negativeNeutral");
            deleteButton.classList.add("negative");

            deleteButton.onclick = deleteElement.bind(this, TYPE_CLASS, currentElement.data.classID, true, false);

        } else {

            deleteButton.innerHTML = "<img src='/img/icons/archive.svg' alt=' '>Klasse archivieren";
            deleteButton.classList.remove("negative");
            deleteButton.classList.add("negativeNeutral");

            deleteButton.onclick = changeVisibility.bind(this, TYPE_CLASS, currentElement.data.classID);

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

            if (!cache.semesters[pathElement.ID] || !cache.semesters[pathElement.ID].withMarks) {

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

            if (!cache.tests[pathElement.ID] || !cache.tests[pathElement.ID].withMarks) {

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
            case "deleted":
            case "delForbidden":
            case "delTemp":     refState = "gelöscht"; break;

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

        if(testData.isHidden) {

            visibilityButton.innerHTML = "Wieder anzeigen";

        } else {

            visibilityButton.innerHTML = "Ausblenden";

        }

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

        document.getElementById(elementPrefix + "_markAndPointsContainer").style.display = "none";

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
                            "<td>" + escapeHTML(currentPermission.firstName) + " " + escapeHTML(currentPermission.lastName) + "</td>" +
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


function changeHiddenVisibility(element, type) {

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




function changeVisibility(type, ID) {

    if(isBlocked) return;

    if(type === TYPE_SEMESTER) {

        var IDName = "semesterID";
        var currentCache = cache.semesters;
        var infoDialog = semesterInfoDialog;
        var requestURL = "/phpScripts/edit/editSemester.php";

    } else if(type === TYPE_TEST) {

        var IDName = "testID";
        var currentCache = cache.tests;
        var infoDialog = testInfoDialog;
        var requestURL = "/phpScripts/edit/editTest.php";

    } else if(type === TYPE_CLASS) {

        var IDName = "classID";
        var currentCache = cache.classes;
        var infoDialog = classInfoDialog;
        var requestURL = "/phpScripts/edit/editClass.php";

    } else if(type === TYPE_STUDENT) {

        var IDName = "studentID";

        var infoDialog = studentInfoDialog;
        var requestURL = "/phpScripts/edit/editStudent.php";

    }

    var newState;

    if(type !== TYPE_STUDENT && currentElement.data !== undefined && currentElement.data[IDName] === ID) {

        newState = !currentElement.data.isHidden;
        currentElement.data.isHidden = newState;
        
        if(type === TYPE_CLASS || currentElement.data.parentID === null) {
            
            if(type === TYPE_SEMESTER) {

                cache.rootSemesters = undefined;

            } else if(type === TYPE_TEST) {

                delete cache.semesters[currentElement.data.semesterID];

            } else if(type === TYPE_CLASS) {
                
                cache.rootClasses = undefined;

            }

        } else {

            delete currentCache[currentElement.data.parentID];

        }

    } else {

        var len = currentElement.childrenData.length;
        var found = false;
    
        for(var i = 0; i < len; i++) {
    
            if(currentElement.childrenData[i][IDName] === ID) {
    
                newState = !currentElement.childrenData[i].isHidden;
                currentElement.childrenData[i].isHidden = newState;

                found = true;
                break;
    
            }
    
        }

        if(!found) return;

        if(type !== TYPE_STUDENT && currentCache[ID] !== undefined) {

            currentCache[ID].data.isHidden = newState;

        }

    }

    var requestObj = { isHidden: newState }
    requestObj[IDName] = ID;

    loadData(requestURL, [ requestObj ], function() {

        if(infoDialog.isVisible()) {

            Loading.hide(infoDialog.dialogElement);
            infoDialog.printInfo();
    
        }

        hidePanelsAndPrint();

    }, function(errorCode) {

        showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);

    });

    if(type === TYPE_STUDENT) {

        cache.semesters = [];
        cache.tests = [];

    }

    if(infoDialog.isVisible()) {

        Loading.show(infoDialog.dialogElement);

    } else {

        Loading.show(null, "semi-transparent");

    }

}

function deleteElement(type, ID, confirm, confirm2) {
    
    if(isBlocked) return;

    if(editMarks) {

        confirmMarkCancel(deleteElement.bind(this, type, ID, confirm, confirm2), !confirm && !confirm2);
        return;

    }

    if(confirm || confirm2) {

        if(type === TYPE_SEMESTER) {

            if(confirm) {

                var title = "Semester löschen?"
                var description = "Wenn Sie dieses Semester löschen, können die Schüler/innen ihre Noten/Punkte nicht mehr einsehen.\nDamit dies ihnen weiterhin möglich ist, wird empfohlen, das Semester nur zu archivieren.";

            } else {

                var title = "Semesterordner löschen?"
                var description = "Wenn Sie diesen Semesterordner löschen, werden auch alle darin befindlichen Semester und Vorlagen inkl. Noten/Punkte gelöscht.";

            }

        } else if(type === TYPE_CLASS) {

            var title = "Klasse löschen?"
            var description = "Wenn Sie diese Klasse löschen, werden auch alle mit den Schülern/Schülerinnen verbundenen Noten/Punkte gelöscht.\nKlassensemester, die mit dieser Klasse verknüpft sind, werden unbrauchbar.\nEs wird empfohlen, die Klasse stattdessen nur zu archivieren.";

        } else if(type === TYPE_STUDENT) {

            var title = "Schüler/in löschen?"
            var description = "Wenn Sie den/die Schüler/in löschen, werden alle seine/ihre Noten/Punkte gelöscht.\nDamit diese weiterhin erhalten bleiben und der/die Schüler/in sie weiterhin einsehen kann, wird empfohlen, den/die Schüler/in nur zu archivieren.";

        }

        new Alert({
            type: "confirm",
            icon: "warning",
            title: title,
            description: description,
            OKButtonText: "Trotzdem löschen",
            OKAction: deleteElement.bind(this, type, ID, false, false)
        });

        return;

    }

    if(type === TYPE_SEMESTER) {

        var IDName = "semesterID";
        var infoDialog = semesterInfoDialog;
        var requestURL = "/phpScripts/delete/deleteSemester.php";

    } else if(type === TYPE_TEST) {

        var IDName = "testID";
        var infoDialog = testInfoDialog;
        var requestURL = "/phpScripts/delete/deleteTest.php";

    } else if(type === TYPE_CLASS) {

        var IDName = "classID";
        var infoDialog = classInfoDialog;
        var requestURL = "/phpScripts/delete/deleteClass.php";

    } else if(type === TYPE_STUDENT) {

        var IDName = "studentID";
        var infoDialog = studentInfoDialog;
        var requestURL = "/phpScripts/delete/deleteStudent.php";

    }

    var within = false;

    if(type !== TYPE_STUDENT && currentElement.data !== undefined && currentElement.data[IDName] === ID) {

        within = true;

    }

    loadData(requestURL, [ ID ], function() {

        if(infoDialog.isVisible()) {

            Loading.hide(infoDialog.dialogElement);
            infoDialog.close();
    
        }

        if(within) {

            returnFolder();

        } else {

            loadElementAndPrint();

        }

    }, function(errorCode) {

        showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);

    });

    cache.semesters = [];
    cache.tests = [];
    cache.rootSemesters = undefined;

    additionalInfo.semesters = [];
    additionalInfo.tests = [];

    if(type === TYPE_CLASS) {

        delete cache.classes[ID];
        delete additionalInfo.classes[ID];

        if(cache.rootClasses) {

            var len = cache.rootClasses.childrenData.length;
        
            for(var i = 0; i < len; i++) {
        
                if(cache.rootClasses.childrenData[i].classID === ID) {
        
                    cache.rootClasses.childrenData.splice(i, 1);
                    break;
        
                }
        
            }

        }

    } else if(type === TYPE_STUDENT) {

        var len = currentElement.childrenData.length;
    
        for(var i = 0; i < len; i++) {
    
            if(currentElement.childrenData[i].studentID === ID) {
    
                currentElement.childrenData.splice(i, 1);
                break;
    
            }
    
        }

    }

    if(infoDialog.isVisible()) {

        Loading.show(infoDialog.dialogElement);

    } else {

        Loading.show(null, "semi-transparent");

    }

}


// Wird aufgerufen, wenn DOM-Baum vollstaendig geladen
document.addEventListener("DOMContentLoaded", function () {

    if (typeof (localStorage) !== undefined && localStorage.getItem("path") != null) {

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

    permissionsDialog       = new Dialog(document.getElementById("permissionsDialog"),  false, false, function() { permissionsDialog.save(); }, function() { permissionsDialog.close();}, "permissionsDialog");
    selectDialog            = new Dialog(document.getElementById("selectDialog"),       false, false, function() { selectDialog.save(); }, function() { selectDialog.close();}, "selectDialog");

    deleteDialog            = new Dialog(document.getElementById("deleteDialog"), false, true, undefined, undefined, "deleteDialog");



    semesterInfoDialog.open = function(arg) {

        if(isBlocked) return;

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
        // var otherButton = document.getElementById("semesterInfoDialog_otherButton");
        var actionButton = document.getElementById("semesterInfoDialog_actionButton");
        
        if(this.semesterData.isFolder) {

            loadMoreButton.style.display = "none";
            visibilityButton.style.display = "inline-block";
            // otherButton.style.display = "none";

            // actionButton.classList.remove("button_medium");
            // actionButton.classList.add("button_big");

            visibilityButton.classList.remove("button_medium");
            visibilityButton.classList.add("button_big");

            document.getElementById("semesterInfoDialog_controlButtons").style.display = "block";

            // temp
            actionButton.style.display = "none";

        } else {

            // otherButton.style.display = "inline-block";
            
            // actionButton.classList.remove("button_big");
            // actionButton.classList.add("button_medium");
        
            if(currentElement.accessType === ACCESS_OWNER) {

                loadMoreButton.classList.remove("button_big");
                loadMoreButton.classList.add("button_medium");

                visibilityButton.style.display = "inline-block";

                document.getElementById("semesterInfoDialog_controlButtons").style.display = "block";

                // temp
                actionButton.style.display = "none";

            } else {

                loadMoreButton.classList.remove("button_medium");
                loadMoreButton.classList.add("button_big");

                visibilityButton.style.display = "none";

                document.getElementById("semesterInfoDialog_controlButtons").style.display = "none";

                if(this.semesterData.classID === null) {

                    loadMoreButton.style.display = "none";

                }

                // temp
                actionButton.style.display = "inline-block";
                actionButton.onclick = function() { selectDialog.openSelectActionLocation(TYPE_SEMESTER, selectDialog.ACTION_REF, undefined, TYPE_SEMESTER, undefined, true, semesterInfoDialog.semesterData); };

            }

        }

        if(this.semesterData.isHidden) {

            visibilityButton.innerHTML = "Wieder anzeigen";
            visibilityButton.classList.remove("withImage");

        } else {

            visibilityButton.innerHTML = "<img src='/img/icons/archive.svg'>Archivieren";
            visibilityButton.classList.add("withImage");

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

        if(isBlocked) return;

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

        } else if(this.testData.parentID === null && currentElement.data.templateType !== "subjectTemplate") {

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

        if(isBlocked) return;

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
            // document.getElementById("editSemesterDialog_refTestButton").style.display = "inline-block";

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

        if(isBlocked) return;

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

        if(this.isNew) {

            this.templateID = undefined;
            this.realTemplateID = undefined;

            this.copyTeacherID = undefined;
            this.realCopyTeacherID = undefined;

        }

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

        if(
            currentElement.type === TYPE_TEST ||
            (!currentElement.isRoot && currentElement.data.semesterID === this.semesterData.semesterID)
        ) {
            // Element wird von innen bearbeitet

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

        if(this.templateID !== undefined) properties.templateID = this.realTemplateID;
        
        if(this.semesterData.templateType === null) {
            
            if(this.semesterTypeSelect.getState(1)) {
                // Klassensemester
                
                properties.classID = this.realClassID;

                if(this.copyTeacherID !== undefined) properties.copyTeacherID = this.realCopyTeacherID;

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

        this.close();

    };

    editSemesterDialog.updateSemesterType = function(index) {

        if(index === 0) {

            document.getElementById("editSemesterDialog_classButton").style.display = "none";
            document.getElementById("editSemesterDialog_teacherButton").style.display = "none";

        } else {

            document.getElementById("editSemesterDialog_classButton").style.display = "inline-block";
            // document.getElementById("editSemesterDialog_teacherButton").style.display = "inline-block";

        }

        this.check("class", false);

    };





    editTestDialog.openEdit = function(arg) {

        if(isBlocked) return;

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

        } else if(this.testData.parentID === null && currentElement.data.templateType !== "subjectTemplate") {

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

        if(this.testData.referenceState === null || currentElement.isTemplate) {

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

            document.getElementById("editTestDialog_formulaContainer").style.display = "block";
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

        if(isBlocked) return;

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

        } else if(this.testData.parentID === null && currentElement.data.templateType !== "subjectTemplate") {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_subject { display: inline; }";

        } else {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_folder { display: inline; }";
            
        }

        var nameElement = document.getElementById("editTestDialog_name");

        nameElement.value = "";
        nameElement.classList.remove("error");
        nameElement.classList.remove("warning");

        document.getElementById("editTestDialog_templateButton").style.display = this.testData.isFolder && this.testData.round !== null ? "inline-block" : "none";
        document.getElementById("editTestDialog_refTestButton").style.display = this.testData.referenceState !== null && !currentElement.isTemplate ? "inline-block" : "none";
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

        if(this.isNew) {

            this.templateID = undefined;
            this.realTemplateID = undefined;

        }

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

        if(this.testData.referenceState !== null) {

            if(checkAll || ID === "referenceID") {

                if(currentElement.accessType !== ACCESS_OWNER) {

                    if(this.testData.referenceID != null && this.referenceID === undefined) {

                        this.warnings.referenceID = "Es kann sein, dass Sie die Verknüpfung mit dem aktuell noch referenzierten Element nicht selbst wiederherstellen können, wenn sie sie jetzt auflösen.";

                    } else if(this.testData.referenceID != this.referenceID) {

                        this.warnings.referenceID = "Vergewissern Sie sich, dass auch der Besitzer des Semesters Zugriff auf das neu referenzierte Element haben muss. Ansonsten können Sie nicht erfolgreich speichern.";

                    }

                } else {

                    delete this.warnings.referenceID;

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

            if(currentAdditionalInfo !== undefined && changedProperties.referenceID === undefined) additionalInfo.tests[testData.testID] = currentAdditionalInfo;

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

                additionalInfo.tests = [];
                additionalInfo.semeesters = [];

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

        if(this.templateID !== undefined && this.typeSelect.getState(0)) properties.templateID = this.realTemplateID;
        
        if(this.testData.parentID === null) {
            
            properties.parentID = this.testData.semesterID;
            properties.isSubject = true;

        } else {
            
            properties.parentID = this.testData.parentID;
            properties.isSubject = false;

        }

        if(this.testData.referenceState !== null && properties.referenceID === undefined) {

            properties.referenceID = null;

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

            if(this.testData.isFolder) {

                document.getElementById("editTestDialog_templateButton").style.display = "inline-block";

            }

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

            document.getElementById("editTestDialog_templateButton").style.display = "none";

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

            var contentElement = document.getElementById("permissionsDialog_innerContent");

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

        var contentElement = document.getElementById("permissionsDialog_innerContent");

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

                    permissionsDialog.errors.newName = "Es gibt kein Konto mit diesem Benutzernamen oder es darf nicht ausgewählt werden.";

                } else {

                    permissionsDialog.errors.newName = "Es gibt kein Konto mit diesem Benutzernamen, es gehört keiner Lehrperson oder darf nicht ausgewählt werden.";

                }

            }

            updateErrors(permissionsDialog.errors, document.getElementById("permissionsDialog_errorContainer"), document.getElementById("permissionsDialog_addButton"));

        }, function() {

            document.getElementById("permissionsDialog_newName").classList.add("error");
            permissionsDialog.errors.newName = "Beim Überprüfen des Benutzernamens ist ein Fehler aufgetreten.";

            updateErrors(permissionsDialog.errors, document.getElementById("permissionsDialog_errorContainer"), document.getElementById("permissionsDialog_addButton"));

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


    selectDialog.MODE_SELECTION = 1;
    selectDialog.MODE_PERMISSION_COPY = 2;
    selectDialog.MODE_LOCATION_SELECT = 3;

    selectDialog.ACTION_COPY = 1;
    selectDialog.ACTION_MOVE = 2;
    selectDialog.ACTION_REF = 3;
    selectDialog.ACTION_TEMPLATE = 4;

    selectDialog.SEM_RESTRICTION_NONE = 0;
    selectDialog.SEM_RESTRICTION_SEMESTER_TEMPLATE = 1;
    selectDialog.SEM_RESTRICTION_SUBJECT_TEMPLATE = 2;
    selectDialog.SEM_RESTRICTION_PRIVATE_SEM = 3;
    selectDialog.SEM_RESTRICTION_CLASS_SEM = 4;
    selectDialog.SEM_RESTRICTION_SPECIFIC_CLASS_SEM = 5;
    selectDialog.SEM_RESTRICTION_OWN = 6;

    selectDialog.TEST_RESTRICTION_NONE = 0;
    selectDialog.TEST_RESTRICTION_MARK = 1;
    selectDialog.TEST_RESTRICTION_POINTS = 2;

    selectDialog.openSelection = function(type, semRestriction, testRestriction, classID, notAllowedID, locationType, locationID, isRoot, selectedID, realSelectedID, semesterFolderID) {
        
        this.errors = {};

        this.type = type;
        this.mode = this.MODE_SELECTION;
        this.semRestriction = semRestriction;
        this.testRestriction = testRestriction;
        this.classID = classID;
        this.notAllowedID = notAllowedID;

        this.semesterFolderID = semesterFolderID;

        this.selectedID = selectedID;
        this.realSelectedID = realSelectedID;

        this.currentElement = {};

        var title;

        var deselectButton = document.getElementById("selectDialog_deselectButton");
        var selectFolderButton = document.getElementById("selectDialog_selectFolderButton");
        var OKButton = document.getElementById("selectDialog_OKButton");

        document.getElementById("selectDialog_newName").style.display = "none";

        if(type === TYPE_SEMESTER) {

            if(semRestriction === selectDialog.SEM_RESTRICTION_CLASS_SEM) {

                title = "Lehrpersonen übernehmen aus...";

            } else {

                title = "Vorlage auswählen";

            }

            deselectButton.style.display = "inline-block";
            selectFolderButton.style.display = "none";

        } else if(type === TYPE_TEST) {

            title = "Zu referenzierendes Element wählen";

            deselectButton.style.display = "inline-block";

        } else if(type === TYPE_CLASS) {

            title = "Klasse auswählen";
            deselectButton.style.display = "none";
            selectFolderButton.style.display = "none";

        }

        if(selectedID === undefined) {

            deselectButton.disabled = true;
            deselectButton.innerHTML = "Nichts ausgewählt";

        } else {

            deselectButton.disabled = false;
            deselectButton.innerHTML = "Auswahl aufheben";

        }

        document.getElementById("selectDialog_header").innerHTML = title;

        document.getElementById("selectDialog_errorContainer").style.display = "none";

        OKButton.disabled = false;
        OKButton.innerHTML = "OK";
        OKButton.onclick = this.saveSelection.bind(this);

        this.selectLocation(locationType, locationID, isRoot, true);

        this.show();

    };

    selectDialog.openPermissionCopy = function() {

        this.show();

    };

    selectDialog.openSelectActionLocation = function(type, actionType, notAllowedID, locationType, locationID, isRoot, originalArg, semesterFolderID) {

        this.errors = {};

        this.type = type;
        this.mode = this.MODE_LOCATION_SELECT;
        this.actionType = actionType;
        this.notAllowedID = notAllowedID;

        this.semesterFolderID = semesterFolderID;

        if(typeof(originalArg) === "object") {

            this.originalData = originalArg;

        } else {
            
            if(this.type === TYPE_SEMESTER) {

                var len = currentElement.childrenData.length;
                var found = false;

                for(var i = 0; i < len; i++) {
                    
                    if(currentElement.childrenData[i].semesterID === originalArg) {

                        this.originalData = currentElement.childrenData[i];
                        found = true;
                        break;

                    }

                }
                
                if(!found) return;

            } else if(this.type === TYPE_CLASS) {

                var len = currentElement.childrenData.length;
                var found = false;

                for(var i = 0; i < len; i++) {
                    
                    if(currentElement.childrenData[i].classID === originalArg) {

                        this.originalData = currentElement.childrenData[i];
                        found = true;
                        break;

                    }

                }
                
                if(!found) return;

            }

        }

        this.currentElement = {};

        var OKButton = document.getElementById("selectDialog_OKButton");
        var inputElement = document.getElementById("selectDialog_newName");

        document.getElementById("selectDialog_newName").style.display = "inline-block";

        document.getElementById("selectDialog_deselectButton").style.display = "none";
        document.getElementById("selectDialog_selectFolderButton").style.display = "none";
        document.getElementById("selectDialog_elementTable").style.display = "none";
        document.getElementById("selectDialog_noElements").style.display = "none";

        var buttonText = "";
        var title;
        var titleFragment;

        switch(this.type) {

            case TYPE_SEMESTER:     titleFragment = "Semester/Vorlage"; break;
            case TYPE_TEST:         titleFragment = "Element";          break;
            case TYPE_CLASS:        titleFragment = "Klasse";           break;

        }

        switch(this.actionType) {

            case this.ACTION_COPY:       buttonText = "Hierhin kopieren";       title = titleFragment + " kopieren";    break;
            case this.ACTION_MOVE:       buttonText = "Hierhin verschieben";    title = titleFragment + " verschieben"; break;
            case this.ACTION_REF:        buttonText = "Hier erstellen";         title = "Verknüpfung erstellen";        break;
            case this.ACTION_TEMPLATE:   buttonText = "Hier erstellen";         title = "Vorlage erstellen";            break;

        }

        if(this.type === TYPE_CLASS && this.actionType === this.ACTION_REF) {

            buttonText = "Erstellen";

        }

        document.getElementById("selectDialog_header").innerHTML = title;

        OKButton.disabled = false;
        OKButton.innerHTML = buttonText;
        OKButton.onclick = this.executeAction.bind(this, undefined);

        inputElement.value = this.originalData.name;
        inputElement.classList.remove("error");

        document.getElementById("selectDialog_errorContainer").style.display = "none";

        this.selectLocation(locationType, locationID, isRoot, true);

        this.show();

    };

    selectDialog.showLoadingOrPrint = function() {

        if(this.isLoading) {
    
            Loading.show(this.contentElement, "transparent");
    
        } else {
    
            this.printElement();
    
        }
    
    };
    
    selectDialog.hideLoading = function() {
    
        this.isLoading = false;
    
        if(Loading.isVisible(this.contentElement)) {
    
            Loading.hide(this.contentElement);
            setTimeout(this.printElement.bind(this), 200);
    
        }
    
    };
    
    selectDialog.hideInnerContentAndPrint = function() {
    
        this.isBlocked = true;
    
        document.getElementById("selectDialog_innerContent").style.opacity = "0";
    
        setTimeout(this.showLoadingOrPrint.bind(this), 200);
    
    };
    
    selectDialog.loadingError = function(elementID, errorCode) {
        
        this.hideLoading();

        this.currentElement = {
            error: errorCode,
            type: TYPE_TEST,
            isRoot: true
        };

    };

    selectDialog.printElement = function() {
        
        this.isLoading = false;
        this.isBlocked = false;

        document.getElementById("selectDialog_folderError").style.display = "none";

        var nameElement = document.getElementById("selectDialog_name");

        var parentFolderElement = document.getElementById("selectDialog_parentFolder");
        var noFoldersElement = document.getElementById("selectDialog_noFolders");
        var folderTable = document.getElementById("selectDialog_folderTable");

        var noElementsElement = document.getElementById("selectDialog_noElements");
        var elementTable = document.getElementById("selectDialog_elementTable");

        var selectFolderButton = document.getElementById("selectDialog_selectFolderButton");

        var folderErrorElement = document.getElementById("selectDialog_folderError");
        var errorContainer = document.getElementById("selectDialog_errorContainer");

        if(this.currentElement.error === ERROR_FORBIDDEN) {
            // Kein Zugriff (mehr)

            this.errors.folderError = false;

            folderErrorElement.innerHTML = "Dieses Element existiert nicht (mehr) oder Sie haben keinen Zugriff (mehr) darauf"
            nameElement.innerHTML = "Fehler";

            folderErrorElement.style.display = "block";
            parentFolderElement.style.display = "block";

            folderTable.style.display = "none";
            noFoldersElement.style.display = "none";
            elementTable.style.display = "none";
            noElementsElement.style.display = "none";
            selectFolderButton.style.display = "none";

        } else if(this.currentElement.error !== ERROR_NONE) {
            // Anderer Fehler
            
            showErrorMessage(TEXT_ERROR_OCCURED + "\n\nFehlercode: " + this.currentElement.error, true);

        } else {
            // Kein Fehler

            delete this.errors.folderError;

            // Aufteilung nach Typ des anzuzeigenden Elements, nicht nach Typ des zu selektierenden Elements
            if(this.currentElement.type === TYPE_SEMESTER) {

                var folderTableString = "";
                var elementTableString = "";

                var len = this.currentElement.childrenData.length;
                
                for(var i = 0; i < len; i++) {

                    var currentSemesterData = this.currentElement.childrenData[i];

                    if(!currentSemesterData.isHidden) {

                        if(currentSemesterData.isFolder) {

                            folderTableString +=
                                "<tr onclick='selectDialog.selectLocation(TYPE_SEMESTER, " + currentSemesterData.semesterID + ", false);'>" +
                                    "<td></td>" +
                                    "<td>" + escapeHTML(currentSemesterData.name) + "</td>" +
                                    "<td></td>" +
                                "</tr>";

                        } else {

                            if(this.mode === this.MODE_LOCATION_SELECT) continue;

                            if(this.type === TYPE_SEMESTER && currentSemesterData.semesterID === this.notAllowedID) continue;

                            if(this.semRestriction === this.SEM_RESTRICTION_SEMESTER_TEMPLATE) {

                                if(currentSemesterData.templateType !== "semesterTemplate") continue;

                            } else if(this.semRestriction === this.SEM_RESTRICTION_SUBJECT_TEMPLATE) {

                                if(currentSemesterData.templateType !== "subjectTemplate") continue;

                            } else if(this.semRestriction === this.SEM_RESTRICTION_PRIVATE_SEM) {

                                if((currentSemesterData.classID !== null && currentSemesterData.referenceID === null) || currentSemesterData.templateType !== null) continue;
                                
                            } else if(this.semRestriction === this.SEM_RESTRICTION_CLASS_SEM || this.semRestriction === this.SEM_RESTRICTION_SPECIFIC_CLASS_SEM) {

                                if(currentSemesterData.referenceID !== null) {

                                    if(currentSemesterData.templateType !== null) continue;

                                } else {

                                    if(currentSemesterData.classID === null) continue;

                                    if(this.semRestriction === this.SEM_RESTRICTION_SPECIFIC_CLASS_SEM) {

                                        if(currentSemesterData.classID !== this.classID) continue;
            
                                    }

                                }

                            } else if(this.semRestriction === this.SEM_RESTRICTION_OWN) {

                                if(currentSemesterData.referenceID !== null) continue;

                            }

                            if(this.type === TYPE_SEMESTER) {

                                elementTableString +=
                                    "<tr" + (currentSemesterData.semesterID === this.selectedID ? " class='selected'" : "") + " onclick='selectDialog.selectElement(this, " + currentSemesterData.semesterID + ");'>" +
                                        "<td></td>" +
                                        "<td>" + escapeHTML(currentSemesterData.name) + "</td>" +
                                        "<td><img src='/img/icons/checked.svg' alt='O'></td>" +
                                    "</tr>";

                            } else {

                                elementTableString +=
                                    "<tr onclick='selectDialog.selectLocation(TYPE_TEST, " + (currentSemesterData.referenceID === null ? currentSemesterData.semesterID : currentSemesterData.referenceID) + ", true);'>" +
                                        "<td></td>" +
                                        "<td>" + escapeHTML(currentSemesterData.name) + "</td>" +
                                        "<td></td>" +
                                    "</tr>";

                            }

                        }

                    }

                }

                folderTable.innerHTML = folderTableString;

                if(folderTableString === "") {

                    folderTable.style.display = "none";
                    noFoldersElement.style.display = "block";

                    noFoldersElement.innerHTML = "Keine Ordner vorhanden";

                } else {

                    folderTable.style.display = "table";
                    noFoldersElement.style.display = "none";

                }

                if(this.currentElement.isRoot) {

                    parentFolderElement.style.display = "none";

                } else {

                    parentFolderElement.style.display = "block";

                }

                elementTable.innerHTML = elementTableString;

                if(this.mode === this.MODE_LOCATION_SELECT) {
                    
                    elementTable.style.display = "none";
                    noElementsElement.style.display = "none";

                } else if(elementTableString === "") {

                    elementTable.style.display = "none";
                    noElementsElement.style.display = "block";

                    noElementsElement.innerHTML = "Keine passenden Elemente vorhanden";

                } else {

                    elementTable.style.display = "table";
                    noElementsElement.style.display = "none";

                }

                nameElement.style.display = "block";
                nameElement.innerHTML = this.currentElement.isRoot ? "Hauptordner" : escapeHTML(this.currentElement.data.name);

                if(this.mode === this.MODE_SELECTION) {

                    selectFolderButton.style.display = "none";

                } else if(this.mode === this.MODE_LOCATION_SELECT) {

                    if(this.notAllowedID !== undefined) {

                        document.getElementById("OKButton").disabled = this.currentElement.data.semesterID === this.notAllowedID;

                    }

                }

            } else if(this.currentElement.type === TYPE_TEST) {
                // Funktioniert aktuell nur fuer MODE_SELECTION

                var errorText = "";

                // Ueberpruefung des Typs bei Semester-Verknuepfungen
                if(this.currentElement.referenceID !== null && (
                    this.semRestriction === this.SEM_RESTRICTION_PRIVATE_SEM ||
                    this.semRestriction === this.SEM_RESTRICTION_CLASS_SEM ||
                    this.semRestriction === this.SEM_RESTRICTION_SPECIFIC_CLASS_SEM
                )) {

                    var onlyOneMark = this.currentElement.data.classID === null || this.currentElement.accessType === ACCESS_STUDENT;

                    if(this.semRestriction === this.SEM_RESTRICTION_PRIVATE_SEM && !onlyOneMark) {

                        errorText = "Dies ist ein Klassensemester mit Noten/Punkten von mehreren Schülern. Jedoch können hier nur Elemente mit nur einer Noten bzw. Punktzahl ausgewählt werden.";

                    } else if((this.semRestriction === this.SEM_RESTRICTION_CLASS_SEM || this.semRestriction === this.SEM_RESTRICTION_SPECIFIC_CLASS_SEM) && onlyOneMark) {

                        errorText = "Dies ist kein Semester, bei dem Sie Zugriff auf Noten von mehreren Schülern haben. Jedoch können hier nur Elemente ausgewählt werden, die in einem Klassensemester sind und bei denen Sie Zugriff auf Noten/Punkte von mehreren Schülern haben.";

                    } else if(this.semRestriction === this.SEM_RESTRICTION_SPECIFIC_CLASS_SEM && this.currentElement.data.classID !== this.classID) {

                        errorText = "Dieses Semester gehört zu einer anderen Klassen. Sie können nur Elemente auswählen, die die selbe Klasse haben."

                    }

                }

                if(errorText !== "") {

                    this.errors.folderError = false;

                    folderErrorElement.innerHTML = errorText;

                    folderErrorElement.style.display = "block";

                    folderTable.style.display = "none";
                    noFoldersElement.style.display = "none";
                    elementTable.style.display = "none";
                    noElementsElement.style.display = "none";
                    selectFolderButton.style.display = "none";

                } else {

                    delete this.errors.folderError;

                    var folderTableString = "";
                    var elementTableString = "";

                    var len = this.currentElement.childrenData.length;

                    if(this.testRestriction === this.TEST_RESTRICTION_MARK) {
                        
                        if(this.currentElement.data.formula == null) {

                            for(var i = 0; i < len; i++) {

                                var currentTestData = this.currentElement.childrenData[i];

                                if(!currentTestData.isHidden) {

                                    if(currentTestData.isFolder) {

                                        folderTableString +=
                                            "<tr onclick='selectDialog.selectLocation(TYPE_TEST, " + currentTestData.testID + ", false);'>" +
                                                "<td></td>" +
                                                "<td>" + escapeHTML(currentTestData.name) + "</td>" +
                                                "<td></td>" +
                                            "</tr>";

                                    } else {

                                        if(currentTestData.testID === this.notAllowedID) continue;

                                        elementTableString +=
                                            "<tr" + (currentTestData.testID === this.selectedID ? " class='selected'" : "") + " onclick='selectDialog.selectElement(this, " + currentTestData.testID + ");'>" +
                                                "<td></td>" +
                                                "<td>" + escapeHTML(currentTestData.name) + "</td>" +
                                                "<td><img src='/img/icons/checked.svg' alt='O'></td>" +
                                            "</tr>";

                                    }

                                }

                            }

                            folderTable.innerHTML = folderTableString;

                            if(folderTableString === "") {
            
                                folderTable.style.display = "none";
                                noFoldersElement.style.display = "block";
                                
                                if(this.currentElement.isRoot) {

                                    noFoldersElement.innerHTML = "Keine Fächer vorhanden";

                                } else {

                                    noFoldersElement.innerHTML = "Keine Ordner vorhanden";

                                }
            
                            } else {
            
                                folderTable.style.display = "table";
                                noFoldersElement.style.display = "none";
            
                            }
            
                            elementTable.innerHTML = elementTableString;
            
                            if(elementTableString === "") {
            
                                elementTable.style.display = "none";
                                noElementsElement.style.display = "block";
            
                                noElementsElement.innerHTML = "Keine passenden Elemente vorhanden";
            
                            } else {
            
                                elementTable.style.display = "table";
                                noElementsElement.style.display = "none";
            
                            }

                        } else {

                            folderTable.innerHTML = "";

                            folderTable.style.display = "none";
                            noFoldersElement.style.display = "block";
            
                            noFoldersElement.innerHTML = "Elemente ab dieser Ebene enthalten nur noch Punkte.";
            
                            elementTable.innerHTML = "";
                            elementTable.style.display = "none";
                            noElementsElement.style.display = "none";

                        }

                        if(this.currentElement.isRoot || this.currentElement.data.testID === this.notAllowedID) {

                            selectFolderButton.style.display = "none";

                        } else {

                            selectFolderButton.style.display = "inline-block";

                            if(this.currentElement.data.testID === this.selectedID) {

                                selectFolderButton.disabled = true;
                                selectFolderButton.innerHTML = "Ordner ausgewählt";

                            } else {

                                selectFolderButton.disabled = false;
                                selectFolderButton.innerHTML = "Diesen Ordner auswählen";

                            }

                        }

                    } else {

                        var allHavePoints = this.currentElement.data.formula != null || this.currentElement.data.round === null;
                        
                        for(var i = 0; i < len; i++) {

                            var currentTestData = this.currentElement.childrenData[i];

                            if(!currentTestData.isHidden) {

                                if(currentTestData.isFolder) {

                                    folderTableString +=
                                        "<tr onclick='selectDialog.selectLocation(TYPE_TEST, " + currentTestData.testID + ", false);'>" +
                                            "<td></td>" +
                                            "<td>" + escapeHTML(currentTestData.name) + "</td>" +
                                            "<td></td>" +
                                        "</tr>";

                                } else {

                                    if(currentTestData.testID === this.notAllowedID) continue;

                                    if(allHavePoints || currentTestData.formula !== null) {

                                        elementTableString +=
                                            "<tr" + (currentTestData.testID === this.selectedID ? " class='selected'" : "") + " onclick='selectDialog.selectElement(this, " + currentTestData.testID + ");'>" +
                                                "<td></td>" +
                                                "<td>" + escapeHTML(currentTestData.name) + "</td>" +
                                                "<td><img src='/img/icons/checked.svg' alt='O'></td>" +
                                            "</tr>";

                                    }

                                }

                            }

                        }

                        folderTable.innerHTML = folderTableString;

                        if(folderTableString === "") {

                            folderTable.style.display = "none";
                            noFoldersElement.style.display = "block";

                            if(this.currentElement.isRoot) {

                                noFoldersElement.innerHTML = "Keine Fächer vorhanden";

                            } else {

                                noFoldersElement.innerHTML = "Keine Ordner vorhanden";

                            }

                        } else {

                            folderTable.style.display = "table";
                            noFoldersElement.style.display = "none";

                        }

                        elementTable.innerHTML = elementTableString;

                        if(elementTableString === "") {

                            elementTable.style.display = "none";
                            noElementsElement.style.display = "block";

                            noElementsElement.innerHTML = "Keine passenden Elemente vorhanden";

                        } else {

                            elementTable.style.display = "table";
                            noElementsElement.style.display = "none";

                        }

                        if(allHavePoints && this.currentElement.data.testID !== this.notAllowedID) {

                            selectFolderButton.style.display = "inline-block";

                            if(this.currentElement.data.testID === this.selectedID) {

                                selectFolderButton.disabled = true;
                                selectFolderButton.innerHTML = "Ordner ausgewählt";

                            } else {

                                selectFolderButton.disabled = false;
                                selectFolderButton.innerHTML = "Diesen Ordner auswählen";

                            }

                        } else {

                            selectFolderButton.style.display = "none";

                        }

                    }

                    folderErrorElement.style.display = "none";

                }

                parentFolderElement.style.display = "block";
                nameElement.style.display = "block";
                nameElement.innerHTML = escapeHTML(this.currentElement.data.name);

            } else if(this.currentElement.type === TYPE_CLASS) {

                parentFolderElement.style.display = "none";
                noFoldersElement.style.display = "none";
                folderTable.style.display = "none";

                if(this.mode === this.MODE_SELECTION) {

                    var elementTableString = "";

                    var len = this.currentElement.childrenData.length;
                    
                    for(var i = 0; i < len; i++) {

                        var currentClassData = this.currentElement.childrenData[i];

                        if(!currentClassData.isHidden) {

                            elementTableString +=
                                "<tr" + (currentClassData.classID === this.selectedID ? " class='selected'" : "") + " onclick='selectDialog.selectElement(this, " + currentClassData.classID + ");'>" +
                                    "<td></td>" +
                                    "<td>" + escapeHTML(currentClassData.name) + "</td>" +
                                    "<td><img src='/img/icons/checked.svg' alt='O'></td>" +
                                "</tr>";

                        }

                    }

                    elementTable.innerHTML = elementTableString;

                    if(elementTableString === "") {

                        elementTable.style.display = "none";
                        noElementsElement.style.display = "block";
                        noElementsElement.innerHTML = "Keine Klasse vorhanden";

                    } else {

                        elementTable.style.display = "table";
                        noElementsElement.style.display = "none";

                    }

                } else {

                    elementTable.style.display = "none";
                    noElementsElement.style.display = "none"; 

                }

                nameElement.style.display = "none";

            }

        }

        
        Loading.hide(this.contentElement);

        this.resize();

        document.getElementById("selectDialog_innerContent").style.opacity = "1";

    };

    selectDialog.selectLocation = function(elementType, elementID, isRoot, isFirst) {
        
        if(this.isBlocked) return;

        if(elementType === TYPE_SEMESTER) {
            // Semesterauswahl

            if(elementID == undefined) {
                // Hauptordner
    
                if (!cache.rootSemesters) {
                    
                    this.navigationRequest = loadData("/phpScripts/get/getSemesters.php", {}, function (data) {
                        
                        selectDialog.currentElement = data;
                        cache.rootSemesters = data;
    
                        selectDialog.hideLoading();
    
                    }, this.loadingError.bind(this, elementID));
    
                    this.isLoading = true;
    
                } else {
    
                    this.currentElement = cache.rootSemesters;
    
                    this.isLoading = false;
    
                }
    
            } else {
                // Im Semesterordner
            
                if (!cache.semesters[elementID]) {
                    
                    this.navigationRequest = loadData("/phpScripts/get/getSemesters.php", { semesterID: elementID }, function (data) {
                        
                        selectDialog.currentElement = data;
                        cache.semesters[elementID] = data;

                        selectDialog.hideLoading();

                    }, this.loadingError.bind(this, elementID));

                    this.isLoading = true;

                } else {

                    this.currentElement = cache.semesters[elementID];

                    this.isLoading = false;

                }

            }

        } else if(elementType === TYPE_TEST) {
            // Im Semester

            if(isRoot) {
                
                if(this.currentElement.type === TYPE_SEMESTER) {
                    
                    this.semesterFolderID = this.currentElement.data ? this.currentElement.data.semesterID : undefined;

                }

                if (!cache.semesters[elementID]) {
                
                    this.navigationRequest = loadData("/phpScripts/get/getTests.php", { semesterID: elementID }, function (data) {
                        
                        selectDialog.currentElement = data;
                        cache.semesters[elementID] = data;
    
                        selectDialog.hideLoading();
    
                    }, this.loadingError.bind(this, elementID));
    
                    this.isLoading = true;
    
                } else {
    
                    this.currentElement = cache.semesters[elementID];
    
                    this.isLoading = false;
    
                }

            } else {

                if (!cache.tests[elementID]) {
                
                    this.navigationRequest = loadData("/phpScripts/get/getTests.php", { testID: elementID }, function (data) {
                        
                        selectDialog.currentElement = data;
                        cache.tests[elementID] = data;
    
                        selectDialog.hideLoading();
    
                    }, this.loadingError.bind(this, elementID));
    
                    this.isLoading = true;
    
                } else {
    
                    this.currentElement = cache.tests[elementID];
    
                    this.isLoading = false;
    
                }

            }

        } else {

            if (!cache.rootClasses) {
                
                this.navigationRequest = loadData("/phpScripts/get/getClasses.php", {}, function (data) {
                    
                    selectDialog.currentElement = data;
                    cache.rootClasses = data;

                    selectDialog.hideLoading();

                }, this.loadingError.bind(this, elementID));

                this.isLoading = true;

            } else {

                this.currentElement = cache.rootClasses;

                this.isLoading = false;

            }

        }

        if(isFirst) {

            this.isBlocked = true;
            this.showLoadingOrPrint();

        } else {

            this.hideInnerContentAndPrint();

        }

    };

    selectDialog.returnFolder = function() {

        if(this.isBlocked) return;

        if(this.currentElement.type === TYPE_SEMESTER) {

            if(this.currentElement.data.parentID === null) {

                this.selectLocation(TYPE_SEMESTER, undefined, true);

            } else {

                this.selectLocation(TYPE_SEMESTER, this.currentElement.data.parentID, false);

            }

        } else if(this.currentElement.type === TYPE_TEST) {

            if(this.currentElement.isRoot) {

                this.selectLocation(TYPE_SEMESTER, this.semesterFolderID, true);

            } else if(this.currentElement.data.parentID === null) {

                this.selectLocation(TYPE_TEST, this.currentElement.data.semesterID, true);

            } else {

                this.selectLocation(TYPE_TEST, this.currentElement.data.parentID, false);

            }

        }

    };

    selectDialog.selectElement = function(rowElement, selectedID) {

        if(this.isBlocked) return;

        if(this.selectedID === selectedID) return;

        if(this.selectedID === undefined) {

            document.getElementById("selectDialog_deselectButton").disabled = false;
            document.getElementById("selectDialog_deselectButton").innerHTML = "Auswahl aufheben";

        }

        this.selectedID = selectedID;
        this.realSelectedID = selectedID;

        var mustCheck = false;

        var rowIMG = rowElement.getElementsByTagName("img")[0];

        if(this.selectionCheckRequest) {

            this.selectionCheckRequest.abort();
            this.selectionCheckRequest = undefined;

        }

        if(this.type === TYPE_SEMESTER || this.type === TYPE_CLASS) {

            var len = this.currentElement.childrenData.length;
            var currentChildData;

            if(this.type === TYPE_SEMESTER) {

                for(var i = 0; i < len; i++) {

                    if(this.currentElement.childrenData[i].semesterID === selectedID) {

                        currentChildData = this.currentElement.childrenData[i];
                        break;

                    }
        
                }

                if(currentChildData.referenceID !== null) {
                    // Ueberpruefung nach richtigem Typ noetig

                    this.realSelectedID = currentChildData.referenceID;
                    mustCheck = true;
    
                    if(!cache.semesters[currentChildData.referenceID]) {

                        this.selectionCheckRequest = loadData("/phpScripts/get/getTests.php", { semesterID: currentChildData.referenceID }, function(data) {
                            
                            cache.semesters[currentChildData.referenceID] = data;

                            rowIMG.src = "/img/icons/checked.svg";

                            selectDialog.checkSelection(true, data);
                            
                        }, function(errorCode) {

                            rowIMG.src = "/img/icons/checked.svg";
                            
                            if(errorCode === ERROR_FORBIDDEN) {

                                selectDialog.checkSelection(false);

                            } else {

                                showErrorMessage(TEXT_ERROR_OCCURED + "\n\nFehlercode: " + errorCode, true);

                            }

                        });

                    } else {

                        this.checkSelection(true, cache.semesters[currentChildData.referenceID]);

                    }
    
                }

            } else {

                for(var i = 0; i < len; i++) {

                    if(this.currentElement.childrenData[i].classID === selectedID) {

                        currentChildData = this.currentElement.childrenData[i];
                        break;

                    }
        
                }

                if(currentChildData.referenceID !== null) {
                    // Ueberpruefung nach richtigem Typ noetig

                    this.realSelectedID = currentChildData.referenceID;
                    mustCheck = true;
    
                    if(!cache.classes[currentChildData.referenceID]) {

                        this.selectionCheckRequest = loadData("/phpScripts/get/getStudents.php", { classID: currentChildData.referenceID }, function(data) {
                            
                            cache.classes[currentChildData.referenceID] = data;

                            rowIMG.src = "/img/icons/checked.svg";

                            selectDialog.checkSelection(true, data);
                            
                        }, function(errorCode) {

                            rowIMG.src = "/img/icons/checked.svg";
                            
                            if(errorCode === ERROR_FORBIDDEN) {

                                selectDialog.checkSelection(false);

                            } else {

                                showErrorMessage(TEXT_ERROR_OCCURED + "\n\nFehlercode: " + errorCode, true);

                            }

                        });

                    } else {

                        this.checkSelection(true, cache.semesters[currentChildData.referenceID]);

                    }
    
                }

            }

        }

        var rows = rowElement.parentElement.children;

        for(var i = 0; i < rows.length; i++) {

            if(rows[i] !== rowElement) {

                rows[i].classList.remove("selected");

            }

        }

        rowElement.classList.add("selected");

        if(mustCheck) {

            if(this.selectionCheckRequest !== undefined) {

                rowIMG.src = "/img/icons/loading_black.svg";

                if(this.mode === this.MODE_SELECTION) {
                    
                    document.getElementById("selectDialog_OKButton").disabled = true;

                } else {

                    

                }

            } else {

                rowIMG.src = "/img/icons/checked.svg";

            }

        } else {

            delete this.errors.elementError;
            this.updateErrors();

        }

    };

    selectDialog.selectCurrentFolder = function() {

        if(this.isBlocked) return;

        if(this.selectedID === undefined) {

            document.getElementById("selectDialog_deselectButton").disabled = false;
            document.getElementById("selectDialog_deselectButton").innerHTML = "Auswahl aufheben";

        }

        if(this.currentElement.type === TYPE_SEMESTER) {

            this.selectedID = this.currentElement.data.semesterID;

        } else {

            this.selectedID = this.currentElement.data.testID;

        }

        this.realSelectedID = this.selectedID;

        if(this.selectionCheckRequest) {

            this.selectionCheckRequest.abort();
            this.selectionCheckRequest = undefined;

        }

        delete this.errors.elementError;

        var rows = document.getElementById("selectDialog_elementTable").getElementsByTagName("tr");

        for(var i = 0; i < rows.length; i++) {

            rows[i].classList.remove("selected");

        }

        document.getElementById("selectDialog_selectFolderButton").disabled = true;
        document.getElementById("selectDialog_selectFolderButton").innerHTML = "Ordner ausgewählt";

        this.updateErrors();

    };

    selectDialog.deselect = function() {

        if(this.isBlocked) return;

        this.selectedID = undefined;
        this.realSelectedID = undefined;

        if(this.selectionCheckRequest) {

            this.selectionCheckRequest.abort();
            this.selectionCheckRequest = undefined;

        }

        delete this.errors.elementError;

        var rows = document.getElementById("selectDialog_elementTable").getElementsByTagName("tr");

        for(var i = 0; i < rows.length; i++) {

            rows[i].classList.remove("selected");

        }

        document.getElementById("selectDialog_deselectButton").disabled = true;
        document.getElementById("selectDialog_deselectButton").innerHTML = "Nichts ausgewählt";

        document.getElementById("selectDialog_selectFolderButton").disabled = false;
        document.getElementById("selectDialog_selectFolderButton").innerHTML = "Diesen Ordner auswählen";

        this.updateErrors();

    };

    selectDialog.checkName = function() {

        var inputElement = document.getElementById("selectDialog_newName");
        var newName = inputElement.value;

        if(newName.trim() === "") {

            this.errors.name = "Der Name muss angegeben werden.";
            inputElement.classList.add("error");

        } else if(newName.length >= MAX_LENGTH_NAME) {

            this.errors.name = "Der Name muss weniger als " + MAX_LENGTH_NAME + " Zeichen lang sein.";
            inputElement.classList.add("error");

        } else {

            delete this.errors.name;
            inputElement.classList.remove("error");

        }

        this.updateErrors();

    };

    selectDialog.checkSelection = function(noAccessError, data) {

        if(noAccessError) {

            delete this.errors.elementError;

        } else {

            this.errors.elementError = "Das referenzierte Element der ausgewählten Verknüpfung ist nicht (mehr) vorhanden oder Sie haben darauf keinen Zugriff (mehr).";

        }

        this.updateErrors();

    };

    selectDialog.updateErrors = function() {

        var errorString = "";
        var hasError = false;

        var OKButton = document.getElementById("selectDialog_OKButton");
        var errorContainer = document.getElementById("selectDialog_errorContainer");

        if(this.mode === this.MODE_SELECTION) {

            if(this.errors.elementError !== undefined) {

                errorString += "<p class='blankLine_small'>" + this.errors.elementError + "</p>";
                OKButton.disabled = true;

            } else {

                OKButton.disabled = false;

            }
 
        } else if(this.mode === this.MODE_LOCATION_SELECT) {

            if(this.errors.name !== undefined) {

                errorString += "<p class='blankLine_small'>" + this.errors.name + "</p>";
                OKButton.disabled = true;

            } else {

                OKButton.disabled = false;

            }

        }

        if(errorString === "") {

            errorContainer.style.display = "none";

        } else {

            errorContainer.innerHTML = errorString;
            errorContainer.style.display = "inline-block";

        }

        this.resize();

    }

    selectDialog.close = function() {

        this.navigationRequest = undefined;

        this.currentElement = undefined;

        document.getElementById("selectDialog_innerContent").style.opacity = "0";
        this.hide();

    };

    selectDialog.save = function() {

        if(this.mode === selectDialog.MODE_SELECTION) {

            this.saveSelection();

        } else if(this.mode === selectDialog.MODE_LOCATION_SELECT) {

            this.executeAction(undefined);

        }

    }

    selectDialog.saveSelection = function() {

        this.selectionCheckRequest = undefined;

        if(this.type === TYPE_CLASS) {
            
            editSemesterDialog.classID = this.selectedID;
            editSemesterDialog.realClassID = this.realSelectedID;

            editSemesterDialog.check("class");

        } else if(this.type === TYPE_SEMESTER) {

            if(this.semRestriction === this.SEM_RESTRICTION_SEMESTER_TEMPLATE) {

                editSemesterDialog.templateID = this.selectedID;
                editSemesterDialog.realTemplateID = this.realSelectedID;
            
            } else {
                
                editTestDialog.templateID = this.selectedID;
                editTestDialog.realTemplateID = this.realSelectedID;

            }

        } else {

            editTestDialog.referenceID = this.selectedID;

            editTestDialog.check("referenceID");

        }

        this.close();

    };

    selectDialog.copyPermissions = function() {

        this.close();

    };

    selectDialog.executeAction = function(newName) {

        if(newName === undefined) {

            newName = document.getElementById("selectDialog_newName").value;

            var len = this.currentElement.childrenData.length;

            for(var i = 0; i < len; i++) {

                if(newName === this.currentElement.childrenData[i].name) {

                    var buttons = [
                        {
                            name: "Namen trotzdem beibehalten",
                            color: "positive",
                            action: this.executeAction.bind(this, newName)
                        }
                    ];
                
                    new Alert({
                        title: "Name bereits benutzt",
                        icon: "warning",
                        type: "options",
                        description: "Es existiert bereits ein Element mit gleichem Namen.\nDen Namen trotzdem beibehalten?",
                        buttons: buttons,
                        hasCancelButton: true
                
                    });

                    return;

                }

            }

        }

        if(this.actionType === this.ACTION_REF) {

            if(this.type === TYPE_SEMESTER) {

                var properties = {
                    isFolder: false,
                    parentID: this.currentElement.isRoot ? null : this.currentElement.data.semesterID,
                    templateType: this.originalData.templateType,
                    name: newName,
                    referenceID: this.originalData.semesterID
                }

                loadData("/phpScripts/create/createSemester.php", properties, function(result) {

                    properties.semesterID = result.newID;

                    if(properties.parentID === null) {

                        cache.rootSemesters.childrenData.push(properties);

                    } else {

                        cache.semesters[properties.parentID].childrenData.push(properties);

                    }

                    hidePanelsAndPrint();

                }, function(errorCode) {
            
                    showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);
        
                });

                properties.isFolder = 0;
                properties.classID = null;
                properties.isHidden = 0;
                properties.notes = null;
                properties.referenceTestID = null;
                properties.deleteTimestamp = null;

                Loading.show(null, "semi-transparent");

            } else if(this.type === TYPE_CLASS) {

                var properties = {
                    name: newName,
                    referenceID: this.originalData.classID
                }

                loadData("/phpScripts/create/createClass.php", properties, function(result) {

                    properties.classID = result.newID;

                    cache.rootClasses.childrenData.push(properties);

                    hidePanelsAndPrint();

                }, function(errorCode) {
            
                    showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);
        
                });

                properties.isHidden = 0;
                properties.notes = null;
                properties.deleteTimestamp = null;

                Loading.show(null, "semi-transparent");

            }

        }

        this.close();

    };

    deleteDialog.loadAndOpen = function() {

        if(isBlocked) return;

        var headerText = "Gelöschte Elemente";
        var noElementsText = "Es gibt keine (provisorisch) gelöschten Elemente";

        var requestURL;
        var requestObj;

        if(currentElement.type === TYPE_CLASS && currentElement.isRoot) {

            this.type = TYPE_CLASS;

            headerText = "Gelöschte Klassen";
            noElementsText = "Es gibt keine (provisorisch) gelöschten Klassen";

            requestURL = "/phpScripts/restore/getDeletedClasses.php";
            requestObj = {};

        } else if(currentElement.type === TYPE_CLASS) {

            this.type = TYPE_STUDENT;

            headerText = "Gelöschte Schüler/innen";
            noElementsText = "Es gibt keine (provisorisch) gelöschten Schüler/innen";

            requestURL = "/phpScripts/restore/getDeletedStudents.php";
            requestObj = { classID: currentElement.data.classID };

        } else if(currentElement.type === TYPE_TEST) {

            this.type = TYPE_TEST;

            requestURL = "/phpScripts/restore/getDeletedTests.php";

            if(currentElement.isRoot) {

                requestObj = { semesterID: currentElement.data.semesterID };

            } else {

                requestObj = { testID: currentElement.data.testID };

            }

        } else {

            this.type = TYPE_SEMESTER;

            requestURL = "/phpScripts/restore/getDeletedSemesters.php";

            if(currentElement.isRoot) {

                requestObj = {};

            } else {

                requestObj = { semesterID: currentElement.data.semesterID };

            }

        }

        loadData(requestURL, requestObj, function(result) {

            Loading.hide();
            deleteDialog.open(result.result);

        }, function(errorCode) {

            showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);

        });

        document.getElementById("deleteDialog_header").innerHTML = headerText;
        document.getElementById("deleteDialog_noElements").innerHTML = noElementsText;

        Loading.show(null, "semi-transparent");

    }

    deleteDialog.open = function(data) {

        this.tempDeleteCount = data.length;

        var tableString = "";

        if(this.type === TYPE_STUDENT) {

            for(var i = 0; i < this.tempDeleteCount; i++) {

                tableString += 
                    "<tr>" +
                        "<td>" + escapeHTML(data[i].firstName) + " " + escapeHTML(data[i].lastName) + "</td>" +
                        "<td>" +
                            "<button class='button_square positive' onclick='deleteDialog.restore(" + data[i].ID + ", this)'><img src='/img/icons/restore.svg'></button>" +
                            "<button class='button_square negative' onclick='deleteDialog.deleteFinally(" + data[i].ID + ", this, true)'><img src='/img/icons/delete.svg'></button>" +
                        "</td>" +
                    "</tr>";

            }

        } else {

            for(var i = 0; i < this.tempDeleteCount; i++) {

                tableString += 
                    "<tr>" +
                        "<td>" + escapeHTML(data[i].name) + "</td>" +
                        "<td>" +
                            "<button class='button_square positive' onclick='deleteDialog.restore(" + data[i].ID + ", this)'><img src='/img/icons/restore.svg'></button>" +
                            "<button class='button_square negative' onclick='deleteDialog.deleteFinally(" + data[i].ID + ", this, true)'><img src='/img/icons/delete.svg'></button>" +
                        "</td>" +
                    "</tr>";

            }

        }

        if(tableString === "") {

            document.getElementById("deleteDialog_table").style.display = "none";
            document.getElementById("deleteDialog_noElements").style.display = "block";

        } else {

            document.getElementById("deleteDialog_table").innerHTML = tableString;

            document.getElementById("deleteDialog_table").style.display = "table";
            document.getElementById("deleteDialog_noElements").style.display = "none";

        }

        this.show();

    }

    deleteDialog.restore = function(ID, element) {

        if(this.type === TYPE_TEST) {

            var URLFragment = "restoreTest.php";

        } else if(this.type === TYPE_SEMESTER) {

            var URLFragment = "restoreSemester.php";

        } else if(this.type === TYPE_CLASS) {

            var URLFragment = "restoreClass.php";

        } else {

            var URLFragment = "restoreStudent.php";

        }

        loadData("/phpScripts/restore/" + URLFragment, [ ID ], function() {

            var elementToDelete = element.parentElement.parentElement;
            elementToDelete.parentElement.removeChild(elementToDelete);

            deleteDialog.tempDeleteCount--;

            if(deleteDialog.tempDeleteCount <= 0) {

                document.getElementById("deleteDialog_table").style.display = "none";
                document.getElementById("deleteDialog_noElements").style.display = "block";

            }

            cache.semesters = [];
            cache.tests = [];
            cache.rootSemesters = undefined;

            additionalInfo.semesters = [];
            additionalInfo.tests = [];

            if(deleteDialog.type === TYPE_CLASS) {

                cache.rootClasses = undefined;

            } else if(deleteDialog.type === TYPE_STUDENT) {

                delete cache.classes[currentElement.data.classID];

            }

            loadElementAndPrint();

            Loading.hide(deleteDialog.dialogElement);

        }, function(errorCode) {

            showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);

        });

        Loading.show(deleteDialog.dialogElement);

    };

    deleteDialog.deleteFinally = function(ID, element, confirm) {

        if(confirm) {

            new Alert({
                type: "confirm",
                icon: "warning",
                title: "Endgültig löschen?",
                description: "Sind Sie sich sicher, dass sie dies unwiderruflich löschen möchten?",
                OKAction: this.deleteFinally.bind(this, ID, element, false)
            });

            return;

        }

        if(this.type === TYPE_TEST) {

            var URLFragment = "deleteFinallyTest.php";

        } else if(this.type === TYPE_SEMESTER) {

            var URLFragment = "deleteFinallySemester.php";

        } else if(this.type === TYPE_CLASS) {

            var URLFragment = "deleteFinallyClass.php";

        } else {

            var URLFragment = "deleteFinallyStudent.php";

        }

        loadData("/phpScripts/deleteFinally/" + URLFragment, [ ID ], function() {

            var elementToDelete = element.parentElement.parentElement;
            elementToDelete.parentElement.removeChild(elementToDelete);

            deleteDialog.tempDeleteCount--;

            if(deleteDialog.tempDeleteCount <= 0) {

                document.getElementById("deleteDialog_table").style.display = "none";
                document.getElementById("deleteDialog_noElements").style.display = "block";

            }

            Loading.hide(deleteDialog.dialogElement);

        }, function(errorCode) {

            showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);

        });

        Loading.show(deleteDialog.dialogElement);

    };

    document.getElementById("editTestDialog_refTestButton").addEventListener("click", function() { 
        
        var semRestriction;
        var classID;
        var testRestriction;

        var referenceID = editTestDialog.referenceID || undefined;

        if(currentElement.data.classID === null) {

            semRestriction = selectDialog.SEM_RESTRICTION_PRIVATE_SEM;
            classID = undefined;

        } else {

            semRestriction = selectDialog.SEM_RESTRICTION_SPECIFIC_CLASS_SEM;
            classID = currentElement.data.classID;

        }

        var withFormula =
            editTestDialog.testData.round !== null && (
                (editTestDialog.isNew && editTestDialog.typeSelect.getState(1)) ||
                (!editTestDialog.isNew && editTestDialog.testData.formula !== null)
            );

        if(withFormula || editTestDialog.testData.round === null) {

            testRestriction = selectDialog.TEST_RESTRICTION_POINTS;

        } else {

            testRestriction = selectDialog.TEST_RESTRICTION_MARK;

        }

        selectDialog.openSelection(TYPE_TEST, semRestriction, testRestriction, classID, editTestDialog.testData.testID, TYPE_SEMESTER, undefined, true, referenceID, referenceID);

    });

    document.getElementById("semesterInfoDialog_closeButton")       .addEventListener("click", semesterInfoDialog.close.bind(semesterInfoDialog));
    document.getElementById("semesterInfoDialog_loadMoreButton")    .addEventListener("click", semesterInfoDialog.loadMore.bind(semesterInfoDialog));
    document.getElementById("semesterInfoDialog_visibilityButton")  .addEventListener("click", function() { changeVisibility(TYPE_SEMESTER, semesterInfoDialog.semesterData.semesterID); });
    document.getElementById("semesterInfoDialog_deleteButton")      .addEventListener("click", function() { deleteElement(TYPE_SEMESTER, semesterInfoDialog.semesterData.semesterID, semesterInfoDialog.semesterData.classID > 0, semesterInfoDialog.semesterData.isFolder); });

    document.getElementById("testInfoDialog_closeButton")           .addEventListener("click", testInfoDialog.close.bind(testInfoDialog));
    document.getElementById("testInfoDialog_loadMoreButton")        .addEventListener("click", testInfoDialog.loadMore.bind(testInfoDialog));
    document.getElementById("testInfoDialog_visibilityButton")      .addEventListener("click", function() { changeVisibility(TYPE_TEST, testInfoDialog.testData.testID); });
    document.getElementById("testInfoDialog_deleteButton")          .addEventListener("click", function() { deleteElement(TYPE_TEST, testInfoDialog.testData.testID); });


    editSemesterDialog.templateTypeSelect = new ButtonSelect(document.getElementById("editSemesterDialog_templateType"));
    editSemesterDialog.semesterTypeSelect = new ButtonSelect(document.getElementById("editSemesterDialog_semesterType"), editSemesterDialog.updateSemesterType.bind(editSemesterDialog));

    document.getElementById("editSemesterDialog_with_notes")        .addEventListener("change", editSemesterDialog.updateCheckbox.bind(editSemesterDialog, "notes"));
    document.getElementById("editSemesterDialog_name")              .addEventListener("input",  editSemesterDialog.check.bind(editSemesterDialog, "name"));
    document.getElementById("editSemesterDialog_notes")             .addEventListener("input",  editSemesterDialog.check.bind(editSemesterDialog, "notes"));
    document.getElementById("editSemesterDialog_permissionsButton") .addEventListener("click",  permissionsDialog.open.bind(permissionsDialog, TYPE_SEMESTER));
    document.getElementById("editSemesterDialog_cancelButton")      .addEventListener("click",  editSemesterDialog.close.bind(editSemesterDialog));
    document.getElementById("editSemesterDialog_OKButton")          .addEventListener("click",  editSemesterDialog.save.bind(editSemesterDialog));
    document.getElementById("editSemesterDialog_classButton")       .addEventListener("click", function() { selectDialog.openSelection(TYPE_CLASS, undefined, undefined, undefined, undefined, TYPE_CLASS, undefined, true, editSemesterDialog.classID, editSemesterDialog.realClassID); });
    document.getElementById("editSemesterDialog_templateButton")    .addEventListener("click", function() { selectDialog.openSelection(TYPE_SEMESTER, selectDialog.SEM_RESTRICTION_SEMESTER_TEMPLATE, undefined, undefined, undefined, TYPE_SEMESTER, undefined, true, editSemesterDialog.templateID, editSemesterDialog.realTemplateID); });

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
    document.getElementById("editTestDialog_templateButton")    .addEventListener("click", function() { selectDialog.openSelection(TYPE_SEMESTER, selectDialog.SEM_RESTRICTION_SUBJECT_TEMPLATE, undefined, undefined, undefined, TYPE_SEMESTER, undefined, true, editTestDialog.templateID, editTestDialog.realTemplateID); });

    document.getElementById("permissionsDialog_cancelButton")   .addEventListener("click",  permissionsDialog.close.bind(permissionsDialog));
    document.getElementById("permissionsDialog_addButton")      .addEventListener("click",  permissionsDialog.addPermission.bind(permissionsDialog));
    document.getElementById("permissionsDialog_OKButton")       .addEventListener("click",  permissionsDialog.save.bind(permissionsDialog));
    document.getElementById("permissionsDialog_newName")        .addEventListener("input",  permissionsDialog.newNameInput.bind(permissionsDialog));
    document.getElementById("permissionsDialog_newName")        .addEventListener("change", permissionsDialog.newNameChange.bind(permissionsDialog));


    document.getElementById("selectDialog_newName")             .addEventListener("input",  selectDialog.checkName.bind(selectDialog));
    document.getElementById("selectDialog_parentFolder")        .addEventListener("click",  selectDialog.returnFolder.bind(selectDialog));
    document.getElementById("selectDialog_deselectButton")      .addEventListener("click",  selectDialog.deselect.bind(selectDialog));
    document.getElementById("selectDialog_selectFolderButton")  .addEventListener("click",  selectDialog.selectCurrentFolder.bind(selectDialog));
    document.getElementById("selectDialog_cancelButton")        .addEventListener("click",  selectDialog.close.bind(selectDialog));


    document.getElementById("deleteDialog_cancelButton")      .addEventListener("click",  deleteDialog.hide.bind(deleteDialog));


    document.getElementById("semesters_addSemesterButton")  .addEventListener("click", editSemesterDialog.openAdd.bind(editSemesterDialog, false, false));
    document.getElementById("semesters_addTemplateButton")  .addEventListener("click", editSemesterDialog.openAdd.bind(editSemesterDialog, false, true));
    document.getElementById("semesters_addFolderButton")    .addEventListener("click", editSemesterDialog.openAdd.bind(editSemesterDialog, true,  false));

    document.getElementById("semesters_editButton")         .addEventListener("click", editSemesterDialog.openEdit.bind(editSemesterDialog, undefined));
    document.getElementById("semesters_deletedButton")      .addEventListener("click", deleteDialog.loadAndOpen.bind(deleteDialog));

    document.getElementById("tests_addSubjectButton")   .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, true,    false));
    document.getElementById("tests_addRootTestButton")  .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, false,   false));
    document.getElementById("tests_addRootRefButton")   .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, false,   true));
    document.getElementById("tests_addTestButton")      .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, false,   false));
    document.getElementById("tests_addFolderButton")    .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, true,    false));
    document.getElementById("tests_addRefButton")       .addEventListener("click", editTestDialog.openAdd.bind(editTestDialog, false,   true));

    document.getElementById("tests_semesterInfoButton") .addEventListener("click", semesterInfoDialog.open.bind(semesterInfoDialog));
    document.getElementById("tests_elementInfoButton")  .addEventListener("click", testInfoDialog.open.bind(testInfoDialog));
    
    document.getElementById("tests_editSemesterButton") .addEventListener("click", editSemesterDialog.openEdit.bind(editSemesterDialog, undefined));
    document.getElementById("tests_editElementButton")  .addEventListener("click", editTestDialog.openEdit.bind(editTestDialog, undefined));

    document.getElementById("tests_deleteElementButton").addEventListener("click", function() { deleteElement(TYPE_TEST, currentElement.data.testID)} );

    document.getElementById("tests_deletedButton")      .addEventListener("click", deleteDialog.loadAndOpen.bind(deleteDialog));

    document.getElementById("semesters_infoButton")     .addEventListener("click", semesterInfoDialog.open.bind(semesterInfoDialog));

    document.getElementById("tests_testInfo_loadMoreButton")    .addEventListener("click", loadMoreTestInfo);
    document.getElementById("tests_testInfo_visibilityButton")  .addEventListener("click", function() { changeVisibility(TYPE_TEST, currentElement.data.testID); });

    document.getElementById("semesters_visibilityButton")       .addEventListener("click", function() { changeHiddenVisibility(this, "semesters"); });
    document.getElementById("tests_visibilityButton")           .addEventListener("click", function() { changeHiddenVisibility(this, "tests"); });
    document.getElementById("foreignSemesters_visibilityButton").addEventListener("click", function() { changeHiddenVisibility(this, "foreignSemesters"); });

    loadElementAndPrint();

});

