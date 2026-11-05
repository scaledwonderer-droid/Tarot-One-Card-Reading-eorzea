(function initializeOneCardReading() {
  "use strict";

  const state = {
    currentCard: null,
    isRevealed: false,
    isSettled: false,
    orientation: null,
    resultText: "",
    readingRevision: 0,
  };

  const elements = {
    intro: document.querySelector("#intro"),
    drawButton: document.querySelector("#draw-button"),
    reading: document.querySelector("#reading"),
    readingTitle: document.querySelector("#reading-title"),
    readingInstruction: document.querySelector("#reading-instruction"),
    readingLayout: document.querySelector(".reading-layout"),
    cardInner: document.querySelector(".card-inner"),
    cardButton: document.querySelector("#card-button"),
    cardArt: document.querySelector("#card-art"),
    cardImage: document.querySelector("#card-image"),
    cardBackImage: document.querySelector(".card-back-image"),
    placeholderName: document.querySelector("#placeholder-name"),
    flipButton: document.querySelector("#flip-button"),
    result: document.querySelector("#result"),
    cardNameEn: document.querySelector("#card-name-en"),
    cardNameJa: document.querySelector("#card-name-ja"),
    orientation: document.querySelector("#orientation"),
    keywords: document.querySelector("#keywords"),
    message: document.querySelector("#message"),
    resultText: document.querySelector("#result-text"),
    copyButton: document.querySelector("#copy-button"),
    copyStatus: document.querySelector("#copy-status"),
    imageSaveButton: document.querySelector("#image-save-button"),
    imageStatus: document.querySelector("#image-status"),
    imageOpenLink: document.querySelector("#image-open-link"),
    redrawButton: document.querySelector("#redraw-button"),
    readingStatus: document.querySelector("#reading-status"),
  };

  let copyStatusTimer = null;
  let flipSettleTimer = null;
  let flipTransitionHandler = null;
  let exportObjectUrl = null;
  let isGeneratingImage = false;

  const EXPORT_WIDTH = 1600;
  const EXPORT_FONT = '"Yu Gothic UI", "Hiragino Kaku Gothic ProN", "Noto Sans JP", system-ui, sans-serif';
  const EXPORT_COLORS = {
    text: "#f3f4f8",
    muted: "#aeb4c6",
    cyan: "#65ddeb",
    line: "rgba(152, 171, 205, 0.24)",
    gold: "rgba(201, 173, 114, 0.6)",
    upright: "#87e7db",
    reversed: "#e6a0d5",
  };

  function determineOrientation() {
    return Math.random() < 0.5 ? "upright" : "reversed";
  }

  function selectRandomCard() {
    const index = Math.floor(Math.random() * window.TAROT_CARDS.length);
    return window.TAROT_CARDS[index];
  }

  function getOrientationLabel() {
    return state.orientation === "reversed" ? "逆位置 / REVERSED" : "正位置 / UPRIGHT";
  }

  function getKeywords() {
    return state.orientation === "reversed"
      ? state.currentCard.reversedKeywords
      : state.currentCard.uprightKeywords;
  }

  function getMessage() {
    return state.orientation === "reversed"
      ? state.currentCard.reversedMessage
      : state.currentCard.uprightMessage;
  }

  function clearPendingFlipSettle() {
    window.clearTimeout(flipSettleTimer);
    flipSettleTimer = null;
    if (flipTransitionHandler) {
      elements.cardInner.removeEventListener("transitionend", flipTransitionHandler);
      flipTransitionHandler = null;
    }
  }

  function clearExportResource() {
    if (exportObjectUrl) {
      URL.revokeObjectURL(exportObjectUrl);
      exportObjectUrl = null;
    }
    elements.imageOpenLink.hidden = true;
    elements.imageOpenLink.removeAttribute("href");
    elements.imageStatus.textContent = "";
  }

  function resetImageSaveButton() {
    elements.imageSaveButton.disabled = !state.isSettled || isGeneratingImage;
    elements.imageSaveButton.textContent = isGeneratingImage ? "画像を生成しています…" : "結果を画像で保存";
  }

  function buildResultText() {
    const keywords = getKeywords().join("、");

    return [
      "TAROT",
      "今回の1枚引き",
      "",
      `カード：${state.currentCard.nameEn}（${state.currentCard.nameJa}）`,
      `向き：${getOrientationLabel()}`,
      "",
      "キーワード：",
      keywords,
      "",
      "メッセージ：",
      getMessage(),
    ].join("\n");
  }

  function resetCardView() {
    clearPendingFlipSettle();
    elements.cardButton.classList.remove("is-revealed");
    elements.cardButton.setAttribute("aria-pressed", "false");
    elements.cardButton.setAttribute("aria-label", "カードをめくる");
    elements.cardArt.classList.toggle("is-reversed", state.orientation === "reversed");
    elements.placeholderName.textContent = state.currentCard.nameEn;
    elements.cardImage.hidden = false;
    elements.cardImage.alt = state.orientation === "reversed"
      ? `${state.currentCard.nameEn} reversed`
      : `${state.currentCard.nameEn} upright`;
    elements.cardImage.src = state.currentCard.image;
    elements.flipButton.hidden = false;
    elements.result.hidden = true;
    elements.readingLayout.classList.add("is-waiting");
    elements.copyStatus.textContent = "";
    resetImageSaveButton();
    elements.readingStatus.textContent = "カードを1枚選びました。まだ表面は開いていません。";
    elements.readingTitle.textContent = "カードをめくってください";
    elements.readingInstruction.textContent = "伏せられたカードに触れると、今回の1枚が開きます。";
  }

  function drawCard() {
    state.readingRevision += 1;
    clearExportResource();
    state.currentCard = selectRandomCard();
    state.orientation = determineOrientation();
    state.isRevealed = false;
    state.isSettled = false;
    state.resultText = "";

    resetCardView();
    elements.intro.hidden = true;
    elements.reading.hidden = false;
    elements.cardButton.focus({ preventScroll: true });
    elements.reading.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderReading() {
    const isReversed = state.orientation === "reversed";

    elements.cardNameEn.textContent = state.currentCard.nameEn;
    elements.cardNameJa.textContent = state.currentCard.nameJa;
    elements.orientation.textContent = isReversed ? "REVERSED · 逆位置" : "UPRIGHT · 正位置";
    elements.orientation.classList.toggle("reversed", isReversed);
    elements.keywords.textContent = getKeywords().join(" / ");
    elements.message.textContent = getMessage();
    state.resultText = buildResultText();
    elements.resultText.value = state.resultText;
    elements.result.hidden = false;
    elements.readingLayout.classList.remove("is-waiting");
    resetImageSaveButton();
  }

  function enableImageSaveAfterFlip() {
    clearPendingFlipSettle();
    const activeCard = state.currentCard;
    const revision = state.readingRevision;
    const finish = () => {
      clearPendingFlipSettle();
      if (state.currentCard === activeCard && state.readingRevision === revision && state.isRevealed) {
        state.isSettled = true;
        resetImageSaveButton();
      }
    };
    flipTransitionHandler = (event) => {
      if (event.target === elements.cardInner && event.propertyName === "transform") {
        finish();
      }
    };
    elements.cardInner.addEventListener("transitionend", flipTransitionHandler);
    flipSettleTimer = window.setTimeout(finish, 950);
  }

  function flipCard() {
    if (!state.currentCard || state.isRevealed) {
      return;
    }

    state.isRevealed = true;
    elements.cardButton.classList.add("is-revealed");
    state.isSettled = false;
    elements.cardButton.setAttribute("aria-pressed", "true");
    elements.cardButton.setAttribute(
      "aria-label",
      `${state.currentCard.nameEn}、${getOrientationLabel()}`,
    );
    elements.flipButton.hidden = true;
    elements.readingTitle.textContent = "引いたカード";
    elements.readingInstruction.textContent = "カードからのメッセージを、今の状況に重ねて受け取ってみてください。";
    elements.readingStatus.textContent = `${state.currentCard.nameEn}、${getOrientationLabel()}を開きました。`;
    renderReading();
    enableImageSaveAfterFlip();
  }

  function setImageStatus(message) {
    elements.imageStatus.textContent = message;
  }

  function wrapCanvasText(context, text, maxWidth, font) {
    context.font = font;
    const lines = [];
    const paragraphs = String(text).split(/\r?\n/);

    paragraphs.forEach((paragraph, paragraphIndex) => {
      const tokens = paragraph.match(/\s+|[^\s]+/gu) || [""];
      let line = "";
      tokens.forEach((token) => {
        if (/^\s+$/u.test(token)) {
          if (line) line += token;
          return;
        }
        const candidate = line + token;
        if (context.measureText(candidate).width <= maxWidth) {
          line = candidate;
          return;
        }
        if (line.trim()) {
          lines.push(line.trimEnd());
          line = "";
        }
        if (context.measureText(token).width <= maxWidth) {
          line = token.trimStart();
          return;
        }
        Array.from(token).forEach((character) => {
          if (line && context.measureText(line + character).width > maxWidth) {
            lines.push(line);
            line = "";
          }
          line += character;
        });
      });
      lines.push(line.trimEnd());
      if (paragraphIndex < paragraphs.length - 1 && !paragraph) lines.push("");
    });

    return lines.length ? lines : [""];
  }

  function drawWrappedText(context, lines, x, top, lineHeight, color, font) {
    context.font = font;
    context.fillStyle = color;
    context.textBaseline = "top";
    lines.forEach((line, index) => context.fillText(line, x, top + index * lineHeight));
    return top + lines.length * lineHeight;
  }

  function drawTrackedText(context, text, x, y, spacing, color) {
    context.fillStyle = color;
    context.textBaseline = "top";
    let cursor = x;
    Array.from(text).forEach((character) => {
      context.fillText(character, cursor, y);
      cursor += context.measureText(character).width + spacing;
    });
  }

  function roundRectPath(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function loadExportImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("card image failed to load"));
      image.src = source;
      if (image.complete) {
        if (image.naturalWidth > 0) resolve(image);
        else reject(new Error("card image failed to load"));
      }
    }).then(async (image) => {
      if (typeof image.decode === "function") {
        try {
          await image.decode();
        } catch (error) {
          if (!image.naturalWidth) throw error;
        }
      }
      return image;
    });
  }

  function buildReadingCanvas(reading, cardImage) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas unavailable");

    const pageMargin = 88;
    const cardWidth = 440;
    const cardHeight = cardWidth * 1.5;
    const columnGap = 80;
    const panelX = pageMargin + cardWidth + columnGap;
    const panelWidth = EXPORT_WIDTH - pageMargin * 2 - cardWidth - columnGap;
    const panelPadding = 50;
    const textX = panelX + panelPadding;
    const textWidth = panelWidth - panelPadding * 2;

    const kickerFont = `600 18px ${EXPORT_FONT}`;
    const panelHeadingFont = `400 40px Georgia, "Yu Mincho", "Hiragino Mincho ProN", serif`;
    const cardNameFont = `400 42px Georgia, "Times New Roman", serif`;
    const cardNameJaFont = `400 26px ${EXPORT_FONT}`;
    const blockHeadingFont = `600 22px Georgia, "Yu Mincho", serif`;
    const bodyFont = `400 25px ${EXPORT_FONT}`;
    const badgeFont = `700 20px ${EXPORT_FONT}`;
    const cardNameLines = wrapCanvasText(context, reading.card.nameEn, textWidth, cardNameFont);
    const panelHeadingLines = wrapCanvasText(context, "今回のリーディング", textWidth, panelHeadingFont);
    const keywordLines = wrapCanvasText(context, reading.keywords.join(" / "), textWidth, bodyFont);
    const messageLines = wrapCanvasText(context, reading.message, textWidth, bodyFont);
    const titleLines = wrapCanvasText(
      context,
      "カードからのメッセージを、今の状況に重ねて受け取ってみてください。",
      EXPORT_WIDTH - pageMargin * 2,
      `400 22px ${EXPORT_FONT}`,
    );

    let panelContentHeight = panelPadding + 22 + 18;
    panelContentHeight += panelHeadingLines.length * 54 + 22;
    panelContentHeight += 1 + 28;
    panelContentHeight += cardNameLines.length * 54 + 8 + 36 + 18 + 42 + 28;
    panelContentHeight += 1 + 28;
    panelContentHeight += 30 + 10 + keywordLines.length * 40 + 28;
    panelContentHeight += 30 + 10 + messageLines.length * 40 + panelPadding;

    const headerTop = 70;
    const headerKickerY = headerTop;
    const headerTitleY = 118;
    const headerTitleLines = wrapCanvasText(context, "引いたカード", EXPORT_WIDTH - pageMargin * 2, `400 48px Georgia, "Yu Mincho", "Hiragino Mincho ProN", serif`);
    const headerDescriptionY = headerTitleY + headerTitleLines.length * 62 + 4;
    const headerBottom = headerDescriptionY + titleLines.length * 34;
    const contentTop = headerBottom + 42;
    const canvasHeight = Math.ceil(Math.max(contentTop + panelContentHeight, contentTop + cardHeight) + 88);
    canvas.width = EXPORT_WIDTH;
    canvas.height = canvasHeight;

    const background = context.createLinearGradient(0, 0, EXPORT_WIDTH, canvasHeight);
    background.addColorStop(0, "#080a15");
    background.addColorStop(0.55, "#05060d");
    background.addColorStop(1, "#090611");
    context.fillStyle = background;
    context.fillRect(0, 0, EXPORT_WIDTH, canvasHeight);
    const glow = context.createRadialGradient(EXPORT_WIDTH / 2, 0, 10, EXPORT_WIDTH / 2, 0, 860);
    glow.addColorStop(0, "rgba(23, 26, 54, 0.55)");
    glow.addColorStop(1, "rgba(23, 26, 54, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, EXPORT_WIDTH, canvasHeight);
    context.strokeStyle = "rgba(255, 255, 255, 0.018)";
    context.lineWidth = 1;
    for (let x = 20; x < EXPORT_WIDTH; x += 38) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvasHeight);
      context.stroke();
    }
    for (let y = 20; y < canvasHeight; y += 38) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(EXPORT_WIDTH, y);
      context.stroke();
    }

    context.font = kickerFont;
    drawTrackedText(context, "YOUR CARD", EXPORT_WIDTH / 2 - context.measureText("YOUR CARD").width / 2 - 12, headerKickerY, 3, EXPORT_COLORS.cyan);
    context.font = `400 48px Georgia, "Yu Mincho", "Hiragino Mincho ProN", serif`;
    context.fillStyle = EXPORT_COLORS.text;
    context.textAlign = "center";
    context.textBaseline = "top";
    headerTitleLines.forEach((line, index) => context.fillText(line, EXPORT_WIDTH / 2, headerTitleY + index * 62));
    context.textAlign = "left";
    context.font = `400 22px ${EXPORT_FONT}`;
    context.fillStyle = EXPORT_COLORS.muted;
    context.textBaseline = "top";
    titleLines.forEach((line, index) => context.fillText(line, (EXPORT_WIDTH - context.measureText(line).width) / 2, headerDescriptionY + index * 34));

    const panelHeight = panelContentHeight;
    const panelGradient = context.createLinearGradient(panelX, contentTop, panelX + panelWidth, contentTop + panelHeight);
    panelGradient.addColorStop(0, "rgba(16, 19, 34, 0.96)");
    panelGradient.addColorStop(1, "rgba(7, 9, 18, 0.98)");
    roundRectPath(context, panelX, contentTop, panelWidth, panelHeight, 4);
    context.fillStyle = panelGradient;
    context.fill();
    context.strokeStyle = EXPORT_COLORS.line;
    context.lineWidth = 1;
    context.stroke();
    roundRectPath(context, panelX + 12, contentTop + 12, panelWidth - 24, panelHeight - 24, 2);
    context.strokeStyle = "rgba(201, 173, 114, 0.12)";
    context.stroke();

    let cursorY = contentTop + panelPadding;
    drawTrackedText(context, "YOUR READING", textX, cursorY, 2, EXPORT_COLORS.cyan);
    cursorY += 40;
    cursorY = drawWrappedText(context, panelHeadingLines, textX, cursorY, 54, EXPORT_COLORS.text, panelHeadingFont) + 20;
    context.beginPath();
    context.moveTo(textX, cursorY);
    context.lineTo(panelX + panelWidth - panelPadding, cursorY);
    context.strokeStyle = EXPORT_COLORS.line;
    context.stroke();
    cursorY += 28;

    cursorY = drawWrappedText(context, cardNameLines, textX, cursorY, 54, EXPORT_COLORS.text, cardNameFont) + 7;
    context.font = cardNameJaFont;
    context.fillStyle = EXPORT_COLORS.muted;
    context.textBaseline = "top";
    context.fillText(reading.card.nameJa, textX, cursorY);
    cursorY += 44;
    const orientationText = reading.orientation === "reversed" ? "REVERSED · 逆位置" : "UPRIGHT · 正位置";
    context.font = badgeFont;
    const badgeWidth = context.measureText(orientationText).width + 28;
    const badgeHeight = 38;
    const badgeY = cursorY;
    roundRectPath(context, textX, badgeY, badgeWidth, badgeHeight, 2);
    context.strokeStyle = reading.orientation === "reversed" ? EXPORT_COLORS.reversed : EXPORT_COLORS.upright;
    context.lineWidth = 1.5;
    context.stroke();
    context.fillStyle = reading.orientation === "reversed" ? EXPORT_COLORS.reversed : EXPORT_COLORS.upright;
    context.textBaseline = "middle";
    context.fillText(orientationText, textX + 14, badgeY + badgeHeight / 2);
    cursorY += badgeHeight + 28;
    context.beginPath();
    context.moveTo(textX, cursorY);
    context.lineTo(panelX + panelWidth - panelPadding, cursorY);
    context.strokeStyle = EXPORT_COLORS.line;
    context.lineWidth = 1;
    context.stroke();
    cursorY += 28;

    cursorY = drawWrappedText(context, ["キーワード"], textX, cursorY, 30, EXPORT_COLORS.cyan, blockHeadingFont) + 10;
    cursorY = drawWrappedText(context, keywordLines, textX, cursorY, 40, "#dfe2eb", bodyFont) + 28;
    cursorY = drawWrappedText(context, ["メッセージ"], textX, cursorY, 30, EXPORT_COLORS.cyan, blockHeadingFont) + 10;
    drawWrappedText(context, messageLines, textX, cursorY, 40, "#dfe2eb", bodyFont);

    const cardY = contentTop + Math.max(0, (panelHeight - cardHeight) / 2);
    const cardX = pageMargin;
    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.54)";
    context.shadowBlur = 28;
    context.shadowOffsetY = 20;
    context.fillStyle = "#080a12";
    roundRectPath(context, cardX, cardY, cardWidth, cardHeight, 8);
    context.fill();
    context.restore();
    context.save();
    if (reading.orientation === "reversed") {
      context.translate(cardX + cardWidth / 2, cardY + cardHeight / 2);
      context.rotate(Math.PI);
      context.drawImage(cardImage, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
    } else {
      context.drawImage(cardImage, cardX, cardY, cardWidth, cardHeight);
    }
    context.restore();
    roundRectPath(context, cardX, cardY, cardWidth, cardHeight, 8);
    context.strokeStyle = EXPORT_COLORS.gold;
    context.lineWidth = 2;
    context.stroke();
    roundRectPath(context, cardX + 10, cardY + 10, cardWidth - 20, cardHeight - 20, 4);
    context.strokeStyle = "rgba(255, 255, 255, 0.1)";
    context.lineWidth = 1;
    context.stroke();

    context.font = `400 18px ${EXPORT_FONT}`;
    context.fillStyle = EXPORT_COLORS.muted;
    context.textAlign = "right";
    context.textBaseline = "bottom";
    context.fillText("Created by 鱗の旅人　© SQUARE ENIX", EXPORT_WIDTH - pageMargin, canvasHeight - 24);

    return canvas;
  }

  function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      if (typeof canvas.toBlob === "function") {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("PNG encoding failed"));
        }, "image/png");
        return;
      }
      try {
        const data = canvas.toDataURL("image/png").split(",")[1];
        const binary = window.atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        resolve(new Blob([bytes], { type: "image/png" }));
      } catch (error) {
        reject(error);
      }
    });
  }

  function createFilename(card, orientation) {
    const slug = card.nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tarot-card";
    return `tarot-${slug}-${orientation}.png`;
  }

  async function saveReadingImage() {
    if (!state.currentCard || !state.isRevealed || !state.isSettled || isGeneratingImage) return;
    const reading = {
      card: state.currentCard,
      orientation: state.orientation,
      keywords: getKeywords().slice(),
      message: getMessage(),
      revision: state.readingRevision,
    };
    isGeneratingImage = true;
    resetImageSaveButton();
    elements.imageOpenLink.hidden = true;
    setImageStatus("画像を生成しています…");

    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const imageSource = new URL(reading.card.image, document.baseURI).href;
      const cardImage = await loadExportImage(imageSource);
      if (reading.revision !== state.readingRevision) return;

      const canvas = buildReadingCanvas(reading, cardImage);
      let blob;
      try {
        blob = await canvasToPngBlob(canvas);
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
      if (reading.revision !== state.readingRevision) return;

      clearExportResource();
      exportObjectUrl = URL.createObjectURL(blob);
      const filename = createFilename(reading.card, reading.orientation);
      const anchor = document.createElement("a");
      anchor.href = exportObjectUrl;
      anchor.download = filename;
      anchor.rel = "noopener";
      anchor.style.display = "none";
      document.body.append(anchor);

      if ("download" in anchor) {
        anchor.click();
        setImageStatus("画像を保存できます。ダウンロード一覧をご確認ください。");
      } else {
        elements.imageOpenLink.href = exportObjectUrl;
        elements.imageOpenLink.download = filename;
        elements.imageOpenLink.textContent = "PNG画像を開く（表示後に保存してください）";
        elements.imageOpenLink.hidden = false;
        setImageStatus("画像を別画面で開いて保存できます。");
      }
      anchor.remove();
    } catch (error) {
      if (reading.revision === state.readingRevision) {
        setImageStatus("画像の生成に失敗しました。もう一度お試しください。");
      }
    } finally {
      isGeneratingImage = false;
      resetImageSaveButton();
    }
  }

  function setCopyStatus(message) {
    window.clearTimeout(copyStatusTimer);
    elements.copyStatus.textContent = message;
    copyStatusTimer = window.setTimeout(() => {
      elements.copyStatus.textContent = "";
    }, 2400);
  }

  function fallbackCopy() {
    elements.resultText.focus();
    elements.resultText.select();
    elements.resultText.setSelectionRange(0, elements.resultText.value.length);
    const copied = document.execCommand("copy");
    window.getSelection()?.removeAllRanges();
    return copied;
  }

  async function copyResultText() {
    if (!state.resultText) {
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(state.resultText);
      } else if (!fallbackCopy()) {
        throw new Error("copy unavailable");
      }
      setCopyStatus("コピーしました");
    } catch (error) {
      setCopyStatus("コピーできませんでした。テキストを選択してコピーしてください。");
    }
  }

  function resetReading() {
    drawCard();
  }

  elements.cardImage.addEventListener("load", () => {
    elements.cardImage.hidden = false;
  });

  elements.cardImage.addEventListener("error", () => {
    elements.cardImage.hidden = true;
  });

  elements.cardBackImage.addEventListener("error", () => {
    elements.cardBackImage.hidden = true;
  });

  elements.drawButton.addEventListener("click", drawCard);
  elements.cardButton.addEventListener("click", flipCard);
  elements.flipButton.addEventListener("click", flipCard);
  elements.copyButton.addEventListener("click", copyResultText);
  elements.imageSaveButton.addEventListener("click", saveReadingImage);
  elements.redrawButton.addEventListener("click", resetReading);

  if (!Array.isArray(window.TAROT_CARDS) || window.TAROT_CARDS.length !== 78) {
    elements.drawButton.disabled = true;
    elements.readingStatus.textContent = "カードデータを読み込めませんでした。";
  }
})();
