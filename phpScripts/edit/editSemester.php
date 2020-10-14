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

*/

function editSemester(Semester $semester, array &$data) : bool {
    
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

        if($semester->data["isFolder"] || !is_null($semester->data["referenceID"]) || !is_array($data["permissions"])) {

            return false;
    
        }
        
        include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updatePermissions.php");

        if(!updatePermissions($semester, $data["permissions"])) {

            return false;

        }

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