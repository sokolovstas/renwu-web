import { isAdvancedOQL, isStructuredOQL } from './oql-query';

describe('oql-query', () => {
  describe('isStructuredOQL', () => {
    it('detects field operators', () => {
      expect(isStructuredOQL('project=REN')).toBe(true);
      expect(isStructuredOQL('status != Open')).toBe(true);
      expect(isStructuredOQL('date_start>now/d')).toBe(true);
      expect(isStructuredOQL('text="login"')).toBe(true);
    });

    it('treats plain text as unstructured', () => {
      expect(isStructuredOQL('login form')).toBe(false);
      expect(isStructuredOQL('логин')).toBe(false);
      expect(isStructuredOQL('')).toBe(false);
    });
  });

  describe('isAdvancedOQL', () => {
    it('sends valid OQL through advanced search', () => {
      expect(isAdvancedOQL('project=REN')).toBe(true);
      expect(isAdvancedOQL('status = Open AND closed="false"')).toBe(true);
    });

    it('sends bare text through advanced search', () => {
      expect(isAdvancedOQL('login form')).toBe(true);
      expect(isAdvancedOQL('логин')).toBe(true);
    });

    it('does not treat an empty query as advanced', () => {
      expect(isAdvancedOQL('')).toBe(false);
      expect(isAdvancedOQL('   ')).toBe(false);
    });

    it('does not treat incomplete OQL as advanced', () => {
      expect(isAdvancedOQL('status =')).toBe(false);
    });
  });
});
