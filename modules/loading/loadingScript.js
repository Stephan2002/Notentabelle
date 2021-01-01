
class Loading {

	/*
		types:
			semi-transparent (default)
			transparent
			solid

	*/

	static create(parentElement = null, type = undefined, zIndex = 10) {
		
		if(!parentElement) {

			parentElement = document.body;
			var isBody = true;

		}

		var element = document.createElement("DIV");

		element.classList.add("loadingElement");
		element.tabIndex = "0";
		element.style.display = "flex";
		element.style.zIndex = zIndex;

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

		var loadingAnchor = document.createElement("DIV");
		loadingAnchor.classList.add("loadingAnchor");
		loadingAnchor.tabIndex = "0";
		loadingAnchor.style.outline = "none";

		element.addEventListener("keydown", function(event) { Loading.focusLoading(event, loadingAnchor, false); });
		loadingAnchor.addEventListener("keydown", function(event) { Loading.focusLoading(event, element, true); });

		if(isBody) {

			element.classList.add("isBody");

		}
		
		parentElement.insertBefore(element, parentElement.childNodes[0]);
		parentElement.append(loadingAnchor);

		element.focus();


	}

	static remove(parentElement = null) {

		if(!parentElement) {

			parentElement = document.body;
			var isBody = true;

		}

		var element = parentElement.getElementsByClassName("loadingElement")[0];
		var loadingAnchor = parentElement.getElementsByClassName("loadingAnchor")[0];

		if(element === undefined) {

			return;

		}

		parentElement.removeChild(element);
		parentElement.removeChild(loadingAnchor);

	}

	static show(parentElement = null, type = undefined, createOnMissing = true, zIndex = 10) {

		if(!parentElement) {

			parentElement = document.body;
			var isBody = true;

		}

		var element = parentElement.getElementsByClassName("loadingElement")[0];
		var loadingAnchor = parentElement.getElementsByClassName("loadingAnchor")[0];

		if(element === undefined) {

			if(createOnMissing) {

				this.create(isBody ? null : parentElement, type, zIndex);

			} else {

				return;

			}

		} else {

			element.style.opacity = 1;

			if(type !== undefined) {

				element.classList.remove("solid");
				element.classList.remove("transparent");

				if(type === "solid" || type === "transparent") {

					element.classList.add(type);

				}

			}

			if(element.style.display === "none") {

				element.style.display = "flex";
				loadingAnchor.style.display = "block";
				element.focus();

			} else {

				element.focus();
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

		var element = parentElement.getElementsByClassName("loadingElement")[0];
		var loadingAnchor = parentElement.getElementsByClassName("loadingAnchor")[0];

		if(element === undefined || element.style.display === "none") {

			return;

		}

		element.style.opacity = 0;

		setTimeout(function () {

			element.style.display = "none";
			loadingAnchor.style.display = "none";
			element.blur();

			if(removeOnHide) {

				parentElement.removeChild(element);
				parentElement.removeChild(loadingAnchor);

			}

			if(isBody) {

				document.body.classList.remove("stop-scrolling-loading");
				document.body.removeEventListener("touchmove", Loading.cancelEvent);

			}

		}, 200);


	}

	static isVisible(parentElement = null, type = undefined) {

		if(!parentElement) {

			parentElement = document.body;

		}

		var element = parentElement.getElementsByClassName("loadingAnchor")[0];

		if(element !== undefined && element.style.display !== "none") {

			if(type === undefined) {

				return true;

			}

			if(element.classList.contains("solid")) {

				return type === "solid";

			} else if(element.classList.contains("transparent")) {

				return type === "transparent";

			} else {

				return type === "semi-transparent";

			}

		}

		return false;

	}

	static cancelEvent(event) {

		event.preventDefault();

	}

	static focusLoading(event, otherElement, isAfter) {

		if(event.key === "Tab") {

			if((event.shiftKey && isAfter) || (!event.shiftKey && !isAfter)) {
				
				otherElement.focus();
				event.preventDefault();

			}

		} else if(event.key === "Enter" || event.key === "Escape") {

			event.preventDefault();

		}

	}

}




