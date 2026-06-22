export const REQUEST_FORMATS = [
  "FEED",
  "STORIES",
  "THUMB REELS",
  "THUMB YOUTUBE",
  "GOOGLE ESTÁTICO",
  "GOOGLE RESPONSIVO",
  "CARROSSEL",
  "APRESENTAÇÃO/PPT",
  "IMPRESSO",
  "EBOOK",
  "LOGO",
  "PÁGINA DE CAPTURA",
  "PÁGINA DE VENDAS",
  "SITE",
  "OTIMIZAÇÃO",
] as const;

export type RequestFormat = (typeof REQUEST_FORMATS)[number];
