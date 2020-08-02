<?php

/*

Datei, die inkludiert wird, um die Berechtigung auf ein bestimmtes Objekt zu ueberpruefen und den entsprechenden Datenbankeintrag zu laden

*/


define("DB_HOST", "localhost");
define("DB_USERNAME", "application");
define("DB_PASSWORD", "VPpCaabN5bl76rnW");
define("DB_DBNAME", "notentabelle");

define("ERROR_NONE",        0);     // kein Fehler
define("ERROR_NOTLOGGEDIN", 1);     // Nutzer ist nicht eingeloggt
define("ERROR_BADINPUT",    2);     // Schlechter oder fehlender User-Input
define("ERROR_FORBIDDEN",   3);     // Element existiert nicht oder Nutzer hat kein Zugriffsrecht
define("ERROR_ONLYTEACHER", 4);     // Aktion nur fuer Lehrpersonen verfuegbar
define("ERROR_UNKNOWN",     10);    // Unbekannter / anderer Fehler

function throwError(int $errorCode) {

    echo "{\"error\":" . $errorCode . "}";
    exit;

}

function getData() {

    $data = json_decode(file_get_contents("php://input"), true);

    if(json_last_error()) {

        throwError(ERROR_BADINPUT);

    }

    return $data;

}

class Element {

    const TYPE_SEMESTER = 0;
    const TYPE_TEST = 1;
    const TYPE_CLASS = 2;
    const TYPE_STUDENT = 3;
    const TYPE_FOREIGN_SEMESTERS = 4;
    const TYPE_FOREIGN_CLASSES = 5;
    const TYPE_PUBLIC_TEMPLATES = 6;

    const ACCESS_UNDEFINED = -1;
    const ACCESS_OWNER = 0;
    const ACCESS_SHARED = 1;
    const ACCESS_TEACHER = 2;
    const ACCESS_STUDENT = 3;
    const ACCESS_PUBLIC = 4;

    public $error;
    public $type;
    public $accessType; // int
    public $writingPermission; // bool
    public $data; // array

    public $childrenData; // array

    function __construct(int $error = 0, int $accessType = -1, bool $writingPermission = false, array &$data = null) {

        $this->error = $error;
        $this->accessType = $accessType;
        $this->writingPermission = $writingPermission;
        $this->data = $data;

    }

    function sendResponse() {

        if($this->error !== ERROR_NONE) {

            echo "{\"error\":" . $this->error . "}";
            exit;

        }

        if(is_null($this->data)) {

            unset($this->data);        

        } else {

            unset($this->data["userID"]);

        }

        if(is_null($this->childrenData)) {

            unset($this->childrenData);        

        } else {

            foreach($this->childrenData as &$childData) {

                unset($childData["userID"]);

            }

        }

        echo json_encode($this);

        exit;

    }

}

class Semester extends Element {

    function __construct(int $error = 0, int $accessType = -1, bool $writingPermission = false, array &$data = null) {

        parent::__construct($error, $accessType, $writingPermission, $data);
        $this->type = self::TYPE_SEMESTER;

    }

}

class Test extends Element {

    function __construct(int $error = 0, int $accessType = -1, bool $writingPermission = false, array &$data = null) {

        parent::__construct($error, $accessType, $writingPermission, $data);
        $this->type = self::TYPE_TEST;

    }

}

class StudentClass extends Element {

    function __construct(int $error = 0, int $accessType = -1, bool $writingPermission = false, array &$data = null) {

        parent::__construct($error, $accessType, $writingPermission, $data);
        $this->type = self::TYPE_CLASS;

    }

}

class Student extends Element {

    function __construct(int $error = 0, int $accessType = -1, bool $writingPermission = false, array &$data = null) {

        parent::__construct($error, $accessType, $writingPermission, $data);
        $this->type = self::TYPE_STUDENT;

    }

}


function connectToDatabase() : bool {

    global $mysqli;
    
    $mysqli = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DBNAME);

    if($mysqli->connect_errno) {
	
        return false;

    } else {

        return true;

    }

}



function getSemester(int $semesterID, bool $checkOnlyForTemplate = false) : Semester {

    global $mysqli;

    $stmt = $mysqli->prepare("SELECT * FROM semesters WHERE semesterID = ? AND deleteTimestamp IS NULL");
    $stmt->bind_param("i", $semesterID);
    $stmt->execute();

    $data = $stmt->get_result()->fetch_assoc();

    if(is_null($data)) {

        $stmt->close();
        return new Semester(ERROR_FORBIDDEN);

    }

    if($data["isFolder"] && $data["userID"] != $_SESSION["userid"]) {

        $stmt->close();
        return new Semester(ERROR_FORBIDDEN);

    } 

    if($data["userID"] == $_SESSION["userid"]) {

        $stmt->close();
        return new Semester(0, Element::ACCESS_OWNER, true, $data);

    }

    if(!$checkOnlyForTemplate) {

        $stmt->prepare("SELECT writingPermission FROM permissions WHERE semesterID = ? AND userID = ?");
        $stmt->bind_param("ii", $semesterID, $_SESSION["userid"]);
        $stmt->execute();

        $permissionData = $stmt->get_result()->fetch_assoc();
        
        if(!is_null($permissionData)) {

            $stmt->close();
            return new Semester(0, Element::ACCESS_SHARED, (bool)$permissionData["writingPermission"], $data);

        }

        if(isset($data["classID"])) {

            if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") {

                $stmt->prepare("SELECT tests.* FROM tests INNER JOIN teachers ON tests.testID = teachers.testID WHERE tests.semesterID = ? AND teachers.userID = ? AND tests.deleteTimestamp IS NULL");
                $stmt->bind_param("ii", $semesterID, $_SESSION["userid"]);
                $stmt->execute();

                $testData = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

                if(!empty($testData)) {

                    $stmt->close();
                    
                    $result = new Semester(0, Element::ACCESS_TEACHER, false, $data);
                    $result->childrenData = $testData;

                    return $result;

                }

            }

            $stmt->prepare("SELECT studentID FROM students WHERE userID = ? AND EXISTS (SELECT classID FROM classes WHERE classes.classID = students.classID AND EXISTS (SELECT semesterID FROM semesters WHERE semesterID = ? AND semesters.classID = classes.classID)) AND deleteTimestamp IS NULL");
            $stmt->bind_param("ii", $_SESSION["userid"], $semesterID);
            $stmt->execute();

            $studentData = $stmt->get_result()->fetch_assoc();

            if(!is_null($studentData)) {

                $stmt->close();

                $semester = new Semester(0, Element::ACCESS_STUDENT, false, $data);
                $semester->data["studentID"] = $studentData["studentID"];

                return $semester;

            }

        }

    }

    if($data["isTemplate"]) {

        $stmt->prepare("SELECT type FROM publictemplates WHERE semesterID = ?");
        $stmt->bind_param("i", $semesterID);
        $stmt->execute();

        $publicTemplateData = $stmt->get_result()->fetch_assoc();

        if(!is_null($studentData)) {

            $stmt->close();
            return new Semester(0, Element::ACCESS_PUBLIC, false, $data);

        }

    }

    return new Semester(ERROR_FORBIDDEN);

}

function getTest(int $testID, bool $checkOnlyForTemplate = false, bool $irrelevantWritingPermission = false) : Test {

    global $mysqli;

    $stmt = $mysqli->prepare("SELECT tests.*, semesters.userID, semesters.classID, semesters.isTemplate, semesters.templateType FROM tests INNER JOIN semesters ON tests.semesterID = semesters.semesterID WHERE tests.testID = ? AND tests.deleteTimestamp IS NULL");
    $stmt->bind_param("i", $testID);
    $stmt->execute();

    $data = $stmt->get_result()->fetch_assoc();

    if(is_null($data)) {

        $stmt->close();
        return new Test(ERROR_FORBIDDEN);

    }

    if($data["userID"] == $_SESSION["userid"]) {

        $stmt->close();
        return new Test(0, Element::ACCESS_OWNER, true, $data);

    }

    if(!$checkOnlyForTemplate) {

        $stmt->prepare("SELECT writingPermission FROM permissions WHERE semesterID = ? AND userID = ?");
        $stmt->bind_param("ii", $data["semesterID"], $_SESSION["userid"]);
        $stmt->execute();

        $permissionData = $stmt->get_result()->fetch_assoc();
        $hasSharedPermission = false;

        if(!is_null($permissionData)) {

            if($permissionData["writingPermission"] || !isset($data["classID"]) || $irrelevantWritingPermission) {

                $stmt->close();
                return new Test(0, Element::ACCESS_SHARED, (bool)$permissionData["writingPermission"], $data);

            } else {

                $hasSharedPermission = true;

            }

        }

        if(isset($data["classID"])) {

            if($_SESSION["type"] === "teacher" || $_SESSION["type"] === "admin") {

                $stmt->prepare("SELECT writingPermission FROM teachers WHERE userID = ? AND (testID = ? OR testID = ?) AND deleteTimestamp IS NULL");
                $stmt->bind_param("iii", $_SESSION["userid"], $data["subjectID"], $testID);
                $stmt->execute();

                $teacherData = $stmt->get_result()->fetch_assoc();

                if(!is_null($teacherData)) {

                    $stmt->close();
                    return new Test(0, Element::ACCESS_TEACHER, (bool)$teacherData["writingPermission"], $data);

                }

            }

            if($hasSharedPermission) {

                $stmt->close();
                return new Test(0, Element::ACCESS_SHARED, false, $data);
        
            }

            $stmt->prepare("SELECT studentID FROM students WHERE userID = ? AND EXISTS (SELECT classID FROM classes WHERE classes.classID = students.classID AND EXISTS (SELECT semesterID FROM semesters WHERE semesterID = ? AND semesters.classID = classes.classID)) AND deleteTimestamp IS NULL");
            $stmt->bind_param("ii", $_SESSION["userid"], $data["semesterID"]);
            $stmt->execute();

            $studentData = $stmt->get_result()->fetch_assoc();

            if(!is_null($studentData)) {

                $stmt->close();

                $test = new Test(0, Element::ACCESS_STUDENT, false, $data);
                $test->studentID = $studentData["studentID"];

                return $test;

            }

        }

    }

    if($data["isTemplate"]) {

        $stmt->prepare("SELECT type FROM publictemplates WHERE semesterID = ?");
        $stmt->bind_param("i", $data["semesterID"]);
        $stmt->execute();

        $publicTemplateData = $stmt->get_result()->fetch_assoc();

        if(!is_null($studentData)) {

            $stmt->close();
            return new Test(0, Element::ACCESS_PUBLIC, false, $data);

        }

    }

    return new Test(ERROR_FORBIDDEN);

}

function getClass(int $classID) : StudentClass {

    if($_SESSION["type"] !== "teacher" && $_SESSION["type"] !== "admin") {

        return new StudentClass(ERROR_ONLYTEACHER);

    }

    global $mysqli;

    $stmt = $mysqli->prepare("SELECT * FROM classes WHERE classID = ? AND deleteTimestamp IS NULL");
    $stmt->bind_param("i", $classID);
    $stmt->execute();

    $data = $stmt->get_result()->fetch_assoc();

    if(is_null($data)) {

        $stmt->close();
        
        return new StudentClass(ERROR_FORBIDDEN);

    }

    if($data["userID"] == $_SESSION["userid"]) {

        $stmt->close();
        
        return new StudentClass(0, Element::ACCESS_OWNER, true, $data);

    } 

    $stmt->prepare("SELECT writingPermission FROM permissions WHERE classID = ? AND userID = ?");
    $stmt->bind_param("ii", $classID, $_SESSION["userid"]);
    $stmt->execute();

    $permissionData = $stmt->get_result()->fetch_assoc();

    $stmt->close();
    

    if(is_null($permissionData)) {

        return new StudentClass(ERROR_FORBIDDEN);

    } else {

        return new StudentClass(0, Element::ACCESS_SHARED, (bool)$permissionData["writingPermission"], $data);

    }


}


function getStudent(int $studentID) : Student {

    if($_SESSION["type"] !== "teacher" && $_SESSION["type"] !== "admin") {

        return new Student(ERROR_ONLYTEACHER);

    }

    global $mysqli;

    $stmt = $mysqli->prepare("SELECT students.*, classes.userID FROM students INNER JOIN classes ON classes.classID = students.classID WHERE students.studentID = ? AND students.deleteTimestamp IS NULL");
    $stmt->bind_param("i", $studentID);
    $stmt->execute();

    $data = $stmt->get_result()->fetch_assoc();

    if(is_null($data)) {

        $stmt->close();
        return new Student(ERROR_FORBIDDEN);

    }

    if($data["userID"] == $_SESSION["userid"]) {

        $stmt->close();
        return new Student(0, Element::ACCESS_OWNER, true, $data);

    }

    $stmt->prepare("SELECT writingPermission FROM permissions WHERE classID = ? AND userID = ?");
    $stmt->bind_param("ii", $data["classID"], $_SESSION["userid"]);
    $stmt->execute();

    $permissionData = $stmt->get_result()->fetch_assoc();

    if(!is_null($permissionData)) {

        $stmt->close();
        return new Student(0, Element::ACCESS_SHARED, (bool)$permissionData["writingPermission"], $data);

    }

    return new Student(ERROR_FORBIDDEN);

    

}

?>