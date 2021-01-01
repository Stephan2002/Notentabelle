<?php

/*

Loescht geloeschte Klasse endgueltig

Input als JSON per POST bestehend aus Array, jeweils mit:
    classID

*/

function deleteClassFinally(StudentClass $classToDelete) : int {

    global $mysqli;

    if($classToDelete->data["deleteTimestamp"] === NULL) {

        return ERROR_NOT_DELETED;

    }

    $stmt = $mysqli->prepare("UPDATE semesters SET classID = 0 WHERE classID = -?");
    $stmt->bind_param("i", $classToDelete->data["classID"]);
    $stmt->execute();

    $stmt->prepare("DELETE FROM classes WHERE classID = ?");
    $stmt->bind_param("i", $classToDelete->data["classID"]);
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

    $classToDelete = getClass($classID, $_SESSION["userid"], true);

    if($classToDelete->error !== ERROR_NONE) {
        
        throwError($classToDelete->error, $key);

    }

    if($classToDelete->accessType !== Element::ACCESS_OWNER) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorCode = deleteClassFinally($classToDelete);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode, $key);

    }

}

finish();

?>