const API = "https://restcountries.com/v3.1";
const DATA =
  "https://cdn.jsdelivr.net/gh/restcountries/restcountries@master/src/main/resources/countriesV3.1.json";
const FIELDS = "name,capital,population,flags,region,area,currencies";

const select = document.getElementById("countrySelect");
const statusEl = document.getElementById("status");
const infoEl = document.getElementById("info");

const out = {
  name: document.getElementById("cName"),
  capital: document.getElementById("cCapital"),
  population: document.getElementById("cPopulation"),
  region: document.getElementById("cRegion"),
  area: document.getElementById("cArea"),
  currency: document.getElementById("cCurrency"),
  flag: document.getElementById("cFlag"),
};

let cache = null;

function setStatus(text, type = "info") {
  statusEl.textContent = text;
  statusEl.dataset.type = type;
}

async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.json();
}

function dataset() {
  if (!cache) {
    cache = getJSON(DATA)
      .then((data) => {
        if (!Array.isArray(data) || !data.length) {
          throw new Error("Порожній набір даних");
        }
        return data;
      })
      .catch((error) => {
        cache = null;
        throw error;
      });
  }
  return cache;
}

async function getCountries() {
  try {
    const data = await getJSON(API + "/all?fields=name");
    if (Array.isArray(data) && data.length) return data;
  } catch {}
  return dataset();
}

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

function render(country) {
  const name = country.name?.common || "—";
  out.name.textContent = name;
  out.capital.textContent = country.capital?.length
    ? country.capital.join(", ")
    : "—";
  out.population.textContent =
    typeof country.population === "number"
      ? country.population.toLocaleString("uk-UA")
      : "—";
  out.region.textContent = country.region || "—";
  out.area.textContent =
    typeof country.area === "number"
      ? country.area.toLocaleString("uk-UA") + " км²"
      : "—";
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

function fillSelect(countries) {
  const options = [...countries]
    .sort((a, b) => a.name.common.localeCompare(b.name.common, "en"))
    .map((c) => new Option(c.name.common, c.name.common));

  select.replaceChildren(new Option("Оберіть країну…", ""), ...options);
}

async function handleSelection() {
  const name = select.value;

  if (!name) {
    infoEl.hidden = true;
    setStatus("");
    return;
  }

  infoEl.hidden = true;
  setStatus("Завантаження даних…", "loading");

  try {
    const country = await getCountry(name);
    if (!country) throw new Error("Країну не знайдено");
    render(country);
    setStatus("");
  } catch (error) {
    setStatus("Помилка: " + error.message, "error");
  }
}

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

select.addEventListener("change", handleSelection);
init();
