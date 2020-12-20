
class Alert extends Dialog {

	constructor(data) {
		super();

		this.data = data;
		this.destroyOnHide = true;

		do {

			this.id = Math.floor(Math.random() * 1000000);

		} while(document.getElementById("alert_" + this.id) != null);

		this.dialogElement = document.createElement("DIV");
		this.dialogElement.classList.add("dialog");
		this.dialogElement.id = "alert_" + this.id;
		this.dialogElement.style.display = "none";

		this.contentElement = document.createElement("DIV");
		this.contentElement.classList.add("dialogContent");
		this.contentElement.tabIndex = "0";

		this.blockerElement = document.createElement("DIV");
		this.blockerElement.classList.add("dialogBlocker");
		this.blockerElement.style.display = "none";

		this.dialogElement.appendChild(this.contentElement);
		this.dialogElement.appendChild(this.blockerElement);

		document.body.appendChild(this.dialogElement);

		this.initialize(this.dialogElement, false, false);

		if (data.type === "info") {

			if (data.title == undefined) {

				data.title = "Aktion ausgeführt!";

			}

			if (data.description == undefined) {

				data.description = "Aktion erfolgreich ausgeführt.";

			}

			if (data.icon == undefined) {

				data.icon = "info";

			}

			var icon = document.createElement("IMG");
			icon.src = Alert.URL + "/img/" + data.icon + ".svg";
			icon.draggable = false;
			this.contentElement.appendChild(icon);

			var title = document.createElement("H2");
			title.appendChild(document.createTextNode(data.title));
			this.contentElement.appendChild(title);

			var description = document.createElement("P");
			description.classList.add("description");
			description.innerHTML = data.description.replace(/\n/g, "<br />");
			this.contentElement.appendChild(description);

			var button = document.createElement("BUTTON");
			button.classList.add("button_big");
			button.classList.add("positive");
			button.classList.add("lastDialogElement");
			button.appendChild(document.createTextNode(data.OKButtonText || "OK"));

			if (typeof(data.OKAction) === "function") {

				button.addEventListener("click", data.OKAction);

			}

			button.addEventListener("click", Dialog.prototype.hide.bind(this));

			this.hideOnEnter = data.enterAsOK === undefined ? true : data.enterAsOK;
			this.hideOnEsc = data.escAsCancel === undefined ? true : data.escAsCancel;

			if(this.hideOnEnter) this.OKAction = data.OKAction;
			if(this.hideOnEsc) this.cancelAction = data.OKAction;

			this.contentElement.appendChild(button);

		} else if (data.type === "confirm") {

			if (data.title == undefined) {

				data.title = "Sicher?";

			}

			if (data.description == undefined) {

				data.description = "Aktion wirklich ausführen?";

			}

			if (data.icon == undefined) {

				data.icon = "question";

			}

			var icon = document.createElement("IMG");
			icon.src = Alert.URL + "/img/" + data.icon + ".svg";
			icon.draggable = false;
			this.contentElement.appendChild(icon);

			var title = document.createElement("H2");
			title.appendChild(document.createTextNode(data.title));
			this.contentElement.appendChild(title);

			var description = document.createElement("P");
			description.classList.add("description");
			description.innerHTML = data.description.replace(/\n/g, "<br />");
			this.contentElement.appendChild(description);

			var buttonGroup = document.createElement("DIV");

			var button = document.createElement("BUTTON");
			button.classList.add("button_medium");
			button.classList.add("negative");
			button.classList.add("secondLastDialogElement");
			button.appendChild(document.createTextNode(data.cancelButtonText || "Abbrechen"));

			if (typeof(data.cancelAction) === "function") {

				button.addEventListener("click", data.cancelAction);

			}

			button.addEventListener("click", Dialog.prototype.hide.bind(this));

			buttonGroup.appendChild(button);

			button = document.createElement("BUTTON");
			button.classList.add("button_medium");
			button.classList.add("positive");
			button.classList.add("lastDialogElement");
			button.appendChild(document.createTextNode(data.OKButtonText || "OK"));

			if (typeof(data.OKAction) === "function") {

				button.addEventListener("click", data.OKAction);

			}

			button.addEventListener("click", Dialog.prototype.hide.bind(this));
			buttonGroup.appendChild(button);

			this.hideOnEnter = data.enterAsOK === undefined ? true : data.enterAsOK;
			this.hideOnEsc = data.escAsCancel === undefined ? true : data.escAsCancel;

			if(this.hideOnEnter) this.OKAction = data.OKAction;
			if(this.hideOnEsc) this.cancelAction = data.cancelAction;

			this.contentElement.appendChild(buttonGroup);

		} else if (data.type === "options") {

			if (data.title == undefined) {

				data.title = "Auswahl";

			}

			if (data.description == undefined) {

				data.description = "Bitte Option auswählen.";

			}

			if (data.icon == undefined) {

				data.icon = "question";

			}

			var icon = document.createElement("IMG");
			icon.src = Alert.URL + "/img/" + data.icon + ".svg";
			icon.draggable = false;
			this.contentElement.appendChild(icon);

			var title = document.createElement("H2");
			title.appendChild(document.createTextNode(data.title));
			this.contentElement.appendChild(title);

			var description = document.createElement("P");
			description.classList.add("description");
			description.innerHTML = data.description.replace(/\n/g, "<br />");
			this.contentElement.appendChild(description);

			var button;

			for (var i = 0; i < data.buttons.length; i++) {

				var currentButton = data.buttons[i];

				button = document.createElement("BUTTON");
				button.classList.add("button_big");
				button.innerHTML = currentButton.name;

				if (
					currentButton.color === "positive" || 
					currentButton.color === "negative" || 
					currentButton.color === "neutral" || 
					currentButton.color === "option"
				) {

					button.classList.add(currentButton.color);

				} else {

					if (currentButton.color == undefined) {

						button.classList.add("positive");

					}

					button.style.backgroundColor = currentButton.color;
					button.style.borderColor = currentButton.color;

				}

				if (currentButton.fontColor != undefined) {

					button.style.color = currentButton.fontColor;

				}

				button.addEventListener("click", currentButton.action);
				button.addEventListener("click", Dialog.prototype.hide.bind(this));

				this.contentElement.appendChild(button);

			}

			if (data.hasCancelButton) {

				button = document.createElement("BUTTON");
				button.classList.add("button_big");
				button.classList.add("negative");
				button.classList.add("lastDialogElement");
				button.style.marginTop = "8px";
				button.appendChild(document.createTextNode(data.cancelButtonText || "Abbrechen"));

				if (typeof(data.cancelAction) === "function") {

					button.addEventListener("click", data.cancelAction);

				}

				button.addEventListener("click", Dialog.prototype.hide.bind(this));

				this.contentElement.appendChild(button);

				this.hideOnEsc = data.escAsCancel === undefined ? true : data.escAsCancel;

			}

			if(this.hideOnEsc) this.cancelAction = data.cancelAction;

			button.classList.add("lastDialogElement");

		} else if (data.type === "html") {

			this.contentElement.innerHTML = data.html;

			this.hideOnEnter = data.enterAsOK === undefined ? false : data.enterAsOK;
			this.hideOnEsc = data.escAsCancel === undefined ? false : data.escAsCancel;

			if(this.hideOnEnter) this.OKAction = data.OKAction;
			if(this.hideOnEsc) this.cancelAction = data.cancelAction;

		} else if (data.type === "input") {

			if (data.title == undefined) {

				data.title = "Eingabe";

			}

			if (data.description == undefined) {

				data.description = "Bitte Daten eingeben.";

			}

			if (data.icon == undefined) {

				data.icon = "question";

			}

			if (data.inputType == undefined) {

				data.inputType = "text";

			}

			if (data.placeholder == undefined) {

				data.placeholder = "";

			}

			if (data.value == undefined) {

				data.value = "";

			}

			var icon = document.createElement("IMG");
			icon.src = Alert.URL + "/img/" + data.icon + ".svg";
			icon.draggable = false;
			this.contentElement.appendChild(icon);

			var title = document.createElement("H2");
			title.appendChild(document.createTextNode(data.title));
			this.contentElement.appendChild(title);

			var description = document.createElement("P");
			description.classList.add("description");
			description.innerHTML = data.description.replace(/\n/g, "<br />");
			this.contentElement.appendChild(description);

			var input = document.createElement("INPUT");
			input.type = data.inputType;
			input.placeholder = data.placeholder;
			input.value = data.value;
			input.classList.add("dialogInput");
			this.contentElement.appendChild(input);

			var buttonGroup = document.createElement("DIV");
			buttonGroup.classList.add("buttonGroup");

			if(data.hasCancelButton) {

				var button = document.createElement("BUTTON");
				button.classList.add("button_medium");
				button.classList.add("negative");
				button.classList.add("secondLastDialogElement");
				button.appendChild(document.createTextNode(data.cancelButtonText || "Abbrechen"));

				if (typeof(data.cancelAction) === "function") {

					button.addEventListener("click", function (event) {

						data.cancelAction(event.target.parentNode.getElementsByTagName("INPUT")[0].value, event);

					});

				}

				button.addEventListener("click", Dialog.prototype.hide.bind(this));
				buttonGroup.appendChild(button);

				this.hideOnEsc = data.escAsCancel === undefined ? true : data.escAsCancel;

			}

			var button = document.createElement("BUTTON");

			if(data.hasCancelButton) {

				button.classList.add("button_medium");

			} else {

				button.classList.add("button_big");

			}

			button.classList.add("positive");
			button.classList.add("lastDialogElement");
			button.appendChild(document.createTextNode(data.OKButtonText || "OK"));

			if (typeof(data.OKAction) === "function") {

				button.addEventListener("click", function (event) {

					data.OKAction(event.target.parentNode.getElementsByTagName("INPUT")[0].value, event);

				});

			}

			button.addEventListener("click", Dialog.prototype.hide.bind(this));
			
			if(data.hasCancelButton) {

				buttonGroup.appendChild(button);
				this.contentElement.appendChild(buttonGroup);

			} else {

				button.classList.add("withMargin");
				this.contentElement.appendChild(button);

			}

			if(this.hideOnEnter) {

				this.OKAction = function (event) {

					data.OKAction(event.target.parentNode.getElementsByTagName("INPUT")[0].value, event);

				};

			}

			if(this.hideOnEsc) {

				this.cancelAction = function (event) {

					data.cancelAction(event.target.parentNode.getElementsByTagName("INPUT")[0].value, event);

				};

			}

		}

		Dialog.show(this);

		if(data.type === "input") {

			input.focus();

		}

	}

	close() {

		Dialog.hide(this);

	}

	static close(parameter) {

		if(typeof(parameter) === "number") {

			Dialog.hide(document.getElementById("alert_" + this.id));

		} else {

			Dialog.hide(parameter);

		}

	}



}






