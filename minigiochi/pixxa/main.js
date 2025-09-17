function scegliRandom(lista, quanti) {
  const shuffled = [...lista].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, quanti);
}

function generaNomeDaIngredienti(ingredienti) {
  const i = (x) => ingredienti.includes(x);
  if (i("Nutella") && i("Popcorn")) return "Dolce Esplosione";
  if (i("Wurstel") && i("Ananas")) return "L'Americana Confusa";
  if (i("Gomme da masticare")) return "Errore di Laboratorio";
  if (i("Salmone affumicato") && i("Avocado")) return "L'Hipster";
  if (i("Gorgonzola") && i("Noci")) return "Il Sofisticato";
  if (i("Bresaola") && i("Rucola")) return "La Milanese";
  if (i("Chorizo piccante") && i("Peperoni")) return "L'Infernale";
  if (i("Mascarpone") && i("Fichi")) return "Il Dolce Inganno";
  if (i("Polpo") && i("Patate")) return "Il Marinaio";
  if (i("Tartufo") && i("Parmigiano")) return "L'Aristocratica";
  return "Pizza Misteriosa";
}

function generaPizza() {
  const loading = document.getElementById('loadingText');
  const result = document.getElementById('pizzaResult');
  const button = document.querySelector('.generate-btn');

  // Mostra loading se gli elementi esistono
  if (loading) loading.classList.add('show');
  if (result) result.classList.remove('show');
  if (button) {
    button.disabled = true;
    button.textContent = 'Preparando...';
  }

  // Simula il caricamento
  setTimeout(() => {
    generaPizzaInternal();

    // Nascondi loading
    if (loading) loading.classList.remove('show');
    if (result) result.classList.add('show');
    if (button) {
      button.disabled = false;
      button.textContent = 'Crea la Mia Pizza! 🍕';
    }
  }, 1200);
}

function generaPizzaInternal() {
  const livello = document.getElementById("livelloSelect").value;
  let nome = "", ingredienti = [], provenienza = "", note = "";

  if (livello === "classica") {
    const p = scegliRandom(pizzeClassiche, 1)[0];
    nome = p.nome;
    ingredienti = p.ingredienti;
    note = p.descrizione;
  } else if (livello === "leggenda") {
    const p = scegliRandom(pizzeLeggendarie, 1)[0];
    nome = p.nome;
    ingredienti = p.ingredienti;
    provenienza = p.storia;
    note = p.descrizione;
  } else if (livello === "regionale") {
    // Scegli una regione casuale
    const regioni = Object.keys(pizzeRegionali);
    const regioneScelta = scegliRandom(regioni, 1)[0];
    const pizzeRegione = pizzeRegionali[regioneScelta];
    const p = scegliRandom(pizzeRegione, 1)[0];

    nome = p.nome;
    ingredienti = p.ingredienti;
    provenienza = p.storia;
    note = `${p.descrizione} - Specialità ${regioneScelta}`;
  } else if (livello === "pazza") {
    // Prendi tutti gli ingredienti da classiche + leggendarie
    const tuttiIngredienti = [
      ...pizzeClassiche.flatMap(p => p.ingredienti),
      ...pizzeLeggendarie.flatMap(p => p.ingredienti),
      // Aggiungi alcuni ingredienti pazzi extra
      "Nutella", "Popcorn", "Wurstel", "Ananas", "Gomme da masticare",
      "Patatine fritte", "Gelato", "Caramelle", "Cioccolato bianco",
      "Marshmallow", "Bacon", "Avocado", "Sushi", "Hot dog"
    ];

    // Rimuovi duplicati
    const unici = [...new Set(tuttiIngredienti)];

    // Scegli da 3 a 6 ingredienti casuali
    ingredienti = scegliRandom(unici, Math.floor(Math.random() * 4) + 3);

    // Dai un nome folle
    nome = generaNomeDaIngredienti(ingredienti);
    note = "Pizza pazza creata con ingredienti classici e leggendari!";
  }

  // Crea HTML con stile italiano migliorato
  let html = `<h2>🍕 ${nome}</h2>`;

  if (provenienza) {
    html += `<h3>📚 Storia e Tradizione</h3><p>${provenienza}</p>`;
  }

  html += `<h3>🌿 Ingredienti Freschi</h3><ul>`;
  ingredienti.forEach(ingrediente => {
    html += `<li>${ingrediente}</li>`;
  });
  html += `</ul>`;

  if (note) {
    html += `<p class="note">👨‍🍳 Note del Chef: ${note}</p>`;
  }

  // Aggiungi prezzo casuale e calorie per completezza
  const prezzo = (Math.random() * 10 + 8).toFixed(2);
  const calorie = Math.floor(Math.random() * 400 + 600);

  html += `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 15px; border-top: 2px dotted #d2691e;">
      <span style="font-family: 'Dancing Script', cursive; font-size: 1.5rem; color: #8b0000; font-weight: 600;">€ ${prezzo}</span>
      <span style="font-family: 'Kalam', cursive; color: #8b4513; font-size: 0.9rem;">${calorie} kcal</span>
    </div>
  `;

  document.getElementById("pizzaResult").innerHTML = html;
}