// Home Page Module Loader

const subjectData = [
    { cat: "উদ্ভিদবিজ্ঞান", items: [
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
    ]},
    { cat: "প্রাণিবিজ্ঞান", items: [
        {t:"প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস", c:"1020325015", url:"Question/blog-page_97.html"},
        {t:"প্রাণীর পরিচিতি", c:"1020325016", url:"Question/blog-page_36.html"},
        {t:"পরিপাক ও শোষণ", c:"1020325017", url:"Question/blog-page_69.html"},
        {t:"রক্ত ও সঞ্চালন", c:"1020325018", url:"Question/blog-page_71.html"},
        {t:"শ্বাস ক্রিয়া ও শ্বসন", c:"1020325019", url:"Question/blog-page_47.html"},
    ]},
];

const modContainer = document.getElementById('view-modules');
if (modContainer) {
    subjectData.forEach(subject => {
        const wrapper = document.createElement('div');
        wrapper.className = "bg-[#0F172A] rounded-3xl border border-white/10 shadow-sm overflow-hidden mb-4";
        
        wrapper.innerHTML = `
            <button onclick="this.nextElementSibling.classList.toggle('open')" class="w-full p-6 font-bold flex justify-between items-center text-white hover:bg-purple-900/10 transition-colors">
                <span class="flex items-center"><i class="fa fa-book-medical mr-3 text-purple-600"></i> ${subject.cat}</span>
                <i class="fa fa-chevron-down text-xs opacity-30"></i>
            </button>
            <div class="accordion-content">
                <div class="p-2 space-y-1">
                    ${subject.items.map(item => `
                        <div class="flex justify-between items-center p-4 rounded-2xl hover:bg-white/5 transition-all">
                            <div class="flex flex-col">
                                <span class="text-sm font-semibold text-zinc-200">${item.t}</span>
                                <span class="text-[10px] text-purple-500 font-bold uppercase tracking-tighter">Code: ${item.c}</span>
                            </div>
                            <a href="${item.url}" class="bg-purple-600 text-white px-6 py-2 rounded-xl text-xs font-black btn-glow transition-all">START</a>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        modContainer.appendChild(wrapper);
    });
}

// Results Modal Logic
const myResultsBtn = document.getElementById('myResultsBtn');
const resultsModal = document.getElementById('results-modal');
const closeResultsModal = document.getElementById('close-results-modal');
const filterSubject = document.getElementById('filter-subject');
const filterTopic = document.getElementById('filter-topic');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const resultsList = document.getElementById('results-list');
const btnPersonal = document.getElementById('btn-personal-results');
const btnGlobal = document.getElementById('btn-global-results');
const profileBtn = document.getElementById('profileBtn');

let fetchedExamResults = [];
let viewMode = 'personal';

if (typeof subjectData !== 'undefined') {
    subjectData.forEach(sub => {
        let opt = document.createElement('option');
        opt.value = sub.cat;
        opt.innerText = sub.cat;
        filterSubject.appendChild(opt);
    });
}

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
    fetchAndRenderData();
});

filterTopic.addEventListener('change', fetchAndRenderData);

clearFiltersBtn.addEventListener('click', () => {
    filterSubject.value = '';
    filterTopic.innerHTML = '<option value="">All Topics</option>';
    fetchAndRenderData();
});

btnPersonal.onclick = () => {
    viewMode = 'personal';
    btnPersonal.className = 'flex-1 bg-white dark:bg-zinc-700 shadow-sm rounded-lg py-2 text-sm font-bold text-purple-600 dark:text-purple-400 transition-all';
    btnGlobal.className = 'flex-1 rounded-lg py-2 text-sm font-bold text-zinc-500 hover:bg-white/50 dark:hover:bg-zinc-700/50 transition-all';
    fetchAndRenderData();
};

btnGlobal.onclick = () => {
    viewMode = 'global';
    btnGlobal.className = 'flex-1 bg-white dark:bg-zinc-700 shadow-sm rounded-lg py-2 text-sm font-bold text-purple-600 dark:text-purple-400 transition-all';
    btnPersonal.className = 'flex-1 rounded-lg py-2 text-sm font-bold text-zinc-500 hover:bg-white/50 dark:hover:bg-zinc-700/50 transition-all';
    fetchAndRenderData();
};

myResultsBtn.onclick = () => {
    document.getElementById('userDropdown').classList.add('hidden');
    resultsModal.classList.remove('hidden');
    resultsModal.classList.add('flex');
    fetchAndRenderData();
};

closeResultsModal.onclick = () => {
    resultsModal.classList.add('hidden');
    resultsModal.classList.remove('flex');
};

profileBtn.onclick = (e) => {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('hidden');
};

window.onclick = () => document.getElementById('userDropdown').classList.add('hidden');

let lastScrollY = window.scrollY;
const header = document.getElementById('mainHeader');

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY <= 50) {
        header.style.transform = 'translateY(0)';
    } else if (currentScrollY > lastScrollY) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }
    lastScrollY = currentScrollY;
});

async function fetchAndRenderData() {
    resultsList.innerHTML = '<p class="text-center text-sm opacity-60 mt-10"><i class="fa fa-spinner fa-spin mr-2"></i>Loading data...</p>';
    try {
        let snapshot;
        const selectedTopic = filterTopic.value;
        
        if (viewMode === 'personal') {
            if (!firebase.auth().currentUser) {
                resultsList.innerHTML = '<p class="text-center text-rose-500 text-sm mt-10">Please sign in to view your results.</p>';
                return;
            }
            snapshot = await firebase.firestore().collection("exam_results").where("userId", "==", firebase.auth().currentUser.uid).get();
        } else {
            if (selectedTopic) {
                const prefixedTopic = "Secret file: " + selectedTopic;
                snapshot = await firebase.firestore().collection("exam_results").where("topicName", "in", [selectedTopic, prefixedTopic]).get();
            } else {
                snapshot = await firebase.firestore().collection("exam_results").orderBy("date", "desc").limit(100).get();
            }
        }
        
        fetchedExamResults = [];
        snapshot.forEach(doc => fetchedExamResults.push(doc.data()));
        renderLeaderboard();
    } catch(e) {
        console.error("Error loading results:", e);
        resultsList.innerHTML = '<p class="text-center text-rose-500 text-sm mt-10">Error loading data. Check console.</p>';
    }
}

function renderLeaderboard() {
    resultsList.innerHTML = '';
    let filteredData = fetchedExamResults;
    const selectedTopic = filterTopic.value;
    
    if (selectedTopic) {
        filteredData = filteredData.filter(r => r.topicName && r.topicName.includes(selectedTopic));
    }
    
    if (filteredData.length === 0) {
        resultsList.innerHTML = '<div class="text-center mt-10"><i class="fa fa-folder-open text-3xl opacity-20 mb-2"></i><p class="text-sm opacity-60">No exams found for this selection.</p></div>';
        return;
    }
    
    if (viewMode === 'global') {
        filteredData.sort((a, b) => b.score - a.score);
    } else {
        filteredData.sort((a, b) => b.date?.toMillis() - a.date?.toMillis());
    }

    filteredData.forEach((res, index) => {
        const dateObj = res.date ? new Date(res.date.toDate()) : new Date();
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const displayName = viewMode === 'global' ? (res.displayName || res.userName || 'Anonymous Player') : (res.topicName || 'Unknown Topic');
        const secondaryText = viewMode === 'global' ? `${res.topicName} • Attempt #${res.attempt || 1}` : `Attempt #${res.attempt || 1}`;
        const rankBadge = viewMode === 'global' ? `<div class="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-black text-xs mr-3">${index + 1}</div>` : '';

        const div = document.createElement('div');
        div.className = "bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 flex justify-between items-center transition-all hover:border-purple-500/50 mb-2";
        div.innerHTML = `
            <div class="flex items-center">
                ${rankBadge}
                <div>
                    <p class="font-bold text-sm text-purple-700 dark:text-purple-400">${displayName}</p>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                        <span class="text-[9px] md:text-[10px] uppercase font-bold tracking-wider opacity-60 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">${secondaryText}</span>
                        <span class="text-[10px] opacity-60"><i class="fa fa-clock mr-1"></i>${dateStr}</span>
                    </div>
                </div>
            </div>
            <div class="text-right shrink-0 ml-4">
                <p class="font-black text-xl text-emerald-500">${res.score}</p>
                <p class="text-[10px] uppercase opacity-50">Score</p>
            </div>
        `;
        resultsList.appendChild(div);
    });
}
