<?php

/*

Laedt alle Schueler einer Klasse, sofern der Nutzer Zugriff hat.

Input als JSON per POST:
    classID

*/

function getStudents(StudentClass $element) : int {

    global $mysqli;

    if($element->error !== ERROR_NONE) {

        return $element->error;

    }

    if(!is_null($element->data["referenceID"])) {

        return ERROR_UNSUITABLE_INPUT;

    }

    $stmt = $mysqli->prepare("SELECT students.*, users.userName FROM students LEFT JOIN users ON students.userID = users.userID WHERE classID = ? AND students.deleteTimestamp IS NULL ORDER BY students.isHidden, students.lastName");
    $stmt->bind_param("i", $element->data["classID"]);
    $stmt->execute();

    $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $element->childrenData = $result;

    return ERROR_NONE;

}

if(!isset($isNotMain)) {

    include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

    session_start();

    if(!isset($_SESSION["userid"])) {

        throwError(ERROR_NOT_LOGGED_IN);

    }

    session_write_close();

    if($_SESSION["type"] !== "teacher" && $_SESSION["type"] !== "admin") {

        throwError(ERROR_ONLY_TEACHER);

    }

    $data = getData();

    if(!isset($data["classID"])) {
        
        throwError(ERROR_MISSING_INPUT);

    }

    if(!is_int($data["classID"])) {

        throwError(ERROR_BAD_INPUT);

    }

    if(!connectToDatabase()) {

        throwError(ERROR_UNKNOWN);

    }

    $class = getClass($data["classID"], $_SESSION["userid"]);

    if($class->error !== ERROR_NONE) {

        throwError($class->error);

    }

    $errorCode = getStudents($class);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode);

    }
    
    $class->sendResponse();

}

?>