<?php

/*

Laedt Informationen zu einem Fach/Ordner/Pruefung (z.B. Zugriffsrechte)

Input als JSON per POST:
    testID


*/

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

$data = getData();

if(!isset($data["testID"])) {
    
    throwError(ERROR_MISSING_INPUT);

}

if(!is_int($data["testID"])) {

    throwError(ERROR_BAD_INPUT);

}

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

$test = getTest($data["testID"], $_SESSION["userid"], $_SESSION["isTeacher"], false, true);

if($test->error !== ERROR_NONE) {

    throwError($test->error);

}

$returnProperties = array();
$returnProperties["error"] = ERROR_NONE;

if($test->data["parentID"] === NULL) {

    $stmt = $mysqli->prepare("SELECT name FROM semesters WHERE semesterID = ?");
    $stmt->bind_param("i", $test->data["semesterID"]);
    $stmt->execute();

    $returnProperties["semesterName"] = $stmt->get_result()->fetch_row()[0];

} else {

    $stmt = $mysqli->prepare("SELECT semesters.name AS semesterName, tests.name AS subjectName FROM tests INNER JOIN semesters ON semesters.semesterID = ? WHERE tests.testID = ?");
    $stmt->bind_param("ii", $test->data["semesterID"], $test->data["subjectID"]);
    $stmt->execute();

    $result = $stmt->get_result()->fetch_assoc();

    $returnProperties["semesterName"] = $result["semesterName"];
    $returnProperties["subjectName"] = $result["subjectName"];

}


if($test->data["classID"] !== NULL && $test->data["classID"] > 0) {

    $stmt->prepare("SELECT name FROM classes WHERE classID = ?");
    $stmt->bind_param("i", $test->data["classID"]);
    $stmt->execute();

    $returnProperties["className"] = $stmt->get_result()->fetch_row()[0];

    if($test->data["parentID"] === NULL) {

        $stmt->prepare("SELECT users.userName, users.firstName, users.lastName, users.gender, users.school, permissions.writingPermission FROM permissions INNER JOIN users ON users.userID = permissions.userID WHERE permissions.testID = ?");
        $stmt->bind_param("i", $data["testID"]);
        $stmt->execute();
    
        $returnProperties["permissions"] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    }

}

if($test->data["referenceState"] === "ok" || $test->data["referenceState"] === "outdated") {
    
    $stmt->prepare("SELECT users.userName, tests.name FROM tests INNER JOIN semesters ON semesters.semesterID = ? INNER JOIN users ON users.userID = semesters.userID WHERE tests.testID = ?");
    $stmt->bind_param("ii", $test->data["referenceSemesterID"], $test->data["referenceID"]);
    $stmt->execute();

    $result = $stmt->get_result()->fetch_assoc();

    $returnProperties["refUserName"] = $result["userName"];
    $returnProperties["refTestName"] = $result["name"];

} 

$stmt->close();

echo json_encode($returnProperties);
exit;

?>