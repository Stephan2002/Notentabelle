<?php

/*

Laedt alle fremden Semester, auf die der Nutzer Zugriff hat

Input als JSON per POST:
    Kein Input


*/

function getForeignSemesters(Semester &$element) {

    global $mysqli;

    // Geteilte Semester
    $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE EXISTS (SELECT permissions.semesterID FROM permissions WHERE semesters.semesterID = permissions.semesterID AND permissions.userID = ?) AND semesters.deleteTimestamp IS NULL");
    $stmt->bind_param("i", $_SESSION["userid"]);
    $stmt->execute();

    $sharedResults = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach($sharedResults as &$semester) {

        $semester["category"] = Element::ACCESS_SHARED;

    }

    // Semester mit Schueler-Zugriff
    $stmt->prepare("SELECT * FROM semesters WHERE EXISTS (SELECT students.studentID FROM students WHERE students.userID = ? AND students.classID = semesters.classID AND students.deleteTimestamp IS NULL) AND semesters.deleteTimestamp IS NULL");
    $stmt->bind_param("i", $_SESSION["userid"]);
    $stmt->execute();

    $studentResults = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach($studentResults as &$semester) {

        $semester["category"] = Element::ACCESS_STUDENT;

    }
    
    // Semester mit Lehrer-Zugriff
    if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") {

        $stmt->prepare("SELECT * FROM semesters WHERE EXISTS (SELECT tests.testID FROM tests WHERE semesters.semesterID = tests.semesterID AND EXISTS (SELECT teachers.teacherID FROM teachers WHERE tests.testID = teachers.testID AND teachers.userID = ?)) AND semesters.deleteTimestamp IS NULL");
        $stmt->bind_param("i", $_SESSION["userid"]);
        $stmt->execute();

        $teacherResults = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        foreach($teacherResults as &$semester) {

            $semester["category"] = Element::ACCESS_TEACHER;

        }

        $element->childrenData = array_merge($sharedResults, $studentResults, $teacherResults);

    } else {

        $element->childrenData = array_merge($sharedResults, $studentResults);

    }

}

if(!isset($isNotMain)) {

    include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

    session_start();

    if(!isset($_SESSION["userid"])) {

        throwError(ERROR_NOTLOGGEDIN);

    }

    session_write_close();

    if(!connectToDatabase()) {

        throwError(ERROR_UNKNOWN);
    
    }

    $semester = new Element(ERROR_NONE, Element::ACCESS_OWNER, true);
    $semester->type = Element::TYPE_FOREIGNT_SEMESTERS;
    $semester->isRoot = true;

    getForeignSemesters($semester);

    $semester->sendResponse();

}

?>