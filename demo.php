<?php

/*

Demo-Seite zum Einloggen in den Demo-Account. Weiterleitung auf app.php

*/

define("USERID_STUDENTDEMO", 1);
define("USERID_TEACHERDEMO", 2);

if(isset($_GET["type"])) {

    $DB = json_decode(file_get_contents($_SERVER["DOCUMENT_ROOT"] . "/database.json"));

    $mysqli = new mysqli($DB->HOST, $DB->USERNAME, $DB->PASSWORD, $DB->DBNAME);
    
    if($mysqli->connect_errno) {
        
        header("Location: /error.php?error=0");
        exit;

    }

    $stmt = $mysqli->prepare("SELECT userID, userName, status, isTeacher, password, isVerified, lowerDisplayBound, upperDisplayBound, deleteTimestamp FROM users WHERE userID = ?");
    
    $userID = $_GET["type"] === "teacher" ? USERID_TEACHERDEMO : USERID_STUDENTDEMO;

    $stmt->bind_param("i", $userID);
    $stmt->execute();

    $result = $stmt->get_result()->fetch_assoc();

    session_start();
    
    $_SESSION["userid"] = $result["userID"];
    $_SESSION["username"] = $result["userName"];
    $_SESSION["status"] = $result["status"];
    $_SESSION["isTeacher"] = (bool)$result["isTeacher"];
    $_SESSION["lowerDisplayBound"] = $result["lowerDisplayBound"];
    $_SESSION["upperDisplayBound"] = $result["upperDisplayBound"];

    $stmt->prepare("UPDATE users SET lastUsed = NOW() WHERE userID = ?");
    $stmt->bind_param("i", $_SESSION["userid"]);
    $stmt->execute();
    $stmt->close();

    header("Location: /app");

}

?>

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="robots" content="nofollow" />
        <meta name="description" content="
        Probieren Sie Notentabelle mit dem Demo-Modus aus.
        " />

        <title>Demo - Notentabelle</title>

        <link rel="stylesheet" href="/css/basicStylesheet.css">
        <link rel="stylesheet" href="/css/stylesheet.css">
        
        <!-- Icons -->
        <link rel="icon" href="/img/logo/logo.ico" sizes="48x48">
        <link rel="icon" type="image/png" href="/img/logo/logo_192x192.png" sizes="192x192">
        <link rel="icon" type="image/svg+xml" href="/img/logo/logo.svg">
        <link rel="apple-touch-icon" href="/img/logo/logo_white_180x180.png">

        <noscript><meta http-equiv="refresh" content="0; /error?error=1&origin=register"></noscript>
        <script>if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) location.href = "/error?error=3";</script>

        <script>
            if("serviceWorker" in navigator && navigator.serviceWorker.controller) navigator.serviceWorker.oncontrollerchange = function() { alert("Updates wurden durchgeführt. Die Webapp wird neugeladen, damit sie richtig funktioniert."); window.location.reload(); };
        </script>

        <script>if (typeof (localStorage) !== undefined) localStorage.removeItem('path');</script>
    </head>
    
    <body>
        <?php include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/preload.php"); ?>
        
        <nav>
            <a href="/"><img id="returnButton" src="/img/icons/arrow_back.svg" alt="<" tabindex="0"></a>
            <div id="header">
                <h1>Demo</h1>
            </div>
            <img src="/img/logo/logo.svg" alt="" id="logo">
        </nav>

        <div class="container">
            <a href="/demo?type=student"><button class="button_big positive">Schüler/in-Demo</button></a>
            <a href="/demo?type=teacher"><button class="button_big positive">Lehrpersonen-Demo</button></a>
        </div>
    </body>
</html>