import { formatMathText } from '../utils/mathFormatter';
import { Fragment } from 'react';

interface FormattedMathProps {
  children: string;
  className?: string;
}

export function FormattedMath({ children, className = '' }: FormattedMathProps) {
  // First, apply basic formatting (subscripts, superscripts, symbols, etc.)
  const basicFormatted = formatMathText(children);

  // Then parse for fractions and render them as visual fractions
  const parts: Array<{ type: 'text' | 'fraction', content: string, numerator?: string, denominator?: string }> = [];

  // Pattern to match fractions: anything/anything
  // This runs AFTER formatMathText, so subscripts are already converted
  const fractionPattern = /([^\s/()\[\]]+)\s*\/\s*([^\s/()\[\]]+)/g;

  let lastIndex = 0;
  let match;

  while ((match = fractionPattern.exec(basicFormatted)) !== null) {
    // Skip if it looks like a URL or date
    const fullMatch = match[0];
    if (fullMatch.includes('://') || fullMatch.includes('http') ||
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(fullMatch)) {
      continue;
    }

    // Add text before the fraction
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: basicFormatted.substring(lastIndex, match.index)
      });
    }

    // Add the fraction
    parts.push({
      type: 'fraction',
      content: fullMatch,
      numerator: match[1],
      denominator: match[2]
    });

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < basicFormatted.length) {
    parts.push({
      type: 'text',
      content: basicFormatted.substring(lastIndex)
    });
  }

  // If no fractions found, just return the formatted text
  if (parts.length === 0) {
    return <span className={className}>{basicFormatted}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, idx) => (
        <Fragment key={idx}>
          {part.type === 'text' ? (
            part.content
          ) : (
            <span
              className="inline-flex flex-col items-center mx-0.5 align-middle"
              style={{
                verticalAlign: 'middle',
                fontSize: '0.95em',
                lineHeight: '1'
              }}
            >
              <span className="border-b border-current px-0.5" style={{ fontSize: '0.85em' }}>
                {part.numerator}
              </span>
              <span className="px-0.5" style={{ fontSize: '0.85em' }}>
                {part.denominator}
              </span>
            </span>
          )}
        </Fragment>
      ))}
    </span>
  );
}
