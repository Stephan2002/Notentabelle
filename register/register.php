<!-- Registrierungsseite mit Formular für Registrierung. Leitet auf registerInfo weiter -->
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Notentabelle - Registrierung</title>

        <link rel="stylesheet" href="/css/basicStylesheet.css">
        <link rel="stylesheet" href="/modules/buttonSelect/buttonSelectStylesheet.css">
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

        <script language="javascript" type="text/javascript" src="/js/main.js"></script>
        <script language="javascript" type="text/javascript" src="/modules/buttonSelect/buttonSelectScript.js"></script>
        <script language="javascript" type="text/javascript" src="/js/register.js"></script>
    </head>
    
    <body>
        <?php include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/preload.php"); ?>
        
        <nav>
            <a href="<?php echo (isset($_GET["origin"]) && $_GET["origin"] === "app") ? "/app" : "/"; ?>"><img id="returnButton" src="/img/icons/arrow_back.svg" alt="<" tabindex="0"></a>
            <div id="header">
                <h1>Registrierung</h1>
            </div>
            <img src="/img/logo/logo.svg" alt="" id="logo">
        </nav>

        <div class="container">
            <?php
                if(isset($_GET["error"]) && (int)$_GET["error"] !== 0) {

                    echo "<div class='info red'>";

                    if($_GET["error"] === "4") {

                        echo "<p class='blankLine_small'>Es existiert bereits ein Konto mit dieser E-Mail-Adresse.</p>";
                        
                    } else {

                        echo "<p class='blankLine_small'>Es ist ein Fehler aufgetreten und die Registrierung konnte nicht durchgeführt werden.</p>";
                        echo "<p class='blankLine_small'>Fehlercode: " . (int)$_GET["error"] . "</p>";

                    }

                    echo "</div>";

                }

            ?>

            <form method="POST" action="/register/registerInfo" class="mediumMargin">
                <label for="userName">Benutzername*:</label>
                <input name="username" id="userName" type="text" placeholder="Benutzername">

                <input type="checkbox" id="isTeacher" name="isTeacher" style="display: none;">
                <div class="buttonSelectGroup single" id="typeSelect">
                    <button type="button" class="positive">Schüler/in</button>
                    <button type="button" class="positive unselected">Lehrperson</button>
                </div>

                <label for="gender">Geschlecht:</label>
                <select name="gender" type="text" id="gender" value="">
                    <option value="">...</option>
                    <option value="m">männlich</option>
                    <option value="f">weiblich</option>
                    <!--<option value="d">divers</option>-->
                </select>

                <label for="firstName">Vorname:</label>
                <input name="firstname" id="firstName" type="text" maxlength="100" placeholder="Vorname">

                <label for="lastName">Nachname:</label>
                <input name="lastname" id="lastName" type="text" maxlength="100" placeholder="Nachname">

                <label for="school">Schule:</label>
                <input name="school" id="school" type="text" maxlength="100" placeholder="Schule">

                <label for="">E-Mail*:</label>
                <input name="email" id="eMail" type="email" maxlength="100" placeholder="E-Mail-Adresse">
                
                <label for="password">Passwort*:</label>
                <input name="password" id="password" type="password" placeholder="Passwort">
                <input id="repeatPassword" type="password" class="smallMargin" placeholder="Passwort wiederholen">

                <label><input id="terms" type="checkbox" />Ich aktzeptiere die <a href="/law/terms?origin=register">allgemeinen Geschäftsbedingungen (AGB).</a></label>
                
                <div class="info red withMargin" id="errorContainer"></div>

                <input type="submit" id="OKButton" class="button_big positive withMargin" value="Konto erstellen">
            </form>
        </div>

        <p id="footer">
            <a href="/law/contact">Impressum</a> - 
            <a href="/law/terms">AGB</a> - 
            <a href="/law/privacy">Datenschutzerklärung</a>
        </p>
    </body>
</html>

