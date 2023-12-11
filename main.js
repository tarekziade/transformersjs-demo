import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.3.0";

const longTextInput = document.getElementById("long-text-input");
const generateButton = document.getElementById("generate-button");
const output = document.getElementById("output-div");
const spinner = document.getElementById("spinner");

const summarization = await pipeline(
  "summarization", // task
  "Xenova/t5-small", // model
);

generateButton.removeAttribute("disabled");

generateButton.addEventListener("click", async () => {
  spinner.classList.add("show");
  generateButton.setAttribute("disabled", true);

  const input = longTextInput.value;
  const start = Date.now();
  var stext = `Text length: ${input.length}. `;

  const result = await summarization(input, {
    min_length: 50,
    max_length: 250,
  });

  stext += `Result length: ${result[0].summary_text.length}. `;
  output.innerHTML = result[0].summary_text;

  const end = Date.now();
  stext += `Execution time: ${end - start} ms.`;

  stats.innerHTML = stext;

  spinner.classList.remove("show");
  generateButton.removeAttribute("disabled");
  output.style.display = "block";
});
