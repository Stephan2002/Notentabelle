class EditDialog extends Dialog {

    updateCheckbox(type) {

        if(document.getElementById(this.id + "_with_" + type).checked) {

            document.getElementById(this.id + "_" + type).style.display = "inline";

            this.check(type);

        } else {

            document.getElementById(this.id + "_" + type).style.display = "none";

            delete this.errors[type];
            delete this.warnings[type];

            updateErrors(this.warnings, document.getElementById(this.id + "_warningContainer"), undefined, this.isNew);
            updateErrors(this.errors, document.getElementById(this.id + "_errorContainer"), document.getElementById(this.id + "_OKButton"), this.isNew);

            this.resize();

        }

    }

    checkName(type, printAll) {

        var elementData;
        var IDName;
        var requestTarget;

        if(type === TYPE_SEMESTER) {

            elementData = this.semesterData;
            IDName = "semesterID";
            requestTarget = "getSemesters.php";

        } else if(type === TYPE_TEST) {

            elementData = this.testData;
            IDName = "testID";
            requestTarget = "getTests.php";

        } else if(type === TYPE_CLASS) {

            elementData = this.classData;
            IDName = "classID";
            requestTarget = "getClasses.php";

        }

        var element = document.getElementById(this.id + "_name");

        delete this.warnings.name;
        element.classList.remove("warning");

        if(element.value.trim() === "") {

            if(printAll) {

                this.errors.name = "Der Name muss angegeben werden.";
                element.classList.add("error");

            } else {

                this.errors.name = false;
                element.classList.remove("error");

            }

        } else if(element.value.length >= MAX_LENGTH_NAME) {

            this.errors.name = "Der Name muss weniger als " + MAX_LENGTH_NAME + " Zeichen lang sein.";
            element.classList.add("error");

        } else {

            delete this.errors.name;
            element.classList.remove("error");

            var nameAlreadyExists = false;

            if(this.siblingData === undefined) {

                if(this.nameCheckRequest === undefined) {

                    var requestObj = {};

                    var parentID = elementData.parentID;
                    
                    if(parentID !== null) {

                        requestObj[IDName] = parentID;

                    } else if(type === TYPE_TEST) {

                        requestObj.semesterID = elementData.semesterID;

                    }

                    this.nameCheckRequest = loadData("/phpScripts/get/" + requestTarget, requestObj, (function (data) {

                        if(type === TYPE_SEMESTER) {

                            if(parentID === null) {
                            
                                cache.rootSemesters = data;

                            } else {

                                cache.semesters[parentID] = data;

                            }

                        } else if(type === TYPE_TEST) {
                            
                            if(parentID === null) {
                            
                                cache.semesters[data.data.semesterID] = data;

                            } else {

                                cache.tests[parentID] = data;

                            }

                        } else if(type === TYPE_CLASS) {

                            cache.rootClasses = data;

                        }

                        this.siblingData = data.childrenData;
                        this.check("name");
        
                    }).bind(this));

                }

            } else {
                
                for(var i = 0; i < this.siblingData.length; i++) {
                    
                    if(this.siblingData[i].name === element.value && (this.isNew || this.siblingData[i][IDName] !== elementData[IDName])) {
                        
                        nameAlreadyExists = true;
                        break;

                    }

                }

            }

            if(nameAlreadyExists) {

                this.warnings.name = "Es existiert bereits ein Element mit gleichem Namen.";
                element.classList.add("warning");

            }

        }

    }

    getPermissionUpdates(oldPermissions) {

        var permissionUpdates = [];
        var permissionObj = {};
        var cleanedPermissions = [];

        var newPermissions = this.permissionsData;

        for(var i = 0; i < newPermissions.length; i++) {

            if(newPermissions[i] !== undefined) {

                cleanedPermissions.push({
                    userName: newPermissions[i].userName,
                    writingPermission: newPermissions[i].writingPermission
                });

                permissionObj[newPermissions[i].userName.toLowerCase()] = newPermissions[i];

            }

        }

        for(var i = 0; i < oldPermissions.length; i++) {

            var userName = oldPermissions[i].userName.toLowerCase();

            if(permissionObj[userName] === undefined) {

                // Berechtigung geloescht

                permissionUpdates.push({
                    userName: userName,
                    writingPermission: null
                });

            } else {

                permissionObj[userName].alreadyExists = true;
            
                if(permissionObj[userName].writingPermission != oldPermissions[i].writingPermission) {

                    // writingPermission veraendert

                    permissionUpdates.push({
                        userName: userName,
                        writingPermission: permissionObj[userName].writingPermission
                    });

                }

            }

        }

        for(var key in permissionObj) {

            if(!permissionObj[key].alreadyExists) {

                // neue Berechtigung

                permissionUpdates.push({
                    userName: key,
                    writingPermission: permissionObj[key].writingPermission
                });

            }

        }

        return { updates: permissionUpdates, cleaned: cleanedPermissions };

    }

    checkNotes() {

        var element = document.getElementById(this.id + "_notes");

        if(document.getElementById(this.id + "_with_notes").checked && element.value.length >= MAX_LENGTH_NOTES) {

            this.errors.notes = "Die Notizen müssen weniger als " + MAX_LENGTH_NOTES + " Zeichen lang sein.";
            element.classList.add("error");

        } else {

            delete this.errors.notes;
            element.classList.remove("error");

        }

    }

    updateErrors(keepButtonSelectable, buttonID, containerID) {
    
        var noError = updateErrors(this.errors, document.getElementById(containerID === undefined ? this.id + "_errorContainer" : containerID), document.getElementById(buttonID === undefined ? this.id + "_OKButton" : buttonID), keepButtonSelectable);
    
        Dialog.resize(this);

        return noError;

    }

    updateWarnings(withResize, containerID) {

        var noError = updateErrors(this.warnings, document.getElementById(containerID === undefined ? this.id + "_warningContainer": containerID));
    
        if(withResize) Dialog.resize(this);

        return noError;

    }

}