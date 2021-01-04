<?php

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

$data = getData();

if(!is_string($data["userName"])) {

    throwError(ERROR_BAD_INPUT);

}

$userName = strtolower($data["userName"]);
$needsTeacher = isset($data["needsTeacher"]);
$includeDemo = isset($data["includeDemo"]);

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

$stmt = $mysqli->prepare("SELECT isTeacher, status FROM users WHERE userName = ? AND isVerified = 1");
$stmt->bind_param("s", $userName);
$stmt->execute();

$result = $stmt->get_result()->fetch_assoc();

if($result === NULL) {

    sendResponse(false);

}

if($result["status"] === "admin" || ($result["status"] === "demo" && !$includeDemo)) {

    sendResponse(false);

}

if($needsTeacher) {

    session_start();

    if(!isset($_SESSION["userid"])) {

        throwError(ERROR_NOT_LOGGED_IN);

    } elseif(!$_SESSION["isTeacher"]) {

        throwError(ERROR_ONLY_TEACHER);

    }

    sendResponse((bool)$result["isTeacher"]);

}

sendResponse(true);


?>