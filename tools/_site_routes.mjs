/* smallfigure · 站点 URL 规则（构建期共享，勿各脚本各写一份）
 *
 * 详情页：/i/<素材 id>/
 * 分类页：/c/<分类 key>/
 * 两套路径都由构建期生成为真实静态文件（_site/i/<id>/index.html、_site/c/<key>/index.html），
 * 因此不需要 Functions 路由，也不会命中软 404。
 */
export const ITEM_PATH = (id) => `/i/${id}/`;
export const CAT_PATH = (key) => `/c/${key}/`;
export const ITEM_DIR = 'i';
export const CAT_DIR = 'c';
