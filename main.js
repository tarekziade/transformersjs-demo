import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

const generateButton = document.getElementById("generate-button");
const output = document.getElementById("summary-output");
const spinner = document.getElementById("spinner");
const stats = document.getElementById("summary-stats");

const summarization = await pipeline(
  "summarization", // task
  "Xenova/t5-small", // model
);

function cleanOutput(text) {
  const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/g);

  const capitalizedSentences = sentences.map((sentence) => {
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  });

  return capitalizedSentences.join(" ");
}

generateButton.removeAttribute("disabled");

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
