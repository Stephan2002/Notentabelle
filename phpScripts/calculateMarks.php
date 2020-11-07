<?php

/*

Datei, die inkludiert wird, um die Noten/Punkte in einem bestimmten Ordner zu berechnen.

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

    $mark_rounded = bcdiv_round($mark_unrounded, $precision, 0);
    $mark_rounded = bcmul($mark_rounded, $precision, 6);

    if(bccomp($mark_rounded, "6", 6) === 1) {

        return "6.000000";

    } else {

        return $mark_rounded;

    }

}

function bcdiv_round(string $dividend, string $divisor, int $scale) {

    $result = bcdiv($dividend, $divisor, $scale + 1);

    $scale = $scale > 0 ? (int)$scale : 0;

    if($result[strlen($result) - 1] >= 5) {

        $addingString = $scale === 0 ? "1" : ("0." . str_repeat(0, $scale - 1) . "1");

        $result = bcadd($result, $addingString, $scale); 

    } else {

        $result = substr($result, 0, -1);

    }

    return $result;

}


function plusPoints($mark) {

    if(is_null($mark)) {

        return NULL;

    }

    return $mark < 4 ? (2 * ($mark - 4)) : ($mark - 4);

}

function calculateMarkFromPoints(string $formula, string $maxPoints, string $points = NULL) {

    if($formula === "linear") {

        if($points !== NULL) {

            // $element["mark"] = $element["points"] / $element["maxPoints"] * 5 + 1;
            return bcadd(bcmul(bcdiv_round($points, $maxPoints, 6), "5", 6), "1", 6);

        }

        return NULL;

    }

}

function calculateMarkFromPoints_Class(string $formula, string $maxPoints, array &$students, bool $nullSetVars = true) {

    if($formula === "linear") {

        foreach($students as &$student) {

            if(isset($student["points"])) {

                //$student["mark"] = $student["points"] / $element["maxPoints"] * 5 + 1;
                $student["mark"] = bcadd(bcmul(bcdiv_round($student["points"], $maxPoints, 6), "5", 6), "1", 6);

            } else {

                if(!$nullSetVars) unset($student["mark"]);
                else $student["mark"] = NULL;
                

            }

        }

    }

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
            $element["mark"] = bcdiv_round($sumMarks, $sumWeights, 6);

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

    if($isTest && $element["formula"] !== NULL && $element["formula"] !== "manual") {

        if(isset($element["points"])) {
            
            $element["mark"] = calculateMarkFromPoints($element["formula"], $element["maxPoints"], $element["points"]);
            
        } else {

            if(!$nullSetVars) unset($element["mark"]);
            else $element["mark"] = NULL;

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
                $student["mark"] = bcdiv_round($students[$student["studentID"]]["sumMarks"], $students[$student["studentID"]]["sumWeights"], 6);

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

    if($isTest && $element["formula"] !== NULL && $element["formula"] !== "manual") {

        calculateMarkFromPoints_Class($element["formula"], $element["maxPoints"], $element["students"], $nullSetVars);

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

    if($refElement["formula"] !== NULL && $refElement["formula"] !== "manual") {
        
        if(isset($refElement["points"])) {
            
            $refElement["mark"] = calculateMarkFromPoints($refElement["formula"], $refElement["maxPoints"], $refElement["points"]);
            
        } else {

            if(!$nullSetVars) unset($refElement["mark"]);
            else $refElement["mark"] = NULL;

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

    if($refElement["formula"] !== NULL && $refElement["formula"] !== "manual") {
        
        calculateMarkFromPoints_Class($refElement["formula"], $refElement["maxPoints"], $students, $nullSetVars);

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


?>