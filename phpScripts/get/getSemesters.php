<?php

/*

Laedt Semester/Ordner, falls Zugriff erlaubt

Input:
    semesterID (Ordner ID) (Falls nicht vorhanden: Hauptordner des Benutzers)
    isTemplate (Falls Vorlagen im Hauptordner angefordert wurden)

*/

function getSemesters(Semester &$element) {

    global $mysqli;

    if($element->error !== ERROR_NONE) {

        return;

    }

    if(isset($element->isRoot)) {

        if($element->isTemplate) {

            $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE userID = ? AND isTemplate = 1 AND deleteTimestamp IS NULL");
    
        } else {
    
            $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE userID = ? AND deleteTimestamp IS NULL");
    
        }
    
        $stmt->bind_param("i", $_SESSION["userid"]);

    } else {

        $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE parentID = ? AND deleteTimestamp IS NULL");
        $stmt->bind_param("i", $element->data["semesterID"]);

    }

    $stmt->execute();
    
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $element->childrenData = $results;

}

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/getElement.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOTLOGGEDIN);

}

session_write_close();

if(isset($_POST["semesterid"]) && is_numeric($_POST["semesterid"])) {

    $semesterID = (int)$_POST["semesterid"];

}

$isTemplate = isset($_POST["is_template"]);

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

if(isset($semesterID)) {

    $semesterFolder = getSemester($semesterID);

} else {

    $semesterFolder = new Semester(ERROR_NONE, Element::ACCESS_OWNER, true);
    $semesterFolder->isRoot = true;

    if($isTemplate) {

        $semesterFolder->isTemplate = true;

    } else {

        $semesterFolder->isTemplate = false;

    }

}

getSemesters($semesterFolder);
$semesterFolder->sendResponse();

?>