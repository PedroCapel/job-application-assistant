// Script de conteúdo: preenche o formulário de candidatura com o perfil salvo.
// Nunca clica em "Submit": o envio é sempre da pessoa.
(function () {
  if (window.__pvLoaded) return; window.__pvLoaded = true;
  const { DEFAULT_PROFILE, answerFor, pickOption, norm } = self.PV;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function loadProfile() {
    return new Promise(res => chrome.storage.local.get({ profile: DEFAULT_PROFILE }, d => res(Object.assign({}, DEFAULT_PROFILE, d.profile))));
  }

  // Define o valor de um jeito que React/Vue percebam.
  function setNative(el, value) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function labelOf(el) {
    if (el.id) { const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l) return norm(l.innerText); }
    const wrap = el.closest("label"); if (wrap) return norm(wrap.innerText);
    const al = el.getAttribute("aria-label"); if (al) return norm(al);
    const lb = el.getAttribute("aria-labelledby"); if (lb) { const t = lb.split(" ").map(i => document.getElementById(i)?.innerText || "").join(" "); if (norm(t)) return norm(t); }
    const box = el.closest(".application-question, .field, li, fieldset, [class*=question], [class*=field]");
    if (box) { const t = box.querySelector("label, legend, .application-label, [class*=label]"); if (t) return norm(t.innerText); }
    return norm(el.getAttribute("placeholder") || el.name || "");
  }

  function mark(el, kind) {
    const box = el.closest("[class*=select__control], .select__control") || el;
    box.style.outline = kind === "ok" ? "2px solid #16a34a" : "2px dashed #d97706";
    box.style.outlineOffset = "2px";
  }

  async function fillCombobox(el, value) {
    el.focus(); el.click();
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await sleep(250);
    let opts = Array.from(document.querySelectorAll("[role=option]")).filter(o => o.offsetParent !== null);
    if (opts.length > 15 || !opts.length) { setNative(el, value); await sleep(900); opts = Array.from(document.querySelectorAll("[role=option]")).filter(o => o.offsetParent !== null); }
    const i = pickOption(opts.map(o => o.innerText), value);
    if (i < 0) { setNative(el, ""); el.blur(); return false; }
    opts[i].dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    opts[i].click();
    await sleep(150);
    return true;
  }

  function fillRadioGroup(group, label, value) {
    const labels = group.map(r => labelOf(r));
    const i = pickOption(labels, value);
    if (i < 0) return false;
    group[i].click();
    return true;
  }

  function jobContext() {
    const title = norm(document.querySelector("h1, .posting-headline h2, [class*=job-title]")?.innerText || "");
    let company = norm(document.querySelector('meta[property="og:site_name"]')?.content || "");
    if (!company) { const m = document.title.match(/ at (.+?)$| - (.+?)$/); company = norm(m ? (m[1] || m[2]) : ""); }
    if (!company) company = location.pathname.split("/").filter(Boolean)[0] || "";
    return { title, company };
  }

  async function attachResume(profile, report) {
    if (!profile.resume?.dataUrl) return;
    const inputs = Array.from(document.querySelectorAll('input[type=file]'));
    const target = inputs.find(i => /resume|cv|curr[ií]culo/i.test(labelOf(i) + " " + i.name + " " + i.id + " " + (i.closest("[class*=resume], [id*=resume], li, .field, fieldset, [role=group]")?.innerText || ""))) || (inputs.length === 1 ? inputs[0] : null);
    if (!target || target.files?.length) return;
    const blob = await (await fetch(profile.resume.dataUrl)).blob();
    const dt = new DataTransfer();
    dt.items.add(new File([blob], profile.resume.name, { type: profile.resume.type || "application/pdf" }));
    target.files = dt.files;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    report.filled.push("Currículo: " + profile.resume.name);
  }

  async function fillForm() {
    const profile = await loadProfile();
    const report = { filled: [], missing: [], skipped: [] };
    const ctx = jobContext();
    await attachResume(profile, report);

    const fields = Array.from(document.querySelectorAll("input, textarea, select")).filter(e =>
      !["hidden", "file", "submit", "button", "checkbox", "password", "search"].includes(e.type) && !e.disabled && !e.closest("#pv-panel"));
    const radiosDone = new Set();

    for (const el of fields) {
      if (el.type === "radio") {
        if (radiosDone.has(el.name)) continue; radiosDone.add(el.name);
        const group = fields.filter(f => f.type === "radio" && f.name === el.name);
        const q = norm(el.closest("fieldset, [role=radiogroup], .application-question, li")?.querySelector("legend, label, .application-label, [class*=label]")?.innerText || "");
        const a = answerFor(q, profile);
        if (group.some(r => r.checked)) continue;
        if (a && fillRadioGroup(group, q, a.value)) { report.filled.push(q + " → " + a.value); group.forEach(r => mark(r, "ok")); }
        else if (q) report.missing.push(q);
        continue;
      }
      const label = labelOf(el);
      const isCombo = el.getAttribute("role") === "combobox";
      const hasValue = isCombo ? !!el.closest("[class*=select__control]")?.querySelector("[class*=single-value]") : !!el.value && el.tagName !== "SELECT" || (el.tagName === "SELECT" && el.selectedIndex > 0);
      if (hasValue) continue;
      if (self.PV.SKIP.test(label)) { report.skipped.push(label); continue; }

      let a = answerFor(label, profile);
      if (!a && el.tagName === "TEXTAREA" && /cover letter|carta|additional information|why (do you|are you)/i.test(label) && profile.coverLetter) {
        a = { value: profile.coverLetter.replace(/\{empresa\}/gi, ctx.company).replace(/\{cargo\}/gi, ctx.title), source: "carta" };
      }
      const required = el.required || el.getAttribute("aria-required") === "true" || /[*✱]/.test(el.closest("label, li, .field, [class*=question]")?.innerText || "");
      if (!a) { if (required && label) { report.missing.push(label); mark(el, "miss"); } continue; }

      let ok = false;
      if (el.tagName === "SELECT") {
        const i = pickOption(Array.from(el.options).map(o => o.text), a.value);
        if (i >= 0) { setNative(el, el.options[i].value); ok = true; }
      } else if (isCombo) {
        ok = await fillCombobox(el, a.value);
      } else { setNative(el, a.value); ok = true; }

      if (ok) { report.filled.push(label + " → " + (a.source === "carta" ? "(carta de apresentação)" : a.value)); mark(el, "ok"); }
      else { report.missing.push(label + " (sem opção para “" + a.value + "”)"); mark(el, "miss"); }
    }
    showPanel(report);
    return report;
  }

  function showPanel(report) {
    document.getElementById("pv-panel")?.remove();
    const p = document.createElement("div"); p.id = "pv-panel";
    p.style.cssText = "position:fixed;right:16px;bottom:72px;width:340px;max-height:60vh;overflow:auto;z-index:2147483647;background:#fff;color:#111827;border:1px solid #d1d5db;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.18);font:13px/1.45 system-ui,sans-serif;padding:14px";
    const sec = (title, items, color) => items.length ? `<div style="margin-top:10px;font-weight:600;color:${color}">${title} (${items.length})</div><ul style="margin:4px 0 0;padding-left:18px">${items.map(i => `<li>${i.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]))}</li>`).join("")}</ul>` : "";
    p.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>Preenche Vagas</strong><button id="pv-close" style="border:0;background:none;font-size:18px;cursor:pointer;color:#6b7280" aria-label="Fechar">×</button></div>
      <div style="margin-top:6px;color:#374151">Revise os campos e clique você mesmo em enviar. A extensão nunca envia.</div>
      ${sec("Preenchidos", report.filled, "#15803d")}${sec("Faltam (responda à mão)", report.missing, "#b45309")}${sec("Deixados em branco de propósito", report.skipped, "#6b7280")}`;
    document.body.appendChild(p);
    p.querySelector("#pv-close").onclick = () => p.remove();
  }

  function addButton() {
    if (document.getElementById("pv-btn") || !document.querySelector("form, input[type=file]")) return;
    const b = document.createElement("button"); b.id = "pv-btn"; b.type = "button"; b.textContent = "Preencher candidatura";
    b.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;background:#047857;color:#fff;border:0;border-radius:999px;padding:12px 18px;font:600 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)";
    b.onclick = async () => { b.disabled = true; b.textContent = "Preenchendo…"; try { await fillForm(); } finally { b.disabled = false; b.textContent = "Preencher de novo"; } };
    document.body.appendChild(b);
  }

  addButton();
  new MutationObserver(addButton).observe(document.documentElement, { childList: true, subtree: true });
  chrome.runtime?.onMessage?.addListener((msg, _s, send) => { if (msg === "pv-fill") { fillForm().then(send); return true; } });
  window.__pvFill = fillForm; // para testes
})();
