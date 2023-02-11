import { formatMoney, formatRate, roundMoney } from './money';

describe('roundMoney', () => {
  it('rounds to whole cents', () => {
    expect(roundMoney(3.9899999)).toBe(3.99);
    expect(roundMoney(2.625)).toBe(2.63);
  });

  it('rounds half away from zero, the way BigDecimal#round does', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(-1.005)).toBe(-1.01);
  });

  it('treats anything that is not a finite number as zero', () => {
    expect(roundMoney(undefined)).toBe(0);
    expect(roundMoney('not a price')).toBe(0);
    expect(roundMoney(Infinity)).toBe(0);
  });
});

describe('formatMoney', () => {
  it('always shows two decimal places', () => {
    expect(formatMoney(3.8)).toBe('$3.80');
    expect(formatMoney('6.78')).toBe('$6.78');
  });

  it('falls back to zero rather than rendering NaN at a customer', () => {
    expect(formatMoney(undefined)).toBe('$0.00');
  });
});

describe('formatRate', () => {
  it('drops trailing zeros the API sends', () => {
    expect(formatRate(5.0)).toBe('5%');
    expect(formatRate(12.5)).toBe('12.5%');
  });
});
