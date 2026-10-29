/**
 * 素材详情页 Markdown 协商（functions/i/[[id]].js）
 * 逻辑与 functions/c/[[key]].js 共用 functions/_lib/markdown.js
 */
import { onRequest as handle } from '../_lib/markdown.js';

export async function onRequest(context) {
  return handle(context);
}
