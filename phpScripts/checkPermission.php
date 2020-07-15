<?php

/*

Datei, die inkludiert wird, um die Berechtigung auf ein bestimmtes Objekt zu ueberpruefen und den entsprechenden Datenbankeintrag zu laden

*/

define("DB_HOST", "localhost");
define("DB_USERNAME", "application");
define("DB_PASSWORD", "VPpCaabN5bl76rnW");
define("DB_DBNAME", "notentabelle");

class Element {

    const OWNER = 0;
    const SHARED = 1;
    const TEACHER = 2;
    const STUDENT = 3;
    const PUBLISHED = 4;

    public $accessType; // int
    public $writingPermission; // bool
    public $data; // array

    public $otherData; // array

    function __construct(int $accessType = -1, bool $writingPermission = false, array &$data = array()) {

        $this->accessType = $accessType;
        $this->writingPermission = $writingPermission;
        $this->data = $data;

    }

}



function checkClassPermission(int $classID) {

    if($_SESSION["type"] !== "teacher" && $_SESSION["type"] !== "admin") {

        return null;

    }

    $mysqli = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DBNAME);

    if($mysqli->connect_errno) {
	
        // Fehler werfen

    }

    $stmt = $mysqli->prepare("SELECT * FROM classes WHERE classID = ? AND deleteTimestamp IS NULL");
    $stmt->bind_param("i", $classID);
    $stmt->execute();

    $data = $stmt->get_results()->fetch_assoc();

    if(is_null($data)) {

        $stmt->close();
        $mysqli->close();
        return null;

    }

    if($data["userID"] == $_SESSION["userid"]) {

        $stmt->close();
        $mysqli->close();
        return new Element(Element::OWNER, true, $data);

    } 

    $stmt->prepare("SELECT writingPermission FROM permissions WHERE classID = ? AND userID = ?");
    $stmt->bind_param("ii", $classID, $_SESSION["userid"]);
    $stmt->execute();

    $permissionData = $stmt->get_results()->fetch_assoc();

    $stmt->close();
    $mysqli->close();

    if(is_null($permissionData)) {

        return null;

    } else {

        return new Element(Element::SHARED, (bool)$permissionData["writingPermission"], $data);

    }


}

function checkSemesterPermission(int $semesterID) {

    $mysqli = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DBNAME);

    if($mysqli->connect_errno) {
	
        // Fehler werfen

    }

    $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE semesterID = ? AND deleteTimestamp IS NULL");
    $stmt->bind_param("i", $semesterID);
    $stmt->execute();

    $data = $stmt->get_results()->fetch_assoc();

    if(is_null($data)) {

        $stmt->close();
        $mysqli->close();
        return null;

    }

    if($data["isFolder"] && $data["userID"] != $_SESSION["userid"]) {

        $stmt->close();
        $mysqli->close();

        return null;

    } 

    if($data["userID"] == $_SESSION["userid"]) {

        $stmt->close();
        $mysqli->close();

        return new Element(Element::OWNER, true, $data);

    }

    $stmt->prepare("SELECT writingPermission FROM permissions WHERE semesterID = ? AND userID = ?");
    $stmt->bind_param("ii", $semesterID, $_SESSION["userid"]);
    $stmt->execute();

    $permissionData = $stmt->get_results()->fetch_assoc();
    
    if(!is_null($permissionData)) {

        $stmt->close();
        $mysqli->close();

        /*if(($_SESSION["type"] !== "teacher" && $_SESSION["type"] !== "admin") && isset($data["classID"])) {

            return false;

        }*/

        return new Element(Element::SHARED, (bool)$permissionData["writingPermission"], $data);

    }

    if(isset($data["classID"])) {

        if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") {

            $stmt->prepare("SELECT tests.*, teachers.writingPermission FROM tests INNER JOIN teachers ON tests.testID = teachers.testID WHERE tests.semesterID = ? AND teachers.userID = ? AND tests.deleteTimestamp IS NULL");
            $stmt->bind_param("ii", $semesterID, $_SESSION["userid"]);
            $stmt->execute();

            $testData = $stmt->get_results()->fetch_all(MYSQLI_ASSOC);

            if(!empty($testData)) {

                $stmt->close();
                $mysqli->close();

                $result = new Element(Element::TEACHER, false, $data);
                $result->otherData = $testData;

                return $result;

            }

        }

        $stmt->prepare("SELECT studentID FROM students WHERE userID = ? AND EXISTS (SELECT classID FROM classes WHERE classes.classID = students.classID AND EXISTS (SELECT semesterID FROM semesters WHERE semesterID = ? AND semesters.classID = classes.classID)) AND deleteTimestamp IS NULL");
        $stmt->bind_param("ii", $_SESSION["userid"], $semesterID);
        $stmt->execute();

        $studentData = $stmt->get_results()->fetch_assoc();

        if(!is_null($studentData)) {

            $stmt->close();
            $mysqli->close();

            return new Element(Element::STUDENT, false, $data);

        }

    }

    if($data["isTemplate"]) {

        $stmt->prepare("SELECT type FROM publictemplates WHERE semesterID = ?");
        $stmt->bind_param("i", $semesterID);
        $stmt->execute();

        $publicTemplateData = $stmt->get_results()->fetch_assoc();

        if(!is_null($studentData)) {

            $stmt->close();
            $mysqli->close();

            return new Element(Element::PUBLISHED, false, $data);

        }

    }

    return null;

}

function checkTestPermission(int $testID) {

    $mysqli = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DBNAME);

    if($mysqli->connect_errno) {
	
        // Fehler werfen

    }

    $stmt = $mysqli->prepare("SELECT tests.*, semesters.userID, semesters.classID, semesters.isTemplate, semesters.templateType FROM tests INNER JOIN semesters ON tests.semesterID = semesters.semesterID WHERE tests.testID = ? AND tests.deleteTimestamp IS NULL");
    $stmt->bind_param("i", $testID);
    $stmt->execute();

    $data = $stmt->get_results()->fetch_assoc();

    if(is_null($data)) {

        $stmt->close();
        $mysqli->close();
        return null;

    }

    if($data["userID"] == $_SESSION["userid"]) {

        $stmt->close();
        $mysqli->close();

        return new Element(Element::OWNER, true, $data);

    }

    $stmt->prepare("SELECT writingPermission FROM permissions WHERE semesterID = ? AND userID = ?");
    $stmt->bind_param("ii", $data["semesterID"], $_SESSION["userid"]);
    $stmt->execute();

    $permissionData = $stmt->get_results()->fetch_assoc();
    $hasSharedPermission = false;

    if(!is_null($permissionData)) {

        if($permissionData["writingPermission"] || !isset($data["classID"])) {

            $stmt->close();
            $mysqli->close();

            return new Element(Element::SHARED, (bool)$permissionData["writingPermission"], $data);

        } else {

            $hasSharedPermission = true;

        }

    }

    if(isset($data["classID"])) {

        if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") {

            $stmt->prepare("SELECT writingPermission FROM teachers WHERE userID = ? AND (testID = ? OR testID = ?) AND deleteTimestamp IS NULL");
            $stmt->bind_param("iii", $_SESSION["userid"], $data["subjectID"], $testID);
            $stmt->execute();

            $teacherData = $stmt->get_results()->fetch_assoc();

            if(!is_null($teacherData)) {

                $stmt->close();
                $mysqli->close();

                return new Element(Element::TEACHER, (bool)$teacherData["writingPermission"], $data);

            }

        }

        if($hasSharedPermission) {

            $stmt->close();
            $mysqli->close();
    
            return new Element(Element::SHARED, false, $data);
    
        }

        $stmt->prepare("SELECT studentID FROM students WHERE userID = ? AND EXISTS (SELECT classID FROM classes WHERE classes.classID = students.classID AND EXISTS (SELECT semesterID FROM semesters WHERE semesterID = ? AND semesters.classID = classes.classID)) AND deleteTimestamp IS NULL");
        $stmt->bind_param("ii", $_SESSION["userid"], $data["semesterID"]);
        $stmt->execute();

        $studentData = $stmt->get_results()->fetch_assoc();

        if(!is_null($studentData)) {

            $stmt->close();
            $mysqli->close();

            return new Element(Element::STUDENT, false, $data);

        }

    }

    if($data["isTemplate"]) {

        $stmt->prepare("SELECT type FROM publictemplates WHERE semesterID = ?");
        $stmt->bind_param("i", $data["semesterID"]);
        $stmt->execute();

        $publicTemplateData = $stmt->get_results()->fetch_assoc();

        if(!is_null($studentData)) {

            $stmt->close();
            $mysqli->close();

            return new Element(Element::PUBLISHED, false, $data);

        }

    }

    return null;

}

?>