<?php

/*

Laedt Informationen zu einem Semester (z.B. Zugriffsrechte)

Input als JSON per POST:
    semesterID


*/

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

$data = getData();

if(!isset($data["semesterID"])) {
    
    throwError(ERROR_MISSING_INPUT);

}

if(!is_int($data["semesterID"])) {

    throwError(ERROR_BAD_INPUT);

}

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

$semester = getSemester($data["semesterID"], $_SESSION["userid"], $_SESSION["isTeacher"]);

if($semester->error !== ERROR_NONE) {

    throwError($semester->error);

}

$returnProperties = array();
$returnProperties["error"] = ERROR_NONE;

if($semester->data["classID"] !== NULL && $semester->data["classID"] > 0) {

    $stmt = $mysqli->prepare("SELECT name FROM classes WHERE classID = ?");
    $stmt->bind_param("i", $semester->data["classID"]);
    $stmt->execute();

    $returnProperties["className"] = $stmt->get_result()->fetch_row()[0];

    $stmt->close();

}

if($semester->data["referenceID"] !== NULL) {

    $refSemester = getSemester($semester->data["referenceID"], $_SESSION["userid"], $_SESSION["isTeacher"]);

    if($refSemester->error !== ERROR_NONE) {

        $returnProperties["refError"] = $refSemester->error;
    
    } else {

        $returnProperties["refSemesterName"] = $refSemester->data["name"];

        if($semester->data["referenceTestID"] !== NULL) {

            if($refSemester->accessType === Element::ACCESS_TEACHER || $refSemester->accessType === Element::ACCESS_STUDENT) {

                $refTest = getTest($semester->data["referenceTestID"], $_SESSION["userid"], $_SESSION["isTeacher"], false, true, true);

                if($refTest->error !== ERROR_NONE) {

                    $returnProperties["refError"] = $refTest->error;
                
                } else {

                    $returnProperties["refTestName"] = $refTest->data["name"];

                }

            } else {

                $stmt = $mysqli->prepare("SELECT name FROM tests WHERE testID = ?");
                $stmt->bind_param("i", $semester->data["referenceTestID"]);
                $stmt->execute();

                $returnProperties["refTestName"] = $stmt->get_result()->fetch_row()[0];

                $stmt->close();

            }

        }

        $stmt = $mysqli->prepare("SELECT userName FROM users WHERE userID = ?");
        $stmt->bind_param("i", $refSemester->data["userID"]);
        $stmt->execute();

        $returnProperties["refUserName"] = $stmt->get_result()->fetch_row()[0];

        $stmt->close();

    }

} else {

    if($semester->accessType === Element::ACCESS_OWNER) {

        $stmt = $mysqli->prepare("SELECT users.userName, permissions.writingPermission FROM permissions INNER JOIN users ON users.userID = permissions.userID WHERE permissions.semesterID = ?");
        $stmt->bind_param("i", $data["semesterID"]);
        $stmt->execute();

        $returnProperties["permissions"] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        $stmt->close();

    }

}

echo json_encode($returnProperties);
exit;

?>