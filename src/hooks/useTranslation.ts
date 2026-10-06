import { useLocale } from "@/contexts/LocaleContext";
import en from "../../locales/en.json";
import ko from "../../locales/ko.json";

const DICTS = { en, ko } as const;

type DeepRecord = { [k: string]: string | DeepRecord };

function resolve(obj: DeepRecord, keys: string[]): string | undefined {
  const val = keys.reduce<string | DeepRecord | undefined>(
    (acc, k) => (acc as DeepRecord)?.[k],
    obj
  );
  return typeof val === "string" ? val : undefined;
}

export function useTranslation() {
  const { locale, setLocale } = useLocale();
  const dict = DICTS[locale] as DeepRecord;
  const fallback = DICTS.en as DeepRecord;

  function t(key: string, vars?: Record<string, string>): string {
    const keys = key.split(".");
    const val = resolve(dict, keys) ?? resolve(fallback, keys) ?? key;
    if (!vars) return val;
    return val.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  }

  return { t, locale, setLocale };
}
