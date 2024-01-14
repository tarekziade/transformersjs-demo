import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

let classifier = await pipeline(
  "token-classification",
  "Xenova/distilbert-base-multilingual-cased-ner-hrl",
  //"Xenova/bert-base-multilingual-cased-ner-hrl",
  //"Xenova/bert-base-NER",
);

self.addEventListener("message", async (e) => {
  const text = e.data;
  const output = await classifier(text);
  self.postMessage(output);
});
