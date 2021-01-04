// Javascript fuer account.php

const ERROR_PASSWORD_FALSE = 12;

var editPasswordDialog;

document.addEventListener("DOMContentLoaded", function() {

    editPasswordDialog = new Dialog(document.getElementById("editPasswordDialog"), false, true, function() { editPasswordDialog.save(); }, undefined, "editPasswordDialog");

    editPasswordDialog.open = function() {

        this.errors = { oldPassword: false, newPassword: false };

        document.getElementById("editPasswordDialog_oldPassword").classList.remove("error");
        document.getElementById("editPasswordDialog_oldPassword").value = "";

        document.getElementById("editPasswordDialog_newPassword").classList.remove("error");
        document.getElementById("editPasswordDialog_newPassword").value = "";

        document.getElementById("editPasswordDialog_repeatPassword").classList.remove("error");
        document.getElementById("editPasswordDialog_repeatPassword").value = "";

        document.getElementById("editPasswordDialog_errorContainer").style.display = "none";

        document.getElementById("editPasswordDialog_OKButton").classList.add("deactivated");

        this.show();

    };

    editPasswordDialog.check = function(ID = undefined, printAll = true, callErrorUpdates = true) {

        if(ID === undefined) {

            var checkAll = true;

        } else {

            var checkAll = false;

        }

        if(checkAll || ID === "oldPassword") {

            var element = document.getElementById("editPasswordDialog_oldPassword");
    
            if(element.value === "") {
    
                this.errors.oldPassword = printAll ? "Das alte Passwort muss noch angegeben werden." : false;
    
                if(printAll) {
    
                    element.classList.add("error");
    
                }

            } else {

                delete this.errors.oldPassword;
                element.classList.remove("error");

            }

        }

        if(checkAll || ID === "newPassword" || ID === "repeatPassword") {

            var element = document.getElementById("editPasswordDialog_newPassword");
            var repeatElement = document.getElementById("editPasswordDialog_repeatPassword");
    
            if(element.value === "") {
    
                this.errors.newPassword = printAll ? "Das neue Passwort wurde nicht angegeben." : false;
    
                if(printAll) {
    
                    element.classList.add("error");
    
                }
    
                repeatElement.classList.remove("error");
    
            } else if(element.value.length < 8) {
    
                this.errors.newPassword = "Ein Passwort muss mindestens acht Zeichen lang sein.";
                element.classList.add("error");
                repeatElement.classList.remove("error");
    
            } else {
    
                element.classList.remove("error");
    
                if(element.value !== repeatElement.value) {
    
                    if(repeatElement.value === "") {
    
                        printError = printAll && (checkAll || ID === "repeatPassword");
    
                        this.errors.newPassword = printError ? "Das neue Passwort muss wiederholt werden." : false;
    
                        if(printError) {
    
                            repeatElement.classList.add("error");
    
                        }
    
                    } else {
    
                        this.errors.newPassword = "Die beiden neuen Passwörter sind nicht gleich.";
                        repeatElement.classList.add("error");
    
                    }
    
                } else {
    
                    delete this.errors.newPassword;
                    repeatElement.classList.remove("error");
    
                }
    
            }
    
        }

        if(callErrorUpdates) {

            var noError = updateErrors(this.errors, document.getElementById("editPasswordDialog_errorContainer"), document.getElementById("editPasswordDialog_OKButton"), true);
            Dialog.resize(this);
            return noError;

        }

    };

    editPasswordDialog.save = function() {

        if(!this.check()) {

            return;

        }

        var requestObj = {
            oldPassword: document.getElementById("editPasswordDialog_oldPassword").value,
            newPassword: document.getElementById("editPasswordDialog_newPassword").value,
        }

        loadData("/changeAccount/changePassword.php", requestObj, function() {

            new Alert({
                type: "info",
                icon: "success",
                title: "Passwort geändert",
                description: "Das Passwort wurde erfolgreich geändert."
            });

            Loading.hide(editPasswordDialog.dialogElement);
            
            editPasswordDialog.hide();

        }, function(errorCode) {

            Loading.hide(editPasswordDialog.dialogElement);

            if(errorCode === ERROR_PASSWORD_FALSE) {

                showErrorMessage("Das alte Passwort ist falsch.\nEntsprechend konnte das Passwort nicht geändert werden.");

            } else {

                showErrorMessage("Es ist ein Fehler aufgetreten und das Passwort konnte nicht geändert werden.\n\nFehlercode: " + errorCode, true);

            }

        });

        Loading.show(editPasswordDialog.dialogElement);

    }



    document.getElementById("editPasswordButton")                   .addEventListener("click", editPasswordDialog.open.bind(editPasswordDialog));
    
    document.getElementById("editPasswordDialog_oldPassword")       .addEventListener("input", editPasswordDialog.check.bind(editPasswordDialog, "oldPassword"));
    document.getElementById("editPasswordDialog_newPassword")       .addEventListener("input", editPasswordDialog.check.bind(editPasswordDialog, "newPassword"));
    document.getElementById("editPasswordDialog_repeatPassword")    .addEventListener("input", editPasswordDialog.check.bind(editPasswordDialog, "repeatPassword"));

    document.getElementById("editPasswordDialog_cancelButton")      .addEventListener("click", editPasswordDialog.hide.bind(editPasswordDialog));
    document.getElementById("editPasswordDialog_OKButton")          .addEventListener("click", editPasswordDialog.save.bind(editPasswordDialog));


});