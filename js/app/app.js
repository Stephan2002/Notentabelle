// Javascript fuer app.php
// Wird immer hinzugefuegt, auch bei Lehrpersonen

const ERROR_NONE =        0;     // kein Fehler
const ERROR_NOTLOGGEDIN = 1;     // Nutzer ist nicht eingeloggt
const ERROR_BADINPUT =    2;     // Schlechter oder fehlender User-Input
const ERROR_FORBIDDEN =   3;     // Element existiert nicht oder Nutzer hat kein Zugriffsrecht
const ERROR_ONLYTEACHER = 4;     // Aktion nur fuer Lehrpersonen verfuegbar
const ERROR_UNKNOWN =     10;    // Unbekannter / anderer Fehler

const TYPE_SEMESTER = 0;
const TYPE_TEST = 1;
const TYPE_CLASS = 2;
const TYPE_STUDENT = 3;
const TYPE_FOREIGN_SEMESTERS = 4;
const TYPE_FOREIGN_CLASSES = 5;
const TYPE_PUBLIC_TEMPLATES = 6;

const ACCESS_UNDEFINED = -1;
const ACCESS_OWNER = 0;
const ACCESS_SHARED = 1;
const ACCESS_TEACHER = 2;
const ACCESS_STUDENT = 3;
const ACCESS_PUBLIC = 4;

var path = {};

var cachedSemesters = [];
var cachedTests = [];

function loadData(url, data, success, error) {

    var dataString = data === undefined ? "" : JSON.stringify(data);

    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", url);
    xhttp.responseType = "json";
    
    xhttp.onload = function() {
        
        if(this.status == 200) {

            if(this.response.error === 0) {

                success(this.response);

            } else {

                error(this.response.error);

            }

        } else {

            error(this.status);

        }

    };

    xhttp.onerror = function() { error(); };

    xhttp.send(dataString);

}

document.addEventListener("DOMContentLoaded", function() {



});