<?php

$isNotMain = true;

include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/element.php");
include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/calculateMarks.php");
include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/get/getStudents.php");

connectToDatabase();

$test = getTest(15, 5, true);
$class = getClass(1, 5, true);
getStudents($class);

$test->data["students"] = $class->childrenData;
//getTests($test, true);

updateMarks($test, true);

?>