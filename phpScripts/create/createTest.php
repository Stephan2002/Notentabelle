<?php

/*
Pruefung/Ordner/Fach erstellen.

Input als JSON per POST bestehend aus Objekt (nur ein neues Element kann erstellt werden): 
    parentID (OrdnerID; muss bei isSubject false ein Ordner sein, bei isSubject true kein Ordner)
    isSubject (falls das Element im Hauptordner des Semesters liegt (ein Fach ist), parentID ist dann Semester-ID)
    Alle Daten, die es fuer die Erstellung des Objekts braucht (*: Darf NULL sein | ?: muss nicht angegeben werden):
        isFolder
        isHidden? (default: false)
        markCounts? (default: true)
        name
        date*?
        formula?* (nur, falls bei uebergeordneter Ordner round gesetzt und formula nicht gesetzt)
        round?* (muss gesetzt sein, falls bei uebergeordneter Ordner round gesetzt und formula nicht gesetzt)
        weight?* (muss gesetzt sein, wenn round gesetzt)
        maxPoints?* (muss gesetzt sein, falls formula gesetzt und ungleich manual)
        notes?*
        referenceID?* (falls isFolder false; angegeben, aber NULL: Referenz ohne ref. Element | nicht angegeben: keine Ref)
        templateID?*
        permissions* (falls isSubject und ein Klassensemester): Array aus Objekten mit:
        mark?* (falls privates Semester & (isFolder & keine Referenz) | formula manual)
        points?* (falls privates Semester & isFolder & keine Referenz)

*/

define("REGEX_MARK", "/^-?(?:0|[1-9]\d?).\d{6}$/D");
define("REGEX_OTHER", "/^-?(?:0|[1-9]\d{0,3}).\d{3}$/D");

function createTest(Element $test, array &$data, int $userID, bool $isTeacher) : array {
    
    global $mysqli;

    $needsCalc = false;
    $needsUpdate = false;
    $updateMarksIncluded = false;

    if($test->error !== ERROR_NONE) {

        return array("error" => $test->error);

    }

    if(!$test->isFolder && !$test->isRoot) {

        return array("error" => ERROR_UNSUITABLE_INPUT);

    }

    $properties = array();
    $changes = false;

    if(array_key_exists("isFolder", $data)) {
        
        if(!is_bool($data["isFolder"])) {

            return array("error" => ERROR_BAD_INPUT);

        }
        
        $properties["isFolder"] = (int)$data["isFolder"];

    } else {
        
        return array("error" => ERROR_MISSING_INPUT);

    }


    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return array("error" => ERROR_BAD_INPUT);

        }
        
        $properties["isHidden"] = (int)$data["isHidden"];

    } else {

        $properties["isHidden"] = 0;

    }


    if(array_key_exists("markCounts", $data)) {
        
        if(!is_bool($data["markCounts"])) {

            return array("error" => ERROR_BAD_INPUT);

        }
        
        $properties["markCounts"] = (int)$data["markCounts"];

    } else {

        $properties["markCounts"] = 1;

    }


    if(isset($data["name"])) {

        if(!is_string($data["name"]) || $data["name"] === "" || strlen($data["name"]) >= 64) {

            return array("error" => ERROR_BAD_INPUT);

        }

        $properties["name"] = $data["name"];

    } else {

        return array("error" => ERROR_MISSING_INPUT);

    }


    if(isset($data["date"])) {

        if(!is_int($data["date"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if($data["date"] < -30610224000 || $data["date"] > 253402214400) {

            return array("error" => ERROR_BAD_INPUT);

        }

        date_default_timezone_set("UTC");
        $date = date("Y-m-d", $data["date"]);

        $properties["date"] = $date;

    } else {

        $properties["date"] = NULL;

    }


    if(isset($data["formula"])) {

        $formulaOptions = array("manual", "linear");
        $optionFound = false;

        foreach($formulaOptions as $option) {

            if($data["formula"] === $option) {

                $optionFound = true;
                break;

            }

        }

        if($optionFound) {

            if(!$test->isRoot && $test->data["round"] === NULL) {

                return array("error" => ERROR_FORBIDDEN_FIELD);
    
            }

            $properties["formula"] = $data["formula"];

        } else {

            return array("error" => ERROR_BAD_INPUT);

        }

    } else {

        $properties["formula"] = NULL;

    }


    if(isset($data["round"])) {

        if(!preg_match(REGEX_OTHER, $data["round"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if(!$test->isRoot && ($test->data["round"] === NULL || $test->data["formula"] !== NULL)) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

        $properties["round"] = $data["round"];

    } elseif(
        $test->isRoot ||
        ($test->data["round"] !== NULL &&
        $test->data["formula"] === NULL)
    ) {

        return array("error" => ERROR_MISSING_INPUT);

    } else {

        $properties["round"] = NULL;

    }


    if(isset($data["weight"])) {

        if(!preg_match(REGEX_OTHER, $data["weight"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        $properties["weight"] = $data["weight"];

    } elseif($properties["round"] !== NULL) {

        return array("error" => ERROR_MISSING_INPUT);

    } else {

        $properties["weight"] = NULL;

    }


    if(isset($data["maxPoints"])) {

        if(!preg_match(REGEX_OTHER, $data["maxPoints"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        $properties["maxPoints"] = $data["maxPoints"];

    } elseif($properties["formula"] !== NULL && $properties["formula"] !== "manual") {

        return array("error" => ERROR_MISSING_INPUT);

    } else {

        $properties["maxPoints"] = NULL;

    }


    if(isset($data["notes"]) && $data["notes"] !== "") {

        if((!is_string($data["notes"]) && !is_null($data["notes"])) || strlen($data["notes"] >= 256)) {

            return array("error" => ERROR_BAD_INPUT);

        }

        $properties["notes"] = $data["notes"];

    } else {

        $properties["notes"] = NULL;

    }


    if(array_key_exists("referenceID", $data)) {

        if($data["referenceID"] === NULL) {

            $properties["referenceID"] = NULL;
            $properties["referenceState"] = "template";

        } else {

            if(!is_int($data["referenceID"])) {

                return array("error" => ERROR_BAD_INPUT);

            }

            if($properties["isFolder"]) {

                return array("error" => ERROR_FORBIDDEN_FIELD);

            }

            $properties["referenceID"] = $data["referenceID"];
            $properties["referenceState"] = "ok";

        }

    } else {

        $properties["referenceID"] = NULL;
        $properties["referenceState"] = NULL;

    }


    if(isset($data["templateID"])) {

        if(!is_int($data["templateID"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

    }


    if(isset($data["mark"])) {

        if(!is_string($data["mark"]) || !preg_match(REGEX_MARK, $data["mark"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if(
            $properties["formula"] !== "manual" &&
            (
                $test->data["classID"] !== NULL ||
                $test->isTemplate ||
                $properties["isFolder"] ||
                $properties["referenceState"] !== NULL ||
                $properties["round"] === NULL ||
                $properties["formula"] !== NULL
            )
        ) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

    }


    if(isset($data["points"])) {

        if(!is_string($data["points"]) || !preg_match(REGEX_OTHER, $data["points"])) {

            return array("error" => ERROR_BAD_INPUT);

        }

        if(
            $test->data["classID"] !== NULL ||
            $test->isTemplate ||
            $properties["isFolder"] ||
            $properties["referenceState"] !== NULL ||
            (
                $properties["round"] !== NULL &&
                $properties["formula"] === NULL
            )
        ) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

    }


    if(isset($data["permissions"])) {

        if(!$test->isRoot || $test->data["classID"] === NULL) {

            return array("error" => ERROR_FORBIDDEN_FIELD);

        }

        $userNames = array();

        foreach($data["permissions"] as &$currentPermission) {

            if(!is_array($currentPermission)) {
    
                return array("error" => ERROR_BAD_INPUT);
    
            }
    
            if(!isset($currentPermission["userName"]) || !array_key_exists("writingPermission", $currentPermission)) {
    
                return array("error" => ERROR_MISSING_INPUT);
    
            }
    
            if(!is_string($currentPermission["userName"]) || !is_bool($currentPermission["writingPermission"])) {
    
                return array("error" => ERROR_BAD_INPUT);
    
            }
    
            $currentPermission["userName"] = strtolower($currentPermission["userName"]);
    
            if(isset($userNames[$currentPermission["userName"]])) {
    
                return array("error" => ERROR_UNSUITABLE_INPUT);
    
            }
    
            $userNames[$currentPermission["userName"]] = true;

        }

        $stmt = $mysqli->prepare("SELECT userID, isTeacher FROM users WHERE userName = ? AND deleteTimestamp IS NULL");

        foreach($data["permissions"] as &$currentPermission) {
            
            $stmt->bind_param("s", $currentPermission["userName"]);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_assoc();

            if(is_null($result)) {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

            if(!$result["isTeacher"]) {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

            if($result["userID"] === $test->data["userID"]) {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

            $currentPermission["userID"] = $result["userID"];

        }

        $stmt->close();

    }


    if(isset($data["templateID"])) {

        $templateSemester = getSemester($data["templateID"], $userID, $isTeacher);

        if($templateSemester->error !== ERROR_NONE || !$templateSemester->isTemplate) {

            return array("error" => ERROR_UNSUITABLE_INPUT);

        }

    }


    if($properties["referenceID"] !== NULL) {

        $reference = getTest($properties["referenceID"], $test->data["userID"], $isTeacher, false, true);

        if($reference->error !== ERROR_NONE) {

            return array("error" => ERROR_UNSUITABLE_INPUT);

        }

        $newReferenceSemesterID = $reference->data["semesterID"];

        if($test->data["classID"] === NULL) {

            if($reference->data["classID"] === NULL) {

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

            if($reference->data["classID"] === NULL) {

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

        if($properties["round"] === NULL || $properties["formula"] !== NULL) {

            if($reference->data["round"] !== NULL && $reference->data["formula"] === NULL) {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

        } else {

            if($reference->data["round"] === NULL) {

                return array("error" => ERROR_UNSUITABLE_INPUT);

            }

        }

        $stmt = $mysqli->prepare("UPDATE tests SET isReferenced = 1 WHERE testID = ? AND isReferenced = 0");
        $stmt->bind_param("i", $properties["referenceID"]);
        $stmt->execute();

        $stmt->close();

        $needsCalc = true;

    } else {

        $newReferenceSemesterID = NULL;

    }



    $properties["semesterID"] = $test->data["semesterID"];

    if(!$test->isRoot) {

        $properties["parentID"] = $test->data["testID"];
        $properties["subjectID"] = $test->data["subjectID"] === NULL ? $test->data["testID"] : $test->data["subjectID"];

    } else {

        $properties["parentID"] = NULL;
        $properties["subjectID"] = NULL;

    }

    
    $parameterTypes = "";
    $queryFragment_keys = implode(", ", array_keys($properties));
    $queryFragment_values = str_repeat("?, ", count($properties) - 1) . "?";

    foreach($properties as $value) {
        
        if(is_int($value)) {

            $parameterTypes .= "i";

        } else {

            $parameterTypes .= "s";

        }

    }

    $stmt = $mysqli->prepare("INSERT INTO tests (" . $queryFragment_keys . ") VALUES (" . $queryFragment_values . ")");

    $stmt->bind_param($parameterTypes, ...array_values($properties));
    $stmt->execute();

    $newID = $mysqli->query("SELECT LAST_INSERT_ID()")->fetch_row()[0];


    if(isset($data["templateID"])) {

        // TODO: Vorlage benutzen

    }


    if(isset($data["permissions"]) && !empty($data["permissions"])) {

        $arguments = array();
        $parameterTypes = str_repeat("i", count($data["permissions"]) * 3);
        $queryFragment = str_repeat("(?, ?, ?), ", count($data["permissions"]) - 1) . "(?, ?, ?)";

        foreach($data["permissions"] as &$currentPermission) {

            array_push($arguments, $newID, $currentPermission["userID"], $currentPermission["writingPermission"]);

        }

        $stmt->prepare("INSERT INTO permissions (testID, userID, writingPermission) VALUES " . $queryFragment);
        $stmt->bind_param($parameterTypes, ...$arguments);
        $stmt->execute();

    }

    if(isset($data["mark"]) || isset($data["points"])) {

        $properties["mark"] = isset($data["mark"]) ? $data["mark"] : NULL;
        $properties["points"] = isset($data["points"]) ? $data["points"] : NULL;

        include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
        $updateMarksIncluded = true;

        if($properties["formula"] !== NULL && $properties["formula"] !== "manual") {

            $properties["mark"] = calculateMarkFromPoints($properties["formula"], $properties["maxPoints"], $properties["points"]);

        }

        $stmt->prepare("INSERT INTO marks (testID, mark, points) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $newID, $properties["mark"], $properties["points"]);
        $stmt->execute();

        $needsUpdate = true;
        $changes = array("mark" => $properties["mark"], "points" => $properties["points"]);

    }

    if($needsCalc || $needsUpdate) {

        $properties["testID"] = $newID;
        $properties["isReferenced"] = 0;
        $properties["deleteTimestamp"] = NULL;
        $properties["userID"] = $test->data["userID"];
        $properties["classID"] = $test->data["classID"];
        $properties["templateType"] = $test->data["templateType"];
        $properties["referenceSemesterID"] = $newReferenceSemesterID;

        $newTest = new Test(ERROR_NONE, $test->accessType, true, $properties);

        if($needsUpdate) {

            $newTest->withMarks = true;

        }

        if(!$updateMarksIncluded) {

            include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updateMarks.php");
            $updateMarksIncluded = true;

        }

        updateMarks($newTest, $needsCalc);

        if($needsCalc) {

            if($test->data["classID"] === NULL) {

                $changes = array("mark" => $newTest->data["mark"], "points" => $newTest->data["points"]);

            } else {

                $changes = array("students" => $newTest->data["students"]);

            }

            $changes["referenceSemesterID"] = $newReferenceSemesterID;

        }

    }


    $stmt->close();


    return array("error" => ERROR_NONE, "changes" => $changes, "newID" => $newID);

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

if(!isset($data["parentID"])) {

    throwError(ERROR_MISSING_INPUT);

}

if(!is_int($data["parentID"])) {

    throwError(ERROR_BAD_INPUT);

}


if(isset($data["isSubject"]) && $data["isSubject"]) { 

    $element = getSemester($data["parentID"], $_SESSION["userid"], $_SESSION["isTeacher"]);
    $element->type = Element::TYPE_TEST;
    $element->isRoot = true;

} else {

    $element = getTest($data["parentID"], $_SESSION["userid"], $_SESSION["isTeacher"]);

}

if($element->error !== ERROR_NONE) {

    throwError($element->error);

}

if(!$element->writingPermission) {

    throwError(ERROR_NO_WRITING_PERMISSION);

}

$errorAndChanges = createTest($element, $data, $_SESSION["userid"], $_SESSION["isTeacher"]);

if($errorAndChanges["error"] !== ERROR_NONE) {

    throwError($errorAndChanges["error"]);

}

sendResponse($errorAndChanges["changes"], ERROR_NONE, NULL, $errorAndChanges["newID"]);


?>