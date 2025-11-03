// ===============================
// 🟢 إعداد الاتصال بـ Supabase
// ===============================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://gtiypqqevuaswzxqgmar.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aXlwcXFldnVhc3d6eHFnbWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjIwMTcsImV4cCI6MjA3NzYzODAxN30.pA9fBRZn4VYqBrlaP0tsLNCeE6l-jzrIc0QQYGfuRTk";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===============================
// 🟢 تحميل الإحصائيات
// ===============================
const totalEl = document.getElementById("totalCount");
const updatedEl = document.getElementById("updatedCount");
const remainingEl = document.getElementById("remainingCount");
const msg = document.getElementById("message");

async function loadStats() {
  msg.textContent = "⏳ جاري تحميل البيانات...";
  try {
    const { data, error } = await supabase.from("schools").select("*");
    if (error) throw error;

    const total = data.length;
    const updated = data.filter((r) => r.status === "تم التأكيد").length;
    const remaining = total - updated;

    totalEl.textContent = total;
    updatedEl.textContent = updated;
    remainingEl.textContent = remaining;

    // 📊 تحليل حسب المحافظة
    const areaStats = {};
    data.forEach((row) => {
      const area = row.area || "غير محدد";
      areaStats[area] = (areaStats[area] || 0) + 1;
    });

    drawChart(areaStats);
    msg.textContent = "";
  } catch (err) {
    console.error(err);
    msg.textContent = "⚠️ حدث خطأ أثناء تحميل البيانات.";
  }
}

// ===============================
// 📊 رسم الرسم البياني
// ===============================
function drawChart(areaStats) {
  const ctx = document.getElementById("areaChart").getContext("2d");
  const labels = Object.keys(areaStats);
  const values = Object.values(areaStats);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "عدد المدارس حسب المحافظة",
          data: values,
          borderWidth: 1,
          backgroundColor: "#00907f",
        },
      ],
    },
    options: {
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

// ===============================
// 📤 تصدير إلى Excel
// ===============================
document.getElementById("exportBtn").addEventListener("click", async () => {
  try {
    const { data, error } = await supabase.from("schools").select("*");
    if (error) throw error;

    // تحويل البيانات إلى CSV
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    // إنشاء ملف وتحميله
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schools_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("❌ خطأ أثناء التصدير:", err);
    msg.textContent = "⚠️ حدث خطأ أثناء التصدير إلى Excel.";
  }
});

// ===============================
// 🚪 زر الخروج
// ===============================
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("login_token");
  localStorage.removeItem("schoolData");
  const basePath = window.location.origin.includes("github.io")
    ? "/munaseg/index.html"
    : "index.html";
  window.location.href = basePath;
});

// تحميل الإحصائيات عند الدخول
loadStats();
