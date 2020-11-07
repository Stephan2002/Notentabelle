<?php

/*

Erstellt neue Klasse

Input als JSON per POST bestehend aus Objekt (nur ein neues Element kann erstellt werden):
    Alle Daten, die es fuer die Erstellung der Klasse braucht (*: Darf NULL sein | ?: muss nicht angegeben werden):
        isHidden? (default: false)
        name
        notes?*
        referenceID?
        permissions* (falls referenceID NULL): Array aus Objekten mit:
            userName
            writingPermission

Bei Fehlern wird nichts hinzugefuegt

*/

function createClass(array &$data, int $userID) : array {
    
    global $mysqli;

    $properties = array();
    $changes = false;


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

    }


    if(isset($data["referenceID"])) {

        if(!is_int($data["referenceID"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        $properties["referenceID"] = $data["referenceID"];

    } else {

        $properties["referenceID"] = NULL;

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

            if($result["type"] !== "teacher" && $result["type"] !== "admin") {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

            if($result["userID"] === $userID) {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

            $currentPermission["userID"] = $result["userID"];

        }

        $stmt->close();

    }


    if($properties["referenceID"] !== NULL) {

        $referenceClass = getClass($properties["referenceID"], $userID, true);

        if($referenceClass->error !== ERROR_NONE) {

            return array("error" => ERROR_UNSUITABLE_INPUT);

        }

    }

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

    $stmt = $mysqli->prepare("INSERT INTO classes (" . $queryFragment_keys . ") VALUES (" . $queryFragment_values . ")");

    $stmt->bind_param($parameterTypes, ...array_values($properties));
    $stmt->execute();

    $newID = $mysqli->query("SELECT LAST_INSERT_ID()")->fetch_row()[0];


    if(isset($data["permissions"]) && !empty($data["permissions"])) {

        $arguments = array();
        $parameterTypes = str_repeat("i", count($data["permissions"]) * 3);
        $queryFragment = str_repeat("(?, ?, ?), ", count($data["permissions"]) - 1) . "(?, ?, ?)";

        foreach($data["permissions"] as &$currentPermission) {

            array_push($arguments, $newID, $currentPermission["userID"], $currentPermission["writingPermission"]);

        }

        $stmt->prepare("INSERT INTO permissions (classID, userID, writingPermission) VALUES " . $queryFragment);
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


if($_SESSION["type"] !== "teacher" && $_SESSION["type"] !== "admin") {

    throwError(ERROR_ONLY_TEACHER);

}

$errorAndChanges = createClass($data, $_SESSION["userid"]);

if($errorAndChanges["error"] !== ERROR_NONE) {

    throwError($errorAndChanges["error"]);

}

sendResponse($errorAndChanges["changes"], ERROR_NONE, NULL, $errorAndChanges["newID"]);


?>