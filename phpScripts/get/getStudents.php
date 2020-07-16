<?php

/*

Laedt alle Schueler einer Klasse, sofern der Nutzer Zugriff hat.

Input:
    classID

*/

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

if($class->error === ERROR_NONE) {

    $stmt = $mysqli->prepare("SELECT * FROM students WHERE classID = ? AND deleteTimestamp IS NULL");
    $stmt->bind_param("i", $classID);
    $stmt->execute();

    $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $class->childrenData = $result;

}

$class->sendResponse();

?>