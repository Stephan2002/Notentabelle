<?php

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

$data = getData();

if(!is_string($data["userName"])) {

    throwError(ERROR_BAD_INPUT);

}

$userName = strtolower($data["userName"]);
$needsTeacher = isset($data["needsTeacher"]);

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

$stmt = $mysqli->prepare("SELECT type FROM users WHERE userName = ?");
$stmt->bind_param("s", $userName);
$stmt->execute();

$result = $stmt->get_result()->fetch_row();

if($result === NULL) {

    sendResponse(false);

}

if($needsTeacher) {

    session_start();

    if(!isset($_SESSION["userid"])) {

        throwError(ERROR_NOT_LOGGED_IN);

    } elseif($_SESSION["type"] !== "teacher" && $_SESSION["type"] !== "admin") {

        throwError(ERROR_ONLY_TEACHER);

    }

    sendResponse($result[0] === "teacher" || $result[0] === "admin");

}

sendResponse(true);


?>