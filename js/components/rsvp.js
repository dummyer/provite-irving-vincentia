window.FhRsvp = (function () {
  const api = window.TwinkleAPI;
  const GENERAL_SESSION_ID = "GENERAL_ACCESS";

  const $ = (sel, root = document) => root.querySelector(sel);

  const s = {
    data: null,
    paramUrl: "",
    eventId: "",
    pin: "",
    attendStatus: 0,
    selectedSessions: [],
    questionData: [],
    answers: {},
    guestData: {},
    isPublicInvitation: false,
    invitationUrl: "#",
    publicQuota: 0,
    generalQuestions: [],
    group: null,
    groupUrl: "",
    titleResponseRSVP: "Success",
    failedSubmitMessage: "Failed to submit RSVP",
    failedEnSubmitMessage: "Failed to submit RSVP",
    iti: null,
    // Khusus SmartRsvpFormBased
    selectedGuestCounts: {},
    isSubmit: false,
    isConfirmed: false,
  };
  let openDropdownId = null;

  // ════════════════════════════ helpers DOM ════════════════════════════
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const PERSON_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="shrink-0 text-[#000000]"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"></circle><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>';
  const CHEVRON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="shrink-0 text-[#000000] transition-transform duration-200"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  const CHECK_SVG = '<svg viewBox="0 0 512 512" fill="rgba(107,107,107,0.85)"><path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg>';

  function chairIcon() {
    const img = el("img", "w-[16px] h-[16px] object-contain shrink-0");
    img.src = "assets/icons/ic-chair.webp";
    img.alt = "Chair";
    img.width = 16;
    img.height = 16;
    return img;
  }

  // NextUI <Checkbox color="danger">
  function checkbox(text, checked, onChange) {
    const wrap = el("label", "fh-check");
    const input = el("input", "sr-only");
    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", (e) => onChange(e.target.checked));
    const box = el("span", "fh-check-box");
    box.innerHTML = CHECK_SVG;
    wrap.append(input, box, el("span", "rsvp_question_value text-[14px]", text));
    return wrap;
  }

  function range(n) {
    return Array.from({ length: Math.max(0, n || 0) }, (_, i) => i + 1);
  }


  // Lock background scroll selama popup RSVP terbuka
  let lockCount = 0;
  let originalScrollStyles = null;

  function lockScroll(lock) {
    const html = document.documentElement;
    const body = document.body;

    if (lock) {
      if (lockCount++ > 0) return;

      // Simpan style asli agar tidak merusak style halaman
      originalScrollStyles = {
        htmlOverflow: html.style.overflow,
        bodyOverflow: body.style.overflow,
        htmlOverscroll: html.style.overscrollBehavior,
        bodyOverscroll: body.style.overscrollBehavior,
      };

      // Lock scroll tanpa position: fixed
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      html.style.overscrollBehavior = "none";
      body.style.overscrollBehavior = "none";

    } else {
      if (lockCount === 0 || --lockCount > 0) return;

      // Restore style asli
      if (originalScrollStyles) {
        html.style.overflow = originalScrollStyles.htmlOverflow;
        body.style.overflow = originalScrollStyles.bodyOverflow;
        html.style.overscrollBehavior = originalScrollStyles.htmlOverscroll;
        body.style.overscrollBehavior = originalScrollStyles.bodyOverscroll;
      }

      originalScrollStyles = null;

      // Tidak perlu window.scrollTo()
      // Posisi scroll tidak pernah dipindahkan.
    }
  }


  // ════════════════════════════ state handlers (verbatim dari controller) ════════════════════════════
  const isChoiceSelected = (sessionId, questionId, choice, type) => {
    const current = s.answers[sessionId]?.[questionId];
    if (!current) return false;
    switch (type) {
      case 1: return current === choice;
      case 4: return current.split(",").some((a) => a.startsWith(`${choice}:;`));
      case 5: return current.startsWith(`${choice}:;`);
      default: return false;
    }
  };

  function clearConfirmedState() {
    s.isConfirmed = false;
    renderSubmitLabel();
  }

  const handleSessionSelect = (sessionId, checked, userChanged = true) => {
    const wasSelected = s.selectedSessions.includes(sessionId);
    if (userChanged && wasSelected !== checked) clearConfirmedState();
    s.selectedSessions = checked ? [...s.selectedSessions, sessionId] : s.selectedSessions.filter((id) => id !== sessionId);
  };

  const handleGuestCount = (sessionId, value, userChanged = true) => {
    if (userChanged && s.answers[sessionId]?.guestInvitation !== value) clearConfirmedState();
    const newAnswers = { ...s.answers, [sessionId]: { ...s.answers[sessionId], guestInvitation: value } };
    Object.keys(newAnswers[sessionId]).forEach((qId) => {
      if (Array.isArray(newAnswers[sessionId][qId])) {
        newAnswers[sessionId][qId] = Array.from({ length: value }, (_, i) => newAnswers[sessionId][qId][i] || { id: `${qId}-${i + 1}`, name: "", options: [] });
      }
    });
    Object.keys(newAnswers[sessionId]).forEach((key) => {
      const match = key.match(/-guest-(\d+)$/);
      if (match && parseInt(match[1]) >= value) delete newAnswers[sessionId][key];
    });
    s.answers = newAnswers;
  };

  // value untuk tipe 6/7/8 sudah diformat oleh input-nya (DD MMM YYYY, DD/MM/YYYY HH:mm, h:mm A)
  const handleAnswerChange = (sessionId, questionId, value, type) => {
    const formattedValue = type === 0 ? value.join(",") : value;
    if (s.answers[sessionId]?.[questionId] !== formattedValue) clearConfirmedState();
    s.answers = { ...s.answers, [sessionId]: { ...s.answers[sessionId], [questionId]: formattedValue } };
  };

  const handleCheckboxRadioSelect = (sessionId, questionId, choice, qty, isChecked, type) => {
    const current = s.answers[sessionId]?.[questionId]?.split(",") || [];
    const choiceValue = `${choice}:;${qty}`;
    let updated;
    if (type === 4) {
      updated = isChecked ? [...current, choiceValue] : current.filter((a) => !a.startsWith(`${choice}:;`));
    } else {
      updated = [choiceValue];
    }
    const nextValue = updated.join(",");
    if (s.answers[sessionId]?.[questionId] !== nextValue) clearConfirmedState();
    s.answers = { ...s.answers, [sessionId]: { ...s.answers[sessionId], [questionId]: nextValue } };
  };

  const handleGuestAttendanceChange = (sessionId, questionId, guestIndex, field, value) => {
    const newGuests = [...(s.answers[sessionId][questionId] || [])];
    if (!newGuests[guestIndex]) {
      newGuests[guestIndex] = { id: `${questionId}-${guestIndex + 1}`, name: "", options: [], optionId: "" };
    }
    const previousValue = newGuests[guestIndex][field];
    if (JSON.stringify(previousValue) !== JSON.stringify(value)) clearConfirmedState();
    newGuests[guestIndex] = { ...newGuests[guestIndex], [field]: value };
    s.answers = { ...s.answers, [sessionId]: { ...s.answers[sessionId], [questionId]: newGuests } };
  };

  const clearChildAnswers = (ans, sessionId, guestIndex) => {
    const keysToDelete = [];
    const collect = (a) => {
      if (!a.child?.length) return;
      a.child.forEach((childQ) => {
        keysToDelete.push(guestIndex !== undefined ? `${childQ.id}-guest-${guestIndex}` : childQ.id);
        collect(childQ);
      });
    };
    collect(ans);
    if (!keysToDelete.length) return;
    const newSession = { ...s.answers[sessionId] };
    keysToDelete.forEach((k) => delete newSession[k]);
    s.answers = { ...s.answers, [sessionId]: newSession };
  };


  // ════════════════════════════ dropdown kustom (CustomSelectDropdown / CustomGuestDropdown) ════════════════════════════
  // Menu dropdown menutup bila klik di luar (mousedown), seperti useEffect handleClickOutside.
  // Hanya satu listener aktif; dilepas setiap accordion dirender ulang. Listener yang tertinggal
  // akan merender ulang accordion saat mousedown, sehingga klik pada input/tombol RSVP tidak pernah sampai.
  let outsideHandler = null;
  function setOutsideHandler(fn) {
    if (outsideHandler) document.removeEventListener("mousedown", outsideHandler);
    outsideHandler = fn;
    if (fn) setTimeout(() => { if (outsideHandler === fn) document.addEventListener("mousedown", fn); }, 0);
  }

  function dropdownMenu(wrapper, items, close) {
    const menu = el("div", "rsvp-dropdown-menu absolute top-full left-0 mt-[6px] w-full bg-white rounded-[8px] shadow-2xl border border-[#E5E5E5] z-50 max-h-[220px] overflow-y-auto");
    items.forEach((it) => {
      const b = el("button", `w-full text-left px-[14px] py-[8px] rsvp_question_value transition-colors ${it.active ? "bg-[#F2F2F2]" : "hover:bg-[#F7F7F7]"}`, it.label);
      b.type = "button";
      b.addEventListener("click", () => it.onClick());
      menu.appendChild(b);
    });
    const outside = (e) => { if (!wrapper.contains(e.target)) close(); };
    setOutsideHandler(outside);
    menu._cleanup = () => { if (outsideHandler === outside) setOutsideHandler(null); };
    return menu;
  }

  function customSelect({ label, options, value, placeholder = "-- Select --", icon = true, onSelect }) {
    const root = el("div", "flex flex-col gap-[4px] text-left w-full");
    if (label) root.appendChild(el("span", "rsvp_question_label", label));
    const line = el("div", "flex items-center gap-[10px] border-b border-[#D0D0D0] pb-[8px]");
    if (icon) line.appendChild(chairIcon());
    const wrapper = el("div", "relative flex-1 z-auto");
    const btn = el("button", "w-full flex items-center justify-between bg-transparent outline-none rsvp_question_value text-[14px] md:text-[18px] text-left pl-[6px] cursor-pointer");
    btn.type = "button";
    const text = el("span", value ? "" : "text-[#B0B0B0]", value || placeholder);
    btn.appendChild(text);
    btn.insertAdjacentHTML("beforeend", CHEVRON);
    wrapper.appendChild(btn);

    let menu = null;
    const close = () => {
      if (!menu) return;
      menu._cleanup();
      menu.remove();
      menu = null;
      wrapper.classList.replace("z-50", "z-auto");
      btn.lastElementChild.classList.remove("rotate-180");
    };
    btn.addEventListener("click", () => {
      if (menu) return close();
      const items = [{ label: placeholder, active: !value, onClick: () => { close(); clearConfirmedState(); onSelect("", ""); } }]
        .concat(options.map((opt) => ({
          label: opt.choice,
          active: opt.choice === value,
          onClick: () => { close(); clearConfirmedState(); onSelect(opt.choice, opt.id); },
        })));
      menu = dropdownMenu(wrapper, items, close);
      wrapper.appendChild(menu);
      wrapper.classList.replace("z-auto", "z-50");
      btn.lastElementChild.classList.add("rotate-180");
    });
    line.appendChild(wrapper);
    root.appendChild(line);
    return root;
  }

  // Jumlah tamu: "-" (0) sampai kuota; hanya satu dropdown terbuka (openDropdownId)
  function guestDropdown({ sessionId, value, maxGuests, onSelect }) {
    const root = el("label", "flex flex-col gap-[4px] text-left");
    root.appendChild(el("span", "rsvp_question_label", "Number of Guest"));
    const line = el("div", "flex items-center gap-[10px] border-b border-[#D0D0D0] pb-[8px]");
    line.insertAdjacentHTML("beforeend", PERSON_ICON);
    const isOpen = openDropdownId === sessionId;
    const wrapper = el("div", `relative flex-1 ${isOpen ? "z-50" : "z-auto"}`);
    const btn = el("button", "w-full flex items-center justify-between bg-transparent outline-none rsvp_question_value text-[14px] md:text-[18px] text-left pl-[6px]");
    btn.type = "button";
    btn.appendChild(el("span", "", value && value > 0 ? String(value) : "-"));
    btn.insertAdjacentHTML("beforeend", CHEVRON);
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openDropdownId = openDropdownId === sessionId ? null : sessionId;
      rerender();
    });
    wrapper.appendChild(btn);
    if (isOpen) {
      const close = () => { openDropdownId = null; rerender(); };
      const choose = (count) => { clearConfirmedState(); onSelect(count); };
      const items = [{ label: "-", active: !value || value === 0, onClick: () => choose(0) }]
        .concat(range(Math.max(1, maxGuests)).map((n) => ({ label: String(n), active: n === value, onClick: () => choose(n) })));
      wrapper.appendChild(dropdownMenu(wrapper, items, close));
    }
    line.appendChild(wrapper);
    root.append(line, el("span", "rsvp_question_hint text-[10px] text-[#888]", "Number of Guest Attending"));
    return root;
  }

  // ════════════════════════════ renderQuestionItem (SmartRsvpFormBased) ════════════════════════════
  // Perubahan struktur me-render ulang accordion; input teks hanya mengubah state supaya fokus tidak hilang.
  function renderQuestion(q, sessionId, guestIndex) {
    const scopedId = guestIndex !== undefined ? `${q.id}-guest-${guestIndex}` : q.id;
    const answer = s.answers[sessionId]?.[scopedId];
    const childBlock = (cls, children, gi) => {
      const wrap = el("div", cls);
      children.forEach((childQ) => wrap.appendChild(renderQuestion(childQ, sessionId, gi)));
      return wrap;
    };

    if (q.questionType === 0) {
      const wrap = el("div", "flex flex-col gap-[6px] text-left mb-[16px] col-span-1 sm:col-span-2");
      wrap.appendChild(el("span", "rsvp_question_label", q.questionTitle));
      const group = el("div", "mt-1 flex flex-col gap-2");
      const selected = answer?.split(",") || [];
      q.listAnswerChoices.forEach((ans) => {
        group.appendChild(checkbox(ans.choice, selected.includes(ans.choice), (checked) => {
          const current = (s.answers[sessionId]?.[scopedId]?.split(",") || []).filter(Boolean);
          handleAnswerChange(sessionId, scopedId, checked ? [...current, ans.choice] : current.filter((c) => c !== ans.choice), 0);
          rerender();
        }));
      });
      wrap.appendChild(group);
      return wrap;
    }

    if (q.questionType === 1) {
      const wrap = el("div", "flex flex-col gap-[4px] text-left mb-[16px] col-span-1 sm:col-span-2");
      wrap.appendChild(customSelect({
        label: q.questionTitle,
        options: q.listAnswerChoices,
        value: answer || "",
        onSelect: (val) => { handleAnswerChange(sessionId, scopedId, val, 1); rerender(); },
      }));
      q.listAnswerChoices.forEach((ans) => {
        if (!isChoiceSelected(sessionId, scopedId, ans.choice, 1) || !ans.child?.length) return;
        wrap.appendChild(childBlock("mt-[16px] pl-3 border-l-2 border-[#D0D0D0]", ans.child, guestIndex));
      });
      return wrap;
    }

    if (q.questionType === 2) {
      const wrap = el("label", "flex flex-col gap-[4px] text-left mb-[16px] col-span-1 sm:col-span-2");
      wrap.appendChild(el("span", "rsvp_question_label", q.questionTitle));
      const line = el("div", "border-b border-[#D0D0D0] pb-[6px]");
      const ta = el("textarea", "w-full bg-transparent outline-none rsvp_question_value placeholder:text-[#B0B0B0] resize-none");
      ta.rows = 3;
      ta.placeholder = q.questionTitle;
      ta.value = answer || "";
      ta.addEventListener("input", (e) => handleAnswerChange(sessionId, scopedId, e.target.value, 2));
      line.appendChild(ta);
      wrap.appendChild(line);
      return wrap;
    }

    if (q.questionType === 4) {
      const wrap = el("div", "flex flex-col gap-[6px] text-left mb-[16px] col-span-1 sm:col-span-2");
      wrap.appendChild(el("span", "rsvp_question_label", q.questionTitle));
      q.listAnswerChoices.forEach((ans) => {
        const [choice, maxQty] = ans.choice.split("*|*");
        const currentQty = (s.answers[sessionId]?.[scopedId]?.split(",") || []).find((a) => a.startsWith(`${choice}:;`))?.split(":;")[1] || "1";
        const selected = isChoiceSelected(sessionId, scopedId, choice, 4);
        const item = el("div", "mb-2");
        const row = el("div", "flex gap-2 items-center");
        row.appendChild(checkbox(choice, selected, (checked) => {
          handleCheckboxRadioSelect(sessionId, scopedId, choice, parseInt(currentQty), checked, 4);
          rerender();
        }));
        const sel = el("select", "border-b border-[#D0D0D0] bg-transparent outline-none rsvp_question_value px-2 py-1");
        range(parseInt(maxQty)).forEach((n) => { const o = el("option", "", String(n)); o.value = n; sel.appendChild(o); });
        sel.value = currentQty;
        sel.addEventListener("change", (e) => { handleCheckboxRadioSelect(sessionId, scopedId, choice, parseInt(e.target.value), true, 4); rerender(); });
        row.appendChild(sel);
        item.appendChild(row);
        if (ans.child?.length > 0 && selected) item.appendChild(childBlock("mt-2 pl-3 border-l-2 border-[#D0D0D0]", ans.child, guestIndex));
        wrap.appendChild(item);
      });
      return wrap;
    }

    if (q.questionType === 5) {
      const selectedChoice = answer?.split(":;")[0] || "";
      const selectedQty = answer?.split(":;")[1] || "1";
      const wrap = el("div", "flex flex-col gap-[4px] text-left mb-[16px] col-span-1 sm:col-span-2");
      const row = el("div", "flex gap-2 items-center");
      const left = el("div", "flex-1");
      left.appendChild(customSelect({
        label: q.questionTitle,
        options: q.listAnswerChoices.map((a) => ({ id: a.id, choice: a.choice.split("*|*")[0] })),
        value: selectedChoice,
        onSelect: (val) => { handleCheckboxRadioSelect(sessionId, scopedId, val, 1, true, 5); rerender(); },
      }));
      row.appendChild(left);
      q.listAnswerChoices.forEach((ans) => {
        const [choice, maxQty] = ans.choice.split("*|*");
        if (!isChoiceSelected(sessionId, scopedId, choice, 5)) return;
        const sel = el("select", "bg-transparent outline-none rsvp_question_value border-b border-[#D0D0D0] px-2 self-end pb-[8px] cursor-pointer");
        range(parseInt(maxQty)).forEach((n) => { const o = el("option", "", String(n)); o.value = n; sel.appendChild(o); });
        sel.value = selectedQty;
        sel.addEventListener("change", (e) => { handleCheckboxRadioSelect(sessionId, scopedId, choice, parseInt(e.target.value), true, 5); rerender(); });
        row.appendChild(sel);
      });
      wrap.appendChild(row);
      q.listAnswerChoices.forEach((ans) => {
        const [choice] = ans.choice.split("*|*");
        if (!isChoiceSelected(sessionId, scopedId, choice, 5) || !ans.child?.length) return;
        wrap.appendChild(childBlock("mt-2 pl-3 border-l-2 border-[#D0D0D0]", ans.child, guestIndex));
      });
      return wrap;
    }

    // Tipe 6/7/8 (DatePicker / TimeInput underlined) -> input native bergaris bawah
    if (q.questionType === 6 || q.questionType === 7 || q.questionType === 8) {
      const cfg = {
        6: { type: "date", store: "DD MMM YYYY", input: "YYYY-MM-DD" },
        7: { type: "datetime-local", store: "DD/MM/YYYY HH:mm", input: "YYYY-MM-DDTHH:mm" },
        8: { type: "time", store: "h:mm A", input: "HH:mm" },
      }[q.questionType];
      const wrap = el("div", "flex flex-col gap-[4px] text-left mb-[16px] col-span-1 sm:col-span-2");
      wrap.appendChild(el("span", "rsvp_question_label", q.questionTitle));
      const input = el("input", "w-full bg-transparent outline-none border-b border-[#D0D0D0] pb-[6px] rsvp_question_value");
      input.type = cfg.type;
      input.value = answer ? moment(answer, cfg.store).format(cfg.input) : moment().format(cfg.input);
      input.addEventListener("change", (e) => {
        const v = e.target.value;
        handleAnswerChange(sessionId, scopedId, v ? moment(v, cfg.input).format(cfg.store) : "", q.questionType);
      });
      wrap.appendChild(input);
      return wrap;
    }

    // Tipe 9: per tamu (nama + satu pilihan), anak per tamu
    if (q.questionType === 9) {
      const frag = el("div", "col-span-1 sm:col-span-2 flex flex-col");
      const guestCount = s.answers[sessionId]?.guestInvitation || 1;
      for (let i = 0; i < guestCount; i++) {
        const guest = s.answers[sessionId]?.[q.id]?.[i];
        const wrap = el("div", "col-span-1 sm:col-span-2 flex flex-col gap-[4px] text-left mb-[16px]");
        if (guestCount > 1) wrap.appendChild(el("span", "rsvp_question_label", `Guest ${i + 1}`));
        if (q.isCollectName) {
          const line = el("div", "flex items-center gap-[10px] border-b border-[#D0D0D0] pb-[8px]");
          line.insertAdjacentHTML("beforeend", PERSON_ICON);
          const input = el("input", "w-full bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 p-0 pl-[6px] rsvp_question_value text-[14px] md:text-[18px] placeholder:text-[#B0B0B0] text-left");
          input.type = "text";
          input.placeholder = "Enter Your Full Name";
          input.value = guest?.name || "";
          input.addEventListener("input", (e) => handleGuestAttendanceChange(sessionId, q.id, i, "name", e.target.value));
          line.appendChild(input);
          wrap.appendChild(line);
        }
        if (q.listAnswerChoices?.length > 0) {
          const box = el("div", "mt-[12px]");
          const current = guest?.options?.[0] || "";
          box.appendChild(customSelect({
            options: q.listAnswerChoices,
            value: current,
            onSelect: (val, optionId) => {
              const selectedChoice = q.listAnswerChoices.find((a) => a.choice === val);
              handleGuestAttendanceChange(sessionId, q.id, i, "options", val ? [val] : []);
              handleGuestAttendanceChange(sessionId, q.id, i, "optionId", selectedChoice?.id || optionId || "");
              rerender();
            },
          }));
          q.listAnswerChoices.forEach((ans) => {
            if (current !== ans.choice || !ans.child?.length) return;
            box.appendChild(childBlock("mt-2 pl-3 border-l-2 border-[#D0D0D0]", ans.child, i));
          });
          wrap.appendChild(box);
        }
        frag.appendChild(wrap);
      }
      return frag;
    }

    return el("div");
  }

  // ════════════════════════════ accordion sesi (AccordionSection) ════════════════════════════
  function currentGuestCount(session) {
    const sid = session.eventSessionId;
    const hasSavedResponse = Boolean(session.rsvp && session.rsvp > 0 && session.rsvpStatus === 1);
    return s.selectedGuestCounts[sid] !== undefined
      ? s.selectedGuestCounts[sid]
      : hasSavedResponse ? (s.answers[sid]?.guestInvitation ?? 0) : 0;
  }

  function sessionContent(session) {
    const sid = session.eventSessionId;
    const frag = document.createDocumentFragment();
    frag.appendChild(guestDropdown({
      sessionId: sid,
      value: currentGuestCount(session),
      maxGuests: s.pin === "" ? (s.publicQuota || 1) : (session.quota || 1),
      onSelect: (count) => {
        s.selectedGuestCounts = { ...s.selectedGuestCounts, [sid]: count };
        handleGuestCount(sid, count);
        openDropdownId = null;
        rerender();
      },
    }));
    if (session.questionList && session.questionList.length > 0) {
      const list = el("div", "flex flex-col gap-4 mt-[10px]");
      session.questionList.slice().sort((a, b) => a.index - b.index).forEach((q) => list.appendChild(renderQuestion(q, sid)));
      frag.appendChild(list);
    }
    return frag;
  }

  function renderAccordion() {
    const root = $("#rsvpAccordion");

    // Semua dropdown lama ikut terhapus, jadi listener klik-luar-nya juga dilepas
    setOutsideHandler(null);

    root.innerHTML = "";
    root.classList.remove("mb-[16px]");

    if (s.attendStatus !== 1) return;

    const hasData =
      s.questionData.length > 0 ||
      s.generalQuestions.length > 0;

    // Tambahkan margin bawah parent jika ada data
    if (hasData) {
      root.classList.add("mb-[16px]");
    }

    const isSingleSession = s.questionData.length === 1;
    const list = el("div", "flex flex-col gap-[16px] w-full");

    s.questionData.forEach((session) => {
      const sid = session.eventSessionId;
      const isChecked = s.selectedSessions.includes(sid);
      const layer = openDropdownId === sid ? "relative z-40" : "relative z-10";

      if (isSingleSession) {
        const card = el(
          "div",
          `rounded-[10px] bg-white overflow-visible shadow-sm border border-[#E5E5E5] p-[20px] md:p-[24px] flex flex-col gap-[16px] text-left transition-shadow ${layer}`
        );

        card.appendChild(sessionContent(session));
        list.appendChild(card);
        return;
      }

      const card = el(
        "div",
        `rounded-[10px] bg-white overflow-visible transition-shadow border border-[#E5E5E5] ${isChecked ? "shadow-md" : "shadow-sm"
        } ${layer}`
      );

      const head = el(
        "button",
        "w-full flex items-center justify-between px-[20px] md:px-[24px] py-[16px] md:py-[18px] text-left"
      );

      head.type = "button";

      head.appendChild(
        el(
          "span",
          "rsvp_question_title font-medium text-[14px] md:text-[18px] text-[#111111]",
          session.name
        )
      );

      const box = el(
        "span",
        `shrink-0 w-[22px] h-[22px] rounded-[5px] border-2 flex items-center justify-center transition-colors ${isChecked
          ? "border-[#4F0806] bg-[#4F0806]"
          : "border-[#B0B0B0] bg-transparent"
        }`
      );

      if (isChecked) {
        box.innerHTML =
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
      }

      head.appendChild(box);

      head.addEventListener("click", () => {
        handleSessionSelect(sid, !isChecked);
        rerender();

        // Animasi buka (motion height 0 -> auto) hanya saat baru dicentang
        if (!isChecked) {
          const c = root.querySelector(
            `[data-collapse="${CSS.escape(sid)}"]`
          );

          if (c) {
            c.classList.remove("is-open");
            void c.offsetWidth;
            c.classList.add("is-open");
          }
        }
      });

      card.appendChild(head);

      const collapse = el(
        "div",
        `session-collapse ${isChecked ? "is-open" : ""}`
      );

      collapse.dataset.collapse = sid;

      const inner = el("div");

      if (isChecked) {
        const content = el(
          "div",
          "px-[20px] md:px-[24px] pb-[20px] md:pb-[24px] flex flex-col gap-[16px] text-left border-t border-[#F0F0F0] pt-[16px]"
        );

        content.appendChild(sessionContent(session));
        inner.appendChild(content);
      }

      collapse.appendChild(inner);
      card.appendChild(collapse);

      list.appendChild(card);
    });

    root.appendChild(list);

    if (s.generalQuestions.length > 0) {
      const g = el("div", "font-normal text-[12px] mt-[16px]");

      const card = el(
        "div",
        "flex flex-col gap-4 w-full shadow-sm rounded-[10px] bg-white border border-[#E5E5E5] p-[20px] md:p-[24px]"
      );

      const inner = el("div", "flex flex-col gap-4");

      s.generalQuestions
        .slice()
        .sort((a, b) => a.index - b.index)
        .forEach((q) => {
          inner.appendChild(renderQuestion(q, GENERAL_SESSION_ID));
        });

      card.appendChild(inner);
      g.appendChild(card);
      root.appendChild(g);
    }
  }

  function rerender() {
    renderAccordion();
  }

  // ════════════════════════════ status & teks (Reservation.tsx) ════════════════════════════
  function setToggle(btn, active) {
    btn.classList.toggle("bg-white", active);
    btn.classList.toggle("text-[#0C0335]", active);
    btn.classList.toggle("bg-transparent", !active);
    btn.classList.toggle("text-white", !active);
  }

  function renderStatus() {
    const selected = s.attendStatus === 1 ? "hadir" : s.attendStatus === 2 ? "tidak" : null;
    setToggle($("#btnAttend"), s.attendStatus === 1);
    setToggle($("#btnNotAttend"), s.attendStatus === 2);

    const toggles = $("#rsvpToggles");
    toggles.classList.toggle("mb-[24px]", selected === "hadir");
    toggles.classList.toggle("md:mb-[30px]", selected === "hadir");
    toggles.classList.toggle("mb-[80px]", selected !== "hadir");
    toggles.classList.toggle("md:mb-[90px]", selected !== "hadir");

    $("#rsvpAttendBlock").classList.toggle("hidden", selected !== "hadir");
    $("#rsvpSessionHint").textContent = (s.questionData?.length ?? 0) > 1
      ? "Please select the events you will attend"
      : "PLEASE COMPLETE THE INFORMATION BELOW";

    const confirm = $("#rsvpConfirmBlock");
    confirm.classList.toggle("hidden", selected === null);
    confirm.classList.toggle("contents", selected !== null);
    renderSubmitLabel();
    renderAccordion();
  }

  function renderSubmitLabel() {
    const btn = $("#btnSubmitRsvp");
    const label = $("#btnSubmitLabel");

    // API RSVP mengembalikan rsvpStatus 1 (attend) / 2 (unable to attend)
    // bila tamu sudah pernah mengonfirmasi.
    setToggle(btn, s.isConfirmed);

    // Cegah submit ulang setelah berhasil
    btn.disabled = s.isSubmit || s.isConfirmed;

    if (s.isSubmit) {
      label.textContent = "SENDING...";
    } else if (s.attendStatus === 1) {
      label.textContent = "CONFIRM ATTEND";
    } else {
      label.innerHTML = '<span>CONFIRM UNABLE<br />TO ATTEND</span>';
    }
  }

  function renderGuestTexts() {
    const guestData = s.guestData || {};
    const dataGuest = s.data.dataGuest || null;
    $("#rsvpGuestName").textContent = s.paramUrl !== "" ? s.paramUrl : (guestData?.name ?? "Guest Name");

    // Logika batas RSVP bawaan Reservation.tsx (batch 1 -> 30 October 2026)
    const isBatch1 =
      guestData?.batch === 1 || guestData?.batch === "1" ||
      guestData?.batchName?.toLowerCase()?.includes("batch 1") ||
      guestData?.batchName?.toLowerCase()?.includes("1") ||
      guestData?.rsvpBatch === 1 || guestData?.rsvpBatch === "1" ||
      dataGuest?.batch === 1 || dataGuest?.batch === "1" ||
      (!guestData?.batch && !dataGuest?.batch);
    const guestCloseDate = guestData?.closeRSVPDate || dataGuest?.closeRSVPDate;
    let dueDate = "30 October 2026";
    if (guestCloseDate && (!isBatch1 || !guestCloseDate.includes("10-23"))) {
      dueDate = moment(guestCloseDate).format("DD MMMM YYYY");
    } else if (isBatch1) {
      dueDate = "30 October 2026";
    } else if (s.data.dataEvent?.closeRSVPDate) {
      dueDate = moment(new Date(s.data.dataEvent.closeRSVPDate).toISOString()).format("DD MMMM YYYY");
    }
    $("#rsvpDueDate").textContent = dueDate;
    if (s.data.dataContent?.rsvpPhoto?.url) $("#rsvpPhoto").src = `https://media.twinklebook.com/${s.data.dataContent.rsvpPhoto.url}`;
  }

  // ════════════════════════════ popup (StatusPopup.tsx + PopupWrapper.tsx) ════════════════════════════
  const ICON = {
    success: "assets/icons/ic_confirmed.svg",
    question: "assets/icons/ic_question.svg",
    warning: "assets/icons/ic_warning.svg",
  };

  function statusPopup({ type, title, messageId, messageEn, buttons }) {
    lockScroll(true);

    const overlay = el(
      "div",
      "fixed inset-0 z-50 flex items-center justify-center animate-popup-zoom"
    );

    overlay.style.cssText = `
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  -webkit-backdrop-filter: blur(3px);
  backdrop-filter: blur(3px);
  padding: 24px;
  touch-action: none;
  overscroll-behavior: none;
`;
    // Cegah wheel/touch menggerakkan halaman belakang
    const preventBackgroundScroll = (e) => {
      e.preventDefault();
    };

    overlay.addEventListener("wheel", preventBackgroundScroll, {
      passive: false
    });

    overlay.addEventListener("touchmove", preventBackgroundScroll, {
      passive: false
    });

    const card = el("div", "lg:max-w-[485px] max-w-[322px] relative z-50 w-full bg-white rounded-[10px] shadow-2xl flex flex-col overflow-hidden");
    const body = el("div", "px-[30px] pt-[38px] pb-6 text-center lg:px-[31px] lg:pt-[57px] lg:pb-[31px]");
    const iconWrap = el("div", "w-12 h-12 rounded-full flex items-center justify-center mx-auto");
    const icon = el("img");
    icon.src = ICON[type];
    icon.alt = "icon status";
    icon.width = 42;
    icon.height = 42;
    iconWrap.appendChild(icon);
    const h3 = el("h3", "status_popup_title mt-[15px] mb-[15px] lg:mt-[23.04px] lg:mb-[27px]", title);
    const content = el("div", "status_popup_content min-h-[149px] lg:min-h-[224px]");
    const p = el("p");
    p.append(document.createTextNode(messageId), el("br"), el("br"), document.createTextNode(messageEn));
    content.appendChild(p);
    body.append(iconWrap, h3, content);

    const close = () => { overlay.remove(); lockScroll(false); };
    const actions = el("div", "border-t border-[#e5e5e5] flex");
    buttons.forEach((b, i) => {
      const btn = el("button", `status_popup_button flex-1 pt-[15px] pb-[22px] lg:pt-[22.63px] lg:pb-[33.18px] text-sm flex items-center justify-center gap-2 hover_popup_button ${i > 0 ? "border-l border-[#e5e5e5]" : ""}`, b.label);
      btn.type = "button";
      if (b.label !== "Close") btn.style.fontWeight = "700";
      btn.addEventListener("click", () => { close(); b.onClick?.(); });
      actions.appendChild(btn);
    });
    card.append(body, actions);
    overlay.appendChild(card);
    $("#modalRoot").appendChild(overlay);
  }

  const CLOSE = { label: "Close" };
  const showIncompleteModal = () => statusPopup({
    type: "warning", title: s.titleResponseRSVP,
    messageId: s.failedSubmitMessage || "Mohon lengkapi data RSVP Anda sebelum melanjutkan.",
    messageEn: s.failedEnSubmitMessage || "Please complete your RSVP details before proceeding.",
    buttons: [CLOSE],
  });
  const showIncompleteRSVPModal = () => statusPopup({
    type: "warning", title: s.titleResponseRSVP,
    messageId: s.failedSubmitMessage || "Mohon lengkapi data RSVP Anda sebelum melanjutkan.",
    messageEn: "",
    buttons: [CLOSE],
  });
  const showGuestCountWarning = () => statusPopup({
    type: "warning", title: "INCOMPLETE RSVP",
    messageId: "Jumlah tamu tidak boleh kosong atau 0. Silakan pilih jumlah tamu yang akan hadir.",
    messageEn: "",
    buttons: [CLOSE],
  });
  const showClosedModal = () => statusPopup({
    type: "warning", title: "RSVP CLOSED",
    messageId: "Reservasi telah ditutup, terima kasih atas perhatian Anda. Jika membutuhkan bantuan, tim kami siap membantu.",
    messageEn: "Reservations are now closed. Thank you for your attention. If you need any assistance, our team is here to help.",
    buttons: [CLOSE, { label: "Chat with Our Team", onClick: () => window.open(s.invitationUrl, "_blank") }],
  });
  const showConfirmModal = () => statusPopup({
    type: "question", title: "CONFIRM RSVP",
    messageId: "Apakah Anda yakin dengan pilihan RSVP ini? Silakan lanjutkan untuk menyimpan konfirmasi Anda.",
    messageEn: "Are you sure about your RSVP selection? Please proceed to submit your confirmation.",
    buttons: [CLOSE, { label: "Confirm", onClick: handleRSVP }],
  });
  const showConfirmedModal = (status) => statusPopup({
    type: "success", title: s.titleResponseRSVP,
    messageId: status === 1
      ? "Konfirmasi kehadiran Anda telah kami terima, kami menantikan kehadiran Anda. Terima kasih atas konfirmasi Anda."
      : "Konfirmasi ketidakhadiran Anda telah kami terima, terima kasih atas respon Anda. Kami menghargai pemberitahuan Anda.",
    messageEn: status === 1
      ? "Your attendance has been confirmed, we look forward to welcoming you. Thank you for your confirmation."
      : "Your response has been received, thank you for your confirmation. We appreciate your response.",
    buttons: [CLOSE],
  });

  function showLoader() {
    lockScroll(true);
    const overlay = el("div", "fixed inset-0 z-[9999] flex items-center justify-center bg-black/40");
    overlay.appendChild(el("div", "animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"));
    $("#modalRoot").appendChild(overlay);
    return { remove: () => { overlay.remove(); lockScroll(false); } };
  }

  // SubmitButton.onButtonClick: cek jumlah tamu tiap sesi yang dipilih dulu, baru handleSubmit
  function onSubmitClick() {
    if (s.attendStatus === 1) {
      for (const session of s.questionData) {
        const sid = session.eventSessionId;
        if (!s.selectedSessions.includes(sid)) continue;
        const count = currentGuestCount(session);
        if (!count || count <= 0) {
          handleGuestCount(sid, 0, false);
          return showGuestCountWarning();
        }
      }
    }
    handleSubmit();
  }

  async function handleRSVP() {
    s.isSubmit = true;
    renderSubmitLabel();
    const loader = showLoader();
    const res = await api.submitRSVP(collectDataRSVP());
    loader.remove();
    s.isSubmit = false;
    renderSubmitLabel();

    const genericId = "Terjadi kesalahan. Silakan periksa koneksi internet Anda dan coba lagi.";
    const genericEn = "Something went wrong. Please check your internet connection and try again";
    // hooks/useEventRSVP.ts
    if (res.status === 200) {
      s.isConfirmed = true;

      // Update tombol menjadi active
      renderSubmitLabel();

      s.titleResponseRSVP = "RSVP CONFIRMED";
      showConfirmedModal(s.attendStatus);
      return;
    }
    const errorId = res.status === 400 ? (res.data?.messageID ?? res.data?.message ?? genericId) : genericId;
    const errorEn = res.status === 400 ? (res.data?.messageEN ?? res.data?.message ?? genericEn) : genericEn;
    if (errorEn === "Reservation Deadline has ended. Please contact helpdesk team for manual reservations. Thank you.") {
      showClosedModal();
    } else {
      s.titleResponseRSVP = "Sorry";
      s.failedSubmitMessage = errorId || "Failed to submit RSVP, Please try again.";
      s.failedEnSubmitMessage = errorEn || "Failed to submit RSVP, Please try again.";
      showIncompleteModal();
    }
  }

  // ════════════════════════════ payload (collectDataRSVP, verbatim) ════════════════════════════
  function collectDataRSVP() {
    const answers = s.answers;
    const questionData = s.questionData;

    const buildChildParentIdMap = (sessionId) => {
      const childParentIdMap = {};
      Object.entries(answers[sessionId] || {}).forEach(([, val]) => {
        if (Array.isArray(val)) {
          val.forEach((guest, guestIndex) => {
            const optionId = Array.isArray(guest.optionId) ? guest.optionId[0] : guest.optionId;
            if (optionId) {
              Object.keys(answers[sessionId]).forEach((key) => {
                if (key.endsWith(`-guest-${guestIndex}`)) {
                  childParentIdMap[key] = { parentId: optionId, parentIndex: guestIndex };
                }
              });
            }
          });
        }
      });
      return childParentIdMap;
    };

    const buildQuestions = (sessionId) => {
      const childParentIdMap = buildChildParentIdMap(sessionId);
      const nonGuestChildMap = {};
      const questionList = questionData.find((x) => x.eventSessionId === sessionId)?.questionList || [];

      s.generalQuestions.concat(questionList).forEach((q) => {
        if (!q.listAnswerChoices?.length) return;
        q.listAnswerChoices.forEach((ans) => {
          if (!ans.child?.length) return;
          const selectedAnswer = answers[sessionId]?.[q.id];
          const isSelected = selectedAnswer === ans.choice ||
            (typeof selectedAnswer === "string" && selectedAnswer.split(",").includes(ans.choice));
          if (isSelected) {
            ans.child.forEach((childQ) => {
              nonGuestChildMap[childQ.id] = ans.id;
              const recurse = (cq) => {
                cq.listAnswerChoices?.forEach((cans) => {
                  if (!cans.child?.length) return;
                  const cSelected = answers[sessionId]?.[cq.id];
                  const cIsSelected = cSelected === cans.choice ||
                    (typeof cSelected === "string" && cSelected.split(",").includes(cans.choice));
                  if (cIsSelected) {
                    cans.child.forEach((gcQ) => {
                      nonGuestChildMap[gcQ.id] = cans.id;
                      recurse(gcQ);
                    });
                  }
                });
              };
              recurse(childQ);
            });
          }
        });
      });

      const validParentKeys = new Set();
      Object.entries(answers[sessionId] || {}).forEach(([, val]) => {
        if (Array.isArray(val)) {
          val.forEach((guest, guestIndex) => {
            const optionIds = Array.isArray(guest.optionId) ? guest.optionId : guest.optionId ? [guest.optionId] : [];
            optionIds.forEach((id) => validParentKeys.add(`${id}-${guestIndex}`));
          });
        }
      });

      const directParentMap = {};
      Object.entries(answers[sessionId] || {}).forEach(([, val]) => {
        if (Array.isArray(val)) {
          val.forEach((guest, guestIndex) => {
            questionList.forEach((q) => {
              if (q.questionType === 9) {
                q.listAnswerChoices?.forEach((ans) => {
                  if (ans.choice === guest.options?.[0] && ans.child?.length) {
                    const walkQuestion = (parentQ) => {
                      if (!parentQ.listAnswerChoices?.length) return;
                      parentQ.listAnswerChoices.forEach((pans) => {
                        if (!pans.child?.length) return;
                        const scopedAnswer = answers[sessionId]?.[`${parentQ.id}-guest-${guestIndex}`] ?? answers[sessionId]?.[parentQ.id];
                        const isSelected = scopedAnswer === pans.choice ||
                          (typeof scopedAnswer === "string" && scopedAnswer.split(",").includes(pans.choice));
                        if (isSelected) {
                          pans.child.forEach((childQ) => {
                            directParentMap[`${childQ.id}-guest-${guestIndex}`] = { parentId: pans.id, parentIndex: guestIndex };
                            walkQuestion(childQ);
                          });
                        }
                      });
                    };
                    ans.child.forEach((childQ) => walkQuestion(childQ));
                  }
                });
              }
            });
          });
        }
      });

      const validDirectParentKeys = new Set();
      Object.entries(answers[sessionId] || {}).forEach(([qId, val]) => {
        if (!Array.isArray(val) && qId !== "guestInvitation") {
          const guestIndexMatch = qId.match(/-guest-(\d+)$/);
          const guestIndex = guestIndexMatch ? guestIndexMatch[1] : null;
          const realQId = qId.replace(/-guest-\d+$/, "");
          const findQ = (questions) => {
            for (const q of questions) {
              if (q.id === realQId) return q;
              for (const ans of (q.listAnswerChoices || [])) {
                for (const child of (ans.child || [])) {
                  const found = findQ([child]);
                  if (found) return found;
                }
              }
            }
            return null;
          };
          const q = findQ(questionList);
          if (q?.listAnswerChoices?.length) {
            q.listAnswerChoices.forEach((ans) => {
              const answerVal = val;
              if (ans.choice === answerVal || answerVal.split(",").includes(ans.choice)) {
                validDirectParentKeys.add(`${ans.id}-${guestIndex ?? "0"}`);
              }
            });
          }
        }
      });

      return Object.entries(answers[sessionId] || {})
        .filter(([qId]) => qId !== "guestInvitation" && !Array.isArray(answers[sessionId][qId]))
        .filter(([qId]) => {
          const parentInfo = childParentIdMap[qId];
          if (!parentInfo) return true;
          const type9Valid = validParentKeys.has(`${parentInfo.parentId}-${parentInfo.parentIndex}`);
          if (!type9Valid) return false;
          const directParent = directParentMap[qId];
          if (directParent) return validDirectParentKeys.has(`${directParent.parentId}-${directParent.parentIndex}`);
          return true;
        })
        .map(([qId, answer]) => {
          const realId = qId.replace(/-guest-\d+$/, "");
          const parentInfo = childParentIdMap[qId];
          const nonGuestParentId = nonGuestChildMap[realId];
          return {
            id: realId,
            answer,
            optionAnswer: "",
            parentId: parentInfo ? parentInfo.parentId : nonGuestParentId ? nonGuestParentId : null,
            parentIndex: parentInfo ? parentInfo.parentIndex : null,
          };
        });
    };

    const buildGuestAttendances = (sessionId) => Object.entries(answers[sessionId] || {})
      .filter(([qId]) => Array.isArray(answers[sessionId][qId]))
      .map(([qId, guests]) => ({
        id: qId,
        answer: `${guests.length}|${guests.map((g) => g.options.length ? `${g.name}~${g.options.join("-")}` : g.name).join(";")}`,
        optionAnswer: "",
      }));

    return {
      eventId: s.eventId,
      groupId: (s.isPublicInvitation && s.groupUrl && s.groupUrl !== "") ? (s.group?.id || null) : null,
      name: ($("#attend_name")?.value || "") || s.guestData.name || "",
      phone: (s.iti ? s.iti.getNumber() : "") || s.guestData.phone || "",
      pin: s.pin || null,
      status: s.attendStatus,
      url: s.data.url,
      maybeDate: null,
      maybeNote: null,
      questionList: s.attendStatus === 1 ? [
        ...questionData.map((session) => {
          const sessionId = session.eventSessionId;
          if (!s.selectedSessions.includes(sessionId)) {
            return { eventSessionId: sessionId, guestInvitation: 0, questions: [], guestAttendances: [] };
          }
          return {
            eventSessionId: sessionId,
            guestInvitation: answers[sessionId]?.guestInvitation || 1,
            questions: buildQuestions(sessionId),
            guestAttendances: buildGuestAttendances(sessionId),
          };
        }),
        ...(Object.keys(answers[GENERAL_SESSION_ID] || {}).length > 1 ? [{
          guestInvitation: 1,
          questions: buildQuestions(GENERAL_SESSION_ID),
          guestAttendances: buildGuestAttendances(GENERAL_SESSION_ID),
        }] : []),
      ] : [],
    };
  }

  // ════════════════════════════ submit (handleSubmit + handleRSVP) ════════════════════════════
  function handleSubmit() {
    if (s.isPublicInvitation && !s.pin) {
      if (!($("#attend_name")?.value || "")) return Swal.fire({ title: "Name is required!", icon: "error" });
      if (!(s.iti && s.iti.getNumber())) return Swal.fire({ title: "Phone Number is required!", icon: "error" });
    }
    if (s.attendStatus === 0) {
      s.titleResponseRSVP = "CONFIRM YOUR ATTENDANCE";
      s.failedEnSubmitMessage = "Please confirm your attendance.";
      s.failedSubmitMessage = "Mohon konfirmasi kehadiran Anda.";
      return showIncompleteRSVPModal();
    }
    if (s.attendStatus === 1 && !s.selectedSessions.length) {
      s.titleResponseRSVP = "SESSION REQUIRED";
      s.failedEnSubmitMessage = "Some session selections are still missing. Please select at least one session to attend.";
      s.failedSubmitMessage = "Pilihan sesi acara masih belum ditentukan. Mohon pilih minimal satu sesi yang akan dihadiri.";
      return showIncompleteModal();
    }

    if (s.attendStatus === 1) {
      for (const sessionId of s.selectedSessions) {
        const guestCount = s.answers[sessionId]?.guestInvitation;
        if (!guestCount || guestCount === 0 || isNaN(guestCount)) {
          s.titleResponseRSVP = "INCOMPLETE RSVP";
          s.failedSubmitMessage = "Please select the Number of Guest.";
          s.failedEnSubmitMessage = "Please select the Number of Guest.";
          return showIncompleteRSVPModal();
        }
      }

      const isAnswerEmpty = (answer) => answer === undefined || answer === null || answer === "" || (Array.isArray(answer) && answer.length === 0);

      const validateQuestion = (q, sessionId, guestIndex) => {
        const scopedId = guestIndex !== undefined ? `${q.id}-guest-${guestIndex}` : q.id;
        const answer = s.answers[sessionId]?.[scopedId];

        if (q.questionType === 9) {
          const guestCount = s.answers[sessionId]?.guestInvitation || 1;
          const guestAnswers = s.answers[sessionId]?.[q.id] || [];
          for (let i = 0; i < guestCount; i++) {
            const guest = guestAnswers[i];
            const lbl = `guest ${i + 1} in "${q.questionTitle}"`;
            if (!guest?.name?.trim()) return `Please fill in the name for ${lbl}`;
            if (q.guestAttendanceOptionType === 1 && (!guest?.options || guest.options.length === 0)) return `Please select an option for ${lbl}`;
            if (q.guestAttendanceOptionType === 2 && !guest?.options?.[0]) return `Please select an option for ${lbl}`;
            if (q.listAnswerChoices?.length) {
              for (const ans of q.listAnswerChoices) {
                if (!guest?.options?.includes(ans.choice) || !ans.child?.length) continue;
                for (const childQ of ans.child) {
                  const error = validateQuestion(childQ, sessionId, i);
                  if (error) return error;
                }
              }
            }
          }
          return null;
        }

        if (isAnswerEmpty(answer)) return `Please fill in "${q.questionTitle}"`;

        if (q.listAnswerChoices?.length) {
          for (const ans of q.listAnswerChoices) {
            const choice = ans.choice.split("*|*")[0];
            const isSelected = answer === choice ||
              (typeof answer === "string" && answer.split(",").some((a) => a === choice || a.startsWith(`${choice}:;`)));
            if (!isSelected || !ans.child?.length) continue;
            for (const childQ of ans.child) {
              const error = validateQuestion(childQ, sessionId, guestIndex);
              if (error) return error;
            }
          }
        }
        return null;
      };

      const validateQuestions = (list, sessionId) => {
        for (const q of list) {
          const error = validateQuestion(q, sessionId);
          if (error) return error;
        }
        return null;
      };

      for (const session of s.questionData) {
        if (!s.selectedSessions.includes(session.eventSessionId)) continue;
        const error = validateQuestions(session.questionList, session.eventSessionId);
        if (error) {
          s.titleResponseRSVP = "INCOMPLETE RSVP";
          s.failedSubmitMessage = error;
          return showIncompleteRSVPModal();
        }
      }

      const generalError = validateQuestions(s.generalQuestions, GENERAL_SESSION_ID);
      if (generalError) {
        s.titleResponseRSVP = "INCOMPLETE RSVP";
        s.failedSubmitMessage = generalError;
        return showIncompleteRSVPModal();
      }
    }

    showConfirmModal();
  }

  // ════════════════════════════ init data (effect "Initialize data" + merge sesi) ════════════════════════════
  function initAnswersFromGuest(sessions, smartRsvp) {
    const mergedData = sessions
      .filter((x) => x.eventId !== "00000000-0000-0000-0000-000000000000")
      .map((session) => {
        const q = smartRsvp.find((x) => x.id === session.eventSessionId);
        return { ...session, rsvp: q?.rsvp ?? 0, rsvpStatus: q?.rsvpStatus ?? 0, questionList: q?.questionList || [] };
      });

    if (mergedData.length === 0) {
      Swal.fire({ title: "Error", text: "No sessions found for this event", icon: "error" });
      return;
    }

    s.questionData = mergedData;
    s.isConfirmed = smartRsvp.some((item) => [1, 2].includes(Number(item.rsvpStatus)));
    if (smartRsvp.some((i) => i.rsvpStatus === 1)) s.attendStatus = 1;
    else if (smartRsvp.some((i) => i.rsvpStatus === 2)) s.attendStatus = 2;
    else s.attendStatus = 0;

    const initialAnswers = {};
    const initialSessions = [];

    const initializeChildAnswers = (q, sessionId, maxGuestIndex) => {
      const apply = (childQ) => {
        if (childQ.guestAnswerList?.length) {
          childQ.guestAnswerList.forEach((guestAnswer) => {
            const parentIndex = guestAnswer.parentIndex;
            if (maxGuestIndex !== undefined) {
              if (parentIndex === null || parentIndex === undefined || parentIndex >= maxGuestIndex) return;
            }
            const scopedId = (parentIndex !== null && parentIndex !== undefined) ? `${childQ.id}-guest-${parentIndex}` : childQ.id;
            if (childQ.questionType === 9) {
              const guestCount = parseInt(guestAnswer.answer || "1");
              const details = guestAnswer.guestAttendanceDetail?.split(";") || [];
              initialAnswers[sessionId][scopedId] = Array.from({ length: guestCount }, (_, i) => {
                const [name, options] = details[i]?.split("~") || ["", ""];
                return {
                  id: `${scopedId}-${i + 1}`,
                  name: name || "",
                  options: options ? (childQ.guestAttendanceOptionType === 1 ? options.split("-") : [options]) : [],
                  optionId: "",
                };
              });
            } else {
              initialAnswers[sessionId][scopedId] = guestAnswer.answer || "";
            }
          });
        }
        initializeChildAnswers(childQ, sessionId, maxGuestIndex);
      };
      q.listAnswerChoices?.forEach((ans) => ans.child?.forEach(apply));
      q.child?.forEach(apply);
    };

    const initQuestion = (q, sessionId) => {
      if (q.questionType === 9) {
        const guestAnswerItem = q.guestAnswerList?.[0];
        const guestCount = parseInt(guestAnswerItem?.answer || "1");
        const details = guestAnswerItem?.guestAttendanceDetail?.split(";") || [];
        initialAnswers[sessionId][q.id] = Array.from({ length: guestCount }, (_, i) => {
          const [name, optionText] = details[i]?.split("~") || ["", ""];
          const matchedChoice = q.listAnswerChoices?.find((a) => a.choice === optionText);
          return {
            id: `${q.id}-${i + 1}`,
            name: name || "",
            options: optionText ? (q.guestAttendanceOptionType === 1 ? optionText.split("-") : [optionText]) : [],
            optionId: matchedChoice?.id || "",
          };
        });
        initializeChildAnswers(q, sessionId, guestCount);
      } else {
        initialAnswers[sessionId][q.id] = q.guestAnswerList?.[0]?.answer || "";
        initializeChildAnswers(q, sessionId);
      }
    };

    const generalList = smartRsvp.find((q) => q.questionGeneralList?.length)?.questionGeneralList || [];
    s.generalQuestions = generalList;
    initialAnswers[GENERAL_SESSION_ID] = { guestInvitation: 1 };
    generalList.forEach((q) => initQuestion(q, GENERAL_SESSION_ID));

    mergedData.forEach((session) => {
      const sessionId = session.eventSessionId;
      initialAnswers[sessionId] = { guestInvitation: session.rsvp || 1 };
      session.questionList.forEach((q) => initQuestion(q, sessionId));
      if (session.rsvpStatus === 1) initialSessions.push(sessionId);
    });

    s.answers = initialAnswers;
    s.selectedSessions = initialSessions;
  }

  function initPublicSessions() {
    const ev = s.data.dataEvent;
    const pubIds = ev.publicSessionLayout ? ev.publicSessionLayout.split(",") : [];
    const allowedSessions = s.isPublicInvitation
      ? (s.data.dataSession || []).filter((session) => pubIds.includes(session.id.toString()))
      : [];
    s.questionData = allowedSessions.map((session) => ({ ...session, eventSessionId: session.id, questionList: session.questionList || [] }));
    s.answers = allowedSessions.reduce((acc, session) => ({ ...acc, [session.id]: { guestInvitation: 1 } }), {});
  }


  async function init({ data, pin, guest, paramUrl }) {
    s.data = { ...data, dataGuest: guest ?? (paramUrl ? { name: paramUrl } : null) };
    s.pin = pin || "";
    s.paramUrl = paramUrl || "";
    s.eventId = data.dataContent.eventId;
    s.publicQuota = data.dataEvent.publicQuota;
    s.isPublicInvitation = data.dataEvent.eventAccess === 1 || data.dataEvent.eventAccess === 2;
    s.invitationUrl = `https://api.whatsapp.com/send?phone=${data.InvitationWAUrl}&text=Hello%20Team%2C%20i%20need%20help%20for%20RSVP%20on%20Event%3A%20${encodeURIComponent(data.dataEvent.name)}`;
    if (data.dataEvent.rsvpSuccessMessage) s.titleResponseRSVP = data.dataEvent.rsvpSuccessMessage;
    if (data.dataEvent.rsvpFailedMessage) s.failedSubmitMessage = data.dataEvent.rsvpFailedMessage;

    if (guest) {
      s.guestData = guest;
      s.invitationUrl = `https://wa.me/6281998478131?text=Hi%20Provite%20Team%2C%20i%20need%20help%20with%20my%20RSVP%20with%20invitation%20name%20${encodeURIComponent(guest.name)}%20for%20The%20Event%3A%20${encodeURIComponent(data.dataEvent.name)}`;
    }

    // AttendToggle: pilih ATTEND, dan bila hanya satu sesi langsung dipilih
    $("#btnAttend").addEventListener("click", () => {
      if (s.attendStatus !== 1) s.isConfirmed = false;
      s.attendStatus = 1;
      if (s.questionData.length === 1 && !s.selectedSessions.includes(s.questionData[0].eventSessionId)) {
        handleSessionSelect(s.questionData[0].eventSessionId, true);
      }
      renderStatus();
    });
    $("#btnNotAttend").addEventListener("click", () => {
      if (s.attendStatus !== 2) s.isConfirmed = false;
      s.attendStatus = 2;
      renderStatus();
    });
    $("#btnSubmitRsvp").addEventListener("click", onSubmitClick);
    $("#btnChatSupport").addEventListener("click", () => {
      if (s.invitationUrl && s.invitationUrl !== "#") {
        window.open(s.invitationUrl, "_blank");
      } else {
        const phone = (data.dataEvent?.phone || data.dataEvent?.whatsapp || "6281234567890").replace(/\D/g, "");
        const title = data.dataEvent?.name || "";
        const guestName = $("#rsvpGuestName").textContent;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Hi Provite Team, i need help with my RSVP with invitation name ${guestName} for The Event: ${title}`)}`, "_blank");
      }
    });

    renderGuestTexts();

    if (s.pin) {
      const [sessionRes, smartRes] = await Promise.all([
        api.getGuestSessionsByPin(s.pin, data.dataEvent.id),
        api.getSmartRsvpData(data.url, s.pin),
      ]);
      const sessions = sessionRes.status === 200 && Array.isArray(sessionRes.data) ? sessionRes.data : null;
      const smart = smartRes.ok && Array.isArray(smartRes.data) ? smartRes.data : null;
      if (!sessions || !smart) {
        Swal.fire({ title: "Error", text: "Something went wrong", icon: "error" });
      } else if (sessions.length) {
        initAnswersFromGuest(sessions, smart);
      }
    } else {
      initPublicSessions();
    }

    // Accordion: satu sesi + ATTEND -> sesi otomatis dipilih (useEffect di AccordionSection)
    if (s.attendStatus === 1 && s.questionData.length === 1 && !s.selectedSessions.includes(s.questionData[0].eventSessionId)) {
      handleSessionSelect(s.questionData[0].eventSessionId, true, false);
    }
    renderStatus();
  }

  return { init, collectDataRSVP, state: s };
})();
