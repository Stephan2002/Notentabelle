<?php

/*

Laedt eine Pruefung.

Input als JSON per POST:
    testID (OrdnerID)
    isPublicTemplate

*/


include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

$data = getData();

if(isset($data["testID"]) && is_numeric($data["testID"])) {

    $testID = (int)$data["testID"];

} else {

    throwError(ERROR_BAD_INPUT);

}

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

$test = getTest($testID, $_SESSION["userid"], $_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin", isset($data["isPublicTemplate"]));

if($test->error !== ERROR_NONE) {

    throwError($test->error);

}

if($test->data["isFolder"]) {

    throwError(ERROR_BAD_INPUT);

}

include_once($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/calculateMarks.php");

if(isset($test->data["classID"]) && $test->accessType !== Element::ACCESS_STUDENT) {

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

    $stmt->execute();

    $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $test->data["students"] = $result;

    $stmt->close();

    if(!is_null($test->data["round"])) {

        $sum = 0;
        $count = 0;

        if($test->data["round"] != 0) {

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

            foreach($test->data["students"] as &$student) {

                if(!is_null($student["mark"])) {

                    $student["mark_unrounded"] = $student["mark"];

                    $count++;
                    $sum += $student["mark"];

                } else {

                    unset($student["mark"]);

                }

            }

        }

        if($count > 0) {

            $test->data["mark"] = $sum / $count;
            $test->data["mark_unrounded"] = $test->data["mark"];

        }

    }

    if(is_null($test->data["round"]) || !is_null($test->data["formula"])) {

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

    if($test->accessType !== Element::ACCESS_STUDENT) {

        if(!is_null($test->data["formula"])) {

            $stmt = $mysqli->prepare("SELECT mark, points FROM marks WHERE testID = ?");

        } elseif(!is_null($test->data["round"])) {

            $stmt = $mysqli->prepare("SELECT mark FROM marks WHERE testID = ?");

        } else {

            $stmt = $mysqli->prepare("SELECT points FROM marks WHERE testID = ?");

        }

        $stmt->bind_param("i", $test->data["testID"]);

    } else {

        if(!is_null($test->data["formula"])) {

            $stmt = $mysqli->prepare("SELECT mark, points FROM marks WHERE testID = ? AND studentID = ?");

        } elseif(!is_null($test->data["round"])) {

            $stmt = $mysqli->prepare("SELECT mark FROM marks WHERE testID = ? AND studentID = ?");

        } else {

            $stmt = $mysqli->prepare("SELECT points FROM marks WHERE testID = ? AND studentID = ?");

        }

        $stmt->bind_param("ii", $test->data["testID"], $test->studentID);

    }
    
    $stmt->execute();

    $result = $stmt->get_result()->fetch_assoc();

    if(!is_null($result)) {

        if(!is_null($test->data["round"])) {

            $test->data["mark_unrounded"] = $result["mark"];

            if($test->data["round"] == 0) {

                $test->data["mark"] = $result["mark"];

            } else {

                $test->data["mark"] = roundMark_float($result["mark"]);

            }

        }

        if(!is_null($test->data["formula"]) || is_null($test->data["round"])) {

            $test->data["points"] = $result["points"];

        }

    }

}

$test->sendResponse();

?>