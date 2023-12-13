import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

const altButton = document.getElementById("generate-alt-text");
const altText = document.getElementById("button-alt-text");
const generateButton = document.getElementById("generate-button");
const output = document.getElementById("summary-output");
const spinner = document.getElementById("spinner");
const spinnerAlt = document.getElementById("spinner-alt");
const altTextOutput = document.getElementById("alt-text-output");
const altStats = document.getElementById("alt-text-stats");
const stats = document.getElementById("summary-stats");
const buttonText = document.getElementById("button-text");

const summarization = await pipeline("summarization", "Xenova/t5-small");
//const captioning = await pipeline(
//  "image-captioning",
//  "Xenova/vit-gpt2-image-captioning",
//);
let classifier = await pipeline(
  "token-classification",
  //"Xenova/distilbert-base-multilingual-cased-ner-hrl",
  "Xenova/bert-base-multilingual-cased-ner-hrl",
);

function searchImageOnWikimedia(personName, event) {
  const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    personName,
  )}&format=json&origin=*&srlimit=1&srnamespace=6`;

  fetch(endpoint)
    .then((response) => response.json())
    .then((data) => {
      if (data.query && data.query.search.length > 0) {
        const title = data.query.search[0].title;
        fetchImageInfo(title, event);
      }
    })
    .catch((error) => console.error("Error searching Wikimedia:", error));
}

function fetchImageInfo(title, event) {
  const infoEndpoint = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    title,
  )}&prop=imageinfo&iiprop=url&format=json&origin=*`;

  fetch(infoEndpoint)
    .then((response) => response.json())
    .then((data) => {
      const pages = data.query.pages;
      const page = pages[Object.keys(pages)[0]];
      if (page.imageinfo && page.imageinfo.length > 0) {
        const imageUrl = page.imageinfo[0].url;
        showImagePopup(imageUrl, event);
      }
    })
    .catch((error) => console.error("Error fetching image info:", error));
}

function createEntityList(entities) {
  const persons = entities.filter((entity) => entity.includes("(PER)"));
  const locations = entities.filter((entity) => entity.includes("(LOC)"));

  const personsList = createListWithHeader(persons, "Persons");
  const locationsList = createListWithHeader(locations, "Locations");

  const container = document.createElement("div");
  container.appendChild(personsList);
  container.appendChild(locationsList);

  return container;
}

function createListWithHeader(entities, headerTitle) {
  const header = document.createElement("h2");
  header.textContent = headerTitle;

  const list = document.createElement("ul");
  entities.forEach((entity) => {
    const listItem = document.createElement("li");
    listItem.textContent = entity.replace(/ \((PER|LOC)\)$/, ""); // Remove the type part
    listItem.style.textDecoration = "underline"; // Add underline
    listItem.style.cursor = "pointer";
    listItem.style.color = "#3366cc";
    if (entity.includes("(LOC)")) {
      listItem.onmouseover = (event) =>
        showMapPopup(event, listItem.textContent);
      listItem.onmousemove = (event) => moveMapPopup(event);
      listItem.onmouseout = () => hideMapPopup();
    }

    if (entity.includes("(PER)")) {
      listItem.onmouseover = (event) =>
        searchImageOnWikimedia(listItem.textContent, event);
      listItem.onmouseout = hideImagePopup;
    }

    list.appendChild(listItem);
  });

  const container = document.createElement("div");
  container.appendChild(header);
  container.appendChild(list);
  return container;
}

function showImagePopup(imageUrl, event) {
  hideMapPopup();
  const imagePopup = document.getElementById("imagePopup");
  imagePopup.style.display = "block";
  imagePopup.style.left = `${event.pageX + 15}px`; // 15px offset for cursor
  imagePopup.style.top = `${event.pageY + 15}px`;
  imagePopup.style.backgroundImage = `url(${imageUrl})`;
  imagePopup.style.backgroundSize = "cover";
  imagePopup.style.width = "200px";
  imagePopup.style.height = "200px";
  imagePopup.style.borderWidth = "thick";
  imagePopup.style.borderStyle = "solid";
  imagePopup.style.borderColor = "white";
  imagePopup.style.padding = "5px";
  imagePopup.style.boxShadow = "10px 20px 30px grey";
}

function hideImagePopup() {
  const imagePopup = document.getElementById("imagePopup");
  imagePopup.style.display = "none";
  imagePopup.style.backgroundImage = "";
}

function showMapPopup(locationName) {
  hideImagePopup();

  // TODO:: convert locationName to coordinates
  const coordinates = { lat: 51.6499, lng: 5.0437 }; // Replace with actual geocoded coordinates

  const mapDiv = document.getElementById("mapPopup");
  mapDiv.style.display = "block";
  mapDiv.style.left = event.pageX + "px";
  mapDiv.style.top = event.pageY + "px";
  mapDiv.style.borderWidth = "thick";
  mapDiv.style.borderStyle = "solid";
  mapDiv.style.borderColor = "white";
  mapDiv.style.padding = "5px";
  mapDiv.style.boxShadow = "10px 20px 30px grey";
  const map = L.map(mapDiv).setView(coordinates, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  L.marker(coordinates).addTo(map).bindPopup(locationName).openPopup();
}

function moveMapPopup(event) {
  const mapDiv = document.getElementById("mapPopup");
  mapDiv.style.left = event.pageX + "px";
  mapDiv.style.top = event.pageY + "px";
}

function hideMapPopup() {
  const mapDiv = document.getElementById("mapPopup");
  mapDiv.style.display = "none";
  // You might want to remove or clear the map instance here
}

function reconstructEntities(entities) {
  let reconstructedEntities = new Map();
  let currentEntity = "";
  let currentType = "";
  let totalScore = 0;
  let wordCount = 0;

  entities.forEach((entity) => {
    const entityType = entity.entity.startsWith("B-")
      ? entity.entity.substring(2)
      : currentType;

    if (entity.entity.startsWith("B-")) {
      if (currentEntity.length > 0 && wordCount > 0) {
        let averageScore = totalScore / wordCount;
        if (averageScore >= 0.9) {
          reconstructedEntities.set(cleanUpEntity(currentEntity), currentType);
        }
      }
      currentEntity = entity.word;
      currentType = entityType;
      totalScore = entity.score;
      wordCount = 1;
    } else if (entity.entity.startsWith("I-")) {
      currentEntity += entity.word.startsWith("##")
        ? entity.word.slice(2)
        : " " + entity.word;
      totalScore += entity.score;
      wordCount++;
    }
  });

  if (currentEntity.length > 0 && wordCount > 0) {
    let averageScore = totalScore / wordCount;
    if (averageScore >= 0.9) {
      reconstructedEntities.set(cleanUpEntity(currentEntity), currentType);
    }
  }

  // Remove single-word entities if they are found in any multi-word entities
  const finalEntities = [];
  reconstructedEntities.forEach((type, name) => {
    if (
      !Array.from(reconstructedEntities.keys()).some(
        (key) => key !== name && key.includes(name),
      )
    ) {
      finalEntities.push(`${name} (${type})`);
    }
  });

  return finalEntities;
}

function cleanUpEntity(entity) {
  return entity.replace(/^[\s-]+|[\s-]+$/g, "");
}

function cleanOutput(text) {
  const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/g);

  const capitalizedSentences = sentences.map((sentence) => {
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  });

  return capitalizedSentences.join(" ");
}

altText.textContent = "Find Named Entities";
buttonText.textContent = "Summarize";
generateButton.removeAttribute("disabled");
altButton.removeAttribute("disabled");

generateButton.addEventListener("click", async () => {
  spinner.classList.add("show");
  generateButton.setAttribute("disabled", true);

  console.log("Extracting article with readability...");
  var iframe = document.getElementById("article");
  var iframeWindow = iframe.contentWindow || iframe.contentDocument;
  var documentClone = iframeWindow.document.cloneNode(true);

  const input = new Readability(documentClone)
    .parse()
    .textContent.replace(/\s+/g, " ")
    .trim();

  console.log(input);
  const start = Date.now();
  var stext = `Text length: ${input.length}. `;

  console.log("Summarizing...");

  const result = await summarization(input, {
    min_length: 50,
    max_length: 250,
  });

  const end = Date.now();
  stext += `Result length: ${result[0].summary_text.length}. `;
  output.innerHTML = cleanOutput(result[0].summary_text);

  stext += `Execution time: ${end - start} ms.`;

  stats.innerHTML = stext;

  spinner.classList.remove("show");
  generateButton.removeAttribute("disabled");
  output.style.display = "block";
});

altButton.addEventListener("click", async () => {
  spinnerAlt.classList.add("show");
  altButton.setAttribute("disabled", true);

  console.log("Extracting article with readability...");
  var iframe = document.getElementById("article");
  var iframeWindow = iframe.contentWindow || iframe.contentDocument;
  var documentClone = iframeWindow.document.cloneNode(true);

  const input = new Readability(documentClone)
    .parse()
    .textContent.replace(/\s+/g, " ")
    .trim();

  console.log(input);
  const start = Date.now();
  var stext = `Text length: ${input.length}. `;

  console.log("Extracting NER...");

  const output = await classifier(input);

  const end = Date.now();
  console.log(output);

  const reconstructedNames = reconstructEntities(output);
  console.log(reconstructedNames);

  stext += `Execution time: ${end - start} ms.`;

  altStats.innerHTML = stext;
  altTextOutput.appendChild(createEntityList(reconstructedNames));

  spinnerAlt.classList.remove("show");
  altButton.removeAttribute("disabled");
});
