// Javascript fuer app.php bei Lehrpersonen (mit Klassen und Schuelern)

cache.classes = [];
cache.rootClasses = undefined;

additionalInfo.classes = [];

var showStudentsWithoutMark = false;
var showStudentsWithoutMarkBefore = false;
var markData = [];

var classInfoDialog;
var studentInfoDialog;

var editClassDialog;
var editStudentDialog;
var editStudentMarkDialog;

function showRootClasses() {

    path.push({ type: TYPE_CLASS, isRoot: true, isForeign: false });

    if (typeof (localStorage) !== undefined) localStorage.setItem("path", JSON.stringify(path));

    loadElementAndPrint();

}

function showForeignClasses() {

    path.push({ type: TYPE_CLASS, isRoot: true, isForeign: true });

    if (typeof (localStorage) !== undefined) localStorage.setItem("path", JSON.stringify(path));

    loadElementAndPrint();

}

function changeStudentMarkVisibility() {

    var spanElement = this.children[0];

    if(showStudentsWithoutMark) {

        spanElement.innerHTML = "anzeigen";
        showStudentsWithoutMark = false;

    } else {

        spanElement.innerHTML = "ausblenden";
        showStudentsWithoutMark = true;

    }

    hidePanelsAndPrint();

}

function startMarkEdit() {
    
    if(isBlocked) return;

    editMarks = true;

    showStudentsWithoutMarkBefore = showStudentsWithoutMark;
    showStudentsWithoutMark = true;

    document.getElementById("tests_studentMarkVisibiltyButton").children[0].innerHTML = "ausblenden";

    hidePanelsAndPrint();

}

function stopMarkEdit(noTableUpdate, func) {

    if(isBlocked) return;

    editMarks = false;
    showStudentsWithoutMark = showStudentsWithoutMarkBefore;
    markData = [];

    document.getElementById("tests_studentMarkVisibiltyButton").children[0].innerHTML = showStudentsWithoutMark ? "ausblenden" : "anzeigen";

    if(typeof(func) === "function") {

        func();

    }

    if(noTableUpdate !== true) {

        hidePanelsAndPrint();

    }

}



function saveMarkChanges(noTableUpdate, func) {

    if(isBlocked) return;

    var isTest = !currentElement.isFolder && currentElement.data.referenceState === null;
    var students = currentElement.data.students;

    var markChanges = [];

    for(var i = 0; i < students.length; i++) {

        var studentID = students[i].studentID;
        var currentMarkData = markData[studentID];

        if(currentMarkData) {

            var changesObj = { studentID: studentID };
            var hasChanged = false;

            if(currentMarkData.mark !== undefined) {
        
                var mark = currentMarkData.mark.trim() !== "" ? Number(currentMarkData.mark).toFixed(6) : null;
        
                if(students[i].mark == null) {
                    if(mark !== null) {
                        changesObj.mark = mark;
                        hasChanged = true;
                    }
                } else if(students[i].mark !== mark) {
                    changesObj.mark = mark;
                    hasChanged = true;
                }

            }

            if(currentMarkData.points !== undefined) {
                
                var points = currentMarkData.points.trim() !== "" ? Number(currentMarkData.points).toFixed(3) : null;
        
                if(students[i].points == null) {
                    if(points !== null) {
                        changesObj.points = points;
                        hasChanged = true;
                    }
                } else if(students[i].points !== points) {
                    changesObj.points = points;
                    hasChanged = true;
                }

            }

            if(currentMarkData.notes !== undefined) {

                var notes = currentMarkData.notes || null;
        
                if(students[i].studentNotes == null) {
                    if(notes !== null) {
                        changesObj.notes = notes;
                        hasChanged = true;
                    }
                } else if(students[i].studentNotes !== notes) {
                    changesObj.notes = notes;
                    hasChanged = true;
                }

            }

            if(hasChanged) {

                markChanges.push(changesObj);

            }

        }

    }

    stopMarkEdit(true);

    if(Object.keys(markChanges).length <= 0) {

        if(typeof(func) === "function") {

            func();
        
        }
    
        if(noTableUpdate !== true) {
    
            hidePanelsAndPrint();
    
        }

        return;

    }

    Loading.show(null, "semi-transparent");

    loadData("/phpScripts/edit/editTest.php", [{ testID: currentElement.data.testID, students: markChanges }], function(result) {

        if(result.result[0]) {

            cache.semesters = [];
            cache.tests = [];

        }

        if(typeof(func) === "function") {

            func();
        
        }
    
        if(noTableUpdate !== true) {
    
            loadElementAndPrint();
    
        }

        return;

    }, function(errorCode, result) {

        if(result === undefined || result.result === undefined || result.result[0] == undefined) {

            showErrorMessage(TEXT_ERROR_UNCHANGED + errorCode, true);

        } else {

            showErrorMessage(TEXT_ERROR_CHANGED + errorCode, true);

        }

    });

}

function confirmMarkCancel(func, noTableUpdate) {

    var buttons = [
        {
            name: "Verwerfen und fortfahren",
            color: "negative",
            action: function() { stopMarkEdit(noTableUpdate, func); }
        }
    ];

    if(!document.getElementById("tests_OKButton").disabled) {

        buttons[1] = {
            name: "Speichern und fortfahren",
            color: "positive",
            action: function() { saveMarkChanges(noTableUpdate, func); }
        }

    }

    new Alert({
        title: "Veränderungen verwerfen?",
        icon: "warning",
        type: "options",
        description: "Mit dieser Aktion werden die Veränderungen\nan Noten/Punkten/Anmerkungen verworfen, wenn Sie sie nicht speichern.",
        buttons: buttons,
        hasCancelButton: true

    });

}

function updateMarkOrPoints(element, isPoints, studentID) {
    
    if(markData[studentID] === undefined) {

        var students = currentElement.data.students;
        var found = false;
        
        for(var i = 0; i < students.length; i++) {

            if(students[i].studentID === studentID) {

                found = true;

                markData[studentID] = {};

            }

        }

        if(!found) return;

    }

    var newValue = Number(element.value.replace(/,/g, "."));
    var currentMarkData = markData[studentID];
    var hasError = false;

    if(isPoints) {

        if(isNaN(newValue) || newValue >= MAX_OTHER || newValue <= -MAX_OTHER) {

            hasError = true;
            currentMarkData.pointsError = true;

        } else {

            currentMarkData.pointsError = false;

        }

        currentMarkData.points = element.value;

    } else {

        if(isNaN(newValue) || newValue >= MAX_MARK || newValue <= -MAX_MARK) {

            hasError = true;
            currentMarkData.markError = true;

        } else {

            currentMarkData.markError = false;

        }

        currentMarkData.mark = element.value;

    }

    if(hasError) {

        element.classList.add("error");

    } else {

        element.classList.remove("error");
        
    }

    updateStudentMarkError();

}

function updateStudentMarkError() {

    var pointsError = false;
    var markError = false;

    for(var studentID in markData) {

        var currentMarkData = markData[studentID];
        
        if(currentMarkData.pointsError) pointsError = true;
        if(currentMarkData.markError) markError = true;

    }

    var errorString = "";

    if(markError) errorString += "<p class='blankLine_small'>Es wurden fehlerhafte Angaben als Noten eingetragen.</p>";
    if(pointsError) errorString += "<p class='blankLine_small'>Es wurden fehlerhafte Angaben als Punkte eingetragen.</p>";

    if(pointsError || markError) {

        document.getElementById("tests_OKButton").disabled = true;
        document.getElementById("tests_errorContainer").innerHTML = errorString;
        document.getElementById("tests_errorContainer").style.display = "inline-block";

    } else {

        document.getElementById("tests_OKButton").disabled = false;
        document.getElementById("tests_errorContainer").style.display = "none";

    }

}


document.addEventListener("DOMContentLoaded", function() {

    classInfoDialog         = new Dialog(document.getElementById("classInfoDialog"),    false, false, undefined, function() { classInfoDialog.close(); }, "classInfoDialog");
    studentInfoDialog       = new Dialog(document.getElementById("studentInfoDialog"),  false, false, undefined, function() { studentInfoDialog.close(); }, "studentInfoDialog");

    editClassDialog         = new EditDialog(document.getElementById("editClassDialog"),        false, false, function() { editClassDialog.save(); }, function() { editClassDialog.close(); }, "editClassDialog");
    editStudentDialog       = new EditDialog(document.getElementById("editStudentDialog"),      false, false, function() { editStudentDialog.save(); }, function() { editStudentDialog.close(); }, "editStudentDialog");
    editStudentMarkDialog   = new EditDialog(document.getElementById("editStudentMarkDialog"),  false, false, function() { editStudentMarkDialog.save(); }, function() { editStudentMarkDialog.close(); }, "editStudentMarkDialog");

    classInfoDialog.open = function(arg) {

        if(typeof(arg) === "number") {

            var len = currentElement.childrenData.length;
            var found = false;

            for(var i = 0; i < len; i++) {

                if(currentElement.childrenData[i].classID === arg) {

                    this.classData = currentElement.childrenData[i];
                    found = true;
                    break;

                }

            }

            if(!found) return;

        } else {

            this.classData = currentElement.data;

        }

        this.printInfo();

        document.getElementById("classInfoDialog_editButton").onclick = editClassDialog.openEdit.bind(editClassDialog, this.classData);

        this.show();

    };

    classInfoDialog.close = function() {

        this.classData = undefined;

        if(this.additionalInfoRequest !== undefined) {

            if(this.additionalInfoRequest.readyState !== XMLHttpRequest.DONE) {
    
                this.additionalInfoRequest.abort();

            }

            this.additionalInfoRequest = undefined;

        }

        this.hide();

    };

    classInfoDialog.printInfo = function() {

        document.getElementById("classInfoDialog_name").innerHTML = escapeHTML(this.classData.name);
        document.getElementById("classInfoDialog_isHiddenIcon").src = "/img/icons/" + (this.classData.isHidden ? "checked.svg" : "cross.svg");

        if(this.classData.notes === null) {

            document.getElementById("classInfoDialog_notesContainer").style.display = "none";

        } else {

            document.getElementById("classInfoDialog_notesContainer").style.display = "block";
            document.getElementById("classInfoDialog_notes").innerHTML = escapeHTML(this.classData.notes);

        }

        this.printAdditionalInfo();

        var loadMoreButton = document.getElementById("classInfoDialog_loadMoreButton");
        var visibilityButton = document.getElementById("classInfoDialog_visibilityButton");
        var actionButton = document.getElementById("classInfoDialog_actionButton");
        // var action2Button = document.getElementById("classInfoDialog_action2Button");

        if(this.classData.referenceID === null) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_class { display: inline; }";

            // action2Button.style.display = "inline-block";

            // actionButton.classList.remove("button_big");
            // actionButton.classList.add("button_medium");

        } else {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_classRef { display: inline; }";

            // action2Button.style.display = "none";

            // actionButton.classList.remove("button_medium");
            // actionButton.classList.add("button_big");

        }
    
        if(currentElement.accessType === ACCESS_OWNER) {

            loadMoreButton.classList.remove("button_big");
            loadMoreButton.classList.add("button_medium");

            if(this.classData.isHidden) {

                visibilityButton.innerHTML = "Wieder anzeigen";
                visibilityButton.classList.remove("withImage");
    
            } else {
    
                visibilityButton.innerHTML = "<img src='/img/icons/archive.svg'>Archivieren";
                visibilityButton.classList.add("withImage");
    
            }

            visibilityButton.style.display = "inline-block";

            document.getElementById("classInfoDialog_controlButtons").style.display = "block";

            // temp
            actionButton.style.display = "none";

        } else {

            loadMoreButton.classList.remove("button_medium");
            loadMoreButton.classList.add("button_big");

            visibilityButton.style.display = "none";

            document.getElementById("classInfoDialog_controlButtons").style.display = "none";

            loadMoreButton.style.display = "none";

            // temp
            actionButton.style.display = "inline-block";
            actionButton.onclick = function() { selectDialog.openSelectActionLocation(TYPE_CLASS, selectDialog.ACTION_REF, undefined, TYPE_CLASS, undefined, true, classInfoDialog.classData ); };

        }

    };

    classInfoDialog.printAdditionalInfo = function() {

        var permissionsContainer = document.getElementById("classInfoDialog_permissionsContainer");
        var refContainer = document.getElementById("classInfoDialog_refContainer");

        var loadMoreButton = document.getElementById("classInfoDialog_loadMoreButton");
        var visibilityButton = document.getElementById("classInfoDialog_visibilityButton");
        
        if(additionalInfo.classes[this.classData.classID] !== undefined) {

            var currentInfo = additionalInfo.classes[this.classData.classID];

            if(this.classData.referenceID === null) {

                refContainer.style.display = "none";

            } else {

                if(currentInfo.refError === undefined) {

                    document.getElementById("classInfoDialog_refUserNameContainer").style.display = "table-row";
                    document.getElementById("classInfoDialog_refUserName").innerHTML = escapeHTML(currentInfo.refUserName);

                    document.getElementById("classInfoDialog_refClassName").innerHTML = escapeHTML(currentInfo.refClassName);

                } else {

                    document.getElementById("classInfoDialog_refClassName").innerHTML = "<i>ungültig</i>";

                    document.getElementById("classInfoDialog_refUserNameContainer").style.display = "none";

                }

                refContainer.style.display = "table";

            }

            if(currentInfo.permissions === undefined) {

                permissionsContainer.style.display = "none";

            } else {

                permissionsContainer.style.display = "block";

                if(currentInfo.permissions.length === 0) {

                    document.getElementById("classInfoDialog_noPermissions").style.display = "block";
                    document.getElementById("classInfoDialog_permissions").style.display = "none";

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

                    document.getElementById("classInfoDialog_noPermissions").style.display = "none";

                    document.getElementById("classInfoDialog_permissions").innerHTML = permissionsString;
                    document.getElementById("classInfoDialog_permissions").style.display = "table";

                }

            }

            loadMoreButton.style.display = "none";
            loadMoreButton.disabled = false;

            visibilityButton.classList.remove("button_medium");
            visibilityButton.classList.add("button_big");

        } else {

            permissionsContainer.style.display = "none";
            refContainer.style.display = "none";

            loadMoreButton.innerHTML = "<img src=\"/img/icons/info.svg\">Mehr laden";
            loadMoreButton.disabled = false;
            loadMoreButton.style.display = "inline-block";

            visibilityButton.classList.remove("button_big");
            visibilityButton.classList.add("button_medium");

        }

    }

    classInfoDialog.loadMore = function() {

        var loadMoreButton = document.getElementById("classInfoDialog_loadMoreButton");

        loadMoreButton.innerHTML = "<img src=\"/img/icons/loading.svg\">Laden...";
        loadMoreButton.disabled = true;

        var classID = this.classData.classID;

        this.additionalInfoRequest = loadData("/phpScripts/getInfo/getClassInfo.php", { classID: classID }, function(data) {

            additionalInfo.classes[classID] = data;

            classInfoDialog.printAdditionalInfo();
            classInfoDialog.resize();

        }, function(errorCode) {

            classInfoDialog.printAdditionalInfo();

            new Alert({
                type: "info",
                icon: "error",
                title: "Fehler",
                description: "Es ist ein Fehler aufgetreten. Versuchen Sie es später wieder.\nFehlercode: " + errorCode
            });

        });

    }


    studentInfoDialog.open = function(studentID, asMarkInfo = false) {

        this.asMarkInfo = asMarkInfo;

        var list;

        if(asMarkInfo) {

            list = currentElement.data.students;

        } else {

            list = currentElement.childrenData;

        }

        var found = false;

        for(var i = 0; i < list.length; i++) {

            if(list[i].studentID === studentID) {

                this.studentData = list[i];
                found = true;
                break;

            }

        }

        if(!found) return;

        this.printInfo();

        if(asMarkInfo) {

            document.getElementById("studentInfoDialog_editButton").onclick = editStudentMarkDialog.open.bind(editStudentMarkDialog, this.studentData);

        } else {

            document.getElementById("studentInfoDialog_editButton").onclick = editStudentDialog.openEdit.bind(editStudentDialog, this.studentData);

        }

        this.show();

    };

    studentInfoDialog.printInfo = function() {

        document.getElementById("studentInfoDialog_name").innerHTML = (this.studentData.firstName === null ? "" : (escapeHTML(this.studentData.firstName) + " ")) + escapeHTML(this.studentData.lastName);
        
        document.getElementById("studentInfoDialog_lastName").innerHTML = escapeHTML(this.studentData.lastName);

        if(this.studentData.firstName === null) {

            document.getElementById("studentInfoDialog_firstNameContainer").style.display = "none";

        } else {

            document.getElementById("studentInfoDialog_firstName").innerHTML = escapeHTML(this.studentData.firstName);
            document.getElementById("studentInfoDialog_firstNameContainer").style.display = "table-row";

        }

        if(this.studentData.gender === null) {

            document.getElementById("studentInfoDialog_genderContainer").style.display = "none";

        } else {

            var genderString = "divers";

            if(this.studentData.gender === "m") {

                genderString = "männlich";

            } else if(this.studentData.gender === "f") {

                genderString = "weiblich";

            }

            document.getElementById("studentInfoDialog_gender").innerHTML = genderString;
            document.getElementById("studentInfoDialog_genderContainer").style.display = "table-row";

        }

        document.getElementById("studentInfoDialog_isHiddenIcon").src = "/img/icons/" + (this.studentData.isHidden ? "checked.svg" : "cross.svg");

        var editButton = document.getElementById("studentInfoDialog_editButton");
        var deleteButton = document.getElementById("studentInfoDialog_deleteButton");
        var visibilityButton = document.getElementById("studentInfoDialog_visibilityButton");

        if(!this.asMarkInfo) {

            if(this.studentData.userName === null) {

                document.getElementById("studentInfoDialog_userNameContainer").style.display = "none";

            } else {

                document.getElementById("studentInfoDialog_userName").innerHTML = escapeHTML(this.studentData.userName);
                document.getElementById("studentInfoDialog_userNameContainer").style.display = "table";

            }

            if(this.studentData.notes === null) {

                document.getElementById("studentInfoDialog_notesContainer").style.display = "none";

            } else {

                document.getElementById("studentInfoDialog_notesLabelFragment").innerHTML = "";
                document.getElementById("studentInfoDialog_notesContainer").style.display = "block";
                document.getElementById("studentInfoDialog_notes").innerHTML = escapeHTML(this.studentData.notes);

            }

            document.getElementById("studentInfoDialog_markAndPointsContainer").style.display = "none";

            editButton.classList.remove("button_big");
            editButton.classList.add("button_medium");

            deleteButton.style.display = "inline-block";

        } else {

            document.getElementById("studentInfoDialog_userNameContainer").style.display = "none";

            if(this.studentData.studentNotes == undefined) {

                document.getElementById("studentInfoDialog_notesContainer").style.display = "none";

            } else {

                if(markData[this.studentData.studentID] && markData[this.studentData.studentID].notes !== undefined) {

                    document.getElementById("studentInfoDialog_notesLabelFragment").innerHTML = " vor Änderung";

                } else {

                    document.getElementById("studentInfoDialog_notesLabelFragment").innerHTML = "";

                }

                document.getElementById("studentInfoDialog_notesContainer").style.display = "block";
                document.getElementById("studentInfoDialog_notes").innerHTML = escapeHTML(this.studentData.studentNotes);

            }

            if(currentElement.isRoot) {

                editButton.style.display = "none";

                document.getElementById("studentInfoDialog_pointsContainer").style.display = "none";
                document.getElementById("studentInfoDialog_markContainer").style.display = "none";
                document.getElementById("studentInfoDialog_averageContainer").style.display = "table-row";
                document.getElementById("studentInfoDialog_plusPointsContainer").style.display = "table-row";

                document.getElementById("studentInfoDialog_averageLabelFragment").innerHTML = "";

                document.getElementById("studentInfoDialog_average").innerHTML = formatNumber(this.studentData.mark_unrounded, "-");
                document.getElementById("studentInfoDialog_plusPoints").innerHTML = formatNumber(this.studentData.plusPoints, "-");

            } else {

                editButton.style.display = "inline-block";

                if(markData[this.studentData.studentID]) {

                    if(markData[this.studentData.studentID].mark !== undefined) {

                        document.getElementById("studentInfoDialog_averageLabelFragment").innerHTML = " vor Änderung";
                        document.getElementById("studentInfoDialog_markLabelFragment").innerHTML = " vor Änderung";

                    } else {

                        document.getElementById("studentInfoDialog_averageLabelFragment").innerHTML = "";
                        document.getElementById("studentInfoDialog_markLabelFragment").innerHTML = "";

                    }

                    if(markData[this.studentData.studentID].points !== undefined) {

                        document.getElementById("studentInfoDialog_pointsLabelFragment").innerHTML = " vor Änderung";

                    } else {

                        document.getElementById("studentInfoDialog_pointsLabelFragment").innerHTML = "";

                    }

                } else {

                    document.getElementById("studentInfoDialog_averageLabelFragment").innerHTML = "";
                    document.getElementById("studentInfoDialog_markLabelFragment").innerHTML = "";
                    document.getElementById("studentInfoDialog_pointsLabelFragment").innerHTML = "";

                }

                document.getElementById("studentInfoDialog_plusPointsContainer").style.display = "none";

                printMarkInfo("studentInfoDialog", currentElement.data, this.studentData, true);

            }

            document.getElementById("studentInfoDialog_markAndPointsContainer").style.display = "table";

            editButton.classList.remove("button_medium");
            editButton.classList.add("button_big");

            deleteButton.style.display = "none";

        }

        if(currentElement.writingPermission) {

            document.getElementById("studentInfoDialog_controlButtons").style.display = "block";

            if(!this.asMarkInfo) {

                if(this.studentData.isHidden) {

                    visibilityButton.innerHTML = "Wieder anzeigen";
                    visibilityButton.classList.remove("withImage");
        
                } else {
        
                    visibilityButton.innerHTML = "<img src='/img/icons/archive.svg'>Archivieren";
                    visibilityButton.classList.add("withImage");
        
                }

                visibilityButton.style.display = "inline-block";

            } else {

                visibilityButton.style.display = "none";

            }

        } else {

            visibilityButton.style.display = "none";
            document.getElementById("studentInfoDialog_controlButtons").style.display = "none";

        }

    };

    studentInfoDialog.close = function() {

        this.studentData = undefined;
        this.hide();

    };




    editClassDialog.openEdit = function(arg) {

        this.errors = {};
        this.warnings = {};
        this.isNew = false;

        if(typeof(arg) === "object") {

            this.classData = arg;

        } else if(arg === undefined) {

            this.classData = currentElement.data;

        } else {

            var len = currentElement.childrenData.length;
            var found = false;

            for(var i = 0; i < len; i++) {
                
                if(currentElement.childrenData[i].classID === arg) {

                    this.classData = currentElement.childrenData[i];
                    found = true;
                    break;

                }

            }
            
            if(!found) return;

        }

        if(currentElement.isRoot) {

            this.siblingData = currentElement.childrenData;

        }

        document.getElementById("modeFlagStyles").innerHTML = ".modeFlag_edit { display: inline; }";

        if(this.classData.referenceID === null) {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_class { display: inline; }";
            document.getElementById("editClassDialog_permissionsButton").style.display = "inline-block";

        } else {

            document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_classRef { display: inline; }";
            document.getElementById("editClassDialog_permissionsButton").style.display = "none";

        }

        var nameElement = document.getElementById("editClassDialog_name");

        nameElement.value = this.classData.name;
        nameElement.classList.remove("error");
        nameElement.classList.remove("warning");

        if(this.classData.notes === null) {
            
            document.getElementById("editClassDialog_with_notes").checked = false;
            document.getElementById("editClassDialog_notes").value = "";

        } else {
            
            document.getElementById("editClassDialog_with_notes").checked = true;
            document.getElementById("editClassDialog_notes").value = this.classData.notes;

        }

        this.updateCheckbox("notes");

        document.getElementById("editClassDialog_OKButton").classList.remove("deactivated");

        this.updateWarnings();
        this.updateErrors();

        this.show();

    };

    editClassDialog.openAdd = function() {

        this.errors = {};
        this.warnings = {};
        this.isNew = true;

        this.classData = {};

        this.siblingData = currentElement.childrenData;

        document.getElementById("modeFlagStyles").innerHTML = ".modeFlag_add { display: inline; }";
        document.getElementById("dialogTypeStyles").innerHTML = ".dialogType_class { display: inline; }";

        var nameElement = document.getElementById("editClassDialog_name");

        nameElement.value = "";
        nameElement.classList.remove("error");
        nameElement.classList.remove("warning");

        document.getElementById("editClassDialog_notes").value = "";

        this.updateCheckbox("notes");

        document.getElementById("editClassDialog_OKButton").disabled = false;

        this.errors = { name: false };

        this.updateWarnings();
        this.updateErrors(true);

        this.show();

    };

    editClassDialog.check = function(ID, printAll = true, callErrorUpdate = true) {

        if(ID === undefined) {

            var checkAll = true;

        } else {

            var checkAll = false;

        }

        if(checkAll || ID === "name") {

            this.checkName(TYPE_CLASS, printAll);

        }

        if(checkAll || ID === "notes") {

            this.checkNotes();

        }

        if(callErrorUpdate) {

            this.updateWarnings();
            return this.updateErrors(this.isNew);

        }

    };

    editClassDialog.close = function() {

        this.classData = undefined;
        this.permissionsData = undefined;

        if(this.nameCheckRequest !== undefined) {

            this.nameCheckRequest.abort();
            this.nameCheckRequest = undefined;

        }

        this.hide();

    };

    editClassDialog.save = function() {

        if((this.isNew && !this.check("name")) || Object.keys(this.errors).length > 0) {

            return;

        }

        var properties = {};

        properties.name = document.getElementById("editClassDialog_name").value;

        if(document.getElementById("editClassDialog_with_notes").checked) {

            var element = document.getElementById("editClassDialog_notes");

            if(element.value.trim() !== "") {

                properties.notes = element.value;

            }

        }

        if(this.isNew) {

            this.saveAdd(properties);

        } else {

            this.saveEdit(properties);

        }

    };

    editClassDialog.saveEdit = function(properties) {

        var changedProperties = {};
        var permissionUpdates;
        var classData = this.classData;

        if(properties.name !== this.classData.name) changedProperties.name = properties.name;

        if(this.classData.notes === null) {

            if(properties.notes !== undefined) {
                
                changedProperties.notes = properties.notes;

            }

        } else if(this.classData.notes !== properties.notes) {

            changedProperties.notes = properties.notes || null;

        }

        if(this.permissionsData !== undefined) {

            permissionUpdates = this.getPermissionUpdates(additionalInfo.classes[classData.classID].permissions);
            changedProperties.permissions = permissionUpdates.updates;

        }

        if(Object.keys(changedProperties).length <= 0) {

            this.close();
            return;

        }

        changedProperties.classID = classData.classID;

        loadData("/phpScripts/edit/editClass.php", [ changedProperties ], function(result) {

            var currentAdditionalInfo = additionalInfo.classes[classData.classID];

            if(permissionUpdates !== undefined) {

                currentAdditionalInfo.permissions = permissionUpdates.cleaned;

            }

            additionalInfo.classes = [];
            additionalInfo.semesters = [];
            additionalInfo.tests = [];

            if(currentAdditionalInfo !== undefined) additionalInfo.classes[classData.classID] = currentAdditionalInfo;

            delete changedProperties.permissions;
            assignProperties(classData, changedProperties);

            if(classInfoDialog.isVisible()) {

                classInfoDialog.printInfo();
                Loading.hide(classInfoDialog.dialogElement);
    
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

        if(!currentElement.isRoot) {
            
            cache.rootClasss = undefined;

        } else {

            delete cache.classes[classData.classID];

        }

        if(classInfoDialog.isVisible()) {

            Loading.show(classInfoDialog.dialogElement);

        } else {

            Loading.show(null, "semi-transparent");

        }

        this.close();

    };

    editClassDialog.saveAdd = function(properties) {

        if(this.permissionsData !== undefined) {

            var cleanedPermissions = this.permissionsData.filter(function(element) { return element !== undefined } );

            properties.permissions = cleanedPermissions;

        }

        loadData("/phpScripts/create/createClass.php", properties, function(result) {

            properties.classID = result.newID;

            currentElement.childrenData.push(properties);

            hidePanelsAndPrint();

        }, function(errorCode) {

            showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);

        });

        if(properties.notes === undefined) properties.notes = null;
        
        properties.isHidden = 0;
        properties.referenceID = null;
        properties.deleteTimestamp = null;

        Loading.show(null, "semi-transparent");

        this.close();

    };




    editStudentDialog.openEdit = function(arg) {

        this.errors = {};
        this.warnings = {};
        this.isNew = false;

        if(typeof(arg) === "object") {

            this.studentData = arg;

        } else {

            var len = currentElement.childrenData.length;
            var found = false;

            for(var i = 0; i < len; i++) {
                
                if(currentElement.childrenData[i].studentID === arg) {

                    this.studentData = currentElement.childrenData[i];
                    found = true;
                    break;

                }

            }
            
            if(!found) return;

        }

        document.getElementById("modeFlagStyles").innerHTML = ".modeFlag_edit { display: inline; }";

        var nameElement = document.getElementById("editStudentDialog_lastName");

        nameElement.value = this.studentData.lastName;
        nameElement.classList.remove("error");
        nameElement.classList.remove("warning");

        nameElement = document.getElementById("editStudentDialog_firstName");

        nameElement.value = this.studentData.firstName || "";
        nameElement.classList.remove("error");
        nameElement.classList.remove("warning");

        document.getElementById("editStudentDialog_gender").value = this.studentData.gender || "";

        if(this.studentData.notes === null) {
            
            document.getElementById("editStudentDialog_with_notes").checked = false;
            document.getElementById("editStudentDialog_notes").value = "";

        } else {
            
            document.getElementById("editStudentDialog_with_notes").checked = true;
            document.getElementById("editStudentDialog_notes").value = this.studentData.notes;

        }

        this.updateCheckbox("notes");

        if(this.studentData.userName === null) {
            
            document.getElementById("editStudentDialog_with_userName").checked = false;
            document.getElementById("editStudentDialog_userName").value = "";

        } else {
            
            document.getElementById("editStudentDialog_with_userName").checked = true;
            document.getElementById("editStudentDialog_userName").value = this.studentData.userName;

        }

        this.updateCheckbox("userName");

        document.getElementById("editStudentDialog_OKButton").classList.remove("deactivated");

        this.updateWarnings();
        this.updateErrors();

        this.show();

    };

    editStudentDialog.openAdd = function() {

        this.errors = { name: false };
        this.warnings = {};
        this.isNew = true;

        this.studentData = { userName: null };

        document.getElementById("modeFlagStyles").innerHTML = ".modeFlag_add { display: inline; }";

        var nameElement = document.getElementById("editStudentDialog_lastName");

        nameElement.value = "";
        nameElement.classList.remove("error");
        nameElement.classList.remove("warning");

        nameElement = document.getElementById("editStudentDialog_firstName");

        nameElement.value = "";
        nameElement.classList.remove("error");
        nameElement.classList.remove("warning");

        document.getElementById("editStudentDialog_gender").value = "";

        document.getElementById("editStudentDialog_notes").value = "";

        this.updateCheckbox("notes");

        document.getElementById("editStudentDialog_userName").value = "";

        this.updateCheckbox("userName");

        document.getElementById("editStudentDialog_OKButton").disabled = false;

        this.updateWarnings();
        this.updateErrors(true);

        this.show();

    };

    editStudentDialog.check = function(ID, printAll = true, callErrorUpdate = true) {

        if(ID === undefined) {

            var checkAll = true;

        } else {

            var checkAll = false;

        }

        if(checkAll || ID === "name") {
            
            var lastNameElement = document.getElementById("editStudentDialog_lastName");
            var firstNameElement = document.getElementById("editStudentDialog_firstName");

            var localError = false;

            if(lastNameElement.value.trim() === "") {

                this.errors.name = printAll ? "Der Nachname des Schülers muss angegeben werden." : false;
                localError = printAll || undefined;

                if(printAll) {

                    lastNameElement.classList.add("error");

                }

            } else if(lastNameElement.value.length >= MAX_LENGTH_NAME) {

                this.errors.name = "Der Nachname muss weniger als " + MAX_LENGTH_NAME + " Zeichen lang sein.";
                lastNameElement.classList.add("error");
                localError = true;

            }

            if(firstNameElement.value.length >= MAX_LENGTH_NAME) {

                this.errors.name = "Der Vorname muss weniger als " + MAX_LENGTH_NAME + " Zeichen lang sein.";
                firstNameElement.classList.add("error");
                localError = true;

            }

            delete this.warnings.name;

            lastNameElement.classList.remove("warning");
            firstNameElement.classList.remove("warning");

            if(!localError) {

                delete this.errors.name;

                lastNameElement.classList.remove("error");
                firstNameElement.classList.remove("error");

                if(localError === false) {

                    var firstName = firstNameElement.value.trim() || null;
                    var lastName = lastNameElement.value || null;

                    var nameAlreadyExists = false;

                    var siblingData = currentElement.childrenData;
                    var studentID = this.studentData.studentID;

                    for(var i = 0; i < siblingData.length; i++) {

                        var currentSibling = siblingData[i];

                        if(this.isNew || currentSibling.studentID !== studentID) {

                            if(currentSibling.lastName === lastName && currentSibling.firstName === firstName) {

                                var nameAlreadyExists = true;
                                break;

                            }

                        }

                    }

                    if(nameAlreadyExists) {

                        this.warnings.name = "Es existiert bereits ein/e Schüler/in mit diesem Namen.";

                        lastNameElement.classList.add("warning");

                        if(firstName !== null) {

                            firstNameElement.classList.add("warning");

                        }

                    }

                }

            }

        }

        if(checkAll || ID === "userName") {
            
            var element = document.getElementById("editStudentDialog_userName");

            if(element.value.trim() === "") {

                element.classList.remove("error");

                delete this.errors.userName;
                this.needsNameCheck = false;

            } else if(element.value.toLowerCase() === user.userName.toLowerCase()) {
                
                element.classList.add("error");

                this.errors.userName = "Man kann sich nicht selbst hinzufügen.";
                this.needsNameCheck = false;
                
            } else {

                var found = false;
                var userName = element.value.toLowerCase();

                var siblingData = currentElement.childrenData;
                var studentID = this.studentData.studentID;

                for(var i = 0; i < siblingData.length; i++) {

                    var currentSibling = siblingData[i];

                    if(this.isNew || currentSibling.studentID !== studentID) {

                        if(currentSibling.userName !== null && currentSibling.userName.toLowerCase() === userName) {

                            found = true;
                            element.classList.add("error");

                            this.errors.userName = "Dieses Benutzerkonto gehört einem anderen Schüler / einer anderen Schülerin.";
                            this.needsNameCheck = false;

                            break;

                        }

                    }

                }
                
                if(!found) {

                    if(this.studentData.userName === null || userName !== this.studentData.userName.toLowerCase()) {

                        this.errors.userName = false;
                        this.needsNameCheck = true;

                    } else {

                        delete this.errors.userName;
                        element.classList.remove("error");
                        this.needsNameCheck = false;

                    }

                }

            }

        }

        if(checkAll || ID === "notes") {

            this.checkNotes();

        }

        if(callErrorUpdate) {

            this.updateWarnings();
            return this.updateErrors(this.isNew);

        }

    };

    editStudentDialog.checkUserNameExistance = function() {

        this.needsNameCheck = false;

        var requestObj = { userName: document.getElementById("editStudentDialog_userName").value };

        this.nameCheckRequest = loadData("/phpScripts/checkUserName", requestObj, function(data) {

            if(data.result) {

                document.getElementById("editStudentDialog_userName").classList.remove("error");
                delete editStudentDialog.errors.userName;

            } else {

                document.getElementById("editStudentDialog_userName").classList.add("error");
                editStudentDialog.errors.userName = "Es gibt kein Konto mit diesem Benutzernamen oder es darf nicht ausgewählt werden.";

            }

            editStudentDialog.updateErrors(editStudentDialog.isNew);

        }, function() {

            document.getElementById("editStudentDialog_userName").classList.add("error");
            editStudentDialog.errors.userName = "Beim Überprüfen des Benutzernamens ist ein Fehler aufgetreten.";

            editStudentDialog.updateErrors(editStudentDialog.isNew);

        });

    };

    editStudentDialog.userNameInput = function() {
        
        if(this.nameCheckRequest !== undefined) {

            this.nameCheckRequest.abort();
            this.nameCheckRequest = undefined;

        }

        if(this.nameCheckTimeoutID !== undefined) {

            clearTimeout(this.nameCheckTimeoutID);
            this.nameCheckTimeoutID = undefined;

        }

        this.check("userName");

        if(this.needsNameCheck) {

            this.nameCheckTimeoutID = setTimeout(this.checkUserNameExistance.bind(this), 1000);

        }

    };

    editStudentDialog.userNameChange = function() {
        
        if(this.nameCheckTimeoutID !== undefined) {

            clearTimeout(this.nameCheckTimeoutID);
            this.nameCheckTimeoutID = undefined;

        }

        if(this.needsNameCheck) {

            this.checkUserNameExistance();

        }

    };

    editStudentDialog.updateUserNameCheckbox = function() {

        if(document.getElementById("editStudentDialog_with_userName").checked) {

            document.getElementById("editStudentDialog_userName").style.display = "inline";

            this.userNameInput();

        } else {

            document.getElementById("editStudentDialog_userName").style.display = "none";

            delete this.errors.userName;
            
            this.needsNameCheck = false;

            if(this.nameCheckRequest !== undefined) {

                this.nameCheckRequest.abort();
                this.nameCheckRequest = undefined;

            }

            if(this.nameCheckTimeoutID !== undefined) {

                clearTimeout(this.nameCheckTimeoutID);
                this.nameCheckTimeoutID = undefined;

            }

            this.updateErrors(this.isNew);

        }

    }

    editStudentDialog.close = function() {

        this.needsNameCheck = false;
        this.studentData = undefined;

        if(this.nameCheckRequest !== undefined) {

            this.nameCheckRequest.abort();
            this.nameCheckRequest = undefined;

        }

        if(this.nameCheckTimeoutID !== undefined) {

            clearTimeout(this.nameCheckTimeoutID);
            this.nameCheckTimeoutID = undefined;

        }

        this.hide();

    };

    editStudentDialog.save = function() {
        
        if((this.isNew && !this.check("name")) || Object.keys(this.errors).length > 0) {

            return;

        }

        var properties = {};

        properties.lastName = document.getElementById("editStudentDialog_lastName").value;

        var firstName = document.getElementById("editStudentDialog_firstName").value;
        if(firstName.trim() !== "") {
            properties.firstName = firstName;

        }

        var gender = document.getElementById("editStudentDialog_gender").value;
        if(gender !== "") {
            properties.gender = gender;
        }


        if(document.getElementById("editStudentDialog_with_userName").checked) {

            var userName = document.getElementById("editStudentDialog_userName").value;

            if(userName.trim() !== "") {
                properties.userName = userName;
            }

        }

        if(document.getElementById("editStudentDialog_with_notes").checked) {
            var notes = document.getElementById("editStudentDialog_notes").value;

            if(notes.trim() !== "") {
                properties.notes = notes;
            }

        }

        if(this.isNew) {

            this.saveAdd(properties);

        } else {

            this.saveEdit(properties);

        }

    };

    editStudentDialog.saveAdd = function(properties) {
        
        properties.classID = currentElement.data.classID;

        loadData("/phpScripts/create/createStudent.php", properties, function(result) {

            properties.studentID = result.newID;

            currentElement.childrenData.push(properties);

            cache.tests = [];
            cache.semesters = [];

            hidePanelsAndPrint();

        }, function(errorCode) {

            showErrorMessage(TEXT_ERROR_NO_CHANGE + errorCode, true);

        });

        if(properties.firstName === undefined) properties.firstName = null;
        if(properties.userName === undefined) properties.userName = null;
        if(properties.gender === undefined) properties.gender = null;
        if(properties.notes === undefined) properties.notes = null;
        
        properties.isHidden = 0;
        properties.deleteTimestamp = null;

        delete properties.templateID;
        delete properties.permissions;

        Loading.show(null, "semi-transparent");

        this.close();

    };

    editStudentDialog.saveEdit = function(properties) {

        var changedProperties = {};
        var studentData = this.studentData;

        if(properties.lastName !== this.studentData.lastName) changedProperties.lastName = properties.lastName;

        if(this.studentData.firstName === null) {
            if(properties.firstName !== undefined) {
                changedProperties.firstName = properties.firstName;
            }
        } else if(this.studentData.firstName !== properties.firstName) {
            changedProperties.firstName = properties.firstName || null;
        }

        if(this.studentData.userName === null) {
            if(properties.userName !== undefined) {
                changedProperties.userName = properties.userName;
            }
        } else if(this.studentData.userName !== properties.userName) {
            changedProperties.userName = properties.userName || null;
        }

        if(this.studentData.gender === null) {
            if(properties.gender !== undefined) {
                changedProperties.gender = properties.gender;
            }
        } else if(this.studentData.gender !== properties.gender) {
            changedProperties.gender = properties.gender || null;
        }

        if(this.studentData.notes === null) {
            if(properties.notes !== undefined) {
                changedProperties.notes = properties.notes;
            }
        } else if(this.studentData.notes !== properties.notes) {
            changedProperties.notes = properties.notes || null;
        }

        if(Object.keys(changedProperties).length <= 0) {

            this.close();
            return;

        }

        changedProperties.studentID = this.studentData.studentID;
        
        loadData("/phpScripts/edit/editStudent.php", [ changedProperties ], function(result) {

            cache.semesters = [];
            cache.tests = [];

            assignProperties(studentData, changedProperties);

            if(studentInfoDialog.isVisible()) {

                studentInfoDialog.printInfo();
                Loading.hide(studentInfoDialog.dialogElement);
    
            }

            hidePanelsAndPrint();

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

        if(studentInfoDialog.isVisible()) {

            Loading.show(studentInfoDialog.dialogElement);

        } else {

            Loading.show(null, "semi-transparent");

        }

        this.close();

    };




    editStudentMarkDialog.open = function(arg) {

        this.errors = {};

        if(typeof(arg) === "object") {

            this.studentData = arg;

        } else {

            var students = currentElement.data.students;
            var len = students.length;
            var found = false;

            for(var i = 0; i < len; i++) {
                
                if(students[i].studentID === arg) {

                    this.studentData = students[i];
                    found = true;
                    break;

                }

            }
            
            if(!found) return;

        }

        var currentMarkData = markData[this.studentData.studentID];

        document.getElementById("editStudentMarkDialog_with_notes").checked = true;

        if(currentMarkData && currentMarkData.notes !== undefined) {
            
            document.getElementById("editStudentMarkDialog_notes").value = currentMarkData.notes;

        } else {
            
            document.getElementById("editStudentMarkDialog_notes").value = this.studentData.studentNotes || "";

        }

        this.updateCheckbox("notes");

        var isTest = !currentElement.isFolder && currentElement.data.referenceState === null;

        if(
            isTest && 
            (
                currentElement.data.round === null || 
                currentElement.data.formula !== null
            )
        ) {
            // Punkte bearbeitbar

            if(currentMarkData && currentMarkData.points !== undefined) {

                document.getElementById("editStudentMarkDialog_points").value = currentMarkData.points;

            } else {

                document.getElementById("editStudentMarkDialog_points").value = this.studentData.points ? Number(this.studentData.points) : "";

            }

            document.getElementById("editStudentMarkDialog_pointsContainer").style.display = "inline-block";

            this.check("points", true, false);


        } else {

            document.getElementById("editStudentMarkDialog_pointsContainer").style.display = "none";

        }

        if(
            currentElement.data.round !== null && 
            (
                (isTest && currentElement.data.formula === null) ||
                currentElement.data.formula === "manual"
            )
        ) {
            // Note bearbeitbar

            if(currentMarkData && currentMarkData.mark !== undefined) {

                document.getElementById("editStudentMarkDialog_mark").value = currentMarkData.mark;

            } else {

                document.getElementById("editStudentMarkDialog_mark").value = this.studentData.mark_unrounded != null ? Number(this.studentData.mark_unrounded) : (this.studentData.mark != null ? Number(this.studentData.mark) : "");

            }

            document.getElementById("editStudentMarkDialog_markContainer").style.display = "inline-block";

            this.check("mark", true, false);

        } else {

            document.getElementById("editStudentMarkDialog_markContainer").style.display = "none";

        }

        this.updateErrors();

        this.show();

    };

    editStudentMarkDialog.check = function(ID, printAll = true, callErrorUpdate = true) {

        if(ID === undefined) {

            var checkAll = true;

        } else {

            var checkAll = false;

        }

        var isTest = !currentElement.isFolder && currentElement.data.referenceState === null;
            
        if(checkAll || ID === "points") {

            if(
                isTest && 
                (
                    currentElement.data.round === null || 
                    currentElement.data.formula !== null
                )
            ) {
                // Punkte bearbeitbar

                var element = document.getElementById("editStudentMarkDialog_points");
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
                currentElement.data.round !== null && 
                (
                    (isTest && currentElement.data.formula === null) ||
                    currentElement.data.formula === "manual"
                )
            ) {
                // Note bearbeitbar

                var element = document.getElementById("editStudentMarkDialog_mark");
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

        if(checkAll || ID === "notes") {

            this.checkNotes();

        }

        if(callErrorUpdate) {

            return this.updateErrors(this.isNew);

        }

    };

    editStudentMarkDialog.close = function() {

        this.hide();

    };

    editStudentMarkDialog.save = function() {

        if(Object.keys(this.errors).length > 0) return;

        if(markData[this.studentData.studentID] === undefined) {

            var students = currentElement.data.students;
            var found = false;
            
            for(var i = 0; i < students.length; i++) {
    
                if(students[i].studentID === this.studentData.studentID) {
    
                    found = true;
    
                    markData[this.studentData.studentID] = {};
    
                }
    
            }
    
            if(!found) return;
    
        }

        var currentMarkData = markData[this.studentData.studentID];

        var isTest = !currentElement.isFolder && currentElement.data.referenceState === null;

        if(
            isTest && 
            (
                currentElement.data.round === null || 
                currentElement.data.formula !== null
            )
        ) {
            // Punkte bearbeitbar

            currentMarkData.points = document.getElementById("editStudentMarkDialog_points").value;
            currentMarkData.pointsError = false;

        }


        if(
            currentElement.data.round !== null && 
            (
                (isTest && currentElement.data.formula === null) ||
                currentElement.data.formula === "manual"
            )
        ) {
            // Note bearbeitbar

            currentMarkData.mark = document.getElementById("editStudentMarkDialog_mark").value;
            currentMarkData.markError = false;

        }

        if(document.getElementById("editStudentMarkDialog_with_notes").checked) {

            currentMarkData.notes = document.getElementById("editStudentMarkDialog_notes").value;

        } else {

            currentMarkData.notes = "";

        }

        if(!editMarks) {
            
            startMarkEdit();

        } else {

            hidePanelsAndPrint();

        }

        if(studentInfoDialog.isVisible()) {

            studentInfoDialog.printInfo();

        }

        this.close();

    };


    document.getElementById("classInfoDialog_closeButton")          .addEventListener("click", classInfoDialog.close.bind(classInfoDialog));
    document.getElementById("classInfoDialog_loadMoreButton")       .addEventListener("click", classInfoDialog.loadMore.bind(classInfoDialog));
    document.getElementById("classInfoDialog_visibilityButton")     .addEventListener("click", function() { changeVisibility(TYPE_CLASS, classInfoDialog.classData.classID); });
    document.getElementById("classInfoDialog_deleteButton")         .addEventListener("click", function() { deleteElement(TYPE_CLASS, classInfoDialog.classData.classID, true); });

    document.getElementById("studentInfoDialog_closeButton")        .addEventListener("click", studentInfoDialog.close.bind(studentInfoDialog));
    document.getElementById("studentInfoDialog_visibilityButton")   .addEventListener("click", function() { changeVisibility(TYPE_STUDENT, studentInfoDialog.studentData.studentID); });
    document.getElementById("studentInfoDialog_deleteButton")       .addEventListener("click", function() { deleteElement(TYPE_STUDENT, studentInfoDialog.studentData.studentID, true); });

    document.getElementById("editClassDialog_with_notes")           .addEventListener("change", editClassDialog.updateCheckbox.bind(editClassDialog, "notes"));
    document.getElementById("editClassDialog_name")                 .addEventListener("input",  editClassDialog.check.bind(editClassDialog, "name"));
    document.getElementById("editClassDialog_notes")                .addEventListener("input",  editClassDialog.check.bind(editClassDialog, "notes"));
    document.getElementById("editClassDialog_permissionsButton")    .addEventListener("click",  permissionsDialog.open.bind(permissionsDialog, TYPE_CLASS));
    document.getElementById("editClassDialog_cancelButton")         .addEventListener("click",  editClassDialog.close.bind(editClassDialog));
    document.getElementById("editClassDialog_OKButton")             .addEventListener("click",  editClassDialog.save.bind(editClassDialog));

    document.getElementById("editStudentDialog_userName")           .addEventListener("change", editStudentDialog.userNameChange.bind(editStudentDialog));
    document.getElementById("editStudentDialog_with_notes")         .addEventListener("change", editStudentDialog.updateCheckbox.bind(editStudentDialog, "notes"));
    document.getElementById("editStudentDialog_with_userName")      .addEventListener("change", editStudentDialog.updateUserNameCheckbox.bind(editStudentDialog));
    document.getElementById("editStudentDialog_lastName")           .addEventListener("input",  editStudentDialog.check.bind(editStudentDialog, "name"));
    document.getElementById("editStudentDialog_firstName")          .addEventListener("input",  editStudentDialog.check.bind(editStudentDialog, "name"));
    document.getElementById("editStudentDialog_userName")           .addEventListener("input",  editStudentDialog.userNameInput.bind(editStudentDialog));
    document.getElementById("editStudentDialog_notes")              .addEventListener("input",  editStudentDialog.check.bind(editStudentDialog, "notes"));
    document.getElementById("editStudentDialog_cancelButton")       .addEventListener("click",  editStudentDialog.close.bind(editStudentDialog));
    document.getElementById("editStudentDialog_OKButton")           .addEventListener("click",  editStudentDialog.save.bind(editStudentDialog));

    document.getElementById("editStudentMarkDialog_with_notes")     .addEventListener("change", editStudentMarkDialog.updateCheckbox.bind(editStudentMarkDialog, "notes"));
    document.getElementById("editStudentMarkDialog_notes")          .addEventListener("input",  editStudentMarkDialog.check.bind(editStudentMarkDialog, "notes"));
    document.getElementById("editStudentMarkDialog_points")         .addEventListener("input",  editStudentMarkDialog.check.bind(editStudentMarkDialog, "points"));
    document.getElementById("editStudentMarkDialog_mark")           .addEventListener("input",  editStudentMarkDialog.check.bind(editStudentMarkDialog, "mark"));
    document.getElementById("editStudentMarkDialog_cancelButton")   .addEventListener("click",  editStudentMarkDialog.close.bind(editStudentMarkDialog));
    document.getElementById("editStudentMarkDialog_OKButton")       .addEventListener("click",  editStudentMarkDialog.save.bind(editStudentMarkDialog));

    document.getElementById("classes_addClassButton")           .addEventListener("click", editClassDialog.openAdd.bind(editClassDialog));
    document.getElementById("classes_deletedButton")            .addEventListener("click", deleteDialog.loadAndOpen.bind(deleteDialog));

    document.getElementById("students_classInfoButton")         .addEventListener("click", classInfoDialog.open.bind(classInfoDialog));
    document.getElementById("students_editClassButton")         .addEventListener("click", editClassDialog.openEdit.bind(editClassDialog, undefined));
    document.getElementById("students_addStudentButton")        .addEventListener("click", editStudentDialog.openAdd.bind(editStudentDialog));
    document.getElementById("students_deletedButton")           .addEventListener("click", deleteDialog.loadAndOpen.bind(deleteDialog));

    document.getElementById("classes_visibilityButton")         .addEventListener("click", function() { changeHiddenVisibility(this, "classes"); });
    document.getElementById("students_visibilityButton")        .addEventListener("click", function() { changeHiddenVisibility(this, "students"); });
    document.getElementById("foreignClasses_visibilityButton")  .addEventListener("click", function() { changeHiddenVisibility(this, "foreignClasses"); });

    document.getElementById("tests_studentVisibilityButton")    .addEventListener("click", function() { changeHiddenVisibility(this, "studentMarks"); });
    document.getElementById("tests_studentMarkVisibiltyButton") .addEventListener("click", changeStudentMarkVisibility);
    document.getElementById("tests_editMarksButton")            .addEventListener("click", startMarkEdit);
    document.getElementById("tests_cancelButton")               .addEventListener("click", stopMarkEdit);
    document.getElementById("tests_OKButton")                   .addEventListener("click", saveMarkChanges);


});