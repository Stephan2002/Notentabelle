<?php

/*

Seite, die durch Validierungs-E-Mail aufgerufen wird. Validiert den Account und informiert User darueber.

*/

/*
    Fehlercodes:
    0: Kein Fehler
    1: Fehlende oder falsch angegebene Eingaben
    2: Benutzername gibt es nicht
    3: Das Konto ist gesperrt
    4: Das Konto war bereits verifiziert
    5: Der Token stimmt nicht

*/


define("MAX_LENGTH_NAME", 64);
define("TOKEN_LENGTH", 64);

$errorCode = 0;

if(isset($_GET["username"]) && is_string($_GET["username"]) && strlen($_GET["username"]) < MAX_LENGTH_NAME) {

    $userName = $_GET["username"];

} else {
    
    $errorCode = 1;

}

if(isset($_GET["token"]) && is_string($_GET["token"]) && strlen($_GET["token"]) === TOKEN_LENGTH) {

    $verificationToken = $_GET["token"];

} else {
    
    $errorCode = 1;

}

if($errorCode === 0) {

    $DB = json_decode(file_get_contents($_SERVER["DOCUMENT_ROOT"] . "/database.json"));

    $mysqli = new mysqli($DB->HOST, $DB->USERNAME, $DB->PASSWORD, $DB->DBNAME);

    if($mysqli->connect_errno) {
        
        header("Location: /error.php?error=0");
        exit;

    }

    $stmt = $mysqli->prepare("SELECT userID, userName, status, isTeacher, isVerified, verificationToken, lowerDisplayBound, upperDisplayBound, deleteTimestamp FROM users WHERE userName = ?");
    $stmt->bind_param("s", $userName);
    $stmt->execute();

    $result = $stmt->get_result()->fetch_assoc();

    if($result === NULL) {

        $errorCode = 2; 

    }

    if($result["status"] === "blocked" || $result["deleteTimestamp"] !== NULL) {

        $errorCode = 3;
        
    } elseif($result["isVerified"]) {

        $errorCode = 4;

    } elseif($result["verificationToken"] !== $verificationToken) {

        $errorCode = 5;

    } else {

        $stmt->prepare("UPDATE users SET isVerified = 1, verificationToken = NULL WHERE userID = ?");
        $stmt->bind_param("i", $result["userID"]);
        $stmt->execute();

    }

    

    if($errorCode === 0 || $errorCode === 4) {

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

    }
    
    $stmt->close();

}

?>

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Notentabelle - Registrierung</title>

        <link rel="stylesheet" href="/css/basicStylesheet.css">
        <link rel="stylesheet" href="/css/stylesheet.css">
        
        <!-- Icons -->
        <link rel="icon" href="/img/logo/logo.ico" sizes="48x48">
        <link rel="icon" type="image/png" href="/img/logo/logo_192x192.png" sizes="192x192">
        <link rel="icon" type="image/svg+xml" href="/img/logo/logo.svg">
        <link rel="apple-touch-icon" href="/img/logo/logo_white_180x180.png">

        <script>if (typeof (localStorage) !== undefined) localStorage.removeItem('path');</script>
    </head>
    
    <body>
        <?php include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/preload.php"); ?>
        
        <nav>
            <div id="header">
                <h1>Registrierung</h1>
            </div>
            <img src="/img/logo/logo.svg" alt="" id="logo">
        </nav>

        <?php

            if($errorCode !== 0 && $errorCode !== 4) {

                $text = "<img id='error' src='/img/icons/error.svg' alt=' '>";
                $text .= "<h2>Fehler</h2>";
                $text .= "<div class='text'>";

                if($errorCode === 3) {

                    $text .= "<p>Das Konto, das verifiziert werden sollte, ist gesperrt oder gelöscht.</p>";

                } else {

                    $text .= "<p>Die URL ist fehlerhaft.</p>";
                    $text .= "<p>Stellen Sie sicher, dass die URL derjenigen im neusten E-Mail entspricht.</p>";
                    $text .= "<p class='blankLine'>Fehlercode: " . $errorCode . "</p>";

                }

                $text .= "</div>";

                echo $text;

            }
            
        elseif($errorCode === 4) { ?>

            <h2>Konto bereits freigeschalten</h2>

            <div class="text">
                <p>Das Konto ist bereits freigeschalten.</p>
                <p>Sie sind eingeloggt und können die App benutzen.</p>
            </div>

            <div class="container smallMargin">
                <a href="/app"><button class="button_big positive">Zur App</button></a>
            </div>


        <?php } else { ?>

            <h2>Registrierung abgeschlossen</h2>

            <div class="text">
                <p>Ihr Konto wurde erfolgreich freigeschalten.</p>
                <p>Somit ist die Registrierung abgeschlossen.</p>
                <p>Sie sind nun eingeloggt und können die App benutzen.</p>
            </div>

            <div class="container smallMargin">
                <a href="/app"><button class="button_big positive">Zur App</button></a>
            </div>

        <?php } ?>
    </body>
</html>