(() => {
  const els = {
    screenSelect: document.getElementById("screen-select"),
    openDisplay: document.getElementById("open-display"),
    previewImage: document.getElementById("preview-image"),
    previewVideo: document.getElementById("preview-video"),
    blackPreview: document.getElementById("black-preview"),
    emptyPreview: document.getElementById("empty-preview"),
    previous: document.getElementById("previous-item"),
    next: document.getElementById("next-item"),
    playPause: document.getElementById("play-pause"),
    restart: document.getElementById("restart-item"),
    black: document.getElementById("black-toggle"),
    seek: document.getElementById("seek"),
    currentTime: document.getElementById("current-time"),
    duration: document.getElementById("duration"),
    markIn: document.getElementById("mark-in"),
    markOut: document.getElementById("mark-out"),
    clearRange: document.getElementById("clear-range"),
    rangeLabel: document.getElementById("range-label"),
    autoplay: document.getElementById("autoplay-list"),
    repeatList: document.getElementById("repeat-list"),
    loopClip: document.getElementById("loop-clip"),
    imageDuration: document.getElementById("image-duration"),
    imageEffect: document.getElementById("image-effect"),
    muted: document.getElementById("muted"),
    fitInputs: Array.from(document.querySelectorAll("input[name='fit']")),
    rateInputs: Array.from(document.querySelectorAll("input[name='rate']")),
    pickMedia: document.getElementById("pick-media"),
    clearPlaylist: document.getElementById("clear-playlist"),
    globalStatus: document.getElementById("global-status"),
    playlist: document.getElementById("playlist"),
    technicalLog: document.getElementById("technical-log")
  };

  const state = {
    items: [],
    activeIndex: -1,
    black: false,
    playing: false,
    fit: "contain",
    muted: true,
    playbackRate: 1,
    autoplay: true,
    repeatList: false,
    loopClip: false,
    imageDuration: 5,
    imageEffect: "zoom-in",
    currentTime: 0,
    duration: 0,
    ranges: new Map(),
    imageTimer: null,
    isSeeking: false
  };

  const activeItem = () => state.items[state.activeIndex] || null;
  const readyItems = () => state.items.filter(item => item.status === "ready");

  const escapeHtml = value => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const formatTime = seconds => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const secs = String(total % 60).padStart(2, "0");
    return `${minutes}:${secs}`;
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const activeRange = () => {
    const item = activeItem();
    return item ? state.ranges.get(item.id) || { in: null, out: null } : { in: null, out: null };
  };

  const hasRange = range => Number.isFinite(range.in) && Number.isFinite(range.out) && range.out > range.in;

  const clearImageTimer = () => {
    if (state.imageTimer) {
      clearTimeout(state.imageTimer);
      state.imageTimer = null;
    }
  };

  const setStatus = message => {
    els.globalStatus.textContent = message;
  };

  const displayPayload = () => {
    const item = activeItem();
    const range = activeRange();
    return {
      item: item?.status === "ready" ? item : null,
      black: state.black,
      playing: state.playing,
      fit: state.fit,
      muted: state.muted,
      playbackRate: state.playbackRate,
      loopClip: state.loopClip,
      loopIn: hasRange(range) ? range.in : null,
      loopOut: hasRange(range) ? range.out : null,
      currentTime: state.currentTime,
      imageDuration: state.imageDuration,
      imageEffect: state.imageEffect
    };
  };

  const syncDisplay = () => {
    window.vtr?.setDisplayState(displayPayload());
  };

  const syncPreview = () => {
    const item = activeItem();
    const ready = item?.status === "ready";
    const isImage = ready && item.type === "image" && !state.black;
    const isVideo = ready && item.type === "video" && !state.black;

    els.previewImage.hidden = !isImage;
    els.previewVideo.hidden = !isVideo;
    els.emptyPreview.hidden = Boolean(item) || state.black;
    els.blackPreview.hidden = !state.black;

    if (isImage) {
      if (els.previewImage.src !== item.playbackUrl) els.previewImage.src = item.playbackUrl;
      els.previewImage.style.objectFit = state.fit;
      els.previewVideo.pause();
      els.previewVideo.removeAttribute("src");
    } else if (isVideo) {
      if (els.previewVideo.src !== item.playbackUrl) els.previewVideo.src = item.playbackUrl;
      els.previewVideo.style.objectFit = state.fit;
      els.previewVideo.muted = true;
      els.previewVideo.playbackRate = state.playbackRate;
      if (Math.abs(els.previewVideo.currentTime - state.currentTime) > 0.5) {
        els.previewVideo.currentTime = state.currentTime || 0;
      }
      if (state.playing) els.previewVideo.play().catch(() => {});
      else els.previewVideo.pause();
      els.previewImage.removeAttribute("src");
    } else {
      els.previewImage.removeAttribute("src");
      els.previewVideo.pause();
      els.previewVideo.removeAttribute("src");
    }
  };

  const syncSeek = () => {
    const item = activeItem();
    const isVideo = item?.status === "ready" && item.type === "video" && !state.black;
    const duration = Number.isFinite(state.duration) ? state.duration : Number(item?.durationSeconds || 0);
    const current = Number.isFinite(state.currentTime) ? state.currentTime : 0;
    const range = activeRange();

    els.seek.disabled = !isVideo || duration <= 0;
    els.seek.max = String(Math.max(0, duration));
    if (!state.isSeeking) els.seek.value = String(clamp(current, 0, duration || current));
    els.currentTime.textContent = formatTime(current);
    els.duration.textContent = formatTime(duration);
    els.rangeLabel.textContent = hasRange(range)
      ? `Tramo: ${formatTime(range.in)} / ${formatTime(range.out)}`
      : "Tramo: — / —";

    [els.markIn, els.markOut, els.clearRange].forEach(button => {
      button.disabled = !isVideo || duration <= 0;
    });
  };

  const scheduleImageAdvance = () => {
    clearImageTimer();
    const item = activeItem();
    if (!state.playing || !state.autoplay || state.black || item?.status !== "ready" || item.type !== "image") return;
    state.imageTimer = setTimeout(() => {
      advanceItem(1, { fromAutoplay: true });
    }, Math.max(1, Number(state.imageDuration) || 5) * 1000);
  };

  const renderPlaylist = () => {
    if (!state.items.length) {
      els.playlist.innerHTML = "";
      setStatus("Sin medios cargados.");
      return;
    }

    const busy = state.items.filter(item => ["queued", "copying", "probing", "transcoding"].includes(item.status)).length;
    const ready = readyItems().length;
    setStatus(busy ? `Importando ${busy} item(s). Listos: ${ready}/${state.items.length}.` : `Listos: ${ready}/${state.items.length}.`);

    els.playlist.innerHTML = state.items.map((item, index) => {
      const active = index === state.activeIndex;
      const progress = clamp(Number(item.progress || 0), 0, 100);
      const meta = item.status === "ready"
        ? `${item.type === "video" ? "Video" : "Imagen"} · ${item.probeSummary?.size || ""} ${item.durationSeconds ? `· ${formatTime(item.durationSeconds)}` : ""}`
        : `${item.stage || item.status} · ${progress}%`;
      return `
        <button class="playlist-item${active ? " is-active" : ""}${item.status === "error" ? " is-error" : ""}" type="button" data-index="${index}">
          <span class="item-top">
            <span class="item-name">${escapeHtml(item.name)}</span>
            <span class="item-kind">${item.type}</span>
          </span>
          <span class="item-meta">${escapeHtml(meta)}</span>
          ${item.error ? `<span class="item-error">${escapeHtml(item.error)}</span>` : ""}
          <span class="progress-track"><span class="progress-bar" style="width: ${progress}%"></span></span>
        </button>
      `;
    }).join("");

    const item = activeItem();
    els.technicalLog.textContent = item?.log || "";
  };

  const render = () => {
    const item = activeItem();
    const hasReady = item?.status === "ready";
    els.playPause.textContent = state.playing ? "Pause" : "Play";
    els.playPause.disabled = !hasReady && !state.black;
    els.previous.disabled = readyItems().length < 2;
    els.next.disabled = readyItems().length < 2;
    els.restart.disabled = !hasReady;
    els.black.textContent = state.black ? "Quitar negro" : "Negro";
    syncPreview();
    syncSeek();
    renderPlaylist();
    scheduleImageAdvance();
    syncDisplay();
  };

  const selectIndex = index => {
    const nextIndex = clamp(Number(index) || 0, 0, state.items.length - 1);
    state.activeIndex = nextIndex;
    state.black = false;
    state.currentTime = 0;
    state.duration = Number(activeItem()?.durationSeconds || 0);
    render();
  };

  const findNextReadyIndex = (direction, fromIndex = state.activeIndex) => {
    if (!state.items.length) return -1;
    for (let step = 1; step <= state.items.length; step += 1) {
      const index = fromIndex + direction * step;
      if (index < 0 || index >= state.items.length) {
        if (!state.repeatList) return -1;
        const wrapped = (index + state.items.length) % state.items.length;
        if (state.items[wrapped]?.status === "ready") return wrapped;
      } else if (state.items[index]?.status === "ready") {
        return index;
      }
    }
    return -1;
  };

  function advanceItem(direction, options = {}) {
    const nextIndex = findNextReadyIndex(direction);
    if (nextIndex === -1) {
      if (options.fromAutoplay) {
        state.playing = false;
        render();
      }
      return;
    }
    state.activeIndex = nextIndex;
    state.currentTime = 0;
    state.duration = Number(activeItem()?.durationSeconds || 0);
    state.black = false;
    render();
  }

  const togglePlay = () => {
    const item = activeItem();
    if (!item || item.status !== "ready") return;
    const range = activeRange();
    if (!state.playing && hasRange(range) && (state.currentTime < range.in || state.currentTime >= range.out)) {
      state.currentTime = range.in;
      window.vtr?.sendDisplayCommand({ type: "seek", currentTime: state.currentTime, playing: false });
    }
    state.playing = !state.playing;
    render();
  };

  const restartActive = () => {
    const item = activeItem();
    if (!item || item.status !== "ready") return;
    const range = activeRange();
    state.currentTime = hasRange(range) ? range.in : 0;
    if (item.type === "video") {
      window.vtr?.sendDisplayCommand({ type: "seek", currentTime: state.currentTime, playing: state.playing });
    } else {
      window.vtr?.sendDisplayCommand({ type: "restart-image" });
    }
    render();
  };

  const loadScreens = async () => {
    const screens = await window.vtr.listScreens();
    els.screenSelect.innerHTML = screens.map(display => `
      <option value="${display.id}">${escapeHtml(display.label)} · ${display.size.width}x${display.size.height}</option>
    `).join("");
    const secondary = screens.find(display => display.index > 0);
    if (secondary) els.screenSelect.value = String(secondary.id);
  };

  const importPickedMedia = async () => {
    const paths = await window.vtr.pickMediaFiles();
    if (!paths.length) return;
    setStatus(`Importando ${paths.length} medio(s)...`);
    await window.vtr.importMedia(paths);
  };

  window.vtr.onPlaylistUpdate(playlist => {
    state.items = playlist.items || [];
    if (state.activeIndex === -1) {
      const firstReady = state.items.findIndex(item => item.status === "ready");
      if (firstReady !== -1) state.activeIndex = firstReady;
    }
    const active = activeItem();
    if (!active || active.status === "error") {
      const firstReady = state.items.findIndex(item => item.status === "ready");
      state.activeIndex = firstReady;
    }
    state.duration = Number(activeItem()?.durationSeconds || state.duration || 0);
    render();
  });

  window.vtr.onDisplayRuntime(runtime => {
    const item = activeItem();
    if (!item || runtime.itemId !== item.id) return;
    if (runtime.type === "metadata") {
      state.duration = Number(runtime.duration || item.durationSeconds || 0);
      state.currentTime = Number(runtime.currentTime || 0);
    }
    if (runtime.type === "time") {
      if (!state.isSeeking) state.currentTime = Number(runtime.currentTime || 0);
      state.duration = Number(runtime.duration || state.duration || 0);
    }
    if (runtime.type === "ended") {
      if (state.autoplay && !state.loopClip) {
        advanceItem(1, { fromAutoplay: true });
      } else {
        state.playing = false;
        state.currentTime = Number(runtime.currentTime || state.currentTime || 0);
        render();
      }
      return;
    }
    syncSeek();
  });

  window.vtr.onDisplayClosed(() => {
    setStatus("Salida cerrada.");
  });

  els.openDisplay.addEventListener("click", async () => {
    await window.vtr.openDisplay(els.screenSelect.value);
    syncDisplay();
  });
  els.pickMedia.addEventListener("click", importPickedMedia);
  els.clearPlaylist.addEventListener("click", async () => {
    clearImageTimer();
    state.activeIndex = -1;
    state.playing = false;
    state.currentTime = 0;
    state.duration = 0;
    state.ranges.clear();
    await window.vtr.clearPlaylist();
    render();
  });
  els.playPause.addEventListener("click", togglePlay);
  els.previous.addEventListener("click", () => advanceItem(-1));
  els.next.addEventListener("click", () => advanceItem(1));
  els.restart.addEventListener("click", restartActive);
  els.black.addEventListener("click", () => {
    state.black = !state.black;
    if (state.black) state.playing = false;
    render();
  });
  els.playlist.addEventListener("click", event => {
    const button = event.target.closest("[data-index]");
    if (button) selectIndex(button.dataset.index);
  });
  els.seek.addEventListener("input", () => {
    state.isSeeking = true;
    state.currentTime = Number(els.seek.value) || 0;
    syncSeek();
  });
  els.seek.addEventListener("change", () => {
    state.isSeeking = false;
    state.currentTime = Number(els.seek.value) || 0;
    window.vtr.sendDisplayCommand({ type: "seek", currentTime: state.currentTime, playing: state.playing });
    render();
  });
  els.markIn.addEventListener("click", () => {
    const item = activeItem();
    if (!item) return;
    const range = activeRange();
    range.in = Math.max(0, state.currentTime || 0);
    if (Number.isFinite(range.out) && range.out <= range.in) range.out = null;
    state.ranges.set(item.id, range);
    render();
  });
  els.markOut.addEventListener("click", () => {
    const item = activeItem();
    if (!item) return;
    const range = activeRange();
    if (!Number.isFinite(range.in)) range.in = 0;
    const out = Math.max(0, state.currentTime || 0);
    if (out > range.in) range.out = out;
    state.ranges.set(item.id, range);
    render();
  });
  els.clearRange.addEventListener("click", () => {
    const item = activeItem();
    if (!item) return;
    state.ranges.delete(item.id);
    render();
  });
  els.autoplay.addEventListener("change", () => {
    state.autoplay = els.autoplay.checked;
    render();
  });
  els.repeatList.addEventListener("change", () => {
    state.repeatList = els.repeatList.checked;
    render();
  });
  els.loopClip.addEventListener("change", () => {
    state.loopClip = els.loopClip.checked;
    render();
  });
  els.imageDuration.addEventListener("change", () => {
    state.imageDuration = clamp(Number(els.imageDuration.value) || 5, 1, 60);
    els.imageDuration.value = String(state.imageDuration);
    render();
  });
  els.imageEffect.addEventListener("change", () => {
    state.imageEffect = els.imageEffect.value;
    render();
  });
  els.muted.addEventListener("change", () => {
    state.muted = els.muted.checked;
    render();
  });
  els.fitInputs.forEach(input => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      state.fit = input.value === "cover" ? "cover" : "contain";
      render();
    });
  });
  els.rateInputs.forEach(input => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      state.playbackRate = Number(input.value) || 1;
      render();
    });
  });
  window.addEventListener("keydown", event => {
    if (event.code !== "Space") return;
    const tag = event.target?.tagName?.toLowerCase();
    if (tag === "input" || tag === "select" || tag === "textarea") return;
    event.preventDefault();
    togglePlay();
  });

  loadScreens().catch(error => setStatus(error.message));
  render();
})();
