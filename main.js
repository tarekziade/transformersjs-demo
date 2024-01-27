import {
  env,
  T5Tokenizer,
  T5ForConditionalGeneration,
  pipeline,
} from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

const generateButton = document.getElementById("generate-button");
const output = document.getElementById("summary-output");
const stats = document.getElementById("summary-stats");
const buttonText = document.getElementById("button-text");

const model_id = "tarekziade/t5-small-headline-generator-sft-3-3"; //"tarekziade/t5-small-headline-generator-sft";
let tokenizer = await T5Tokenizer.from_pretrained(model_id);
let model = await T5ForConditionalGeneration.from_pretrained(model_id);

function cleanOutput(text, maxLength = null) {
  let sentences = text.match(/[^\.!\?]+[\.!\?]+/g);
  if (maxLength) {
    sentences = sentences.slice(0, maxLength);
  }

  const capitalizedSentences = sentences.map((sentence) => {
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  });
  return capitalizedSentences.join(" ");
}

function removeHeaders(document) {
  const headerElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headerElements.forEach((header) => {
    header.parentNode.removeChild(header);
  });
  const navElements = document.querySelectorAll(
    'div[class*="nav"],div[class*="menu"],div[class*="noprint"]',
  );
  navElements.forEach((div) => {
    div.parentNode.removeChild(div);
  });
}

buttonText.textContent = "Summarize";
generateButton.removeAttribute("disabled");
generateButton.addEventListener("click", async () => {
  generateButton.setAttribute("disabled", true);

  console.log("Extracting article with readability...");
  var iframe = document.getElementById("article");
  var iframeWindow = iframe.contentWindow || iframe.contentDocument;
  var documentClone = iframeWindow.document.cloneNode(true);
  removeHeaders(documentClone);

  var input = new Readability(documentClone)
    .parse()
    .textContent.replace(/\s+/g, " ")
    .trim();

  input = cleanOutput(input);
  const start = Date.now();
  var stext = `Text length: ${input.length}. `;

  let { input_ids } = await tokenizer("summarize: " + input, {
    max_length: 512,
    truncation: true,
  });

  let outputs = await model.generate(input_ids, {
    max_length: 100,
    truncation: true,
  });
  let result = tokenizer.decode(outputs[0], { skip_special_tokens: true });
  result = cleanOutput(result, 1);
  const end = Date.now();
  stext += `Result length: ${result.length}. `;
  output.innerHTML = cleanOutput(result);

  stext += `Execution time: ${end - start} ms.`;

  stats.innerHTML = stext;

  generateButton.removeAttribute("disabled");
  output.style.display = "block";
});
