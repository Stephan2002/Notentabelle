
class Loading {

	constructor(solid, parentElement) {

		if(parentElement === undefined) {

			if(Loading.exists) {

				return;

			}

			Loading.exists = true;

		} else {

			if(parentElement instanceof HTMLElement) {
				
				if(parentElement.getElementsByClassName("loadingElement").length == 0) {

					this.parentElement = parentElement;

				} else {

					return;

				}

			} else {

				return;

			}

		}

		this.element = document.createElement("DIV");

		if(parentElement === undefined) {

			this.element.id = "loading";
			this.element.classList.add("loading");

		} else {

			this.element.classList.add("loadingElement");

		}

		this.element.tabIndex = "-1";

		if(solid) {

			this.element.classList.add("solid");

		}
		
		this.element.innerHTML = 
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

		if(parentElement === undefined) {

			this.element.addEventListener("touchmove", function (event) {

				event.stopPropagation();

			});

			document.body.addEventListener("keydown", cancelEvent);

			document.body.appendChild(this.element);

			document.body.classList.add("stop-scrolling-loading");
			document.addEventListener("touchmove", Loading.cancelEvent, { passive: false });

			this.element.focus();

		} else {

			if(parentElement instanceof HTMLElement) {

				parentElement.appendChild(this.element);

			}

		}

	}

	close() {

		Loading.close(this.parentElement);

	}


	static close(parentElement) {

		var element;

		if(parentElement === undefined) {

			if(!Loading.exists) {

				return;

			}

			Loading.exists = false;

			element = document.getElementById("loading");

		} else {

			if(parentElement instanceof HTMLElement) {
				
				if(parentElement.getElementsByClassName("loadingElement").length >= 1) {

					element = parentElement.getElementsByClassName("loadingElement")[0];

				} else {

					return;

				}

			} else {

				return;

			}

		}

		element.style.opacity = 0;

		setTimeout(function () {

			element.parentNode.removeChild(element);

		}, 200);

		if(parentElement === undefined) {

			document.body.classList.remove("stop-scrolling-loading");
			document.removeEventListener("touchmove", Loading.cancelEvent);
			document.body.removeEventListener("keydown", cancelEvent);

		}

	}

	static cancelEvent(event) {

		event.preventDefault();

	}

}

Loading.exists = false;




