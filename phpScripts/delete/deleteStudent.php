<?php

/*
Schueler loeschen

Input als JSON per POST bestehend aus Array, jeweils mit: 
    studentID

*/

function deleteStudent(Student $studentToDelete) : int {

    global $mysqli;

    if($studentToDelete->data["userID"] !== NULL) {

        include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateStudentRefs.php");

        updateRefsToForbidden($studentToDelete->data["classID"], array($studentToDelete->data["userID"]));

    }

    $timestamp = date("Y-m-d H:i:s");

    $stmt = $mysqli->prepare("UPDATE students SET deleteTimestamp = ? WHERE studentID = ?");
    $stmt->bind_param("si", $timestamp, $studentToDelete->data["studentID"]);
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

    $studentToDelete = getStudent($studentID, $_SESSION["userid"]);

    if($studentToDelete->error !== ERROR_NONE) {
        
        throwError($studentToDelete->error, $key);

    }

    if(!$studentToDelete->writingPermission) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    deleteStudent($studentToDelete);

}

finish();

?>