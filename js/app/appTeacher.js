// Javascript fuer app.php bei Lehrpersonen (mit Klassen und Schuelern)

cache.classes = [];
cache.rootClasses = undefined;

function showRootClasses() {

    path.push({ type: TYPE_CLASS, isRoot: true, isForeign: false });

    if (typeof (localStorage) !== undefined) localStorage.setItem("path", JSON.stringify(path));

    loadElementAndPrint();

}

function showForeignClasses() {

    path.push({ type: TYPE_CLASS, isRoot: true, isForeign: true });

    if (typeof (localStorage) !== undefined) localStorage.setItem("path", JSON.stringify(path));

    loadElementAndPrint();

}

document.addEventListener("DOMContentLoaded", function() {



});