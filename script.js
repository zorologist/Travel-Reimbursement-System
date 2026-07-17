document.addEventListener('DOMContentLoaded', function () {
    const transportSelect = document.getElementById('transportSelect');
    const amountGroup = document.getElementById('amountGroup');
    const uploadGroup = document.getElementById('uploadGroup');
    const ticketAmountInput = document.getElementById('ticketAmount');
    const travelForm = document.getElementById('travelForm');

    // دالة للتحكم في ظهور واختفاء الحقول بناء على وسيلة المواصلات
    function toggleDynamicFields() {
        const selectedValue = transportSelect.value;

        // لو الاختيار سيارة خاصة أو أي وسيلة تانية مش تبع الشركة
        if (selectedValue === 'personal' || selectedValue === 'other') {
            
            // إظهار حقل المبلغ ومنطقة الرفع مع تأثير أنيميشن
            amountGroup.classList.remove('hidden');
            uploadGroup.classList.remove('hidden');
            amountGroup.classList.add('animate-fade');
            uploadGroup.classList.add('animate-fade');
            
            // جعل حقل المبلغ إجباري عند الظهور
            ticketAmountInput.setAttribute('required', 'required');
        } else {
            // إخفاء الحقول وإزالة الـ Required لو رجع لسيارة الشركة
            amountGroup.classList.add('hidden');
            uploadGroup.classList.add('hidden');
            amountGroup.classList.remove('animate-fade');
            uploadGroup.classList.remove('animate-fade');
            
            ticketAmountInput.removeAttribute('required');
            ticketAmountInput.value = ''; // تصفير القيمة
        }
    }

    // الاستماع لحدث التغيير في الـ Select Box
    transportSelect.addEventListener('change', toggleDynamicFields);

    // معالجة إرسال الفورم (Form Submission)
    travelForm.addEventListener('submit', function (e) {
        e.preventDefault(); // منع الصفحة من إعادة التحميل

        // تجميع البيانات لإرسالها للـ API / قاعدة البيانات لاحقاً
        const formData = new FormData(travelForm);
        const data = Object.fromEntries(formData.entries());

        console.log('تم تجميع بيانات طلب السفر وجاهزة للربط:', data);
        
        // رسالة تأكيد احترافية للموظف
        alert('تم إرسال طلب السفر بنظام إيجاس بنجاح، وهو الآن قيد التوجيه للمراجعة.');
    });
});