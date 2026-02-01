// ✅ الرابط المحدث لسكربت قوقل (الحساب الجديد)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx1_xZaPHomeGg40rrPAokN68-4nKVMi3IvBdOnVWOt2S4NSsZhQykdmf-yhBLMkizHgw/exec";

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
        msg.textContent = ""; // تنظيف الرسائل السابقة

        try {
            // الاتصال المباشر بقوقل مع إضافة طابع زمني لمنع الكاش
            const finalUrl = `${SCRIPT_URL}?number=${num}&t=${Date.now()}`;
            
            const response = await fetch(finalUrl, {
                method: "GET",
                redirect: "follow"
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (err) {
                throw new Error("الاستجابة من السيرفر غير صالحة.");
            }

            // ✅ التعديل الجديد: إخفاء السبنر فوراً عند استلام رد ناجح من السيرفر
            if (spinner) spinner.classList.add("hidden");

            if (result.success) {
                // ✨ إضافة ميزة منع التكرار وعرض التقرير السابق
                if (result.alreadySubmitted) {
                    msg.innerHTML = `
                        <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; border: 1px solid #ffeeba; margin-bottom: 15px;">
                            ⚠️ تم تعبئة البيانات مسبقاً لهذه المدرسة.<br><br>
                            <a href="${result.pdfUrl}" target="_blank" 
                               style="display: inline-block; background: #155724; color: white; padding: 8px 15px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                               📥 تحميل التقرير السابق (PDF)
                            </a>
                        </div>
                    `;
                    loginBtn.disabled = false;
                    loginBtn.textContent = "دخول مرة أخرى";
                    // تخزين البيانات في حال رغب المستخدم في الدخول مرة أخرى للمراجعة
                    localStorage.setItem("schoolData", JSON.stringify(result.data));
                } else {
                    // إذا لم يتم التعبئة مسبقاً، التوجه لصفحة النموذج مباشرة
                    localStorage.setItem("schoolData", JSON.stringify(result.data));
                    window.location.href = "form.html";
                }
            } else {
                msg.textContent = "❌ الرقم الوزاري غير موجود في السجلات.";
                msg.style.color = "red";
                resetLogin();
            }

        } catch (error) {
            console.error("Login Error:", error);
            msg.textContent = "⚠️ تعذر الاتصال بالخادم. تأكد من تفعيل CORS أو جرب متصفحاً آخر.";
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
        // تعبئة البيانات التلقائية
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

            // 📸 دالة مطورة لتصغير وضغط الصور قبل الرفع لضمان عملها من الجوال
            const getBase64 = (file) => new Promise((resolve, reject) => {
                if (!file) return resolve("");
                
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        // تحديد أقصى عرض (1200px) للحفاظ على توازن الجودة والحجم
                        const MAX_WIDTH = 1200;
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // ضغط الصورة بنسبة 70% لتحويل حجمها من ميجابايت إلى كيلوبايت
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                        resolve(compressedBase64.split(",")[1]);
                    };
                };
                reader.onerror = error => reject(error);
            });

            try {
                // تجميع البيانات مع الصور المضغوطة
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

                // حفظ البيانات في الذاكرة المحلية والانتقال لصفحة الإقرار
                localStorage.setItem("fullFormPayload", JSON.stringify(payload));
                window.location.href = "declaration.html";

            } catch (err) {
                console.error("Image Processing Error:", err);
                alert("⚠️ حدث خطأ أثناء معالجة الصور، تأكد من جودة اتصال الإنترنت.");
                submitBtn.disabled = false;
                submitBtn.textContent = "التالي";
                if (spinner) spinner.classList.add("hidden");
            }
        });
    }
}
// ==========================================
// ✍️ 3. منطق صفحة الإقرار (declaration.html)
// ==========================================
if (document.getElementById("signature-pad")) {
    const canvas = document.getElementById("signature-pad");
    const signaturePad = new SignaturePad(canvas, {
        minWidth: 1.5, maxWidth: 4, penColor: "rgb(0, 0, 128)"
    });

    const schoolInfo = JSON.parse(localStorage.getItem("schoolData"));
    const formData = JSON.parse(localStorage.getItem("fullFormPayload"));

    if (!schoolInfo || !formData) {
        window.location.href = "index.html";
    } else {
        document.getElementById("schoolInfo").textContent = `${schoolInfo.school_name} - ${schoolInfo.number}`;
        document.getElementById("schoolNameShow").textContent = schoolInfo.school_name;
        document.getElementById("principalNameShow").textContent = formData.principal;

        // تعبئة الحقول المخفية للنموذج
        if (document.getElementById("finalSchoolName")) document.getElementById("finalSchoolName").value = schoolInfo.school_name;
        if (document.getElementById("finalPrincipalName")) document.getElementById("finalPrincipalName").value = formData.principal;

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
                    body: JSON.stringify(payload)
                });

                alert("✅ تم إرسال التقرير بنجاح");
                localStorage.clear();
                window.location.href = "index.html";

            } catch (e) {
                alert("❌ فشل الإرسال");
                btn.disabled = false;
                if (spinner) spinner.classList.add("hidden");
            }
        };
    }
}
// دالة الخروج الموحدة لجميع الصفحات
if (document.getElementById("logoutBtn")) {
    document.getElementById("logoutBtn").addEventListener("click", () => {
        if (confirm("هل أنت متأكد من تسجيل الخروج؟ سيتم مسح البيانات غير المحفوظة.")) {
            localStorage.clear(); // مسح الذاكرة المحلية نهائياً
            window.location.href = "index.html"; // العودة لصفحة الدخول
        }
    });
}