import fs from 'node:fs/promises';
import path from 'node:path';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log('GEMINI_API_KEY is not configured; skipping optional Bengali AI proofreading.');
  process.exit(0);
}

const roots = ['www'];
const htmlFiles = [];
async function walk(dir) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) htmlFiles.push(full);
  }
}
for (const root of roots) await walk(root);

function visibleText(html) {
  return html
    .replace(/<!--[\\s\\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript)\\b[^>]*>[\\s\\S]*?<\\/\\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/[\\t\\r ]+/g, ' ').replace(/\\n{2,}/g, '\\n').trim();
}
const report = ['# Bengali AI Proofreading Report', '', 'This report flags possible spelling, grammar, and sentence-clarity issues. It does not modify source files.', ''];
let found = 0;
for (const file of htmlFiles) {
  const text = visibleText(await fs.readFile(file, 'utf8'));
  const bengali = text.split(/(?<=[।!?])\\s+|\\n+/).map(s => s.trim())
    .filter(s => /[\\u0980-\\u09FF]/.test(s) && s.length >= 8);
  if (!bengali.length) continue;
  const chunks = [];
  let current = [];
  let size = 0;
  for (const sentence of bengali) {
    if (size + sentence.length > 7000 && current.length) {
      chunks.push(current.join('\\n')); current = []; size = 0;
    }
    current.push(sentence); size += sentence.length;
  }
  if (current.length) chunks.push(current.join('\\n'));
  for (let i = 0; i < chunks.length; i++) {
    const prompt = 'তুমি একজন সতর্ক বাংলা প্রুফরিডার। নিচের UI/ওয়েবসাইটের বাংলা লেখাগুলোতে শুধু স্পষ্ট বানান, ব্যাকরণ, যতিচিহ্ন ও বাক্যগঠনের ভুল শনাক্ত করো। মেডিকেল/বৈজ্ঞানিক শব্দ বা নাম অনুমান করে বদলাবে না। প্রতিটি সমস্যার জন্য মূল অংশ, প্রস্তাবিত সংশোধন এবং সংক্ষিপ্ত কারণ দাও। ভুল না থাকলে "কোনো স্পষ্ট ভুল পাওয়া যায়নি" বলো। সোর্স কোড নয়, কেবল লেখার অংশ পর্যালোচনা করো।\\n\\n' + chunks[i];
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } })
    });
    if (!response.ok) throw new Error('Gemini request failed (' + response.status + '): ' + (await response.text()).slice(0, 500));
    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\\n') || 'No response text returned.';
    report.push('## ' + file + ' — অংশ ' + (i + 1), '', answer, '');
    found++;
  }
}
report.push('Reviewed ' + found + ' text chunk(s) from ' + htmlFiles.length + ' HTML file(s).');
await fs.writeFile('bengali-proofreading-report.md', report.join('\\n'), 'utf8');
console.log('Bengali AI proofreading finished. See bengali-proofreading-report.md');
