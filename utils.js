function createTabs(tabs) {
  var currentPage = window.location.pathname.split("/").pop();

  var tabsDiv = document.createElement("div");
  tabsDiv.className = "tabs";

  tabs.forEach(function(tab) {
    var a = document.createElement("a");
    a.href = tab.href;
    a.textContent = tab.title;
    if (tab.href === currentPage) {
      a.classList.add("active");
    }
    tabsDiv.appendChild(a);
  });

  return tabsDiv;
}

function injectTabsIntoDiv(divId, tabs) {
  var targetDiv = document.getElementById(divId);
  if (!targetDiv) {
    console.error("No element found with ID:", divId);
    return;
  }
  var tabsContainer = createTabs(tabs);
  targetDiv.innerHTML = "";
  targetDiv.appendChild(tabsContainer);
}

// Example usage
var tabsInfo = [
  { title: "Summarize", href: "index.html", isActive: true },
  { title: "NER", href: "ner.html", isActive: false },
  { title: "Group", href: "classification.html", isActive: false },
  { title: "Autogroup", href: "auto.html", isActive: false },
  //{ title: "Topics", href: "topics.html", isActive: false },
  //{ title: "Image Labeler", href: "captioning.html", isActive: false },
  { title: "Labeler", href: "labels.html", isActive: false },
  { title: "Objects", href: "labels2.html", isActive: false },
  { title: "Q/A", href: "qa.html", isActive: false },
  { title: "Spell", href: "spell.html", isActive: false },
];

// Call the function with the ID of the target div
injectTabsIntoDiv("navigation", tabsInfo);
