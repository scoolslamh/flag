// ===============================
// 🟢 إعداد الاتصال بـ Supabase
// ===============================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://gtiypqqevuaswzxqgmar.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aXlwcXFldnVhc3d6eHFnbWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjIwMTcsImV4cCI6MjA3NzYzODAxN30.pA9fBRZn4VYqBrlaP0tsLNCeE6l-jzrIc0QQYGfuRTk";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔗 رابط Cloudflare Worker لرفع الملف
const DRIVE_API = "https://proud-limit-0aff.alsalamh11234.workers.dev/";

// =================================================
// 🟢 صفحة تسجيل الدخول (login.html)
// =================================================
if (document.getElementById("loginBtn")) {
  const loginBtn = document.getElementById("loginBtn");
  const msg = document.getElementById("message");
  const input = document.getElementById("schoolNumber");
  const spinner = document.getElementById("spinner");
  // ✅ دعم الضغط على Enter للدخول
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      loginBtn.click();
    }
  });

  // ✅ عند الضغط على زر الدخول
  loginBtn.addEventListener("click", async () => {
    const number = input.value.trim();
    msg.textContent = "";

    const digitsOnly = number.replace(/[^0-9]/g, "");
    if (digitsOnly.length < 5) {
      msg.textContent = "الرقم الوزاري يجب ألا يقل عن 5 أرقام.";
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "جاري البحث...";
    spinner.classList.remove("hidden");


    try {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .ilike("number", `%${number}%`)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        localStorage.setItem("schoolData", JSON.stringify(data));
        localStorage.setItem("login_token", "active");
        window.location.href = "form.html";
      } else {
        msg.textContent = "لم يتم العثور على الرقم الوزاري.";
      }
    } catch (err) {
      console.error("⚠️ خطأ في الاتصال:", err);
      msg.textContent = "⚠️ حدث خطأ أثناء الاتصال بقاعدة البيانات.";
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "دخول";
    }
  });
}

// =================================================
// 🟢 صفحة البيانات (form.html)
// =================================================
if (document.getElementById("updateForm")) {
  const msg = document.getElementById("message");
  const token = localStorage.getItem("login_token");
  const data = JSON.parse(localStorage.getItem("schoolData") || "{}");

  // ✅ منع الدخول المباشر دون تسجيل
  if (!token || !data.number) {
    alert("الرجاء تسجيل الدخول أولاً.");
    window.location.href = "index.html";
  }

  // ✅ زر الخروج
  const logoutBtn = document.createElement("button");
  logoutBtn.textContent = "🚪 تسجيل الخروج";
  logoutBtn.style.cssText =
    "background:#d9534f;color:#fff;border:none;padding:10px 15px;border-radius:8px;font-weight:bold;cursor:pointer;margin-bottom:15px;width:100%;";
  document.querySelector(".container").prepend(logoutBtn);

  logoutBtn.addEventListener("click", () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      localStorage.removeItem("login_token");
      localStorage.removeItem("schoolData");
      window.location.href = "index.html";
    }
  });

  // ✅ تعبئة البيانات في الحقول
  const fill = (id, val, lock = false) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = val || "";
      if (lock) el.setAttribute("readonly", true);
    }
  };

  fill("schoolNumber", data.number, true);
  fill("schoolName", data.school_name, true);
  fill("schoolGender", data.gender, true);
  fill("schoolArea", data.area, true);
  fill("principalName", data.principal);
  fill("principalPhone", data.principal_phone);
  fill("schoolEmail", data.email);
  fill("ownership", data.ownership);
  fill("coordinatorName", data.coordinator);
  fill("coordinatorID", data.coordinator_id);
  fill("coordinatorPhone", data.coordinator_phone);
  fill("jobType", data.job_type);
  fill("qualification", data.qualification);
  fill("farsTitle", data.fars_title);
  fill("level", data.level);
  fill("grade", data.grade);

  // ✅ إذا كانت البيانات مؤكدة مسبقًا
  if (data.status === "تم التأكيد") {
    document
      .querySelectorAll("input, select")
      .forEach((i) => i.setAttribute("readonly", true));
    document.getElementById("saveBtn").disabled = true;
    msg.textContent = "تم تأكيد البيانات مسبقًا — عرض فقط.";
  } else {
    // ✅ عند الضغط على زر التحديث فقط لو لم يتم التأكيد
    const form = document.getElementById("updateForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      document.getElementById("confirmBox").classList.remove("hidden");
    });

    // ✅ عند تأكيد الحفظ
    document
      .getElementById("confirmBtn")
      .addEventListener("click", async () => {
        msg.textContent = "⏳ جاري حفظ البيانات...";
        document.getElementById("confirmBox").classList.add("hidden");

        // 1️⃣ جمع الحقول
        const fields = {
          principal: document.getElementById("principalName").value,
          principal_phone: document.getElementById("principalPhone").value,
          email: document.getElementById("schoolEmail").value,
          ownership: document.getElementById("ownership").value,
          coordinator: document.getElementById("coordinatorName").value,
          coordinator_id: document.getElementById("coordinatorID").value,
          coordinator_phone:
            document.getElementById("coordinatorPhone").value,
          job_type: document.getElementById("jobType").value,
          qualification: document.getElementById("qualification").value,
          fars_title: document.getElementById("farsTitle").value,
          level: document.getElementById("level").value,
          grade: document.getElementById("grade").value,
        };

        // 2️⃣ رفع ملف PDF (إن وجد)
        const fileInput = document.getElementById("assignmentFile");
        let fileUrl = "";

        if (fileInput && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          if (file.type !== "application/pdf") {
            msg.textContent = "❌ يُسمح فقط برفع ملفات PDF.";
            return;
          }

          try {
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result.split(",")[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            const res = await fetch(DRIVE_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file: base64,
                coordinatorName: fields.coordinator || "منسق",
                schoolName:
                  document.getElementById("schoolName").value || "مدرسة",
              }),
            });

            const result = await res.json();

            if (result.success) {
              fileUrl = result.url;
              msg.innerHTML = `✅ تم رفع الملف بنجاح.<br>
              <a href="${fileUrl}" target="_blank">عرض الملف في Google Drive</a>`;
            } else {
              msg.textContent = "⚠️ لم يتم رفع الملف بنجاح.";
            }
          } catch (err) {
            console.error("❌ خطأ أثناء رفع الملف:", err);
            msg.textContent = "❌ حدث خطأ أثناء رفع الملف.";
          }
        }

        // 3️⃣ حفظ البيانات في Supabase
        try {
          const { error } = await supabase
            .from("schools")
            .update({
              ...fields,
              pdf_url: fileUrl,
              status: "تم التأكيد",
              last_update: new Date().toISOString(),
            })
            .eq("number", data.number);

          if (error) throw error;

          msg.textContent = "✅ تم حفظ البيانات ورفع الملف بنجاح.";
          document
            .querySelectorAll("input, select")
            .forEach((i) => i.setAttribute("readonly", true));
          document.getElementById("saveBtn").disabled = true;
        } catch (err) {
          console.error("⚠️ فشل الحفظ:", err);
          msg.textContent = "⚠️ حدث خطأ أثناء حفظ البيانات.";
        }
      });
  }
}
