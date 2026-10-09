/**
 * Complete 114 Exam Serial Taxonomy & Codes
 * Medical Secret Files - Precision Medical Admission Catalog
 */

const subjectData = [
    { 
        cat: "উদ্ভিদবিজ্ঞান", 
        icon: "fa-seedling",
        color: "from-emerald-600 to-green-600",
        items: [
            {t:"কোষ ও এর গঠন", c:"1020325001", url:"Question/blog-page_4.html", qCount: 100, duration: 50},
            {t:"কোষ বিভাজন", c:"1020325002", url:"Question/blog-page_76.html", qCount: 100, duration: 50},
            {t:"কোষ রসায়ন", c:"1020325003", url:"Question/blog-page_40.html", qCount: 100, duration: 50},
            {t:"অণুজীব", c:"1020325004", url:"Question/blog-page_33.html", qCount: 100, duration: 50},
            {t:"শৈবাল ও ছত্রাক", c:"1020325005", url:"Question/blog-page_21.html", qCount: 100, duration: 50},
            {t:"ব্রায়োফাইটা ও টেরিডোফাইটা", c:"1020325006", url:"Question/blog-page_26.html", qCount: 100, duration: 50},
            {t:"নগ্নবীজী ও আবৃতবীজী উদ্ভিদ", c:"1020325007", url:"Question/blog-page_12.html", qCount: 100, duration: 50},
            {t:"টিস্যু ও টিস্যুতন্ত্র", c:"1020325008", url:"Question/blog-page_22.html", qCount: 100, duration: 50},
            {t:"উদ্ভিদ শারীরতত্ত্ব", c:"1020325009", url:"Question/blog-page_0.html", qCount: 100, duration: 50},
            {t:"উদ্ভিদ প্রজনন", c:"1020325010", url:"Question/blog-page_7.html", qCount: 100, duration: 50},
            {t:"জীবপ্রযুক্তি", c:"1020325011", url:"Question/blog-page_54.html", qCount: 100, duration: 50},
            {t:"জীবের পরিবেশ, বিস্তার ও সংরক্ষণ", c:"1020325012", url:"Question/blog-page_10.html", qCount: 100, duration: 50},
            {t:"জীববিজ্ঞান প্রথম পত্র শর্ট সিলেবাস", c:"1020325013", url:"Question/blog-page_83.html", qCount: 100, duration: 50},
            {t:"জীববিজ্ঞান প্রথম পত্র পেপার ফাইনাল", c:"1020325014", url:"Question/blog-page_19.html", qCount: 100, duration: 50}
        ]
    },
    { 
        cat: "প্রাণিবিজ্ঞান", 
        icon: "fa-dna",
        color: "from-teal-600 to-cyan-600",
        items: [
            {t:"প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস", c:"1020325015", url:"Question/blog-page_97.html", qCount: 100, duration: 50},
            {t:"প্রাণীর পরিচিতি (হাইড্রা)", c:"1020325016", url:"Question/blog-page_36.html", qCount: 100, duration: 50},
            {t:"প্রাণীর পরিচিতি (ঘাসফড়িং)", c:"1020325017", url:"Question/blog-page_69.html", qCount: 100, duration: 50},
            {t:"প্রাণীর পরিচিতি (রুই মাছ)", c:"1020325018", url:"Question/blog-page_71.html", qCount: 100, duration: 50},
            {t:"পরিপাক ও শোষণ", c:"1020325019", url:"Question/blog-page_47.html", qCount: 100, duration: 50},
            {t:"রক্ত ও সংবহন", c:"1020325020", url:"Question/blog-page_14.html", qCount: 100, duration: 50},
            {t:"শ্বাসক্রিয়া ও শ্বসন", c:"1020325021", url:"Question/blog-page_42.html", qCount: 100, duration: 50},
            {t:"বর্জ্য ও নিষ্কাশন", c:"1020325022", url:"Question/blog-page_66.html", qCount: 100, duration: 50},
            {t:"চলন ও অঙ্গচালনা", c:"1020325023", url:"Question/blog-page_27.html", qCount: 100, duration: 50},
            {t:"সমন্বয় ও নিয়ন্ত্রণ", c:"1020325024", url:"Question/blog-page_46.html", qCount: 100, duration: 50},
            {t:"মানব জীবনের ধারাবাহিকতা", c:"1020325025", url:"Question/blog-page_94.html", qCount: 100, duration: 50},
            {t:"মানবদেহের প্রতিরক্ষা (ইমিউনিটি)", c:"1020325026", url:"Question/blog-page_73.html", qCount: 100, duration: 50},
            {t:"জিনতত্ত্ব ও বিবর্তন", c:"1020325027", url:"Question/blog-page_59.html", qCount: 100, duration: 50},
            {t:"জীববিজ্ঞান দ্বিতীয় পত্র পেপার ফাইনাল", c:"1020325028", url:"Question/blog-page_1.html", qCount: 100, duration: 50}
        ]
    },
    { 
        cat: "পদার্থবিজ্ঞান প্রথম পত্র", 
        icon: "fa-atom",
        color: "from-blue-600 to-indigo-600",
        items: [
            {t:"ভৌতজগৎ ও পরিমাপ", c:"1020325029", url:"Question/blog-page_89.html", qCount: 100, duration: 50},
            {t:"ভেক্টর", c:"1020325030", url:"Question/blog-page_41.html", qCount: 100, duration: 50},
            {t:"গতিবিদ্যা", c:"1020325031", url:"Question/blog-page_51.html", qCount: 100, duration: 50},
            {t:"নিউটনিয়ান বলবিদ্যা", c:"1020325032", url:"Question/blog-page_84.html", qCount: 100, duration: 50},
            {t:"কাজ, শক্তি ও ক্ষমতা", c:"1020325033", url:"Question/blog-page_65.html", qCount: 100, duration: 50},
            {t:"মহাকর্ষ ও অভিকর্ষ", c:"1020325034", url:"Question/blog-page_13.html", qCount: 100, duration: 50},
            {t:"পদার্থের গাঠনিক ধর্ম", c:"1020325035", url:"Question/blog-page_63.html", qCount: 100, duration: 50},
            {t:"পর্যাবৃত্ত গতি", c:"1020325036", url:"Question/blog-page_82.html", qCount: 100, duration: 50},
            {t:"তরঙ্গ", c:"1020325037", url:"Question/blog-page_98.html", qCount: 100, duration: 50},
            {t:"আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব", c:"1020325038", url:"Question/blog-page_34.html", qCount: 100, duration: 50},
            {t:"পদার্থবিজ্ঞান প্রথম পত্র শর্ট সিলেবাস", c:"1020325039", url:"Question/blog-page_8.html", qCount: 100, duration: 50},
            {t:"পদার্থবিজ্ঞান প্রথম পত্র পেপার ফাইনাল", c:"1020325040", url:"Question/blog-page_86.html", qCount: 100, duration: 50}
        ]
    },
    { 
        cat: "পদার্থবিজ্ঞান দ্বিতীয় পত্র", 
        icon: "fa-bolt",
        color: "from-indigo-600 to-purple-600",
        items: [
            {t:"তাপগতিবিদ্যা", c:"1020325041", url:"Question/blog-page_95.html", qCount: 100, duration: 50},
            {t:"স্থির তড়িৎ", c:"1020325042", url:"Question/blog-page_53.html", qCount: 100, duration: 50},
            {t:"চল তড়িৎ", c:"1020325043", url:"Question/blog-page_67.html", qCount: 100, duration: 50},
            {t:"তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব", c:"1020325044", url:"Question/blog-page_44.html", qCount: 100, duration: 50},
            {t:"তাড়িতচৌম্বকীয় আবেশ ও পরিবর্তী প্রবাহ", c:"1020325045", url:"Question/blog-page_15.html", qCount: 100, duration: 50},
            {t:"জ্যামিতিক আলোকবিজ্ঞান", c:"1020325046", url:"Question/blog-page_68.html", qCount: 100, duration: 50},
            {t:"ভৌত আলোকবিজ্ঞান", c:"1020325047", url:"Question/blog-page_55.html", qCount: 100, duration: 50},
            {t:"আধুনিক পদার্থবিজ্ঞানের সূচনা", c:"1020325048", url:"Question/blog-page_25.html", qCount: 100, duration: 50},
            {t:"পরমাণুর মডেল ও নিউক্লিয়ার পদার্থবিজ্ঞান", c:"1020325049", url:"Question/blog-page_38.html", qCount: 100, duration: 50},
            {t:"সেমিকন্ডাক্টর ও ইলেকট্রনিক্স", c:"1020325050", url:"Question/blog-page_56.html", qCount: 100, duration: 50},
            {t:"জ্যোতির্বিজ্ঞান", c:"1020325051", url:"Question/blog-page_5.html", qCount: 100, duration: 50},
            {t:"পদার্থবিজ্ঞান দ্বিতীয় পত্র শর্ট সিলেবাস", c:"1020325052", url:"Question/blog-page_61.html", qCount: 100, duration: 50},
            {t:"পদার্থবিজ্ঞান দ্বিতীয় পত্র পেপার ফাইনাল", c:"1020325053", url:"Question/blog-page_80.html", qCount: 100, duration: 50}
        ]
    },
    { 
        cat: "রসায়ন প্রথম পত্র", 
        icon: "fa-flask",
        color: "from-rose-600 to-pink-600",
        items: [
            {t:"ল্যাবরেটরির নিরাপদ ব্যবহার", c:"1020325054", url:"Question/blog-page_45.html", qCount: 100, duration: 50},
            {t:"গুণগত রসায়ন", c:"1020325055", url:"Question/blog-page_70.html", qCount: 100, duration: 50},
            {t:"মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন", c:"1020325056", url:"Question/blog-page_2.html", qCount: 100, duration: 50},
            {t:"রাসায়নিক পরিবর্তন", c:"1020325057", url:"Question/blog-page_32.html", qCount: 100, duration: 50},
            {t:"কর্মমুখী রসায়ন", c:"1020325058", url:"Question/blog-page_74.html", qCount: 100, duration: 50},
            {t:"রসায়ন প্রথম পত্র শর্ট সিলেবাস", c:"1020325059", url:"Question/blog-page_75.html", qCount: 100, duration: 50},
            {t:"রসায়ন প্রথম পত্র পেপার ফাইনাল", c:"1020325060", url:"Question/blog-page_16.html", qCount: 100, duration: 50}
        ]
    },
    { 
        cat: "রসায়ন দ্বিতীয় পত্র", 
        icon: "fa-vial",
        color: "from-purple-600 to-rose-600",
        items: [
            {t:"পরিবেশ রসায়ন", c:"1020325061", url:"Question/blog-page_99.html", qCount: 100, duration: 50},
            {t:"জৈব রসায়ন", c:"1020325062", url:"Question/blog-page_37.html", qCount: 100, duration: 50},
            {t:"পরিমাণগত রসায়ন", c:"1020325063", url:"Question/blog-page_9.html", qCount: 100, duration: 50},
            {t:"তড়িৎ রসায়ন", c:"1020325064", url:"Question/blog-page_87.html", qCount: 100, duration: 50},
            {t:"অর্থনৈতিক রসায়ন", c:"1020325065", url:"Question/blog-page_17.html", qCount: 100, duration: 50},
            {t:"রসায়ন দ্বিতীয় পত্র শর্ট সিলেবাস", c:"1020325066", url:"Question/blog-page_28.html", qCount: 100, duration: 50},
            {t:"রসায়ন দ্বিতীয় পত্র পেপার ফাইনাল", c:"1020325067", url:"Question/blog-page_52.html", qCount: 100, duration: 50}
        ]
    },
    { 
        cat: "সাধারণ জ্ঞান", 
        icon: "fa-earth-asia",
        color: "from-amber-600 to-orange-600",
        items: [
            {t:"প্রাচীন বাংলার ইতিহাস (১৯৪৭ পূর্ববর্তী)", c:"1020325068", url:"Question/general-knowledge-before-1948.html", qCount: 100, duration: 50},
            {t:"মুক্তিযুদ্ধ ও আধুনিক বাংলাদেশ (১৯৪৭ পরবর্তী)", c:"1020325069", url:"Question/general-knowledge-after-1948.html", qCount: 100, duration: 50},
            {t:"আন্তর্জাতিক বিষয়াবলী", c:"1020325070", url:"Question/general-knowledge-international.html", qCount: 100, duration: 50},
            {t:"সাম্প্রতিক সাধারণ জ্ঞান", c:"1020325071", url:"Question/general-knowledge-recent.html", qCount: 100, duration: 50},
            {t:"সাধারণ জ্ঞান স্পেশাল (BCS, MAT, DAT Question Bank)", c:"1020325072", url:"Question/general-knowledge-bcs-mat-dat-and-others.html", qCount: 100, duration: 50},
            {t:"সাধারণ জ্ঞান ফুল সিলেবাস ০১", c:"1020325073", url:"Question/general-knowledge-full-syllabus-01.html", qCount: 100, duration: 50},
            {t:"সাধারণ জ্ঞান ফুল সিলেবাস ০২", c:"1020325074", url:"Question/general-knowledge-full-syllabus-02.html", qCount: 100, duration: 50},
            {t:"সাধারণ জ্ঞান মেগা মডেল টেস্ট", c:"1020325075", url:"Question/blog-page_72.html", qCount: 100, duration: 50}
        ]
    },
    { 
        cat: "ইংরেজি", 
        icon: "fa-language",
        color: "from-sky-600 to-blue-600",
        items: [
            {t:"English Grammar Mastery Part 1", c:"1020325076", url:"Question/english-grammar-01.html", qCount: 100, duration: 50},
            {t:"English Grammar Mastery Part 2", c:"1020325077", url:"Question/english-grammar-02.html", qCount: 100, duration: 50},
            {t:"English Vocabulary & Idioms Part 1", c:"1020325078", url:"Question/english-vocabulary-01.html", qCount: 100, duration: 50},
            {t:"English Vocabulary & Idioms Part 2", c:"1020325079", url:"Question/english-vocabulary-02.html", qCount: 100, duration: 50},
            {t:"Medical English Full Syllabus Final", c:"1020325080", url:"Question/eng-bcs-dat-mat-others.html", qCount: 100, duration: 50}
        ]
    },
    { 
        cat: "সাবজেক্ট ফাইনাল", 
        icon: "fa-graduation-cap",
        color: "from-fuchsia-600 to-purple-600",
        items: [
            {t:"উদ্ভিদবিজ্ঞান পূর্ণাঙ্গ ফাইনাল", c:"1020325081", url:"Question/blog-page_49.html", qCount: 100, duration: 50},
            {t:"প্রাণিবিজ্ঞান পূর্ণাঙ্গ ফাইনাল", c:"1020325082", url:"Question/blog-page_3.html", qCount: 100, duration: 50},
            {t:"জীববিজ্ঞান পূর্ণাঙ্গ ফাইনাল (১ম ও ২য় পত্র)", c:"1020325083", url:"Question/blog-page_88.html", qCount: 100, duration: 50},
            {t:"পদার্থবিজ্ঞান পূর্ণাঙ্গ ফাইনাল (১ম ও ২য় পত্র)", c:"1020325084", url:"Question/general-knowledge-full-syllabus-01.html", qCount: 100, duration: 50},
            {t:"রসায়ন পূর্ণাঙ্গ ফাইনাল (১ম ও ২য় পত্র)", c:"1020325085", url:"Question/general-knowledge-full-syllabus-02.html", qCount: 100, duration: 50},
            {t:"সাধারণ জ্ঞান ও ইংরেজি কম্বাইন্ড ফাইনাল", c:"1020325086", url:"Question/english-full-syllabus-01.html", qCount: 100, duration: 50},
            {t:"মেডিকেল স্পেশাল কম্বাইন্ড পেপার ফাইনাল", c:"1020325087", url:"Question/english-full-syllabus-02.html", qCount: 100, duration: 50}
        ]
    },
    { 
        cat: "পূর্ণাঙ্গ মডেল টেস্ট", 
        icon: "fa-file-signature",
        color: "from-violet-600 to-indigo-600",
        items: [
            {t:"Medical Admission Model Test 01", c:"1020325088", url:"Question/blog-page_85.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 02", c:"1020325089", url:"Question/blog-page_18.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 03", c:"1020325090", url:"Question/blog-page_58.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 04", c:"1020325091", url:"Question/blog-page_39.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 05", c:"1020325092", url:"Question/blog-page_20.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 06", c:"1020325093", url:"Question/blog-page_6.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 07", c:"1020325094", url:"Question/blog-page_29.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 08", c:"1020325095", url:"Question/blog-page_31.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 09", c:"1020325096", url:"Question/blog-page_60.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 10", c:"1020325097", url:"Question/blog-page_11.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 11", c:"1020325098", url:"Question/blog-page_24.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 12", c:"1020325099", url:"Question/blog-page_77.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 13", c:"1020325100", url:"Question/blog-page_78.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 14", c:"1020325101", url:"Question/blog-page_35.html", qCount: 100, duration: 50},
            {t:"Medical Admission Model Test 15", c:"1020325102", url:"Question/blog-page_23.html", qCount: 100, duration: 50}
        ]
    },
    { 
        cat: "বিগত ১২ বছরের মেডিকেল প্রশ্ন", 
        icon: "fa-clock-rotate-left",
        color: "from-amber-600 to-rose-600",
        items: [
            {t:"২০১৩-২০১৪ মেডিকেল প্রশ্নপত্র", c:"1020324100", url:"Question/blog-page_64.html", qCount: 100, duration: 50},
            {t:"২০১৪-২০১৫ মেডিকেল প্রশ্নপত্র", c:"1020324101", url:"Question/blog-page_91.html", qCount: 100, duration: 50},
            {t:"২০১৫-২০১৬ মেডিকেল প্রশ্নপত্র", c:"1020324102", url:"Question/blog-page_81.html", qCount: 100, duration: 50},
            {t:"২০১৬-২০১৭ মেডিকেল প্রশ্নপত্র", c:"1020324103", url:"Question/blog-page_50.html", qCount: 100, duration: 50},
            {t:"২০১৭-২০১৮ মেডিকেল প্রশ্নপত্র", c:"1020324104", url:"Question/blog-page_79.html", qCount: 100, duration: 50},
            {t:"২০১৮-২০১৯ মেডিকেল প্রশ্নপত্র", c:"1020324105", url:"Question/blog-page_96.html", qCount: 100, duration: 50},
            {t:"২০১৯-২০২০ মেডিকেল প্রশ্নপত্র", c:"1020324106", url:"Question/blog-page_370.html", qCount: 100, duration: 50},
            {t:"২০২০-২০২১ মেডিকেল প্রশ্নপত্র", c:"1020324107", url:"Question/blog-page_43.html", qCount: 100, duration: 50},
            {t:"২০২১-২০২২ মেডিকেল প্রশ্নপত্র", c:"1020324108", url:"Question/blog-page_48.html", qCount: 100, duration: 50},
            {t:"২০২২-২০২৩ মেডিকেল প্রশ্নপত্র", c:"1020324109", url:"Question/blog-page_621.html", qCount: 100, duration: 50},
            {t:"২০২৩-২০২৪ মেডিকেল প্রশ্নপত্র", c:"1020324110", url:"Question/blog-page_30.html", qCount: 100, duration: 50},
            {t:"২০২৪-২০২৫ মেডিকেল প্রশ্নপত্র", c:"1020324111", url:"Question/blog-page_231.html", qCount: 100, duration: 50}
        ]
    }
];

/**
 * Render Catalog Accordions
 */
function buildModuleUI(filteredData = subjectData, searchQuery = '') {
    const modContainer = document.getElementById('view-modules');
    if (!modContainer) return;

    modContainer.innerHTML = '';

    if (filteredData.length === 0) {
        modContainer.innerHTML = `
            <div class="p-12 text-center bg-[#1E293B]/60 rounded-3xl border border-white/10 shadow-xl">
                <i class="fa fa-search text-3xl text-purple-400/40 mb-3 block"></i>
                <p class="text-base font-bold text-white">No matching exams found</p>
                <p class="text-xs text-slate-400 mt-1">Try searching by topic, chapter code (e.g. 1020325001), or title</p>
            </div>
        `;
        return;
    }

    filteredData.forEach((subject) => {
        const isOpen = Boolean(searchQuery && searchQuery.trim().length > 0);
        const wrapper = document.createElement('div');
        wrapper.className = "subject-card bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-950 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl overflow-hidden mb-3 sm:mb-4 transition-all hover:border-purple-500/30";
        
        wrapper.innerHTML = `
            <button onclick="window.toggleSubjectAccordion(this)" class="w-full p-3.5 sm:p-5 md:p-6 font-bold flex justify-between items-center gap-3 text-white hover:bg-purple-950/20 transition-colors">
                <div class="flex items-center gap-2.5 sm:gap-3.5 text-left min-w-0">
                    <div class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br ${subject.color || 'from-purple-600 to-indigo-600'} flex items-center justify-center text-white shadow-lg shadow-purple-900/40 flex-shrink-0">
                        <i class="fa ${subject.icon || 'fa-book-medical'} text-base"></i>
                    </div>
                    <div>
                        <span class="text-sm sm:text-base md:text-lg font-black block text-slate-100 leading-snug break-words">${subject.cat}</span>
                        <span class="text-[11px] sm:text-xs font-semibold text-slate-400 block mt-0.5">${subject.items.length} Standard Exams • 100 MCQs Each</span>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                    <span class="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-purple-950/70 border border-purple-800/40 text-purple-300 hidden md:inline-block">
                        100 Q • 50 Min • -0.25 Neg
                    </span>
                    <i class="fa fa-chevron-down text-xs text-purple-400/80 transition-transform duration-300 accordion-icon ${isOpen ? 'rotate-180' : ''}"></i>
                </div>
            </button>
            <div class="accordion-content ${isOpen ? 'open' : ''}">
                <div class="p-2 sm:p-3 md:p-4 space-y-2 border-t border-white/5 bg-slate-900/50">
                    ${subject.items.map(item => `
                        <div class="exam-row flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#1E293B] to-slate-900 border border-white/10 hover:border-purple-500/50 hover:bg-[#243248] transition-all gap-3 sm:gap-4 shadow-sm mb-2.5 sm:mb-3 min-w-0">
                            <div class="flex flex-col min-w-0 flex-1">
                                <span class="text-sm sm:text-base md:text-lg font-black text-white leading-snug font-siliguri mb-1.5 break-words">${item.t}</span>
                                <div class="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs md:text-sm">
                                    <span class="text-xs text-purple-200 font-mono font-black uppercase tracking-wider bg-purple-950/90 border border-purple-600/50 px-2 py-1 rounded-lg">
                                        Code: ${item.c}
                                    </span>
                                    <span class="text-slate-300 font-semibold flex items-center gap-1">
                                        <i class="fa fa-list-check text-purple-400 text-xs"></i> 100 Questions
                                    </span>
                                    <span class="text-slate-600 text-xs">•</span>
                                    <span class="text-slate-300 font-semibold flex items-center gap-1">
                                        <i class="fa fa-clock text-cyan-400 text-xs"></i> 50 Mins
                                    </span>
                                    <span class="text-slate-600 text-xs">•</span>
                                    <span class="text-amber-300 font-bold bg-amber-950/50 border border-amber-500/40 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                                        <i class="fa fa-scale-balanced text-amber-400 text-xs"></i> Full Marks: 100 (-0.25 Neg)
                                    </span>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto sm:self-auto flex-shrink-0">
                                <button onclick="window.showPreview('${item.c}')" class="w-full sm:w-auto justify-center px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold transition-all border border-white/10 flex items-center gap-1.5 shadow-sm">
                                    <i class="fa fa-eye text-purple-400"></i> Preview
                                </button>
                                <button onclick="window.startExamByCode('${item.c}')" class="w-full sm:w-auto justify-center px-3 sm:px-5 md:px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-purple-900/40 transition-all flex items-center gap-2 transform active:scale-95">
                                    <i class="fa fa-play text-xs"></i> Start Exam
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        modContainer.appendChild(wrapper);
    });
}

function toggleSubjectAccordion(btn) {
    const content = btn.nextElementSibling;
    const icon = btn.querySelector('.accordion-icon');
    if (content) content.classList.toggle('open');
    if (icon) icon.classList.toggle('rotate-180');
}

function handleSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
        buildModuleUI(subjectData, '');
        return;
    }

    const filtered = [];
    subjectData.forEach(sub => {
        const catMatch = sub.cat.toLowerCase().includes(q);
        const matchingItems = sub.items.filter(item => 
            item.t.toLowerCase().includes(q) || 
            item.c.toLowerCase().includes(q) || 
            catMatch
        );

        if (matchingItems.length > 0) {
            filtered.push({
                ...sub,
                items: matchingItems
            });
        }
    });

    buildModuleUI(filtered, q);
}

function filterByCategory(categoryName) {
    if (!categoryName || categoryName === 'all') {
        buildModuleUI(subjectData, '');
        return;
    }
    const filtered = subjectData.filter(s => s.cat === categoryName || s.cat.includes(categoryName));
    buildModuleUI(filtered, 'active');
}

async function showPreview(code) {
    let targetItem = null;
    let targetCategory = '';

    for (const sub of subjectData) {
        const found = sub.items.find(i => i.c === code);
        if (found) {
            targetItem = found;
            targetCategory = sub.cat;
            break;
        }
    }

    if (!targetItem) return;

    const modal = document.getElementById('preview-modal');
    const modalTitle = document.getElementById('preview-modal-title');
    const modalCat = document.getElementById('preview-modal-category');
    const modalCode = document.getElementById('preview-modal-code');
    const modalQuestions = document.getElementById('preview-questions-sample');
    const btnStart = document.getElementById('btn-start-from-preview');

    if (modalTitle) modalTitle.textContent = targetItem.t;
    if (modalCat) modalCat.textContent = targetCategory;
    if (modalCode) modalCode.textContent = 'Exam Code: ' + targetItem.c;

    if (btnStart) {
        btnStart.onclick = () => {
            closePreviewModal();
            startExamByCode(targetItem.c);
        };
    }

    if (modalQuestions) {
        modalQuestions.innerHTML = `
            <div class="p-8 text-center text-slate-400">
                <i class="fa fa-spinner fa-spin mr-2 text-purple-400 text-lg"></i> Loading sample questions...
            </div>
        `;
    }

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    try {
        const res = await fetch(targetItem.url);
        const html = await res.text();
        const regex = /(?:var|const|let)\s+questions\s*=\s*(\[[\s\S]*?\]);/m;
        const match = html.match(regex);
        let sampleList = [];
        if (match && match[1]) {
            const parsed = new Function('return ' + match[1])();
            sampleList = parsed.slice(0, 3);
        }

        const fmt = window.cleanAndFormatScience || ((s) => s);

        if (modalQuestions && sampleList.length > 0) {
            modalQuestions.innerHTML = sampleList.map((q, idx) => `
                <div class="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2 mb-3">
                    <p class="text-xs sm:text-sm font-bold text-slate-200">#${idx + 1}. ${fmt(q.q || q.question)}</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                        <div class="p-2 rounded-lg bg-slate-950/80 border border-white/5"><strong class="text-purple-400 mr-1">(A)</strong> ${fmt(q.a || q.options?.[0]?.text || '')}</div>
                        <div class="p-2 rounded-lg bg-slate-950/80 border border-white/5"><strong class="text-purple-400 mr-1">(B)</strong> ${fmt(q.b || q.options?.[1]?.text || '')}</div>
                        <div class="p-2 rounded-lg bg-slate-950/80 border border-white/5"><strong class="text-purple-400 mr-1">(C)</strong> ${fmt(q.c || q.options?.[2]?.text || '')}</div>
                        <div class="p-2 rounded-lg bg-slate-950/80 border border-white/5"><strong class="text-purple-400 mr-1">(D)</strong> ${fmt(q.d || q.options?.[3]?.text || '')}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        if (modalQuestions) {
            modalQuestions.innerHTML = `
                <div class="p-4 rounded-2xl bg-slate-900/80 text-xs text-slate-300">
                    Standard Medical Admission Test • 100 High-Yield MCQs • 50 Minutes Timer • -0.25 Negative Marking.
                </div>
            `;
        }
    }
}

function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function startExamByCode(code) {
    for (const sub of subjectData) {
        const item = sub.items.find(i => i.c === code);
        if (item) {
            window.ExamEngine.launchExam({
                ...item,
                category: sub.cat,
                title: item.t,
                code: item.c,
                durationMinutes: item.duration || 50
            });
            return;
        }
    }
}

// Window exports
window.SubjectDataManager = {
    subjectData,
    buildModuleUI,
    handleSearch,
    filterByCategory,
    showPreview,
    startExamByCode
};
window.toggleSubjectAccordion = toggleSubjectAccordion;
window.showPreview = showPreview;
window.closePreviewModal = closePreviewModal;
window.startExamByCode = startExamByCode;
window.handleSearch = handleSearch;
window.filterByCategory = filterByCategory;
