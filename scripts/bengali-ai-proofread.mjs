import fs from 'node:fs/promises';
import path from 'node:path';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not configured. Add it in GitHub Settings > Secrets and variables > Actions.');
}

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
await walk('www');
for (const file of ['index.html', 'login.html', 'sync.html']) {
  try { if ((await fs.stat(file)).isFile()) htmlFiles.push(file); } catch {}
}

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

const report = [
  '# Bengali AI Proofreading Report',
  '',
  'This report flags possible spelling, grammar, and sentence-clarity issues. It does not modify source files.',
  ''
];
const sections = [];
for (const file of [...new Set(htmlFiles)]) {
  const text = visibleText(await fs.readFile(file, 'utf8'));
  const sentences = text.split(/(?<=[।!?])\\s+|\\n+/).map(s => s.trim())
    .filter(s => /[\\u0980-\\u09FF]/.test(s) && s.length >= 8);
  if (sentences.length) sections.push({ file, text: sentences.join('\\n') });
}

if (!sections.length) {
  report.push('No Bengali text of sufficient length was found in the scanned HTML files.');
} else {
  // One Gemini request per workflow run avoids exhausting the free-tier request quota
  // by sending a separate request for every file/chunk.
  const maxChars = 26000;
  let remaining = maxChars;
  const included = [];
  const omitted = [];
  for (const section of sections) {
    const block = 'FILE: ' + section.file + '\\n' + section.text;
    if (block.length <= remaining) {
      included.push(block);
      remaining -= block.length;
    } else {
      const partial = remaining > 500 ? block.slice(0, remaining) : '';
      if (partial) included.push(partial + '\\n[NOTE: this file was truncated to fit the single-request limit.]');
      omitted.push(section.file);
      remaining = 0;
      break;
    }
  }

  const prompt = 'তুমি একজন সতর্ক বাংলা প্রুফরিডার। নিচের UI/ওয়েবসাইটের বাংলা লেখাগুলোতে শুধু স্পষ্ট বানান, ব্যাকরণ, যতিচিহ্ন ও বাক্যগঠনের ভুল শনাক্ত করো। মেডিকেল/বৈজ্ঞানিক শব্দ, নাম বা ব্র্যান্ড অনুমান করে বদলাবে না। প্রতিটি সমস্যার জন্য ফাইলের নাম, মূল অংশ, প্রস্তাবিত সংশোধন এবং সংক্ষিপ্ত কারণ দাও। ভুল না থাকলে সেটি বলো। সোর্স কোড নয়, কেবল দৃশ্যমান লেখার অংশ পর্যালোচনা করো।\n\n' +
    included.join('\\n\\n---\\n\\n');

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
    })
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 1200);
    if (response.status === 429) {
      throw new Error('Gemini quota/rate limit reached (429). This workflow now uses only ONE Gemini request per run, but the current quota is already exhausted. Wait until the reset time in the error message, then rerun. Details: ' + details);
    }
    throw new Error('Gemini request failed (' + response.status + '): ' + details);
  }

  const data = await response.json();
  const answer = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\\n') || 'No response text returned.';
  report.push(answer, '');
  report.push('Scanned ' + sections.length + ' HTML file(s); sent one combined request covering up to ' + maxChars + ' characters.');
  if (omitted.length) report.push('WARNING: content exceeded the request limit; some text was not reviewed. Files at/after the limit include: ' + omitted.join(', '));
}
await fs.writeFile('bengali-proofreading-report.md', report.join('\\n'), 'utf8');
console.log('Bengali AI proofreading finished. See bengali-proofreading-report.md');
