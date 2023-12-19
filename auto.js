import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

const suggestButton = document.getElementById("suggestButton");

const extractor = await pipeline(
  "text-classification",
  "tarekziade/topic_classification",
);

suggestButton.textContent = "Extract & Group";
suggestButton.removeAttribute("disabled");

suggestButton.addEventListener("click", async () => {
  var titlesString = document.getElementById("titles").value;
  var titles = titlesString.trim().split("\n"); // Splitting the string into an array of titles

  var groupedTitles = {};
  const start = Date.now();
  var stext = `Processed ${titles.length} titles in `;

  for (const title of titles) {
    let res = await extractor(title);
    console.log(res);
    let suggestedLabel = res[0].label;
    if (!groupedTitles.hasOwnProperty(suggestedLabel)) {
      groupedTitles[suggestedLabel] = [];
    }
    groupedTitles[suggestedLabel].push(title);
  }
  const end = Date.now();
  stext += `${end - start} ms.`;
  const stats = document.getElementById("stats");
  stats.innerHTML = stext;

  var groupedHtml = "";
  for (var key in groupedTitles) {
    if (groupedTitles[key].length > 0) {
      groupedHtml += "<h3>" + key + "</h3><ol>";
      for (var i = 0; i < groupedTitles[key].length; i++) {
        groupedHtml += "<li>" + groupedTitles[key][i] + "</li>";
      }
      groupedHtml += "</ol>";
    }
  }
  document.getElementById("titles-grouped").innerHTML = groupedHtml;
});
