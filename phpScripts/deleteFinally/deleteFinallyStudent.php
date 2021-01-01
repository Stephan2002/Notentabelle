<?php

/*

Loescht geloeschter Schueler endgueltig

Input als JSON per POST bestehend aus Array, jeweils mit:
    studentID

*/

function deleteFinallyStudent(Student $studentToDelete) : int {

    global $mysqli;

    if($studentToDelete->data["deleteTimestamp"] === NULL) {

        return ERROR_NOT_DELETED;

    }

    $stmt = $mysqli->prepare("DELETE FROM students WHERE studentID = ?");
    $stmt->bind_param("i", $studentToDelete->data["studentID"]);
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

    $studentToDelete = getStudent($studentID, $_SESSION["userid"], true);

    if($studentToDelete->error !== ERROR_NONE) {
        
        throwError($studentToDelete->error, $key);

    }

    if(!$studentToDelete->writingPermission) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorCode = deleteFinallyStudent($studentToDelete);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode, $key);
        

    }

}

finish();

?>