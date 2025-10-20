// src/lib/wiki.types.ts
export type Article = {
  title: string;
  url: string;          // canonical wikipedia url
  html: string;         // sanitized HTML
  text: string;         // plain text
  description?: string;
};
