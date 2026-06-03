export type Dict = typeof import("./dictionaries").ar;

export async function getTranslations(lang?: string): Promise<Dict> {
  const { ar, en } = await import("./dictionaries");
  return lang === "en" ? en : ar;
}
