<?php

/*
Pruefung/Fach/Ordner (provisorisch) loeschen

Input als JSON per POST bestehend aus Array, jeweils mit: 
    testID

*/

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function deleteTest(Test $testToDelete) : int {

    global $mysqli;

    $timestamp = date("Y-m-d H:i:s");

    if($testToDelete->data["parentID"] !== NULL) {

        if($testToDelete->isFolder) {

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/selectFunctions.php");

            $result = selectChildTests($testToDelete->data["testID"]);

            $childTests = $result["IDArray"];
            $childTests[] = $testToDelete->data["testID"];

        } else {

            $childTests = array($testToDelete->data["testID"]);

        }

        $parameterTypes = str_repeat("i", count($childTests));
        $queryFragment = str_repeat("?, ", count($childTests) - 1) . "?";

        if(!$testToDelete->isTemplate) {

            $stmt = $mysqli->prepare("UPDATE tests SET tests.referenceState = IF(tests.referenceState = \"forbidden\", \"delForbidden\", \"delTemp\") WHERE tests.referenceID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, ...$childTests);
            $stmt->execute();
            $stmt->close();

        }

        $stmt = $mysqli->prepare("UPDATE tests SET deleteTimestamp = ? WHERE testID IN (" . $queryFragment . ")");
        $stmt->bind_param("s" . $parameterTypes, $timestamp, ...$childTests);
        $stmt->execute();

        if(!$testToDelete->isTemplate) {

            // Noten nicht mehr in uebergeordnetes Element einfliessen lassen

            $stmt->prepare("SELECT tests.*, semesters.userID, semesters.classID FROM tests INNER JOIN semesters ON tests.semesterID = semesters.semesterID WHERE tests.testID = ?");
            $stmt->bind_param("i", $testToDelete->data["parentID"]);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_assoc();

            $parentTest = new Test(ERROR_NONE, Element::ACCESS_UNDEFINED, false, $result);

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");

            updateMarks($parentTest, true, 5, false);

        }

        $stmt->close();

    } else {

        if(!$testToDelete->isTemplate) {

            $stmt = $mysqli->prepare("UPDATE tests SET tests.referenceState = IF(tests.referenceState = \"forbidden\", \"delForbidden\", \"delTemp\") WHERE EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests.referenceID = tests2.testID AND ? IN (tests2.subjectID, tests2.testID) AND tests2.deleteTimestamp IS NULL)");
            $stmt->bind_param("i", $testToDelete->data["testID"]);
            $stmt->execute();
            $stmt->close();

        }

        $stmt = $mysqli->prepare("UPDATE tests SET deleteTimestamp = ? WHERE ? IN (subjectID, testID) AND deleteTimestamp IS NULL");
        $stmt->bind_param("si", $timestamp, $testToDelete->data["testID"]);
        $stmt->execute();
        $stmt->close();

    }

    return ERROR_NONE;

}

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

if($_SESSION["status"] === "demo") throwError(ERROR_NO_WRITING_PERMISSION);

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

    $testToDelete = getTest($testID, $_SESSION["userid"], $_SESSION["isTeacher"]);

    if($testToDelete->error !== ERROR_NONE) {
        
        throwError($testToDelete->error, $key);

    }

    if(!$testToDelete->writingPermission || ($testToDelete->data["parentID"] === NULL && $testToDelete->accessType === Element::ACCESS_TEACHER)) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    deleteTest($testToDelete);

}

finish();

?>