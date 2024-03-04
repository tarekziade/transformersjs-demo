const bar = document.getElementById("progress");
const input = document.getElementById("query");
const result = document.getElementById("result");
const anime = document.getElementById("anime");

var worker = new Worker("spell_worker.js", { type: "module" });

worker.onmessage = function(e) {
  console.log(e.data);

  if (e.data.status == "progress") {
    bar.value = e.data.progress;
  }

  if (e.data.status == "ready") {
    input.value = "";
    input.removeAttribute("disabled");
  }

  if (e.data.status == "inferring") {
    console.log("showing");
    anime.style.display = "block";
  }
  if (e.data.status == "inferred") {
    result.innerHTML = e.data.text;
    anime.style.display = "none";
  }
};

let typingTimer;

function userStoppedTyping() {
  var words = input.value.split(" ").filter(function(word) {
    // Filtering out empty strings to ignore multiple spaces
    return word.length > 0;
  });

  if (words.length < 3) {
    // too short
    return;
  }
  console.log("Posting ", words);
  worker.postMessage(input.value);
}

input.addEventListener("input", (event) => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(userStoppedTyping, 1000);
});
