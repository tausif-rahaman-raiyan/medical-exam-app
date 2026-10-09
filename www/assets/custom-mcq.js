/* Custom MCQ Studio: one vertically scrolling page, up to 100 editable cards. */
(function () {
  'use strict';
  var STORAGE_KEY = 'msf_custom_mcq_draft_v1';
  var $ = function (id) { return document.getElementById(id); };
  var questions = [];
  var saveTimer = null;
  function blankQuestion(i) { return {id:i+1,q:'',a:'',b:'',c:'',d:'',ans:'a',exp:''}; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function saveDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({title:$('customMcqTitle').value || 'My Custom MCQ Test',questions:questions}));
      if ($('customMcqStatus')) $('customMcqStatus').textContent = questions.length + ' question cards · Draft saved on this device';
    } catch (e) {
      if ($('customMcqStatus')) $('customMcqStatus').textContent = 'Draft could not be saved. Check this device storage.';
    }
  }
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 200); }
  function readDraft() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!data || !Array.isArray(data.questions)) return false;
      $('customMcqTitle').value = data.title || 'My Custom MCQ Test';
      questions = data.questions.slice(0,100).map(function(q,i){
        var item = Object.assign(blankQuestion(i), q, {id:i+1});
        if (['a','b','c','d'].indexOf(String(item.ans).toLowerCase()) < 0) item.ans = 'a';
        else item.ans = String(item.ans).toLowerCase();
        return item;
      });
      return true;
    } catch(e) { return false; }
  }
  function field(name,label,value,area,index) {
    var attrs = 'data-index="' + index + '" data-field="' + name + '"';
    if (area) return '<label class="block text-xs font-semibold text-slate-300">' + label + '<textarea ' + attrs + ' rows="2" class="mt-1.5 w-full resize-y rounded-xl bg-slate-950 border border-slate-700 focus:border-teal-400 outline-none p-3 text-sm text-white" placeholder="' + label + '">' + esc(value) + '</textarea></label>';
    return '<label class="block text-xs font-semibold text-slate-300">' + label + '<input ' + attrs + ' value="' + esc(value) + '" class="mt-1.5 w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-teal-400 outline-none px-3 py-2.5 text-sm text-white" placeholder="' + label + '"></label>';
  }
  function cardMarkup(q,i) {
    var options = ['a','b','c','d'].map(function(letter){return '<option value="'+letter+'" '+(q.ans===letter?'selected':'')+'>Option '+letter.toUpperCase()+'</option>';}).join('');
    return '<article class="custom-mcq-card rounded-2xl border border-white/10 bg-slate-900/65 p-4 sm:p-5" data-card-index="'+i+'">' +
      '<div class="flex items-center justify-between gap-3 mb-4"><h3 class="font-black text-white"><span class="inline-flex w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/25 text-teal-300 items-center justify-center mr-2">'+(i+1)+'</span>Question '+(i+1)+'</h3><span class="text-[10px] uppercase tracking-wider text-slate-500">MCQ</span></div>' +
      field('q','Question',q.q,true,i) +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">'+field('a','Option A',q.a,false,i)+field('b','Option B',q.b,false,i)+field('c','Option C',q.c,false,i)+field('d','Option D',q.d,false,i)+'</div>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3"><label class="block text-xs font-semibold text-slate-300">Correct answer<select data-index="'+i+'" data-field="ans" class="mt-1.5 w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-teal-400 outline-none px-3 py-2.5 text-sm text-white">'+options+'</select></label>' +
      field('exp','Explanation / reference',q.exp,true,i)+'</div></article>';
  }
  function renderCards(count,preserve) {
    var n = Math.max(1,Math.min(100,parseInt(count,10)||1));
    var old = preserve ? questions.slice() : [];
    questions = Array.from({length:n},function(_,i){return Object.assign(blankQuestion(i),old[i]||{},{id:i+1});});
    $('customMcqCards').innerHTML = questions.map(cardMarkup).join('');
    $('customMcqCount').value = n;
    saveDraft();
  }
  function collect() {
    var nodes = $('customMcqCards').querySelectorAll('[data-index][data-field]');
    nodes.forEach(function(el){
      var i = Number(el.getAttribute('data-index')), key = el.getAttribute('data-field');
      if (questions[i] && ['q','a','b','c','d','ans','exp'].indexOf(key)>=0) questions[i][key]=el.value;
    });
  }
  function launchTest() {
    collect(); saveDraft();
    var valid = questions.filter(function(q){return q.q.trim()&&q.a.trim()&&q.b.trim()&&q.c.trim()&&q.d.trim();});
    if (!valid.length) { alert('Please fill in at least one question and all four options.'); return; }
    var fmt = window.cleanAndFormatScience || function(s){return s;};
    var parsed = valid.map(function(q,i){return {id:i+1,q:fmt(q.q.trim()),a:fmt(q.a.trim()),b:fmt(q.b.trim()),c:fmt(q.c.trim()),d:fmt(q.d.trim()),ans:q.ans,exp:fmt(q.exp.trim()||'রেফারেন্স: কাস্টম প্রশ্নব্যাংক। কনসেপ্ট: স্ব-মূল্যায়ন ও অনুশীলন সমাধান।')};});
    if (!window.ExamEngine || !window.ExamEngine.launchExam) { alert('Exam engine is not ready yet. Please reload the page and try again.'); return; }
    window.ExamEngine.launchExam({title:$('customMcqTitle').value.trim()||'My Custom MCQ Test',category:'Custom Practice',code:'CUSTOM_'+Date.now().toString().slice(-6),durationMinutes:Math.max(10,Math.ceil(parsed.length*0.5)),customQuestions:parsed});
  }
  function exportDraft() {
    collect(); saveDraft();
    var blob = new Blob([JSON.stringify({title:$('customMcqTitle').value||'My Custom MCQ Test',questions:questions},null,2)],{type:'application/json'});
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href=url; a.download='medical-secret-files-custom-mcq.json'; a.click();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }
  function loadDemoQuestions() {
    var demos = [
      {q:'মানুষের হৃৎপিণ্ডে প্রকোষ্ঠ কয়টি?',a:'২টি',b:'৩টি',c:'৪টি',d:'৫টি',ans:'c',exp:'রেফারেন্স: মানব শারীরতত্ত্ব, জীববিজ্ঞান ২য় পত্র। কনসেপ্ট: মানুষের হৃৎপিণ্ডে ৪টি প্রকোষ্ঠ থাকে।'},
      {q:'সালোকসংশ্লেষণের আলোক-নির্ভর পর্যায়ে কোন দুটি উপাদান তৈরি হয়?',a:'গ্লুকোজ ও অক্সিজেন',b:'ATP ও NADPH₂',c:'প্রোটিন ও লিপিড',d:'পাইরুভেট ও ল্যাকটেট',ans:'b',exp:'রেফারেন্স: উদ্ভিদ শারীরতত্ত্ব, জীববিজ্ঞান ১ম পত্র। কনসেপ্ট: আলোক-নির্ভর বিক্রিয়ায় ATP ও NADPH₂ উৎপন্ন হয়।'},
      {q:'ধানে (Oryza sativa) ডিপ্লয়েড ক্রোমোজোম সংখ্যা কত?',a:'১৪',b:'২০',c:'২৪',d:'৪২',ans:'c',exp:'রেফারেন্স: কোষ ও এর গঠন, জীববিজ্ঞান ১ম পত্র। কনসেপ্ট: ধানের ডিপ্লয়েড ক্রোমোজোম সংখ্যা ২৪।'}
    ];
    questions = demos.map(function(q,i){ return Object.assign(blankQuestion(i),q,{id:i+1}); });
    while (questions.length < 100) questions.push(blankQuestion(questions.length));
    $('customMcqTitle').value = 'Demo Medical MCQ Test';
    $('customMcqCards').innerHTML = questions.map(cardMarkup).join('');
    $('customMcqCount').value = questions.length;
    saveDraft();
    if ($('customMcqStatus')) $('customMcqStatus').textContent = 'Demo loaded: 3 sample questions + blank cards · Edit before starting';
    $('customMcqCards').querySelector('.custom-mcq-card')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function importJsonFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result || ''));
        var source = Array.isArray(data) ? data : (Array.isArray(data.questions) ? data.questions : null);
        if (!source) throw new Error('Expected a JSON array or an object with a questions array.');
        var normalized = source.slice(0,100).map(function (q,i) {
          var answer = String(q.ans || q.answer || q.correctAnswer || 'a').trim().toLowerCase();
          var match = answer.match(/[abcd]/);
          return {
            id:i+1,
            q:String(q.q || q.question || q.text || ''),
            a:String(q.a || q.optionA || q.options && q.options[0] || ''),
            b:String(q.b || q.optionB || q.options && q.options[1] || ''),
            c:String(q.c || q.optionC || q.options && q.options[2] || ''),
            d:String(q.d || q.optionD || q.options && q.options[3] || ''),
            ans:match ? match[0] : 'a',
            exp:String(q.exp || q.explanation || q.reference || '')
          };
        });
        if (!normalized.length) throw new Error('No questions found in this JSON file.');
        questions = normalized;
        while (questions.length < 100) questions.push(blankQuestion(questions.length));
        if (!Array.isArray(data) && data.title) $('customMcqTitle').value = String(data.title);
        $('customMcqCount').value = questions.length;
        $('customMcqCards').innerHTML = questions.map(cardMarkup).join('');
        saveDraft();
        if ($('customMcqStatus')) $('customMcqStatus').textContent = 'Imported ' + normalized.filter(function(q){return q.q.trim();}).length + ' question(s) from JSON. Review before starting.';
      } catch (error) {
        alert('Could not import this JSON: ' + error.message);
      }
    };
    reader.onerror = function () { alert('Could not read this file. Please choose a valid JSON file.'); };
    reader.readAsText(file);
  }
  function clearDraft() {
    if (!confirm('Clear all custom MCQ cards and the saved draft on this device?')) return;
    localStorage.removeItem(STORAGE_KEY); $('customMcqTitle').value='My Custom MCQ Test';
    renderCards(parseInt($('customMcqCount').value,10)||100,false);
  }
  document.addEventListener('DOMContentLoaded',function(){
    if (!readDraft()) questions=Array.from({length:100},function(_,i){return blankQuestion(i);});
    $('customMcqCards').innerHTML=questions.map(cardMarkup).join('');
    $('customMcqCount').value=questions.length||100;
    $('renderCustomMcqCards').addEventListener('click',function(){collect();renderCards($('customMcqCount').value,true);});
    $('customMcqCards').addEventListener('input',function(event){
      var el=event.target.closest('[data-index][data-field]'); if(!el)return;
      var i=Number(el.getAttribute('data-index')), key=el.getAttribute('data-field');
      if(questions[i]&&['q','a','b','c','d','ans','exp'].indexOf(key)>=0)questions[i][key]=el.value;
      scheduleSave();
    });
    $('customMcqTitle').addEventListener('input',scheduleSave);
    $('launchMcqBuilderTest').addEventListener('click',launchTest);
    $('exportCustomMcqDraft').addEventListener('click',exportDraft);
    $('importCustomMcqJson')?.addEventListener('click',function(){ $('customMcqJsonFile')?.click(); });
    $('customMcqJsonFile')?.addEventListener('change',function(event){ importJsonFile(event.target.files && event.target.files[0]); event.target.value=''; });
    $('clearCustomMcqDraft').addEventListener('click',clearDraft);
    $('loadDemoCustomMcq')?.addEventListener('click',loadDemoQuestions);
  });
})();