<?php

/* 

Dient dazu, einen Infobanner mit wichtigen Mitteilungen anzuzeigen.

*/

$message = "";

if($message === "") return;


?>
<div id="infoBanner">
    <style>

        #infoBanner {

            box-sizing: border-box;
            position: fixed;
            bottom: 0px;
            right: 0px;
            left: 0px;
            background-color: rgb(255, 239, 223);
            border-top: 1px solid rgb(255, 128, 0);
            padding: 5px;
            display: flex;
            align-items: center;
            font-size: 15px;

        }

        #infoBanner > img:nth-of-type(1) {

            min-width: 30px;
            height: 30px;
            width: 30px;
            margin-right: 5px;

        }

        #infoBanner > img:nth-last-of-type(1) {

            min-width: 15px;
            height: 15px;
            width: 15px;
            margin-left: 5px;
            border-radius: 100%;
            border: 3px solid transparent;
            transition: background-color 0.2s;

        }

        #infoBanner > img:nth-last-of-type(1):hover {

            background-color: rgba(0,0,0,15%);

        }

        #infoBanner > p {

            flex: 1 1 auto;

        }
    </style>

    <img src="/img/icons/warning.svg" alt=" " />

    <p><?php echo $message; ?></p>

    <img src="/img/icons/cross.svg" alt="X" onclick="removeInfoBanner();" />

    <script>
        function infoBannerResize() {

            var height = document.getElementById("infoBanner").clientHeight;

            document.body.style.paddingBottom = height + "px";

            var averageFooter = document.getElementById("averageFooter");

            if(averageFooter) {

                averageFooter.style.bottom = height + "px";

            }

        }

        function removeInfoBanner() {

            document.body.style.paddingBottom = "";

            var averageFooter = document.getElementById("averageFooter");

            if(averageFooter) {

                averageFooter.style.bottom = "";

            }

            window.removeEventListener("resize", infoBannerResize);

            document.body.removeChild(document.getElementById("infoBanner"));

        }

        window.addEventListener("resize", infoBannerResize);

        infoBannerResize();
    </script>
    <noscript><style>#infoBanner { display: none; } </style></noscript>
</div>