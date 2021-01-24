<?php

/*

Account-Seite, wo alle Informationen des User, wie Benutzername und Email, angezeigt werden.
Moeglichkeit für Passwortaenderung wird hier angeboten, spaeter soll auch E-Mail-Adressen-Aenderung, Kontotypwechsel, Kontoloeschung moeglich sein

*/

$loginRequired = true;
include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/login.php");

if($_SESSION["status"] === "demo") {

    header("Location: /");
    exit;

}

$DB = json_decode(file_get_contents($_SERVER["DOCUMENT_ROOT"] . "/database.json"));

$mysqli = new mysqli($DB->HOST, $DB->USERNAME, $DB->PASSWORD, $DB->DBNAME);

if($mysqli->connect_errno) {
    
    header("Location: /error.php?error=0");
    exit;

}

$stmt = $mysqli->prepare("SELECT eMail, firstName, lastName, gender, school FROM users WHERE userID = ?");
$stmt->bind_param("s", $_SESSION["userid"]);
$stmt->execute();

$result = $stmt->get_result()->fetch_assoc();

if($result === NULL) {

    session_destroy();

    header("Location: /error?error=0");
    exit;

}

$name = $result["firstName"] !== NULL ? htmlspecialchars($result["firstName"]) : "";

if($result["lastName"] !== NULL) {

    $name .= " " . htmlspecialchars($result["lastName"]);

}

if($name === "") {

    $name = "<i>Kein Name angegeben</i>";

}

if($result["gender"] !== NULL) {

    $gender = $result["gender"];

    if($result["gender"] === "f") $gender = "w";

    $name .= " (" . $gender . ")"; 

}

if($_SESSION["isTeacher"]) {

    if($result["gender"] === "m") {

        $accountType = "Lehrer";

    } elseif($result["gender"] === "f") {

        $accountType = "Lehrerin";

    } else {

        $accountType = "Lehrperson";

    }

} else {

    if($result["gender"] === "m") {

        $accountType = "Schüler";

    } elseif($result["gender"] === "f") {

        $accountType = "Schülerin";

    } else {

        $accountType = "Schüler/in";

    }

}

$school = $result["school"] !== NULL ? htmlspecialchars($result["school"]) : "<i>Keine Schule angegeben</i>";
$eMail = htmlspecialchars($result["eMail"]);
$userName = htmlspecialchars($_SESSION["username"]);

?>

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"> 

        <title>Konto - Notentabelle</title>

        <link rel="stylesheet" href="/css/basicStylesheet.css">
        <link rel="stylesheet" href="/modules/dialog/dialogStylesheet.css">
        <link rel="stylesheet" href="/modules/loading/loadingStylesheet.css">
        <link rel="stylesheet" href="/css/stylesheet.css">
        <link rel="stylesheet" href="/css/accountStylesheet.css">

        <!-- Icons -->
        <link rel="icon" href="/img/logo/logo.ico" sizes="48x48">
        <link rel="icon" type="image/png" href="/img/logo/logo_192x192.png" sizes="192x192">
        <link rel="icon" type="image/svg+xml" href="/img/logo/logo.svg">
        <link rel="apple-touch-icon" href="/img/logo/logo_white_180x180.png">

        <noscript><meta http-equiv="refresh" content="0; /error?error=1&origin=account"></noscript>
        <script>if(navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) location.href = "/error?error=3";</script>

        <script>
            window.addEventListener("pageshow", function(event) { if(event.persisted) window.location.reload()});
            if("serviceWorker" in navigator && navigator.serviceWorker.controller) navigator.serviceWorker.oncontrollerchange = function() { alert("Updates wurden durchgeführt. Die Webapp wird neugeladen, damit sie richtig funktioniert."); window.location.reload(); };
        </script>

        <script>
            var user = {
                userName: <?php echo json_encode($_SESSION["username"]); ?>,
                status: <?php echo json_encode($_SESSION["status"]); ?>,
                isTeacher: <?php echo ($_SESSION["isTeacher"] ? "true" : "false") ?>,
                lowerDisplayBound: <?php echo $_SESSION["lowerDisplayBound"]; ?>,
                upperDisplayBound: <?php echo $_SESSION["upperDisplayBound"]; ?>,

                firstName: <?php echo json_encode($result["firstName"]); ?>,
                lastName: <?php echo json_encode($result["lastName"]); ?>,
                gender: "<?php echo $result["gender"]; ?>",
                school: <?php echo json_encode($result["school"]); ?>,
                eMail: <?php echo json_encode($result["eMail"]); ?>,
            };

            if("serviceWorker" in navigator) {
                navigator.serviceWorker.register("/serviceWorker.js");
            }
        </script>

        <script language="javascript" type="text/javascript" src="/modules/dialog/dialogScript.js"></script>
        <script language="javascript" type="text/javascript" src="/modules/dialog/alertScript.js"></script>
        <script language="javascript" type="text/javascript" src="/modules/loading/loadingScript.js"></script>
        <script language="javascript" type="text/javascript" src="/js/main.js"></script>
        <script language="javascript" type="text/javascript" src="/js/account.js"></script>
    </head>
    
    <body>
        <?php include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/preload.php"); ?>

        <nav>
            <a href="/app"><img id="returnButton" src="/img/icons/arrow_back.svg" alt="<" tabindex="0"></a>
            <div id="header">
                <h1 id="title">Konto</h1>
            </div>
            <script language="javascript" type="text/javascript" src="js/menu.js"></script>
        </nav>

        <div class="container">
            <p><i>Eingeloggt als:</i></p>
            <p id="userName"><?php echo $userName; ?></p>
            <p class="textField"><?php echo $accountType; ?></p>

            <p class="blankLine">Name:</p>
            <p class="textField" id="name"><?php echo $name; ?></p>

            <p class="blankLine">Schule:</p>
            <p class="textField" id="school"><?php echo $school; ?></p>

            <p class="blankLine">E-Mail-Adresse</p>
            <p class="textField" id="eMail"><?php echo $eMail; ?></p>

            <button class="button_big positive" id="editPasswordButton">Passwort ändern</button>
            <!--<button class="button_big positive" id="editEMailButton">E-Mail-Adresse ändern</button>
            <button class="button_big positive smallMargin" id="changeAccountTypeButton">Kontotyp ändern</button>
            <button class="button_big negative" id="deleteAccountButton">Konto löschen</button>-->
        </div>

        <div id="editPasswordDialog" class="dialog" style="display: none;">
            <div class="dialogBlocker"></div>
            <div class="dialogContent">
                <h2>Passwort ändern</h2>

                <label for="editPasswordDialog_oldPassword">Altes Passwort:</label>
                <input type="password" id="editPasswordDialog_oldPassword" placeholder="Altes Passwort" />

                <label for="editPasswordDialog_newPassword">Neues Passwort:</label>
                <input type="password" id="editPasswordDialog_newPassword" placeholder="Neues Passwort" />

                <label for="editPasswordDialog_repeatPassword">Neues Passwort wiederholen:</label>
                <input type="password" id="editPasswordDialog_repeatPassword" placeholder="Passwort wiederholen" />

                <div class="info red" id="editPasswordDialog_errorContainer"></div>

                <div class="buttonGroup">
                    <button class="button_medium negative" id="editPasswordDialog_cancelButton">Abbrechen</button>
                    <button class="button_medium positive" id="editPasswordDialog_OKButton">OK</button>
                </div>
            </div>
        </div>
        <?php include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/infoBanner.php"); ?>
    </body>
</html>