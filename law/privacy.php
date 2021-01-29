<?php

/* Datenschutzerklärung */

$loginRequired = false;
include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/login.php");

?>

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Die Datenschutzerklärung von Notentabelle" />

        <title>Datenschutzerklärung - Notentabelle</title>

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
        <a href="/<?php echo (isset($_GET["origin"]) ? ($_GET["origin"] === "terms" ? "law/terms" : ($_GET["origin"] === "about" ? "about" : "")) : ""); ?>"><img id="returnButton" src="/img/icons/arrow_back.svg" alt="<" tabindex="0"></a>
            <div id="header">
                <h1>Datenschutzerklärung</h1>
            </div>
            <script language="javascript" type="text/javascript" src="/js/menu.js"></script>
        </nav>

        <div class="text">
            <h3>Erfasste Daten und Zweck der Datenerfassung</h3>
            <p>Neben den Noten, Punkte, Namen und anderen Daten, die explizit vom Nutzer angegeben werden, werden beim Zugriff auf notentabelle.ch auch gewisse technische Daten erfasst.</p>
            <p>Dies umfasst unter anderem: Datum, Uhrzeit des Zugriffs, IP-Adresse, Browser des Benutzers bei Zugriff.</p>
            <p>Ausserdem wird, sofern die Person in ihrem Benutzerkonto eingeloggt, jeweils der letzte Zeitpunkt der Benutzung eines jeweiligen Kontos gespeichert.</p>
            <p>Diese Nutzungsdaten bilden die Basis für statistische Auswertungen, sodass Trends erkennbar sind, anhand derer unsere Angebote entsprechend verbessert werden können.</p>

            <h3>Einsehbarkeit</h3>
            <p>Alle Änderungen, welche Sie auf der Webseite vornehmen, werden gespeichert.</p>
            <p>Für Administratoren sind alle diese Änderungen nachverfolgbar und einem bestimmten Nutzer zuzuordnen.</p>
            <p>Persönliche Daten werden jedoch trotzdem streng vertraulich behandelt und nicht an Dritte weitergegeben.</p>

            <h3>Cookies</h3>
            <p>Notentabelle benötigt zum Funktionieren Session-Cookies, also Textinformationen, die von Ihrem Browser gesammelt und temporär auf Ihrem Rechner gespeichert werden, bis Sie den Browser schliessen.</p>
            <p>Ausserdem werden Cookies dafür verwendet, den Benutzer bei erneutem Besuch wiederzuerkennen, damit er sich nicht erneut einloggen muss.</p>
            <p>Auch wird der Ort, an dem Sie sich der eingeloggte Benutzer in der Applikation befindet (Fach, Prüfung, Klasse etc.) ebenfalls für den späteren Besuch im sogenannten Web Storage, der vergleichbar zum Cookie-Speicher ist, lokal auf dem Computer gespeichert.</p>

            <h3>Kontakt</h3>
            <p>Der Verantwortliche sowie dessen Kontaktdaten sind dem <a href="/law/contact?origin=privacy">Impressum</a> zu entnehmen.</p>
            <p>Für die Löschung des eigenen Benutzerkontos mit den damit verbundenen Daten kontaktieren Sie ebenfalls <a href="mailto:contact@notentabelle.ch">contact@notentabelle.ch</a>.</p>
        </div>
        
        <p id="footer">
            <a href="/law/contact">Impressum</a> - 
            <a href="/law/terms">AGB</a>
        </p>
    </body>
</html>