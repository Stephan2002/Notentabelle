<?php

/*

Datei, die eingebunden wird, wenn Elemente kopiert werden

*/

function selectChildSemesters(int $semesterID, string $deleteTimestamp = NULL, bool $ignoreTimestamp = false) : array {

    global $mysqli;
    global $stmt_subIDs;

    if($ignoreTimestamp) {

        $stmt_subIDs = $mysqli->prepare("SELECT semesterID, isFolder FROM semesters WHERE parentID = ?");

    } elseif($deleteTimestamp === NULL) {

        $stmt_subIDs = $mysqli->prepare("SELECT semesterID, isFolder FROM semesters WHERE parentID = ? AND deleteTimestamp IS NULL");

    } else {

        $stmt_subIDs = $mysqli->prepare("SELECT semesterID, isFolder FROM semesters WHERE parentID = ? AND deleteTimestamp = \"" . $deleteTimestamp . "\"");

    }

    $IDArray = array();
    $isFolderArray = array();

    selectChildren($semesterID, $IDArray, $isFolderArray);

    $stmt_subIDs->close();

    return array("IDArray" => &$IDArray, "isFolderArray" => &$isFolderArray);

}

function selectChildTests(int $testID, string $deleteTimestamp = NULL, bool $ignoreTimestamp = false) : array {

    global $mysqli;
    global $stmt_subIDs;

    if($ignoreTimestamp) {

        $stmt_subIDs = $mysqli->prepare("SELECT testID, isFolder FROM tests WHERE parentID = ?");

    } elseif($deleteTimestamp === NULL) {

        $stmt_subIDs = $mysqli->prepare("SELECT testID, isFolder FROM tests WHERE parentID = ? AND deleteTimestamp IS NULL");

    } else {

        $stmt_subIDs = $mysqli->prepare("SELECT testID, isFolder FROM tests WHERE parentID = ? AND deleteTimestamp = \"" . $deleteTimestamp . "\"");

    }

    $IDArray = array();
    $isFolderArray = array();
    
    selectChildren($testID, $IDArray, $isFolderArray);

    $stmt_subIDs->close();

    return array("IDArray" => &$IDArray, "isFolderArray" => &$isFolderArray);

}

function selectChildren(int $ID, array &$IDArray, array &$isFolderArray) {

    global $stmt_subIDs;

    $stmt_subIDs->bind_param("i", $ID);
    $stmt_subIDs->execute();
    
    $result = $stmt_subIDs->get_result()->fetch_all();

    foreach($result as $row) {

        $IDArray[] = $row[0];
        $isFolderArray[] = $row[1];
        
        if($row[1]) {

            selectChildren($row[0], $IDArray, $isFolderArray);

        }

    }



}

?>