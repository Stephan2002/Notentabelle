function openMenu() {

	document.getElementById("menu").classList.add("openMenu");

}

function closeMenu() {

	document.getElementById("menu").classList.remove("openMenu");

}

function toggleMenu() {

	document.getElementById("menu").classList.toggle("openMenu");

}

var menuString =
	"<div id='menuContainer' onmouseenter='openMenu()' onmouseleave='closeMenu()'>" + 
		"<img src='img/logo/logo.svg' alt='' id='logo' onclick='toggleMenu()'>" + 
		"<div id='menu'>" + 
			"<div id='menuContent'>";

if(user.userName === undefined) {
	
	menuString += "<p>Sie sind nicht</p>" +
				"<p>eingeloggt.</p>" +
				"<p class='blankLine'>" +
					"<a href='/index'>" +
						"<button class='button_menu positive'>Anmelden</button>" +
					"</a>" +
				"</p>";
	
} else if (user.userName === "demo") {
	
	menuString += "<p>Sie sind aktuell</p>" +
				"<p>im Demo-Modus.</p>" +
				"<p class='blankLine'>" +
					"<a href='/index?logout=1'>" +
						"<button class='button_menu negative'>Zurück</button>" +
					"</a>" +
				"</p>" +
				
				"<p class='blankLine_small'>" +
					"<a href='/register'>" +
						"<button class='button_menu positive'>Jetzt registrieren</button>" +
					"</a>" +
				"</p>";
	
	
	
} else {
	
	menuString += "<p><i>Eingeloggt als:</i></p>" +
				"<p>" + user.userName + "</p>" +
				"<p class='blankLine'>" +
					"<a href='/index?logout=1'>" +
						"<button class='button_menu negative'>Abmelden</button>" +
					"</a>" +
				"</p>" +
				"<p class='blankLine_small'>" +
					"<a href='/settings'>" +
						"<button class='button_menu positive'>Einstellungen</button>" +
					"</a>" +
				"</p>";
	
}

menuString += 	"<p class='blankLine'>" +
					"<a href='/about'>" +
						"<button class='button_menu positive'>Über Notentabelle</button>" +
					"</a>" +
				"</p>";

menuString += 
            "</div>" + 
        "</div>" +
    "</div>";

document.write(menuString);