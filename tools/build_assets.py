# -*- coding: utf-8 -*-
"""
smallfigure.com 素材构建脚本
============================
smallfigure 是一个「包罗万象」的原创素材图鉴站，不局限于任何单一项目或游戏题材：
角色立绘、武器装备、徽章、动物……各类素材按同一套标准产出与元数据化。

流程：
1. originals/      —— AI 生成的「原图片」原封不动复制到这里（本地单独文件夹，不上网）
2. assets/img/full/   —— 网站展示用大图（最长边压到 1024，PNG）
3. assets/img/thumbs/ —— 网格缩略图（最长边 400，WebP，带透明通道）
4. assets/img/anim/   —— 入场动画精灵图（22 帧纵向拼接，WebP）
5. data/images.json   —— 全站元数据（中英文名称/简介/分类标签、尺寸、字节数、标签、主色）

可重复跑：幂等，输出覆盖旧文件。用法：
    python tools/build_assets.py
"""
import json
import os
import shutil
import sys
from datetime import datetime, timezone, timedelta

from PIL import Image

SRC = "D:/WB/game-ball1"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_FULL = os.path.join(ROOT, "assets/img/full")
OUT_THUMB = os.path.join(ROOT, "assets/img/thumbs")
OUT_ANIM = os.path.join(ROOT, "assets/img/anim")
OUT_ORIG = os.path.join(ROOT, "originals")
OUT_DATA = os.path.join(ROOT, "data")

THUMB_MAX = 400
FULL_MAX = 1024
BG_RGB = (13, 17, 23)  # 站点暗色底色，用于算主色和合成预览

CAT_LABELS = {
    "characters": {"zh": "人物立绘", "en": "Character Art"},
    "weapons": {"zh": "武器装备", "en": "Weapons & Gear"},
    "animals": {"zh": "动物", "en": "Creatures"},
    "food": {"zh": "食物美食", "en": "Food & Drink"},
    "badges": {"zh": "小徽章", "en": "Badges"},
}

SUBTITLE = {"zh": "原创素材图鉴 · 角色 / 武器装备 / 动物 / 食物 / 徽章",
            "en": "Original Asset Gallery · Character Art / Weapons & Gear / Creatures / Food & Drink / Badges"}

SOURCE = ("原创 AI 生成系列（细腻美式漫画风，含角色立绘 / 武器装备 / 徽章 / 动物 / 食物美食）"
          " + 早期《音弹》游戏美术资产 + 果克星人系列（据张祥前《果克星球奇遇》描述 AI 生成）")

# 每项：源文件, id, 中文名, 英文名, 分类, 标签, 中文简介, 英文简介, 透明, 动画效果
# 透明立绘的来源：processed/ 下的是用 character-art 技能脚本从 AI 原图重抠的干净版
# （游戏里的旧处理版带奶白 veil 箱子，已弃用；原图在 originals/ 有备份）
ITEMS = [
    # ---- 人物立绘 ----
    {"src": "processed/hero_t.png", "id": "hero-t", "name_zh": "老张 · 立绘", "name_en": "Laozhang · Character Art",
     "cat": "characters", "tags": ["老张", "主角", "立绘", "hero", "透明", "小人"],
     "tags_en": ["Laozhang", "protagonist", "character art", "hero", "transparent", "little figure"],
     "desc_zh": "本站看板小人：棕夹克工装男，AI 生成后抠成透明 PNG，512×512",
     "desc_en": "The mascot of this site: a brown-jacket workwear man, AI-generated and cut out to a transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "img/hero.png", "id": "hero", "name_zh": "老张 · 立绘原图", "name_en": "Laozhang · Original Artwork",
     "cat": "characters", "tags": ["老张", "主角", "立绘", "hero", "原图"],
     "tags_en": ["Laozhang", "protagonist", "character art", "hero", "original"],
     "desc_zh": "AI 原始生成图，浅灰底未抠图（原图在 originals/ 有备份）",
     "desc_en": "Original AI-generated image, light gray background, not cut out (backup kept in originals/)",
     "transparent": False, "effect": None},
    {"src": "processed/alien_t.png", "id": "alien-t", "name_zh": "果克星人 · 立绘", "name_en": "Gucck Alien · Character Art",
     "cat": "characters", "tags": ["果克星人", "外星人", "立绘", "alien", "透明", "小人"],
     "tags_en": ["Gucck Alien", "extraterrestrial", "character art", "transparent", "little figure"],
     "desc_zh": "绿色大头外星小人，透明 PNG，512×512",
     "desc_en": "A green big-headed little alien, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "img/alien.png", "id": "alien", "name_zh": "果克星人 · 立绘原图", "name_en": "Gucck Alien · Original Artwork",
     "cat": "characters", "tags": ["果克星人", "外星人", "alien", "原图"],
     "tags_en": ["Gucck Alien", "extraterrestrial", "original"],
     "desc_zh": "AI 原始生成图，未抠图",
     "desc_en": "Original AI-generated image, not cut out",
     "transparent": False, "effect": None},
    {"src": "processed/hero_new.png", "id": "engineer", "name_zh": "女工程师 · 立绘", "name_en": "Lady Engineer · Character Art",
     "cat": "characters", "tags": ["女工程师", "立绘", "engineer", "透明", "小人"],
     "tags_en": ["Lady Engineer", "character art", "engineer", "transparent", "little figure"],
     "desc_zh": "技能验证时生成的漫画风女工程师，透明 PNG，512×512",
     "desc_en": "A comic-style lady engineer generated during skill validation, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    # ---- 果克星人系列（据张祥前《果克星球奇遇》中的描述 AI 生成后抠图）----
    {"src": "processed/gucck_female_t.png", "id": "gucck-female", "name_zh": "女果克星人 · 立绘", "name_en": "Gucck Woman · Character Art",
     "cat": "characters", "tags": ["果克星人", "外星人", "女性", "立绘", "透明", "小人"],
     "tags_en": ["Gucck Woman", "extraterrestrial", "female", "character art", "transparent", "little figure"],
     "desc_zh": "据张祥前描述创作：雪青螺旋发、钻石大眼、粉白发光肌肤，虚拟光膜裙，透明 PNG，512×512",
     "desc_en": "Created from Zhang Xiangqian's account: spiral lilac hair, diamond-bright eyes, pale glowing skin and a virtual light-film dress, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/gucck_male_t.png", "id": "gucck-male", "name_zh": "男果克星人 · 立绘", "name_en": "Gucck Man · Character Art",
     "cat": "characters", "tags": ["果克星人", "外星人", "男性", "立绘", "透明", "小人"],
     "tags_en": ["Gucck Man", "extraterrestrial", "male", "character art", "transparent", "little figure"],
     "desc_zh": "据张祥前描述创作：黑亮贴头皮短发、大薄尖耳、粉白精致肌肤，透明 PNG，512×512",
     "desc_en": "Created from Zhang Xiangqian's account: sleek glossy hair, large thin pointed ears and fine pale skin, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/gucck_neutral_t.png", "id": "gucck-neutral", "name_zh": "中性果克星人 · 立绘", "name_en": "Gucck Neutral · Character Art",
     "cat": "characters", "tags": ["果克星人", "外星人", "中性人", "立绘", "透明", "小人"],
     "tags_en": ["Gucck Neutral", "extraterrestrial", "androgynous", "character art", "transparent", "little figure"],
     "desc_zh": "据张祥前描述创作：长相介于男女之间的中性人，无皱粉白肌肤，透明 PNG，512×512",
     "desc_en": "Created from Zhang Xiangqian's account: an androgynous Gucck neutral with wrinkle-free pale skin, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/gucck_virtual_t.png", "id": "gucck-virtual", "name_zh": "虚拟人 · 立绘", "name_en": "Gucck Virtual · Character Art",
     "cat": "characters", "tags": ["果克星人", "虚拟人", "全息", "立绘", "透明", "小人"],
     "tags_en": ["Gucck Virtual", "hologram", "extraterrestrial", "character art", "transparent", "little figure"],
     "desc_zh": "据张祥前描述创作：人工场生成的虚拟人，只显上半身的全息投影，透明 PNG，512×512",
     "desc_en": "Created from Zhang Xiangqian's account: a field-generated virtual being, a holographic upper-body projection, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/gucck_splitter_t.png", "id": "gucck-splitter", "name_zh": "拆分人 · 立绘", "name_en": "Gucck Splitter · Character Art",
     "cat": "characters", "tags": ["果克星人", "拆分人", "立绘", "透明", "小人"],
     "tags_en": ["Gucck Splitter", "extraterrestrial", "character art", "transparent", "little figure"],
     "desc_zh": "据张祥前描述创作：身体可拆成碧玉蓝条状、又能迅速复原的拆分人，透明 PNG，512×512",
     "desc_en": "Created from Zhang Xiangqian's account: a splitter whose body breaks into jade-blue segments and reassembles, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    # ---- 原创人物系列（细腻美式漫画风，完全原创、不涉及真实人名）----
    {"src": "processed/figure_chef_t.png", "id": "figure-chef", "name_zh": "厨师 · 立绘", "name_en": "The Chef · Character Art",
     "cat": "characters", "tags": ["原创", "厨师", "立绘", "chef", "透明", "小人"],
     "tags_en": ["original", "chef", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：系着围裙的胖厨师，漫画式爆发光晕，细腻美式漫画风，透明 PNG，512×512",
     "desc_en": "Original series: a plump chef in an apron with a comic burst glow, detailed American comic style, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/figure_grandpa_t.png", "id": "figure-grandpa", "name_zh": "老爷爷 · 立绘", "name_en": "The Grandpa · Character Art",
     "cat": "characters", "tags": ["原创", "老爷爷", "立绘", "grandpa", "透明", "小人"],
     "tags_en": ["original", "grandpa", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：白胡子老爷爷，皱纹和衣纹细节扎实，细腻美式漫画风，透明 PNG，512×512",
     "desc_en": "Original series: a white-bearded grandpa with rich wrinkle and fabric detail, detailed American comic style, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/figure_robot_t.png", "id": "figure-robot", "name_zh": "小机器人 · 立绘", "name_en": "The Little Robot · Character Art",
     "cat": "characters", "tags": ["原创", "机器人", "立绘", "robot", "透明", "小人"],
     "tags_en": ["original", "robot", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：捧着小花的大眼小机器人，橙色爆发光晕，细腻美式漫画风，透明 PNG，512×512",
     "desc_en": "Original series: a big-eyed little robot holding a flower with an orange burst glow, detailed American comic style, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/figure_musician_t.png", "id": "figure-musician", "name_zh": "歌者 · 立绘", "name_en": "The Singer · Character Art",
     "cat": "characters", "tags": ["原创", "歌者", "吉他", "立绘", "singer", "透明", "小人"],
     "tags_en": ["original", "singer", "guitar", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：抱着木吉他的绿裙歌者，脚下聚光灯晕，细腻美式漫画风，透明 PNG，512×512",
     "desc_en": "Original series: a green-dress singer with an acoustic guitar under a spotlight glow, detailed American comic style, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/figure_witch_gray_t.png", "id": "figure-witch-gray", "name_zh": "老巫婆 · 立绘", "name_en": "The Old Witch · Character Art",
     "cat": "characters", "tags": ["原创", "女巫", "老巫婆", "立绘", "witch", "透明", "小人"],
     "tags_en": ["original", "witch", "old witch", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：歪戴紫帽、星纹拼布斗篷、提古董灯的老巫婆，细腻美式漫画风，非任何影视角色，透明 PNG，512×512",
     "desc_en": "Original series: an old witch with a tilted purple hat, a star-patterned patchwork cloak and an antique lantern, detailed American comic style, not based on any film/TV character, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/figure_witch_mushroom_t.png", "id": "figure-witch-mushroom", "name_zh": "蘑菇女巫 · 立绘", "name_en": "The Mushroom Witch · Character Art",
     "cat": "characters", "tags": ["原创", "女巫", "蘑菇", "森林", "立绘", "witch", "透明", "小人"],
     "tags_en": ["original", "witch", "mushroom", "forest", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：红伞帽、树叶斗篷、拄琥珀木杖的年轻森林女巫，细腻美式漫画风，非任何影视角色，透明 PNG，512×512",
     "desc_en": "Original series: a young forest witch with a red mushroom cap, a leaf cloak and an amber-topped staff, detailed American comic style, not based on any film/TV character, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/figure_elf_woodland_t.png", "id": "figure-elf-woodland", "name_zh": "森林精灵 · 立绘", "name_en": "The Woodland Elf · Character Art",
     "cat": "characters", "tags": ["原创", "精灵", "森林", "尖耳", "弓", "立绘", "elf", "透明", "小人"],
     "tags_en": ["original", "elf", "woodland", "pointed ears", "bow", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：长尖耳、苔绿兜帽束腰外衣、背后小弓的森林精灵，细腻美式漫画风，非任何影视/文学角色，透明 PNG，512×512",
     "desc_en": "Original series: a woodland elf with long pointed ears, a moss-green hooded tunic and a small back-bow, detailed American comic style, not based on any film/TV or literary character, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/figure_fairy_lattice_t.png", "id": "figure-fairy-lattice", "name_zh": "薄翼仙子 · 立绘", "name_en": "The Gossamer Fairy · Character Art",
     "cat": "characters", "tags": ["原创", "仙子", "精灵", "薄翼", "漂浮", "立绘", "fairy", "透明", "小人"],
     "tags_en": ["original", "fairy", "gossamer wings", "floating", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：薄荷绿短发、原创几何网纹薄翼、茶叶金线小裙、赤脚漂浮的仙子，刻意避开 Tinker Bell 造型，细腻美式漫画风，透明 PNG，512×512",
     "desc_en": "Original series: a fairy with mint-green hair, original geometric-lattice gossamer wings, a teal leaf-and-gold dress and bare floating feet, deliberately not a Tinker Bell likeness, detailed American comic style, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    # ---- 武器装备系列（原创单件实物立绘，全部避开已有角色的随身物件）----
    {"src": "processed/wpn_hammer_t.png", "id": "wpn-hammer", "name_zh": "战锤 · 武器", "name_en": "War Hammer · Weapon",
     "cat": "weapons", "tags": ["原创", "武器", "战锤", "锻造", "weapon", "hammer", "透明", "小图"],
     "tags_en": ["original", "weapon", "war hammer", "forged", "hammer", "transparent", "small"],
     "desc_zh": "原创系列：双叉造型锤头 + 同心圆刻纹面 + 红皮缠柄锻造战锤，细腻美式漫画风单件实物立绘，透明 PNG，512×512",
     "desc_en": "Original series: a forged war hammer with a twin-pronged head, concentric engraved rings and a leather-wrapped haft, detailed American comic style single-item art, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/wpn_pistol_t.png", "id": "wpn-pistol", "name_zh": "蒸汽铆钉手枪 · 武器", "name_en": "Steam Rivet Pistol · Weapon",
     "cat": "weapons", "tags": ["原创", "武器", "手枪", "蒸汽朋克", "weapon", "pistol", "透明", "小图"],
     "tags_en": ["original", "weapon", "pistol", "steampunk", "steam", "transparent", "small"],
     "desc_zh": "原创系列：发蓝钢枪管 + 黄铜铆钉 + 压力表 + 排气管的蒸汽手枪，细腻美式漫画风单件实物立绘，透明 PNG，512×512",
     "desc_en": "Original series: a steam-powered pistol with a blued steel barrel, brass rivets, a pressure gauge and an exhaust pipe, detailed American comic style single-item art, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/wpn_shield_t.png", "id": "wpn-shield", "name_zh": "纹章圆盾 · 装备", "name_en": "Heraldic Shield · Gear",
     "cat": "weapons", "tags": ["原创", "装备", "盾", "防具", "shield", "gear", "透明", "小图"],
     "tags_en": ["original", "gear", "shield", "armor", "defense", "transparent", "small"],
     "desc_zh": "原创系列：铆钉铜边 + 中央盾凸 + 叉形浮雕纹章的圆盾，细腻美式漫画风单件实物立绘，透明 PNG，512×512",
     "desc_en": "Original series: a round heater shield with a riveted brass rim, raised central boss and a forked heraldic crest, detailed American comic style single-item art, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/wpn_flail_t.png", "id": "wpn-flail", "name_zh": "链锤 · 武器", "name_en": "Chain Flail · Weapon",
     "cat": "weapons", "tags": ["原创", "武器", "链锤", "带刺铁球", "weapon", "flail", "透明", "小图"],
     "tags_en": ["original", "weapon", "flail", "chain", "spiked ball", "transparent", "small"],
     "desc_zh": "原创系列：可辨识链节 + 带刺铁球的战链锤，链环空隙完整保留，细腻美式漫画风单件实物立绘，透明 PNG，512×512",
     "desc_en": "Original series: a war flail with clearly readable chain links and a spiked iron ball, chain gaps fully preserved, detailed American comic style single-item art, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/wpn_vial_t.png", "id": "wpn-vial", "name_zh": "琥珀药剂瓶 · 道具", "name_en": "Amber Tonic Vial · Prop",
     "cat": "weapons", "tags": ["原创", "道具", "药剂", "玻璃瓶", "vial", "potion", "透明", "小图"],
     "tags_en": ["original", "prop", "potion", "vial", "glass flask", "transparent", "small"],
     "desc_zh": "原创系列：琥珀色内发光液体 + 红蜡封 + 无字羊皮纸吊牌的圆肚玻璃药瓶，细腻美式漫画风单件实物立绘，透明 PNG，512×512",
     "desc_en": "Original series: a round glass flask with glowing amber liquid, a red wax seal and a blank parchment tag, detailed American comic style single-item art, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/wpn_helmet_t.png", "id": "wpn-helmet", "name_zh": "面甲战斗盔 · 装备", "name_en": "Visor Combat Helmet · Gear",
     "cat": "weapons", "tags": ["原创", "装备", "头盔", "面甲", "科幻", "helmet", "gear", "透明", "小图"],
     "tags_en": ["original", "gear", "helmet", "visor", "sci-fi", "armor", "transparent", "small"],
     "desc_zh": "原创系列：横向青色发光面罩 + 天线小红灯 + 铆钉护颊的复古未来战斗盔，细腻美式漫画风单件实物立绘，透明 PNG，512×512",
     "desc_en": "Original series: a retro-futurist combat helmet with a glowing cyan visor slit, a beaded antenna and riveted cheek plates, detailed American comic style single-item art, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    # ---- 动物系列（题材不限游戏，站点通用素材）----
    {"src": "processed/cr_cat_t.png", "id": "cr-cat", "name_zh": "黑猫 · 立绘", "name_en": "Black Cat · Character Art",
     "cat": "animals", "tags": ["原创", "动物", "猫", "立绘", "cat", "透明", "小人"],
     "tags_en": ["original", "animal", "cat", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：系红围巾、坐姿卷尾的黑色短毛猫，细腻美式漫画风，透明 PNG，512×512",
     "desc_en": "Original series: a sleek black cat with a red scarf, sitting with its tail curled, detailed American comic style, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/cr_raven_t.png", "id": "cr-raven", "name_zh": "渡鸦 · 立绘", "name_en": "Raven · Character Art",
     "cat": "animals", "tags": ["原创", "动物", "渡鸦", "鸟", "立绘", "raven", "transparent", "小人"],
     "tags_en": ["original", "animal", "raven", "bird", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：羽色带蓝紫虹彩、歪头审视的渡鸦，腿间缝隙已抠净，细腻美式漫画风，透明 PNG，512×512",
     "desc_en": "Original series: a glossy raven with blue-violet iridescent plumage and a inquisitive tilted head, gap between the legs fully cleared, detailed American comic style, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/cr_otter_t.png", "id": "cr-otter", "name_zh": "水獭 · 立绘", "name_en": "Otter · Character Art",
     "cat": "animals", "tags": ["原创", "动物", "水獭", "立绘", "otter", "透明", "小人"],
     "tags_en": ["original", "animal", "otter", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：怀抱河石、浓密棕毛配浅色腹毛的水獭，细腻美式漫画风，透明 PNG，512×512",
     "desc_en": "Original series: a plump otter hugging a smooth river stone, dense brown fur with a cream throat, detailed American comic style, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    # ---- 食物美食 ----
    {"src": "processed/food_ramen_t.png", "id": "food-ramen", "name_zh": "豚骨拉面 · 食物", "name_en": "Tonkotsu Ramen · Food",
     "cat": "food", "tags": ["原创", "食物", "拉面", "面食", "日式", "ramen", "food", "透明"],
     "tags_en": ["original", "food", "ramen", "noodles", "japanese", "transparent"],
     "desc_zh": "原创系列：青花纹瓷大碗盛着金黄豚骨汤、溏心蛋、叉烧与葱花，配海苔与升腾热气，细腻美式漫画风，透明 PNG，1024×1024",
     "desc_en": "Original series: a blue-and-white porcelain bowl of golden tonkotsu broth with soft-boiled egg, chashu pork, shredded scallion and nori, steam curling upward, detailed American comic style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/food_burger_t.png", "id": "food-burger", "name_zh": "芝士汉堡 · 食物", "name_en": "Cheeseburger · Food",
     "cat": "food", "tags": ["原创", "食物", "汉堡", "快餐", "burger", "food", "透明"],
     "tags_en": ["original", "food", "burger", "fast food", "transparent"],
     "desc_zh": "原创系列：芝麻面包夹厚牛肉饼、融化的芝士、生菜番茄与酸黄瓜，边缘露出番茄酱蛋黄酱，细腻美式漫画风，透明 PNG，1024×1024",
     "desc_en": "Original series: a sesame-seeded bun stacked with a thick beef patty, melted cheese, lettuce, tomato and pickles, ketchup and mustard peeking at the edge, detailed American comic style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/food_pizza_t.png", "id": "food-pizza", "name_zh": "萨拉米披萨角 · 食物", "name_en": "Pepperoni Pizza Slice · Food",
     "cat": "food", "tags": ["原创", "食物", "披萨", "奶酪", "pizza", "food", "透明"],
     "tags_en": ["original", "food", "pizza", "cheese", "transparent"],
     "desc_zh": "原创系列：厚边焦香饼底、卷边萨拉米、融化拉丝的莫扎里拉与罗勒叶，尖端垂着奶酪丝，细腻美式漫画风，透明 PNG，1024×1024",
     "desc_en": "Original series: a thick blistered crust, curled pepperoni, stretchy mozzarella pulling from the tip and basil leaves, detailed American comic style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/food_cake_t.png", "id": "food-cake", "name_zh": "草莓奶油蛋糕 · 食物", "name_en": "Strawberry Cream Cake · Food",
     "cat": "food", "tags": ["原创", "食物", "蛋糕", "草莓", "甜点", "cake", "food", "透明"],
     "tags_en": ["original", "food", "cake", "strawberry", "dessert", "transparent"],
     "desc_zh": "原创系列：三层海绵夹粉色草莓奶油、切面淋着草莓酱，顶上一颗带叶草莓，配白瓷盘与薄荷，细腻美式漫画风，透明 PNG，1024×1024",
     "desc_en": "Original series: three sponge layers with pink strawberry cream, sauce dripping down the cut face, a glossy strawberry on top, served on a white plate with mint, detailed American comic style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/food_dumpling_t.png", "id": "food-dumpling", "name_zh": "小笼蒸笼 · 食物", "name_en": "Soup Dumplings · Food",
     "cat": "food", "tags": ["原创", "食物", "小笼包", "蒸笼", "中式", "dumpling", "food", "透明"],
     "tags_en": ["original", "food", "dumpling", "steamer", "chinese", "transparent"],
     "desc_zh": "原创系列：竹编圆蒸笼里六只带褶小笼包，缝隙间升起热气，旁边配深色酱油碟与葱花，细腻美式漫画风，透明 PNG，1024×1024",
     "desc_en": "Original series: six pleated soup dumplings in a woven bamboo steamer, steam rising from the gaps, a dark soy sauce dish and chopped scallion beside it, detailed American comic style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 小徽章 ----
    {"src": "img/zone_bass.png", "id": "zone-bass", "name_zh": "徽章 · 低音核", "name_en": "Badge · Bass Core",
     "cat": "badges", "tags": ["徽章", "低音核", "bass", "透明", "小图"],
     "tags_en": ["badge", "bass core", "bass", "transparent", "small"],
     "desc_zh": "霓虹线稿小徽章，喇叭形低音盆造型，透明 PNG，384×384",
     "desc_en": "Neon line-art badge shaped like a horn speaker cone, transparent PNG, 384×384",
     "transparent": True, "effect": None},
    {"src": "img/zone_bell.png", "id": "zone-bell", "name_zh": "徽章 · 晶铃", "name_en": "Badge · Crystal Bell",
     "cat": "badges", "tags": ["徽章", "晶铃", "bell", "透明", "小图"],
     "tags_en": ["badge", "crystal bell", "bell", "transparent", "small"],
     "desc_zh": "霓虹线稿小徽章，悬挂式水晶铃铛造型，透明 PNG，384×384",
     "desc_en": "Neon line-art badge shaped like a hanging crystal bell, transparent PNG, 384×384",
     "transparent": True, "effect": None},
    {"src": "img/zone_lead.png", "id": "zone-lead", "name_zh": "徽章 · 等离子", "name_en": "Badge · Plasma",
     "cat": "badges", "tags": ["徽章", "等离子", "lead", "透明", "小图"],
     "tags_en": ["badge", "plasma", "lead", "transparent", "small"],
     "desc_zh": "霓虹线稿小徽章，等离子球与环形电弧造型，透明 PNG，384×384",
     "desc_en": "Neon line-art badge shaped like a plasma orb with an electric arc ring, transparent PNG, 384×384",
     "transparent": True, "effect": None},
]

# 原图片（AI 生成）→ originals/ 单独存放，网站不直接用这些文件
ORIGINALS = [
    ("img/hero.png", "hero_原始图.png"),
    ("img/cover.png", "cover_原始图.png"),
    ("img/alien.png", "alien_原始图.png"),
    ("img/raw/Neon_line_art_emblem_of_a_face_2026-10-22T00-48-41.png", "raw/徽章_低音核_原始提示词名.png"),
    ("img/raw/Neon_line_art_emblem_of_a_heav_2026-10-22T00-44-25.png", "raw/徽章_晶铃_原始提示词名.png"),
    ("img/raw/Neon_line_art_emblem_of_a_plas_2026-10-22T00-58-59.png", "raw/徽章_等离子_原始提示词名.png"),
    ("img/raw/Vintage_American_comic_book_po_2026-10-22T03-39-02.png", "raw/漫画背景_原始提示词名.png"),
    ("img/raw/skilltest/Full_body_character_illustrati_2026-10-22T10-01-06.png", "raw/skilltest_女工程师_原始图.png"),
]


def resolve_src(src_rel):
    """processed/ 开头 → 站点自己的重抠版（character-art 技能脚本产出）；其余 → game-ball1"""
    if src_rel.startswith("processed/"):
        return os.path.join(ROOT, src_rel)
    return os.path.join(SRC, src_rel)


def resize_max(im, mx):
    w, h = im.size
    m = max(w, h)
    if m <= mx:
        return im
    s = mx / m
    return im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)


def file_ver(path):
    """文件内容哈希前 8 位：图片内容变了 URL 就变，CDN/浏览器缓存自动失效"""
    import hashlib
    with open(path, 'rb') as f:
        return hashlib.sha1(f.read()).hexdigest()[:8]


def dominant_color(im):
    """合成到暗色底后取平均色，返回 #rrggbb"""
    rgba = im.convert("RGBA")
    bg = Image.new("RGBA", rgba.size, BG_RGB + (255,))
    flat = Image.alpha_composite(bg, rgba).convert("RGB")
    small = flat.resize((1, 1), Image.LANCZOS)
    r, g, b = small.getpixel((0, 0))
    return "#%02x%02x%02x" % (r, g, b)


def main():
    for d in (OUT_FULL, OUT_THUMB, OUT_ANIM, OUT_ORIG, OUT_DATA):
        os.makedirs(d, exist_ok=True)

    # 清掉上一轮的产物，保证目录里只剩当前清单内的文件（站点不放的图不会被残留发布）
    for d in (OUT_FULL, OUT_THUMB, OUT_ANIM):
        for fn in os.listdir(d):
            fp = os.path.join(d, fn)
            if os.path.isfile(fp):
                os.remove(fp)

    # ---------- 1. 原图片进 originals/ ----------
    print("== 复制原图片到 originals/ ==")
    for src_rel, dst_name in ORIGINALS:
        src = os.path.join(SRC, src_rel)
        dst = os.path.join(OUT_ORIG, dst_name)
        if not os.path.exists(src):
            print("  [跳过] 不存在:", src_rel)
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print("  %s -> originals/%s (%d KB)" % (src_rel, dst_name, os.path.getsize(dst) // 1024))

    # ---------- 2. 单图处理 ----------
    print("== 处理网站图片 ==")
    images = []
    for it in ITEMS:
        src_rel, iid = it["src"], it["id"]
        cat, tags = it["cat"], it["tags"]
        src = resolve_src(src_rel)
        if not os.path.exists(src):
            print("  [缺失]", src_rel)
            sys.exit(1)
        im = Image.open(src)
        w, h = im.size

        full = resize_max(im.convert("RGBA" if it["transparent"] else "RGB"), FULL_MAX)
        full_path = os.path.join(OUT_FULL, os.path.splitext(os.path.basename(src_rel))[0] + ".png")
        full.save(full_path, optimize=True)

        thumb = resize_max(im, THUMB_MAX)
        thumb_name = os.path.splitext(os.path.basename(src_rel))[0] + ".webp"
        thumb_path = os.path.join(OUT_THUMB, thumb_name)
        thumb.convert("RGBA").save(thumb_path, "WEBP", quality=82, method=6)

        color = dominant_color(im)
        images.append({
            "id": iid,
            "name": it["name_zh"],
            "nameEn": it["name_en"],
            "category": cat,
            "categoryLabel": CAT_LABELS[cat]["zh"],
            "categoryLabelEn": CAT_LABELS[cat]["en"],
            "file": "assets/img/full/" + os.path.basename(full_path),
            "thumb": "assets/img/thumbs/" + thumb_name,
            "width": full.size[0],
            "height": full.size[1],
            "srcWidth": w,
            "srcHeight": h,
            "bytes": os.path.getsize(full_path),
            "ver": file_ver(full_path),
            "transparent": it["transparent"],
            "animated": it["effect"] is not None,
            "effect": it["effect"],
            "color": color,
            "tags": tags,
            "tagsEn": it["tags_en"],
            "desc": it["desc_zh"],
            "descEn": it["desc_en"],
        })
        print("  %-28s %4dx%-4d full=%3dKB thumb=%3dKB %s" % (
            os.path.basename(src_rel), full.size[0], full.size[1],
            os.path.getsize(full_path) // 1024, os.path.getsize(thumb_path) // 1024, color))

    # ---------- 3. 元数据 ----------
    meta = {
        "site": "smallfigure.com",
        "subtitle": SUBTITLE["zh"],
        "subtitleEn": SUBTITLE["en"],
        "generated": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
        "source": SOURCE,
        "count": len(images),
        "categories": [{"key": k, "label": v["zh"], "labelEn": v["en"]} for k, v in CAT_LABELS.items()],
        "images": images,
    }
    data_path = os.path.join(OUT_DATA, "images.json")
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    total = sum(i["bytes"] for i in images)
    print("== 完成: %d 项, JSON %dKB, 大图合计 %.1fMB ==" % (
        len(images), os.path.getsize(data_path) // 1024, total / 1048576))


if __name__ == "__main__":
    main()
