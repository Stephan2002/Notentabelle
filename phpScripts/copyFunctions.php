<?php

/*

Datei, die eingebunden wird, wenn Elemente kopiert werden

*/

function copyContent(Element $originElement, Element $targetElement) {

    global $mysqli;
    global $stmt_copy;
    global $stmt_newID;
    global $stmt_subElements;

    if($originElement->type === Element::TYPE_SEMESTER) {

        $stmt = $mysqli->prepare("SELECT testID, isFolder FROM tests WHERE parentID IS NULL AND semesterID = ? AND deleteTimestamp IS NULL");
        $stmt->bind_param("i", $originElement->data["semesterID"]);
        $stmt->execute();

        $elementsToCopy = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        $stmt->close();

        if(!empty($elementsToCopy)) {

            $stmt_copy = $mysqli->prepare("INSERT INTO tests (semesterID, parentID, subjectID, isFolder, isHidden, name, date, weight, maxPoints, formula, markCounts, round, notes, referenceID, referenceState) SELECT ?, ?, ?, isFolder, isHidden, name, date, weight, maxPoints, formula, markCounts, round, notes, referenceID, referenceState FROM tests WHERE testID = ?");
            $stmt_newID = $mysqli->prepare("SELECT LAST_INSERT_ID()");
            $stmt_subElements = $mysqli->prepare("SELECT testID, isFolder FROM tests WHERE parentID = ? AND deleteTimestamp IS NULL");

            if(
                ($targetElement->type === Element::TYPE_SEMESTER && !$targetElement->isRoot) ||
                ($targetElement->type === Element::TYPE_TEST     &&  $targetElement->isRoot)
            ) {

                copyElements($elementsToCopy, $targetElement->data["semesterID"]);

            } else {

                copyElements($elementsToCopy, $targetElement->data["semesterID"], $targetElement->data["testID"], $targetElement->data["testID"]);

            }

            $stmt_copy->close();
            $stmt_subElements->close();

        }

    }

}

function copyElements(array $elementsToCopy, int $semesterID, int $subjectID = NULL, int $parentID = NULL) {

    global $stmt_copy;
    global $stmt_newID;
    global $stmt_subElements;

    foreach($elementsToCopy as $currentElement) {

        $stmt_copy->bind_param("iiii", $semesterID, $parentID, $subjectID, $currentElement["testID"]);
        $stmt_copy->execute();

        $stmt_newID->execute();

        $newID = $stmt_newID->get_result()->fetch_row()[0];

        $stmt_subElements->bind_param("i", $currentElement["testID"]);
        $stmt_subElements->execute();

        $subElements = $stmt_subElements->get_result()->fetch_all(MYSQLI_ASSOC);

        if(!empty($subElements)) {

            copyElements($subElements, $semesterID, $subjectID === NULL ? $newID : $subjectID, $newID);

        }

    }

}


?>