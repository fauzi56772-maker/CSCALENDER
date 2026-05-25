/**
 * KONFIGURASI DAN DATA STATIS
 */
const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const pasaranList = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"];

// Epoch untuk perhitungan Pasaran Jawa
// 1 Januari 1900 adalah hari Senin Pon. 
// Kita gunakan offset sederhana. 1 Jan 1900 = Index 2 (Pon) jika Legi=0.
const JAVA_EPOCH_DATE = new Date(1900, 0, 1); 
const JAVA_EPOCH_PASARAN_INDEX = 2; // Pon

/**
 * FUNGSI UTAMA: RENDER KALENDER
 */
let currentDate = new Date();

function initCalendar() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    // Isi Dropdown Bulan
    monthNames.forEach((m, index) => {
        let option = document.createElement('option');
        option.value = index;
        option.text = m;
        monthSelect.appendChild(option);
    });

    // Isi Dropdown Tahun (1950 - 2050)
    for (let y = 1950; y <= 2050; y++) {
        let option = document.createElement('option');
        option.value = y;
        option.text = y;
        yearSelect.appendChild(option);
    }

    // Event Listeners
    prevBtn.addEventListener('click', () => changeMonth(-1));
    nextBtn.addEventListener('click', () => changeMonth(1));
    
    monthSelect.addEventListener('change', (e) => {
        currentDate.setMonth(parseInt(e.target.value));
        renderCalendar();
    });

    yearSelect.addEventListener('change', (e) => {
        currentDate.setFullYear(parseInt(e.target.value));
        renderCalendar();
    });

    renderCalendar();
}

function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update Header Text & Dropdowns
    document.getElementById('monthYear').innerText = `${monthNames[month]} ${year}`;
    document.getElementById('monthSelect').value = month;
    document.getElementById('yearSelect').value = year;

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = "";

    // Hitung hari pertama bulan ini (0=Minggu, 1=Senin...)
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // Total hari dalam bulan ini
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Render Kotak Kosong (Padding Awal)
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day-cell', 'empty');
        calendarGrid.appendChild(emptyDiv);
    }

    // Render Tanggal
    const today = new Date();

    for (let i = 1; i <= lastDay; i++) {
        const dateObj = new Date(year, month, i);
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');

        // 1. Cek Hari Ini
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add('is-today');
        }

        // 2. Hitung Data Kalender Lain
        const hijriDate = gregorianToHijri(i, month + 1, year);
        const javaneseInfo = getJavaneseDate(dateObj);
        
        // 3. Cek Libur
        const holidayName = checkHoliday(dateObj, hijriDate, javaneseInfo);
        if (holidayName) {
            dayCell.classList.add('is-holiday');
            setupTooltip(dayCell, holidayName);
        }

        // 4. Susun HTML Internal Kotak
        // Angka Masehi (Besar)
        const gregorianSpan = document.createElement('span');
        gregorianSpan.classList.add('gregorian-date');
        gregorianSpan.innerText = i;

        // Angka Hijriyah (Kecil Atas)
        const hijriSpan = document.createElement('span');
        hijriSpan.classList.add('hijri-date');
        hijriSpan.innerText = `${hijriDate.day} ${hijriDate.monthName}`;

        // Pasaran Jawa (Kecil Bawah)
        const javaSpan = document.createElement('span');
        javaSpan.classList.add('javanese-date');
        javaSpan.innerText = `${javaneseInfo.dayName} ${javaneseInfo.pasaran}`;

        dayCell.appendChild(hijriSpan);
        dayCell.appendChild(gregorianSpan);
        dayCell.appendChild(javaSpan);

        calendarGrid.appendChild(dayCell);
    }
}

/**
 * LOGIKA KONVERSI MASEHI KE HIJRIYAH
 * Menggunakan Algoritma Kuwaiti (Standar Umm al-Qura approach approximation)
 */
function gregorianToHijri(d, m, y) {
    // Adjust month/year for formula if needed
    if (m <= 2) {
        y -= 1;
        m += 12;
    }
    
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
    
    // Konversi Julian Date ke Hijri
    // Rumus pendekatan standar
    let l = JD - 1948440 + 10632;
    let n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
    l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    
    let hijriMonth = Math.floor((24 * l) / 709);
    let hijriDay = l - Math.floor((709 * hijriMonth) / 24);
    let hijriYear = 30 * n + j - 30;

    // Nama Bulan Hijriyah
    const hijriMonths = [
        "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", 
        "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban", 
        "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"
    ];

    return {
        day: hijriDay,
        monthName: hijriMonths[hijriMonth - 1] || "Unknown",
        year: hijriYear
    };
}

/**
 * LOGIKA KALENDER JAWA
 */
function getJavaneseDate(date) {
    // Nama Hari Jawa
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dayIndex = date.getDay(); // 0-6
    
    // Hitung Pasaran
    // Selisih hari dari epoch
    const diffTime = Math.abs(date - JAVA_EPOCH_DATE);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Karena epoch 1 Jan 1900 adalah Pon (Index 2), kita hitung modulusnya
    // Rumus: (EpochIndex + DiffDays) % 5
    let pasaranIndex = (JAVA_EPOCH_PASARAN_INDEX + diffDays) % 5;
    
    return {
        dayName: dayNames[dayIndex],
        pasaran: pasaranList[pasaranIndex]
    };
}

/**
 * LOGIKA LIBUR NASIONAL & HARI SPESIAL
 */
function checkHoliday(dateObj, hijriObj, javaObj) {
    const d = dateObj.getDate();
    const m = dateObj.getMonth() + 1; // 1-12
    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });

    let holidays = [];

    // 1. Libur Nasional Tetap (Masehi)
    if (m === 1 && d === 1) holidays.push("Tahun Baru Masehi");
    if (m === 5 && d === 1) holidays.push("Hari Buruh Internasional");
    if (m === 6 && d === 1) holidays.push("Hari Lahir Pancasila");
    if (m === 8 && d === 17) holidays.push("Hari Kemerdekaan RI");
    if (m === 12 && d === 25) holidays.push("Hari Raya Natal");

    // 2. Libur Berdasarkan Hijriyah (Perkiraan)
    // Catatan: Untuk akurasi 100% pemerintah, biasanya perlu API atau tabel resmi Kemenag.
    // Di sini kita menggunakan logika tanggal tetap Hijriyah umum.
    if (hijriObj.monthName === "Muharram" && hijriObj.day === 1) holidays.push("Tahun Baru Islam (1 Muharram)");
    if (hijriObj.monthName === "Rabiul Awal" && hijriObj.day === 12) holidays.push("Maulid Nabi Muhammad SAW");
    if (hijriObj.monthName === "Ramadhan" && hijriObj.day === 1) holidays.push("Awal Puasa Ramadhan"); // Biasanya tidak libur full, tapi spesial
    if (hijriObj.monthName === "Syawal" && hijriObj.day === 1) holidays.push("Idul Fitri (1 Syawal)");
    if (hijriObj.monthName === "Dzulhijjah" && hijriObj.day === 10) holidays.push("Idul Adha");

    // 3. Hari Spesial Jawa
    if (javaObj.pasaran === "Kliwon" && dayName === "Jumat") {
        holidays.push("Jumat Kliwon (Hari Mistis Jawa)");
    }
    if (hijriObj.monthName === "Suro" && hijriObj.day === 1) { // Suro sering dianggap sama dengan Muharram
         // Logic tambahan jika ingin spesifik 1 Suro
    }

    return holidays.length > 0 ? holidays.join(", ") : null;
}

/**
 * TOOLTIP INTERAKTIF
 */
function setupTooltip(element, text) {
    const tooltip = document.getElementById('holidayTooltip');
    const tooltipText = document.getElementById('tooltipText');

    element.addEventListener('mouseenter', (e) => {
        tooltipText.innerText = text;
        tooltip.classList.remove('hidden');
        
        // Posisi tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.top = (rect.top - 40) + 'px';
        tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
        
        setTimeout(() => tooltip.classList.add('visible'), 10);
    });

    element.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
        setTimeout(() => tooltip.classList.add('hidden'), 200);
    });
}

// Jalankan saat load
document.addEventListener('DOMContentLoaded', initCalendar);
