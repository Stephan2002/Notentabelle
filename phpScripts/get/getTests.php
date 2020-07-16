<?php

/*

Laedt alle Pruefugen und Ordner eines Ordners/Fach, sofern der Nutzer Zugriff hat.

Input:
    testID (OrdnerID)
    semesterID (falls testID nicht angeben, weil kein Ordner, sondern Fach)
    isPublicTemplate

*/

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/getElement.php");

function roundMark($mark_unrounded) {

    if(is_null($mark_unrounded)) {

        return null;

    }

    $mark_rounded = ((int)$mark_unrounded * 2) / 2;

    if($mark_rounded > 6) {

        return 6;

    } else {

        return $mark_rounded;

    }

}

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOTLOGGEDIN);

}

session_write_close();

if(isset($_POST["testid"]) && is_numeric($_POST["testid"])) {

    $testID = (int)$_POST["testid"];

}

if(!isset($testID)) {

    if(isset($_POST["semesterid"]) && is_numeric($_POST["semesterid"])) {

        $semesterID = (int)$_POST["semesterid"];

    }

}

if(!isset($testID) && !isset($semesterID)) {

    throwError(ERROR_BADINPUT);

}

/*if(isset($testID)) {

    $test = getTest($testID);

    if($test->error === ERROR_NONE) {

        if(!$test->data["isFolder"]) {

            throwError(ERROR_BADINPUT);

        }

        if(isset($test->data["classID"]) && $test->accessType !== Element::ACCESS_STUDENT) {

            $stmt = $mysqli->prepare("SELECT students.studentID, students.isHidden, students.firstName, students.lastName, students.gender, marks.mark, marks.points, marks.notes FROM students LEFT JOIN marks ON (marks.studentID = students.studentID AND marks.testID = ?) WHERE students.classID = ? AND students.deleteTimestamp IS NULL");
            $stmt->bind_param("ii", $testID, $test->data["classID"]);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            if(is_null($test->data["round"])) {

                foreach($result as &$student) {

                    unset($student["mark"]);

                }

            } else {

                $sum = 0;
                $count = 0;

                if($test->data["round"]) {

                    foreach($result as &$student) {

                        if(!is_null($student["mark"])) {

                            $student["mark_unrounded"] = $student["mark"];
                            $student["mark"] = roundMark($student["mark"]);

                            $count++;
                            $sum += $student["mark"];
    
                        } else {

                            unset($student["mark"]);

                        }
    
                    }

                } else {

                    foreach($result as &$student) {

                        if(!is_null($student["mark"])) {

                            $student["mark_unrounded"] = $student["mark"];

                            $count++;
                            $sum += $student["mark"];
    
                        } else {

                            unset($student["mark"]);

                        }
    
                    }

                }

                $test->mark = $sum / $count;

            }

            if(!is_null($test->data["round"]) && is_null($test->data["formula"])) {

                foreach($result as &$student) {

                    unset($student["points"]);

                }

            } else {

                $sum = 0;
                $count = 0;

                foreach($result as &$student) {

                    if(!is_null($student["points"])) {

                        $count++;
                        $sum += $student["points"];

                    } else {

                        unset($student["points"]);

                    }

                }

                $test->mark = $sum / $count;

            }

            $test->students = $result;

            $stmt->prepare("SELECT * FROM tests WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL");
            $stmt->bind_param("i", $testID);
            $stmt->execute();

            $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            $stmt->prepare("SELECT mark, points FROM marks WHERE testID = ? AND EXISTS (SELECT studentID FROM students WHERE students.studentID = marks.studentID AND students.deleteTimestamp IS NULL)");

            foreach($results as &$subTest) {

                $stmt->bind_param("i", $subTest["testID"]);
                $stmt->execute();

                $marksResults = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

                if(!is_null($test->data["round"])) {

                    $sum = 0;
                    $count = 0;

                    if($test->data["round"]) {

                        foreach($marksResult as &$marksResult) {

                            if(!is_null($marksResult["mark"])) {

                                $count++;
                                $sum += roundMark($marksResult["mark"]);

                            }
        
                        }

                    } else {

                        foreach($marksResult as &$marksResult) {

                            if(!is_null($marksResult["mark"])) {

                                $count++;
                                $sum += $marksResult["mark"];

                            }
        
                        }

                    }

                    $subTest->mark = $sum / $count;

                }

                if(is_null($test->data["round"]) || !is_null($test->data["formula"])) {

                    $sum = 0;
                    $count = 0;

                    foreach($marksResult as &$marksResult) {

                        if(!is_null($marksResult["points"])) {

                            $count++;
                            $sum += $marksResult["points"];

                        }
    
                    }

                    $subTest->points = $sum / $count;
    
                }

            }

        } else {

            if($test->accessType === Element::ACCESS_STUDENT) {

                $stmt = $mysqli->prepare("SELECT mark, points FROM marks WHERE testID = ? AND studentID = ?");
                $stmt->bind_param("ii", $testID, $test->studentID);

            } else {

                $stmt = $mysqli->prepare("SELECT mark, points FROM marks WHERE testID = ?");
                $stmt->bind_param("i", $testID);

            }

            $stmt->execute();

            $result = $stmt->get_result()->fetch_assoc();

            if(isset($result)) {

                if(!is_null($test->data["round"])) {

                    $test->data["mark_unrounded"] = $result["mark"];

                    if($test->data["round"]) {

                        $test->data["mark"] = roundMark($result["mark"]);

                    } else {

                        $test->data["mark"] = $result["mark"];

                    }

                }

                if(is_null($test->data["round"]) || !is_null($test->data["formula"])) {

                    $test->data["points"] = $result["points"];

                }

            }

            $stmt->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON tests.testID = marks.testID WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL");
            
            if($test->accessType === Element::ACCESS_STUDENT) {

                $stmt->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON (tests.testID = marks.testID AND marks.studentID = ?) WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL");
                $stmt->bind_param("ii", $test->studentID, $testID);

            } else {

                $stmt->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON tests.testID = marks.testID WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL");
                $stmt->bind_param("i", $testID);

            }

            $stmt->execute();

            $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            foreach($results as &$subTest) {

                if(!is_null($subTest["round"])) {

                    $subTest["mark_unrounded"] = $subTest["mark"];

                    if($subTest["round"]) {

                        $subTest["mark"] = roundMark($result["mark"]);

                    } else {

                        $subTest["mark"] = $result["mark"];

                    }

                } else {

                    unset($subTest["mark"]);

                }

                if(is_null($subTest["round"]) || !is_null($subTest["formula"])) {

                    $subTest["points"] = $result["points"];

                } else {

                    unset($subTest["points"]);

                }

            }
            
            $test->childrenData = $result;

        }      

    }

} else {

    $test = getSemester($semesterID);

    if($test->error === ERROR_NONE) {
        
        if(isset($test->childrenData)) {

            $stmt = $mysqli->prepare("SELECT * FROM tests WHERE semesterID = ? AND parentID IS NULL AND deleteTimestamp IS NULL");
            $stmt->bind_param("i", $semesterID);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $test->childrenData = $result;

        }

    }



}*/

if(isset($testID)) {

    $test = getTest($testID);

} else {

    $test = getSemester($semesterID);

}

if($test->error === ERROR_NONE) {

    if(!$test->data["isFolder"] && isset($testID)) {

        throwError(ERROR_BADINPUT);

    }

    // Das folgende funktioniert aktuelle nur, wenn testID gesetzt ist.

    if(isset($test->data["classID"]) && $test->accessType !== Element::ACCESS_STUDENT) {

        $stmt = $mysqli->prepare("SELECT students.studentID, students.isHidden, students.firstName, students.lastName, students.gender, marks.mark, marks.points, marks.notes FROM students LEFT JOIN marks ON (marks.studentID = students.studentID AND marks.testID = ?) WHERE students.classID = ? AND students.deleteTimestamp IS NULL");
        $stmt->bind_param("ii", $testID, $test->data["classID"]);
        $stmt->execute();

        $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        if(is_null($test->data["round"])) {

            foreach($result as &$student) {

                unset($student["mark"]);

            }

        } else {

            $sum = 0;
            $count = 0;

            if($test->data["round"]) {

                foreach($result as &$student) {

                    if(!is_null($student["mark"])) {

                        $student["mark_unrounded"] = $student["mark"];
                        $student["mark"] = roundMark($student["mark"]);

                        $count++;
                        $sum += $student["mark"];

                    } else {

                        unset($student["mark"]);

                    }

                }

            } else {

                foreach($result as &$student) {

                    if(!is_null($student["mark"])) {

                        $student["mark_unrounded"] = $student["mark"];

                        $count++;
                        $sum += $student["mark"];

                    } else {

                        unset($student["mark"]);

                    }

                }

            }

            $test->mark = $sum / $count;

        }

        if(!is_null($test->data["round"]) && is_null($test->data["formula"])) {

            foreach($result as &$student) {

                unset($student["points"]);

            }

        } else {

            $sum = 0;
            $count = 0;

            foreach($result as &$student) {

                if(!is_null($student["points"])) {

                    $count++;
                    $sum += $student["points"];

                } else {

                    unset($student["points"]);

                }

            }

            $test->mark = $sum / $count;

        }

        $test->students = $result;

        $stmt->prepare("SELECT * FROM tests WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL");
        $stmt->bind_param("i", $testID);
        $stmt->execute();

        $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        $stmt->prepare("SELECT mark, points FROM marks WHERE testID = ? AND EXISTS (SELECT studentID FROM students WHERE students.studentID = marks.studentID AND students.deleteTimestamp IS NULL)");

        foreach($results as &$subTest) {

            $stmt->bind_param("i", $subTest["testID"]);
            $stmt->execute();

            $marksResults = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            if(!is_null($test->data["round"])) {

                $sum = 0;
                $count = 0;

                if($test->data["round"]) {

                    foreach($marksResult as &$marksResult) {

                        if(!is_null($marksResult["mark"])) {

                            $count++;
                            $sum += roundMark($marksResult["mark"]);

                        }
    
                    }

                } else {

                    foreach($marksResult as &$marksResult) {

                        if(!is_null($marksResult["mark"])) {

                            $count++;
                            $sum += $marksResult["mark"];

                        }
    
                    }

                }

                $subTest->mark = $sum / $count;

            }

            if(is_null($test->data["round"]) || !is_null($test->data["formula"])) {

                $sum = 0;
                $count = 0;

                foreach($marksResult as &$marksResult) {

                    if(!is_null($marksResult["points"])) {

                        $count++;
                        $sum += $marksResult["points"];

                    }

                }

                $subTest->points = $sum / $count;

            }

        }

    } else {

        if($test->accessType === Element::ACCESS_STUDENT) {

            $stmt = $mysqli->prepare("SELECT mark, points FROM marks WHERE testID = ? AND studentID = ?");
            $stmt->bind_param("ii", $testID, $test->studentID);

        } else {

            $stmt = $mysqli->prepare("SELECT mark, points FROM marks WHERE testID = ?");
            $stmt->bind_param("i", $testID);

        }

        $stmt->execute();

        $result = $stmt->get_result()->fetch_assoc();

        if(isset($result)) {

            if(!is_null($test->data["round"])) {

                $test->data["mark_unrounded"] = $result["mark"];

                if($test->data["round"]) {

                    $test->data["mark"] = roundMark($result["mark"]);

                } else {

                    $test->data["mark"] = $result["mark"];

                }

            }

            if(is_null($test->data["round"]) || !is_null($test->data["formula"])) {

                $test->data["points"] = $result["points"];

            }

        }

        $stmt->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON tests.testID = marks.testID WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL");
        
        if($test->accessType === Element::ACCESS_STUDENT) {

            $stmt->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON (tests.testID = marks.testID AND marks.studentID = ?) WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL");
            $stmt->bind_param("ii", $test->studentID, $testID);

        } else {

            $stmt->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON tests.testID = marks.testID WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL");
            $stmt->bind_param("i", $testID);

        }

        $stmt->execute();

        $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        foreach($results as &$subTest) {

            if(!is_null($subTest["round"])) {

                $subTest["mark_unrounded"] = $subTest["mark"];

                if($subTest["round"]) {

                    $subTest["mark"] = roundMark($result["mark"]);

                } else {

                    $subTest["mark"] = $result["mark"];

                }

            } else {

                unset($subTest["mark"]);

            }

            if(is_null($subTest["round"]) || !is_null($subTest["formula"])) {

                $subTest["points"] = $result["points"];

            } else {

                unset($subTest["points"]);

            }

        }
        
        $test->childrenData = $result;

    }      

}

$test->sendResponse();

?>