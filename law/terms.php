<?php

/* AGB */

$loginRequired = false;
include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/login.php");

?>

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>AGB - Notentabelle</title>

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
        <a href="/<?php echo (isset($_GET["origin"]) && ($_GET["origin"] === "about" || $_GET["origin"] === "register")) ? $_GET["origin"] : ""; ?>"><img id="returnButton" src="/img/icons/arrow_back.svg" alt="<" tabindex="0"></a>
            <div id="header">
                <h1>AGB</h1>
            </div>
            <script language="javascript" type="text/javascript" src="/js/menu.js"></script>
        </nav>

        <h2>Allgemeine Geschäftsbedingungen</h2>

        <div class="text">
            <p>Diese allgemeinen Geschäftsbedingungen (AGB) finden bei der durch Stephan Flury (nachfolgend &quot;Autor&quot;) auf notentabelle.ch angebotenen Dienstleistungen Anwendung.
            <p>Mit der Nutzung von Notentabelle akzeptieren Sie die nachfolgenden Bedingungen.</p>
            
            <h3>Haftungsausschluss</h3>
            <p>Der Autor übernimmt, trotz grosser Bemühungen dafür, keine Gewähr hinsichtlich der inhaltlichen Richtigkeit, Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der berechneten und angezeigten Informationen.</p>
            <p>Haftungsansprüche gegen den Autor wegen direkten oder indirekten Schäden, welche aus der Nutzung des Dienstes entstanden sind, werden ausgeschlossen, sofern diese Schäden nicht durch grobe Fährlässigkeit oder Vorsatz seitens des Autors entstanden sind.</p>
            
            <h3>Verfügbarkeit</h3>
            <p>Alle Angebote sind unverbindlich. Der Autor behält es sich vor, Teile des Angebots oder das gesamte Angebot ohne gesonderte Ankündigung zu verändern oder zu ergänzen oder zeitweise unverfügbar zu machen.</p>
            <p>Auch behält er sich vor, das Angebot endgültig einzustellen.</p>
        
            <h3>Datenschutz</h3>
            <p>Über die Erfassung und Verarbeitung von persönlichen Daten wird in der <a href="/law/privacy?origin=terms">Datenschutzerklärung</a> informiert.</p>
        </div>
        
        <p id="footer">
            <a href="/law/contact">Impressum</a> - 
            <a href="/law/privacy">Datenschutzerklärung</a>
        </p>
    </body>
</html>