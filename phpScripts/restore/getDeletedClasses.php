<?php

/*

Laedt geloeschte Klassen

Input als JSON per POST:
    Kein Input


*/

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

if(!$_SESSION["isTeacher"]) {

    throwError(ERROR_ONLY_TEACHER);

}

session_write_close();

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

$stmt = $mysqli->prepare("SELECT classID AS ID, name FROM classes WHERE userID = ? AND deleteTimestamp IS NOT NULL");
$stmt->bind_param("i", $_SESSION["userid"]);
$stmt->execute();

$result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$stmt->close();

sendResponse($result);

?>