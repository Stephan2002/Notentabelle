<?php

/*
Klasse loeschen

Input als JSON per POST bestehend aus Array, jeweils mit: 
    classID

*/

function deleteClass(StudentClass $classToDelete) : int {

    global $mysqli;

    include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateStudentRefs.php");

    updateRefsToForbidden($classToDelete->data["classID"]);

    $timestamp = date("Y-m-d H:i:s");

    $stmt = $mysqli->prepare("UPDATE students SET deleteTimestamp = ? WHERE classID = ? AND deleteTimestamp IS NULL");
    $stmt->bind_param("si", $timestamp, $classToDelete->data["classID"]);
    $stmt->execute();

    $stmt->prepare("UPDATE semesters SET classID = -classID WHERE classID = ?");
    $stmt->bind_param("i", $classToDelete->data["classID"]);
    $stmt->execute();

    $stmt->prepare("UPDATE classes SET deleteTimestamp = ? WHERE classID = ?");
    $stmt->bind_param("si", $timestamp, $classToDelete->data["classID"]);
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

    $classToDelete = getClass($classID, $_SESSION["userid"]);

    if($classToDelete->error !== ERROR_NONE) {
        
        throwError($classToDelete->error, $key);

    }

    if($classToDelete->accessType !== Element::ACCESS_OWNER) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    deleteClass($classToDelete);

}

finish();

?>