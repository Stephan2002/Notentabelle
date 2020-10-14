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
            

*/

function editTest(Test $test, array &$data, bool $onlyMarks = false) : bool {
    
    global $mysqli;

    $needsUpdate = NULL;

    if($test->error !== ERROR_NONE) {

        return false;

    }

    if($onlyMarks) {

        foreach(array_keys($data) as $key) {

            if($key !== "students") {

                return false;

            }

        }

    }

    $changedProperties = array();

    if(array_key_exists("name", $data)) {

        if(!is_string($data["name"]) || strlen($data["name"]) >= 64) {

            return false;

        }

        if($data["name"] !== $test->data["name"]) {

            $changedProperties["name"] = $data["name"];

        } 

    }

    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return false;

        }
        
        if($data["isHidden"] != $test->data["isHidden"]) {
            
            $changedProperties["isHidden"] = (int)$data["isHidden"];

        }

    }

    if(array_key_exists("date", $data)) {

        if(!is_int($data["date"]) && !is_null($data["date"])) {

            return false;

        }

        $date = date("Y-m-d", $data["date"]);

        if($date !== $test->data["date"]) {

            $changedProperties["date"] = $date;

        }

    }

    if(array_key_exists("weight", $data)) {

        if(is_null($test->data["round"])) {

            return false;

        }

        if(!is_numeric($data["weight"])) {

            return false;

        }

        if($data["weight"] < 0 || $data["weight"] >= 10000) {

            return false;

        }

        if($data["weight"] != $test->data["weight"]) {

            $changedProperties["weight"] = strval($data["weight"]);

        }

    }

    if(array_key_exists("round", $data)) {

        if(is_null($test->data["round"])) {

            return false;

        }

        if(!is_numeric($data["round"])) {

            return false;

        }

        if($data["round"] < 0 || $data["round"] >= 10000) {

            return false;

        }

        if($data["round"] != $test->data["round"]) {

            $changedProperties["round"] = strval($data["round"]);

        }

    }

    if(array_key_exists("formula", $data)) {

        if(is_null($test->data["formula"])) {

            return false;

        }

        $formulaOptions = array("manual", "linear");
        $optionFound = false;

        foreach($formulaOptions as $option) {

            if($data["formula"] === $option) {

                $optionFound = true;
                break;

            }

        }

        if($optionFound) {

            if($data["formula"] !== $test->data["formula"]) {

                $changedProperties["formula"] = $data["formula"];
    
            }

        } else {

            return false;

        }

    }

    if(array_key_exists("maxPoints", $data)) {

        if(!is_null($test->data["round"]) && is_null($test->data["formula"])) {

            return false;

        }

        if(is_null($data["maxPoints"])) {

            $hasNewFormula = isset($changedProperties["formula"]);

            if(
                ($hasNewFormula && $changedProperties["formula"] !== "manual") ||
                (!$hasNewFormula && $test->data["formula"] !== "manual")
            ){

                return false;

            }

        } else {

            if(!is_numeric($data["maxPoints"])) {

                return false;

            }

            if($data["maxPoints"] < 0 || $data["maxPoints"] >= 10000) {

                return false;

            }

            $data["maxPoints"] = strval($data["maxPoints"]);

        }

        if($data["maxPoints"] != $test->data["maxPoints"]) {

            $changedProperties["maxPoints"] = $data["maxPoints"];

        }

    }

    if(array_key_exists("markCounts", $data)) {
        
        if(!is_bool($data["markCounts"])) {

            return false;

        }
        
        if($data["markCounts"] != $test->data["markCounts"]) {
            
            $changedProperties["markCounts"] = (int)$data["markCounts"];

        }

    }

    if(array_key_exists("notes", $data)) {

        if((!is_string($data["notes"]) && !is_null($data["notes"])) || strlen($data["notes"] >= 256)) {

            return false;

        }

        if($data["notes"] === "") {

            $data["notes"] = NULL;

        }

        if($data["notes"] != $test->data["notes"]) {

            $changedProperties["notes"] = $data["notes"];

        }

    }

    if(array_key_exists("referenceID", $data)) {

        if(is_null($test->data["referenceState"])) {

            return false;

        }

        if(is_int($data["referenceID"])) {

            $reference = getTest($data["referenceID"], $_SESSION["userid"], $_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin", false, true);

            if($reference->error !== ERROR_NONE) {

                return false;

            }

            if(is_null($test->data["classID"])) {

                if(is_null($reference->data["classID"])) {

                    if(
                        $reference->accessType !== Element::ACCESS_OWNER &&
                        $reference->accessType !== Element::ACCESS_SHARED
                    ) {

                        return false;

                    }

                } else {

                    if(
                        $reference->accessType !== Element::ACCESS_STUDENT
                    ) {

                        return false;

                    }

                }

            } else {

                if(is_null($reference->data["classID"])) {

                    return false;

                } elseif($reference->data["classID"] !== $test->data["classID"]) {

                    return false;

                } else {

                    if(
                        $reference->accessType !== Element::ACCESS_OWNER &&
                        $reference->accessType !== Element::ACCESS_SHARED
                    ) {

                        return false;

                    }

                }

            }

            $changedProperties["referenceID"] = $data["referenceID"];
            $changedProperties["referenceState"] = "ok";

        } elseif(is_null($data["referenceID"])) {

            $changedProperties["referenceID"] = NULL;
            $changedProperties["referenceState"] = "template";

        }

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

    
    if(array_key_exists("permissions", $data)) {
        
        if(!is_null($test->data["parentID"])) {

            return false;
    
        }
        
        include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/updatePermissions.php");

        if(!updatePermissions($test, $data["permissions"])) {

            return false;

        }

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

foreach($data as $key => &$currentTestData) {

    if(!isset($currentTestData["testID"]) || !is_numeric($currentTestData["testID"])) {

        throwError(ERROR_BAD_INPUT, $key);
    
    }

    $test = getTest((int)$currentTestData["testID"], $_SESSION["userid"], $_SESSION["type"] === "admin" || $_SESSION["type"] === "admin");

    if($test->error !== ERROR_NONE) {

        throwError(ERROR_FORBIDDEN, $key);

    }

    if(!$test->writingPermission) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    if(!editTest($test, $currentTestData, is_null($test->data["parentID"]) && $test->accessType === Element::ACCESS_TEACHER)) {

        throwError(ERROR_BAD_INPUT, $key);

    }

}

finish();


?>