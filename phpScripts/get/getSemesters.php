<?php

/*

Laedt Semester/Ordner, falls Zugriff erlaubt

Input als JSON per POST:
    semesterID (Ordner ID) (Falls nicht vorhanden: Hauptordner des Benutzers)
    isTemplate (Falls Vorlagen im Hauptordner angefordert wurden)

*/

function getSemesters(Semester &$element) : bool {

    global $mysqli;

    if($element->error !== ERROR_NONE) {

        return false;

    }

    if($element->isRoot) {

        if($element->isTemplate) {

            $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE userID = ? AND templateType IS NOT NULL AND deleteTimestamp IS NULL ORDER BY isHidden, referenceID IS NOT NULL, classID, name");
    
        } else {
    
            $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE userID = ? AND templateType IS NULL AND deleteTimestamp IS NULL ORDER BY isHidden, referenceID IS NOT NULL, classID, name");
    
        }
    
        $stmt->bind_param("i", $_SESSION["userid"]);

    } else {

        $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE parentID = ? AND deleteTimestamp IS NULL ORDER BY isHidden, referenceID IS NOT NULL, classID, name");
        $stmt->bind_param("i", $element->data["semesterID"]);

    }

    $stmt->execute();
    
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $element->childrenData = $results;

    return true;

}

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

$data = getData();

if(isset($data["semesterID"]) && is_numeric($data["semesterID"])) {

    $semesterID = (int)$data["semesterID"];

}

$isTemplate = isset($data["isTemplate"]);

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

if(isset($semesterID)) {

    $semesterFolder = getSemester($semesterID, $_SESSION["userid"], $_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin");

} else {

    $semesterFolder = new Semester(ERROR_NONE, Element::ACCESS_OWNER, true);
    $semesterFolder->isRoot = true;

    if($isTemplate) {

        $semesterFolder->isTemplate = true;

    }

}

getSemesters($semesterFolder);
$semesterFolder->sendResponse();

?>