class ButtonSelect {

    constructor(element, change = undefined, multiple = false) {
        
        this.element = element;
        this.buttons = element.children;

        this.multiple = multiple;

        if(typeof(change) === "function") {

            this.change = change;

        }
        
        for(var i = 0; i < this.buttons.length; i++) {
            
            this.buttons[i].addEventListener("click", ButtonSelect.prototype.click.bind(this));

        }

    }


    click(event) {

        var targetElement = event.target;

        if(this.multiple) {

            targetElement.classList.toggle("unselected");

        } else {

            for(var i = 0; i < this.buttons.length; i++) {
            
                this.buttons[i].classList.add("unselected");
    
            }

            targetElement.classList.remove("unselected");

        }

        var index;

        for(var i = 0; i < this.buttons.length; i++) {

            if(targetElement === this.buttons[i]) {

                index = i;
                break;

            }

        }

        if(this.change) {

            this.change(index, !this.buttons[i].classList.contains("unselected"));

        }

    }

    getStates() {

        var array = [];

        for(var i = 0; i < this.buttons.length; i++) {

            array[i] = !this.buttons[i].classList.contains("unselected");

        }

        return array;

    }

    setStates(array) {

        for(var i = 0; i < this.buttons.length; i++) {

            if(array[i]) {

                this.buttons[i].classList.remove("unselected");

            } else {

                this.buttons[i].classList.add("unselected");

            }

        }

    }

    getState(index) {

        return !this.buttons[index].contains("unselected");

    }


    select(index, withEvent) {

        if(!this.multiple) {

            for(var i = 0; i < this.buttons.length; i++) {
            
                this.buttons[i].classList.add("unselected");
    
            }

        }

        this.buttons[index].classList.remove("unselected");

        if(withEvent && this.change) {

            this.change(index, true);

        }

    }

    unselect(index, withEvent) {

        this.buttons[index].classList.add("unselected");

        if(withEvent && this.change) {

            this.change(index, false);

        }

    }

    toggle(index, withEvent) {

        if(this.buttons[index].classList.contains("unselected")) {

            this.select(index, withEvent);

        } else {

            this.unselect(index, withEvent);

        }

    }








}