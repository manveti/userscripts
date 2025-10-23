// ==UserScript==
// @name             YouTube Fixes
// @match            https://www.youtube.com/*
// @version          1.0
// ==/UserScript==

(function() {
  const FLAG_REMOVE_TRIES = 100;
  const FLAG_REMOVE_INTERVAL = 100;
  const NODE_TYPE_ELEMENT = 1;
  const OVERLAY_SELECTOR = ".ytp-watch-later-button, .ytp-share-button, .ytp-fullscreen-quick-actions";

  function ignoreErrors(callback) {
    try {
      return callback();
    }
    catch (_) {
      return false;
    }
  }

  function removeDelhiFlags() {
    const wnd = unsafeWindow;// || window.wrappedJSObject;
    // possibly wnd.yt.config_
    if ((!wnd.ytcfg) || (!wnd.ytcfg.data_) || (!wnd.ytcfg.data_.WEB_PLAYER_CONTEXT_CONFIGS)) {
      return false;
    }
    let modified = false;
    for (const key in wnd.ytcfg.data_.WEB_PLAYER_CONTEXT_CONFIGS) {
      const cfg = wnd.ytcfg.data_.WEB_PLAYER_CONTEXT_CONFIGS[key];
      if ((!cfg) || (typeof cfg.serializedExperimentFlags !== "string")) {
        continue;
      }
      let s = cfg.serializedExperimentFlags;
      if (cfg.serializedExperimentFlags.includes("delhi_modern_web_player")) {
        s = s.replace(/&?delhi_modern_web_player=true/g, "")
            .replace(/&?delhi_modern_web_player_icons=true/g, "")
            .replace(/&&+/g, "&").replace(/^&+/, "").replace(/&+$/, "");
        if (s !== cfg.serializedExperimentFlags) {
          cfg.serializedExperimentFlags = s;
          modified = true;
        }
      }
    }
    return modified;
  }

  function removeDelhiFlagsWithRetry() {
    let tries = FLAG_REMOVE_TRIES;
    let timer = setInterval(() => {
      tries -= 1;
      if ((ignoreErrors(removeDelhiFlags)) || (tries <= 0)) {
        clearInterval(timer);
      }
    }, FLAG_REMOVE_INTERVAL);
  }

  function removeCurrentFullscreenCruft() {
    for (let element of document.querySelectorAll(OVERLAY_SELECTOR)) {
      ignoreErrors(() => element.remove());
    }
  }

  function removeNewFullscreenCruft(mutations) {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        if ((!node) || (node.nodeType !== NODE_TYPE_ELEMENT) || (!node.matches) || (!node.matches(OVERLAY_SELECTOR))) {
          continue;
        }
        ignoreErrors(() => node.remove());
      }
    }
  }

  function removeCruft() {
    removeDelhiFlagsWithRetry();
    let observer = new MutationObserver(removeNewFullscreenCruft);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    ignoreErrors(removeCurrentFullscreenCruft);
  }

  removeCruft();
})();