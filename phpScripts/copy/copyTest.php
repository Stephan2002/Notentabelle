<?php

/*
Kopiert Prüfungen/Ordner/Faecher eines Semesters/Faches/Ordners in ein anderes Fach/Semester

Input als JSON per POST bestehend aus Array, jeweils mit: 
    originSemesterID oder originTestID
    targetSemesterID oder targetTestID

Funktioniert momentan nur für das Kopieren von Vorlagen in ein Semester / ein Fach

*/

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");

session_start();

if(!isset($_SESSION["userid"])) {

    throwError(ERROR_NOT_LOGGED_IN);

}

session_write_close();

if($_SESSION["status"] === "demo") throwError(ERROR_NO_WRITING_PERMISSION);

$data = getData();

if(!connectToDatabase()) {

    throwError(ERROR_UNKNOWN);

}

if(!is_array($data)) {

    throwError(ERROR_BAD_INPUT);

}

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/copyFunctions.php");

foreach($data as $key => $currentElement) {

    if(isset($currentElement["originSemesterID"])) {

        if(!is_int($currentElement["originSemesterID"])) {
            
            throwError(ERROR_BAD_INPUT, $key);

        }

        $originElement = getSemester($currentElement["originSemesterID"], $_SESSION["userid"], $_SESSION["isTeacher"]);

        if($originElement->error !== ERROR_NONE) {
            
            throwError($originElement->error, $key);

        }

        // Momentan nur bei Vorlagen moeglich
        if(!$originElement->isTemplate) {

            throwError(ERROR_UNSUITABLE_INPUT, $key);

        }

    }

    if(isset($currentElement["originTestID"])) {

        // Momentan nicht moeglich:
        throwError(ERROR_UNSUITABLE_INPUT, $key);

    }

    if(!isset($currentElement["originSemesterID"]) && !isset($currentElement["originTestID"])) {

        throwError(ERROR_MISSING_INPUT, $key);

    }

    if(isset($currentElement["targetSemesterID"])) {

        if(!is_int($currentElement["targetSemesterID"])) {
            
            throwError(ERROR_BAD_INPUT, $key);

        }

        $targetElement = getSemester($currentElement["targetSemesterID"], $_SESSION["userid"], $_SESSION["isTeacher"]);

        if($targetElement->error !== ERROR_NONE) {
            
            throwError($targetElement->error, $key);

        }

        if(!$targetElement->writingPermission) {

            throwError(ERROR_NO_WRITING_PERMISSION, $key);

        }

    }

    if(isset($currentElement["targetTestID"])) {

        if(!is_int($currentElement["targetTestID"])) {
            
            throwError(ERROR_BAD_INPUT, $key);

        }

        $targetElement = getTest($currentElement["targetTestID"], $_SESSION["userid"], $_SESSION["isTeacher"]);

        if($targetElement->error !== ERROR_NONE) {
            
            throwError($targetElement->error, $key);

        }

        if(!$targetElement->writingPermission) {

            throwError(ERROR_NO_WRITING_PERMISSION, $key);

        }

        // Kopieren nur in Faecher/Ordner mit Noten moeglich
        if($targetElement->data["round"] === NULL) {

            throwError(ERROR_UNSUITABLE_INPUT, $key);

        }

    }

    if(!isset($currentElement["targetSemesterID"]) && !isset($currentElement["targetTestID"])) {

        throwError(ERROR_MISSING_INPUT, $key);

    }

    copyContent($originElement, $targetElement, false);

}


finish();

?>