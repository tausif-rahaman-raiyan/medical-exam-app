export function decodeHTMLEntities(str: string): string {
  if (!str) return '';
  let decoded = str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');

  try {
    decoded = decoded.normalize('NFC');
  } catch {}

  decoded = decoded
    .replace(/\u09C7\u09BE/g, '\u09CB')
    .replace(/\u09C7\u09D7/g, '\u09CC')
    .replace(/&#2507;/g, 'ো')
    .replace(/&#2494;/g, 'া');

  return decoded;
}

export function cleanAndFormatScience(input: string): string {
  if (!input) return '';
  let s = String(input).trim();

  s = decodeHTMLEntities(s);

  // Clean legacy font tags and conflicting inline styles that cause Bengali numbers like ১ to clip or overlap
  s = s.replace(/<\/?font[^>]*>/gi, '');
  s = s.replace(/style=(["'])[^"']*(?:margin|letter-spacing|font-family)[^"']*\1/gi, '');

  // MathML Multi-scripts
  s = s.replace(/<mmultiscripts>([\s\S]*?)<\/mmultiscripts>/gi, (_, inner) => {
    const parts = inner.split(/<mprescripts\s*(?:><\/mprescripts>|\/?>)/i);
    const post = (parts[0] || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/);
    const pre = (parts[1] || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/);
    const base = post[0] || '';
    const preSub = pre[0] || '';
    const preSup = pre[1] || '';
    return `<span class="inline-flex items-baseline font-mono font-bold"><sup class="text-[11px] leading-none">${preSup}</sup><sub class="text-[11px] leading-none">${preSub}</sub><span>${base}</span></span>`;
  });

  // LaTeX Fractions & Square Roots
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="inline-flex flex-col text-center align-middle mx-1"><span class="border-b border-purple-400 pb-0.5 leading-none text-xs font-semibold">$1</span><span class="pt-0.5 leading-none text-xs font-semibold">$2</span></span>');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '<span class="inline-flex items-baseline font-mono"><span class="text-purple-400 font-bold">√</span><span class="border-t border-purple-400/80 px-1">$1</span></span>');

  // Spaced Sub/Sup
  s = s.replace(/<\s*sub\s*>/gi, '<sub>').replace(/<\s*\/\s*sub\s*>/gi, '</sub>');
  s = s.replace(/<\s*sup\s*>/gi, '<sup>').replace(/<\s*\/\s*sup\s*>/gi, '</sup>');

  // Chemical formulas
  s = s.replace(/\b(H)2(SO4)\b/g, '$1<sub>2</sub>$2');
  s = s.replace(/\b(CO|SO|NO)2\b/g, '$1<sub>2</sub>');
  s = s.replace(/\b(Ca|Mg|Fe|Ba|Zn)2\+/g, '$1<sup>2+</sup>');
  s = s.replace(/\b(SO4)2-|\b(SO4)²⁻/g, 'SO<sub>4</sub><sup>2-</sup>');
  s = s.replace(/\bH2O\b/g, 'H<sub>2</sub>O');
  s = s.replace(/\bCO2\b/g, 'CO<sub>2</sub>');
  s = s.replace(/\bCaCO3\b/g, 'CaCO<sub>3</sub>');
  s = s.replace(/\bNaOH\b/g, 'NaOH');
  s = s.replace(/\bHCl\b/g, 'HCl');
  s = s.replace(/\bNH3\b/g, 'NH<sub>3</sub>');
  s = s.replace(/\bCH4\b/g, 'CH<sub>4</sub>');
  s = s.replace(/\bC6H12O6\b/g, 'C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>');

  return s;
}

export function parseExplanation(rawExp: string): { reference: string; concept: string } {
  if (!rawExp) {
    return {
      reference: 'মেডিকেল ভর্তি প্রশ্নব্যাংক ও এইচএসসি পাঠ্যবই।',
      concept: 'সঠিক উত্তর যাচাই করে মেডিকেল কারিকুলাম অনুসারে প্রস্তুত করা হয়েছে।'
    };
  }

  let text = decodeHTMLEntities(String(rawExp)).trim();
  text = cleanAndFormatScience(text);

  let reference = '';
  let concept = '';

  if (text.includes('রেফারেন্স') && text.includes('কনসেপ্ট')) {
    const parts = text.split(/কনসেপ্ট\s*[:：]?/i);
    reference = parts[0].replace(/^.*রেফারেন্স\s*[:：]?/i, '').trim();
    concept = (parts[1] || '').trim();
  } else if (text.includes('রেফারেন্স')) {
    reference = text.replace(/^.*রেফারেন্স\s*[:：]?/i, '').trim();
    concept = 'পাঠ্যসূচির মূল শিখনফল ও মেডিকেল স্ট্যান্ডার্ড ব্যাখ্যা।';
  } else if (text.includes('কনসেপ্ট')) {
    reference = 'মেডিকেল ভর্তি প্রশ্নব্যাংক ও মূল পাঠ্যবই।';
    concept = text.replace(/^.*কনসেপ্ট\s*[:：]?/i, '').trim();
  } else {
    reference = 'মেডিকেল ভর্তি প্রশ্নব্যাংক ও মূল পাঠ্যবই।';
    concept = text;
  }

  reference = reference.replace(/^[:：\-–—\s]+/, '').replace(/।\s*$/, '।');
  concept = concept.replace(/^[:：\-–—\s]+/, '');

  return {
    reference: reference || 'মেডিকেল ভর্তি প্রশ্নব্যাংক ও এইচএসসি পাঠ্যবই।',
    concept: concept || 'মেডিকেল ভর্তি পরীক্ষার প্রাসঙ্গিক পাঠ্যসূচি অনুসারে সঠিক তথ্য।'
  };
}
