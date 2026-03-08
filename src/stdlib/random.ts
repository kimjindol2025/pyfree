/**
 * PyFree Random 라이브러리
 * 난수 생성 (Python random 모듈 호환)
 */

let _seed: number = Date.now();

/**
 * Seeded 난수 생성기 (선형 합동 생성기)
 */
function seeded_random(): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}

/**
 * 시드 설정
 */
export function seed(value: number): void {
  _seed = Math.abs(Math.floor(value));
}

/**
 * 0 이상 1 미만의 무작위 float 반환
 */
export function random(): number {
  return Math.random();
}

/**
 * a 이상 b 이하의 무작위 정수 반환 (포함)
 */
export function randint(a: number, b: number): number {
  const min = Math.ceil(a);
  const max = Math.floor(b);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * a 이상 b 이하의 무작위 float 반환
 */
export function uniform(a: number, b: number): number {
  return Math.random() * (b - a) + a;
}

/**
 * 리스트에서 하나의 요소를 무작위로 선택
 */
export function choice<T>(seq: T[]): T {
  if (seq.length === 0) {
    throw new Error('sequence를 비어있을 수 없습니다');
  }
  return seq[Math.floor(Math.random() * seq.length)];
}

/**
 * 리스트를 제자리에서 섞음
 */
export function shuffle<T>(seq: T[]): T[] {
  const arr = [...seq];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 리스트에서 k개의 고유한 요소를 무작위로 선택
 */
export function sample<T>(seq: T[], k: number): T[] {
  if (k > seq.length) {
    throw new Error(`k가 sequence의 크기보다 클 수 없습니다`);
  }

  const indices = new Set<number>();
  while (indices.size < k) {
    indices.add(Math.floor(Math.random() * seq.length));
  }

  return Array.from(indices).map((i) => seq[i]);
}

/**
 * 정규분포 (Box-Muller 변환)
 */
export function gauss(mu: number = 0, sigma: number = 1): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random(); // (0, 1] 범위로 확보

  u2 = Math.random();
  const mag = sigma * Math.sqrt(-2.0 * Math.log(u1));
  const z0 = mag * Math.cos((2.0 * Math.PI * u2) / (2 * Math.PI));
  return z0 + mu;
}

/**
 * 정규분포 (shorthand)
 */
export function normal(mu: number = 0, sigma: number = 1): number {
  return gauss(mu, sigma);
}

/**
 * 지수분포
 */
export function exponential(lambd: number = 1): number {
  return (-Math.log(Math.random())) / lambd;
}

/**
 * 이항분포 (단순 구현)
 */
export function binomial(n: number, p: number): number {
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (Math.random() < p) {
      count++;
    }
  }
  return count;
}

/**
 * 포아송 분포
 */
export function poisson(lambd: number): number {
  let k = 0;
  let L = Math.exp(-lambd);
  let p = 1;

  while (p > L) {
    k++;
    p *= Math.random();
  }

  return k - 1;
}

/**
 * 베타분포
 */
export function beta(alpha: number, beta: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const beta_ln = Math.log(u1) / alpha - Math.log(u2) / beta;
  return 1 / (1 + Math.exp(-beta_ln));
}

/**
 * 주사위 굴림 (1~6)
 */
export function roll_die(sides: number = 6): number {
  return randint(1, sides);
}

/**
 * 동전 던지기 (확률 p로 True)
 */
export function coin_flip(p: number = 0.5): boolean {
  return Math.random() < p;
}

/**
 * 가중치가 있는 선택
 */
export function choices<T>(population: T[], weights: number[], k: number = 1): T[] {
  const result: T[] = [];
  const cumulativeWeights = [];
  let sum = 0;

  for (const w of weights) {
    sum += w;
    cumulativeWeights.push(sum);
  }

  for (let i = 0; i < k; i++) {
    const rand = Math.random() * sum;
    for (let j = 0; j < cumulativeWeights.length; j++) {
      if (rand <= cumulativeWeights[j]) {
        result.push(population[j]);
        break;
      }
    }
  }

  return result;
}

/**
 * 무작위 부분 배열 생성 (복원 추출)
 */
export function random_subset<T>(seq: T[], probability: number = 0.5): T[] {
  return seq.filter(() => Math.random() < probability);
}

/**
 * 모든 내보내기
 */
export const RANDOM_MODULE = {
  seed,
  random,
  randint,
  uniform,
  choice,
  shuffle,
  sample,
  gauss,
  normal,
  exponential,
  binomial,
  poisson,
  beta,
  roll_die,
  coin_flip,
  choices,
  random_subset,
};
