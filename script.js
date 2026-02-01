// ==========================================
// ✅ إعدادات عامة
// ==========================================

// رابط Google Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxiXu4I-sjchK6Y7UQ0iok5Sv0eopdQqZbL3vmXNeda4EKfBxLlHZyZPtoxZF6GDbZAag/exec";

// Proxy لتجاوز CORS (لـ GET فقط)
const PROXY = "https://api.allorigins.win/raw?url=";


// ==========================================
// 🔵 1. منطق صفحة الدخول (index.html)
// ==========================================
if (document.getElementById("loginBtn")) {

    const loginBtn = document.getElementById("loginBtn");
    const input = document.getElementById("schoolNumber");
    const msg = document.getElementById("message");
    const spinner = document.getElementById("loadingSpinner");

    loginBtn.addEventListener("click", async () => {

        const num = input.value.trim();

        if (!num) {
            msg.textContent = "⚠️ يرجى إدخال الرقم الوزاري";
            msg.style.color = "red";
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = "جاري التحقق...";
        if (spinner) spinner.classList.remove("hidden");

        try {
            const targetUrl = `${SCRIPT_URL}?number=${num}&t=${Date.now()}`;
            const finalUrl = PROXY + encodeURIComponent(targetUrl);

            const response = await fetch(finalUrl);
            const text = await response.text();

            let result;
            try {
                result = JSON.parse(text);
            } catch {
                throw new Error("الاستجابة ليست JSON");
            }

            if (result.success) {
                localStorage.setItem("schoolData", JSON.stringify(result.data));
                window.location.href = "form.html";
            } else {
                msg.textContent = "❌ الرقم الوزاري غير موجود في السجلات.";
                msg.style.color = "red";
                resetLogin();
            }

        } catch (error) {
            console.error("Login Error:", error);
            msg.textContent = "⚠️ تعذر الاتصال بالخادم. حاول لاحقًا.";
            msg.style.color = "red";
            resetLogin();
        }

        function resetLogin() {
            loginBtn.disabled = false;
            loginBtn.textContent = "دخول";
            if (spinner) spinner.classList.add("hidden");
        }
    });
}


// ==========================================
// 🟢 2. منطق صفحة البيانات (form.html)
// ==========================================
if (document.getElementById("mainUpdateForm")) {

    const schoolData = JSON.parse(localStorage.getItem("schoolData"));

    if (!schoolData) {
        window.location.href = "index.html";
    } else {

        document.getElementById("schoolDisplayName").textContent = schoolData.school_name || "";
        document.getElementById("areaDisplayName").textContent = schoolData.area || "";
        document.getElementById("principalName").value = schoolData.principal || "";
        document.getElementById("principalPhone").value = schoolData.principal_phone || "";
        document.getElementById("schoolEmail").value = schoolData.email || "";
        document.getElementById("schoolAddress").value = schoolData.address || "";

        const form = document.getElementById("mainUpdateForm");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById("submitBtn");
            const spinner = document.getElementById("loadingSpinner");

            submitBtn.disabled = true;
            submitBtn.textContent = "⏳ جاري المعالجة...";
            if (spinner) spinner.classList.remove("hidden");

            const getBase64 = (file) => new Promise((resolve, reject) => {
                if (!file) return resolve("");
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(",")[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            try {
                const payload = {
                    principal: document.getElementById("principalName").value,
                    principalPhone: document.getElementById("principalPhone").value,
                    address: document.getElementById("schoolAddress").value,
                    email: document.getElementById("schoolEmail").value,
                    flagStatus: document.getElementById("flagStatus").value,
                    flagNotes: document.getElementById("flagNotes").value,
                    kingsStatus: document.getElementById("kingsStatus").value,
                    kingsNotes: document.getElementById("kingsNotes").value,
                    imgFlag: await getBase64(document.getElementById("imgFlag").files[0]),
                    imgKings: await getBase64(document.getElementById("imgKings").files[0])
                };

                localStorage.setItem("fullFormPayload", JSON.stringify(payload));
                window.location.href = "declaration.html";

            } catch (err) {
                console.error("Form Error:", err);
                alert("⚠️ حدث خطأ أثناء معالجة البيانات");
                submitBtn.disabled = false;
                submitBtn.textContent = "التالي";
                if (spinner) spinner.classList.add("hidden");
            }
        });
    }
}


// ==========================================
// ✍️ 3. منطق صفحة الإقرار والتوقيع (declaration.html)
// ==========================================
if (document.getElementById("signature-pad")) {

    const canvas = document.getElementById("signature-pad");
    const signaturePad = new SignaturePad(canvas, {
        minWidth: 1.5,
        maxWidth: 4,
        penColor: "rgb(0, 0, 128)"
    });

    const schoolInfo = JSON.parse(localStorage.getItem("schoolData"));
    const formData = JSON.parse(localStorage.getItem("fullFormPayload"));

    if (!schoolInfo || !formData) {
        window.location.href = "index.html";
    } else {

        document.getElementById("schoolInfo").textContent =
            `${schoolInfo.school_name} - ${schoolInfo.number}`;

        document.getElementById("schoolNameShow").textContent = schoolInfo.school_name;
        document.getElementById("principalNameShow").textContent = formData.principal;

        document.getElementById("finalSchoolName").value = schoolInfo.school_name;
        document.getElementById("finalPrincipalName").value = formData.principal;

        function resizeCanvas() {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
            signaturePad.clear();
        }

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        document.getElementById("clearBtn").onclick = () => signaturePad.clear();

        document.getElementById("submitAllBtn").onclick = async () => {

            if (signaturePad.isEmpty()) {
                alert("⚠️ يرجى التوقيع قبل الإرسال");
                return;
            }

            const btn = document.getElementById("submitAllBtn");
            const spinner = document.getElementById("loadingSpinner");

            btn.disabled = true;
            if (spinner) spinner.classList.remove("hidden");

            const payload = {
                ...formData,
                signature: signaturePad.toDataURL().split(",")[1],
                schoolNumber: schoolInfo.number,
                schoolName: schoolInfo.school_name,
                principal: formData.principal
            };

            try {
                await fetch(SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                alert("✅ تم إرسال التقرير بنجاح");
                localStorage.clear();
                window.location.href = "index.html";

            } catch (e) {
                console.error("Submit Error:", e);
                alert("❌ فشل الإرسال");
                btn.disabled = false;
                if (spinner) spinner.classList.add("hidden");
            }
        };
    }
}
