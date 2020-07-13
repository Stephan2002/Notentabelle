
class Loading {

	static create(parentElement = null, type = undefined) {
		
		if(!parentElement) {

			parentElement = document.body;
			var isBody = true;

		}

		var element = document.createElement("DIV");

		element.classList.add("loadingElement");
		element.tabIndex = "-1";
		element.style.display = "flex";
		element.addEventListener("keydown", Loading.cancelEvent);
		
		element.innerHTML = 
			'<h1>Laden...</h1>' +
            '<svg height="200" width="200" viewbox="-100 -100 200 200">' +
            '    <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(0, 0, 0)"   stroke-opacity="0.4"/>' +
            '    <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(36, 0, 0)"  stroke-opacity="0.4"/>' +
            '    <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(72, 0, 0)"  stroke-opacity="0.4"/>' +
            '    <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(108, 0, 0)" stroke-opacity="0.4"/>' +
            '    <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(144, 0, 0)" stroke-opacity="0.5"/>' +
            '    <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(180, 0, 0)" stroke-opacity="0.6"/>' +
            '    <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(216, 0, 0)" stroke-opacity="0.7"/>' +
            '    <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(252, 0, 0)" stroke-opacity="0.8"/>' +
            '    <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(288, 0, 0)" stroke-opacity="0.9"/>' +
            '    <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(324, 0, 0)" stroke-opacity="1"/>' +
			'</svg>';
			
		if(type === "solid" || type === "transparent") {

			element.classList.add(type);

		}

		if(isBody) {

			element.classList.add("isBody");

		}
		
		parentElement.appendChild(element);

		element.focus();


	}

	static remove(parentElement = null) {

		if(!parentElement) {

			parentElement = document.body;
			var isBody = true;

		}

		var element = parentElement.querySelector(":scope > .loadingElement");

		if(!element) {

			return;

		}

		parentElement.removeChild(element);

	}

	static show(parentElement = null, type = undefined, createOnMissing = true) {

		if(!parentElement) {

			parentElement = document.body;
			var isBody = true;

		}

		var element = parentElement.querySelector(":scope > .loadingElement");

		if(!element) {

			if(createOnMissing) {

				this.create(isBody ? null : parentElement, type);

			} else {

				return;

			}

		} else {

			if(element.style.display === "none") {

				element.style.display = "flex";
				element.style.opacity = 1;

				if(type !== undefined) {

					element.classList.remove("solid");
					element.classList.remove("transparent");

					if(type === "solid" || type === "transparent") {

						element.classList.add(type);

					}

				}

				element.focus();

			} else {

				return;

			}

		}

		if(isBody) {

			document.body.classList.add("stop-scrolling-loading");
			document.body.addEventListener("touchmove", Loading.cancelEvent, { passive: false });

		}

	}

	static hide(parentElement = null, removeOnHide = false) {

		if(!parentElement) {

			parentElement = document.body;
			var isBody = true;

		}

		var element = parentElement.querySelector(":scope > .loadingElement");

		if(!element || element.style.display === "none") {

			return;

		}

		element.style.opacity = 0;

		setTimeout(function () {

			element.style.display = "none";
			element.blur();

			if(removeOnHide) {

				parentElement.removeChild(element);

			}

			if(isBody) {

				document.body.classList.remove("stop-scrolling-loading");
				document.removeEventListener("touchmove", Loading.cancelEvent);

			}

		}, 200);


	}

	static cancelEvent(event) {

		event.preventDefault();

	}

}




