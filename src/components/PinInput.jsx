import { useEffect, useRef, useState } from 'react';

const LENGTH = 6;

export default function PinInput({ value = '', onChange, disabled = false, autoFocus = false, label = 'PIN' }) {
  const [digits, setDigits] = useState(() => Array(LENGTH).fill(''));
  const refs = useRef([]);

  useEffect(() => {
    if (!value) setDigits(Array(LENGTH).fill(''));
  }, [value]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next) => {
    setDigits(next);
    onChange(next.join(''));
  };

  const handleChange = (index, raw) => {
    const digit = String(raw).replace(/\D/g, '').slice(-1);
    if (!digit) return;
    const next = [...digits];
    next[index] = digit;
    commit(next);
    if (index < LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = '';
        commit(next);
      } else if (index > 0) {
        next[index - 1] = '';
        commit(next);
        refs.current[index - 1]?.focus();
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!pasted) return;
    const next = Array(LENGTH).fill('');
    pasted.split('').forEach((digit, index) => {
      next[index] = digit;
    });
    commit(next);
    refs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  };

  return (
    <div className="pin-input" role="group" aria-label={label} onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}
