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
        "<img src='/img/logo/logo.svg' alt='' id='logo' tabindex='0' onclick='toggleMenu(event)'>" + 
        "<div id='menu'>" + 
            "<div id='menuContent' tabindex='-1'>";

if(window.user === undefined) {
    
    menuString += "<p>Sie sind nicht</p>" +
                "<p>eingeloggt.</p>" +
                "<p class='blankLine'>" +
                    "<button class='button_menu positive' onclick='window.location=\"/index\"'>Anmelden</button>" +
                "</p>" +
                "<p class='blankLine_small'>" +
                    "<button class='button_menu positive' onclick='window.location=\"/register\"'>Registrieren</button>" +
                "</p>";

} else if (user.status === "demo") {
    
    menuString += "<p>Sie sind in der</p>" +
                "<p>" + (user.userName === "studentDemo" ? "Schüler/in-" : "Lehrpersonen-") + "Demo</p>" +
                "<p class='blankLine'>" +
                    "<button class='button_menu negative' onclick='window.location=\"/index\"'>Zurück</button>" +
                "</p>" +
                
                "<p class='blankLine_small'>" +
                    "<button class='button_menu positive' onclick='window.location=\"/register\"'>Jetzt registrieren</button>" +
                "</p>";
    
    
    
} else {
    
    menuString += "<p><i>Eingeloggt als:</i></p>" +
                "<p>" + user.userName + "</p>" +
                "<p class='blankLine'>" +
                    "<button class='button_menu negative' onclick='window.location=\"/index?logout=1\"'>Abmelden</button>" +
                "</p>";
    
    if(window.location.pathname.startsWith("/account")) {

        menuString +=
                "<p class='blankLine_small'>" +
                    "<button class='button_menu positive' onclick='window.location=\"/app\"'>Zur App</button>" +
                "</p>";

    } else {

        menuString +=
                "<p class='blankLine_small'>" +
                    "<button class='button_menu positive' onclick='window.location=\"/account\"'>Konto</button>" +
                "</p>";

    }
    
}

if(!window.location.pathname.startsWith("/about")) {

    if(window.location.pathname.startsWith("/app")) {

        menuString += 
                "<p class='blankLine_small'>" +
                        "<button class='button_menu positive' onclick='window.location=\"/about?origin=app\"'>Über Notentabelle</button>" +
                "</p>";

    } else if(window.location.pathname.startsWith("/account")) {

        menuString += 
                "<p class='blankLine_small'>" +
                        "<button class='button_menu positive' onclick='window.location=\"/about?origin=account\"'>Über Notentabelle</button>" +
                "</p>";

    } else {

        menuString += 
                "<p class='blankLine_small'>" +
                        "<button class='button_menu positive' onclick='window.location=\"/about\"'>Über Notentabelle</button>" +
                "</p>";

    }

} else {

    if(window.user !== undefined) {

        menuString +=
                "<p class='blankLine_small'>" +
                    "<button class='button_menu positive' onclick='window.location=\"/app\"'>Zur App</button>" +
                "</p>";

    }

}


menuString += 
            "</div>" + 
        "</div>" +
    "</div>";

document.write(menuString);