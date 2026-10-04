const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

// 2–3 second loading screen
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("app").style.display = "block";
  }, 2500);
});

// Telegram user information
function loadTelegramUser() {
  if (!tg || !tg.initDataUnsafe) return;

  const user = tg.initDataUnsafe.user;

  if (!user) return;

  console.log("Telegram User:", {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    photo_url: user.photo_url
  });
}

loadTelegramUser();

// Bottom navigation
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {

    document.querySelectorAll(".nav-item")
      .forEach(btn => btn.classList.remove("active"));

    item.classList.add("active");

    const page = item.querySelector("small").textContent;

    console.log("Open page:", page);
  });
});

// View Ad
document.querySelectorAll(".watch-button").forEach(button => {
  button.addEventListener("click", () => {
    alert("Advertisement viewing will be connected to the real ad system.");
  });
});

// VIP
document.querySelector(".vip-button").addEventListener("click", () => {
  alert(
    "VIP Plans:\n\n" +
    "1 Day — ৳3\n" +
    "7 Days — ৳20\n" +
    "30 Days — ৳90\n" +
    "90 Days — ৳240"
  );
});
