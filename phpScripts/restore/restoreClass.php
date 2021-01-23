<?php

/*

Stellt geloeschte Klasse wiederher

Input als JSON per POST bestehend aus Array, jeweils mit:
    classID

*/

function restoreClass(StudentClass $classToRestore) : int {

    global $mysqli;

    if($classToRestore->data["deleteTimestamp"] === NULL) {

        return ERROR_NOT_DELETED;

    }

    $stmt = $mysqli->prepare("UPDATE semesters SET classID = -classID WHERE classID = -?");
    $stmt->bind_param("i", $classToRestore->data["classID"]);
    $stmt->execute();

    $stmt->prepare("SELECT userID FROM students WHERE classID = ? AND deleteTimestamp = ?");
    $stmt->bind_param("is", $classToRestore->data["classID"], $classToRestore->data["deleteTimestamp"]);
    $stmt->execute();

    $results = $stmt->get_result()->fetch_all();

    $userIDs = array();

    foreach($results as $row) {

        if($row[0] !== NULL) {

            $userIDs[] = $row[0];

        }

    }

    include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateStudentRefs.php");

    updateRefsToAllowed($classToRestore->data["classID"], $userIDs);

    $stmt->prepare("UPDATE students SET deleteTimestamp = NULL WHERE classID = ? AND deleteTimestamp = ?");
    $stmt->bind_param("is", $classToRestore->data["classID"], $classToRestore->data["deleteTimestamp"]);
    $stmt->execute();

    $stmt->prepare("UPDATE classes SET deleteTimestamp = NULL WHERE classID = ?");
    $stmt->bind_param("i", $classToRestore->data["classID"]);
    $stmt->execute();

    $stmt->close();

    return ERROR_NONE;

}


include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

if(!$_SESSION["isTeacher"]) {

    throwError(ERROR_ONLY_TEACHER);

}

if($_SESSION["status"] === "demo") throwError(ERROR_NO_WRITING_PERMISSION);

$data = getData();

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

if(!is_array($data)) {

    throwError(ERROR_BAD_INPUT);

}

foreach($data as $key => $classID) {
        
    if(!is_int($classID)) {

        throwError(ERROR_BAD_INPUT, $key);
    
    }

}

foreach($data as $key => $classID) {

    $classToRestore = getClass($classID, $_SESSION["userid"], true);

    if($classToRestore->error !== ERROR_NONE) {
        
        throwError($classToRestore->error, $key);

    }

    if($classToRestore->accessType !== Element::ACCESS_OWNER) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorCode = restoreClass($classToRestore);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode, $key);
        
    }

}

finish();

?>