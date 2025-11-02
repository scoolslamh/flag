// ===============================
// 🟢 إعداد الاتصال بـ Supabase
// ===============================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://gtiypqqevuaswzxqgmar.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aXlwcXFldnVhc3d6eHFnbWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjIwMTcsImV4cCI6MjA3NzYzODAxN30.pA9fBRZn4VYqBrlaP0tsLNCeE6l-jzrIc0QQYGfuRTk";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔗 رابط Google Apps Script (خاص برفع الملف فقط)
const DRIVE_API =
  "https://script.google.com/macros/s/AKfycbx7Bf96ppW_jpNKzCZcBpFkG8ejdPkRCpGx_CgKnHgME3bqHXMT4tyMfxfyKSpK9afkAA/exec";


// ============================
// 🟢 صفحة الدخول
// ============================
if (document.getElementById("loginBtn")) {
  const loginBtn = document.getElementById("loginBtn");
  const msg = document.getElementById("message");

  loginBtn.addEventListener("click", async () => {
    const number = document.getElementById("schoolNumber").value.trim();
    msg.textContent = "";

    // ✅ تحقق من الرقم الوزاري
    const digitsOnly = number.replace(/[^0-9]/g, "");
    if (digitsOnly.length < 5) {
      msg.textContent = "الرقم الوزاري يجب ألا يقل عن 5 أرقام.";
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "جاري التحقق...";

    try {
      // 🔹 جلب البيانات من Supabase
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("number", number)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        localStorage.setItem("schoolData", JSON.stringify(data));
        window.location.href = "form.html";
      } else {
        msg.textContent = "لم يتم العثور على الرقم الوزاري.";
      }
    } catch (err) {
      msg.textContent = "⚠️ خطأ في الاتصال بقاعدة البيانات.";
      console.error(err);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "دخول";
    }
  });
}


// ============================
// 🟢 صفحة البيانات (form.html)
// ============================
if (document.getElementById("updateForm")) {
  const data = JSON.parse(localStorage.getItem("schoolData") || "{}");
  const msg = document.getElementById("message");

  if (!data || !data.number) {
    msg.textContent = "الرجاء العودة للصفحة الرئيسية.";
  } else {
    // ✅ تعبئة الحقول
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

    // إذا كانت البيانات مؤكدة مسبقًا
    if (data.status === "تم التأكيد") {
      document
        .querySelectorAll("input, select")
        .forEach((i) => i.setAttribute("readonly", true));
      document.getElementById("saveBtn").disabled = true;
      msg.textContent = "تم تأكيد البيانات مسبقًا — عرض فقط.";
      return;
    }

    // عند الضغط على زر حفظ
    document
      .getElementById("updateForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        document.getElementById("confirmBox").classList.remove("hidden");
      });

    // عند تأكيد الحفظ
    document
      .getElementById("confirmBtn")
      .addEventListener("click", async () => {
        msg.textContent = "⏳ جاري حفظ البيانات...";

        // 1️⃣ تجهيز البيانات
        const fields = {
          principal: document.getElementById("principalName").value,
          principal_phone: document.getElementById("principalPhone").value,
          email: document.getElementById("schoolEmail").value,
          ownership: document.getElementById("ownership").value,
          coordinator: document.getElementById("coordinatorName").value,
          coordinator_id: document.getElementById("coordinatorID").value,
          coordinator_phone: document.getElementById("coordinatorPhone").value,
          job_type: document.getElementById("jobType").value,
          qualification: document.getElementById("qualification").value,
          fars_title: document.getElementById("farsTitle").value,
          level: document.getElementById("level").value,
          grade: document.getElementById("grade").value,
        };

        // 2️⃣ رفع الملف إلى Google Drive
        const fileInput = document.getElementById("assignmentFile");
        let fileUrl = "";

        if (fileInput && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          if (file.type !== "application/pdf") {
            msg.textContent = "❌ يُسمح فقط برفع ملفات PDF.";
            return;
          }

          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          try {
            const res = await fetch(DRIVE_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file: base64,
                coordinatorName: fields.coordinator || "منسق",
              }),
            });
            const result = await res.json();
            if (result.success) fileUrl = result.url;
          } catch (err) {
            console.error("خطأ أثناء رفع الملف:", err);
          }
        }

        // 3️⃣ حفظ البيانات في Supabase
        const { error } = await supabase
          .from("schools")
          .update({
            ...fields,
            pdf_url: fileUrl,
            status: "تم التأكيد",
            last_update: new Date().toISOString(),
          })
          .eq("number", data.number);

        if (error) {
          msg.textContent = "⚠️ فشل في الحفظ، تحقق من الاتصال.";
          console.error(error);
        } else {
          msg.textContent = "✅ تم حفظ البيانات ورفع الملف بنجاح.";
          document
            .querySelectorAll("input")
            .forEach((i) => i.setAttribute("readonly", true));
          document.getElementById("saveBtn").disabled = true;
          document.getElementById("confirmBox").classList.add("hidden");
        }
      });
  }
}
