<?php

/*

Semester oder Semesterordner bearbeiten

Input als JSON per POST bestehend aus Array, jeweils mit:
    semesterID
    Alle Daten, die geaendert werden sollten:
        name
        isHidden
        notes
        templateType (bei Vorlagen)
        referenceTestID (wenn referenceID gesetzt)
        templateSemesterID (zu verwendende Vorlage)

*/

function editSemester(Semester &$semester, array &$data) : bool {
    
    global $mysqli;

    if($semester->error !== ERROR_NONE) {

        return false;

    }

    $changedProperties = array();

    if(array_key_exists("name", $data)) {

        if(!is_string($data["name"]) || strlen($data["name"]) >= 64) {

            return false;

        }

        if($data["name"] !== $semester->data["name"]) {

            $changedProperties["name"] = $data["name"];

        } 

    }

    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return false;

        }
        
        if($data["isHidden"] != $semester->data["isHidden"]) {
            
            $changedProperties["isHidden"] = (int)$data["isHidden"];

        }

    }

    if(array_key_exists("notes", $data)) {

        if((!is_string($data["notes"]) && !is_null($data["notes"])) || strlen($data["notes"] >= 256)) {

            return false;

        }

        if($data["notes"] === "") {

            $data["notes"] = NULL;

        }

        if($data["notes"] != $semester->data["notes"]) {

            $changedProperties["notes"] = $data["notes"];

        }

    }

    if(array_key_exists("templateType", $data)) {

        if(is_null($semester->data["templateType"])) {

            return false;

        }

        if($data["templateType"] !== "semesterTemplate" && $data["templateType"] !== "subjectTemplate") {

            return false;

        }

        if($data["templateType"] !== $semester->data["templateType"]) {

            $changedProperties["templateType"] = $data["templateType"];

        }

    }

    if(array_key_exists("referenceTestID", $data)) {

        if(is_null($semester->data["referenceID"]) || !is_numeric($data["referenceTestID"])) {

            return false;

        }

        $stmt = $mysqli->prepare("SELECT testID FROM tests WHERE testID = ? AND deleteTimestamp IS NULL");
        $stmt->bind_param("i", $data["referenceTestID"]);
        $stmt->execute();

        if($stmt->get_result()->num_rows < 0) {

            $stmt->close();
            return false;

        }

        $stmt->close();

        $changedProperties["referenceTestID"] = (int)$data["referenceTestID"];

    }
    
    if(count($changedProperties) > 0) {

        $queryString = "UPDATE semesters SET ";
        $typeString = "";

        foreach($changedProperties as $key => &$value) {

            $queryString .= $key . " = ?, ";
            
            if(is_int($value)) {

                $typeString .= "i";

            } else {

                $typeString .= "s";

            }

        }

        $queryString = substr($queryString, 0, -2);
        $queryString .= " WHERE semesterID = ?";
        $typeString .= "i";

        $changedProperties[] = $semester->data["semesterID"];

        $stmt = $mysqli->prepare($queryString);

        $stmt->bind_param($typeString, ...array_values($changedProperties));
        $stmt->execute();
        $stmt->close();

    }

    
    if(array_key_exists("permissions", $data)) {
        
        if($semester->data["isFolder"] || !is_array($data["permissions"])) {

            return false;

        }

        $stmt = $mysqli->prepare("SELECT permissions.*, users.userName FROM permissions LEFT JOIN users ON permissions.userID = users.userID WHERE semesterID = ?");
        $stmt->bind_param("i", $semester->data["semesterID"]);
        $stmt->execute();

        $result = $stmt->get_result();
        $permissionData = array();

        while($currentRow = $result->fetch_assoc()) {

            if(isset($permissionData[$currentRow["userName"]])) {

                return false;

            }

            $permissionData[strtolower($currentRow["userName"])]["writingPermission"] = (bool)$currentRow["writingPermission"];
            $permissionData[strtolower($currentRow["userName"])]["userID"] = $currentRow["userID"];

        }

        $permissionsToAdd = array();
        $permissionsToChange = array();
        $permissionsToDelete = array();
        
        foreach($data["permissions"] as &$currentPermission) {

            if(!is_array($currentPermission) || !is_string($currentPermission["userName"]) || !array_key_exists("writingPermission", $currentPermission)) {

                return false;

            }

            $currentPermission["userName"] = strtolower($currentPermission["userName"]);
            
            if(array_key_exists($currentPermission["userName"], $permissionData)) {
                
                $currentPermission["userID"] = $permissionData[$currentPermission["userName"]]["userID"];

                if(is_null($currentPermission["writingPermission"])) {

                    $permissionsToDelete[] = $currentPermission;

                } else if($currentPermission["writingPermission"] !== $permissionData[$currentPermission["userName"]]["writingPermission"]) {

                    $permissionsToChange[] = $currentPermission;

                }

            } else {

                if(!is_null($currentPermission["writingPermission"])) {

                    $permissionsToAdd[] = $currentPermission;

                }

            }

        }
        
        if(!empty($permissionsToDelete)) {
            
            $stmt->prepare("DELETE FROM permissions WHERE semesterID = ? AND userID = ?");

            foreach($permissionsToDelete as &$currentPermission) {

                $stmt->bind_param("ii", $semester->data["semesterID"], $currentPermission["userID"]);
                $stmt->execute();

            }

        }

        if(!empty($permissionsToChange)) {

            $stmt->prepare("UPDATE permissions SET writingPermission = ? WHERE semesterID = ? AND userID = ?");

            foreach($permissionsToChange as &$currentPermission) {

                $stmt->bind_param("iii", $currentPermission["writingPermission"], $semester->data["semesterID"], $currentPermission["userID"]);
                $stmt->execute();

            }

        }

        if(!empty($permissionsToAdd)) {
            
            $stmt->prepare("SELECT userID, type FROM users WHERE userName = ?");

            foreach($permissionsToAdd as &$currentPermission) {
                
                $stmt->bind_param("s", $currentPermission["userName"]);
                $stmt->execute();

                $result = $stmt->get_result()->fetch_assoc();

                if(is_null($result["userID"])) {

                    return false;

                }

                if(!is_null($semester->data["classID"]) && $result["type"] !== "teacher" && $result["type"] !== "admin") {

                    return false;

                }

                if($result["userID"] === $semester->data["userID"]) {

                    return false;

                }

                $currentPermission["userID"] = $result["userID"];

            }

            $stmt->prepare("INSERT INTO permissions (semesterID, userID, writingPermission) VALUES (?, ?, ?)");

            foreach($permissionsToAdd as &$currentPermission) {

                $stmt->bind_param("iii", $semester->data["semesterID"], $currentPermission["userID"], $currentPermission["writingPermission"]);
                $stmt->execute();

            }

        }

        $stmt->close();

    }

    if(array_key_exists("templateSemesterID", $data)) {

        // Noch zu hinzufuegen

    }


    return true;

}

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

$data = getData();

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

if(!is_array($data)) {

    throwError(ERROR_BAD_INPUT);

}

foreach($data as $key => &$currentSemesterData) {

    if(!isset($currentSemesterData["semesterID"]) || !is_numeric($currentSemesterData["semesterID"])) {

        throwError(ERROR_BAD_INPUT, $key);    
    
    }

    $semester = getSemester((int)$currentSemesterData["semesterID"], $_SESSION["userid"], $_SESSION["type"] === "admin" || $_SESSION["type"] === "admin");

    if($semester->error !== ERROR_NONE) {

        throwError(ERROR_FORBIDDEN, $key);

    }

    if($semester->accessType !== Element::ACCESS_OWNER) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    if(!editSemester($semester, $currentSemesterData)) {

        throwError(ERROR_BAD_INPUT, $key);

    }

}

finish();


?>