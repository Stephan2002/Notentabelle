<?php

/*

Datei, die inkludiert wird, um die Noten/Punkte zu aktualisieren.

*/

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/calculateMarks.php");

function updateCurrentMark(int $testID, string $oldMark = NULL, string $oldPoints = NULL, string $newMark = NULL, string $newPoints = NULL) : bool {

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
    $studentsToChangeWithNotes = array();
    $studentsToAdd = array();
    $studentsToAddWithNotes = array();

    $hasChanged = false;

    foreach($newMarks as &$student) {

        $oldStudent = &$oldMarks[$student["studentID"]];

        $newMark = array_key_exists("mark", $student) ? $student["mark"] : $oldStudent["mark"];
        $newPoints = array_key_exists("points", $student) ? $student["points"] : $oldStudent["points"];

        $changeNotes = array_key_exists("notes", $student);
        $hasNotes = isset($oldStudent["hasNotes"]) ? (bool)$oldStudent["hasNotes"] : isset($oldStudent["notes"]);

        if(is_null($newMark) && is_null($newPoints) && ((!$hasNotes && !$changeNotes) || ($changeNotes && is_null($student["notes"])))) {

            if(!is_null($oldStudent["mark"]) || !is_null($oldStudent["points"]) || $hasNotes) {
                
                $hasChanged = true;
                $studentsToDelete[] = &$student;

            }

        } elseif($oldStudent["mark"] !== $newMark || $oldStudent["points"] !== $newPoints || ($hasNotes && $changeNotes) || ($changeNotes && !is_null($student["notes"]))) {
            
            $hasChanged = true;

            if($changeNotes) {

                if(is_null($oldStudent["mark"]) && is_null($oldStudent["points"]) && !$hasNotes) {
                    
                    $studentsToAddWithNotes[] = &$student;

                } else {
                    
                    $studentsToChangeWithNotes[] = &$student;

                }

            } else {

                if(is_null($oldStudent["mark"]) && is_null($oldStudent["points"]) && !$hasNotes) {
                    
                    $studentsToAdd[] = &$student;

                } else {
                    
                    $studentsToChange[] = &$student;

                }

            }

        }

    }

    if(!empty($studentsToDelete)) {

        $arguments = array();
        $parameterTypes = str_repeat("i", count($studentsToDelete) + 1);
        $queryFragment = str_repeat("?, ", count($studentsToDelete) - 1) . "?";

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

            $mark = array_key_exists("mark", $student) ? $student["mark"] : $oldMarks[$student["studentID"]]["mark"];
            $points = array_key_exists("points", $student) ? $student["points"] : $oldMarks[$student["studentID"]]["points"];

            array_push($arguments, $testID, $student["studentID"], $mark, $points);

        }

        $stmt = $mysqli->prepare("INSERT INTO marks (testID, studentID, mark, points) VALUES " . $queryFragment);
        $stmt->bind_param($parameterTypes, ...$arguments);
        $stmt->execute();
        $stmt->close();

    }

    if(!empty($studentsToAddWithNotes)) {

        $arguments = array();
        $parameterTypes = str_repeat("iisss", count($studentsToAddWithNotes));
        $queryFragment = str_repeat("(?, ?, ?, ?, ?), ", count($studentsToAddWithNotes) - 1) . "(?, ?, ?, ?, ?)";

        $nullVar = NULL;

        foreach($studentsToAddWithNotes as &$student) {

            $mark = array_key_exists("mark", $student) ? $student["mark"] : $oldMarks[$student["studentID"]]["mark"];
            $points = array_key_exists("points", $student) ? $student["points"] : $oldMarks[$student["studentID"]]["points"];

            array_push($arguments, $testID, $student["studentID"], $mark, $points, $student["notes"]);

        }

        $stmt = $mysqli->prepare("INSERT INTO marks (testID, studentID, mark, points, notes) VALUES " . $queryFragment);
        $stmt->bind_param($parameterTypes, ...$arguments);
        $stmt->execute();
        $stmt->close();

    }

    if(!empty($studentsToChange)) {

        $stmt = $mysqli->prepare("UPDATE marks SET mark = ?, points = ? WHERE testID = ? AND studentID = ?");

        $nullVar = NULL;
        
        foreach($studentsToChange as &$student) {

            $mark = array_key_exists("mark", $student) ? $student["mark"] : $oldMarks[$student["studentID"]]["mark"];
            $points = array_key_exists("points", $student) ? $student["points"] : $oldMarks[$student["studentID"]]["points"];

            $stmt->bind_param("ssii", $mark, $points, $testID, $student["studentID"]);
            $stmt->execute();

        }

        $stmt->close();

    }

    if(!empty($studentsToChangeWithNotes)) {

        $stmt = $mysqli->prepare("UPDATE marks SET mark = ?, points = ?, notes = ? WHERE testID = ? AND studentID = ?");

        $nullVar = NULL;

        foreach($studentsToChangeWithNotes as &$student) {

            $mark = array_key_exists("mark", $student) ? $student["mark"] : $oldMarks[$student["studentID"]]["mark"];
            $points = array_key_exists("points", $student) ? $student["points"] : $oldMarks[$student["studentID"]]["points"];

            $stmt->bind_param("sssii", $mark, $points, $student["notes"], $testID, $student["studentID"]);
            $stmt->execute();

        }

        $stmt->close();

    }

    return $hasChanged;

}




function updateMarks(Test $test, bool $updateCurrent = true, int $recursionLevel = 5, bool $keepOriginal = true, bool $forceRecalc = false) {

    global $mysqli;

    $hasChanged = true;

    if($test->isRoot) {

        return;

    }

    if(!is_null($test->data["classID"])) {

        if(!$test->withStudents) {

            $stmt = $mysqli->prepare("SELECT students.studentID, students.deleteTimestamp, students.isHidden, students.firstName, students.lastName, students.gender FROM students WHERE classID = ?");
            $stmt->bind_param("i", $test->data["classID"]);
            $stmt->execute();

            $test->data["students"] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            $test->withStudents = true;

        }

    }

    if(is_null($test->data["classID"])) {

        if(!$test->withMarks) {

            $stmt = $mysqli->prepare("SELECT mark, points FROM marks WHERE testID = ?");
            $stmt->bind_param("i", $test->data["testID"]);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if(is_null($result)) {

                $test->data["mark"] = NULL;
                $test->data["points"] = NULL;
            
            } else {

                $test->data["mark"] = $result["mark"];
                $test->data["points"] = $result["points"];

            }

            $test->withMarks = true;

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

            $students[$student["studentID"]]["hasNotes"] = 0;
            unset($students[$student["studentID"]]["notes"]);

        }

        if(!$test->withMarks) {

            $stmt = $mysqli->prepare("SELECT studentID, mark, points, (notes IS NOT NULL) AS hasNotes FROM marks WHERE testID = ?");
            $stmt->bind_param("i", $test->data["testID"]);
            $stmt->execute();

            $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            foreach($results as &$student) {

                $students[$student["studentID"]]["mark"] = $student["mark"];
                $students[$student["studentID"]]["points"] = $student["points"];
                $students[$student["studentID"]]["hasNotes"] = $student["hasNotes"];

            }

            foreach($test->data["students"] as &$student) {

                $student["mark"] = $students[$student["studentID"]]["mark"];
                $student["points"] = $students[$student["studentID"]]["points"];
                $student["hasNotes"] = isset($students[$student["studentID"]]["hasNotes"]) ? $students[$student["studentID"]]["hasNotes"] : false;

            }

            $test->withMarks = true;

        }

    }

    if(!is_null($test->data["referenceState"]) && $updateCurrent) {

        $hasChanged = false;

        if($test->data["referenceState"] === "ok" || $test->data["referenceState"] === "outdated") {
            
            if(is_null($test->data["classID"])) {

                $stmt = $mysqli->prepare("SELECT tests.*, marks.mark, marks.points FROM tests INNER JOIN semesters ON semesters.semesterID = tests.semesterID LEFT JOIN marks ON (marks.testID = tests.testID AND (semesters.classID IS NULL OR marks.studentID = (SELECT students.studentID FROM students WHERE students.classID = semesters.classID AND students.userID = ?))) WHERE tests.testID = ?");
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

            $stmt = $mysqli->prepare("SELECT tests.*, marks.mark, marks.points FROM tests LEFT JOIN marks ON marks.testID = tests.testID WHERE tests.parentID = ? AND tests.markCounts = 1 AND (tests.deleteTimestamp IS NULL OR tests.deleteTimestamp = ?)");
            $stmt->bind_param("is", $test->data["testID"], $test->data["deleteTimestamp"]);
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

            $stmt = $mysqli->prepare("SELECT * FROM tests WHERE tests.parentID = ? AND tests.markCounts = 1 AND (tests.deleteTimestamp IS NULL OR tests.deleteTimestamp = ?)");
            $stmt->bind_param("is", $test->data["testID"], $test->data["deleteTimestamp"]);
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
        
        $stmt = $mysqli->prepare("SELECT tests.testID, tests.parentID, tests.maxPoints, tests.round, tests.formula, tests.isReferenced, marks.points, marks.mark, semesters.classID, semesters.userID FROM tests INNER JOIN semesters ON (tests.semesterID = semesters.semesterID) LEFT JOIN marks ON (marks.testID = tests.testID AND semesters.classID IS NULL) WHERE tests.referenceID = ? AND (tests.referenceState = \"ok\" OR tests.referenceState = \"outdated\")");
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

                    $studentID = $stmt_studentID->get_result()->fetch_assoc()["studentID"];

                    $len = count($test->data["students"]);

                    for($i = 0; $i < $len; $i++) {

                        if($test->data["students"][$i]["studentID"] === $studentID) {

                            $studentIndex = $i;
                            break;

                        }

                    }

                } else {

                    $studentIndex = NULL;

                }
                
                calculateMark_Ref($currentRef, $test->data, $studentIndex, true);

                $newMark = isset($currentRef["mark"]) ? $currentRef["mark"] : NULL;
                $newPoints = isset($currentRef["points"]) ? $currentRef["points"] : NULL;

                if(is_null($newMark) && is_null($newPoints)) {

                    if(!is_null($oldMark) || !is_null($oldPoints)) {

                        $marksToDelete[] = array(
                            "testID" => $currentRef["testID"]
                        );

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

                    $stmt_markClass = $mysqli->prepare("SELECT studentID, points, mark, (notes IS NOT NULL) AS hasNotes FROM marks WHERE testID = ?");
        
                }

                $stmt_markClass->bind_param("i", $currentRef["testID"]);
                $stmt_markClass->execute();

                $result = $stmt_markClass->get_result()->fetch_all(MYSQLI_ASSOC);

                foreach($result as &$student) {

                    $students[$student["studentID"]]["points"] = $student["points"];
                    $students[$student["studentID"]]["mark"] = $student["mark"];
                    $students[$student["studentID"]]["hasNotes"] = $student["hasNotes"];

                }

                $currentRef["students"] = array_values($students);

                calculateMark_Class_Ref($currentRef, $test->data, true);

                foreach($currentRef["students"] as &$student) {

                    $oldMark = $students[$student["studentID"]]["mark"];
                    $oldPoints = $students[$student["studentID"]]["points"];

                    $newMark = array_key_exists("mark", $student) ? $student["mark"] : $oldMark;
                    $newPoints = array_key_exists("points", $student) ? $student["points"] : $oldPoints;

                    $hasNotes = isset($students[$student["studentID"]]["hasNotes"]) ? $students[$student["studentID"]]["hasNotes"] : isset($students[$student["studentID"]]["notes"]);
                    
                    if(is_null($newMark) && is_null($newPoints) && !$hasNotes) {

                        if(!is_null($oldMark) || !is_null($oldPoints) || $hasNotes) {
                            
                            $marksToDelete[] = array(
                                "testID" => $currentRef["testID"],
                                "studentID" => $student["studentID"]
                            );

                            $refsToUpdate[$currentRef["testID"]] = &$currentRef;

                        }

                    } elseif($oldMark !== $newMark || $oldPoints !== $newPoints) {
                        
                        $arr = array(
                            "testID" => $currentRef["testID"],
                            "studentID" => $student["studentID"],
                            "mark" => $newMark,
                            "points" => $newPoints,
                        );

                        if(is_null($oldMark) && is_null($oldPoints) && !$hasNotes) {

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
            
            $stmt->prepare("DELETE FROM marks WHERE testID = ? AND studentID <=> ?");
            
            $nullVar = NULL;
            
            foreach($marksToDelete as &$currentMark) {

                $studentID = isset($currentMark["studentID"]) ? $currentMark["studentID"] : $nullVar;

                $stmt->bind_param("ii", $currentMark["testID"], $studentID);
                $stmt->execute();

            }

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

        if($keepOriginal) {
            
            $studentsCopy = array();
            unset($student);

            foreach($test->data["students"] as $student) {

                unset($student["mark"]);
                unset($student["points"]);
                unset($student["notes"]);
                unset($student["hasNotes"]);

                $studentsCopy[] = $student;
    
            }

        } else {

            $test->withMarks = false;

            foreach($test->data["students"] as &$student) {

                unset($student["mark"]);
                unset($student["points"]);
                unset($student["notes"]);
                unset($student["hasNotes"]);
    
            }

            $studentsCopy = &$test->data["students"];

        }

    }

    if($test->data["isReferenced"] && !empty($refsToUpdate)) {

        if($recursionLevel > 0) {

            // Referenzen wiederaktivieren

            $arguments = array_keys($refsToUpdate);
            $queryFragment = str_repeat("?, ", count($refsToUpdate) - 1) . "?";
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
                        updateMarks($currentTest, true, $recursionLevel - 1, false);

                    }

                }

                if(!in_array($currentRef["parentID"], $parentIDs, true)) {

                    $parentIDs[] = $currentRef["parentID"];

                }

            }

            // Uebergeordnete Ordner der Referenzen aktualisieren

            $queryFragment = str_repeat("?, ", count($parentIDs) - 1) . "?";
            $parameterTypes = str_repeat("i", count($parentIDs));

            $stmt->prepare("SELECT tests.*, semesters.userID, semesters.classID FROM tests INNER JOIN semesters ON tests.semesterID = semesters.semesterID WHERE tests.testID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, ...$parentIDs);
            $stmt->execute();

            $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            foreach($results as $currentData) {

                $currentTest = new Test(ERROR_NONE, -1, true, $currentData);
                
                if(!is_null($currentTest->data["classID"])) {

                    $currentTest->withStudents = true;
                    $currentTest->data["students"] = &$studentsCopy;

                }

                updateMarks($currentTest, true, $recursionLevel - 1, false);

            }

        } else {

            // Referenzen als outdated markieren

            $arguments = array_keys($refsToUpdate);
            $queryFragment = str_repeat("?, ", count($refsToUpdate) - 1) . "?";
            $parameterTypes = str_repeat("i", count($refsToUpdate));

            $stmt = $mysqli->prepare("UPDATE tests SET referenceState = \"outdated\" WHERE testID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, ...$arguments);
            $stmt->execute();

        }

        $stmt->close();

    }

    if($hasChanged || $forceRecalc) {

        if(!is_null($test->data["parentID"])) {

            $stmt = $mysqli->prepare("SELECT tests.*, semesters.userID, semesters.classID FROM tests INNER JOIN semesters ON tests.semesterID = semesters.semesterID WHERE tests.testID = ?");
            $stmt->bind_param("i", $test->data["parentID"]);
            $stmt->execute();

            $result = $stmt->get_result()->fetch_assoc();
            $parentTest = new Test(ERROR_NONE, -1, true, $result);

            if(!is_null($parentTest->data["classID"])) {

                $parentTest->withStudents = true;
                $parentTest->data["students"] = &$studentsCopy;

            }
            
            updateMarks($parentTest, true, $recursionLevel, false);


        }

    }

}

?>