var menuTimer;

function openMenu(event) {
	
	document.getElementById("menu").classList.add("openMenu");
	clearTimeout(menuTimer);
	document.getElementById("menuContent").style.display = "block";

	event.stopImmediatePropagation();
	event.preventDefault();

}

function closeMenu(event) {

	document.getElementById("menu").classList.remove("openMenu");
	menuTimer = setTimeout(function() { document.getElementById("menuContent").style.display = "none"; }, 450);

}

function toggleMenu(event) {
	
	if(document.getElementById("menu").classList.contains("openMenu")) {

		closeMenu(event);

	} else {

		openMenu(event);

	}

	event.preventDefault();

}


var menuString =
	"<div id='menuContainer' onmouseenter='openMenu(event)' onmouseleave='closeMenu(event)' onfocusin='openMenu(event)' onfocusout='closeMenu(event)'>" + 
		"<img src='img/logo/logo.svg' alt='' id='logo' tabindex='0' onclick='toggleMenu(event)'>" + 
		"<div id='menu'>" + 
			"<div id='menuContent' tabindex='-1'>";

if(user.userName === undefined) {
	
	menuString += "<p>Sie sind nicht</p>" +
				"<p>eingeloggt.</p>" +
				"<p class='blankLine'>" +
					"<button class='button_menu positive' onclick='window.location=\"/index\"'>Anmelden</button>" +
				"</p>";
	
} else if (user.userName === "demo") {
	
	menuString += "<p>Sie sind aktuell</p>" +
				"<p>im Demo-Modus.</p>" +
				"<p class='blankLine'>" +
					"<button class='button_menu negative' onclick='window.location=\"/index?logout=1\"'>Zurück</button>" +
				"</p>" +
				
				"<p class='blankLine_small'>" +
					"<button class='button_menu positive' onclick='window.location=\"/register\"'>Jetzt registrieren</button>" +
				"</p>";
	
	
	
} else {
	
	menuString += "<p><i>Eingeloggt als:</i></p>" +
				"<p>" + user.userName + "</p>" +
				"<p class='blankLine'>" +
					"<button class='button_menu negative' onclick='window.location=\"/index?logout=1\"'>Abmelden</button>" +
				"</p>" +
				"<p class='blankLine_small'>" +
					"<button class='button_menu positive' onclick='window.location=\"/settings\"'>Einstellungen</button>" +
				"</p>";
	
}

menuString += 	"<p class='blankLine'>" +
					"<button class='button_menu positive' onclick='window.location=\"/about\"'>Über Notentabelle</button>" +
				"</p>";

menuString += 
            "</div>" + 
        "</div>" +
    "</div>";

document.write(menuString);