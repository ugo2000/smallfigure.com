/**
 * 分类页 Markdown 协商（functions/c/[[key]].js）
 * 逻辑与 functions/i/[[id]].js 共用 functions/_lib/markdown.js
 */
import { onRequest as handle } from '../_lib/markdown.js';

export async function onRequest(context) {
  return handle(context);
}
