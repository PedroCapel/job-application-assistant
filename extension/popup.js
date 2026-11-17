const msg = t => { document.getElementById("msg").textContent = t; };
document.getElementById("opts").onclick = () => chrome.runtime.openOptionsPage();
document.getElementById("fill").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const r = await chrome.tabs.sendMessage(tab.id, "pv-fill");
    msg(r ? `${r.filled.length} preenchidos, ${r.missing.length} faltando.` : "Nada para preencher.");
  } catch { msg("Esta página não é um formulário compatível."); }
};
