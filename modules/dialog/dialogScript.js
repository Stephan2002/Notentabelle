
class Dialog {

    constructor(dialogElement, hideOnEnter = true, hideOnEsc = true, OKAction = undefined, cancelAction = undefined, id = undefined) {

        if(dialogElement === undefined) {

            return;

        } else {

            this.initialize(dialogElement, hideOnEnter, hideOnEsc, OKAction, cancelAction, id);

        }

    }

    initialize(dialogElement, hideOnEnter = true, hideOnEsc = true, OKAction = undefined, cancelAction = undefined, id = undefined) {

        this.dialogElement = dialogElement;
        this.contentElement = dialogElement.getElementsByClassName("dialogContent")[0];
        this.blockerElement = dialogElement.getElementsByClassName("dialogBlocker")[0];
        this.anchorElement = document.createElement("DIV");

        this.contentElement.addEventListener("touchmove", function (event) {

			if (this.scrollHeight > window.innerHeight) {

				event.stopPropagation();
				
			}

        }, eventListenerParameter);

        this.OKAction = OKAction;
        this.cancelAction = cancelAction;
        this.hideOnEnter = hideOnEnter;
        this.hideOnEsc = hideOnEsc;

        if(this.id === undefined) {

            if(id === undefined) {

                do {

                    this.id = Math.floor(Math.random() * 1000000000000);

                } while(document.getElementById("dialogAnchor_" + this.id) != null);

            } else {

                this.id = id;

            }

        }

        if(this.dialogElement.tabIndex < 0) {

            this.dialogElement.tabIndex = 0;

        }

        this.anchorElement.id = "dialogAnchor_" + this.id;
        this.anchorElement.tabIndex = 0;
        this.dialogElement.setAttribute("data-id", this.id);

        if(this.destroyOnHide) {

            this.dialogElement.classList.add("destroyOnHide");

        }

        var copy = this;
        
        this.dialogElement.addEventListener("keydown", function (event) {
			
			if (event.key === "Enter") {

                var activeElement = document.activeElement;

                if(copy.OKAction !== undefined || copy.hideOnEnter) {
                
                    if(
                        activeElement.tagName !== "TEXTAREA" &&
                        activeElement.tagName !== "BUTTON" &&
                        activeElement.tagName !== "SELECT" &&
                        (activeElement.tagName !== "INPUT" || (
                            activeElement.type !== "color" &&
                            activeElement.type !== "file" &&
                            activeElement.type !== "date" &&
                            activeElement.type !== "datetime-local" &&
                            activeElement.type !== "week" &&
                            activeElement.type !== "month" &&
                            activeElement.type !== "time" &&
                            activeElement.type !== "submit" &&
                            activeElement.type !== "reset" &&
                            activeElement.type !== "button" &&
                            activeElement.type !== "image"
                        ))    
                    ) {
                    
                        if(typeof(copy.OKAction) === "function") {

                            copy.OKAction();

                        }

                        if(copy.hideOnEnter) {

                            Dialog.hide(copy);

                        }

                        event.preventDefault();

                    }

                }

			} else if(event.key === "Escape") {

                if(copy.cancelAction !== undefined || copy.hideOnEsc) {

                    if(typeof(copy.cancelAction) === "function") {

                        copy.cancelAction();

                    }

                    if(copy.hideOnEsc) {

                        Dialog.hide(copy);

                    }

                    event.preventDefault();

                }

			} else if(event.key === "Tab") {

                if(event.shiftKey) {

                    if(copy.dialogElement == document.activeElement) {
                        
                        copy.anchorElement.focus();
                        event.preventDefault();

                    }

                }

            }

        });

        this.anchorElement.style.outline = "none";
        this.anchorElement.style.display = "none";

        this.anchorElement.addEventListener("keydown", function(event) {
            
            if(event.key === "Tab") {
            
                if(!event.shiftKey) {

                    copy.dialogElement.focus();
                    event.preventDefault();

                }

            }

        });

        document.body.insertBefore(this.anchorElement, document.body.childNodes[0]);

        if(this.dialogElement.style.display !== "none") {

            this.anchorElement.style.display = "block";
            Dialog.visibleCounter++;

        }

        return this;

    }


    show() {

        Dialog.show(this);

    }

    hide() {

        Dialog.hide(this);

    }

    isVisible() {

        return Dialog.isVisible(this);

    }

    resize() {

        Dialog.resize(this);

    }


    static show(parameter) {

        var dialogElement;
        var blockerElement;
        var contentElement;
        var anchorElement;

        if(parameter instanceof Dialog) {

            dialogElement = parameter.dialogElement;
            blockerElement = parameter.blockerElement;
            contentElement = parameter.contentElement;
            anchorElement = parameter.anchorElement;

        } else {
            
            dialogElement = Dialog.getDialogElement(parameter);
            blockerElement = dialogElement.getElementsByClassName("dialogBlocker")[0];
            contentElement = dialogElement.getElementsByClassName("dialogContent")[0];
            anchorElement = document.getElementById("dialogAnchor_" + dialogElement.getAttribute("data-id"));

        }

        document.body.removeChild(dialogElement);
        document.body.appendChild(dialogElement);
        document.body.removeChild(anchorElement);
        document.body.insertBefore(anchorElement, document.body.childNodes[0]);

        if(dialogElement.style.display !== "none") {

            return;

        }

        contentElement.removeEventListener("keydown", Dialog.disableKeyBoard);
        blockerElement.style.display = "none";
        dialogElement.style.display = "flex";
        anchorElement.style.display = "block";
        dialogElement.style.opacity = 1;
        dialogElement.style.animationName = "";
        contentElement.style.animationName = "";


        dialogElement.focus();

        Dialog.visibleCounter++;

        if (Dialog.visibleCounter == 1) {

			document.body.classList.add("stop-scrolling");
			document.addEventListener("touchmove", Dialog.disableScroll, eventListenerParameter);

        }

        Dialog.resize(dialogElement);

    }

    static hide(parameter, callback) {
        
        var dialogElement;
        var blockerElement;
        var contentElement;
        var anchorElement;
        var destroyOnHide;

        if(parameter instanceof Dialog) {

            dialogElement = parameter.dialogElement;
            blockerElement = parameter.blockerElement;
            contentElement = parameter.contentElement;
            anchorElement = parameter.anchorElement;
            destroyOnHide = parameter.destroyOnHide;

        } else {

            dialogElement = Dialog.getDialogElement(parameter);
            blockerElement = dialogElement.getElementsByClassName("dialogBlocker")[0];
            contentElement = dialogElement.getElementsByClassName("dialogContent")[0];
            anchorElement = document.getElementById("dialogAnchor_" + dialogElement.getAttribute("data-id"));
            destroyOnHide = dialogElement.classList.contains("destroyOnHide");

        }

        if(dialogElement.style.display === "none") {

            return;

        }

        dialogElement.style.opacity = 0;
		contentElement.addEventListener("keydown", Dialog.disableKeyBoard);
        blockerElement.style.display = "block";
        dialogElement.style.animationName = "none";
        contentElement.style.animationName = "none";
		
		setTimeout(function () {
            
            dialogElement.style.display = "none";
            anchorElement.style.display = "none";
            
            if(callback) {

                callback();

            }

            if(destroyOnHide) {

                var parentElement = dialogElement.parentNode;

                parentElement.removeChild(dialogElement);
                parentElement.removeChild(anchorElement);

            }

            Dialog.visibleCounter--;

            if (Dialog.visibleCounter <= 0) {

                document.body.classList.remove("stop-scrolling");
                document.removeEventListener("touchmove", Dialog.disableScroll);
    
            }

            if(window.Loading && Loading.isVisible()) {

                document.getElementById("loadingElement").focus();

            }

		}, 200);

    }

    static isVisible(parameter) {

        var dialogElement;

        if(parameter instanceof Dialog) {

            dialogElement = parameter.dialogElement;

        } else {

            dialogElement = Dialog.getDialogElement(parameter);

        }

        return dialogElement.style.display !== "none";

    }

    static disableScroll(event) {

		event.preventDefault();

    }

    static disableKeyBoard(event) {

        event.preventDefault();

    }
    
    static resize(parameter) {

        var contentElement;

        if(parameter instanceof Dialog) {

            contentElement = parameter.contentElement;

        } else {

            contentElement = Dialog.getDialogElement(parameter).getElementsByClassName("dialogContent")[0];

        }

        if (contentElement.scrollHeight >= window.innerHeight) {
    
            contentElement.classList.add("small");

        } else {

            contentElement.classList.remove("small");

        }

    }

    static resizeAll() {

        var elements = document.getElementsByClassName("dialogContent");

        for (var i = 0; i < elements.length; i++) {
    
            if (elements[i].scrollHeight >= window.innerHeight) {
    
                elements[i].classList.add("small");
    
            } else {
    
                elements[i].classList.remove("small");
    
            }
    
        }

    }

    static getDialogElement(element) {
        
        if(element instanceof Event) {

            element = element.target;

        }

        while (!element.classList.contains("dialog")) {

            element = element.parentNode;

        }

        return element;

    }

}

Dialog.visibleCounter = 0;
Dialog.URL = "/modules/dialog";


window.addEventListener("resize", Dialog.resizeAll);
document.addEventListener("DOMContentLoaded", Dialog.resizeAll);


var eventListenerParameter = false;

try {

    var opts = Object.defineProperty({}, 'passive', { get: function() { eventListenerParameter = { passive: false }; }});

    window.addEventListener("testPassive", null, opts);
    window.removeEventListener("testPassive", null, opts);

} catch (e) {}

