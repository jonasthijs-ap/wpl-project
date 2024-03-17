/*
    Dit kleine script is nodig om de functionaliteit van de homepagina, waarbij de gebruiker de boodschap krijgt
    of er al dan niet minifigs in de wachtrij staan om gesorteerd te worden, mogelijk te maken.
    
    Zonder dit script wordt de modal niet automatisch ingeladen bij het laden van de pagina.
*/

let modalHomepage = new bootstrap.Modal(document.getElementById("modal-homepage"), {});
modalHomepage.toggle();