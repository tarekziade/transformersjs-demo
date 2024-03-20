import {
  pipeline,
  AutoModel,
  AutoTokenizer,
  AutoProcessor,
  AutoModelForVision2Seq,
  AutoModelForObjectDetection,
  RawImage,
} from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

const NUM_IMAGES = 1;
const generateButton = document.getElementById("generate-button");
const buttonText = document.getElementById("button-text");
const fetchImagesButton = document.getElementById("pick-images");
const fetchImagesText = document.getElementById("button-images");

fetchRandomImages();
const model_name = "Xenova/yolos-tiny";

//let tokenizer = await AutoTokenizer.from_pretrained(model_name);
let model = await AutoModelForObjectDetection.from_pretrained(model_name);
console.log(model);

//const detector = await pipeline("object-detection", "Xenova/yolos-tiny", {
//  quantized: false,
//});

buttonText.textContent = "Image Labeler";
generateButton.removeAttribute("disabled");

fetchImagesButton.addEventListener("click", async () => {
  fetchRandomImages();
});

function fetchRandomImages(count = 0) {
  if (count === 0) {
    // Clear existing images when starting a new fetch cycle
    document.getElementById("imageContainer").innerHTML = "";
    fetchImagesButton.setAttribute("disabled", true);
  }

  if (count >= NUM_IMAGES) {
    fetchImagesButton.removeAttribute("disabled");
    return;
  }

  fetch(
    "https://commons.wikimedia.org/w/api.php?action=query&generator=random&grnnamespace=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=300&iiurlheight=300&format=json&origin=*",
  )
    .then((response) => response.json())
    .then((data) => {
      const pages = data.query.pages;
      const page = pages[Object.keys(pages)[0]];
      const imageUrl = page.imageinfo[0].thumburl;
      const imageTitle = "???";
      const imageId = "image-" + count;
      const titleId = "title-" + count;

      if (imageUrl.toLowerCase().endsWith(".jpg")) {
        const imageContainer = document.getElementById("imageContainer");
        imageContainer.className = "image-span";

        // Create a div to hold the image and title
        const imageDiv = document.createElement("span");
        imageDiv.className = "image-wrapper";

        // Add img element
        const imgElement = document.createElement("img");
        imgElement.src = imageUrl;
        imgElement.id = imageId;
        imageDiv.appendChild(imgElement);

        // Add title element
        const titleElement = document.createElement("p");
        titleElement.textContent = imageTitle;
        titleElement.id = titleId;
        imageDiv.appendChild(titleElement);
        imageContainer.appendChild(imageDiv);
        fetchRandomImages(count + 1);
      } else {
        fetchRandomImages(count);
      }
    })
    .catch((error) => {
      console.error("Error fetching image:", error);
      fetchRandomImages(count);
    });
}

generateButton.addEventListener("click", async () => {
  generateButton.setAttribute("disabled", true);
  for (let i = 0; i < NUM_IMAGES; i++) {
    const titleElement = document.getElementById("title-" + i);
    const imageElement = document.getElementById("image-" + i);

    const model_name = "Xenova/yolos-tiny";
    let model = await AutoModelForObjectDetection.from_pretrained(model_name);

    var start = Date.now();
    const processor = await AutoProcessor.from_pretrained(model_name);
    const image = await RawImage.read(imageElement.src);
    const image_inputs = await processor(image);
    var end = Date.now();

    console.log(`Image processing Execution time: ${end - start} ms.`);

    var start = Date.now();
    const { image_embeds } = await model(image_inputs);
    var end = Date.now();
    console.log(`Inference Execution time: ${end - start} ms.`);

    var res = "";
    result.forEach((element) => {
      console.log(element);
      res += element["label"] + ", ";
    });

    titleElement.innerHTML = res;

    console.log(i);
    if (i == NUM_IMAGES - 1) {
      generateButton.removeAttribute("disabled");
    }
  }
});
