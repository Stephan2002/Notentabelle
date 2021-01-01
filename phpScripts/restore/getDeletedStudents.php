<?php

/*

Laedt geloeschte Schueler

Input als JSON per POST:
    classID


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

$data = getData();

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

if(!isset($data["classID"])) {

    throwError(ERROR_MISSING_INPUT);
    
} 

if(!is_int($data["classID"])) {

    throwError(ERROR_BAD_INPUT);

}

$class = getClass($data["classID"], $_SESSION["userid"]);

if($class->error !== ERROR_NONE) {

    throwError($class->error);

}

$stmt = $mysqli->prepare("SELECT studentID AS ID, firstName, lastName FROM students WHERE classID = ? AND deleteTimestamp IS NOT NULL");
$stmt->bind_param("i", $class->data["classID"]);
$stmt->execute();

$result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$stmt->close();

sendResponse($result);

?>