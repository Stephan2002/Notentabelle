<?php

/*
Schueler bearbeiten.

Input als JSON per POST bestehend aus Array, jeweils mit: 
    studentID
    Alle Daten, die geaendert werden sollten (*: Darf NULL sein):
        lastName
        isHidden
        firstName*
        gender*
        userName*

Bei Fehlern wird nichts geaendert, ausser bei Fehlern bei:
    userName
        
*/

function editStudent(Student $student, array &$data) : array {
    
    global $mysqli;

    if($student->error !== ERROR_NONE) {

        return array("error" => $student->error);

    }

    $changedProperties = array();
    $changes = NULL;

    if(array_key_exists("lastName", $data)) {

        if(!is_string($data["lastName"]) || $data["lastName"] === "" || strlen($data["lastName"]) >= 64) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($data["lastName"] !== $student->data["lastName"]) {

            $changedProperties["lastName"] = $data["lastName"];
            $student->data["lastName"] = $data["lastName"];

        } 

    }

    if(array_key_exists("firstName", $data)) {

        if((!is_string($data["firstName"]) && !is_null($data["firstName"])) || strlen($data["firstName"] >= 64)) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($data["firstName"] === "") {

            $data["firstName"] = NULL;

        }

        if($data["firstName"] != $student->data["firstName"]) {

            $changedProperties["firstName"] = $data["firstName"];
            $student->data["firstName"] = $data["firstName"];

        }

    }

    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return array("error" => ERROR_BAD_INPUT);

        }
        
        if($data["isHidden"] != $student->data["isHidden"]) {
            
            $changedProperties["isHidden"] = (int)$data["isHidden"];
            $student->data["isHidden"] = (int)$data["isHidden"];

        }

    }

    if(array_key_exists("gender", $data)) {
        
        if(!is_null($data["gender"]) && $data["gender"] !== "m" && $data["gender"] !== "f" && $data["gender"] !== "d") {

            return array("error" => ERROR_BAD_INPUT);

        }
        
        if($data["gender"] != $student->data["gender"]) {
            
            $changedProperties["gender"] = $data["gender"];
            $student->data["gender"] = $data["gender"];

        }

    }
    
    if(!empty($changedProperties)) {

        $queryString = "UPDATE students SET ";
        $parameterTypes = "";

        foreach($changedProperties as $key => &$value) {

            $queryString .= $key . " = ?, ";
            
            if(is_int($value)) {

                $parameterTypes .= "i";

            } else {

                $parameterTypes .= "s";

            }

        }

        $queryString = substr($queryString, 0, -2);
        $queryString .= " WHERE studentID = ?";
        $parameterTypes .= "i";

        $changedProperties[] = $student->data["studentID"];

        $stmt = $mysqli->prepare($queryString);

        $stmt->bind_param($parameterTypes, ...array_values($changedProperties));
        $stmt->execute();
        $stmt->close();

        $changes = true;

    }

    if(array_key_exists("userName", $data)) {

        $oldUserID = $student->data["userID"];
        $newUserID = NULL;

        if(is_string($data["userName"])) {

            $data["userName"] = strtolower($data["userName"]);

            if($data["userName"] !== strtolower($student->data["userName"])) {
                
                $stmt = $mysqli->prepare("SELECT userID FROM users WHERE userName = ? AND userID NOT IN (SELECT userID FROM students WHERE students.classID = ? AND students.userID = users.userID) AND deleteTimestamp IS NULL");
                $stmt->bind_param("si", $data["userName"], $student->data["classID"]);
                $stmt->execute();

                $result = $stmt->get_result()->fetch_assoc();
                $stmt->close();
                
                if(is_null($result)) {

                    return array("error" => ERROR_UNSUITABLE_INPUT, "changes" => $changes);

                }
                
                if($result["userID"] === $student->data["classUserID"]) {

                    return array("error" => ERROR_UNSUITABLE_INPUT, "changes" => $changes);

                }
                
                $newUserID = $result["userID"];

            } else {

                $newUserID = $oldUserID;

            }

        } elseif(!is_null($data["userName"])) {

            return array("error" => ERROR_BAD_INPUT, "changes" => $changes);

        }

        if($newUserID !== $oldUserID) {

            $stmt = $mysqli->prepare("UPDATE students SET userID = ? WHERE studentID = ?");
            $stmt->bind_param("ii", $newUserID, $student->data["studentID"]);
            $stmt->execute();


            if(!is_null($oldUserID)) {

                // Elemente laden, auf die der Zugriff nun nicht mehr berechtigt ist.
                
                $stmt->prepare("SELECT tests.testID, tests.referenceID FROM tests WHERE EXISTS (SELECT 1 FROM semesters WHERE semesters.semesterID = tests.semesterID AND semesters.userID = ?) AND EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND EXISTS (SELECT 1 FROM semesters WHERE semesters.semesterID = tests2.semesterID AND semesters.classID = ?)) AND EXISTS (SELECT 1 FROM semesters WHERE semesters.semesterID = tests.semesterID AND semesters.classID IS NULL) AND (tests.referenceState = \"ok\" OR tests.referenceState = \"outdated\")");
                $stmt->bind_param("ii", $oldUserID, $student->data["classID"]);
                $stmt->execute();

                $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

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

                    $stmt->prepare("UPDATE tests SET referenceState = \"forbidden\" WHERE testID IN (" . $queryFragment . ")");
                    $stmt->bind_param($parameterTypes, ...$refIDs);
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

            if(!is_null($newUserID)) {

                // Elemente laden, auf die der Zugriff nun berechtigt ist.

                $stmt->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON (semesters.semesterID = tests.semesterID AND semesters.userID = ?) WHERE EXISTS (SELECT 1 FROM tests AS tests2 WHERE tests2.testID = tests.referenceID AND EXISTS (SELECT 1 FROM semesters AS semesters2 WHERE semesters2.semesterID = tests2.semesterID AND semesters2.classID = ?)) AND semesters.classID IS NULL AND tests.referenceState = \"forbidden\"");
                $stmt->bind_param("ii", $newUserID, $student->data["classID"]);
                $stmt->execute();

                $changedRefs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

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

                    $stmt->prepare("UPDATE tests SET referenceState = \"ok\" WHERE testID IN (" . $queryFragment . ")");
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
                    
                    $currentRef["referenceState"] = "ok";
                    $currentTest = new Test(ERROR_NONE, -1, true, $currentRef);
                    updateMarks($currentTest);

                }

            }

            $stmt->close();

            $changes = true;

        }
        


    }

    return array("error" => ERROR_NONE, "changes" => $changes);

}

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

if($_SESSION["type"] !== "teacher" && $_SESSION["type"] !== "admin") {

    throwError(ERROR_ONLY_TEACHER);

}

$data = getData();

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

if(!is_array($data)) {

    throwError(ERROR_BAD_INPUT);

}

foreach($data as $key => &$currentStudentData) {

    if(!isset($currentStudentData["studentID"])) {

        throwError(ERROR_MISSING_INPUT, $key);

    }
        
    if(!is_int($currentStudentData["studentID"])) {

        throwError(ERROR_BAD_INPUT, $key);
    
    }

}

$response = array();

foreach($data as $key => &$currentStudentData) {

    $student = getStudent($currentStudentData["studentID"], $_SESSION["userid"]);

    if($student->error !== ERROR_NONE) {
        
        sendResponse($response, $student->error, $key);

    }

    if(!$student->writingPermission) {

        sendResponse($response, ERROR_NO_WRTITING_PERMISSION, $key);

    }

    $errorAndChanges = editStudent($student, $currentStudentData);

    if(array_key_exists("changes", $errorAndChanges)) {

        $response[] = $errorAndChanges["changes"];

    }

    if($errorAndChanges["error"] !== ERROR_NONE) {

        sendResponse($response, $errorAndChanges["error"], $key);
        

    }

}

sendResponse($response);

?>