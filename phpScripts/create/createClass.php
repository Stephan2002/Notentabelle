<?php

/*

Erstellt neue Klasse

Input als JSON per POST bestehend aus Objekt (nur ein neues Element kann erstellt werden):
    Alle Daten, die es fuer die Erstellung der Klasse braucht (*: Darf NULL sein | ?: muss nicht angegeben werden):
        isHidden? (default: false)
        name
        notes?*
        referenceID?
        permissions* (falls referenceID NULL): Array aus Objekten mit:
            userName
            writingPermission

Bei Fehlern wird nichts hinzugefuegt

*/

?>