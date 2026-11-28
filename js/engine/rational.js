// engine/rational.js
// ============================================================================
// Exact BigInt rational arithmetic — the basis of the null-space balancer.
// Immune to IEEE-754 drift when solving stoichiometric systems.
// ============================================================================

export class Rational {
  static gcd(a, b) {
    let x = a < 0n ? -a : a;
    let y = b < 0n ? -b : b;
    while (y !== 0n) {
      const t = x % y;
      x = y;
      y = t;
    }
    return x;
  }

  static lcm(a, b) {
    if (a === 0n || b === 0n) return 0n;
    return (a / Rational.gcd(a, b)) * b;
  }

  constructor(num, den = 1n) {
    if (den === 0n) throw new Error('Rational: division by zero');
    let n = typeof num === 'bigint' ? num : BigInt(num);
    let d = typeof den === 'bigint' ? den : BigInt(den);
    if (d < 0n) { n = -n; d = -d; }
    const g = Rational.gcd(n, d);
    if (g > 0n) { n /= g; d /= g; }
    this.num = n;
    this.den = d;
  }

  add(o) { return new Rational(this.num * o.den + o.num * this.den, this.den * o.den); }
  sub(o) { return new Rational(this.num * o.den - o.num * this.den, this.den * o.den); }
  mul(o) { return new Rational(this.num * o.num, this.den * o.den); }
  div(o) { return new Rational(this.num * o.den, this.den * o.num); }
  neg() { return new Rational(-this.num, this.den); }
  isZero() { return this.num === 0n; }
  cmp(o) { return this.num * o.den - o.num * this.den; }
  toNumber() { return Number(this.num) / Number(this.den); }
  toString() { return `${this.num}/${this.den}`; }
}
