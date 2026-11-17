// Perfil padrão (em branco) e regras que ligam o rótulo de um campo a uma resposta do perfil.
// Compartilhado pela página de opções e pelo script de conteúdo.
(function (root) {
  const DEFAULT_PROFILE = {
    firstName: "", lastName: "", email: "", phone: "", phoneCountry: "",
    city: "", country: "", linkedin: "", website: "", github: "",
    currentCompany: "", employmentType: "",          // Employee | Contractor
    yearsTotal: "", english: "",                      // english: Basic | Intermediate | Advanced | Fluent
    salaryMonthlyUSD: "", salaryAnnualUSD: "", salaryHourlyUSD: "", salaryLocal: "",
    availability: "", workAuthorized: "Yes", needsSponsorship: "No",
    usClients: "", inLatam: "",
    yearsByTech: {},                                  // { "azure": "2", "sql": "6" }
    customAnswers: [],                                // [{ match: "favorite song", answer: "..." }]
    coverLetter: "",                                  // usa {empresa} e {cargo}
    resume: null                                      // { name, type, dataUrl }
  };

  // Ordem importa: a primeira regra que casar com o rótulo vence.
  // skip: campos que a extensão nunca preenche (opcionais sensíveis ou demográficos).
  const SKIP = /gender|race|ethnic|veteran|disabilit|pronoun|sexual|hispanic|date of birth|birth ?date|\bssn\b|social security|passport|\bcpf\b|\brg\b|tax id|password|senha/i;

  const RULES = [
    [/preferred (first )?name/i, () => ""],
    [/^first name|given name|primeiro nome/i, p => p.firstName],
    [/^last name|family name|surname|sobrenome/i, p => p.lastName],
    [/^(full )?name\b|nome completo/i, p => [p.firstName, p.lastName].filter(Boolean).join(" ")],
    [/e-?mail/i, p => p.email],
    [/phone|telefone|celular|mobile/i, p => p.phone],
    [/linkedin/i, p => p.linkedin],
    [/github/i, p => p.github],
    [/website|portfolio|site pessoal/i, p => p.website],
    [/current (company|employer)|empresa atual/i, p => p.currentCompany],
    [/employee or contractor|currently an employee/i, p => p.employmentType],
    [/sponsor/i, p => p.needsSponsorship],
    [/authorized|authorised|legally (able|allowed)|work permit|eligible to work/i, p => p.workAuthorized],
    [/located in latin america|latam/i, p => p.inLatam],
    [/country.*(based|resid|located|live)|(based|resid|located|live).*country|what country|pa[ií]s/i, p => p.country],
    [/^country\b/i, p => p.phoneCountry || p.country],
    [/location|city|cidade|where are you/i, p => [p.city, p.country].filter(Boolean).join(", ")],
    [/u\.?s\.? clients|american clients|international clients/i, p => p.usClients],
    [/english/i, p => p.english],
    [/hourly/i, p => p.salaryHourlyUSD],
    [/(annual|yearly|per year).*(salary|compensation)|(salary|compensation).*(annual|yearly|per year)/i, p => p.salaryAnnualUSD],
    [/(salary|compensation|pretens[aã]o|remunera).*(brl|reais|r\$)/i, p => p.salaryLocal],
    [/salary|compensation|pay expectation|pretens[aã]o|remunera/i, p => p.salaryMonthlyUSD],
    [/how soon|start date|notice period|availab|when can you start|disponibilidade/i, p => p.availability],
    [/years.*(professional )?experience.*(role|position|related|field)|total years|years of (professional|relevant) experience/i, p => p.yearsTotal]
  ];

  function norm(s) { return String(s || "").replace(/\s+/g, " ").replace(/[*✱]/g, "").trim(); }

  // Devolve { value, source } ou null quando não há resposta no perfil.
  function answerFor(label, profile) {
    const l = norm(label);
    if (!l || SKIP.test(l)) return null;
    for (const c of profile.customAnswers || []) {
      if (c.match && l.toLowerCase().includes(String(c.match).toLowerCase()) && c.answer !== "") return { value: c.answer, source: "personalizada" };
    }
    const yrs = /how many years|years (of|do you have|working)|anos de experi/i.test(l);
    if (yrs) {
      for (const [tech, n] of Object.entries(profile.yearsByTech || {})) {
        if (tech && new RegExp("(^|[^a-z0-9])" + tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z0-9]|$)", "i").test(l) && n !== "") return { value: String(n), source: "anos:" + tech };
      }
    }
    for (const [re, get] of RULES) {
      if (re.test(l)) { const v = get(profile); return v ? { value: String(v), source: "perfil" } : null; }
    }
    return null;
  }

  // Escolhe, entre as opções de um menu, a que melhor corresponde à resposta.
  function pickOption(options, value) {
    const v = norm(value).toLowerCase();
    if (!v) return -1;
    const texts = options.map(o => norm(o).toLowerCase());
    let i = texts.indexOf(v); if (i >= 0) return i;
    i = texts.findIndex(t => t.startsWith(v)); if (i >= 0) return i;
    i = texts.findIndex(t => t.includes("(" + v + ")") || new RegExp("(^|\\W)" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\W|$)").test(t)); if (i >= 0) return i;
    // números: "6" casa com "6+ years"; se passar do teto, usa a maior faixa
    const n = parseFloat(v);
    if (!isNaN(n)) {
      const nums = texts.map(t => { const m = t.match(/(\d+)/); return m ? parseFloat(m[1]) : NaN; });
      let best = -1; nums.forEach((x, k) => { if (!isNaN(x) && x <= n && (best < 0 || x >= nums[best])) best = k; });
      return best;
    }
    return -1;
  }

  const api = { DEFAULT_PROFILE, RULES, SKIP, norm, answerFor, pickOption };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.PV = api;
})(typeof self !== "undefined" ? self : this);
