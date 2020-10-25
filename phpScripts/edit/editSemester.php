<?php

/*

Semester oder Semesterordner bearbeiten

Input als JSON per POST bestehend aus Array, jeweils mit:
    semesterID
    Alle Daten, die geaendert werden sollten (*: Darf NULL sein):
        name
        isHidden
        notes*
        templateType (bei Vorlagen)
        referenceTestID* (wenn referenceID gesetzt)

Bei Fehlern wird nichts geaendert, ausser bei Fehlern bei:
    permissions

*/

function editSemester(Semester $semester, array &$data) : int {
    
    global $mysqli;

    if($semester->error !== ERROR_NONE) {

        return $semester->error;

    }

    $changedProperties = array();

    if(array_key_exists("name", $data)) {

        if(!is_string($data["name"]) || strlen($data["name"]) >= 64) {

            return ERROR_BAD_INPUT;

        }

        if($data["name"] !== $semester->data["name"]) {

            $changedProperties["name"] = $data["name"];
            $semester->data["name"] = $data["name"];

        } 

    }

    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return ERROR_BAD_INPUT;

        }
        
        if($data["isHidden"] != $semester->data["isHidden"]) {
            
            $changedProperties["isHidden"] = (int)$data["isHidden"];
            $semester->data["isHidden"] = (int)$data["isHidden"];

        }

    }

    if(array_key_exists("notes", $data)) {

        if((!is_string($data["notes"]) && !is_null($data["notes"])) || strlen($data["notes"] >= 256)) {

            return ERROR_BAD_INPUT;

        }

        if($data["notes"] === "") {

            $data["notes"] = NULL;

        }

        if($data["notes"] != $semester->data["notes"]) {

            $changedProperties["notes"] = $data["notes"];
            $semester->data["notes"] = $data["notes"];

        }

    }

    if(array_key_exists("templateType", $data)) {

        if($data["templateType"] !== "semesterTemplate" && $data["templateType"] !== "subjectTemplate") {

            return ERROR_BAD_INPUT;

        }

        if(is_null($semester->data["templateType"])) {

            return ERROR_FORBIDDEN_FIELD;

        }

        if($data["templateType"] !== $semester->data["templateType"]) {

            $changedProperties["templateType"] = $data["templateType"];
            $semester->data["tekplateType"] = $data["templateType"];

        }

    }

    if(array_key_exists("referenceTestID", $data)) {

        if(!is_null($data["referenceTestID"]) && (!is_int($data["referenceTestID"]) || $data["referenceTestID"] <= 0)) {

            return ERROR_BAD_INPUT;

        }

        if(is_null($semester->data["referenceID"])) {

            return ERROR_FORBIDDEN_FIELD;

        }

        $changedProperties["referenceTestID"] = $data["referenceTestID"];
        $semester->data["referenceTestID"] = $data["referenceTestID"];

    }
    
    if(count($changedProperties) > 0) {

        $queryString = "UPDATE semesters SET ";
        $parameterTypes = "";

        foreach($changedProperties as $key => &$value) {

            $queryString .= $key . " = ?, ";
            
            if(is_int($value)) {

                $parameterTypes .= "i";

            } else {

                $parameterTypes .= "s";

            }

        }

        $queryString = substr($queryString, 0, -2);
        $queryString .= " WHERE semesterID = ?";
        $parameterTypes .= "i";

        $changedProperties[] = $semester->data["semesterID"];

        $stmt = $mysqli->prepare($queryString);

        $stmt->bind_param($parameterTypes, ...array_values($changedProperties));
        $stmt->execute();
        $stmt->close();

    }

    
    if(array_key_exists("permissions", $data)) {

        if(!is_array($data["permissions"])) {

            return ERROR_BAD_INPUT;

        }

        if($semester->isFolder || !is_null($semester->data["referenceID"])) {

            return ERROR_FORBIDDEN_FIELD;
    
        }
        
        include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updatePermissions.php");

        $errorCode = updatePermissions($semester, $data["permissions"]);
        
        if($errorCode !== ERROR_NONE) {

            return $errorCode;

        }

    }

    return ERROR_NONE;

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

    if(!isset($currentSemesterData["semesterID"])) { 

        throwError(ERROR_MISSING_INPUT, $key);

    }
        
    if(!is_int($currentSemesterData["semesterID"])) {

        throwError(ERROR_BAD_INPUT, $key);
    
    }

    $semester = getSemester($currentSemesterData["semesterID"], $_SESSION["userid"], $_SESSION["type"] === "admin" || $_SESSION["type"] === "admin");

    if($semester->error !== ERROR_NONE) {

        throwError(ERROR_FORBIDDEN, $key);

    }

    if($semester->accessType !== Element::ACCESS_OWNER) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorCode = editSemester($semester, $currentSemesterData);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode, $key);

    }

}

finish();


?>