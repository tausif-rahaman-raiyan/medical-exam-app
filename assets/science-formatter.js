/**
 * Centralized Scientific Formula & Typography Parser
 * Medical Secret Files Engine
 */

(function (global) {
  'use strict';

  function decodeHTMLEntities(str) {
    if (!str) return '';
    return str
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ');
  }

  function cleanAndFormatScience(input) {
    if (!input) return '';
    let s = String(input).trim();

    // Decode HTML entities
    s = decodeHTMLEntities(s);

    // Bengali Mojibake & Encoding normalization
    s = s.replace(/&#2507;/g, 'ো').replace(/&#2494;/g, 'া');

    // 1. MathML Multi-scripts & Nuclear Physics Isotopes
    s = s.replace(/<mmultiscripts>([\s\S]*?)<\/mmultiscripts>/gi, (match, inner) => {
      const parts = inner.split(/<mprescripts\s*(?:><\/mprescripts>|\/?>)/i);
      const post = (parts[0] || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/);
      const pre = (parts[1] || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/);
      const base = post[0] || '';
      const preSub = pre[0] || '';
      const preSup = pre[1] || '';
      return `<span class="inline-flex items-baseline font-mono font-bold"><sup class="text-[11px] leading-none">${preSup}</sup><sub class="text-[11px] leading-none">${preSub}</sub><span>${base}</span></span>`;
    });

    // 2. LaTeX Fractions & Square Roots
    s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="inline-flex flex-col text-center align-middle mx-1"><span class="border-b border-purple-400 pb-0.5 leading-none text-xs font-semibold">$1</span><span class="pt-0.5 leading-none text-xs font-semibold">$2</span></span>');
    s = s.replace(/\\sqrt\{([^}]+)\}/g, '<span class="inline-flex items-baseline font-mono"><span class="text-purple-400 font-bold">√</span><span class="border-t border-purple-400/80 px-1">$1</span></span>');

    // 3. Spaced Tags Cleanup (e.g. C O < sub > 2 < /sub >)
    s = s.replace(/<\s*sub\s*>/gi, '<sub>').replace(/<\s*\/\s*sub\s*>/gi, '</sub>');
    s = s.replace(/<\s*sup\s*>/gi, '<sup>').replace(/<\s*\/\s*sup\s*>/gi, '</sup>');

    // 4. Common Chemical Formulas & Ionic Charges
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

  /**
   * Two distinct colored lines for রেফারেন্স and কনসেপ্ট in every exam
   */
  function formatExplanation(rawExp) {
    if (!rawExp) return '';
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

    // Clean leading punctuation
    reference = reference.replace(/^[:：\-–—\s]+/, '').replace(/।\s*$/, '।');
    concept = concept.replace(/^[:：\-–—\s]+/, '');

    return `
      <!-- Line 1: রেফারেন্স in vibrant Cyan/Teal (Balanced Standard Size) -->
      <div class="p-3.5 sm:p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-start gap-3 shadow-sm">
        <span class="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 flex-shrink-0 shadow">
          <i class="fa fa-book-bookmark text-xs"></i> রেফারেন্স
        </span>
        <div class="text-sm sm:text-base font-semibold text-cyan-100 leading-relaxed self-center font-siliguri">
          ${reference || 'মেডিকেল ভর্তি প্রশ্নব্যাংক ও এইচএসসি পাঠ্যবই।'}
        </div>
      </div>

      <!-- Line 2: কনসেপ্ট in vibrant Amber/Gold (Balanced Standard Size) -->
      <div class="mt-2.5 p-3.5 sm:p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3 shadow-sm">
        <span class="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 flex-shrink-0 shadow">
          <i class="fa fa-lightbulb text-xs"></i> কনসেপ্ট
        </span>
        <div class="text-sm sm:text-base font-medium text-amber-100 leading-relaxed self-center font-siliguri">
          ${concept || 'সঠিক উত্তর যাচাই করে মেডিকেল কারিকুলাম ও প্রশ্নব্যাংক অনুসারে প্রস্তুত করা হয়েছে।'}
        </div>
      </div>
    `;
  }

  global.cleanAndFormatScience = cleanAndFormatScience;
  global.formatExplanation = formatExplanation;
})(typeof window !== 'undefined' ? window : this);
