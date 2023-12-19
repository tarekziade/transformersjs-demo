import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

const groupButton = document.getElementById("groupButton");

const classifier = await pipeline(
  "zero-shot-classification",
  //"Xenova/mobilebert-uncased-mnli",
  "Xenova/nli-deberta-v3-xsmall",
);

groupButton.textContent = "Group";
groupButton.removeAttribute("disabled");

groupButton.addEventListener("click", async () => {
  var titlesString = document.getElementById("titles").value;
  var titles = titlesString.trim().split("\n"); // Splitting the string into an array of titles
  var labelsString = document.getElementById("labels").value;
  var labels = labelsString.split(", "); // Splitting the string into an array of labels
  var groupedTitles = {};

  labels.forEach(function(label) {
    groupedTitles[label.trim()] = [];
  });

  const start = Date.now();
  var stext = `Processed ${titles.length} titles in `;
  for (const title of titles) {
    var label = await classifier(title, labels);
    label = label.labels[0];
    if (groupedTitles.hasOwnProperty(label)) {
      groupedTitles[label].push(title);
    }
  }
  const end = Date.now();
  stext += `${end - start} ms.`;
  const stats = document.getElementById("stats");
  stats.innerHTML = stext;

  var groupedText = "";
  for (var key in groupedTitles) {
    groupedText += key + ":\n" + groupedTitles[key].join("\n") + "\n\n";
  }
  document.getElementById("titles-grouped").value = groupedText;
});
