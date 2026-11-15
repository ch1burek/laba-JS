const API = "https://restcountries.com/v3.1";
const DATA =
  "https://cdn.jsdelivr.net/gh/restcountries/restcountries@master/src/main/resources/countriesV3.1.json";

const select = document.getElementById("countrySelect");
const statusEl = document.getElementById("status");
const selectedEl = document.getElementById("selected");

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

function fillSelect(countries) {
  const options = [...countries]
    .sort((a, b) => a.name.common.localeCompare(b.name.common, "en"))
    .map((c) => new Option(c.name.common, c.name.common));

  select.replaceChildren(new Option("Оберіть країну…", ""), ...options);
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

select.addEventListener("change", () => {
  selectedEl.textContent = select.value ? "Обрано: " + select.value : "";
});

init();
