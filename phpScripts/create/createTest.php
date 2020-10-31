<?php

/*
Pruefung/Ordner/Fach erstellen.

Input als JSON per POST bestehend aus Objekt (nur ein neues Element kann erstellt werden): 
    parentID (OrdnerID)
    isSubject (falls das Element im Hauptordner des Semesters liegt (ein Fach ist), parentID ist dann Semester-ID)
    Alle Daten, die es fuer die Erstellung des Objekts braucht (*: Darf NULL sein | ?: muss nicht angegeben werden):
        isFolder
        isHidden? (default: false)
        markCounts? (default: true)
        name
        date*?
        formula?* (nur, falls bei uebergeordneter Ordner round gesetzt und formula nicht gesetzt)
        round?* (muss gesetzt sein, falls bei uebergeordneter Ordner round gesetzt und formula nicht gesetzt)
        weight?* (muss gesetzt sein, round gesetzt)
        maxPoints?* (muss gesetzt sein, falls formula gesetzt und ungleich manual)
        notes?*
        referenceID?* (falls isFolder false; angegeben, aber NULL: Referenz ohne ref. Element | nicht angegeben: keine Ref)
        permissions* (falls isSubject und ein Klassensemester): Array aus Objekten mit:
        mark?* (falls privates Semester & (isFolder & keine Referenz) | formula manual)
        points?* (falls privates Semester & isFolder & keine Referenz)

*/

?>