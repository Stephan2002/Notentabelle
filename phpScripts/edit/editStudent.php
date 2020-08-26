<?php

/*
Schueler bearbeiten.

Input als JSON per POST bestehend aus Array, jeweils mit: 
    studentID
    Alle Daten, die geaendert werden sollten (*: Darf NULL sein):
        lastName
        isHidden
        firstName*
        gender*
        userName*


*/

function editStudent(Student &$student, array &$data) : bool {
    
    global $mysqli;

    if($student->error !== ERROR_NONE) {

        return false;

    }

    $changedProperties = array();

    if(array_key_exists("lastName", $data)) {

        if(!is_string($data["lastName"]) || strlen($data["lastName"]) >= 64) {

            return false;

        }

        if($data["lastName"] !== $student->data["lastName"]) {

            $changedProperties["lastName"] = $data["lastName"];

        } 

    }

    if(array_key_exists("firstName", $data)) {

        if((!is_string($data["firstName"]) && !is_null($data["firstName"])) || strlen($data["firstName"] >= 64)) {

            return false;

        }

        if($data["firstName"] === "") {

            $data["firstName"] = NULL;

        }

        if($data["firstName"] != $student->data["firstName"]) {

            $changedProperties["firstName"] = $data["firstName"];

        }

    }

    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return false;

        }
        
        if($data["isHidden"] != $student->data["isHidden"]) {
            
            $changedProperties["isHidden"] = (int)$data["isHidden"];

        }

    }

    if(array_key_exists("gender", $data)) {
        
        if(!is_null($data["gender"]) && $data["gender"] !== "m" && $data["gender"] !== "f" && $data["gender"] !== "d") {

            return false;

        }
        
        if($data["gender"] != $student->data["gender"]) {
            
            $changedProperties["gender"] = $data["gender"];

        }

    }

    if(array_key_exists("userName", $data)) {

        if(is_string($data["userName"])) {

            if($data["userName"] !== $student->data["userName"]) {
                
                $stmt = $mysqli->prepare("SELECT userID FROM users WHERE userName = ? AND userID NOT IN (SELECT userID FROM students WHERE students.classID = ? AND students.userID = users.userID) AND deleteTimestamp IS NULL");
                $stmt->bind_param("si", $data["userName"], $student->data["classID"]);
                $stmt->execute();

                $result = $stmt->get_result()->fetch_assoc();
                $stmt->close();
                
                if(is_null($result)) {

                    return false;

                }
                
                if($result["userID"] === $student->data["classUserID"]) {

                    return false;

                }
                
                $changedProperties["userID"] = $result["userID"];

            }

        } elseif(is_null($data["userName"])) {

            if(!is_null($student->data["userID"])) {

                $changedProperties["userID"] = NULL;

            }

        }

    }
    
    if(count($changedProperties) > 0) {

        $queryString = "UPDATE students SET ";
        $typeString = "";

        foreach($changedProperties as $key => &$value) {

            $queryString .= $key . " = ?, ";
            
            if(is_int($value)) {

                $typeString .= "i";

            } else {

                $typeString .= "s";

            }

        }

        $queryString = substr($queryString, 0, -2);
        $queryString .= " WHERE studentID = ?";
        $typeString .= "i";

        $changedProperties[] = $student->data["studentID"];

        $stmt = $mysqli->prepare($queryString);

        $stmt->bind_param($typeString, ...array_values($changedProperties));
        $stmt->execute();
        $stmt->close();

    }

    return true;

}

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

if($_SESSION["type"] !== "teacher" && $_SESSION["type"] !== "admin") {

    throwError(ERROR_ONLY_TEACHER);

}

$data = getData();

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

if(!is_array($data)) {

    throwError(ERROR_BAD_INPUT);

}

foreach($data as $key => &$currentStudentData) {

    if(!isset($currentStudentData["studentID"]) || !is_numeric($currentStudentData["studentID"])) {

        throwError(ERROR_BAD_INPUT, $key);    
    
    }

    $student = getStudent((int)$currentStudentData["studentID"], $_SESSION["userid"]);

    if($student->error !== ERROR_NONE) {
        
        throwError(ERROR_FORBIDDEN, $key);

    }

    if(!$student->writingPermission) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    if(!editStudent($student, $currentStudentData)) {

        throwError(ERROR_BAD_INPUT, $key);

    }

}

finish();

?>