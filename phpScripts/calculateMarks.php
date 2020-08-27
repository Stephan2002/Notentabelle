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

function calculateMark(array &$element, array &$subElements, bool $isTest = true, bool $unsetVars = true) {

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

            if($unsetVars) unset($element["mark"]);
            elseif(isset($element["mark"])) $element["mark"] = NULL;

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

            if($unsetVars) unset($element["points"]);
            elseif(isset($element["points"])) $element["points"] = NULL;

        } else {

            $element["points"] = $sumPoints;

        }

    }

    if($isTest && (!is_null($element["round"]) && !is_null($element["formula"]))) {

        if($element["formula"] === "linear") {

            if(isset($element["points"])) {

                // $element["mark"] = $element["points"] / $element["maxPoints"] * 5 + 1;
                $element["mark"] = bcadd(bcmul(bcdiv($element["points"], $element["maxPoints"], 6), "5", 6), 1, 6);

            } else {

                if($unsetVars) unset($element["mark"]);
                elseif(isset($element["mark"])) $element["mark"] = NULL;

            }

        }

    }

}

function calculateMark_Class(array &$element, array &$subElements, bool $isTest = true, bool $classAverage = false, bool $withPlusPoints = false, bool $unsetVars = true) {

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

                    if($unsetVars) unset($subTest["mark"]);
                    elseif(isset($subTest["mark"])) $subTest["mark"] = NULL;

                } else {

                    $subTest["mark"] = $sumMarks / $count;
                    $subTest["mark_unrounded"] = $subTest["mark"];

                }

            }

        }

        foreach($element["students"] as &$student) {

            if($students[$student["studentID"]]["sumWeights"] == 0) {

                if($unsetVars) unset($student["mark"]);
                elseif(isset($student["mark"])) $student["mark"] = NULL;

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

                    if($unsetVars) unset($subTest["points"]);
                    elseif(isset($subTest["points"])) $subTest["points"] = NULL;

                } else {

                    $subTest["points"] = $sumPoints / $count;

                }

            }

        }

        foreach($element["students"] as &$student) {

            if($students[$student["studentID"]]["count"] === 0) {

                if($unsetVars) unset($student["points"]);
                elseif(isset($student["points"])) $student["points"] = NULL;

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
                    $student["mark"] = bcadd(bcmul(bcdiv($student["points"], $element["maxPoints"], 6), "5", 6), 1, 6);
    
                } else {
    
                    if($unsetVars) unset($student["mark"]);
                    elseif(isset($student["mark"])) $student["mark"] = NULL;
                    
    
                }

            }

        }

    }

}


function updateMarks(Test &$test, bool $isClass = false, bool $updateCurrent = true) {

    global $mysqli;

    if($test->isFolder && $updateCurrent) {

        if(!$isClass) {

            $oldMark = $test->data["mark"];
            $oldPoints = $test->data["points"];
            
            calculateMark($test->data, $test->childrenData, true, false);
            
            if(is_null($test->data["mark"]) && is_null($test->data["mark"])) {

                if(!is_null($oldMark) || !is_null($oldPoints)) {

                    $stmt = $mysqli->prepare("DELETE FROM marks WHERE testID = ?");
                    $stmt->bind_param("i", $test->data["testID"]);
                    $stmt->execute();
                    $stmt->close();

                }

            } elseif($oldMark !== $test->data["mark"] || $oldPoints !== $test->data["points"]) {
                
                if(is_null($oldMark) && is_null($oldPoints)) {

                    $stmt = $mysqli->prepare("INSERT INTO marks (testID, mark, points) VALUES (?, ?, ?)");
                    $stmt->bind_param("iss", $test->data["testID"], $test->data["mark"], $test->data["points"]);


                } else {

                    $stmt = $mysqli->prepare("UPDATE marks SET mark = ?, points = ? WHERE testID = ?");
                    $stmt->bind_param("ssi", $test->data["mark"], $test->data["points"], $test->data["testID"]);


                }

                $stmt->execute();
                $stmt->close();

            }

        } else {

            $students = array();

            foreach($test->data["students"] as &$student) {

                $students[$student["studentID"]] = $student;

            }
            
            calculateMark_Class($test->data, $test->childrenData, true, false, false, false);

            $studentsToDelete = array();
            $studentsToChange = array();
            $studentsToAdd = array();

            foreach($test->data["students"] as &$student) {

                $oldStudent = &$students[$student["studentID"]];
                $oldMark = isset($oldStudent["mark"]) ? $oldStudent["mark"] : NULL;
                $oldPoints = isset($oldStudent["points"]) ? $oldStudent["points"] : NULL;

                $newMark = isset($student["mark"]) ? $student["mark"] : NULL;
                $newPoints = isset($student["points"]) ? $student["points"] : NULL;
                
                if(is_null($newMark) && is_null($newPoints)) {
                    
                    if(!is_null($oldMark) || !is_null($oldPoints)) {
                        
                        $studentsToDelete[] = &$student;
    
                    }
    
                } elseif($oldMark !== $newMark || $oldPoints !== $newPoints) {
                    
                    if(is_null($oldMark) && is_null($oldPoints)) {
                        
                        $studentsToAdd[] = &$student;
    
    
                    } else {
                        
                        $studentsToChange[] = &$student;
    
    
                    }
    
                }

            }

            if(count($studentsToDelete) > 0) {

                $stmt = $mysqli->prepare("DELETE FROM marks WHERE testID = ? AND studentID = ?");

                foreach($studentsToDelete as &$student) {

                    $stmt->bind_param("ii", $test->data["testID"], $student["studentID"]);
                    $stmt->execute();

                }

                $stmt->close();

            }

            if(count($studentsToAdd) > 0) {

                $stmt = $mysqli->prepare("INSERT INTO marks (testID, studentID, mark, points) VALUES (?, ?, ?, ?)");
                
                foreach($studentsToAdd as &$student) {

                    $stmt->bind_param("iiss", $test->data["testID"], $student["studentID"], $student["mark"], $student["points"]);
                    $stmt->execute();

                }

                $stmt->close();

            }

            if(count($studentsToChange) > 0) {

                $stmt = $mysqli->prepare("UPDATE marks SET mark = ?, points = ? WHERE testID = ? AND studentID = ?");

                foreach($studentsToChange as &$student) {

                    $stmt->bind_param("ssii", $student["mark"], $student["points"], $test->data["testID"], $student["studentID"]);
                    $stmt->execute();

                }

                $stmt->close();

            }

        }

    }

    if(!is_null($test->data["parentID"])) {

        if(!$isClass) {

            $stmt = $mysqli->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON marks.testID = tests.testID WHERE tests.testID = ?");
            $stmt->bind_param("i", $test->data["parentID"]);
            $stmt->execute();

            $results = $stmt->get_result()->fetch_assoc();

            $parentTest = new Test(ERROR_NONE, -1, true, $results);

            $stmt->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON marks.testID = tests.testID WHERE tests.parentID = ?");
            $stmt->bind_param("i", $test->data["parentID"]);
            $stmt->execute();

            $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            $parentTest->childrenData = $results;

            updateMarks($parentTest, false);

        } else {

            $stmt = $mysqli->prepare("SELECT * FROM tests WHERE tests.testID = ?");
            $stmt->bind_param("i", $test->data["parentID"]);
            $stmt->execute();

            $results = $stmt->get_result()->fetch_assoc();

            $parentTest = new Test(ERROR_NONE, -1, true, $results);
            $parentTest->data["students"] = array();

            $stmt->prepare("SELECT * FROM tests WHERE tests.parentID = ?");
            $stmt->bind_param("i", $test->data["parentID"]);
            $stmt->execute();

            $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            $parentTest->childrenData = $results;

            $stmt->prepare("SELECT studentID, mark, points FROM marks WHERE testID = ?");
            $stmt->bind_param("i", $parentTest->data["testID"]);
            $stmt->execute();

            $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            $students = array();

            foreach($results as &$student) {

                $students[$student["studentID"]] = array(

                    "mark" => $student["mark"],
                    "points" => $student["points"]

                );

            }

            foreach($test->data["students"] as &$student) {

                if(array_key_exists($student["studentID"], $students)) {

                    $newStudent = $students[$student["studentID"]];
                    
                } else {

                    $newStudent = array();

                }

                $newStudent["studentID"] = $student["studentID"];

                $parentTest->data["students"][] = $newStudent;

            }

            foreach($parentTest->childrenData as &$subTest) {

                $stmt->bind_param("i", $subTest["testID"]);
                $stmt->execute();

                $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

                $subTest["students"] = $results;

            }

            $stmt->close();

            updateMarks($parentTest, true);

        }

    }

}

?>