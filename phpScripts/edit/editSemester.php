<?php

/*

Semester oder Semesterordner bearbeiten

Input als JSON per POST bestehend aus Array, jeweils mit:
    semesterID
    Alle Daten, die geaendert werden sollten (*: Darf NULL sein):
        name
        isHidden
        notes*
        templateType (bei Vorlagen)
        referenceTestID* (wenn referenceID gesetzt)

*/

function editSemester(Semester $semester, array &$data) : bool {
    
    global $mysqli;

    if($semester->error !== ERROR_NONE) {

        return false;

    }

    $changedProperties = array();

    if(array_key_exists("name", $data)) {

        if(!is_string($data["name"]) || strlen($data["name"]) >= 64) {

            return false;

        }

        if($data["name"] !== $semester->data["name"]) {

            $changedProperties["name"] = $data["name"];

        } 

    }

    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return false;

        }
        
        if($data["isHidden"] != $semester->data["isHidden"]) {
            
            $changedProperties["isHidden"] = (int)$data["isHidden"];

        }

    }

    if(array_key_exists("notes", $data)) {

        if((!is_string($data["notes"]) && !is_null($data["notes"])) || strlen($data["notes"] >= 256)) {

            return false;

        }

        if($data["notes"] === "") {

            $data["notes"] = NULL;

        }

        if($data["notes"] != $semester->data["notes"]) {

            $changedProperties["notes"] = $data["notes"];

        }

    }

    if(array_key_exists("templateType", $data)) {

        if(is_null($semester->data["templateType"])) {

            return false;

        }

        if($data["templateType"] !== "semesterTemplate" && $data["templateType"] !== "subjectTemplate") {

            return false;

        }

        if($data["templateType"] !== $semester->data["templateType"]) {

            $changedProperties["templateType"] = $data["templateType"];

        }

    }

    if(array_key_exists("referenceTestID", $data)) {

        if(is_null($semester->data["referenceID"]) || !is_numeric($data["referenceTestID"])) {

            return false;

        }

        $stmt = $mysqli->prepare("SELECT testID FROM tests WHERE testID = ? AND deleteTimestamp IS NULL");
        $stmt->bind_param("i", $data["referenceTestID"]);
        $stmt->execute();

        if($stmt->get_result()->num_rows < 0) {

            $stmt->close();
            return false;

        }

        $stmt->close();

        $changedProperties["referenceTestID"] = (int)$data["referenceTestID"];

    }
    
    if(count($changedProperties) > 0) {

        $queryString = "UPDATE semesters SET ";
        $typeString = "";

        foreach($changedProperties as $key => &$value) {

            $queryString .= $key . " = ?, ";
            
            if(is_int($value)) {

                $typeString .= "i";

            } else {

                $typeString .= "s";

            }

        }

        $queryString = substr($queryString, 0, -2);
        $queryString .= " WHERE semesterID = ?";
        $typeString .= "i";

        $changedProperties[] = $semester->data["semesterID"];

        $stmt = $mysqli->prepare($queryString);

        $stmt->bind_param($typeString, ...array_values($changedProperties));
        $stmt->execute();
        $stmt->close();

    }

    
    if(array_key_exists("permissions", $data)) {
        
        if($semester->data["isFolder"] || !is_array($data["permissions"])) {

            return false;

        }

        $stmt = $mysqli->prepare("SELECT permissions.*, users.userName, users.isTeacher FROM permissions LEFT JOIN users ON permissions.userID = users.userID WHERE semesterID = ?");
        $stmt->bind_param("i", $semester->data["semesterID"]);
        $stmt->execute();

        $result = $stmt->get_result();
        $oldPermissions = array();

        while($currentRow = $result->fetch_assoc()) {

            $oldPermissions[strtolower($currentRow["userName"])] = array(

                "writingPermission" => (bool)$currentRow["writingPermission"],
                "userID" => $currentRow["userID"],
                "isTeacher" => $currentRow["isTeacher"]

            );

        }

        $newPermissions = array();

        $permissionsToAdd = array();
        $permissionsToChange = array();
        $permissionsToDelete = array();
        
        foreach($data["permissions"] as &$currentPermission) {

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

                } else if($currentPermission["writingPermission"] !== $oldPermissions[$currentPermission["userName"]]["writingPermission"]) {

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
            $parameterTypes = str_repeat("i", count($permissionsToDelete) + 1);
            $queryFragment = str_repeat("?", count($permissionsToDelete));

            foreach($permissionsToDelete as &$currentPermission) {

                $arguments[] = $currentPermission["userID"];

            }

            $stmt->prepare("DELETE FROM permissions WHERE semesterID = ? AND userID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, $semester->data["semesterID"], ...$arguments);
            $stmt->execute();



            // IDs der Verknuepfungen inkl. IDs der Zielobjekte laden, die auf ein Element in diesem Semester verweisen.
            // Testen, ob noch berechtigt

            $stmt->prepare("SELECT tests.testID, tests.referenceID, semesters.classID FROM tests INNER JOIN semesters ON (semesters.semesterID = tests.semesterID AND semesters.userID = ?) WHERE (tests.referenceState = \"ok\" OR tests.referenceState = \"outdated\") AND EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND tests2.semesterID = ?)");

            $referencedTests = array();
            $refsToChange = array();

            foreach($permissionsToDelete as &$currentPermission) {

                $stmt->bind_param("ii", $currentPermission["userID"], $semester->data["semesterID"]);
                $stmt->execute();

                $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

                foreach($result as &$refTestData) {

                    $test = getTest($refTestData["referenceID"], $currentPermission["userID"], $currentPermission["isTeacher"], false, true, true);

                    if($test->error !== ERROR_NONE || (!is_null($refTestData["classID"]) && $test->accessType === Element::ACCESS_STUDENT)) {

                        $refsToChange[] = $refTestData["testID"];

                        if(!array_key_exists($refTestData["referenceID"], $referencedTests)) {

                            $referencedTests[$refTestData["referenceID"]] = false;

                        }

                    } else {

                        $referencedTests[$refTestData["testID"]] = true;

                    }

                }

            }



            // Verknuepfungen als forbidden bezeichnen

            $parameterTypes = str_repeat("i", count($refsToChange));
            $queryFragment = str_repeat("?", count($refsToChange));

            $stmt->prepare("UPDATE tests SET referenceState = \"forbidden\" WHERE testID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, ...$refsToChange);
            $stmt->execute();


            
            // isReferenced nach moeglicher Aenderung untersuchen und aktualisieren

            $arguments = array();
            $parameterTypes = "i";
            $queryFragment = "";

            foreach($referencedTests as $key => $currentTest) {

                if(!$currentTest) {

                    $arguments[] = $key;
                    $parameterTypes .= "i";
                    $queryFragment .= "? ";

                }

            }

            $stmt->prepare("UPDATE tests SET tests.isReferenced = 0 WHERE tests.testID IN (" . $arguments . ") AND tests.isReferenced = 1 AND NOT EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests.testID = tests2.referenceID AND (tests2.referenceState = \"ok\" OR tests2.referenceState = \"outdated\"))");
            $stmt->bind_param($parameterTypes, ...$arguments);
            $stmt->execute();

        }

        if(!empty($permissionsToChange)) {

            $stmt->prepare("UPDATE permissions SET writingPermission = ? WHERE semesterID = ? AND userID = ?");

            foreach($permissionsToChange as &$currentPermission) {

                $stmt->bind_param("iii", $currentPermission["writingPermission"], $semester->data["semesterID"], $currentPermission["userID"]);
                $stmt->execute();

            }

        }

        if(!empty($permissionsToAdd)) {

            // userID zu entsprechendem userName laden und ueberpruefen, ob Berechtigung ueberhaupt moeglich

            $stmt->prepare("SELECT userID, type FROM users WHERE userName = ? AND deleteTimestamp IS NULL");
            //$stmt_refs = $mysqli->prepare("UPDATE tests SET tests.referenceState = \"ok\" WHERE EXISTS (SELECT semesters.userID FROM semesters WHERE semesters.semesterID = tests.semesterID AND semesters.semesterID = ?) AND EXISTS (SELECT tests2.testID FROM tests AS tests2 WHERE tests.referenceID = test2.testID AND tests2.semesterID = ?)");

            foreach($permissionsToAdd as &$currentPermission) {
                
                $stmt->bind_param("s", $currentPermission["userName"]);
                $stmt->execute();

                $result = $stmt->get_result()->fetch_assoc();

                if(is_null($result)) {

                    return false;

                }

                if(!is_null($semester->data["classID"]) && $result["type"] !== "teacher" && $result["type"] !== "admin") {

                    return false;

                }

                if($result["userID"] === $semester->data["userID"]) {

                    return false;

                }

                $currentPermission["userID"] = $result["userID"];

            }


            // Berechtigungen hinzufuegen

            $arguments = array();
            $parameterTypes = str_repeat("i", count($permissionsToAdd) * 3);
            $queryFragment = str_repeat("(?, ?, ?), ", count($permissionsToAdd) - 1) . "(?, ?, ?)";

            foreach($permissionsToAdd as &$currentPermission) {

                array_push($arguments, $semester->data["semesterID"], $currentPermission["userID"], $currentPermission["writingPermission"]);

            }

            $stmt->prepare("INSERT INTO permissions (semesterID, userID, writingPermission) VALUES " . $queryFragment);
            $stmt->bind_param($parameterTypes, ...$arguments);
            $stmt->execute();



            // Elemente laden, auf die der Zugriff nun berechtigt ist.

            $arguments = array();
            $parameterTypes = str_repeat("i", count($permissionsToAdd) + 1);
            $queryFragment = str_repeat("?", count($permissionsToAdd));

            foreach($permissionsToAdd as &$currentPermission) {

                $arguments[] = $currentPermission["userID"];

            }

            $arguments[] = $semester->data["semesterID"];

            $stmt->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID WHERE semesters.userID IN (" . $queryFragment . ") AND tests.referenceState = \"forbidden\" AND EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND tests2.semesterID = ?) AND EXISTS(SELECT 1 FROM semesters AS semesters2 WHERE semesters2.classID IS NOT DISTINCT FROM semesters.classID)");
            $stmt->bind_param($parameterTypes, ...$arguments);
            $stmt->execute();

            $changedRefs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);



            // Elemente als zugriffsberechtigt markieren

            $referencedTests = array();
            
            $arguments = array();
            $parameterTypes = str_repeat("i", count($changedRefs));
            $queryFragment = str_repeat("?", count($changedRefs));

            foreach($changedRefs as &$currentRef) {

                $arguments[] = $currentRef["testID"];
                $referencedTests[$currentRef["referenceID"]] = true;

            }

            $stmt->prepare("UPDATE tests SET tests.referenceState = \"ok\" WHERE tests.testID IN (" . $arguments . ")");
            $stmt->bind_param($parameterTypes, ...$arguments);
            $stmt->execute();



            // Neu referenzierte Elemente als referenziert bezeichnen

            $arguments = array();
            $parameterTypes = str_repeat("i", count($referencedTests));
            $queryFragment = str_repeat("?", count($referencedTests));

            foreach($referencedTests as $key => &$currentTest) {

                $arguments[] = $key;

            }

            $stmt->prepare("UPDATE tests SET tests.isReferenced = 1 WHERE tests.testID IN (" . $arguments . ") AND tests.isReferenced = 0");
            $stmt->bind_param($parameterTypes, ...$arguments);
            $stmt->execute();



            // Verknuepfungen neu berechnen lassen

            foreach($changedRefs as &$currentRef) {

                $currentTest = new Test(ERROR_NONE, -1, true, $currentRef);
                updateMarks($currentTest);

            }

        }

        $stmt->close();

    }

    return true;

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

foreach($data as $key => &$currentSemesterData) {

    if(!isset($currentSemesterData["semesterID"]) || !is_numeric($currentSemesterData["semesterID"])) {

        throwError(ERROR_BAD_INPUT, $key);    
    
    }

    $semester = getSemester((int)$currentSemesterData["semesterID"], $_SESSION["userid"], $_SESSION["type"] === "admin" || $_SESSION["type"] === "admin");

    if($semester->error !== ERROR_NONE) {

        throwError(ERROR_FORBIDDEN, $key);

    }

    if($semester->accessType !== Element::ACCESS_OWNER) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    if(!editSemester($semester, $currentSemesterData)) {

        throwError(ERROR_BAD_INPUT, $key);

    }

}

finish();


?>