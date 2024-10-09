// ==UserScript==
// @name             LinkedIn Blacklist
// @match            https://www.linkedin.com/jobs/search/*
// @version          1.0
// ==/UserScript==

(function() {
  const checkInterval = 4000;  // results pages don't result in reloads so we need to occasionally re-check the list
  const blacklistedEmployers = [
    "abridge",  // lies about remote
    "archipelago",  // lies about remote
    "circle",  // too much spam
    "earnest",  // lies about remote
    "gemini",  // crypto
    "id\\.me",  // lies about remote
    "paradigm national",  // lies about remote
    "whatnot",  // lies about remote
  ];
  const empExp = new RegExp("^((" + blacklistedEmployers.join(")|(") + "))$", "i");

  function markBlacklisted() {
    for (let empNode of document.querySelectorAll(".job-card-container__primary-description")) {
      if (empNode.linkedinBlacklistTested) {
        continue;
      }
      empNode.linkedinBlacklistTested = true;
      let employer = empNode.innerText.replace(/<!--.*?-->/g, "");
      if (empExp.test(employer)){
        let blacklistNode = document.createElement("span");
        blacklistNode.innerText = "(blacklisted)";
        blacklistNode.style.color = "#FF0000";
        empNode.appendChild(blacklistNode);
      }
    }
  }

  setInterval(markBlacklisted, checkInterval);
})();