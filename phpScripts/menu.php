<div id="menuContainer" onmouseenter="openMenu()" onmouseleave="closeMenu()">
	<img src="img/logo/logo.svg" alt="" id="logo" onclick="toggleMenu()">
	<div id="menu">
		<div id="menuContent"><?php

if(!isset($_SESSION["userid"])) {
	
	$menutext = "<p>Sie sind nicht</p>" .
				"<p>eingeloggt.</p>" .
				"<p class='blankLine'>" .
					"<a href='/'>" .
						"<button class='button_menu positive'>Anmelden</button>" .
					"</a>" .
				"</p>";
	
} elseif ($_SESSION["type"] === "demo") {
	
	$menutext = "<p>Sie sind aktuell</p>" .
				"<p>im Demo-Modus.</p>" .
				"<p class='blankLine'>" .
					"<a href='/login/logout'>" .
						"<button class='button_menu negative'>Zurück</button>" .
					"</a>" .
				"</p>" .
				
				"<p class='blankLine_small'>" .
					"<a href='register?demo=1'>" .
						"<button class='button_menu positive'>Jetzt registrieren</button>" .
					"</a>" .
				"</p>";
	
	
	
} else {
	
	$menutext = "<p><i>Eingeloggt als:</i></p>" .
				"<p>" . $_SESSION["username"] . "</p>" .
				"<p class='blankLine'>" .
					"<a href='/login/logout?meldung=1'>" .
						"<button class='button_menu negative'>Abmelden</button>" .
					"</a>" .
				"</p>" .
				"<p class='blankLine_small'>" .
					"<a href='settings'>" .
						"<button class='button_menu positive'>Einstellungen</button>" .
					"</a>" .
				"</p>";
	
}

$menutext .= 	"<p class='blankLine'>" .
					"<a href='about'>" .
						"<button class='button_menu positive'>Über Notentabelle</button>" .
					"</a>" .
				"</p>";

echo $menutext;

		?></div>
	</div>
</div>