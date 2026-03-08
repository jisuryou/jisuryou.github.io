      let PROJ = [];
      let TALKS = [];
      let portfolioDataLoaded = false;

      async function loadPortfolioData() {
        const [projRes, talksRes] = await Promise.all([
          fetch("/data/projects.json", { cache: "no-store" }),
          fetch("/data/talks.json", { cache: "no-store" }),
        ]);
        if (!projRes.ok || !talksRes.ok) {
          throw new Error("Failed to load portfolio data JSON");
        }
        const [proj, talks] = await Promise.all([
          projRes.json(),
          talksRes.json(),
        ]);
        PROJ = Array.isArray(proj) ? proj : [];
        TALKS = Array.isArray(talks) ? talks : [];
      }

      function toMultiline(v) {
        if (Array.isArray(v)) return v.join("<br/>");
        return String(v ?? "").replace(/\n/g, "<br/>");
      }
      function escHtml(v) {
        return String(v ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }
      function buildGroupIndex(d) {
        const items = normalizePanelMediaItems(d);
        const n = items.length;
        const itemToRaw = new Array(n).fill(-1);
        const rawGroups = [];
        normalizePanelMediaCaptions(d).forEach((entry) => {
          const indices = entry.media
            .map((v) => v - 1)
            .filter((i) => i >= 0 && i < n);
          if (!indices.length) return;
          const rawIdx = rawGroups.length;
          rawGroups.push({ minIdx: Math.min(...indices), indices });
          indices.forEach((i) => {
            if (itemToRaw[i] === -1) itemToRaw[i] = rawIdx;
          });
        });
        items.forEach((item, i) => {
          if (itemToRaw[i] !== -1) return;
          if (normalizeCaptionSpec(item.caption)) {
            const rawIdx = rawGroups.length;
            rawGroups.push({ minIdx: i, indices: [i] });
            itemToRaw[i] = rawIdx;
          }
        });
        if (!rawGroups.length) return new Array(n).fill(-1);
        const sorted = rawGroups
          .map((g, i) => ({ ...g, rawIdx: i }))
          .sort((a, b) => a.minIdx - b.minIdx);
        const rawToFinal = new Array(rawGroups.length);
        sorted.forEach((g, finalIdx) => {
          rawToFinal[g.rawIdx] = finalIdx;
        });
        return itemToRaw.map((r) => (r === -1 ? -1 : rawToFinal[r]));
      }
      function parseDsMarkup(raw) {
        const str = String(raw ?? "");
        let result = "";
        const re = /\{\{(.+?)\|(\d+)\}\}/g;
        let last = 0,
          m;
        while ((m = re.exec(str)) !== null) {
          result += escHtml(str.slice(last, m.index)).replace(/\n/g, "<br/>");
          result += `<span class="ds-mark" data-group="${m[2]}">${escHtml(m[1])}</span>`;
          last = m.index + m[0].length;
        }
        result += escHtml(str.slice(last)).replace(/\n/g, "<br/>");
        return result;
      }
      function toSystemDesignHtml(v) {
        const arr = Array.isArray(v) ? v : [v];
        return arr
          .map((raw) => {
            const isObj = raw !== null && typeof raw === "object";
            const line = isObj
              ? String(raw.text ?? "").trim()
              : String(raw ?? "").trim();
            const imgGroup =
              isObj && raw.imgGroup != null ? raw.imgGroup : null;
            const m = line.match(/^(.+?)\s*\((.+)\)\s*$/);
            if (!m) {
              const esc = escHtml(line);
              return imgGroup != null
                ? `<span class="sd-mark sd-title" data-group="${imgGroup}">${esc}</span>`
                : `<span class="sd-title">${esc}</span>`;
            }
            const title = escHtml(m[1].trim());
            const desc = escHtml(m[2].trim());
            const titleHtml =
              imgGroup != null
                ? `<span class="sd-mark sd-title" data-group="${imgGroup}">${title}</span>`
                : `<span class="sd-title">${title}</span>`;
            return `${titleHtml}<br/>${desc}`;
          })
          .join("<br/>");
      }
      function normalizePanelMediaItems(d = {}) {
        const imgs = (d.imgs || [])
          .map((img) =>
            typeof img === "string"
              ? {
                  type: "img",
                  src: img,
                  fr: 1,
                  caption: null,
                  captionPos: null,
                }
              : {
                  type: "img",
                  src: img?.src || "",
                  fr: Math.max(1, Number(img?.fr) || 1),
                  start: Number(img?.start),
                  span: Number(img?.span),
                  bg: img?.bg,
                  pad: img?.pad,
                  overlap: img?.overlap ?? null,
                  caption: img?.caption ?? null,
                  captionPos: img?.captionPos ?? img?.captionPosition ?? null,
                },
          )
          .filter((img) => !!img.src);
        const vids = (d.vids || [])
          .filter(Boolean)
          .map((vid) =>
            typeof vid === "string"
              ? { type: "video", src: vid, caption: null, captionPos: null }
              : {
                  type: "video",
                  src: vid?.src || "",
                  fr: Math.max(1, Number(vid?.fr) || 1),
                  start: Number(vid?.start),
                  span: Number(vid?.span),
                  bg: vid?.bg,
                  pad: vid?.pad,
                  overlap: vid?.overlap ?? null,
                  caption: vid?.caption ?? null,
                  captionPos: vid?.captionPos ?? vid?.captionPosition ?? null,
                },
          )
          .filter((vid) => !!vid.src);
        return [...imgs, ...vids];
      }
      function normalizeCaptionSpec(rawCaption, fallbackPos = "below") {
        if (rawCaption == null) return null;
        const asObj =
          typeof rawCaption === "object"
            ? rawCaption
            : { text: String(rawCaption) };
        const text = String(
          asObj?.text ?? asObj?.caption ?? asObj?.label ?? "",
        ).trim();
        if (!text) return null;
        const posRaw = String(
          asObj?.position ?? asObj?.pos ?? fallbackPos ?? "below",
        ).toLowerCase();
        const position =
          posRaw === "left" ? "left" : posRaw === "top" ? "top" : "below";
        return { text, position };
      }
      function normalizePanelMediaCaptions(d = {}) {
        const arr = Array.isArray(d.mediaCaptions) ? d.mediaCaptions : [];
        return arr
          .map((entry) => {
            const caption = normalizeCaptionSpec(entry);
            if (!caption) return null;
            const media = Array.isArray(entry?.media)
              ? entry.media
                  .map((v) => Math.trunc(Number(v)))
                  .filter((v) => Number.isFinite(v) && v > 0)
              : [];
            const range = Array.isArray(entry?.range) ? entry.range : [];
            const rangeStart = Math.trunc(Number(range[0]));
            const rangeEnd = Math.trunc(Number(range[1]));
            const anchor = Math.trunc(Number(entry?.anchor));
            const start = Number(entry?.start);
            const span = Number(entry?.span);
            return {
              caption,
              media,
              range:
                Number.isFinite(rangeStart) && Number.isFinite(rangeEnd)
                  ? [
                      Math.min(rangeStart, rangeEnd),
                      Math.max(rangeStart, rangeEnd),
                    ]
                  : null,
              anchor: Number.isFinite(anchor) && anchor > 0 ? anchor : null,
              start,
              span,
            };
          })
          .filter(Boolean);
      }
      function captionTextToHtml(text) {
        return escHtml(text).replace(/\n/g, "<br/>");
      }
      function renderPanelCaptionHtml(caption, opts = {}) {
        if (!caption) return "";
        const cls = `panel-media-caption is-${caption.position}${
          opts.group ? " is-group" : ""
        }`;
        const styleParts = [];
        if (Number.isFinite(opts.start))
          styleParts.push(`--caption-start:${opts.start}`);
        if (Number.isFinite(opts.span))
          styleParts.push(`--caption-span:${opts.span}`);
        return `<div class="${cls}"${
          styleParts.length ? ` style="${styleParts.join(";")};"` : ""
        }>${captionTextToHtml(caption.text)}</div>`;
      }
      function normalizePanelLinks(d = {}) {
        return (d.links || [])
          .filter((l) => l && l.url)
          .map((l) => ({
            label: l.label || "Open Link",
            url: l.url,
            download: !!l.download,
            filename: l.filename || "",
            disabled: !!l.disabled,
          }));
      }
      function buildPanelMediaHtml(d = {}) {
        const items = normalizePanelMediaItems(d);
        const mediaCaptions = normalizePanelMediaCaptions(d);
        const links = normalizePanelLinks(d);
        if (!items.length && !links.length) return "";
        const renderedItems = items.map((item, idx) => {
          const baseFr = Number(item.fr) || 1;
          const isLeft = idx % 2 === 0;
          const spanRaw = Number(item.span);
          const MIN_SPAN = 0.25;
          let span = Number.isFinite(spanRaw)
            ? clamp(spanRaw, MIN_SPAN, 4)
            : Math.max(2, Math.min(4, Math.round(baseFr * 2 + 0.5)));
          if (!Number.isFinite(spanRaw) && !isLeft && span === 4) span = 3;
          const startRaw = Number(item.start);
          const maxStart = Math.max(1, 5 - span);
          let start = Number.isFinite(startRaw)
            ? clamp(startRaw, 1, maxStart)
            : isLeft
              ? 1
              : maxStart;
          const bgRaw = typeof item.bg === "string" ? item.bg.trim() : "";
          const bg = bgRaw && /^[#\w\s(),.%+-]+$/.test(bgRaw) ? bgRaw : "";
          const padRaw = Number(item.pad);
          const pad = Number.isFinite(padRaw) ? Math.max(0, padRaw) : null;
          const overlapRaw = Number(item.overlap);
          const overlap =
            Number.isFinite(overlapRaw) && overlapRaw > 0 ? overlapRaw : null;
          const styleParts = [`--media-start:${start}`, `--media-span:${span}`];
          if (bg) styleParts.push(`--media-bg:${bg}`);
          if (pad !== null) styleParts.push(`--media-pad:${pad}px`);
          const itemCaption = normalizeCaptionSpec(
            item.caption,
            item.captionPos || "below",
          );
          const leftCaptionHtml =
            itemCaption?.position === "left"
              ? renderPanelCaptionHtml(itemCaption)
              : "";
          const topCaptionHtml =
            itemCaption?.position === "top"
              ? renderPanelCaptionHtml(itemCaption)
              : "";
          const bottomCaptionHtml =
            itemCaption?.position === "below"
              ? renderPanelCaptionHtml(itemCaption)
              : "";
          const media =
            item.type === "video"
              ? `<video src="${escHtml(
                  item.src,
                )}" muted loop autoplay playsinline preload="metadata"></video>`
              : `<img src="${escHtml(item.src)}" alt="" loading="lazy" />`;
          return {
            start,
            span,
            overlap,
            style: styleParts.join(";"),
            media,
            topCaptionHtml,
            leftCaptionHtml,
            bottomCaptionHtml,
          };
        });
        const groupInlineCaptionsByItem = new Map();
        const groupCaptionsByAfterIndex = new Map();
        mediaCaptions.forEach((entry) => {
          let targetIdx = [];
          if (entry.media.length) {
            targetIdx = entry.media
              .map((v) => v - 1)
              .filter((v) => v >= 0 && v < renderedItems.length);
          } else if (entry.range) {
            for (let i = entry.range[0] - 1; i <= entry.range[1] - 1; i += 1) {
              if (i >= 0 && i < renderedItems.length) targetIdx.push(i);
            }
          }
          let start = Number(entry.start);
          let span = Number(entry.span);
          if (
            (!Number.isFinite(start) || !Number.isFinite(span)) &&
            targetIdx.length
          ) {
            start = Math.min(...targetIdx.map((i) => renderedItems[i].start));
            const maxEnd = Math.max(
              ...targetIdx.map(
                (i) => renderedItems[i].start + renderedItems[i].span - 1,
              ),
            );
            span = maxEnd - start + 1;
          }
          if (Number.isFinite(start) && Number.isFinite(span)) {
            const clampedSpan = clamp(span, 0.25, 4);
            const maxStart = Math.max(1, 5 - clampedSpan);
            start = clamp(start, 1, maxStart);
            span = clampedSpan;
          } else {
            start = 1;
            span = 4;
          }
          const anchorIdx = entry.anchor ? entry.anchor - 1 : null;
          let afterIdx;
          if (
            Number.isFinite(anchorIdx) &&
            anchorIdx >= 0 &&
            anchorIdx < renderedItems.length
          ) {
            afterIdx = anchorIdx;
          } else if (targetIdx.length) {
            afterIdx =
              entry.caption?.position === "below"
                ? Math.max(...targetIdx)
                : Math.min(...targetIdx);
          } else {
            afterIdx = renderedItems.length - 1;
          }
          const html = renderPanelCaptionHtml(entry.caption, {
            group: true,
            start,
            span,
          });
          if (entry.caption?.position === "left") {
            const currentInline = groupInlineCaptionsByItem.get(afterIdx) || "";
            groupInlineCaptionsByItem.set(afterIdx, `${currentInline}${html}`);
            return;
          }
          const currentAfter = groupCaptionsByAfterIndex.get(afterIdx) || "";
          groupCaptionsByAfterIndex.set(afterIdx, `${currentAfter}${html}`);
        });
        const mediaHtml = renderedItems
          .map((item, idx) => {
            const ownAndInline = `${item.leftCaptionHtml}${
              groupInlineCaptionsByItem.get(idx) || ""
            }`;
            const itemHtml = `<div class="panel-media-item"${
              item.overlap !== null ? ` data-overlap="${item.overlap}"` : ""
            } style="${item.style};">${item.topCaptionHtml}<div class="panel-media-frame">${
              item.media
            }</div>${ownAndInline}${item.bottomCaptionHtml}</div>`;
            return `${itemHtml}${groupCaptionsByAfterIndex.get(idx) || ""}`;
          })
          .join("");
        const linkHtml = links
          .map((l) => {
            const attrs = l.disabled
              ? `aria-disabled="true"`
              : l.download
                ? `download="${escHtml(l.filename)}"`
                : `target="_blank" rel="noopener noreferrer"`;
            return `<a class="hover-link-card${
              l.disabled ? " is-disabled" : ""
            }" href="${escHtml(l.url)}" ${attrs}>${linkInnerHTML(
              escHtml(l.label),
            )}</a>`;
          })
          .join("");
        return `<div class="panel-media"><div class="panel-media-grid">${mediaHtml}</div><div class="panel-media-actions"><button class="panel-close" type="button" aria-label="Close panel"><svg class="panel-close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4L20 20M20 4L4 20"/></svg></button><div class="panel-media-links">${linkHtml}</div></div></div>`;
      }
      const activeRows = {};
      const rowGroupStateResetters = new WeakMap();
      let lastOpenedRow = null;
      function resetRowGroupState(row) {
        if (!row) return;
        const reset = rowGroupStateResetters.get(row);
        if (typeof reset === "function") reset();
      }
      function scrollPanelIntoView(row, scrollContainer, smooth = false) {
        const panel = row.querySelector(".lrow-panel");
        const header = row.querySelector(".lrt") || row;
        if (!panel || !scrollContainer || !row.classList.contains("open"))
          return;
        const padTop = 12;
        const rowTop = row.offsetTop;
        const targetTop = rowTop - padTop;
        const maxScroll =
          scrollContainer.scrollHeight - scrollContainer.clientHeight;
        const target = Math.max(0, Math.min(maxScroll, targetTop));
        if (Math.abs(target - scrollContainer.scrollTop) > 1) {
          scrollContainer.scrollTo({
            top: target,
            behavior: smooth ? "smooth" : "auto",
          });
        }
      }
      function scrollGroupIntoView(row, grid, group, smooth = true) {
        const scrollContainer = row?.closest(".tab-page");
        if (!scrollContainer || !grid || !row?.classList.contains("open"))
          return;
        const key = String(group);
        const targets = [
          ...grid.querySelectorAll(`.panel-media-item[data-group="${key}"]`),
          ...grid.querySelectorAll(
            `.panel-media-caption[data-group="${key}"].group-locked`,
          ),
        ].filter((el) => el.getClientRects().length > 0);
        if (!targets.length) return;
        const containerRect = scrollContainer.getBoundingClientRect();
        let top = Infinity;
        let bottom = -Infinity;
        targets.forEach((el) => {
          const rect = el.getBoundingClientRect();
          top = Math.min(top, rect.top);
          bottom = Math.max(bottom, rect.bottom);
        });
        const padTop = 12;
        const padBottom = 18;
        let delta = 0;
        if (bottom > containerRect.bottom - padBottom) {
          delta = bottom - (containerRect.bottom - padBottom);
        } else if (top < containerRect.top + padTop) {
          delta = top - (containerRect.top + padTop);
        }
        if (Math.abs(delta) <= 1) return;
        const maxScroll =
          scrollContainer.scrollHeight - scrollContainer.clientHeight;
        const target = Math.max(
          0,
          Math.min(maxScroll, scrollContainer.scrollTop + delta),
        );
        scrollContainer.scrollTo({
          top: target,
          behavior: smooth ? "smooth" : "auto",
        });
      }
      function syncMediaOverlaps() {
        document.querySelectorAll(".panel-media-grid").forEach((grid) => {
          const gapRaw =
            getComputedStyle(grid).rowGap || getComputedStyle(grid).gap || "0";
          const gap = parseFloat(gapRaw) || 0;
          const items = [...grid.querySelectorAll(".panel-media-item")];
          items.forEach((item, idx) => {
            const frame = item.querySelector(".panel-media-frame");
            const frameH = frame?.getBoundingClientRect().height || 0;
            if (frameH > 0) {
              item.style.setProperty("--media-h", `${frameH}px`);
            }
            const ratio = parseFloat(item.dataset.overlap || "");
            if (!Number.isFinite(ratio) || ratio <= 0 || idx === 0) {
              item.style.removeProperty("--media-overlap");
              return;
            }
            const prevFrame =
              items[idx - 1]?.querySelector(".panel-media-frame");
            const prevH = prevFrame?.getBoundingClientRect().height || 0;
            const prevItem = items[idx - 1];
            const prevCaptionsH = prevItem
              ? [
                  ...prevItem.querySelectorAll(
                    ".panel-media-caption.is-top, .panel-media-caption.is-below",
                  ),
                ].reduce((sum, el) => {
                  const rectH = el.getBoundingClientRect().height || 0;
                  const st = getComputedStyle(el);
                  const mt = parseFloat(st.marginTop) || 0;
                  const mb = parseFloat(st.marginBottom) || 0;
                  return sum + rectH + mt + mb;
                }, 0)
              : 0;
            const px = prevH * ratio + gap + prevCaptionsH;
            item.style.setProperty("--media-overlap", `${px}px`);
          });
        });
        if (lastOpenedRow && lastOpenedRow.classList.contains("open")) {
          const container = lastOpenedRow.closest(".tab-page");
          if (container) scrollPanelIntoView(lastOpenedRow, container, false);
        }
      }
      function bindMediaOverlapObservers() {
        document
          .querySelectorAll(".panel-media-grid img, .panel-media-grid video")
          .forEach((el) => {
            if (
              (el.tagName === "IMG" && el.complete) ||
              (el.tagName === "VIDEO" && el.readyState >= 1)
            )
              return;
            const evt = el.tagName === "VIDEO" ? "loadedmetadata" : "load";
            el.addEventListener(evt, syncMediaOverlaps, { once: true });
          });
      }
      const finalLinkLayer = document.getElementById("final-link-layer");
      const finalLinkPosCache = new Map();
      const isCoarsePointer =
        window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(hover: none)").matches;
      const isMobileViewport = () =>
        window.matchMedia("(max-width: 900px)").matches;
      const FINAL_LINKS = [
        { label: "GitHub", url: "https://github.com/jisuryou" },
        {
          label: "LinkedIn",
          url: "https://www.linkedin.com/in/jisu-ryou-07086017b/",
        },
        {
          label: "CV Download",
          url: "/cv_jisuryou_260304.pdf",
          download: true,
          filename: "Jisu_Ryou_CV.pdf",
        },
        {
          label: "Portfolio Download",
          url: "/portfolio_jisuryou_260304.pdf",
          download: true,
          filename: "Jisu_Ryou_Portfolio.pdf",
        },
        {
          label: "+82 10-4242-2173",
          url: "tel:+821042422173",
          icon: "phone",
        },
        {
          label: "jisuryou7@gmail.com",
          url: "mailto:jisuryou7@gmail.com",
          icon: "mail",
        },
        {
          label: "Get in touch.",
          url: "#",
          disabled: true,
          note: true,
          icon: "link",
        },
      ];
      let finalLinksBuilt = false,
        finalLinksAnimatedOnce = false;
      const rowMediaPreviewState = new Map();
      const rowSweepPauseTimers = new WeakMap();
      const MEDIA_ALIGN_EDGE_X = 18,
        MEDIA_ALIGN_START_Y = 0,
        MEDIA_ALIGN_GAP = 10,
        FINAL_LINK_NUDGE_MS = 1200;
      function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
      }
      function pauseRowHoverSweep(pageEl, ms = 1250) {
        if (!pageEl) return;
        const prev = rowSweepPauseTimers.get(pageEl);
        if (prev) clearTimeout(prev);
        pageEl.classList.add("sweep-paused");
        const timer = setTimeout(() => {
          pageEl.classList.remove("sweep-paused");
          rowSweepPauseTimers.delete(pageEl);
        }, ms);
        rowSweepPauseTimers.set(pageEl, timer);
      }
      function getRowMediaPreviewLayer(pageEl) {
        if (!pageEl) return null;
        let layer = pageEl.querySelector(".row-media-preview-layer");
        if (layer) return layer;
        layer = document.createElement("div");
        layer.className = "row-media-preview-layer";
        pageEl.appendChild(layer);
        return layer;
      }
      function positionRowMediaPreview(pageEl, previewEl) {
        if (!pageEl || !previewEl) return;
        const top =
          pageEl.scrollTop + (pageEl.clientHeight - previewEl.offsetHeight) / 2;
        const maxTop = Math.max(
          0,
          pageEl.scrollHeight - previewEl.offsetHeight,
        );
        previewEl.style.top = `${clamp(top, 0, maxTop)}px`;
      }
      function buildRowMediaPreview(row) {
        const sourceGrid = row?.querySelector(".panel-media-grid");
        if (!sourceGrid) return null;
        const sourceItems = [
          ...sourceGrid.querySelectorAll(":scope > .panel-media-item"),
        ];
        if (!sourceItems.length) return null;
        const preview = document.createElement("div");
        preview.className = "row-media-preview";
        const grid = document.createElement("div");
        grid.className = "panel-media-grid";
        sourceItems.forEach((sourceItem) => {
          const sourceFrame = sourceItem.querySelector(".panel-media-frame");
          const sourceMedia = sourceFrame?.querySelector("img,video");
          if (!sourceMedia) return;
          const item = document.createElement("div");
          item.className = "panel-media-item";
          const style = sourceItem.getAttribute("style");
          if (style) item.setAttribute("style", style);
          const frame = document.createElement("div");
          frame.className = "panel-media-frame";
          const media = sourceMedia.cloneNode(true);
          if (media.tagName === "VIDEO") {
            media.muted = true;
            media.autoplay = true;
            media.loop = true;
            media.playsInline = true;
            media.removeAttribute("controls");
            media.preload = "metadata";
          } else {
            media.loading = "eager";
          }
          frame.appendChild(media);
          item.appendChild(frame);
          grid.appendChild(item);
        });
        if (!grid.children.length) return null;
        preview.appendChild(grid);
        return preview;
      }
      function hideRowMediaPreview(pageEl, row = null, immediate = false) {
        if (!pageEl) return;
        const state = rowMediaPreviewState.get(pageEl);
        if (!state) return;
        if (row && state.row !== row) return;
        const previewEl = state.preview;
        rowMediaPreviewState.delete(pageEl);
        if (immediate) {
          previewEl.classList.remove("show");
          if (previewEl.parentNode) previewEl.remove();
          return;
        }
        state.preview.classList.remove("show");
        setTimeout(() => {
          if (previewEl.parentNode) previewEl.remove();
        }, 220);
      }
      function showRowMediaPreview(row) {
        if (!row || row.classList.contains("open") || isCoarsePointer) return;
        const pageEl = row.closest(".tab-page");
        if (!pageEl) return;
        const preview = buildRowMediaPreview(row);
        if (!preview) return;
        hideRowMediaPreview(pageEl);
        const layer = getRowMediaPreviewLayer(pageEl);
        if (!layer) return;
        layer.appendChild(preview);
        positionRowMediaPreview(pageEl, preview);
        rowMediaPreviewState.set(pageEl, { row, preview });
        requestAnimationFrame(() => preview.classList.add("show"));
        preview.querySelectorAll("video").forEach((el) => {
          const play = el.play?.();
          if (play && typeof play.catch === "function") play.catch(() => {});
        });
      }
      function clearHoverMedia(immediate = false) {
        [...rowMediaPreviewState.keys()].forEach((pageEl) =>
          hideRowMediaPreview(pageEl, null, immediate),
        );
      }
      function bindFinalLinkHandleDrag(box, handle) {
        const EDGE_X = 18,
          EDGE_Y = 0;
        let mode = null,
          sx = 0,
          sy = 0,
          bx = 0,
          by = 0,
          bw = 0,
          bh = 0,
          pointerId = null;
        const onMove = (e) => {
          if (!mode || e.pointerId !== pointerId) return;
          const layerRect = finalLinkLayer.getBoundingClientRect();
          const dx = e.clientX - sx,
            dy = e.clientY - sy;
          const x = clamp(bx + dx, EDGE_X, layerRect.width - bw - EDGE_X),
            y = clamp(by + dy, EDGE_Y, layerRect.height - bh - EDGE_Y);
          box.style.left = `${x}px`;
          box.style.top = `${y}px`;
          finalLinkPosCache.set(box.dataset.cacheKey, { x, y, w: bw, h: bh });
        };
        const onUp = (e) => {
          if (!mode || e.pointerId !== pointerId) return;
          mode = null;
          pointerId = null;
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
          box.classList.remove("dragging");
        };
        box.addEventListener("pointerdown", (e) => {
          if (e.button !== 0) return;
          if (e.target === handle || e.target.closest(".hover-link-card"))
            return;
          e.preventDefault();
          box.classList.remove("nudging");
          mode = "drag";
          pointerId = e.pointerId;
          sx = e.clientX;
          sy = e.clientY;
          bx = parseFloat(box.style.left) || 0;
          by = parseFloat(box.style.top) || 0;
          bw = parseFloat(box.style.width) || box.offsetWidth;
          bh = parseFloat(box.style.height) || box.offsetHeight;
          box.classList.add("dragging");
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onUp);
        });
        handle.addEventListener("pointerdown", (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          box.classList.remove("nudging");
          mode = "drag";
          pointerId = e.pointerId;
          sx = e.clientX;
          sy = e.clientY;
          bx = parseFloat(box.style.left) || 0;
          by = parseFloat(box.style.top) || 0;
          bw = parseFloat(box.style.width) || box.offsetWidth;
          bh = parseFloat(box.style.height) || box.offsetHeight;
          box.classList.add("dragging");
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onUp);
        });
      }
      function getFinalLinkPosition(cacheKey, layerRect, w, h) {
        const EDGE_X = 18,
          EDGE_Y = 0;
        if (finalLinkPosCache.has(cacheKey)) {
          const c = finalLinkPosCache.get(cacheKey);
          const cw = c.w || w,
            ch = c.h || h;
          return {
            x: clamp(c.x, EDGE_X, layerRect.width - cw - EDGE_X),
            y: clamp(c.y, EDGE_Y, layerRect.height - ch - EDGE_Y),
          };
        }
        const seed = hashString(cacheKey),
          x =
            EDGE_X +
            seededRandom(seed + 7) *
              Math.max(1, layerRect.width - w - EDGE_X * 2),
          y =
            EDGE_Y +
            seededRandom(seed + 17) *
              Math.max(1, layerRect.height - h - EDGE_Y * 2);
        finalLinkPosCache.set(cacheKey, { x, y, w, h });
        return { x, y };
      }
      function constrainFinalLinkBoxToLayer(box) {
        const key = box.dataset.cacheKey;
        if (!key) return;
        const lr = finalLinkLayer.getBoundingClientRect();
        if (!lr.width || !lr.height) return;
        const EDGE_X = MEDIA_ALIGN_EDGE_X,
          EDGE_Y = MEDIA_ALIGN_START_Y;
        const pad = parseFloat(getComputedStyle(ctWrapper).paddingLeft) || 24;
        const maxW = Math.max(120, lr.width - pad * 2 - EDGE_X * 2);
        const card = box.querySelector(".hover-link-card");
        let w = parseFloat(box.style.width) || box.offsetWidth || 0;
        if (w > maxW) {
          box.style.width = `${maxW}px`;
          if (card) card.style.width = "100%";
          w = maxW;
        } else if (card) {
          card.style.width = "";
        }
        const h = parseFloat(box.style.height) || box.offsetHeight || 0;
        const maxX = Math.max(EDGE_X, lr.width - w - EDGE_X);
        const maxY = Math.max(EDGE_Y, lr.height - h - EDGE_Y);
        const x = clamp(parseFloat(box.style.left) || 0, EDGE_X, maxX);
        const y = clamp(parseFloat(box.style.top) || 0, EDGE_Y, maxY);
        box.style.left = `${x}px`;
        box.style.top = `${y}px`;
        finalLinkPosCache.set(key, { x, y, w, h });
      }
      function renderFinalLinks() {
        const rect = finalLinkLayer.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        finalLinkLayer.innerHTML = "";
        const created = [];
        FINAL_LINKS.forEach((item, idx) => {
          const cacheKey = `final-link-${idx}-${item.label || "item"}`;
          const cached = finalLinkPosCache.get(cacheKey);
          const w = cached?.w ?? Math.max(160, Math.min(250, rect.width * 0.2));
          const h = cached?.h ?? Math.max(52, Math.min(72, rect.height * 0.1));
          const pos = getFinalLinkPosition(cacheKey, rect, w, h);
          const box = document.createElement("div");
          box.className = "final-link-box";
          box.dataset.cacheKey = cacheKey;
          box.style.left = `${pos.x}px`;
          box.style.top = `${pos.y}px`;
          const a = document.createElement("a");
          a.className = "hover-link-card";
          if (item.note) a.classList.add("is-note");
          a.href = item.url;
          if (item.disabled) {
            a.classList.add("is-disabled");
            a.setAttribute("aria-disabled", "true");
            a.addEventListener("click", (e) => e.preventDefault());
          } else if (item.download) {
            a.download = item.filename || "";
          } else {
            a.target = "_blank";
            a.rel = "noopener noreferrer";
          }
          a.innerHTML = linkInnerHTML(
            item.label,
            item.icon || (item.download ? "download" : "link"),
          );
          box.appendChild(a);
          finalLinkLayer.appendChild(box);
          if (!isCoarsePointer) {
            const handle = document.createElement("span");
            handle.className = "hover-media-resize";
            box.appendChild(handle);
            bindFinalLinkHandleDrag(box, handle);
          }
          constrainFinalLinkBoxToLayer(box);
          created.push(box);
        });
        if (!finalLinksAnimatedOnce) {
          created.forEach((box, i) => {
            setTimeout(() => box.classList.add("show"), 140 + i * 120);
          });
          finalLinksAnimatedOnce = true;
        } else {
          created.forEach((box) => box.classList.add("show"));
        }
        finalLinksBuilt = true;
      }
      function hashString(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
          h = (h << 5) - h + str.charCodeAt(i);
          h |= 0;
        }
        return Math.abs(h);
      }
      function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      }
      function linkInnerHTML(label) {
        return `<span class="link-label">${label}</span>`;
      }
      function getChronoScore(item) {
        if (item.empty) return -Infinity;
        const src = `${item.yr ?? ""} ${item.cl ?? ""} ${item.name ?? ""}`;
        let score = -Infinity;
        if (/진행중|ongoing|present/i.test(src))
          score = Math.max(score, 999912);
        const r = src.match(/(20\d{2})[.\-/](\d{1,2})\s*[–-]\s*(\d{1,2})/);
        if (r) {
          const y = Number(r[1]),
            m = Math.min(12, Math.max(1, Number(r[3])));
          score = Math.max(score, y * 100 + m);
        }
        [...src.matchAll(/(20\d{2})(?:[.\-/](\d{1,2}))?/g)].forEach((m) => {
          const y = Number(m[1]),
            mo = m[2] ? Number(m[2]) : 12;
          score = Math.max(score, y * 100 + Math.min(12, Math.max(1, mo)));
        });
        return Number.isFinite(score) ? score : 0;
      }
      function buildList(data, pageId) {
        const c = document.getElementById(pageId),
          sorted = [...data].sort(
            (a, b) => getChronoScore(a) - getChronoScore(b),
          );
        sorted.forEach((d, idx) => {
          const row = document.createElement("div");
          row.className = "lrow" + (d.empty ? " empty" : "");
          const autoNo = String(idx + 1).padStart(2, "0"),
            isProj = pageId === "page-pr",
            isTalk = pageId === "page-tb";
          const mediaPanel = !d.empty ? buildPanelMediaHtml(d) : "";
          const panel =
            !d.empty && isProj
              ? `<div class="lrow-panel"><div class="panel-inner"><div class="pb"><span class="pl">Contribution</span><div class="pco">${toMultiline(d.co)}</div><div class="pds">${d.ds}</div></div><div class="pb prob-out-col">${d.pb ? `<div><span class="pl">Problem</span><div class="pbody">${d.pb}</div></div>` : ``}${d.oc ? `<div><span class="pl">Outcome</span><div class="pbody">${toMultiline(d.oc)}</div></div>` : ``}</div><div class="pb">${d.sd ? `<span class="pl2">System Design</span><div class="pbody">${toSystemDesignHtml(d.sd)}</div>` : ``}</div></div>${mediaPanel}</div>`
              : !d.empty && !isProj
                ? `<div class="lrow-panel"><div class="panel-inner talk-inner"><div class="pb"><span class="pl">Contribution</span><div class="pco">${toMultiline(d.co)}</div></div><div class="pb abs"><span class="pl">Abstract</span><div class="pbody">${parseDsMarkup(d.ds)}</div></div></div>${mediaPanel}</div>`
                : "";
          const storyTitle = escHtml(d.story || d.name || "");
          const projectTitle = escHtml(
            d.project || d.title || d.cl || d.name || "",
          );
          const rnameHtml =
            !d.empty && (isProj || isTalk)
              ? `<span class="rname"><span class="rname-story">${
                  storyTitle || projectTitle
                }</span><span class="rname-project">${
                  isProj
                    ? projectTitle || storyTitle
                    : storyTitle || projectTitle
                }</span></span>`
              : `<span class="rname">${storyTitle}</span>`;
          row.innerHTML = `<div class="lrt"><span class="rn">${autoNo}</span>${rnameHtml}<span class="rcl">${d.cl}</span><span class="ryr">${d.yr || ""}</span></div>${panel}`;
          c.appendChild(row);
          if (!d.empty) {
            const headerEl = row.querySelector(".lrt");
            if (headerEl) {
              headerEl.addEventListener("mouseenter", () => {
                if (!row.classList.contains("open")) showRowMediaPreview(row);
              });
              headerEl.addEventListener("mouseleave", () => {
                const pageEl = row.closest(".tab-page");
                if (pageEl) hideRowMediaPreview(pageEl, row);
              });
            }
            const closeBtn = row.querySelector(".panel-close");
            if (closeBtn) {
              closeBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const pageEl = row.closest(".tab-page");
                if (pageEl) pauseRowHoverSweep(pageEl);
                if (pageEl) hideRowMediaPreview(pageEl, row, true);
                resetRowGroupState(row);
                row.classList.remove("open");
                if (activeRows[pageId] === row) activeRows[pageId] = null;
              });
            }
            row
              .querySelectorAll(
                ".panel-media-links .hover-link-card.is-disabled",
              )
              .forEach((el) =>
                el.addEventListener("click", (e) => e.preventDefault()),
              );
            row.tabIndex = 0;
            const toggleOpen = () => {
              if (row.classList.contains("open")) return;
              const pageEl = row.closest(".tab-page");
              if (pageEl) hideRowMediaPreview(pageEl, row, true);
              const prevRow =
                activeRows[pageId] && activeRows[pageId] !== row
                  ? activeRows[pageId]
                  : null;
              const doOpen = () => {
                const scrollContainer = row.closest(".tab-page");
                if (scrollContainer) {
                  row.classList.add("open");
                  activeRows[pageId] = row;
                  lastOpenedRow = row;
                  const panelEl = row.querySelector(".lrow-panel");
                  if (panelEl) {
                    const onEnd = (e) => {
                      if (e.propertyName !== "max-height") return;
                      panelEl.removeEventListener("transitionend", onEnd);
                      if (row.classList.contains("open")) {
                        scrollPanelIntoView(row, scrollContainer, true);
                      }
                    };
                    panelEl.addEventListener("transitionend", onEnd);
                  }
                  const topPad = 12;
                  const maxScroll =
                    scrollContainer.scrollHeight - scrollContainer.clientHeight;
                  const baseTop = Math.max(
                    0,
                    Math.min(maxScroll, row.offsetTop - topPad),
                  );
                  scrollContainer.scrollTo({
                    top: baseTop,
                    behavior: "smooth",
                  });
                  requestAnimationFrame(() =>
                    scrollPanelIntoView(row, scrollContainer, true),
                  );
                } else {
                  row.classList.add("open");
                  activeRows[pageId] = row;
                  lastOpenedRow = row;
                }
                clearHoverMedia(true);
                syncMediaOverlaps();
                if (scrollContainer) {
                  setTimeout(
                    () => scrollPanelIntoView(row, scrollContainer, true),
                    260,
                  );
                  setTimeout(
                    () => scrollPanelIntoView(row, scrollContainer, true),
                    1300,
                  );
                }
              };
              doOpen();
            };
            row.addEventListener("click", (e) => {
              if (e.target.closest("a,button,input,textarea,select")) return;
              toggleOpen();
            });
            row.addEventListener("keydown", (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleOpen();
              }
            });
            // Group hover/click interaction
            const grid = row.querySelector(".panel-media-grid");
            if (grid) {
              const groupIndexes = buildGroupIndex(d);
              const mediaItems = [
                ...grid.querySelectorAll(".panel-media-item"),
              ];
              groupIndexes.forEach((g, i) => {
                if (g >= 0 && mediaItems[i])
                  mediaItems[i].dataset.group = String(g);
              });
              // Mark standalone captions (grid siblings, not inside panel-media-item)
              [...grid.children].forEach((child) => {
                if (child.classList.contains("panel-media-item")) return;
                let prev = child.previousElementSibling;
                while (prev && !prev.classList.contains("panel-media-item"))
                  prev = prev.previousElementSibling;
                if (prev && prev.dataset.group !== undefined)
                  child.dataset.group = prev.dataset.group;
              });
              const lockedGroups = new Set();
              const hoveredGroups = new Set();
              const allGroups = new Set(
                mediaItems
                  .map((el) => el.dataset.group)
                  .filter((g) => g !== undefined)
                  .map((g) => Number(g)),
              );
              const renderGroups = () => {
                allGroups.forEach((g) => {
                  const key = String(g);
                  const isHovered = hoveredGroups.has(g);
                  const isLocked = lockedGroups.has(g);
                  mediaItems
                    .filter((el) => el.dataset.group === key)
                    .forEach((el) => {
                      el.classList.toggle(
                        "group-hovered",
                        isHovered && !isLocked,
                      );
                      el.classList.toggle("group-locked", isLocked);
                    });
                  grid
                    .querySelectorAll(
                      `.panel-media-caption[data-group="${key}"]`,
                    )
                    .forEach((el) =>
                      el.classList.toggle("group-locked", isLocked),
                    );
                  row
                    .querySelectorAll(
                      `.sd-mark[data-group="${key}"], .ds-mark[data-group="${key}"]`,
                    )
                    .forEach((el) =>
                      el.classList.toggle("active", isLocked || isHovered),
                    );
                });
              };
              const resetGroups = () => {
                lockedGroups.clear();
                hoveredGroups.clear();
                renderGroups();
              };
              const toggleGroupLock = (g) => {
                const wasLocked = lockedGroups.has(g);
                if (lockedGroups.has(g)) {
                  lockedGroups.delete(g);
                } else {
                  lockedGroups.add(g);
                }
                renderGroups();
                requestAnimationFrame(syncMediaOverlaps);
                if (!wasLocked) {
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      scrollGroupIntoView(row, grid, g, true);
                    });
                  });
                }
              };
              rowGroupStateResetters.set(row, resetGroups);
              mediaItems.forEach((item) => {
                if (item.dataset.group === undefined) return;
                const g = parseInt(item.dataset.group);
                const frame = item.querySelector(".panel-media-frame");
                if (!frame) return;
                frame.addEventListener("mouseenter", () => {
                  hoveredGroups.add(g);
                  renderGroups();
                });
                frame.addEventListener("mouseleave", () => {
                  hoveredGroups.delete(g);
                  renderGroups();
                });
                frame.addEventListener("click", (e) => {
                  e.stopPropagation();
                  toggleGroupLock(g);
                });
              });
              row
                .querySelectorAll(".sd-mark[data-group], .ds-mark[data-group]")
                .forEach((markEl) => {
                  const g = parseInt(markEl.dataset.group, 10);
                  if (Number.isNaN(g)) return;
                  markEl.addEventListener("mouseenter", () => {
                    hoveredGroups.add(g);
                    renderGroups();
                  });
                  markEl.addEventListener("mouseleave", () => {
                    hoveredGroups.delete(g);
                    renderGroups();
                  });
                  markEl.addEventListener("click", (e) => {
                    e.stopPropagation();
                    toggleGroupLock(g);
                  });
                });
              renderGroups();
            }
          }
        });
      }
      async function initPortfolioDataAndLists() {
        if (portfolioDataLoaded) return;
        try {
          await loadPortfolioData();
          const pr = document.getElementById("page-pr");
          const tb = document.getElementById("page-tb");
          if (pr) pr.innerHTML = "";
          if (tb) tb.innerHTML = "";
          buildList(PROJ, "page-pr");
          buildList(TALKS, "page-tb");
          ["page-pr", "page-tb"].forEach((id) => {
            const pageEl = document.getElementById(id);
            if (!pageEl) return;
            pageEl.addEventListener(
              "scroll",
              () => {
                const state = rowMediaPreviewState.get(pageEl);
                if (state) positionRowMediaPreview(pageEl, state.preview);
              },
              { passive: true },
            );
            pageEl.addEventListener("mouseleave", () =>
              hideRowMediaPreview(pageEl),
            );
          });
          syncMediaOverlaps();
          bindMediaOverlapObservers();
          syncLeadHeight();
          portfolioDataLoaded = true;
        } catch (err) {
          console.error(err);
        }
      }
      function syncLeadHeight() {
        const rows = document.querySelectorAll("#page-pr .lrow");
        if (rows.length < 2) return;
        const t = rows[0].getBoundingClientRect().top,
          b = rows[1].getBoundingClientRect().bottom;
        document.documentElement.style.setProperty(
          "--ov-head-target",
          `${Math.max(80, Math.round(b - t))}px`,
        );
      }
      initPortfolioDataAndLists();
      window.addEventListener("resize", () => {
        clearHoverMedia();
        syncLeadHeight();
        if (finalLinksBuilt) {
          finalLinkPosCache.clear();
          renderFinalLinks();
          if (ctRow2Resolved) snapMediaToHome();
        }
        syncMediaOverlaps();
      });

      let state = "intro",
        curTab = 0,
        busy = false,
        introReady = false;
      let keepShellHintVisible = false;
      const words = [0, 1, 2, 3].map((i) => document.getElementById("w" + i));
      const shellHint = document.getElementById("shell-hint");
      const anagramGray = document.getElementById("anagram-gray");
      const anagramStructure = document.getElementById("anagram-structure");
      const introAnagram = document.getElementById("intro-anagram");
      const introWords = document.getElementById("intro-words");
      const finalPage = document.getElementById("final-page");
      const finalLines = [...finalPage.querySelectorAll(".final-line")];
      let finalActive = false;
      const GITHUB_OWNER = "jisuryou";
      const GITHUB_REPO = "jisuryou.github.io";

      async function updateLastUpdatedFromGitHub() {
        const footDateEl = document.querySelector("#global-foot .fy");
        if (!footDateEl) return;
        try {
          const repoRes = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
            { cache: "no-store" },
          );
          if (!repoRes.ok) return;
          const repo = await repoRes.json();
          const branch = repo?.default_branch || "main";
          const commitRes = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?sha=${encodeURIComponent(branch)}&per_page=1`,
            { cache: "no-store" },
          );
          if (!commitRes.ok) return;
          const commits = await commitRes.json();
          const dateStr = commits?.[0]?.commit?.committer?.date;
          if (!dateStr) return;
          const d = new Date(dateStr);
          if (Number.isNaN(d.getTime())) return;
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          footDateEl.textContent = `Last updated ${y}.${m}.${day}`;
        } catch (_) {}
      }
      updateLastUpdatedFromGitHub();

      // ── CONTACT TAB ─────────────────────────────────────────────────────────
      const ctWrapper = document.getElementById("ct-wrapper");
      const ctAnagram1 = document.getElementById("ct-anagram-1");
      const ctAnagram2 = document.getElementById("ct-anagram-2");
      const ctTrigger1 = document.getElementById("ct-trigger-1");
      const ctTrigger2 = document.getElementById("ct-trigger-2");
      let ctRow1Resolved = false,
        ctRow2Resolved = false;

      function initCtAnagram(container, text) {
        container.innerHTML = "";
        const arr = text.split("");
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        arr.forEach((ch) => {
          const s = document.createElement("span");
          s.className = "anagram-char";
          s.textContent = ch;
          container.appendChild(s);
        });
      }
      initCtAnagram(ctAnagram1, "interaction as");
      initCtAnagram(ctAnagram2, "system as");

      async function resolveCtAnagram(anagramEl, text) {
        const srcSpans = [...anagramEl.querySelectorAll(".anagram-char")];
        if (!srcSpans.length) return;
        const layer = finalLinkLayer;
        const layerRect = layer.getBoundingClientRect();
        const anagramRect = anagramEl.getBoundingClientRect();
        const fontSize = getComputedStyle(anagramEl).fontSize;
        // Freeze layout size to prevent collapse when innerHTML is cleared later
        anagramEl.style.display = "inline-block";
        anagramEl.style.minWidth = anagramRect.width + "px";

        // 1. Measure source positions — no DOM changes
        const sources = srcSpans.map((s) => {
          const r = s.getBoundingClientRect();
          return {
            char: s.textContent,
            x: r.left - layerRect.left,
            y: r.top - layerRect.top,
            w: r.width,
            h: r.height,
          };
        });

        // 2. Measure target positions via temp element inside layer (zero layout impact)
        const tempEl = document.createElement("span");
        tempEl.style.cssText = `position:absolute;left:${anagramRect.left - layerRect.left}px;top:${anagramRect.top - layerRect.top}px;width:${anagramRect.width}px;font-family:var(--serif);font-size:${fontSize};font-weight:300;line-height:1.15;visibility:hidden;pointer-events:none;z-index:-1;`;
        text.split("").forEach((ch) => {
          const s = document.createElement("span");
          s.className = "anagram-char";
          s.textContent = ch;
          tempEl.appendChild(s);
        });
        layer.appendChild(tempEl);
        layer.getBoundingClientRect(); // force reflow

        const targets = [...tempEl.querySelectorAll(".anagram-char")].map(
          (s) => {
            const r = s.getBoundingClientRect();
            return {
              char: s.textContent,
              x: r.left - layerRect.left,
              y: r.top - layerRect.top,
              w: r.width,
            };
          },
        );
        tempEl.remove();

        // 3. Nearest-neighbor match by char
        const usedIdx = new Set();
        const matched = sources.map((src) => {
          const candidates = targets.reduce((acc, t, i) => {
            if (!usedIdx.has(i) && t.char === src.char) acc.push({ t, i });
            return acc;
          }, []);
          if (!candidates.length) {
            const fb = targets.findIndex((_, i) => !usedIdx.has(i));
            if (fb >= 0) {
              usedIdx.add(fb);
              return { src, tgt: targets[fb] };
            }
            return { src, tgt: { x: src.x, y: src.y } };
          }
          let best = candidates[0],
            bestD = Infinity;
          candidates.forEach(({ t, i }) => {
            const d = Math.hypot(t.x - src.x, t.y - src.y);
            if (d < bestD) {
              bestD = d;
              best = { t, i };
            }
          });
          usedIdx.add(best.i);
          return { src, tgt: best.t };
        });

        // 4. Spawn flying spans inside the link layer
        const flySpans = matched.map(({ src }) => {
          const span = document.createElement("span");
          span.className = "anagram-char";
          span.textContent = src.char;
          span.style.cssText = `position:absolute;left:${src.x}px;top:${src.y}px;width:${src.w}px;font-family:var(--serif);font-size:${fontSize};font-weight:300;line-height:1.15;color:var(--g3);pointer-events:none;z-index:10;`;
          layer.appendChild(span);
          return span;
        });

        // 5. Hide scrambled, transition fly spans to target
        anagramEl.style.opacity = "0";
        await sleep(30);
        const dur = 900,
          ease = "cubic-bezier(0.76,0,0.24,1)";
        flySpans.forEach((span, i) => {
          const { tgt } = matched[i];
          span.style.transition = `left ${dur}ms ${ease}`;
          span.style.left = `${tgt.x}px`;
          // Y stays fixed — chars rearrange on same line, no vertical movement needed
        });

        await sleep(dur + 30);

        // 6. Replace with proper text, restore visibility, remove fly spans
        anagramEl.innerHTML = "";
        text.split("").forEach((ch) => {
          const s = document.createElement("span");
          s.className = "anagram-char";
          s.textContent = ch;
          anagramEl.appendChild(s);
        });
        anagramEl.style.opacity = "";
        flySpans.forEach((s) => s.remove());
        anagramEl.style.display = "";
        anagramEl.style.minWidth = "";
      }

      function snapMediaToHome() {
        const boxes = [...finalLinkLayer.querySelectorAll(".final-link-box")];
        if (!boxes.length) return;
        const lr = finalLinkLayer.getBoundingClientRect();
        const pad = parseFloat(getComputedStyle(ctWrapper).paddingLeft) || 24;
        const EDGE_X = MEDIA_ALIGN_EDGE_X,
          EDGE_Y = MEDIA_ALIGN_START_Y;
        const mobileMode = isMobileViewport();
        const rightEdgeX = Math.round(lr.width - pad - EDGE_X);
        const leftEdgeX = Math.max(0, Math.round(pad));
        const linkH = 60;
        const gap = mobileMode ? 8 : MEDIA_ALIGN_GAP;
        const ctTextEl = document.getElementById("ct-text");
        const ctTextRect = ctTextEl ? ctTextEl.getBoundingClientRect() : null;
        const mobileStartY = ctTextRect
          ? Math.max(EDGE_Y, Math.round(ctTextRect.bottom - lr.top + 12))
          : EDGE_Y;
        boxes.forEach((box) => {
          box.style.width = "";
        });
        finalLinkLayer.getBoundingClientRect();
        let yCursor = mobileMode ? mobileStartY : EDGE_Y;
        boxes.forEach((box, i) => {
          const bw = box.offsetWidth || 160;
          const bh = box.offsetHeight || linkH;
          const maxX = Math.max(0, lr.width - bw - EDGE_X);
          const lx = mobileMode ? clamp(leftEdgeX, 0, maxX) : rightEdgeX - bw;
          const ly = mobileMode ? yCursor : EDGE_Y + i * (linkH + gap);
          box.classList.add("nudging");
          box.style.left = `${lx}px`;
          box.style.top = `${ly}px`;
          finalLinkPosCache.set(box.dataset.cacheKey, {
            x: lx,
            y: ly,
            w: bw,
            h: bh,
          });
          if (mobileMode) yCursor += bh + gap;
          setTimeout(
            () => box.classList.remove("nudging"),
            FINAL_LINK_NUDGE_MS,
          );
        });
      }

      // Scramble "research.  design. build. " — 3 dots, 4 spaces
      // Render as individual char spans for fly animation
      (function () {
        const src = "research.design.build.";
        const arr = src.split("");
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        arr.forEach((ch) => {
          const s = document.createElement("span");
          s.className = "anagram-char";
          s.textContent = ch;
          anagramGray.appendChild(s);
        });
        "structure.".split("").forEach((ch) => {
          const s = document.createElement("span");
          s.className = "anagram-char";
          s.textContent = ch;
          anagramStructure.appendChild(s);
        });
      })();

      let blinkCooldown = false;
      function triggerBlink() {
        if (state !== "intro" || busy || introReady || blinkCooldown) return;
        if (anagramStructure.matches(":hover, :focus-visible")) return;
        blinkCooldown = true;
        anagramStructure.classList.add("blink");
        anagramStructure.addEventListener(
          "animationend",
          () => {
            anagramStructure.classList.remove("blink");
            blinkCooldown = false;
          },
          { once: true },
        );
      }
      let ctBlinkCooldown = false;
      function triggerCtBlink(triggerEl) {
        if (ctBlinkCooldown || triggerEl.classList.contains("done")) return;
        if (triggerEl.matches(":hover, :focus-visible")) return;
        ctBlinkCooldown = true;
        triggerEl.classList.add("blink");
        triggerEl.addEventListener(
          "animationend",
          () => {
            triggerEl.classList.remove("blink");
            ctBlinkCooldown = false;
          },
          { once: true },
        );
      }
      [anagramStructure, ctTrigger1, ctTrigger2].forEach((el) => {
        el.addEventListener("mouseenter", () => {
          el.classList.remove("blink");
          blinkCooldown = false;
          ctBlinkCooldown = false;
        });
      });
      finalPage.addEventListener("click", (e) => {
        if (state !== "shell" || curTab !== 3) return;
        if (e.target.closest(".tab")) return;
        if (!ctRow1Resolved) {
          if (e.target.closest("#ct-trigger-1")) return;
          triggerCtBlink(ctTrigger1);
        } else if (!ctRow2Resolved) {
          if (
            e.target.closest(
              "#ct-trigger-1, #ct-trigger-2, .final-link-box, .hover-link-card, .hover-media-resize",
            )
          )
            return;
          triggerCtBlink(ctTrigger2);
        }
      });
      finalPage.addEventListener(
        "wheel",
        (e) => {
          if (state !== "shell" || curTab !== 3) return;
          if (!ctRow1Resolved) {
            triggerCtBlink(ctTrigger1);
          } else if (!ctRow2Resolved) {
            triggerCtBlink(ctTrigger2);
          }
        },
        { passive: true },
      );

      function updateShellHint(tabIdx = curTab) {
        if (!shellHint) return;
        const show =
          (state === "shell" || keepShellHintVisible) &&
          tabIdx === 0 &&
          !finalActive;
        shellHint.classList.toggle("vis", show);
      }
      updateShellHint();

      /* ══ LINE SYSTEM ══════════════════════════════════════ */
      const layer = document.getElementById("line-layer");
      const EASING = "cubic-bezier(0.22,1,0.36,1)";
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      function getTopY() {
        const el = document.getElementById("frame-top");
        return el ? el.getBoundingClientRect().top : 50;
      }
      function getBotY() {
        const el = document.getElementById("frame-bot");
        return el ? el.getBoundingClientRect().top : window.innerHeight - 50;
      }

      function getLineYs(pageEl) {
        const topY = getTopY(),
          botY = getBotY();
        const frameTopRect = document
          .getElementById("frame-top")
          .getBoundingClientRect();
        const rootSty = getComputedStyle(document.documentElement);
        const ruleW = parseFloat(rootSty.getPropertyValue("--rule-w")) || 1;
        const g4 = rootSty.getPropertyValue("--g4").trim() || "#0a0a0a";
        const padPx = frameTopRect.left;
        const lines = [];
        const lead = pageEl.querySelector(".ov-lead");
        if (lead) {
          const sty = getComputedStyle(lead),
            r = lead.getBoundingClientRect();
          const bw = parseFloat(sty.borderBottomWidth) || ruleW;
          if (r.bottom > topY && r.bottom < botY)
            lines.push({
              y: r.bottom - bw,
              x1: r.left,
              x2: r.right,
              w: bw,
              c: sty.borderBottomColor || g4,
            });
        }
        pageEl.querySelectorAll(".ov-item").forEach((el) => {
          const sty = getComputedStyle(el);
          if (sty.borderBottomStyle !== "none") {
            const r = el.getBoundingClientRect();
            const bw = parseFloat(sty.borderBottomWidth) || ruleW;
            if (r.bottom > topY + 2 && r.bottom < botY - 2)
              lines.push({
                y: r.bottom - bw,
                x1: r.left,
                x2: r.right,
                w: bw,
                c: g4,
              });
          }
        });
        pageEl.querySelectorAll(".lrow").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom > topY + 2 && r.bottom < botY - 2)
            lines.push({
              y: r.bottom - ruleW,
              x1: r.left + padPx,
              x2: r.right - padPx,
              w: ruleW,
              c: g4,
            });
        });
        const seen = new Set();
        return lines
          .filter((l) => {
            const k = `${l.y}-${l.x1}-${l.x2}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .sort((a, b) => a.y - b.y);
      }
      function spawnClines(lines, startY) {
        return lines.map((l) => {
          const left = l.x1;
          const width = Math.max(0, l.x2 - l.x1);
          const el = document.createElement("div");
          el.className = "cline";
          el.style.transition = "none";
          el.style.top = startY + "px";
          el.style.left = left + "px";
          el.style.width = width + "px";
          el.style.height = (l.w || 1) + "px";
          el.style.background = "var(--black)";
          layer.appendChild(el);
          return el;
        });
      }
      function flyDown(clines, lines, stagger = 45) {
        return new Promise((res) => {
          clines[0] && clines[0].getBoundingClientRect();
          const maxDur = 430;
          clines.forEach((el, i) =>
            setTimeout(() => {
              el.style.transition = `top ${maxDur}ms ${EASING}`;
              el.style.top = lines[i].y + "px";
            }, i * stagger),
          );
          setTimeout(res, clines.length * stagger + maxDur);
        });
      }
      function flyUp(clines, startY, stagger = 35) {
        return new Promise((res) => {
          const dur = 760,
            rev = [...clines].reverse();
          rev.forEach((el, i) =>
            setTimeout(() => {
              el.style.transition = `top ${dur}ms cubic-bezier(0.4,0,0.6,1)`;
              el.style.top = startY + "px";
            }, i * stagger),
          );
          setTimeout(res, rev.length * stagger + dur);
        });
      }
      function removeClines(clines) {
        clines.forEach((el) => el.remove());
      }

      /* ── INTRO → SHELL ────────────────────────────────── */
      async function goToShell() {
        if (!introReady || busy || state !== "intro") return;
        busy = true;
        keepShellHintVisible = true;
        updateShellHint(0);
        resetShellToOverview(true);
        const shell = document.getElementById("shell"),
          introEl = document.getElementById("intro");

        // Shell starts just below viewport, no opacity tricks
        shell.style.transform = "translateY(100vh)";
        shell.style.transition = "";
        shell.classList.add("vis");
        await sleep(30);

        // Intro slides up off screen, shell slides up from below
        const dur = 1100;
        const ease = "cubic-bezier(0.76, 0, 0.24, 1)";
        introEl.style.transition = `transform ${dur}ms ${ease}`;
        introEl.style.transform = "translateY(-100vh)";
        shell.style.transition = `transform ${dur}ms ${ease}`;
        shell.style.transform = "translateY(0)";

        await sleep(dur + 30);

        introEl.style.display = "none";
        introEl.style.transform = "";
        introEl.style.transition = "";
        shell.style.transform = "";
        shell.style.transition = "";
        keepShellHintVisible = false;
        busy = false;
        state = "shell";
        updateShellHint();
      }

      function exitFinalPageNow() {
        finalActive = false;
        updateShellHint();
      }

      /* ── TAB SWITCH ───────────────────────────────────── */
      const slider = document.getElementById("tab-slider");
      let tabBusy = false;
      function replayOverviewLead() {
        const lead = document.querySelector("#page-ov .ov-lead");
        if (!lead) return;
        lead.classList.remove("ov-anim");
        void lead.offsetWidth;
        lead.classList.add("ov-anim");
      }
      function resetShellToOverview(silent = false) {
        const shell = document.getElementById("shell");
        if (silent) shell.classList.add("tab-resetting");
        const pages = document.querySelectorAll(".tab-page");
        slider.style.transform = "translateX(0%)";
        document
          .querySelectorAll(".tab")
          .forEach((t, i) => t.classList.toggle("on", i === 0));
        pages.forEach((p) => {
          p.scrollTop = 0;
          p.style.overflowY = "auto";
          p.classList.remove("hide-borders");
          p.querySelectorAll(".lrow.open").forEach((row) => {
            resetRowGroupState(row);
            row.classList.remove("open");
          });
        });
        curTab = 0;
        clearHoverMedia(true);
        replayOverviewLead();
        updateShellHint();
        if (silent) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => shell.classList.remove("tab-resetting"), 80);
            });
          });
        }
      }
      async function switchTab(idx) {
        if (idx === curTab || tabBusy) return;
        if (curTab === 0) {
          const lead = document.querySelector("#page-ov .ov-lead");
          if (lead) lead.classList.remove("ov-anim");
        }
        tabBusy = true;
        if (finalActive) exitFinalPageNow();
        updateShellHint(idx);
        clearHoverMedia(true);
        const pages = document.querySelectorAll(".tab-page"),
          fromPage = pages[curTab],
          toPage = pages[idx];
        const fromLines = getLineYs(fromPage),
          fromClines = spawnClines(fromLines, getTopY());
        fromClines.forEach((el, i) => {
          el.style.top = fromLines[i].y + "px";
        });
        fromPage.classList.add("hide-borders");
        toPage.classList.add("hide-borders");
        await sleep(16);
        const liftPromise = flyUp(fromClines, getTopY(), 32);
        slider.style.transform = `translateX(-${idx * 25}%)`;
        document
          .querySelectorAll(".tab")
          .forEach((t, i) => t.classList.toggle("on", i === idx));
        await Promise.all([liftPromise, sleep(1100)]);
        removeClines(fromClines);
        fromPage.classList.remove("hide-borders");
        const toLines = getLineYs(toPage);
        if (toLines.length) {
          const toClines = spawnClines(toLines, getTopY());
          await flyDown(toClines, toLines, 20);
          removeClines(toClines);
          toPage.classList.remove("hide-borders");
        } else {
          toPage.classList.remove("hide-borders");
        }
        toPage.scrollTop = 0;
        fromPage.querySelectorAll(".lrow.open").forEach((row) => {
          resetRowGroupState(row);
          row.classList.remove("open");
        });
        curTab = idx;
        if (idx === 0) replayOverviewLead();
        if (idx === 3) {
          finalLines.forEach((l) => l.classList.add("vis"));
          if (ctRow1Resolved && !finalLinksBuilt) renderFinalLinks();
        }
        tabBusy = false;
        updateShellHint();
      }

      /* ── TRIGGERS ─────────────────────────────────────── */
      const introEl = document.getElementById("intro");
      introEl.addEventListener(
        "wheel",
        (e) => {
          if (state !== "intro" || busy) return;
          if (!introReady) {
            if (e.deltaY > 0) triggerBlink();
          } else {
            if (e.deltaY > 0) goToShell();
          }
        },
        { passive: true },
      );
      introEl.addEventListener("mousemove", triggerBlink);
      anagramStructure.addEventListener("click", async () => {
        if (state !== "intro" || busy) return;

        // 1. Measure source char positions
        const graySpans = [...anagramGray.querySelectorAll(".anagram-char")];
        const structSpans = [
          ...anagramStructure.querySelectorAll(".anagram-char"),
        ];
        const allSrcSpans = [...graySpans, ...structSpans];
        const grayCount = graySpans.length;
        const fontSize = parseFloat(getComputedStyle(allSrcSpans[0]).fontSize);
        const sources = allSrcSpans.map((s, i) => {
          const r = s.getBoundingClientRect();
          return {
            char: s.textContent,
            x: r.left,
            y: r.top,
            w: r.width,
            h: r.height,
            isBlack: i >= grayCount,
          };
        });

        // 2. Measure target positions (chars in final right-aligned layout)
        // Use display:none on anagram so layout matches the final state exactly
        introAnagram.style.display = "none";
        introWords.style.cssText = "display:block;visibility:hidden;";
        const wordTexts = ["research.", "design.", "build.", "structure."];
        words.forEach((w, wi) => {
          w.style.cssText = "transition:none;opacity:1;transform:none;";
          w.innerHTML = "";
          wordTexts[wi].split("").forEach((ch) => {
            const s = document.createElement("span");
            s.className = "anagram-char";
            s.textContent = ch;
            w.appendChild(s);
          });
        });
        introWords.getBoundingClientRect(); // force reflow

        const targets = [];
        words.forEach((w, wi) => {
          w.querySelectorAll(".anagram-char").forEach((s) => {
            const r = s.getBoundingClientRect();
            targets.push({
              char: s.textContent,
              x: r.left,
              y: r.top,
              isBlack: wi === 3,
              used: false,
            });
          });
          w.innerHTML = wordTexts[wi];
          w.style.cssText = "";
        });
        introAnagram.style.display = "";
        introWords.style.cssText = "";

        // 3. Nearest-neighbour match source → target (by char type)
        const tgtByChar = {};
        targets.forEach((t) => {
          (tgtByChar[t.char] = tgtByChar[t.char] || []).push(t);
        });
        const matches = sources.map((src) => {
          const pool = (tgtByChar[src.char] || []).filter(
            (t) => !t.used && t.isBlack === src.isBlack,
          );
          if (!pool.length) return null;
          let best = pool[0];
          let bestD = (src.x - best.x) ** 2 + (src.y - best.y) ** 2;
          for (let i = 1; i < pool.length; i++) {
            const d = (src.x - pool[i].x) ** 2 + (src.y - pool[i].y) ** 2;
            if (d < bestD) {
              bestD = d;
              best = pool[i];
            }
          }
          best.used = true;
          return best;
        });

        // 4. Spawn flying spans inside introEl (position:absolute = same coords
        //    since introEl is position:fixed inset:0). Layer fades with intro in
        //    goToShell() — no swap needed, no flicker.
        const layer = document.createElement("div");
        layer.style.cssText =
          "position:absolute;inset:0;pointer-events:none;z-index:1;";
        introEl.appendChild(layer);
        const flySpans = sources.map((src) => {
          const span = document.createElement("span");
          span.textContent = src.char;
          span.style.cssText = [
            "position:absolute",
            `left:${src.x}px`,
            `top:${src.y}px`,
            `width:${src.w}px`,
            "font-family:var(--serif)",
            `font-size:${fontSize}px`,
            "font-weight:300",
            `color:${src.isBlack ? "var(--black)" : "var(--g3)"}`,
            "white-space:pre",
            "line-height:1.15",
            "pointer-events:none",
          ].join(";");
          layer.appendChild(span);
          return span;
        });

        // Hide originals (flying spans now cover them)
        introAnagram.style.opacity = "0";
        await sleep(30);

        // 5. Animate to target positions
        const dur = 900;
        flySpans.forEach((span, si) => {
          const tgt = matches[si];
          if (tgt) {
            span.style.transition = [
              `left ${dur}ms cubic-bezier(0.4,0,0.2,1)`,
              `top ${dur}ms cubic-bezier(0.4,0,0.2,1)`,
            ].join(",");
            span.style.left = tgt.x + "px";
            span.style.top = tgt.y + "px";
          } else {
            span.style.transition = `opacity ${dur * 0.5}ms ease`;
            span.style.opacity = "0";
          }
        });

        await sleep(dur + 60);

        // 6. Flying spans are now at their final positions inside introEl.
        //    goToShell() will fade introEl out — no swap, no flicker.
        introReady = true;
        await sleep(600);
        goToShell();
      });
      let introTouchY = 0;
      introEl.addEventListener(
        "touchstart",
        (e) => {
          if (state !== "intro" || busy) return;
          introTouchY = e.touches[0].clientY;
        },
        { passive: true },
      );
      introEl.addEventListener(
        "touchmove",
        (e) => {
          if (state !== "intro" || busy) return;
          const y = e.touches[0].clientY;
          const delta = introTouchY - y;
          introTouchY = y;
          if (!introReady) {
            if (delta > 5) triggerBlink();
          } else {
            if (delta > 14) goToShell();
          }
        },
        { passive: true },
      );

      document
        .querySelectorAll(".tab")
        .forEach((tab, i) => tab.addEventListener("click", () => switchTab(i)));

      // Contact tab triggers
      ctTrigger1.addEventListener("click", async () => {
        if (ctRow1Resolved) return;
        ctRow1Resolved = true;
        ctTrigger1.classList.add("done");
        await resolveCtAnagram(ctAnagram1, "interaction as");
        renderFinalLinks();
      });

      ctTrigger2.addEventListener("click", async () => {
        if (!ctRow1Resolved) {
          ctTrigger2.classList.add("no-sweep");
          ctTrigger2.blur();
          setTimeout(() => ctTrigger2.classList.remove("no-sweep"), 2200);
          triggerCtBlink(ctTrigger1);
          return;
        }
        if (!ctRow2Resolved) {
          ctRow2Resolved = true;
          ctTrigger2.classList.add("done");
          await resolveCtAnagram(ctAnagram2, "system as");
        }
        if (!finalLinksBuilt) {
          renderFinalLinks();
          await sleep(800);
        }
        snapMediaToHome();
      });

      document.addEventListener("keydown", (e) => {
        if (state !== "shell") return;
        if (e.key === "ArrowRight" && curTab < 2) switchTab(curTab + 1);
        if (e.key === "ArrowLeft" && curTab > 0) switchTab(curTab - 1);
      });
