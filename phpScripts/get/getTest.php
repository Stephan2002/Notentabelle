<?php

/*

Laedt eine Pruefung.

Input als JSON per POST:
    testID (OrdnerID)
    isPublicTemplate

*/


include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

$data = getData();

if(isset($data["testID"]) && is_numeric($data["testID"])) {

    $testID = (int)$data["testID"];

} else {

    throwError(ERROR_BAD_INPUT);

}

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

$test = getTest($testID, isset($data["isPublicTemplate"]));
$test->sendResponse();

?>