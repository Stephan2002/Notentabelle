<?php

/*

Stellt geloeschte Faecher/Ordner/Pruefungen wiederher

Input als JSON per POST bestehend aus Array, jeweils mit:
    testID

*/

function restoreTest(Test $testToRestore) : int {

    global $mysqli;

    if($testToRestore->data["deleteTimestamp"] === NULL) {

        return ERROR_NOT_DELETED;

    }

    if($testToRestore->data["parentID"] !== NULL) {

        $stmt = $mysqli->prepare("SELECT deleteTimestamp FROM tests WHERE testID = ?");
        $stmt->bind_param("i", $testToRestore->data["parentID"]);
        $stmt->execute();

        if($stmt->get_result()->fetch_row()[0] !== NULL) {

            $stmt->close();
            return ERROR_FORBIDDEN;

        }

        if($testToRestore->isFolder) {

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/selectFunctions.php");

            $result = selectChildTests($testToRestore->data["testID"], $testToRestore->data["deleteTimestamp"]);

            $childTests = $result["IDArray"];
            $childTests[] = $testToRestore->data["testID"];

        } else {

            $childTests = array($testToRestore->data["testID"]);

        }

        $parameterTypes = str_repeat("i", count($childTests));
        $queryFragment = str_repeat("?, ", count($childTests) - 1) . "?";

        if(!$testToRestore->isTemplate) {

            // Zu aktualisierende Verknuepfungen laden

            $stmt->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID WHERE tests.referenceID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, ...$childTests);
            $stmt->execute();
    
            $changedRefs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        }

        $stmt->prepare("UPDATE tests SET deleteTimestamp = NULL WHERE testID IN (" . $queryFragment . ")");
        $stmt->bind_param($parameterTypes, ...$childTests);
        $stmt->execute();

        if(!$testToRestore->isTemplate) {

            // Noten wieder in uebergeordnetes Element einfliessen lassen

            $stmt->prepare("SELECT tests.*, semesters.userID, semesters.classID FROM tests INNER JOIN semesters ON tests.semesterID = semesters.semesterID WHERE tests.testID = ?");
            $stmt->bind_param("i", $testToRestore->data["parentID"]);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_assoc();

            $parentTest = new Test(ERROR_NONE, Element::ACCESS_UNDEFINED, false, $result);

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");

            updateMarks($parentTest, true, 5, false);

        }

        $stmt->close();

    } else {

        $stmt = $mysqli->prepare("SELECT deleteTimestamp FROM semesters WHERE semesterID = ?");
        $stmt->bind_param("i", $testToRestore->data["semesterID"]);
        $stmt->execute();

        if($stmt->get_result()->fetch_row()[0] !== NULL) {

            $stmt->close();
            return ERROR_FORBIDDEN;

        }

        if(!$testToRestore->isTemplate) {

            // Zu aktualisierende Verknuepfungen laden

            $stmt->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID WHERE EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests.referenceID = tests2.testID AND ? IN (tests2.subjectID, tests2.testID) AND tests2.deleteTimestamp = ?)");
            $stmt->bind_param("is", $testToRestore->data["testID"], $testToRestore->data["deleteTimestamp"]);
            $stmt->execute();

            $changedRefs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        }

        $stmt->prepare("UPDATE tests SET deleteTimestamp = NULL WHERE ? IN (subjectID, testID) AND deleteTimestamp = ?");
        $stmt->bind_param("is", $testToRestore->data["testID"], $testToRestore->data["deleteTimestamp"]);
        $stmt->execute();

        $stmt->close();

    }

    if(isset($changedRefs)) {

        // Verknuepfungen auf aktuellen Stand bringen

        $refIDs = array();

        foreach($changedRefs as &$refTestData) {

            $refIDs[] = $refTestData["testID"];

        }

        if(!empty($refIDs)) {

            $parameterTypes = str_repeat("i", count($refIDs));
            $queryFragment = str_repeat("?, ", count($refIDs) - 1) . "?";
            
            $stmt = $mysqli->prepare("UPDATE tests SET referenceState = IF(tests.referenceState = \"delForbidden\", \"forbidden\", \"ok\") WHERE testID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, ...$refIDs);
            $stmt->execute();
            $stmt->close();

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
    
        }
    
        foreach($changedRefs as &$currentRef) {

            if($currentRef["referenceState"] === "delTemp") {
            
                $currentRef["referenceState"] = "ok";
                $currentTest = new Test(ERROR_NONE, Element::ACCESS_UNDEFINED, true, $currentRef);
                updateMarks($currentTest, true, 5, false);

            }

        }

    }

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

    $testToRestore = getTest($testID, $_SESSION["userid"], $_SESSION["isTeacher"], false, false, false, false, true);

    if($testToRestore->error !== ERROR_NONE) {
        
        throwError($testToRestore->error, $key);

    }

    if(!$testToRestore->writingPermission || ($testToRestore->data["parentID"] === NULL && $testToRestore->accessType === Element::ACCESS_TEACHER)) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorCode = restoreTest($testToRestore);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode, $key);
        
    }

}

finish();

?>