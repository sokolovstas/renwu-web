import { InlineLoader, TRANSLOCO_SCOPE } from '@jsverse/transloco';

const createInlineLoader = (languages: Array<string>): InlineLoader => {
  const translocoInlineLoader: InlineLoader = {};
  languages.forEach((lang) => {
    translocoInlineLoader[lang] = () => import(`../i18n/${lang}.json`);
  });
  return translocoInlineLoader;
};

export const SEARCH_TRANSLOCO_SCOPE = {
  provide: TRANSLOCO_SCOPE,
  useValue: {
    scope: 'search',
    loader: createInlineLoader(['en', 'ru', 'zh']),
  },
};
