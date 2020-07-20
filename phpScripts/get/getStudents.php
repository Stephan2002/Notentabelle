<?php

/*

Laedt alle Schueler einer Klasse, sofern der Nutzer Zugriff hat.

Input:
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

    include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/getElement.php");

    session_start();

    if(!isset($_SESSION["userid"])) {

        throwError(ERROR_NOTLOGGEDIN);

    }

    session_write_close();

    if(!isset($_POST["classid"]) || !is_numeric($_POST["classid"])) {

        throwError(ERROR_BADINPUT);

    }

    $classID = (int)$_POST["classid"];

    if(!connectToDatabase()) {

        throwError(ERROR_UNKNOWN);

    }

    $class = getClass($classID);

    getStudents($class);
    $class->sendResponse();

}

?>