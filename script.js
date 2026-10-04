/*
=========================================================
AG ADS HUB
NO DEMO FRONTEND
=========================================================

IMPORTANT:

এই ফাইলে শুধুমাত্র PUBLIC configuration বসাবেন।

কখনোই এখানে বসাবেন না:

- Telegram Bot Token
- Private API Key
- bKash Secret Key
- Nagad Secret Key
- Database Password
- Ad Network Secret
- Server Secret

উপরের সব BACKEND-এ থাকবে।
=========================================================
*/


/* =====================================================
   PUBLIC CONFIGURATION
   ===================================================== */

const CONFIG = {

  /*
  Telegram Bot username
  Example:
  AGAdsHubBot

  @ লিখবেন না।
  */
  BOT_USERNAME: "",


  /*
  Telegram Mini App URL

  Example:
  https://yourusername.github.io/ag-ads-hub-/
  */
  MINI_APP_URL: "",


  /*
  REAL BACKEND API URL

  Example:
  https://api.example.com

  Backend না থাকলে খালি রাখুন।
  */
  API_BASE_URL: "",


  /*
  AD NETWORK NAME

  Example:
  Monetag
  Adsterra
  আপনার ব্যবহৃত Ad Network
  */
  AD_PROVIDER_NAME: "",


  /*
  AD NETWORK PUBLIC ID / APP ID

  Secret key নয়।
  */
  AD_PROVIDER_PUBLIC_ID: "",


  /*
  bKash NUMBER

  আপনার নিজের bKash payment number এখানে বসাবেন।
  */
  BKASH_NUMBER: "",


  /*
  bKash QR IMAGE URL

  আপনার QR image-এর direct URL এখানে বসাবেন।

  Example:
  https://example.com/bkash-qr.png
  */
  BKASH_QR_URL: "",


  /*
  Nagad NUMBER
  */
  NAGAD_NUMBER: "",


  /*
  Nagad QR IMAGE URL
  */
  NAGAD_QR_URL: "",


  /*
  Support Telegram username

  Example:
  AGAdsHubSupport

  @ ছাড়া।
  */
  SUPPORT_USERNAME: "",


  /*
  Telegram Channel username

  Example:
  AGAdsHub

  @ ছাড়া।
  */
  CHANNEL_USERNAME: ""

};


/* =====================================================
   BACKEND ONLY — NEVER PUT THESE IN THIS FILE
   =====================================================

   TELEGRAM_BOT_TOKEN=
   BKASH_API_KEY=
   BKASH_SECRET_KEY=
   NAGAD_API_KEY=
   NAGAD_SECRET_KEY=
   AD_NETWORK_SECRET=
   DATABASE_URL=
   JWT_SECRET=

   এগুলো server/backend environment variable-এ থাকবে।
*/


/* =====================================================
   TELEGRAM
   ===================================================== */

const tg = window.Telegram && window.Telegram.WebApp
  ? window.Telegram.WebApp
  : null;


if (tg) {

  tg.ready();

  tg.expand();

  try {
    tg.setHeaderColor("#070908");
    tg.setBackgroundColor("#070908");
  } catch (error) {
    console.log("Telegram UI settings unavailable");
  }

}


/* =====================================================
   REAL ACCOUNT STATE
   ===================================================== */

let ACCOUNT = {

  balance: 0,
  pending: 0,
  earned: 0,
  withdrawn: 0,

  todayAds: 0,

  dailyLimit: 15,

  vip: false,
  vipExpiry: null,

  history: []

};


/* =====================================================
   TELEGRAM USER
   ===================================================== */

function getTelegramUser() {

  if (!tg || !tg.initDataUnsafe) {
    return null;
  }

  return tg.initDataUnsafe.user || null;

}


function setupTelegramUser() {

  const user = getTelegramUser();

  if (!user) {

    setText("welcomeName", "Telegram User");

    setText("profileName", "Telegram User");

    setText("profileUsername", "@username");

    setText("telegramId", "Not available");

    setText("telegramUsername", "Not available");

    return;

  }


  const fullName = [
    user.first_name || "",
    user.last_name || ""
  ].join(" ").trim();


  const name = fullName || "Telegram User";


  setText("welcomeName", name);

  setText("profileName", name);


  const username = user.username
    ? "@" + user.username
    : "No username";


  setText("profileUsername", username);

  setText("telegramUsername", username);

  setText("telegramId", user.id || "—");


  const initial =
    (user.first_name || "A").charAt(0).toUpperCase();


  setText("headerInitial", initial);

  setText("profileInitial", initial);


  if (user.photo_url) {

    setImage("headerPhoto", user.photo_url);

    setImage("profilePhoto", user.photo_url);

  }

}


/* =====================================================
   API
   ===================================================== */

async function apiRequest(endpoint, options = {}) {

  if (!CONFIG.API_BASE_URL) {

    throw new Error(
      "BACKEND_NOT_CONFIGURED"
    );

  }


  const url =
    CONFIG.API_BASE_URL.replace(/\/$/, "") +
    endpoint;


  const headers = {

    "Content-Type": "application/json"

  };


  /*
  Telegram initData backend-এ পাঠানো হচ্ছে।

  Backend অবশ্যই initData verify করবে।
  */

  if (tg && tg.initData) {

    headers["X-Telegram-Init-Data"] =
      tg.initData;

  }


  const response = await fetch(url, {

    ...options,

    headers: {
      ...headers,
      ...(options.headers || {})
    }

  });


  if (!response.ok) {

    throw new Error(
      "API_ERROR_" + response.status
    );

  }


  return response.json();

}


/* =====================================================
   LOAD REAL ACCOUNT
   ===================================================== */

async function loadAccount() {

  /*
  Backend না থাকলে কোনো fake data তৈরি হবে না।
  */

  if (!CONFIG.API_BASE_URL) {

    ACCOUNT = {

      balance: 0,
      pending: 0,
      earned: 0,
      withdrawn: 0,

      todayAds: 0,

      dailyLimit: 15,

      vip: false,
      vipExpiry: null,

      history: []

    };

    updateUI();

    return;

  }


  try {

    const data =
      await apiRequest("/api/me");


    /*
    Backend থেকে পাওয়া REAL data।
    */

    ACCOUNT = {

      balance: Number(data.balance || 0),

      pending: Number(data.pending || 0),

      earned: Number(data.earned || 0),

      withdrawn: Number(data.withdrawn || 0),

      todayAds: Number(data.todayAds || 0),

      dailyLimit:
        Number(data.dailyLimit || 15),

      vip: Boolean(data.vip),

      vipExpiry:
        data.vipExpiry || null,

      history:
        Array.isArray(data.history)
          ? data.history
          : []

    };


    updateUI();

  } catch (error) {

    console.error(error);

    showToast(
      "Account data could not be loaded."
    );

  }

}


/* =====================================================
   UPDATE UI
   ===================================================== */

function updateUI() {

  const balance =
    formatMoney(ACCOUNT.balance);


  const pending =
    formatMoney(ACCOUNT.pending);


  const earned =
    formatMoney(ACCOUNT.earned);


  const withdrawn =
    formatMoney(ACCOUNT.withdrawn);


  setText("homeBalance", balance);

  setText("homePending", pending);

  setText("homeEarned", earned);


  setText("balancePage", balance);

  setText("balancePending", pending);

  setText("balanceEarned", earned);

  setText("balanceWithdrawn", withdrawn);

  setText("withdrawBalance", balance);


  setText(
    "balanceAds",
    ACCOUNT.todayAds
  );


  setText(
    "adsCompleted",
    ACCOUNT.todayAds
  );


  setText(
    "adsLimit",
    ACCOUNT.dailyLimit + " Ads"
  );


  setText(
    "dailyAdsText",
    ACCOUNT.todayAds +
    " / " +
    ACCOUNT.dailyLimit
  );


  const percent =
    ACCOUNT.dailyLimit > 0
      ? Math.min(
          100,
          (ACCOUNT.todayAds /
            ACCOUNT.dailyLimit) *
            100
        )
      : 0;


  const progress =
    document.getElementById(
      "dailyProgress"
    );


  if (progress) {

    progress.style.width =
      percent + "%";

  }


  if (ACCOUNT.vip) {

    document
      .getElementById("vipBadge")
      ?.classList.remove("hidden");

    setText(
      "vipStatus",
      "VIP"
    );

    setText(
      "profileVip",
      "VIP"
    );

    setText(
      "vipExpiry",
      formatDate(ACCOUNT.vipExpiry)
    );

    setText(
      "profileVipExpiry",
      formatDate(ACCOUNT.vipExpiry)
    );

  } else {

    document
      .getElementById("vipBadge")
      ?.classList.add("hidden");

    setText(
      "vipStatus",
      "NORMAL"
    );

    setText(
      "profileVip",
      "NORMAL"
    );

    setText(
      "vipExpiry",
      "—"
    );

    setText(
      "profileVipExpiry",
      "—"
    );

  }

}


/* =====================================================
   NAVIGATION
   ===================================================== */

function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.remove("active");

    });


  const page =
    document.getElementById(pageId);


  if (!page) return;


  page.classList.add("active");


  document
    .querySelectorAll(".bottom-nav button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === pageId
      );

    });


  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });


  if (pageId === "ads") {

    loadAds();

  }


  if (pageId === "history") {

    renderHistory();

  }

}


/* =====================================================
   REAL ADS
   ===================================================== */

async function loadAds() {

  const container =
    document.getElementById(
      "adsContainer"
    );


  if (!container) return;


  /*
  No API = No Demo Ads.
  */

  if (!CONFIG.API_BASE_URL) {

    container.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">▶</div>

        <h3>No live ads available</h3>

        <p>
          Connect the real ad network and backend
          before advertisements can appear.
        </p>

      </div>

    `;

    return;

  }


  try {

    const data =
      await apiRequest(
        "/api/ads"
      );


    const ads =
      Array.isArray(data.ads)
        ? data.ads
        : [];


    if (!ads.length) {

      container.innerHTML = `

        <div class="empty-state">

          <div class="empty-icon">▶</div>

          <h3>No live ads available</h3>

          <p>
            There are currently no eligible ads.
          </p>

        </div>

      `;

      return;

    }


    container.innerHTML = "";


    ads.forEach(ad => {

      const card =
        document.createElement("div");


      card.className =
        "payment-card";


      card.innerHTML = `

        <strong>
          ${escapeHTML(ad.title || "Advertisement")}
        </strong>

        <p style="
          color:#849087;
          font-size:11px;
          margin-top:8px;
        ">
          ${escapeHTML(ad.description || "")}
        </p>

        <button
          class="main-btn"
          onclick="startRealAd('${escapeHTML(ad.id)}')"
        >
          VIEW AD
        </button>

      `;


      container.appendChild(card);

    });


  } catch (error) {

    console.error(error);

    container.innerHTML = `

      <div class="empty-state">

        <h3>Ads unavailable</h3>

        <p>
          Could not connect to the ad server.
        </p>

      </div>

    `;

  }

}


/* =====================================================
   START REAL AD
   ===================================================== */

async function startRealAd(adId) {

  if (!CONFIG.API_BASE_URL) {

    showToast(
      "Ad backend is not connected."
    );

    return;

  }


  try {

    const result =
      await apiRequest(
        "/api/ads/start",
        {

          method: "POST",

          body: JSON.stringify({

            adId: adId

          })

        }
      );


    /*
    Backend decides whether the ad
    is actually eligible/completed.
    */

    if (result.url) {

      window.open(
        result.url,
        "_blank",
        "noopener,noreferrer"
      );

    }


    showToast(
      "Advertisement started."
    );


  } catch (error) {

    console.error(error);

    showToast(
      "Could not start advertisement."
    );

  }

}


/* =====================================================
   VIP
   ===================================================== */

let selectedVipDays = 0;

let selectedVipPrice = 0;


function openVipPayment(days, price) {

  selectedVipDays = days;

  selectedVipPrice = price;


  setText(
    "selectedPlan",
    days + " DAYS VIP"
  );


  setText(
    "selectedPrice",
    price
  );


  setText(
    "vipBkashNumber",
    CONFIG.BKASH_NUMBER ||
      "Not configured"
  );


  setText(
    "vipNagadNumber",
    CONFIG.NAGAD_NUMBER ||
      "Not configured"
  );


  setupQR(
    "vipBkashQR",
    CONFIG.BKASH_QR_URL
  );


  setupQR(
    "vipNagadQR",
    CONFIG.NAGAD_QR_URL
  );


  document
    .getElementById("vipModal")
    .classList.remove("hidden");

}


function closeModal() {

  document
    .getElementById("vipModal")
    .classList.add("hidden");

}


/* =====================================================
   VIP PAYMENT SUBMIT
   ===================================================== */

async function submitVipPayment() {

  const method =
    document.getElementById(
      "vipMethod"
    ).value;


  const txid =
    document.getElementById(
      "vipTxid"
    ).value.trim();


  if (!txid) {

    showToast(
      "Enter transaction ID."
    );

    return;

  }


  if (!CONFIG.API_BASE_URL) {

    showToast(
      "Backend is not connected. No payment was submitted."
    );

    return;

  }


  try {

    await apiRequest(
      "/api/vip/payment",
      {

        method: "POST",

        body: JSON.stringify({

          days:
            selectedVipDays,

          amount:
            selectedVipPrice,

          method:
            method,

          transactionId:
            txid

        })

      }
    );


    document.getElementById(
      "vipTxid"
    ).value = "";


    closeModal();


    showToast(
      "Payment submitted for verification."
    );


    await loadAccount();


  } catch (error) {

    console.error(error);

    showToast(
      "Payment submission failed."
    );

  }

}


/* =====================================================
   DEPOSIT
   ===================================================== */

function setupPaymentUI() {

  setText(
    "bkashNumber",
    CONFIG.BKASH_NUMBER ||
      "Not configured"
  );


  setText(
    "nagadNumber",
    CONFIG.NAGAD_NUMBER ||
      "Not configured"
  );


  setupQR(
    "bkashQR",
    CONFIG.BKASH_QR_URL
  );


  setupQR(
    "nagadQR",
    CONFIG.NAGAD_QR_URL
  );

}


function setupQR(id, url) {

  const image =
    document.getElementById(id);


  if (!image) return;


  if (url) {

    image.src = url;

    image.classList.remove(
      "hidden"
    );

  } else {

    image.removeAttribute("src");

    image.classList.add(
      "hidden"
    );

  }

}


async function submitDeposit() {

  const amount =
    Number(
      document.getElementById(
        "depositAmount"
      ).value
    );


  const method =
    document.getElementById(
      "depositMethod"
    ).value;


  const txid =
    document.getElementById(
      "depositTxid"
    ).value.trim();


  if (!amount || amount <= 0) {

    showToast(
      "Enter a valid amount."
    );

    return;

  }


  if (!txid) {

    showToast(
      "Enter transaction ID."
    );

    return;

  }


  if (!CONFIG.API_BASE_URL) {

    showToast(
      "Backend is not connected. No payment was submitted."
    );

    return;

  }


  try {

    await apiRequest(
      "/api/deposit",
      {

        method: "POST",

        body: JSON.stringify({

          amount:
            amount,

          method:
            method,

          transactionId:
            txid

        })

      }
    );


    document.getElementById(
      "depositAmount"
    ).value = "";


    document.getElementById(
      "depositTxid"
    ).value = "";


    showToast(
      "Deposit submitted for verification."
    );


    await loadAccount();


  } catch (error) {

    console.error(error);

    showToast(
      "Deposit submission failed."
    );

  }

}


/* =====================================================
   WITHDRAW
   ===================================================== */

async function submitWithdraw() {

  const amount =
    Number(
      document.getElementById(
        "withdrawAmount"
      ).value
    );


  const method =
    document.getElementById(
      "withdrawMethod"
    ).value;


  const number =
    document.getElementById(
      "withdrawNumber"
    ).value.trim();


  if (!amount || amount <= 0) {

    showToast(
      "Enter a valid withdrawal amount."
    );

    return;

  }


  if (amount > ACCOUNT.balance) {

    showToast(
      "Insufficient available balance."
    );

    return;

  }


  if (!number) {

    showToast(
      "Enter your payment account number."
    );

    return;

  }


  if (!CONFIG.API_BASE_URL) {

    showToast(
      "Backend is not connected. No withdrawal was created."
    );

    return;

  }


  try {

    await apiRequest(
      "/api/withdraw",
      {

        method: "POST",

        body: JSON.stringify({

          amount:
            amount,

          method:
            method,

          accountNumber:
            number

        })

      }
    );


    document.getElementById(
      "withdrawAmount"
    ).value = "";


    document.getElementById(
      "withdrawNumber"
    ).value = "";


    showToast(
      "Withdrawal request submitted."
    );


    await loadAccount();


  } catch (error) {

    console.error(error);

    showToast(
      "Withdrawal request failed."
    );

  }

}


/* =====================================================
   HISTORY
   ===================================================== */

function renderHistory() {

  const container =
    document.getElementById(
      "historyContainer"
    );


  if (!container) return;


  if (
    !ACCOUNT.history ||
    !ACCOUNT.history.length
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">≡</div>

        <h3>No transactions yet</h3>

        <p>
          Real transactions will appear here.
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML = "";


  ACCOUNT.history.forEach(item => {

    const div =
      document.createElement("div");


    div.className =
      "payment-card";


    div.innerHTML = `

      <strong>
        ${escapeHTML(item.type || "Transaction")}
      </strong>

      <p style="
        color:#849087;
        font-size:10px;
        margin-top:6px;
      ">
        ${escapeHTML(item.status || "Pending")}
      </p>

      <div style="
        margin-top:8px;
        font-size:17px;
        font-weight:900;
      ">
        ৳${formatMoney(item.amount || 0)}
      </div>

    `;


    container.appendChild(div);

  });

}


/* =====================================================
   REFERRAL
   ===================================================== */

function setupReferral() {

  const input =
    document.getElementById(
      "referralLink"
    );


  if (!input) return;


  const user =
    getTelegramUser();


  if (
    CONFIG.BOT_USERNAME &&
    user &&
    user.id
  ) {

    input.value =
      "https://t.me/" +
      CONFIG.BOT_USERNAME +
      "?start=ref_" +
      user.id;

  } else {

    input.value =
      "Not configured";

  }

}


async function copyReferral() {

  const input =
    document.getElementById(
      "referralLink"
    );


  if (
    !input ||
    input.value === "Not configured"
  ) {

    showToast(
      "Referral link is not configured."
    );

    return;

  }


  await copyText(
    input.value
  );

  showToast(
    "Referral link copied."
  );

}


function shareReferral() {

  const input =
    document.getElementById(
      "referralLink"
    );


  if (
    !input ||
    input.value === "Not configured"
  ) {

    showToast(
      "Referral link is not configured."
    );

    return;

  }


  const text =
    encodeURIComponent(
      "Join AG ADS HUB"
    );


  const url =
    encodeURIComponent(
      input.value
    );


  const shareURL =
    "https://t.me/share/url?url=" +
    url +
    "&text=" +
    text;


  if (tg) {

    tg.openTelegramLink(
      shareURL
    );

  } else {

    window.open(
      shareURL,
      "_blank"
    );

  }

}


/* =====================================================
   SUPPORT
   ===================================================== */

function openSupport() {

  if (!CONFIG.SUPPORT_USERNAME) {

    showToast(
      "Support username is not configured."
    );

    return;

  }


  const username =
    CONFIG.SUPPORT_USERNAME
      .replace("@", "");


  const url =
    "https://t.me/" +
    username;


  if (tg) {

    tg.openTelegramLink(url);

  } else {

    window.open(
      url,
      "_blank"
    );

  }

}


/* =====================================================
   COPY CONFIG
   ===================================================== */

async function copyConfig(key) {

  const value =
    CONFIG[key];


  if (!value) {

    showToast(
      key + " is not configured."
    );

    return;

  }


  await copyText(value);


  showToast(
    "Copied."
  );

}


/* =====================================================
   COPY TEXT
   ===================================================== */

async function copyText(text) {

  try {

    await navigator.clipboard.writeText(
      text
    );

  } catch (error) {

    const textarea =
      document.createElement("textarea");


    textarea.value = text;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

  }

}


/* =====================================================
   UTILITIES
   ===================================================== */

function setText(id, value) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      value;

  }

}


function setImage(id, src) {

  const element =
    document.getElementById(id);


  if (!element || !src) return;


  element.src = src;

  element.style.display =
    "block";


  const parent =
    element.parentElement;


  if (parent) {

    const fallback =
      parent.querySelector("span");


    if (fallback) {

      fallback.style.display =
        "none";

    }

  }

}


function formatMoney(value) {

  const number =
    Number(value || 0);


  return number.toFixed(2);

}


function formatDate(value) {

  if (!value) return "—";


  const date =
    new Date(value);


  if (Number.isNaN(date.getTime())) {

    return "—";

  }


  return date.toLocaleDateString(
    "en-GB",
    {

      day: "2-digit",

      month: "short",

      year: "numeric"

    }
  );

}


function escapeHTML(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


/* =====================================================
   TOAST
   ===================================================== */

let toastTimer;


function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );


  const text =
    document.getElementById(
      "toastText"
    );


  if (!toast || !text) return;


  text.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2800);

}


/* =====================================================
   INITIALIZATION
   ===================================================== */

function initialize() {

  setupTelegramUser();

  setupPaymentUI();

  setupReferral();

  loadAccount();


  setTimeout(() => {

    const loading =
      document.getElementById(
        "loadingScreen"
      );


    const app =
      document.getElementById(
        "app"
      );


    if (loading) {

      loading.style.display =
        "none";

    }


    if (app) {

      app.classList.remove(
        "hidden"
      );

    }

  }, 2200);

}


/* =====================================================
   MODAL OUTSIDE CLICK
   ===================================================== */

document.addEventListener(
  "click",
  function(event) {

    const modal =
      document.getElementById(
        "vipModal"
      );


    if (
      modal &&
      event.target === modal
    ) {

      closeModal();

    }

  }
);


/* START */

document.addEventListener(
  "DOMContentLoaded",
  initialize
);
