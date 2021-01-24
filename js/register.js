// Javascript für register.php

var typeSelect;

var errors = {};
var needsNameCheck = false;

var nameCheckRequest;
var nameCheckTimeoutID;

const REGEX_USER_NAME = /^[a-z\d\.\-_]{5,}$/i;

function check(ID, printAll = true, callErrorUpdate = true) {
    
    if(ID === undefined) {

        var checkAll = true;

    } else {

        var checkAll = false;

    }

    if(checkAll || ID === "userName") {

        var element = document.getElementById("userName");
        var userName = element.value;

        if(userName.trim() === "") {

            errors.userName = printAll ? "Es muss ein Benutzername gewählt werden." : false;

            if(printAll) {

                element.classList.add("error");

            }

            needsNameCheck = false;

        } else if(userName.length < 5) {

            errors.userName = "Der Benutzername muss mindestens 5 Zeichen lang sein.";
            element.classList.add("error");
            needsNameCheck = false;

        } else if(userName.length >= MAX_LENGTH_NAME) {

            errors.userName = "Der Benutzername muss weniger als " + MAX_LENGTH_NAME + " Zeichen lang sein.";
            element.classList.add("error");
            needsNameCheck = false;

        } else if(!REGEX_USER_NAME.test(userName)) {

            errors.userName = "Der Benutzername darf nur alphanumerische Zeichen oder \"-\", \"_\" und \".\" enthalten.";
            element.classList.add("error");
            needsNameCheck = false;

        } else if(!checkAll) {

            errors.userName = false;

            needsNameCheck = true;

        }

    }

    if(checkAll || ID === "firstName") {

        var element = document.getElementById("firstName");

        if(element.value.length >= MAX_LENGTH_NAME) {

            errors.firstName = "Der Vorname muss weniger als " + MAX_LENGTH_NAME + " Zeichen lang sein.";
            element.classList.add("error");

        } else {

            delete errors.firstName;
            element.classList.remove("error");

        }

    }

    if(checkAll || ID === "lastName") {

        var element = document.getElementById("lastName");

        if(element.value.length >= MAX_LENGTH_NAME) {

            errors.lastName = "Der Nachname muss weniger als " + MAX_LENGTH_NAME + " Zeichen lang sein.";
            element.classList.add("error");

        } else {

            delete errors.lastName;
            element.classList.remove("error");

        }

    }

    if(checkAll || ID === "school") {

        var element = document.getElementById("school");

        if(element.value.length >= MAX_LENGTH_NAME) {

            errors.school = "Der Name der Schule muss leider weniger als " + MAX_LENGTH_NAME + " Zeichen lang sein.";
            element.classList.add("error");

        } else {

            delete errors.school;
            element.classList.remove("error");

        }

    }

    if(checkAll || ID === "eMail") {

        var element = document.getElementById("eMail");

        if(!element.checkValidity()) {

            errors.eMail = "Es wurde eine fehlerhafte E-Mail-Adresse angegeben.";
            element.classList.add("error");

        } else if(element.value.trim() === "") {

            errors.eMail = printAll ? "Die Angabe der E-Mail-Adresse ist notwendig." : false;

            if(printAll) {

                element.classList.add("error");

            }

        } else if(element.value.length >= MAX_LENGTH_NAME) {

            errors.eMail = "Die E-Mail-Adresse muss leider weniger als " + MAX_LENGTH_NAME + " Zeichen lang sein.";
            element.classList.add("error");

        } else {

            delete errors.eMail;
            element.classList.remove("error");

        }

    }

    if(checkAll || ID === "password" || ID === "repeatPassword") {

        var element = document.getElementById("password");
        var repeatElement = document.getElementById("repeatPassword");

        if(element.value === "") {

            errors.password = printAll ? "Es muss ein Passwort angegeben werden." : false;

            if(printAll) {

                element.classList.add("error");

            }

            repeatElement.classList.remove("error");

        } else if(element.value.length < 8) {

            errors.password = "Das Passwort muss mindestens acht Zeichen lang sein.";
            element.classList.add("error");
            repeatElement.classList.remove("error");

        } else {

            element.classList.remove("error");

            if(element.value !== repeatElement.value) {

                if(repeatElement.value === "") {

                    printError = printAll && (checkAll || ID === "repeatPassword");

                    errors.password = printError ? "Das Passwort muss wiederholt werden." : false;

                    if(printError) {

                        repeatElement.classList.add("error");

                    }

                } else {

                    errors.password = "Die beiden Passwörter sind nicht gleich";
                    repeatElement.classList.add("error");

                }

            } else {

                delete errors.password;
                repeatElement.classList.remove("error");

            }

        }

    }

    if(checkAll || ID === "terms") {

        if(document.getElementById("terms").checked) {

            delete errors.terms;

        } else {

            errors.terms = printAll ? "Die AGB müssen akzeptiert werden, damit Sie Notentabelle nutzen können." : false;

        }

    }

    if(callErrorUpdate) {

        return updateErrors(errors, document.getElementById("errorContainer"), document.getElementById("OKButton"), true);

    }

}



function userNameChange() {
    
    if(nameCheckTimeoutID !== undefined) {

        clearTimeout(nameCheckTimeoutID);
        nameCheckTimeoutID = undefined;

    }

    if(needsNameCheck) {
        
        checkUserNameExistance();

    }

}

function userNameInput() {
    
    if(nameCheckRequest !== undefined) {

        nameCheckRequest.abort();
        nameCheckRequest = undefined;

    }

    if(nameCheckTimeoutID !== undefined) {

        clearTimeout(nameCheckTimeoutID);
        nameCheckTimeoutID = undefined;

    }

    check("userName");

    if(needsNameCheck) {
        
        nameCheckTimeoutID = setTimeout(checkUserNameExistance, 1000);

    }

}

function checkUserNameExistance() {

    needsNameCheck = false;

    var requestObj = { userName: document.getElementById("userName").value, includeDemo: true };

    nameCheckRequest = loadData("/phpScripts/checkUserName", requestObj, function(data) {

        if(data.result) {

            document.getElementById("userName").classList.add("error");
            errors.userName = "Dieser Benutzername ist leider schon besetzt.";

        } else {

            document.getElementById("userName").classList.remove("error");
            delete errors.userName;

        }

        updateErrors(errors, document.getElementById("errorContainer"), document.getElementById("OKButton"), true);

    }, function() {

        document.getElementById("userName").classList.add("error");
        errors.userName = "Beim Überprüfen des Benutzernamens ist ein Fehler aufgetreten.";

        updateErrors(errors, document.getElementById("errorContainer"), document.getElementById("OKButton"), true);

    });

}

function updateType(index) {

    document.getElementById("isTeacher").checked = index === 1;

}

function register(event) {

    if(!check()) {

        event.preventDefault();

    }

}



document.addEventListener("DOMContentLoaded", function() {

    typeSelect = new ButtonSelect(document.getElementById("typeSelect"), updateType);

    document.getElementById("userName").addEventListener("change", userNameChange);
    document.getElementById("userName").addEventListener("input", userNameInput);

    document.getElementById("firstName")        .addEventListener("input", check.bind(this, "firstName"));
    document.getElementById("lastName")         .addEventListener("input", check.bind(this, "lastName"));
    document.getElementById("school")           .addEventListener("input", check.bind(this, "school"));
    document.getElementById("eMail")            .addEventListener("input", check.bind(this, "eMail"));
    document.getElementById("password")         .addEventListener("input", check.bind(this, "password"));
    document.getElementById("repeatPassword")   .addEventListener("input", check.bind(this, "repeatPassword"));

    document.getElementById("terms").addEventListener("change", check.bind(this, "terms"));

    document.getElementById("OKButton") .addEventListener("click", register);

    updateType(0);

    check(undefined, false);
    if(document.getElementById("userName").value.trim() !== "") userNameInput();

});