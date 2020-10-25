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
        referenceID* (nur, wenn schon Referenz)
        permissions* (nur bei Fach, nur bei Klassensemestern): Array aus Objekten mit:
            userName
            writingPermission
        mark* (nur bei Pruefung mit Noten oder bei Ordner mit formula: manual, nur bei privaten Semestern)
        points* (nur bei Pruefungen mit Punkten, nur bei privaten Semestern)
        students* (nur bei Klassensemestern): Array aus Objekten mit:
            studentID
            mark (bei Pruefung mit Noten oder bei Ordner mit formula: manual)
            points (bei Pruefungen mit Punkten)

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

        echo "update";

    }

};

function editTest(Test $test, array &$data, bool $onlyMarks = false) : int {
    
    global $mysqli;

    $needsUpdate = false;
    $needsRecalc = false;
    $updateMarksIncluded = false;

    if($test->error !== ERROR_NONE) {
        
        return $test->error;

    }

    if($onlyMarks) {

        foreach(array_keys($data) as $key) {

            if($key !== "students") {
                
                return ERROR_FORBIDDEN_FIELD;

            }

        }

    }

    $changedProperties = array();

    if(array_key_exists("name", $data)) {

        if(!is_string($data["name"]) || strlen($data["name"]) >= 64) {

            return ERROR_BAD_INPUT;

        }

        if($data["name"] !== $test->data["name"]) {

            $changedProperties["name"] = $data["name"];
            $test->data["name"] = $data["name"];

        } 

    }

    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return ERROR_BAD_INPUT;

        }
        
        if($data["isHidden"] != $test->data["isHidden"]) {
            
            $changedProperties["isHidden"] = (int)$data["isHidden"];
            $test->data["isHidden"] = (int)$data["isHidden"];

        }

    }

    if(array_key_exists("date", $data)) {

        if(is_int($data["date"])) {

            if($data["date"] < -30610224000 || $data["date"] > 253402214400) {

                return ERROR_BAD_INPUT;

            }

            date_default_timezone_set("UTC");
            $date = date("Y-m-d", $data["date"]);

        } elseif(is_null($data["date"])) {

            $date = NULL;

        } else {

            return ERROR_BAD_INPUT;

        }

        if($date !== $test->data["date"]) {

            $changedProperties["date"] = $date;
            $test->data["date"] = $date;

        }

    }

    if(array_key_exists("weight", $data)) {

        if(!is_string($test->data["round"]) || !preg_match(REGEX_OTHER, $data["weight"])) {

            return ERROR_BAD_INPUT;

        }

        if(is_null($test->data["weight"])) {

            return ERROR_FORBIDDEN_FIELD;

        }

        if($data["weight"] !== $test->data["weight"]) {

            $changedProperties["weight"] = $data["weight"];
            $test->data["weight"] = $data["weight"];

            $needsUpdate = true;

        }

    }

    if(array_key_exists("round", $data)) {

        if(!is_string($test->data["round"]) || !preg_match(REGEX_OTHER, $data["round"])) {

            return ERROR_BAD_INPUT;

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

                return ERROR_FORBIDDEN_FIELD;
    
            }

            if($data["formula"] !== $test->data["formula"]) {

                if($test->data["formula"] === "manual" && is_null($test->data["maxPoints"]) && !isset($data["maxPoints"])) {

                    return ERROR_UNSUITABLE_INPUT;

                }

                $changedProperties["formula"] = $data["formula"];
                $test->data["formula"] = $data["formula"];

                $needsRecalc = true;
    
            }

        } else {

            return ERROR_BAD_INPUT;

        }

    }

    if(array_key_exists("maxPoints", $data)) {

        if(!is_null($data["maxPoints"]) && (!is_string($data["maxPoints"]) || !preg_match(REGEX_OTHER, $data["maxPoints"]))) {

            return ERROR_BAD_INPUT;

        }

        if(!is_null($test->data["round"]) && is_null($test->data["formula"])) {

            return ERROR_FORBIDDEN_FIELD;

        }

        if(is_null($data["maxPoints"])) {

            $hasNewFormula = isset($changedProperties["formula"]);

            if($test->data["formula"] !== "manual") {

                return ERROR_UNSUITABLE_INPUT;

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

            return ERROR_BAD_INPUT;

        }
        
        if($data["markCounts"] !== $test->data["markCounts"]) {
            
            $changedProperties["markCounts"] = (int)$data["markCounts"];
            $test->data["markCounts"] = (int)$data["markCounts"];

            $needsUpdate = true;

        }

    }

    if(array_key_exists("notes", $data)) {

        if((!is_string($data["notes"]) && !is_null($data["notes"])) || strlen($data["notes"] >= 256)) {

            return ERROR_BAD_INPUT;

        }

        if($data["notes"] === "") {

            $data["notes"] = NULL;

        }

        if($data["notes"] != $test->data["notes"]) {

            $changedProperties["notes"] = $data["notes"];
            $test->data["notes"] = $data["notes"];

        }

    }

    if(array_key_exists("referenceID", $data)) {

        if(!is_int($data["referenceID"]) && !is_null($data["referenceID"])) {

            return ERROR_BAD_INPUT;

        }

        if(is_null($test->data["referenceState"])) {

            return ERROR_FORBIDDEN_FIELD;

        }

        if($data["referenceID"] === $test->data["testID"] || (!$test->isRoot && $data["referenceID"] === $test->data["parentID"])) {

            return ERROR_UNSUITABLE_INPUT;

        }

        if(is_int($data["referenceID"])) {

            $reference = getTest($data["referenceID"], $_SESSION["userid"], $_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin", false, true);

            if($reference->error !== ERROR_NONE) {

                return $reference->error;

            }

            if(is_null($test->data["classID"])) {

                if(is_null($reference->data["classID"])) {

                    if(
                        $reference->accessType !== Element::ACCESS_OWNER &&
                        $reference->accessType !== Element::ACCESS_SHARED
                    ) {

                        return ERROR_UNSUITABLE_INPUT;

                    }

                } else {

                    if(
                        $reference->accessType !== Element::ACCESS_STUDENT
                    ) {

                        return ERROR_UNSUITABLE_INPUT;

                    }

                }

            } else {

                if(is_null($reference->data["classID"])) {

                    return ERROR_UNSUITABLE_INPUT;

                } elseif($reference->data["classID"] !== $test->data["classID"]) {

                    return ERROR_UNSUITABLE_INPUT;

                } else {

                    if(
                        $reference->accessType !== Element::ACCESS_OWNER &&
                        $reference->accessType !== Element::ACCESS_SHARED
                    ) {

                        return ERROR_UNSUITABLE_INPUT;

                    }

                }

            }

            if(is_null($test->data["round"]) || !is_null($test->data["formula"])) {

                if(!is_null($reference->data["round"]) && is_null($reference->data["formula"])) {

                    return ERROR_UNSUITABLE_INPUT;

                }

            } else {

                if(is_null($reference->data["round"])) {

                    return ERROR_UNSUITABLE_INPUT;

                }

            }

            $changedProperties["referenceID"] = $data["referenceID"];
            $changedProperties["referenceState"] = "ok";

            $test->data["referenceID"] = $data["referenceID"];
            $test->data["referenceState"] = "ok";

        } else {

            $changedProperties["referenceID"] = NULL;
            $changedProperties["referenceState"] = "template";

            $test->data["referenceID"] = NULL;
            $test->data["referenceState"] = "template";

        }

        $needsRecalc = true;

    }
    
    if(count($changedProperties) > 0) {
        
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

    }

    if($needsRecalc) {

        if(!$updateMarksIncluded) {

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
            $updateMarksIncluded = true;

        }

        updateMarks($test, true);

        echo "calc";
        $needsRecalc = false;
        $needsUpdate = false;

    }

    if(array_key_exists("mark", $data)) {

        if(!is_null($data["mark"]) && (!is_string($data["mark"]) || !preg_match(REGEX_MARK, $data["mark"]))) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return ERROR_BAD_INPUT;

        }

        if(
            !is_null($test->data["classID"]) ||
            is_null($test->data["round"]) ||
            ((
                $test->isFolder ||
                !is_null($test->data["referenceState"])
            ) && $test->data["formula"] !== "manual")
        ) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return ERROR_FORBIDDEN_FIELD;

        }

    }

    if(array_key_exists("points", $data)) {

        if(!is_null($data["points"]) && (!is_string($data["points"]) || !preg_match(REGEX_OTHER, $data["points"]))) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return ERROR_BAD_INPUT;

        }

        if(
            !is_null($test->data["classID"]) || 
            !is_null($test->data["round"]) && is_null($test->data["formula"]) ||
            $test->isFolder ||
            !is_null($test->data["referenceState"])
        ) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return ERROR_FORBIDDEN_FIELD;

        }

    }
    
    if(array_key_exists("students", $data)) {

        if(!is_array($data["students"])) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return ERROR_BAD_INPUT;

        }

        $withNotes = false;

        foreach($data["students"] as &$student) {

            if(!isset($student["studentID"])) {

                editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                return ERROR_MISSING_INPUT;

            }

            if(!is_int($student["studentID"])) {

                editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                return ERROR_BAD_INPUT;

            }

            if(isset($student["points"])) {

                if(!is_string($student["points"]) || !preg_match(REGEX_OTHER, $student["points"])) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return ERROR_BAD_INPUT;

                }

            }

            if(isset($student["mark"])) {

                if(!is_string($student["mark"]) || !preg_match(REGEX_MARK, $student["mark"])) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return ERROR_BAD_INPUT;

                }

            }

            if(array_key_exists("notes", $student)) {

                $withNotes = true;

                if((!is_string($student["notes"]) && !is_null($student["notes"])) || strlen($student["notes"] >= 256)) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return ERROR_BAD_INPUT;
        
                }

                if($student["notes"] === "") {

                    $student["notes"] = NULL;
        
                }

            }

        }

        if(is_null($test->data["classID"])) {

            editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
            return ERROR_FORBIDDEN_FIELD;

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
                    return ERROR_FORBIDDEN_FIELD;

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
                    return ERROR_FORBIDDEN_FIELD;

                }
    
            }

        }
        
        if(!empty($data["students"])) {

            $stmt = $mysqli->prepare("SELECT students.studentID, students.deleteTimestamp, marks.points, marks.mark, (marks.notes IS NOT NULL) AS hasNotes FROM students LEFT JOIN marks ON (marks.studentID = students.studentID AND marks.testID = ?) WHERE students.classID = ?");
            $stmt->bind_param("ii", $test->data["testID"], $test->data["classID"]);
            $stmt->execute();

            $test->data["students"] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $test->withStudents = true;

            $stmt->close();

            $students = array();

            foreach($test->data["students"] as &$student) {

                $students[$student["studentID"]] = &$student;

            }

            foreach($data["students"] as &$student) {

                if(!isset($students[$student["studentID"]])) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return ERROR_UNSUITABLE_INPUT;

                }

                if(!is_null($students[$student["studentID"]]["deleteTimestamp"])) {

                    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);
                    return ERROR_UNSUITABLE_INPUT;

                }

            }

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
            $updateMarksIncluded = true;

            $hasChanged = updateCurrentMark_Class($test->data["testID"], $students, $data["students"]);
            
            if($hasChanged) {

                $needsUpdate = true;

            }

            foreach($data["students"] as &$student) {

                if(array_key_exists("mark",   $student)) $students[$student["studentID"]]["mark"] = $student["mark"];
                if(array_key_exists("points", $student)) $students[$student["studentID"]]["points"] = $student["points"];
                
                $students[$student["studentID"]]["hasNotes"] = isset($student["notes"]);

            }

            $test->withMarks = true;

        }

    }

    if(array_key_exists("mark", $data) || array_key_exists("points", $data)) {

        $stmt = $mysqli->prepare("SELECT mark, points FROM marks WHERE testID = ?");
        $stmt->bind_param("i", $test->data["testID"]);
        $stmt->execute();

        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if(is_null($result)) {

            $oldPoints = NULL;
            $oldMark = NULL;

        } else {

            $oldPoints = $result["points"];
            $oldMark = $result["mark"];

        }

        $newPoints = isset($data["points"]) ? $data["points"] : NULL;
        $newMark = isset($data["mark"]) ? $data["mark"] : NULL;

        include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
        $updateMarksIncluded = true;

        $hasChanged = updateCurrentMark($test->data["testID"], $oldMark, $oldPoints, $newMark, $newPoints);

        if($hasChanged) {

            $needsUpdate = true;

        }

        $test->data["points"] = $newPoints;
        $test->data["mark"] = $newMark;

        $test->withMarks = true;

    }

    editTest_updateFunc($test, $needsUpdate, $updateMarksIncluded);

    if(array_key_exists("permissions", $data)) {
        
        if(!is_array($data["permissions"])) {

            return ERROR_BAD_INPUT;

        }

        if(!is_null($test->data["parentID"])) {

            return ERROR_FORBIDDEN_FIELD;
    
        }
        
        include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updatePermissions.php");

        $errorCode = updatePermissions($test, $data["permissions"]);
        
        if($errorCode !== ERROR_NONE) {

            return $errorCode;

        }

    }

    return ERROR_NONE;

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

foreach($data as $key => &$currentTestData) {

    if(!isset($currentTestData["testID"])) {

        throwError(ERROR_MISSING_INPUT, $key);

    }
        
    if(!is_int($currentTestData["testID"])) {

        throwError(ERROR_BAD_INPUT, $key);
    
    }

    $test = getTest((int)$currentTestData["testID"], $_SESSION["userid"], $_SESSION["type"] === "admin" || $_SESSION["type"] === "admin");

    if($test->error !== ERROR_NONE) {

        throwError(ERROR_FORBIDDEN, $key);

    }

    if(!$test->writingPermission) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorCode = editTest($test, $currentTestData, is_null($test->data["parentID"]) && $test->accessType === Element::ACCESS_TEACHER);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode, $key);

    }

}

finish();


?>