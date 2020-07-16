<?php

/*

Laedt Semester/Ordner, falls Zugriff erlaubt

Input:
    semesterID (Ordner ID) (Falls nicht vorhanden: Hauptordner des Benutzers)
    isTemplate (Falls Vorlagen im Hauptordner angefordert wurden)

*/

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

    if($semesterFolder->error === ERROR_NONE) {

        $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE userID = ? AND parentID = ? AND deleteTimestamp IS NULL");
        $stmt->bind_param("ii", $_SESSION["userid"], $semesterID);
        $stmt->execute();

        $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $semesterFolder->childrenData = $results;

    }

} else {

    if($isTemplate) {

        $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE userID = ? AND isTemplate = 1 AND deleteTimestamp IS NULL");

    } else {

        $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE userID = ? AND deleteTimestamp IS NULL");

    }

    $stmt->bind_param("i", $_SESSION["userid"]);
    $stmt->execute();

    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $semesterFolder = new Semester(ERROR_NONE, Element::ACCESS_OWNER, true);
    $semesterFolder->isRoot = true;
    $semesterFolder->childrenData = $results;

    if($isTemplate) {

        $semesterFolder->isTemplate = true;

    }

}

$semesterFolder->sendResponse();

?>