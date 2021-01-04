<?php

/*

Sendet E-Mail an E-Mail-Adresse zur Validierung. Informierung des neuen Kunden über Validierungsprozess.

*/


/*
    Fehlercodes:
    0: Kein Fehler
    1: Ungueltige Benutzereingaben
    2: Fehlende Benutzereingabe
    3: Benutzer existiert schon, Passwort aber anders
    4: E-Mail-Adresse existiert schon

*/

define("REGEX_EMAIL", "/^[a-z\d!#$%&'*+\-\/=?^_`{|}~\"(),:;<>@[\\ \]]{1,64}@[a-z\d\-_\.]{1,253}$/Di");
define("REGEX_USER_NAME", "/^[a-z\d\.\-_]{5,}$/Di");

define("MAX_LENGTH_NAME", 64);
define("TOKEN_LENGTH", 64);

define("SENDER_EMAIL", "no-reply@notentabelle.ch");

function checkForNameString($data) : bool {

    if(!is_string($data)) return false;
    if(strlen($data) > MAX_LENGTH_NAME) return false;
    return true;

}

function throwError(int $errorCode) {
    //echo $errorCode . "\n\n";
    //debug_print_backtrace();
    header("Location: /register?error=" . $errorCode);
    exit;

}

function checkEMailExistance(string $eMail) : bool {

    global $mysqli;

    $stmt = $mysqli->prepare("SELECT 1 FROM users WHERE eMail = ?");
    $stmt->bind_param("s", $eMail);
    $stmt->execute();

    $result = $stmt->get_result()->fetch_assoc();

    $stmt->close();

    return $result !== NULL;

}


if(isset($_POST["username"])) {

    $userName = $_POST["username"];

    if(!checkForNameString($userName)) throwError(1);
    if(!preg_match(REGEX_USER_NAME, $userName)) throwError(1);

} else {

    throwError(2);

}

if(isset($_POST["password"])) {

    $password = $_POST["password"];

    if(!is_string($password)) throwError(1);
    if(strlen($password) < 8) throwError(1);

} else {

    throwError(2);

}

if(isset($_POST["email"])) {

    $eMail = $_POST["email"];

    if(!is_string($eMail)) throwError(1);
    if(!preg_match(REGEX_EMAIL, $eMail)) throwError(1);

} else {

    throwError(2);

}

$DB = json_decode(file_get_contents($_SERVER["DOCUMENT_ROOT"] . "/database.json"));

$mysqli = new mysqli($DB->HOST, $DB->USERNAME, $DB->PASSWORD, $DB->DBNAME);

if($mysqli->connect_errno) {
    
    header("Location: /error.php?error=0");
    exit;

}

$stmt = $mysqli->prepare("SELECT password, eMail, isVerified FROM users WHERE userName = ?");
$stmt->bind_param("s", $_POST["username"]);
$stmt->execute();

$result = $stmt->get_result()->fetch_assoc();

$stmt->close();

if($result !== NULL) {
    // Benutzer existiert schon

    if(!$result["isVerified"] && password_verify($password, $result["password"])) {
        // Benutzer führt Registrierung erneut durch, um neue E-Mail zu erhalten

        if(strtolower($eMail) !== strtolower($result["eMail"]) && checkEMailExistance($eMail)) {

            throwError(4);

        }

        $verificationToken = bin2hex(random_bytes(TOKEN_LENGTH / 2));

        $stmt = $mysqli->prepare("UPDATE users SET verificationToken = ? WHERE userName = ?");
        $stmt->bind_param("ss", $verificationToken, $userName);
        $stmt->execute();
        $stmt->close();

    } else {

        throwError(3);

    }

} else {

    if(checkEMailExistance($eMail)) throwError(4);

    $firstName = NULL;
    $lastName = NULL;
    $gender = NULL;
    $school = NULL;

    $isTeacher = isset($_POST["isTeacher"]) && $_POST["isTeacher"];

    if(isset($_POST["firstname"])) {

        if(!checkForNameString($_POST["firstname"])) throwError(1);
        $firstName = $_POST["firstname"] === "" ? NULL : $_POST["firstname"];

    }

    if(isset($_POST["lastname"])) {

        if(!checkForNameString($_POST["lastname"])) throwError(1);
        $lastName = $_POST["lastname"] === "" ? NULL : $_POST["lastname"];

    }

    if(isset($_POST["school"])) {

        if(!checkForNameString($_POST["school"])) throwError(1);
        $school = $_POST["school"] === "" ? NULL : $_POST["school"];

    }

    if(isset($_POST["gender"])) {

        if(!is_string($_POST["gender"])) throwError(1);
        if($_POST["gender"] !== "" && $_POST["gender"] !== "m" && $_POST["gender"] !== "f" && $_POST["gender"] !== "d") throwError(1);
        $gender = $_POST["gender"] === "" ? NULL : $_POST["gender"];

    }
    
    $verificationToken = bin2hex(random_bytes(TOKEN_LENGTH / 2));

    $password = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $mysqli->prepare("INSERT INTO users (userName, eMail, password, isTeacher, firstName, lastName, gender, school, verificationToken) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssisssss", $userName, $eMail, $password, $isTeacher, $firstName, $lastName, $gender, $school, $verificationToken);
    $stmt->execute();
    $stmt->close();

}

$URLQuery = "?username=" . urlencode(strtolower($userName)) . "&token=" . $verificationToken;

$subject = "Registrierung abschliessen";

$headers = "From: Notentabelle <" . SENDER_EMAIL . ">\r\n";

/*

Waere fuer HTML-E-Mail. Da diese aber teilweise im Spam/Junk-Ordner landet, wird stattdessen momentan Plain Text verwendet 

$headers .= "Content-type: text/html; charset=utf-8";

$message = file_get_contents($_SERVER["DOCUMENT_ROOT"] . "/register/mail.html");
$message = str_replace("{{ userName }}", $userName, $message);
$message = str_replace("{{ URLQuery }}", $URLQuery, $message);

*/

$message = "Herzlich willkommen bei Notentabelle, " . $userName . "\n\n";
$message .= "Um die Registrierung abzuschliessen, klicken Sie auf folgenden Link:\n";
$message .= "https://notentabelle.ch/register/validateAccount" . $URLQuery;

@mail($eMail, $subject, $message, $headers, "-f " . SENDER_EMAIL);

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
    </head>
    
    <body>
        <?php include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/preload.php"); ?>
        
        <nav>
            <div id="header">
                <h1>Registrierung</h1>
            </div>
            <img src="/img/logo/logo.svg" alt="" id="logo">
        </nav>

        <h2>Überprüfung der E-Mail-Adresse</h2>

        <div class="text">
            <p>Das Konto wurde erstellt, ist aber noch nicht freigeschalten.</p>
            <p>Dafür wurde Ihnen eine E-Mail gesendet.</p>
            <p>Um das Konto freizuschalten, benutzen den Link in der E-Mail.</p>
            <p class="blankLine">Falls Sie keine E-Mail erhalten haben sollten, schauen Sie bitte auch im Spam-/Junk-Ordner nach.</p>
            <p>Falls Sie die E-Mail erneut senden müssen, wiederholen Sie den Registrierungsprozess mit dem gleichen Passwort wie vorher.</p>
            <p class="blankLine">Diese Seite können Sie nun schliessen.</p>
        </div>
    </body>
</html>