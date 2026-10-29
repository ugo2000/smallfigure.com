/* smallfigure · 内容摘要 digest（构建期共享）
 *
 * 用途：og 图缓存 bust —— 文件名 og-<digest>.jpg，内容变了文件名就变，
 * 社交平台与搜索引擎不会一直拿旧图。首页与分类页必须用同一个 digest，
 * 所以算法放在这里，两边共用，避免各算各的。
 *
 * 注意：算进 html 的是**仓库根目录的源 index.html**（未被 SEO 注入改写的那份），
 * 而不是 _site/index.html —— 后者每次构建都会被注入改写，
 * 用它算 digest 会导致「连续跑两次构建 digest 就变了」，og 图文件名对不上。
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export function contentDigest(root) {
  return createHash('sha1')
    .update(readFileSync(path.join(root, 'data', 'images.json')))
    .update(readFileSync(path.join(root, 'data', 'stories.json')))
    .update(readFileSync(path.join(root, 'index.html')))
    .digest('hex')
    .slice(0, 10);
}
