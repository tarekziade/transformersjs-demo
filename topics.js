import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

const findTopicButton = document.getElementById("findTopicButton");
const output = document.getElementById("output");
const stats = document.getElementById("stats");

const extractor = await pipeline(
  "text-classification",
  "tarekziade/topic_classification",
);

function cleanOutput(text) {
  const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/g);

  const capitalizedSentences = sentences.map((sentence) => {
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  });

  return capitalizedSentences.join(" ");
}

findTopicButton.textContent = "Extract topics";
findTopicButton.removeAttribute("disabled");
findTopicButton.addEventListener("click", async () => {
  findTopicButton.setAttribute("disabled", true);

  const input = document.getElementById("article").value;
  const start = Date.now();
  var stext = `Text length: ${input.length}. `;

  console.log("Find topics...");

  var result = await extractor(input); //, { topk: null });

  result = result.filter(function(item) {
    return item.score > 0.1;
  });

  console.log(result);
  const end = Date.now();
  console.log(result);

  let labels = result.map((item) => item.label);
  output.innerHTML = `Topics: ${labels.join(", ")}. <br />`;

  stext += `<br/>Execution time: ${end - start} ms.`;

  stats.innerHTML = stext;

  findTopicButton.removeAttribute("disabled");
  output.style.display = "block";
});
