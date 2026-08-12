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
    "Circle",  // spam
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
    "Abridge",  // lies about remote
    "Afresh",  // ghosted
    "Anchorage Digital",  // crypto
    "Appfigures",  // lies about remote
    "Archipelago",  // lies about remote
    "Axonius",  // lies about remote
    "Bastion",  // crypto
    "Bitsight",  // ghosted
    "Bowden Brown",  // ghosted
    "Cambium",  // lies about remote
    "Category Labs",  // crypto
    "City Detect",  // ghosted
    "Cohesity",  // lies about remote
    "Coinbase",  // crypto
    "CoinList",  // crypto
    "Cointracker",  // crypto
    "Cook'd",  // lies about openings, just resume-fishing
    "Cortex",  // ghosted
    "Daksta \\| Connecting Mission Critical Talent",  // lies about remote
    "Earnest",  // lies about remote
    "ECS \\(Equus Compute Solutions\\)",  // lies about remote
    "Eigen Labs",  // crypto
    "Engenious",  // lies about remote
    "Exodus",  // crypto
    "Figure",  // crypto
    "Finders SA",  // crypto
    "Flexa",  // crypto
    "Flexton Inc\\.",  // lies about remote
    "FUSTIS LLC",  // lies about remote
    "FutureTech Recruitment",  // lies about remote
    "FutureX",  // ghosted
    "FuturHealth",  // ghosted
    "Gemini",  // crypto
    "Hackajob",  // lies about remote
    "HackerOne",  // lies about remote
    "Hirematic Talent Solutions",  // lies about remote
    "Horizon3\\.ai",  // ghosted
    "ID\\.me",  // lies about remote
    "Inclusively",  // requires disability
    "Ingram Micro",  // lies about remote
    "Insight Global",  // lies about remote
    "Katalyst Space Technologies",  // lies about remote
    "Kinetic",  // crypto
    "Kraken",  // crypto
    "limitless",  // ghosted
    "Magic Eden",  // crypto
    "Magnet Forensics",  // ghosted
    "Metaplex Foundation",  // crypto
    "MissionHires",  // lies about remote
    "Mobius Talent Global", // lies about openings, just resume-fishing
    "Motional",  // ghosted
    "Multi Media LLC",  // ghosted
    "Mytra",  // ghosted
    "NextAxiom",  // lies about remote
    "NexTech Capital",  // lies about openings, just resume-fishing
    "Nira Energy",  // ghosted
    "Nurp",  // lies about remote
    "Nxt Level",  // lies about remote
    "Onebrief",  // ghosted
    "Orca",  // crypto
    "ŌURA",  // ghosted after invasive evaluation
    "Paradigm National",  // lies about remote
    "Paxos",  // crypto
    "Prime Team Partners",  // lies about remote
    "Prolaio",  // ghosted
    "Prometheum",  // crypto
    "Pryon",  // ghosted
    "Qcells North America",  // lies about remote
    "Raydar",  // lies about remote
    "River",  // crypto
    "Scribe",  // lies about remote
    "Seer",  // crypto
    "Seesaw",  // ghosted
    "Selby Jennings",  // ghosted
    "SevenRooms",  // lies about openings, just resume-fishing
    "SHI International Corp\\.",  // lies about remote
    "Smart Design",  // lies about remote
    "Stott and May",  // ghosted
    "Success Matcher Recruitment, LLC",  // lies about remote
    "Symphony Labs",  // crypto
    "Teal Energi",  // lies about remote
    "Tecton",  // lies about remote
    "Tensec",  // lies about remote
    "Tentec, Inc\\.",  // lies about remote
    "The Fountain Group",  // lies about remote
    "The Judge Group",  // lies about remote
    "The Voleon Group",  // ghosted
    "TRM Labs",  // crypto
    "Trojan Trading",  // crypto
    "Trustec",  // lies about remote
    "TVision",  // ghosted
    "Uniswap Labs",  // crypto
    "United Talent Agency",  // lies about remote
    "Unseen",  // lies about openings, just resume-fishing
    "Upwards",  // lies about remote
    "Valon",  // ghosted
    "Valve Engineers",  // lies about remote
    "Wealthsimple",  // lies about openings, just resume-fishing
    "Wex", // lies about remote
    "Whatnot",  // lies about remote
    "Yara AI",  // lies about openings, just resume-fishing
    "Zest for Tech",  // ghosted
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
