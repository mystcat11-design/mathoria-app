import { useRef } from 'react';
import { HelpCircle, Eye } from 'lucide-react';
import { formatMathText, mathSymbols, mathFormattingHelp } from '../utils/mathFormatter';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
  showPreview?: boolean;
}

export function MathInput({
  value,
  onChange,
  placeholder = 'Ketik rumus matematika...',
  label,
  rows = 3,
  showPreview = true
}: MathInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const formattedText = formatMathText(value);

  const insertSymbol = (symbol: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + symbol + value.substring(end);

    onChange(newValue);

    // Set cursor position after inserted symbol
    setTimeout(() => {
      textarea.focus();
      const newPos = start + symbol.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* Math Symbols & Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-800">Panduan Format Matematika</span>
        </div>

        <div className="bg-white/70 rounded p-2 text-xs text-gray-700 whitespace-pre-line">
          {mathFormattingHelp}
        </div>

        <div className="border-t border-blue-200 pt-3 space-y-2">
          {Object.entries(mathSymbols).map(([key, group]) => (
            <div key={key} className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-600 w-24">{group.label}:</span>
              <div className="flex flex-wrap gap-1">
                {group.symbols.map((symbol, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertSymbol(symbol.value)}
                    className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-400 transition-colors"
                    title={`Insert ${symbol.label}`}
                  >
                    {symbol.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
      />

      {/* Live Preview */}
      {showPreview && value && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">Preview Hasil:</span>
          </div>
          <div className="text-gray-800 text-base leading-relaxed">
            {formattedText}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        💡 Tips: Gunakan tombol simbol di atas atau ketik langsung (contoh: 2^3, sqrt(x), x_1)
      </p>
    </div>
  );
}
