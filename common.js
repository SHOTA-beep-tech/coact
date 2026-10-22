/* COACT 共通スクリプト（全ページ共通） */

// ============ ここを書き換えてください ============
// Google Apps Script をデプロイした後に発行される「ウェブアプリURL」を貼り付けます。
// 空欄のままだと「デモ表示」になり、サンプルデータで画面の見た目だけ確認できます。
const GAS_ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbznX6lf558KRJvnuOQ6o_ku0xboyE9PBxItOAuBGcV-E1c7-xmXK-pbQC0iMcIEokOK/exec";
// ================================================

const SERVICE_NAME = "COACT";
const DEMO = !GAS_ENDPOINT_URL;

const INDUSTRIES = [
  "不動産", "建設・リフォーム", "IT・Web", "広告・マーケティング", "飲食",
  "美容・健康", "保険・金融", "士業（税理士・弁護士等）", "人材・教育", "医療・介護",
  "小売・物販・EC", "製造", "運輸・物流", "通信・電気・ガス", "コンサルティング",
  "エンタメ・クリエイティブ", "会社員・その他"
];


const AGENCY_STANCES = [
  "代理店を募集している",
  "代理店として扱える商材を探している",
  "どちらも",
  "特になし"
];
// 「代理店を探す」ページに“代理店になりたい会員”として表示する区分
const AGENT_SEEKER_STANCES = ["代理店として扱える商材を探している", "どちらも"];

const TOKEN = new URLSearchParams(location.search).get("token") || "";

// プロフィール入力項目（登録ページ・マイページ共通）
const PROFILE_SECTIONS = [
  { title: "基本情報", fields: [
    { key: "name", label: "お名前", type: "text", required: true, placeholder: "例：山田 太郎" },
    { key: "company", label: "会社名・屋号", type: "text", placeholder: "例：株式会社〇〇／個人の方は屋号・勤務先・「個人」など" },
    { key: "title", label: "役職・肩書き", type: "text", placeholder: "例：代表取締役／営業／フリーランス" },
    { key: "industry", label: "業種", type: "select", required: true, options: INDUSTRIES, help: "会員一覧ではこの業種ごとに表示されます" },
    { key: "area", label: "活動エリア", type: "text", required: true, maxlength: 100, placeholder: "例：大阪府全域・兵庫県（神戸市）／全国・オンライン対応可" },
  ]},
  { title: "お仕事について", fields: [
    { key: "business", label: "事業内容・お仕事内容", type: "textarea", required: true, placeholder: "どんなお仕事をしているか、どんな商品・サービスを扱っているか" },
    { key: "vision", label: "ビジョン・今後やりたいこと", type: "textarea" },
    { key: "wantAsCustomer", label: "お客様として繋がりたい人", type: "textarea", placeholder: "例：新築を検討している方、店舗を出したい方" },
    { key: "wantAsPartner", label: "協業・提携として繋がりたい人", type: "textarea", placeholder: "例：不動産会社、リフォーム会社、保険代理店" },
    { key: "connectedIndustries", label: "つながりのある業種", type: "text", placeholder: "例：不動産、保険、飲食（読点区切り）" },
    { key: "agencyStance", label: "代理店について", type: "select", required: true, options: AGENCY_STANCES, help: "「代理店」ページで、代理店を探している方・なりたい方として表示されます" },
  ]},
  { title: "ひとこと・写真", fields: [
    { key: "tagline", label: "ひとこと", type: "text", required: true, maxlength: 60, placeholder: "例：住まいのことなら何でもご相談ください！" },
    { key: "photo", label: "プロフィール写真", type: "image", large: true, dataKey: "photoDataUrl", urlKey: "photoUrl", removeKey: "removePhoto", help: "会員一覧のカード上部に大きく表示されます。顔写真・ロゴなど（なくても登録できます）" },
  ]},
  // mypageOnly: 登録ページには出さず、マイページの編集画面だけに出す
  { title: "会員限定クーポン", mypageOnly: true, fields: [
    { key: "couponCode", label: "クーポンコード", type: "text", maxlength: 30, placeholder: "例：COACT10", help: "COACT会員だけに表示されます。会員がこのコードを伝えると割引を受けられる、という使い方ができます" },
    { key: "couponDetail", label: "割引内容・使い方", type: "textarea", maxlength: 200, placeholder: "例：初回ご利用10%OFF。ご予約時にコードをお伝えください（2026年12月末まで）" },
  ]},
  { title: "つながった相手にだけ見せる連絡先", lead: "「繋がりたい」を承認し合った相手にだけ表示されます。どれか1つ以上の登録をおすすめします。", fields: [
    { key: "lineUrl", label: "LINE友だち追加URL", type: "url", placeholder: "例：https://line.me/ti/p/xxxxxxxx" },
    { key: "lineQr", label: "LINE QRコード画像", type: "image", dataKey: "lineQrDataUrl", urlKey: "lineQrUrl", removeKey: "removeLineQr" },
    { key: "instagramUrl", label: "InstagramのURL", type: "url", placeholder: "例：https://www.instagram.com/xxxxxxxx" },
  ]},
  { title: "運営への連絡先（他の会員には公開されません）", fields: [
    { key: "email", label: "メールアドレス", type: "email", required: true, placeholder: "例：taro@example.com", help: "マイページの専用リンクや「繋がりたい」のお知らせをお送りします" },
    { key: "phone", label: "電話番号", type: "tel", required: true, placeholder: "例：090-1234-5678" },
  ]},
];

// 他の会員に公開する項目（「詳細を見る」で全項目を表示）。連絡先・SNS・画像は含めない
const PRIVATE_PROFILE_KEYS = ["email", "phone", "lineUrl", "lineQr", "instagramUrl", "photo"];
// クーポンは「詳細を見る」の一覧ではなく、カード内の専用の枠に表示する
const COUPON_KEYS = ["couponCode", "couponDetail"];
const PUBLIC_PROFILE_FIELDS = PROFILE_SECTIONS.flatMap(s => s.fields).filter(f => !PRIVATE_PROFILE_KEYS.includes(f.key) && !COUPON_KEYS.includes(f.key));

// ---------------- 汎用ヘルパー ----------------

function esc(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function withToken(path) {
  return TOKEN ? path + "?token=" + encodeURIComponent(TOKEN) : path;
}

function safeUrl(url) {
  return /^(https?:\/\/|[\w-]+\.html$)/i.test(String(url || "")) ? url : "";
}

function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return String(value);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// 会員専用ページで読み込めなかったときの表示（承認待ち・非公開の場合は理由を表示）
function showAccessError(err) {
  const screen = document.getElementById("screen-error");
  const messages = {
    pending: ["運営の承認をお待ちください", "このページは、運営の承認後にご利用いただけます。承認されるとメールでお知らせします。それまでの間も、マイページでご自身のプロフィールの確認・編集ができます。"],
    hidden: ["現在このページはご利用いただけません", "詳しくは運営までお問い合わせください。"],
  };
  if (screen && messages[err]) {
    screen.innerHTML = `<div class="state-card">
      <div class="state-card__icon">${icon(err === "pending" ? "clock" : "alert")}</div>
      <div class="state-card__title">${messages[err][0]}</div>
      <div class="state-card__body">${messages[err][1]}</div>
      <div style="margin-top:20px"><a class="btn btn--primary" href="${withToken("mypage.html")}">マイページへ</a></div>
    </div>`;
  }
  showOnly("screen-error");
}

function showOnly(id) {
  let target = null;
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.toggle("active", s.id === id);
    if (s.id === id) target = s;
  });
  const top = target ? target.getBoundingClientRect().top + window.scrollY - 100 : 0;
  window.scrollTo({ top: top > 300 ? top : 0, behavior: "smooth" });
}

function toast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("show"), 2600);
}

// 画像を最大 maxSize px に縮小して dataURL に変換（送信サイズを抑えるため）
function readImageAsDataUrl(file, maxSize = 900) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result);
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------------- 通信 ----------------

async function apiGet(action, params = {}) {
  if (DEMO) return Demo.get(action, params);
  const q = new URLSearchParams({ action, ...params });
  const res = await fetch(GAS_ENDPOINT_URL + "?" + q.toString());
  return res.json();
}

// Apps Script は POST の返事を読めない（no-cors）ため、送信後は必要に応じて apiGet で再取得します
async function apiPost(action, data = {}) {
  if (DEMO) return Demo.post(action, data);
  const fd = new FormData();
  fd.append("action", action);
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
  await fetch(GAS_ENDPOINT_URL, { method: "POST", mode: "no-cors", body: fd });
  return { ok: true };
}

// ---------------- ヘッダー・フッター ----------------

function renderHeader(active) {
  const links = TOKEN ? [
    ["mypage", "マイページ", "mypage.html"],
    ["members", "会員を探す", "members.html"],
    ["agency", "代理店", "agency.html"],
    ["events", "交流会・商談会", "events.html"],
    ["ads", "広告掲載", "ads.html"],
  ] : [
    ["register", "マイページ作成", "index.html"],
    ["ads", "広告掲載", "ads.html"],
  ];
  const nav = links.map(([key, label, href]) =>
    `<a href="${withToken(href)}" class="${key === active ? "active" : ""}">${label}</a>`).join("");
  const html = `
    ${DEMO ? `<div class="demo-banner">デモ表示中：サンプルデータを表示しています（送信内容は保存されません）</div>` : ""}
    <header class="header"><div class="header__inner">
      <a class="logo" href="${withToken(TOKEN ? "mypage.html" : "index.html")}">CO<span>ACT</span></a>
      <nav class="nav">${nav}</nav>
    </div></header>`;
  document.body.insertAdjacentHTML("afterbegin", html);
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="footer"><div class="footer__inner">
      <span class="logo">CO<span>ACT</span></span>
      <span class="footer__links">
        <a href="${withToken("ads.html")}">広告掲載について</a>
        <a href="${withToken("terms.html")}">利用規約</a>
        <a href="${withToken("privacy.html")}">プライバシーポリシー</a>
        <a href="${withToken("tokushoho.html")}">特定商取引法に基づく表記</a>
        <span>© ${new Date().getFullYear()} ${SERVICE_NAME}</span>
      </span>
    </div></footer>`);
  hydrateIcons();
}

// ---------------- アイコン（線画SVG） ----------------

const ICON_PATHS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l7 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M18 8.5a5 5 0 0 1 0 7"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  yen: '<path d="M6 3l6 8 6-8M12 11v10M7 13h10M7 17h10"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
};

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ""}</svg>`;
}

// HTML内の <span data-icon="名前"></span> をアイコンに置き換える
function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach(el => { el.innerHTML = icon(el.dataset.icon); el.removeAttribute("data-icon"); });
}

// ---------------- プロフィールフォーム ----------------

// opts.mypage: マイページの編集画面（mypageOnly の項目も表示する）
function renderProfileForm(container, opts = {}) {
  container.innerHTML = PROFILE_SECTIONS.filter(s => opts.mypage || !s.mypageOnly).map((section, i) => `
    <div class="form-section">
      <div class="form-section__title"><span class="form-section__num">0${i + 1}</span>${esc(section.title)}</div>
      ${section.lead ? `<div class="form-section__lead">${esc(section.lead)}</div>` : ""}
      ${section.fields.map(renderField).join("")}
    </div>`).join("");

  container.querySelectorAll("[data-image-field]").forEach(wrap => {
    const input = wrap.querySelector("input[type=file]");
    wrap.querySelector("[data-pick]").addEventListener("click", () => input.click());
    wrap.querySelector("[data-remove]").addEventListener("click", () => {
      delete wrap.dataset.value;
      wrap.dataset.removed = "1";
      input.value = "";
      setImagePreview(wrap, "");
    });
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      const dataUrl = await readImageAsDataUrl(file);
      wrap.dataset.value = dataUrl;
      delete wrap.dataset.removed;
      setImagePreview(wrap, dataUrl);
    });
  });
}

function setImagePreview(wrap, url) {
  wrap.querySelector(".image-field__preview").innerHTML = url ? `<img src="${esc(url)}" alt="">` : icon("image");
  wrap.querySelector("[data-pick]").textContent = url ? "画像を変更する" : "画像を設定する";
  wrap.querySelector("[data-remove]").hidden = !url;
}

function renderField(f) {
  const mark = f.required ? `<span class="req">必須</span>` : `<span class="opt">任意</span>`;
  const help = f.help ? `<div class="field-help">${esc(f.help)}</div>` : "";
  const attrs = `id="f-${f.key}" name="${f.key}" ${f.required ? "required" : ""} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""} ${f.maxlength ? `maxlength="${f.maxlength}"` : ""}`;
  let control;
  if (f.type === "textarea") {
    control = `<textarea ${attrs}></textarea>`;
  } else if (f.type === "select") {
    control = `<select ${attrs}><option value="">選択してください</option>${f.options.map(o => `<option>${esc(o)}</option>`).join("")}</select>`;
  } else if (f.type === "image") {
    return `<div class="field"><span class="field-label">${esc(f.label)}${mark}</span>
      <div class="image-field ${f.large ? "image-field--large" : ""}" data-image-field="${f.key}">
        <div class="image-field__preview">${icon("image")}</div>
        <div class="image-field__actions">
          <button type="button" class="btn btn--ghost btn--small" data-pick>画像を設定する</button>
          <button type="button" class="btn btn--ghost btn--small" data-remove hidden>削除する</button>
        </div>
        <input type="file" accept="image/*" hidden>
      </div>${help}</div>`;
  } else {
    control = `<input type="${f.type}" ${attrs}>`;
  }
  return `<div class="field"><label class="field-label" for="f-${f.key}">${esc(f.label)}${mark}</label>${control}${help}</div>`;
}

function fillProfileForm(container, data) {
  PROFILE_SECTIONS.forEach(s => s.fields.forEach(f => {
    if (f.type === "image") {
      setImagePreview(container.querySelector(`[data-image-field="${f.key}"]`), data[f.urlKey] || "");
      return;
    }
    const el = container.querySelector(`[name="${f.key}"]`);
    if (el) el.value = data[f.key] || "";
  }));
}

// フォームの入力値を { key: value } で返す。画像は新しく選ばれたものだけ dataURL で入る
function collectProfileForm(container) {
  const out = {};
  PROFILE_SECTIONS.forEach(s => s.fields.forEach(f => {
    if (f.type === "image") {
      const wrap = container.querySelector(`[data-image-field="${f.key}"]`);
      if (!wrap) return;
      if (wrap.dataset.value) out[f.dataKey] = wrap.dataset.value;
      else if (wrap.dataset.removed) out[f.removeKey] = "1";
      return;
    }
    const el = container.querySelector(`[name="${f.key}"]`);
    if (el) out[f.key] = el.value.trim(); // 表示していない項目（登録ページのクーポンなど）は送らない
  }));
  return out;
}

// プレビュー用：フォームの入力値をカード表示用データに変換
function formToCardData(container, existing = {}) {
  const d = collectProfileForm(container);
  return { ...existing, ...d, photoUrl: d.photoDataUrl || (d.removePhoto ? "" : existing.photoUrl || "") };
}

// ---------------- 会員カード ----------------

function photoHtml(p) {
  if (p.photoUrl) return `<img src="${esc(p.photoUrl)}" alt="${esc(p.name)}さんの写真">`;
  return `<span class="mcard__initial">${esc(String(p.name || "?").trim().charAt(0) || "?")}</span>`;
}

function renderMemberCard(p, opts = {}) {
  const tags = [
    `<span class="badge">${esc(p.industry || "未設定")}</span>`,
    AGENT_SEEKER_STANCES.includes(p.agencyStance) ? `<span class="badge badge--accent">代理店希望</span>` : "",
    ["代理店を募集している", "どちらも"].includes(p.agencyStance) ?`<span class="badge badge--accent">代理店募集中</span>` : "",
    p.couponCode ? `<span class="badge badge--coupon">会員限定クーポン</span>` : "",
  ].join("");
  const coupon = p.couponCode ? `
      <div class="mcard__coupon">
        <div class="mcard__coupon-label">${icon("tag")}COACT会員限定クーポン</div>
        <div class="mcard__coupon-code">${esc(p.couponCode)}</div>
        ${p.couponDetail ? `<div class="mcard__coupon-text">${esc(p.couponDetail)}</div>` : ""}
      </div>` : "";
  // clamp: 一覧で表示する最大行数（超えた分は「…」で省略）
  const row = (label, value, clamp) => value ? `<div class="mcard__row"><div class="mcard__label">${label}</div><div class="mcard__text ${clamp ? "clamp-" + clamp : ""}">${esc(value)}</div></div>` : "";
  const commentCount = (p.comments || []).length;
  return `
    <div class="mcard ${opts.open ? "open" : ""}" data-member="${esc(p.publicId || "")}">
      <div class="mcard__photo">${photoHtml(p)}</div>
      <div class="mcard__head">
        <div class="mcard__name">${esc(p.name)}</div>
        <div class="mcard__org">${esc([p.company, p.title].filter(Boolean).join("　"))}</div>
      </div>
      <div class="mcard__tags">${tags}</div>
      ${p.tagline ? `<div class="mcard__tagline">${esc(p.tagline)}</div>` : ""}
      ${coupon}
      <div class="mcard__body">
        <div class="mcard__summary">
          ${row("活動エリア", p.area, 2)}
          ${row("事業内容・お仕事内容", p.business, 3)}
          ${row("協業・提携として繋がりたい人", p.wantAsPartner, 2)}
        </div>
        <div class="mcard__details">
          ${PUBLIC_PROFILE_FIELDS.map(f => `<div class="mcard__row"><div class="mcard__label">${esc(f.label)}</div><div class="mcard__text ${p[f.key] ? "" : "mcard__text--empty"}">${esc(p[f.key] || "未記入")}</div></div>`).join("")}
        </div>
        ${opts.preview ? "" : `<button type="button" class="link-btn" data-toggle-details>${opts.open ? "閉じる" : "詳細を見る"}</button>`}
      </div>
      ${p.relation === "connected" && !opts.preview ? `<div class="mcard__contacts"><div class="mcard__label">つながった相手の連絡先</div>${contactsHtml(p)}</div>` : ""}
      ${opts.preview ? "" : `
      <div class="mcard__foot">
        <button type="button" class="btn btn--ghost btn--small" data-toggle-comments>${commentLabel(commentCount)}</button>
        ${introButtonHtml(p.relation)}
      </div>
      ${commentsBlockHtml("member", p.publicId, p.comments || [])}`}
    </div>`;
}

// 今月の「繋がりたい」の残り件数（会員一覧・代理店・マイページで共通。毎月1日にリセット）
let INTRO_QUOTA = null;
async function loadIntroQuota() {
  try {
    const q = await apiGet("introQuota", { token: TOKEN });
    if (q && !q.error) INTRO_QUOTA = q;
  } catch (e) {}
  return INTRO_QUOTA;
}
function introQuotaText() {
  if (!INTRO_QUOTA) return "";
  return INTRO_QUOTA.remaining > 0
    ? `今月はあと <b>${INTRO_QUOTA.remaining}</b> 人に「繋がりたい」を送れます（1か月${INTRO_QUOTA.limit}人まで・毎月1日にリセット）`
    : `今月の「繋がりたい」は上限の${INTRO_QUOTA.limit}人に達しました。来月1日から、また送れるようになります。`;
}
function renderIntroQuota() {
  document.querySelectorAll("[data-intro-quota]").forEach(el => {
    el.innerHTML = introQuotaText();
    el.hidden = !INTRO_QUOTA;
  });
}
const introLimitReached = () => INTRO_QUOTA && INTRO_QUOTA.remaining <= 0;

// 「繋がりたい」ボタン：相手との関係によって表示を変える
function introButtonHtml(relation) {
  if (relation === "connected") return `<button type="button" class="btn btn--ghost btn--small" disabled>${icon("check")}つながり済み</button>`;
  if (relation === "sent") return `<button type="button" class="btn btn--ghost btn--small" disabled>${icon("clock")}リクエスト送信済み</button>`;
  if (relation === "received") return `<a class="btn btn--accent btn--small" href="${withToken("mypage.html")}#connections">${icon("mail")}リクエストに返事する</a>`;
  if (introLimitReached()) return `<button type="button" class="btn btn--ghost btn--small" disabled title="来月1日から送れます">今月の上限に達しました</button>`;
  return `<button type="button" class="btn btn--primary btn--small" data-intro>${icon("link")}繋がりたい</button>`;
}

// つながった相手の LINE・Instagram（マイページの「つながった人」と会員カードで共通）
function contactsHtml(p) {
  const line = safeUrl(p.lineUrl);
  const insta = safeUrl(p.instagramUrl);
  const qr = safeUrl(p.lineQrUrl);
  if (!line && !insta && !qr) return `<div class="contacts__empty">この方はまだLINE・Instagramを登録していません。</div>`;
  return `<div class="contacts">
    ${line ? `<a class="btn btn--line btn--small" href="${esc(line)}" target="_blank" rel="noopener">${icon("chat")}LINEで友だち追加</a>` : ""}
    ${insta ? `<a class="btn btn--ghost btn--small" href="${esc(insta)}" target="_blank" rel="noopener">${icon("instagram")}Instagramを見る</a>` : ""}
    ${qr ? `<a class="contacts__qr" href="${esc(qr)}" target="_blank" rel="noopener"><img src="${esc(qr)}" alt="LINEのQRコード"><span>LINE QRコード</span></a>` : ""}
  </div>`;
}

// カード内のボタン（もっと見る／コメント／繋がりたい）を有効化
function bindCardActions(root, lookup) {
  root.addEventListener("click", ev => {
    const card = ev.target.closest("[data-member],[data-post],[data-event]");
    if (!card) return;
    if (ev.target.closest("[data-toggle-details]")) {
      card.classList.toggle("open");
      ev.target.closest("[data-toggle-details]").textContent = card.classList.contains("open") ? "閉じる" : "詳細を見る";
    }
    if (ev.target.closest("[data-toggle-comments]")) {
      card.querySelector(".comments").classList.toggle("open");
    }
    const introBtn = ev.target.closest("[data-intro]");
    if (introBtn) {
      const info = lookup(card);
      if (!info) return;
      openIntroModal(info.targetType, info.targetId, info.targetName, () => {
        // 会員へのリクエストは送信後「リクエスト送信済み」に変える
        if (info.targetType === "member") {
          introBtn.outerHTML = introButtonHtml("sent");
          if (info.onSent) info.onSent();
          if (INTRO_QUOTA) {
            INTRO_QUOTA.used++;
            INTRO_QUOTA.remaining = Math.max(0, INTRO_QUOTA.remaining - 1);
            renderIntroQuota();
            // 上限に達したら、残りの「繋がりたい」ボタンをすべて押せなくする
            if (introLimitReached()) document.querySelectorAll("[data-intro]").forEach(b => {
              if (b.closest("[data-member]")) b.outerHTML = introButtonHtml("");
            });
          }
        }
      });
    }
  });
}

// ---------------- 広告 ----------------

function renderAdCard(ad) {
  const link = safeUrl(ad.linkUrl);
  return `
    <div class="adcard">
      <span class="adcard__badge">PR</span>
      ${ad.imageUrl ? `<img class="adcard__img" src="${esc(ad.imageUrl)}" alt="">` : ""}
      <div class="adcard__body">
        <div class="adcard__advertiser">${esc(ad.advertiser || "")}</div>
        <div class="adcard__title">${esc(ad.title || "")}</div>
        <div class="adcard__text">${esc(ad.text || "")}</div>
        ${link ? `<a class="btn btn--accent btn--small" href="${esc(link)}" target="_blank" rel="noopener sponsored">${esc(ad.ctaLabel || "詳しく見る")}</a>` : ""}
      </div>
    </div>`;
}

async function loadAds(placement) {
  try {
    const ads = await apiGet("listAds", { placement });
    return Array.isArray(ads) ? ads : [];
  } catch (e) { return []; }
}

// カード一覧の間に広告を挟む
function interleaveAds(cardsHtml, ads, every = 4) {
  if (!ads.length) return cardsHtml.join("");
  const out = [];
  cardsHtml.forEach((html, i) => {
    out.push(html);
    if ((i + 1) % every === 0) out.push(renderAdCard(ads[Math.floor(i / every) % ads.length]));
  });
  if (cardsHtml.length < every) out.push(renderAdCard(ads[0]));
  return out.join("");
}

// ---------------- 匿名コメント ----------------

function commentLabel(n, label = "コメント") {
  return `${icon("chat")}${esc(label)}（${n}）`;
}

function commentItemHtml(c) {
  return `<div class="comment ${c.isMine ? "comment--mine" : ""}">
    <div class="comment__meta">${c.isMine ? "あなた（匿名で表示）" : "匿名の会員"}・${esc(fmtDate(c.timestamp))}</div>
    <div class="comment__body">${esc(c.body)}</div></div>`;
}

function commentsBlockHtml(targetType, targetId, comments) {
  return `
    <div class="comments" data-comments="${esc(targetType)}:${esc(targetId)}">
      <div class="comments__list">${comments.length ? comments.map(commentItemHtml).join("") : `<div class="comments__empty">まだコメントはありません。</div>`}</div>
      <div class="comments__form">
        <textarea maxlength="500" placeholder="匿名でコメントできます（500文字まで）"></textarea>
        <button type="button" class="btn btn--ghost btn--small" data-post-comment>匿名で投稿する</button>
        <div class="comments__note">名前は表示されません。誹謗中傷・営業目的の書き込みは運営が削除します。</div>
      </div>
    </div>`;
}

// ページ全体でコメント投稿ボタンを有効化（1回呼べばOK）
// onUpdate(targetType, targetId, comments) で、ページ側のデータにも最新コメントを反映できます
function bindComments(onUpdate) {
  document.addEventListener("click", async ev => {
    const btn = ev.target.closest("[data-post-comment]");
    if (!btn) return;
    const block = btn.closest("[data-comments]");
    const [targetType, targetId] = block.dataset.comments.split(":");
    const textarea = block.querySelector("textarea");
    const body = textarea.value.trim();
    if (!body) { textarea.focus(); return; }
    btn.disabled = true;
    try {
      await apiPost("addComment", { token: TOKEN, targetType, targetId, body });
      const list = await apiGet("listComments", { token: TOKEN, targetType, targetId });
      if (Array.isArray(list)) {
        block.querySelector(".comments__list").innerHTML = list.map(commentItemHtml).join("");
        const counter = block.parentElement.querySelector("[data-toggle-comments]");
        if (counter) counter.innerHTML = commentLabel(list.length, counter.dataset.label);
        if (onUpdate) onUpdate(targetType, targetId, list);
      }
      textarea.value = "";
      toast("コメントを投稿しました");
    } catch (e) {
      toast("投稿できませんでした。時間をおいてお試しください");
    } finally {
      btn.disabled = false;
    }
  });
}

// ---------------- 「繋がりたい」（会員同士）／代理店への応募（運営が仲介） ----------------

const INTRO_TEXT = {
  member: {
    title: name => `${name} さんに「繋がりたい」を送る`,
    lead: "お相手にメールでお知らせが届きます。お相手が承認すると、お互いのLINE・Instagramが見られるようになります。",
    steps: ["お相手にリクエストが届きます", "お相手がマイページで承認します", "承認されると、マイページの「つながった人」に相手のLINE・Instagramが表示されます"],
    button: "リクエストを送る",
    done: "リクエストを送りました",
  },
  agency: {
    title: name => `${name} さんの募集に応募`,
    lead: "代理店募集への応募は、運営スタッフが間に入ってご紹介します。",
    steps: ["運営があなたの応募を確認します", "運営から募集者に、紹介してよいか確認します", "了承が得られたら、運営から双方へご連絡します"],
    button: "応募する",
    done: "応募しました。運営からご連絡いたします",
  },
};

function openIntroModal(targetType, targetId, targetName, onSent) {
  let modal = document.getElementById("intro-modal");
  if (!modal) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal" id="intro-modal"><div class="modal__box">
        <div class="modal__title" id="intro-title"></div>
        <div class="modal__lead" id="intro-lead"></div>
        <ol class="steps" id="intro-steps"></ol>
        <div class="field"><label class="field-label" for="intro-message">お相手へのメッセージ<span class="opt">任意</span></label>
          <textarea id="intro-message" maxlength="500" placeholder="例：協業についてお話ししたいです"></textarea></div>
        <div class="btn-row">
          <button type="button" class="btn btn--ghost" id="intro-cancel">キャンセル</button>
          <button type="button" class="btn btn--primary" id="intro-send"></button>
        </div>
      </div></div>`);
    modal = document.getElementById("intro-modal");
    modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });
    document.getElementById("intro-cancel").addEventListener("click", () => modal.classList.remove("open"));
    document.getElementById("intro-send").addEventListener("click", async () => {
      const btn = document.getElementById("intro-send");
      btn.disabled = true;
      try {
        await apiPost("requestIntro", { token: TOKEN, ...modal._target, message: document.getElementById("intro-message").value.trim() });
        modal.classList.remove("open");
        toast(INTRO_TEXT[modal._target.targetType].done);
        if (modal._onSent) modal._onSent();
      } catch (e) {
        toast("送信できませんでした");
      } finally {
        btn.disabled = false;
      }
    });
  }
  const text = INTRO_TEXT[targetType] || INTRO_TEXT.member;
  modal._target = { targetType, targetId };
  modal._onSent = onSent;
  document.getElementById("intro-title").textContent = text.title(targetName);
  document.getElementById("intro-lead").innerHTML = esc(text.lead) +
    (targetType === "member" && INTRO_QUOTA ? `<br><span class="note">${introQuotaText()}</span>` : "");
  document.getElementById("intro-steps").innerHTML = text.steps.map(s => `<li>${esc(s)}</li>`).join("");
  document.getElementById("intro-send").textContent = text.button;
  document.getElementById("intro-message").value = "";
  modal.classList.add("open");
}

// ================= デモ用（GAS_ENDPOINT_URL が空のときだけ使用） =================

const Demo = (() => {
  const SELF = "demo";
  const db = {
    members: [
      { token: SELF, publicId: "m0", status: "公開", name: "デモ 太郎", company: "デモ株式会社", title: "代表", industry: "不動産", area: "大阪府", business: "大阪市内の売買仲介・賃貸管理", vision: "", wantAsCustomer: "", wantAsPartner: "", agencyStance: "特になし", connectedIndustries: "", tagline: "これはデモ用のあなたのプロフィールです", photoUrl: "", email: "demo@example.com", phone: "090-0000-0000" },
      { publicId: "m1", status: "公開", name: "佐藤 美咲", company: "Salon Lumière", title: "オーナー", industry: "美容・健康", area: "東京都（渋谷・新宿）", business: "渋谷でまつげ・ネイルサロンを2店舗運営しています。", vision: "3年以内に5店舗、スクール事業も。", wantAsCustomer: "美容に関心のある20〜40代の女性", wantAsPartner: "物件探しに強い不動産会社、SNS運用代行", agencyStance: "代理店を募集している", connectedIndustries: "美容、アパレル、広告", tagline: "女性のキレイを応援します！", photoUrl: "", couponCode: "COACT-LUMIERE", couponDetail: "初回ご来店のまつげ・ネイル全メニュー15%OFF。ご予約時にコードをお伝えください。" },
      { publicId: "m2", status: "公開", name: "田中 健太", company: "個人（会社員）", title: "法人営業", industry: "会社員・その他", area: "大阪府・京都府／オンライン可", business: "通信系企業で法人営業をしています。副業で扱える商材を探しています。", vision: "将来は独立したい", wantAsCustomer: "", wantAsPartner: "代理店募集をしている企業様", agencyStance: "代理店として扱える商材を探している", connectedIndustries: "IT、通信、飲食", tagline: "営業力には自信あります", photoUrl: "" },
      { publicId: "m3", status: "公開", name: "鈴木 一郎", company: "鈴木工務店", title: "代表", industry: "建設・リフォーム", area: "兵庫県（神戸市・阪神間）・大阪府北部", business: "戸建てリフォーム・外壁塗装・水回り工事", vision: "地域No.1のリフォーム店に", wantAsCustomer: "築20年以上の戸建てオーナー様", wantAsPartner: "不動産会社、保険代理店（火災保険）", agencyStance: "どちらも", connectedIndustries: "不動産、保険", tagline: "住まいの困りごと、すぐ駆けつけます", photoUrl: "" },
      { publicId: "m4", status: "公開", name: "高橋 彩", company: "Webクリエイト合同会社", title: "ディレクター", industry: "IT・Web", area: "全国（オンライン対応）", business: "中小企業向けホームページ制作・MEO対策", vision: "", wantAsCustomer: "集客に悩む店舗オーナー様", wantAsPartner: "", agencyStance: "代理店を募集している", connectedIndustries: "飲食、美容", tagline: "Web集客ならおまかせください", photoUrl: "" },
      { publicId: "m5", status: "公開", name: "山本 大輔", company: "山本FP事務所", title: "ファイナンシャルプランナー", industry: "保険・金融", area: "大阪府", business: "保険の見直し・資産形成のご相談", vision: "", wantAsCustomer: "", wantAsPartner: "不動産会社、士業", agencyStance: "特になし", connectedIndustries: "不動産、士業", tagline: "お金の不安をなくします", photoUrl: "" },
    ],
    posts: [
      { id: "p1", status: "公開", ownerToken: "t4", ownerName: "高橋 彩", ownerCompany: "Webクリエイト合同会社", title: "ホームページ制作の紹介代理店募集", industry: "IT・Web", product: "中小企業向けホームページ制作（30万円〜）", reward: "成約1件につき売上の20%", area: "全国（オンライン商談可）", requirements: "経営者とのつながりがある方", description: "ご紹介いただくだけでOK。商談・制作はすべて弊社で対応します。", timestamp: "2026-10-01" },
      { id: "p2", status: "公開", ownerToken: "t1", ownerName: "佐藤 美咲", ownerCompany: "Salon Lumière", title: "サロン専売スキンケア商品の販売代理店", industry: "美容・健康", product: "オリジナルスキンケアセット", reward: "販売額の30%", area: "関東・関西エリア", requirements: "美容業界の方歓迎", description: "サンプルをお送りします。", timestamp: "2026-10-05" },
    ],
    events: [
      { id: "e1", status: "公開", type: "交流会", title: "COACT 大阪 異業種交流会 vol.1", date: "2026-11-14 19:00〜21:00", place: "大阪・梅田（詳細は申込者にご連絡）", capacity: "30", fee: "3,000円（軽食付き）", description: "業種を問わずどなたでも参加いただける交流会です。名刺をお持ちください。" },
      { id: "e2", status: "公開", type: "商談会", title: "不動産×建設×保険 商談会", date: "2026-12-05 14:00〜17:00", place: "オンライン（Zoom）", capacity: "12", fee: "無料", description: "事前マッチングした相手と1対1で20分ずつ商談します。" },
    ],
    entries: [{ id: "en1", eventId: "e1", memberToken: "t1", memberName: "佐藤 美咲", status: "参加確定", note: "", timestamp: "2026-10-08" }, { id: "en2", eventId: "e1", memberToken: "t2", memberName: "田中 健太", status: "承認待ち", note: "", timestamp: "2026-10-10" }],
    ads: [
      { id: "a1", status: "掲載中", advertiser: "COACT運営事務局", title: "あなたの広告をここに掲載しませんか？", text: "会員一覧・代理店ページ・交流会ページに広告を掲載できます。", imageUrl: "", linkUrl: "ads.html", ctaLabel: "広告掲載について", placement: "すべて" },
    ],
    comments: [
      { id: "c1", targetType: "member", targetId: "m1", authorToken: "t2", authorName: "田中 健太", status: "公開", body: "サロンの内装がとても素敵でした！", timestamp: "2026-10-03" },
      { id: "c2", targetType: "agency", targetId: "p1", authorToken: "t1", authorName: "佐藤 美咲", status: "公開", body: "紹介先が制作を断った場合も報酬はありますか？", timestamp: "2026-10-06" },
    ],
  };
  db.members.forEach((m, i) => { if (!m.token) m.token = "t" + i; });
  // デモ確認用：URLに &demoStatus=承認待ち を付けると承認待ちの見え方を確認できます
  const demoStatus = new URLSearchParams(location.search).get("demoStatus");
  if (demoStatus) db.members[0].status = demoStatus;
  db.adRequests = [{ id: "r1", status: "未対応", company: "株式会社サンプル", name: "広告 担当", email: "ad@example.com", phone: "03-0000-0000", plan: "会員一覧ページ", message: "クラウド会計サービスの広告を検討しています。", timestamp: "2026-10-08" }];
  db.intros = [
    { id: "i1", status: "未対応", fromToken: "t2", fromName: "田中 健太", targetType: "agency", targetId: "p1", targetName: "高橋 彩", message: "代理店として紹介したい先が3社あります", timestamp: "2026-10-09" },
    // デモの「あなた」宛て：鈴木さんからのリクエスト（返事待ち）／高橋さんとはつながり済み／山本さんへ送信済み
    { id: "i2", status: "承認待ち", fromToken: "t3", fromName: "鈴木 一郎", targetType: "member", targetId: "m0", targetName: "デモ 太郎", message: "不動産のお客様でリフォームをご検討の方がいれば、ぜひご紹介し合いたいです！", timestamp: "2026-10-20" },
    { id: "i3", status: "つながり済み", fromToken: "demo", fromName: "デモ 太郎", targetType: "member", targetId: "m4", targetName: "高橋 彩", message: "", timestamp: "2026-10-15", respondedAt: "2026-10-16" },
    { id: "i4", status: "お断り", fromToken: "demo", fromName: "デモ 太郎", targetType: "member", targetId: "m5", targetName: "山本 大輔", message: "", timestamp: "2026-10-18" },
  ];
  Object.assign(db.members.find(m => m.publicId === "m4"), { lineUrl: "https://line.me/ti/p/example", instagramUrl: "https://www.instagram.com/example" });
  const byPublicId = id => db.members.find(m => m.publicId === id);
  // 自分から見た相手との関係（本番の relationMap と同じ考え方）
  const relationOf = other => {
    let rel = "";
    const rank = { connected: 3, received: 2, sent: 1 };
    db.intros.filter(x => x.targetType === "member").forEach(x => {
      const to = byPublicId(x.targetId);
      let r = "";
      if (x.fromToken === SELF && to === other) r = x.status === "つながり済み" ? "connected" : "sent";
      else if (x.fromToken === other.token && to && to.token === SELF) r = x.status === "つながり済み" ? "connected" : x.status === "承認待ち" ? "received" : "";
      if (r && (!rel || rank[r] > rank[rel])) rel = r;
    });
    return rel;
  };
  const withRelation = m => {
    const relation = relationOf(m);
    const o = { ...publicMember(m), relation, comments: commentsFor("member", m.publicId) };
    if (relation === "connected") Object.assign(o, { lineUrl: m.lineUrl || "", lineQrUrl: m.lineQrUrl || "", instagramUrl: m.instagramUrl || "" });
    return o;
  };
  const SHEET_MAP = { Members: "members", AgencyPosts: "posts", Events: "events", EventEntries: "entries", Ads: "ads", AdRequests: "adRequests", Intros: "intros", Comments: "comments" };
  let seq = 100;
  const self = () => db.members.find(m => m.token === SELF);
  const publicMember = m => { const { token, email, phone, lineUrl, lineQrUrl, instagramUrl, status, ...rest } = m; return rest; };
  const commentsFor = (type, id) => db.comments.filter(c => c.targetType === type && c.targetId === id && c.status !== "非公開")
    .map(c => ({ id: c.id, body: c.body, timestamp: c.timestamp, isMine: c.authorToken === SELF }));
  const wait = v => new Promise(r => setTimeout(() => r(JSON.parse(JSON.stringify(v))), 250));

  function get(action, p) {
    if (action === "listAds") return wait(db.ads.filter(a => a.status === "掲載中" && (a.placement === "すべて" || a.placement === p.placement)));
    if (action === "adminData") {
      const out = {};
      Object.entries(SHEET_MAP).forEach(([sheet, key]) => out[sheet] = db[key]);
      return wait(out); // デモではどのパスワードでもログインできます
    }
    if (p.token !== SELF) return wait({ error: "invalid token" });
    if (action !== "getProfile" && self().status !== "公開") return wait({ error: self().status === "承認待ち" ? "pending" : "hidden" });
    switch (action) {
      case "getProfile": return wait(self());
      case "listMembers": return wait(db.members.filter(m => m.token !== SELF && m.status === "公開")
        .map(withRelation));
      case "listComments": return wait(commentsFor(p.targetType, p.targetId));
      case "listAgency": return wait({
        posts: db.posts.filter(x => x.status === "公開" || x.ownerToken === SELF).map(x => {
          const { ownerToken, ...rest } = x;
          const owner = db.members.find(m => m.token === ownerToken) || {};
          return { ...rest, isMine: ownerToken === SELF, ownerArea: owner.area || "", comments: commentsFor("agency", x.id) };
        }),
        agents: db.members.filter(m => m.token !== SELF && m.status === "公開" && AGENT_SEEKER_STANCES.includes(m.agencyStance))
          .map(withRelation),
      });
      case "introQuota": {
        const month = new Date().toISOString().slice(0, 7);
        const used = db.intros.filter(x => x.fromToken === SELF && x.targetType === "member" && String(x.timestamp).slice(0, 7) === month).length;
        // デモ確認用：URLに &demoUsed=30 を付けると上限に達した状態を確認できます
        const forced = parseInt(new URLSearchParams(location.search).get("demoUsed"), 10);
        const u = isNaN(forced) ? used : forced;
        return wait({ limit: 30, used: u, remaining: Math.max(0, 30 - u) });
      }
      case "listConnections": {
        const out = { received: [], sent: [], connections: [] };
        const seen = {};
        db.intros.filter(x => x.targetType === "member").forEach(x => {
          const to = byPublicId(x.targetId);
          const from = db.members.find(m => m.token === x.fromToken);
          if (!to || !from || (from.token !== SELF && to.token !== SELF)) return;
          const other = from.token === SELF ? to : from;
          if (x.status === "つながり済み") {
            if (!seen[other.token]) out.connections.push({ id: x.id, connectedAt: x.respondedAt, member: withRelation(other) });
            seen[other.token] = true;
          } else if (to.token === SELF && x.status === "承認待ち") out.received.push({ id: x.id, timestamp: x.timestamp, message: x.message, member: publicMember(other) });
          else if (from.token === SELF) out.sent.push({ id: x.id, timestamp: x.timestamp, member: publicMember(other) });
        });
        out.sent = out.sent.filter(s => !seen[byPublicId(s.member.publicId).token]);
        return wait(out);
      }
      case "listEvents": return wait(db.events.filter(e => e.status !== "非公開").map(e => {
        const live = db.entries.filter(x => x.eventId === e.id && ["承認待ち", "参加確定"].includes(x.status));
        const mine = db.entries.filter(x => x.eventId === e.id && x.memberToken === SELF && x.status !== "キャンセル").pop();
        return { ...e, entryCount: live.length, myStatus: mine ? mine.status : "" };
      }));
    }
    return wait({ error: "invalid action" });
  }

  function post(action, p) {
    switch (action) {
      case "updateProfile":
        Object.assign(self(), p);
        if (p.photoDataUrl) self().photoUrl = p.photoDataUrl; else if (p.removePhoto) self().photoUrl = "";
        if (p.lineQrDataUrl) self().lineQrUrl = p.lineQrDataUrl; else if (p.removeLineQr) self().lineQrUrl = "";
        break;
      case "addComment": db.comments.push({ id: "c" + seq++, status: "公開", targetType: p.targetType, targetId: p.targetId, authorToken: SELF, authorName: self().name, body: p.body, timestamp: new Date().toISOString() }); break;
      case "requestIntro": db.intros.push({ id: "i" + seq++, status: p.targetType === "member" ? "承認待ち" : "未対応", fromToken: SELF, fromName: self().name, targetType: p.targetType, targetId: p.targetId, targetName: (byPublicId(p.targetId) || {}).name || "", message: p.message, timestamp: new Date().toISOString() }); break;
      case "respondIntro": {
        const x = db.intros.find(i => i.id === p.id && i.status === "承認待ち");
        if (x) { x.status = p.decision === "accept" ? "つながり済み" : "お断り"; x.respondedAt = new Date().toISOString(); }
        break;
      }
      case "adminSave": {
        const list = db[SHEET_MAP[p.sheet]];
        const idKey = p.sheet === "Members" ? "token" : "id";
        const fields = JSON.parse(p.data || "{}");
        if (p.imageDataUrl) fields.imageUrl = p.imageDataUrl;
        const row = list.find(x => x[idKey] === p.id);
        if (row) Object.assign(row, fields);
        else list.push({ ...fields, id: "n" + seq++, timestamp: new Date().toISOString() });
        break;
      }
      case "addAgencyPost": db.posts.unshift({ ...p, id: "p" + seq++, status: "承認待ち", ownerToken: SELF, ownerName: self().name, ownerCompany: self().company, timestamp: new Date().toISOString() }); break;
      case "closeAgencyPost": { const x = db.posts.find(x => x.id === p.id && x.ownerToken === SELF); if (x) x.status = "募集終了"; break; }
      case "joinEvent": db.entries.push({ id: "en" + seq++, eventId: p.eventId, memberToken: SELF, memberName: self().name, status: "承認待ち", note: "", timestamp: new Date().toISOString() }); break;
    }
    console.info("[デモ] 送信内容（保存されません）:", action, p);
    return wait({ ok: true });
  }

  return { get, post };
})();
