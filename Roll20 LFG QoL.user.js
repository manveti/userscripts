// ==UserScript==
// @name             Roll20 LFG QoL
// @match            https://app.roll20.net/lfg/search/*
// @version          1.0
// ==/UserScript==

(function() {
  const userExp = /\/users\/(?<userId>\d+)/;
  const playersExp = /(?<numPlayers>\d+) Current Players/;
  const slotsExp = /(?<openSlots>\d+) Open Slots/;

  const scriptPrefix = "r20LfgQol";
  const languageKey = scriptPrefix + "Language";
  const blockListingsKey = scriptPrefix + "BlockListings";
  const blockUsersKey = scriptPrefix + "BlockUsers";
  const maxCurPlayersKey = scriptPrefix + "MaxCurPlayers";
  const maxTotalPlayersKey = scriptPrefix + "MaxTotalPlayers";

  const reasonListing = "Listing Hidden";
  const reasonUser = "User Blocked";
  const reasonMaxCur = "Too Many Current Players";
  const reasonMaxTotal = "Too Many Total Players";

  let language = GM_getValue(languageKey) || "Any";
  let blockListings = JSON.parse(GM_getValue(blockListingsKey) || "{}");
  let blockUsers = JSON.parse(GM_getValue(blockUsersKey) || "{}");
  let maxCurPlayers = JSON.parse(GM_getValue(maxCurPlayersKey) || "0");
  let maxTotalPlayers = JSON.parse(GM_getValue(maxTotalPlayersKey) || "0");

  // check "free to play" and "mature content" boxes and select English-language games
  const noPayToPlay = document.querySelector(".nopaytoplay");
  noPayToPlay.checked = true;
  const yesMatureContent = document.querySelector(".yesmaturecontent");
  yesMatureContent.checked = true;
  const languageBox = document.querySelector(".advanced .inline-labels select[name=language]");
  if (languageBox !== null) {
    languageBox.value = language;
  }

  let hiddenListings = [];
  let hiddenReasonCounts = {};

  function hideListing(listing, reason) {
    let entry = {
      "listing": listing,
      "display": listing.style.display,
      "reason": reason
    };
    hiddenListings.push(entry);
    if (!hiddenReasonCounts[reason]) {
      hiddenReasonCounts[reason] = 0;
    }
    hiddenReasonCounts[reason] += 1;
    listing.style.display = "none";
  }

  function updateShowButtons(reason) {
    let allHidden = document.getElementById(scriptPrefix + "ShowAllBut");
    allHidden.innerText = `Show All ${hiddenListings.length} Hidden Listings`;
    let showBut = document.getElementById(scriptPrefix + "Show" + reason.replaceAll(" ", "") + "But");
    showBut.innerText = `Show ${hiddenReasonCounts[reason]} Hidden: ${reason}`;
  }

  function blockListing(listing, listingId) {
    blockListings = JSON.parse(GM_getValue(blockListingsKey) || "{}");
    if (!(listingId in blockListings)) {
      blockListings[listingId] = Date.now();
      GM_setValue(blockListingsKey, JSON.stringify(blockListings));
    }
    hideListing(listing, reasonListing);
    updateShowButtons(reasonListing);
  }

  function blockUser(userId, userName) {
    blockUsers = JSON.parse(GM_getValue(blockUsersKey) || "{}");
    if (!(userId in blockUsers)) {
      blockUsers[userId] = userName;
      GM_setValue(blockUsersKey, JSON.stringify(blockUsers));
    }
    for (let listing of document.querySelectorAll(".lfglisting")) {
      if (listing.style.display === "none") {
        continue;
      }
      const userProfile = listing.querySelector(".profilemeta .userprofile");
      let userMatch = userExp.exec(userProfile.href);
      if ((userMatch === null) || (userMatch.groups.userId !== userId)) {
        continue;
      }
      hideListing(listing, reasonUser);
    }
    updateShowButtons(reasonUser);
  }

  function setLanguage() {
    let langSel = document.getElementById(scriptPrefix + "LanguageBox");
    if (langSel === null) {
      return;
    }
    language = langSel.value;
    GM_setValue(languageKey, language);
  }

  function setMaxPlayers() {
    let maxCurPlayersBox = document.getElementById(scriptPrefix + "MaxCurPlayersBox");
    if (maxCurPlayersBox !== null) {
      maxCurPlayers = parseInt(maxCurPlayersBox.value);
      GM_setValue(maxCurPlayersKey, JSON.stringify(maxCurPlayers));
    }
    let maxTotalPlayersBox = document.getElementById(scriptPrefix + "MaxTotalPlayersBox");
    if (maxTotalPlayersBox !== null) {
      maxTotalPlayers = parseInt(maxTotalPlayersBox.value);
      GM_setValue(maxTotalPlayersKey, JSON.stringify(maxTotalPlayers));
    }
    //TODO: update listings
  }

  function resetMaxPlayers() {
    let maxCurPlayersBox = document.getElementById(scriptPrefix + "MaxCurPlayersBox");
    if (maxCurPlayersBox !== null) {
      maxCurPlayersBox.value = "" + maxCurPlayers;
    }
    let maxTotalPlayersBox = document.getElementById(scriptPrefix + "MaxTotalPlayersBox");
    if (maxTotalPlayersBox !== null) {
      maxTotalPlayersBox.value = "" + maxTotalPlayers;
    }
  }

  for (let listing of document.querySelectorAll(".lfglisting")) {
    // hide specified listings
    const listingId = listing.getAttribute("data-listingid");
    if (listingId in blockListings) {
      hideListing(listing, reasonListing);
      continue;
    }
    const thumb = listing.querySelector(".thumb");
    let listingButton = document.createElement("button");
    listingButton.innerText = "Hide Listing";
    listingButton.onclick = () => blockListing(listing, listingId);
    thumb.appendChild(listingButton);

    // hide listings by specified users
    const profileMeta = listing.querySelector(".profilemeta");
    const userProfile = profileMeta.querySelector(".userprofile");
    let userMatch = userExp.exec(userProfile.href);
    if (userMatch !== null) {
      const userId = userMatch.groups.userId;
      if (userId in blockUsers) {
        hideListing(listing, reasonUser);
        continue;
      }
      const userName = userProfile.innerText;
      let userButton = document.createElement("button");
      userButton.innerText = "Block User";
      userButton.onclick = () => blockUser(userId, userName);
      profileMeta.appendChild(userButton);
    }

    // hide listings with too many players
    const meta = listing.querySelector(".meta");
    let playersMatch = playersExp.exec(meta.innerHTML);
    if (playersMatch === null) {
      continue;
    }
    const numPlayers = parseInt(playersMatch.groups.numPlayers);
    if ((maxCurPlayers > 0) && (numPlayers > maxCurPlayers)) {
      hideListing(listing, reasonMaxCur);
      continue;
    }
    let slotsMatch = slotsExp.exec(meta.innerHTML);
    if (slotsMatch === null) {
      continue;
    }
    const openSlots = parseInt(slotsMatch.groups.openSlots);
    if ((maxTotalPlayers > 0) && (numPlayers + openSlots > maxTotalPlayers)) {
      hideListing(listing, reasonMaxTotal);
      continue;
    }
  }

  // settings and statistics
  const campaigns = document.querySelector(".campaigns");
  let settingsStats = document.createElement("div");
  let settingsLbl = document.createElement("strong");
  settingsLbl.innerText = "Roll20 LFG QoL Settings / Stats";
  settingsStats.appendChild(settingsLbl);
  let settingsDiv = document.createElement("div");
  let langSettingDiv = document.createElement("div");
  langSettingDiv.appendChild(document.createTextNode("Language: "));
  let langSel = languageBox.cloneNode(true);
  langSel.id = scriptPrefix + "LanguageBox";
  langSel.value = language;
  langSel.onchange = setLanguage;
  langSettingDiv.appendChild(langSel);
  settingsDiv.appendChild(langSettingDiv);
  let playersSettingsDiv = document.createElement("div");
  playersSettingsDiv.appendChild(document.createTextNode("Max Current Players: "));
  let maxCurPlayersBox = document.createElement("input");
  maxCurPlayersBox.id = scriptPrefix + "MaxCurPlayersBox";
  maxCurPlayersBox.value = "" + maxCurPlayers;
  playersSettingsDiv.appendChild(maxCurPlayersBox);
  playersSettingsDiv.appendChild(document.createTextNode("Max Total Players: "));
  let maxTotalPlayersBox = document.createElement("input");
  maxTotalPlayersBox.id = scriptPrefix + "MaxTotalPlayersBox";
  maxTotalPlayersBox.value = "" + maxTotalPlayers;
  playersSettingsDiv.appendChild(maxTotalPlayersBox);
  let maxPlayersSetBut = document.createElement("button");
  maxPlayersSetBut.innerText = "Set";
  maxPlayersSetBut.onclick = setMaxPlayers;
  playersSettingsDiv.appendChild(maxPlayersSetBut);
  let maxPlayersResetBut = document.createElement("button");
  maxPlayersResetBut.innerText = "Reset";
  maxPlayersResetBut.onclick = resetMaxPlayers;
  playersSettingsDiv.appendChild(maxPlayersResetBut);
  settingsDiv.appendChild(playersSettingsDiv);
  //TODO: additional settings: blocked listing prune interval; manage blocked listings/users
  settingsStats.appendChild(settingsDiv);
  let allHidden = document.createElement("button");
  allHidden.id = scriptPrefix + "ShowAllBut";
  allHidden.innerText = `Show All ${hiddenListings.length} Hidden Listings`;
  //TODO: handler
  settingsStats.appendChild(allHidden);
  let showDiv = document.createElement("div");
  for (let reason in hiddenReasonCounts) {
    let showBut = document.createElement("button");
    showBut.id = scriptPrefix + "Show" + reason.replaceAll(" ", "") + "But";
    showBut.innerText = `Show ${hiddenReasonCounts[reason]} Hidden: ${reason}`;
    //TODO: handler
    showDiv.appendChild(showBut);
  }
  settingsStats.appendChild(showDiv);
  campaigns.appendChild(settingsStats);
})();