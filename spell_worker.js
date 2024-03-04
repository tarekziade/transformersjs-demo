import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

let working = false;
function progressCallback(progress) {
  self.postMessage(progress);
}

console.log("Initializing spell checker...");

const spell = await pipeline(
  "text2text-generation",
  "tarekziade/spelling-correction-english-base",
  { progress_callback: progressCallback },
);

console.log("Ready");

self.addEventListener("message", async function(e) {
  console.log("Got message", e.data);
  if (working) {
    self.postMessage({
      status: "busy",
    });

    return;
  }
  self.postMessage({
    status: "inferring",
  });
  working = true;

  console.log("Inferring");

  const output = await spell(e.data, {
    max_length: 2048,
  });

  console.log("Done.", output[0]);
  self.postMessage({
    status: "inferred",
    text: output[0].generated_text,
  });
  working = false;
});
