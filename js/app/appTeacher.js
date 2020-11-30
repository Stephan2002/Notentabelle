// Javascript fuer app.php bei Lehrpersonen (mit Klassen und Schuelern)

cache.classes = [];
cache.rootClasses = undefined;

additionalInfo.classes = [];

var classInfoDialog;
var studentInfoDialog;

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

document.addEventListener("DOMContentLoaded", function() {

    classInfoDialog = new Dialog(document.getElementById("classInfoDialog"), false, false, undefined, function() { classInfoDialog.close(); });
    studentInfoDialog = new Dialog(document.getElementById("studentInfoDialog"), false, false, undefined, function() { studentInfoDialog.close(); });

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

        document.getElementById("classInfoDialog_name").innerHTML = escapeHTML(this.classData.name);
        document.getElementById("classInfoDialog_isHiddenIcon").src = "/img/" + (this.classData.isHidden ? "checked.svg" : "cross.svg");

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
        var action2Button = document.getElementById("classInfoDialog_action2Button");

        if(this.classData.referenceID === null) {

            action2Button.style.display = "inline-block";

            actionButton.classList.remove("button_big");
            actionButton.classList.add("button_medium");

        } else {

            action2Button.style.display = "none";

            actionButton.classList.remove("button_medium");
            actionButton.classList.add("button_big");

        }
    
        if(currentElement.accessType === ACCESS_OWNER) {

            loadMoreButton.classList.remove("button_big");
            loadMoreButton.classList.add("button_medium");

            visibilityButton.style.display = "inline-block";

            document.getElementById("classInfoDialog_controlButtons").style.display = "block";

        } else {

            loadMoreButton.classList.remove("button_medium");
            loadMoreButton.classList.add("button_big");

            visibilityButton.style.display = "none";

            document.getElementById("classInfoDialog_controlButtons").style.display = "none";

            loadMoreButton.style.display = "none";

        }

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
                                "<td><img src=\"/img/" + (currentPermission.writingPermission ? "edit_black.svg" : "view.svg") + "\"></td>" +
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

            loadMoreButton.innerHTML = "<img src=\"/img/info.svg\">Mehr laden";
            loadMoreButton.disabled = false;
            loadMoreButton.style.display = "inline-block";

            visibilityButton.classList.remove("button_big");
            visibilityButton.classList.add("button_medium");

        }

    }

    classInfoDialog.loadMore = function() {

        var loadMoreButton = document.getElementById("classInfoDialog_loadMoreButton");

        loadMoreButton.innerHTML = "<img src=\"/img/loading.svg\">Laden...";
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

            } else {

                genderString = "weiblich";

            }

            document.getElementById("studentInfoDialog_gender").innerHTML = genderString;
            document.getElementById("studentInfoDialog_genderContainer").style.display = "table-row";

        }

        document.getElementById("studentInfoDialog_isHiddenIcon").src = "/img/" + (this.studentData.isHidden ? "checked.svg" : "cross.svg");

        var editButton = document.getElementById("studentInfoDialog_editButton");
        var deleteButton = document.getElementById("studentInfoDialog_deleteButton");
        var visibilityButton = document.getElementById("studentInfoDialog_visibilityButton");

        if(!asMarkInfo) {

            if(this.studentData.userName === null) {

                document.getElementById("studentInfoDialog_userNameContainer").style.display = "none";

            } else {

                document.getElementById("studentInfoDialog_userName").innerHTML = escapeHTML(this.studentData.userName);
                document.getElementById("studentInfoDialog_userNameContainer").style.display = "table";

            }

            if(this.studentData.notes === null) {

                document.getElementById("studentInfoDialog_notesContainer").style.display = "none";

            } else {

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

                document.getElementById("studentInfoDialog_notesContainer").style.display = "block";
                document.getElementById("studentInfoDialog_notes").innerHTML = escapeHTML(this.studentData.studentNotes);

            }

            document.getElementById("studentInfoDialog_pointsContainer").style.display = "none";
            document.getElementById("studentInfoDialog_averageContainer").style.display = "none";
            document.getElementById("studentInfoDialog_markContainer").style.display = "none";
            document.getElementById("studentInfoDialog_plusPointsContainer").style.display = "none";

            if(currentElement.isRoot) {

                document.getElementById("studentInfoDialog_averageContainer").style.display = "table-row";
                document.getElementById("studentInfoDialog_plusPointsContainer").style.display = "table-row";

                document.getElementById("studentInfoDialog_average").innerHTML = formatNumber(this.studentData.mark_unrounded, "-");
                document.getElementById("studentInfoDialog_plusPoints").innerHTML = formatNumber(this.studentData.plusPoints, "-");

            } else if(currentElement.data.formula !== null) {

                document.getElementById("studentInfoDialog_pointsContainer").style.display = "table-row";
                document.getElementById("studentInfoDialog_markContainer").style.display = "table-row";

                document.getElementById("studentInfoDialog_points").innerHTML = formatNumber(this.studentData.points, "-");
                document.getElementById("studentInfoDialog_mark").innerHTML = formatNumber(this.studentData.mark, "-");

            } else if(currentElement.data.round === null) {

                document.getElementById("studentInfoDialog_pointsContainer").style.display = "table-row";
                document.getElementById("studentInfoDialog_points").innerHTML = formatNumber(this.studentData.points, "-");

            } else if(currentElement.data.round == 0) {

                document.getElementById("studentInfoDialog_markContainer").style.display = "table-row";
                document.getElementById("studentInfoDialog_mark").innerHTML = formatNumber(this.studentData.mark, "-");

            } else {

                document.getElementById("studentInfoDialog_averageContainer").style.display = "table-row";
                document.getElementById("studentInfoDialog_markContainer").style.display = "table-row";

                document.getElementById("studentInfoDialog_average").innerHTML = formatNumber(this.studentData.mark_unrounded, "-");
                document.getElementById("studentInfoDialog_mark").innerHTML = formatNumber(this.studentData.mark, "-");

            }

            document.getElementById("studentInfoDialog_markAndPointsContainer").style.display = "table";

            editButton.classList.remove("button_medium");
            editButton.classList.add("button_big");

            deleteButton.style.display = "none";

        }

        if(currentElement.writingPermission) {

            document.getElementById("studentInfoDialog_controlButtons").style.display = "block";

            if(!asMarkInfo) {

                visibilityButton.style.display = "inline-block";

            } else {

                visibilityButton.style.display = "none";

            }

        } else {

            visibilityButton.style.display = "none";
            document.getElementById("studentInfoDialog_controlButtons").style.display = "none";

        }

        this.show();

    };

    studentInfoDialog.close = function() {

        this.studentData = undefined;
        this.hide();

    };


    document.getElementById("classInfoDialog_closeButton").addEventListener("click", classInfoDialog.close.bind(classInfoDialog));
    document.getElementById("classInfoDialog_loadMoreButton").addEventListener("click", classInfoDialog.loadMore.bind(classInfoDialog));

    document.getElementById("studentInfoDialog_closeButton").addEventListener("click", studentInfoDialog.close.bind(studentInfoDialog));

    document.getElementById("students_classInfoButton").addEventListener("click", classInfoDialog.open.bind(classInfoDialog));

});