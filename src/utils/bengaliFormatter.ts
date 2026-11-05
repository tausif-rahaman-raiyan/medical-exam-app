// Bengali Numerals and Year Formatting Utilities

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENGLISH_DIGITS: { [key: string]: string } = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

/**
 * Converts English numbers or digits into crisp Bengali numerals
 */
export function toBengaliDigits(input: number | string): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)] || digit);
}

/**
 * Converts Bengali digits back into standard English numbers
 */
export function toEnglishDigits(input: string): string {
  if (!input) return '';
  return String(input).replace(/[০-৯]/g, (bengaliDigit) => ENGLISH_DIGITS[bengaliDigit] || bengaliDigit);
}

/**
 * Identifies academic year sessions like "২০১৩-২০১৪" or "2023-2024" in an exam title
 * and returns the session year badge string along with clean topic title.
 */
export function parseExamSessionYear(title: string): {
  hasYear: boolean;
  sessionYear: string | null;
  displayTitle: string;
} {
  if (!title) return { hasYear: false, sessionYear: null, displayTitle: '' };

  // Match Bengali year ranges like ২০১৩-২০১৪ or ২০২৪-২০২৫
  const bnYearRangeRegex = /([০-৯]{4}\s*[-–—]\s*[০-৯]{4})/i;
  const bnMatch = title.match(bnYearRangeRegex);
  if (bnMatch) {
    const rawYear = bnMatch[1].replace(/\s+/g, '');
    let clean = title.replace(bnYearRangeRegex, '').trim();
    clean = clean.replace(/^[–—\-\s]+|[–—\-\s]+$/g, '');
    if (!clean || clean.length < 3) {
      clean = 'মেডিকেল ভর্তি পরীক্ষা প্রশ্নপত্র';
    }
    return {
      hasYear: true,
      sessionYear: rawYear,
      displayTitle: clean
    };
  }

  // Match English year ranges like 2013-2014 or 2024-25
  const enYearRangeRegex = /((?:19|20)\d{2}\s*[-–—]\s*(?:19|20)?\d{2})/i;
  const enMatch = title.match(enYearRangeRegex);
  if (enMatch) {
    const rawYear = enMatch[1].replace(/\s+/g, '');
    const bnFormatted = toBengaliDigits(rawYear);
    let clean = title.replace(enYearRangeRegex, '').trim();
    clean = clean.replace(/^[–—\-\s]+|[–—\-\s]+$/g, '');
    if (!clean || clean.length < 3) {
      clean = 'মেডিকেল ভর্তি পরীক্ষা প্রশ্নপত্র';
    }
    return {
      hasYear: true,
      sessionYear: bnFormatted,
      displayTitle: clean
    };
  }

  return {
    hasYear: false,
    sessionYear: null,
    displayTitle: title
  };
}
