(() => {
  const stage = document.getElementById("display-stage");
  const image = document.getElementById("display-image");
  const video = document.getElementById("display-video");
  const empty = document.getElementById("display-empty");
  const black = document.getElementById("display-black");

  let currentState = null;

  const safePlay = () => video.play().catch(() => {});

  const hasRange = state => Number.isFinite(state?.loopIn) && Number.isFinite(state?.loopOut) && state.loopOut > state.loopIn;

  const effectClass = effect => {
    if (effect === "zoom-out") return "kenburns-zoom-out";
    if (effect === "pan") return "kenburns-pan";
    if (effect === "random") {
      const options = ["kenburns-zoom-in", "kenburns-zoom-out", "kenburns-pan"];
      return options[Math.floor(Math.random() * options.length)];
    }
    if (effect === "none") return "";
    return "kenburns-zoom-in";
  };

  const resetImageEffect = state => {
    image.className = "";
    image.style.removeProperty("--image-duration");
    if (!state?.item || state.item.type !== "image" || state.imageEffect === "none") return;
    image.style.setProperty("--image-duration", `${Math.max(1, Number(state.imageDuration) || 5)}s`);
    const klass = effectClass(state.imageEffect);
    if (klass) {
      void image.offsetWidth;
      image.classList.add(klass);
    }
  };

  const sendRuntime = payload => {
    window.vtrDisplay?.runtime(payload);
  };

  const applyState = state => {
    currentState = state || {};
    const item = currentState.item;
    const isImage = item?.type === "image" && !currentState.black;
    const isVideo = item?.type === "video" && !currentState.black;

    stage.classList.toggle("is-cover", currentState.fit === "cover");
    black.hidden = !currentState.black;
    empty.hidden = Boolean(item) || Boolean(currentState.black);
    image.hidden = !isImage;
    video.hidden = !isVideo;

    if (isImage) {
      if (image.src !== item.playbackUrl) {
        image.src = item.playbackUrl;
      }
      video.pause();
      video.removeAttribute("src");
      resetImageEffect(currentState);
    } else if (isVideo) {
      if (video.src !== item.playbackUrl) {
        video.src = item.playbackUrl;
      }
      image.removeAttribute("src");
      video.muted = Boolean(currentState.muted);
      video.playbackRate = Number(currentState.playbackRate) || 1;
      video.loop = Boolean(currentState.loopClip) && !hasRange(currentState);
      if (Number.isFinite(currentState.currentTime) && Math.abs(video.currentTime - currentState.currentTime) > 0.4) {
        video.currentTime = Math.max(0, currentState.currentTime);
      }
      if (currentState.playing) {
        safePlay();
      } else {
        video.pause();
      }
    } else {
      image.removeAttribute("src");
      video.pause();
      video.removeAttribute("src");
      image.className = "";
    }
  };

  const applyCommand = command => {
    if (!command || !currentState) return;
    if (command.type === "seek" && !video.hidden) {
      video.currentTime = Math.max(0, Number(command.currentTime) || 0);
      if (command.playing) safePlay();
    }
    if (command.type === "restart-image") {
      resetImageEffect(currentState);
    }
  };

  video.addEventListener("loadedmetadata", () => {
    sendRuntime({
      type: "metadata",
      itemId: currentState?.item?.id || null,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      currentTime: video.currentTime || 0
    });
  });

  video.addEventListener("timeupdate", () => {
    if (!currentState || video.hidden) return;
    if (hasRange(currentState) && video.currentTime >= currentState.loopOut) {
      if (currentState.loopClip) {
        video.currentTime = currentState.loopIn;
        if (!video.paused) safePlay();
      } else {
        video.pause();
        video.currentTime = currentState.loopOut;
        sendRuntime({ type: "ended", itemId: currentState.item?.id || null, currentTime: video.currentTime });
      }
      return;
    }

    sendRuntime({
      type: "time",
      itemId: currentState?.item?.id || null,
      currentTime: video.currentTime || 0,
      duration: Number.isFinite(video.duration) ? video.duration : 0
    });
  });

  video.addEventListener("ended", () => {
    sendRuntime({
      type: "ended",
      itemId: currentState?.item?.id || null,
      currentTime: video.currentTime || 0
    });
  });

  window.vtrDisplay?.onState(applyState);
  window.vtrDisplay?.onCommand(applyCommand);
  window.vtrDisplay?.ready();
})();
