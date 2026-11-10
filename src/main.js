// Interface du Dojo : 3 onglets (Formation, Certification, Moi) + écran d'exercice. JS vanille, rendu par innerHTML + délégation d'événements.
import "./style.css";
import { EXERCISES, exById } from "./exercises.js";
import { GROUPS, SKILLS, skillById, skillsOf, groupById } from "./skills.js";
import { LESSONS } from "./skilllessons.js";
import { grade } from "./grader.js";
import { runOps } from "./deck.js";
import { withKeys, hasKeys, ESSENTIALS } from "./keys.js";
import { getProgress, onProgressChange, recordWin, getStreak, totalXp, exportProgress, importProgress, getCerts, getSkips, recordSkip } from "./progress.js";
import { QUESTIONS, getPlacement, savePlacement, acquiredGroups } from "./placement.js";
import * as cloud from "./cloud.js";
import { icon } from "./ui.js";
import { esc } from "./xml.js";
import { slideSvg } from "./preview.js";
import { downloadExercise, readUpload } from "./webfile.js";
import * as ppt from "./ppt.js";
import { getCaps, refreshCaps, compatible, requirementsOf, maxSet, SET_INFO } from "./caps.js";
import { detectOs, OS_LABEL, appInfo } from "./profile.js";
import { diagnose } from "./diagnostic.js";
import { validateAll } from "./validate.js";

// ───── petit stockage local (jamais bloquant) ─────
const store = {
  get(k, d) { try { const v = localStorage.getItem("powerpoint-dojo." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("powerpoint-dojo." + k, JSON.stringify(v)); } catch { /* rien */ } },
};

let inOffice = false; // vrai quand le Dojo tourne dans un volet PowerPoint
const state = { tab: "formation", screen: null, skill: null, id: null, loaded: false, loading: false, warn: false, result: null, won: false, tip: false, hint: false, sol: false, startedAt: 0, confirmed: {}, deck: null, fileDeck: null, diag: null, val: null, msg: "", exam: null, quiz: null };
const withApi = EXERCISES.map((e) => Object.assign(e, requirementsOf(e)));
const visible = (e) => !inOffice || compatible(e);
const os = () => detectOs();
const k = (t) => esc(withKeys(t, os() === "web" ? "win" : os()));
const doneMap = () => {
  const d = { ...getProgress().done };
  for (const unit of Object.keys(getSkips())) {
    const g = unit.replace("grp:", "");
    for (const e of EXERCISES) if (skillById(e.skill)?.group === g && !d[e.id]) d[e.id] = { xp: 0, skipped: true };
  }
  return d;
};
const fmtTime = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
const inkFor = (hex) => { const v = parseInt(hex.slice(1), 16); const l = 0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255); return l > 160 ? "#1d1f23" : "#fff"; };

// ───── maîtrise d'une compétence et prochaine étape ─────
const exOf = (skillId) => withApi.filter((e) => e.skill === skillId && visible(e)).sort((a, b) => a.level - b.level);
function mastery(skillId) {
  const list = exOf(skillId), done = doneMap();
  const n = list.filter((e) => done[e.id]).length;
  return { n, total: list.length, pct: list.length ? n / list.length : 0 };
}
function nextStep() {
  for (const sk of SKILLS) {
    const m = mastery(sk.id);
    if (m.total && m.n < m.total) {
      const ex = exOf(sk.id).find((e) => !doneMap()[e.id]);
      const lesson = !m.n && LESSONS[sk.id] && !store.get("seen", []).includes(sk.id);
      return { skill: sk, ex, lesson };
    }
  }
  return { finished: true };
}
const welcomed = () => store.get("welcome", false) || Object.keys(doneMap()).length > 0;

// ───── vues ─────
function bottomNav() {
  const t = (id, label, ic) => `<button class="${state.tab === id && !state.screen ? "on" : ""}" data-action="tab" data-id="${id}">${icon(ic, 22)}<span>${label}</span></button>`;
  return `<nav class="bnav">${t("formation", "Formation", "route")}${t("certif", "Certification", "trophy")}${t("moi", "Moi", "user")}</nav>`;
}

function welcomeView() {
  return `<div class="welcome"><h1>Bienvenue au PowerPoint Dojo</h1>
    <p class="lead">Tu t'entraînes dans ta vraie présentation. Le Dojo écrit l'exercice dans PowerPoint, tu le fais avec les vrais boutons du ruban, et il corrige ce qu'il lit.</p>
    <ol class="how-steps">
      <li>${icon("book", 24)}<div><b>Une leçon d'une minute</b><span>L'idée, le chemin dans le ruban, les pièges.</span></div></li>
      <li>${icon("pencil", 24)}<div><b>Des exercices un par un</b><span>Une liste de contrôle te montre ce qui est bon.</span></div></li>
      <li>${icon("trophy", 24)}<div><b>Une certification sur 100</b><span>Pour mesurer où tu en es (bientôt).</span></div></li>
    </ol>
    <button class="btn-main" data-action="start">Commencer</button>
    ${inOffice ? `<p class="note">Important : le Dojo <b>remplace le contenu de la présentation ouverte</b> à chaque exercice. Ouvre une présentation vide dédiée (Fichier → Nouveau).</p>` : `<p class="note">Tu es en mode fichier : tu télécharges chaque exercice en .pptx, tu le fais dans PowerPoint, puis tu déposes le fichier. Pour une correction en direct, installe le Dojo dans PowerPoint (page /install).</p>`}</div>`;
}

function formationView() {
  const st = nextStep();
  const streak = getStreak();
  const done = doneMap();
  const all = withApi.filter(visible), nDone = all.filter((e) => done[e.id]).length;
  let next;
  if (st.finished) next = `<div class="next"><h2>Chapitre terminé</h2><p>Les prochains chapitres arrivent par lots (voir « Le parcours »).</p></div>`;
  else if (st.lesson) next = `<div class="next"><h2>${esc(st.skill.name)}</h2><p>Une leçon de 1 minute, puis des exercices un par un.</p><button class="btn-main" data-action="skill" data-id="${st.skill.id}">${icon("book", 16)} Commencer la leçon</button></div>`;
  else next = `<div class="next"><h2>${esc(st.ex.title)}</h2><p>${esc(st.skill.name)} · environ ${Math.max(2, Math.round(st.ex.xp / 6))} min</p><button class="btn-main" data-action="open" data-id="${st.ex.id}">${icon("play", 14)} ${nDone ? "Continuer" : "Commencer"}</button></div>`;
  const OFFSETS = [0, 38, 62, 38, 0, -38, -62, -38];
  let no = 0;
  const trail = GROUPS.map((g) => {
    no++;
    const list = skillsOf(g.id);
    if (!list.length) return `<section class="unit" style="--c:${g.color};--ink-c:${g.ink}"><div class="unit-head"><div><small>Chapitre ${no} · bientôt</small><b>${esc(g.name)}</b><small>${esc(g.blurb)}</small></div></div></section>`;
    const n = list.filter((s) => { const m = mastery(s.id); return m.total && m.n === m.total; }).length;
    const nodes = list.map((s, i) => {
      const m = mastery(s.id), cur = st.skill?.id === s.id;
      const stt = m.total && m.n === m.total ? "ok" : cur ? "cur" : m.n ? "part" : "todo";
      return `<li class="node ${stt}" style="--dx:${OFFSETS[i % OFFSETS.length]}px;--p:${Math.round(100 * m.pct)}">
        ${cur ? `<span class="bubble">${st.lesson ? "Commencer" : "Continuer"}</span>` : ""}
        <button data-action="skill" data-id="${s.id}" aria-label="${esc(s.name)}">${icon(stt === "ok" ? "check" : stt === "cur" ? "play" : m.n ? "pencil" : "book", 26)}</button>
        <span>${esc(s.name)}</span><small>${m.n}/${m.total}</small></li>`;
    }).join("");
    const jump = getSkips()["grp:" + g.id] ? `<span class="jump got">${icon("bolt", 14)} Validé par test</span>` : `<button class="jump" data-action="exam" data-id="grp:${g.id}">${icon("bolt", 14)} ${n === list.length ? "Test du chapitre" : "Je connais déjà"}</button>`;
    return `<section class="unit" style="--c:${g.color};--ink-c:${g.ink}"><div class="unit-head"><div><small>Chapitre ${no} · ${n}/${list.length}</small><b>${esc(g.name)}</b></div>${jump}</div><ol class="trail">${nodes}</ol></section>`;
  }).join("");
  return `<div class="screen-head"><h1>Formation</h1>${streak ? `<span class="streak">${icon("flame", 15)} ${streak} jour${streak > 1 ? "s" : ""}</span>` : ""}</div>
    <div class="course"><div class="course-line"><span><b>${nDone}</b> exercice${nDone > 1 ? "s" : ""} réussi${nDone > 1 ? "s" : ""} sur ${all.length}</span></div><div class="meter"><i style="width:${Math.round((100 * nDone) / Math.max(1, all.length))}%"></i></div></div>
    <h3 class="sec">Ta prochaine étape</h3>${next}
    <h3 class="sec">Le parcours</h3>
    <p class="note" style="margin:0 0 4px">Tout est ouvert : fais les étapes dans l'ordre, ou va directement où tu veux. Tu peux sauter un chapitre en réussissant son test (4 épreuves, 3 à réussir).</p>
    ${trail}
    ${getPlacement() ? "" : `<button class="tile" data-action="place"><span>${icon("search", 20)}</span><div><b>Test de niveau · 3 min</b><small>Pour sauter les chapitres que tu maîtrises déjà</small></div></button>`}
    ${!inOffice ? `<p class="note">Mode fichier : ouvre le Dojo depuis PowerPoint pour une correction en direct.</p>` : ""}`;
}

function skillView(id) {
  const s = skillById(id), L = LESSONS[id], m = mastery(id), done = doneMap();
  const list = exOf(id), nextEx = list.find((e) => !done[e.id]);
  const cta = nextEx ? `<button class="btn-main" data-action="open" data-id="${nextEx.id}">${icon("play", 14)} ${m.n ? "Exercice suivant" : "Faire le premier exercice"}</button>` : `<p class="note">Tous les exercices de cette compétence sont faits.</p>`;
  store.set("seen", [...new Set([...store.get("seen", []), id])]);
  return `<div class="exbar"><button class="back" data-action="home" aria-label="Retour à la formation">${icon("back", 20)}</button><span class="crumb">Formation</span></div>
    <h1 class="ex-title">${esc(s.name)}</h1>
    <p class="sub">${m.n}/${m.total} exercice${m.total > 1 ? "s" : ""} réussi${m.n > 1 ? "s" : ""}</p>
    ${L ? `<section class="lesson">
      <h3>L'essentiel</h3><p>${esc(L.idea)}</p>
      ${L.path?.length ? `<h3>Où cliquer</h3><ul class="learn">${L.path.map((x) => `<li>${k(x)}</li>`).join("")}</ul>` : ""}
      ${L.example ? `<h3>Exemple</h3><p>${esc(L.example)}</p>` : ""}
      ${L.pitfalls?.length ? `<h3>Les pièges</h3><ul class="learn">${L.pitfalls.map((x) => `<li>${k(x)}</li>`).join("")}</ul>` : ""}
    </section>` : ""}
    <div class="sticky-cta">${cta}</div>
    <h3 class="sec">Les exercices</h3>${list.map((e) => `<button class="card ${done[e.id] ? "done" : ""}" data-action="open" data-id="${e.id}"><span class="t">${esc(e.title)}</span><span class="meta">${done[e.id] ? `✓ ${done[e.id].xp} XP` : `${e.xp} XP`}</span></button>`).join("")}`;
}

function quizView() {
  const q = state.quiz;
  if (q.i >= QUESTIONS.length) {
    const ok = acquiredGroups(q.answers), score = q.answers.filter((a, i) => a === QUESTIONS[i].answer).length;
    return `<div class="exbar"><button class="back" data-action="home" aria-label="Retour">${icon("back", 20)}</button><span class="crumb">Test de niveau</span></div>
      <h1 class="ex-title">${score}/${QUESTIONS.length} bonnes réponses</h1>
      ${ok.length ? `<p class="lead">Tu maîtrises déjà : ${ok.map((g) => `<b>${esc(groupById(g).name)}</b>`).join(", ")}. Tu peux sauter ${ok.length > 1 ? "ces chapitres" : "ce chapitre"}.</p>${ok.filter((g) => !getSkips()["grp:" + g]).map((g) => `<button class="btn-main" style="margin-bottom:8px" data-action="skipgrp" data-id="${g}">Valider « ${esc(groupById(g).name)} »</button>`).join("")}` : `<p class="lead">Rien à sauter pour l'instant : la formation commence au début, c'est le bon endroit.</p>`}
      <button class="btn" data-action="home">Retour à la formation</button>`;
  }
  const qq = QUESTIONS[q.i];
  return `<div class="exbar"><button class="back" data-action="home" aria-label="Quitter">${icon("back", 20)}</button><span class="crumb">Test de niveau · ${q.i + 1}/${QUESTIONS.length}</span></div>
    <h2 class="ex-title">${esc(qq.q)}</h2>
    <div class="quiz">${qq.options.map((o, n) => `<button class="opt ${q.picked == null ? "" : n === qq.answer ? "good" : n === q.picked ? "bad" : ""}" ${q.picked != null ? "disabled" : ""} data-action="pick" data-id="${n}">${esc(o)}</button>`).join("")}${q.picked == null ? `<button class="opt skip" data-action="pick" data-id="-1">Je ne sais pas</button>` : ""}</div>
    ${q.picked != null ? `<p class="note">${esc(qq.why)}</p><button class="btn-main" data-action="qnext">${q.i + 1 < QUESTIONS.length ? "Question suivante" : "Voir mon résultat"}</button>` : ""}`;
}

function examResultView() {
  const e = state.exam, ok = e.passed >= 3;
  return `<div class="win ${ok ? "" : "lose"}"><div class="win-head">${icon(ok ? "check" : "x", 26)}<div><b>${ok ? "Test réussi" : "Test non réussi"}</b><small>${e.passed}/${e.ids.length} épreuves réussies (3 requises)</small></div></div>
    <p style="margin-top:10px">${ok ? "Tous les exercices du chapitre sont validés : tu peux passer à la suite." : "Pas de souci : refais les exercices du chapitre, puis retente le test."}</p>
    <div class="win-actions"><button class="btn-main" data-action="examend">Retour à la formation</button></div></div>`;
}

function certView() {
  const certs = getCerts();
  return `<div class="screen-head"><h1>Certification</h1></div>
    <div class="cert-hero intro"><h2>Un score sur 100</h2><p>100 = champion du monde de PowerPoint. Des épreuves tirées au hasard à chaque passage (jamais deux fois le même énoncé), sans aide, notées par niveau.</p><small>Fondamentaux → Pratique courante → Avancé → Expert → Champion · 20 épreuves en 90 min, ou 10 en 40 min (express).</small></div>
    <div class="empty"><b>Bientôt disponible</b><p>La certification arrive au lot 4 (générateurs d'épreuves à graine). Elle sera disponible après la formation, rien n'est verrouillé.</p></div>
    ${certs.length ? `<h3 class="sec">Tes passages</h3>${certs.map((c) => `<div class="tile static"><div><b>${Math.round(c.score)}/100</b><small>${new Date(c.at).toLocaleDateString("fr-FR")}</small></div></div>`).join("")}` : ""}`;
}

function meView() {
  const p = getProgress(), xp = totalXp(), n = Object.keys(p.done).length, st = cloud.getStatus();
  const caps = getCaps();
  const info = appInfo();
  const account = cloud.cloudEnabled()
    ? (cloud.userEmail()
      ? `<p>Connecté : <b>${esc(cloud.userEmail())}</b> · ${esc(st.msg || st.state)}</p><div class="row"><button class="btn" data-action="sync">Synchroniser</button><button class="btn" data-action="signout">Se déconnecter</button></div>`
      : `<p class="note" style="margin:0">Crée un compte pour retrouver ta progression sur tous tes appareils (Mac, Windows…).</p>
         <input class="field" id="em" type="email" placeholder="E-mail" autocomplete="email"><input class="field" id="pw" type="password" placeholder="Mot de passe (6 caractères minimum)" autocomplete="current-password">
         <div class="row"><button class="btn primary" data-action="signin">Se connecter</button><button class="btn" data-action="signup">Créer un compte</button></div>${state.msg ? `<p class="note">${esc(state.msg)}</p>` : ""}`)
    : `<p class="note" style="margin:0">Les comptes ne sont pas encore activés : ta progression est conservée dans ce navigateur/PowerPoint. Utilise la sauvegarde manuelle ci-dessous pour la déplacer.</p>`;
  return `<div class="screen-head"><h1>Moi</h1></div>
    <div class="dash"><div class="dash-top"><div><b>${xp} XP</b><br><small>${n} exercice${n > 1 ? "s" : ""} réussi${n > 1 ? "s" : ""}</small></div><span class="streak">${icon("flame", 15)} ${getStreak()} jour${getStreak() > 1 ? "s" : ""}</span></div></div>
    <h3 class="sec">Compte</h3><div class="dash">${account}</div>
    <h3 class="sec">Sauvegarde manuelle</h3>
    <div class="dash"><div class="row" style="margin:0"><button class="btn" data-action="export">Copier ma progression</button><button class="btn" data-action="import">Restaurer</button></div>
      <textarea class="field" id="bk" rows="3" placeholder="Colle ici une sauvegarde pour la restaurer"></textarea>${state.msg && !cloud.cloudEnabled() ? `<p class="note">${esc(state.msg)}</p>` : ""}</div>
    <h3 class="sec">Ton PowerPoint</h3>
    <div class="dash"><p style="margin:0">${inOffice ? `${esc(OS_LABEL[detectOs()])} · ${esc(info.platform)} ${esc(info.version)}<br><small class="note">API : PowerPointApi ${maxSet(caps) ?? "?"}</small>` : "Mode fichier (hors PowerPoint)"}</p>
      <div class="row"><button class="btn" data-action="diag">Diagnostic de ton PowerPoint</button></div></div>
    <h3 class="sec">Raccourcis à connaître</h3>
    <div class="dash"><table class="keys">${ESSENTIALS.map(([a, b]) => `<tr><td>${esc(a)}</td><td><kbd>${k(b)}</kbd></td></tr>`).join("")}</table></div>
    <p class="note">PowerPoint Dojo · ${EXERCISES.length} exercices.</p>`;
}

function diagView() {
  const steps = state.diag;
  return `<div class="exbar"><button class="back" data-action="home" aria-label="Retour">${icon("back", 20)}</button><span class="crumb">Moi</span></div>
    <h1 class="ex-title">Diagnostic de ton PowerPoint</h1>
    <p class="sub">Teste ce que le Dojo sait écrire et relire dans ta version. Tes diapositives ne sont pas modifiées (le test utilise des diapositives temporaires).</p>
    ${!inOffice ? `<div class="result">Ouvre le Dojo depuis PowerPoint (onglet Accueil → Ouvrir le Dojo) pour lancer le diagnostic.</div>` : `<div class="row"><button class="btn primary" data-action="rundiag">${steps ? "Relancer" : "Lancer le diagnostic"}</button></div>`}
    ${steps ? `<div class="cl-card"><ul class="cl">${steps.map((s) => `<li class="${s.ok === true ? "cl-ok" : s.ok === false ? "cl-ko" : "cl-wait"}">${icon(s.ok === true ? "check" : s.ok === false ? "x" : "dot", 18)}<div><div class="cl-label">${esc(s.label)}</div>${s.note ? `<div class="${s.ok === false ? "cl-msg" : "cl-label"}"><small>${esc(s.note)}</small></div>` : ""}</div></li>`).join("")}</ul></div>` : ""}
    <h3 class="sec">Contrôle qualité</h3>
    <p class="note" style="margin:0 0 8px">Joue la solution de chaque exercice dans ton PowerPoint et vérifie que le correcteur la valide. <b>Remplace le contenu de la présentation ouverte</b> : lance-le dans une présentation vide. À relancer sur chaque version de PowerPoint testée.</p>
    ${inOffice ? `<div class="row"><button class="btn" data-action="runval" ${state.val?.running ? "disabled" : ""}>${state.val?.running ? `En cours… ${state.val.i}/${state.val.n}` : "Lancer le contrôle qualité"}</button></div>` : ""}
    ${state.val?.out ? `<div class="cl-card"><div class="cl-head"><b>${state.val.out.filter((o) => o.ok).length}/${state.val.out.length} exercices validés</b><span>${state.val.skipped ? state.val.skipped + " ignorés (version d'API insuffisante)" : ""}</span></div><ul class="cl">${state.val.out.filter((o) => !o.ok).map((o) => `<li class="cl-ko">${icon("x", 18)}<div><div class="cl-label">${esc(o.id)}</div><div class="cl-msg">${esc(o.error ?? (o.startPasses ? "le départ passe déjà" : "") + " " + (o.fails ?? []).join(" ; "))}</div></div></li>`).join("") || `<li class="cl-ok">${icon("check", 18)}<div class="cl-label">Tout est validé.</div></li>`}</ul></div>` : ""}`;
}

// ───── écran d'exercice ─────
const curEx = () => exById(state.id);
function checklistView(ex, res) {
  const items = res?.items ?? ex.answers.map((a) => ({ label: a.label, ok: null, confirm: a.kind === "confirm" }));
  const nOk = items.filter((i) => i.ok).length;
  return `<div class="cl-card"><div class="cl-head"><b>Ce que ta présentation doit contenir</b><span>${nOk}/${items.length}</span></div><ul class="cl">${items.map((i, n) => `<li class="${i.ok === true ? "cl-ok" : i.ok === false ? "cl-ko" : "cl-wait"}">${icon(i.ok === true ? "check" : i.ok === false ? "x" : "dot", 18)}<div><div class="cl-label">${esc(i.label)}${i.skip ? " <small>(non vérifiable avec ta version de PowerPoint)</small>" : ""}</div>${i.ok === false && i.msg ? `<div class="cl-msg">${esc(i.msg)}</div>` : ""}${i.confirm && !i.ok ? `<button class="btn" data-action="confirm" data-id="${esc(ex.answers[n].id)}">C'est fait</button>` : ""}</div></li>`).join("")}</ul></div>`;
}

function exerciseView() {
  const ex = curEx();
  const g = groupById(skillById(ex.skill)?.group);
  const preview = state.deck ?? runOps(ex.setup);
  const actions = inOffice
    ? state.warn
      ? `<div class="result" style="border-color:var(--bad)"><b>Cette présentation contient déjà du travail.</b><br>Le Dojo va <b>remplacer tout son contenu</b> pour écrire l'exercice. Ouvre plutôt une présentation vide (Fichier → Nouveau).<div class="row"><button class="btn primary" data-action="accept">Oui, utiliser cette présentation</button><button class="btn" data-action="home">Annuler</button></div></div>`
      : state.loaded
        ? `<div class="live ${state.won ? "" : "on"}">${state.won ? "Exercice réussi" : "● Correction en direct"}</div><div class="row"><button class="btn" data-action="check">Vérifier maintenant</button><button class="link" data-action="load">Recharger l'exercice</button></div>`
        : state.loading ? `<div class="live">Préparation de la présentation dans PowerPoint…</div>` : `<button class="btn-main" data-action="load">${icon("play", 14)} Commencer dans PowerPoint</button>`
    : `<button class="btn-main" data-action="download">1. Télécharger l'exercice (.pptx)</button>
       <label class="btn" style="display:block;text-align:center;margin-top:8px;cursor:pointer">2. Déposer ma présentation<input type="file" accept=".pptx" data-action="upload" hidden></label>`;
  const exam = state.exam;
  const win = exam ? (state.won ? `<div class="win"><div class="win-head">${icon("check", 26)}<div><b>Épreuve réussie</b></div></div><div class="win-actions"><button class="btn-main" data-action="examnext">${exam.i + 1 < exam.ids.length ? "Épreuve suivante" : "Voir mon résultat"}</button></div></div>` : `<div class="row"><button class="btn" data-action="examskip">Passer cette épreuve</button><button class="link" data-action="examquit">Abandonner le test</button></div>`) : state.won ? winPanel(ex) : `<div class="help"><button data-action="tip">${icon("bulb", 16)}<b>Piste</b><small>−10 %</small></button><button data-action="hint">${icon("search", 16)}<b>Indice</b><small>−30 %</small></button><button data-action="solution">${icon("eye", 16)}<b>Solution</b><small>0 XP</small></button></div>`;
  return `<div class="exbar"><button class="back" data-action="${state.fromSkill ? "skill" : "home"}" data-id="${esc(ex.skill)}" aria-label="Retour">${icon("back", 20)}</button><div class="crumb">${exam ? `<b>Test · ${esc(exam.name)}</b> · épreuve ${exam.i + 1}/${exam.ids.length}` : `${esc(g?.name ?? "")} · ${esc(skillById(ex.skill)?.name ?? "")}`}</div><span class="pill">${icon("clock", 13)} <span id="timer">0:00</span></span></div>
    <h2 class="ex-title">${esc(ex.title)}</h2>
    <p class="ex-story">${esc(ex.story)}</p>
    ${ex.api && ex.api !== "1.4" ? `<p class="note" style="margin:0 0 6px"><span class="tag ${inOffice && !compatible(ex) ? "bad" : ""}">API ${esc(ex.api)}</span> ${inOffice && !compatible(ex) ? "Ton PowerPoint est trop ancien pour corriger cet exercice." : ""}</p>` : ""}
    <details class="data" ${inOffice ? "" : "open"}><summary>${icon("eye", 16)} Voir la diapositive de départ</summary><div style="display:grid;gap:6px;margin-top:6px">${preview.slides.map((_, i) => slideSvg(preview, i)).join("")}</div></details>
    <div class="actions">${actions}</div>
    ${checklistView(ex, state.result)}
    ${win}
    ${state.tip ? `<div class="hint"><b>Piste</b><ol style="margin:6px 0 0;padding-left:20px">${ex.steps.map((s) => `<li>${k(s)}</li>`).join("")}</ol></div>` : ""}
    ${state.hint ? `<div class="hint"><b>Indice</b> · ${k(ex.hint)}</div>` : ""}
    ${state.sol ? `<div class="hint"><b>Solution</b> · ${inOffice ? "écrite dans ta présentation. Regarde ce qui a changé, puis lis la méthode." : "voici l'état attendu."} Cet exercice ne rapporte pas de XP : refais-le plus tard.<ol style="margin:6px 0 0;padding-left:20px">${ex.steps.map((s) => `<li>${k(s)}</li>`).join("")}</ol></div>${!inOffice ? `<div style="display:grid;gap:6px;margin-top:6px">${state.solDeck.slides.map((_, i) => slideSvg(state.solDeck, i)).join("")}</div>` : ""}` : ""}`;
}

function winPanel(ex) {
  const res = state.final;
  const L = LESSONS[ex.skill];
  const done = doneMap();
  const next = exOf(ex.skill).find((e) => !done[e.id] && e.id !== ex.id) ?? nextStep().ex;
  return `<div class="win"><div class="win-head">${icon("check", 26)}<div><b>Réussi</b><small>+${res?.xp ?? 0} XP · ${fmtTime(res?.ms ?? 0)}</small></div></div>
    ${ex.hint ? `<h3>La méthode</h3><p>${k(ex.hint)}</p>` : ""}
    ${L?.pitfalls?.length ? `<h3>Les pièges</h3><ul class="learn">${L.pitfalls.map((x) => `<li>${k(x)}</li>`).join("")}</ul>` : ""}
    <div class="win-actions">${next ? `<button class="btn-main" data-action="open" data-id="${next.id}">${icon("play", 14)} Exercice suivant</button>` : ""}<button class="btn" data-action="home">Retour</button></div></div>`;
}

// ───── rendu ─────
let timerId = null, pollId = null;
function render() {
  const app = document.getElementById("app");
  let body;
  if (!welcomed() && !state.screen) body = welcomeView();
  else if (state.screen === "quiz") body = quizView();
  else if (state.exam?.done) body = `<div class="exbar"><span class="crumb">Test · ${esc(state.exam.name)}</span></div>` + examResultView();
  else if (state.screen === "ex") body = exerciseView();
  else if (state.screen === "skill") body = skillView(state.skill);
  else if (state.screen === "diag") body = diagView();
  else body = state.tab === "certif" ? certView() : state.tab === "moi" ? meView() : formationView();
  const nav = welcomed() && state.screen !== "ex" ? bottomNav() : "";
  app.className = nav ? "has-nav" : "";
  const scroll = window.scrollY;
  app.innerHTML = body + nav;
  if (state.keepScroll) window.scrollTo(0, scroll);
  state.keepScroll = false;
  clearInterval(timerId);
  if (state.screen === "ex" && !state.won) timerId = setInterval(() => { const t = document.getElementById("timer"); const el = Date.now() - state.startedAt; if (t) t.textContent = fmtTime(el); if (state.exam && el > 300000) { state.exam.i++; advanceExam(); } }, 1000);
}

// ───── logique d'un exercice ─────
function startEx(id, fromSkill) {
  Object.assign(state, { screen: "ex", id, fromSkill: !!fromSkill, loaded: false, loading: false, warn: false, result: null, won: false, final: null, tip: false, hint: false, sol: false, solDeck: null, startedAt: Date.now(), confirmed: {}, deck: null, fileDeck: null });
  render();
  window.scrollTo(0, 0);
  if (inOffice) loadEx(); // dans PowerPoint, l'exercice s'écrit tout seul
}

async function loadEx(force = false) {
  const ex = curEx();
  state.loading = true; state.warn = false; render();
  try {
    if (!force && !(await ppt.isDojoDeck()) && (await ppt.deckHasWork())) {
      state.loading = false; state.warn = true;
      return render();
    }
    await ppt.markDojoDeck();
    await ppt.loadSetup(ex.setup);
    Object.assign(state, { loaded: true, loading: false, result: null, startedAt: Date.now() });
    render();
    watch();
  } catch (e) {
    Object.assign(state, { loading: false, result: { items: [], error: e.message } });
    state.msg = e.message;
    render();
  }
}

function watch() {
  clearInterval(pollId);
  if (!inOffice) return;
  pollId = setInterval(() => { if (state.screen === "ex" && state.loaded && !state.won && !state.busy) runCheck(true); }, 3000);
}

async function runCheck(silent = false) {
  const ex = curEx();
  state.busy = true;
  try {
    // mode fichier : un exercice 100 % « à confirmer » n'a rien à lire dans un fichier, on corrige sur son départ
    const deck = inOffice ? await ppt.readDeck({ xml: !!ex.xml }) : state.fileDeck ?? (ex.answers.every((a) => a.kind === "confirm") ? runOps(ex.setup) : null);
    if (!deck) return;
    const res = grade(ex, deck, { confirmed: state.confirmed });
    state.result = res;
    if (res.pass && !state.won) {
      const ms = Date.now() - state.startedAt;
      if (state.exam) { Object.assign(state, { won: true, final: { xp: 0, ms } }); state.exam.passed++; state.busy = false; state.keepScroll = true; return render(); }
      const xp = state.sol ? 0 : ex.xp - Math.ceil(ex.xp * (state.hint ? 0.3 : state.tip ? 0.1 : 0));
      recordWin(ex.id, xp, ms);
      cloud.schedulePush();
      Object.assign(state, { won: true, final: { xp, ms } });
    }
  } catch (e) {
    if (!silent) state.result = { items: [], error: e.message };
  } finally {
    state.busy = false;
  }
  state.keepScroll = true;
  render();
}

// Test d'un chapitre : 4 épreuves tirées dans ses exercices (compétences variées), 3 à réussir, 5 min chacune, sans aide.
function beginExam(unit) {
  const gid = unit.replace("grp:", "");
  const pool = withApi.filter((e) => skillById(e.skill)?.group === gid && visible(e) && !e.answers.some((a) => a.kind === "confirm"));
  const bySkill = {};
  for (const e of [...pool].sort(() => Math.random() - 0.5)) (bySkill[e.skill] ??= []).push(e);
  const ids = [];
  while (ids.length < Math.min(4, pool.length)) for (const l of Object.values(bySkill).sort(() => Math.random() - 0.5)) if (l.length && ids.length < 4) ids.push(l.shift().id);
  state.exam = { unit, name: groupById(gid).name, ids, i: 0, passed: 0, done: false };
  startEx(ids[0]);
}
function advanceExam() {
  const e = state.exam;
  clearInterval(timerId);
  if (e.i >= e.ids.length) {
    e.done = true;
    if (e.passed >= 3) { recordSkip(e.unit); cloud.schedulePush(); }
    state.screen = null; clearInterval(pollId);
    return render();
  }
  startEx(e.ids[e.i]);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); } catch {
    const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
  }
}

const actions = {
  tab(el) { Object.assign(state, { tab: el.dataset.id, screen: null }); },
  home() { state.screen = null; state.quiz = null; clearInterval(pollId); },
  start() { store.set("welcome", true); },
  skill(el) { if (!el.dataset.id) { state.screen = null; } else Object.assign(state, { screen: "skill", skill: el.dataset.id }); window.scrollTo(0, 0); },
  open(el) { startEx(el.dataset.id, state.screen === "skill"); },
  async load() { await loadEx(true); },
  async accept() { await loadEx(true); },
  async check() { await runCheck(false); },
  exam(el) { beginExam(el.dataset.id); return "skip"; },
  examnext() { state.exam.i++; advanceExam(); return "skip"; },
  examskip() { state.exam.i++; advanceExam(); return "skip"; },
  examquit() { state.exam = null; state.screen = null; clearInterval(pollId); },
  examend() { state.exam = null; },
  place() { state.screen = "quiz"; state.quiz = { i: 0, answers: [], picked: null }; },
  pick(el) { const n = Number(el.dataset.id); state.quiz.picked = n; state.quiz.answers[state.quiz.i] = n; },
  qnext() { const q = state.quiz; q.i++; q.picked = null; if (q.i >= QUESTIONS.length) savePlacement({ answers: q.answers, at: Date.now() }); },
  skipgrp(el) { recordSkip("grp:" + el.dataset.id); cloud.schedulePush(); },
  tip() { state.tip = true; },
  hint() { state.hint = true; state.tip = true; },
  async solution() {
    const ex = curEx();
    state.sol = true;
    if (inOffice) {
      try { await ppt.loadSetup(ex.setup); await ppt.applyOps(ex.sol, { off: 0 }); state.loaded = true; } catch (e) { state.msg = e.message; }
    } else state.solDeck = runOps([...ex.setup, ...ex.sol]);
  },
  confirm(el) { state.confirmed[el.dataset.id] = true; runCheck(false); return "skip"; },
  async download() { await downloadExercise(curEx()); },
  async diag() { Object.assign(state, { screen: "diag" }); },
  async rundiag() { state.diag = []; render(); state.diag = await diagnose((s) => { state.diag = [...s]; render(); }); },
  async runval() {
    state.val = { running: true, i: 0, n: 0 }; render();
    const r = await validateAll(withApi, (i, n) => { state.val = { running: true, i, n }; render(); });
    state.val = { out: r.out, skipped: r.skipped };
  },
  async export() { await copyText(exportProgress()); state.msg = "Progression copiée : colle-la quelque part en lieu sûr."; },
  import() { try { const n = importProgress(document.getElementById("bk").value); state.msg = `Progression restaurée (${n} exercices).`; } catch (e) { state.msg = e.message; } },
  async signin() { try { await cloud.signIn(val("em"), val("pw")); state.msg = ""; } catch (e) { state.msg = e.message; } },
  async signup() { try { const r = await cloud.signUp(val("em"), val("pw")); state.msg = r.needsConfirm ? "Vérifie ta boîte mail pour confirmer ton compte." : ""; } catch (e) { state.msg = e.message; } },
  signout() { cloud.signOut(); },
  async sync() { await cloud.syncNow(); },
};
const val = (id) => document.getElementById(id)?.value ?? "";

document.addEventListener("click", async (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el || el.tagName === "INPUT") return;
  const fn = actions[el.dataset.action];
  if (!fn) return;
  const r = await fn(el);
  if (r !== "skip") render();
});
document.addEventListener("change", async (ev) => {
  const el = ev.target;
  if (el.dataset?.action === "upload" && el.files?.[0]) {
    try {
      state.fileDeck = await readUpload(el.files[0]);
      await runCheck(false);
    } catch (e) {
      state.result = { items: [], error: "Fichier illisible : " + e.message };
      render();
    }
  }
});

// ───── démarrage ─────
function boot() {
  inOffice = ppt.hasOffice() && (() => { try { return Office.context?.host != null; } catch { return false; } })();
  if (inOffice) refreshCaps();
  onProgressChange(() => {});
  cloud.init();
  cloud.onStatus(() => { if (state.tab === "moi" && !state.screen) render(); });
  render();
}
if (typeof Office !== "undefined" && Office.onReady) Office.onReady(() => boot());
else boot();
if (/[?&]debug\b/.test(location.search)) window.__dojo = { state, actions, render, startEx }; // outil de test, inactif sans ?debug
