<?php

/* Ueber Notentabelle. Enthaelt einige Informationen ueber das Projekt */

$loginRequired = false;
include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/login.php");

?>

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Über Notentabelle</title>

        <link rel="stylesheet" href="/css/basicStylesheet.css">
        <link rel="stylesheet" href="/css/stylesheet.css">
        
        <!-- Icons -->
        <link rel="icon" href="/img/logo/logo.ico" sizes="48x48">
        <link rel="icon" type="image/png" href="/img/logo/logo_192x192.png" sizes="192x192">
        <link rel="icon" type="image/svg+xml" href="/img/logo/logo.svg">
        <link rel="apple-touch-icon" href="/img/logo/logo_white_180x180.png">

        <script>
            if("serviceWorker" in navigator && navigator.serviceWorker.controller) navigator.serviceWorker.oncontrollerchange = function() { alert("Updates wurden durchgeführt. Die Webapp wird neugeladen, damit sie richtig funktioniert."); window.location.reload(); };
        </script>

        <?php if(isset($_COOKIE["PHPSESSID"])) { ?>

        <script>
            var user = {
                userName: <?php echo json_encode($_SESSION["username"]); ?>,
                isTeacher: <?php echo ($_SESSION["isTeacher"] ? "true" : "false") ?>,
                lowerDisplayBound: <?php echo $_SESSION["lowerDisplayBound"]; ?>,
                upperDisplayBound: <?php echo $_SESSION["upperDisplayBound"]; ?>
            };
        </script>

        <?php } ?>
    </head>
    
    <body>
        <?php include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/preload.php"); ?>

        <nav>
        <a href="<?php echo (isset($_GET["origin"]) && ($_GET["origin"] === "app" || $_GET["origin"] === "account")) ? ("/" . $_GET["origin"]) : "/"; ?>"><img id="returnButton" src="/img/icons/arrow_back.svg" alt="<" tabindex="0"></a>
            <div id="header">
                <h1>Über Notentabelle</h1>
            </div>
            <script language="javascript" type="text/javascript" src="/js/menu.js"></script>
        </nav>
        
        <img src="img/logo/startlogo_big.svg" id="startlogo_big">
        <img src="img/logo/startlogo_small.svg" id="startlogo_small">

        <div class="text">
            <p>Mit Notentabelle verlieren Sie nie mehr den Überblick über Ihre Noten oder die Ihrer Lernenden.</p>
            <p>Geben Sie Ihre Note ein, so wird sofort der Schnitt berechnet.</p>
            <p>Die Noten können dabei in beliebig viele Unterordner gegliedert werden.</p>
            <p class="blankLine">Geeignet für Lernende, die Übersicht über ihre Noten behalten wollen, oder für Lehrpersonen, </p>
            <p>die dadurch die Noten der Lernenden einfach eintragen und berechnen lassen können!</p>
        </div>

        <div class="text">
            <p class="blankLine">Diese Applikation ist im Rahmen der Maturitätsarbeit von Stephan Flury in 2020/21 entstanden.</p>
        </div>
    </body>
</html>