<?php

/*

Stellt geloeschte Semester/Semesterordner wiederher

Input als JSON per POST bestehend aus Array, jeweils mit:
    semesterID

*/

function restoreSemester(Semester $semesterToRestore) : int {

    global $mysqli;

    if($semesterToRestore->data["deleteTimestamp"] === NULL) {

        return ERROR_NOT_DELETED;

    }

    if($semesterToRestore->data["parentID"] !== NULL) {

        $stmt = $mysqli->prepare("SELECT deleteTimestamp FROM semesters WHERE semesterID = ?");
        $stmt->bind_param("i", $semesterToRestore->data["parentID"]);
        $stmt->execute();

        if($stmt->get_result()->fetch_row()[0] !== NULL) {

            $stmt->close();
            return ERROR_FORBIDDEN;

        }

        $stmt->close();

    }

    if($semesterToRestore->isFolder) {

        include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/selectFunctions.php");

        $result = selectChildSemesters($semesterToRestore->data["semesterID"], $semesterToRestore->data["deleteTimestamp"]);

        $childSemestersWithFolders = $result["IDArray"];
        $childSemesters = array();

        $len = count($childSemestersWithFolders);
        
        for($i = 0; $i < $len; $i++) {

            if(!$result["isFolderArray"][$i]) {

                $childSemesters[] = $childSemestersWithFolders[$i];

            }

        }

        $childSemestersWithFolders[] = $semesterToRestore->data["semesterID"];

    } else {

        $childSemesters = array($semesterToRestore->data["semesterID"]);
        $childSemestersWithFolders = array($semesterToRestore->data["semesterID"]);

    }

    if(!empty($childSemesters)) {
        
        $parameterTypes = str_repeat("i", count($childSemesters));
        $queryFragment = str_repeat("?, ", count($childSemesters) - 1) . "?";
        
        // Verknupfungen laden und auf den richtigen Stand bringen
        
        $stmt = $mysqli->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID WHERE EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests.referenceID = tests2.testID AND tests2.deleteTimestamp = ? AND tests2.semesterID IN (" . $queryFragment . "))");
        $stmt->bind_param("s" . $parameterTypes, $semesterToRestore->data["deleteTimestamp"], ...$childSemesters);
        $stmt->execute();

        $changedRefs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        $refIDs = array();

        foreach($changedRefs as $refTestData) {

            $refIDs[] = $refTestData["testID"];

        }

        if(!empty($refIDs)) {

            $parameterTypes = str_repeat("i", count($refIDs));
            $queryFragment = str_repeat("?, ", count($refIDs) - 1) . "?";
    
            $stmt->prepare("UPDATE tests SET referenceState = IF(tests.referenceState = \"delForbidden\", \"forbidden\", \"ok\") WHERE testID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, ...$refIDs);
            $stmt->execute();

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
    
        }

        $stmt->close();
    
        foreach($changedRefs as $currentRef) {

            if($currentRef["referenceState"] === "delTemp") {
            
                $currentRef["referenceState"] = "ok";
                $currentTest = new Test(ERROR_NONE, Element::ACCESS_UNDEFINED, true, $currentRef);
                updateMarks($currentTest, true, 5, false);

            }

        }

    }

    $parameterTypes = str_repeat("i", count($childSemestersWithFolders));
    $queryFragment = str_repeat("?, ", count($childSemestersWithFolders) - 1) . "?";

    $stmt = $mysqli->prepare("UPDATE semesters SET deleteTimestamp = NULL WHERE semesterID IN (" . $queryFragment . ")");
    $stmt->bind_param($parameterTypes, ...$childSemestersWithFolders);
    $stmt->execute();

    if(!empty($childSemesters)) {

        $parameterTypes = str_repeat("i", count($childSemesters));
        $queryFragment = str_repeat("?, ", count($childSemesters) - 1) . "?";

        $stmt->prepare("UPDATE tests SET deleteTimestamp = NULL WHERE deleteTimestamp = ? AND semesterID IN (" . $queryFragment . ")");
        $stmt->bind_param("s" . $parameterTypes, $semesterToRestore->data["deleteTimestamp"], ...$childSemesters);
        $stmt->execute();

    }

    $stmt->close();

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

foreach($data as $key => $semesterID) {
        
    if(!is_int($semesterID)) {

        throwError(ERROR_BAD_INPUT, $key);
    
    }

}

foreach($data as $key => $semesterID) {

    $semesterToRestore = getSemester($semesterID, $_SESSION["userid"], $_SESSION["isTeacher"], false, true);

    if($semesterToRestore->error !== ERROR_NONE) {
        
        throwError($semesterToRestore->error, $key);

    }

    if($semesterToRestore->accessType !== Element::ACCESS_OWNER) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorCode = restoreSemester($semesterToRestore);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode, $key);
        
    }

}

finish();

?>