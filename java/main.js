const copy = `Давайте знакомиться.

Мы Сласти. Печём в Москве уже четыре года: торты, бенто и капкейки. На день рождения, на выпускной, на открытие и просто так, чтобы порадовать своих.

Праздник большой? Собираем торт больше 5 кг. Хочется поздравить одного близкого человека? Делаем бенто. Оформление под ваш повод, а вкус остаётся вкусным. Успеем и за один день.`;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setupNav() {
  const links = Array.from(document.querySelectorAll(".nav-row a"));
  const sections = links
    .map((link) => document.getElementById(link.dataset.section))
    .filter(Boolean);

  const mark = () => {
    let activeId = "top";
    if (window.scrollY >= 80 && sections.length) {
      const line = 96;
      let best = sections[0];
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const section of sections) {
        const distance = Math.abs(section.getBoundingClientRect().top - line);
        if (distance < bestDistance) {
          best = section;
          bestDistance = distance;
        }
      }
      activeId = best.id;
    }
    for (const link of links) {
      if (link.dataset.section === activeId) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  };

  mark();
  window.addEventListener("scroll", mark, { passive: true });
}

function setupAbout() {
  const root = document.getElementById("about-copy");
  const spacer = document.getElementById("about-spacer");
  const typed = document.getElementById("about-typed");
  const cake = document.getElementById("about-cake");
  if (!root || !spacer || !typed || !cake) return;

  const mobile = window.matchMedia("(max-width: 767px)");
  let locked = false;
  const aboutMarks = ["Сласти", "четыре года", "торты, бенто и капкейки", "больше 5 кг", "за один день"]
    .map((phrase) => {
      const start = copy.indexOf(phrase);
      return { start, end: start + phrase.length };
    })
    .filter((mark) => mark.start >= 0)
    .sort((a, b) => a.start - b.start);

  const write = (value) => {
    const ghost = typed.querySelector(".about-cake-space");
    const frag = document.createDocumentFragment();
    if (ghost) frag.append(ghost);
    let cursor = 0;
    aboutMarks.forEach((mark) => {
      if (mark.end > value.length || mark.start < cursor) return;
      if (cursor < mark.start) frag.append(document.createTextNode(value.slice(cursor, mark.start)));
      const accent = document.createElement("span");
      accent.className = "about-mark";
      accent.textContent = copy.slice(mark.start, mark.end);
      frag.append(accent);
      cursor = mark.end;
    });
    if (cursor < value.length) frag.append(document.createTextNode(value.slice(cursor)));
    typed.replaceChildren(frag);
  };

  const mount = () => {
    if (locked) return;
    if (!mobile.matches) {
      spacer.textContent = copy;
      typed.textContent = "";
      return;
    }
    const reserve = () => {
      const ghost = document.createElement("span");
      ghost.className = "about-cake-space";
      ghost.setAttribute("aria-hidden", "true");
      return ghost;
    };
    spacer.replaceChildren(reserve(), document.createTextNode(copy));
    typed.replaceChildren(reserve());
  };

  mount();
  mobile.addEventListener("change", mount);

  const play = () => {
    const duration = 6000;
    let start = 0;
    const step = (now) => {
      if (!start) start = now;
      const progress = Math.min(1, (now - start) / duration);
      write(copy.slice(0, Math.ceil(progress * copy.length)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const start = () => {
    locked = true;
    if (reducedMotion.matches) {
      cake.classList.add("is-in");
      write(copy);
      return;
    }
    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      play();
    };
    cake.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "transform") return;
      begin();
    });
    cake.classList.add("is-in");
    window.setTimeout(begin, 800);
  };

  const check = () => {
    const entered = window.innerHeight - root.getBoundingClientRect().top;
    if (entered < root.offsetHeight * 0.4) return;
    window.removeEventListener("scroll", check);
    start();
  };
  check();
  window.addEventListener("scroll", check, { passive: true });
}

function setupDrum() {
  const stage = document.getElementById("cake-stage");
  const ring = document.getElementById("cake-ring");
  if (!stage || !ring) return;

  const step = 120;
  let angle = 0;
  let dragging = false;
  let lastX = 0;
  let restAngle = 0;
  let restAt = performance.now();
  let gestureStart = 0;
  let snapTarget = null;
  let settleFrom = 0;
  let settleStart = 0;

  const ease = (progress) =>
    progress < 0.5 ? 2 * progress * progress : 1 - ((-2 * progress + 2) ** 2) / 2;

  const nearestFace = (value) => Math.round(value / step) * step;

  const draw = () => {
    ring.style.transform = `rotateY(${angle}deg)`;
  };

  const beginSettle = (target) => {
    settleFrom = angle;
    snapTarget = target;
    settleStart = performance.now();
  };

  const phone = window.matchMedia("(max-width: 1023px)");

  const tick = (now) => {
    if (!dragging && snapTarget !== null) {
      const settleMs = reducedMotion.matches ? 0 : 480;
      const progress = settleMs === 0 ? 1 : Math.min(1, (now - settleStart) / settleMs);
      angle = settleFrom + (snapTarget - settleFrom) * ease(progress);
      if (progress >= 1) {
        angle = snapTarget;
        restAngle = snapTarget;
        restAt = now;
        snapTarget = null;
      }
    } else if (!dragging && !reducedMotion.matches && !phone.matches) {
      const elapsed = now - restAt;
      const hold = 4200;
      const turn = 1700;
      if (elapsed <= hold) {
        angle = restAngle;
      } else {
        const progress = Math.min(1, (elapsed - hold) / turn);
        angle = restAngle - step * ease(progress);
        if (progress >= 1) {
          restAngle = angle;
          restAt = now;
        }
      }
    }
    draw();
    requestAnimationFrame(tick);
  };

  let pointer = null;

  stage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    pointer = { x: event.clientX, id: event.pointerId };
    gestureStart = angle;
    lastX = event.clientX;
  });

  stage.addEventListener("pointermove", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    if (!dragging) {
      if (Math.abs(dx) < 10) return;
      dragging = true;
      snapTarget = null;
      stage.setPointerCapture(event.pointerId);
    }
    const stepX = event.clientX - lastX;
    lastX = event.clientX;
    angle += stepX * 0.32;
    draw();
  });

  const endDrag = (event) => {
    if (pointer && event && pointer.id !== event.pointerId) return;
    pointer = null;
    if (!dragging) return;
    dragging = false;
    const moved = angle - gestureStart;
    const face = nearestFace(gestureStart);
    const direction = Math.sign(moved);
    beginSettle(Math.abs(moved) > 30 && direction !== 0 ? face + direction * step : face);
  };

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const base = snapTarget ?? nearestFace(angle);
      beginSettle(base + step);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const base = snapTarget ?? nearestFace(angle);
      beginSettle(base - step);
    }
  });

  draw();
  requestAnimationFrame(tick);
}

function setupWave() {
  const wave = document.querySelector(".wave");
  const ref = wave?.querySelector(".wave-ref");
  const letters = wave ? [...wave.querySelectorAll(".wave-letter")] : [];
  const text = ref?.firstChild;
  if (!wave || !ref || text?.nodeType !== Node.TEXT_NODE || letters.length !== text.textContent.length) {
    return;
  }

  const caretLeft = (offset) => {
    const range = document.createRange();
    range.setStart(text, offset);
    range.collapse(true);
    const rects = range.getClientRects();
    return (rects.length ? rects[0].left : range.getBoundingClientRect().left);
  };

  const place = () => {
    const base = ref.getBoundingClientRect().left;
    letters.forEach((letter, index) => {
      letter.style.left = `${caretLeft(index) - base}px`;
    });

    const top = ref.getBoundingClientRect().top - wave.getBoundingClientRect().top;
    letters.forEach((letter) => {
      letter.style.top = `${top}px`;
    });
    wave.classList.add("is-placed");
  };

  if (document.fonts?.ready) {
    document.fonts.ready.then(place);
  }
  place();
  new ResizeObserver(place).observe(wave);
}

function setupHistory() {
  const root = document.getElementById("history");
  const yearNode = document.getElementById("history-year");
  const phraseNode = document.getElementById("history-phrase");
  const photoNode = document.getElementById("history-photo");
  const progressNode = document.getElementById("history-progress");
  const heartsNode = document.getElementById("history-hearts");
  const labelsNode = document.getElementById("history-labels");
  if (!root || !yearNode || !phraseNode || !photoNode || !progressNode || !heartsNode || !labelsNode) return;

  const chapters = [
    {
      year: "2022",
      phrase: "Сласти появились в Москве. Первые торты собирались к семейным праздникам.",
      image: "../img/photo_2026-10-23_05-55-01.jpg",
      alt: "Розовый торт с белыми розами и зелёной лягушкой",
    },
    {
      year: "2023",
      phrase: "В 2023 году Сласти участвовали в фестивале танцев Loomine и продавали там свои торты. Люди пробовали, возвращались и приводили своих. Так клиентов становилось всё больше.",
      image: "../img/photo_2026-11-02_19-28-02.jpg",
      alt: "Кремовый бенто с синим динозавриком и надписью «Мишутке 7 месяцев»",
    },
    {
      year: "2024",
      phrase: "Появились сезонные новинки: торты и бенто к праздникам года.",
      image: "../img/photo_2026-11-02_19-26-16.jpg",
      alt: "Хэллоуинский набор: бенто-тыква, капкейк-привидение и капкейк-тыква",
    },
    {
      year: "2025",
      phrase: "Дело росло спокойно и уверенно, и в 2025 году Сласти провели первый мастер-класс. Гости сели вместе, своими руками собрали торт и провели этот вечер в хорошей компании.",
      image: "../img/photo_2026-11-02_19-27-34.jpg",
      alt: "Красный бенто, белый торт с сердцами и два розовых стаканчика",
    },
    {
      year: "2026",
      phrase: "В 2026 году Сласти работали с Surf Coffee и «Стариком Хинкалычем». Для их праздников собирали торты, в которых узнаётся характер места. Рядом по-прежнему оставались бенто и капкейки: для одного человека, для подруги или для каждой гостьи.",
      image: "../img/photo_2026-11-02_19-28-23.jpg",
      alt: "Шоколадный торт-проигрыватель с логотипами Surf Coffee и KISS",
    },
  ];

  const heartPath = "M12 19.6c-.5 0-7.4-4.4-7.4-9.3C4.6 7.4 6.6 5.5 9.1 5.5c1.4 0 2.5.7 3 1.7.5-1 1.6-1.7 3-1.7 2.5 0 4.5 1.9 4.5 4.8 0 4.9-6.9 9.3-7.6 9.3z";
  const last = chapters.length - 1;
  const segmentInset = 22;
  const fills = [];

  for (let itemIndex = 0; itemIndex < last; itemIndex += 1) {
    const segment = document.createElement("div");
    segment.className = "history-seg";
    segment.style.left = `calc(${(itemIndex / last) * 100}% + ${segmentInset}px)`;
    segment.style.width = `calc(${100 / last}% - ${segmentInset * 2}px)`;
    const fill = document.createElement("div");
    fill.className = "history-seg-fill";
    segment.append(fill);
    heartsNode.append(segment);
    fills.push(fill);
  }

  const paintSegments = (segment) => {
    fills.forEach((fill, itemIndex) => {
      const local = Math.min(1, Math.max(0, segment - itemIndex));
      fill.style.transition = "none";
      fill.style.width = `${local * 100}%`;
    });
  };
  let index = 0;
  let playing = false;
  let stopped = false;
  let timer = 0;

  chapters.forEach((chapter, itemIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-heart";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-label", chapter.year);
    button.style.left = `${(itemIndex / last) * 100}%`;
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${heartPath}" vector-effect="non-scaling-stroke"></path></svg>`;
    button.addEventListener("click", () => choose(itemIndex));
    heartsNode.append(button);

    const label = document.createElement("span");
    label.textContent = chapter.year;
    label.style.left = `${(itemIndex / last) * 100}%`;
    labelsNode.append(label);
  });

  const buttons = Array.from(heartsNode.querySelectorAll(".history-heart"));
  const labels = Array.from(labelsNode.querySelectorAll("span"));

  const show = (next) => {
    const chapter = chapters[next];
    yearNode.textContent = chapter.year;
    phraseNode.textContent = chapter.phrase;
    paintSegments(next);
    buttons.forEach((button, itemIndex) => {
      const on = itemIndex === next;
      button.classList.toggle("is-on", on);
      button.classList.toggle("is-fill", itemIndex <= next);
      button.setAttribute("aria-selected", on ? "true" : "false");
    });
    labels.forEach((label, itemIndex) => {
      label.classList.toggle("is-on", itemIndex === next);
    });
    if (chapter.image) {
      photoNode.src = chapter.image;
      photoNode.alt = chapter.alt;
      photoNode.hidden = false;
      requestAnimationFrame(() => photoNode.classList.add("is-in"));
    } else {
      photoNode.classList.remove("is-in");
      photoNode.hidden = true;
      photoNode.removeAttribute("src");
      photoNode.alt = "";
    }
  };

  const beginTravel = () => {
    window.clearTimeout(timer);
    if (!playing || reducedMotion.matches || index >= last) return;
    const fill = fills[index];
    fill.style.transition = "none";
    fill.style.width = "0%";
    void fill.offsetWidth;
    fill.style.transition = "width 5s linear";
    fill.style.width = "100%";
    timer = window.setTimeout(() => {
      index += 1;
      show(index);
      beginTravel();
    }, 5000);
  };

  const choose = (next) => {
    stopped = true;
    playing = false;
    window.clearTimeout(timer);
    index = next;
    show(index);
  };

  root.tabIndex = 0;
  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      choose(Math.min(index + 1, last));
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      choose(Math.max(index - 1, 0));
    }
  });

  show(0);

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting || stopped || reducedMotion.matches) return;
      playing = true;
      beginTravel();
      observer.disconnect();
    },
    { threshold: 0.6 },
  );
  observer.observe(root);
}

function setupReadyRail(root) {
  const rail = root.querySelector(".menu-rail");
  const track = rail && rail.querySelector(".menu-grid");
  if (!rail || !track) return;

  for (const item of [...track.children]) track.appendChild(item.cloneNode(true));

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let offset = 0;
  let dragging = false;
  let drag = null;
  let dragged = false;

  const apply = () => {
    const half = track.scrollWidth / 2;
    if (!half) return;
    offset = ((offset % half) + half) % half;
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
  };

  const tick = () => {
    if (!reduced && !dragging) offset += 0.7;
    apply();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  rail.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, offset };
    dragged = false;
    dragging = false;
  });
  rail.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (!dragging) {
      if (Math.abs(dx) < 8) return;
      dragging = true;
      rail.setPointerCapture(event.pointerId);
    }
    if (Math.abs(dx) > 4) dragged = true;
    offset = drag.offset - dx;
    apply();
  });
  const release = () => {
    drag = null;
    dragging = false;
  };
  rail.addEventListener("pointerup", release);
  rail.addEventListener("pointercancel", release);
  rail.addEventListener(
    "click",
    (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    },
    true,
  );
}

function setupMenu() {
  const root = document.getElementById("menu-order");
  if (!root) return;

  const kgMin = 1.5;
  const kgMax = 10;
  const countMin = 2;
  const state = {
    format: null,
    biscuit: null,
    filling: null,
    ready: null,
    kg: kgMin,
    count: countMin,
    minNote: false,
  };
  const checkout = root.querySelector(".menu-checkout");
  const sum = root.querySelector("[data-sum]");

  for (const button of root.querySelectorAll(".menu-rail [data-choice='ready']")) {
    const caption = button.querySelector("figcaption");
    button.dataset.value = caption ? caption.textContent.trim() : "";
  }

  const view = root.querySelector(".menu-all-view");
  const viewGrid = view && view.querySelector(".menu-all-grid");
  const source = root.querySelector(".menu-rail .menu-grid");
  if (viewGrid && source) {
    for (const item of [...source.children]) viewGrid.appendChild(item.cloneNode(true));
  }

  setupReadyRail(root);

  let opener = null;
  const openAll = () => {
    if (!view || view.open) return;
    opener = document.activeElement;
    view.showModal();
    document.documentElement.classList.add("menu-all-lock");
  };
  const closeAll = () => {
    if (!view || !view.open) return;
    view.close();
  };
  if (view) {
    view.addEventListener("close", () => {
      document.documentElement.classList.remove("menu-all-lock");
      if (opener && typeof opener.focus === "function") opener.focus();
      opener = null;
    });
    view.addEventListener("click", (event) => {
      if (event.target === view) closeAll();
    });
  }

  const kgText = (kg) => `${Number.isInteger(kg) ? kg : String(kg).replace(".", ",")} кг`;

  const price = () => {
    if (state.format === "cake") return state.kg * 2800;
    if (state.format === "bento") return 2490;
    if (state.format === "cup") return state.count * 550;
    return 0;
  };

  const paint = () => {
    for (const button of root.querySelectorAll("[data-choice]")) {
      const on = state[button.dataset.choice] === button.dataset.value;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    }
    const hearts = {
      ready: Boolean(state.ready),
      format: Boolean(state.format),
      biscuit: Boolean(state.biscuit),
      filling: Boolean(state.filling),
      weight: Boolean(state.format),
    };
    for (const heart of root.querySelectorAll("[data-heart]")) {
      heart.classList.toggle("is-on", hearts[heart.dataset.heart]);
    }
    for (const step of root.querySelectorAll("[data-lock]")) {
      const locked = Boolean(state.ready);
      step.classList.toggle("is-locked", locked);
      for (const button of step.querySelectorAll("button")) button.disabled = locked;
    }
    for (const node of root.querySelectorAll("[data-weight]")) {
      node.hidden = node.dataset.weight !== state.format;
    }
    const showMin = state.minNote && state.format === "cake" && state.kg <= kgMin;
    for (const note of root.querySelectorAll("[data-min-note]")) note.hidden = !showMin;
    for (const node of root.querySelectorAll("[data-kg-label]")) node.textContent = kgText(state.kg);
    for (const node of root.querySelectorAll("[data-count-label]")) node.textContent = `${state.count} шт.`;
    const show = Boolean(state.format && (state.ready || (state.biscuit && state.filling)));
    checkout.hidden = !show;
    if (show) sum.textContent = `${price()} р.`;
  };

  root.addEventListener("click", (event) => {
    if (event.target.closest(".menu-all-close")) {
      closeAll();
      return;
    }
    if (event.target.closest(".menu-all")) {
      openAll();
      return;
    }
    const choice = event.target.closest("[data-choice]");
    if (choice) {
      const key = choice.dataset.choice;
      if (key === "ready") {
        state.ready = choice.dataset.value;
        state.biscuit = null;
        state.filling = null;
        paint();
        if (choice.closest(".menu-all-view")) closeAll();
        return;
      } else if (key === "biscuit" || key === "filling") {
        if (state.ready) return;
        state[key] = choice.dataset.value;
      } else {
        state[key] = choice.dataset.value;
      }
      paint();
      return;
    }
    const kgButton = event.target.closest("[data-kg]");
    if (kgButton) {
      const delta = Number(kgButton.dataset.kg);
      if (delta < 0 && state.kg <= kgMin) {
        state.minNote = true;
      } else {
        const next = Math.round((state.kg + delta) * 10) / 10;
        state.kg = Math.min(kgMax, Math.max(kgMin, next));
        if (state.kg > kgMin) state.minNote = false;
      }
      paint();
      return;
    }
    const countButton = event.target.closest("[data-count]");
    if (countButton) {
      state.count = Math.max(countMin, state.count + Number(countButton.dataset.count));
      paint();
    }
  });

  paint();
}

function setupEvents() {
  const root = document.querySelector("#events");
  if (!root) return;
  const canvas = root.querySelector(".events-title canvas");
  const shots = Array.from(root.querySelectorAll(".events-shot"));
  const text = "Мероприятия";
  const fontSize = 150;
  const theta = (108 * 0.85 * Math.PI) / 180;
  const stroke = 22;
  const amp = 54;
  const pitch = 64;
  const gap = 46;
  let scene = null;
  let progress = reducedMotion.matches ? 1 : 0;
  let played = reducedMotion.matches;
  let builtWidth = 0;

  const tri = (dist) => {
    const phase = (((dist % pitch) + pitch) % pitch) / pitch;
    return phase < 0.5 ? phase * 2 : (1 - phase) * 2;
  };

  const pointAt = (radius, ang, cx, cy) => [cx + radius * Math.cos(ang), cy + radius * Math.sin(ang)];

  function measureWord(ctx) {
    ctx.font = fontSize + "px Soledago";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const glyphs = [];
    let total = 0;
    let inkAbove = 0;
    let inkBelow = 0;
    let maxW = 0;
    for (const ch of text) {
      const box = ctx.measureText(ch);
      const left = box.actualBoundingBoxLeft || 0;
      const right = box.actualBoundingBoxRight || box.width;
      const above = box.actualBoundingBoxAscent || fontSize * 0.7;
      const below = box.actualBoundingBoxDescent || 0;
      inkAbove = Math.max(inkAbove, above);
      inkBelow = Math.max(inkBelow, below);
      maxW = Math.max(maxW, left + right);
      const width = box.width * 0.98;
      glyphs.push({
        ch,
        width,
        pivot: (right - left) / 2,
      });
      total += width;
    }
    return { glyphs, total, inkAbove, inkBelow, maxW };
  }

  function crownPoints(model, cx, cy) {
    const { total, inkAbove, inkBelow, maxW } = model;
    const radius = total / theta;
    const start = -Math.PI / 2 - theta / 2;
    const outerBase = radius + inkAbove + gap + stroke / 2;
    const innerBase = radius - inkBelow - gap - stroke / 2;
    const endPad = (maxW / 2 + gap) / radius;
    const zigA0 = start - endPad;
    const zigSpan = theta + endPad * 2;
    const pts = [];
    const steps = Math.max(8, Math.round((outerBase * zigSpan) / 2));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const ang = zigA0 + zigSpan * t;
      pts.push(pointAt(outerBase + amp * tri(t * outerBase * zigSpan), ang, cx, cy));
    }
    const sideLen = outerBase - innerBase + amp;
    const sideSteps = Math.max(4, Math.round(sideLen / 2));
    for (let i = 1; i <= sideSteps; i += 1) {
      const t = i / sideSteps;
      const r = outerBase + amp - t * (outerBase - innerBase + amp);
      const ang = zigA0 + zigSpan + (amp * tri(t * sideLen)) / outerBase;
      pts.push(pointAt(r, ang, cx, cy));
    }
    const stepsIn = Math.max(8, Math.round((innerBase * zigSpan) / 2));
    for (let i = 1; i <= stepsIn; i += 1) {
      const t = i / stepsIn;
      const ang = zigA0 + zigSpan - zigSpan * t;
      pts.push(pointAt(innerBase - amp * tri(t * innerBase * zigSpan), ang, cx, cy));
    }
    for (let i = 1; i <= sideSteps; i += 1) {
      const t = i / sideSteps;
      const r = innerBase - amp + t * (outerBase - innerBase + amp);
      const ang = zigA0 - (amp * tri(t * sideLen)) / outerBase;
      pts.push(pointAt(r, ang, cx, cy));
    }
    const letters = [];
    let acc = 0;
    model.glyphs.forEach((glyph) => {
      const mid = start + (acc + glyph.width / 2) / radius;
      acc += glyph.width;
      letters.push({
        ch: glyph.ch,
        pivot: glyph.pivot,
        x: cx + radius * Math.cos(mid),
        y: cy + radius * Math.sin(mid),
        rot: mid + Math.PI / 2,
      });
    });
    return { pts, letters, zigA0, zigSpan, cx, cy };
  }

  function paint() {
    if (!scene) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (progress < 1) {
      ctx.beginPath();
      ctx.moveTo(scene.cx, scene.cy);
      ctx.arc(scene.cx, scene.cy, scene.clipR, scene.zigA0, scene.zigA0 + scene.zigSpan * progress);
      ctx.closePath();
      ctx.clip();
    }
    ctx.drawImage(scene.off, 0, 0);
    ctx.restore();
  }

  function build() {
    const cssW = Math.round(canvas.clientWidth);
    if (!cssW || cssW === builtWidth) return;
    builtWidth = cssW;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const probe = document.createElement("canvas").getContext("2d");
    const model = measureWord(probe);
    const draft = crownPoints(model, 0, 0);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const grow = (x, y) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    };
    draft.pts.forEach(([x, y]) => grow(x, y));
    draft.letters.forEach((letter) => {
      grow(letter.x - fontSize * 0.7, letter.y - fontSize * 0.7);
      grow(letter.x + fontSize * 0.7, letter.y + fontSize * 0.7);
    });
    const pad = stroke + 28;
    const bw = maxX - minX + pad * 2;
    const bh = maxY - minY + pad * 2;
    const scale = (cssW * dpr) / bw;
    const mapX = (x) => (x - minX + pad) * scale;
    const mapY = (y) => (y - minY + pad) * scale;
    canvas.width = Math.max(1, Math.round(bw * scale));
    canvas.height = Math.max(1, Math.round(bh * scale));
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    const ctx = off.getContext("2d");
    const k = scale;
    const radius = (stroke * k) / 2;
    ctx.fillStyle = "#c8888f";
    const stamp = (x, y, r) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    draft.pts.forEach(([x, y], index) => {
      const next = draft.pts[(index + 1) % draft.pts.length];
      const x0 = mapX(x);
      const y0 = mapY(y);
      const x1 = mapX(next[0]);
      const y1 = mapY(next[1]);
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.max(1, Math.round(dist / 1.6));
      for (let s = 0; s <= n; s += 1) {
        const u = s / n;
        stamp(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, radius);
      }
    });
    ctx.globalAlpha = 0.55;
    draft.pts.forEach(([x, y], index) => {
      const n = Math.abs(Math.sin(index * 12.9898) * 43758.5453) % 1;
      if (n < 0.78) return;
      const ang = index * 0.91;
      stamp(
        mapX(x) + Math.cos(ang) * radius * 1.02,
        mapY(y) + Math.sin(ang) * radius * 1.02,
        radius * 0.16
      );
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#c8888f";
    ctx.font = fontSize * k + "px Soledago";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    draft.letters.forEach((letter) => {
      ctx.save();
      ctx.translate(mapX(letter.x), mapY(letter.y));
      ctx.rotate(letter.rot);
      ctx.fillText(letter.ch, -letter.pivot * k, 0);
      ctx.restore();
    });
    const cx = mapX(0);
    const cy = mapY(0);
    scene = {
      off,
      cx,
      cy,
      zigA0: draft.zigA0,
      zigSpan: draft.zigSpan,
      clipR: Math.hypot(canvas.width, canvas.height) + Math.abs(cx) + Math.abs(cy),
    };
    paint();
  }

  function play() {
    if (played) return;
    played = true;
    const started = performance.now();
    const duration = 1700;
    const frame = (now) => {
      const t = Math.min(1, (now - started) / duration);
      progress = 1 - (1 - t) ** 3;
      paint();
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  const arm = () => {
    build();
    if (reducedMotion.matches) {
      shots.forEach((shot) => shot.classList.add("is-in"));
      return;
    }
    const titleWatch = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          titleWatch.disconnect();
          play();
        }
      },
      { threshold: 0.35 }
    );
    titleWatch.observe(root.querySelector(".events-band"));
    const photoWatch = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          photoWatch.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );
    shots.forEach((shot) => photoWatch.observe(shot));
  };

  if (document.fonts && document.fonts.load) {
    document.fonts.load(fontSize + "px Soledago").then(arm).catch(arm);
  } else {
    arm();
  }

  const watch = new ResizeObserver(() => build());
  watch.observe(canvas.parentElement);
}

function setupReviews() {
  const stack = document.getElementById("review-stack");
  if (!stack) return;
  const list = stack.querySelector(".review-list");
  const cards = [...list.children];
  const prev = stack.querySelector('[data-review="-1"]');
  const next = stack.querySelector('[data-review="1"]');
  const wide = window.matchMedia("(min-width: 1024px)");
  let active = 0;
  let start = null;

  const paint = () => {
    cards.forEach((card, index) => {
      const offset = index - active;
      const scale = Math.min(Math.max(1 - offset * 0.08, 0.08), 1);
      const y = Math.max(offset * -30, -90);
      const gone = offset < 0;
      card.style.transform = `translate(-50%, ${y}px) scale(${scale})`;
      card.style.opacity = gone ? "0" : "1";
      card.style.filter = gone ? "blur(2px)" : "none";
      card.style.zIndex = String(cards.length - index);
      card.style.pointerEvents = index === active ? "auto" : "none";
      card.setAttribute("aria-hidden", index === active ? "false" : "true");
    });
    prev.disabled = active <= 0;
    next.disabled = active >= cards.length - 1;
  };

  const fit = () => {
    let max = 0;
    for (const card of cards) max = Math.max(max, card.offsetHeight);
    list.style.height = `${max + 110}px`;
  };

  const go = (dir) => {
    const nextIndex = Math.min(cards.length - 1, Math.max(0, active + dir));
    if (nextIndex === active) return;
    active = nextIndex;
    paint();
  };

  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));

  list.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && wide.matches) return;
    start = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });
  const end = (event) => {
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
  };
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);

  paint();
  fit();
  window.addEventListener("resize", fit);
}

function setupFormats() {
  const node = document.getElementById("formats");
  if (!node) return;
  if (reducedMotion.matches) {
    node.classList.add("is-in");
    return;
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      node.classList.add("is-in");
      observer.disconnect();
    },
    { threshold: 0.08 },
  );
  observer.observe(node);
}

setupNav();
setupAbout();
setupFormats();
setupDrum();
setupWave();
setupHistory();
setupMenu();
setupEvents();
setupReviews();
