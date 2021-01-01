<?php

/*

Stellt geloeschter Schueler wiederher

Input als JSON per POST bestehend aus Array, jeweils mit:
    studentID

*/

function restoreStudent(Student $studentToRestore) : int {

    global $mysqli;

    if($studentToRestore->data["deleteTimestamp"] === NULL) {

        return ERROR_NOT_DELETED;

    }

    $stmt = $mysqli->prepare("SELECT deleteTimestamp FROM classes WHERE classID = ?");
    $stmt->bind_param("i", $studentToRestore->data["classID"]);
    $stmt->execute();

    if($stmt->get_result()->fetch_row()[0] !== NULL) {

        $stmt->close();
        return ERROR_FORBIDDEN;

    }

    $stmt->close();

    if($studentToRestore->data["userID"] !== NULL) {

        include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateStudentRefs.php");

        updateRefsToAllowed($studentToRestore->data["classID"], array($studentToRestore->data["userID"]));

    }

    $stmt = $mysqli->prepare("UPDATE students SET deleteTimestamp = NULL WHERE studentID = ?");
    $stmt->bind_param("i", $studentToRestore->data["studentID"]);
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

foreach($data as $key => $studentID) {
        
    if(!is_int($studentID)) {

        throwError(ERROR_BAD_INPUT, $key);
    
    }

}

foreach($data as $key => $studentID) {

    $studentToRestore = getStudent($studentID, $_SESSION["userid"], true);

    if($studentToRestore->error !== ERROR_NONE) {
        
        throwError($studentToRestore->error, $key);

    }

    if(!$studentToRestore->writingPermission) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorCode = restoreStudent($studentToRestore);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode, $key);
        
    }

}

finish();

?>