<?php

/*

Aendert Passwort

*/

define("ERROR_NONE",                    0);     // kein Fehler
define("ERROR_NOT_LOGGED_IN",           1);     // Nutzer ist nicht eingeloggt
define("ERROR_BAD_INPUT",               2);     // Schlechter User-Input
define("ERROR_MISSING_INPUT",           4);     // Fehlender User-Input
define("ERROR_UNKNOWN",                 10);    // Unbekannter / anderer Fehler

define("ERROR_PASSWORD_FALSE",          12);    // Das alte Passwort ist falsch

function throwError(int $errorCode) {

    echo "{\"error\":" . $errorCode . "}";
    exit;

}

function finish() {

    echo "{\"error\":" . ERROR_NONE . "}";
    exit;

}


$data = json_decode(file_get_contents("php://input"), true);

if(json_last_error()) {

    throwError(ERROR_BAD_INPUT);

}

if(isset($data["oldPassword"])) {

    $oldPassword = $data["oldPassword"];

    if(!is_string($oldPassword)) throwError(ERROR_BAD_INPUT);

} else {

    throwError(ERROR_MISSING_INPUT);

}

if(isset($data["newPassword"])) {

    $newPassword = $data["newPassword"];

    if(!is_string($newPassword)) throwError(ERROR_BAD_INPUT);
    if(strlen($newPassword) < 8) throwError(ERROR_BAD_INPUT);

} else {

    throwError(ERROR_MISSING_INPUT);

}

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}


$DB = json_decode(file_get_contents($_SERVER["DOCUMENT_ROOT"] . "/database.json"));

$mysqli = new mysqli($DB->HOST, $DB->USERNAME, $DB->PASSWORD, $DB->DBNAME);

if($mysqli->connect_errno) {

    throwError(ERROR_UNKNOWN);

}

$stmt = $mysqli->prepare("SELECT password FROM users WHERE userID = ?");
$stmt->bind_param("i", $_SESSION["userid"]);
$stmt->execute();

$result = $stmt->get_result()->fetch_row();

$stmt->close();

if($result === NULL) {

    throwError(ERROR_UNKNOWN);

}

if(!password_verify($oldPassword, $result[0])) {

    throwError(ERROR_PASSWORD_FALSE);

}

$newPassword = password_hash($newPassword, PASSWORD_DEFAULT);

$stmt = $mysqli->prepare("UPDATE users SET password = ? WHERE userID = ?");
$stmt->bind_param("si", $newPassword, $_SESSION["userid"]);
$stmt->execute();
$stmt->close();

finish();

?>