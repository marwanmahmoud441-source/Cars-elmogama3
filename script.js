// Firebase imports (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update, get, child } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

/* ------------------ ضع هنا Firebase config الخاص بك ------------------ */
const firebaseConfig = {
  apiKey: "AIzaSyAhoKHKKe0xVPrkY1xvM6HZXZ8Q2gRJtas",
  authDomain: "cars-elmogama3.firebaseapp.com",
  databaseURL: "https://cars-elmogama3-default-rtdb.firebaseio.com",
  projectId: "cars-elmogama3",
  storageBucket: "cars-elmogama3.firebasestorage.app",
  messagingSenderId: "613282405977",
  appId: "1:613282405977:web:0d805d014be0a45ca0db48",
  measurementId: "G-4DDTLT2D7Z"
};
/* -------------------------------------------------------------------- */

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* عناصر الواجهة */
const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const loginBtn = document.getElementById("loginBtn");
const initUsersBtn = document.getElementById("initUsersBtn");
const authCard = document.getElementById("authCard");
const addCard = document.getElementById("addCard");
const carName = document.getElementById("carName");
const carNumber = document.getElementById("carNumber");
const carLetters = document.getElementById("carLetters");
const carCollege = document.getElementById("carCollege");
const addBtn = document.getElementById("addBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const carsTbody = document.getElementById("carsTbody");
const totalCars = document.getElementById("totalCars");
const currentUserSpan = document.getElementById("currentUser");
const nowTimeSpan = document.getElementById("nowTime");
const logoutBtn = document.getElementById("logoutBtn");
const exportBtn = document.getElementById("exportPDF");

let currentUser = null;
let allCarsCache = {};

/* اليوزرات المبدئية */
const initialUsers = {
  "كلية تجارة ترام": { password: "01234", role: "user" },
  "كلية آداب": { password: "0909", role: "user" },
  "كلية تربية": { password: "12345", role: "user" },
  "كلية سياحة": { password: "05678", role: "user" },
  "تجارة بورسعيد": { password: "6789", role: "user" },
  "Admin_1": { password: "01289049383", role: "admin" },
  "Admin_2": { password: "01067548913", role: "admin" }
};

/* تهيئة اليوزرات (مرة واحدة) */
initUsersBtn.onclick = async () => {
  try {
    const usersRef = ref(db, "users/");
    const snap = await get(usersRef);
    if (snap.exists()) return alert("اليوزرات موجودة بالفعل.");
    for (const name in initialUsers) {
      await set(child(usersRef, name), initialUsers[name]);
    }
    alert("تمت تهيئة اليوزرات بنجاح.");
  } catch (e) {
    console.error(e);
    alert("حدث خطأ أثناء التهيئة.");
  }
};

/* تسجيل الدخول */
loginBtn.onclick = async () => {
  const user = loginUser.value.trim();
  const pass = loginPass.value.trim();
  if (!user || !pass) return alert("أدخل اسم المستخدم وكلمة السر.");
  try {
    const snap = await get(ref(db, "users/" + user));
    if (!snap.exists()) return alert("المستخدم غير موجود.");
    const data = snap.val();
    if (data.password !== pass) return alert("كلمة السر غير صحيحة.");
    currentUser = { name: user, role: data.role };
    afterLogin();
  } catch (e) {
    console.error(e);
    alert("خطأ أثناء تسجيل الدخول.");
  }
};

/* بعد الدخول */
function afterLogin() {
  currentUserSpan.textContent = `${currentUser.name} (${currentUser.role})`;
  logoutBtn.style.display = "inline-block";
  authCard.style.display = "none";
  addCard.style.display = "block";
}

/* تسجيل الخروج */
logoutBtn.onclick = () => {
  currentUser = null;
  currentUserSpan.textContent = "غير مسجل";
  logoutBtn.style.display = "none";
  authCard.style.display = "block";
  addCard.style.display = "none";
};

/* تحديث الوقت */
function updateTime() {
  nowTimeSpan.textContent = new Date().toLocaleString();
}
setInterval(updateTime, 1000);

/* إضافة عربية */
addBtn.onclick = async () => {
  if (!currentUser) return alert("سجّل الدخول أولًا.");
  const n = carName.value.trim(),
        num = carNumber.value.trim(),
        lettrs = carLetters.value.trim(),
        col = carCollege.value.trim();
  if (!n || !num || !lettrs || !col) return alert("املأ جميع الحقول.");
  try {
    const refCars = ref(db, "cars/");
    const newRef = push(refCars);
    await set(newRef, {
      name: n,
      number: num,
      letters: lettrs,
      college: col,
      addedBy: currentUser.name,
      addedAt: new Date().toLocaleString()
    });
    carName.value = carNumber.value = carLetters.value = "";
    carCollege.value = "";
  } catch (e) {
    console.error(e);
    alert("فشل إضافة السجل.");
  }
};

/* قراءة السجلات (Realtime) */
const refCars = ref(db, "cars/");
onValue(refCars, (snap) => {
  allCarsCache = snap.val() || {};
  renderTable(allCarsCache);
});

/* رسم الجدول */
function renderTable(data) {
  carsTbody.innerHTML = "";
  const q = searchInput.value.trim().toLowerCase();
  let count = 0;
  for (const [id, car] of Object.entries(data)) {
    const txt = `${car.name} ${car.number} ${car.letters} ${car.college}`.toLowerCase();
    if (q && !txt.includes(q)) continue;
    count++;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(car.name)}</td>
      <td>${escapeHtml(car.number)}</td>
      <td>${escapeHtml(car.letters)}</td>
      <td>${escapeHtml(car.college)}</td>
      <td class="small">${escapeHtml(car.addedBy || '')}<br>${escapeHtml(car.addedAt || '')}</td>
      <td></td>`;
    const td = tr.lastElementChild;
    if (currentUser?.role === "admin") {
      const e = document.createElement("button");
      e.textContent = "تعديل";
      e.className = "ghost";
      e.onclick = () => editCar(id, car);
      const d = document.createElement("button");
      d.textContent = "حذف";
      d.className = "danger";
      d.style.marginLeft = "6px";
      d.onclick = async () => {
        if (confirm("هل تريد حذف هذا السجل؟")) await remove(ref(db, "cars/" + id));
      };
      td.append(e, d);
    } else td.innerHTML = `<span class="small">عرض فقط</span>`;
    carsTbody.appendChild(tr);
  }
  totalCars.textContent = count;
}

/* تعديل */
async function editCar(id, car) {
  const n = prompt("الاسم:", car.name);
  if (n === null) return;
  const num = prompt("الرقم:", car.number);
  if (num === null) return;
  const lettrs = prompt("الحروف:", car.letters);
  if (lettrs === null) return;
  const col = prompt("الكلية:", car.college);
  if (col === null) return;
  try {
    await update(ref(db, "cars/" + id), {
      name: n, number: num, letters: lettrs, college: col,
      editedBy: currentUser.name,
      editedAt: new Date().toLocaleString()
    });
  } catch (e) {
    console.error(e);
    alert("فشل التعديل.");
  }
}

/* بحث */
searchBtn.onclick = () => renderTable(allCarsCache);
clearSearchBtn.onclick = () => {
  searchInput.value = "";
  renderTable(allCarsCache);
};

/* تصدير PDF */
exportBtn.onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("قائمة العربيات - MARWANALEX3", 105, 15, { align: "center" });
  doc.setFontSize(12);
  let y = 30, i = 1;
  const q = searchInput.value.trim().toLowerCase();
  for (const car of Object.values(allCarsCache)) {
    const txt = `${car.name} ${car.number} ${car.letters} ${car.college}`.toLowerCase();
    if (q && !txt.includes(q)) continue;
    doc.text(`${i}. الاسم: ${car.name}`, 10, y);
    doc.text(`الرقم: ${car.number} | الحروف: ${car.letters}`, 10, y + 6);
    doc.text(`الكلية: ${car.college}`, 10, y + 12);
    doc.text(`سجّلها: ${car.addedBy || ''} - ${car.addedAt || ''}`, 10, y + 18);
    y += 28; i++;
    if (y > 270) { doc.addPage(); y = 20; }
  }
  doc.save("cars-list.pdf");
};

/* دالة مساعدة لتفادي XSS */
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}