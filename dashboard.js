import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://gtiypqqevuaswzxqgmar.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aXlwcXFldnVhc3d6eHFnbWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjIwMTcsImV4cCI6MjA3NzYzODAxN30.pA9fBRZn4VYqBrlaP0tsLNCeE6l-jzrIc0QQYGfuRTk";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const totalEl = document.getElementById("totalCount");
const updatedEl = document.getElementById("updatedCount");
const remainingEl = document.getElementById("remainingCount");
const msg = document.getElementById("message");

const filterArea = document.getElementById("filterArea");
const filterStatus = document.getElementById("filterStatus");
const applyFilterBtn = document.getElementById("applyFilter");
let chartInstance = null;
let allData = [];

// 🟢 تحميل البيانات الأولية
// 🟢 تحميل جميع البيانات بدون حد (على دفعات)
async function loadAllData() {
  msg.textContent = "⏳ جاري تحميل كل البيانات من قاعدة Supabase...";
  let from = 0;
  const limit = 1000; // الحد الأقصى في كل دفعة
  let allRows = [];

  try {
    while (true) {
      const { data, error, count } = await supabase
        .from("schools")
        .select("*", { count: "exact" })
        .range(from, from + limit - 1);

      if (error) throw error;

      allRows = allRows.concat(data);

      if (data.length < limit) break; // تم الوصول للنهاية
      from += limit; // انتقل إلى الدفعة التالية
    }

    console.log(`✅ تم تحميل ${allRows.length} صف من Supabase`);

    allData = allRows;
    fillAreaFilter(allRows);
    updateDashboard(allRows);
    msg.textContent = "";
  } catch (err) {
    console.error("⚠️ خطأ أثناء تحميل البيانات:", err);
    msg.textContent = "⚠️ حدث خطأ أثناء تحميل البيانات.";
  }
}


// 🟢 تعبئة قائمة المحافظات
function fillAreaFilter(data) {
  const areas = [...new Set(data.map((r) => r.area).filter(Boolean))].sort();
  areas.forEach((area) => {
    const opt = document.createElement("option");
    opt.value = area;
    opt.textContent = area;
    filterArea.appendChild(opt);
  });
}

// 🟢 تحديث لوحة الإحصاءات حسب الفلتر
function updateDashboard(data) {
  const total = data.length;
  const updated = data.filter((r) => r.status === "تم التأكيد").length;
  const remaining = total - updated;

  totalEl.textContent = total;
  updatedEl.textContent = updated;
  remainingEl.textContent = remaining;

  const areaStats = {};
  data.forEach((row) => {
    const area = row.area || "غير محدد";
    areaStats[area] = (areaStats[area] || 0) + 1;
  });

  drawChart(areaStats);
}

// 🟢 رسم الرسم البياني
function drawChart(areaStats) {
  const ctx = document.getElementById("areaChart").getContext("2d");
  const labels = Object.keys(areaStats);
  const values = Object.values(areaStats);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "عدد المدارس حسب المحافظة",
          data: values,
          backgroundColor: "#00907f",
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
    },
  });
}

// 🟢 تطبيق الفلاتر
applyFilterBtn.addEventListener("click", () => {
  const selectedArea = filterArea.value;
  const selectedStatus = filterStatus.value;

  let filtered = [...allData];
  if (selectedArea !== "all") filtered = filtered.filter((r) => r.area === selectedArea);
  if (selectedStatus === "تم التأكيد") filtered = filtered.filter((r) => r.status === "تم التأكيد");
  if (selectedStatus === "غير محدث") filtered = filtered.filter((r) => r.status !== "تم التأكيد");

  updateDashboard(filtered);
});

// 🟢 تصدير البيانات إلى Excel (CSV)
document.getElementById("exportBtn").addEventListener("click", () => {
  const selectedArea = filterArea.value;
  const selectedStatus = filterStatus.value;

  let filtered = [...allData];
  if (selectedArea !== "all") filtered = filtered.filter((r) => r.area === selectedArea);
  if (selectedStatus === "تم التأكيد") filtered = filtered.filter((r) => r.status === "تم التأكيد");
  if (selectedStatus === "غير محدث") filtered = filtered.filter((r) => r.status !== "تم التأكيد");

  if (filtered.length === 0) {
    msg.textContent = "⚠️ لا توجد بيانات لتصديرها.";
    return;
  }

  const headers = Object.keys(filtered[0]).join(",");
  const rows = filtered.map((r) => Object.values(r).join(","));
  const csv = [headers, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "schools_data_filtered.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// 🟢 زر الخروج
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("login_token");
  localStorage.removeItem("schoolData");
  const basePath = window.location.origin.includes("github.io")
    ? "/munaseg/index.html"
    : "index.html";
  window.location.href = basePath;
});

// تحميل البيانات عند التشغيل
loadAllData();
