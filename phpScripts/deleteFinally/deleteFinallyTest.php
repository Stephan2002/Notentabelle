<?php

/*

Loescht geloeschte Faecher/Ordner/Pruefungen endgueltig

Input als JSON per POST bestehend aus Array, jeweils mit:
    testID

*/


function deleteTestFinally(Test $testToDelete) : int {

    global $mysqli;

    if($testToDelete->data["deleteTimestamp"] === NULL) {

        return ERROR_NOT_DELETED;

    }

    if($testToDelete->data["parentID"] !== NULL) {

        if($testToDelete->isFolder) {

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/selectFunctions.php");

            $result = selectChildTests($testToDelete->data["testID"], NULL, true);

            $childTests = $result["IDArray"];
            $childTests[] = $testToDelete->data["testID"];

        } else {

            $childTests = array($testToDelete->data["testID"]);

        }

        $parameterTypes = str_repeat("i", count($childTests));
        $queryFragment = str_repeat("?, ", count($childTests) - 1) . "?";
        
        $stmt = $mysqli->prepare("UPDATE tests SET tests.referenceState = \"deleted\", tests.referenceID = NULL WHERE tests.referenceID IN (" . $queryFragment . ")");
        $stmt->bind_param($parameterTypes, ...$childTests);
        $stmt->execute();

    } else {

        $stmt = $mysqli->prepare("UPDATE tests SET tests.referenceState = \"deleted\", tests.referenceID = NULL WHERE EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests.referenceID = tests2.testID AND ? IN (tests2.subjectID, tests2.testID))");
        $stmt->bind_param("i", $testToDelete->data["testID"]);
        $stmt->execute();

    }

    $stmt->prepare("DELETE FROM tests WHERE testID = ?");
    $stmt->bind_param("i", $testToDelete->data["testID"]);
    $stmt->execute();

    $stmt->close();

    return ERROR_NONE;

}

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

$data = getData();

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

if(!is_array($data)) {

    throwError(ERROR_BAD_INPUT);

}

foreach($data as $key => $testID) {
        
    if(!is_int($testID)) {

        throwError(ERROR_BAD_INPUT, $key);
    
    }

}

foreach($data as $key => $testID) {

    $testToDelete = getTest($testID, $_SESSION["userid"], $_SESSION["isTeacher"], false, false, false, false, true);

    if($testToDelete->error !== ERROR_NONE) {
        
        throwError($testToDelete->error, $key);

    }

    if(!$testToDelete->writingPermission || ($testToDelete->data["parentID"] === NULL && $testToDelete->accessType === Element::ACCESS_TEACHER)) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorCode = deleteTestFinally($testToDelete);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode, $key);
        

    }

}

finish();

?>