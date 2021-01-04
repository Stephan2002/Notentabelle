// Javascript fuer verschiedene Webseiten, das gewisse Konstanten und Funktionen enthaelt

const ERROR_NONE                  = 0;     // kein Fehler
const ERROR_NOT_LOGGED_IN         = 1;     // Nutzer ist nicht eingeloggt
const ERROR_BAD_INPUT             = 2;     // Schlechter User-Input
const ERROR_UNSUITABLE_INPUT      = 3;     // Unpassender (fehlerhafter), aber richtig angegebener User-Input
const ERROR_MISSING_INPUT         = 4;     // Fehlender User-Input
const ERROR_FORBIDDEN_FIELD       = 5;     // User-Input, der angegeben, aber (in jenem Fall) nicht unterstuetzt wird
const ERROR_FORBIDDEN             = 6;     // Element existiert nicht oder Nutzer hat kein Zugriffsrecht
const ERROR_ONLY_TEACHER          = 7;     // Aktion nur fuer Lehrpersonen verfuegbar
const ERROR_NO_WRITING_PERMISSION = 8;     // Benutzer hat nur Leserecht
const ERROR_NOT_DELETED           = 9;     // Das Element ist nicht (provisorisch) geloescht
const ERROR_UNKNOWN               = 10;    // Unbekannter / anderer Fehler

const INFO_NO_CHANGE              = 11;    // Keine Veraenderungen vorgenommen

const MAX_LENGTH_NAME = 64;
const MAX_LENGTH_NOTES = 256;


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

// Funktion zum Laden von Elementen vom Server sowie fuer andere Anfragen an den Server
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


// Funktion zum Aktualisieren von Fehlermeldungen
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

    if(button instanceof HTMLButtonElement || button instanceof HTMLInputElement) {

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

// Funktion, die meist die Fehler beim Laden im Hintergrund durch Javascript anzeigt.
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