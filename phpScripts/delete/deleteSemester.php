<?php

/*

Semester oder Semesterordner (provisorisch) loeschen

Input als JSON per POST bestehend aus Array, jeweils mit:
    semesterID

*/

function deleteSemester(Semester $semesterToDelete) : int {

    global $mysqli;

    if($semesterToDelete->isFolder) {

        include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/selectFunctions.php");

        $result = selectChildSemesters($semesterToDelete->data["semesterID"]);

        $childSemestersWithFolders = $result["IDArray"];
        $childSemesters = array();

        $len = count($childSemestersWithFolders);
        
        for($i = 0; $i < $len; $i++) {

            if(!$result["isFolderArray"][$i]) {

                $childSemesters[] = $childSemestersWithFolders[$i];

            }

        }

        $childSemestersWithFolders[] = $semesterToDelete->data["semesterID"];

    } else {

        $childSemesters = array($semesterToDelete->data["semesterID"]);
        $childSemestersWithFolders = array($semesterToDelete->data["semesterID"]);

    }

    if(!empty($childSemesters)) {
        
        $parameterTypes = str_repeat("i", count($childSemesters));
        $queryFragment = str_repeat("?, ", count($childSemesters) - 1) . "?";
        
        $stmt = $mysqli->prepare("UPDATE tests SET tests.referenceState = IF(tests.referenceState = \"forbidden\", \"delForbidden\", \"delTemp\") WHERE EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests.referenceID = tests2.testID AND tests2.semesterID IN (" . $queryFragment . ") AND tests2.deleteTimestamp IS NULL)");
        $stmt->bind_param($parameterTypes, ...$childSemesters);
        $stmt->execute();

        $stmt->close();

    }

    $timestamp = date("Y-m-d H:i:s");

    $parameterTypes = str_repeat("i", count($childSemestersWithFolders));
    $queryFragment = str_repeat("?, ", count($childSemestersWithFolders) - 1) . "?";

    $stmt = $mysqli->prepare("UPDATE semesters SET deleteTimestamp = ? WHERE semesterID IN (" . $queryFragment . ")");
    $stmt->bind_param("s" . $parameterTypes, $timestamp, ...$childSemestersWithFolders);
    $stmt->execute();

    if(!empty($childSemesters)) {

        $parameterTypes = str_repeat("i", count($childSemesters));
        $queryFragment = str_repeat("?, ", count($childSemesters) - 1) . "?";

        $stmt->prepare("UPDATE tests SET deleteTimestamp = ? WHERE semesterID IN (" . $queryFragment . ") AND deleteTimestamp IS NULL");
        $stmt->bind_param("s" . $parameterTypes, $timestamp, ...$childSemesters);
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

if($_SESSION["status"] === "demo") throwError(ERROR_NO_WRITING_PERMISSION);

session_write_close();

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

    $semesterToDelete = getSemester($semesterID, $_SESSION["userid"], $_SESSION["isTeacher"]);

    if($semesterToDelete->error !== ERROR_NONE) {
        
        throwError($semesterToDelete->error, $key);

    }

    if($semesterToDelete->accessType !== Element::ACCESS_OWNER) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    deleteSemester($semesterToDelete);

}

finish();

?>