<?php

/* Impressum */

$loginRequired = false;
include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/login.php");

?>

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Impressum - Notentabelle</title>

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
                status: <?php echo json_encode($_SESSION["status"]); ?>,
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
        <a href="/<?php echo (isset($_GET["origin"]) ? ($_GET["origin"] === "privacy" ? "law/privacy" : ($_GET["origin"] === "about" ? "about" : "")) : ""); ?>"><img id="returnButton" src="/img/icons/arrow_back.svg" alt="<" tabindex="0"></a>
            <div id="header">
                <h1>Impressum</h1>
            </div>
            <script language="javascript" type="text/javascript" src="/js/menu.js"></script>
        </nav>

        <div class="text">
            <h3>Name und Kontaktdaten</h3>
            <p class="blankLine">Stephan Flury</p>
            <p>Gernstrasse 9b</p>
            <p>8409 Winterthur</p>
            <p>Schweiz</p>
            <p class="blankLine">E-Mail: contact@notentabelle.ch</p>

            <p class="blankLine">Notentabelle wird privat betrieben.</p>
        </div>
        
        <p id="footer">
            <a href="/law/terms">AGB</a> - 
            <a href="/law/privacy">Datenschutzerklärung</a>
        </p>
    </body>
</html>