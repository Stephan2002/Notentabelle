<?php

/*

Laedt Informationen zu einer Klasse (z.B. Zugriffsrechte)

Input als JSON per POST:
    classID


*/

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

if(!$_SESSION["isTeacher"]) {

    throwError(ERROR_ONLY_TEACHER);

}

$data = getData();

if(!isset($data["classID"])) {
    
    throwError(ERROR_MISSING_INPUT);

}

if(!is_int($data["classID"])) {

    throwError(ERROR_BAD_INPUT);

}

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

$class = getClass($data["classID"], $_SESSION["userid"]);

if($class->error !== ERROR_NONE) {

    throwError($class->error);

}

$returnProperties = array();
$returnProperties["error"] = ERROR_NONE;

if($class->data["referenceID"] !== NULL) {

    $refClass = getClass($class->data["referenceID"], $_SESSION["userid"]);

    if($refClass->error !== ERROR_NONE) {

        $returnProperties["refError"] = $refClass->error;
    
    } else {

        $returnProperties["refClassName"] = $refClass->data["name"];

        $stmt = $mysqli->prepare("SELECT userName FROM users WHERE userID = ?");
        $stmt->bind_param("i", $refClass->data["userID"]);
        $stmt->execute();

        $returnProperties["refUserName"] = $stmt->get_result()->fetch_row()[0];

        $stmt->close();

    }

} else {

    if($class->accessType === Element::ACCESS_OWNER) {

        $stmt = $mysqli->prepare("SELECT users.userName, users.firstName, users.lastName, users.gender, users.school, permissions.writingPermission FROM permissions INNER JOIN users ON users.userID = permissions.userID WHERE permissions.classID = ?");
        $stmt->bind_param("i", $data["classID"]);
        $stmt->execute();

        $returnProperties["permissions"] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        $stmt->close();

    }

}

echo json_encode($returnProperties);
exit;

?>