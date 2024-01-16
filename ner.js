const altButton = document.getElementById("generate-alt-text");
const altText = document.getElementById("button-alt-text");
const altTextOutput = document.getElementById("alt-text-output");
const altStats = document.getElementById("alt-text-stats");

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

function addEntityToAppropriateList(entity) {
  // Determine the ul ID based on the entity type
  let ulId;
  if (entity.includes("(PER)")) {
    ulId = "persons";
  } else if (entity.includes("(LOC)")) {
    ulId = "locations";
  } else if (entity.includes("(ORG)")) {
    ulId = "organizations";
  } else {
    console.error("Unknown entity type " + entity);
    return;
  }

  // Find the ul element by its ID
  const list = document.getElementById(ulId);
  if (!list) {
    console.error("List element not found");
    return;
  }

  // Create a new li element
  const listItem = document.createElement("li");
  listItem.textContent = entity.replace(/ \((PER|LOC|ORG)\)$/, ""); // Remove the type part
  listItem.style.textDecoration = "underline"; // Add underline
  listItem.style.cursor = "pointer";
  listItem.style.color = "#3366cc";

  // Add event handlers based on entity type
  if (entity.includes("(LOC)")) {
    listItem.onmouseover = (event) => showMapPopup(event, listItem.textContent);
    listItem.onmousemove = (event) => moveMapPopup(event);
    listItem.onmouseout = () => hideMapPopup();
  }

  if (entity.includes("(PER)")) {
    listItem.onmouseover = (event) =>
      searchImageOnWikimedia(listItem.textContent, event);
    listItem.onmouseout = hideImagePopup;
  }
  // Append the new li element to the ul
  list.appendChild(listItem);
  //document.getElementById(ulId).innerHTML = list.innerHTML;
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

function sentenceIterator(text) {
  let useSegmenter = typeof Intl.Segmenter !== "undefined";
  let sentences;

  if (useSegmenter) {
    console.log("using Intl.Segmenter");
    const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
    const segments = segmenter.segment(text);
    sentences = Array.from(segments).map((segment) => segment.segment);
  } else {
    // Fallback to regex-based sentence splitting
    sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  }

  let current = 0;
  let num_sentences = 1;

  // Return an iterator
  return {
    next: function() {
      if (current < sentences.length) {
        // Collect up to 3 sentences
        const chunk = sentences
          .slice(current, current + num_sentences)
          .join(" ")
          .trim();
        current += num_sentences;
        return { value: chunk, done: false };
      } else {
        // No more sentences, mark as done
        return { done: true };
      }
    },
  };
}

function setupEntityListener() {
  document.addEventListener("addEntity", (event) => {
    addEntityToAppropriateList(event.detail.value);
  });
}

function newEntityFound(target, source) {
  for (let [key, value] of source.entries()) {
    if (!target.has(key)) {
      target.set(key, value);

      // update the page here
      const event = new CustomEvent("addEntity", {
        detail: { value },
      });

      document.dispatchEvent(event);
    }
  }
  return target;
}

async function getContent() {
  var iframe = document.getElementById("article");
  var iframeWindow = iframe.contentWindow || iframe.contentDocument;
  var documentClone = iframeWindow.document.cloneNode(true);

  var input = new Readability(documentClone)
    .parse()
    .textContent.replace(/\s+/g, " ")
    .trim();

  return cleanOutput(input);
}

altText.textContent = "NER";
altButton.removeAttribute("disabled");

let entities = new Map();
let start;
let stext = "";
const numberOfWorkers = window.navigator.hardwareConcurrency;
const workers = [];
let completedTasks = 0; // Counter to track completed tasks
let totalTasks = 0; // Counter to track total tasks

function onWorkerMessage(workerIndex) {
  return function(e) {
    const output = e.data;

    if (output.length !== 0) {
      const reconstructedNames = reconstructEntities(output);
      newEntityFound(entities, reconstructedNames);
    }

    completedTasks++;
    if (completedTasks === totalTasks) {
      // All workers have finished
      const end = Date.now();
      stext += `Execution time: ${end - start} ms.`;
      altStats.innerHTML = stext;
      altButton.removeAttribute("disabled");
    }
  };
}

function onWorkerError(error) {
  console.error("Worker error:", error);
}

for (let i = 0; i < numberOfWorkers; i++) {
  const worker = new Worker("ner_worker.js", { type: "module" });
  worker.onmessage = onWorkerMessage(i);
  worker.onerror = onWorkerError;
  workers.push(worker);
}

function dispatchTaskToWorker(taskData, workerIndex) {
  workers[workerIndex].postMessage(taskData);
}

altButton.addEventListener("click", async (event) => {
  event.preventDefault();

  altButton.setAttribute("disabled", true);

  var input = await getContent();
  start = Date.now();
  stext += `Text length: ${input.length}. `;

  let currentWorkerIndex = 0;
  const iterator = sentenceIterator(input);

  for (let result = iterator.next(); !result.done; result = iterator.next()) {
    dispatchTaskToWorker(result.value, currentWorkerIndex);
    currentWorkerIndex = (currentWorkerIndex + 1) % numberOfWorkers;
    totalTasks += 1;
  }
});

setupEntityListener();
