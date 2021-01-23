<?php

/*

Loescht geloeschte Semester/Semesterordner endgueltig

Input als JSON per POST bestehend aus Array, jeweils mit:
    semesterID

*/


function deleteSemesterFinally(Semester $semesterToDelete) : int {

    global $mysqli;

    if($semesterToDelete->data["deleteTimestamp"] === NULL) {

        return ERROR_NOT_DELETED;

    }

    if($semesterToDelete->isFolder) {

        include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/selectFunctions.php");

        $result = selectChildSemesters($semesterToDelete->data["semesterID"], NULL, true);

        $childSemestersWithFolders = $result["IDArray"];
        $childSemesters = array();

        $len = count($childSemestersWithFolders);
        
        for($i = 0; $i < $len; $i++) {

            if(!$result["isFolderArray"][$i]) {

                $childSemesters[] = $childSemestersWithFolders[$i];

            }

        }

    } else {

        $childSemesters = array($semesterToDelete->data["semesterID"]);

    }

    if(!empty($childSemesters)) {
        
        $parameterTypes = str_repeat("i", count($childSemesters));
        $queryFragment = str_repeat("?, ", count($childSemesters) - 1) . "?";
        
        $stmt = $mysqli->prepare("UPDATE tests SET tests.referenceState = \"deleted\", tests.referenceID = NULL WHERE EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests.referenceID = tests2.testID AND tests2.semesterID IN (" . $queryFragment . "))");
        $stmt->bind_param($parameterTypes, ...$childSemesters);
        $stmt->execute();

        $stmt->close();

    }

    $stmt = $mysqli->prepare("DELETE FROM semesters WHERE semesterID = ?");
    $stmt->bind_param("i", $semesterToDelete->data["semesterID"]);
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

    $semesterToDelete = getSemester($semesterID, $_SESSION["userid"], $_SESSION["isTeacher"], false, true);

    if($semesterToDelete->error !== ERROR_NONE) {
        
        throwError($semesterToDelete->error, $key);

    }

    if($semesterToDelete->accessType !== Element::ACCESS_OWNER) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorCode = deleteSemesterFinally($semesterToDelete);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode, $key);
        

    }

}

finish();

?>