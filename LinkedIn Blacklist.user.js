// ==UserScript==
// @name             LinkedIn Blacklist
// @match            https://www.linkedin.com/jobs/*
// @version          1.0
// ==/UserScript==

(async function() {
  const OBSERVER_OPTIONS = {
    childList: true,
    subtree: true
  };
  const SETTLE_DELAY = 200;  // ms; how long we wait for job list to settle down before traversing
  //TODO: eventually make these dynamic
  const HIDE_EMPLOYERS = [
    "AfterQuery Experts",  // spam
    "AIMB-X Labs",  // crypto
    "Alchemy",  // crypto
    "Alignerr",  // spam
    "Anchorage Digital",  // crypto
    "Bastion",  // crypto
    "Calvary Financial Group",  // spam
    "Category Labs",  // crypto
    "Circle",  // spam
    "Codefeast", // spam
    "CodeGeniusRecruit",  // spam
    "CodeVertex.*",  // spam
    "Coinbase",  // crypto
    "CoinList",  // crypto
    "Cointracker",  // crypto
    "Crossing Hurdles",  // spam
    "Crossover",  // spam
    "CyberCoders",  // spam
    "Eigen Labs",  // crypto
    "Elastic",  // not technically spam, but way too many irrelevant postings
    "Ethos",  // spam
    "Exodus",  // crypto
    "Featherless AI",  // spam
    "Figure",  // crypto
    "Finders SA",  // crypto
    "Flexa",  // crypto
    "Gemini",  // crypto
    "Handshake",  // spam
    "Haystack",  // spam
    "HelixRecruit",  // spam
    "Hire Feed",  // spam
    "Hired",  // lies about openings, just resume-fishing
    "Humana",  // maybe not technically spam, but way too many postings
    "HuntingCube",  // crypto
    "IBM",  // not technically spam, but way too many irrelevant postings
    "Jobot",  // spam
    "Jobot Consulting",  // spam
    "Jobs AI",  // spam
    "Kinetic",  // crypto
    "Kraken",  // crypto
    "Ladders",  // spam
    "Magic Eden",  // crypto
    "Mercor",  // spam
    "Meta",  // just no
    "Metaplex Foundation",  // crypto
    "OpenAI",  // just no
    "Orca",  // crypto
    "ŌURA",  // ghosted after invasive evaluation
    "Paramount Financial Recruiting",  //spam
    "Paxos",  // crypto
    "Plexus Resource Solutions",  // crypto
    "Prometheum",  // crypto
    "PSI Groups", // spam
    "Quik Hire Staffing",  // spam
    "Rain",  // crypto
    "RemoteHunter",  // spam
    "River",  // crypto
    "Samsara",  // spam
    "Seer",  // crypto
    "Storm\\d+",  // spam
    "Symphony Labs",  // crypto
    "Synthires",  // spam
    "TalentHop",  // spam
    "The Bill Lampe Group Inc\\.",  // spam
    "Triumphant Financial Group",  // spam
    "TRM Labs",  // crypto
    "Trojan Trading",  // crypto
    "TYG",  // lots of postings completely irrelevant to my search terms
    "Underdog[^a-zA-Z].*",  // spam
    "Uniswap Labs",  // crypto
    "ValCera",  // crypto
    "YO AI Labs",  // spam
    "YO HR Consultancy",  // spam
  ];
  const ANNOTATE_EMPLOYERS = [
    "Abridge",  // lies about remote
    "Acceler8 Talent",  // ghosted
    "Afresh",  // ghosted
    "Appfigures",  // lies about remote
    "Archipelago",  // lies about remote
    "Axonius",  // lies about remote
    "Bitsight",  // ghosted
    "Bowden Brown",  // ghosted
    "Cambium",  // lies about remote
    "City Detect",  // ghosted
    "Cohesity",  // lies about remote
    "Cook'd",  // lies about openings, just resume-fishing
    "Cortex",  // ghosted
    "Daksta \\| Connecting Mission Critical Talent",  // lies about remote
    "Dandelion Health",  // ghosted
    "Earnest",  // lies about remote
    "ECS \\(Equus Compute Solutions\\)",  // lies about remote
    "Engenious",  // lies about remote
    "Fairwinds Technologies",  // lies about remote
    "Flexton Inc\\.",  // lies about remote
    "FUSTIS LLC",  // lies about remote
    "FutureTech Recruitment",  // lies about remote
    "FutureX",  // ghosted
    "FuturHealth",  // ghosted
    "GliaCell Technologies",  // lies about remote
    "Hackajob",  // lies about remote
    "HackerOne",  // lies about remote
    "Hirematic Talent Solutions",  // lies about remote
    "Horizon3\\.ai",  // ghosted
    "ID\\.me",  // lies about remote
    "Inclusively",  // requires disability
    "Ingram Micro",  // lies about remote
    "Insight Global",  // lies about remote
    "Judi Health",  //ghosted
    "Katalyst Space Technologies",  // lies about remote
    "limitless",  // ghosted
    "Magnet Forensics",  // ghosted
    "MissionHires",  // lies about remote
    "Mobius Talent Global", // lies about openings, just resume-fishing
    "Motional",  // ghosted
    "Multi Media LLC",  // ghosted
    "Mytra",  // ghosted
    "Nametag",  // ghosted
    "NextAxiom",  // lies about remote
    "NexTech Capital",  // lies about openings, just resume-fishing
    "Nira Energy",  // ghosted
    "Nurp",  // lies about remote
    "Nxt Level",  // lies about remote
    "Onebrief",  // ghosted
    "Paradigm National",  // lies about remote
    "Pivotal",  // ghosted
    "Prime Team Partners",  // lies about remote
    "PROJECTUS",  // lies about remote
    "Prolaio",  // ghosted
    "Pryon",  // ghosted
    "Qcells North America",  // lies about remote
    "Raydar",  // lies about remote
    "Scribe",  // lies about remote
    "Seesaw",  // ghosted
    "Selby Jennings",  // ghosted
    "SevenRooms",  // lies about openings, just resume-fishing
    "SHI International Corp\\.",  // lies about remote
    "Smart Design",  // lies about remote
    "Snapsheet Inc",  // ghosted
    "Stott and May",  // ghosted
    "Success Matcher Recruitment, LLC",  // lies about remote
    "Teal Energi",  // lies about remote
    "TechTree",  // lies about openings, just resume-fishing
    "Tecton",  // lies about remote
    "Tensec",  // lies about remote
    "Tentec, Inc\\.",  // lies about remote
    "The Fountain Group",  // lies about remote
    "The Judge Group",  // lies about remote
    "The Voleon Group",  // ghosted
    "Trustec",  // lies about remote
    "TVision",  // ghosted
    "Umbra",  // ghosted
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
  const HIDE_TITLES = [
    "\\bActuary\\b",
    "\\bAI\\b",
    "\\bDeveloper Advocate\\b",
    "\\bDevOps Engineer\\b",
    "\\bForward Deploy",
    "\\bFull[- ]?Stack\\b",
    "\\bGrant Writer\\b",
    "\\bManager\\b",
    "\\bPlatform Engineer\\b",
    "\\bSales Engineer\\b",
    "\\bSite Reliability\\b",
    "\\bStructural( Design)? Engineer\\b",
    "\\bSupport Engineer\\b",
    "\\bTransmission Line Engineer\\b",
  ];
  // maybe replace "\\bAI\\b" with:
  //    "\\bAI-(First|Native)\\b", "\\bAI(/ML)? ((Data Engineer)|Developer|Domain|Engineer|Native|Operations|Product|Research|Solutions)\\b"
  let hideExp = new RegExp("^((" + HIDE_EMPLOYERS.join(")|(") + "))$", "i");
  let annotateExp = new RegExp("^((" + ANNOTATE_EMPLOYERS.join(")|(") + "))$", "i");
  let titleHideExp = new RegExp("(" + HIDE_TITLES.join(")|(") + ")", "i")

  class JobListHandler {
    static JOB_LIST_SELECTOR;

    constructor(jobList) {
      this.jobList = jobList;
      this.settleTimeout = null;
      this.jobsObserver = null;
    }

    static getJobList() {
      return document.querySelector(this.JOB_LIST_SELECTOR);
    }

    getJobNodes() {
      return [];
    }

    getTitleNode(jobNode) {}

    getEmployerNode(jobNode) {}

    handleBlacklistedOnce() {
      for (let jobNode of this.getJobNodes()) {
        if (jobNode.linkedinBlacklistTested) {
          continue;
        }
        let titleNode = this.getTitleNode(jobNode);
        if (titleNode) {
          let title = titleNode.innerText.replace(/<!--.*?-->/g, "");
          if (titleHideExp.test(title)) {
            jobNode.style.display = "none";
            jobNode.linkedinBlacklistTested = true;
            continue;
          }
        }
        let empNode = this.getEmployerNode(jobNode);
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

    handleBlacklistedAfterSettled() {
      clearTimeout(this.settleTimeout);
      this.settleTimeout = setTimeout(() => this.handleBlacklistedOnce(), SETTLE_DELAY);
    }

    handleBlacklisted() {
      this.handleBlacklistedOnce();
      this.jobsObserver = new MutationObserver((mutations) => {
        function hasNewElement(mutation) {
          return Array.from(mutation.addedNodes).some((node) => (node.nodeType == 1));  // nodeType 1 is element node
        }
        if (mutations.some(hasNewElement)) {
          this.handleBlacklistedAfterSettled();
        }
      });
      this.jobsObserver.observe(this.jobList, OBSERVER_OPTIONS);
    }

    start() {
      this.handleBlacklisted();
    }

    halt() {
      this.jobsObserver.disconnect();
      this.jobsObserver = null;
      clearTimeout(this.settleTimeout);
      this.settleTimeout = null;
    }

    restart() {
      this.halt();
      this.start();
    }
  }

  class LegacyJobListHandler extends JobListHandler {
    static JOB_LIST_SELECTOR = ".scaffold-layout__list";
    static JOB_SELECTOR = "li";
    static EMPLOYER_SELECTOR = ".artdeco-entity-lockup__subtitle";
    static TITLE_SELECTOR = ".artdeco-entity-lockup__title span";

    getJobNodes() {
      return this.jobList.querySelectorAll(this.constructor.JOB_SELECTOR);
    }

    getTitleNode(jobNode) {
      return jobNode.querySelector(this.constructor.TITLE_SELECTOR);
    }

    getEmployerNode(jobNode) {
      return jobNode.querySelector(this.constructor.EMPLOYER_SELECTOR);
    }
  }

  class SlopJobListHandler extends JobListHandler {
    static JOB_LIST_SELECTOR = 'div[componentkey="SearchResultsMainContent"]';
    static JOB_SELECTOR = ":scope > div[style]";

    constructor(jobList) {
      super(jobList);
      // slop search often removes everything and replaces it with a new DOM, so set up an observer to grab the new job list when that happens
      let self = this;
      let observer = new MutationObserver((mutations) => {
        function jobListRemoved(mutation){
          return Array.from(mutation.removedNodes).some((node) => (node.contains(self.jobList)));
        }
        if (mutations.some(jobListRemoved)) {
          self.restart();
        }
      });
      observer.observe(document.body, OBSERVER_OPTIONS);
    }

    start() {
      // slop search has a lot of extraneous stuff in the layout which means 25-30% fewer results can bee seen at a time; remove some of it
      this.clearLayoutCruft();
      super.start();
    }

    restart() {
      this.halt();
      this.jobList = this.constructor.getJobList();
      if (this.jobList) {
        return this.start();
      }
      let observer = new MutationObserver(() => {
        this.jobList = this.constructor.getJobList();
        if (this.jobList) {
          observer.disconnect();
          return this.start();
        }
      });
      observer.observe(document.body, OBSERVER_OPTIONS);
    }

    getJobNodes() {
      return this.jobList.querySelectorAll(this.constructor.JOB_SELECTOR);
    }

    getTitleNode(jobNode) {
      // this is a fragile hack, but unavoidable because the layout has very few reasonable landmarks
      return jobNode.querySelectorAll("p")[0];
    }

    getEmployerNode(jobNode) {
      // this is a fragile hack, but unavoidable because the layout has very few reasonable landmarks
      return jobNode.querySelectorAll("p")[1];
    }

    clearLayoutCruft() {
      // messenger overlay can cover the "more..." link to expand job descriptions
      let msgOverlay = document.getElementById("interop-outlet");
      if (msgOverlay) {
        msgOverlay.style.display = "none";
      }
      // blue overlay bar at the bottom of the results list
      this.jobList.childNodes[this.jobList.childNodes.length - 1].style.display = "none";
      this.jobList.childNodes[this.jobList.childNodes.length - 1].linkedinBlacklistTested = true;  // else we'll treat this as a job node
      // nav bar has lots of pointless buttons to add keywords to the search; trim the most pointless of them so they don't end up line-wrapping
      let navBar = document.getElementById("JobsSearchFilters").querySelector("nav");
      for (let navButton of navBar.querySelectorAll(":scope > *:has(> div[aria-checked])")) {
        navButton.style.display = "none";
      }
    }
  }

  function getJobListHandlerHelper() {
    let jobList = LegacyJobListHandler.getJobList();
    if (jobList) {
      return new LegacyJobListHandler(jobList);
    }
    jobList = SlopJobListHandler.getJobList();
    if (jobList) {
      return new SlopJobListHandler(jobList);
    }
  }

  async function getJobListHandler() {
    return new Promise((resolve) => {
      let jobListHandler = getJobListHandlerHelper();
      if (jobListHandler) {
        return resolve(jobListHandler);
      }

      let observer = new MutationObserver(() => {
        let jobListHandler = getJobListHandlerHelper();
        if (jobListHandler) {
          observer.disconnect();
          return resolve(jobListHandler);
        }
      });
      observer.observe(document.body, OBSERVER_OPTIONS);
    });
  }

  let jobListHandler = await getJobListHandler();
  jobListHandler.start();
})();
