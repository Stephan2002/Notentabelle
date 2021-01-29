<?php
    http_response_code(503);
    header("Retry-After: 120");
?>
<!-- Fehlerseite, wenn die Webapplikation passwortgeschuetzt ist -->
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <style>
            body {

                box-sizing: border-box;
                width: 100%;
                font-size: 16px;
                margin: 0px;
                font-family: Arial, Helvetica, sans-serif;
                text-align: center;


            }

            .text {

                padding: 10px 25px;

            }

            .container {

                width: 80%;
                max-width: 300px;
                display: block;
                margin: 40px auto;

            }

            p {
	
                margin: 0px;
                
            }

            .blankLine {
                
                margin-top: 18px;
                
            }

            .blankLine_small {
                
                margin-top: 5px;
                
            }

            .blankLine_big  {
                
                margin-top: 30px;
                
            }



            body {
                
                padding-top: 50px;
                font-family: Arial, Sans-serif;

            }

            h1 {
                
                color: white;
                font-size: 24px;
                font-weight: bold;
                margin: 0px;
                white-space: nowrap;
                transition: opacity 0.2s;
                
            }

            nav {
                
                position: fixed;
                width: 100%;
                background-color: #4CAF50;
                height: 50px;
                text-align: right;
                line-height: 50px;
                top: 0px;
                z-index: 2;
                
            }

            nav h1 {

                text-align: center;

            }


            #header {
                
                width: calc(100% - 100px);
                height: 50px;
                display: inline-block;
                overflow: hidden;
                
            }

            #logo {
                
                margin: 0px;
                float: right;
                width:40px;
                height: 40px;
                padding: 5px;
                -webkit-transition-duration: 0.4s;
                transition-duration: 0.4s;
                outline: none;
                
            }

            #error {

                margin: 40px 0px 0px;
                width: 50%;
                max-width: 200px;

            }



            h2 {

                margin-top: 30px;

            }

        </style>
        <title>Notentabelle</title>
    </head>
    
    <body>
        <nav>
            <div id="header">
                <h1>Wartungsarbeiten</h1>
            </div>
            
            <svg id="logo" version="1.1" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
            <g>
            <text x="25.796875" y="102.17709" style="fill:#ccaa00;font-family:Arial;font-feature-settings:normal;font-size:106.67px;font-variant-caps:normal;font-variant-ligatures:normal;font-variant-numeric:normal;font-weight:bold;letter-spacing:0px;line-height:1.25;word-spacing:0px" xml:space="preserve"><tspan x="25.796875" y="102.17709">N</tspan></text>
            <g style="stroke:#ff0000">
            <path d="m1 2.4984h30.956" style="fill:#ff0000;stroke-width:3;stroke:#ff0000"/>
            <path d="m2.4779 31.956v-30.956" style="fill:#ff0000;stroke-width:3;stroke:#ff0000"/>
            </g>
            <g transform="rotate(-90 64.011 63.967)" style="stroke:#0000ff">
            <path d="m1 2.4984h30.956" style="fill:#ff0000;stroke-width:3;stroke:#0000ff"/>
            <path d="m2.4779 31.956v-30.956" style="fill:#ff0000;stroke-width:3;stroke:#0000ff"/>
            </g>
            <g transform="rotate(90 63.982 64.018)" style="stroke:#ffff00">
            <path d="m1 2.4984h30.956" style="fill:#ff0000;stroke-width:3;stroke:#ffff00"/>
            <path d="m2.4779 31.956v-30.956" style="fill:#ff0000;stroke-width:3;stroke:#ffff00"/>
            </g>
            <g transform="rotate(180 64 64)" style="stroke:#00ff00">
            <path d="m1 2.4984h30.956" style="fill:#ff0000;stroke-width:3;stroke:#00ff00"/>
            <path d="m2.4779 31.956v-30.956" style="fill:#ff0000;stroke-width:3;stroke:#00ff00"/>
            </g>
            </g>
            </svg>
        </nav>
        
        <svg id="error" version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g>
        <rect id="canvas_background" x="-1" y="-1" width="102" height="102" fill="#ffffff"/>
        <g id="canvasGrid" x="0" y="0" width="100%" height="100%" display="none" overflow="visible">
        <rect width="100%" height="100%" fill="url(#gridpattern)" stroke-width="0"/>
        </g>
        </g>
        <g>
        <ellipse cx="50" cy="50" rx="46" ry="46" fill="#fff" stroke="#ea0000" stroke-width="8"/>
        <path d="m50.698 27.098" fill="none" fill-opacity="null" opacity=".5" stroke="#00bc19" stroke-opacity="null" stroke-width="8"/>
        <path d="m72.868 30.664" fill="none" fill-opacity="null" opacity=".5" stroke="#00bc19" stroke-opacity="null" stroke-width="8"/>
        <path d="m75.349 32.059" fill="none" fill-opacity="null" opacity=".5" stroke="#00bc19" stroke-opacity="null" stroke-width="8"/>
        <text x="31.991" y="68.720001" cursor="move" fill="#000000" font-family="Helvetica, Arial, sans-serif" font-size="54" stroke="#ea0000" stroke-width="10" xml:space="preserve"/>
        <path d="m22.326 35.628 13.42-13.53 14.256 14.372 14.256-14.372 13.42 13.53-14.256 14.372 14.256 14.372-13.42 13.53-14.256-14.373-14.256 14.373-13.42-13.53 14.256-14.372-14.256-14.372z" fill="#ea0000" stroke-width="8"/>
        </g>
        </svg>
        
        <h2>Wartungsarbeiten und/oder Updates</h2>
        <div class='text'>
            <p>Es werden zur Zeit Wartungsarbeiten und/oder Updates durchgeführt.</p>
            <p class="blankLine">Notentabelle steht dementsprechend momentan nicht zur Verfügung,</p>
            <p>wird aber voraussichtlich ---Datum/Uhrzeit--- wieder verfügbar sein.</p>
        </div>
    </body>
</html>