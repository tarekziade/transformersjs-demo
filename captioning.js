import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

const generateButton = document.getElementById("generate-button");
const buttonText = document.getElementById("button-text");

const captioner = await pipeline(
  "image-classification",
  //"Xenova/vit-gpt2-image-captioning",
  //"tarekziade/vit-base-patch16-224",
  "tarekziade/deit-tiny-patch16-224",
);

buttonText.textContent = "Image Labeler";
generateButton.removeAttribute("disabled");
generateButton.addEventListener("click", async () => {
  generateButton.setAttribute("disabled", true);
  const start = Date.now();
  var stext = "";

  var fileInput = document.getElementById("image-input");
  const displayImage = document.getElementById("display-image");

  if (fileInput.files && fileInput.files[0]) {
    var reader = new FileReader();
    reader.onload = async function(e) {
      var img = document.getElementById("display-image");

      img.src = e.target.result;

      var url = e.target.result;

      const result = await captioner(url);
      const caption = result[0].label;
      document.getElementById("caption").innerHTML = caption;
      const end = Date.now();

      stext += `Execution time: ${end - start} ms.`;
      document.getElementById("stats").innerHTML = stext;

      generateButton.removeAttribute("disabled");
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    alert("Please select an image first.");
  }
});
