# -*- coding: utf-8 -*-
# 批量改写 build_assets.py：把 5 道现有 food + 6 个 foodjar 的 desc 升级为
# 「老张同款漫画渲染：粗黑墨线 + 平涂赛璐璐 + 网点质感 + 柔和投影」，
# 并在 food-dumpling 后插入 6 道新菜（蛋炒饭/寿司/火锅/烤串/云吞面/麻婆豆腐）。
import io, sys

P = "tools/build_assets.py"
s = io.open(P, encoding="utf-8").read()

repl = {
    # ---- 5 道现有 food ----
    "原创系列：青花纹瓷大碗盛着金黄豚骨汤、溏心蛋、叉烧与葱花，配海苔与升腾热气，细腻美式漫画风，透明 PNG，1024×1024":
    "原创系列（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：青花纹瓷大碗盛着金黄豚骨汤，溏心蛋、叉烧、葱花与海苔，袅袅热气以墨线勾卷，脚下柔和投影，透明 PNG，1024×1024",
    "Original series: a blue-and-white porcelain bowl of golden tonkotsu broth with soft-boiled egg, chashu pork, shredded scallion and nori, steam curling upward, detailed American comic style, transparent PNG, 1024×1024":
    "Original series, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: a blue-and-white porcelain bowl of golden tonkotsu broth with soft-boiled egg, chashu pork, scallion and nori, wisps of steam curling as ink linework, soft ground shadow, transparent PNG, 1024×1024",

    "原创系列：芝麻面包夹厚牛肉饼、融化的芝士、生菜番茄与酸黄瓜，边缘露出番茄酱蛋黄酱，细腻美式漫画风，透明 PNG，1024×1024":
    "原创系列（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：芝麻面包夹厚牛肉饼、融化芝士、生菜番茄与酸黄瓜，边缘番茄酱蛋黄酱溢出，脚下柔和投影，透明 PNG，1024×1024",
    "Original series: a sesame-seeded bun stacked with a thick beef patty, melted cheese, lettuce, tomato and pickles, ketchup and mustard peeking at the edge, detailed American comic style, transparent PNG, 1024×1024":
    "Original series, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: a sesame bun stacked with a thick beef patty, melted cheese, lettuce, tomato and pickles, ketchup and mustard peeking at the edge, soft ground shadow, transparent PNG, 1024×1024",

    "原创系列：厚边焦香饼底、卷边萨拉米、融化拉丝的莫扎里拉与罗勒叶，尖端垂着奶酪丝，细腻美式漫画风，透明 PNG，1024×1024":
    "原创系列（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：厚边焦香饼底、卷边萨拉米、融化拉丝莫扎里拉与罗勒，尖端垂落奶酪丝，脚下柔和投影，透明 PNG，1024×1024",
    "Original series: a thick blistered crust, curled pepperoni, stretchy mozzarella pulling from the tip and basil leaves, detailed American comic style, transparent PNG, 1024×1024":
    "Original series, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: a thick blistered crust, curled pepperoni, stretchy mozzarella pulling from the tip and basil, soft ground shadow, transparent PNG, 1024×1024",

    "原创系列：三层海绵夹粉色草莓奶油、切面淋着草莓酱，顶上一颗带叶草莓，配白瓷盘与薄荷，细腻美式漫画风，透明 PNG，1024×1024":
    "原创系列（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：三层海绵夹粉色草莓奶油，切面淋草莓酱，顶上一颗带叶草莓，白瓷盘配薄荷，脚下柔和投影，透明 PNG，1024×1024",
    "Original series: three sponge layers with pink strawberry cream, sauce dripping down the cut face, a glossy strawberry on top, served on a white plate with mint, detailed American comic style, transparent PNG, 1024×1024":
    "Original series, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: three sponge layers with pink strawberry cream, sauce dripping down the cut face, a glossy strawberry on top on a white plate with mint, soft ground shadow, transparent PNG, 1024×1024",

    "原创系列：竹编圆蒸笼里六只带褶小笼包，缝隙间升起热气，旁边配深色酱油碟与葱花，细腻美式漫画风，透明 PNG，1024×1024":
    "原创系列（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：竹编圆蒸笼里六只带褶小笼包，缝隙升腾热气，旁配深色酱油碟与葱花，脚下柔和投影，透明 PNG，1024×1024",
    "Original series: six pleated soup dumplings in a woven bamboo steamer, steam rising from the gaps, a dark soy sauce dish and chopped scallion beside it, detailed American comic style, transparent PNG, 1024×1024":
    "Original series, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: six pleated soup dumplings in a woven bamboo steamer, steam rising from the gaps, a dark soy dish and scallion beside, soft ground shadow, transparent PNG, 1024×1024",

    # ---- 6 个 foodjar ----
    "奇食瓶罐：玻璃泡星光罐，圆木塞，清液里悬浮几颗发光小星，颈系素牌画小星，侧视全身，重墨描边，透明 PNG，1024×1024":
    "奇食瓶罐（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：玻璃泡星光罐，圆木塞，清液里悬浮发光小星，颈系素牌画小星，脚下柔和投影，透明 PNG，1024×1024",
    "Odd food jar: a glass jar with a cork lid, clear liquid holding glowing stars, a plain tag with a drawn star, side profile, heavy ink outline, transparent PNG, 1024×1024":
    "Odd food jar, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: a glass jar with a cork lid, clear liquid holding glowing stars, a plain tag with a drawn star, soft ground shadow, transparent PNG, 1024×1024",

    "奇食瓶罐：圆陶发酵坛带拱盖与小流口，坛口钻出卷曲绿芽，中段素色带，侧视全身，重墨描边，透明 PNG，1024×1024":
    "奇食瓶罐（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：圆陶发酵坛带拱盖与小流口，坛口钻出卷曲绿芽，中段素色带，脚下柔和投影，透明 PNG，1024×1024",
    "Odd food jar: a round ceramic crock with a domed lid and spout, curly sprouts poking out, plain band, side profile, heavy ink outline, transparent PNG, 1024×1024":
    "Odd food jar, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: a round ceramic crock with a domed lid and spout, curly sprouts poking out, a plain band, soft ground shadow, transparent PNG, 1024×1024",

    "奇食瓶罐：矮玻璃果酱瓶，格纹布盖系绳，瓶内红果酱冒泡上升，素牌画简单果形，侧视全身，重墨描边，透明 PNG，1024×1024":
    "奇食瓶罐（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：矮玻璃果酱瓶，格纹布盖系绳，瓶内红果酱冒泡上升，素牌画简单果形，脚下柔和投影，透明 PNG，1024×1024",
    "Odd food jar: a short jam bottle with a checkered cloth cap, bubbling red jam, plain fruit label, side profile, heavy ink outline, transparent PNG, 1024×1024":
    "Odd food jar, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: a short jam bottle with a checkered cloth cap, bubbling red jam, a plain fruit label, soft ground shadow, transparent PNG, 1024×1024",

    "奇食瓶罐：圆肚铸铁小锅带两只短足与弯柄，锅内煮得小白云翻涌，一缕蒸汽，侧视全身，重墨描边，透明 PNG，1024×1024":
    "奇食瓶罐（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：圆肚铸铁小锅带两只短足与弯柄，锅内煮得小白云翻涌，一缕蒸汽，脚下柔和投影，透明 PNG，1024×1024",
    "Odd food jar: a round cast-iron pot with stubby legs and a handle, tiny clouds boiling inside, wisp of steam, side profile, heavy ink outline, transparent PNG, 1024×1024":
    "Odd food jar, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: a round cast-iron pot with stubby legs and a handle, tiny clouds boiling inside, a wisp of steam, soft ground shadow, transparent PNG, 1024×1024",

    "奇食瓶罐：高瘦窄口玻璃瓶，木塞，瓶内自底向上分层彩虹液，素空白牌，侧视全身，重墨描边，透明 PNG，1024×1024":
    "奇食瓶罐（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：高瘦窄口玻璃瓶，木塞，瓶内自底向上分层彩虹液，素空白牌，脚下柔和投影，透明 PNG，1024×1024",
    "Odd food jar: a tall narrow bottle with a cork, layered rainbow liquid from bottom to top, blank tag, side profile, heavy ink outline, transparent PNG, 1024×1024":
    "Odd food jar, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: a tall narrow bottle with a cork, layered rainbow liquid from bottom to top, a blank tag, soft ground shadow, transparent PNG, 1024×1024",

    "奇食瓶罐：圆陶蜜罐，罐口搁小蜜梳，外壁结霜挂冰晶，蜜巢纹饰带，侧视全身，重墨描边，透明 PNG，1024×1024":
    "奇食瓶罐（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：圆陶蜜罐，罐口搁小蜜梳，外壁结霜挂冰晶，蜜巢纹饰带，脚下柔和投影，透明 PNG，1024×1024",
    "Odd food jar: a rounded ceramic honey pot with a dipper on top, frost and ice crystals outside, honeycomb band, side profile, heavy ink outline, transparent PNG, 1024×1024":
    "Odd food jar, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: a rounded ceramic honey pot with a dipper on top, frost and ice crystals outside, a honeycomb band, soft ground shadow, transparent PNG, 1024×1024",
}

for old, new in repl.items():
    if old not in s:
        print("!! 未匹配:", old[:40]); sys.exit(1)
    s = s.replace(old, new)

# 插入 6 道新菜，锚定 food-dumpling 后的载具机械注释
anchor = "    # ---- 载具机械（飞船 / 飞行器 / 工业机器）----"
new_items = """    {"src": "processed/food_friedrice_t.png", "id": "food-friedrice", "name_zh": "金黄蛋炒饭 · 食物", "name_en": "Golden Egg Fried Rice · Food",
     "cat": "food", "tags": ["原创", "食物", "炒饭", "蛋炒饭", "米饭", "fried rice", "food", "透明"],
     "tags_en": ["original", "food", "fried rice", "egg", "rice", "transparent"],
     "desc_zh": "原创系列（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：粒粒分明金黄炒饭，缀青豆、玉米与胡萝卜丁，白瓷蓝边碗，袅袅热气，脚下柔和投影，透明 PNG，1024×1024",
     "desc_en": "Original series, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: glossy golden fried rice with green peas, corn and carrot cubes in a blue-rimmed white bowl, wisps of steam, soft ground shadow, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/food_sushi_t.png", "id": "food-sushi", "name_zh": "寿司拼盘 · 食物", "name_en": "Sushi Platter · Food",
     "cat": "food", "tags": ["原创", "食物", "寿司", "日料", "刺身", "sushi", "food", "透明"],
     "tags_en": ["original", "food", "sushi", "japanese", "transparent"],
     "desc_zh": "原创系列（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：黑木方盘上三文鱼握寿司、金枪鱼卷与玉子烧，旁点青芥与姜片，脚下柔和投影，透明 PNG，1024×1024",
     "desc_en": "Original series, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: salmon nigiri, tuna rolls and tamago on a black wooden tray with wasabi and pickled ginger, soft ground shadow, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/food_hotpot_t.png", "id": "food-hotpot", "name_zh": "红油火锅 · 食物", "name_en": "Spicy Hot Pot · Food",
     "cat": "food", "tags": ["原创", "食物", "火锅", "麻辣", "铜锅", "hot pot", "food", "透明"],
     "tags_en": ["original", "food", "hot pot", "spicy", "transparent"],
     "desc_zh": "原创系列（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：黄铜九宫格锅煮红油汤底，浮着辣椒与肉片、菇蔬，腾起热气，脚下柔和投影，透明 PNG，1024×1024",
     "desc_en": "Original series, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: a brass nine-grid pot of red chili broth with floating peppers, meat slices and vegetables, rising steam, soft ground shadow, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/food_skewer_t.png", "id": "food-skewer", "name_zh": "孜然烤串 · 食物", "name_en": "Cumin Lamb Skewers · Food",
     "cat": "food", "tags": ["原创", "食物", "烤串", "羊肉串", "烧烤", "skewer", "food", "透明"],
     "tags_en": ["original", "food", "skewer", "lamb", "bbq", "transparent"],
     "desc_zh": "原创系列（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：数根铁签串起焦香羊肉块，撒孜然辣椒，旁配青葱，脚下柔和投影，透明 PNG，1024×1024",
     "desc_en": "Original series, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: several metal skewers of charred lamb cubes dusted with cumin and chili, scallions beside, soft ground shadow, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/food_wonton_t.png", "id": "food-wonton", "name_zh": "鲜虾云吞面 · 食物", "name_en": "Shrimp Wonton Noodles · Food",
     "cat": "food", "tags": ["原创", "食物", "云吞", "面条", "汤面", "wonton", "food", "透明"],
     "tags_en": ["original", "food", "wonton", "noodles", "soup", "transparent"],
     "desc_zh": "原创系列（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：清汤碗里三只虾肉云吞与细面，缀小白菜与葱花，袅袅热气，脚下柔和投影，透明 PNG，1024×1024",
     "desc_en": "Original series, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: three shrimp wontons and thin noodles in clear broth with bok choy and scallion, wisps of steam, soft ground shadow, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/food_mapo_t.png", "id": "food-mapo", "name_zh": "麻婆豆腐 · 食物", "name_en": "Mapo Tofu · Food",
     "cat": "food", "tags": ["原创", "食物", "麻婆豆腐", "川菜", "豆腐", "mapo", "food", "透明"],
     "tags_en": ["original", "food", "mapo tofu", "sichuan", "transparent"],
     "desc_zh": "原创系列（老张同款漫画渲染：粗黑墨线、平涂赛璐璐、网点质感）：白瓷碗盛红亮麻婆豆腐，撒青蒜花椒，旁点肉末，脚下柔和投影，透明 PNG，1024×1024",
     "desc_en": "Original series, Laozhang-style comic rendering with bold ink outlines, flat cel shading and halftone texture: glossy red mapo tofu in a white bowl with scallion and Sichuan peppercorn, minced meat beside, soft ground shadow, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
"""
if anchor not in s:
    print("!! 未找到插入锚点"); sys.exit(1)
s = s.replace(anchor, new_items + anchor, 1)

io.open(P, "w", encoding="utf-8").write(s)
print("build_assets.py 改写完成：替换 %d 处，新增 6 道菜" % len(repl))
