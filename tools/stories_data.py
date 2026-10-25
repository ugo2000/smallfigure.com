# -*- coding: utf-8 -*-
"""smallfigure 故事解说文案库（tools/stories_data.py）

写作规范（内容策略组定）：
- 单篇 2-3 句、中文 60-110 字；英文 25-45 词
- 语气：博物馆解说牌式的冷幽默，不堆形容词、不喊口号
- 每篇必含：来历 + 形态特征或可验证规格 + 世界观用途/轶事
- 中文篇末固定「（本站虚构设定）」，英文篇末「(Fictional lore.)」
- 新增素材后在这里补条目，跑 tools/build_stories.py 产出 data/stories.json
"""

# 分类故事：key 与 data/images.json 的 categories[].key 对应
CAT_STORIES = {
    "characters": {
        "zh": "本站人口第一大户。老张领着果克星人和一干漫画风小人住在这里，职责是给各类项目当立绘、当看板、当吉祥物。按图鉴规矩，他们都不露脸给摄像头看，只以透明 PNG 形态出门。（本站虚构设定）",
        "en": "The gallery's largest household. Led by Laozhang alongside the Guck aliens and a cast of comic-style figures, they serve as character art, mascots and poster faces. Per house rules they never face a camera — they only go out as transparent PNGs. (Fictional lore.)",
    },
    "weapons": {
        "zh": "冷兵器与奇械的中间地带，每件都认真权衡过杀伤力与造型的平衡。事实证明，一把武器要想被记住，锤头比道理更重要。（本站虚构设定）",
        "en": "The middle ground between cold steel and odd machinery, where every piece has weighed lethality against silhouette. A weapon, it turns out, is remembered for its head rather than its reasoning. (Fictional lore.)",
    },
    "ammo": {
        "zh": "全站最没耐心的分类：存在的意义就是被用完。黄铜、底火与纸壳陈列在这里，纯属工伤。（本站虚构设定）",
        "en": "The most impatient category on the site: their whole purpose is to be spent. Brass, primers and paper shells — displayed here purely as occupational injury. (Fictional lore.)",
    },
    "animals": {
        "zh": "从黑猫到渡鸦，本站的动物一律不拆家，只负责在透明背景上维持体面。饲养它们不需要猫砂，需要的是 PNG 的 Alpha 通道。（本站虚构设定）",
        "en": "From black cats to ravens, the site's animals never wreck the house — they merely hold their composure on a transparent background. Keeping them requires no litter box, just a PNG alpha channel. (Fictional lore.)",
    },
    "food": {
        "zh": "拉面、蛋糕与可疑罐头。本站的食物永远停在刚出锅的完美瞬间，而且永远吃不到——这是图鉴的残忍之处。（本站虚构设定）",
        "en": "Ramen, cake and tins of dubious content. The food here is forever at its perfect just-served moment, and forever inedible — such is the cruelty of a gallery. (Fictional lore.)",
    },
    "vehicles": {
        "zh": "从复古火箭到碟形光束船，动力系统一律不可考。但只要背景是星空，速度感就成立。（本站虚构设定）",
        "en": "From retro rockets to disc-shaped beam ships, the propulsion is unverifiable — but against a starfield, a sense of speed simply holds. (Fictional lore.)",
    },
    "aliens": {
        "zh": "果克星球及周边星域的原住民集中区。大头、多眼、甲壳与凝胶是本地四大主流长相，审美统一得令人怀疑他们有同一个居委会。（本站虚构设定）",
        "en": "The natives of Guck and neighbouring systems. Big heads, many eyes, carapace and gel are the four local looks — so unified you suspect a single neighbourhood committee. (Fictional lore.)",
    },
    "flora": {
        "zh": "不进行光合作用，主要进行造型竞争。螺旋星藤在本分类常年人气第一，因为它连缠绕都缠得很有构图意识。（本站虚构设定）",
        "en": "No photosynthesis here — only a competition in silhouette. The spiral star-vine tops the category year-round because even its coiling shows compositional awareness. (Fictional lore.)",
    },
    "stoneage": {
        "zh": "燧石、骨器与兽皮，人类最早的一批开源硬件。本站收藏它们，是为了提醒后人：好设计不需要充电口。（本站虚构设定）",
        "en": "Flint, bone and hide — humanity's first open-source hardware. Collected here to remind later generations that good design needs no charging port. (Fictional lore.)",
    },
    "potions": {
        "zh": "品红、幽蓝、荧光绿，颜色越不可能越有效。本分类所有瓶子的保质期都是永远，功效请自行想象。（本站虚构设定）",
        "en": "Magenta, abyssal blue, fluorescent green — the more improbable the colour, the more potent. Every bottle here keeps forever; effects are left to your imagination. (Fictional lore.)",
    },
    "books": {
        "zh": "血皮、烫金、会自己翻页。本站的法典一律只借不卖，而且不保证读完。（本站虚构设定）",
        "en": "Blood-red leather, gilt edges, pages that turn themselves. The grimoires here are lend-only, never sold — and completion is not guaranteed. (Fictional lore.)",
    },
    "implements": {
        "zh": "魔杖、护符与来路不明的发光棍子。共同点是：拿在谁手里都像主角，这就是法器界的公平。（本站虚构设定）",
        "en": "Wands, talismans and glowing sticks of unclear origin. Their shared trait: whoever holds one looks like the protagonist — the great fairness of implements. (Fictional lore.)",
    },
    "castles": {
        "zh": "浮空岛堡与山坡石堡，建筑规范全部作废，唯一起重机是想象力。住在这里的公主一般自己打怪。（本站虚构设定）",
        "en": "Floating-island forts and hillside stone keeps, with every building code void — the only crane is imagination. Princesses here typically slay their own monsters. (Fictional lore.)",
    },
    "furniture": {
        "zh": "旧橡木长桌领衔。每件家具都自带一段没人记得的往事，以及恰到好处的裂纹——那是岁月的正版防伪标。（本站虚构设定）",
        "en": "Led by the old oak table, each piece carries a past no one recalls and a perfectly placed crack — time's authentic anti-counterfeit mark. (Fictional lore.)",
    },
    "techdev": {
        "zh": "全息投影仪与来路不明的读数装置。本站科技树的特征是：线头比功能多，但看着就是很厉害。（本站虚构设定）",
        "en": "Holo-projectors and dials of unclear purpose. The site's tech tree is defined by more cables than functions — yet it always looks impressive. (Fictional lore.)",
    },
    "xenohorror": {
        "zh": "折光伏击者等掠食者专区。它们捕猎不为果腹，主要为构图——毕竟出现在图鉴里比出现在晚餐里更永恒。（本站虚构设定）",
        "en": "A zone for ambush predators. They hunt not for food but for composition — appearing in a gallery, after all, outlasts appearing in a dinner. (Fictional lore.)",
    },
    "badges": {
        "zh": "低音核、蒸汽卡车与步枪，三枚一组的小型荣誉体系。别在胸前不涨工资，但能明确传达「此人有所热爱」。（本站虚构设定）",
        "en": "Bass cores, steam trucks and rifles — a compact honours system in sets of three. They raise no salary, but they clearly state that this person loves something. (Fictional lore.)",
    },
    "planets": {
        "zh": "碎环星领衔的星球徽章库，每颗星都经过认真的虚构登记。它们不公转，只负责在深蓝背景上好看。（本站虚构设定）",
        "en": "A registry of planet sigils led by the shattered-ring world, each formally fictional. They orbit nothing; their duty is to look good on deep blue. (Fictional lore.)",
    },
    "motion": {
        "zh": "挖矿、钓鱼、射击三个循环小动画，Remotion 一帧帧渲染出来的。小人们活得很充实，而且永远不会累。（本站虚构设定）",
        "en": "Three looping animations — mining, fishing, shooting — rendered frame by frame in Remotion. The little figures live full lives and never tire. (Fictional lore.)",
    },
    "instruments": {
        "zh": "螺壳号与 U 形琴，吹奏效果一律待考。本站乐器的音准由演奏者的信心决定。（本站虚构设定）",
        "en": "Shell horns and U-shaped zithers, all of unverified effect. Here an instrument's pitch is decided by the player's confidence. (Fictional lore.)",
    },
    "physics": {
        "zh": "弩炮与天平，靠杠杆和扭力吃饭的正经机械。在魔法横行的站里，它们代表最后的工程学尊严。（本站虚构设定）",
        "en": "Ballistae and balances — honest machines fed by leverage and torsion. On a site full of magic, they stand for engineering's last dignity. (Fictional lore.)",
    },
    "scarecrows": {
        "zh": "南瓜头、四臂、会自己挪位置。农田雇它们防鸟，现在它们主要防的是访客的胆量。（本站虚构设定）",
        "en": "Pumpkin heads, four arms and a habit of relocating overnight. Farms hired them against birds; nowadays they guard against visitors' courage. (Fictional lore.)",
    },
    "fangs": {
        "zh": "环牙巨口挂帅。本分类的牙齿数量经过审计，每一颗都有排班表。（本站虚构设定）",
        "en": "Led by the ringed maw, the tooth count here has been audited — every fang keeps a roster. (Fictional lore.)",
    },
    "astones": {
        "zh": "熔裂石与结晶岩，外星地质学的样品柜。它们不说话，但每一道纹理都是亿万年的会议纪要。（本站虚构设定）",
        "en": "Fused stones and crystal rocks — the sample cabinet of alien geology. They say nothing, yet every vein is minutes from a billion-year meeting. (Fictional lore.)",
    },
    "currency": {
        "zh": "星纹圆币等外星通货。本站一律不设汇率，因为拿回地球也花不出去。（本站虚构设定）",
        "en": "Alien currency such as star-patterned discs. No exchange rate is published — none of it spends back on Earth. (Fictional lore.)",
    },
    "symbols": {
        "zh": "青铜符碑上的未知文字，语法完整但无人能读。破译工作本站已外包给未来。（本站虚构设定）",
        "en": "Unknown scripts on bronze steles — complete grammar, no readers. Deciphering has been outsourced to the future. (Fictional lore.)",
    },
    "ships": {
        "zh": "碟形光束船领衔。本分类飞船的泊位一律设在图鉴背景的星空里，违章不贴条。（本站虚构设定）",
        "en": "Led by the disc-shaped beam ship, all craft here berth in the gallery's starfield — parking violations are not ticketed. (Fictional lore.)",
    },
    "spaceweapons": {
        "zh": "青光能量步枪等。设计原则是把杀伤力做成肉眼可见的样子，毕竟真空里没人听得见巨响。（本站虚构设定）",
        "en": "Cyan energy rifles and the like, designed so lethality is visible — in a vacuum nobody hears the bang anyway. (Fictional lore.)",
    },
    "flyboots": {
        "zh": "喷气皮靴，个人航空的最短路径。本分类不提供降落伞退款服务。（本站虚构设定）",
        "en": "Jet boots — the shortest path to personal aviation. No parachute refunds in this category. (Fictional lore.)",
    },
    "shields": {
        "zh": "铆钉木圆盾等。防御面积与审美面积成正比，这是本分类唯一的物理学。（本站虚构设定）",
        "en": "Riveted wooden rounds and the like. Here coverage scales with beauty — the category's only physics. (Fictional lore.)",
    },
    "energyblocks": {
        "zh": "星核晶块等发光方块。握在手里会让人想喊口号，本站对此现象不做解释。（本站虚构设定）",
        "en": "Glowing cubes such as the star core. Held in hand they inspire shouting; this site offers no explanation. (Fictional lore.)",
    },
    "morphmonsters": {
        "zh": "凝胶变形兽，形态自由。本分类的物种边界由心情决定。（本站虚构设定）",
        "en": "Gel morph-beasts of free form. Species boundaries here are decided by mood. (Fictional lore.)",
    },
    "telescopes": {
        "zh": "U 形怀表镜等。看远处很清楚，看近处更不清楚——本分类的统一遗憾。（本站虚构设定）",
        "en": "U-shaped pocket scopes and the like: excellent at distance, worse up close — the category's shared regret. (Fictional lore.)",
    },
    "crafts": {
        "zh": "手绣花布胸针领衔的暖土色手作系。本站刻意避开霓虹科技风之后，针脚终于有了落脚处。（本站虚构设定）",
        "en": "A warm-earth handmade line led by embroidered brooches. After deliberately avoiding neon tech, the stitches finally found a home. (Fictional lore.)",
    },
    "riders": {
        "zh": "青铜面具武士骑六足蜈蚣。坐骑越冷门，武士的气场越稳，这是本分类的守恒律。（本站虚构设定）",
        "en": "Bronze-masked warriors astride six-legged centipedes. The more obscure the mount, the steadier the aura — a conservation law here. (Fictional lore.)",
    },
    "bgun": {
        "zh": "兽角喇叭铳等怪奇手作风火器。材质一律奇诡，扳机手感由想象力提供。（本站虚构设定）",
        "en": "Horn-trumpet guns and other hand-made oddities, of curious make — trigger feel supplied by imagination. (Fictional lore.)",
    },
    "modern": {
        "zh": "外卖骑手领衔的现代日常职业装束小人。他们不上朝，只上工，装束扁平但心事矢量。（本站虚构设定）",
        "en": "Modern-daily figures led by the delivery rider. They attend no court, only work — flat of costume, vector of worry. (Fictional lore.)",
    },
    "oldfolk": {
        "zh": "护目镜怪老头等。本分类老人的年龄介于「很久」与「非常久」之间，道具比岁数更说明问题。（本站虚构设定）",
        "en": "Goggle-wearing eccentrics and the like, aged between quite old and very old — their props explain more than their years. (Fictional lore.)",
    },
    "imp": {
        "zh": "火苗小鬼等。破坏力与身高成正比，闯祸后的道歉速度也是。（本站虚构设定）",
        "en": "Flame imps and the like, whose destructive power scales with height — as does the speed of their apologies. (Fictional lore.)",
    },
    "flybeast": {
        "zh": "鬃毛翼狮兽等。起飞不需要跑道，降落看心情。（本站虚构设定）",
        "en": "Maned winged lions and the like: takeoff needs no runway; landing depends on mood. (Fictional lore.)",
    },
    "oddplants": {
        "zh": "笑脸蛛腿花领衔。本分类的授粉工作由错觉完成。（本站虚构设定）",
        "en": "Led by the smiling spider-leg flower, pollination here is performed by illusion. (Fictional lore.)",
    },
    "jewels": {
        "zh": "太阳脸金项坠等。本分类的金属光泽经过审计，耀眼光度全部真实。（本站虚构设定）",
        "en": "Sun-faced gold pendants and the like, with audited metal lustre — the shine is entirely real. (Fictional lore.)",
    },
    "fairykid": {
        "zh": "羽衣仙童等胖娃娃中式仙童。不腾云，只迈着小短腿赶路，仙气全靠表情撑住。（本站虚构设定）",
        "en": "Feather-robed chubby immortal children who never ride clouds — only hurry on short legs, bearing their air entirely on expression. (Fictional lore.)",
    },
    "foodjar": {
        "zh": "泡星光罐等。内容物不可名状，保存期限写的是「直到世界尽头」。（本站虚构设定）",
        "en": "Star-pickle jars and the like, of unnameable contents, stamped best before the end of the world. (Fictional lore.)",
    },
    "hairyboot": {
        "zh": "卷毛短靴领衔。保暖性能存疑，卖萌性能超标。（本站虚构设定）",
        "en": "Led by curly-haired ankle boots: warmth unverified, cuteness over quota. (Fictional lore.)",
    },
    "oddbug": {
        "zh": "多眼毛虫等。本分类的复眼数量经不起细数，建议远观。（本站虚构设定）",
        "en": "Many-eyed caterpillars and the like — the compound eyes defy counting, so viewing from afar is advised. (Fictional lore.)",
    },
    "constellation": {
        "zh": "茶壶座等虚构星点连线。天文学界尚未承认，酒吧讲故事的场合已经常用。（本站虚构设定）",
        "en": "Fictional constellations such as the Teapot — unacknowledged by astronomy, already common at bars. (Fictional lore.)",
    },
    "nonsense": {
        "zh": "顶鱼礼帽先生领衔。逻辑已让位，体面仍在维持，这就是本分类的表演张力。（本站虚构设定）",
        "en": "Led by the fish-hatted gentleman: logic has abdicated yet dignity holds — that is the category's tension. (Fictional lore.)",
    },
    "retrofolk": {
        "zh": "迪斯科舞王等复古故事书风冷脸人物。他们从旧画报里走出来，对新时代保持礼貌的冷淡。（本站虚构设定）",
        "en": "Disco kings and other cold-faced storybook retros, stepped out of old magazines, politely cool toward the new age. (Fictional lore.)",
    },
    "fusionfolk": {
        "zh": "滑板侠客等。时间线在他们身上达成了幽默的和解。（本站虚构设定）",
        "en": "Skateboarding knights-errant and the like — timelines reach a humorous settlement on them. (Fictional lore.)",
    },
    "blades": {
        "zh": "弯钩齿轮镰等手动近战冷兵器。形状越诡异，越说明设计者没打算让它量产。（本站虚构设定）",
        "en": "Hook-gear scythes and other melee oddities — the stranger the shape, the clearer it was never meant for mass production. (Fictional lore.)",
    },
    "giantfolk": {
        "zh": "弯角杂货巨人等。体型是优势也是货架：他们兼职给小镇当移动商店。（本站虚构设定）",
        "en": "Twist-horned grocery giants and the like, whose size is both advantage and shelf — they double as the town's mobile shop. (Fictional lore.)",
    },
    "skulls": {
        "zh": "齿轮骷髅等。骨头与机械的合资企业，死后比生前更有结构感。（本站虚构设定）",
        "en": "Gearwork skulls and the like — bone-and-machine joint ventures, more structured in death than in life. (Fictional lore.)",
    },
    "oddweapons": {
        "zh": "扳手权杖等。工具与武器的身份争议在本分类长期悬置。（本站虚构设定）",
        "en": "Wrench sceptres and the like, where the tool-or-weapon question stays permanently open. (Fictional lore.)",
    },
    "monstertoys": {
        "zh": "被小孩玩坏、又被缝补起来的玩具们的再就业现场。橡胶、铁皮、毛线与针线在本分类和平共处，共同原则是：一只眼睛也照样营业。（本站虚构设定）",
        "en": "Where toys broken by children come back for a second career. Rubber, tin, yarn and stitching coexist here under one rule: one eye is still open for business. (Fictional lore.)",
    },
    "oddbeasts": {
        "zh": "进化论管不到的地区。长颈套铁环的、拿伞骨当壳的、三头叠一摞的，走法各不相同，但都准时出现在图鉴里亮相。（本站虚构设定）",
        "en": "The region evolution forgot. Iron-ringed necks, umbrella-rib shells, three heads stacked in a pile — they all walk differently, yet all appear on schedule. (Fictional lore.)",
    },
    "deepfish": {
        "zh": "深海没有构图压力，所以随便长长就行。本分类居民一律表情听天由命，身上自带照明，牙比道理多。（本站虚构设定）",
        "en": "The deep sea applies no compositional pressure, so anything goes. Its residents look resigned, carry their own lighting, and own more teeth than sense. (Fictional lore.)",
    },
    "oddbirds": {
        "zh": "鸟纲之下、常识之上。脖子能吹萨克斯，嘴是汤勺，尾巴是小号，后背能冒蒸汽——本分类证明羽毛只是可选项。（本站虚构设定）",
        "en": "Below Aves, above common sense. Necks that play saxophones, beaks that are spoons, tails that are trumpets, backs that steam — proof that feathers are optional. (Fictional lore.)",
    },
}

# 素材故事：key 与 data/images.json 的 images[].id 对应（首批 38 件，其余分批补）
ITEM_STORIES = {
    "hero-t": {
        "zh": "本站看板小人老张，棕夹克、工装裤，AI 生成后抠成透明 PNG。他不出镜、不说话，只负责在宣传横幅里代表全站露一次脸。512×512，透明背景，随叫随到。（本站虚构设定）",
        "en": "Laozhang, the site's mascot: brown jacket, workwear, cut out to a transparent PNG. He never appears on camera or speaks — he simply represents the whole gallery once, in the hero banner. 512×512, transparent, on call. (Fictional lore.)",
    },
    "hero": {
        "zh": "老张的原始生成图，浅灰底未抠，本站留档版本。每个透明 PNG 背后都有一段不肯将就的灰底岁月，这就是。（本站虚构设定）",
        "en": "Laozhang's original generation on a light-grey background, kept uncut for the archive. Behind every transparent PNG lies a grey-background past it refuses to apologise for. (Fictional lore.)",
    },
    "alien-t": {
        "zh": "果克星人果克，绿皮大头，据张祥前《果克星球奇遇》描述生成。他来地球不为侵略，主要为图鉴提供一个大脑袋剪影。透明 PNG，512×512。（本站虚构设定）",
        "en": "Guck, a green big-headed alien generated from Zhang Xiangqian's Adventure on Planet Guck. He came to Earth not to invade but to supply the gallery with one great silhouette. Transparent PNG, 512×512. (Fictional lore.)",
    },
    "alien": {
        "zh": "果克星人立绘的未抠原图，灰底留档。外星人也需要一张不用解释的证件照，这就是。（本站虚构设定）",
        "en": "The uncut original of the Guck alien, archived on grey. Even aliens need one ID photo without explanations. (Fictional lore.)",
    },
    "engineer": {
        "zh": "技能验证时顺手画的女工程师，漫画风、护目镜、工具带齐全。她不属于任何项目，只属于那次「让我试试」。（本站虚构设定）",
        "en": "A comic-style engineer drawn during a skill check — goggles and tool belt complete. She belongs to no project, only to that one let-me-try. (Fictional lore.)",
    },
    "gucck-female": {
        "zh": "女果克星人，雪青螺旋发、钻石大眼、粉白发光肌肤，虚拟光膜裙。按原著设定，她的裙子是光做的，而且从不静电。（本站虚构设定）",
        "en": "A female Guck alien with lilac spiral hair, diamond eyes and glowing pink-white skin in a light-film dress. Per the source lore the dress is made of light — and never static. (Fictional lore.)",
    },
    "gucck-male": {
        "zh": "男果克星人，黑亮贴头皮短发、大薄尖耳、粉白精致肌肤。耳朵大是为了听清地球人把价格听错的那部分。（本站虚构设定）",
        "en": "A male Guck alien with glossy black cropped hair, large thin pointed ears and fine pink-white skin. The ears are for catching the part where Earthlings mishear the price. (Fictional lore.)",
    },
    "gucck-neutral": {
        "zh": "中性果克星人，长相介于男女之间，无皱粉白肌肤。果克星户籍系统对此只有一栏：果克星人。（本站虚构设定）",
        "en": "A neutral Guck alien of androgynous look and smooth pink-white skin. The planetary registry has exactly one box for them. (Fictional lore.)",
    },
    "gucck-virtual": {
        "zh": "人工场生成的虚拟人，只显上半身的全息投影。按设定它没有下半身，因为没必要——投影只到腰。（本站虚构设定）",
        "en": "A holographic figure generated by an artificial field, shown only from the waist up. Per the lore it has no lower half — unnecessary, since the projection stops there. (Fictional lore.)",
    },
    "gucck-splitter": {
        "zh": "拆分人，身体可拆成碧玉蓝条状、又能迅速复原。果克星工伤理赔中最难定残的一类。（本站虚构设定）",
        "en": "A splitter whose body separates into jade-blue strips and reassembles instantly — the hardest disability claim to assess on Guck. (Fictional lore.)",
    },
    "figure-chef": {
        "zh": "系着围裙的胖厨师，漫画式爆发光晕。他炒的菜从不出图，因为本站只收立绘，不收餐。（本站虚构设定）",
        "en": "A plump chef in an apron with a comic burst of glow. His dishes never make it into the gallery — it collects character art, not meals. (Fictional lore.)",
    },
    "figure-grandpa": {
        "zh": "白胡子老爷爷，皱纹和衣纹细节扎实。按本站规矩，长者的每道皱纹都要经得起放大镜和甲方。（本站虚构设定）",
        "en": "A white-bearded elder with solid wrinkles and fabric detail. House rule: an elder's every wrinkle must survive both a loupe and the client. (Fictional lore.)",
    },
    "motion-mining": {
        "zh": "小人挖矿循环动图，镐起火花落，三秒一个周期。他挖的矿不存在，但循环很认真。（本站虚构设定）",
        "en": "A looping animation of a little figure mining — pick up, sparks down, three seconds a cycle. The ore doesn't exist; the loop is earnest. (Fictional lore.)",
    },
    "motion-fishing": {
        "zh": "小人钓鱼循环动图，鱼竿弯、浮漂沉。钓不钓得到鱼另说，主要是水面的构图不能输。（本站虚构设定）",
        "en": "A looping fishing animation: rod bent, bobber sunk. Whether a fish is caught is secondary — the water's composition must not lose. (Fictional lore.)",
    },
    "motion-shooting": {
        "zh": "小人射击循环动图，枪口焰、弹壳跳。三秒内完成一次专业的无效输出，职场看了都眼熟。（本站虚构设定）",
        "en": "A looping shooting animation: muzzle flash, casing tumbling — one professional bout of futility every three seconds. The workplace would recognise it. (Fictional lore.)",
    },
    "wpn-hammer": {
        "zh": "战锤，锤头比道理大的经典款。本站武器栏的销售冠军，成交理由通常是「看着就疼」。（本站虚构设定）",
        "en": "A war hammer of the classic head-over-reason design — the bestseller of the weapons shelf, usually bought because it looks like it hurts. (Fictional lore.)",
    },
    "ammo-shell": {
        "zh": "黄铜弹壳，弹药的标本形态。它已经完成了全部使命，现在负责在抽屉里被人反复把玩。（本站虚构设定）",
        "en": "A brass shell in its specimen form. Its mission is complete; it now serves by being idly turned over in a drawer. (Fictional lore.)",
    },
    "cr-cat": {
        "zh": "黑猫立绘，本站动物栏在编职员。职责是坐在透明背景上维持高冷，偶尔客串徽章。（本站虚构设定）",
        "en": "A black cat, staff member of the animals section. Duty: sit on a transparent background and stay aloof, with occasional badge cameos. (Fictional lore.)",
    },
    "food-ramen": {
        "zh": "豚骨拉面，永远刚出锅的完美瞬间。香气无法通过 PNG 传输，这是本站最大的技术缺口。（本站虚构设定）",
        "en": "Tonkotsu ramen at its perfect just-served moment. That aroma cannot pass through PNG remains the site's largest technical gap. (Fictional lore.)",
    },
    "veh-spaceship": {
        "zh": "复古火箭飞船，尾翼比烟囱粗。它不在乎空气动力学，它忠于一代人的登月想象。（本站虚构设定）",
        "en": "A retro rocket ship with fins thicker than chimneys. Aerodynamics bores it; it stays loyal to a generation's moon-landing imagination. (Fictional lore.)",
    },
    "aliens-crystal-crawler": {
        "zh": "水晶甲壳爬行者，异星生物栏的常驻住户。它爬得很慢，但每爬一步都像在走红毯。（本站虚构设定）",
        "en": "A crystal-carapace crawler, resident of the aliens section. It crawls slowly, yet every step lands like a red carpet. (Fictional lore.)",
    },
    "flora-spiral-vine": {
        "zh": "螺旋星藤，异星植物栏人气第一。它不追逐阳光，只负责把藤蔓盘成让构图老师点头的形状。（本站虚构设定）",
        "en": "The spiral star-vine, top of the alien flora charts. It chases no sun — it coils only into shapes that please composition teachers. (Fictional lore.)",
    },
    "stone-flint-axe": {
        "zh": "燧石战斧，石器时代的开源硬件。没有说明书，没有保修，握把就是全部人机工学。（本站虚构设定）",
        "en": "A flint axe — the stone age's open-source hardware. No manual, no warranty; the grip is the entire ergonomics. (Fictional lore.)",
    },
    "potion-magenta-cone": {
        "zh": "品红锥形瓶，颜色越不可能越有效系列。喝下去会怎样，瓶身上没写，本站也不打算写。（本站虚构设定）",
        "en": "A magenta conical flask from the more-improbable-colour-more-potent line. What happens if you drink it is not on the label, nor planned. (Fictional lore.)",
    },
    "book-grimoire": {
        "zh": "血红法典，烫金封面，会自己翻页。本站只借不卖，而且不保证任何人读到第三章。（本站虚构设定）",
        "en": "A blood-red grimoire with gilt cover and self-turning pages. Lend-only, never sold — and no one is guaranteed chapter three. (Fictional lore.)",
    },
    "impl-wand": {
        "zh": "月牙魔杖，法器界的入门款。拿在谁手里都像主角，这是它经久不销的原因。（本站虚构设定）",
        "en": "A crescent wand, entry-level among implements. It makes any holder look like the protagonist — hence its lasting sales. (Fictional lore.)",
    },
    "castle-cloud": {
        "zh": "浮空岛堡，建筑规范全部作废。住在这里的公主一般自己打怪，快递只送到云层以下。（本站虚构设定）",
        "en": "A floating-island keep with every building code void. Princesses here slay their own monsters; delivery stops below the clouds. (Fictional lore.)",
    },
    "furn-table": {
        "zh": "旧橡木长桌，古旧家具栏的台柱。桌面的每道裂纹都是岁月的正版防伪标，不支持打磨消除。（本站虚构设定）",
        "en": "The old oak table, pillar of the furniture section. Every crack in it is time's authentic anti-counterfeit mark; sanding is not supported. (Fictional lore.)",
    },
    "tech-holo": {
        "zh": "全息投影仪，奇械科技栏的门面。线头比功能多，但亮起来那一刻，全场都原谅了它。（本站虚构设定）",
        "en": "A holo-projector, face of the tech section: more cables than functions — yet when it lights up, the room forgives everything. (Fictional lore.)",
    },
    "xeno-prism-stalker": {
        "zh": "折光伏击者，异星猎食栏的刺客。它捕猎不为果腹，主要为构图——进图鉴比进晚餐更永恒。（本站虚构设定）",
        "en": "A prism ambush predator, assassin of the xenohorror section. It hunts for composition, not food — a gallery outlasts a dinner. (Fictional lore.)",
    },
    "zone-bass": {
        "zh": "低音核徽章，别在胸前不涨工资。但它能明确传达：此人有所热爱，且热爱有声。（本站虚构设定）",
        "en": "A bass-core badge that raises no salary — yet it clearly states its wearer loves something, audibly. (Fictional lore.)",
    },
    "planet-shard-ring": {
        "zh": "碎环星，星球徽志库的在编星球。它不公转，只负责在深蓝背景上保持破碎的好看。（本站虚构设定）",
        "en": "The shattered-ring planet, registered in the sigil archive. It orbits nothing; it merely stays beautifully broken on deep blue. (Fictional lore.)",
    },
    "inst-snail-horn": {
        "zh": "螺壳号，古怪乐器栏的铜管部荣誉会员。音准由演奏者的信心决定，退堂鼓除外。（本站虚构设定）",
        "en": "A shell horn, honorary brass of the odd instruments. Pitch is set by the player's confidence — except for retreat calls. (Fictional lore.)",
    },
    "phys-ballista": {
        "zh": "扭力弩炮，物理武器栏的正经机械。在魔法横行的站里，它代表最后的工程学尊严。（本站虚构设定）",
        "en": "A torsion ballista, honest machine of the physics section — engineering's last dignity on a magic-filled site. (Fictional lore.)",
    },
    "scare-pumpkin": {
        "zh": "南瓜四臂，变异稻草人栏的劳模。农田雇它防鸟，现在它主要防的是访客的胆量。（本站虚构设定）",
        "en": "A four-armed pumpkin, model worker of the scarecrow section. Farms hired it against birds; it now guards visitors' courage. (Fictional lore.)",
    },
    "fang-maw": {
        "zh": "环牙巨口，多牙生物栏的门面。牙齿数量经过审计，每一颗都有排班表，下岗的会补种。（本站虚构设定）",
        "en": "A ringed maw, face of the fangs section. The tooth count is audited; every fang keeps a roster, and retirees are replaced. (Fictional lore.)",
    },
    "astone-levi": {
        "zh": "熔裂石，古怪外星石头栏的样品。它不说话，但每一道纹理都是亿万年的会议纪要。（本站虚构设定）",
        "en": "A fused-crack stone, specimen of the alien rocks. It says nothing, yet every vein is minutes from a billion-year meeting. (Fictional lore.)",
    },
    "monstertoys-squishball": {
        "zh": "被踩瘪过又用干掉的橙胶水胡乱补过的独眼弹力球，门牙是它最后的体面。1024×1024 透明 PNG，专治各种手痒。（本站虚构设定）",
        "en": "A one-eyed rubber ball patched with dried orange glue after one too many stomps; the buck tooth is its last dignity. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "monstertoys-chewbone": {
        "zh": "一根咬痕累累的米白大骨，末端的小怪兽牙床永远停在咬到一半的姿势。1024×1024 透明 PNG，狗见愁。（本站虚构设定）",
        "en": "A gnawed ivory-white bone whose little monster jaw is frozen mid-bite. 1024×1024 transparent PNG, the despair of dogs. (Fictional lore.)",
    },
    "monstertoys-yarnball": {
        "zh": "一团炸了线的毛线球，顶上的小怪兽比球还愁。芥末黄、珊瑚红与蓝绿条纹证明它至少被三只猫嫌弃过。1024×1024 透明 PNG。（本站虚构设定）",
        "en": "A frayed yarn ball whose rider looks more worried than the ball itself; the mustard, coral and teal stripes prove at least three cats have judged it. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "monstertoys-windup": {
        "zh": "上满发条能走三步半的铁皮小怪兽，耳朵缺口是出厂时就有的工伤。1024×1024 透明 PNG，褪色红配奶白，锈斑随赠。（本站虚构设定）",
        "en": "A wind-up tin monster that walks exactly three and a half steps per winding; the chipped ear was a factory injury. 1024×1024 transparent PNG, faded red on cream, rust included. (Fictional lore.)",
    },
    "monstertoys-balloon": {
        "zh": "一只紫绿气球拧成的瘦长怪，肚皮上那块银胶带是它对漏气最后的抵抗。1024×1024 透明 PNG，拧得越用力越怂。（本站虚构设定）",
        "en": "A teal-and-purple balloon beast; the silver tape on its belly is its last stand against a slow leak. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "monstertoys-plushie": {
        "zh": "灰粉、芥末与灰格纹拼了一身的毛绒怪，一颗纽扣眼已经想离职。背上的拉链半开，棉花随时准备出走。1024×1024 透明 PNG。（本站虚构设定）",
        "en": "A patchwork plush in grey-pink, mustard and check; one button eye has already resigned, and the half-open back zip lets the stuffing contemplate escape. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "oddbeasts-jitterstag": {
        "zh": "脖子上套了几十个锈铁环的长颈怪，走一步响一串，堪称自带音效。1024×1024 透明 PNG，呆滞是保护色。（本站虚构设定）",
        "en": "A long-necked beast wearing several dozen rusty iron rings; every step comes with sound effects. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "oddbeasts-umbrellnail": {
        "zh": "背着一把散了架的破雨伞当壳的蜗牛，两根弯三根断，走得比谁都小心。1024×1024 透明 PNG，怯生生是日常。（本站虚构设定）",
        "en": "A snail carrying the bare skeleton of a broken umbrella as its shell; two ribs bent, three snapped. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "oddbeasts-stitchmutt": {
        "zh": "一嘴被黄铜拉链缝死的杂犬，从此再也没法乱叫。拼布身上东一块西一块，针脚粗得很有诚意。1024×1024 透明 PNG。（本站虚构设定）",
        "en": "A stray mutt whose mouth is zipped shut with a small brass fastener; the patchwork stitching is boldly sincere. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "oddbeasts-stackhound": {
        "zh": "三只猎犬叠成三层还咬成一个环，谁也不敢先松口。1024×1024 透明 PNG，六条腿两排编制。（本站虚构设定）",
        "en": "Three hounds stacked into a biting loop, and nobody dares let go first. 1024×1024 transparent PNG, six legs in two rows. (Fictional lore.)",
    },
    "oddbeasts-bellowsaur": {
        "zh": "腰上绑裂皮风箱的胖蜥蜴，嘴巴专职噗噗吐云。1024×1024 透明 PNG，懒洋洋是它的法定表情。（本站虚构设定）",
        "en": "A chubby lizard with a cracked bellows strapped to its waist, its mouth professionally puffing small clouds. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "oddbeasts-candystag": {
        "zh": "四条腿是拐杖糖、鹿角挂满糖果的胖驯鹿，连鼻子都舔过一口。1024×1024 透明 PNG，甜是唯一人设。（本站虚构设定）",
        "en": "A plump reindeer on candy-cane legs with sweets hung from its antlers; even its nose has been licked. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "deepfish-angler": {
        "zh": "提着一盏灯笼满深海找观众的鮟鱇，灯罩里那小怪兽剪影至今没解释。1024×1024 透明 PNG，对眼是天赋。（本站虚构设定）",
        "en": "An anglerfish carrying its lamp through the deep in search of an audience; the shadow inside the shade remains unexplained. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "deepfish-tubelye": {
        "zh": "眼睛长在两根玻璃管顶端的小鱼，吞下去的弹珠至今没消化。1024×1024 透明 PNG，半透明身子不藏事。（本站虚构设定）",
        "en": "A jelly-pink fish whose eyes sit on two long glass tubes; the marble it swallowed remains undigested. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "deepfish-viper": {
        "zh": "一嘴獠牙永远合不拢的蝰鱼，笑是假的笑，惊慌是真的。1024×1024 透明 PNG，额头还多长了一只眼睛负责害怕。（本站虚构设定）",
        "en": "A viperfish whose fangs never quite close; the grin is fake, the panic is real, and the third eye on its forehead handles the fear. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "deepfish-oarfish": {
        "zh": "身子拉成一条飘带的皇带鱼，红背鳍像把缺齿的梳子。1024×1024 透明 PNG，委屈是它游得慢的原因。（本站虚构设定）",
        "en": "An oarfish stretched into a ribbon, its red dorsal fin a comb with missing teeth. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "deepfish-blob": {
        "zh": "本站表情最听天由命的居民，整条鱼像化开了一半。1024×1024 透明 PNG，苦脸是泡在水里的好处。（本站虚构设定）",
        "en": "The gallery's most resigned resident, half-melted into its own gloom. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "deepfish-hermit": {
        "zh": "背着怪兽骷髅头当壳的寄居蟹，一大一小两只钳子分工明确。1024×1024 透明 PNG，斜眼偷瞄是职业病。（本站虚构设定）",
        "en": "A hermit crab wearing a grinning monster skull as its shell, one claw giant and one tiny. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "oddbirds-saxvulture": {
        "zh": "脖子是一支旧铜萨克斯的秃鹫，专吹悲伤调子。1024×1024 透明 PNG，愁珠随步伐晃。（本站虚构设定）",
        "en": "A scruffy vulture whose neck is an old brass saxophone, forever playing the blues. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "oddbirds-spoonheron": {
        "zh": "嘴是一把漏勺的苍鹭，站水里半天也舀不起一条鱼。1024×1024 透明 PNG，没睡醒是装出来的。（本站虚构设定）",
        "en": "A heron whose beak is a giant slotted spoon; hours in the water, zero fish. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "oddbirds-trumpetparrot": {
        "zh": "尾巴是一支磕瘪小号的鹦鹉，一开口就是全场最大声。1024×1024 透明 PNG，亢奋得理直气壮。（本站虚构设定）",
        "en": "A parrot whose tail is a dented brass trumpet, the loudest voice in any room. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "oddbirds-postostrich": {
        "zh": "邮包撑到爆满的鸵鸟邮差，嘴里一封头顶一封，还有一封在路上。1024×1024 透明 PNG，急切是职业素养。（本站虚构设定）",
        "en": "An ostrich postman bursting at the seams; one letter in beak, one on head, more on the way. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "oddbirds-kettlepenguin": {
        "zh": "头顶茶壶嘴冒蒸汽的企鹅，白肚皮上画着大茶杯。1024×1024 透明 PNG，困意与茶香一起出厂。（本站虚构设定）",
        "en": "A penguin with a steaming spout on its head and a teacup printed on its belly. 1024×1024 transparent PNG. (Fictional lore.)",
    },
    "oddbirds-cuckoo": {
        "zh": "雕成小木屋样子的布谷鸟，肚皮小门敞着等人报时。1024×1024 透明 PNG，准时是祖传的。（本站虚构设定）",
        "en": "A cuckoo carved like a mountain cabin, its little door open and waiting to announce the hour. 1024×1024 transparent PNG. (Fictional lore.)",
    },
}
