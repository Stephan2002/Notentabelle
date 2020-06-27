
class Dialog {

    constructor(dialogElement, enterAsOK = true, escAsCancel = true, OKAction, cancelAction) {

        if(dialogElement === undefined) {

            return;

        } else {

            this.initialize(dialogElement, enterAsOK, escAsCancel, OKAction, cancelAction);

        }

    }

    initialize(dialogElement, enterAsOK = true, escAsCancel = true, OKAction, cancelAction) {

        this.dialogElement = dialogElement;
        this.contentElement = dialogElement.getElementsByClassName("dialogContent")[0];
        this.blockerElement = dialogElement.getElementsByClassName("dialogBlocker")[0];

        this.contentElement.addEventListener("touchmove", function (event) {

			if (this.scrollHeight > window.innerHeight) {

				event.stopPropagation();
				
			}

        });

        this.OKAction = OKAction;
        this.cancelAction = cancelAction;
        this.enterAsOK = enterAsOK;
        this.escAsCancel = escAsCancel;

        var copy = this;
        
        this.contentElement.addEventListener("keydown", function (event) {
			
			if (event.key == "Enter") {

                var activeElement = document.activeElement;

                if(copy.enterAsOK) {
                
                    if(
                        activeElement.tagName != "TEXTAREA" &&
                        activeElement.tagName != "BUTTON" &&
                        activeElement.tagName != "SELECT" &&
                        (activeElement.tagName != "INPUT" || (
                            activeElement.type != "color" &&
                            activeElement.type != "file" &&
                            activeElement.type != "date" &&
                            activeElement.type != "datetime-local" &&
                            activeElement.type != "week" &&
                            activeElement.type != "month" &&
                            activeElement.type != "time" &&
                            activeElement.type != "submit" &&
                            activeElement.type != "reset" &&
                            activeElement.type != "button" &&
                            activeElement.type != "image"
                        ))    
                    ) {
                    
                        if(typeof(copy.OKAction) == "function") {

                            copy.OKAction();

                        }

                        if(!copy.preventHidingOnEnter) {

                            Dialog.hide(copy);

                        }

                        event.preventDefault();

                    }

                }

			} else if(event.key == "Escape") {

                if(copy.escAsCancel) {

                    if(typeof(copy.cancelAction) == "function") {

                        copy.cancelAction();

                    }

                    if(!copy.preventHidingOnEnter) {

                        Dialog.hide(copy);

                    }

                    event.preventDefault();

                }

			} else if(event.key == "Tab") {

                if(event.shiftKey) {

                    if(copy.contentElement == document.activeElement) {

                        event.preventDefault();

                    }

                } else {

                    if(
                        document.activeElement.classList.contains("lastDialogElement") || 
                        (
                            document.activeElement.classList.contains("secondLastDialogElement") &&
                            copy.contentElement.getElementsByClassName("lastDialogElement")[0].disabled
                        )
                    ) {

                        event.preventDefault();

                    }

                }

			}

        });
        


        if(this.dialogElement.style.display !== "none") {

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

    resize() {

        Dialog.resize(this);

    }


    static show(parameter) {

        var dialogElement;
        var blockerElement;
        var contentElement;

        if(parameter instanceof Dialog) {

            dialogElement = parameter.dialogElement;
            blockerElement = parameter.blockerElement;
            contentElement = parameter.contentElement;

        } else {
            
            dialogElement = Dialog.getDialogElement(parameter);
            blockerElement = dialogElement.getElementsByClassName("dialogBlocker")[0];
            contentElement = dialogElement.getElementsByClassName("dialogContent")[0];

        }

        if(dialogElement.style.display !== "none") {

            return;

        }

        contentElement.removeEventListener("keydown", Dialog.disableKeyBoard);
        blockerElement.style.display = "none";
        dialogElement.style.display = "flex";
        dialogElement.style.opacity = 1;
        dialogElement.style.animationName = "";
        contentElement.style.animationName = "";

        /*setTimeout(function() {

            dialogElement.style.opacity = 1;

        }, 0);*/

        contentElement.focus();

        Dialog.visibleCounter++;

        if (Dialog.visibleCounter == 1) {

			document.body.classList.add("stop-scrolling");
			document.addEventListener("touchmove", Dialog.disableScroll);

        }

        Dialog.resize(dialogElement);

    }

    static hide(parameter, callback) {

        var dialogElement;
        var blockerElement;
        var contentElement;

        if(parameter instanceof Dialog) {

            dialogElement = parameter.dialogElement;
            blockerElement = parameter.blockerElement;
            contentElement = parameter.contentElement;

        } else {

            dialogElement = Dialog.getDialogElement(parameter);
            blockerElement = dialogElement.getElementsByClassName("dialogBlocker")[0];
            contentElement = dialogElement.getElementsByClassName("dialogContent")[0];

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
            
            if(callback) {

                callback();

            }

            if(this.destroyOnHide) {

                document.removeChild(dialogElement);

            }

            Dialog.visibleCounter--;

            if (Dialog.visibleCounter <= 0) {

                document.body.classList.remove("stop-scrolling");
                document.removeEventListener("touchmove", Dialog.disableScroll);
    
            }

		}, 200);

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
Dialog.URL = "dialog";


window.addEventListener("resize", Dialog.resizeAll);
document.addEventListener("DOMContentLoaded", Dialog.resizeAll);

