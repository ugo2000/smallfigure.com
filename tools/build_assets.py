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
import re
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
    "ammo": {"zh": "弹药军械", "en": "Ammunition & Ordnance"},
    "animals": {"zh": "动物", "en": "Creatures"},
    "food": {"zh": "食物美食", "en": "Food & Drink"},
    "vehicles": {"zh": "载具机械", "en": "Vehicles & Machines"},
    "aliens": {"zh": "异星生物", "en": "Alien Creatures"},
    "flora": {"zh": "异星植物", "en": "Alien Flora"},
    "stoneage": {"zh": "石器原始", "en": "Stone Age & Primitives"},
    "potions": {"zh": "奇色液体", "en": "Colored Potions"},
    "books": {"zh": "魔法书籍", "en": "Arcane Books"},
    "implements": {"zh": "魔法法器", "en": "Arcane Implements"},
    "castles": {"zh": "城堡建筑", "en": "Castles"},
    "furniture": {"zh": "古旧家具", "en": "Old Furniture"},
    "techdev": {"zh": "奇械科技", "en": "Odd Devices"},
    "xenohorror": {"zh": "异星猎食", "en": "Alien Predation"},
    "badges": {"zh": "小徽章", "en": "Badges"},
}

SUBTITLE = {"zh": "原创素材图鉴 · 角色 / 武器装备 / 弹药 / 动物 / 食物 / 载具 / 异星生物 / 异星植物 / 石器原始 / 奇色液体 / 魔法书籍 / 魔法法器 / 城堡建筑 / 古旧家具 / 奇械科技 / 异星猎食 / 徽章",
            "en": "Original Asset Gallery · Character Art / Weapons & Gear / Ammunition / Creatures / Food & Drink / Vehicles & Machines / Alien Creatures / Alien Flora / Stone Age & Primitives / Colored Potions / Arcane Books / Arcane Implements / Castles / Old Furniture / Odd Devices / Alien Predation / Badges"}

SOURCE = ("原创 AI 生成系列（细腻美式漫画风，含角色立绘 / 武器装备 / 弹药军械 / 徽章 / 动物 / 食物美食 / 载具机械 / "
          "异星生物 / 异星植物 / 石器原始 / 奇色液体 / 魔法书籍 / 魔法法器 / 城堡建筑 / 古旧家具 / 奇械科技 / "
          "异星猎食）"
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
     "desc_zh": "AI 原始生成图，浅灰底未抠图（原图在本地备份目录中有留存）",
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
     "desc_zh": "原创系列：薄荷绿短发、原创几何网纹薄翼、茶叶金线小裙、赤脚漂浮的仙子，刻意避开既有童话仙子的经典造型，细腻美式漫画风，透明 PNG，512×512",
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
    # ---- 弹药军械（复古 + 未来各一组）----
    {"src": "processed/ammo_shell_t.png", "id": "ammo-shell", "name_zh": "黄铜弹壳 · 弹药", "name_en": "Brass Cartridge Case · Ammunition",
     "cat": "ammo", "tags": ["原创", "弹药", "弹壳", "黄铜", "复古", "ammunition", "shell", "透明"],
     "tags_en": ["original", "ammunition", "cartridge", "brass", "vintage", "transparent"],
     "desc_zh": "原创系列：立放的黄铜弹壳，顶部压痕环与底火空洞清晰，表面带磨损铜锈，1940 年代复古海报画风，透明 PNG，1024×1024",
     "desc_en": "Original series: an upright brass cartridge case with crimp rings and a hollow primer, scratched and tarnished brass, 1940s retro poster style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/ammo_shotgun_t.png", "id": "ammo-shotgun", "name_zh": "红色霰弹 · 弹药", "name_en": "Red Shotgun Shell · Ammunition",
     "cat": "ammo", "tags": ["原创", "弹药", "霰弹", "红壳", "猎枪", "shotgun", "ammunition", "透明"],
     "tags_en": ["original", "ammunition", "shotgun", "red hull", "hunting", "transparent"],
     "desc_zh": "原创系列：深红纸壳霰弹，顶部黄铜底帽与卷边压痕分明，纸壳带细微磨损，复古狩猎海报画风，透明 PNG，1024×1024",
     "desc_en": "Original series: a deep crimson paper shotgun shell with a brass head cap and visible crimp, slightly worn matte paper, retro hunting poster style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/ammo_shell_cannon_t.png", "id": "ammo-cannonball", "name_zh": "铸铁炮弹 · 弹药", "name_en": "Cast Iron Cannonball · Ordnance",
     "cat": "ammo", "tags": ["原创", "军械", "炮弹", "铸铁", "锈迹", "cannonball", "ordnance", "透明"],
     "tags_en": ["original", "ordnance", "cannonball", "cast iron", "rusty", "transparent"],
     "desc_zh": "原创系列：赤道带凸起箍的铸铁炮弹，表面麻点锈蚀与剥落露铁斑，顶部一道宽高光，复古战争海报画风，透明 PNG，1024×1024",
     "desc_en": "Original series: a heavy cast-iron cannonball with a raised driving band, pitted rust and a chipped patch of bare metal, broad highlight across the top, retro war poster style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/ammo_energy_t.png", "id": "ammo-energy", "name_zh": "能量弹药 · 未来", "name_en": "Energy Cell Cartridge · Sci-Fi",
     "cat": "ammo", "tags": ["原创", "弹药", "能量", "未来", "科幻", "发光", "energy", "future", "透明"],
     "tags_en": ["original", "ammunition", "energy cell", "future", "sci-fi", "glowing", "transparent"],
     "desc_zh": "原创系列：锥形深灰金属能量弹，抛光铬环中段玻璃罩内透出青色辉光核心，边缘琥珀指示条与微光，1950 年代原子时代科幻海报风，透明 PNG，1024×1024",
     "desc_en": "Original series: a tapered gunmetal energy cell with a glowing cyan core visible through a glass band, chrome collar, amber indicator strips, 1950s atomic-age sci-fi poster style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 动物系列（题材不限游戏，站点通用素材）----
    {"src": "processed/cr_cat_t.png", "id": "cr-cat", "name_zh": "黑猫 · 立绘", "name_en": "Black Cat · Character Art",
     "cat": "animals", "tags": ["原创", "动物", "猫", "立绘", "cat", "透明", "小人"],
     "tags_en": ["original", "animal", "cat", "character art", "transparent", "little figure"],
     "desc_zh": "原创系列：系红围巾、坐姿卷尾的黑色短毛猫，细腻美式漫画风，透明 PNG，512×512",
     "desc_en": "Original series: a sleek black cat with a red scarf, sitting with its tail curled, detailed American comic style, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/cr_raven_t.png", "id": "cr-raven", "name_zh": "渡鸦 · 立绘", "name_en": "Raven · Character Art",
     "cat": "animals", "tags": ["原创", "动物", "渡鸦", "鸟", "立绘", "raven", "透明", "小人"],
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
    # ---- 异域农人（年轻男女 × 手持农具）----
    {"src": "processed/figure_farmer_male_sickle_t.png", "id": "figure-farmer-sickle",
     "name_zh": "持镰刀的青年 · 立绘", "name_en": "Youth with Sickle · Character Art",
     "cat": "characters", "tags": ["原创", "人物", "立绘", "农人", "镰刀", "东南亚", "异域", "farmer", "sickle", "透明", "小人"],
     "tags_en": ["original", "character art", "farmer", "sickle", "southeast asian", "transparent", "little figure"],
     "desc_zh": "原创系列：东南亚高地农社的年轻男子，靛蓝手织短衫配编织腰封，赤足扛竹柄弯镰，细腻美式漫画风全身立绘，透明 PNG，1024×1024",
     "desc_en": "Original series: a young man from a Southeast Asian highland farming community in a loose indigo hand-woven tunic, barefoot, a bamboo-handled sickle resting on his shoulder, detailed American comic style full-body art, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/figure_farmer_female_hoe_t.png", "id": "figure-farmer-hoe",
     "name_zh": "持锄的青年女子 · 立绘", "name_en": "Woman with Hoe · Character Art",
     "cat": "characters", "tags": ["原创", "人物", "立绘", "农人", "锄头", "东非", "异域", "farmer", "hoe", "透明", "小人"],
     "tags_en": ["original", "character art", "farmer", "hoe", "east african", "transparent", "little figure"],
     "desc_zh": "原创系列：东非牧社的年轻女子，铁红围裙长裙配米色披肩与串珠饰品，双手扶一把长柄铁锄，赤足戴脚环，细腻美式漫画风全身立绘，透明 PNG，1024×1024",
     "desc_en": "Original series: a young woman from an East African pastoral community in a rust-red wrap skirt and cream shawl, holding a long-handled iron hoe, barefoot with anklets, detailed American comic style full-body art, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/figure_farmer_male_pitchfork_t.png", "id": "figure-farmer-pitchfork",
     "name_zh": "持干草叉的农工 · 立绘", "name_en": "Farmer with Hay Fork · Character Art",
     "cat": "characters", "tags": ["原创", "人物", "立绘", "农人", "干草叉", "麦束", "中亚", "farmer", "pitchfork", "透明", "小人"],
     "tags_en": ["original", "character art", "farmer", "pitchfork", "wheat", "central asian", "transparent", "little figure"],
     "desc_zh": "原创系列：中亚草原村落的农工，褪色橄榄绿帆布工装外套配皮质腰带与旧皮靴，一手扶四齿干草叉，一手抱一捆收割麦子，细腻美式漫画风全身立绘，透明 PNG，1024×1024",
     "desc_en": "Original series: a farmer from a Central Asian steppe village in a faded olive canvas work coat, holding a four-tine hay fork and a bundle of cut wheat, detailed American comic style full-body art, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/figure_farmer_female_pole_t.png", "id": "figure-farmer-pole",
     "name_zh": "扛竹竿的采收女 · 立绘", "name_en": "Woman with Bamboo Pole · Character Art",
     "cat": "characters", "tags": ["原创", "人物", "立绘", "农人", "竹竿", "谷穗", "南美", "farmer", "bamboo", "透明", "小人"],
     "tags_en": ["original", "character art", "farmer", "bamboo pole", "grain", "south american", "transparent", "little figure"],
     "desc_zh": "原创系列：南美高原农村的年轻女子，芥末黄长裙配条纹织带与灰绿披肩，绿色织带头环束起长辫，背小竹篓手扶长竹竿顶端扎着谷穗，细腻美式漫画风全身立绘，透明 PNG，1024×1024",
     "desc_en": "Original series: a young woman from a South American highland village in a mustard-yellow skirt and grey-green poncho, braided hair with a woven headband, a bamboo pole with harvested grain, detailed American comic style full-body art, transparent PNG, 1024×1024",
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
    # ---- 载具机械（飞船 / 飞行器 / 工业机器）----
    {"src": "processed/veh_spaceship_t.png", "id": "veh-spaceship", "name_zh": "复古火箭飞船 · 载具", "name_en": "Retro Rocket Ship · Vehicle",
     "cat": "vehicles", "tags": ["原创", "载具", "飞船", "火箭", "复古未来", "spaceship", "rocket", "透明"],
     "tags_en": ["original", "vehicle", "spaceship", "rocket", "retro future", "transparent"],
     "desc_zh": "原创系列：镀铬子弹形舰体配铆钉蒙皮与后掠双翼，中段一排青色发光舷窗，红色尾翼喷出橙黄尾焰，1960 年代通俗科幻海报风，透明 PNG，1024×1024",
     "desc_en": "Original series: a chrome bullet-shaped hull with riveted panels and swept fins, a row of glowing cyan portholes, a red tail fin with an orange flame, 1960s pulp space poster style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/veh_propeller_t.png", "id": "veh-propeller", "name_zh": "螺旋桨轻型飞机 · 载具", "name_en": "Propeller Light Aircraft · Vehicle",
     "cat": "vehicles", "tags": ["原创", "载具", "飞机", "螺旋桨", "飞行器", "aviation", "propeller", "透明"],
     "tags_en": ["original", "vehicle", "aircraft", "propeller", "aviation", "transparent"],
     "desc_zh": "原创系列：奶白与深红圆机身单发轻型机，前方螺旋桨画成半透明旋转盘，玻璃座舱罩与带翼肋高翼，固定起落架配粗橡胶轮，怀旧航空海报风，透明 PNG，1024×1024",
     "desc_en": "Original series: a cream and crimson single-engine light aircraft, spinning propeller drawn as a translucent disc, a glazed cockpit bubble, a ribbed high wing and fixed landing gear, golden age aviation poster style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/veh_robot_t.png", "id": "veh-robot", "name_zh": "工业机械臂 · 机械", "name_en": "Industrial Robot Arm · Machine",
     "cat": "vehicles", "tags": ["原创", "机械", "工业", "机械臂", "液压", "机器人", "robot", "industrial", "透明"],
     "tags_en": ["original", "machine", "industrial", "robot arm", "hydraulic", "transparent"],
     "desc_zh": "原创系列：铆钉青灰工业机械臂，粗壮肩关节带液压杆与波纹线管，腕部黄黑警示条，末端三指夹爪微张，肩头琥珀指示灯亮起，中世纪工业海报风，透明 PNG，1024×1024",
     "desc_en": "Original series: a riveted teal-grey industrial robot arm, hydraulic pistons and ribbed cable conduits, a yellow-black warning band on the wrist, a three-fingered gripper and an amber indicator lamp, mid-century industrial poster style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/veh_engine_t.png", "id": "veh-engine", "name_zh": "蒸汽工业主机 · 机械", "name_en": "Steam Boiler Engine · Machine",
     "cat": "vehicles", "tags": ["原创", "机械", "工业", "蒸汽机", "锅炉", "飞轮", "engine", "steam", "透明"],
     "tags_en": ["original", "machine", "industrial", "steam engine", "boiler", "flywheel", "transparent"],
     "desc_zh": "原创系列：横置铸铁锅炉主机，密排铆钉与加强箍带，侧面大飞轮与三组活塞连杆，顶部黄铜阀组带手轮，一端烟囱冒出淡烟，蒸汽朋克工业海报风，透明 PNG，1024×1024",
     "desc_en": "Original series: a horizontal cast-iron boiler engine with banding straps, a large spoked flywheel, three pistons with connecting rods, a brass valve manifold and a smokestack trailing pale steam, steampunk industrial poster style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 异星生物（非地球生物 / 怪兽）----
    {"src": "processed/aliens_crystal_crawler_t.png", "id": "aliens-crystal-crawler", "name_zh": "水晶甲壳爬行者 · 异星生物", "name_en": "Crystal Carapace Crawler · Alien",
     "cat": "aliens", "tags": ["原创", "异星生物", "怪兽", "水晶", "爬行", "外星", "crystal", "monster", "透明"],
     "tags_en": ["original", "alien", "monster", "crystal", "crawler", "transparent"],
     "desc_zh": "原创系列：覆满半透明水晶甲片的四足爬行兽，背脊竖起一排尖刺，节肢末端泛着青绿荧光，粗壮尾巴拖地，异星生物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a four-legged crawler sheathed in translucent crystal plates, a ridge of sharp spikes along its back, green bioluminescence glowing at the limb joints, a heavy tail dragging behind, alien bestiary art style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/aliens_jelly_t.png", "id": "aliens-jelly", "name_zh": "深海幻水母 · 异星生物", "name_en": "Deep Sea Dream Jellyfish · Alien",
     "cat": "aliens", "tags": ["原创", "异星生物", "水母", "漂浮", "触须", "深海", "jellyfish", "透明"],
     "tags_en": ["original", "alien", "jellyfish", "floating", "tentacles", "transparent"],
     "desc_zh": "原创系列：半透明粉紫伞盖水母悬于水中，伞下伸出十余条细长触须末端各缀一枚金色小球，边缘晕开淡紫光晕，深海生物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a translucent pink-violet jellyfish suspended in water, a dozen slender tentacles trailing beneath with a small golden bead at each tip, a soft purple halo along the rim, deep sea creature study style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/aliens_six_eye_t.png", "id": "aliens-six-eye", "name_zh": "六眼拾荒者 · 异星生物", "name_en": "Six-Eyed Scavenger · Alien",
     "cat": "aliens", "tags": ["原创", "异星生物", "六眼", "拾荒者", "外星种族", "six eye", "alien", "透明"],
     "tags_en": ["original", "alien", "six eye", "scavenger", "transparent"],
     "desc_zh": "原创系列：枯瘦佝偻的外星拾荒者，浑身缠着破布条与捡来的金属碎片，颈后伸出六只大小不一的苍白眼球，关节处透出微弱蓝光，异星种族设定风，透明 PNG，1024×1024",
     "desc_en": "Original series: a gaunt, hunched alien scavenger wrapped in torn cloth strips and salvaged metal shards, six pale eyes of varying sizes sprouting from the back of the neck, faint blue light glowing at the joints, alien species design style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/aliens_deep_space_hunter_t.png", "id": "aliens-deep-space-hunter", "name_zh": "深空猎手 · 异星生物", "name_en": "Deep Space Hunter · Alien",
     "cat": "aliens", "tags": ["原创", "异星生物", "机甲", "深空", "猎手", "外星", "hunter", "mecha", "透明"],
     "tags_en": ["original", "alien", "mecha", "deep space", "hunter", "transparent"],
     "desc_zh": "原创系列：暗红甲壳外星猎手，肩背展开镰刀状骨刃，胸口嵌一颗发绿光的六棱核心，节肢末端锋利如钩，赛博朋克异星机械风，透明 PNG，1024×1024",
     "desc_en": "Original series: a dark crimson armoured alien hunter with scythe-like blades fanning from its back, a hexagonal core glowing green in the chest, hooked and razor-sharp limbs, cyberpunk alien mecha style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 异星植物（非地球植物）----
    {"src": "processed/flora_spiral_vine_t.png", "id": "flora-spiral-vine", "name_zh": "螺旋星藤 · 异星植物", "name_en": "Spiral Star Vine · Alien Flora",
     "cat": "flora", "tags": ["原创", "异星植物", "藤蔓", "螺旋", "星形花", "vine", "spiral", "透明"],
     "tags_en": ["original", "alien flora", "vine", "spiral", "star bloom", "transparent"],
     "desc_zh": "原创系列：深绿螺旋藤蔓盘旋而上，沿途开出五瓣猩红星形花，花心镶金黄蕊丝，藤身带细密绒毛与淡绿光点，异星植物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a deep green vine coiling upward, five-petalled crimson star blooms opening along its length with golden stamens at the centre, fine fuzz and pale green light dots along the stem, alien botanical study style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/flora_crystal_fungus_t.png", "id": "flora-crystal-fungus", "name_zh": "水晶灵菇 · 异星植物", "name_en": "Crystal Spirit Fungus · Alien Flora",
     "cat": "flora", "tags": ["原创", "异星植物", "蘑菇", "水晶", "发光", "菌类", "fungus", "crystal", "透明"],
     "tags_en": ["original", "alien flora", "mushroom", "crystal", "glowing", "transparent"],
     "desc_zh": "原创系列：三层冰蓝半透菌盖层层叠生，边缘垂下晶莹露珠，菌褶间透出柔和青光，下方菌柄细长缠绕根系，异星菌类图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: three tiers of translucent ice-blue mushroom caps stacked together, crystal droplets hanging from the rims, soft cyan light glowing through the gills, a slender stalk wrapped in root filaments, alien mycology study style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/flora_floating_pod_t.png", "id": "flora-floating-pod", "name_zh": "浮空种荚 · 异星植物", "name_en": "Floating Seed Pod · Alien Flora",
     "cat": "flora", "tags": ["原创", "异星植物", "种荚", "漂浮", "金色", "触须", "seed pod", "floating", "透明"],
     "tags_en": ["original", "alien flora", "seed pod", "floating", "golden", "transparent"],
     "desc_zh": "原创系列：金色球形种荚悬浮半空，外壳分片镶满发光籽粒，下方垂出数条卷曲藤须，整体泛着温润金光，异星植物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a golden spherical seed pod suspended in mid-air, its segmented shell studded with glowing seeds, several curling tendrils dangling beneath, radiating a warm golden light, alien botanical study style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/flora_iron_tree_t.png", "id": "flora-iron-tree", "name_zh": "铁骨圣树 · 异星植物", "name_en": "Ironwood Sacred Tree · Alien Flora",
     "cat": "flora", "tags": ["原创", "异星植物", "树木", "铁骨", "扇形叶", "发光核", "tree", "ironwood", "透明"],
     "tags_en": ["original", "alien flora", "tree", "ironwood", "fan leaves", "transparent"],
     "desc_zh": "原创系列：虬结的铁骨圣树，深色铁木质树干，扇形青绿叶片对称展开如冠，枝桠间托着一枚发光橙色种核，异星森林插画风，透明 PNG，1024×1024",
     "desc_en": "Original series: a gnarled alien tree with a dark ironwood trunk, symmetric teal fan-shaped leaves spreading like a crown, a glowing orange seed core cradled in the branches, alien forest illustration style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 石器原始（石器工具 / 原始人）----
    {"src": "processed/stone_flint_axe_t.png", "id": "stone-flint-axe", "name_zh": "燧石战斧 · 石器", "name_en": "Flint Battle Axe · Stone Age",
     "cat": "stoneage", "tags": ["原创", "石器", "燧石", "战斧", "原始", "原始人", "flint", "axe", "透明"],
     "tags_en": ["original", "stone age", "flint", "axe", "primitive", "transparent"],
     "desc_zh": "原创系列：巨型燧石刃绑在弯木柄上，石面带天然贝壳状断口，柄身缠绕皮条与骨钉，斧头泛冷白光泽，史前石器图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a giant flint blade lashed to a curved wooden haft, the stone showing natural conchoidal fracture, hide strips and bone spikes binding the shaft, the head with a cold white sheen, prehistoric artefact study style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/stone_bone_hammer_t.png", "id": "stone-bone-hammer", "name_zh": "骨柄石锤 · 石器", "name_en": "Bone-Handled Stone Hammer · Stone Age",
     "cat": "stoneage", "tags": ["原创", "石器", "石锤", "骨柄", "原始", "hammer", "bone", "透明"],
     "tags_en": ["original", "stone age", "hammer", "bone handle", "primitive", "transparent"],
     "desc_zh": "原创系列：灰白石锤头凿出粗糙凿痕，中央穿孔绑着一根打磨光滑的长骨柄，柄尾系着几缕麻绳，史前工具图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a grey stone hammer head with rough chisel marks, a hole bored through the centre lashed to a smoothly polished long bone handle, a few hemp fibres tied at the tail, prehistoric tool study style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/stone_mortar_t.png", "id": "stone-mortar", "name_zh": "玄武岩石臼 · 石器", "name_en": "Basalt Mortar · Stone Age",
     "cat": "stoneage", "tags": ["原创", "石器", "石臼", "研磨", "原始", "mortar", "basalt", "透明"],
     "tags_en": ["original", "stone age", "mortar", "grinding", "primitive", "transparent"],
     "desc_zh": "原创系列：厚重玄武岩凿成的石臼，内壁被研磨出光滑凹面，臼底躺着几粒黑色谷物与白色粉末，边缘散落碎石与木杵，史前工具图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a heavy basalt mortar hewn from rock, the inner wall worn smooth by grinding, a few black grains and pale powder resting at the bottom, chips of stone and a wooden pestle scattered around the rim, prehistoric tool study style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/figure_primitive_hunter_t.png", "id": "figure-primitive-hunter", "name_zh": "持矛猎人 · 原始人", "name_en": "Spear Hunter · Primitive",
     "cat": "stoneage", "tags": ["原创", "人物立绘", "原始人", "猎人", "长矛", "兽皮", "primitive", "hunter", "透明"],
     "tags_en": ["original", "character art", "primitive", "hunter", "spear", "transparent"],
     "desc_zh": "原创系列：赤膊原始人立绘，乱发扎着兽骨饰，肩披红白兽皮披风，下着兽皮短裙，长矛斜握在手，脚下有淡色投影，史前人物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a bare-chested primitive figure with bone ornaments in the tangled hair, a red-and-white fur mantle over the shoulder, a hide loincloth, a long spear gripped in one hand, a pale ground shadow beneath, prehistoric character study style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/figure_primitive_gatherer_t.png", "id": "figure-primitive-gatherer", "name_zh": "采果女采集者 · 原始人", "name_en": "Foraging Woman · Primitive",
     "cat": "stoneage", "tags": ["原创", "人物立绘", "原始人", "采集者", "藤篮", "羽毛", "primitive", "gatherer", "透明"],
     "tags_en": ["original", "character art", "primitive", "gatherer", "basket", "transparent"],
     "desc_zh": "原创系列：微笑的原始人女性立绘，编发缀着羽毛与骨珠，背负编织藤篮，肩披带叶羽饰，手捧一把刚采的红果并挂着一只小葫芦，史前人物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a smiling primitive woman with feathers and bone beads woven into her braids, a woven basket carried on her back, a leafy feathered shoulder piece, cradling freshly picked red berries with a small gourd hanging beside them, prehistoric character study style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 奇色液体（不同颜色 / 不同容器）----
    {"src": "processed/potion_magenta_cone_t.png", "id": "potion-magenta-cone", "name_zh": "品红锥形瓶 · 奇色液体", "name_en": "Magenta Cone Flask · Colored Potion",
     "cat": "potions", "tags": ["原创", "奇色液体", "药剂", "品红", "锥形瓶", "发光", "potion", "magenta", "透明"],
     "tags_en": ["original", "potion", "magenta", "conical flask", "glowing", "transparent"],
     "desc_zh": "原创系列：细长锥形玻璃瓶盛满品红色药液，液面微微晃动透出内辉，瓶口塞着软木塞，瓶身贴着一枚手写标签，药水图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a slender conical glass flask filled with magenta potion, the liquid surface glowing faintly from within, a cork stopper in the neck, a handwritten label on the body, potion catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/potion_teal_round_t.png", "id": "potion-teal-round", "name_zh": "青绿圆瓶 · 奇色液体", "name_en": "Teal Round Bottle · Colored Potion",
     "cat": "potions", "tags": ["原创", "奇色液体", "药剂", "青绿", "圆瓶", "气泡", "potion", "teal", "透明"],
     "tags_en": ["original", "potion", "teal", "round bottle", "bubbles", "transparent"],
     "desc_zh": "原创系列：圆肚玻璃瓶盛着通透青绿色液体，瓶中细密气泡不断上升，瓶肩缠一圈麻绳，瓶塞为削平的软木，药水图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a round-bellied glass bottle of clear teal liquid, fine bubbles streaming upward inside, a coil of hemp twine around the shoulder, a flattened cork stopper, potion catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/potion_gold_square_t.png", "id": "potion-gold-square", "name_zh": "琥珀方瓶 · 奇色液体", "name_en": "Amber Square Bottle · Colored Potion",
     "cat": "potions", "tags": ["原创", "奇色液体", "药剂", "琥珀", "方瓶", "暖光", "potion", "amber", "透明"],
     "tags_en": ["original", "potion", "amber", "square bottle", "warm light", "transparent"],
     "desc_zh": "原创系列：方正厚玻璃方瓶盛满琥珀色药液，瓶壁厚处透出温暖橙光，四角因年代久远而磨损，瓶口缠着封蜡麻绳，药水图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a square thick-walled glass bottle filled with amber potion, warm orange light glowing through the heavy glass, corners worn smooth with age, waxed twine wrapped around the neck, potion catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/potion_violet_slender_t.png", "id": "potion-violet-slender", "name_zh": "幽紫高瓶 · 奇色液体", "name_en": "Violet Tall Vial · Colored Potion",
     "cat": "potions", "tags": ["原创", "奇色液体", "药剂", "幽紫", "高瓶", "水晶塞", "potion", "violet", "透明"],
     "tags_en": ["original", "potion", "violet", "tall vial", "crystal stopper", "transparent"],
     "desc_zh": "原创系列：修长高瓶盛着通透幽紫药液，瓶底嵌着发光晶核，瓶口是一枚尖头水晶塞，瓶身凝着几滴冷雾，药水图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a slender tall vial of clear violet potion, a glowing crystal core embedded in the base, a pointed crystal stopper in the neck, cold mist beading on the glass, potion catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 魔法书籍（封面符文全部为虚构符号，非地球任何现有语言）----
    {"src": "processed/book_grimoire_t.png", "id": "book-grimoire", "name_zh": "血红法典 · 魔法书籍", "name_en": "Crimson Grimoire · Arcane Book",
     "cat": "books", "tags": ["原创", "魔法书籍", "法典", "皮革装帧", "黄铜扣", "封印", "透明"],
     "tags_en": ["original", "arcane book", "grimoire", "leather bound", "brass clasp", "sealed", "transparent"],
     "desc_zh": "原创系列：厚重的血红皮革法典立于封面，封面刻着一枚由纯虚构几何符号与棱角符文组成的圆形印记，青蓝色光芒从刻痕里渗出，四角包着磨损的铜护片，正面横着一道沉重铜扣，魔典图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a thick crimson leather grimoire standing upright, its cover carved with a circular emblem of purely invented geometric symbols and angular runes, cyan-blue light seeping from the carved grooves, worn brass corner protectors, a heavy brass clasp across the front, arcane book catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/book_open_tome_t.png", "id": "book-open-tome", "name_zh": "摊开魔典 · 魔法书籍", "name_en": "Open Spell Tome · Arcane Book",
     "cat": "books", "tags": ["原创", "魔法书籍", "羊皮纸", "摊开", "紫色符光", "飘浮符号", "透明"],
     "tags_en": ["original", "arcane book", "open tome", "parchment", "violet glow", "floating glyphs", "transparent"],
     "desc_zh": "原创系列：摊开平放的古老魔典，两页泛黄羊皮纸上写满纯虚构的抽象符号与几何图形，紫金双色墨迹，右页若干符号发亮浮离纸面，紫色细烟袅袅升起，魔典图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: an ancient tome lying open, both yellowed parchment pages covered with purely invented abstract glyphs and geometric diagrams in violet and gold ink, several marks on the right page glowing and lifting off the page, thin violet wisps rising above, arcane book catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/book_scroll_t.png", "id": "book-scroll", "name_zh": "符纹卷轴 · 魔法书籍", "name_en": "Rune Scroll · Arcane Book",
     "cat": "books", "tags": ["原创", "魔法书籍", "卷轴", "羊皮纸", "木轴", "余烬", "透明"],
     "tags_en": ["original", "arcane book", "scroll", "parchment", "wooden rod", "embers", "transparent"],
     "desc_zh": "原创系列：半展的魔法卷轴立于木轴之上，羊皮纸面排满纯虚构的抽象刻痕与几何图形，焦橙与深青墨色，其中一带符号隐隐泛着琥珀色火光，几点余烬飘散向上，魔典图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a partially unrolled magical scroll standing on its wooden rod, the parchment covered in rows of purely invented abstract marks and geometric diagrams in burnt orange and dark teal ink, one band of glyphs glowing faintly amber as if smoldering, a few embers drifting upward, arcane book catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/book_crystal_t.png", "id": "book-crystal", "name_zh": "水晶法典 · 魔法书籍", "name_en": "Crystal Codex · Arcane Book",
     "cat": "books", "tags": ["原创", "魔法书籍", "水晶", "金属框", "悬浮", "寒光", "透明"],
     "tags_en": ["original", "arcane book", "crystal", "metal frame", "hovering", "frost light", "transparent"],
     "desc_zh": "原创系列：嵌着淡蓝水晶的封闭法典悬浮在半空，细银黑金属框以爪状卡扣咬住书脊边缘，水晶面上刻着纯虚构的锐角符号与交错几何线条，冷蓝白光从刻纹里透出，框缘结着一圈霜光，浮冰晶在四周漂移，魔典图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a closed codex with a pale ice-blue crystal set into its cover, held by a thin dark-silver metal frame with claw-like prongs gripping the edges, the crystal face engraved with purely invented sharp angular strokes and intersecting geometric lines, cold blue-white light glowing from the engravings, a rim of frosty light along the frame, tiny ice crystals drifting around, arcane book catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/book_bone_t.png", "id": "book-bone", "name_zh": "骨饰禁书 · 魔法书籍", "name_en": "Bone-Bound Grimoire · Arcane Book",
     "cat": "books", "tags": ["原创", "魔法书籍", "骨饰", "黑封皮", "磷光", "寒雾", "透明"],
     "tags_en": ["original", "arcane book", "bone binding", "black cover", "sickly glow", "cold mist", "transparent"],
     "desc_zh": "原创系列：灰骨板装帧的黑暗禁书立于封面，脊背拱起数根雕骨肋条，正面一枚锡扣，封面竖排一枚由纯虚构钩状符号与骨形印记组成的纹章，泛着病态绿光，底缘绕着冷雾，页面染成深褐，魔典图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a blackened occult tome bound in dark grey bone plates, small carved bone ribs arching over the spine, a tarnished pewter clasp on the front, a single emblem in a tight vertical column built from purely invented hooked strokes and bone-shaped sigils, glowing a dim sickly green, cold mist curling along the base, page edges stained dark umber, arcane book catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 魔法法器（形制刻意避开现有武器与药剂瓶）----
    {"src": "processed/impl_wand_t.png", "id": "impl-wand", "name_zh": "月牙魔杖 · 魔法法器", "name_en": "Crescent Wand · Arcane Implement",
     "cat": "implements", "tags": ["原创", "魔法法器", "魔杖", "月牙", "琥珀", "流光", "透明"],
     "tags_en": ["original", "arcane implement", "wand", "crescent moon", "amber", "glow", "transparent"],
     "desc_zh": "原创系列：细长白桦木魔杖立于底座，下半截缠紧铜线，杖头嵌一枚整块半透明琥珀雕成的月牙，暖琥珀光沿木纹上行，杖尖飘散细小光尘，法器图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a slender tapered birch wand standing on its base, its lower half wrapped in tight copper wire, tipped with a crescent moon carved from a single piece of translucent pale amber, a thin warm amber glow running up the wood grain, tiny amber motes drifting off the tip, arcane implement catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/impl_staff_t.png", "id": "impl-staff", "name_zh": "浮珠法杖 · 魔法法器", "name_en": "Hovering Orb Staff · Arcane Implement",
     "cat": "implements", "tags": ["原创", "魔法法器", "法杖", "浮珠", "黑曜石", "紫光环", "透明"],
     "tags_en": ["original", "arcane implement", "staff", "hovering orb", "obsidian", "violet ring", "transparent"],
     "desc_zh": "原创系列：高过画框的瘤节浮木法杖插地而立，下三分之一入土，杖头三股木叉托着一枚缓缓悬浮的抛光黑曜石球，一道细紫光环绕着球体公转，杖身螺旋刻着浅槽，法器图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a tall gnarled staff of knotted grey driftwood planted in the ground, its upper end cradling a slowly hovering sphere of polished dark obsidian held by three wood prongs, a thin ring of violet light orbiting the sphere, the wood spiralled with a band of shallow carved grooves, arcane implement catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/impl_orb_t.png", "id": "impl-orb", "name_zh": "青碧水晶球 · 魔法法器", "name_en": "Turquoise Crystal Ball · Arcane Implement",
     "cat": "implements", "tags": ["原创", "魔法法器", "水晶球", "三足架", "青碧", "内辉", "透明"],
     "tags_en": ["original", "arcane implement", "crystal ball", "tripod stand", "turquoise", "inner glow", "transparent"],
     "desc_zh": "原创系列：通透水晶球安在青铜三足爪脚架上，球面光洁，内部泛柔和青碧色微光，一团细小光云缓缓流转，左下一抹青碧反光，铜架缝隙里生出铜绿，法器图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a clear translucent crystal ball resting in a small three-legged bronze stand with claw feet, a soft inner glow of pale turquoise, a swirl of tiny luminous clouds turning slowly inside, a faint turquoise reflection on the lower left, verdigris in the crevices of the bronze stand, arcane implement catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/impl_amulet_t.png", "id": "impl-amulet", "name_zh": "金纹护符 · 魔法法器", "name_en": "Gold-Inlay Amulet · Arcane Implement",
     "cat": "implements", "tags": ["原创", "魔法法器", "护符", "吊坠", "金纹", "符印", "透明"],
     "tags_en": ["original", "arcane implement", "amulet", "pendant", "gold inlay", "sigil", "transparent"],
     "desc_zh": "原创系列：沉重石质护符由细链悬于画框顶端，菱形暗灰石板正面嵌一道轮廓锐利的淡金几何纹章，纹路由纯虚构的抽象符号与棱角刻痕组成，金纹缓缓脉动暖光，坠底漏落细碎金屑，法器图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a heavy pendant amulet suspended from a fine chain rising to the top of the frame, a flat vertical lozenge of dull slate-grey stone with a sharply defined pale gold geometric emblem inlaid into its face, the emblem composed of purely invented abstract glyphs and angular marks belonging to no real-world writing system, the inlay pulsing a slow warm gold light, fine gold sparks falling from the bottom edge, arcane implement catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 城堡建筑 ----
    {"src": "processed/castle_cloud_t.png", "id": "castle-cloud", "name_zh": "浮空岛堡 · 城堡建筑", "name_en": "Floating Isle Castle · Castle",
     "cat": "castles", "tags": ["原创", "城堡建筑", "浮空", "石堡", "尖顶", "云气", "透明"],
     "tags_en": ["original", "castle", "floating island", "stone keep", "conical roofs", "cloud wisps", "transparent"],
     "desc_zh": "原创系列：小巧石堡踞于宽厚浮岩之上，四座修长灰石塔顶着蓝板岩尖锥顶，正面一道拱形城门与窄条窗，塔尖立小旗，岩底收成嶙峋石锥，散落数块浮石，薄云缭绕岩基，建筑图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a compact stone castle perched on a broad chunk of floating rock, four slender towers of pale grey ashlar masonry topped with tall conical blue-slate roofs, a single arched gate and narrow slit windows, small pennants on the tower tips, the rock underside tapering into jagged stone shards with loose boulders drifting beneath, thin cloud wisps around the base, castle catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/castle_valley_t.png", "id": "castle-valley", "name_zh": "丘顶要塞 · 城堡建筑", "name_en": "Hilltop Fortress · Castle",
     "cat": "castles", "tags": ["原创", "城堡建筑", "要塞", "望塔", "木栅", "赭砂岩", "透明"],
     "tags_en": ["original", "castle", "fortress", "watchtower", "palisade", "ochre sandstone", "transparent"],
     "desc_zh": "原创系列：质朴丘顶要塞踞于低圆土石丘上，方形主堡一角立起一方高望塔，暖赭砂岩墙脚压一圈深色石，前沿木栅栏插着尖桩，拱形木门包铁皮，墙顶一条窄木步道，塔屋顶竖一根旗杆，丘面覆短干草，建筑图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a modest hilltop fortress on a low rounded mound, a squat rectangular keep with a single tall square watchtower at one corner, warm ochre sandstone walls with a darker stone base band, a timber palisade with pointed stakes along the front, an arched wooden gate with iron banding, a narrow wooden walkway on the wall top, one banner pole on the tower roof, short dry grass on the mound, castle catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/castle_crystal_t.png", "id": "castle-crystal", "name_zh": "水晶尖塔城 · 城堡建筑", "name_en": "Crystal Spire Castle · Castle",
     "cat": "castles", "tags": ["原创", "城堡建筑", "水晶", "尖塔", "紫光", "晶桥", "透明"],
     "tags_en": ["original", "castle", "crystal", "spire", "violet glow", "crystal bridges", "transparent"],
     "desc_zh": "原创系列：修长城堡由半透明淡紫与冰蓝水晶筑成，一道主尖塔高耸，基座环立四座小尖塔，晶壁切面通透透出内辉，尖塔间以精巧晶桥相连，尖拱晶门，紫光在塔底积成一滩，空中浮着细小晶屑，建筑图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a tall slender castle built from translucent pale violet and ice-blue crystal, one dominant central spire with four smaller spires around its base, faceted translucent walls with a soft inner glow, delicate crystal bridges arching between spires, a pointed crystal arch entrance, a soft violet light pooling beneath the structure, tiny crystal splinters floating in the air, castle catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/castle_ruins_t.png", "id": "castle-ruins", "name_zh": "藤蔓古堡遗迹 · 城堡建筑", "name_en": "Overgrown Ruins · Castle",
     "cat": "castles", "tags": ["原创", "城堡建筑", "遗迹", "藤蔓", "残塔", "苔藓", "透明"],
     "tags_en": ["original", "castle", "ruins", "ivy", "broken towers", "moss", "transparent"],
     "desc_zh": "原创系列：古堡残迹立于平地，两截深灰花岗岩断塔顶作锯齿状坍塌，一段残墙仍立着缺口，拱门倾颓半埋碎石，厚藤蔓与苔藓爬满每块残石，蕨草与树苗从石缝钻出，基座散落塌石，建筑图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: the crumbling remains of an old stone castle, two broken tower stumps of dark weathered granite with jagged collapsed tops, a partial curtain wall with gaps, a leaning arched gateway half filled with rubble, thick ivy and moss crawling over every stone, ferns and saplings growing from the cracks, fallen stone blocks scattered at the base, castle catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 古旧家具 ----
    {"src": "processed/furn_table_t.png", "id": "furn-table", "name_zh": "旧橡木长桌 · 古旧家具", "name_en": "Old Oak Table · Furniture",
     "cat": "furniture", "tags": ["原创", "古旧家具", "桌子", "橡木", "十字撑", "磨损", "透明"],
     "tags_en": ["original", "furniture", "table", "oak", "cross stretcher", "worn", "transparent"],
     "desc_zh": "原创系列：敦实旧橡木方桌四腿直立，厚桌面边缘磨损不齐，深棕木面满是划痕与几处刻字，腿近地处以一根简单横撑相连，桌面一角磕破露出浅色新木，器物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a squat old oak dining table on four straight legs, a thick rectangular tabletop with a worn uneven edge, dark brown wood covered in decades of scratches and a few carved initials, legs braced with a simple cross stretcher near the floor, one corner of the tabletop chipped showing lighter wood beneath, furniture catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/furn_chair_t.png", "id": "furn-chair", "name_zh": "高背旧椅 · 古旧家具", "name_en": "High-Backed Old Chair · Furniture",
     "cat": "furniture", "tags": ["原创", "古旧家具", "椅子", "高背", "胡桃木", "缺扶手", "透明"],
     "tags_en": ["original", "furniture", "chair", "high back", "walnut", "missing armrest", "transparent"],
     "desc_zh": "原创系列：深染胡桃木高背旧椅，窄高靠背顶一道圆弧顶板，座面为磨旧的草编，四根收分细腿由低撑环相连，一侧扶手缺失只余两个木栓孔，座前沿漆面磨透露出浅木，器物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: an old high-backed chair of dark stained walnut, a tall narrow backrest topped with a rounded crest rail, a worn rush seat, four slim tapering legs joined by a low stretcher ring, one armrest missing leaving two bare peg holes, the varnish worn through to pale wood along the front edge of the seat, the crest rail carved with a simple shallow groove pattern, furniture catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/furn_stool_t.png", "id": "furn-stool", "name_zh": "三腿旧圆凳 · 古旧家具", "name_en": "Three-Legged Old Stool · Furniture",
     "cat": "furniture", "tags": ["原创", "古旧家具", "凳子", "三腿", "白蜡木", "铁箍", "透明"],
     "tags_en": ["original", "furniture", "stool", "three legs", "ash wood", "iron collar", "transparent"],
     "desc_zh": "原创系列：小巧旧三腿圆凳取风化的浅色白蜡木，圆座微凹磨得油亮，三根外撇直腿以近顶处一枚铁箍相连而非横撑，一腿略短使凳子微倾，座缘磕伤泛灰，座面还留几颗钉头，器物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a small old three-legged stool of pale weathered ash wood, a round slightly dished seat worn smooth and darker at the centre, three straight splayed legs braced near the top with a simple iron collar ring instead of a stretcher, one leg shorter so the stool sits at a slight tilt, the seat edge chipped and greyed by weather, small nail heads visible on the seat, furniture catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/furn_bench_t.png", "id": "furn-bench", "name_zh": "长条旧板凳 · 古旧家具", "name_en": "Long Old Bench · Furniture",
     "cat": "furniture", "tags": ["原创", "古旧家具", "板凳", "长条", "栗木", "车木柱", "透明"],
     "tags_en": ["original", "furniture", "bench", "long", "chestnut", "turned spindles", "transparent"],
     "desc_zh": "原创系列：低矮长条旧板凳取深栗木，座面一整条长板分三块拼成、露明缝铁钉，靠背为两根圆头立柱间立三根车木柱，顶面木色经年灰白，一柱中段开裂，短粗腿，器物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a long low wooden bench of dark chestnut wood with a slight backward lean, a single long plank seat split into three boards with visible seams and iron nails, a backrest of three vertical turned spindles between two rounded end posts topped with simple ball finials, the wood greyed and silvered by weather along the top surfaces, one spindle cracked near the middle, short stubby legs, furniture catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 奇械科技 ----
    {"src": "processed/tech_holo_t.png", "id": "tech-holo", "name_zh": "全息投影仪 · 奇械科技", "name_en": "Holographic Projector · Odd Device",
     "cat": "techdev", "tags": ["原创", "奇械科技", "全息", "投影仪", "青光", "悬浮图", "透明"],
     "tags_en": ["original", "odd device", "holographic", "projector", "cyan light", "floating schematic", "transparent"],
     "desc_zh": "原创系列：台式投影仪立于短圆柱底座，哑光白瓷外壳顶前部一枚深色玻璃镜头，镜头射出一道浅青光环，环中悬浮着由简单几何板与环构成的抽象三维示意物，器身中段一道镀铬赤道线，正面一道浅凹槽，壳缝渗出冷蓝微光，器械图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a compact desktop projector standing on a short cylindrical base, matte off-white ceramic shell with a single dark glass lens at the top front, a shallow ring of cyan light emitted from the lens forming a small hovering three-dimensional schematic of an abstract object made of simple geometric plates and rings, a thin chrome equator line, a small recessed slot on the front face, faint cool blue glow leaking from the shell seam, device catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/tech_scanner_t.png", "id": "tech-scanner", "name_zh": "手持扫描仪 · 奇械科技", "name_en": "Handheld Scanner · Odd Device",
     "cat": "techdev", "tags": ["原创", "奇械科技", "扫描仪", "手持", "琥珀光束", "卷线", "透明"],
     "tags_en": ["original", "odd device", "scanner", "handheld", "amber beams", "coiled cable", "transparent"],
     "desc_zh": "原创系列：手枪握式手持扫描仪直立，深炮铜机身顶部一片宽平传感头，传感面下射一扇暖琥珀细光束，在下方地面投出一个抽象物件的小小浮像，握把缠棱纹橡胶，侧面一枚琥珀状态灯，底部拖一卷短线，器身带使用磨痕，器械图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a pistol-gripped handheld scanner held upright, dark gunmetal body with a wide flat sensor head at the top, the sensor face emitting a fan of thin scanning light beams in warm amber projecting downward onto a small floating rendered image of an abstract object, ribbed rubber grip, a small amber status light on the side, a short coiled cable trailing from the base, the body scuffed with use, device catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/tech_grav_t.png", "id": "tech-grav", "name_zh": "反重力平台 · 奇械科技", "name_en": "Anti-Gravity Platform · Odd Device",
     "cat": "techdev", "tags": ["原创", "奇械科技", "反重力", "悬浮平台", "青光", "网格面", "透明"],
     "tags_en": ["original", "odd device", "anti-gravity", "hovering platform", "teal light", "grid surface", "transparent"],
     "desc_zh": "原创系列：宽平六角拉丝钢平台悬于地面之上，底面环列三只均匀分布的发射喷口泛稳定青光，一道柔和青光垫从喷口铺向地面，台面覆浅凸网格纹，中央一个圆形凹口，钢边磨损微凹，光垫里漂着细微尘埃，器械图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a broad flat hexagonal platform of brushed steel hovering a short distance above the ground, its underside ringed with three evenly spaced emitter nozzles glowing a steady teal, a soft cushion of teal light spreading down from the nozzles onto the ground, the platform surface covered with a shallow raised grid pattern and a single circular recessed port at its centre, steel edges worn and slightly dented, dust particles drifting in the light cushion, device catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/tech_shield_t.png", "id": "tech-shield", "name_zh": "便携力场发生器 · 奇械科技", "name_en": "Portable Force-Field Generator · Odd Device",
     "cat": "techdev", "tags": ["原创", "奇械科技", "力场", "发生器", "绿光", "提手", "透明"],
     "tags_en": ["original", "odd device", "force field", "generator", "lime glow", "carry handle", "transparent"],
     "desc_zh": "原创系列：矮壮便携发生器取深板岩复合材料立于四短脚，顶部穹顶发射器向上一拢，罩住上半身的半球形淡绿透明力场，场表荡着细密同心涟漪，器身三处散热口泛浅绿光，顶上一道厚重提手，外壳磕凹带使用包浆，场沿接地处积一小滩绿光，器械图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a stubby portable generator of dark slate composite material on four short feet, a domed emitter on top projecting a broad translucent hemispherical force field of pale lime green light surrounding the upper part of the device, the field rippling with faint concentric distortion rings, three cooling vents glowing faint lime on the sides, a heavy carry handle arched over the top, the body dented and scratched with a patina of use, a small pool of green light where the field meets the ground, device catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    # ---- 异星猎食（刻意避开异形/铁血战士/触手怪等一切已知外星原型，
    #      用「错误对称性」制造陌生感：三条腿的反关节、螺旋状肋骨、无头三足）----
    {"src": "processed/xeno-prism-stalker_t.png", "id": "xeno-prism-stalker", "name_zh": "折光伏击者 · 异星猎食", "name_en": "Prism Stalker · Alien Predation",
     "cat": "xenohorror", "tags": ["原创", "异星猎食", "折光", "伏击", "琥珀诱饵", "三足", "透明"],
     "tags_en": ["original", "alien predation", "light refraction", "ambush", "amber lure", "tripodal", "transparent"],
     "desc_zh": "原创系列：无眼无面的伏击型掠食者。躯干是一叠竖向折起的半透明硅质晶板，边缘泛油膜般虹彩而中心近乎透明，像一枚收拢待发的弹簧陷阱；三条反关节长腿撑起身体，趾爪张开，基部由数根苍白须根锚进地面；肩部伸出一根细柄，末端垂着一枚多棱面琥珀诱饵果，正滴落一滴黏液。体表干燥、纸质、矿物感，绝不湿滑。骨白、灰烬、虹彩与病态琥珀四色。异星生物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: an eyeless faceless ambush predator. Its torso is a vertical accordion-fold of translucent crystalline silica plates, edges shimmering with oil-slick iridescence while the centre stays almost invisible, held compact like a cocked spring trap. Three long reverse-jointed legs brace the body, toes splayed, anchored to the ground by pale tendril roots. A slender stalk rises from the shoulder, ending in a faceted amber lure-fruit dripping a single sticky drop. Texture is dry, papery and mineral, never slimy. Bone white, ash grey, iridescent film and sickly amber. Alien creature catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/xeno-rib-lurker_t.png", "id": "xeno-rib-lurker", "name_zh": "鸣骨吸附者 · 异星猎食", "name_en": "Resonant Rib-Cage · Alien Predation",
     "cat": "xenohorror", "tags": ["原创", "异星猎食", "螺旋肋骨", "吸盘", "共振膜", "扁平", "透明"],
     "tags_en": ["original", "alien predation", "spiral ribs", "suction pores", "resonant membrane", "flattened", "transparent"],
     "desc_zh": "原创系列：扁平如鳐的寄生型掠食者。身体由一具敞开的螺旋状湿骨肋笼构成——十二根肋骨自中央铰点向外旋出而非对称弯曲，每根肋骨末端环生一圈细小吸盘，肋骨能像手指那样屈伸抓握；无口、无眼、无面。螺旋中心悬着一片共振膜，淤紫半透明，可见同心波纹在膜上荡开；腹面是布满毛细孔的多孔海绵层。质感是湿骨、软骨与潮膜。蜡黄象牙、淤紫膜、锈褐污渍三色。异星生物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a parasitic predator flattened like a stingray. Its body is an open spiral cage of wet yellowed bone: twelve ribs spiralling outward from a central hinge instead of curving symmetrically, each rib tipped with a ring of tiny suction pores, the ribs articulating like fingers to grip and walk. No mouth, no eyes, no face. A resonant membrane hangs at the centre of the spiral, bruised violet and translucent, with concentric ripples visibly spreading across it; the underside is a porous sponge of capillary pores. Texture of wet bone, gristle and damp membrane. Jaundiced ivory, bruised violet and rust-brown stains. Alien creature catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/xeno-mycelial-weaver_t.png", "id": "xeno-mycelial-weaver", "name_zh": "孢丝织者 · 异星猎食", "name_en": "Mycelial Weaver · Alien Predation",
     "cat": "xenohorror", "tags": ["原创", "异星猎食", "菌丝", "孢囊", "孢丝", "猎茧", "透明"],
     "tags_en": ["original", "alien predation", "mycelium", "spore sac", "hyphae threads", "prey cocoon", "transparent"],
     "desc_zh": "原创系列：低伏蹲踞的真菌型掠食者，三足反关节，没有头。本该是脸的位置，一枚孢囊裂成五片湿毡质瓣，瓣缝间藏着一簇细小的珠状眼。肩部不生手臂而是两束苍白菌丝，正甩出孢丝，其中一束末端缠着一只拳头大小的猎物茧，丝线正往茧缝里钻。背部覆满会搏动的细纤毛与潮湿菌毡，撒着淡紫孢子粉。质感是湿毡、菌丝与湿土。白垩、湿板岩灰、淡紫孢子粉与一颗湿琥珀珠。异星生物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: a hunched low-slung fungal predator, tripedal and reverse-jointed, with no head. Where a face would be, a spore sac splits open into five flaps of wet felt, a cluster of small bead-like eyes hidden in the seams between them. Instead of arms, two bundles of pale hyphae extend from the shoulders, mid-casting; one thread ends in a fist-sized prey cocoon, the filaments visibly sinking into its seams. Its back is covered in pulsing fine cilia and damp mycelial felt, dusted with lilac spore powder. Texture of wet felt, mycelium and damp soil. Chalk white, wet slate grey, lilac dust and one wet amber bead. Alien creature catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/flora-pulse-pod_t.png", "id": "flora-pulse-pod", "name_zh": "脉孢囊壶 · 异星猎食", "name_en": "Pulsing Pitcher Pod · Alien Predation",
     "cat": "xenohorror", "tags": ["原创", "异星猎食", "食人植物", "囊壶", "消化液", "倒刺", "透明"],
     "tags_en": ["original", "alien predation", "carnivorous plant", "bladder pod", "digestive fluid", "barbs", "transparent"],
     "desc_zh": "原创系列：异星食人植物。一根粗壮的肉质柄自一团根瘤隆起，顶端是一枚半透明囊壶，壶身一道竖直的括约肌式裂缝半开着；壶内可见猎物的半溶解残影悬在琥珀色消化液中，壶壁上爬着搏动的脉管；三根僵硬的倒刺须像护肋那样拱在壶顶，光合质地的墨绿蜡光。整株像在呼吸，壶壁微微鼓胀。无花、无瓣、无叶。墨绿、半透明琥珀与蜡黄脉管三色。异星植被图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: an alien carnivorous plant. A thick fleshy stalk rises from a burl of root-nodes and ends in a translucent bladder-pod with a vertical sphincter slit, half-open. Inside the pod, half-dissolved prey remains hang as dark silhouettes suspended in amber digestive fluid, and pulsing veins crawl across the pod wall. Three stiff barbed tendrils arch over the pod like protective ribs, photosynthetic and green-black with a waxy sheen. The whole plant appears to breathe, the pod walls slightly distended. No flowers, no petals, no leaves. Green-black, translucent amber and jaundiced yellow veins. Alien flora catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/flora-gland-stake_t.png", "id": "flora-gland-stake", "name_zh": "血蕊诱桩 · 异星猎食", "name_en": "Gland Lure Stake · Alien Predation",
     "cat": "xenohorror", "tags": ["原创", "异星猎食", "食人植物", "诱饵", "腺果", "倒刺", "透明"],
     "tags_en": ["original", "alien predation", "carnivorous plant", "lure", "gland fruit", "barbs", "transparent"],
     "desc_zh": "原创系列：异星食人植物。一根硬直的柄，外表像昆虫胸板那样分节，自浅根瘤升起，顶端是一枚多棱面琥珀腺果，正往下淌着浓稠的诱引液，沿柄凝成一道道硬化的流痕；基座周围六根僵硬的光合须向内勾着倒刺，每根须尖有一个小孔，正呼出淡淡可见的蒸汽。无花、无瓣、无叶，柄身微妙地像一根饲管。骨白、钙化米白、琥珀腺果与墨绿倒刺。异星植被图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: an alien carnivorous lure-plant. A tall rigid stalk, ribbed like an insect sternum, rises from a shallow burl of root-nodes and ends in a faceted amber gland-fruit that weeps thick glistening attractant down the stalk in hardened rivulets. Around the base, six stiff photosynthetic tendrils bristle with inward-curving barbs, each tipped with a tiny pore exhaling a faint visible vapor. No flowers, no petals, no leaves; the stalk subtly resembles a feeding tube. Bone, calcified off-white, amber gland and black-green barbs. Alien flora catalogue style, transparent PNG, 1024×1024",
     "transparent": True, "effect": None},
    {"src": "processed/xeno-strike-scene_t.png", "id": "xeno-strike-scene", "name_zh": "折光出击 · 异星猎食", "name_en": "Prism Strike · Alien Predation",
     "cat": "xenohorror", "tags": ["原创", "异星猎食", "折光", "出击", "捕食瞬间", "诱饵", "透明"],
     "tags_en": ["original", "alien predation", "light refraction", "strike", "mid-attack", "lure", "transparent"],
     "desc_zh": "原创系列：捕食瞬间。折光伏击者自收拢姿态向上弹开，半透明晶板叠成的躯干伸到静止时的两倍长，板片张开把光折射成一圈圈油膜光带；三条反关节腿死死撑住，趾爪张开抓地；肩柄上的琥珀诱饵果甩到前方，柄腱绷直，正滴落黏液；一圈折射激波环在伸长的躯干外围扩散。无眼、无面、无口。干燥纸质的矿物质感。骨白、灰烬、虹彩与琥珀。异星生物图鉴风，透明 PNG，1024×1024",
     "desc_en": "Original series: the moment of the strike. The prism stalker has unfolded upward from its cocked posture, its accordion torso of translucent crystalline plates extended to twice its resting length, the plates splayed and refracting light into bands of oil-slick colour. Its three reverse-jointed legs brace hard, toes splayed and gripping. The amber lure-fruit on its shoulder stalk swings forward, snapped taut on a strained tendon, dripping. A shock-ring of refracted light spreads around the extended torso. No eyes, no face, no mouth. Dry papery mineral texture. Bone white, ash grey, iridescent film and amber. Alien creature catalogue style, transparent PNG, 1024×1024",
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


def zh_tags(tags):
    """中文标签只留含中文的词。

    ITEMS 的 tags 里历史上混进了英文词（当初为了让搜索能命中英文关键词），
    结果中文界面下灯箱标签直接显示英文。正确做法是英文词归 tags_en 承担，
    中文界面显示纯中文标签；搜索索引里中英两套都在，检索能力不受影响。
    """
    return [t for t in tags if re.search(r"[\u4e00-\u9fff]", t)]


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
        cat = it["cat"]
        tags = zh_tags(it["tags"])
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
