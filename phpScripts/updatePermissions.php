<?php

/*

Datei, die inkludiert wird, um Zugriffsrechte zu aktualisieren.

*/

include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/calculateMarks.php");

/*define("PERMISSION_SEMESTER", 1);
define("PERMISSION_SUBJECT", 2);
define("PERMISSION_TEST", 3);*/

function updatePermissions(Element $element, array &$permissions) : bool {

    global $mysqli;

    $attribute = $element->type === Element::TYPE_SEMESTER ? "semesterID" : "testID";

    // Alte Zugriffsrechte laden

    $stmt = $mysqli->prepare("SELECT permissions.*, users.userName, users.type FROM permissions LEFT JOIN users ON permissions.userID = users.userID WHERE " . $attribute . " = ?");
    $stmt->bind_param("i", $element->data[$attribute]);
    $stmt->execute();

    $result = $stmt->get_result();
    $oldPermissions = array();

    while($currentRow = $result->fetch_assoc()) {

        $oldPermissions[strtolower($currentRow["userName"])] = array(

            "writingPermission" => (bool)$currentRow["writingPermission"],
            "userID" => $currentRow["userID"],
            "isTeacher" => $currentRow["type"] === "teacher" || $currentRow["type"] === "admin"

        );

    }


    // Neue Zugriffsrechte ueberpruefen und herausfinden, ob sie neu sind

    $newPermissions = array();

    $permissionsToAdd = array();
    $permissionsToChange = array();
    $permissionsToDelete = array();
    
    foreach($permissions as &$currentPermission) {

        if(!is_array($currentPermission) || !is_string($currentPermission["userName"]) || !array_key_exists("writingPermission", $currentPermission)) {

            return false;

        }

        $currentPermission["userName"] = strtolower($currentPermission["userName"]);

        if(isset($newPermissions[$currentPermission["userName"]])) {

            return false;

        }

        $newPermissions[$currentPermission["userName"]] = true;
        
        if(array_key_exists($currentPermission["userName"], $oldPermissions)) {
            
            $currentPermission["userID"] = $oldPermissions[$currentPermission["userName"]]["userID"];
            $currentPermission["isTeacher"] = $oldPermissions[$currentPermission["userName"]]["isTeacher"];

            if(is_null($currentPermission["writingPermission"])) {

                $permissionsToDelete[] = $currentPermission;

            } elseif($currentPermission["writingPermission"] !== $oldPermissions[$currentPermission["userName"]]["writingPermission"]) {

                $permissionsToChange[] = $currentPermission;

            }

        } else {

            if(!is_null($currentPermission["writingPermission"])) {

                $permissionsToAdd[] = $currentPermission;

            }

        }

    }
    
    if(!empty($permissionsToDelete)) {
        
        // Berechtigungen loeschen

        $arguments = array();

        foreach($permissionsToDelete as &$currentPermission) {

            $arguments[] = $currentPermission["userID"];

        }

        $parameterTypes = str_repeat("i", count($arguments) + 1);
        $queryFragment = str_repeat("?, ", count($arguments) - 1) . "?";

        $stmt->prepare("DELETE FROM permissions WHERE " . $attribute . " = ? AND userID IN (" . $queryFragment . ")");
        $stmt->bind_param($parameterTypes, $element->data[$attribute], ...$arguments);
        $stmt->execute();


        // IDs der Verknuepfungen inkl. IDs der Zielobjekte laden, die auf ein Element in diesem Semester/Fach verweisen.
        // Testen, ob noch berechtigt

        $referencedTests = array();
        $refsToChange = array();

        if($element->type === Element::TYPE_SEMESTER) {

            $stmt->prepare("SELECT tests.testID, tests.referenceID, semesters.classID FROM tests INNER JOIN semesters ON (semesters.semesterID = tests.semesterID AND semesters.userID = ?) WHERE (tests.referenceState = \"ok\" OR tests.referenceState = \"outdated\") AND EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND tests2.semesterID = ?)");

            $skipSharedTest = true;
            $skipTeacherTest = false;

        } else {

            $stmt->prepare("SELECT tests.testID, tests.referenceID, semesters.classID FROM tests INNER JOIN semesters ON (semesters.semesterID = tests.semesterID AND semesters.userID = ?) WHERE (tests.referenceState = \"ok\" OR tests.referenceState = \"outdated\") AND EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND tests2.subjectID = ?)");

            $skipSharedTest = false;
            $skipTeacherTest = true;

        }

        foreach($permissionsToDelete as $currentPermission) {

            $stmt->bind_param("ii", $currentPermission["userID"], $element->data[$attribute]);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            foreach($result as &$refTestData) {

                $test = getTest($refTestData["referenceID"], $currentPermission["userID"], $currentPermission["isTeacher"], false, true, $skipSharedTest, $skipTeacherTest);

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

    }

    if(!empty($permissionsToChange)) {

        $stmt->prepare("UPDATE permissions SET writingPermission = ? WHERE " . $attribute . " = ? AND userID = ?");

        foreach($permissionsToChange as &$currentPermission) {

            $stmt->bind_param("iii", $currentPermission["writingPermission"], $element->data[$attribute], $currentPermission["userID"]);
            $stmt->execute();

        }

    }

    if(!empty($permissionsToAdd)) {

        // userID zu entsprechendem userName laden und ueberpruefen, ob Berechtigung ueberhaupt moeglich

        $stmt->prepare("SELECT userID, type FROM users WHERE userName = ? AND deleteTimestamp IS NULL");

        foreach($permissionsToAdd as &$currentPermission) {
            
            $stmt->bind_param("s", $currentPermission["userName"]);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_assoc();

            if(is_null($result)) {

                return false;

            }

            if(!is_null($element->data["classID"]) && $result["type"] !== "teacher" && $result["type"] !== "admin") {

                return false;

            }

            if($result["userID"] === $element->data["userID"]) {

                return false;

            }

            $currentPermission["userID"] = $result["userID"];

        }


        // Berechtigungen hinzufuegen

        $arguments = array();
        $parameterTypes = str_repeat("i", count($permissionsToAdd) * 3);
        $queryFragment = str_repeat("(?, ?, ?), ", count($permissionsToAdd) - 1) . "(?, ?, ?)";

        foreach($permissionsToAdd as &$currentPermission) {

            array_push($arguments, $element->data[$attribute], $currentPermission["userID"], $currentPermission["writingPermission"]);

        }

        $stmt->prepare("INSERT INTO permissions (" . $attribute . ", userID, writingPermission) VALUES " . $queryFragment);
        $stmt->bind_param($parameterTypes, ...$arguments);
        $stmt->execute();


        // Elemente laden, auf die der Zugriff nun berechtigt ist.

        $arguments = array();

        foreach($permissionsToAdd as &$currentPermission) {

            $arguments[] = $currentPermission["userID"];

        }

        $parameterTypes = str_repeat("i", count($arguments) + 1);
        $queryFragment = str_repeat("?, ", count($arguments) - 1) . "?";

        if($element->type === Element::TYPE_SEMESTER) {

            $stmt->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID INNER JOIN tests AS tests2 ON (tests2.testID = tests.referenceID AND tests2.semesterID = ?) WHERE semesters.userID IN (" . $queryFragment . ") AND tests.referenceState = \"forbidden\" AND EXISTS (SELECT 1 FROM semesters AS semesters2 WHERE semesters2.semesterID = tests2.semesterID AND semesters2.classID <=> semesters.classID)");
        
        } else {

            $stmt->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID INNER JOIN tests AS tests2 ON (tests2.testID = tests.referenceID AND tests2.subjectID = ?) WHERE semesters.userID IN (" . $queryFragment . ") AND tests.referenceState = \"forbidden\" AND EXISTS (SELECT 1 FROM semesters AS semesters2 WHERE semesters2.semesterID = tests2.semesterID AND semesters2.classID <=> semesters.classID)");

        }

        $stmt->bind_param($parameterTypes, $element->data[$attribute], ...$arguments);
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


        // Verknuepfungen neu berechnen lassen
        
        foreach($changedRefs as &$currentRef) {
            
            $currentRef["referenceState"] = "ok";
            $currentTest = new Test(ERROR_NONE, -1, true, $currentRef);
            updateMarks($currentTest);

        }

    }

    $stmt->close();

    return true;

}

/*function addPermissions(int $type, int $element->data[$attribute], array &$userIDs) {

    global $mysqli;

    // Elemente laden, auf die der Zugriff nun berechtigt ist.

    $arguments = $userIDs;
    $parameterTypes = str_repeat("i", count($userIDs) + 1);
    $queryFragment = str_repeat("?, ", count($userIDs) - 1) . "?";

    $arguments[] = $element->data[$attribute];

    $stmt = $mysqli->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID WHERE semesters.userID IN (" . $queryFragment . ") AND tests.referenceState = \"forbidden\" AND EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND tests2.semesterID = ?) AND EXISTS (SELECT 1 FROM semesters AS semesters2 WHERE semesters2.classID <=> semesters.classID)");
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

}*/


/*function deletePermissions(int $type, int $element->data[$attribute], array &$userIDs) {

    global $mysqli;

    // IDs der Verknuepfungen inkl. IDs der Zielobjekte laden, die auf ein Element in diesem Semester verweisen.
    // Testen, ob noch berechtigt

    $stmt = $mysqli->prepare("SELECT tests.testID, tests.referenceID, semesters.classID FROM tests INNER JOIN semesters ON (semesters.semesterID = tests.semesterID AND semesters.userID = ?) WHERE (tests.referenceState = \"ok\" OR tests.referenceState = \"outdated\") AND EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND tests2.semesterID = ?)");

    $referencedTests = array();
    $refsToChange = array();

    foreach($userIDs as $userID) {

        $stmt->bind_param("ii", $userID, $element->data[$attribute]);
        $stmt->execute();

        $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        foreach($result as &$refTestData) {

            $test = getTest($refTestData["referenceID"], $userID, true, false, true, true);

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

}*/


?>