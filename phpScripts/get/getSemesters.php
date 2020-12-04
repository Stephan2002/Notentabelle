<?php

/*

Laedt Semester/Ordner, falls Zugriff erlaubt

Input als JSON per POST:
    semesterID (Ordner ID) (Falls nicht vorhanden: Hauptordner des Benutzers)

*/

function getSemesters(Semester $element) : int {

    global $mysqli;

    if($element->error !== ERROR_NONE) {

        return $element->error;

    }

    if($element->isRoot) {

        $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE userID = ? AND parentID IS NULL AND deleteTimestamp IS NULL ORDER BY isHidden, referenceID IS NOT NULL, classID, name");
        $stmt->bind_param("i", $_SESSION["userid"]);

    } else {

        $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE parentID = ? AND deleteTimestamp IS NULL ORDER BY isHidden, referenceID IS NOT NULL, classID, name");
        $stmt->bind_param("i", $element->data["semesterID"]);

    }

    $stmt->execute();
    
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $element->childrenData = $results;

    return ERROR_NONE;

}

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

$data = getData();

if(isset($data["semesterID"])) {

    if(is_int($data["semesterID"])) {

        $semesterID = $data["semesterID"];

    } else {

        throwError(ERROR_BAD_INPUT);

    }

}

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

if(isset($semesterID)) {

    $semesterFolder = getSemester($semesterID, $_SESSION["userid"], $_SESSION["isTeacher"]);

} else {

    $semesterFolder = new Semester(ERROR_NONE, Element::ACCESS_OWNER, true);
    $semesterFolder->isRoot = true;

}

if($semesterFolder->error !== ERROR_NONE) {

    throwError($semesterFolder->error);

}

getSemesters($semesterFolder);
$semesterFolder->sendResponse();

?>