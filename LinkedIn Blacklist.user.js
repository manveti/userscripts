// ==UserScript==
// @name             LinkedIn Blacklist
// @match            https://www.linkedin.com/*
// @version          1.0
// ==/UserScript==

(async function() {
  const JOB_LIST_SELECTOR = ".scaffold-layout__list";
  const JOB_SELECTOR = "li";
  const EMPLOYER_SELECTOR = ".artdeco-entity-lockup__subtitle";
  const OBSERVER_OPTIONS = {
    childList: true,
    subtree: true
  };
  const SETTLE_DELAY = 200;  // ms; how long we wait for job list to settle down before traversing
  //TODO: eventually make these dynamic
  const HIDE_EMPLOYERS = [
    "Alignerr",  // spam
    "Crossing Hurdles",  // spam
    "Handshake",  // spam
    "Haystack",  // spam
    "HelixRecruit",  // spam
    "Hire Feed",  // spam
    "Ladders",  // spam
    "Quik Hire Staffing",  // spam
    "RemoteHunter",  // spam
    "Samsara",  // spam
    "YO AI Labs",  // spam
  ];
  const ANNOTATE_EMPLOYERS = [
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
  let hideExp = new RegExp("^((" + HIDE_EMPLOYERS.join(")|(") + "))$", "i");
  let annotateExp = new RegExp("^((" + ANNOTATE_EMPLOYERS.join(")|(") + "))$", "i");

  let settleTimeout;

  async function getJobList() {
    return new Promise((resolve) => {
      let jobList = document.querySelector(JOB_LIST_SELECTOR);
      if (jobList) {
        return resolve(jobList);
      }

      let observer = new MutationObserver(() => {
        let jobList = document.querySelector(JOB_LIST_SELECTOR);
        if (jobList) {
          observer.disconnect();
          resolve(jobList);
        }
      });
      observer.observe(document.body, OBSERVER_OPTIONS);
    });
  }

  function markBlacklistedHelper(jobList) {
    for (let jobNode of jobList.querySelectorAll(JOB_SELECTOR)) {
      if (jobNode.linkedinBlacklistTested) {
        continue;
      }
      let empNode = jobNode.querySelector(EMPLOYER_SELECTOR);
      if (!empNode) {
        continue;
      }
      jobNode.linkedinBlacklistTested = true;
      let employer = empNode.innerText.replace(/<!--.*?-->/g, "");
      if (hideExp.test(employer)) {
        jobNode.style.display = "none";
      }
      else if (annotateExp.test(employer)) {
        let blacklistNode = document.createElement("span");
        blacklistNode.innerText = "(blacklisted)";
        blacklistNode.style.color = "#FF0000";
        empNode.appendChild(blacklistNode);
      }
    }
  }

  function markBlacklistedAfterSettled(jobList) {
    clearTimeout(settleTimeout);
    settleTimeout = setTimeout(() => markBlacklistedHelper(jobList), SETTLE_DELAY);
  }

  function markBlacklisted(jobList) {
    markBlacklistedHelper(jobList);
    let observer = new MutationObserver((mutations) => {
      function hasNewElement(mutation) {
        return Array.from(mutation.addedNodes).some((node) => (node.nodeType == 1));  // nodeType 1 is element node
      }
      if (mutations.some(hasNewElement)) {
        markBlacklistedAfterSettled(jobList);
      }
    });
    observer.observe(jobList, OBSERVER_OPTIONS);
  }

  let jobList = await getJobList();
  markBlacklisted(jobList);
})();
