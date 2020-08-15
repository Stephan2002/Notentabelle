// Javascript fuer app.php
// Wird immer hinzugefuegt, auch bei Lehrpersonen

const ERROR_NONE = 0;    // kein Fehler
const ERROR_NOT_LOGGED_IN = 1;    // Nutzer ist nicht eingeloggt
const ERROR_BAD_INPUT = 2;    // Schlechter oder fehlender User-Input
const ERROR_FORBIDDEN = 3;    // Element existiert nicht oder Nutzer hat kein Zugriffsrecht
const ERROR_ONLY_TEACHER = 4;    // Aktion nur fuer Lehrpersonen verfuegbar
const ERROR_UNKNOWN = 10;    // Unbekannter / anderer Fehler

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
    rootSemesters: undefined,
    rootTemplates: undefined,
    publishedTemplates: undefined

};

var showHidden = {

    semesters: false,
    tests: false,
    students: false,
    classes: false

};

var currentElement;

// Maskiert die speziellen HTML-Zeichen
function escapeHTML(text) {

    if (text == null) {

        return undefined;

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
        var folderString = "";

        for (var i = 0; i < currentElement.childrenData.length; i++) {

            var currentChildData = currentElement.childrenData[i];

            if(!showHidden.semesters && currentChildData.isHidden) {

                continue;

            }

            var currentString =
                "<tr onclick='select(" + (currentChildData.isFolder ? TYPE_SEMESTER : TYPE_TEST) + ", " + currentChildData.semesterID + ", " + !currentChildData.isFolder + ", " + currentChildData.isFolder + ")'>" +
                    "<td class='table_name'>" + escapeHTML(currentChildData.name) + "</td>" +
                    "<td class='table_buttons'>" +
                        "<button class='button_square negative table_big'><img src='/img/delete.svg' alt='X'></button>" +
                        "<button class='button_square positive table_big'><img src='/img/edit.svg' alt='.'></button>" +
                        "<button class='button_square neutral'><img src='/img/info.svg' alt='i'></button>" +
                    "</td>" +
                "</tr>";

            if (currentChildData.isFolder) {

                folderString += currentString;

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

        if (folderString === "") {

            document.getElementById("semesters_folders").style.display = "none";

        } else {

            document.getElementById("semesters_folders").style.display = "initial";
            document.getElementById("semesters_folders_tableBody").innerHTML = folderString;

        }

        if (semesterString === "" && folderString === "") {

            if (currentElement.isTemplate) {

                document.getElementById("semesters_empty_templates").style.display = "inline-block";
                document.getElementById("semesters_empty_semesters").style.display = "none";

            } else {

                document.getElementById("semesters_empty_templates").style.display = "none";
                document.getElementById("semesters_empty_semesters").style.display = "inline-block";

            }

        } else {

            document.getElementById("semesters_empty_templates").style.display = "none";
            document.getElementById("semesters_empty_semesters").style.display = "none";

        }

        if (currentElement.isTemplate) {

            document.getElementById("semesters_linkButtons").style.display = "none";
            document.getElementById("semesters_templateButtons").style.display = "initial";
            document.getElementById("semesters_button_newSemester").innerHTML = "Neue Vorlage";

        } else {

            document.getElementById("semesters_linkButtons").style.display = "initial";
            document.getElementById("semesters_templateButtons").style.display = "none";
            document.getElementById("semesters_button_newSemester").innerHTML = "Neues Semester";

        }

        if (currentElement.isRoot) {

            document.getElementById("semesters_editButtons").style.display = "none";

            if (currentElement.isTemplate) {

                document.getElementById("title").innerHTML = "Vorlagen";
                document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - Vorlagen";

            } else {

                document.getElementById("title").innerHTML = "Semester";
                document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - Semester";

                document.getElementById("returnButton").style.display = "none";

            }

        } else {

            document.getElementById("semesters_editButtons").style.display = "block";
            document.getElementById("title").innerHTML = escapeHTML(currentElement.data.name);
            document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - " + escapeHTML(currentElement.data.name);

        }

        panelName = "semesters_div";

    } else if (currentElement.type === TYPE_TEST) {
        // Im Semester

        panelName = "tests_div";

        document.getElementById("averageFooter_points").style.display = "none";
        document.getElementById("averageFooter_average").style.display = "none";
        document.getElementById("averageFooter_points_big").style.display = "none";
        document.getElementById("averageFooter_mark_big").style.display = "none";

        if(currentElement.isRoot) {

            document.getElementById("tests_addFolderButtons").style.display = "none";
            document.getElementById("tests_empty_folders_templateButton").style.display = "none";
            document.getElementById("tests_empty_folders_instruction").style.display = "none";

            document.getElementById("tests_testButtons").style.display = "none";
            document.getElementById("tests_folderButtons").style.display = "none";
            document.getElementById("tests_semesterButtons").style.display = "block";
            document.getElementById("tests_showHiddenTests").style.display = "inline-block";

            if(currentElement.writingPermission) {

                document.getElementById("tests_addSubjectButtons").style.display = "block";
                document.getElementById("tests_deletedButton").style.display = "inline-block";

                document.getElementById("tests_empty_subjects_templateButton").style.display = "inline-block";
                document.getElementById("tests_empty_subjects_instruction").style.display = "block";

            } else {

                document.getElementById("tests_addSubjectButtons").style.display = "none";
                document.getElementById("tests_deletedButton").style.display = "none";

                document.getElementById("tests_empty_subjects_templateButton").style.display = "none";
                document.getElementById("tests_empty_subjects_instruction").style.display = "none";

            }

            if(currentElement.accessType === ACCESS_TEACHER) {

                document.getElementById("averageFooter_plusPoints_big").style.display = "none";

                document.getElementById("averageFooter_plusPoints_big").innerHTML = "";
                

            } else {

                document.getElementById("averageFooter_plusPoints_big").style.display = "block";
                document.getElementById("averageFooter_average").style.display = "block";

                document.getElementById("averageFooter_plusPoints_big").innerHTML = "Hochpunkte: " + formatNumber(currentElement.data.plusPoints, "-");
                document.getElementById("averageFooter_average").innerHTML = "Schnitt: " + formatNumber(currentElement.data.mark_unrounded, "-");
                

            }

            if(currentElement.accessType === ACCESS_OWNER) {

                document.getElementById("tests_editSemesterButtons").style.display = "block";

            } else {

                document.getElementById("tests_editSemesterButtons").style.display = "none";

            }

        } else {

            document.getElementById("tests_addSubjectButtons").style.display = "none";
            document.getElementById("tests_empty_subjects_templateButton").style.display = "none";
            document.getElementById("tests_empty_subjects_instruction").style.display = "none";

            if(currentElement.writingPermission && currentElement.isFolder) {

                document.getElementById("tests_addFolderButtons").style.display = "block";
                document.getElementById("tests_empty_folders_templateButton").style.display = "inline-block";
                document.getElementById("tests_empty_folders_instruction").style.display = "block";

            } else {

                document.getElementById("tests_addFolderButtons").style.display = "none";
                document.getElementById("tests_empty_folders_templateButton").style.display = "none";
                document.getElementById("tests_empty_folders_instruction").style.display = "none";

            }

            document.getElementById("tests_semesterButtons").style.display = "none";
            document.getElementById("averageFooter_plusPoints_big").style.display = "none";

            if(currentElement.isFolder) {

                document.getElementById("tests_testButtons").style.display = "none";
                document.getElementById("tests_folderButtons").style.display = "block";
                document.getElementById("tests_showHiddenTests").style.display = "inline-block";

                if(currentElement.writingPermission && currentElement.accessType !== ACCESS_TEACHER) {

                    document.getElementById("tests_editFolderButtons").style.display = "block";
                    document.getElementById("tests_deletedButton").style.display = "inline-block";

                } else {

                    document.getElementById("tests_editFolderButtons").style.display = "none";
                    document.getElementById("tests_deletedButton").style.display = "none";

                }

            } else {

                document.getElementById("tests_testButtons").style.display = "block";
                document.getElementById("tests_folderButtons").style.display = "none";
                document.getElementById("tests_deletedButton").style.display = "none";
                document.getElementById("tests_table").style.display = "none";
                document.getElementById("tests_showHiddenTests").style.display = "none";

                if(currentElement.writingPermission && currentElement.accessType !== ACCESS_TEACHER) {

                    document.getElementById("tests_editTestButtons").style.display = "block";

                } else {

                    document.getElementById("tests_editTestButtons").style.display = "none";

                }

            }

            

            // Noten einfuellen

            if(currentElement.data.formula !== null) {

                document.getElementById("averageFooter_points").style.display = "block";
                document.getElementById("averageFooter_mark_big").style.display = "block";

                document.getElementById("averageFooter_points").innerHTML = "Punkte: " + formatNumber(currentElement.data.points, "-");
                document.getElementById("averageFooter_mark_big").innerHTML = "Note: " + formatNumber(currentElement.data.mark, "-");

            } else if(currentElement.data.round === null) {

                document.getElementById("averageFooter_points_big").style.display = "block";

                document.getElementById("averageFooter_points_big").innerHTML = "Punkte: " + formatNumber(currentElement.data.points, "-");

            } else if(currentElement.data.round == 0 || (currentElement.data.classID !== null && currentElement.accessType !== ACCESS_STUDENT)) {

                document.getElementById("averageFooter_mark_big").style.display = "block";

                document.getElementById("averageFooter_mark_big").innerHTML = "Note: " + formatNumber(currentElement.data.mark, "-");


            } else {

                document.getElementById("averageFooter_average").style.display = "block";
                document.getElementById("averageFooter_mark_big").style.display = "block";

                document.getElementById("averageFooter_average").innerHTML = "Schnitt: " + formatNumber(currentElement.data.mark_unrounded, "-");
                document.getElementById("averageFooter_mark_big").innerHTML = "Note: " + formatNumber(currentElement.data.mark, "-");


            }

        }

        if(currentElement.isFolder || currentElement.isRoot) {

            // Tabelle mit Tests fuellen

            var tableString = "";

            if(currentElement.writingPermission) {

                var buttonString = 
                    "<td class='table_buttons'>" +
                        "<button class='button_square negative table_big'><img src='/img/delete.svg' alt='X'></button>" +
                        "<button class='button_square positive table_big'><img src='/img/edit.svg' alt='.'></button>" +
                        "<button class='button_square neutral'><img src='/img/info.svg' alt='i'></button>" +
                    "</td>";

            } else {

                var buttonString = 
                    "<td class='table_buttons noWritingPermission'>" +
                        "<button class='button_square neutral'><img src='/img/info.svg' alt='i'></button>" +
                    "</td>";

            }

            var pointsUsed = false;
            var unroundedMarkUsed = false;
            
            if(currentElement.data.round != null || currentElement.isRoot) {

                document.getElementById("tests_table_mark").innerHTML = "Note";

            } else {

                document.getElementById("tests_table_mark").innerHTML = "<span class='table_big'>Punkte</span><span class='table_small'>Pkte.</span>";

            }

            for(var i = 0; i < currentElement.childrenData.length; i++) {

                var currentChildData = currentElement.childrenData[i];

                if(!showHidden.tests && currentChildData.isHidden) {

                    continue;
    
                }

                tableString +=
                    "<tr onclick='select(TYPE_TEST, " + currentChildData.testID + ", false, " + currentChildData.isFolder + ")'>" +
                        "<td class='table_name'>" + escapeHTML(currentChildData.name) + "</td>" +
                        "<td>" + formatDate(currentChildData.date) + "</td>" +
                        "<td>" + formatNumber(currentChildData.weight) + "</td>" +
                        "<td>" + (currentChildData.points != null ? formatNumber(currentChildData.points) : "") + "</td>" +
                        "<td>" + ((currentChildData.round != null && currentChildData.round != 0 && currentChildData.formula == null) ? (currentChildData.mark_unrounded != null ? formatNumber(currentChildData.mark_unrounded) : "") : "") + "</td>" +
                        "<td class='table_mark'>" + (currentChildData.round != null ? (currentChildData.mark != null ? formatNumber(currentChildData.mark) : "") : (currentChildData.points != null ? formatNumber(currentChildData.points) : "")) + "</td>" +
                        "<td></td>" +
                        buttonString +
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

            document.getElementById("tests_tableBody").innerHTML = tableString;

            if(tableString === "") {

                if(currentElement.isRoot) {

                    document.getElementById("tests_empty_subjects").style.display = "block";
                    document.getElementById("tests_empty_folders").style.display = "none";

                } else {

                    document.getElementById("tests_empty_subjects").style.display = "none";
                    document.getElementById("tests_empty_folders").style.display = "block";

                }

                document.getElementById("tests_table").style.display = "none";

            } else {

                document.getElementById("tests_empty_subjects").style.display = "none";
                document.getElementById("tests_empty_folders").style.display = "none";
                document.getElementById("tests_table").style.display = "table";

            }

        } else {

            document.getElementById("tests_empty_subjects").style.display = "none";
            document.getElementById("tests_empty_folders").style.display = "none";

        }

        if(currentElement.data.classID !== null && currentElement.accessType !== ACCESS_STUDENT) {

            document.getElementById("tests_testInfo_div").style.display = "none";
            document.getElementById("tests_calculatorButton").style.display = "none";

            if(currentElement.isRoot) {

                document.getElementById("tests_editStudentButton").style.display = "none";

                if(currentElement.accessType === ACCESS_TEACHER) {

                    document.getElementById("tests_studentTable").style.display = "none";
                    document.getElementById("tests_markPaperButton").style.display = "none";
                    document.getElementById("tests_studentButtons").style.display = "none";

                } else {

                    // Schuelertabelle fuellen
                    document.getElementById("tests_studentTable").style.display = "table";
                    document.getElementById("tests_studentButtons").style.display = "block";

                    if(tableString !== "") {

                        document.getElementById("tests_markPaperButton").style.display = "inline-block";

                    } else {

                        document.getElementById("tests_markPaperButton").style.display = "none";
    
                    }

                }

            } else {

                document.getElementById("tests_studentButtons").style.display = "block";

                if(currentElement.isFolder) {

                    document.getElementById("tests_editStudentButton").style.display = "none";

                } else {

                    document.getElementById("tests_testInfoButton").style.display = "inline-block";
                    document.getElementById("tests_editStudentButton").style.display = "inline-block";

                }

                if(tableString !== "") {

                    document.getElementById("tests_markPaperButton").style.display = "inline-block";

                } else {

                    document.getElementById("tests_markPaperButton").style.display = "none";

                }

                // Schuelertabelle fuellen
                document.getElementById("tests_studentTable").style.display = "table";

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
                
            } else {

                if(currentElement.isFolder) {

                    document.getElementById("tests_testInfo_div").style.display = "none";
                    
                    if(tableString !== "") {
                    
                        document.getElementById("tests_calculatorButton").style.display = "inline-block";

                    } else {

                        document.getElementById("tests_calculatorButton").style.display = "none";
    
                    }

                } else {

                    document.getElementById("tests_calculatorButton").style.display = "none";
                    document.getElementById("tests_testInfoButton").style.display = "none";
                    
                    // Testinformationen einfuellen
                    document.getElementById("tests_testInfo_div").style.display = "block";

                }

            }

        }

        document.getElementById("semesters_editButtons").style.display = "block";
        document.getElementById("title").innerHTML = escapeHTML(currentElement.data.name);
        document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - " + escapeHTML(currentElement.data.name);

    } else if (currentElement.type === TYPE_SEMESTER && currentElement.isForeign) {
        // Fremde Semester

        panelName = "foreignSemesters_div";

    } else if (currentElement.type === TYPE_PUBLIC_TEMPLATES && currentElement.isForeign) {
        // Oeffenliche Vorlagen

        panelName = "publicTemplates_div";

    } else if (currentElement.type === TYPE_PUBLIC_TEMPLATES) {
        // Eigene veroeffentlichte Vorlagen

        panelName = "publishedTemplates_div";

    } else if (user.isTeacher && currentElement.type === TYPE_CLASS && currentElement.isRoot && !currentElement.isForeign) {
        // Klassenauswahl

        panelName = "classes_div";

    } else if (user.isTeacher && currentElement.type === TYPE_CLASS && currentElement.isRoot && currentElement.isForeign) {
        // Fremde Klassen

        panelName = "foreignClasses_div";

    } else if (user.isTeacher && currentElement.type === TYPE_CLASS && !currentElement.isRoot) {
        // In Klasse

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

    var type = path[path.length - 1].type;
    var ID = path[path.length - 1].ID;
    var isRoot = path[path.length - 1].isRoot;
    var isForeign = path[path.length - 1].isForeign;
    var isFolder = path[path.length - 1].isFolder;

    if (type === TYPE_SEMESTER && isRoot && !isForeign) {
        // Vorlagenauswahl

        if (!cache.rootTemplates) {

            loadData("/phpScripts/get/getSemesters.php", { isTemplate: true }, function (data) {

                currentElement = data;
                cache.rootTemplates = data;

                hideLoading();

            }, loadingError);

            isLoading = true;

        } else {

            currentElement = cache.rootTemplates;

            isLoading = false;

        }

    } else if (type === TYPE_SEMESTER && !isForeign) {
        // Semester
        
        if (!cache.semesters[ID]) {
            
            loadData("/phpScripts/get/getSemesters.php", { semesterID: ID }, function (data) {
                
                currentElement = data;
                cache.semesters[ID] = data;

                hideLoading();

            }, loadingError);

            isLoading = true;

        } else {

            currentElement = cache.semesters[ID];

            isLoading = false;

        }

    } else if (type === TYPE_TEST) {
        // Im Semester

        if(isRoot) {

            if (!cache.semesters[ID]) {
            
                loadData("/phpScripts/get/getTests.php", { semesterID: ID, withMarks: true }, function (data) {
                    
                    currentElement = data;
                    cache.semesters[ID] = data;
    
                    hideLoading();
    
                }, loadingError);
    
                isLoading = true;
    
            } else {
    
                currentElement = cache.semesters[ID];
    
                isLoading = false;
    
            }

        } else {

            if(isFolder) {

                var url = "/phpScripts/get/getTests.php";

            } else {

                var url = "/phpScripts/get/getTest.php";

            }

            if (!cache.tests[ID]) {
                
                loadData(url, { testID: ID, withMarks: true }, function (data) {
                    
                    currentElement = data;
                    cache.tests[ID] = data;
    
                    hideLoading();
    
                }, loadingError);
    
                isLoading = true;
    
            } else {
    
                currentElement = cache.tests[ID];
    
                isLoading = false;
    
            }

        }


    } else if (type === TYPE_SEMESTER && isForeign) {
        // Fremde Semester



    } else if (type === TYPE_PUBLIC_TEMPLATES && isForeign) {
        // Oeffenliche Vorlagen

        if (!publishInstalled) {

            loadPublish();
            Loading.show(null, "semi-transparent");
            return;

        }

    } else if (type === TYPE_PUBLIC_TEMPLATES) {
        // Eigene veroeffentlichte Vorlagen

        if (!publishInstalled) {

            loadPublish();
            Loading.show(null, "semi-transparent");
            return;

        }

    } else if (user.isTeacher && type === TYPE_CLASS && isRoot && !isForeign) {
        // Klassenauswahl



    } else if (user.isTeacher && type === TYPE_CLASS && isRoot && isForeign) {
        // Fremde Klassen



    } else if (user.isTeacher && type === TYPE_CLASS) {
        // In Klasse


    }

    hidePanelsAndPrint();


}

// Wird aufgerufen, wenn ein Element ausgewaehlt wurde
function select(elementType, elementID, isRoot = false, isFolder = true, isForeign = false) {

    if(isBlocked) {

        return;

    }

    path.push({ type: elementType, ID: elementID, isRoot: isRoot, isFolder: isFolder, isForeign: isForeign });

    localStorage.setItem("path", JSON.stringify(path));

    loadElementAndPrint();

}

function returnFolder() {

    if(isBlocked) {

        return;

    }

    path.pop();
    localStorage.setItem("path", JSON.stringify(path));
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

    //loadData("/phpScripts/get/getSemesters.php", {}, function(data) {currentElement = data; printElement();});

    loadElementAndPrint();

});

