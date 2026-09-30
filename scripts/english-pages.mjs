import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse, serialize } from 'parse5';

const dictionary = JSON.parse(await readFile(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const han = /\p{Script=Han}/u;
const cityNames = {melbourne:'Melbourne',sydney:'Sydney',adelaide:'Adelaide',beijing:'Beijing',shanghai:'Shanghai',"xi'an":'Xi’an'};
const normalize = value => value.replace(/\s+/g, ' ').trim();

export function translate(value) {
  const text = normalize(value);
  if (dictionary[text]) return dictionary[text];
  if (!han.test(text)) return text;
  if (text.startsWith('/ ')) return '/ ' + translate(text.slice(2));
  if (text.endsWith('$\\rightarrow$')) return translate(text.slice(0, -'$\\rightarrow$'.length).trim()) + ' →';
  const brand = text.match(/^(.*?)\s*-\s*Sylvan Travel$/);
  if (brand) return translate(brand[1]) + ' - Sylvan Travel';
  if (text.startsWith('Sylvan Travel - ')) return 'Sylvan Travel - ' + translate(text.slice('Sylvan Travel - '.length));
  if (text.startsWith('Sylvan Assets Manager - ')) return 'Sylvan Assets Manager - ' + translate(text.slice('Sylvan Assets Manager - '.length));
  if (text.endsWith('旅游')) return translate(text.slice(0, -2)) + ' Travel';
  const count = text.match(/^(\d+) 个目的地$/);
  if (count) return `${count[1]} ${count[1] === '1' ? 'destination' : 'destinations'}`;
  // Translate structured duration/price strings without changing prices or route IDs.
  const formatted = text
    .replace(/目的地:\s*([^|]+)/g, (_, city) => `Destination: ${cityNames[city.trim()] || city.trim()} `)
    .replace(/时长:/g, 'Duration:').replace(/报价:\s*/g, 'Price: ')
    .replace(/(\d+(?:\.\d+)?)\s*澳元起/g, 'From AUD $1')
    .replace(/(\d+)\s*天/g, (_, n) => `${n} ${n === '1' ? 'day' : 'days'}`)
    .replace(/(\d+)\s*小时/g, (_, n) => `${n} ${n === '1' ? 'hour' : 'hours'}`);
  if (!han.test(formatted)) return formatted;
  throw new Error(`Missing English translation: ${text}`);
}

function setAttribute(node, name, value) {
  const attr = node.attrs.find(a => a.name === name);
  if (attr) attr.value = value;
  else node.attrs.push({name, value});
}

export function englishHtml(html, pathname) {
  const document = parse(html);
  const visit = (node, skip = false) => {
    const attrs = Object.fromEntries((node.attrs || []).map(a => [a.name, a.value]));
    const languageChoice = attrs['data-language'];
    const ignored = skip || ['script','style','code','pre'].includes(node.tagName) || Boolean(languageChoice);
    if (node.tagName === 'html') setAttribute(node, 'lang', 'en');
    if (languageChoice) setAttribute(node, 'aria-current', languageChoice === 'en' ? 'page' : 'false');
    if (node.nodeName === '#text' && !ignored && han.test(node.value)) {
      const leading = node.value.match(/^\s*/)[0], trailing = node.value.match(/\s*$/)[0];
      node.value = leading + translate(node.value) + trailing;
    }
    if (node.attrs && !ignored) {
      for (const attr of node.attrs) {
        if (['alt','title','placeholder','aria-label'].includes(attr.name) && han.test(attr.value)) attr.value = translate(attr.value);
        if (attr.name === 'href' && node.tagName === 'a' && attr.value.startsWith('/') && !attr.value.startsWith('//') && !/^\/en(?:\/|\?|#|$)/.test(attr.value)) {
          attr.value = '/en' + attr.value;
        }
      }
    }
    if ('data-language-label' in attrs) {
      node.childNodes = [{nodeName:'#text',value:'English',parentNode:node}];
    }
    for (const child of node.childNodes || []) visit(child, ignored);
  };
  try { visit(document); } catch (error) { throw new Error(`${pathname}: ${error.message}`); }
  return serialize(document);
}

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    if (entry.name === 'en') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

export default function englishPages() {
  return {name:'sylvan-english-pages',hooks:{'astro:build:done':async ({dir,logger}) => {
    const root = fileURLToPath(dir);
    const pending = [];
    for (const file of await htmlFiles(root)) {
      const relative = path.relative(root, file);
      const translated = englishHtml(await readFile(file, 'utf8'), relative);
      pending.push({file:path.join(root, 'en', relative),translated});
    }
    // Validate all translations before writing any English pages.
    for (const item of pending) {
      await mkdir(path.dirname(item.file), {recursive:true});
      await writeFile(item.file, item.translated);
    }
    logger.info(`Generated ${pending.length} complete English pages.`);
  }}};
}
