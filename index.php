<?php

/*

Startseite mit Kurzbeschreibung der Applikation, Login-Formular und Links auf Registrierungseite, Demo & Ueber Notentabelle.
Loggt ausserdem den User ein oder aus

*/

/*

	0: Kein Fehler
	1: Nicht eingeloggt
	2: Session abgelaufen oder ungueltig
	3: Auto-Login abgelaufen
	4: Auto-Login fehlgeschlagen
	5: Kein Benutzername oder E-Mail
	6: Kein Passwort
	7: Benutzername oder E-Mail existiert nicht
	8: Passwort falsch
	9: gesperrt
	10: noch nicht freigeschaltet
	11: gelöscht
	12: anderer Fehler

*/

$DB = json_decode(file_get_contents($_SERVER["DOCUMENT_ROOT"] . "/database.json"));

$isAlreadyLoggedIn = false;
$logout = false;

if(isset($_GET["error"]) && is_numeric($_GET["error"])) {

	$error = (int)$_GET["error"];

} else {

	$error = 0;
	
	if(isset($_POST["login"])) {
		
		if(!isset($_POST["password"]) || empty($_POST["password"])) {
	
			$error = 6;
	
		}
	
		if(!isset($_POST["username"]) || empty($_POST["username"])) {
	
			$error = 5;
	
		}
		
		if($error === 0) {
			
			$mysqli = new mysqli($DB->HOST, $DB->USERNAME, $DB->PASSWORD, $DB->DBNAME);
	
			if($mysqli->connect_errno) {
				
				header("Location: /error.php?error=0");
				exit;
	
			}
	
			$stmt = $mysqli->prepare("SELECT userID, userName, type, password, isVerified, lowerDisplayBound, upperDisplayBound, deleteTimestamp FROM users WHERE username = ? OR eMail = ?");
			$stmt->bind_param("ss", $_POST["username"], $_POST["username"]);
			$stmt->execute();
	
			$results = $stmt->get_result()->fetch_assoc();
	
			if(is_null($results)) {
	
				$error = 7;
	
			} elseif(!password_verify($_POST["password"], $results["password"])) {
	
				$error = 8;
	
			} elseif($results["type"] === "blocked") {
	
				$error = 9;
	
			} elseif(!$results["isVerified"]) {
				
				$error = 10;
	
			} elseif($results["deleteTimestamp"]) {
	
				$error = 11;
	
			} else {
	
				session_start();
	
				$_SESSION["userid"] = $results["userID"];
				$_SESSION["username"] = $results["userName"];
				$_SESSION["type"] = $results["type"];
				$_SESSION["lowerDisplayBound"] = $results["lowerDisplayBound"];
				$_SESSION["upperDisplayBound"] = $results["upperDisplayBound"];
	
				$stmt->prepare("UPDATE users SET lastUsed = NOW() WHERE userID = ?");
				$stmt->bind_param("i", $_SESSION["userid"]);
				$stmt->execute();
	
				if($_POST["auto_login"]) {
	
					// Auto-Login erstellen
	
				}

				header("Location: app");
	
			}

			$stmt->close();
			$mysqli->close();
	
		}
	
		
	} elseif(isset($_GET["logout"])) {
	
		session_start();
	
		$_SESSION = array();
	
		$params = session_get_cookie_params();
	
		setcookie(session_name(), "", time() - 40000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
	
		session_destroy();
	
		$logout = true;
	
	} else {
	
		if(isset($_COOKIE["PHPSESSID"])) {
	
			session_start();
	
			if(isset($_SESSION["userid"])) {
	
				$isAlreadyLoggedIn = true;
		
			} else {
	
				$error = 2;
	
			}
	
		}
		
		if(!$isAlreadyLoggedIn && false) { 
	
			include("phpScripts/autoLogin.php");
	
			session_start();
			$error = login(); // Wird spaeter eingefuegt: Automatischer Login-Prozess
	
			if($error === 0) {
	
				$isAlreadyLoggedIn = true;
	
            }
	
		}
		
	}

}
    
?>

<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" href="/css/basicStylesheet.css">
		<link rel="stylesheet" href="/css/stylesheet.css">
		<link rel="stylesheet" href="/css/indexStylesheet.css">
		
		<!-- Icons -->
		<link rel="icon" type="image/png" href="img/logo/logo_low.png">
		<link rel="icon" type="image/vnd.microsoft.icon" href="img/logo/logo.ico">
		<link rel="apple-touch-icon" href="img/logo/logo_white.png">
		
		<title>Notentabelle</title>
	</head>
	
	<body>
		<?php include("phpScripts/preload.php"); ?>
		<nav>
			<div id="header">
				<h1>Notentabelle</h1>
			</div>
			<img src="img/logo/logo.svg" alt="" id="logo">
		</nav>
		
		<img src="img/logo/startlogo_big.svg" id="startlogo_big">
		<img src="img/logo/startlogo_small.svg" id="startlogo_small">

		<div class="text">
			<p>Mit Notentabelle verlieren Sie nie mehr den Überblick über Ihre Noten oder die Ihrer Lernenden.</p>
			<p>Geben Sie Ihre Note ein, so wird sofort der Schnitt berechnet.</p>
			<p>Die Noten können in beliebig viele Unterordner gegliedert werden.</p>
			<p class="blankLine">Geeignet für Lernende, die Übersicht über ihre Noten behalten wollen, oder für Lehrpersonen, </p>
			<p>die dadurch die Noten der Lernenden einfach eintragen und berechnen lassen können!</p>
		</div>
		
		<div class="container">
			<h2>Anmeldung</h2>
			
			<?php 

			if($logout || $error === 1 || $error === 2 || $error === 3 || $error === 4) {

				echo "<script>if (typeof (localStorage) !== undefined) localStorage.removeItem('path');</script>";

			}


			if($error !== 0) {

				$text = "<div class='info red'>";

				if($error === 1) {
					
					$text .=	"<p class='blankLine_small'>Sie sind nicht eingeloggt.</p>" .
								"<p>Bitte loggen sie sich zuerst ein.</p>";
					
				} elseif ($error === 2) {
					
					$text .=	"<p class='blankLine_small'>Sitzung abgelaufen.</p>" .
								"<p>Bitte erneut einloggen.</p>";
					
				} elseif ($error === 3) {
					
					$text .=	"<p class='blankLine_small'>Sie waren zu lange nicht mehr eingeloggt.</p>" .
								"<p>Bitte erneut einloggen.</p>";
					
				} elseif ($error === 4) {
					
					$text .=	"<p class='blankLine_small'>Auto-Login fehlgeschlagen.</p>" .
								"<p>Bitte erneut einloggen.</p>";
					
				} elseif ($error === 5) {
					
					$text .=	"<p class='blankLine_small'>Kein Benutzername bzw. keine E-Mail-Adresse angegeben.</p>" .
								"<p>Bitte Benutzername oder E-Mail-Adresse angeben.</p>";
					
				} elseif ($error === 6) {
					
					$text .=	"<p class='blankLine_small'>Passwort fehlt.</p>" .
								"<p>Bitte Passwort eingeben.</p>";
					
				} elseif ($error === 7) {
					
					$text .=	"<p class='blankLine_small'>Benutzername bzw. E-Mail-Adresse falsch.</p>" .
								"<p>Bitte überprüfen Sie Ihren Benutzernamen bzw. Ihre E-Mail-Adresse</p>";
					
				} elseif ($error === 8) {
					
					$text .=	"<p class='blankLine_small'>Passwort falsch.</p>" .
								"<p>Bitte Passwort erneut eingeben.</p>";
					
				} elseif ($error === 9) {
					
					$text .=	"<p class='blankLine_small'>Dieses Konto ist gesperrt.</p>" .
								"<p>Bitte wenden Sie sich an den Support.</p>";
					
				} elseif ($error === 10) {

					$text .=	"<p class='blankLine_small'>Ihr Konto ist noch nicht freigeschaltet.</p>" .
								"<p>Für die Freischaltung klicken Sie bitte auf den Link, den Sie per E-Mail erhalten haben.</p>";
		
				} elseif ($error === 11) {
					
					$text .=	"<p class='blankLine_small'>Dieses Konto ist gelöscht worden.</p>" .
								"<p>Bitte zur Wiederherstellung den Support kontaktieren.</p>";
					
				} elseif ($error === 12) {
					
					$text .=	"<p class='blankLine_small'>Unbekannter Fehler.</p>" .
								"<p>Bitte kontaktieren Sie den Support.</p>";
					
				}

				echo $text . "</div>";

			} elseif($isAlreadyLoggedIn) {

				echo 	"<div class='info gray'>". 
							"<p class='blankLine_small'>Sie sind bereits eingeloggt</p>" .
							"<p><a href='app'>Hier</a> klicken, um zur App zu gelangen.</p>" .
						"</div>";

			} elseif($logout) {

				echo 	"<div class='info green'>". 
							"<p class='blankLine_small'>Erfolgreich ausgeloggt.</p>" .
							"<p>Danke für Ihren Besuch!</p>" .
						"</div>";

			}
				
			?>
			
			<form method="POST" action="index">
				<input type="hidden" name="login" value="1">
				<input type="text" id="username" name="username" maxlength="64" placeholder="Benutzername oder E-Mail" <?php if(isset($_POST["username"])) {echo "value='" . $_POST["username"] . "'";}?>>
				<input type="password" id="password" name="password" placeholder="Passwort">
				<label><input type="checkbox" name="auto_login" value="1">Login speichern</label>
				<input type="submit" class="button_small positive" value="Login">
			</form>

			
		
			<p class="blankLine_big">Noch kein Konto?</p>
			<p><button class="button_small positive" onclick="window.location.href = 'register'">Kostenlos registrieren</button></p>
			
			<p class="blankLine_big">Noch nicht überzeugt?</p>
			<p><button class="button_small positive" onclick="window.location.href = 'demo'">Demo ausprobieren</button></p>
			
			<p class="blankLine_big">Mehr Informationen</p>
			<p><button class="button_small positive" onclick="window.location.href = 'about'">Über Notentabelle</button></p>
		
		</div>
	
		<p id="footer">2020 © by Stephan Flury</p>
	</body>
</html>