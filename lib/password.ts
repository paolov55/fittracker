// Medidor de força de senha por entropia (bits ≈ length * log2(pool)), com
// penalidades para padrões previsíveis. Puramente por comprimento (a versão
// anterior) classifica "paolopaolo" como forte e "Xk9$mQ" como fraca — o
// oposto do que é verdade. Sem dependência externa (evita puxar zxcvbn, que
// é pesado para um PWA) — a lista de senhas comuns é curta e local.

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4; // 0 = vazio, 1 = muito fraca … 4 = forte
  label: string;
  hint: string;
};

const COMMON_PASSWORDS = [
  "senha",
  "senha123",
  "12345678",
  "123456789",
  "password",
  "password1",
  "qwerty123",
  "academia",
  "treino123",
  "mudar123",
  "fittracker",
  "iloveyou",
  "letmein",
  "admin123",
];

function charsetBits(pass: string): number {
  let pool = 0;
  if (/[a-z]/.test(pass)) pool += 26;
  if (/[A-Z]/.test(pass)) pool += 26;
  if (/[0-9]/.test(pass)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pass)) pool += 33;
  if (pool === 0) return 0;
  return pass.length * Math.log2(pool);
}

// Se a senha inteira é uma unidade curta repetida (ex: "paolopaolo",
// "abcabcabc"), só conta a entropia da unidade — repetir não acrescenta
// segurança de verdade.
function collapseRepeats(pass: string): string {
  for (let unitLen = 1; unitLen <= Math.floor(pass.length / 2); unitLen++) {
    if (pass.length % unitLen !== 0) continue;
    const unit = pass.slice(0, unitLen);
    if (unit.repeat(pass.length / unitLen) === pass) return unit;
  }
  return pass;
}

const SEQUENCES = ["0123456789", "abcdefghijklmnopqrstuvwxyz", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

function hasLongSequence(lower: string): boolean {
  for (const seq of SEQUENCES) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const fwd = seq.slice(i, i + 4);
      const rev = fwd.split("").reverse().join("");
      if (lower.includes(fwd) || lower.includes(rev)) return true;
    }
  }
  return false;
}

export function scorePassword(pass: string, context: (string | undefined)[] = []): PasswordStrength {
  if (!pass) return { score: 0, label: "", hint: "" };

  const lower = pass.toLowerCase();
  const base = collapseRepeats(pass);
  let bits = charsetBits(base);

  const isCommon = COMMON_PASSWORDS.some((c) => lower === c || lower.startsWith(c));
  if (isCommon) bits = Math.min(bits, 15);

  if (hasLongSequence(lower)) bits *= 0.5;

  for (const raw of context) {
    const needle = (raw ?? "").trim().toLowerCase();
    if (needle.length >= 3 && lower.includes(needle)) bits *= 0.4;
  }

  let score: PasswordStrength["score"];
  if (bits < 28) {
    score = 1;
  } else if (bits < 40) {
    score = 2;
  } else if (bits < 60) {
    score = 3;
  } else {
    score = 4;
  }

  // Abaixo de 8 caracteres o teto é "Fraca": mesmo com bom charset, poucos
  // caracteres são pouco resistentes a força bruta — mas ainda distinguimos
  // uma senha curta complexa (ex. "Xk9$mQ") de uma longa e óbvia (ex.
  // "paolopaolo"), em vez de jogar as duas para o mesmo patamar mínimo.
  if (pass.length < 8 && score > 2) score = 2;

  const labels: Record<PasswordStrength["score"], string> = {
    0: "",
    1: "Muito fraca",
    2: "Fraca",
    3: "Boa",
    4: "Forte",
  };

  const hints: Record<PasswordStrength["score"], string> = {
    0: "",
    1:
      pass.length < 8
        ? "Use pelo menos 8 caracteres"
        : "Evite repetições, sequências ou dados óbvios como seu nome",
    2: "Misture maiúsculas, números e símbolos para reforçar",
    3: "Boa senha — pode ficar ainda mais forte com mais caracteres",
    4: "Senha forte",
  };

  return { score, label: labels[score], hint: hints[score] };
}
