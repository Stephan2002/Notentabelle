<?php

/*

Datei, die inkludiert wird, um die Noten in einem bestimmten Ordner und darueber zu berechnen.

*/

function roundMark_float($mark_unrounded, $precision = 0.5) {

    if(is_null($mark_unrounded)) {

        return null;

    }

    $mark_rounded = round($mark_unrounded / $precision) * $precision;

    if($mark_rounded > 6) {

        return 6;

    } else {

        return $mark_rounded;

    }

}

function roundMark($mark_unrounded, $precision = "0.5") {

    if(is_null($mark_unrounded)) {

        return null;

    }

    $mark_rounded = bcdiv($mark_unrounded, $precision, 1);

    if($mark_rounded[strlen($mark_rounded) - 1] >= 5) {

        $mark_rounded = bcadd($mark_rounded, "1", 0);

    } else {

        $mark_rounded = bcadd($mark_rounded, "0", 0);

    }

    $mark_rounded = bcmul($mark_rounded, $precision, 6);

    if(bccomp($mark_rounded, "6") === 1) {

        return "6.000000";

    } else {

        return $mark_rounded;

    }

} 


function plusPoints($mark) {

    if(is_null($mark)) {

        return NULL;

    }

    return $mark < 0 ? (2 * ($mark - 4)) : ($mark - 4);

}

function calculateMark(array &$element, array &$subElements, bool $isTest = true, bool $nullSetVars = false) {

    // Wenn nullSetVars true: Variablen sind nur auf Null gesetzt, wenn Wert moeglich, aber nicht vorhanden

    if($isTest && !$element["isFolder"]) {
        
        return;

    }

    if(!$isTest || (!is_null($element["round"]) && is_null($element["formula"]))) {
        
        $sumWeights = "0";
        $sumMarks = "0";

        foreach($subElements as &$subTest) {
            
            if($subTest["markCounts"] && isset($subTest["mark"])) {

                //$sumWeights += $subTest["weight"];
                $sumWeights = bcadd($sumWeights, $subTest["weight"], 3);

                if($subTest["round"] != 0) {

                    //$sumMarks += $subTest["weight"] * roundMark($subTest["mark"]);
                    $sumMarks = bcadd($sumMarks, bcmul($subTest["weight"], roundMark($subTest["mark"], $subTest["round"]), 6), 6);

                } else {

                    //$sumMarks += $subTest["weight"] * $subTest["mark"];
                    $sumMarks = bcadd($sumMarks, bcmul($subTest["weight"], $subTest["mark"], 6), 6);

                }

            }

        }

        if($sumWeights == 0) {

            if(!$nullSetVars) unset($element["mark"]);
            else $element["mark"] = NULL;

        } else {

            //$element["mark"] = $sumMarks / $sumWeights;
            $element["mark"] = bcdiv($sumMarks, $sumWeights, 6);

        }

    } else {

        $sumPoints = "0";
        $count = 0;

        foreach($subElements as &$subTest) {

            if($subTest["markCounts"] && !is_null($subTest["points"])) {

                //$sumPoints += $subTest["points"];
                $sumPoints = bcadd($sumPoints, $subTest["points"], 3);

                $count++;

            }

        }

        if($count === 0) {

            if(!$nullSetVars) unset($element["points"]);
            else $element["points"] = NULL;

        } else {

            $element["points"] = $sumPoints;

        }

    }

    if($isTest && (!is_null($element["round"]) && !is_null($element["formula"]))) {

        if($element["formula"] === "linear") {

            if(isset($element["points"])) {

                // $element["mark"] = $element["points"] / $element["maxPoints"] * 5 + 1;
                $element["mark"] = bcadd(bcmul(bcdiv($element["points"], $element["maxPoints"], 6), "5", 6), "1", 6);

            } else {

                if(!$nullSetVars) unset($element["mark"]);
                else $element["mark"] = NULL;

            }

        }

    }

}

function calculateMark_Class(array &$element, array &$subElements, bool $isTest = true, bool $classAverage = false, bool $withPlusPoints = false, bool $nullSetVars = false) {

    // Wenn nullSetVars true: Variablen sind nur auf Null gesetzt, wenn Wert moeglich, aber nicht vorhanden

    if(!$element["isFolder"] && $isTest) {

        return;

    }

    $students = array();

    if(!$isTest || (!is_null($element["round"]) && is_null($element["formula"]))) {

        if($withPlusPoints) {

            foreach($element["students"] as &$student) {

                $students[$student["studentID"]]["sumMarks"] = "0";
                $students[$student["studentID"]]["sumWeights"] = "0";
                $students[$student["studentID"]]["plusPoints"] = 0;

            }

        } else {
        
            foreach($element["students"] as &$student) {

                $students[$student["studentID"]]["sumMarks"] = "0";
                $students[$student["studentID"]]["sumWeights"] = "0"; 

            }

        }

        foreach($subElements as &$subTest) {

            if($subTest["markCounts"]) {

                if($subTest["round"] != 0) {

                    foreach($subTest["students"] as &$student) {

                        if(!is_null($student["mark"])) {

                            //$students[$student["studentID"]]["sumMarks"] += roundMark($student["mark"]) * $subTest["weight"];
                            $students[$student["studentID"]]["sumMarks"] = bcadd($students[$student["studentID"]]["sumMarks"], bcmul(roundMark($student["mark"], $subTest["round"]), $subTest["weight"], 6), 6);
                            
                            //$students[$student["studentID"]]["sumWeights"] += $subTest["weight"];
                            $students[$student["studentID"]]["sumWeights"] = bcadd($students[$student["studentID"]]["sumWeights"], $subTest["weight"], 6);

                        }

                    }

                } else {

                    foreach($subTest["students"] as &$student) {

                        if(!is_null($student["mark"])) {

                            //$students[$student["studentID"]]["sumMarks"] += $student["mark"] * $subTest["weight"];
                            $students[$student["studentID"]]["sumMarks"] = bcadd($students[$student["studentID"]]["sumMarks"], bcmul($student["mark"], $subTest["weight"], 6), 6);

                            //$students[$student["studentID"]]["sumWeights"] += $subTest["weight"];
                            $students[$student["studentID"]]["sumWeights"] = bcadd($students[$student["studentID"]]["sumWeights"], $subTest["weight"], 6);


                        }

                    }

                }

                if($withPlusPoints) {

                    foreach($subTest["students"] as &$student) {

                        if($subTest["round"] != 0) {

                            foreach($subTest["students"] as &$student) {
        
                                if(!is_null($student["mark"])) {
        
                                    $students[$student["studentID"]]["plusPoints"] += plusPoints(roundMark_float($student["mark"], $subTest["round"]));
        
                                }
        
                            }
        
                        } else {
        
                            foreach($subTest["students"] as &$student) {
        
                                if(!is_null($student["mark"])) {
        
                                    $students[$student["studentID"]]["plusPoints"] += plusPoints($student["mark"]);
        
                                }
        
                            }
        
                        }

                    }

                }

            }

            if($classAverage) {

                $sumMarks = 0;
                $count = 0;

                if($subTest["round"] != 0) {

                    foreach($subTest["students"] as &$student) {

                        if(!is_null($student["mark"])) {

                            $count++;
                            $sumMarks += roundMark_float($student["mark"], $subTest["round"]);

                        }

                    }

                } else {

                    foreach($subTest["students"] as &$student) {

                        if(!is_null($student["mark"])) {

                            $count++;
                            $sumMarks += $student["mark"];

                        }

                    }

                }

                if($count === 0) {

                    if(!$nullSetVars) unset($subTest["mark"]);
                    else $subTest["mark"] = NULL;

                } else {

                    $subTest["mark"] = $sumMarks / $count;
                    $subTest["mark_unrounded"] = $subTest["mark"];

                }

            }

        }

        foreach($element["students"] as &$student) {

            if($students[$student["studentID"]]["sumWeights"] == 0) {

                if(!$nullSetVars) unset($student["mark"]);
                else $student["mark"] = NULL;

            } else {

                // $student["mark"] = $students[$student["studentID"]]["sumMarks"] / $students[$student["studentID"]]["sumWeights"];
                $student["mark"] = bcdiv($students[$student["studentID"]]["sumMarks"], $students[$student["studentID"]]["sumWeights"], 6);

            }

        }

        if($withPlusPoints) {

            foreach($element["students"] as &$student) {

                if($students[$student["studentID"]]["sumWeights"] != 0) {
    
                    $student["plusPoints"] = $students[$student["studentID"]]["plusPoints"];

                }
    
            }

        }

    } else {

        foreach($element["students"] as &$student) {

            $students[$student["studentID"]]["sumPoints"] = "0";
            $students[$student["studentID"]]["count"] = 0; 

        }

        foreach($subElements as &$subTest) {

            if($subTest["markCounts"]) {

                foreach($subTest["students"] as &$student) {

                    if(!is_null($student["points"])) {

                        //$students[$student["studentID"]]["sumPoints"] += $student["points"];
                        $students[$student["studentID"]]["sumPoints"] = bcadd($students[$student["studentID"]]["sumPoints"], $student["points"], 3);
                        $students[$student["studentID"]]["count"]++;

                    }

                }

            }

            if($classAverage) {

                $sumPoints = 0;
                $count = 0;

                foreach($subTest["students"] as &$student) {

                    if(!is_null($student["points"])) {

                        $count++;
                        $sumPoints += $student["points"];

                    }

                }

                if($count === 0) {

                    if(!$nullSetVars) unset($subTest["points"]);
                    else $subTest["points"] = NULL;

                } else {

                    $subTest["points"] = $sumPoints / $count;

                }

            }

        }

        foreach($element["students"] as &$student) {

            if($students[$student["studentID"]]["count"] === 0) {

                if(!$nullSetVars) unset($student["points"]);
                else $student["points"] = NULL;

            } else {

                $student["points"] = $students[$student["studentID"]]["sumPoints"];

            }

        }

    }

    if($isTest && (!is_null($element["round"]) && !is_null($element["formula"]))) {

        if($element["formula"] === "linear") {

            foreach($element["students"] as &$student) {

                if(isset($student["points"])) {

                    //$student["mark"] = $student["points"] / $element["maxPoints"] * 5 + 1;
                    $student["mark"] = bcadd(bcmul(bcdiv($student["points"], $element["maxPoints"], 6), "5", 6), "1", 6);
    
                } else {
    
                    if(!$nullSetVars) unset($student["mark"]);
                    else $student["mark"] = NULL;
                    
    
                }

            }

        }

    }

}

function calculateMark_Ref(array &$refElement, array &$originalElement, int $studentIndex = NULL, bool $nullSetVars = false) {

    // Wenn nullSetVars true: Variablen sind nur auf Null gesetzt, wenn Wert moeglich, aber nicht vorhanden

    if(is_null($studentIndex)) {

        $originalPoints = isset($originalElement["points"]) ? $originalElement["points"] : NULL;
        $originalMark = isset($originalElement["mark"]) ? $originalElement["mark"] : NULL;

    } else {

        $originalPoints = isset($originalElement["students"][$studentIndex]["points"]) ? $originalElement["students"][$studentIndex]["points"] : NULL;
        $originalMark = isset($originalElement["students"][$studentIndex]["mark"]) ? $originalElement["students"][$studentIndex]["mark"] : NULL;

    }

    if(!is_null($refElement["round"]) && is_null($refElement["formula"])) {

        if(!is_null($originalMark)) {

            if($refElement["round"] == 0) {

                $refElement["mark"] = $originalMark;

            } else {

                $refElement["mark"] = roundMark($originalMark, $refElement["round"]);

            }

        } else {

            if(!$nullSetVars) unset($refElement["mark"]);
            else $refElement["mark"] = NULL;

        }

    } else {

        if(!is_null($originalPoints)) {

            $refElement["points"] = $originalPoints;

        } else {

            if(!$nullSetVars) unset($refElement["points"]);
            else $refElement["points"] = NULL;

        }

    }

    if(!is_null($refElement["formula"])) {

        if($refElement["formula"] === "linear") {

            if(isset($refElement["points"])) {

                // $element["mark"] = $element["points"] / $element["maxPoints"] * 5 + 1;
                $refElement["mark"] = bcadd(bcmul(bcdiv($refElement["points"], $refElement["maxPoints"], 6), "5", 6), "1", 6);

            } else {

                if(!$nullSetVars) unset($refElement["mark"]);
                else $refElement["mark"] = NULL;

            }

        }

    }

}

function calculateMark_Class_Ref(array &$refElement, array &$originalElement, bool $nullSetVars = false) {

    // Wenn nullSetVars true: Variablen sind nur auf Null gesetzt, wenn Wert moeglich, aber nicht vorhanden

    $students = array();

    if(!is_null($refElement["round"]) && is_null($refElement["formula"])) {

        foreach($originalElement["students"] as &$student) {

            if(isset($student["mark"])) {

                if($refElement["round"] == 0) {
    
                    $students[$student["studentID"]]["mark"] = $student["mark"];
    
                } else {
    
                    $students[$student["studentID"]]["mark"] = roundMark($student["mark"], $refElement["round"]);
    
                }
    
            }

        }

    } else {

        foreach($originalElement["students"] as &$student) {

            if(isset($student["points"])) {

                $students[$student["studentID"]]["points"] = $student["points"];
    
            }

        }

    }

    if(!is_null($refElement["formula"])) {

        if($refElement["formula"] === "linear") {

            foreach($refElement["students"] as &$student) {

                if(isset($student["points"])) {

                    //$student["mark"] = $student["points"] / $element["maxPoints"] * 5 + 1;
                    $student["mark"] = bcadd(bcmul(bcdiv($student["points"], $refElement["maxPoints"], 6), "5", 6), "1", 6);
    
                }

            }

        }

    }

    foreach($refElement["students"] as &$student) {

        if(!is_null($refElement["round"])) {

            if(isset($students[$student["studentID"]]["mark"])) {

                $student["mark"] = $students[$student["studentID"]]["mark"];

            } else {

                if(!$nullSetVars) unset($student["mark"]);
                else $student["mark"] = NULL;

            }

        }

        if(is_null($refElement["round"]) || !is_null($refElement["formula"])) {

            if(isset($students[$student["studentID"]]["points"])) {

                $student["points"] = $students[$student["studentID"]]["points"];

            } else {

                if(!$nullSetVars) unset($student["points"]);
                else $student["points"] = NULL;

            }

        }

    }

}


function updateCurrentMark(int $testID, string $oldMark, string $oldPoints, string $newMark, string $newPoints) : bool {

    global $mysqli;

    if(is_null($newMark) && is_null($newPoints)) {

        if(!is_null($oldMark) || !is_null($oldPoints)) {

            $stmt = $mysqli->prepare("DELETE FROM marks WHERE testID = ?");
            $stmt->bind_param("i", $testID);
            $stmt->execute();
            $stmt->close();

            return true;

        }

    } elseif($oldMark !== $newMark || $oldPoints !== $newPoints) {
        
        if(is_null($oldMark) && is_null($oldPoints)) {

            $stmt = $mysqli->prepare("INSERT INTO marks (testID, mark, points) VALUES (?, ?, ?)");
            $stmt->bind_param("iss", $testID, $newMark, $newPoints);


        } else {

            $stmt = $mysqli->prepare("UPDATE marks SET mark = ?, points = ? WHERE testID = ?");
            $stmt->bind_param("ssi", $newMark, $newPoints, $testID);


        }

        $stmt->execute();
        $stmt->close();

        return true;

    }

    return false;


}

function updateCurrentMark_Class(int $testID, array &$oldMarks, array &$newMarks) : bool {

    // Bei oldMarks muss das Array die studentIDs als Schlüssel haben, bei newMarks nicht

    global $mysqli;

    $studentsToDelete = array();
    $studentsToChange = array();
    $studentsToAdd = array();

    $hasChanged = false;

    foreach($newMarks as &$student) {

        $oldStudent = &$oldMarks[$student["studentID"]];

        $newMark = isset($student["mark"]) ? $student["mark"] : NULL;
        $newPoints = isset($student["points"]) ? $student["points"] : NULL;

        if(is_null($newMark) && is_null($newPoints)) {
            
            if(!is_null($oldStudent["mark"]) || !is_null($oldStudent["points"])) {
                
                $hasChanged = true;
                $studentsToDelete[] = &$student;

            }

        } elseif($oldStudent["mark"] !== $newMark || $oldStudent["points"] !== $newPoints) {
            
            $hasChanged = true;

            if(is_null($oldStudent["mark"]) && is_null($oldStudent["points"])) {
                
                $studentsToAdd[] = &$student;


            } else {
                
                $studentsToChange[] = &$student;


            }

        }

    }

    if(!empty($studentsToDelete)) {

        $arguments = array();
        $parameterTypes = str_repeat("i", count($studentsToDelete) + 1);
        $queryFragment = str_repeat("?", count($studentsToDelete));

        foreach($studentsToDelete as &$student) {

            $arguments[] = $student["studentID"];

        }

        $stmt = $mysqli->prepare("DELETE FROM marks WHERE testID = ? AND studentID IN (" . $queryFragment . ")");
        $stmt->bind_param($parameterTypes, $testID, ...$arguments);
        $stmt->execute();
        $stmt->close();

    }

    if(!empty($studentsToAdd)) {

        $arguments = array();
        $parameterTypes = str_repeat("iiss", count($studentsToAdd));
        $queryFragment = str_repeat("(?, ?, ?, ?), ", count($studentsToAdd) - 1) . "(?, ?, ?, ?)";

        $nullVar = NULL;

        foreach($studentsToAdd as &$student) {

            $mark = isset($student["mark"]) ? $student["mark"] : $nullVar;
            $points = isset($student["points"]) ? $student["points"] : $nullVar;

            array_push($arguments, $testID, $student["studentID"], $mark, $points);

        }

        $stmt = $mysqli->prepare("INSERT INTO marks (testID, studentID, mark, points) VALUES " . $queryFragment);
        $stmt->bind_param($parameterTypes, ...$arguments);
        $stmt->execute();
        $stmt->close();

    }

    if(!empty($studentsToChange)) {

        $stmt = $mysqli->prepare("UPDATE marks SET mark = ?, points = ? WHERE testID = ? AND studentID = ?");

        $nullVar = NULL;

        foreach($studentsToChange as &$student) {

            $mark = isset($student["mark"]) ? $student["mark"] : $nullVar;
            $points = isset($student["points"]) ? $student["points"] : $nullVar;

            $stmt->bind_param("ssii", $mark, $points, $testID, $student["studentID"]);
            $stmt->execute();
            $stmt->close();

        }

    }

    return $hasChanged;

}




function updateMarks(Test $test, bool $updateCurrent = true, int $recursionLevel = 5) {
    
    global $mysqli;

    $hasChanged = true;

    if($test->isRoot) {

        return;

    }

    if(!is_null($test->data["classID"])) {

        if(!$test->withStudents) {

            $stmt = $mysqli->prepare("SELECT students.studentID, students.isHidden, students.firstName, students.lastName, students.gender FROM students WHERE classID = ?");
            $stmt->bind_param("i", $test->data["classID"]);
            $stmt->execute();

            $test->data["students"] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $test->withStudents = true;

            $stmt->close();

        }

    }

    if(is_null($test->data["classID"])) {

        if(!$test->withMarks) {

            $stmt = $mysqli->prepare("SELECT mark, points FROM marks WHERE testID = ?");
            $stmt->bind_param("i", $test->data["testID"]);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_assoc();
            $test->data["mark"] = $result["mark"];
            $test->data["points"] = $result["points"];

            $stmt->close();

        }

    } else {

        $students = array();

        foreach($test->data["students"] as &$student) {

            $students[$student["studentID"]] = $student;

            if(!isset($student["mark"])) {

                $students[$student["studentID"]]["mark"] = NULL;

            }

            if(!isset($student["points"])) {

                $students[$student["studentID"]]["points"] = NULL;

            }

        }

        if(!$test->withMarks) {

            $stmt = $mysqli->prepare("SELECT studentID, mark, points FROM marks WHERE testID = ? AND EXISTS (SELECT studentID FROM students WHERE students.studentID = marks.studentID AND students.deleteTimestamp IS NULL)");
            $stmt->bind_param("i", $test->data["testID"]);
            $stmt->execute();

            $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            $stmt->close();

            foreach($results as &$student) {

                $students[$student["studentID"]]["mark"] = $student["mark"];
                $students[$student["studentID"]]["points"] = $student["points"];

            }

            foreach($test->data["students"] as &$student) {

                $student["mark"] = $students[$student["studentID"]]["mark"];
                $student["points"] = $students[$student["studentID"]]["points"];

            }

        }

    }

    if(!is_null($test->data["referenceState"]) && $updateCurrent) {

        $hasChanged = false;

        if($test->data["referenceState"] === "ok" || $test->data["referenceState"] === "outdated") {

            if(is_null($test->data["classID"])) {

                $stmt = $mysqli->prepare("SELECT tests.*, marks.mark, marks.points FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID LEFT JOIN marks ON marks.testID = tests.testID AND (semesters.classID IS NULL OR marks.studentID = (SELECT students.studentID FROM students WHERE students.classID = semesters.classID AND students.userID = ?)) WHERE tests.testID = ?");
                $stmt->bind_param("ii", $test->data["userID"], $test->data["referenceID"]);
                $stmt->execute();

                $originalElement = $stmt->get_result()->fetch_assoc();

                $oldMark = isset($test->data["mark"]) ? $test->data["mark"] : NULL;
                $oldPoints = isset($test->data["points"]) ? $test->data["points"] : NULL;

                calculateMark_Ref($test->data, $originalElement, NULL, true);

                $newMark = isset($test->data["mark"]) ? $test->data["mark"] : NULL;
                $newPoints = isset($test->data["points"]) ? $test->data["points"] : NULL;

                $hasChanged = updateCurrentMark($test->data["testID"], $oldMark, $oldPoints, $newMark, $newPoints);

            } else {

                $stmt = $mysqli->prepare("SELECT * FROM tests WHERE tests.testID = ?");
                $stmt->bind_param("i", $test->data["referenceID"]);
                $stmt->execute();

                $originalElement = $stmt->get_result()->fetch_assoc();

                $stmt->prepare("SELECT studentID, mark, points FROM marks WHERE testID = ?");
                $stmt->bind_param("i", $test->data["referenceID"]);
                $stmt->execute();
                
                $originalElement["students"] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                
                calculateMark_Class_Ref($test->data, $originalElement, true);

                $hasChanged = updateCurrentMark_Class($test->data["testID"], $students, $test->data["students"]);

            }

            $stmt->close();

        }

        if($test->data["referenceState"] === "outdated") {

            $stmt = $mysqli->prepare("UPDATE tests SET referenceState = \"ok\" WHERE testID = ?");
            $stmt->bind_param("i", $test->data["testID"]);
            $stmt->execute();
            $stmt->close();

        }

    }

    if($test->isFolder && $updateCurrent) {

        if(is_null($test->data["classID"])) {

            $stmt = $mysqli->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON marks.testID = tests.testID WHERE tests.parentID = ? AND tests.markCounts = 1 AND tests.deleteTiemstamp IS NULL");
            $stmt->bind_param("i", $test->data["testID"]);
            $stmt->execute();

            $test->childrenData = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            $stmt->close();

            $oldMark = isset($test->data["mark"]) ? $test->data["mark"] : NULL;
            $oldPoints = isset($test->data["points"]) ? $test->data["points"] : NULL;
            
            calculateMark($test->data, $test->childrenData, true, true);

            $newMark = isset($test->data["mark"]) ? $test->data["mark"] : NULL;
            $newPoints = isset($test->data["points"]) ? $test->data["points"] : NULL;
            
            $hasChanged = updateCurrentMark($test->data["testID"], $oldMark, $oldPoints, $newMark, $newPoints);

        } else {

            $stmt = $mysqli->prepare("SELECT * FROM tests WHERE tests.parentID = ? AND tests.markCounts = 1 AND tests.deleteTimestamp IS NULL");
            $stmt->bind_param("i", $test->data["testID"]);
            $stmt->execute();

            $test->childrenData = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            $stmt->prepare("SELECT studentID, mark, points FROM marks WHERE testID = ?");

            foreach($test->childrenData as &$subTest) {

                $stmt->bind_param("i", $subTest["testID"]);
                $stmt->execute();

                $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

                $subTest["students"] = $results;

            }

            $stmt->close();

            calculateMark_Class($test->data, $test->childrenData, true, false, false, true);

            $hasChanged = updateCurrentMark_Class($test->data["testID"], $students, $test->data["students"]);

        }

    }

    if($test->data["isReferenced"]) {
        
        $refsToUpdate = array();

        $stmt = $mysqli->prepare("SELECT tests.testID, tests.parentID, tests.maxPoints, tests.round, tests.formula, tests.isReferenced, marks.points, marks.mark, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON (tests.semesterID = semesters.semesterID) LEFT JOIN marks ON (marks.testID = tests.testID AND semesters.classID IS NULL) WHERE tests.referenceID = ? AND (tests.referenceState = \"ok\" OR tests.referenceState = \"outdated\") AND tests.deleteTimestamp IS NULL");
        $stmt->bind_param("i", $test->data["testID"]);
        $stmt->execute();

        $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        $marksToDelete = array();
        $marksToChange = array();
        $marksToAdd = array();

        $studentIDQueryReady = false;
        $markClassQueryReady = false;
        $selectStudent = false;

        foreach($results as &$currentRef) {

            if(is_null($currentRef["classID"])) {

                $oldMark = isset($currentRef["mark"]) ? $currentRef["mark"] : NULL;
                $oldPoints = isset($currentRef["points"]) ? $currentRef["points"] : NULL;

                if(!is_null($test->data["classID"])) {
                    
                    if(!$studentIDQueryReady) {

                        $stmt_studentID = $mysqli->prepare("SELECT students.studentID FROM students WHERE students.classID = ? AND students.userID = ?");
                        $studentIDQueryReady = true;

                    }

                    $stmt_studentID->bind_param("ii", $test->data["classID"], $currentRef["userID"]);
                    $stmt_studentID->execute();

                    $studentID = $stmt->get_result()->fetch_assoc()["studentID"];

                } else {

                    $studentID = NULL;

                }
                
                calculateMark_Ref($currentRef, $test->data, $studentID, true);

                $newMark = isset($currentRef["mark"]) ? $currentRef["mark"] : NULL;
                $newPoints = isset($currentRef["points"]) ? $currentRef["points"] : NULL;
                
                if(is_null($newMark) && is_null($newPoints)) {

                    if(!is_null($oldMark) || !is_null($oldPoints)) {

                        $marksToDelete[] = $currentRef["testID"];
                        $refsToUpdate[$currentRef["testID"]] = &$currentRef;

                    }

                } elseif($oldMark !== $newMark || $oldPoints !== $newPoints) {

                    $arr = array(
                        "testID" => $currentRef["testID"],
                        "mark" => $newMark,
                        "points" => $newPoints
                    );
                    
                    if(is_null($oldMark) && is_null($oldPoints)) {

                        $marksToAdd[] = $arr;

                    } else {

                        $marksToChange[] = $arr;

                    }

                    $refsToUpdate[$currentRef["testID"]] = &$currentRef;

                }

            } else {
                
                $students = array();

                foreach($test->data["students"] as &$student) {

                    $students[$student["studentID"]] = array(
                        "studentID" => $student["studentID"],
                        "mark" => NULL,
                        "points" => NULL
                    );

                }

                if(!$markClassQueryReady) {

                    $stmt_markClass = $mysqli->prepare("SELECT studentID, points, mark FROM marks WHERE testID = ?");
        
                }

                $stmt_markClass->bind_param("i", $currentRef["testID"]);
                $stmt_markClass->execute();

                $result = $stmt_markClass->get_result()->fetch_all(MYSQLI_ASSOC);

                foreach($result as &$student) {

                    $students[$student["studentID"]]["points"] = $student["points"];
                    $students[$student["studentID"]]["mark"] = $student["mark"];

                }

                $currentRef["students"] = array_values($students);

                calculateMark_Class_Ref($currentRef, $test->data, true);

                foreach($currentRef["students"] as &$student) {

                    $oldMark = $students[$student["studentID"]]["mark"];
                    $oldPoints = $students[$student["studentID"]]["points"];

                    $newMark = isset($student["mark"]) ? $student["mark"] : NULL;
                    $newPoints = isset($student["points"]) ? $student["points"] : NULL;

                    if(is_null($newMark) && is_null($newPoints)) {

                        if(!is_null($oldMark) || !is_null($oldPoints)) {
    
                            $marksToDelete[] = $currentRef["testID"];
                            $refsToUpdate[$currentRef["testID"]] = &$currentRef;
    
                        }
    
                    } elseif($oldMark !== $newMark || $oldPoints !== $newPoints) {
                        
                        $arr = array(
                            "testID" => $currentRef["testID"],
                            "studentID" => $student["studentID"],
                            "mark" => $newMark,
                            "points" => $newPoints
                        );

                        if(is_null($oldMark) && is_null($oldPoints)) {
    
                            $marksToAdd[] = $arr;
    
                        } else {
    
                            $marksToChange[] = $arr;
                            $selectStudent = true;
    
                        }
    
                        $refsToUpdate[$currentRef["testID"]] = &$currentRef;
    
                    }

                }

            }

        }

        if($studentIDQueryReady) {

            $stmt_studentID->close();

        }

        if($markClassQueryReady) {

            $stmt_markClass->close();

        }

        if(!empty($marksToDelete)) {

            $queryFragment = str_repeat("?", count($marksToDelete));
            $parameterTypes = str_repeat("i", count($marksToDelete));

            $stmt->prepare("DELETE FROM marks WHERE testID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, ...$marksToDelete);
            $stmt->execute();

        }

        if(!empty($marksToChange)) {

            $stmt->prepare("UPDATE marks SET points = ?, mark = ? WHERE testID = ?");
            
            if($selectStudent) {
                
                $stmt_class = $mysqli->prepare("UPDATE marks SET points = ?, mark = ? WHERE testID = ? AND studentID = ?");

            }

            $nullVar = NULL;
            
            foreach($marksToChange as &$currentMark) {

                if(isset($currentMark["studentID"])) {

                    $points = isset($currentMark["points"]) ? $currentMark["points"] : $nullVar;
                    $mark = isset($currentMark["mark"]) ? $currentMark["mark"] : $nullVar;

                    $stmt_class->bind_param("ssii", $points, $mark, $currentMark["testID"], $currentMark["studentID"]);
                    $stmt_class->execute();

                } else {

                    $points = isset($currentMark["points"]) ? $currentMark["points"] : $nullVar;
                    $mark = isset($currentMark["mark"]) ? $currentMark["mark"] : $nullVar;
                
                    $stmt->bind_param("ssi", $points, $mark, $currentMark["testID"]);
                    $stmt->execute();

                }

            }

        }

        if(!empty($marksToAdd)) {

            $arguments = array();
            $queryFragment = str_repeat("(?, ?, ?, ?), ", count($marksToAdd) - 1) . "(?, ?, ?, ?)";
            $parameterTypes = str_repeat("iiss", count($marksToAdd));

            $nullVar = NULL;

            foreach($marksToAdd as &$currentMark) {

                $studentID = isset($currentMark["studentID"]) ? $currentMark["studentID"] : $nullVar;
                $points = isset($currentMark["points"]) ? $currentMark["points"] : $nullVar;
                $mark = isset($currentMark["mark"]) ? $currentMark["mark"] : $nullVar;

                array_push($arguments,
                    $currentMark["testID"],
                    $studentID,
                    $points,
                    $mark
                );

            }

            $stmt->prepare("INSERT INTO marks (testID, studentID, points, mark) VALUES " . $queryFragment);
            $stmt->bind_param($parameterTypes, ...$arguments);
            $stmt->execute();

        }

        $stmt->close();

    }
    
    if(!is_null($test->data["classID"])) {

        foreach($test->data["students"] as &$student) {

            unset($student["mark"]);
            unset($student["points"]);

        }

    }

    if($test->data["isReferenced"] && !empty($refsToUpdate)) {

        if($recursionLevel > 0) {

            // Referenzen wiederaktivieren

            $arguments = array_keys($refsToUpdate);
            $queryFragment = str_repeat("?", count($refsToUpdate));
            $parameterTypes = str_repeat("i", count($refsToUpdate));

            $stmt = $mysqli->prepare("UPDATE tests SET referenceState = \"ok\" WHERE testID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, ...$arguments);
            $stmt->execute();


            // Testen, ob Referenz selbst wieder referenziert und gegebenenfalls aktualisieren

            $parentIDs = array();
            $queryPrepared = false;

            foreach($refsToUpdate as &$currentRef) {

                if($currentRef["isReferenced"]) {

                    if(!$queryPrepared) {
                        
                        $stmt->prepare("SELECT tests.*, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID WHERE tests.referenceID = ? AND (tests.referenceState = \"ok\" OR tests.referenceState = \"outdated\")");
                        $queryPrepared = true;

                    }

                    $stmt->bind_param("i", $currentRef["testID"]);
                    $stmt->execute();
                    
                    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                    
                    foreach($results as &$newReference) {

                        $currentTest = new Test(ERROR_NONE, -1, true, $newReference);
                        var_dump($currentTest);
                        updateMarks($currentTest);

                    }

                }

                if(!in_array($currentRef["parentID"], $parentIDs, true)) {

                    $parentIDs[] = $currentRef["parentID"];

                }

            }

            // Uebergeordnete Ordner der Referenzen aktualisieren

            $queryFragment = str_repeat("?", count($parentIDs));
            $parameterTypes = str_repeat("i", count($parentIDs));

            $stmt->prepare("SELECT tests.*, semesters.userID, semesters.classID, semesters.templateType FROM tests INNER JOIN semesters ON tests.semesterID = semesters.semesterID WHERE tests.testID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, ...$parentIDs);
            $stmt->execute();

            $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            foreach($results as $currentData) {

                $currentTest = new Test(ERROR_NONE, -1, true, $currentData);
                
                if(!is_null($currentTest->data["classID"])) {

                    $currentTest->data["students"] = $test->data["students"];

                }

                updateMarks($currentTest, true, $recursionLevel - 1);

            }

        } else {

            // Referenzen als outdated markieren

            $arguments = array_keys($refsToUpdate);
            $queryFragment = str_repeat("?", count($refsToUpdate));
            $parameterTypes = str_repeat("i", count($refsToUpdate));

            $stmt = $mysqli->prepare("UPDATE tests SET referenceState = \"outdated\" WHERE testID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, ...$arguments);
            $stmt->execute();

        }

        $stmt->close();

    }

    if($hasChanged) {

        if(!is_null($test->data["parentID"])) {

            $stmt = $mysqli->prepare("SELECT tests.*, semesters.userID, semesters.classID, semesters.templateType FROM tests INNER JOIN semesters ON tests.semesterID = semesters.semesterID WHERE tests.testID = ?");
            $stmt->bind_param("i", $test->data["parentID"]);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_assoc();
            $parentTest = new Test(ERROR_NONE, -1, true, $result);

            if(!is_null($parentTest->data["classID"])) {

                $parentTest->data["students"] = $test->data["students"];

            }

            updateMarks($parentTest, true, $recursionLevel);


        }

    }
}

?>