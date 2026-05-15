/**
 * Medical Exam App - Centralized Data Management
 * This file contains all subject data, topics, and questions
 * Easy to maintain and scale for 100+ questions
 */

const subjectData = [
    { 
        cat: "উদ্ভিদবিজ্ঞান", 
        items: [
            {t:"কোষ ও এর গঠন", c:"1020325001", url:"Question/blog-page_4.html"},
            {t:"কোষ বিভাজন", c:"1020325002", url:"Question/blog-page_76.html"},
            {t:"কোষ রসায়ন", c:"1020325003", url:"Question/blog-page_40.html"},
            {t:"অণুজীব", c:"1020325004", url:"Question/blog-page_33.html"},
            {t:"শৈবাল ও ছত্রাক", c:"1020325005", url:"Question/blog-page_21.html"},
            {t:"ব্রায়োফাইটা ও টেরিডোফাইটা", c:"1020325006", url:"Question/blog-page_26.html"},
            {t:"নগ্নবীজী ও আবৃতবীজী উদ্ভিদ", c:"1020325007", url:"Question/blog-page_12.html"},
            {t:"টিস্যু ও টিস্যুতন্ত্র", c:"1020325008", url:"Question/blog-page_22.html"},
            {t:"উদ্ভিদ শারীরতত্ত্ব", c:"1020325009", url:"Question/blog-page_0.html"},
            {t:"উদ্ভিদ প্রজনন", c:"1020325010", url:"Question/blog-page_7.html"},
            {t:"জীবপ্রযুক্তি", c:"1020325011", url:"Question/blog-page_54.html"},
            {t:"জীবের পরিবেশ, বিস্তার ও সংরক্ষণ", c:"1020325012", url:"Question/blog-page_10.html"},
            {t:"জীববিজ্ঞান প্রথম পত্র শর্ট সিলেবাস", c:"1020325013", url:"Question/blog-page_83.html"},
            {t:"জীববিজ্ঞান প্রথম পত্র পেপার ফাইনাল", c:"1020325014", url:"Question/blog-page_19.html"}
        ]
    },
    { 
        cat: "প্রাণিবিজ্ঞান", 
        items: [
            {t:"প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস", c:"1020325015", url:"Question/blog-page_97.html"},
            {t:"প্রাণীর পরিচিতি", c:"1020325016", url:"Question/blog-page_36.html"},
            {t:"পরিপাক ও শোষণ", c:"1020325017", url:"Question/blog-page_69.html"},
            {t:"রক্ত ও সঞ্চালন", c:"1020325018", url:"Question/blog-page_71.html"},
            {t:"শ্বাস ক্রিয়া ও শ্বসন", c:"1020325019", url:"Question/blog-page_47.html"},
            {t:"বর্জ্য ও নিষ্কাশন", c:"1020325020", url:"Question/blog-page_14.html"},
            {t:"চলন ও অঙ্গচালনা", c:"1020325021", url:"Question/blog-page_42.html"},
            {t:"সমন্বয় ও নিয়ন্ত্রণ", c:"1020325022", url:"Question/blog-page_66.html"},
            {t:"মানব জীবনের ধারাবাহিকতা", c:"1020325023", url:"Question/blog-page_27.html"},
            {t:"মানবদেহের প্রতিরক্ষা", c:"1020325024", url:"Question/blog-page_46.html"},
            {t:"জিনতত্ত্ব ও বিবর্তন", c:"1020325025", url:"Question/blog-page_94.html"},
            {t:"প্রাণীর আচরণ", c:"1020325026", url:"Question/blog-page_73.html"},
            {t:"জীববিজ্ঞান দ্বিতীয় পত্র শর্ট সিলেবাস", c:"1020325027", url:"Question/blog-page_59.html"},
            {t:"জীববিজ্ঞান দ্বিতীয় পত্র পেপার ফাইনাল", c:"1020325028", url:"Question/blog-page_1.html"}
        ]
    },
    { 
        cat: "পদার্থবিজ্ঞান প্রথম পত্র", 
        items: [
            {t:"ভৌতজগত ও পরিমাপ", c:"1020325029", url:"Question/blog-page_89.html"},
            {t:"ভেক্টর", c:"1020325030", url:"Question/blog-page_41.html"},
            {t:"গতিবিদ্যা", c:"1020325031", url:"Question/blog-page_51.html"},
            {t:"নিউটনীয় বলবিদ্যা", c:"1020325032", url:"Question/blog-page_84.html"},
            {t:"কাজ, শক্তি ও ক্ষমতা", c:"1020325033", url:"Question/blog-page_65.html"},
            {t:"মহাকর্ষ ও অভিকর্ষ", c:"1020325034", url:"Question/blog-page_13.html"},
            {t:"পদার্থের গাঠনিক ধর্ম", c:"1020325035", url:"Question/blog-page_63.html"},
            {t:"পর্যাবৃত্ত গতি", c:"1020325036", url:"Question/blog-page_82.html"},
            {t:"তরঙ্গ", c:"1020325037", url:"Question/blog-page_98.html"},
            {t:"আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব", c:"1020325038", url:"Question/blog-page_34.html"},
            {t:"পদার্থবিজ্ঞান প্রথম পত্র শর্ট সিলেবাস", c:"1020325039", url:"Question/blog-page_8.html"},
            {t:"পদার্থবিজ্ঞান প্রথম পত্র পেপার ফাইনাল", c:"1020325040", url:"Question/blog-page_86.html"}
        ]
    },
    { 
        cat: "পদার্থবিজ্ঞান দ্বিতীয় পত্র", 
        items: [
            {t:"তাপগতিবিদ্যা", c:"1020325041", url:"Question/blog-page_95.html"},
            {t:"স্থির তড়িৎ", c:"1020325042", url:"Question/blog-page_53.html"},
            {t:"চল তড়িৎ", c:"1020325043", url:"Question/blog-page_67.html"},
            {t:"তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব", c:"1020325044", url:"Question/blog-page_44.html"},
            {t:"তড়িৎ চৌম্বকীয় আবেশ ও দিক পরিবর্তী প্রবাহ", c:"1020325045", url:"Question/blog-page_15.html"},
            {t:"জ্যামিতিক আলোকবিজ্ঞান", c:"1020325046", url:"Question/blog-page_68.html"},
            {t:"ভৌত আলোকবিজ্ঞান", c:"1020325047", url:"Question/blog-page_55.html"},
            {t:"আধুনিক পদার্থবিজ্ঞানের সূচনা", c:"1020325048", url:"Question/blog-page_25.html"},
            {t:"পরমাণুর মডেল এবং নিউক্লিয়ার পদার্থবিজ্ঞান", c:"1020325049", url:"Question/blog-page_38.html"},
            {t:"সেমিকন্ডাক্টর ও ইলেকট্রনিক্স", c:"1020325050", url:"Question/blog-page_56.html"},
            {t:"জ্যোতির্বিজ্ঞান", c:"1020325051", url:"Question/blog-page_5.html"},
            {t:"পদার্থবিজ্ঞান দ্বিতীয় পত্র শর্ট সিলেবাস", c:"1020325052", url:"Question/blog-page_61.html"},
            {t:"পদার্থবিজ্ঞান দ্বিতীয় পত্র পেপার ফাইনাল", c:"1020325053", url:"Question/blog-page_80.html"}
        ]
    },
    { 
        cat: "রসায়ন প্রথম পত্র", 
        items: [
            {t:"ল্যাবরেটরির নিরাপদ ব্যবহার", c:"1020325054", url:"Question/blog-page_45.html"},
            {t:"গুণগত রসায়ন", c:"1020325055", url:"Question/blog-page_70.html"},
            {t:"মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন", c:"1020325056", url:"Question/blog-page_2.html"},
            {t:"রাসায়নিক পরিবর্তন", c:"1020325057", url:"Question/blog-page_32.html"},
            {t:"কর্মমুখী রসায়ন", c:"1020325058", url:"Question/blog-page_74.html"},
            {t:"রসায়ন প্রথম পত্র শর্ট সিলেবাস", c:"1020325059", url:"Question/blog-page_75.html"},
            {t:"রসায়ন প্রথম পত্র পেপার ফাইনাল", c:"1020325060", url:"Question/blog-page_16.html"}
        ]
    },
    { 
        cat: "রসায়ন দ্বিতীয় পত্র", 
        items: [
            {t:"পরিবেশ রসায়ন", c:"1020325061", url:"Question/blog-page_99.html"},
            {t:"জৈব রসায়ন", c:"1020325062", url:"Question/blog-page_37.html"},
            {t:"পরিমাণগত রসায়ন", c:"1020325063", url:"Question/blog-page_9.html"},
            {t:"তড়িৎ রসায়ন", c:"1020325064", url:"Question/blog-page_87.html"},
            {t:"অর্থনৈতিক রসায়ন", c:"1020325065", url:"Question/blog-page_17.html"},
            {t:"রসায়ন দ্বিতীয় পত্র শর্ট সিলেবাস", c:"1020325066", url:"Question/blog-page_28.html"},
            {t:"রসায়ন দ্বিতীয় পত্র পেপার ফাইনাল", c:"1020325067", url:"Question/blog-page_52.html"}
        ]
    },
    { 
        cat: "সাধারণ জ্ঞান", 
        items: [
            {t:"সাম্প্রতিক বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলী-১", c:"1020325112", url:"Question/blog-page_72.html"},
            {t:"সাম্প্রতিক বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলী-২", c:"1020325113", url:"Question/blog-page_57.html"},
            {t:"মানবিক গুণাবলী", c:"1020325114", url:"Question/blog-page_92.html"},
            {t:"General Knowledge: Before 1948", c:"1020325068", url:"Question/general-knowledge-before-1948.html"},
            {t:"General Knowledge: After 1948", c:"1020325069", url:"Question/general-knowledge-after-1948.html"},
            {t:"General Knowledge: BCS, MAT, DAT and others", c:"1020325070", url:"Question/general-knowledge-bcs-mat-dat-and-others.html"},
            {t:"General Knowledge: Recent", c:"1020325071", url:"Question/general-knowledge-recent.html"},
            {t:"General Knowledge: International", c:"1020325072", url:"Question/general-knowledge-international.html"}
        ]
    },
    { 
        cat: "ইংরেজি", 
        items: [
            {t:"English Grammar 01", c:"1020325073", url:"Question/english-grammar-01.html"},
            {t:"English Grammar 02", c:"1020325074", url:"Question/english-grammar-02.html"},
            {t:"English Vocabulary 01", c:"1020325075", url:"Question/english-vocabulary-01.html"},
            {t:"English Vocabulary 02", c:"1020325076", url:"Question/english-vocabulary-02.html"},
            {t:"Eng BCS, DAT, MAT, Others", c:"1020325077", url:"Question/eng-bcs-dat-mat-others.html"}
        ]
    },
    { 
        cat: "সাবজেক্ট ফাইনাল", 
        items: [
            {t:"জীববিজ্ঞান সাবজেক্ট ফাইনাল", c:"1020325078", url:"Question/blog-page_49.html"},
            {t:"পদার্থবিজ্ঞান সাবজেক্ট ফাইনাল", c:"1020325079", url:"Question/blog-page_3.html"},
            {t:"রসায়ন সাবজেক্ট ফাইনাল", c:"1020325080", url:"Question/blog-page_88.html"},
            {t:"General Knowledge: Full Syllabus 01", c:"1020325081", url:"Question/general-knowledge-full-syllabus-01.html"},
            {t:"General Knowledge: Full Syllabus 02", c:"1020325082", url:"Question/general-knowledge-full-syllabus-02.html"},
            {t:"English: Full Syllabus 01", c:"1020325083", url:"Question/english-full-syllabus-01.html"},
            {t:"English: Full Syllabus 02", c:"1020325084", url:"Question/english-full-syllabus-02.html"}
        ]
    },
    { 
        cat: "মডেল টেস্ট", 
        items: [
            {t:"মডেল টেস্ট-০১", c:"1020325085", url:"Question/blog-page_85.html"},
            {t:"মডেল টেস্ট-০२", c:"1020325086", url:"Question/blog-page_18.html"},
            {t:"মডেল টেস্ট-०३", c:"1020325087", url:"Question/blog-page_58.html"},
            {t:"মডেল টেস্ট-०४", c:"1020325088", url:"Question/blog-page_39.html"},
            {t:"মডেল টেস্ট-०५", c:"1020325089", url:"Question/blog-page_20.html"},
            {t:"মডেল টেস্ট-००६", c:"1020325090", url:"Question/blog-page_6.html"},
            {t:"মডেল টেস্ট-००७", c:"1020325091", url:"Question/blog-page_29.html"},
            {t:"মডেল টেস্ট-००८", c:"1020325092", url:"Question/blog-page_31.html"},
            {t:"মডেল টেস্ট-००९", c:"1020325093", url:"Question/blog-page_60.html"},
            {t:"মডেল টেস্ট-१०", c:"1020325094", url:"Question/blog-page_11.html"},
            {t:"মডেল টেস্ট-११", c:"1020325095", url:"Question/blog-page_24.html"},
            {t:"মডেল টেস্ট-१२", c:"1020325096", url:"Question/blog-page_77.html"},
            {t:"মডেল টেস্ট-१३", c:"1020325097", url:"Question/blog-page_78.html"},
            {t:"মডেল টেস্ট-१४", c:"1020325098", url:"Question/blog-page_35.html"},
            {t:"মডেল টেস্ট-१५", c:"1020325099", url:"Question/blog-page_23.html"}
        ]
    },
    { 
        cat: "বিগত ১२ বছরের মেডিকেল প্রশ্ন", 
        items: [
            {t:"२०१३-२०१४ মেডিকেল প্রশ্নপত্র", c:"1020324100", url:"Question/blog-page_64.html"},
            {t:"२०१४-२०१५ মেডিকেল প্রশ্নপত্র", c:"1020324101", url:"Question/blog-page_91.html"},
            {t:"२०१५-२०१६ মেডিকেল প্রশ্নপত্র", c:"1020324102", url:"Question/blog-page_81.html"},
            {t:"२०१६-२०१७ মেডিকেল প্রশ্নপত্র", c:"1020324103", url:"Question/blog-page_50.html"},
            {t:"२०१७-२०१८ মেডিকেল প্রশ্নপত্র", c:"1020324104", url:"Question/blog-page_79.html"},
            {t:"२०१८-२०१९ মেডিকেল প্রশ্নপত্র", c:"1020324105", url:"Question/blog-page_96.html"},
            {t:"२०१९-२०२० মেডিকেল প্রশ্নপত্র", c:"1020324106", url:"Question/blog-page_370.html"},
            {t:"२०२०-२०२१ মেডিকেল প্রশ্নপত্র", c:"1020324107", url:"Question/blog-page_43.html"},
            {t:"२०२१-२०२२ মেডিকেল প্রশ্নপত্র", c:"1020324108", url:"Question/blog-page_48.html"},
            {t:"२०२२-२०२३ মেডিকেল প্রশ্নপত্র", c:"1020324109", url:"Question/blog-page_621.html"},
            {t:"२०२३-२०२४ মেডিকেল প্রশ্নপত্র", c:"1020324110", url:"Question/blog-page_30.html"},
            {t:"२०२४-२०२५ মেডিকেল প্রশ্নপত্র", c:"1020325111", url:"Question/blog-page_231.html"}
        ]
    }
];

/**
 * Build module UI on the homepage
 */
function buildModuleUI() {
    const modContainer = document.getElementById('view-modules');
    if (!modContainer) return;

    const subjectMeta = {
        'উদ্ভিদবিজ্ঞান':               { icon: 'fa-leaf',        bg: '#DCFCE7', color: '#16A34A' },
        'প্রাণিবিজ্ঞান':                { icon: 'fa-paw',         bg: '#DBEAFE', color: '#2563EB' },
        'পদার্থবিজ্ঞান প্রথম পত্র':    { icon: 'fa-atom',        bg: '#EDE9FE', color: '#7C3AED' },
        'পদার্থবিজ্ঞান দ্বিতীয় পত্র': { icon: 'fa-bolt',        bg: '#FEF3C7', color: '#D97706' },
        'রসায়ন প্রথম পত্র':            { icon: 'fa-flask',       bg: '#FCE7F3', color: '#DB2777' },
        'রসায়ন দ্বিতীয় পত্র':         { icon: 'fa-vial',        bg: '#FFE4E6', color: '#E11D48' },
        'সাধারণ জ্ঞান':                 { icon: 'fa-globe',       bg: '#E0F2FE', color: '#0284C7' },
        'ইংরেজি':                       { icon: 'fa-language',    bg: '#F3F4F6', color: '#374151' },
    };

    subjectData.forEach(subject => {
        const meta = subjectMeta[subject.cat] || { icon: 'fa-book-medical', bg: '#EEF2FF', color: '#4F46E5' };

        const wrapper = document.createElement('div');
        wrapper.className = 'module-card';

        wrapper.innerHTML = `
            <button class="module-header" onclick="
                const c = this.nextElementSibling;
                c.classList.toggle('open');
                this.querySelector('.chevron').classList.toggle('rotated');
            ">
                <span style="display:flex;align-items:center;">
                    <span class="subject-icon" style="background:${meta.bg};color:${meta.color};">
                        <i class="fa ${meta.icon}"></i>
                    </span>
                    <span>${subject.cat}</span>
                </span>
                <span class="chevron" style="color:#94A3B8;font-size:12px;">
                    <i class="fa fa-chevron-down"></i>
                </span>
            </button>
            <div class="accordion-content">
                ${subject.items.map(item => `
                    <div class="topic-row">
                        <div style="min-width:0;">
                            <div style="font-size:13px;font-weight:600;color:#1E293B;">${item.t}</div>
                            <div style="font-size:10px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Code: ${item.c}</div>
                        </div>
                        <a href="${item.url}" class="btn-start">Start</a>
                    </div>
                `).join('')}
            </div>
        `;
        modContainer.appendChild(wrapper);
    });
}

/**
 * Populate filter dropdowns with subjects and topics
 */
function populateFilterDropdowns() {
    const filterSubject = document.getElementById('filter-subject');
    const filterTopic = document.getElementById('filter-topic');
    
    if (!filterSubject) return;

    // Add all subjects to dropdown
    subjectData.forEach(sub => {
        let opt = document.createElement('option');
        opt.value = sub.cat;
        opt.innerText = sub.cat;
        filterSubject.appendChild(opt);
    });

    // Handle subject change to update topics
    filterSubject.addEventListener('change', (e) => {
        filterTopic.innerHTML = '<option value="">All Topics</option>';
        const selectedSub = subjectData.find(s => s.cat === e.target.value);
        if (selectedSub) {
            selectedSub.items.forEach(item => {
                let opt = document.createElement('option');
                opt.value = item.t;
                opt.innerText = item.t;
                filterTopic.appendChild(opt);
            });
        }
        if (window.fetchAndRenderData) {
            window.fetchAndRenderData();
        }
    });
}

/**
 * Get all topics for a given subject
 * @param {string} subjectName - The name of the subject
 * @returns {Array} Array of topics
 */
function getTopicsBySubject(subjectName) {
    const subject = subjectData.find(s => s.cat === subjectName);
    return subject ? subject.items : [];
}

/**
 * Get all subjects
 * @returns {Array} Array of subject names
 */
function getAllSubjects() {
    return subjectData.map(s => s.cat);
}

/**
 * Get a topic by its code
 * @param {string} code - The topic code
 * @returns {Object} The topic object
 */
function getTopicByCode(code) {
    for (const subject of subjectData) {
        const topic = subject.items.find(item => item.c === code);
        if (topic) return topic;
    }
    return null;
}

/**
 * Initialize data on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    buildModuleUI();
    populateFilterDropdowns();
});

// Export for use in other scripts
window.SubjectDataManager = {
    getTopicsBySubject,
    getAllSubjects,
    getTopicByCode,
    subjectData
};
