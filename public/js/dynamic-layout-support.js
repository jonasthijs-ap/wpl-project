/* We hebben gebruik gemaakt van een JavaScript-bestand   *
 * omdat we voor het dynamisch aanpassen van de style.css *
 * aan de hand van variabele data, helaas geen TypeScript *
 * kunnen gebruiken gebruiken. Dit omdat de browser dit   *
 * niet ondersteunt. Hierdoor waren we genoodzaakt om dit *
 * script in onze <head> in te laden als JavaScript-file. */

const cards = document.getElementsByClassName("card");
let currentCard;
for (let i = 0; i < cards.length; i++) {
    currentCard = cards[i].getElementsByClassName("card-img-top")[0];
    let width = currentCard.width;
    currentCard.style.height = `${width}px`;
}