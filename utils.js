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
  { title: "Summarize", href: "index.html", isActive: false },
  { title: "NER", href: "ner.html", isActive: false },
  { title: "Group", href: "classification.html", isActive: true },
  { title: "Autogroup", href: "auto.html", isActive: true },
  { title: "Topics", href: "topics.html", isActive: false },
  { title: "GPU", href: "gpu.html", isActive: false },
];

// Call the function with the ID of the target div
injectTabsIntoDiv("navigation", tabsInfo);
