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
  const listingPruneIntervalKey = scriptPrefix + "ListingPruneInterval";

  const reasonListing = "Listing Hidden";
  const reasonUser = "User Blocked";
  const reasonMaxCur = "Too Many Current Players";
  const reasonMaxTotal = "Too Many Total Players";

  const dayMs = 24 * 60 * 60 * 1000;

  let language = GM_getValue(languageKey) || "Any";
  let blockListings = JSON.parse(GM_getValue(blockListingsKey) || "{}");
  let blockUsers = JSON.parse(GM_getValue(blockUsersKey) || "{}");
  let maxCurPlayers = JSON.parse(GM_getValue(maxCurPlayersKey) || "0");
  let maxTotalPlayers = JSON.parse(GM_getValue(maxTotalPlayersKey) || "0");
  let listingPruneInterval = JSON.parse(GM_getValue(listingPruneIntervalKey) || "30");

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

  function hideListing(listing, reason, reasonArg = null) {
    let entry = {
      "listing": listing,
      "display": listing.style.display,
      "reason": reason,
      "reasonArg": reasonArg
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
    const listingName = listing.querySelector(".lfglistingname");
    const name = listingName?.innerText || listingId;
    blockListings = JSON.parse(GM_getValue(blockListingsKey) || "{}");
    if (!(listingId in blockListings)) {
      blockListings[listingId] = {"name": name, "lastSeen": Date.now()};
      GM_setValue(blockListingsKey, JSON.stringify(blockListings));
    }
    hideListing(listing, reasonListing, listingId);
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
      hideListing(listing, reasonUser, userId);
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

  function unblockListing(listDiv, listingDiv, listingId) {
    blockListings = JSON.parse(GM_getValue(blockListingsKey) || "{}");
    if (listingId in blockListings) {
      delete blockListings[listingId];
      GM_setValue(blockListingsKey, JSON.stringify(blockListings));
    }
    for (let i = 0; i < hiddenListings.length; i++) {
      if ((hiddenListings[i].reason === reasonListing) && (hiddenListings[i].reasonArg === listingId)) {
        hiddenListings[i].listing.style.display = hiddenListings[i].display;
        hiddenListings.splice(i, 1);
        updateShowButtons(reasonListing);
        break;
      }
    }
    listDiv.removeChild(listingDiv);
  }

  function populateBlockedListings(listDiv) {
    let listingIds = [];
    for (let listingId in blockListings) {
      listingIds.push(listingId);
    }
    listingIds.sort((x, y) => blockListings[x].name.localeCompare(blockListings[y].name));
    for (let listingId of listingIds) {
      let listingDiv = document.createElement("div");
      let listingLbl = document.createElement("a");
      listingLbl.innerText = blockListings[listingId].name;
      listingLbl.href = "https://app.roll20.net/lfg/listing/" + listingId;
      listingDiv.appendChild(listingLbl);
      let listingTimestamp = new Date(blockListings[listingId].lastSeen);
      let timestampStr = listingTimestamp.toLocaleString(undefined, {"dateStyle": "short", "timeStyle": "short"});
      listingDiv.appendChild(document.createTextNode(` Last Seen: ${timestampStr} `));
      let unblockListingBut = document.createElement("button");
      unblockListingBut.innerText = "Unblock";
      unblockListingBut.onclick = () => unblockListing(listDiv, listingDiv, listingId);
      listingDiv.appendChild(unblockListingBut);
      listDiv.appendChild(listingDiv);
    }
  }

  function toggleBlockedListings() {
    let blockedListingsDiv = document.getElementById(scriptPrefix + "BlockedListingsList");
    let blockedListingsBut = document.getElementById(scriptPrefix + "BlockedListingsBut");
    if ((!blockedListingsDiv) || (!blockedListingsBut)) {
      return;
    }
    if (blockedListingsDiv.firstChild !== blockedListingsDiv.lastChild) {
      blockedListingsDiv.removeChild(blockedListingsDiv.firstChild);
      blockedListingsBut.innerText = "Show Blocked Listings";
      return;
    }
    blockedListingsBut.innerText = "Hide Blocked Listings";
    let listDiv = document.createElement("div");
    populateBlockedListings(listDiv);
    blockedListingsDiv.insertBefore(listDiv, blockedListingsDiv.firstChild);
  }

  function unblockUser(listDiv, userDiv, userId) {
    blockUsers = JSON.parse(GM_getValue(blockUsersKey) || "{}");
    if (userId in blockUsers) {
      delete blockUsers[userId];
      GM_setValue(blockUsersKey, JSON.stringify(blockUsers));
    }
    let newHiddenListings = [];
    for (let entry of hiddenListings) {
      if ((entry.reason === reasonUser) && (entry.reasonArg === userId)) {
        entry.listing.style.display = entry.display;
      }
      else {
        newHiddenListings.push(entry);
      }
    }
    hiddenListings = newHiddenListings;
    updateShowButtons(reasonUser);
    listDiv.removeChild(userDiv);
  }

  function populateBlockedUsers(listDiv) {
    let userIds = [];
    for (let userId in blockUsers) {
      userIds.push(userId);
    }
    userIds.sort((x, y) => blockUsers[x].localeCompare(blockUsers[y]));
    for (let userId of userIds) {
      let userDiv = document.createElement("div");
      let userLbl = document.createElement("a");
      userLbl.innerText = blockUsers[userId];
      userLbl.href = "https://app.roll20.net/users/" + userId;
      userDiv.appendChild(userLbl);
      let unblockUserBut = document.createElement("button");
      unblockUserBut.innerText = "Unblock";
      unblockUserBut.onclick = () => unblockUser(listDiv, userDiv, userId);
      userDiv.appendChild(unblockUserBut);
      listDiv.appendChild(userDiv);
    }
  }

  function toggleBlockedUsers() {
    let blockedUsersDiv = document.getElementById(scriptPrefix + "BlockedUsersList");
    let blockedUsersBut = document.getElementById(scriptPrefix + "BlockedUsersBut");
    if ((!blockedUsersDiv) || (!blockedUsersBut)) {
      return;
    }
    if (blockedUsersDiv.firstChild !== blockedUsersDiv.lastChild) {
      blockedUsersDiv.removeChild(blockedUsersDiv.firstChild);
      blockedUsersBut.innerText = "Show Blocked Users";
      return;
    }
    blockedUsersBut.innerText = "Hide Blocked Users";
    let listDiv = document.createElement("div");
    populateBlockedUsers(listDiv);
    blockedUsersDiv.insertBefore(listDiv, blockedUsersDiv.firstChild);
  }

  function setListingPruneInterval() {
    let pruneIntervalBox = document.getElementById(scriptPrefix + "ListingPruneIntervalBox");
    if (!pruneIntervalBox) {
      return;
    }
    listingPruneInterval = parseInt(pruneIntervalBox.value);
    GM_setValue(listingPruneIntervalKey, JSON.stringify(listingPruneInterval));
  }

  function resetListingPruneInterval() {
    let pruneIntervalBox = document.getElementById(scriptPrefix + "ListingPruneIntervalBox");
    if (!pruneIntervalBox) {
      return;
    }
    pruneIntervalBox.value = "" + listingPruneInterval;
  }

  let blockListingsChanged = false;
  for (let listing of document.querySelectorAll(".lfglisting")) {
    // hide specified listings
    const listingId = listing.getAttribute("data-listingid");
    if (listingId in blockListings) {
      hideListing(listing, reasonListing, listingId);
      blockListings[listingId].lastSeen = Date.now();
      blockListingsChanged = true;
      continue;
    }
    const thumb = listing.querySelector(".thumb");
    let listingButton = document.createElement("button");
    listingButton.innerText = "Hide Listing";
    listingButton.onclick = () => blockListing(listing, listingId);
    thumb.insertBefore(listingButton, thumb.firstChild);

    // hide listings by specified users
    const profileMeta = listing.querySelector(".profilemeta");
    const userProfile = profileMeta.querySelector(".userprofile");
    let userMatch = userExp.exec(userProfile.href);
    if (userMatch !== null) {
      const userId = userMatch.groups.userId;
      if (userId in blockUsers) {
        hideListing(listing, reasonUser, userId);
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

  // prune old blocked listings
  let pruneThreshold = Date.now() - listingPruneInterval * dayMs;
  let toPrune = [];
  for (let listingId in blockListings) {
    if (blockListings[listingId].lastSeen < pruneThreshold) {
      toPrune.push(listingId);
    }
  }
  for (let listingId of toPrune) {
    delete blockListings[listingId];
  }
  if (toPrune.length > 0) {
    blockListingsChanged = true;
  }
  if (blockListingsChanged) {
    GM_setValue(blockListingsKey, JSON.stringify(blockListings));
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
  let blockedListingsDiv = document.createElement("div");
  blockedListingsDiv.id = scriptPrefix + "BlockedListingsList";
  let blockedListingsBut = document.createElement("button");
  blockedListingsBut.id = scriptPrefix + "BlockedListingsBut";
  blockedListingsBut.innerText = "Show Blocked Listings";
  blockedListingsBut.onclick = toggleBlockedListings;
  blockedListingsDiv.appendChild(blockedListingsBut);
  settingsDiv.appendChild(blockedListingsDiv);
  let blockedUsersDiv = document.createElement("div");
  blockedUsersDiv.id = scriptPrefix + "BlockedUsersList";
  let blockedUsersBut = document.createElement("button");
  blockedUsersBut.id = scriptPrefix + "BlockedUsersBut";
  blockedUsersBut.innerText = "Show Blocked Users";
  blockedUsersBut.onclick = toggleBlockedUsers;
  blockedUsersDiv.appendChild(blockedUsersBut);
  settingsDiv.appendChild(blockedUsersDiv);
  let pruneSettingsDiv = document.createElement("div");
  pruneSettingsDiv.appendChild(document.createTextNode("Prune Blocked Listings After "));
  let pruneIntervalBox = document.createElement("input");
  pruneIntervalBox.id = scriptPrefix + "ListingPruneIntervalBox";
  pruneIntervalBox.value = "" + listingPruneInterval;
  pruneSettingsDiv.appendChild(pruneIntervalBox);
  pruneSettingsDiv.appendChild(document.createTextNode(" days "));
  let pruneIntervalSetBut = document.createElement("button");
  pruneIntervalSetBut.innerText = "Set";
  pruneIntervalSetBut.onclick = setListingPruneInterval;
  pruneSettingsDiv.appendChild(pruneIntervalSetBut);
  let pruneIntervalResetBut = document.createElement("button");
  pruneIntervalResetBut.innerText = "Reset";
  pruneIntervalResetBut.onclick = resetListingPruneInterval;
  pruneSettingsDiv.appendChild(pruneIntervalResetBut);
  settingsDiv.appendChild(pruneSettingsDiv);
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