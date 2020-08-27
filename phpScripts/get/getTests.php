<?php

/*

Laedt alle Pruefugen und Ordner eines Ordners/Fach, sofern der Nutzer Zugriff hat.

Input als JSON per POST:
    testID (OrdnerID)
    semesterID (falls testID nicht angeben, weil kein Ordner, sondern Fach)
    withMarks
    isPublicTemplate

*/

function getTests(Element &$test, bool $withMarks = false) : bool {

    global $mysqli;

    if($test->error !== ERROR_NONE) {

        return false;

    }

    if(!$test->data["isFolder"] && !$test->isRoot) {

        return false;

    }

    if($test->isRoot && $test->accessType === Element::ACCESS_TEACHER) {

        return true;

    }

    if(isset($test->data["classID"]) && $test->accessType !== Element::ACCESS_STUDENT) {

        if($withMarks) {

            if(!$test->isRoot) {
                
                if(!is_null($test->data["formula"])) {

                    $stmt = $mysqli->prepare("SELECT students.studentID, students.isHidden, students.firstName, students.lastName, students.gender, marks.mark, marks.points, marks.notes FROM students LEFT JOIN marks ON (marks.studentID = students.studentID AND marks.testID = ?) WHERE students.classID = ? AND students.deleteTimestamp IS NULL ORDER BY students.isHidden, students.lastName");
                    $stmt->bind_param("ii", $test->data["testID"], $test->data["classID"]);

                } elseif(!is_null($test->data["round"])) {

                    $stmt = $mysqli->prepare("SELECT students.studentID, students.isHidden, students.firstName, students.lastName, students.gender, marks.mark, marks.notes FROM students LEFT JOIN marks ON (marks.studentID = students.studentID AND marks.testID = ?) WHERE students.classID = ? AND students.deleteTimestamp IS NULL ORDER BY students.isHidden, students.lastName");
                    $stmt->bind_param("ii", $test->data["testID"], $test->data["classID"]);

                } else {

                    $stmt = $mysqli->prepare("SELECT students.studentID, students.isHidden, students.firstName, students.lastName, students.gender, marks.points, marks.notes FROM students LEFT JOIN marks ON (marks.studentID = students.studentID AND marks.testID = ?) WHERE students.classID = ? AND students.deleteTimestamp IS NULL ORDER BY students.isHidden, students.lastName");
                    $stmt->bind_param("ii", $test->data["testID"], $test->data["classID"]);

                }

            } else {

                $stmt = $mysqli->prepare("SELECT students.studentID, students.isHidden, students.firstName, students.lastName, students.gender FROM students WHERE students.classID = ? AND students.deleteTimestamp IS NULL ORDER BY students.isHidden, students.lastName");
                $stmt->bind_param("i", $test->data["classID"]);

            }

            $stmt->execute();

            $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $test->data["students"] = $result;

            $stmt->close();

        }

        if(!$test->isRoot && $withMarks) {
            
            if(!is_null($test->data["round"]) && is_null($test->data["formula"])) {
        
                $stmt = $mysqli->prepare("SELECT tests.*, IF(tests.round IS NOT NULL, AVG(LEAST(ROUND(marks.mark / tests.round) * tests.round, 6)), AVG(marks.mark)) AS mark FROM tests LEFT JOIN marks ON (marks.testID = tests.testID AND EXISTS (SELECT studentID FROM students WHERE students.studentID = marks.studentID AND students.deleteTimestamp IS NULL)) WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL GROUP BY tests.testID ORDER BY tests.isHidden, NOT tests.isFolder, tests.date, NOT tests.markCounts, tests.name");

            } elseif(!is_null($test->data["formula"])) {

                $stmt = $mysqli->prepare("SELECT tests.*, AVG(marks.points) AS points, IF(tests.round IS NOT NULL, AVG(LEAST(ROUND(marks.mark / tests.round) * tests.round, 6)), AVG(marks.mark)) AS mark, IF(tests.round IS NOT NULL, AVG(LEAST(ROUND(marks.mark / tests.round) * tests.round, 6)), AVG(marks.mark)) AS mark_unrounded FROM tests LEFT JOIN marks ON (marks.testID = tests.testID AND EXISTS (SELECT studentID FROM students WHERE students.studentID = marks.studentID AND students.deleteTimestamp IS NULL)) WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL GROUP BY tests.testID ORDER BY tests.isHidden, NOT tests.isFolder, tests.date, NOT tests.markCounts, tests.name");

            } else {

                $stmt = $mysqli->prepare("SELECT tests.*, AVG(marks.points) AS points FROM tests LEFT JOIN marks ON (marks.testID = tests.testID AND EXISTS (SELECT studentID FROM students WHERE students.studentID = marks.studentID AND students.deleteTimestamp IS NULL)) WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL GROUP BY tests.testID ORDER BY tests.isHidden, NOT tests.isFolder, tests.date, NOT tests.markCounts, tests.name");

            }

            $stmt->bind_param("i", $test->data["testID"]);

        } else {

            $stmt = $mysqli->prepare("SELECT * FROM tests WHERE parentID IS NULL AND semesterID = ? AND deleteTimestamp IS NULL ORDER BY isHidden, NOT isFolder, date, NOT markCounts, name");
            $stmt->bind_param("i", $test->data["semesterID"]);

        }

        $stmt->execute();

        $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $test->childrenData = $results;

        if(!$withMarks) {

            return true;

        }

        include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/calculateMarks.php");

        if($test->isRoot) {

            $stmt->prepare("SELECT studentID, mark, points FROM marks WHERE testID = ? AND EXISTS (SELECT studentID FROM students WHERE students.studentID = marks.studentID AND students.deleteTimestamp IS NULL)");

            foreach($test->childrenData as &$subTest) {

                $stmt->bind_param("i", $subTest["testID"]);
                $stmt->execute();

                $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                $subTest["students"] = $result;

            }

            calculateMark_Class($test->data, $test->childrenData, false, true, true);

            foreach($test->childrenData as &$subTest) {

                unset($subTest["students"]);

            }

        }

        if($test->isRoot || !is_null($test->data["round"])) {

            $sum = 0;
            $count = 0;

            if(!$test->isRoot && $test->data["round"] != 0) {

                foreach($test->data["students"] as &$student) {

                    if(!is_null($student["mark"])) {

                        $student["mark_unrounded"] = $student["mark"];
                        $student["mark"] = roundMark_float($student["mark"], $test->data["round"]);

                        $count++;
                        $sum += $student["mark"];

                    } else {

                        unset($student["mark"]);

                    }

                }

            } else {

                if(!$test->isRoot) {

                    foreach($test->data["students"] as &$student) {

                        if(!is_null($student["mark"])) {

                            $student["mark_unrounded"] = $student["mark"];

                            $count++;
                            $sum += $student["mark"];

                        } else {

                            unset($student["mark"]);

                        }

                    }

                } else {

                    $sumPlusPoints = 0;
                    $countPlusPoints = 0;

                    foreach($test->data["students"] as &$student) {

                        if(isset($student["mark"])) {

                            $student["mark_unrounded"] = $student["mark"];
                            $student["plusPoints"] = plusPoints($student["mark"]);

                            $count++;
                            $sum += $student["mark"];

                            $countPlusPoints++;
                            $sumPlusPoints += $student["plusPoints"];

                        }

                    }

                    if($countPlusPoints > 0) {

                        $test->data["plusPoints"] = $sumPlusPoints / $countPlusPoints;

                    }

                }

            }

            if($count > 0) {

                $test->data["mark"] = $sum / $count;
                $test->data["mark_unrounded"] = $test->data["mark"];

            }

        }

        if(!$test->isRoot && (is_null($test->data["round"]) || !is_null($test->data["formula"]))) {

            $sum = 0;
            $count = 0;

            foreach($test->data["students"] as &$student) {

                if(!is_null($student["points"])) {

                    $count++;
                    $sum += $student["points"];

                } else {

                    unset($student["points"]);

                }

            }

            if($count > 0) {

                $test->data["points"] = $sum / $count;

            }

        }

    } else {
        
        if(!$test->isRoot) {

            if(!$withMarks && $test->accessType === Element::ACCESS_STUDENT) {

                $stmt = $mysqli->prepare("SELECT * FROM tests WHERE parentID = ? AND isHidden = 0 AND deleteTimestamp IS NULL ORDER BY isHidden, NOT isFolder, date, NOT markCounts, name");
                $stmt->bind_param("i", $test->data["testID"]);

            } elseif(!$withMarks) {
                
                $stmt = $mysqli->prepare("SELECT * FROM tests WHERE parentID = ? AND deleteTimestamp IS NULL ORDER BY isHidden, NOT isFolder, date, NOT markCounts, name");
                $stmt->bind_param("i", $test->data["testID"]);

            } elseif($test->accessType === Element::ACCESS_STUDENT) {

                $stmt = $mysqli->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON (tests.testID = marks.testID AND marks.studentID = ?) WHERE tests.parentID = ? AND tests.isHidden = 0 AND tests.deleteTimestamp IS NULL ORDER BY tests.isHidden, NOT tests.isFolder, tests.date, NOT tests.markCounts, tests.name");
                $stmt->bind_param("ii", $test->studentID, $test->data["testID"]);

            } else {
                
                $stmt = $mysqli->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON tests.testID = marks.testID WHERE tests.parentID = ? AND tests.deleteTimestamp IS NULL ORDER BY tests.isHidden, NOT tests.isFolder, tests.date, NOT tests.markCounts, tests.name");
                $stmt->bind_param("i", $test->data["testID"]);

            }

        } else {

            if(!$withMarks && $test->accessType === Element::ACCESS_STUDENT) {

                $stmt = $mysqli->prepare("SELECT * FROM tests WHERE parentID IS NULL AND semesterID = ? AND isHidden = 0 AND deleteTimestamp IS NULL ORDER BY isHidden, NOT isFolder, date, NOT markCounts, name");
                $stmt->bind_param("i", $test->data["semesterID"]);
            
            } elseif(!$withMarks) {

                $stmt = $mysqli->prepare("SELECT * FROM tests WHERE parentID IS NULL AND semesterID = ? AND deleteTimestamp IS NULL ORDER BY isHidden, NOT isFolder, date, NOT markCounts, name");
                $stmt->bind_param("i", $test->data["semesterID"]);

            } elseif($test->accessType === Element::ACCESS_STUDENT) {

                $stmt = $mysqli->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON (tests.testID = marks.testID AND marks.studentID = ?) WHERE tests.parentID IS NULL AND tests.semesterID = ? AND tests.isHidden = 0 AND tests.deleteTimestamp IS NULL ORDER BY tests.isHidden, NOT tests.isFolder, tests.date, NOT tests.markCounts, tests.name");
                $stmt->bind_param("ii", $test->studentID, $test->data["semesterID"]);

            } else {

                $stmt = $mysqli->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON tests.testID = marks.testID WHERE tests.parentID IS NULL AND tests.semesterID = ? AND tests.deleteTimestamp IS NULL ORDER BY tests.isHidden, NOT tests.isFolder, tests.date, NOT tests.markCounts, tests.name");
                $stmt->bind_param("i", $test->data["semesterID"]);

            }

        }

        $stmt->execute();

        $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $test->childrenData = $results;

        if(!$withMarks) {

            return true;

        }

        include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/calculateMarks.php");

        if(!isset($test->data["mark"]) && !isset($test->data["points"])) {

            calculateMark($test->data, $test->childrenData, !$test->isRoot);

        }

        $plusPoints = 0;

        foreach($test->childrenData as &$subTest) {

            if(!is_null($subTest["round"])) {

                $subTest["mark_unrounded"] = $subTest["mark"];

                if($subTest["round"] != 0) {

                    $subTest["mark"] = roundMark_float($subTest["mark"], $subTest["round"]);

                }

                $plusPoints += plusPoints($subTest["mark"]);

            } else {

                unset($subTest["mark"]);

            }

            if(!is_null($subTest["round"]) && is_null($subTest["formula"])) {

                unset($subTest["points"]);

            }

        }

        if(isset($test->data["mark"])) {

            $test->data["mark_unrounded"] = $test->data["mark"];

            if(!$test->isRoot && $test->data["round"] != 0) {

                $test->data["mark"] = roundMark_float($test->data["mark"], $test->data["round"]);

            }

        }

        if($test->isRoot && isset($test->data["mark"])) {

            $test->data["plusPoints"] = $plusPoints;   

        }

    }

    return true;

}

if(!isset($isNotMain)) {

    include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

    session_start();

    if(!isset($_SESSION["userid"])) {

        throwError(ERROR_NOT_LOGGED_IN);

    }

    session_write_close();

    $data = getData();

    if(isset($data["testID"]) && is_numeric($data["testID"])) {

        $testID = (int)$data["testID"];

    }

    if(!isset($testID)) {

        if(isset($data["semesterID"]) && is_numeric($data["semesterID"])) {

            $semesterID = (int)$data["semesterID"];

        }

    }

    if(!isset($testID) && !isset($semesterID)) {

        throwError(ERROR_BAD_INPUT);

    }

    if(!connectToDatabase()) {

        throwError(ERROR_UNKNOWN);
    
    }

    if(isset($testID)) {

        $test = getTest($testID, $_SESSION["userid"], $_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin", isset($data["isPublicTemplate"]));

    } else {

        $test = getSemester($semesterID, $_SESSION["userid"], $_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin", isset($data["isPublicTemplate"]));
        
        if(!is_null($test->data["referenceID"])) {

            throwError(ERROR_BAD_INPUT);

        }
        
        $test->type = Element::TYPE_TEST;
        $test->isRoot = true;

    }

    if($test->error != ERROR_NONE) {

        throwError($test->error);

    }

    if(!getTests($test, isset($data["withMarks"]))) {

        throwError(ERROR_BAD_INPUT);

    }

    $test->sendResponse();

}

?>