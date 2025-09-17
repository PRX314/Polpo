const pizzeRegionali = {
  "Liguria": [
    {
      nome: "Focaccia al formaggio di Recco",
      ingredienti: ["Pasta sottile", "Stracchino fresco", "Olio extravergine", "Sale"],
      descrizione: "Sottile, con stracchino fresco, simbolo ligure della tradizione focaccera.",
      storia: "Nata a Recco nel medioevo, è il simbolo della focaccia ligure. La pasta sottilissima racchiude il cremoso stracchino."
    },
    {
      nome: "Sardenaira (Sanremo)",
      ingredienti: ["Salsa di pomodoro", "Acciughe", "Olive taggiasche", "Capperi", "Cipolla"],
      descrizione: "Simile a una pizza rossa, con sapori intensi del mare ligure.",
      storia: "Tipica di Sanremo, deriva dalla 'pissaladière' francese ma con ingredienti liguri."
    },
    {
      nome: "Farinata sulla pizza",
      ingredienti: ["Base pizza", "Farinata di ceci", "Olio extravergine", "Pepe nero", "Rosmarino"],
      descrizione: "Base pizza/focaccia con sopra farinata di ceci, tradizione genovese.",
      storia: "Unisce due simboli liguri: la focaccia e la farinata, creando un piatto unico."
    },
    {
      nome: "Pizza con pesto genovese",
      ingredienti: ["Base bianca", "Pesto genovese DOP", "Patate", "Fagiolini", "Pinoli"],
      descrizione: "Classica pizza bianca con aggiunta di pesto ligure e patate.",
      storia: "Il pesto genovese sulla pizza rappresenta l'essenza della cucina ligure."
    },
    {
      nome: "Pizza Portofino",
      ingredienti: ["Pomodoro", "Mozzarella", "Basilico", "Gamberi", "Olio extravergine"],
      descrizione: "Pomodoro, mozzarella, basilico e gamberi; creazione turistica ma popolare nei locali della Riviera.",
      storia: "Creata per i turisti di Portofino, unisce mare e tradizione italiana."
    }
  ],

  "Piemonte": [
    {
      nome: "Pizza con bagna cauda",
      ingredienti: ["Base bianca", "Acciughe", "Aglio", "Olio extravergine", "Peperoni"],
      descrizione: "Base bianca o rossa con acciughe, aglio e olio della bagna cauda.",
      storia: "Ispirata al piatto simbolo del Piemonte, la bagna cauda, salsa calda a base di acciughe e aglio."
    },
    {
      nome: "Pizza al tartufo d'Alba",
      ingredienti: ["Crema di formaggi", "Tartufo bianco d'Alba", "Mozzarella", "Olio tartufato"],
      descrizione: "Pizza gourmet con crema di formaggi e scaglie di tartufo.",
      storia: "Alba è la capitale mondiale del tartufo bianco, ingrediente pregiato della cucina piemontese."
    },
    {
      nome: "Pizza al gorgonzola e noci",
      ingredienti: ["Mozzarella", "Gorgonzola DOP", "Noci", "Miele", "Rucola"],
      descrizione: "Diffusa nelle pizzerie piemontesi, con formaggi tipici e noci locali.",
      storia: "Il gorgonzola nasce in Lombardia ma è amato in Piemonte, abbinato alle noci delle Langhe."
    }
  ],

  "Valle d'Aosta": [
    {
      nome: "Pizza alla fontina",
      ingredienti: ["Base bianca", "Fontina DOP", "Speck valdostano", "Patate", "Timo"],
      descrizione: "Base bianca o rossa, fontina DOP e speck valdostano.",
      storia: "La fontina è il formaggio simbolo della Valle d'Aosta, prodotto sui pascoli alpini da secoli."
    },
    {
      nome: "Pizza Mont Blanc",
      ingredienti: ["Patate", "Lardo d'Arnad DOP", "Toma valdostana", "Rosmarino"],
      descrizione: "Con patate, lardo d'Arnad e toma, sapori montani autentici.",
      storia: "Prende il nome dal monte più alto d'Europa, con ingredienti tipici della montagna valdostana."
    },
    {
      nome: "Pizza ai funghi di montagna",
      ingredienti: ["Funghi porcini", "Fontina", "Speck", "Erbe di montagna"],
      descrizione: "Con funghi porcini freschi della valle e formaggi locali.",
      storia: "I funghi porcini crescono nei boschi valdostani e sono ingrediente prezioso della cucina locale."
    }
  ],

  "Lombardia": [
    {
      nome: "Pizza con gorgonzola DOP",
      ingredienti: ["Mozzarella", "Gorgonzola DOP", "Noci", "Miele"],
      descrizione: "Mozzarella e gorgonzola, simile alla 4 formaggi ma centrata sul formaggio lombardo.",
      storia: "Il gorgonzola nasce a Gorgonzola (MI) nel XII secolo, è il formaggio erborinato italiano più famoso."
    },
    {
      nome: "Pizza bresaola e rucola",
      ingredienti: ["Mozzarella", "Bresaola della Valtellina IGP", "Rucola", "Grana Padano", "Olio extravergine"],
      descrizione: "Molto diffusa nelle pizzerie lombarde, con bresaola della Valtellina.",
      storia: "La bresaola della Valtellina è un salume pregiato prodotto nelle Alpi lombarde."
    },
    {
      nome: "Pizza Milano",
      ingredienti: ["Pomodoro", "Mozzarella", "Zafferano", "Ossobuco", "Gremolada"],
      descrizione: "Pomodoro, mozzarella, zafferano e ossobuco, creazione gourmet legata alla città.",
      storia: "Ispirata al risotto alla milanese e all'ossobuco, piatti simbolo di Milano."
    },
    {
      nome: "Pizza con salame Cremona",
      ingredienti: ["Pomodoro", "Mozzarella", "Salame cremonese dolce", "Cipolla"],
      descrizione: "Pomodoro, mozzarella, salame cremonese dolce.",
      storia: "Cremona è famosa per i suoi salami dolci, tradizione che risale al Rinascimento."
    }
  ],

  "Veneto": [
    {
      nome: "Pizza radicchio e Asiago",
      ingredienti: ["Mozzarella", "Radicchio rosso di Treviso IGP", "Asiago DOP", "Noci", "Miele"],
      descrizione: "Mozzarella, radicchio rosso di Treviso stufato, Asiago DOP; molto popolare nelle pizzerie venete.",
      storia: "Il radicchio di Treviso e l'Asiago sono eccellenze venete con tradizione secolare."
    },
    {
      nome: "Pizza soppressa veneta",
      ingredienti: ["Mozzarella", "Soppressa veneta", "Peperoni", "Cipolla"],
      descrizione: "Mozzarella e soppressa tipica, a volte con peperoni o cipolla.",
      storia: "La soppressa veneta è un salume tradizionale delle zone pedemontane del Veneto."
    },
    {
      nome: "Pizza polenta e funghi",
      ingredienti: ["Base bianca", "Polenta croccante", "Funghi porcini", "Gorgonzola", "Speck"],
      descrizione: "Base bianca con dadini di polenta croccante e funghi porcini, ispirata ai sapori montani.",
      storia: "La polenta è il piatto base del Veneto montano, qui reinterpretata sulla pizza."
    },
    {
      nome: "Pizza baccalà mantecato",
      ingredienti: ["Base bianca", "Baccalà mantecato", "Cipolla di Tropea", "Olive taggiasche"],
      descrizione: "Variante bianca con crema di baccalà, tipica delle zone lagunari.",
      storia: "Il baccalà mantecato è specialità veneziana, portata dai mercanti che commerciavano con il Nord Europa."
    }
  ],

  "Friuli-Venezia Giulia": [
    {
      nome: "Pizza prosciutto di San Daniele e rucola",
      ingredienti: ["Mozzarella", "Prosciutto di San Daniele DOP", "Rucola", "Fichi", "Grana"],
      descrizione: "Mozzarella, fette di prosciutto crudo DOP e rucola.",
      storia: "San Daniele del Friuli produce uno dei prosciutti più pregiati d'Italia dal 1300."
    },
    {
      nome: "Pizza Montasio e cipolla",
      ingredienti: ["Mozzarella", "Formaggio Montasio DOP", "Cipolla rossa", "Speck"],
      descrizione: "Mozzarella, formaggio Montasio e cipolla rossa; riflette la tradizione casearia locale.",
      storia: "Il Montasio nasce sulle Alpi Giulie nel 1200, formaggio simbolo del Friuli."
    },
    {
      nome: "Pizza radicchio di Treviso",
      ingredienti: ["Mozzarella", "Radicchio di Treviso", "Speck", "Noci", "Gorgonzola"],
      descrizione: "Anche qui spesso con mozzarella e speck, sapori tipici friulani/veneti.",
      storia: "Il radicchio rosso è coltivato anche in Friuli, con tecniche tradizionali venete."
    }
  ],

  "Trentino-Alto Adige": [
    {
      nome: "Pizza speck e scamorza affumicata",
      ingredienti: ["Base bianca", "Mozzarella", "Speck dell'Alto Adige IGP", "Scamorza affumicata", "Cipolle"],
      descrizione: "Base bianca, mozzarella, speck affumicato e scamorza; classicissima pizzeria altoatesina.",
      storia: "Lo speck dell'Alto Adige unisce le tradizioni italiana e tirolese dell'affumicatura."
    },
    {
      nome: "Pizza funghi porcini e formaggi",
      ingredienti: ["Mozzarella", "Funghi porcini", "Puzzone di Moena", "Speck", "Erbe di montagna"],
      descrizione: "Mozzarella, porcini freschi e formaggi locali.",
      storia: "I porcini crescono nei boschi delle Dolomiti, tesoro dei raccoglitori locali."
    },
    {
      nome: "Pizza patate e speck",
      ingredienti: ["Base bianca", "Patate", "Speck", "Cipolle", "Rosmarino"],
      descrizione: "Variante sostanziosa, tipica delle zone montane.",
      storia: "Piatto che riflette la tradizione contadina montana, sostanzioso e nutriente."
    },
    {
      nome: "Pizza Tiroler",
      ingredienti: ["Speck", "Formaggio locale", "Uovo", "Cipolle", "Crauti"],
      descrizione: "Creazione locale con speck, formaggio e talvolta uovo a crudo.",
      storia: "Riflette la cultura tirolese dell'Alto Adige, con ingredienti della tradizione austro-ungarica."
    }
  ],

  "Emilia-Romagna": [
    {
      nome: "Pizza mortadella e pistacchi",
      ingredienti: ["Mozzarella", "Mortadella di Bologna IGP", "Pistacchi", "Stracciatella", "Basilico"],
      descrizione: "Mozzarella, mortadella di Bologna e granella di pistacchio; amatissima nelle pizzerie della regione.",
      storia: "La mortadella nasce a Bologna nel 1600, è il salume simbolo dell'Emilia."
    },
    {
      nome: "Pizza prosciutto crudo e grana",
      ingredienti: ["Mozzarella", "Prosciutto di Parma DOP", "Parmigiano-Reggiano DOP", "Rucola", "Fichi"],
      descrizione: "Mozzarella, prosciutto di Parma DOP e scaglie di Parmigiano-Reggiano.",
      storia: "Parma è patria di due DOP eccellenti: il prosciutto crudo e il Parmigiano-Reggiano."
    },
    {
      nome: "Pizza salsiccia e funghi porcini",
      ingredienti: ["Mozzarella", "Salsiccia emiliana", "Funghi porcini", "Gorgonzola", "Noci"],
      descrizione: "Diffusa in tutta l'Emilia-Romagna, riflette ingredienti tipici montani e di collina.",
      storia: "I porcini dell'Appennino emiliano sono pregiati, raccolti nei boschi di castagno."
    },
    {
      nome: "Pizza 4 formaggi emiliana",
      ingredienti: ["Mozzarella", "Gorgonzola", "Parmigiano-Reggiano", "Squacquerone", "Noci"],
      descrizione: "Mozzarella, gorgonzola, parmigiano, squacquerone; valorizzando i formaggi locali.",
      storia: "L'Emilia-Romagna è terra di grandi formaggi, dallo squacquerone al Parmigiano."
    },
    {
      nome: "Pizza verdure dell'orto",
      ingredienti: ["Pomodoro", "Mozzarella", "Zucchine", "Melanzane", "Peperoni", "Basilico"],
      descrizione: "Base rossa o bianca con zucchine, melanzane, peperoni, tipica delle zone rurali.",
      storia: "L'Emilia-Romagna è ricca di orti che forniscono verdure fresche tutto l'anno."
    }
  ],

  "Toscana": [
    {
      nome: "Pizza finocchiona e pecorino",
      ingredienti: ["Mozzarella", "Finocchiona IGP", "Pecorino toscano DOP", "Fichi", "Miele"],
      descrizione: "Mozzarella, finocchiona tipica e pecorino toscano; riflette i salumi e formaggi locali.",
      storia: "La finocchiona nasce nel Rinascimento toscano, salume aromatizzato con semi di finocchio."
    },
    {
      nome: "Pizza cinghiale e funghi",
      ingredienti: ["Base rossa", "Mozzarella", "Ragù di cinghiale", "Funghi porcini", "Rosmarino"],
      descrizione: "Base rossa, mozzarella, ragù di cinghiale e funghi porcini; molto apprezzata nelle zone interne.",
      storia: "Il cinghiale è simbolo della Maremma toscana, cacciato e cucinato da secoli."
    },
    {
      nome: "Pizza verdure dell'orto toscano",
      ingredienti: ["Pomodoro", "Mozzarella", "Zucchine", "Melanzane", "Peperoni", "Basilico"],
      descrizione: "Pomodoro, mozzarella, zucchine, melanzane e peperoni; semplice e popolare.",
      storia: "La Toscana ha una lunga tradizione di orti familiari e agricoltura sostenibile."
    }
  ],

  "Umbria": [
    {
      nome: "Pizza Norcina",
      ingredienti: ["Mozzarella", "Salsiccia di Norcia", "Crema di tartufo nero", "Funghi porcini"],
      descrizione: "Mozzarella, salsiccia umbra, crema di tartufo nero; tipica delle pizzerie umbre.",
      storia: "Norcia è famosa per i norcini (macellai) e per il tartufo nero pregiato."
    },
    {
      nome: "Pizza tartufo e funghi",
      ingredienti: ["Base bianca", "Mozzarella", "Crema di tartufo", "Funghi porcini", "Pecorino"],
      descrizione: "Base bianca, mozzarella, crema di tartufo e funghi porcini; piatto gourmet ma diffuso.",
      storia: "L'Umbria è ricca di tartufi neri, raccolti nei boschi intorno a Norcia e Spoleto."
    },
    {
      nome: "Pizza prosciutto crudo e rucola",
      ingredienti: ["Mozzarella", "Prosciutto crudo umbro", "Rucola", "Pecorino", "Olio extravergine"],
      descrizione: "Mozzarella, prosciutto crudo umbro e rucola; classica pizza di accompagnamento ai salumi locali.",
      storia: "L'Umbria produce ottimi prosciutti, meno noti di quelli di Parma ma di grande qualità."
    }
  ],

  "Marche": [
    {
      nome: "Pizza olive ascolane",
      ingredienti: ["Pomodoro", "Mozzarella", "Olive ascolane", "Prosciutto", "Formaggio"],
      descrizione: "Pomodoro, mozzarella e olive ascolane tagliate; omaggio alla famosa oliva fritta.",
      storia: "Le olive ascolane sono simbolo di Ascoli Piceno, farcite e fritte dal 1800."
    },
    {
      nome: "Pizza con ciauscolo",
      ingredienti: ["Mozzarella", "Ciauscolo IGP", "Pecorino", "Peperoncino"],
      descrizione: "Mozzarella e ciauscolo (salume morbido tipico marchigiano); molto apprezzata nella regione.",
      storia: "Il ciauscolo è salume spalmabile delle Marche, prodotto nelle zone interne."
    },
    {
      nome: "Pizza verdure di stagione",
      ingredienti: ["Pomodoro", "Mozzarella", "Verdure di stagione", "Carciofi", "Zucca"],
      descrizione: "Pomodoro, mozzarella, verdure tipiche marchigiane come zucca o carciofi.",
      storia: "Le Marche hanno una ricca tradizione agricola con verdure di qualità eccellente."
    }
  ],

  "Lazio": [
    {
      nome: "Pizza alla carbonara",
      ingredienti: ["Base bianca", "Mozzarella", "Guanciale", "Uovo", "Pecorino Romano DOP", "Pepe nero"],
      descrizione: "Mozzarella, guanciale, uovo e pecorino; riprende i sapori del piatto tradizionale romano.",
      storia: "La carbonara è piatto simbolo di Roma, qui reinterpretata sulla pizza."
    },
    {
      nome: "Pizza cacio e pepe",
      ingredienti: ["Base bianca", "Mozzarella", "Pecorino Romano DOP", "Pepe nero", "Guanciale"],
      descrizione: "Mozzarella, pecorino romano e pepe nero; variante pizza di un piatto classico.",
      storia: "Cacio e pepe è l'essenza della cucina romana: semplicità e ingredienti di qualità."
    },
    {
      nome: "Pizza Margherita",
      ingredienti: ["Pomodoro", "Mozzarella", "Basilico", "Olio extravergine"],
      descrizione: "Pomodoro, mozzarella, basilico; amatissima e onnipresente.",
      storia: "La Margherita nasce a Napoli ma è amata in tutto il Lazio, simbolo dell'Italia."
    },
    {
      nome: "Pizza tonno e cipolla",
      ingredienti: ["Pomodoro", "Mozzarella", "Tonno", "Cipolla", "Origano"],
      descrizione: "Pomodoro, mozzarella, tonno e cipolla; classica delle pizzerie romane.",
      storia: "Pizza semplice e gustosa, molto popolare nelle pizzerie al taglio romane."
    },
    {
      nome: "Pizza bianca romana",
      ingredienti: ["Base bianca", "Olio extravergine", "Sale", "Rosmarino"],
      descrizione: "Base senza pomodoro, con olio EVO, sale e rosmarino; tipica come snack o street food.",
      storia: "La pizza bianca è street food romano per eccellenza, venduta nei forni di quartiere."
    }
  ],

  "Abruzzo": [
    {
      nome: "Pizza ventricina",
      ingredienti: ["Mozzarella", "Ventricina piccante", "Peperoncino", "Pecorino"],
      descrizione: "Mozzarella, ventricina piccante, riflette il salume tipico locale.",
      storia: "La ventricina è salume piccante tipico dell'Abruzzo, prodotto nelle zone interne."
    },
    {
      nome: "Pizza salsiccia e friarielli abruzzesi",
      ingredienti: ["Mozzarella", "Salsiccia abruzzese", "Friarielli", "Aglio", "Peperoncino"],
      descrizione: "Mozzarella, salsiccia e verdure tipiche locali.",
      storia: "I friarielli sono verdure amare molto amate in Abruzzo, coltivate in collina."
    },
    {
      nome: "Pizza zafferano dell'Aquila e formaggi",
      ingredienti: ["Base bianca", "Crema allo zafferano", "Formaggi locali", "Miele"],
      descrizione: "Base bianca, crema allo zafferano, formaggi locali; gourmet ma popolare in città.",
      storia: "Lo zafferano dell'Aquila DOP è il più pregiato al mondo, coltivato sull'altopiano di Navelli."
    }
  ],

  "Molise": [
    {
      nome: "Pizza scamorza e ventricina molisana",
      ingredienti: ["Mozzarella", "Scamorza", "Ventricina molisana", "Peperoncino"],
      descrizione: "Mozzarella, scamorza, ventricina; tipica e apprezzata nelle pizzerie molisane.",
      storia: "Il Molise produce ottimi formaggi e salumi, spesso poco conosciuti ma di grande qualità."
    },
    {
      nome: "Pizza broccoli e salsiccia",
      ingredienti: ["Base bianca", "Broccoli", "Salsiccia molisana", "Aglio", "Peperoncino"],
      descrizione: "Base bianca o rossa, con broccoli locali e salsiccia; classica combinazione montana.",
      storia: "I broccoli crescono bene nel clima molisano, abbinati alla salsiccia locale."
    },
    {
      nome: "Pizza prosciutto e funghi",
      ingredienti: ["Mozzarella", "Prosciutto cotto", "Funghi", "Origano"],
      descrizione: "Mozzarella, prosciutto cotto e funghi; semplice e molto diffusa.",
      storia: "Pizza classica molto amata nelle pizzerie molisane, semplice e gustosa."
    }
  ],

  "Campania": [
    {
      nome: "Pizza Margherita",
      ingredienti: ["Pomodoro San Marzano DOP", "Mozzarella di bufala campana DOP", "Basilico", "Olio extravergine"],
      descrizione: "Pomodoro San Marzano, mozzarella di bufala campana DOP, basilico; simbolo mondiale della pizza.",
      storia: "Creata nel 1889 dal pizzaiolo Raffaele Esposito per la Regina Margherita di Savoia."
    },
    {
      nome: "Pizza Marinara",
      ingredienti: ["Pomodoro San Marzano", "Aglio", "Origano", "Olio extravergine"],
      descrizione: "Pomodoro, aglio, origano e olio EVO; la più antica pizza napoletana.",
      storia: "È la pizza più antica, nata nel 1700 per i marinai che rientravano dalla pesca."
    },
    {
      nome: "Pizza Quattro Stagioni",
      ingredienti: ["Pomodoro", "Mozzarella", "Prosciutto cotto", "Funghi", "Carciofi", "Olive"],
      descrizione: "Pomodoro, mozzarella, prosciutto cotto, funghi, carciofi, olive; diffusa e molto amata.",
      storia: "Rappresenta le quattro stagioni con ingredienti diversi in ogni spicchio."
    },
    {
      nome: "Pizza Diavola",
      ingredienti: ["Pomodoro", "Mozzarella", "Salame piccante", "Peperoncino"],
      descrizione: "Pomodoro, mozzarella, salame piccante; classica delle pizzerie napoletane.",
      storia: "Il nome deriva dal sapore piccante che 'brucia come il diavolo'."
    },
    {
      nome: "Pizza Capricciosa",
      ingredienti: ["Pomodoro", "Mozzarella", "Prosciutto", "Funghi", "Carciofi", "Olive", "Uovo"],
      descrizione: "Pomodoro, mozzarella, prosciutto, funghi, carciofi, olive; altra classica napoletana.",
      storia: "Nata dalla fantasia dei pizzaioli napoletani, ricca di ingredienti vari."
    },
    {
      nome: "Pizza Bufalina",
      ingredienti: ["Pomodoro San Marzano", "Mozzarella di bufala DOP", "Basilico"],
      descrizione: "Pomodoro e mozzarella di bufala DOP, semplice ma gourmet.",
      storia: "Valorizza la mozzarella di bufala campana, eccellenza mondiale del territorio."
    }
  ],

  "Puglia": [
    {
      nome: "Pizza con burrata e pomodorini",
      ingredienti: ["Mozzarella", "Burrata", "Pomodorini", "Basilico", "Olio extravergine"],
      descrizione: "Mozzarella, burrata fresca, pomodorini, basilico; amatissima per ingredienti locali.",
      storia: "La burrata nasce ad Andria negli anni '20, creazione del mastro casaro Lorenzo Bianchino."
    },
    {
      nome: "Pizza cime di rapa e acciughe",
      ingredienti: ["Mozzarella", "Cime di rapa", "Acciughe", "Aglio", "Peperoncino"],
      descrizione: "Mozzarella, cime di rapa, acciughe; tipica della zona di Bari e provincia.",
      storia: "Le cime di rapa sono verdura simbolo della Puglia, amate in tutta la regione."
    },
    {
      nome: "Pizza olive e capocollo",
      ingredienti: ["Mozzarella", "Pomodoro", "Olive nere", "Capocollo", "Origano"],
      descrizione: "Mozzarella, pomodoro, olive nere e capocollo; comune nelle pizzerie pugliesi.",
      storia: "Le olive pugliesi sono famose nel mondo, il capocollo è salume pregiato locale."
    },
    {
      nome: "Pizza patate e salsiccia",
      ingredienti: ["Base bianca", "Patate", "Salsiccia pugliese", "Rosmarino", "Mozzarella"],
      descrizione: "Base bianca o rossa, patate e salsiccia locale; molto popolare.",
      storia: "Piatto povero ma sostanzioso, riflette la tradizione contadina pugliese."
    }
  ],

  "Basilicata": [
    {
      nome: "Pizza peperoni cruschi e salsiccia lucana",
      ingredienti: ["Mozzarella", "Peperoni cruschi", "Salsiccia lucana", "Pecorino", "Peperoncino"],
      descrizione: "Mozzarella, peperoni croccanti tipici e salsiccia lucana; pizza caratteristica.",
      storia: "I peperoni cruschi di Senise IGP sono oro rosso della Basilicata, essiccati al sole."
    },
    {
      nome: "Pizza canestrato e pomodorini",
      ingredienti: ["Mozzarella", "Canestrato lucano", "Pomodorini", "Basilico"],
      descrizione: "Mozzarella, formaggio canestrato lucano e pomodorini; gusto locale.",
      storia: "Il canestrato è formaggio tipico lucano, stagionato in canestri di giunco."
    },
    {
      nome: "Pizza funghi e pancetta",
      ingredienti: ["Mozzarella", "Funghi porcini", "Pancetta", "Rosmarino"],
      descrizione: "Diffusa nelle pizzerie interne della regione.",
      storia: "I funghi crescono nei boschi lucani, la pancetta è prodotto della tradizione contadina."
    }
  ],

  "Calabria": [
    {
      nome: "Pizza 'Nduja",
      ingredienti: ["Mozzarella", "'Nduja", "Cipolla di Tropea IGP", "Peperoncino"],
      descrizione: "Mozzarella, 'nduja piccante, cipolla di Tropea; simbolo della Calabria.",
      storia: "La 'nduja nasce a Spilinga, salume piccante spalmabile simbolo della Calabria."
    },
    {
      nome: "Pizza soppressata calabrese",
      ingredienti: ["Mozzarella", "Soppressata calabrese", "Peperoncino", "Origano"],
      descrizione: "Mozzarella, soppressata piccante; molto diffusa.",
      storia: "La soppressata calabrese è salume tradizionale piccante, prodotto in tutta la regione."
    },
    {
      nome: "Pizza cipolla di Tropea e olive",
      ingredienti: ["Mozzarella", "Cipolla di Tropea IGP", "Olive", "Origano", "Basilico"],
      descrizione: "Mozzarella, cipolla rossa dolce di Tropea e olive; classica locale.",
      storia: "La cipolla di Tropea è dolce e pregiata, coltivata sulla costa tirrenica calabrese."
    },
    {
      nome: "Pizza peperoncino e salame piccante",
      ingredienti: ["Mozzarella", "Salame piccante", "Peperoncino calabrese", "Origano"],
      descrizione: "Mozzarella, salame calabrese e peperoncino; molto amata dai locali.",
      storia: "Il peperoncino è ingrediente base della cucina calabrese, coltivato ovunque."
    }
  ],

  "Sicilia": [
    {
      nome: "Pizza alla Norma",
      ingredienti: ["Mozzarella", "Melanzane fritte", "Pomodoro", "Ricotta salata", "Basilico"],
      descrizione: "Mozzarella, melanzane fritte, pomodoro, ricotta salata; iconica della Sicilia orientale.",
      storia: "Ispirata alla pasta alla norma, piatto simbolo di Catania dedicato al compositore Bellini."
    },
    {
      nome: "Pizza con sarde e finocchietto",
      ingredienti: ["Mozzarella", "Sarde fresche", "Finocchietto selvatico", "Pinoli", "Uvetta"],
      descrizione: "Mozzarella, sarde fresche e finocchietto selvatico; tipica palermitana.",
      storia: "Ispirata alla pasta con le sarde, piatto simbolo della cucina palermitana."
    },
    {
      nome: "Pizza caponata",
      ingredienti: ["Pomodoro", "Melanzane", "Peperoni", "Capperi", "Olive", "Cipolla"],
      descrizione: "Pomodoro, melanzane, peperoni, capperi e olive; versione ispirata al piatto siciliano.",
      storia: "La caponata è antipasto siciliano tradizionale, qui reinterpretato sulla pizza."
    },
    {
      nome: "Pizza con pistacchio di Bronte",
      ingredienti: ["Mozzarella", "Crema di pistacchio", "Mortadella", "Stracciatella"],
      descrizione: "Mozzarella e crema di pistacchio; gourmet e popolare nelle pizzerie siciliane.",
      storia: "Il pistacchio di Bronte DOP cresce sulle pendici dell'Etna, è oro verde siciliano."
    },
    {
      nome: "Pizza con tonno e cipolla rossa",
      ingredienti: ["Pomodoro", "Mozzarella", "Tonno", "Cipolla rossa", "Capperi"],
      descrizione: "Classica in tutta l'isola, con tonno del Mediterraneo.",
      storia: "La Sicilia ha una grande tradizione nella pesca del tonno, soprattutto a Favignana."
    }
  ],

  "Sardegna": [
    {
      nome: "Pizza pecorino sardo e bottarga",
      ingredienti: ["Base bianca", "Pecorino sardo DOP", "Bottarga di muggine", "Pomodorini", "Basilico"],
      descrizione: "Base bianca o rossa, pecorino sardo e bottarga di muggine; molto apprezzata.",
      storia: "Il pecorino sardo e la bottarga sono eccellenze isolane, prodotti della tradizione pastorale e marinara."
    },
    {
      nome: "Pizza salsiccia sarda e carciofi",
      ingredienti: ["Mozzarella", "Salsiccia sarda", "Carciofi spinosi", "Pecorino", "Mirto"],
      descrizione: "Mozzarella, salsiccia locale e carciofi; tipica nelle pizzerie interne.",
      storia: "I carciofi spinosi sardi sono pregiati, la salsiccia è prodotta con carne di maiale locale."
    },
    {
      nome: "Pizza mirto e formaggi locali",
      ingredienti: ["Mozzarella", "Formaggi freschi", "Mirto", "Miele", "Noci"],
      descrizione: "Mozzarella, formaggi freschi e mirto; popolare come variante gourmet.",
      storia: "Il mirto è pianta simbolo della Sardegna, usato per liquori e in cucina."
    },
    {
      nome: "Pizza porchetta sarda",
      ingredienti: ["Mozzarella", "Porchetta sarda", "Rosmarino", "Patate"],
      descrizione: "Mozzarella e straccetti di porchetta; versione creativa ma diffusa.",
      storia: "La porchetta sarda ha sapori diversi da quella laziale, aromatizzata con erbe isolane."
    }
  ]
};