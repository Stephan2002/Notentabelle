<?php

/*

Laedt alle Schueler einer Klasse, sofern der Nutzer Zugriff hat.

Input als JSON per POST:
    classID

*/

function getStudents(StudentClass &$element) {

    global $mysqli;

    if($element->error !== ERROR_NONE) {

        return;

    }

    $stmt = $mysqli->prepare("SELECT * FROM students WHERE classID = ? AND deleteTimestamp IS NULL");
    $stmt->bind_param("i", $element->data["classID"]);
    $stmt->execute();

    $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $element->childrenData = $result;

}

if(!isset($isNotMain)) {

    include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

    session_start();

    if(!isset($_SESSION["userid"])) {

        throwError(ERROR_NOT_LOGGED_IN);

    }

    session_write_close();

    $data = getData();

    if(!isset($data["classID"]) || !is_numeric($data["classID"])) {

        throwError(ERROR_BAD_INPUT);

    }

    $classID = (int)$data["classID"];

    if(!connectToDatabase()) {

        throwError(ERROR_UNKNOWN);

    }

    $class = getClass($classID);

    getStudents($class);
    $class->sendResponse();

}

?>