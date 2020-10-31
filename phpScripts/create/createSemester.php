<?php

/*

Semester oder Semesterordner erstellen

Input als JSON per POST bestehend aus Objekt (nur ein neues Element kann erstellt werden):
    parentID (falls nicht angegeben: In Hauptordner)
    isTemplate (falls Vorlage im Vorlagenhauptordner erstellt werden sollte)
    Alle Daten, die es fuer die Erstellung eines Semesters/Semesterordners braucht (*: Darf NULL sein | ?: muss nicht angegeben werden):
        isFolder
        templateType?* (darf nur gesetzt werden, falls isFolder false; falls in Vorlagenordner)
        classID?* (darf nur gesetzt werden, falls kein isFolder false und templateType NULL / unset)
        isHidden? (default: false)
        name
        notes?*
        referenceID?* (falls isFolder false, templateType NULL und classID NULL; NULL: keine Referenz)
        referenceTestID?* (falls isFolder false, templateType NULL und classID NULL)
        templateID? (falls templateType NULL / unset)
        copyTeachersID? (falls classID gesetzt)
        permissions* (falls isFolder false und referenceID NULL): Array aus Objekten mit:
            userName
            writingPermission

Bei Fehlern wird nichts hinzugefuegt


*/

function createSemester(Semester $semesterFolder, array &$data, int $userID, bool $isTeacher) : array {
    
    global $mysqli;

    if($semesterFolder->error !== ERROR_NONE) {

        return array("error" => $semesterFolder->error);

    }

    $properties = array();
    $changes = false;

    if(array_key_exists("isFolder", $data)) {
        
        if(!is_bool($data["isFolder"])) {

            return array("error" => ERROR_BAD_INPUT);

        }
        
        $properties["isFolder"] = (int)$data["isFolder"];

    } else {
        
        return array("error" => ERROR_MISSING_INPUT);

    }


    if(isset($data["templateType"])) {
        
        if($data["templateType"] !== "subjectTemplate" && $data["templateType"] !== "semesterTemplate") {

            return array("error" => ERROR_BAD_INPUT);

        }

        if(!$semesterFolder->isTemplate) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        } else {

            $properties["templateType"] = $data["templateType"];

        }
        
        $properties["templateType"] = $data["templateType"];

    } else {

        if($semesterFolder->isTemplate) {
            
            return array("error" => ERROR_MISSING_INPUT);

        } else {

            $properties["templateType"] = NULL;

        }

    }


    if(isset($data["classID"])) {

        if(!is_int($data["classID"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($properties["isFolder"] || !is_null($properties["templateType"])) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

        if(!$isTeacher) {

            return array("error" => ERROR_ONLY_TEACHER);

        }

        $properties["classID"] = $data["classID"];

    } else {

        $properties["classID"] = NULL;

    }


    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return array("error" => ERROR_BAD_INPUT);

        }
        
        $properties["isHidden"] = (int)$data["isHidden"];

    } else {

        $properties["isHidden"] = 0;

    }


    if(isset($data["name"])) {

        if(!is_string($data["name"]) || $data["name"] === "" || strlen($data["name"]) >= 64) {

            return array("error" => ERROR_BAD_INPUT);

        }

        $properties["name"] = $data["name"];

    } else {

        return array("error" => ERROR_MISSING_INPUT);

    }


    if(isset($data["notes"]) && $data["notes"] !== "") {

        if((!is_string($data["notes"]) && !is_null($data["notes"])) || strlen($data["notes"] >= 256)) {

            return array("error" => ERROR_BAD_INPUT);

        }

        $properties["notes"] = $data["notes"];

    } else {

        $properties["notes"] = NULL;

    }


    if(isset($data["referenceID"])) {

        if(!is_int($data["referenceID"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($properties["isFolder"] || $properties["classID"] !== NULL || $properties["templateType"] !== NULL) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

        $properties["referenceID"] = $data["referenceID"];

    } else {

        $properties["referenceID"] = NULL;

    }
    

    if(isset($data["referenceTestID"])) {

        if(!is_int($data["referenceTestID"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($properties["referenceID"] === NULL) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

        $properties["referenceTestID"] = $data["referenceTestID"];

    } else {

        $properties["referenceTestID"] = NULL;

    }


    if(isset($data["templateID"])) {

        if(!is_int($data["templateID"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($properties["templateType"] !== NULL) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

    }


    if(isset($data["copyTeacherID"])) {

        if(!is_int($data["copyTeacherID"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($properties["classID"] === NULL) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

    }


    if(isset($data["permissions"])) {

        $userNames = array();

        foreach($data["permissions"] as &$currentPermission) {

            if(!is_array($currentPermission)) {
    
                return array("error" => ERROR_BAD_INPUT);
    
            }
    
            if(!isset($currentPermission["userName"]) || !array_key_exists("writingPermission", $currentPermission)) {
    
                return array("error" => ERROR_MISSING_INPUT);
    
            }
    
            if(!is_string($currentPermission["userName"]) || !is_bool($currentPermission["writingPermission"])) {
    
                return array("error" => ERROR_BAD_INPUT);
    
            }
    
            $currentPermission["userName"] = strtolower($currentPermission["userName"]);
    
            if(isset($userNames[$currentPermission["userName"]])) {
    
                return array("error" => ERROR_UNSUITABLE_INPUT);
    
            }
    
            $userNames[$currentPermission["userName"]] = true;

        }

        $stmt = $mysqli->prepare("SELECT userID, type FROM users WHERE userName = ? AND deleteTimestamp IS NULL");

        foreach($data["permissions"] as &$currentPermission) {
            
            $stmt->bind_param("s", $currentPermission["userName"]);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_assoc();

            if(is_null($result)) {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

            if($properties["classID"] !== NULL && $result["type"] !== "teacher" && $result["type"] !== "admin") {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

            if($result["userID"] === $userID) {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

            $currentPermission["userID"] = $result["userID"];

        }

        $stmt->close();

    }

    
    if($properties["classID"] !== NULL) {

        $class = getClass($properties["classID"], $userID, true);

        if($class->error !== ERROR_NONE) {

            return array("error" => ERROR_UNSUITABLE_INPUT);

        }

    }

    if($properties["referenceID"] !== NULL) {

        $referenceSemester = getSemester($properties["referenceID"], $userID, $isTeacher);

        if($referenceSemester->error !== ERROR_NONE) {

            return array("error" => ERROR_UNSUITABLE_INPUT);

        }

    }
    
    if($properties["referenceTestID"] !== NULL) {

        $stmt = $mysqli->prepare("SELECT 1 FROM tests WHERE testID = ? AND semesterID = ?");
        $stmt->bind_param("ii", $properties["referenceTestID"], $properties["referenceID"]);
        $stmt->execute();
        
        if($stmt->get_result()->num_rows !== 1) {

            return array("error" => ERROR_UNSUITABLE_INPUT);

        }

        $stmt->close();

    }

    if(isset($data["templateID"])) {

        $templateSemester = getSemester($properties["templateID"], $userID, $isTeacher);

        if($templateSemester->error !== ERROR_NONE || !$templateSemester->isTemplate) {

            return array("error" => ERROR_UNSUITABLE_INPUT);

        }

    }

    if(isset($data["copyTeachersID"])) {

        $copyTeacherSemester = getSemester($properties["copyTeachersID"], $userID, $isTeacher);

        if(
            $copyTeacherSemester->error !== ERROR_NONE || 
            $copyTeacherSemester->data["classID"] === null || 
            $copyTeacherSemester->accessType === Element::ACCESS_TEACHER
        ) {

            return array("error" => ERROR_UNSUITABLE_INPUT);

        }

    }


    $properties["parentID"] = isset($semesterFolder->data["semesterID"]) ? $semesterFolder->data["semesterID"] : NULL;
    $properties["userID"] = $userID;

    
    $parameterTypes = "";
    $queryFragment_keys = implode(", ", array_keys($properties));
    $queryFragment_values = str_repeat("?, ", count($properties) - 1) . "?";

    foreach($properties as $value) {
        
        if(is_int($value)) {

            $parameterTypes .= "i";

        } else {

            $parameterTypes .= "s";

        }

    }

    $stmt = $mysqli->prepare("INSERT INTO semesters (" . $queryFragment_keys . ") VALUES (" . $queryFragment_values . ")");

    $stmt->bind_param($parameterTypes, ...array_values($properties));
    $stmt->execute();

    $newID = $mysqli->query("SELECT LAST_INSERT_ID()")->fetch_row()[0];


    if(isset($data["templateID"])) {

        // TODO: Vorlage benutzen

    }


    if(isset($data["copyTeachersID"])) {

        // TODO: Lehrer kopieren

    }


    if(isset($data["permissions"]) && !empty($data["permissions"])) {

        $arguments = array();
        $parameterTypes = str_repeat("i", count($data["permissions"]) * 3);
        $queryFragment = str_repeat("(?, ?, ?), ", count($data["permissions"]) - 1) . "(?, ?, ?)";

        foreach($data["permissions"] as &$currentPermission) {

            array_push($arguments, $newID, $currentPermission["userID"], $currentPermission["writingPermission"]);

        }

        $stmt->prepare("INSERT INTO permissions (semesterID, userID, writingPermission) VALUES " . $queryFragment);
        $stmt->bind_param($parameterTypes, ...$arguments);
        $stmt->execute();

    }

    $stmt->close();


    return array("error" => ERROR_NONE, "changes" => $changes, "newID" => $newID);

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


if(isset($data["parentID"])) { 
        
    if(!is_int($data["parentID"])) {

        throwError(ERROR_BAD_INPUT);
    
    }

    $semesterFolder = getSemester($data["parentID"], $_SESSION["userid"], $_SESSION["type"] === "admin" || $_SESSION["type"] === "admin");

} else {

    $semesterFolder = new Semester(ERROR_NONE, Element::ACCESS_OWNER, true);
    $semesterFolder->isRoot = true;

    if(isset($data["isTemplate"])) { 

        $semesterFolder->isTemplate = true;

    }

}

if($semesterFolder->error !== ERROR_NONE) {

    throwError($semesterFolder->error);

}

if($semesterFolder->accessType !== Element::ACCESS_OWNER) {

    throwError(ERROR_NO_WRITING_PERMISSION);

}

$errorAndChanges = createSemester($semesterFolder, $data, $_SESSION["userid"], $_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin");

if($errorAndChanges["error"] !== ERROR_NONE) {

    throwError($errorAndChanges["error"]);

}

sendResponse($errorAndChanges["changes"], ERROR_NONE, NULL, $errorAndChanges["newID"]);


?>