<?php

/*
Klasse bearbeiten.

Input als JSON per POST bestehend aus Array, jeweils mit: 
    classID
    Alle Daten, die geaendert werden sollten (*: Darf NULL sein):
        name
        isHidden
        notes*
        permissions

Bei Fehlern wird nichts geaendert, ausser bei Fehlern bei:
    permissions

*/

function editClass(StudentClass $class, array &$data) : int {
    
    global $mysqli;

    if($class->error !== ERROR_NONE) {

        return $class->error;

    }

    $changedProperties = array();

    if(array_key_exists("name", $data)) {

        if(!is_string($data["name"]) || strlen($data["name"]) >= 64) {

            return ERROR_BAD_INPUT;

        }

        if($data["name"] !== $class->data["name"]) {

            $changedProperties["name"] = $data["name"];
            $class->data["name"] = $data["name"];

        } 

    }

    if(array_key_exists("isHidden", $data)) {
        
        if(!is_bool($data["isHidden"])) {

            return ERROR_BAD_INPUT;

        }
        
        if($data["isHidden"] != $class->data["isHidden"]) {
            
            $changedProperties["isHidden"] = (int)$data["isHidden"];
            $class->data["isHidden"] = (int)$data["isHidden"];

        }

    }

    if(array_key_exists("notes", $data)) {

        if((!is_string($data["notes"]) && !is_null($data["notes"])) || strlen($data["notes"] >= 256)) {

            return ERROR_BAD_INPUT;

        }

        if($data["notes"] === "") {

            $data["notes"] = NULL;

        }

        if($data["notes"] != $class->data["notes"]) {

            $changedProperties["notes"] = $data["notes"];
            $class->data["notes"] = $data["notes"];

        }

    }

    
    if(count($changedProperties) > 0) {

        $queryString = "UPDATE classes SET ";
        $parameterTypes = "";

        foreach($changedProperties as $key => &$value) {

            $queryString .= $key . " = ?, ";
            
            if(is_int($value)) {

                $parameterTypes .= "i";

            } else {

                $parameterTypes .= "s";

            }

        }

        $queryString = substr($queryString, 0, -2);
        $queryString .= " WHERE classID = ?";
        $parameterTypes .= "i";

        $changedProperties[] = $class->data["classID"];

        $stmt = $mysqli->prepare($queryString);

        $stmt->bind_param($parameterTypes, ...array_values($changedProperties));
        $stmt->execute();
        $stmt->close();

    }

    
    if(array_key_exists("permissions", $data)) {
        
        if(!is_array($data["permissions"])) {

            return ERROR_BAD_INPUT;

        }

        $stmt = $mysqli->prepare("SELECT permissions.*, users.userName FROM permissions LEFT JOIN users ON permissions.userID = users.userID WHERE classID = ?");
        $stmt->bind_param("i", $class->data["classID"]);
        $stmt->execute();

        $result = $stmt->get_result();
        $oldPermissions = array();

        while($currentRow = $result->fetch_assoc()) {

            $oldPermissions[strtolower($currentRow["userName"])] = array(

                "writingPermission" => (bool)$currentRow["writingPermission"],
                "userID" => $currentRow["userID"]

            );

        }

        $newPermissions = array();

        $permissionsToAdd = array();
        $permissionsToChange = array();
        $permissionsToDelete = array();
        
        foreach($data["permissions"] as &$currentPermission) {

            if(!is_array($currentPermission) || !is_string($currentPermission["userName"]) || !array_key_exists("writingPermission", $currentPermission)) {

                return ERROR_BAD_INPUT;

            }

            $currentPermission["userName"] = strtolower($currentPermission["userName"]);

            if(isset($newPermissions[$currentPermission["userName"]])) {

                return ERROR_UNSUITABLE_INPUT;

            }

            $newPermissions[$currentPermission["userName"]] = true;
            
            if(array_key_exists($currentPermission["userName"], $oldPermissions)) {
                
                $currentPermission["userID"] = $oldPermissions[$currentPermission["userName"]]["userID"];

                if(is_null($currentPermission["writingPermission"])) {

                    $permissionsToDelete[] = &$currentPermission;

                } else if($currentPermission["writingPermission"] !== $oldPermissions[$currentPermission["userName"]]["writingPermission"]) {

                    $permissionsToChange[] = &$currentPermission;

                }

            } else {

                if(!is_null($currentPermission["writingPermission"])) {

                    $permissionsToAdd[] = &$currentPermission;

                }

            }

        }
        
        if(!empty($permissionsToDelete)) {

            $arguments = array();
            $parameterTypes = str_repeat("i", count($permissionsToDelete) + 1);
            $queryFragment = str_repeat("?, ", count($permissionsToDelete) - 1) . "?";

            foreach($permissionsToDelete as &$currentPermission) {

                $arguments[] = $currentPermission["userID"];

            }
            
            $stmt->prepare("DELETE FROM permissions WHERE classID = ? AND userID IN (" . $queryFragment . ")");
            $stmt->bind_param($parameterTypes, $class->data["classID"], ...$arguments);
            $stmt->execute();

        }

        if(!empty($permissionsToChange)) {

            $stmt->prepare("UPDATE permissions SET writingPermission = ? WHERE classID = ? AND userID = ?");

            foreach($permissionsToChange as &$currentPermission) {

                $stmt->bind_param("iii", $currentPermission["writingPermission"], $class->data["classID"], $currentPermission["userID"]);
                $stmt->execute();

            }

        }

        if(!empty($permissionsToAdd)) {
            
            $stmt->prepare("SELECT userID, type FROM users WHERE userName = ? AND deleteTimestamp IS NULL");

            foreach($permissionsToAdd as &$currentPermission) {
                
                $stmt->bind_param("s", $currentPermission["userName"]);
                $stmt->execute();

                $result = $stmt->get_result()->fetch_assoc();

                if(is_null($result)) {

                    return ERROR_UNSUITABLE_INPUT;

                }

                if($result["type"] !== "teacher" && $result["type"] !== "admin") {

                    return ERROR_UNSUITABLE_INPUT;

                }

                if($result["userID"] === $class->data["userID"]) {

                    return ERROR_UNSUITABLE_INPUT;

                }

                $currentPermission["userID"] = $result["userID"];

            }

            $arguments = array();
            $parameterTypes = str_repeat("i", count($permissionsToAdd) * 3);
            $queryFragment = str_repeat("(?, ?, ?), ", count($permissionsToAdd) - 1) . "(?, ?, ?)";

            foreach($permissionsToAdd as &$currentPermission) {

                array_push($arguments, $class->data["classID"], $currentPermission["userID"], $currentPermission["writingPermission"]);

            }

            $stmt->prepare("INSERT INTO permissions (classID, userID, writingPermission) VALUES (?, ?, ?)");
            $stmt->bind_param($parameterTypes, ...$arguments);
            $stmt->execute();

        }

        $stmt->close();

    }

    return ERROR_NONE;

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

foreach($data as $key => &$currentClassData) {

    if(!isset($currentClassData["classID"])) {

        throwError(ERROR_MISSING_INPUT, $key);

    }

    if(!is_int($currentClassData["classID"])) {

        throwError(ERROR_BAD_INPUT, $key);    
    
    }

    $class = getClass($currentClassData["classID"], $_SESSION["userid"]);

    if($class->error !== ERROR_NONE) {

        throwError(ERROR_FORBIDDEN, $key);

    }

    if($class->accessType !== Element::ACCESS_OWNER) {

        throwError(ERROR_NO_WRITING_PERMISSION, $key);

    }

    $errorCode = editClass($class, $currentClassData);

    if($errorCode !== ERROR_NONE) {

        throwError($errorCode, $key);

    }

}

finish();

?>