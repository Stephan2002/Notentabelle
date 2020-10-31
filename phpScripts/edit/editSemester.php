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

function editSemester(Semester $semester, array &$data) : array {
    
    global $mysqli;

    if($semester->error !== ERROR_NONE) {

        return array("error" => $semester->error);

    }

    $changedProperties = array();
    $changes = false;

    if(array_key_exists("name", $data)) {

        if(!is_string($data["name"]) || $data["name"] === "" || strlen($data["name"]) >= 64) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($data["name"] !== $semester->data["name"]) {

            $changedProperties["name"] = $data["name"];
            $semester->data["name"] = $data["name"];

        } 

    }

    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return array("error" => ERROR_BAD_INPUT);

        }
        
        if($data["isHidden"] != $semester->data["isHidden"]) {
            
            $changedProperties["isHidden"] = (int)$data["isHidden"];
            $semester->data["isHidden"] = (int)$data["isHidden"];

        }

    }

    if(array_key_exists("notes", $data)) {

        if((!is_string($data["notes"]) && !is_null($data["notes"])) || strlen($data["notes"] >= 256)) {

            return array("error" => ERROR_BAD_INPUT);

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

            return array("error" => ERROR_BAD_INPUT);

        }

        if(is_null($semester->data["templateType"])) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

        if($data["templateType"] !== $semester->data["templateType"]) {

            $changedProperties["templateType"] = $data["templateType"];
            $semester->data["tekplateType"] = $data["templateType"];

        }

    }

    if(array_key_exists("referenceTestID", $data)) {

        if(!is_null($data["referenceTestID"]) && !is_int($data["referenceTestID"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if(is_null($semester->data["referenceID"])) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

        if($data["referenceTestID"] !== NULL) {

            $stmt = $mysqli->prepare("SELECT 1 FROM tests WHERE testID = ? AND semesterID = ?");
            $stmt->bind_param("ii", $data["referenceTestID"], $test->data["semesterID"]);
            $stmt->execute();

            if($stmt->get_result()->num_rows !== 1) {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

            $stmt->close();

        }

        $changedProperties["referenceTestID"] = $data["referenceTestID"];
        $semester->data["referenceTestID"] = $data["referenceTestID"];

    }
    
    if(!empty($changedProperties)) {

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

        $changes = true;

    }

    
    if(array_key_exists("permissions", $data)) {

        if(!is_array($data["permissions"])) {

            return array("error" => ERROR_BAD_INPUT, "changes" => $changes);

        }

        if($semester->isFolder || !is_null($semester->data["referenceID"])) {

            return array("error" => ERROR_FORBIDDEN_FIELD, "changes" => $changes);
    
        }
        
        include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updatePermissions.php");

        $errorCode = updatePermissions($semester, $data["permissions"]);
        
        if($errorCode === ERROR_NONE) {

            if($changes === false) {

                $changes = true;

            }

        } elseif($errorCode !== INFO_NO_CHANGE) {

            return array("error" => $errorCode, "changes" => $changes);

        }

    }

    return array("error" => ERROR_NONE, "changes" => $changes);

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
        
        throwError(ERROR_MISSING_INPUT);

    }
        
    if(!is_int($currentSemesterData["semesterID"])) {

        throwError(ERROR_BAD_INPUT);
    
    }

}

$response = array();

foreach($data as $key => &$currentSemesterData) {

    $semester = getSemester($currentSemesterData["semesterID"], $_SESSION["userid"], $_SESSION["type"] === "admin" || $_SESSION["type"] === "admin");

    if($semester->error !== ERROR_NONE) {

        sendResponse($response, $semester->error, $key);

    }

    if($semester->accessType !== Element::ACCESS_OWNER) {

        sendResponse($response, ERROR_NO_WRTITING_PERMISSION, $key);

    }

    $errorAndChanges = editSemester($semester, $currentSemesterData);

    if(array_key_exists("changes", $errorAndChanges)) {

        $response[] = $errorAndChanges["changes"];

    }

    if($errorAndChanges["error"] !== ERROR_NONE) {

        sendResponse($response, $errorAndChanges["error"], $key);
        

    }

}

sendResponse($response);


?>