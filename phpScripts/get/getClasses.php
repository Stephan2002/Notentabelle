<?php

/*

Laedt Klassen.

Input als JSON per POST:
    kein Input

*/

function getClasses(Element $element) : int {

    global $mysqli;

    $stmt = $mysqli->prepare("SELECT * FROM classes WHERE userID = ? AND deleteTimestamp IS NULL ORDER BY isHidden, name");
    $stmt->bind_param("i", $_SESSION["userid"]);
    $stmt->execute();

    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $element->childrenData = $results;

    return ERROR_NONE;

}

if(!isset($isNotMain)) {

    include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

    session_start();

    if(!isset($_SESSION["userid"])) {

        throwError(ERROR_NOT_LOGGED_IN);

    }

    session_write_close();

    if(!$_SESSION["isTeacher"]) {

        throwError(ERROR_ONLY_TEACHER);

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