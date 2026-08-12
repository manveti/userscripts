// ==UserScript==
// @name             LinkedIn Blacklist
// @match            https://www.linkedin.com/*
// @version          1.0
// ==/UserScript==

(function() {
  const checkInterval = 2000;  // results pages don't result in reloads so we need to occasionally re-check the list
  const blacklistedEmployers = [
    "abridge",  // lies about remote
    "anchorage digital",  // crypto
    "appfigures",  // lies about remote
    "archipelago",  // lies about remote
    "axonius",  // lies about remote
    "bastion",  // crypto
    "cambium",  // lies about remote
    "category labs",  // crypto
    "circle",  // too much spam
    "cohesity",  // lies about remote
    "coinbase",  // crypto
    "cointracker",  // crypto
    "cook'd",  // lies about openings, just resume-fishing
    "crossing hurdles",  // spam
    "daksta \\| connecting mission critical talent",  // lies about remote
    "earnest",  // lies about remote
    "ecs \\(equus compute solutions\\)",  // lies about remote
    "eigen labs",  // crypto
    "exodus",  // crypto
    "figure",  // crypto
    "finders sa",  // crypto
    "flexa",  // crypto
    "flexton inc\\.",  // lies about remote
    "fustis llc",  // lies about remote
    "futuretech recruitment",  // lies about remote
    "gemini",  // crypto
    "hackajob",  // lies about remote
    "hackerone",  // lies about remote
    "helixrecruit",  // spam
    "hirematic talent solutions",  // lies about remote
    "id\\.me",  // lies about remote
    "inclusively",  // requires disability
    "ingram micro",  // lies about remote
    "insight global",  // lies about remote
    "kinetic",  // crypto
    "kraken",  // crypto
    "magic eden",  // crypto
    "metaplex foundation",  // crypto
    "mobius talent global", // lies about openings, just resume-fishing
    "nextaxiom",  // lies about remote
    "nurp",  // lies about remote
    "nxt level",  //lies about remote
    "orca",  // crypto
    "paradigm national",  // lies about remote
    "paxos",  // crypto
    "prime team partners",  // lies about remote
    "prometheum",  // crypto
    "qcells north america",  // lies about remote
    "raydar",  // lies about remote
    "river",  // crypto
    "scribe",  // lies about remote
    "seer",  // crypto
    "sevenrooms",  // lies about openings, just resume-fishing
    "shi international corp\\.",  // lies about remote
    "success matcher recruitment, llc",  // lies about remote
    "symphony labs",  // crypto
    "tecton",  // lies about remote
    "tensec",  // lies about remote
    "tentec, inc\\.",  // lies about remote
    "the fountain group",  // lies about remote
    "the judge group",  // lies about remote
    "trm labs",  // crypto
    "trojan trading",  // crypto
    "trustec",  // lies about remote
    "uniswap labs",  // crypto
    "united talent agency",  // lies about remote
    "unseen",  // lies about openings, just resume-fishing
    "upwards",  // lies about remote
    "valve engineers",  // lies about remote
    "wex", // lies about remote
    "whatnot",  // lies about remote
  ];
  const empExp = new RegExp("^((" + blacklistedEmployers.join(")|(") + "))$", "i");
  const nameSelector = ".artdeco-entity-lockup__subtitle";  // .job-card-container__primary-description

  function docHasEmpNodes(ifDoc) {
    for (let empNode of ifDoc.querySelectorAll(nameSelector)) {
      if (empNode) {
        return true;
      }
    }
    return false;
  }

  function getIframeDoc() {
    for (let ifr of document.getElementsByTagName("iframe")) {
      let ifDoc = ifr.contentWindow.document;
      if (docHasEmpNodes(ifDoc)) {
        return ifDoc;
      }
    }
    return null;
  }

  let doc = document;
  let gotDoc = false;

  function markBlacklisted() {
    if (!gotDoc) {
      let ifDoc = getIframeDoc();
      if (ifDoc) {
        doc = ifDoc;
        gotDoc = true;
      }
    }
    for (let empNode of doc.querySelectorAll(nameSelector)) {
      if (empNode.linkedinBlacklistTested) {
        continue;
      }
      empNode.linkedinBlacklistTested = true;
      let employer = empNode.innerText.replace(/<!--.*?-->/g, "");
      if (empExp.test(employer)){
        let blacklistNode = doc.createElement("span");
        blacklistNode.innerText = "(blacklisted)";
        blacklistNode.style.color = "#FF0000";
        empNode.appendChild(blacklistNode);
      }
    }
  }

  setInterval(markBlacklisted, checkInterval);
})();