const { DEFAULT_PROFILE } = self.PV;
const $ = s => document.querySelector(s);
let resume = null;

function row(kind, a = "", b = "") {
  const d = document.createElement("div");
  d.className = "row" + (kind === "tech" ? " tech" : "");
  const [la, lb, pa, pb] = kind === "tech" ? ["Tecnologia", "Anos", "azure", "2"] : ["Trecho da pergunta", "Resposta", "favorite song", ""];
  d.innerHTML = `<label>${la}<input class="a" placeholder="${pa}"></label><label>${lb}<input class="b" placeholder="${pb}"></label><button type="button" aria-label="Remover linha">Remover</button>`;
  d.querySelector(".a").value = a; d.querySelector(".b").value = b;
  d.querySelector("button").onclick = () => d.remove();
  return d;
}

function render(p) {
  document.querySelectorAll("[data-k]").forEach(e => { e.value = p[e.dataset.k] ?? ""; });
  $("#tech").replaceChildren(...Object.entries(p.yearsByTech || {}).map(([t, n]) => row("tech", t, n)));
  $("#custom").replaceChildren(...(p.customAnswers || []).map(c => row("custom", c.match, c.answer)));
  resume = p.resume || null;
  $("#resumeInfo").textContent = resume ? "Salvo: " + resume.name : "Nenhum arquivo salvo.";
}

function collect() {
  const p = structuredClone(DEFAULT_PROFILE);
  document.querySelectorAll("[data-k]").forEach(e => { p[e.dataset.k] = e.value.trim(); });
  p.yearsByTech = {};
  document.querySelectorAll("#tech .row").forEach(r => { const t = r.querySelector(".a").value.trim().toLowerCase(); if (t) p.yearsByTech[t] = r.querySelector(".b").value.trim(); });
  p.customAnswers = Array.from(document.querySelectorAll("#custom .row")).map(r => ({ match: r.querySelector(".a").value.trim(), answer: r.querySelector(".b").value.trim() })).filter(c => c.match);
  p.resume = resume;
  return p;
}

function flash(t) { $("#status").textContent = t; setTimeout(() => { $("#status").textContent = ""; }, 2500); }

chrome.storage.local.get({ profile: DEFAULT_PROFILE }, d => render(Object.assign({}, DEFAULT_PROFILE, d.profile)));
$("#addTech").onclick = () => $("#tech").appendChild(row("tech"));
$("#addCustom").onclick = () => $("#custom").appendChild(row("custom"));
$("#save").onclick = () => chrome.storage.local.set({ profile: collect() }, () => flash(chrome.runtime.lastError ? "Erro ao salvar" : "Perfil salvo"));

$("#resume").onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > 4 * 1024 * 1024) { flash("Arquivo acima de 4 MB"); e.target.value = ""; return; }
  const r = new FileReader();
  r.onload = () => { resume = { name: f.name, type: f.type, dataUrl: r.result }; $("#resumeInfo").textContent = "Pronto para salvar: " + f.name; };
  r.readAsDataURL(f);
};

$("#export").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(collect(), null, 2)], { type: "application/json" }));
  a.download = "perfil_candidaturas.json"; a.click(); URL.revokeObjectURL(a.href);
};
$("#importBtn").onclick = () => $("#import").click();
$("#import").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try { render(Object.assign({}, DEFAULT_PROFILE, JSON.parse(await f.text()))); flash("Importado; clique em Salvar"); }
  catch { flash("JSON inválido"); }
  e.target.value = "";
};
