<?php

/*

Datei, die inkludiert wird, um Zugriffsrechte zu aktualisieren.

*/

include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/calculateMarks.php");

define("PERMISSION_SEMESTER", 1);
define("PERMISSION_SUBJECT", 2);
define("PERMISSION_TEST", 3);

function addPermissions(int $type, int $ID, array &$permissions) {

    global $mysqli;

    // Berechtigungen hinzufuegen

    $arguments = array();
    $parameterTypes = str_repeat("i", count($permissions) * 3);
    $queryFragment = str_repeat("(?, ?, ?), ", count($permissions) - 1) . "(?, ?, ?)";

    foreach($permissions as &$currentPermission) {

        array_push($arguments, $ID, $currentPermission["userID"], $currentPermission["writingPermission"]);

    }

    $stmt = $mysqli->prepare("INSERT INTO permissions (semesterID, userID, writingPermission) VALUES " . $queryFragment);
    $stmt->bind_param($parameterTypes, ...$arguments);
    $stmt->execute();



    // Elemente laden, auf die der Zugriff nun berechtigt ist.

    $arguments = array();
    $parameterTypes = str_repeat("i", count($permissions) + 1);
    $queryFragment = str_repeat("?, ", count($permissions) - 1) . "?";

    foreach($permissions as &$currentPermission) {

        $arguments[] = $currentPermission["userID"];

    }

    $arguments[] = $ID;

    $stmt->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID WHERE semesters.userID IN (" . $queryFragment . ") AND tests.referenceState = \"forbidden\" AND EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND tests2.semesterID = ?) AND EXISTS (SELECT 1 FROM semesters AS semesters2 WHERE semesters2.classID <=> semesters.classID)");
    $stmt->bind_param($parameterTypes, ...$arguments);
    $stmt->execute();

    $changedRefs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);



    // Elemente als zugriffsberechtigt markieren

    $referencedTests = array();

    if(!empty($changedRefs)) {
    
        $arguments = array();
        $parameterTypes = str_repeat("i", count($changedRefs));
        $queryFragment = str_repeat("?, ", count($changedRefs) - 1) . "?";

        foreach($changedRefs as &$currentRef) {

            $arguments[] = $currentRef["testID"];
            $referencedTests[$currentRef["referenceID"]] = true;

        }

        $stmt->prepare("UPDATE tests SET tests.referenceState = \"ok\" WHERE tests.testID IN (" . $queryFragment . ")");
        $stmt->bind_param($parameterTypes, ...$arguments);
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

    $stmt->close();

    // Verknuepfungen neu berechnen lassen
    
    foreach($changedRefs as &$currentRef) {
        
        $currentRef["referenceState"] = "ok";
        $currentTest = new Test(ERROR_NONE, -1, true, $currentRef);
        updateMarks($currentTest);

    }

}


function deletePermissions(int $type, int $ID, array &$permissions) {

    global $mysqli;

    // Berechtigungen loeschen

    $arguments = array();
    $parameterTypes = str_repeat("i", count($permissions) + 1);
    $queryFragment = str_repeat("?, ", count($permissions) - 1) . "?";

    foreach($permissions as &$currentPermission) {

        $arguments[] = $currentPermission["userID"];

    }

    $stmt = $mysqli->prepare("DELETE FROM permissions WHERE semesterID = ? AND userID IN (" . $queryFragment . ")");
    $stmt->bind_param($parameterTypes, $ID, ...$arguments);
    $stmt->execute();



    // IDs der Verknuepfungen inkl. IDs der Zielobjekte laden, die auf ein Element in diesem Semester verweisen.
    // Testen, ob noch berechtigt

    $stmt->prepare("SELECT tests.testID, tests.referenceID, semesters.classID FROM tests INNER JOIN semesters ON (semesters.semesterID = tests.semesterID AND semesters.userID = ?) WHERE (tests.referenceState = \"ok\" OR tests.referenceState = \"outdated\") AND EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND tests2.semesterID = ?)");

    $referencedTests = array();
    $refsToChange = array();

    foreach($permissions as &$currentPermission) {

        $stmt->bind_param("ii", $currentPermission["userID"], $ID);
        $stmt->execute();

        $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        foreach($result as &$refTestData) {

            $test = getTest($refTestData["referenceID"], $currentPermission["userID"], $currentPermission["isTeacher"], false, true, true);

            if($test->error !== ERROR_NONE || (!is_null($refTestData["classID"]) && $test->accessType === Element::ACCESS_STUDENT)) {

                $refsToChange[] = $refTestData["testID"];

                if(!array_key_exists($refTestData["referenceID"], $referencedTests)) {

                    $referencedTests[$refTestData["referenceID"]] = false;

                }

            }

        }

    }



    // Verknuepfungen als forbidden bezeichnen

    if(!empty($refsToChange)) {

        $parameterTypes = str_repeat("i", count($refsToChange));
        $queryFragment = str_repeat("?, ", count($refsToChange) - 1) . "?";

        $stmt->prepare("UPDATE tests SET referenceState = \"forbidden\" WHERE testID IN (" . $queryFragment . ")");
        $stmt->bind_param($parameterTypes, ...$refsToChange);
        $stmt->execute();

    }

    
    
    // isReferenced nach moeglicher Aenderung untersuchen und aktualisieren

    if(!empty($arguments)) {

        $arguments = array_keys($referencedTests);
        $parameterTypes = str_repeat("i", count($referencedTests));
        $queryFragment = str_repeat("?, ", count($referencedTests) - 1) . "?";

        $stmt->prepare("UPDATE tests SET tests.isReferenced = 0 WHERE tests.testID IN (" . $queryFragment . ") AND tests.isReferenced = 1 AND NOT EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests.testID = tests2.referenceID AND (tests2.referenceState = \"ok\" OR tests2.referenceState = \"outdated\"))");
        $stmt->bind_param($parameterTypes, ...$arguments);
        $stmt->execute();

    }

    $stmt->close();

}


?>