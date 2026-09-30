import test from 'node:test';
import assert from 'node:assert/strict';
import { translate, englishHtml } from './english-pages.mjs';

test('translates names, titles, durations and AUD prices without altering values', () => {
  assert.equal(translate('墨尔本旅游-Sylvan Travel'), 'Melbourne Travel - Sylvan Travel');
  assert.equal(translate('2 天/3 天 · 2500 澳元起'), '2 days/3 days · From AUD 2500');
  assert.equal(translate('目的地: sydney | 时长: 1 天 | 报价: 800 澳元起'), 'Destination: Sydney | Duration: 1 day | Price: From AUD 800');
  assert.equal(translate('预约接送 $\\rightarrow$'), 'Book a Transfer →');
  assert.throws(() => translate('一段尚未配置翻译的新内容'), /Missing English translation/);
});

test('keeps navigation English while switching back to the same Chinese page', () => {
  const source='<html lang="zh-CN"><head><title>墨尔本旅游-Sylvan Travel</title></head><body><span data-language-label>中文</span><a data-language="zh" href="/countries/australia/melbourne/">中文</a><a data-language="en" href="/en/countries/australia/melbourne/">English</a><a href="/countries/australia/">澳大利亚</a><a href="#routes">推荐路线</a><a href="https://example.com/">External</a><img src="https://example.com/图片.jpg" alt="墨尔本"><input placeholder="例如: melbourne-hero.jpg"><script>const text="中文";</script></body></html>';
  const out=englishHtml(source,'test');
  assert.match(out, /lang="en"/);
  assert.match(out, /<title>Melbourne Travel - Sylvan Travel<\/title>/);
  assert.match(out, /data-language="zh" href="\/countries\/australia\/melbourne\/"/);
  assert.match(out, /href="\/en\/countries\/australia\/"/);
  assert.match(out, /href="#routes"/);
  assert.match(out, /src="https:\/\/example.com\/图片.jpg" alt="Melbourne"/);
  assert.match(out, /placeholder="Example: melbourne-hero.jpg"/);
  assert.match(out, /const text="中文"/);
  assert.match(out, /data-language-label="">English</);
  assert.equal(englishHtml(out,'test'),out);
});
