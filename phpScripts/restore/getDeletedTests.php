<?php

/*

Laedt geloeschte Feacher/Ordner/Pruefungen

Input als JSON per POST:
    testID (OrdnerID) (ID des Ordners, dessen geloeschte Elemente geladen werden sollten)
    semesterID (falls testID nicht vorhanden, weil in Hauptordner)


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

if(isset($data["testID"])) {

    if(!is_int($data["testID"])) {

        throwError(ERROR_BAD_INPUT);
    
    }

    $testFolder = getTest($data["testID"], $_SESSION["userid"], $_SESSION["isTeacher"], false, true);

    if($testFolder->error !== ERROR_NONE) {

        throwError($testFolder->error);

    }

    $stmt = $mysqli->prepare("SELECT testID AS ID, name FROM tests WHERE parentID = ? AND deleteTimestamp IS NOT NULL");
    $stmt->bind_param("i", $testFolder->data["testID"]);

} elseif(isset($data["semesterID"])) {

    if(!is_int($data["semesterID"])) {

        throwError(ERROR_BAD_INPUT);
    
    }

    $semester = getSemester($data["semesterID"], $_SESSION["userid"], $_SESSION["isTeacher"]);

    if($semester->error !== ERROR_NONE) {

        throwError($semester->error);

    }

    $stmt = $mysqli->prepare("SELECT testID AS ID, name FROM tests WHERE parentID IS NULL AND semesterID = ? AND deleteTimestamp IS NOT NULL");
    $stmt->bind_param("i", $semester->data["semesterID"]);

} else {

    throwError(ERROR_MISSING_INPUT);

}

$stmt->execute();

$result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$stmt->close();

sendResponse($result);

?>