import { isLosslessNumber } from "lossless-json";

export type NamingFormat = "camel" | "pascal" | "snake";

// 将任意风格的 key 拆分为单词数组
function splitWords(key: string): string[] {
  // 纯数字 key 不拆分
  if (/^\d+$/.test(key)) return [key];

  // 包含下划线 → 按 _ 分割
  if (key.includes("_")) {
    return key.split("_").filter(Boolean);
  }

  // camelCase / PascalCase → 大写字母前分割，连续大写作为整体
  const words: string[] = [];
  let current = "";

  for (let i = 0; i < key.length; i++) {
    const ch = key[i];
    const isUpper = ch >= "A" && ch <= "Z";

    if (isUpper && current.length > 0) {
      // 检查下一个字符：如果也是大写，则连续大写归为一组
      const nextIsLower =
        i + 1 < key.length && key[i + 1] >= "a" && key[i + 1] <= "z";
      const prevIsLower =
        current.length > 0 &&
        current[current.length - 1] >= "a" &&
        current[current.length - 1] <= "z";

      if (prevIsLower || nextIsLower) {
        words.push(current);
        current = ch;
      } else {
        current += ch;
      }
    } else {
      current += ch;
    }
  }

  if (current) words.push(current);

  return words;
}

function toCamelCase(words: string[]): string {
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join("");
}

function toPascalCase(words: string[]): string {
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toSnakeCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("_");
}

function convertKey(key: string, format: NamingFormat): string {
  const words = splitWords(key);

  // 单词且无变化的 key 直接返回
  if (words.length === 1 && words[0] === key) return key;

  switch (format) {
    case "camel":
      return toCamelCase(words);
    case "pascal":
      return toPascalCase(words);
    case "snake":
      return toSnakeCase(words);
  }
}

// 递归转换 JSON 对象的所有 key
function convertKeysDeep<T>(value: T, format: NamingFormat): T {
  if (Array.isArray(value)) {
    return value.map((v) => convertKeysDeep(v, format)) as T;
  }

  if (value !== null && typeof value === "object" && !isLosslessNumber(value)) {
    const result: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[convertKey(k, format)] = convertKeysDeep(v, format);
    }

    return result as T;
  }

  return value;
}

export { splitWords, toCamelCase, toPascalCase, toSnakeCase, convertKeysDeep };
