<!-- Dient dazu, ein Ladezeichen einzublenden, bis die Seite vollstaendig geladen wurde. Wird auf allen Seiten inkludiert. -->
<div id="preload">
    <style>
        body.stop-scrolling-preload {
            overflow: hidden;
        }

        #preload h1 {
            color: white;
            margin: 15px;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 25px;
        }

        #preload {
            background-color: rgb(100,100,100);
            position: fixed;
            top: 0px;
            left: 0px;
            height: 100%;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            z-index: 10;
            transition: opacity 0.2s;
        }

        #preload svg {
            background-color: transparent;
            animation-name: preloadAnimation;
            animation-duration: 1s;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
            max-width: 100px;
            max-height: 100px;
            width: 20%;
        }

        #preload svg line {
            stroke: white;
            stroke-width: 18px;
            stroke-linecap: round;
        }

        @keyframes preloadAnimation {
            0%      {transform: rotate(0deg);}
            9.999%  {transform: rotate(0deg);}
            10%     {transform: rotate(36deg);}
            19.999% {transform: rotate(36deg);}
            20%     {transform: rotate(72deg);}
            29.999% {transform: rotate(72deg);}
            30%     {transform: rotate(108deg);}
            39.999% {transform: rotate(108deg);}
            40%     {transform: rotate(144deg);}
            49.999% {transform: rotate(144deg);}
            50%     {transform: rotate(180deg);}
            59.999% {transform: rotate(180deg);}
            60%     {transform: rotate(216deg);}
            69.999% {transform: rotate(216deg);}
            70%     {transform: rotate(252deg);}
            79.999% {transform: rotate(252deg);}
            80%     {transform: rotate(288deg);}
            89.999% {transform: rotate(288deg);}
            90%     {transform: rotate(324deg);}
            99.999% {transform: rotate(324deg);}
        }
    </style>

    <h1>Laden...</h1>

    <svg height="200" width="200" viewbox="-100 -100 200 200">
        <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(0, 0, 0)"   stroke-opacity="0.4"/>
        <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(36, 0, 0)"  stroke-opacity="0.4"/>
        <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(72, 0, 0)"  stroke-opacity="0.4"/>
        <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(108, 0, 0)" stroke-opacity="0.4"/>
        <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(144, 0, 0)" stroke-opacity="0.5"/>
        <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(180, 0, 0)" stroke-opacity="0.6"/>
        <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(216, 0, 0)" stroke-opacity="0.7"/>
        <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(252, 0, 0)" stroke-opacity="0.8"/>
        <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(288, 0, 0)" stroke-opacity="0.9"/>
        <line x1="0" y1="-90" x2="0" y2="-50" transform="rotate(324, 0, 0)" stroke-opacity="1"/>
    </svg>
    
    <script>
        document.body.classList.add("stop-scrolling-preload");

        document.getElementById("preload").addEventListener("touchmove", function(event) {
            event.preventDefault();
        });

        function preload_preventTyping(event) {
            event.preventDefault();
        }

        document.addEventListener("keydown", preload_preventTyping);

        window.addEventListener("load", function() {
            var element = document.getElementById("preload");
            element.style.opacity = "0";
            setTimeout(function() {
                document.body.removeChild(element);
                document.body.classList.remove("stop-scrolling-preload");
                document.removeEventListener("keydown", preload_preventTyping);
            }, 200);
        });
    </script>
</div>