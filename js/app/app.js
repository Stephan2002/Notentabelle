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

var path = [];

var cache = {

    semesters: [],
    tests: [],
    rootSemesters: undefined,
    rootTemplates: undefined,
    publishedTemplates: undefined

}

var currentElement;

// Maskiert die speziellen HTML-Zeichen
function escapeHTML(text) {

    if (text === undefined) {

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

function hidePanels() {

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

    var elements = document.body.children;

    for (var i = 0; i < elements.length; i++) {

        if (elements[i].classList.contains("panel")) {

            elements[i].style.display = "none";

        }

    }

    Loading.hide();

    var panelName = "";

    if(currentElement.error !== 0) {
        
        if (currentElement.error === ERROR_FORBIDDEN) {

            document.getElementById("error_other").style.display = "none";
            document.getElementById("error_forbidden").style.display = "initial";
    
        } else {
    
            document.getElementById("error_other").style.display = "initial";
            document.getElementById("error_forbidden").style.display = "none";
    
        }

        document.getElementById("returnButton").style.display = "block";
        document.getElementById("title").innerHTML = "Fehler";
        document.getElementsByTagName("TITLE")[0].innerHTML = "Notentabelle - Fehler";

        panelName = "error_div";
        
    } else if (currentElement.type === TYPE_SEMESTER && ((currentElement.isRoot && !currentElement.isForeign) || currentElement.data.isFolder)) {
        // Semesterauswahl / Vorlagenauswahl

        var semesterString = "";
        var folderString = "";

        for (var i = 0; i < currentElement.childrenData.length; i++) {

            var currentChildData = currentElement.childrenData[i];

            var currentString =
                "<tr onclick='select(TYPE_SEMESTER, " + currentChildData.semesterID + ")'>" +
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

        document.getElementById("returnButton").style.display = "block";

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

    } else if (currentElement.type === TYPE_TEST || (currentElement.type === TYPE_SEMESTER && !currentElement.data.isFolder)) {
        // Im Semester

        panelName = "tests_div";

    } else if (currentElement.type === TYPE_SEMESTER && currentElement.isForeign) {
        // Fremde Semester

        panelName = "foreignSemesters_div";

    } else if (currentElement.type === TYPE_PUBLIC_TEMPLATES && currentElement.isForeign) {
        // Oeffenliche Vorlagen

        if (!publishInstalled) {

            loadPublish();
            return;

        }

        panelName = "publicTemplates_div";

    } else if (currentElement.type === TYPE_PUBLIC_TEMPLATES) {
        // Eigene veroeffentlichte Vorlagen

        if (!publishInstalled) {

            loadPublish();
            return;

        }

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

// Ueberprueft, ob das aktuelle Element schon im "Cache" ist und laedt es ansonsten
function getElement() {

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

        hidePanels();

        return;

    }

    var type = path[path.length - 1].type;
    var ID = path[path.length - 1].ID;
    var isRoot = path[path.length - 1].isRoot;
    var isForeign = path[path.length - 1].isForeign;

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

        hidePanels();

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

        hidePanels();


    } else if (type === TYPE_TEST) {
        // Im Semester



    } else if (type === TYPE_SEMESTER && isForeign) {
        // Fremde Semester



    } else if (type === TYPE_PUBLIC_TEMPLATES && isForeign) {
        // Oeffenliche Vorlagen



    } else if (type === TYPE_PUBLIC_TEMPLATES) {
        // Eigene veroeffentlichte Vorlagen



    } else if (user.isTeacher && type === TYPE_CLASS && isRoot && !isForeign) {
        // Klassenauswahl



    } else if (user.isTeacher && type === TYPE_CLASS && isRoot && isForeign) {
        // Fremde Klassen



    } else if (user.isTeacher && type === TYPE_CLASS) {
        // In Klasse


    }


}

// Wird aufgerufen, wenn ein Element ausgewaehlt wurde
function select(elementType, elementID) {

    path.push({ type: elementType, ID: elementID, isRoot: false, isForeign: false });

    localStorage.setItem("path", JSON.stringify(path));

    getElement();

}

function loadPublish() {

    var scriptElement = document.createElement("script");
    scriptElement.language = "javascript";
    scriptElement.type = "text/javascript";
    scriptElement.onload = printElement;
    scriptElement.src = "/js/app/appPublish.js";

    document.getElementsByTagName("head")[0].appendChild(scriptElement);

}

// Wird aufgerufen, wenn DOM-Baum vollstaendig geladen
document.addEventListener("DOMContentLoaded", function () {

    if (typeof (localStorage) !== undefined && localStorage.getItem("path") !== null) {

        path = JSON.parse(localStorage.getItem("path"));

    }

    document.getElementById("returnButton").onclick = function () { path.pop(); localStorage.setItem("path", JSON.stringify(path)); getElement(); }
    document.getElementById("error_returnButton").onclick = function () { path.pop(); localStorage.setItem("path", JSON.stringify(path)); getElement(); }

    //loadData("/phpScripts/get/getSemesters.php", {}, function(data) {currentElement = data; printElement();});

    getElement();

});

