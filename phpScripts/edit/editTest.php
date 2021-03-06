<?php

/*

Prüfung/Fach/Ordner bearbeiten bzw. Noten aendern

Input als JSON per POST bestehend aus Array, jeweils mit:
    testID
    Alle Daten, die geaendert werden sollten (*: Darf NULL sein):
        name
        isHidden
        date*
        weight (nur bei Noten)
        round (nur bei Noten)
        maxPoints (nur bei Punkten, darf nur NULL sein bei formula: manual)
        formula (nur bei Noten und Punkten)
        markCounts
        notes*
        referenceID* (nur, wenn schon Referenz, wenn keine Vorlage)
        permissions* (nur bei Fach, nur bei Klassensemestern): Array aus Objekten mit:
            userName
            writingPermission
        mark* (nur bei Pruefung mit Noten oder bei Ordner mit formula: manual, nur bei privaten Semestern, wenn keine Vorlage)
        points* (nur bei Pruefungen mit Punkten, nur bei privaten Semestern, wenn keine Vorlage)
        students* (nur bei Klassensemestern): Array aus Objekten mit:
            studentID
            mark (bei Pruefung mit Noten oder bei Ordner mit formula: manual)
            points (bei Pruefungen mit Punkten)
            notes (studentNotes)

Bei Fehlern wird nichts geaendert, ausser bei Fehlern bei:
    students, mark/points
    permissions

Verknuepfungen werden noch auf neue Noten aktualisiert, bevor Berechtigung entfernt wird

*/

define("REGEX_MARK", "/^-?(?:0|[1-9]\d?).\d{6}$/D");
define("REGEX_OTHER", "/^-?(?:0|[1-9]\d{0,3}).\d{3}$/D");

function editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded) {

    if($needsUpdate) {

        if(!$updateMarksIncluded) {

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
            $updateMarksIncluded = true;

        }

        updateMarks($test, false);

    }

};

function editTest(Test $test, array &$data, int $userID, bool $isTeacher, bool $onlyMarks) : array {
    
    global $mysqli;

    $needsUpdate = false;
    $needsRecalc = false;
    $updateMarksIncluded = false;

    if($test->error !== ERROR_NONE) {
        
        return array("error" => $test->error);

    }

    if(!$test->writingPermission) {

        return array("error" => ERROR_NO_WRITING_PERMISSION);

    }

    if($onlyMarks) {

        foreach(array_keys($data) as $key) {

            if($key !== "students") {
                echo "test";
                return array("error" => ERROR_FORBIDDEN_FIELD);

            }

        }

    }

    $changedProperties = array();
    $changes = NULL;

    if(array_key_exists("name", $data)) {

        if(!is_string($data["name"]) || $data["name"] === "" || strlen($data["name"]) >= MAX_LENGTH_NAME) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($data["name"] !== $test->data["name"]) {

            $changedProperties["name"] = $data["name"];
            $test->data["name"] = $data["name"];

        } 

    }

    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return array("error" => ERROR_BAD_INPUT);

        }
        
        if($data["isHidden"] != $test->data["isHidden"]) {
            
            $changedProperties["isHidden"] = (int)$data["isHidden"];
            $test->data["isHidden"] = (int)$data["isHidden"];

        }

    }

    if(array_key_exists("date", $data)) {

        if(is_int($data["date"])) {

            if($data["date"] < -30610224000 || $data["date"] > 253402214400) {

                return array("error" => ERROR_BAD_INPUT);

            }

            date_default_timezone_set("UTC");
            $date = date("Y-m-d", $data["date"]);

        } elseif(is_null($data["date"])) {

            $date = NULL;

        } else {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($date !== $test->data["date"]) {

            $changedProperties["date"] = $date;
            $test->data["date"] = $date;

        }

    }

    if(array_key_exists("weight", $data)) {

        if(!is_string($data["weight"]) || !preg_match(REGEX_OTHER, $data["weight"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($test->data["round"] === NULL) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

        if($data["weight"] !== $test->data["weight"]) {

            $changedProperties["weight"] = $data["weight"];
            $test->data["weight"] = $data["weight"];

            $needsUpdate = true;

        }

    }

    if(array_key_exists("round", $data)) {

        if(!is_string($data["round"]) || !preg_match(REGEX_OTHER, $data["round"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($test->data["round"] === NULL) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

        if($data["round"] !== $test->data["round"]) {

            $changedProperties["round"] = $data["round"];
            $test->data["round"] = $data["round"];

            $needsUpdate = true;

        }

    }

    if(array_key_exists("formula", $data)) {

        $formulaOptions = array("manual", "linear");
        $optionFound = false;

        foreach($formulaOptions as $option) {

            if($data["formula"] === $option) {

                $optionFound = true;
                break;

            }

        }

        if($optionFound) {

            if(!is_string($test->data["formula"])) {

                return array("error" => ERROR_FORBIDDEN_FIELD);
    
            }

            if($data["formula"] !== $test->data["formula"]) {

                if($test->data["formula"] === "manual" && is_null($test->data["maxPoints"]) && !isset($data["maxPoints"])) {

                    return array("error" => ERROR_UNSUITABLE_INPUT);

                }

                $changedProperties["formula"] = $data["formula"];
                $test->data["formula"] = $data["formula"];

                $needsRecalc = true;
    
            }

        } else {

            return array("error" => ERROR_BAD_INPUT);

        }

    }

    if(array_key_exists("maxPoints", $data)) {

        if(!is_null($data["maxPoints"]) && (!is_string($data["maxPoints"]) || !preg_match(REGEX_OTHER, $data["maxPoints"]))) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if(!is_null($test->data["round"]) && is_null($test->data["formula"])) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

        if(is_null($data["maxPoints"])) {

            $hasNewFormula = isset($changedProperties["formula"]);

            if($test->data["formula"] !== "manual") {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

        }

        if($data["maxPoints"] !== $test->data["maxPoints"]) {

            $changedProperties["maxPoints"] = $data["maxPoints"];
            $test->data["maxPoints"] = $data["maxPoints"];

            $needsRecalc = true;

        }

    }

    if(array_key_exists("markCounts", $data)) {
        
        if(!is_bool($data["markCounts"])) {

            return array("error" => ERROR_BAD_INPUT);

        }
        
        if($data["markCounts"] !== $test->data["markCounts"]) {
            
            $changedProperties["markCounts"] = (int)$data["markCounts"];
            $test->data["markCounts"] = (int)$data["markCounts"];

            $needsUpdate = true;

        }

    }

    if(array_key_exists("notes", $data)) {

        if((!is_string($data["notes"]) && !is_null($data["notes"])) || strlen($data["notes"]) >= MAX_LENGTH_NOTES) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($data["notes"] === "") {

            $data["notes"] = NULL;

        }

        if($data["notes"] != $test->data["notes"]) {

            $changedProperties["notes"] = $data["notes"];
            $test->data["notes"] = $data["notes"];

        }

    }

    $refHasChanged = false;
    
    if(array_key_exists("referenceID", $data)) {
        
        if(!is_int($data["referenceID"]) && !is_null($data["referenceID"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if(is_null($test->data["referenceState"]) || $test->isTemplate) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

        if($data["referenceID"] !== NULL) {

            if($data["referenceID"] === $test->data["testID"] || (!$test->isRoot && $data["referenceID"] === $test->data["parentID"])) {
                
                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

        }

        if(is_int($data["referenceID"])) {

            $reference = getTest($data["referenceID"], $test->data["userID"], $isTeacher, false, true);

            if($reference->error !== ERROR_NONE) {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

            if(is_null($test->data["classID"])) {

                if(is_null($reference->data["classID"])) {

                    if(
                        $reference->accessType !== Element::ACCESS_OWNER &&
                        $reference->accessType !== Element::ACCESS_SHARED
                    ) {

                        return array("error" => ERROR_UNSUITABLE_INPUT);

                    }

                } else {

                    if(
                        $reference->accessType !== Element::ACCESS_STUDENT
                    ) {

                        return array("error" => ERROR_UNSUITABLE_INPUT);

                    }

                }

            } else {

                if(is_null($reference->data["classID"])) {

                    return array("error" => ERROR_UNSUITABLE_INPUT);

                } elseif($reference->data["classID"] !== $test->data["classID"]) {

                    return array("error" => ERROR_UNSUITABLE_INPUT);

                } else {

                    if(
                        $reference->accessType !== Element::ACCESS_OWNER &&
                        $reference->accessType !== Element::ACCESS_SHARED
                    ) {

                        return array("error" => ERROR_UNSUITABLE_INPUT);

                    }

                }

            }

            if(is_null($test->data["round"]) || !is_null($test->data["formula"])) {

                if(!is_null($reference->data["round"]) && is_null($reference->data["formula"])) {

                    return array("error" => ERROR_UNSUITABLE_INPUT);

                }

            } else {

                if(is_null($reference->data["round"])) {

                    return array("error" => ERROR_UNSUITABLE_INPUT);

                }

            }

            if($test->data["referenceID"] !== $data["referenceID"]) {

                $changedProperties["referenceID"] = $data["referenceID"];
                $changedProperties["referenceState"] = "ok";
                
                $test->data["referenceSemesterID"] = $reference->data["semesterID"];

                $refHasChanged = true;

            }

        } else {

            if($test->data["referenceState"] !== "template") {

                $changedProperties["referenceID"] = NULL;
                $changedProperties["referenceState"] = "template";

                $test->data["referenceSemesterID"] = NULL;

                $refHasChanged = true;

            }

        }

        if($refHasChanged) {

            if($test->data["referenceState"] === "outdated" || $test->data["referenceState"] === "ok") {

                $stmt = $mysqli->prepare("UPDATE tests SET isReferenced = 0 WHERE tests.testID = ? AND tests.isReferenced = 1 AND NOT EXISTS(SELECT 1 FROM tests AS tests2 WHERE tests2.referenceID = tests.testID AND tests2.testID != ?)");
                $stmt->bind_param("ii", $test->data["referenceID"], $test->data["testID"]);
                $stmt->execute();

                $stmt->close();

            }

            $test->data["referenceID"] = $changedProperties["referenceID"];
            $test->data["referenceState"] = $changedProperties["referenceState"];

            if($test->data["referenceState"] === "ok") {

                $stmt = $mysqli->prepare("UPDATE tests SET isReferenced = 1 WHERE testID = ? AND isReferenced = 0");
                $stmt->bind_param("i", $test->data["referenceID"]);
                $stmt->execute();

                $stmt->close();

            }

            $needsRecalc = true;

        }

    }
    
    if(!empty($changedProperties)) {
        
        $queryString = "UPDATE tests SET ";
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
        $queryString .= " WHERE testID = ?";
        $parameterTypes .= "i";

        $changedProperties[] = $test->data["testID"];

        $stmt = $mysqli->prepare($queryString);

        $stmt->bind_param($parameterTypes, ...array_values($changedProperties));
        $stmt->execute();
        $stmt->close();

        if($needsRecalc || $needsUpdate) {

            $changes = true;

        } else {

            $changes = false;

        }

    }

    if($needsRecalc) {

        if(!$updateMarksIncluded) {

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
            $updateMarksIncluded = true;

        }

        unset($test->data["students"]);
        unset($test->data["mark"]);
        unset($test->data["points"]);

        $test->withMarks = false;
        $test->withStudents = false;

        updateMarks($test, true);
        
        $needsUpdate = false;

        if(is_null($test->data["classID"])) {

            $changes = array("mark" => $test->data["mark"], "points" => $test->data["points"]);

        } else {

            $changes = array("students" => $test->data["students"]);

        }

        if($refHasChanged) {

            $changes["referenceSemesterID"] = $test->data["referenceSemesterID"];

        }

    }

    if(array_key_exists("mark", $data)) {

        if(!is_null($data["mark"]) && (!is_string($data["mark"]) || !preg_match(REGEX_MARK, $data["mark"]))) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return array("error" => ERROR_BAD_INPUT, "changes" => $changes);

        }

        if(
            $test->data["formula"] !== "manual" &&
            (
                $test->data["classID"] !== NULL ||
                $test->isTemplate ||
                $test->isFolder ||
                $test->data["referenceState"] !== NULL ||
                $test->data["round"] === NULL ||
                $test->data["formula"] !== NULL
            )
        ) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return array("error" => ERROR_FORBIDDEN_FIELD, "changes" => $changes);

        }

    }

    if(array_key_exists("points", $data)) {

        if(!is_null($data["points"]) && (!is_string($data["points"]) || !preg_match(REGEX_OTHER, $data["points"]))) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return array("error" => ERROR_BAD_INPUT, "changes" => $changes);

        }

        if(
            $test->isTemplate ||
            !is_null($test->data["classID"]) || 
            (!is_null($test->data["round"]) && is_null($test->data["formula"])) ||
            $test->isFolder ||
            !is_null($test->data["referenceState"])
        ) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return array("error" => ERROR_FORBIDDEN_FIELD, "changes" => $changes);

        }

    }
    
    if(array_key_exists("students", $data)) {

        if(!is_array($data["students"])) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return array("error" => ERROR_BAD_INPUT, "changes" => $changes);

        }

        $withNotes = false;

        foreach($data["students"] as &$student) {

            if(!isset($student["studentID"])) {

                editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                return array("error" => ERROR_MISSING_INPUT, "changes" => $changes);

            }

            if(!is_int($student["studentID"])) {

                editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                return array("error" => ERROR_BAD_INPUT, "changes" => $changes);

            }

            if(isset($student["points"])) {

                if(!is_string($student["points"]) || !preg_match(REGEX_OTHER, $student["points"])) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return array("error" => ERROR_BAD_INPUT, "changes" => $changes);

                }

            }

            if(isset($student["mark"])) {

                if(!is_string($student["mark"]) || !preg_match(REGEX_MARK, $student["mark"])) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return array("error" => ERROR_BAD_INPUT, "changes" => $changes);

                }

            }

            if(array_key_exists("notes", $student)) {

                $withNotes = true;

                if((!is_string($student["notes"]) && !is_null($student["notes"])) || strlen($student["notes"]) >= MAX_LENGTH_NOTES) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return array("error" => ERROR_BAD_INPUT, "changes" => $changes);
        
                }

                if($student["notes"] === "") {

                    $student["notes"] = NULL;
        
                }

            }

        }

        if(is_null($test->data["classID"])) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return array("error" => ERROR_FORBIDDEN_FIELD, "changes" => $changes);

        }

        if(
            is_null($test->data["round"]) ||
            ((
                $test->isFolder ||
                !is_null($test->data["referenceState"])
            ) && $test->data["formula"] !== "manual")
        ) {

            foreach($data["students"] as &$student) {

                if(array_key_exists("mark", $student)) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return array("error" => ERROR_FORBIDDEN_FIELD, "changes" => $changes);

                }
    
            }

        }

        if(
            !is_null($test->data["round"]) && is_null($test->data["formula"]) ||
            $test->isFolder ||
            !is_null($test->data["referenceState"])
        ) {

            foreach($data["students"] as &$student) {

                if(array_key_exists("points", $student)) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return array("error" => ERROR_FORBIDDEN_FIELD, "changes" => $changes);

                }
    
            }

        }
        
        if(!empty($data["students"])) {

            if(!$test->withStudents || !$test->withMarks) {

                $stmt = $mysqli->prepare("SELECT students.studentID, students.deleteTimestamp, students.isHidden, students.firstName, students.lastName, students.gender, marks.points, marks.mark, marks.notes FROM students LEFT JOIN marks ON (marks.studentID = students.studentID AND marks.testID = ?) WHERE students.classID = ?");
                $stmt->bind_param("ii", $test->data["testID"], $test->data["classID"]);
                $stmt->execute();

                $test->data["students"] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                $test->withStudents = true;
                $test->withMarks = true;

                $stmt->close();

            }

            $students = array();

            foreach($test->data["students"] as &$student) {

                $students[$student["studentID"]] = &$student;

            }

            foreach($data["students"] as &$student) {

                if(!isset($students[$student["studentID"]])) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return array("error" => ERROR_UNSUITABLE_INPUT, "changes" => $changes);

                }

                if(!is_null($students[$student["studentID"]]["deleteTimestamp"])) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return array("error" => ERROR_UNSUITABLE_INPUT, "changes" => $changes);

                }

            }

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
            $updateMarksIncluded = true;

            if($test->data["formula"] !== NULL && $test->data["formula"] !== "manual") {

                calculateMarkFromPoints_Class($test->data["formula"], $test->data["maxPoints"], $data["students"], true, false);
    
            }

            $hasChanged = updateCurrentMark_Class($test->data["testID"], $students, $data["students"]);
            
            if($hasChanged) {

                $needsUpdate = true;

                foreach($data["students"] as &$student) {
                    
                    if(array_key_exists("mark",   $student)) $students[$student["studentID"]]["mark"] = $student["mark"];
                    if(array_key_exists("points", $student)) $students[$student["studentID"]]["points"] = $student["points"];
                    if(array_key_exists("notes",  $student)) $students[$student["studentID"]]["notes"] = $student["notes"];
    
                }
    
                $changes = array("students" => $test->data["students"]);

                if($refHasChanged) {

                    $changes["referenceSemesterID"] = $test->data["referenceSemesterID"];
        
                }

            }

        }

    }

    if(array_key_exists("mark", $data) || array_key_exists("points", $data)) {

        if(!$test->withMarks) {

            $stmt = $mysqli->prepare("SELECT mark, points FROM marks WHERE testID = ?");
            $stmt->bind_param("i", $test->data["testID"]);
            $stmt->execute();
    
            $result = $stmt->get_result()->fetch_assoc();
            $stmt->close();
    
            if(is_null($result)) {
    
                $test->data["points"] = NULL;
                $test->data["mark"] = NULL;
    
            } else {
    
                $test->data["points"] = $result["points"];
                $test->data["mark"] = $result["mark"];
    
            }

            $test->withMarks = true;

        }

        include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
        $updateMarksIncluded = true;

        $newPoints = array_key_exists("points", $data) ? $data["points"] : (isset($test->data["points"]) ? $test->data["points"] : NULL);
        $newMark = array_key_exists("mark", $data) ? $data["mark"] : (isset($test->data["mark"]) ? $test->data["mark"] : NULL);

        if($test->data["formula"] !== NULL && $test->data["formula"] !== "manual") {

            $newMark = calculateMarkFromPoints($test->data["formula"], $test->data["maxPoints"], $newPoints);

        }

        $hasChanged = updateCurrentMark($test->data["testID"], $test->data["mark"], $test->data["points"], $newMark, $newPoints);

        if($hasChanged) {

            $needsUpdate = true;

            $test->data["points"] = $newPoints;
            $test->data["mark"] = $newMark;

            $changes = array("mark" => $test->data["mark"], "points" => $test->data["points"]);

            if($refHasChanged) {

                $changes["referenceSemesterID"] = $test->data["referenceSemesterID"];
    
            }

        }

    }

    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);

    if(array_key_exists("permissions", $data)) {
        
        if(!is_array($data["permissions"])) {

            return array("error" => ERROR_BAD_INPUT, "changes" => $changes);

        }

        if(!is_null($test->data["parentID"]) || $test->isTemplate) {
            
            return array("error" => ERROR_FORBIDDEN_FIELD, "changes" => $changes);
    
        }
        
        include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updatePermissions.php");

        $errorCode = updatePermissions($test, $data["permissions"]);
        
        if($errorCode === ERROR_NONE) {

            if($changes === NULL) {

                $changes = false;

            }

        } elseif($errorCode !== INFO_NO_CHANGE) {

            return array("error" => $errorCode, "changes" => $changes);

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

if($_SESSION["status"] === "demo") throwError(ERROR_NO_WRITING_PERMISSION);

$data = getData();

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

if(!is_array($data)) {

    throwError(ERROR_BAD_INPUT);

}

foreach($data as $key => &$currentTestData) {

    if(!isset($currentTestData["testID"])) {

        throwError(ERROR_MISSING_INPUT);

    }
        
    if(!is_int($currentTestData["testID"])) {

        throwError(ERROR_BAD_INPUT);
    
    }

}

$response = array();

foreach($data as $key => &$currentTestData) {

    $test = getTest((int)$currentTestData["testID"], $_SESSION["userid"], $_SESSION["isTeacher"]);

    if($test->error !== ERROR_NONE) {

        sendResponse($response, $test->error, $key);

    }

    if(!$test->writingPermission) {

        sendResponse($response, ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorAndChanges = editTest($test, $currentTestData, $_SESSION["userid"], $_SESSION["isTeacher"], is_null($test->data["parentID"]) && $test->accessType === Element::ACCESS_TEACHER);

    if(array_key_exists("changes", $errorAndChanges)) {

        $response[] = &$errorAndChanges["changes"];

    }

    if($errorAndChanges["error"] !== ERROR_NONE) {

        sendResponse($response, $errorAndChanges["error"], $key);
        

    }

}

sendResponse($response);


?>