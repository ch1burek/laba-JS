// Адреси API та резервного набору даних
const API = "https://restcountries.com/v3.1";
const DATA = "https://cdn.jsdelivr.net/gh/restcountries/restcountries@master/src/main/resources/countriesV3.1.json";
const FIELDS = "name,capital,population,flags,region,area,currencies";

// Елементи сторінки
const $ = (id) => document.getElementById(id);
const select = $("countrySelect");
const form = $("countryForm");
const showButton = $("showBtn");
const statusEl = $("status");
const infoEl = $("info");
const out = {
  name: $("cName"),
  capital: $("cCapital"),
  population: $("cPopulation"),
  region: $("cRegion"),
  area: $("cArea"),
  currency: $("cCurrency"),
  flag: $("cFlag"),
};

let cache = null;

// Показати повідомлення(порожній текст очищає його)
function setStatus(text, type = "info") {
  statusEl.textContent = text;
  statusEl.dataset.type = type;
}

async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.json();
}

// Резервний набір даних завантажується один раз
function dataset() {
  if (!cache) {
    cache = getJSON(DATA)
      .then((data) => {
        if (!Array.isArray(data) || !data.length) throw new Error("Порожній набір даних");
        return data;
      })
      .catch((error) => {
        cache = null;
        throw error;
      });
  }
  return cache;
}

// Перелік країн: основний API, інакше — резервний набір
async function getCountries() {
  try {
    const data = await getJSON(API + "/all?fields=name");
    if (Array.isArray(data) && data.length) return data;
  } catch {}
  return dataset();
}

// Дані країни: основний API, інакше — пошук у резервному наборі
async function getCountry(name) {
  try {
    const data = await getJSON(
      `${API}/name/${encodeURIComponent(name)}?fields=${FIELDS}&fullText=true`
    );
    if (Array.isArray(data) && data.length) return data[0];
  } catch {}
  const data = await dataset();
  return data.find((c) => c.name.common === name || c.name.official === name);
}

// Вивести дані країни на сторінку
function render(country) {
  const name = country.name?.common || "—";
  out.name.textContent = name;
  out.capital.textContent = country.capital?.length ? country.capital.join(", ") : "—";
  out.population.textContent =
    typeof country.population === "number" ? country.population.toLocaleString("uk-UA") : "—";
  out.region.textContent = country.region || "—";
  out.area.textContent =
    typeof country.area === "number" ? country.area.toLocaleString("uk-UA") + " км²" : "—";
  out.currency.textContent = country.currencies
    ? Object.values(country.currencies)
        .map((c) => c.name + (c.symbol ? ` (${c.symbol})` : ""))
        .join(", ") || "—"
    : "—";

  const flag = country.flags?.png || country.flags?.svg;
  out.flag.hidden = !flag;
  if (flag) {
    out.flag.src = flag;
    out.flag.alt = `Прапор: ${name}`;
  }

  infoEl.hidden = false;
}

// Заповнити список країн
function fillSelect(countries) {
  const options = [...countries]
    .sort((a, b) => a.name.common.localeCompare(b.name.common, "en"))
    .map((c) => new Option(c.name.common, c.name.common));
  select.replaceChildren(new Option("Оберіть країну…", ""), ...options);
}

// Початкове завантаження списку
async function init() {
  setStatus("Завантаження переліку країн…", "loading");
  try {
    fillSelect(await getCountries());
    select.disabled = false;
    setStatus("");
  } catch (error) {
    select.replaceChildren(new Option("Недоступно", ""));
    setStatus("Не вдалося завантажити перелік країн: " + error.message, "error");
  }
}

// Вибір країни лише активує кнопку
select.addEventListener("change", () => {
  showButton.disabled = !select.value;
  if (!select.value) {
    infoEl.hidden = true;
    setStatus("");
  }
});

// Дані показуються після натискання кнопки
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!select.value) return setStatus("Оберіть країну зі списку");

  infoEl.hidden = true;
  showButton.disabled = true;
  setStatus("Завантаження даних…", "loading");

  try {
    const country = await getCountry(select.value);
    if (!country) throw new Error("Країну не було знайдено");
    render(country);
    setStatus("");
  } catch (error) {
    setStatus("Помилка: " + error.message, "error");
  } finally {
    showButton.disabled = !select.value;
  }
});

init();
