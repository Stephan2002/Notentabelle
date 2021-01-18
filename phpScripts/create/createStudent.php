<?php

/*
Schueler erstellen.

Input als JSON per POST bestehend aus Objekt (nur ein neues Element kann erstellt werden): 
    classID
    Alle Daten, die es fuer die Erstellung des Schuelers braucht (*: Darf NULL sein | ?: muss nicht angegeben werden):
        lastName
        isHidden? (default: false)
        firstName?*
        gender*?
        notes?*
        userName?*

*/

function createStudent(StudentClass $class, array &$data, int $userID) : array {
    
    global $mysqli;

    $properties = array();
    $changes = true;


    if(isset($data["lastName"])) {

        if(!is_string($data["lastName"]) || $data["lastName"] === "" || strlen($data["lastName"]) >= MAX_LENGTH_NAME) {

            return array("error" => ERROR_BAD_INPUT);

        }

        $properties["lastName"] = $data["lastName"];

    } else {

        return array("error" => ERROR_MISSING_INPUT);

    }


    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return array("error" => ERROR_BAD_INPUT);

        }
        
        $properties["isHidden"] = (int)$data["isHidden"];

    } else {

        $properties["isHidden"] = 0;

    }


    if(isset($data["firstName"]) && $data["firstName"] !== "") {

        if((!is_string($data["firstName"]) && !is_null($data["firstName"])) || strlen($data["firstName"]) >= MAX_LENGTH_NAME) {

            return array("error" => ERROR_BAD_INPUT);

        }

        $properties["firstName"] = $data["firstName"];

    }


    if(isset($data["gender"])) {

        if($data["gender"] !== "m" && $data["gender"] !== "f" && $data["gender"] !== "d") {

            return array("error" => ERROR_BAD_INPUT);

        }

        $properties["gender"] = $data["gender"];

    }


    if(isset($data["notes"]) && $data["notes"] !== "") {

        if((!is_string($data["notes"]) && !is_null($data["notes"])) || strlen($data["notes"]) >= MAX_LENGTH_NOTES) {

            return array("error" => ERROR_BAD_INPUT);

        }

        $properties["notes"] = $data["notes"];

    }


    if(isset($data["userName"])) {

        if(!is_string($data["userName"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        $stmt = $mysqli->prepare("SELECT userID FROM users WHERE userName = ? AND NOT EXISTS(SELECT 1 FROM students WHERE students.classID = ? AND students.userID = users.userID) AND users.status != \"demo\" AND users.deleteTimestamp IS NULL");
        $stmt->bind_param("si", $data["userName"], $class->data["classID"]);
        $stmt->execute();

        $result = $stmt->get_result()->fetch_row();
        
        if($result === null || $result[0] === $userID) {

            return array("error" => ERROR_UNSUITABLE_INPUT);

        }

        $properties["userID"] = $result[0];

    }


    $properties["classID"] = $class->data["classID"];

    
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

    $stmt = $mysqli->prepare("INSERT INTO students (" . $queryFragment_keys . ") VALUES (" . $queryFragment_values . ")");

    $stmt->bind_param($parameterTypes, ...array_values($properties));
    $stmt->execute();

    $newID = $mysqli->query("SELECT LAST_INSERT_ID()")->fetch_row()[0];

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


if(isset($data["classID"])) { 
        
    if(!is_int($data["classID"])) {

        throwError(ERROR_BAD_INPUT);
    
    }

    $class = getClass($data["classID"], $_SESSION["userid"], $_SESSION["isTeacher"]);

} else {

    throwError(ERROR_MISSING_INPUT);

}

if($class->error !== ERROR_NONE) {

    throwError($class->error);

}

$errorAndChanges = createStudent($class, $data, $_SESSION["userid"]);

if($errorAndChanges["error"] !== ERROR_NONE) {

    throwError($errorAndChanges["error"]);

}

sendResponse($errorAndChanges["changes"], ERROR_NONE, NULL, $errorAndChanges["newID"]);


?>