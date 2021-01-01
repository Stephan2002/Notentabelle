<?php

/*

Laedt geloeschte Semester/Semesterordner

Input als JSON per POST:
    semesterID (OrdnerID) (ID des Ordners, dessen geloeschte Elemente geladen werden sollten)


*/


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

if(isset($data["semesterID"])) {

    if(!is_int($data["semesterID"])) {

        throwError(ERROR_BAD_INPUT);
    
    }

    $semesterFolder = getSemester($data["semesterID"], $_SESSION["userid"], $_SESSION["isTeacher"]);

    if($semesterFolder->error !== ERROR_NONE) {

        throwError($semesterFolder->error);

    }

    $stmt = $mysqli->prepare("SELECT semesterID AS ID, name FROM semesters WHERE parentID = ? AND deleteTimestamp IS NOT NULL");
    $stmt->bind_param("i", $semesterFolder->data["semesterID"]);

} else {

    $stmt = $mysqli->prepare("SELECT semesterID AS ID, name FROM semesters WHERE parentID IS NULL AND userID = ? AND deleteTimestamp IS NOT NULL");
    $stmt->bind_param("i", $_SESSION["userid"]);

}

$stmt->execute();

$result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$stmt->close();

sendResponse($result);

?>