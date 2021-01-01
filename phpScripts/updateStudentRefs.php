<?php

/*

Datei, die inkludiert wird, um den Status von Verknuepfungen von Schuelern zu aktualisieren

*/

function updateRefsToForbidden(int $classID, array $userIDs = NULL) {

    global $mysqli;

    // Elemente laden, bei denen der Zugriff nun nicht mehr berechtigt ist.
    if($userIDs === NULL) {

        $stmt = $mysqli->prepare("SELECT tests.testID, tests.referenceID FROM tests WHERE EXISTS (SELECT 1 FROM semesters WHERE semesters.semesterID = tests.semesterID AND semesters.classID IS NULL) AND EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND EXISTS (SELECT 1 FROM semesters WHERE semesters.semesterID = tests2.semesterID AND semesters.classID = ?)) AND (tests.referenceState = \"ok\" OR tests.referenceState = \"outdated\" OR tests.referenceState = \"delTemp\")");
        $stmt->bind_param("i", $classID);
        $stmt->execute();

        $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    } else {

        if(!empty($userIDs)) {

            $parameterTypes = str_repeat("i", count($userIDs) + 1);
            $queryFragment = str_repeat("?, ", count($userIDs) - 1) . "?";

            $stmt = $mysqli->prepare("SELECT tests.testID, tests.referenceID FROM tests WHERE EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND EXISTS (SELECT 1 FROM semesters WHERE semesters.semesterID = tests2.semesterID AND semesters.classID = ?)) AND EXISTS (SELECT 1 FROM semesters WHERE semesters.semesterID = tests.semesterID AND semesters.classID IS NULL AND semesters.userID IN (" . $queryFragment . ")) AND (tests.referenceState = \"ok\" OR tests.referenceState = \"outdated\" OR tests.referenceState = \"delTemp\")");
            $stmt->bind_param($parameterTypes, $classID, ...$userIDs);
            $stmt->execute();

            $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        } else {

            $results = array();

        }

    }

    $referencedTests = array();
    $refIDs = array();

    foreach($results as &$refTestData) {

        $referencedTests[$refTestData["referenceID"]] = false;
        $refIDs[] = $refTestData["testID"];

    }



    // Verknuepfungen als forbidden bezeichnen

    if(!empty($refIDs)) {

        $parameterTypes = str_repeat("i", count($refIDs));
        $queryFragment = str_repeat("?, ", count($refIDs) - 1) . "?";

        $stmt->prepare("UPDATE tests SET referenceState = IF(tests.referenceState = \"delTemp\", \"delForbidden\", \"forbidden\") WHERE testID IN (" . $queryFragment . ")");
        $stmt->bind_param($parameterTypes, ...$refIDs);
        $stmt->execute();

    }



    // isReferenced nach moeglicher Aenderung untersuchen und aktualisieren

    if(!empty($referencedTests)) {

        $arguments = array_keys($referencedTests);
        $parameterTypes = str_repeat("i", count($referencedTests));
        $queryFragment = str_repeat("?, ", count($referencedTests) - 1) . "?";

        $stmt->prepare("UPDATE tests SET tests.isReferenced = 0 WHERE tests.testID IN (" . $queryFragment . ") AND tests.isReferenced = 1 AND NOT EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests.testID = tests2.referenceID AND (tests2.referenceState = \"ok\" OR tests2.referenceState = \"outdated\" OR tests2.referenceState = \"delTemp\"))");
        $stmt->bind_param($parameterTypes, ...$arguments);
        $stmt->execute();

    }

}

function updateRefsToAllowed(int $classID, array $userIDs = NULL) {

    global $mysqli;

    // Elemente laden, bei denen der Zugriff nun berechtigt ist / wäre.

    if($userIDs === NULL) {

        $stmt = $mysqli->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON (semesters.semesterID = tests.semesterID) WHERE EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND EXISTS (SELECT 1 FROM semesters AS semesters2 WHERE semesters2.semesterID = tests2.semesterID AND semesters2.classID = ?)) AND semesters.classID IS NULL AND (tests.referenceState = \"forbidden\" OR tests.referenceState = \"delForbidden\")");
        $stmt->bind_param("i", $classID);
        $stmt->execute();

        $changedRefs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    } else {

        if(!empty($userIDs)) {
            
            $parameterTypes = str_repeat("i", count($userIDs) + 1);
            $queryFragment = str_repeat("?, ", count($userIDs) - 1) . "?";

            $stmt = $mysqli->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID WHERE EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND EXISTS (SELECT 1 FROM semesters AS semesters2 WHERE semesters2.semesterID = tests2.semesterID AND semesters2.classID = ?)) AND semesters.classID IS NULL AND semesters.userID IN (" . $queryFragment . ") AND (tests.referenceState = \"forbidden\" OR tests.referenceState = \"delForbidden\")");
            $stmt->bind_param($parameterTypes, $classID, ...$userIDs);
            $stmt->execute();

            $changedRefs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        } else {

            $changedRefs = array();

        }

    }

    $referencedTests = array();
    $refIDs = array();

    foreach($changedRefs as &$refTestData) {

        $referencedTests[$refTestData["referenceID"]] = true;
        $refIDs[] = $refTestData["testID"];

    }



    // Elemente als zugriffsberechtigt markieren

    if(!empty($refIDs)) {

        $parameterTypes = str_repeat("i", count($refIDs));
        $queryFragment = str_repeat("?, ", count($refIDs) - 1) . "?";

        $stmt->prepare("UPDATE tests SET referenceState = IF(tests.referenceState = \"forbidden\", \"ok\", \"delTemp\") WHERE testID IN (" . $queryFragment . ")");
        $stmt->bind_param($parameterTypes, ...$refIDs);
        $stmt->execute();

    }



    // Neu referenzierte Elemente als referenziert bezeichnen

    if(!empty($referencedTests)) {

        $arguments = array_keys($referencedTests);
        $parameterTypes = str_repeat("i", count($referencedTests));
        $queryFragment = str_repeat("?, ", count($referencedTests) - 1) . "?";

        $stmt->prepare("UPDATE tests SET tests.isReferenced = 1 WHERE tests.testID IN (" . $queryFragment . ") AND tests.isReferenced = 0");
        $stmt->bind_param($parameterTypes, ...$arguments);
        $stmt->execute();

    }

    // Verknuepfungen neu berechnen lassen

    include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
    
    foreach($changedRefs as &$currentRef) {

        if($currentRef["referenceState"] === "forbidden") {
        
            $currentRef["referenceState"] = "ok";
            $currentTest = new Test(ERROR_NONE, Element::ACCESS_UNDEFINED, true, $currentRef);
            updateMarks($currentTest);

        }

    }

}

