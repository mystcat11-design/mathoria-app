// Math formatter utility for converting simple notation to proper mathematical symbols

export function formatMathText(text: string): string {
  if (!text) return text;

  let result = text;

  // Helper function to convert characters to superscript
  const toSuperscript = (char: string): string => {
    const superscripts: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      '-': '⁻', '+': '⁺', '=': '⁼', '(': '⁽', ')': '⁾',
      'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
      'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
      'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
      'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
      'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
      'A': 'ᴬ', 'B': 'ᴮ', 'D': 'ᴰ', 'E': 'ᴱ', 'G': 'ᴳ',
      'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ',
      'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ', 'R': 'ᴿ',
      'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ'
    };
    return superscripts[char] || char;
  };

  // Helper function to convert characters to subscript
  const toSubscript = (char: string): string => {
    const subscripts: Record<string, string> = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      '-': '₋', '+': '₊', '=': '₌', '(': '₍', ')': '₎',
      'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
      'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
      'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
      'v': 'ᵥ', 'x': 'ₓ'
    };
    return subscripts[char] || char;
  };

  // Convert superscripts in parentheses: x^(n+1) -> xⁿ⁺¹
  result = result.replace(/\^\(([^)]+)\)/g, (_, content) => {
    return content.split('').map(toSuperscript).join('');
  });

  // Convert superscripts with negative numbers: 2^-3 -> 2⁻³
  result = result.replace(/\^(-\d+)/g, (_, num) => {
    return num.split('').map(toSuperscript).join('');
  });

  // Convert superscripts with positive numbers: 2^3 -> 2³
  result = result.replace(/\^(\d+)/g, (_, num) => {
    return num.split('').map(toSuperscript).join('');
  });

  // Convert superscripts with multiple characters: x^2n -> x²ⁿ
  result = result.replace(/\^([a-zA-Z0-9]+)/g, (_, chars) => {
    return chars.split('').map(toSuperscript).join('');
  });

  // Convert subscripts in parentheses: x_(n+1) -> xₙ₊₁
  result = result.replace(/_\(([^)]+)\)/g, (_, content) => {
    return content.split('').map(toSubscript).join('');
  });

  // Convert subscripts with negative numbers: x_-1 -> x₋₁
  result = result.replace(/_(-\d+)/g, (_, num) => {
    return num.split('').map(toSubscript).join('');
  });

  // Convert subscripts with positive numbers: x_1 -> x₁
  result = result.replace(/_(\d+)/g, (_, num) => {
    return num.split('').map(toSubscript).join('');
  });

  // Convert subscripts with multiple characters: x_2n -> x₂ₙ
  result = result.replace(/_([a-zA-Z0-9]+)/g, (_, chars) => {
    return chars.split('').map(toSubscript).join('');
  });

  // Convert sqrt(x) -> √x
  result = result.replace(/sqrt\(([^)]+)\)/gi, (_, content) => `√${content}`);

  // Convert cbrt(x) -> ∛x (cube root)
  result = result.replace(/cbrt\(([^)]+)\)/gi, (_, content) => `∛${content}`);

  // Convert <= -> ≤
  result = result.replace(/<=/g, '≤');

  // Convert >= -> ≥
  result = result.replace(/>=/g, '≥');

  // Convert != -> ≠
  result = result.replace(/!=/g, '≠');

  // Convert ~= -> ≈
  result = result.replace(/~=/g, '≈');

  // Convert infinity -> ∞
  result = result.replace(/infinity/gi, '∞');

  // Convert pi -> π
  result = result.replace(/\bpi\b/gi, 'π');

  // Convert theta -> θ
  result = result.replace(/\btheta\b/gi, 'θ');

  // Convert alpha -> α
  result = result.replace(/\balpha\b/gi, 'α');

  // Convert beta -> β
  result = result.replace(/\bbeta\b/gi, 'β');

  // Convert gamma -> γ
  result = result.replace(/\bgamma\b/gi, 'γ');

  // Convert delta -> Δ or δ
  result = result.replace(/\bDelta\b/g, 'Δ');
  result = result.replace(/\bdelta\b/gi, 'δ');

  // Convert sum -> Σ (sigma notation)
  result = result.replace(/\bsum\b/gi, 'Σ');

  // Convert integral -> ∫
  result = result.replace(/\bintegral\b/gi, '∫');

  // Convert times or * -> × (multiplication)
  result = result.replace(/\s*\*\s*/g, ' × ');
  result = result.replace(/\btimes\b/gi, ' × ');

  // NOTE: Fraction conversion is now handled visually in FormattedMath component
  // We keep the / as-is here, and the component will render it as a proper fraction
  // This allows for better visual representation with CSS styling

  // Convert degrees -> °
  result = result.replace(/\sdegrees?\b/gi, '°');

  return result;
}

// Get common math symbols for quick insert buttons
export const mathSymbols = {
  superscript: {
    label: 'Pangkat',
    symbols: [
      { label: 'x²', value: '²' },
      { label: 'x³', value: '³' },
      { label: 'xⁿ', value: 'ⁿ' },
      { label: 'x⁻¹', value: '⁻¹' },
      { label: 'x^', value: '^' },
      { label: 'x^()', value: '^()' }
    ]
  },
  subscript: {
    label: 'Subscript',
    symbols: [
      { label: 'x₁', value: '₁' },
      { label: 'x₂', value: '₂' },
      { label: 'xₙ', value: 'ₙ' },
      { label: 'x₋₁', value: '₋₁' },
      { label: 'x_', value: '_' },
      { label: 'x_()', value: '_()' }
    ]
  },
  operators: {
    label: 'Operator',
    symbols: [
      { label: '×', value: ' × ' },
      { label: '÷', value: ' ÷ ' },
      { label: '±', value: ' ± ' },
      { label: '≠', value: ' ≠ ' },
      { label: '≤', value: ' ≤ ' },
      { label: '≥', value: ' ≥ ' },
      { label: '≈', value: ' ≈ ' },
      { label: '/', value: '/' }
    ]
  },
  roots: {
    label: 'Akar',
    symbols: [
      { label: '√', value: '√' },
      { label: '∛', value: '∛' },
      { label: 'sqrt()', value: 'sqrt()' },
      { label: 'cbrt()', value: 'cbrt()' }
    ]
  },
  greek: {
    label: 'Huruf Yunani',
    symbols: [
      { label: 'π', value: 'π' },
      { label: 'θ', value: 'θ' },
      { label: 'α', value: 'α' },
      { label: 'β', value: 'β' },
      { label: 'γ', value: 'γ' },
      { label: 'δ', value: 'δ' },
      { label: 'Δ', value: 'Δ' },
      { label: 'Σ', value: 'Σ' }
    ]
  },
  others: {
    label: 'Lainnya',
    symbols: [
      { label: '∞', value: '∞' },
      { label: '°', value: '°' },
      { label: '∫', value: '∫' },
      { label: '⁄', value: '⁄' },
      { label: '()', value: '()' }
    ]
  }
};

// Helper text for users
export const mathFormattingHelp = `Cara Menulis Rumus Matematika:

Pangkat: 2^3 → 2³ | x^n → xⁿ | x^-1 → x⁻¹ | x^(n+1) → xⁿ⁺¹
Subscript: x_1 → x₁ | a_n → aₙ | x_(i+1) → xᵢ₊₁
Akar: sqrt(x) → √x | cbrt(8) → ∛8
Operator: <= → ≤ | >= → ≥ | != → ≠ | ~= → ≈
Huruf Yunani: pi → π | theta → θ | alpha → α | beta → β
Pecahan: a/b → pecahan visual (pembilang di atas penyebut)

Contoh: "x^2 + 2x_1 - sqrt(16) >= 0" → "x² + 2x₁ - √16 ≥ 0"`;
