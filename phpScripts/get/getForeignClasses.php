<?php

/*

Laedt alle fremden Klassen, auf die der Nutzer Zugriff hat.

Input als JSON per POST:
    Kein Input


*/

function getForeignClasses(StudentClass &$element) {

    global $mysqli;

    $stmt = $mysqli->prepare("SELECT * FROM classes WHERE EXISTS (SELECT permissions.classID FROM permissions WHERE classes.classID = permissions.classID AND permissions.userID = ?) AND classes.deleteTimestamp IS NULL");
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

    $class = new Element(ERROR_NONE, Element::ACCESS_OWNER, true);
    $class->type = Element::TYPE_FOREIGN_CLASSES;
    $class->isRoot = true;

    getForeignClasses($class);

    $class->sendResponse();

}

?>