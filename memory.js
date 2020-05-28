// hulpfunctie om methode aan een functie-prototype te koppelen
Function.prototype.method = function(name, func) {

    // koppel functie aan eigenschap van prototype met opgegeven naam indien het prototype nog geen eigenschap had met
    // die naam
    if (!this.prototype.hasOwnProperty(name)) {
        Object.defineProperty(
            this.prototype,
            name,
            {
                value: func,
                enumerable: false
            }
        );
    }

    // geef functie terug zodat method calls aaneengeschakeld kunnen worden
    return this;

};

// nieuwe arraymethode die de elementen van de array willekeurig door elkaar schudt (implementeert Fisher-Yates
// algoritme in place, zie: http://bost.ocks.org/mike/shuffle/compare.html)
Array.method("shuffle", function() {

    let huidigeIndex = this.length;

    while(huidigeIndex) {

        // kies willekeurige index die kleiner is dan de huidige index
        const willekeurigeIndex = Math.floor(Math.random() * huidigeIndex);

        // schuif huidige index één positie naar links op; hierdoor kan willekeurige index gelijk zijn aan huidige
        // index, waardoor element op huidige index op zijn plaats blijft staan
        huidigeIndex -= 1;

        // verwissel elementen op huidige index en willekeurig gekozen index die kleiner of gelijk is aan huidige index
        const tijdelijkeWaarde = this[huidigeIndex];
        this[huidigeIndex] = this[willekeurigeIndex];
        this[willekeurigeIndex] = tijdelijkeWaarde;

    }

    // geef een referentie naar de array terug, zodat arraymethoden kunnen aaneengeschakeld worden
    return this;

});

class Memory {

    constructor(args) {

        // status van het spelbord wordt grotendeels in het DOM element met de opgegeven id bijgehouden; de rest van de
        // status wordt bijgehouden in objecteigenschappen van de klasse Memory, waardoor meerdere spelborden binnen één
        // webpagina onafhankelijk van elkaar werken
        this.$spelbord = $(args.selector);

        // dialoogvenster dat gebruikt wordt om foutboodschappen te tonen
        this.$dialoogvenster = new MemoryDialog(args.dialoogvenster);

        // array van afbeeldingen die op tegels kunnen geplaatst worden
        this.afbeeldingen = args.afbeeldingen.split(",");

        // objecteigenschap die bijhoudt welke tegels reeds geselecteerd werden
        this.geselecteerd = [];

        // timer die ingesteld wordt als 2 tegels met verschillende beeldzijde geselecteerd werden; bij het afvuren van
        // de timer worden de tegels terug met hun rugzijde naar boven gedraaid
        this.timer = undefined;

        // grootte van spelbord instellen volgens gegeven aantal rijen en kolommen
        this.rijen = 4;       // standaard aantal rijen
        this.kolommen = 6;    // standaard aantal kolommen
        this.grootte(args.rijen, args.kolommen);

        // start het spel
        this.start();

    }

    // methode die toelaat om het aantal rijen en/of kolommen te wijzigen
    grootte(rijen, kolommen) {

        try {

            // aantal tegels moet even zijn
            assert(
                (rijen * kolommen) % 2 === 0,
                'Spelbord moet een even aantal tegels bevatten.'
            );

            // spelbord moet minstens één rij hebben
            assert(
                rijen >= 1,
                'Spelbord moet minstens één rij hebben.'
            );

            // spelbord moet minstens één kolom hebben
            assert(
                kolommen >= 1,
                'Spelbord moet minstens één kolom hebben.'
            );

            // er mogen maximaal dubbel zoveel tegels zijn als dat er afbeeldingen voorhanden zijn
            assert(
                (rijen * kolommen) <= 2 * this.afbeeldingen.length,
                'Er mogen maximaal dubbel zoveel tegels zijn als dat er ' +
                'afbeeldingen voorhanden zijn.'
            );

            // nieuwe afmetingen instellen als aan alle voorwaarden voldaan is
            this.rijen = rijen;
            this.kolommen = kolommen;

        } catch(e) {

            this.$dialoogvenster.modal("warning", e.message);

        }

    }

    start() {

        // bij aanvang van een nieuw spel moet een eventueel geactiveerde timer terug gedeactiveerd worden
        if (this.geselecteerd.length === 2) {
            window.clearTimeout(this.timer);
        }

        // bij aanvang van een nieuw spel zijn er geen geselecteerde tegels
        this.geselecteerd = [];

        // kies willekeurig n verschillende afbeeldingen, met n gelijk aan de helft van het totaal aantal tegels op het
        // spelbord; maak een array die van elke gekozen afbeelding twee exemplaren bevat en schudt de afbeelingen
        // willekeurig door elkaar
        let spelbord = this.afbeeldingen.shuffle().slice(0, (this.rijen * this.kolommen) / 2);
        spelbord = [...spelbord, ...spelbord].shuffle();

        // voeg een rooster van tegels toe aan het spelbord
        this.$spelbord.empty();
        const tabel = $("<table>");
        this.$spelbord.append(tabel);
        let rij;
        spelbord.forEach(
            (tegel, index) => {
                console.log(tegel);
                if (index % this.kolommen === 0) {
                    rij = $("<tr>");
                    tabel.append(rij);
                }
                const cel = $("<td>");
                rij.append(cel);
                const element = $("<div>");
                element.addClass("tegel")
                    .addClass("rugzijde")
                    .attr("data-tegel", `${tegel}`)
                    .attr("data-index", `${index}`)
                    .attr("style", `background:url(images/filesZip/${tegel}.JPG); background-size: cover;`);
                cel.append(element);
            }
        );

        // koppel een click event listener aan elke tegel
        $(".tegel", this.$spelbord).click(this.klikTegel.bind(this));

    }

    // methode die wordt aangeroepen bij het aanklikken van een tegel
    klikTegel(event) {

        // bepaal de tegel die werd aangeklikt
        let $tegel = $(event.target);

        // doe niets als aangeklikt tegel al met beeldzijde naar boven ligt
        if (!$tegel.hasClass("rugzijde")) {
            return;
        }

        // selecteer alle instanties van de aangeklikte tegel
        const index = $tegel.data("index");
        $tegel = $(`[data-index="${index}"]`, this.$spelbord);

        // draai alle instanties van de aangeklikte tegel
        this.draaiTegel($tegel);

        // start een nieuw spel indien alle tegels met de beeldzijde naar boven gedraaid werden
        // (maw er zijn geen tegels meer die met de rugzijde naar boven liggen)
        if ($(".rugzijde", this.$spelbord).length === 0) {
            this.timer = window.setTimeout(
                () => {
                    this.$dialoogvenster.modal(
                        "success",
                        "Er wordt een nieuw spel gestart.",
                        "Goed gedaan"
                    );
                    this.start();
                },
                500
            );
        }

    }

    // leg een tegel met de beeldzijde naar boven
    draaiTegel($tegel) {

        // ga na of er twee tegels geselecteerd zijn, die met een verschillende beeldzijde naar boven liggen, en die aan
        // het wachten zijn totdat ze terug met hun rugzijde naar boven gedraaid zouden worden; in dat geval moeten ze
        // nu onmiddellijk terug omgedraaid worden
        if (this.geselecteerd.length === 2) {

            // verwijder de timer
            window.clearTimeout(this.timer);

            // draai de geselecteerde tegels onmiddellijk terug met hun rugzijde naar boven
            this.herstelTegels();

        }

        // leg aangeklikte tegel met de beeldzijde naar boven
        $tegel.removeClass("rugzijde");

        // selecteer de aangeklikt tegel
        this.geselecteerd.push($tegel);

        // bepaal wat er moet gebeuren als er twee tegels geselecteerd zijn
        if (this.geselecteerd.length === 2) {

            const tegel1 = this.geselecteerd[0].data("tegel");
            const tegel2 = this.geselecteerd[1].data("tegel");

            if (tegel1 === tegel2) {
                // tegels hebben dezelfde beeldzijde: tegels blijven omgedraaid en we kunnen nieuwe tegels beginnen
                // selecteren
                this.geselecteerd = [];
            } else {
                // tegels hebben verschillende beeldzijde: tegels moeten na 750ms terug omgedraaid worden of totdat er
                // een andere tegel wordt aangeklikt (zie draaiTegel)
                this.timer = window.setTimeout(
                    this.herstelTegels.bind(this),
                    750
                );
            }

        }

    }

    // leg de geselecteerde tegels terug met hun rugzijde naar boven
    herstelTegels() {

        // leg geselecteerde tegels met hun rugzijde naar boven
        this.geselecteerd[0].addClass("rugzijde");
        this.geselecteerd[1].addClass("rugzijde");

        // er zijn nu geen geselecteerde tegels meer
        this.geselecteerd = [];

    }

}

function assert(voorwaarde, boodschap) {

    if (!voorwaarde) {
        throw {
            name: "AssertionError",
            message: boodschap
        }
    }

}

class MemoryDialog {

    constructor(dialog) {
        this.$dialog = $(dialog);
    }

    modal(soort, boodschap, titel) {

        // componenten van dialoogvenster selecteren
        const $header = $(".modal-header", this.$dialog);
        const $title = $(".modal-title", this.$dialog);
        const $body = $(".modal-body p", this.$dialog);
        const $button = $(".btn", this.$dialog);

        // standaard titels instellen voor verschillende soorten dialoogvensters
        const titels = {
            "primary": "Informatie",
            "success": "Succes",
            "info": "Informatie",
            "warning": "Waarschuwing",
            "danger": "Gevaar",
        };

        // titel instellen
        titel = titel || titels[soort] || "";
        $title.html(titel);

        // boodschap instellen
        $body.html(boodschap);

        // kleurscheme instellen op basis van soort dialoogvenster
        for (let soort2 in titels) {
            if (soort2 === soort) {
                $header.addClass(`bg-${soort}`);
                $body.addClass(`text-${soort}`);
                $button.addClass(`btn-${soort}`);
            } else {
                $header.removeClass(`bg-${titel}`);
                $body.removeClass(`text-${titel}`);
                $button.removeClass(`btn-${titel}`);
            }
        }

        // dialoogvenster weergeven
        this.$dialog.modal();

    }

}
