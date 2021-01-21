<!-- Fehlerseite. Wird bei diversen Fehlern aufgerufen -->
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		
		<style>
			#error {

				margin: 40px 0px 0px;
				width: 50%;
				max-width: 200px;

			}

			h2 {

				margin-top: 30px;

			}

			#logo {

				width: 40px;
				height: 40px;

			}
		</style>

		<link rel="stylesheet" href="/css/basicStylesheet.css">
		<link rel="stylesheet" href="/css/stylesheet.css">

        <!-- Icons -->
		<link rel="icon" href="/img/logo/logo.ico" sizes="48x48">
        <link rel="icon" type="image/png" href="/img/logo/logo_192x192.png" sizes="192x192">
        <link rel="icon" type="image/svg+xml" href="/img/logo/logo.svg">
        <link rel="apple-touch-icon" href="/img/logo/logo_white_180x180.png">

		<title>Notentabelle</title>

		<script>
            if("serviceWorker" in navigator && navigator.serviceWorker.controller) navigator.serviceWorker.oncontrollerchange = function() { alert("Updates wurden durchgeführt. Die Webapp wird neugeladen, damit sie richtig funktioniert."); window.location.reload(); };
        </script>
	</head>
	
	<body>
		<?php include($_SERVER["DOCUMENT_ROOT"] . "/phpScripts/preload.php"); ?>
		
		<nav>
			<div id="empty"></div>
			<div id="header">
				<h1>Fehler</h1>
			</div>
			
			<img src="/img/logo/logo.svg" alt=" " id="logo">
		</nav>
		
		<img id="error" src="/img/icons/error.svg" alt=" ">
		
		<?php
            
            /*
				-1: Kein Internet
                0: Unbekannter Fehler
                1: Benoetigt Javascript
                2: Benoetigt Cookies
                401: Authentifizierung fehlgeschlagen
                403: Zugriff verweigert
                404: Seite nicht gefunden

            */

			if(isset($_GET["error"])) {

				$error = (int)$_GET["error"];

			} else {

				$error = 0;

			}
			
			if($error === -1) {
				
				echo 	"<h2>Kein Internet!</h2>" .
						"<div class='text'>" . 
							"<p>Sie sind offline.</p>" .
							"<p>Sie könnnen deshalb Notentabelle nicht nutzen.</p>" .
						"</div>";
				
			} else if($error === 1) {
				
				echo 	"<h2>Benötigt Javascript!</h2>" .
						"<div class='text'>" . 
							"<p>Notentabelle funktioniert nur mit JavaScript.</p>" .
							"<p>Um Notentabelle zu nutzen, aktivieren Sie bitte JavaScript.</p>" .
							// "<p class='blankLine'>Bei Fragen kontaktieren Sie bitte den Support.</p>" .
						"</div>";
				
			} elseif ($error === 2) {
				
				echo 	"<h2>Benötigt Cookies!</h2>" .
						"<div class='text'>" . 
							"<p>Notentabelle benötigt Cookies, damit Sie angemeldet bleiben.</p>" .
							"<p>Um Notentabelle zu nutzen, aktivieren Sie bitte Cookies.</p>" .
							// "<p class='blankLine'>Bei Fragen kontaktieren Sie bitte den Support.</p>" .
						"</div>";
				
			} elseif ($error === 401) {
				
				echo 	"<h2>Authentisierung fehlgeschlagen!</h2>" .
						"<div class='text'>" . 
							"<p>Der Server konnte nicht verifizieren, ob Sie autorisiert sind, auf diese URL zuzugreifen. Wahrscheinlich wurde das falsche Passwort eingegeben.</p>" .
							"<p>Bitte versuchen Sie es nochmals.</p>" .
							// "<p class='blankLine'>Bei Fragen kontaktieren Sie bitte den Support.</p>" .
							"<p class='blankLine'>Error 401</p>" .
						"</div>";
				
			} elseif ($error === 403) {
				
				echo 	"<h2>Zugriff verweigert!</h2>" .
						"<div class='text'>" . 
							"<p>Der Zugriff auf das angeforderte Objekt ist nicht möglich. Entweder kann es vom Server nicht gelesen werden oder es ist zugriffsgeschützt.</p>" .
							//"<p class='blankLine'>Bei Fragen kontaktieren Sie bitte den Support.</p>" .
							"<p class='blankLine'>Error 403</p>" .
						"</div>";
				
			} elseif ($error === 404) {
				
				echo 	"<h2>Seite nicht gefunden!</h2>" .
						"<div class='text'>" . 
							"<p>Die angeforderte URL konnte auf dem Server nicht gefunden werden.</p>" .
							"<p>Bitte überprüfen Sie, ob Sie sich nicht vertippt haben.</p>" .
							// "<p class='blankLine'>Bei Fragen kontaktieren Sie bitte den Support.</p>" .
							"<p class='blankLine'>Error 404</p>" .
						"</div>";
				
			} else {
				
				echo 	"<h2>Unbekannter Fehler</h2>" .
						"<div class='text'>" . 
							"<p>Versuchen Sie es später noch einmal.</p>" . 
							// "<p>Bitte kontaktieren Sie den Support.</p>" .
						"</div>";
				
			}

			if($error >= 0) {

				echo "<p class='blankLine'>";

			}
			
            if(isset($_GET["origin"])) {

                if($_GET["origin"] === "app" || $_GET["origin"] === "register" || $_GET["origin"] === "account") {

                    echo "<a href='/" . $_GET["origin"] . "'><button class='button_small positive' style='margin-bottom:40px;'>Nochmals versuchen</button></a> ";

                }

            }
		
			if($error >= 0) {

				echo "<a href='/index'><button class='button_small positive' style='margin-bottom:40px;'>Zurück zur Startseite</button></a>";
				echo "</p>";

			}
		?>
	</body>
</html>