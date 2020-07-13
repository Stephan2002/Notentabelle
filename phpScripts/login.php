<?php

/* Login-Skript */

$error = 1;

if(isset($_COOKIE["PHPSESSID"])) {

    session_start();

    if(isset($_SESSION["userid"])) {

        $error = 0;

    } else {

        $error = 2;

    }

}

if($error !== 0 && false) {

    include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/autoLogin.php");
	
    session_start();
    $error = login(); // Wird spaeter eingefuegt: Automatischer Login-Prozess

}

if($error !== 0 && $loginRequired) {

    header("Location: index?error=" . $error);

}

?>