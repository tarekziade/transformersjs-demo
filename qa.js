import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

const button = document.getElementById("generate-alt-text");
const altInput = document.getElementById("question");

let answerer = await pipeline(
  "question-answering",
  "Xenova/distilbert-base-cased-distilled-squad",
);

button.textContent = "Answer";
button.removeAttribute("disabled");
altInput.removeAttribute("disabled");

button.addEventListener("click", async () => {
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

  console.log("Finding answer...");
  const question = altInput.value;
  const output = await answerer(question, input);

  const end = Date.now();

  console.log(output.answer);
  var reg = new RegExp(output.answer.split(" ").join("\\s+"), "i");

  iframeWindow.document.body.innerHTML =
    iframeWindow.document.body.innerHTML.replace(
      reg,
      "<span style='background-color: yellow; font-size: 150%'>$&</span>",
    );

  stext += `Execution time: ${end - start} ms.`;

  button.removeAttribute("disabled");
});
