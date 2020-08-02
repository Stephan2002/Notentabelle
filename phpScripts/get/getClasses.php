<?php

/*

Laedt Klassen.

Input als JSON per POST:
    kein Input

*/

function getClasses(Element $element) {

    global $mysqli;

    $stmt = $mysqli->prepare("SELECT * FROM classes WHERE userID = ? AND deleteTimestamp IS NULL");
    $stmt->bind_param("i", $_SESSION["userid"]);
    $stmt->execute();

    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $element->childrenData = $results;

}

if(!isset($isNotMain)) {

    include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

    session_start();

    if(!isset($_SESSION["userid"])) {

        throwError(ERROR_NOTLOGGEDIN);

    }

    session_write_close();

    if($_SESSION["type"] !== "teacher" && $_SESSION["type"] !== "admin") {

        throwError(ERROR_ONLYTEACHER);

    }

    if(!connectToDatabase()) {

        throwError(ERROR_UNKNOWN);

    }

    $class = new StudentClass(ERROR_NONE, Element::ACCESS_OWNER, true);
    $class->isRoot = true;

    getClasses($class);
    $class->sendResponse();

}


?>