# -*- coding: utf-8 -*-
"""smallfigure 故事解说文案库（tools/stories_data.py）

写作规范（内容策略组定）：
- 单篇 2-3 句、中文 60-110 字；英文 25-45 词
- 语气：博物馆解说牌式的冷幽默，不堆形容词、不喊口号
- 每篇必含：来历 + 形态特征或可验证规格 + 世界观用途/轶事
- **每张图的故事都必须不同**（build_stories.py 会查重并报警）
- 故事正文内**不写**任何 AI/虚构声明：全站声明统一在页脚 footer.ai 一处披露，
  灯箱 meta 保留「生成方式: AI 生成」，不逐图重复标识
- 新增素材后在这里补条目，跑 tools/build_stories.py 产出 data/stories.json
"""

# 分类故事：key 与 data/images.json 的 categories[].key 对应
CAT_STORIES = {
    "characters": {
        "zh": "本站人口第一大户。老张领着果克星人和一干漫画风小人住在这里，职责是给各类项目当立绘、当看板、当吉祥物。按图鉴规矩，他们都不露脸给摄像头看，只以透明 PNG 形态出门。",
        "en": "The gallery's largest household. Led by Laozhang alongside the Guck aliens and a cast of comic-style figures, they serve as character art, mascots and poster faces. Per house rules they never face a camera — they only go out as transparent PNGs.",
    },
    "weapons": {
        "zh": "冷兵器与奇械的中间地带，每件都认真权衡过杀伤力与造型的平衡。事实证明，一把武器要想被记住，锤头比道理更重要。",
        "en": "The middle ground between cold steel and odd machinery, where every piece has weighed lethality against silhouette. A weapon, it turns out, is remembered for its head rather than its reasoning.",
    },
    "ammo": {
        "zh": "全站最没耐心的分类：存在的意义就是被用完。黄铜、底火与纸壳陈列在这里，纯属工伤。",
        "en": "The most impatient category on the site: their whole purpose is to be spent. Brass, primers and paper shells — displayed here purely as occupational injury.",
    },
    "animals": {
        "zh": "从黑猫到渡鸦，本站的动物一律不拆家，只负责在透明背景上维持体面。饲养它们不需要猫砂，需要的是 PNG 的 Alpha 通道。",
        "en": "From black cats to ravens, the site's animals never wreck the house — they merely hold their composure on a transparent background. Keeping them requires no litter box, just a PNG alpha channel.",
    },
    "food": {
        "zh": "拉面、蛋糕与可疑罐头。本站的食物永远停在刚出锅的完美瞬间，而且永远吃不到——这是图鉴的残忍之处。",
        "en": "Ramen, cake and tins of dubious content. The food here is forever at its perfect just-served moment, and forever inedible — such is the cruelty of a gallery.",
    },
    "vehicles": {
        "zh": "从复古火箭到碟形光束船，动力系统一律不可考。但只要背景是星空，速度感就成立。",
        "en": "From retro rockets to disc-shaped beam ships, the propulsion is unverifiable — but against a starfield, a sense of speed simply holds.",
    },
    "aliens": {
        "zh": "果克星球及周边星域的原住民集中区。大头、多眼、甲壳与凝胶是本地四大主流长相，审美统一得令人怀疑他们有同一个居委会。",
        "en": "The natives of Guck and neighbouring systems. Big heads, many eyes, carapace and gel are the four local looks — so unified you suspect a single neighbourhood committee.",
    },
    "flora": {
        "zh": "不进行光合作用，主要进行造型竞争。螺旋星藤在本分类常年人气第一，因为它连缠绕都缠得很有构图意识。",
        "en": "No photosynthesis here — only a competition in silhouette. The spiral star-vine tops the category year-round because even its coiling shows compositional awareness.",
    },
    "stoneage": {
        "zh": "燧石、骨器与兽皮，人类最早的一批开源硬件。本站收藏它们，是为了提醒后人：好设计不需要充电口。",
        "en": "Flint, bone and hide — humanity's first open-source hardware. Collected here to remind later generations that good design needs no charging port.",
    },
    "potions": {
        "zh": "品红、幽蓝、荧光绿，颜色越不可能越有效。本分类所有瓶子的保质期都是永远，功效请自行想象。",
        "en": "Magenta, abyssal blue, fluorescent green — the more improbable the colour, the more potent. Every bottle here keeps forever; effects are left to your imagination.",
    },
    "books": {
        "zh": "血皮、烫金、会自己翻页。本站的法典一律只借不卖，而且不保证读完。",
        "en": "Blood-red leather, gilt edges, pages that turn themselves. The grimoires here are lend-only, never sold — and completion is not guaranteed.",
    },
    "implements": {
        "zh": "魔杖、护符与来路不明的发光棍子。共同点是：拿在谁手里都像主角，这就是法器界的公平。",
        "en": "Wands, talismans and glowing sticks of unclear origin. Their shared trait: whoever holds one looks like the protagonist — the great fairness of implements.",
    },
    "castles": {
        "zh": "浮空岛堡与山坡石堡，建筑规范全部作废，唯一起重机是想象力。住在这里的公主一般自己打怪。",
        "en": "Floating-island forts and hillside stone keeps, with every building code void — the only crane is imagination. Princesses here typically slay their own monsters.",
    },
    "furniture": {
        "zh": "旧橡木长桌领衔。每件家具都自带一段没人记得的往事，以及恰到好处的裂纹——那是岁月的正版防伪标。",
        "en": "Led by the old oak table, each piece carries a past no one recalls and a perfectly placed crack — time's authentic anti-counterfeit mark.",
    },
    "techdev": {
        "zh": "全息投影仪与来路不明的读数装置。本站科技树的特征是：线头比功能多，但看着就是很厉害。",
        "en": "Holo-projectors and dials of unclear purpose. The site's tech tree is defined by more cables than functions — yet it always looks impressive.",
    },
    "xenohorror": {
        "zh": "折光伏击者等掠食者专区。它们捕猎不为果腹，主要为构图——毕竟出现在图鉴里比出现在晚餐里更永恒。",
        "en": "A zone for ambush predators. They hunt not for food but for composition — appearing in a gallery, after all, outlasts appearing in a dinner.",
    },
    "badges": {
        "zh": "低音核、蒸汽卡车与步枪，三枚一组的小型荣誉体系。别在胸前不涨工资，但能明确传达「此人有所热爱」。",
        "en": "Bass cores, steam trucks and rifles — a compact honours system in sets of three. They raise no salary, but they clearly state that this person loves something.",
    },
    "planets": {
        "zh": "碎环星领衔的星球徽章库，每颗星都经过认真的虚构登记。它们不公转，只负责在深蓝背景上好看。",
        "en": "A registry of planet sigils led by the shattered-ring world, each formally fictional. They orbit nothing; their duty is to look good on deep blue.",
    },
    "motion": {
        "zh": "挖矿、钓鱼、射击三个循环小动画，Remotion 一帧帧渲染出来的。小人们活得很充实，而且永远不会累。",
        "en": "Three looping animations — mining, fishing, shooting — rendered frame by frame in Remotion. The little figures live full lives and never tire.",
    },
    "instruments": {
        "zh": "螺壳号与 U 形琴，吹奏效果一律待考。本站乐器的音准由演奏者的信心决定。",
        "en": "Shell horns and U-shaped zithers, all of unverified effect. Here an instrument's pitch is decided by the player's confidence.",
    },
    "physics": {
        "zh": "弩炮与天平，靠杠杆和扭力吃饭的正经机械。在魔法横行的站里，它们代表最后的工程学尊严。",
        "en": "Ballistae and balances — honest machines fed by leverage and torsion. On a site full of magic, they stand for engineering's last dignity.",
    },
    "scarecrows": {
        "zh": "南瓜头、四臂、会自己挪位置。农田雇它们防鸟，现在它们主要防的是访客的胆量。",
        "en": "Pumpkin heads, four arms and a habit of relocating overnight. Farms hired them against birds; nowadays they guard against visitors' courage.",
    },
    "fangs": {
        "zh": "环牙巨口挂帅。本分类的牙齿数量经过审计，每一颗都有排班表。",
        "en": "Led by the ringed maw, the tooth count here has been audited — every fang keeps a roster.",
    },
    "astones": {
        "zh": "熔裂石与结晶岩，外星地质学的样品柜。它们不说话，但每一道纹理都是亿万年的会议纪要。",
        "en": "Fused stones and crystal rocks — the sample cabinet of alien geology. They say nothing, yet every vein is minutes from a billion-year meeting.",
    },
    "currency": {
        "zh": "星纹圆币等外星通货。本站一律不设汇率，因为拿回地球也花不出去。",
        "en": "Alien currency such as star-patterned discs. No exchange rate is published — none of it spends back on Earth.",
    },
    "symbols": {
        "zh": "青铜符碑上的未知文字，语法完整但无人能读。破译工作本站已外包给未来。",
        "en": "Unknown scripts on bronze steles — complete grammar, no readers. Deciphering has been outsourced to the future.",
    },
    "ships": {
        "zh": "碟形光束船领衔。本分类飞船的泊位一律设在图鉴背景的星空里，违章不贴条。",
        "en": "Led by the disc-shaped beam ship, all craft here berth in the gallery's starfield — parking violations are not ticketed.",
    },
    "spaceweapons": {
        "zh": "青光能量步枪等。设计原则是把杀伤力做成肉眼可见的样子，毕竟真空里没人听得见巨响。",
        "en": "Cyan energy rifles and the like, designed so lethality is visible — in a vacuum nobody hears the bang anyway.",
    },
    "flyboots": {
        "zh": "喷气皮靴，个人航空的最短路径。本分类不提供降落伞退款服务。",
        "en": "Jet boots — the shortest path to personal aviation. No parachute refunds in this category.",
    },
    "shields": {
        "zh": "铆钉木圆盾等。防御面积与审美面积成正比，这是本分类唯一的物理学。",
        "en": "Riveted wooden rounds and the like. Here coverage scales with beauty — the category's only physics.",
    },
    "energyblocks": {
        "zh": "星核晶块等发光方块。握在手里会让人想喊口号，本站对此现象不做解释。",
        "en": "Glowing cubes such as the star core. Held in hand they inspire shouting; this site offers no explanation.",
    },
    "morphmonsters": {
        "zh": "凝胶变形兽，形态自由。本分类的物种边界由心情决定。",
        "en": "Gel morph-beasts of free form. Species boundaries here are decided by mood.",
    },
    "telescopes": {
        "zh": "U 形怀表镜等。看远处很清楚，看近处更不清楚——本分类的统一遗憾。",
        "en": "U-shaped pocket scopes and the like: excellent at distance, worse up close — the category's shared regret.",
    },
    "crafts": {
        "zh": "手绣花布胸针领衔的暖土色手作系。本站刻意避开霓虹科技风之后，针脚终于有了落脚处。",
        "en": "A warm-earth handmade line led by embroidered brooches. After deliberately avoiding neon tech, the stitches finally found a home.",
    },
    "riders": {
        "zh": "青铜面具武士骑六足蜈蚣。坐骑越冷门，武士的气场越稳，这是本分类的守恒律。",
        "en": "Bronze-masked warriors astride six-legged centipedes. The more obscure the mount, the steadier the aura — a conservation law here.",
    },
    "bgun": {
        "zh": "兽角喇叭铳等怪奇手作风火器。材质一律奇诡，扳机手感由想象力提供。",
        "en": "Horn-trumpet guns and other hand-made oddities, of curious make — trigger feel supplied by imagination.",
    },
    "modern": {
        "zh": "外卖骑手领衔的现代日常职业装束小人。他们不上朝，只上工，装束扁平但心事矢量。",
        "en": "Modern-daily figures led by the delivery rider. They attend no court, only work — flat of costume, vector of worry.",
    },
    "oldfolk": {
        "zh": "护目镜怪老头等。本分类老人的年龄介于「很久」与「非常久」之间，道具比岁数更说明问题。",
        "en": "Goggle-wearing eccentrics and the like, aged between quite old and very old — their props explain more than their years.",
    },
    "imp": {
        "zh": "火苗小鬼等。破坏力与身高成正比，闯祸后的道歉速度也是。",
        "en": "Flame imps and the like, whose destructive power scales with height — as does the speed of their apologies.",
    },
    "flybeast": {
        "zh": "鬃毛翼狮兽等。起飞不需要跑道，降落看心情。",
        "en": "Maned winged lions and the like: takeoff needs no runway; landing depends on mood.",
    },
    "oddplants": {
        "zh": "笑脸蛛腿花领衔。本分类的授粉工作由错觉完成。",
        "en": "Led by the smiling spider-leg flower, pollination here is performed by illusion.",
    },
    "jewels": {
        "zh": "太阳脸金项坠等。本分类的金属光泽经过审计，耀眼光度全部真实。",
        "en": "Sun-faced gold pendants and the like, with audited metal lustre — the shine is entirely real.",
    },
    "fairykid": {
        "zh": "羽衣仙童等胖娃娃中式仙童。不腾云，只迈着小短腿赶路，仙气全靠表情撑住。",
        "en": "Feather-robed chubby immortal children who never ride clouds — only hurry on short legs, bearing their air entirely on expression.",
    },
    "foodjar": {
        "zh": "泡星光罐等。内容物不可名状，保存期限写的是「直到世界尽头」。",
        "en": "Star-pickle jars and the like, of unnameable contents, stamped best before the end of the world.",
    },
    "hairyboot": {
        "zh": "卷毛短靴领衔。保暖性能存疑，卖萌性能超标。",
        "en": "Led by curly-haired ankle boots: warmth unverified, cuteness over quota.",
    },
    "oddbug": {
        "zh": "多眼毛虫等。本分类的复眼数量经不起细数，建议远观。",
        "en": "Many-eyed caterpillars and the like — the compound eyes defy counting, so viewing from afar is advised.",
    },
    "constellation": {
        "zh": "茶壶座等虚构星点连线。天文学界尚未承认，酒吧讲故事的场合已经常用。",
        "en": "Fictional constellations such as the Teapot — unacknowledged by astronomy, already common at bars.",
    },
    "nonsense": {
        "zh": "顶鱼礼帽先生领衔。逻辑已让位，体面仍在维持，这就是本分类的表演张力。",
        "en": "Led by the fish-hatted gentleman: logic has abdicated yet dignity holds — that is the category's tension.",
    },
    "retrofolk": {
        "zh": "迪斯科舞王等复古故事书风冷脸人物。他们从旧画报里走出来，对新时代保持礼貌的冷淡。",
        "en": "Disco kings and other cold-faced storybook retros, stepped out of old magazines, politely cool toward the new age.",
    },
    "fusionfolk": {
        "zh": "滑板侠客等。时间线在他们身上达成了幽默的和解。",
        "en": "Skateboarding knights-errant and the like — timelines reach a humorous settlement on them.",
    },
    "blades": {
        "zh": "弯钩齿轮镰等手动近战冷兵器。形状越诡异，越说明设计者没打算让它量产。",
        "en": "Hook-gear scythes and other melee oddities — the stranger the shape, the clearer it was never meant for mass production.",
    },
    "giantfolk": {
        "zh": "弯角杂货巨人等。体型是优势也是货架：他们兼职给小镇当移动商店。",
        "en": "Twist-horned grocery giants and the like, whose size is both advantage and shelf — they double as the town's mobile shop.",
    },
    "skulls": {
        "zh": "齿轮骷髅等。骨头与机械的合资企业，死后比生前更有结构感。",
        "en": "Gearwork skulls and the like — bone-and-machine joint ventures, more structured in death than in life.",
    },
    "oddweapons": {
        "zh": "扳手权杖等。工具与武器的身份争议在本分类长期悬置。",
        "en": "Wrench sceptres and the like, where the tool-or-weapon question stays permanently open.",
    },
    "monstertoys": {
        "zh": "被小孩玩坏、又被缝补起来的玩具们的再就业现场。橡胶、铁皮、毛线与针线在本分类和平共处，共同原则是：一只眼睛也照样营业。",
        "en": "Where toys broken by children come back for a second career. Rubber, tin, yarn and stitching coexist here under one rule: one eye is still open for business.",
    },
    "oddbeasts": {
        "zh": "进化论管不到的地区。长颈套铁环的、拿伞骨当壳的、三头叠一摞的，走法各不相同，但都准时出现在图鉴里亮相。",
        "en": "The region evolution forgot. Iron-ringed necks, umbrella-rib shells, three heads stacked in a pile — they all walk differently, yet all appear on schedule.",
    },
    "deepfish": {
        "zh": "深海没有构图压力，所以随便长长就行。本分类居民一律表情听天由命，身上自带照明，牙比道理多。",
        "en": "The deep sea applies no compositional pressure, so anything goes. Its residents look resigned, carry their own lighting, and own more teeth than sense.",
    },
    "oddbirds": {
        "zh": "鸟纲之下、常识之上。脖子能吹萨克斯，嘴是汤勺，尾巴是小号，后背能冒蒸汽——本分类证明羽毛只是可选项。",
        "en": "Below Aves, above common sense. Necks that play saxophones, beaks that are spoons, tails that are trumpets, backs that steam — proof that feathers are optional.",
    },
}

# 素材故事：key 与 data/images.json 的 images[].id 对应（首批 38 件，其余分批补）
ITEM_STORIES = {
    "hero-t": {
        "zh": "本站看板小人老张，棕夹克、工装裤，AI 生成后抠成透明 PNG。他不出镜、不说话，只负责在宣传横幅里代表全站露一次脸。512×512，透明背景，随叫随到。",
        "en": "Laozhang, the site's mascot: brown jacket, workwear, cut out to a transparent PNG. He never appears on camera or speaks — he simply represents the whole gallery once, in the hero banner. 512×512, transparent, on call.",
    },
    "hero": {
        "zh": "老张的原始生成图，浅灰底未抠，本站留档版本。每个透明 PNG 背后都有一段不肯将就的灰底岁月，这就是。",
        "en": "Laozhang's original generation on a light-grey background, kept uncut for the archive. Behind every transparent PNG lies a grey-background past it refuses to apologise for.",
    },
    "alien-t": {
        "zh": "果克星人果克，绿皮大头，据张祥前《果克星球奇遇》描述生成。他来地球不为侵略，主要为图鉴提供一个大脑袋剪影。透明 PNG，512×512。",
        "en": "Guck, a green big-headed alien generated from Zhang Xiangqian's Adventure on Planet Guck. He came to Earth not to invade but to supply the gallery with one great silhouette. Transparent PNG, 512×512.",
    },
    "alien": {
        "zh": "果克星人立绘的未抠原图，灰底留档。外星人也需要一张不用解释的证件照，这就是。",
        "en": "The uncut original of the Guck alien, archived on grey. Even aliens need one ID photo without explanations.",
    },
    "engineer": {
        "zh": "技能验证时顺手画的女工程师，漫画风、护目镜、工具带齐全。她不属于任何项目，只属于那次「让我试试」。",
        "en": "A comic-style engineer drawn during a skill check — goggles and tool belt complete. She belongs to no project, only to that one let-me-try.",
    },
    "gucck-female": {
        "zh": "女果克星人，雪青螺旋发、钻石大眼、粉白发光肌肤，虚拟光膜裙。按原著设定，她的裙子是光做的，而且从不静电。",
        "en": "A female Guck alien with lilac spiral hair, diamond eyes and glowing pink-white skin in a light-film dress. Per the source lore the dress is made of light — and never static.",
    },
    "gucck-male": {
        "zh": "男果克星人，黑亮贴头皮短发、大薄尖耳、粉白精致肌肤。耳朵大是为了听清地球人把价格听错的那部分。",
        "en": "A male Guck alien with glossy black cropped hair, large thin pointed ears and fine pink-white skin. The ears are for catching the part where Earthlings mishear the price.",
    },
    "gucck-neutral": {
        "zh": "中性果克星人，长相介于男女之间，无皱粉白肌肤。果克星户籍系统对此只有一栏：果克星人。",
        "en": "A neutral Guck alien of androgynous look and smooth pink-white skin. The planetary registry has exactly one box for them.",
    },
    "gucck-virtual": {
        "zh": "人工场生成的虚拟人，只显上半身的全息投影。按设定它没有下半身，因为没必要——投影只到腰。",
        "en": "A holographic figure generated by an artificial field, shown only from the waist up. Per the lore it has no lower half — unnecessary, since the projection stops there.",
    },
    "gucck-splitter": {
        "zh": "拆分人，身体可拆成碧玉蓝条状、又能迅速复原。果克星工伤理赔中最难定残的一类。",
        "en": "A splitter whose body separates into jade-blue strips and reassembles instantly — the hardest disability claim to assess on Guck.",
    },
    "figure-chef": {
        "zh": "系着围裙的胖厨师，漫画式爆发光晕。他炒的菜从不出图，因为本站只收立绘，不收餐。",
        "en": "A plump chef in an apron with a comic burst of glow. His dishes never make it into the gallery — it collects character art, not meals.",
    },
    "figure-grandpa": {
        "zh": "白胡子老爷爷，皱纹和衣纹细节扎实。按本站规矩，长者的每道皱纹都要经得起放大镜和甲方。",
        "en": "A white-bearded elder with solid wrinkles and fabric detail. House rule: an elder's every wrinkle must survive both a loupe and the client.",
    },
    "motion-mining": {
        "zh": "小人挖矿循环动图，镐起火花落，三秒一个周期。他挖的矿不存在，但循环很认真。",
        "en": "A looping animation of a little figure mining — pick up, sparks down, three seconds a cycle. The ore doesn't exist; the loop is earnest.",
    },
    "motion-fishing": {
        "zh": "小人钓鱼循环动图，鱼竿弯、浮漂沉。钓不钓得到鱼另说，主要是水面的构图不能输。",
        "en": "A looping fishing animation: rod bent, bobber sunk. Whether a fish is caught is secondary — the water's composition must not lose.",
    },
    "motion-shooting": {
        "zh": "小人射击循环动图，枪口焰、弹壳跳。三秒内完成一次专业的无效输出，职场看了都眼熟。",
        "en": "A looping shooting animation: muzzle flash, casing tumbling — one professional bout of futility every three seconds. The workplace would recognise it.",
    },
    "wpn-hammer": {
        "zh": "战锤，锤头比道理大的经典款。本站武器栏的销售冠军，成交理由通常是「看着就疼」。",
        "en": "A war hammer of the classic head-over-reason design — the bestseller of the weapons shelf, usually bought because it looks like it hurts.",
    },
    "ammo-shell": {
        "zh": "黄铜弹壳，弹药的标本形态。它已经完成了全部使命，现在负责在抽屉里被人反复把玩。",
        "en": "A brass shell in its specimen form. Its mission is complete; it now serves by being idly turned over in a drawer.",
    },
    "cr-cat": {
        "zh": "黑猫立绘，本站动物栏在编职员。职责是坐在透明背景上维持高冷，偶尔客串徽章。",
        "en": "A black cat, staff member of the animals section. Duty: sit on a transparent background and stay aloof, with occasional badge cameos.",
    },
    "food-ramen": {
        "zh": "豚骨拉面，永远刚出锅的完美瞬间。香气无法通过 PNG 传输，这是本站最大的技术缺口。",
        "en": "Tonkotsu ramen at its perfect just-served moment. That aroma cannot pass through PNG remains the site's largest technical gap.",
    },
    "veh-spaceship": {
        "zh": "复古火箭飞船，尾翼比烟囱粗。它不在乎空气动力学，它忠于一代人的登月想象。",
        "en": "A retro rocket ship with fins thicker than chimneys. Aerodynamics bores it; it stays loyal to a generation's moon-landing imagination.",
    },
    "aliens-crystal-crawler": {
        "zh": "水晶甲壳爬行者，异星生物栏的常驻住户。它爬得很慢，但每爬一步都像在走红毯。",
        "en": "A crystal-carapace crawler, resident of the aliens section. It crawls slowly, yet every step lands like a red carpet.",
    },
    "flora-spiral-vine": {
        "zh": "螺旋星藤，异星植物栏人气第一。它不追逐阳光，只负责把藤蔓盘成让构图老师点头的形状。",
        "en": "The spiral star-vine, top of the alien flora charts. It chases no sun — it coils only into shapes that please composition teachers.",
    },
    "stone-flint-axe": {
        "zh": "燧石战斧，石器时代的开源硬件。没有说明书，没有保修，握把就是全部人机工学。",
        "en": "A flint axe — the stone age's open-source hardware. No manual, no warranty; the grip is the entire ergonomics.",
    },
    "potion-magenta-cone": {
        "zh": "品红锥形瓶，颜色越不可能越有效系列。喝下去会怎样，瓶身上没写，本站也不打算写。",
        "en": "A magenta conical flask from the more-improbable-colour-more-potent line. What happens if you drink it is not on the label, nor planned.",
    },
    "book-grimoire": {
        "zh": "血红法典，烫金封面，会自己翻页。本站只借不卖，而且不保证任何人读到第三章。",
        "en": "A blood-red grimoire with gilt cover and self-turning pages. Lend-only, never sold — and no one is guaranteed chapter three.",
    },
    "impl-wand": {
        "zh": "月牙魔杖，法器界的入门款。拿在谁手里都像主角，这是它经久不销的原因。",
        "en": "A crescent wand, entry-level among implements. It makes any holder look like the protagonist — hence its lasting sales.",
    },
    "castle-cloud": {
        "zh": "浮空岛堡，建筑规范全部作废。住在这里的公主一般自己打怪，快递只送到云层以下。",
        "en": "A floating-island keep with every building code void. Princesses here slay their own monsters; delivery stops below the clouds.",
    },
    "furn-table": {
        "zh": "旧橡木长桌，古旧家具栏的台柱。桌面的每道裂纹都是岁月的正版防伪标，不支持打磨消除。",
        "en": "The old oak table, pillar of the furniture section. Every crack in it is time's authentic anti-counterfeit mark; sanding is not supported.",
    },
    "tech-holo": {
        "zh": "全息投影仪，奇械科技栏的门面。线头比功能多，但亮起来那一刻，全场都原谅了它。",
        "en": "A holo-projector, face of the tech section: more cables than functions — yet when it lights up, the room forgives everything.",
    },
    "xeno-prism-stalker": {
        "zh": "折光伏击者，异星猎食栏的刺客。它捕猎不为果腹，主要为构图——进图鉴比进晚餐更永恒。",
        "en": "A prism ambush predator, assassin of the xenohorror section. It hunts for composition, not food — a gallery outlasts a dinner.",
    },
    "zone-bass": {
        "zh": "低音核徽章，别在胸前不涨工资。但它能明确传达：此人有所热爱，且热爱有声。",
        "en": "A bass-core badge that raises no salary — yet it clearly states its wearer loves something, audibly.",
    },
    "planet-shard-ring": {
        "zh": "碎环星，星球徽志库的在编星球。它不公转，只负责在深蓝背景上保持破碎的好看。",
        "en": "The shattered-ring planet, registered in the sigil archive. It orbits nothing; it merely stays beautifully broken on deep blue.",
    },
    "inst-snail-horn": {
        "zh": "螺壳号，古怪乐器栏的铜管部荣誉会员。音准由演奏者的信心决定，退堂鼓除外。",
        "en": "A shell horn, honorary brass of the odd instruments. Pitch is set by the player's confidence — except for retreat calls.",
    },
    "phys-ballista": {
        "zh": "扭力弩炮，物理武器栏的正经机械。在魔法横行的站里，它代表最后的工程学尊严。",
        "en": "A torsion ballista, honest machine of the physics section — engineering's last dignity on a magic-filled site.",
    },
    "scare-pumpkin": {
        "zh": "南瓜四臂，变异稻草人栏的劳模。农田雇它防鸟，现在它主要防的是访客的胆量。",
        "en": "A four-armed pumpkin, model worker of the scarecrow section. Farms hired it against birds; it now guards visitors' courage.",
    },
    "fang-maw": {
        "zh": "环牙巨口，多牙生物栏的门面。牙齿数量经过审计，每一颗都有排班表，下岗的会补种。",
        "en": "A ringed maw, face of the fangs section. The tooth count is audited; every fang keeps a roster, and retirees are replaced.",
    },
    "astone-levi": {
        "zh": "熔裂石，古怪外星石头栏的样品。它不说话，但每一道纹理都是亿万年的会议纪要。",
        "en": "A fused-crack stone, specimen of the alien rocks. It says nothing, yet every vein is minutes from a billion-year meeting.",
    },
    "monstertoys-squishball": {
        "zh": "被踩瘪过又用干掉的橙胶水胡乱补过的独眼弹力球，门牙是它最后的体面。1024×1024 透明 PNG，专治各种手痒。",
        "en": "A one-eyed rubber ball patched with dried orange glue after one too many stomps; the buck tooth is its last dignity. 1024×1024 transparent PNG.",
    },
    "monstertoys-chewbone": {
        "zh": "一根咬痕累累的米白大骨，末端的小怪兽牙床永远停在咬到一半的姿势。1024×1024 透明 PNG，狗见愁。",
        "en": "A gnawed ivory-white bone whose little monster jaw is frozen mid-bite. 1024×1024 transparent PNG, the despair of dogs.",
    },
    "monstertoys-yarnball": {
        "zh": "一团炸了线的毛线球，顶上的小怪兽比球还愁。芥末黄、珊瑚红与蓝绿条纹证明它至少被三只猫嫌弃过。1024×1024 透明 PNG。",
        "en": "A frayed yarn ball whose rider looks more worried than the ball itself; the mustard, coral and teal stripes prove at least three cats have judged it. 1024×1024 transparent PNG.",
    },
    "monstertoys-windup": {
        "zh": "上满发条能走三步半的铁皮小怪兽，耳朵缺口是出厂时就有的工伤。1024×1024 透明 PNG，褪色红配奶白，锈斑随赠。",
        "en": "A wind-up tin monster that walks exactly three and a half steps per winding; the chipped ear was a factory injury. 1024×1024 transparent PNG, faded red on cream, rust included.",
    },
    "monstertoys-balloon": {
        "zh": "一只紫绿气球拧成的瘦长怪，肚皮上那块银胶带是它对漏气最后的抵抗。1024×1024 透明 PNG，拧得越用力越怂。",
        "en": "A teal-and-purple balloon beast; the silver tape on its belly is its last stand against a slow leak. 1024×1024 transparent PNG.",
    },
    "monstertoys-plushie": {
        "zh": "灰粉、芥末与灰格纹拼了一身的毛绒怪，一颗纽扣眼已经想离职。背上的拉链半开，棉花随时准备出走。1024×1024 透明 PNG。",
        "en": "A patchwork plush in grey-pink, mustard and check; one button eye has already resigned, and the half-open back zip lets the stuffing contemplate escape. 1024×1024 transparent PNG.",
    },
    "oddbeasts-jitterstag": {
        "zh": "脖子上套了几十个锈铁环的长颈怪，走一步响一串，堪称自带音效。1024×1024 透明 PNG，呆滞是保护色。",
        "en": "A long-necked beast wearing several dozen rusty iron rings; every step comes with sound effects. 1024×1024 transparent PNG.",
    },
    "oddbeasts-umbrellnail": {
        "zh": "背着一把散了架的破雨伞当壳的蜗牛，两根弯三根断，走得比谁都小心。1024×1024 透明 PNG，怯生生是日常。",
        "en": "A snail carrying the bare skeleton of a broken umbrella as its shell; two ribs bent, three snapped. 1024×1024 transparent PNG.",
    },
    "oddbeasts-stitchmutt": {
        "zh": "一嘴被黄铜拉链缝死的杂犬，从此再也没法乱叫。拼布身上东一块西一块，针脚粗得很有诚意。1024×1024 透明 PNG。",
        "en": "A stray mutt whose mouth is zipped shut with a small brass fastener; the patchwork stitching is boldly sincere. 1024×1024 transparent PNG.",
    },
    "oddbeasts-stackhound": {
        "zh": "三只猎犬叠成三层还咬成一个环，谁也不敢先松口。1024×1024 透明 PNG，六条腿两排编制。",
        "en": "Three hounds stacked into a biting loop, and nobody dares let go first. 1024×1024 transparent PNG, six legs in two rows.",
    },
    "oddbeasts-bellowsaur": {
        "zh": "腰上绑裂皮风箱的胖蜥蜴，嘴巴专职噗噗吐云。1024×1024 透明 PNG，懒洋洋是它的法定表情。",
        "en": "A chubby lizard with a cracked bellows strapped to its waist, its mouth professionally puffing small clouds. 1024×1024 transparent PNG.",
    },
    "oddbeasts-candystag": {
        "zh": "四条腿是拐杖糖、鹿角挂满糖果的胖驯鹿，连鼻子都舔过一口。1024×1024 透明 PNG，甜是唯一人设。",
        "en": "A plump reindeer on candy-cane legs with sweets hung from its antlers; even its nose has been licked. 1024×1024 transparent PNG.",
    },
    "deepfish-angler": {
        "zh": "提着一盏灯笼满深海找观众的鮟鱇，灯罩里那小怪兽剪影至今没解释。1024×1024 透明 PNG，对眼是天赋。",
        "en": "An anglerfish carrying its lamp through the deep in search of an audience; the shadow inside the shade remains unexplained. 1024×1024 transparent PNG.",
    },
    "deepfish-tubelye": {
        "zh": "眼睛长在两根玻璃管顶端的小鱼，吞下去的弹珠至今没消化。1024×1024 透明 PNG，半透明身子不藏事。",
        "en": "A jelly-pink fish whose eyes sit on two long glass tubes; the marble it swallowed remains undigested. 1024×1024 transparent PNG.",
    },
    "deepfish-viper": {
        "zh": "一嘴獠牙永远合不拢的蝰鱼，笑是假的笑，惊慌是真的。1024×1024 透明 PNG，额头还多长了一只眼睛负责害怕。",
        "en": "A viperfish whose fangs never quite close; the grin is fake, the panic is real, and the third eye on its forehead handles the fear. 1024×1024 transparent PNG.",
    },
    "deepfish-oarfish": {
        "zh": "身子拉成一条飘带的皇带鱼，红背鳍像把缺齿的梳子。1024×1024 透明 PNG，委屈是它游得慢的原因。",
        "en": "An oarfish stretched into a ribbon, its red dorsal fin a comb with missing teeth. 1024×1024 transparent PNG.",
    },
    "deepfish-blob": {
        "zh": "本站表情最听天由命的居民，整条鱼像化开了一半。1024×1024 透明 PNG，苦脸是泡在水里的好处。",
        "en": "The gallery's most resigned resident, half-melted into its own gloom. 1024×1024 transparent PNG.",
    },
    "deepfish-hermit": {
        "zh": "背着怪兽骷髅头当壳的寄居蟹，一大一小两只钳子分工明确。1024×1024 透明 PNG，斜眼偷瞄是职业病。",
        "en": "A hermit crab wearing a grinning monster skull as its shell, one claw giant and one tiny. 1024×1024 transparent PNG.",
    },
    "oddbirds-saxvulture": {
        "zh": "脖子是一支旧铜萨克斯的秃鹫，专吹悲伤调子。1024×1024 透明 PNG，愁珠随步伐晃。",
        "en": "A scruffy vulture whose neck is an old brass saxophone, forever playing the blues. 1024×1024 transparent PNG.",
    },
    "oddbirds-spoonheron": {
        "zh": "嘴是一把漏勺的苍鹭，站水里半天也舀不起一条鱼。1024×1024 透明 PNG，没睡醒是装出来的。",
        "en": "A heron whose beak is a giant slotted spoon; hours in the water, zero fish. 1024×1024 transparent PNG.",
    },
    "oddbirds-trumpetparrot": {
        "zh": "尾巴是一支磕瘪小号的鹦鹉，一开口就是全场最大声。1024×1024 透明 PNG，亢奋得理直气壮。",
        "en": "A parrot whose tail is a dented brass trumpet, the loudest voice in any room. 1024×1024 transparent PNG.",
    },
    "oddbirds-postostrich": {
        "zh": "邮包撑到爆满的鸵鸟邮差，嘴里一封头顶一封，还有一封在路上。1024×1024 透明 PNG，急切是职业素养。",
        "en": "An ostrich postman bursting at the seams; one letter in beak, one on head, more on the way. 1024×1024 transparent PNG.",
    },
    "oddbirds-kettlepenguin": {
        "zh": "头顶茶壶嘴冒蒸汽的企鹅，白肚皮上画着大茶杯。1024×1024 透明 PNG，困意与茶香一起出厂。",
        "en": "A penguin with a steaming spout on its head and a teacup printed on its belly. 1024×1024 transparent PNG.",
    },
    "oddbirds-cuckoo": {
        "zh": "雕成小木屋样子的布谷鸟，肚皮小门敞着等人报时。1024×1024 透明 PNG，准时是祖传的。",
        "en": "A cuckoo carved like a mountain cabin, its little door open and waiting to announce the hour. 1024×1024 transparent PNG.",
    },
    "figure-robot": {
        "zh": "捧花界的老实人。一双大眼专供无辜表情，橙色光晕是出厂自带的氛围灯。512×512，花是真的，表情是画出来的。",
        "en": "An honest soul in the flower-carrying trade. Big eyes built for innocent expressions; the orange glow is a factory-installed mood light. 512×512.",
    },
    "figure-fairy-lattice": {
        "zh": "刻意绕开所有经典仙子造型的一位。薄荷绿短发配几何网纹薄翼，金线小裙和赤脚漂浮都是原创设定，512×512，童话里查无此人。",
        "en": "Deliberately unlike any classic fairy: mint-green bob, geometric lattice wings, tea-gold dress, barefoot and floating. 512×512, absent from every fairy tale.",
    },
    "char-ayan": {
        "zh": "比老张细腻一个像素级的旅人。做旧皮外套配黄铜护目镜，手里永远攥着一张地图，目的地不详。1024×1024，风尘仆仆是画出来的。",
        "en": "A traveller one pixel finer than Laozhang: weathered leather jacket, brass goggles, forever clutching a map of undisclosed destination. 1024×1024.",
    },
    "char-lin": {
        "zh": "琥珀色 HUD 护目镜后面那双眼睛，据说看谁都是红的。流线装甲加能量警棍，巡逻路线固定绕本站三圈。1024×1024。",
        "en": "Behind the amber HUD goggles, everyone reportedly scans red. Streamlined armour, energy baton, patrol route fixed at three laps of this site. 1024×1024.",
    },
    "pat-stained": {
        "zh": "琥珀、橄榄绿与暖棕拼成的一片抽象叶形，铅条接缝一根没藏。属于挂上去就不用解释的那类装饰。1024×1024。",
        "en": "Amber, olive and warm brown in an abstract leaf; not one lead seam is hidden. Decoration that needs no explanation. 1024×1024.",
    },
    "rider-serpent": {
        "zh": "骑双头蛇出行，一路吹骨笛。发辫上的骨珠和羽毛肩披都是行头，两个头往哪走归她管。1024×1024。",
        "en": "She travels seated on a two-headed green snake, playing a bone flute. Bone beads and feather shawl are her working kit; both heads take her direction. 1024×1024.",
    },
    "bgun-vine": {
        "zh": "一把还在长的枪。枪口是根会开花的枝条，握把是一圈树根，森林绿配灰紫小花。建议装填前先确认它今天的情绪。1024×1024。",
        "en": "A gun that is still growing: its muzzle a blossoming twig, its grip a ring of roots, forest green with grey-lilac blossoms. Check its mood before loading. 1024×1024.",
    },
    "mod-barista": {
        "zh": "本站唯一确定有真本事的岗位。一手壶一杯，丸子头和专注神情都是标配。出品不保证快，保证烫。1024×1024。",
        "en": "The one role on this site with verified skills: one pot, one cup, hair bun and full concentration. Not fast, but reliably hot. 1024×1024.",
    },
    "oldfolk-goggles": {
        "zh": "腋下夹古董望远镜、额头架黄铜护目镜的老头，坏笑说明他刚看完不该看的。1024×1024，风衣破得很有年头。",
        "en": "An old man with a brass telescope under one arm and goggles on his forehead; the grin says he just saw something. 1024×1024.",
    },
    "oldfolk-lantern": {
        "zh": "从镜片上方狐疑打量人是她的招牌动作。暖光黄铜油灯一手举着，背带裤配针织披肩，打量完了才决定你进不进。1024×1024。",
        "en": "Peering suspiciously over her glasses is her signature move: warm brass lamp in hand, dungarees and knitted shawl. Entry is granted only after inspection. 1024×1024.",
    },
    "imp-sack": {
        "zh": "搂着一袋露头铜钱的烟灰小鬼，缺一颗牙的笑很有业务感。脚下一缕烟是赶时间的证据。1024×1024。",
        "en": "A soot-grey imp hugging a bag of peeking copper coins; the toothless grin looks like business. The wisp of smoke below means he is late. 1024×1024.",
    },
    "flybeast-boar": {
        "zh": "长着皮制暗红龙翼的野猪飞兽，獠牙外呲着飞。脖子上开裂的小铃铛一路响，四蹄收拢的姿势说明它赶路。1024×1024。",
        "en": "A boar-beast with leathery dark-red dragon wings, tusks flared in flight. The cracked bell at its throat rings the whole way; folded hooves mean hurry. 1024×1024.",
    },
    "oddplants-shroom": {
        "zh": "三株靛蓝斑点蘑菇，伞盖困得直往下垂。最高那株茎基还围了一圈小瘤触须，像没睡醒时抓着的被子。1024×1024。",
        "en": "Three indigo-dotted mushrooms with caps drooping like sleepy eyelids; the tallest clutches a ring of tubercle tendrils like a blanket. 1024×1024.",
    },
    "jewels-eye": {
        "zh": "两只小爪手捧一颗眼球形月光石的辫纹银戒，乳白石面泛淡蓝光。戴上它，注视就成了双向的。1024×1024。",
        "en": "A braided silver ring whose two little claws cradle an eyeball-shaped moonstone glowing pale blue. Wear it, and staring becomes mutual. 1024×1024.",
    },
    "fairykid-feather": {
        "zh": "披羽毛羽衣、头顶小金光环的胖仙童，双手捧的珍珠是真发光。悬空姿势说明他还没学会落地。1024×1024。",
        "en": "A chubby fairy child in a feather cloak with a small golden halo, holding a genuinely glowing pearl. He has not yet learned to land. 1024×1024.",
    },
    "fairykid-star": {
        "zh": "星冠、小翼、星尖魔杖配深紫星点袍，脚边还搁一弯小月亮。装备齐全，负责在夜里认路。1024×1024。",
        "en": "Star crown, small wings, star-tipped wand and a deep-purple starry robe, with a crescent moon at his feet. Fully equipped for night navigation. 1024×1024.",
    },
    "foodjar-rainbow": {
        "zh": "一瓶自底向上分层的彩虹液，木塞塞得紧紧的。素清白牌什么都没写，风味请自行想象。1024×1024。",
        "en": "A tall narrow bottle of rainbow liquid, layered bottom-up and firmly corked. The blank label says nothing; the flavour is left to you. 1024×1024.",
    },
    "hairyboot-bear": {
        "zh": "一双熊掌形的厚毛靴，只露一点爪尖在外面。穿上它，雪地里的每一步都很难解释。1024×1024。",
        "en": "Thick-furred boots shaped like bear paws, with just the claw tips showing. In snow, every step becomes hard to explain. 1024×1024.",
    },
    "oddbug-teapot": {
        "zh": "背着带壶嘴壶柄茶壶壳的蜗牛，两根眼柄照常营业。走得慢，但自带茶具。1024×1024。",
        "en": "A snail whose shell is a teapot complete with spout and handle, eyes on stalks as usual. Slow, but self-catering. 1024×1024.",
    },
    "constellation-cat": {
        "zh": "一个虚构出来的星座：星点连成一只端坐的独眼猫，尖耳卷尾。天上本来没有它，看图鉴的都算目击证人。1024×1024。",
        "en": "A wholly invented constellation: stars linked into a one-eyed sitting cat with pointed ears and curled tail. Everyone here is a witness. 1024×1024.",
    },
    "nonsense-fishhat": {
        "zh": "灰西装系领带的老派绅士，头顶稳稳顶一条整炸鱼当礼帽，面无表情。全站最镇定的搭配。1024×1024。",
        "en": "A grey-suited gentleman balancing a whole fried fish on his head as a hat, expressionless. The calmest outfit on the site. 1024×1024.",
    },
    "nonsense-clock": {
        "zh": "胡子以下是一块大怀表的男士，时针分针就是他的嘴。不眨眼，也从不迟到。1024×1024。",
        "en": "A suited man whose chin down is a large pocket-watch face, hour and minute hands for a mouth. He never blinks, and never arrives late. 1024×1024.",
    },
    "retrofolk-newsboy": {
        "zh": "被自家报纸龙卷风卷上天的报童，一脸淡定。鸭舌帽背带裤都在，报纸比他先到家。1024×1024。",
        "en": "A newsboy lifted by his own newspaper tornado, perfectly calm. Cap and suspenders intact; the papers got home first. 1024×1024.",
    },
    "fusionfolk-centurion": {
        "zh": "一身鳞甲的罗马百夫长，一手珍珠奶茶一手自拍杆，表情严肃得像在征服什么。古今混搭的纪律性。1024×1024。",
        "en": "A plumed Roman centurion in scale armour, bubble tea in one hand, selfie stick in the other, face set for conquest. The discipline of fusion. 1024×1024.",
    },
    "blades-gearshears": {
        "zh": "刃口是两只互相咬合的锯齿齿轮的巨剪，握把却朴素得像个圆环。剪什么先不管，声音一定悦耳。1024×1024。",
        "en": "Giant shears whose blades are interlocking toothed gears, with an ordinary ring handle. Whatever it cuts, the sound is pleasing. 1024×1024.",
    },
    "giantfolk-foglamp": {
        "zh": "脑袋是一盏起雾船灯的水手巨人，冰蓝双眼长在灯罩后面。流星锤系着长链，油布斗篷挂满冰凌，雾航时代的老兵。1024×1024。",
        "en": "A sailor giant whose head is a fogged ship's lamp, ice-blue eyes behind the glass, swinging a chained lantern flail, cloak rimed with ice. A veteran of fog routes. 1024×1024.",
    },
    "skulls-gearwork": {
        "zh": "黄铜齿轮拼的骷髅，下颚是一枚大齿轮，两只眼睛一表盘一透镜。拧一拧还能走，就是不知道走去哪。1024×1024。",
        "en": "A skull of brass gears, its jaw one large cog, one eye a clock dial and the other an amber lens. Wind it and it still runs, destination unknown. 1024×1024.",
    },
    "skulls-bloom": {
        "zh": "长满蘑菇和小野花的骷髅，菌丝从颅顶扇形铺开，菌盖挂着露珠。死亡在这儿的尽头是菌类学报。1024×1024。",
        "en": "A skull overgrown with dotted mushrooms and wildflowers, pale hyphae fanning from the crown, dewdrops on the caps. Here, death ends in mycology. 1024×1024.",
    },
    "oddweapons-twinmaul": {
        "zh": "两头各嵌一只石磨盘的奇门兵器，铁齿崩的崩、缺的缺，裂纹里还卡着上次的石粉。缠着旧布握把，拿它得先有力气再有理由。1024×1024。",
        "en": "An odd weapon with a millstone head at each end of a stout oak haft; teeth chipped and missing, old stone dust in the cracks, rag-wrapped grip. Strength first, reasons second. 1024×1024.",
    },
    "wpn-vial": {
        "zh": "琥珀色液体自己在发光，红蜡封得死死的，吊牌上一个字都没有。喝不喝、什么时候喝，全靠觉悟。512×512。",
        "en": "Amber liquid glowing from within, sealed under red wax, tag blank. Whether and when to drink is entirely a matter of resolve. 512×512.",
    },
    "flora-gland-stake": {
        "zh": "异星食人植物，无花无瓣无叶，柄身微妙地像一根饲管。腺果往下淌诱引液，六根光合须的须尖冒着可见蒸汽，闻起来据说是甜的。1024×1024。",
        "en": "An alien carnivorous plant with no flower, petal or leaf; the stem subtly resembles a feeding tube. The gland drips lure-fluid while six tendrils breathe visible steam, reportedly sweet. 1024×1024.",
    },
    "planet-cube": {
        "zh": "一颗拒绝当球的立方体行星，圆角低多边形，玩具质感。它的居民习惯了走路时拐弯。1024×1024。",
        "en": "A planet that refuses to be round: a rounded low-poly cube of toy-like finish. Its residents are used to corners. 1024×1024.",
    },
    "food-dumpling": {
        "zh": "竹蒸笼里六只褶子端正的小笼包，热气从笼缝往外钻。旁边酱油碟和葱花都摆好了，开蒸即食。1024×1024。",
        "en": "Six neatly pleated dumplings in a bamboo steamer, heat escaping through the slats, soy dish and scallions ready. Serve immediately. 1024×1024.",
    },
    "book-open-tome": {
        "zh": "摊开的古老魔典，右页有几个符号已经浮离纸面，还冒着紫烟。紫金双色墨迹写的都是纯虚构内容，翻可以，念出声不负责。1024×1024。",
        "en": "An ancient tome lies open; a few symbols on the right page have floated off the paper trailing purple smoke. The purple-and-gold ink is pure fiction; read, but do not read aloud. 1024×1024.",
    },
    "ammo-cannonball": {
        "zh": "赤道一道凸箍的铸铁炮弹，锈蚀麻点里露着铁斑。复古海报画风也盖不住它工伤累累的事实。1024×1024。",
        "en": "A cast-iron cannonball with an equatorial band, rust pits baring iron. Retro poster styling cannot hide a long career of occupational damage. 1024×1024.",
    },
    "aliens-jelly": {
        "zh": "半透明粉紫伞盖的幻水母，每条触须末端都缀一枚金色小球，像拎着灯逛街。边缘那圈淡紫光晕是它的礼貌。1024×1024。",
        "en": "A translucent pink-purple jellyfish, each tendril tipped with a small gold orb, as if out shopping with lanterns; the lilac halo is its politeness. 1024×1024.",
    },
    "flora-iron-tree": {
        "zh": "深色铁木树干配一冠扇形青叶，枝桠间托着一枚发光的橙色种核。按图鉴风记载，它一年只亮一次。1024×1024。",
        "en": "A gnarled iron-wood trunk under a symmetrical fan of green leaves, cradling a glowing orange seed-core. Per the catalogue, it lights once a year. 1024×1024.",
    },
    "impl-orb": {
        "zh": "安在青铜三足爪脚架上的青碧水晶球，球内一团小光云缓缓流转。铜架缝隙的铜绿说明它已经看了很久。1024×1024。",
        "en": "A clear crystal orb on a bronze tripod claw, a small light-cloud drifting inside. The verdigris in the joints suggests it has been watching for a long while. 1024×1024.",
    },
    "furn-chair": {
        "zh": "深染胡桃木高背旧椅，草编座面磨得发亮，一侧扶手只剩两个木栓孔。它记得每一个坐塌过它的人。1024×1024。",
        "en": "A dark walnut high-back chair, its woven seat polished by use, one armrest gone leaving two peg holes. It remembers everyone who broke it in. 1024×1024.",
    },
    "tech-shield": {
        "zh": "一台磕得全是包浆的便携力场发生器，淡绿力场罩住上半身，场表还荡着涟漪。接地处积了一小滩绿光，防不防另说，阵仗是真足。1024×1024。",
        "en": "A dented, well-patinated portable force-field generator throwing a pale-green dome over its user, ripples on the field, a small pool of light at the base. Whether it stops anything is debatable; it looks formidable. 1024×1024.",
    },
    "phys-flail": {
        "zh": "碗口大的铁球钉满方锥，几节沉铁链接在铁箍木柄上。中世纪的经典答案：够快就防得住。1024×1024。",
        "en": "A medieval flail: an iron ball studded with pyramids on heavy links and a hooped wooden haft with an anti-slip leather grip. The classic answer to speed. 1024×1024.",
    },
    "fang-lamprey": {
        "zh": "圆吸盘嘴镶满几百颗细角牙的鳗形怪，七个鳃孔开在橄榄褐色的黏滑皮上。它嘴正对着你，等你先打招呼。1024×1024。",
        "en": "An eel-like horror with a round sucker mouth set with hundreds of fine horn-teeth and seven gill pores in its olive slime. Its mouth faces you, waiting for you to say hello first. 1024×1024.",
    },
    "astone-honey": {
        "zh": "一块被熔岩气泡扎成蜂窝的外星浮石，孔沿磨得玻璃一样滑，缝里渗出淡青矿脉。每一孔都是从前一次逃逸。1024×1024。",
        "en": "An alien pumice honeycombed by escaped lava bubbles, holes worn glass-smooth, thin cyan veins seeping from the seams. Every hole was once an escape. 1024×1024.",
    },
    "sym-halo": {
        "zh": "紫粉青三色发光的曼陀罗符印环，环内符文全是虚构，中心一颗紫星。照着画可以，别照着念。1024×1024。",
        "en": "A glowing mandala sigil-ring in purple, pink and cyan, its runes entirely invented, a violet star at the centre. Copy the drawing; skip the chanting. 1024×1024.",
    },
    "wp-rifle": {
        "zh": "青色能量条纹的科幻步枪，瞄准镜、多管枪口、散热孔一样不缺。线条硬朗到不用摆姿势。1024×1024。",
        "en": "A sci-fi rifle in cyan energy stripes: scope, multi-barrel muzzle and heat vents all present. Hard-angled enough to need no posing. 1024×1024.",
    },
    "boot-wingturbo": {
        "zh": "侧面张开银色机械翼、外挂双筒推进器的黑色高筒靴。铆钉和管路都很扎实，起飞前请先系紧。1024×1024。",
        "en": "Black high flight boots with a silver mechanical wing at the side and twin canister thrusters; rivets and piping are solid. Fasten everything before takeoff. 1024×1024.",
    },
    "eblk-blade": {
        "zh": "一块正在变形的品红晶块，两端已伸出弯月紫刃，碎晶沿刃口飞散。变形到一半，请稍候。1024×1024。",
        "en": "A magenta lattice cube mid-transformation, crescent violet blades extending from both ends, chips scattering along the edges. Please wait. 1024×1024.",
    },
    "tel-watch": {
        "zh": "一根绿铜管弯成 U 字的怪镜，一端红铜喇叭口，管上还挂着黄铜怀表坠。看时间和看远方，它只收一份工钱。1024×1024。",
        "en": "A green copper tube bent into a U with a red-brass bell at one end and a pocket-watch fob on the barrel. One tool, billed for both time and distance. 1024×1024.",
    },
    "zone-bell": {
        "zh": "一枚霓虹线稿的水晶铃铛小徽章，384×384。别摇，这里是图鉴不是风铃摊。",
        "en": "A neon-line badge in the shape of a hanging crystal bell, 384×384. Please do not shake it; this is a gallery, not a wind-chime stall.",
    },
    "figure-musician": {
        "zh": "绿裙歌者抱着木吉他，脚下那圈聚光灯晕是自带音响的证据。512×512，曲目从民谣到晚安曲不限。",
        "en": "A green-dressed singer with an acoustic guitar; the spotlight pool at her feet proves built-in sound. 512×512, folk to lullabies.",
    },
    "figure-farmer-sickle": {
        "zh": "靛蓝手织短衫配竹柄弯镰的农社青年，赤足扛镰的姿势像扛着一整个收获季。1024×1024。",
        "en": "A highland farmhand in an indigo hand-woven tunic, carrying a bamboo-handled sickle barefoot as if carrying a whole harvest season. 1024×1024.",
    },
    "char-xuanye": {
        "zh": "护目镜里投着全息 HUD 的星轨工程师，工装上的发光线条不是装饰，是工位照明。1024×1024。",
        "en": "A star-track engineer whose goggles project a holographic HUD; the glowing lines on his suit are not decoration but workstation lighting. 1024×1024.",
    },
    "pat-brooch": {
        "zh": "赭红与姜黄绣线走针清晰的多层布花胸针，顶端小铜环是它上身的理由。1024×1024。",
        "en": "A layered fabric flower brooch with clear madder-red and ginger stitching on a linen ground; the small brass loop at top is why it gets worn. 1024×1024.",
    },
    "pat-batik": {
        "zh": "一方靛蓝蜡染布，白斑是扎染防染留下的，边缘流苏负责好看。折痕自然，像刚从抽屉里拿出来。1024×1024。",
        "en": "A square of indigo batik cotton; the white patches are resist-dye marks, the fringe purely decorative. Naturally folded, as if just out of a drawer. 1024×1024.",
    },
    "rider-rhino": {
        "zh": "骑铁甲犀的明代校尉，一手钉头锤一手铁尺，姿态端严。犀牛的甲比他厚，这事他不计较。1024×1024。",
        "en": "A Ming officer on an armoured rhino, morning-star in one hand and iron ruler in the other, posture impeccable. The rhino's plating is thicker; he does not mind. 1024×1024.",
    },
    "bgun-chain": {
        "zh": "一串锈铁环像脊椎一样串成的枪，前端散开成钟形喇叭口。握把上垂着的散绳头是它的使用说明。1024×1024。",
        "en": "A gun of rusty iron rings strung like a spine, flaring into a bell mouth at the front. The frayed cord hanging from the grip is its instruction manual. 1024×1024.",
    },
    "mod-trainer": {
        "zh": "肩扛哑铃还竖大拇指的健身教练，笑容爽朗得让你不好意思说今天不练。1024×1024。",
        "en": "A trainer with a dumbbell on one shoulder and a thumbs-up in the other hand; his grin makes skipping today's workout embarrassing. 1024×1024.",
    },
    "oldfolk-cage": {
        "zh": "提着竹鸟笼的驼背老翁，笼里蹲着一只粉色怪眼小生物。眯眼狡黠的样子，像刚谈成一笔不对外公布的生意。1024×1024。",
        "en": "A hunchbacked old man carrying a bamboo birdcage; inside squats a pink odd-eyed creature. His sly squint suggests a deal just closed. 1024×1024.",
    },
    "imp-flame": {
        "zh": "一手捏着小火苗的李子紫小鬼，爪脚悬空说明火还没学会认路。竖瞳看人时请保持距离。1024×1024。",
        "en": "A plum-purple imp cupping a small flame, paws hovering off the ground; the fire has not yet learned the way. Keep your distance from those vertical pupils. 1024×1024.",
    },
    "imp-moon": {
        "zh": "头顶光环和蜡泪小皇冠、搂着月牙金坠的薰衣草紫小鬼。两眼一高一低，看人从不用正眼。1024×1024。",
        "en": "A lavender imp with a halo and candle-wax crown, hugging a crescent gold pendant. One eye higher than the other; he never looks at anyone straight. 1024×1024.",
    },
    "flybeast-wolf": {
        "zh": "头顶三只弯角、一只耳朵破边的风暴灰翼狼，腾空跃起的姿势说明它不落地。绿眼发光是夜航灯。1024×1024。",
        "en": "A storm-grey wolf-beast with three curved horns and one torn ear, leaping clear of the ground. Its glowing green eyes are night-running lights. 1024×1024.",
    },
    "oddplants-lantern": {
        "zh": "五颗从里透光的玻璃感浆果挂在深褐茎上，像一串小灯笼。卷须横着探路，茎上的小刺负责保持社交距离。1024×1024。",
        "en": "Five glassy, light-passing berries hang from a stout dark stem like little lanterns. Tendrils probe sideways; the small thorns keep a social distance. 1024×1024.",
    },
    "jewels-crown": {
        "zh": "一顶朝鲜蓟式的层层金瓣小冠，九只歪尖顶各镶不同的怪宝石，正中一滴淡绿水石。铜绿证明它戴过不止一个脑袋。1024×1024。",
        "en": "A small crown of layered artichoke-gold petals, nine crooked points set with different odd gems, a pale-green drop at the centre. The verdigris proves it has graced more than one head. 1024×1024.",
    },
    "fairykid-cloud": {
        "zh": "骑祥云、持如意、头顶玉簪的云纹仙童，微笑是职业表情。天蓝云纹袍和云是一套配色。1024×1024。",
        "en": "A fairy child riding a fluffy auspicious cloud, ruyi sceptre in hand, jade pin on his head; the smile is professional. Sky-blue robe and cloud are one palette. 1024×1024.",
    },
    "foodjar-star": {
        "zh": "清液里悬浮几颗发光小星的玻璃罐，木塞塞着，素牌上画着小星。罐住的是星星，泡的是时间。1024×1024。",
        "en": "A glass jar with a few glowing stars suspended in clear liquid, corked and labelled with a small star. It holds stars, and brews time. 1024×1024.",
    },
    "foodjar-honey": {
        "zh": "外壁结霜挂冰晶的圆陶蜜罐，罐口还搁着小蜜梳。蜜巢纹饰带是防伪标记。1024×1024。",
        "en": "A round clay honey jar frosted with ice crystals, a small honey comb resting on the rim. The honeycomb band is its anti-forgery mark. 1024×1024.",
    },
    "hairyboot-fringe": {
        "zh": "侧垂流苏毛须、毛绒领口的皮靴，靠一枚小扣带系住全部体面。走一步，流苏替它先打招呼。1024×1024。",
        "en": "Leather boots with side fringe and a furry collar, all dignity held by one small buckle. With every step, the fringe says hello first. 1024×1024.",
    },
    "oddbug-mushroom": {
        "zh": "拿半圆菌盖当翅膀的小蚊，薄翅细足都齐了。飞行路线大概和孢子一样随机。1024×1024。",
        "en": "A small mosquito wearing a half-dome mushroom cap in place of wings, thin wings and legs intact. Its flight path is probably as random as a spore's. 1024×1024.",
    },
    "constellation-boot": {
        "zh": "又一个虚构星座：星点连成一只厚靴，靴口鞋底分明。认准它，夜里赶路的人从此有了方向感。1024×1024。",
        "en": "Another invented constellation: stars linked into a thick boot, cuff and sole clearly drawn. Spot it, and night travellers finally have direction. 1024×1024.",
    },
    "nonsense-trombone": {
        "zh": "牵绳遛一只长出小短腿的长号出门的男士，一脸淡定。长号哒哒跑得比谁都快。1024×1024。",
        "en": "A man in casual clothes walking a trombone on a leash; the trombone has grown short legs and trots briskly. He looks perfectly calm. 1024×1024.",
    },
    "retrofolk-disco": {
        "zh": "脑袋是一颗闪亮镜面球的七十年代舞王，亮片衬衫喇叭裤，单臂高举定格舞步。一脸冷淡，灯光替他表达。1024×1024。",
        "en": "A seventies disco king with a mirror-ball head, sequin shirt and flared trousers, one arm frozen mid-move. Cold expression; the lights do the talking. 1024×1024.",
    },
    "retrofolk-sodajerk": {
        "zh": "踩四轮滑轮鞋托着一摞悬浮松饼塔的冷饮店侍应，纸帽领结齐全。一脸冷淡，手比脚稳。1024×1024。",
        "en": "A soda-jerk on four-wheeled roller skates, one arm balancing a floating stack of pancakes, paper hat and bow tie complete. Cold face, steadier hands. 1024×1024.",
    },
    "fusionfolk-pharaoh": {
        "zh": "持仪式权杖推超市购物车的条纹头冠法老，车里装满无标签包裹。一脸淡定，付款方式不可考。1024×1024。",
        "en": "A striped-nemes pharaoh with a ritual staff, pushing a modern supermarket cart full of unlabelled parcels. Perfectly calm; payment method unknown. 1024×1024.",
    },
    "blades-umbrellaspear": {
        "zh": "一杆用破伞改造的长枪，收拢的伞骨炸开成一圈尖刺，破布条垂坠。下雨天它既是伞又是态度。1024×1024。",
        "en": "A long spear rebuilt from a broken umbrella: its ribs flared into a ring of spikes, shreds of cloth hanging down. In rain it is both shelter and attitude. 1024×1024.",
    },
    "giantfolk-brasscrown": {
        "zh": "天灵盖敞开、露出一脑子转动齿轮的巨人，双手握着超大铁扳手，围裙上有常年油污。他随时在修东西，也可能是你。1024×1024。",
        "en": "A giant with an open crown of turning brass gears and an oversized iron wrench in both hands, apron permanently oiled. He is always fixing something, possibly you. 1024×1024.",
    },
    "skulls-crystal": {
        "zh": "半透明多面水晶雕的骷髅，柔光从颅芯透出来，两眼是紫水晶。切面折射的光会随观看角度变化。1024×1024。",
        "en": "A translucent faceted crystal skull, soft light shining from the core, two amethyst eyes. The refracted light shifts with your viewing angle. 1024×1024.",
    },
    "oddweapons-wrenchmace": {
        "zh": "一柄顶天立地的黄铜巨扳手，钳口夹着半块断齿轮当权杖用。缺了几颗螺栓，权威却不缺。1024×1024。",
        "en": "A colossal brass wrench used as a sceptre, its jaws clamped on half a broken gear. A few bolts are missing; the authority is not. 1024×1024.",
    },
    "oddweapons-sawdisc": {
        "zh": "一面立着的钢蓝环刃飞轮，一弧锯齿崩掉三颗露出光滑缺口。毂孔里穿根帆布缠柄的短棍，拿起来就能开工。1024×1024。",
        "en": "A steel-blue disc blade standing upright, three teeth missing from one arc leaving a smooth gap. A short cloth-wrapped stick through the hub makes it ready for work. 1024×1024.",
    },
    "wpn-helmet": {
        "zh": "横向青色发光面罩加铆钉护颊的复古未来战斗盔，天线小红灯是仅有的装饰。512×512，戴上先系紧下颌。",
        "en": "A retro-futuristic battle helm with a horizontal cyan visor, riveted cheek guards and one small red antenna light. 512×512; mind the chin strap.",
    },
    "xeno-strike-scene": {
        "zh": "捕食瞬间被定格：躯干伸到两倍长，晶板把光折成一圈圈油膜光带，肩上的诱饵果甩到前方滴着黏液。无眼无面无口，胃口却写满全身。1024×1024。",
        "en": "The strike moment frozen: torso stretched to twice its length, crystal plates fanning light into oily bands, the shoulder lure flung forward and dripping. No eyes, face or mouth; appetite is written all over it. 1024×1024.",
    },
    "planet-twin": {
        "zh": "两颗大小不一的星球被一条发光脐带连在一起，永不分离也永不平等。1024×1024。",
        "en": "Two planets of unequal size fused at one point, joined by a glowing umbilical band: inseparable, and never equal. 1024×1024.",
    },
    "stone-bone-hammer": {
        "zh": "灰白石锤头穿在打磨光滑的长骨柄上，柄尾系着麻绳防脱手。凿痕粗糙，握感可靠。1024×1024。",
        "en": "A grey stone head lashed to a polished long bone haft with hemp cord at the end against slipping. Rough chiselling, reliable grip. 1024×1024.",
    },
    "book-scroll": {
        "zh": "半展的魔法卷轴，其中一带符号隐隐泛着琥珀火光，余烬往上飘。焦橙与深青的墨迹都是纯虚构内容。1024×1024。",
        "en": "A half-open magical scroll, one band of symbols faintly glowing amber with embers drifting up. The burnt-orange and deep-teal ink is pure fiction. 1024×1024.",
    },
    "ammo-energy": {
        "zh": "锥形深灰金属弹壳里透出青色辉光核心，中段铬环配琥珀指示条。原子时代海报风的能量弹药，保质期不可考。1024×1024。",
        "en": "A tapered dark-grey cartridge glowing cyan at the core, chrome mid-band with an amber indicator strip. Atomic-age poster styling; shelf life unknown. 1024×1024.",
    },
    "aliens-six-eye": {
        "zh": "颈后伸出六只大小不一苍白眼球的佝偻拾荒者，浑身缠着捡来的破布和金属碎片。关节的蓝光说明他还活着，也还穷着。1024×1024。",
        "en": "A stooped alien scavenger with six pale eyeballs of varying size on the back of his neck, wrapped in salvaged rags and scrap. The blue glow in his joints says he is alive, and still broke. 1024×1024.",
    },
    "potion-teal-round": {
        "zh": "通透青绿液体的圆肚瓶，气泡不停上升，瓶肩缠一圈麻绳。削平的软木塞说明开它需要点手艺。1024×1024。",
        "en": "A round glass bottle of clear teal liquid, bubbles rising endlessly, a hemp cord around the shoulder. The pared cork suggests opening it takes some skill. 1024×1024.",
    },
    "impl-amulet": {
        "zh": "暗灰石板上嵌着脉动暖光的淡金纹章，坠底漏着细碎金屑。纹章图案全是虚构符号，真意大概是别问。1024×1024。",
        "en": "A heavy stone amulet hung by a fine chain, its dark rhomboid face set with a pulsing pale-gold geometric emblem, gold dust leaking from the bottom. The runes are invented; the meaning, apparently, is do not ask. 1024×1024.",
    },
    "furn-stool": {
        "zh": "一腿略短所以永远微倾的三腿旧圆凳，座面磨得油亮还留着几颗钉头。坐它的人都知道要挑对角。1024×1024。",
        "en": "A three-legged stool with one leg shorter, so it always tilts; the seat is oiled smooth and still holds a few nail heads. Its users know to sit on the diagonal. 1024×1024.",
    },
    "inst-fishbone-harp": {
        "zh": "用深海巨鱼肋骨搭框、头骨做共鸣箱的琴，牛筋弦，坠着贝壳和浮木珠子。弹它先要对海有敬意。1024×1024。",
        "en": "A harp framed with the ribs of a deep-sea giant fish, its skull for a soundbox, gut strings, shell and driftwood beads hung below. Playing it requires respect for the sea. 1024×1024.",
    },
    "phys-slingstaff": {
        "zh": "加长的 Y 形弹弓杖，皮兜绷紧兜着一颗浑圆河石，叉尖包了铁。甩出去全是离心力，算的是物理账。1024×1024。",
        "en": "An extended Y-shaped sling-staff, leather pocket taut around a smooth river stone, iron-capped prongs. Everything thrown leaves on centripetal force; it settles in physics. 1024×1024.",
    },
    "fang-croc": {
        "zh": "上下颌挤满一圈圈叠牙的鳄形怪，长短歪斜全不守规矩。嘴朝着你，它在等你数完一共几颗。1024×1024。",
        "en": "A crocodile horror whose jaws are packed with rings of uneven, crooked teeth. Its mouth faces you; it is waiting for you to finish counting. 1024×1024.",
    },
    "cur-glyph": {
        "zh": "幻彩蓝紫的圆币，花瓣浮雕配尖刺齿边，中心一枚菱形眼纹。虹彩流转说明它不只是一种面额。1024×1024。",
        "en": "An iridescent blue-purple coin with petal relief and spiked edge, a diamond eye at the centre. The shifting colours suggest more than one denomination. 1024×1024.",
    },
    "sym-hologeom": {
        "zh": "青色发光的立方几何符，四周绕着品红三角碎片和光珠，像一枚悬浮的全息印记。含义未录入，观感先到位。1024×1024。",
        "en": "A cyan glowing cube sigil ringed by magenta triangle shards and light orbs, like a floating holographic mark. Meaning not on file; the look lands first. 1024×1024.",
    },
    "wp-hoverrev": {
        "zh": "竖直悬浮的铬银左轮能量枪，腰间套一圈紫色光环，弹舱六孔分明。不用握，已自带失重感。1024×1024。",
        "en": "A chrome-silver revolver-style energy gun floating upright, a purple ring at its waist, six chambers clearly bored. No grip needed; it brings its own weightlessness. 1024×1024.",
    },
    "shield-woodround": {
        "zh": "木纹圆盾外圈一道黄铜铆钉环，中央铁凸磨得发亮。边缘的皮扣和旧痕都是它挡下来的证明。1024×1024。",
        "en": "A wood-grain round shield with a brass rivet ring, its central boss worn bright. The leather loops and old scars are proof of what it stopped. 1024×1024.",
    },
    "eblk-burst": {
        "zh": "一块正在爆裂的琥珀金多面能量石，火花和尖刺向外飞溅，核心亮得灼眼。变身进度百分之五十，请戴墨镜。1024×1024。",
        "en": "An amber-gold polyhedral energy stone bursting apart, sparks and shards flying, core blindingly bright. Transformation fifty percent complete; please wear shades. 1024×1024.",
    },
    "tel-starmap": {
        "zh": "黄铜立式望远镜，中段悬浮一圈紫色星云全息环，两侧各一只小目镜。一只眼天，一只眼看环。1024×1024。",
        "en": "A brass standing telescope with a tube aimed skyward, a purple nebula hologram ring at its middle, small eyepieces on both sides. One eye for the sky, one for the ring. 1024×1024.",
    },
    "zone-lead": {
        "zh": "一枚等离子球配环形电弧的霓虹线稿小徽章，384×384。远看是盏灯，近看是态度。",
        "en": "A neon-line badge of a plasma ball with a ring of arcs, 384×384. From afar a lamp; up close, an attitude.",
    },
    "figure-witch-gray": {
        "zh": "歪戴紫帽、提着古董灯的老巫婆，星纹拼布斗篷是拿剩布头拼的。非任何影视角色，纯原创。512×512。",
        "en": "A witch in a tilted purple hat carrying an antique lamp, her star-patch cloak sewn from leftover scraps. Original character, not from any screen. 512×512.",
    },
    "figure-farmer-hoe": {
        "zh": "铁红围裙配米色披肩的牧社女子，双手扶长柄铁锄，赤足脚环随步响。她和地界的关系，全写在这把锄上。1024×1024。",
        "en": "A herding-community woman in an iron-red apron and beige wrap, both hands on a long hoe, anklets chiming on bare feet. Her relation to the land is written in that hoe. 1024×1024.",
    },
    "char-laoshuan": {
        "zh": "背着竹编药篮的山野药师老栓，层叠土布长袍上常年沾着草屑。他认得山上一半的草，另一半正在研究。1024×1024。",
        "en": "Laoshuan, a mountain herbalist with a bamboo basket, his layered homespun robe forever flecked with grass. He knows half the mountain's plants and is studying the rest. 1024×1024.",
    },
    "pat-porcelain": {
        "zh": "一块带崩口的青花瓷残片，靛蓝缠枝花还完整，开片纹细密。它缺的那部分，据说是历史拿走的。1024×1024。",
        "en": "A chip of blue-and-white porcelain: the indigo scrollwork intact, the edge chipped, crackle fine. The missing part was, reportedly, taken by history. 1024×1024.",
    },
    "rider-centipede": {
        "zh": "戴青铜半面具骑六足蜈蚣的武士，一手缰绳一手竖持铁渔叉。坐骑每条腿都听令，除了横着走的那条。1024×1024。",
        "en": "A warrior in a bronze half-mask riding a six-legged armoured centipede, reins in one hand, a curved iron harpoon held upright in the other. Every leg obeys, except the sideways one. 1024×1024.",
    },
    "rider-wolf": {
        "zh": "骑巨狼、举斑驳铜镜、执陶汤勺的草原萨满，狐首冠压住一头乱发。装备混搭，仪式从不含糊。1024×1024。",
        "en": "A steppe shaman on a shaggy-maned wolf, mottled bronze mirror in one hand, clay ladle in the other, fox-head crown over wild hair. Mixed kit, never a sloppy ritual. 1024×1024.",
    },
    "bgun-pot": {
        "zh": "一只圆滚滚灰陶壶焊上铁嘴改成的枪，通风孔还飘着一缕青烟。木扳杆压下去之前，建议先开窗。1024×1024。",
        "en": "A gun rebuilt from a round grey teapot with a soldered iron spout; a wisp of blue smoke escapes the vent. Open a window before pulling that wooden lever. 1024×1024.",
    },
    "mod-commuter": {
        "zh": "藏青西装配白耳机的通勤白领，公文包和领带都是纪律。他耳机里放的什么，是全站最小的悬念。1024×1024。",
        "en": "A commuter in a navy suit with white earbuds; briefcase and tie are pure discipline. What is playing in those earbuds is the site's smallest mystery. 1024×1024.",
    },
    "oldfolk-staff": {
        "zh": "拄着顶端发芽发光藤杖的游方婆婆，斗篷补丁摞补丁，一只眼浑浊一只精明。指上几枚铜环是她的履历表。1024×1024。",
        "en": "A wandering crone leaning on a twisted staff sprouting a glowing bud, cloak patched upon patch, one eye clouded and one sharp. The copper rings on her fingers are her CV. 1024×1024.",
    },
    "imp-key": {
        "zh": "抱着一把比人还大的黄铜钥匙的淡青幽灵小鬼，雾尾拖在身后。它开过的门，大多不希望被找到。1024×1024。",
        "en": "A pale-cyan ghost imp hugging a brass key larger than itself, mist trailing behind. Most doors it has opened would rather not be found. 1024×1024.",
    },
    "flybeast-maned": {
        "zh": "石板蓝狮身的翼兽，破边蝙蝠巨翼全张，羽鬃围着咆哮的嘴。尾尖那撮穗子是它仅有的温柔。1024×1024。",
        "en": "A slate-blue lion-beast with fully spread, torn bat-wings, dark plumage around a roaring fanged mouth. The tassel at its tail tip is its only softness. 1024×1024.",
    },
    "flybeast-toad": {
        "zh": "戴一圈小蘑菇冠的胖飞蟾，彩玻璃纹虫翼一扇一扇，四平八稳地悬在空中。金色鼓眼表示它自己很得意。1024×1024。",
        "en": "A plump warty toad wearing a ring of tiny mushrooms, stained-glass insect wings fanning, floating with perfect composure. The golden bulge-eyes say it is pleased with itself. 1024×1024.",
    },
    "oddplants-snapper": {
        "zh": "长着捕兽颚式脑袋的球茎草，两排牙是软的，三只根须腿正迈步前扑。脑门几粒雀斑出卖了它的憨。1024×1024。",
        "en": "A bulbous plant with a trap-jaw head, teeth soft, three stubby root-legs mid-stride. The freckles on its forehead give away its good nature. 1024×1024.",
    },
    "jewels-beetle": {
        "zh": "拱背镶满翡翠马赛克的黄铜甲虫胸针，六条金腿卷成弹簧样。别嫌它吵，它只是想引起注意。1024×1024。",
        "en": "A brass beetle brooch with an emerald-mosaic back, two ruby eyes and six spring-coiled gold legs. It is not loud; it just wants attention. 1024×1024.",
    },
    "fairykid-lotus": {
        "zh": "盘坐粉莲台、手捧未开莲苞的胖仙童，头顶柔光环。莲苞什么时候开，他说了不算。1024×1024。",
        "en": "A chubby fairy child seated on a pink lotus, holding an unopened bud, soft halo overhead. When the bud opens is not up to him. 1024×1024.",
    },
    "foodjar-sprout": {
        "zh": "坛口钻出卷曲绿芽的圆陶发酵坛，拱盖小流口齐全。发酵到一半开始长芽，这坛泡菜很有主见。1024×1024。",
        "en": "A round clay fermentation jar with arched lid and spout; a curled green sprout has pushed out of the mouth. Half-fermented and already sprouting, this batch has opinions. 1024×1024.",
    },
    "hairyboot-curly": {
        "zh": "靴口卷着一圈羊毛的牛皮短靴，厚底负责耐磨，卷毛负责好看。1024×1024。",
        "en": "Cowhide ankle boots with a ring of curly wool at the cuff: thick soles for wear, curls for looks. 1024×1024.",
    },
    "hairyboot-snow": {
        "zh": "厚白毛边配齿纹厚底的雪地靴，专治没膝的雪和没道理的冷。1024×1024。",
        "en": "Heavy snow boots with thick white fur trim and cleated soles, built for knee-deep snow and unreasonable cold. 1024×1024.",
    },
    "oddbug-gear": {
        "zh": "足是齿轮、背着发条钥匙的蟋蟀，上满发条能叫一整夜。它自己就是自己的闹钟。1024×1024。",
        "en": "A cricket with gear-shaped legs and a wind-up key on its back; fully wound, it chirps all night. It is its own alarm clock. 1024×1024.",
    },
    "constellation-lantern": {
        "zh": "第三个虚构星座：星点连成一只吊纸灯笼，顶帽流苏齐全。夜行人认它，比认北斗暖和。1024×1024。",
        "en": "A third invented constellation: stars linked into a hanging paper lantern, cap and tassel complete. Night travellers find it warmer than the Dipper. 1024×1024.",
    },
    "nonsense-raincloud": {
        "zh": "头顶一小片随身积雨云的白领，雨只淋他一个，冷脸照走。全站最讲公平的天气系统。1024×1024。",
        "en": "A white-collar worker with a personal rain cloud overhead; it drenches him and no one else, and he walks on cold-faced. The site's fairest weather system. 1024×1024.",
    },
    "retrofolk-strongman": {
        "zh": "把两只巨型闹钟当杠铃举过头顶的马戏大力士，条纹举重服配小礼帽。他举的不是重量，是时间。1024×1024。",
        "en": "A circus strongman with a moustache and bowler hat, hoisting two giant alarm clocks overhead in a striped singlet. What he lifts is not weight; it is time. 1024×1024.",
    },
    "fusionfolk-skate": {
        "zh": "脚踩电动滑板、长剑拄地当平衡杖的古装侠客，一脸冷淡赶路。轻功换电池，传统向现代低头。1024×1024。",
        "en": "A long-haired swordsman in cloak and robe on an electric skateboard, his sword planted as a balance pole, cold-faced and in a hurry. Qinggong swapped for batteries. 1024×1024.",
    },
    "fusionfolk-ninja": {
        "zh": "背着保温外卖箱凌空狂奔的蒙面忍者，着急写在脚下，冷酷留在脸上。超时是忍者的大忌。1024×1024。",
        "en": "A masked ninja sprinting on air with an insulated delivery box on his back: urgency in the legs, coldness on the face. A ninja must never be late. 1024×1024.",
    },
    "blades-snakebarb": {
        "zh": "一条金属蛇盘成的长杆兵器，蛇头张口作矛尖，身节长满倒刺钩。防它比用它更需要想象力。1024×1024。",
        "en": "A polearm of coiled metal snake, its open jaws the spearpoint, segments bristling with barbed hooks. Defending against it takes more imagination than wielding it. 1024×1024.",
    },
    "giantfolk-mossfoot": {
        "zh": "双腿扭成树根、皮肤像老树皮的园丁巨人，肩扛一柄巨大锄头。他伺候的苗，从不敢误季。1024×1024。",
        "en": "A gardener giant with root-twisted legs and bark-like skin, a huge hoe on his shoulder. The seedlings in his care never dare miss a season. 1024×1024.",
    },
    "skulls-gourd": {
        "zh": "刻成南瓜灯笑脸的瓜形骷髅，顶上还冒着一卷带叶的瓜蒂。它负责万圣夜的门面，和全年的收成。1024×1024。",
        "en": "A gourd-shaped skull carved into a jack-o'-lantern grin, a curled leafy vine still on top. It fronts Halloween and underwrites the harvest. 1024×1024.",
    },
    "oddweapons-chainstar": {
        "zh": "球面长着一张笑脸的锁链流星锤，刺钝得东倒西歪，链扣松脱。它想逗你笑，再趁你笑的时候出手。1024×1024。",
        "en": "A chained meteor hammer whose spiked iron ball carries a smiley face; the barbs are dull and crooked, the links loose. It wants you laughing right up to the swing. 1024×1024.",
    },
    "wpn-pistol": {
        "zh": "带压力表和排气管的蒸汽手枪，发蓝钢枪管配黄铜铆钉。512×512，上汽三分钟，发射一瞬间。",
        "en": "A steam pistol with pressure gauge and exhaust pipe, blued steel barrel and brass rivets. 512×512: three minutes to build steam, one instant to fire.",
    },
    "xeno-rib-lurker": {
        "zh": "十二根肋骨自中心旋出的寄生掠食者，每根肋尖环生一圈吸盘，能像手指那样抓握。中心的淤紫共振膜荡着波纹，它在等你靠近。1024×1024。",
        "en": "A parasitic predator of twelve ribs rotating from a central hinge, each tipped with a ring of suckers that flex like fingers. The violet resonance membrane at its core ripples as it waits for you to come closer. 1024×1024.",
    },
    "planet-nested": {
        "zh": "一颗蛋壳状的半透明星球，壳里浮着一颗更小的发光行星。谁在里面谁在外面，暂无定论。1024×1024。",
        "en": "An eggshell-like translucent planet with a smaller glowing world floating inside. Which is in and which is out remains unsettled. 1024×1024.",
    },
    "food-burger": {
        "zh": "芝麻面包夹厚肉饼、芝士刚好化到边缘的汉堡，番茄酱蛋黄酱都露了出来。趁热，是它唯一的权利要求。1024×1024。",
        "en": "A sesame bun with a thick patty, cheese melted to the edges, lettuce, tomato and pickle, ketchup and mayo showing. Serve hot; it is its only demand. 1024×1024.",
    },
    "stone-mortar": {
        "zh": "厚重玄武岩石臼，内壁磨得发亮，臼底躺着几粒黑谷和一点白粉。旁边木杵是它的老搭档。1024×1024。",
        "en": "A heavy basalt mortar, its inner wall polished smooth, a few black grains and white powder in the bowl, the wooden pestle abandoned beside it, old partners. 1024×1024.",
    },
    "book-crystal": {
        "zh": "悬浮在半空、嵌着淡蓝水晶的封闭法典，冷蓝白光从刻纹里透出来，框缘结霜，冰晶环绕。没人敢开，也没人舍得关。1024×1024。",
        "en": "A closed codex floating mid-air, set with pale-blue crystals, cold white light seeping from its carved runes, frost on the frame and ice drifting around. Nobody dares open it; nobody can bear to close it. 1024×1024.",
    },
    "veh-propeller": {
        "zh": "奶白深红圆机身的单发轻型机，螺旋桨画成一个半透明旋转盘。怀旧海报风，飞的好像是上世纪的星期天。1024×1024。",
        "en": "A single-engine light plane in cream and deep red, its propeller drawn as a translucent disc. Nostalgic poster styling; it seems to fly on last century's Sundays. 1024×1024.",
    },
    "aliens-deep-space-hunter": {
        "zh": "胸口嵌一颗发绿光六棱核心的暗红甲壳猎手，肩背镰刀骨刃。它狩猎不为进食，为流程。1024×1024。",
        "en": "A dark-red carapace hunter with sickle bone-blades on its shoulders and a green-glowing hexagonal core in its chest. It hunts not for food but for process. 1024×1024.",
    },
    "potion-gold-square": {
        "zh": "方正厚玻璃瓶里的琥珀药液，厚瓶壁透出暖橙光，四角都磨圆了。年代久远，药效随缘。1024×1024。",
        "en": "Amber liquid in a square thick-glass bottle, warm orange light through the heavy walls, all four corners worn round. Old stock; effects as they come. 1024×1024.",
    },
    "castle-valley": {
        "zh": "踞在小土丘上的质朴要塞，木栅栏、包铁木门、窄木步道一样不缺。望塔上那根空旗杆，等一阵值得扬的风。1024×1024。",
        "en": "A plain hilltop fort on a low earth mound: palisade, iron-clad gate, narrow wall walk. The bare flagpole on its watchtower awaits a wind worth raising. 1024×1024.",
    },
    "furn-bench": {
        "zh": "三块板拼成的深栗木长板凳，一根靠背柱中段裂了也没换。它扛过的人，比裂口多得多。1024×1024。",
        "en": "A low chestnut bench of three planks with exposed nails; one back post has split mid-shaft and was never replaced. It has carried far more people than it has cracks. 1024×1024.",
    },
    "inst-tentacle-organ": {
        "zh": "八根音管全是活过来的章鱼触手的风琴，铜吸盘沿管排布，风箱一鼓就泛青光。曲单一律深海风。1024×1024。",
        "en": "An organ whose eight pipes are eight living octopus tentacles, copper suckers down their length, the bellows bringing a ghostly cyan glow. The repertoire is all deep-sea. 1024×1024.",
    },
    "scare-sack": {
        "zh": "脑袋是粗麻袋的变异稻草人，四颗纽扣眼没一颗对齐，四肢一长一短。它站得歪，因为稻草不肯听话。1024×1024。",
        "en": "A mutant scarecrow with a sack for a head, four crooked button eyes and mismatched limbs. It leans because the straw refuses to behave. 1024×1024.",
    },
    "fang-spider": {
        "zh": "八只眼簇成一排、嘴底下还盘一圈弯牙的蛛形怪，螯牙滴着黏液。前身高抬的姿势，是它打招呼的方式。1024×1024。",
        "en": "A spider-horror with eight eyes in one row and a coiled ring of curved teeth beneath, venom dripping from its fangs, front end raised. That posture is how it says hello. 1024×1024.",
    },
    "cur-hexcore": {
        "zh": "黑曜镶边的六边币，中心嵌一颗蓝白水晶球，缝隙里透青光。面额不可考，反光是真的。1024×1024。",
        "en": "A hex coin edged in obsidian with a blue-white crystal sphere at its centre, cyan light seeping from the seams. Denomination unknown; the shine is real. 1024×1024.",
    },
    "ship-saucer": {
        "zh": "经典碟形光束船，舷窗一圈青紫灯带，底部白光往下射。复古海报风，来访时间永远是夜里。1024×1024。",
        "en": "A classic disc-shaped beam ship, a ring of violet-cyan lights at the portholes, white beam shooting downward. Retro poster styling; visits are always at night. 1024×1024.",
    },
    "wp-amberstaff": {
        "zh": "四只爪齿环抱一颗琥珀宝珠的黄铜权杖，柄上缠着磨旧的深色握把。被它指过的人，运气不可预测。1024×1024。",
        "en": "A brass four-pronged staff whose claws cradle an amber orb, the haft wrapped in a worn dark grip. The luck of those it points at is unpredictable. 1024×1024.",
    },
    "shield-heraldic": {
        "zh": "红白菱形分格的六角纹章盾，中央一只金鹰浮雕，盾缘铆钉钉满一圈。漆面斑驳，鹰还精神。1024×1024。",
        "en": "A hexagonal heraldic shield in red-and-white lozenges with a gold eagle at its heart, rivets all around the rim. The paint is weathered; the eagle is not. 1024×1024.",
    },
    "mmon-gel": {
        "zh": "一团深绿半透明凝胶兽，一侧刚凝出凶脸，黏液往下滴。变形进度不详，脾气已经到位。1024×1024。",
        "en": "A dark-green translucent gel-beast, a fierce face congealing on one side, slime dripping down. Transformation progress unclear; the temper has arrived. 1024×1024.",
    },
    "tel-foldscope": {
        "zh": "筒身收成风箱褶皱的黄铜折叠镜，琥珀物镜配黑皮背带。带它出门像带一件旧乐器。1024×1024。",
        "en": "A brass folding monocular with bellows pleats, amber objective glass and a black leather strap. Carrying it is like carrying an old instrument. 1024×1024.",
    },
    "figure-witch-mushroom": {
        "zh": "红伞帽、树叶斗篷、拄琥珀木杖的年轻森林女巫，纯原创不蹭任何影视角色。512×512，法术自研。",
        "en": "A young forest witch with a red cap, leaf cloak and amber-wood staff; original design, no screen lookalike. 512×512, self-taught magic.",
    },
    "figure-farmer-pitchfork": {
        "zh": "褪色橄榄绿工装配旧皮靴的草原农工，一手干草叉一怀抱麦捆。1024×1024，收获的重量都写在肩上。",
        "en": "A steppe farmhand in faded olive canvas, leather belt and worn boots, four-tined pitchfork in one hand, a bundle of wheat in the other. 1024×1024; the weight of harvest is all in the arms.",
    },
    "char-qingluan": {
        "zh": "铬银网纱舞衣缀满品红与青光带的机械舞者青鸾，一动就是一场灯秀。1024×1024，谢幕时灯光先走。",
        "en": "Qingluan, a mechanical dancer in chrome-mesh tulle strung with magenta and cyan LED ribbons; every move is a light show. 1024×1024; at curtain call the lights leave first.",
    },
    "pat-macrame": {
        "zh": "燕麦与铁锈橙两色棉绳打结编成的挂带，底部流苏垂落，绳股纹理一根不乱。1024×1024。",
        "en": "A knotted cotton hanger in oatmeal and rust orange, fringe hanging below, every cord distinct. 1024×1024.",
    },
    "rider-tiger": {
        "zh": "骑白虎、双手各擎一枚铜磬的唐代宫廷乐师，高冠宽袖一样不少。老虎是坐骑，也是节拍器。1024×1024。",
        "en": "A Tang court musician in tall cap and wide green sleeves, riding a striped white tiger, a bronze chime in each hand. The tiger is both mount and metronome. 1024×1024.",
    },
    "bgun-horn": {
        "zh": "一整段兽角做的喇叭口铳，角身裹着开裂的绿苔和干草，还垂着一只陶火药瓶。开火前请先除苔。1024×1024。",
        "en": "A horn turned into a blunderbuss, bound with copper wire and leather, crusted with cracked moss and dry grass, a clay powder bottle hanging below. De-moss before firing. 1024×1024.",
    },
    "bgun-abacus": {
        "zh": "一副木算盘当弹仓的铳，墨玉骨珠被锈弹簧推着走，竹管枪身拿蜡线绑在框架上。打一打算一盘。1024×1024。",
        "en": "A blunderbuss whose magazine is a wooden abacus of jet and bone beads pushed along by rusty springs, the bamboo barrel lashed on with waxed thread. Every shot runs the numbers. 1024×1024.",
    },
    "mod-skater": {
        "zh": "拎着滑板还插兜的淡紫卫衣青年，红白旧板鞋配卡其工装裤。姿态比动作重要，他懂。1024×1024。",
        "en": "A young skater in a loose lilac hoodie and khakis, board in one hand, the other in his pocket. He knows posture matters more than tricks. 1024×1024.",
    },
    "oldfolk-crock": {
        "zh": "抱着青花大陶罐、缺两颗牙还笑得灿烂的胖婶，波点花头巾配赭黄围裙。她罐里装的是什么，取决于你饿不饿。1024×1024。",
        "en": "A plump old dame hugging a blue-and-white crock, two teeth missing, grinning broadly, polka-dot scarf and ochre apron. What is in the jar depends on how hungry you are. 1024×1024.",
    },
    "imp-moss": {
        "zh": "举着小蘑菇当伞、眼珠斜瞟的苔绿小鬼，蹄脚悬着表示没落地。一脸坏相，但伞是真借。1024×1024。",
        "en": "A moss-green imp with big bat ears and a long pointed nose, holding a small mushroom as an umbrella, hooves dangling off the ground. Mischievous look; the umbrella is genuinely borrowed. 1024×1024.",
    },
    "flybeast-bear": {
        "zh": "长着六条短腿和一对鹰翅的铁锈棕飞熊，睡眼惺忪地斜着往上飞。臀部螺旋花纹是它的唯一上进心。1024×1024。",
        "en": "A rust-brown flying bear with six stubby legs and a pair of eagle wings, climbing sideways with sleepy eyes. The spiral on its rump is its only ambition. 1024×1024.",
    },
    "oddplants-face": {
        "zh": "橙红花瓣中央开一张咧嘴笑脸的花，卷茎像虫腿，叶脉泛淡黄光。它对每个路过的人笑，不分场合。1024×1024。",
        "en": "A flower whose orange-red petals open into a grinning face, tendril legs for a stem, heart-shaped leaves glowing pale yellow. It smiles at every passerby, appropriate or not. 1024×1024.",
    },
    "oddplants-puff": {
        "zh": "淡紫绒球胀到快炸的蒲公英，飞絮全是小星星形状，一条根还卷成问号垂着。它在想什么，问号就是答案。1024×1024。",
        "en": "A lilac dandelion head swollen to bursting, its fluff all star-shaped, a root curled into a question mark. What it is thinking is the question mark. 1024×1024.",
    },
    "jewels-ingot": {
        "zh": "船形手工浇铸的金锭，顶盖一枚螺旋眼印记，侧边钻三个穿绳孔。坑洼和划痕都是它流通过的证据。1024×1024。",
        "en": "A boat-shaped hand-cast gold ingot stamped with a spiral-eye mark, three cord holes drilled along the side. Pits and scratches are proof of circulation. 1024×1024.",
    },
    "fairykid-lantern": {
        "zh": "背生光翼、手提暖光灯的提灯仙童，红金袍，仰头看得出神。他照亮的，多半不是路。1024×1024。",
        "en": "A fairy child with glowing wings and a warm paper lantern, red-and-gold robe, gazing upward, entranced. What he lights is mostly not the road. 1024×1024.",
    },
    "foodjar-jam": {
        "zh": "格纹布盖系绳的矮玻璃果酱瓶，红果酱还在冒泡。素牌上画着简单果形，口味自己猜。1024×1024。",
        "en": "A squat jam jar with a checked cloth tie-lid, the red jam still bubbling. A simple fruit drawing on the label; guess the flavour. 1024×1024.",
    },
    "hairyboot-tall": {
        "zh": "高及膝、通体裹蓬松长毛的长筒靴，一道系带束住全部。保暖到什么程度不好说，毛量是真的。1024×1024。",
        "en": "Knee-high boots wrapped in fluffy long fur, held by a single tie. How warm they are is debatable; the volume is not. 1024×1024.",
    },
    "oddbug-caterpillar": {
        "zh": "身侧排了六只咕噜眼的绒毛毛虫，短足倒腾得很快。看全六个方向，就不算慢。1024×1024。",
        "en": "A fuzzy caterpillar with six rolling eyes along its flank and short legs working fast. Seeing in six directions beats speed. 1024×1024.",
    },
    "oddbug-lantern": {
        "zh": "不靠自己发光、改提一盏小纸灯笼的萤火虫，薄翅轻颤。光是借的，浪漫是真的。1024×1024。",
        "en": "A firefly that carries a small paper lantern instead of making its own light, thin wings trembling. The light is borrowed; the romance is real. 1024×1024.",
    },
    "constellation-caterpillar": {
        "zh": "第四个虚构星座：星点连成一条蜷曲的毛虫，圆头卷尾。它爬得很慢，但整片天都在它身下。1024×1024。",
        "en": "A fourth invented constellation: stars linked into a curled caterpillar with round head and rolled tail. It crawls slowly, yet the whole sky lies beneath it. 1024×1024.",
    },
    "nonsense-balloon": {
        "zh": "被一束彩色气球轻轻拽离地面的人，斜飘着还一脸惬意。他计算过承重，只是没算风向。1024×1024。",
        "en": "A man lifted gently off the ground by a bunch of colourful balloons, drifting at an angle, perfectly content. He calculated the lift, not the wind. 1024×1024.",
    },
    "retrofolk-mime": {
        "zh": "一只手变成巨大橡胶鸡的默剧艺人，正对着空气墙壁较劲，一脸严肃。他的墙，比真的难翻。1024×1024。",
        "en": "A mime in beret and stripes whose hand has become a giant rubber chicken, straining against an invisible wall with utter seriousness. His wall is harder than a real one. 1024×1024.",
    },
    "fusionfolk-djpoet": {
        "zh": "穿唐朝袍子、拿毛笔当唱针搓碟的诗人，耳机一戴一脸淡定。平仄和对拍，他都在行。1024×1024。",
        "en": "A Tang-dynasty poet in headphones at a DJ mixer, using a writing brush as a stylus, perfectly calm. He knows both metre and beat. 1024×1024.",
    },
    "blades-hookscythe": {
        "zh": "刃头弯成一个大问号钩的锈镰，齿轮咬合处还挂着坠饰。它割什么先不问，问号先到。1024×1024。",
        "en": "A rusty scythe whose blade curves into a giant question mark, a small ornament dangling from the gear joint. It asks before it cuts. 1024×1024.",
    },
    "blades-twinaxe": {
        "zh": "一杆红绳缠柄的长戟，顶端两把斧刃一侧带锯齿，柄尾还藏着尖刺。买一把送三样，划算。1024×1024。",
        "en": "A red-cord-wrapped halberd with twin axe blades, one serrated, and a spike at the butt. Three weapons for the price of one. 1024×1024.",
    },
    "giantfolk-chimneycook": {
        "zh": "头顶砖砌小烟囱、往外冒灰烟的厨巨人，炭火橙的双眼，抡一柄巨型长柄勺。他炒一锅，够全站吃三天。1024×1024。",
        "en": "A chef giant with a brick chimney on his head puffing grey smoke, charcoal-orange eyes, wielding a giant cooking ladle. One wok feeds the site for three days. 1024×1024.",
    },
    "skulls-coral": {
        "zh": "镶满粉橙珊瑚、垂着海草、眼窝里还趴着两只小蟹的骷髅。海底的尽头不是寂静，是装修。1024×1024。",
        "en": "A skull crusted with pink-orange coral, shells and seaweed, two small crabs parked in its sockets. The end of the ocean is not silence; it is decoration. 1024×1024.",
    },
    "oddweapons-gearcross": {
        "zh": "三只齿轮互相咬合的黄铜连弩，弦绷得紧紧的却没有箭，一颗齿轮还崩了齿。它在等一个说法。1024×1024。",
        "en": "A brass crossbow with three exposed meshing gears, string drawn taut but no bolt loaded, one tooth missing from a cog. It is waiting for an explanation. 1024×1024.",
    },
    "wpn-shield": {
        "zh": "铆钉铜边、中央盾凸配叉形纹章的圆盾，512×512。标准配置，可靠，不抢戏。",
        "en": "A round shield with riveted brass rim, central boss and a forked relief emblem. 512×512. Standard issue, reliable, never upstaging.",
    },
    "xeno-mycelial-weaver": {
        "zh": "没有头、用五片湿毡质瓣孢囊藏起一串珠状眼的三足真菌掠食者，苍白菌丝甩出的孢丝正往茧缝里钻。它织完，就开饭。1024×1024。",
        "en": "A headless three-legged fungal predator whose spore-capsule opens into five wet felt lobes hiding a cluster of bead-eyes; pale hyphae fling threads that are already boring into the seams of a fist-sized prey cocoon. When the weaving is done, so is dinner. 1024×1024.",
    },
    "planet-eye": {
        "zh": "整颗星球表面是一只巨眼，瞳孔还是漩涡星系。它看你的同时，你也在它眼里迷路。1024×1024。",
        "en": "A planet whose whole surface is one giant eye, the pupil a spiral galaxy. While it watches you, you lose your way inside its gaze. 1024×1024.",
    },
    "food-pizza": {
        "zh": "厚边焦香、芝士拉丝到尖端的萨拉米披萨角，罗勒叶是刚摘的。趁热吃，凉了对不起这片海。1024×1024。",
        "en": "A slice of salami pizza with a charred thick crust, mozzarella stretching to the tip, basil freshly picked. Eat it hot; cold, it insults the sea it came from. 1024×1024.",
    },
    "figure-primitive-hunter": {
        "zh": "披红白兽皮、斜握长矛的原始猎人，乱发扎着兽骨饰。脚下那点投影是他和文明唯一的联系。1024×1024。",
        "en": "A bare-torsoed primitive hunter in a red-and-white hide, spear held at an angle, bones in his matted hair. The faint shadow at his feet is his only link to civilisation. 1024×1024.",
    },
    "book-bone": {
        "zh": "灰骨板装帧、脊背拱起雕骨肋条的禁书，纹章泛着病态绿光，底缘绕冷雾。翻开前请确认今天过得不错。1024×1024。",
        "en": "A dark grimoire bound in grey bone plates, carved ribs arching along the spine, its emblem glowing sickly green, cold fog at the base. Confirm you are having a good day before opening. 1024×1024.",
    },
    "veh-robot": {
        "zh": "铆钉青灰的工业机械臂，液压杆和波纹线管齐全，琥珀指示灯亮着。三指夹爪微张，随时可以接单。1024×1024。",
        "en": "A riveted blue-grey industrial arm with hydraulic rods and corrugated lines, amber indicator lit, three-finger gripper ready. It is open for work. 1024×1024.",
    },
    "flora-crystal-fungus": {
        "zh": "三层冰蓝半透菌盖层层叠生的灵菇，菌褶间透青光，露珠垂在边缘。按图鉴记载，它一晚上能长一层。1024×1024。",
        "en": "A crystal spirit-mushroom of three layered ice-blue translucent caps, cyan light between the gills, dew hanging from the edges. Per the catalogue, it gains a layer each night. 1024×1024.",
    },
    "potion-violet-slender": {
        "zh": "修长高瓶里的幽紫药液，瓶底嵌着发光晶核，尖头水晶塞还没拔。冷雾凝在瓶身，像刚出过一趟远门。1024×1024。",
        "en": "Violet liquid in a slender bottle with a glowing crystal core at the base, pointed crystal stopper still in. Cold mist on the glass suggests a long journey. 1024×1024.",
    },
    "castle-crystal": {
        "zh": "淡紫与冰蓝水晶筑成的尖塔城，主塔高耸，四座小塔环立，晶桥相连。塔底积着一滩紫光，浮着细晶屑，整座城在呼吸。1024×1024。",
        "en": "A crystal castle of pale-purple and ice-blue, one main spire flanked by four smaller towers joined by delicate bridges. A pool of violet light at its base and drifting crystal dust make the whole city seem to breathe. 1024×1024.",
    },
    "tech-scanner": {
        "zh": "深炮铜机身的手持扫描仪，传感头往下射一道暖琥珀细光束，在地面投出小小浮像。握把缠棱纹橡胶，磨痕说明它出过不少外勤。1024×1024。",
        "en": "A pistol-grip scanner in dark gunmetal, its wide sensor head casting a thin amber beam that projects a small floating image on the ground. The ribbed grip and wear marks say it has seen fieldwork. 1024×1024.",
    },
    "inst-crystal-drum": {
        "zh": "鼓面是一整张琥珀晶膜的鼓，敲一下暖光在皮下脉动一圈。鼓沿刻满同心符文，越敲越亮。1024×1024。",
        "en": "A drum whose head is a translucent amber crystal membrane; each strike sends a warm pulse rippling under the skin. Concentric runes circle the rim, brightening with every beat. 1024×1024.",
    },
    "scare-crow": {
        "zh": "拿乌鸦头骨当脑袋、双手是尖利鸟爪的变异稻草人，黑羽毛从稻草衬衫里穿出来，披一条破斗篷。它守田，也守自己的羽毛。1024×1024。",
        "en": "A mutant scarecrow with a bare crow's skull for a head and sharp talons for hands, black feathers poking through a straw-stuffed shirt under a torn black cloak. It guards the field, and its own plumage. 1024×1024.",
    },
    "astone-ringed": {
        "zh": "一块被风磨光的石头，刻满一圈圈同心环纹，沟槽泛青磷光，脊线上还冒几颗畸形晶疙瘩。每一圈都是风吹过的一年。1024×1024。",
        "en": "A wind-polished stone banded with concentric rings from pole to pole, cyan phosphorescence in the grooves, misshapen crystal lumps along the ridge. Each ring is a year of wind. 1024×1024.",
    },
    "cur-gearquartz": {
        "zh": "三枚透亮的水晶齿轮币叠在一起，齿圈和刻面折出细碎光，中心各嵌深色晶核。转起来，就是零钱在唱歌。1024×1024。",
        "en": "Three translucent crystal gear-coins stacked together, toothed rims and facets throwing splinters of light, each with a dark core at its centre. Spin them, and loose change sings. 1024×1024.",
    },
    "ship-crystalftr": {
        "zh": "白色晶体质感的折叠翼战机，多片锐利翼面后掠，尾部紫色引擎舱幽幽发光。像一架折纸折出来的杀器。1024×1024。",
        "en": "A white crystal-texture fighter with swept-back folding wings, its violet engine bay glowing softly. A weapon folded out of origami. 1024×1024.",
    },
    "boot-jet": {
        "zh": "棕色皮高帮靴配亮青圈的银色脚踝环，后跟喷口正喷橙火。起飞姿势请保持镇定，靴子不管风向。1024×1024。",
        "en": "Brown leather high-tops with a silver ankle ring lit cyan, orange flame jetting from the heel. Keep calm for takeoff; the boots do not handle wind. 1024×1024.",
    },
    "shield-tower": {
        "zh": "粉色皮带横竖扣紧的木塔盾，中央嵌黑铁拱窗徽记。包得结实，也包得好看。1024×1024。",
        "en": "A wooden tower shield lashed with pink leather straps front and back, a black iron arch-window emblem at its heart. Bound tight, and bound prettily. 1024×1024.",
    },
    "mmon-bonewolf": {
        "zh": "背脊竖满尖刺、鬃毛像凝胶一样往下淌的骨白狼兽，四足踏地很稳。它淌的不是毛，是正在凝固的脾气。1024×1024。",
        "en": "A bone-white spiny wolf-beast with a gel-like mane dripping down its neck, four feet planted firmly. What drips is not fur; it is temper, setting. 1024×1024.",
    },
    "cr-raven": {
        "zh": "羽色带蓝紫虹彩的渡鸦，歪着头审视你。腿间缝隙抠得干干净净，专业到每一根羽毛都有岗位。512×512。",
        "en": "A raven with blue-purple iridescent plumage, head tilted in appraisal. Even the gap between its legs is cleanly cut out; every feather has a post. 512×512.",
    },
    "figure-elf-woodland": {
        "zh": "长尖耳、苔绿兜帽、背后小弓的森林精灵，纯原创不属任何影视或文学角色。512×512，护林员编外人员。",
        "en": "A woodland elf with long pointed ears, moss-green hooded jerkin and a small bow; original, belonging to no screen or book. 512×512, unofficial ranger.",
    },
    "figure-farmer-pole": {
        "zh": "芥末黄长裙配条纹织带的高原采收女，竹竿顶端扎着谷穗当收货清单。背篓不满，人不回家。1024×1024。",
        "en": "A highland harvester in a mustard-yellow dress with woven bands, her long bamboo pole topped with grain ears as a shopping list. The basket stays empty until she does not. 1024×1024.",
    },
    "char-aluo": {
        "zh": "手执绣绷的古风绣娘阿萝，汉服精美到针脚里有排班。她一针下去，图案自己会找位置。1024×1024。",
        "en": "Aluo, an ancient-style embroideress with an embroidery hoop, her hanfu so fine the stitches keep a roster. Where her needle lands, the pattern finds its place. 1024×1024.",
    },
    "pat-block": {
        "zh": "刻着叶果浮雕的橡木印花版，凹槽里还染着深胡桃色油墨。每一张印花纸的前身，都在这里。1024×1024。",
        "en": "An oak printing block carved with leaf-and-fruit relief, its grooves still stained with dark walnut ink. Every printed sheet starts here. 1024×1024.",
    },
    "rider-crane": {
        "zh": "骑单足白鹤、一手罗盘一手拂尘的宋代道士，白须宽袖，神情沉静。鹤单足站着，他比鹤还稳。1024×1024。",
        "en": "A Song-dynasty Taoist riding a one-legged white crane, bronze compass in one hand, white horsetail whisk in the other. The crane stands on one leg; he is steadier. 1024×1024.",
    },
    "bgun-lantern": {
        "zh": "整个枪身就是一只暖橙纸灯笼的怪枪，竹骨清晰，纸面带几处焦痕还透着微光。放炮和照明，它一把全包。1024×1024。",
        "en": "A gun whose whole body is a warm orange paper lantern, bamboo ribs visible, scorch marks on the paper still faintly glowing. Firing and lighting, all in one. 1024×1024.",
    },
    "mod-rider": {
        "zh": "亮黄蓝冲锋衣配反光马甲的外卖骑手，手机和背包带都不离手，跑鞋磨旧。他和时间的关系是单方面的。1024×1024。",
        "en": "A delivery rider in a bright yellow-blue shell with reflective vest, phone and bag strap never leaving his hands, trainers worn thin. His relationship with time is one-sided. 1024×1024.",
    },
    "mod-driver": {
        "zh": "墨绿飞行夹克罩连帽卫衣的夜班司机，保温杯和充电线是全部行李。有点困，但友善的底色没变。1024×1024。",
        "en": "A night-shift driver in an olive flight jacket over a grey hoodie; thermos and charging cable are his whole luggage. Sleepy, but friendly underneath. 1024×1024.",
    },
    "oldfolk-gardener": {
        "zh": "戴夸张羽毛帽的老园丁，怀里盆栽的叶子上长着小脸，鼻尖还沾着土。得意洋洋，因为他刚培育出了表情包。1024×1024。",
        "en": "An old gardener in a flamboyant feathered hat, the plant in his arms growing tiny faces on its leaves, dirt on his nose. He is delighted: he just bred an emoji. 1024×1024.",
    },
    "imp-teacup": {
        "zh": "额头一支螺旋独角、双手死死抱住偷来茶杯的砖红皮小鬼，一只耳朵还打折了。偷可以，撒手不行。1024×1024。",
        "en": "A brick-red imp with a spiral horn, crooked teeth, a stolen teacup clutched in both arms, one pointed ear bent. Stealing is fine; letting go is not. 1024×1024.",
    },
    "flybeast-serpent": {
        "zh": "深绿鳞片的蛇龙兽，背上一排破边蛾翼，鲶鱼脸带须满口尖牙。小爪鳍在空中划动，像在游一条看不见的河。1024×1024。",
        "en": "A dark-green serpent-dragon, S-shaped body undulating, a row of ragged moth-wings on its back, catfish face with whiskers and a mouthful of fangs, small claw-fins paddling the air as if swimming an invisible river. 1024×1024.",
    },
    "oddplants-corkscrew": {
        "zh": "粉红螺旋茎一路拧上去的喇叭藤，顶端的花长满细牙，一片叶子还长成小手掌。开瓶可以，先过它这关。1024×1024。",
        "en": "A trumpet vine with a pink corkscrew stem, its flower full of fine teeth, one leaf shaped like a small hand. Open the bottle, but get past it first. 1024×1024.",
    },
    "jewels-sun": {
        "zh": "太阳形大金牌上画着一张眨眼笑脸，七颗异色宝石围一圈，底下还挂个小铃铛。戴上它，打招呼自带音效。1024×1024。",
        "en": "A sun-shaped gold medallion with a winking smile, seven differently coloured gems around it and a small bell below. Greet the world with sound effects. 1024×1024.",
    },
    "jewels-hairpin": {
        "zh": "簪首雕着翠蓝鸟头的长银簪，鸟眼一颗小珍珠，垂着金链玉珠流苏。插上它，头发里住进一只不走的鸟。1024×1024。",
        "en": "A long silver hairpin with a kingfisher-blue bird head, a pearl for an eye, gold chain and jade-bead tassel hanging below. Wear it, and a bird lives in your hair. 1024×1024.",
    },
    "fairykid-ribbon": {
        "zh": "绿袍小仙童凌空起舞，双手甩出的两道长丝带萦绕周身，双髻簪花，闭眼陶醉。丝带比他有主意。1024×1024。",
        "en": "A green-robed fairy child dancing in mid-air, two long ribbons swirling around him, flower pins in his twin buns, eyes closed in delight. The ribbons have more ideas than he does. 1024×1024.",
    },
    "foodjar-cloud": {
        "zh": "圆肚铸铁小锅里煮着翻涌的小白云，还冒一缕蒸汽。揭盖之前，请确认锅里没有下雨。1024×1024。",
        "en": "A squat cast-iron pot with stubby feet and a curved handle, little white clouds boiling inside, a wisp of steam escaping. Before lifting the lid, confirm it is not raining in there. 1024×1024.",
    },
    "hairyboot-bunny": {
        "zh": "通体覆长绒兔毛的软皮小拖鞋，顶上一颗圆绒球。穿上它，每一步都在道歉。1024×1024。",
        "en": "Soft leather slippers covered in long rabbit fur with a round pom-pom on top. Every step in them apologises. 1024×1024.",
    },
    "oddbug-violin": {
        "zh": "圆鞘翅形如一把小提提琴的亮壳甲虫，小头六足。它不吱吱叫，它演奏。1024×1024。",
        "en": "A glossy beetle whose round wing-cases are shaped like a tiny violin, small head, six legs. It does not chirp; it performs. 1024×1024.",
    },
    "constellation-teapot": {
        "zh": "第五个虚构星座：四角星和细连线构成的茶壶座，无散星无星云。天上的茶壶从来不倒水，只负责被认出来。1024×1024。",
        "en": "A fifth invented constellation: a teapot of solid four-point stars and thin lines, no loose stars, no nebulae. The celestial teapot never pours; it just waits to be recognised. 1024×1024.",
    },
    "constellation-lotus": {
        "zh": "星点连成层瓣绽放莲花的莲花座，又一个虚构星座。坐在天上的莲花，从不对外开放。1024×1024。",
        "en": "The Lotus constellation, stars linked into layered petals in bloom, another invention. The lotus in the sky is not open to the public. 1024×1024.",
    },
    "nonsense-mop": {
        "zh": "把一团棉线拖把当胡须和头发的富态哲人，一手高举说教一手端茶杯，一脸睿智。他的道理，拖一次地就有一打。1024×1024。",
        "en": "A portly philosopher using a cotton mop for beard and hair, one hand raised in lecture, the other holding a teacup, face full of wisdom. His truths come a dozen per mopping. 1024×1024.",
    },
    "retrofolk-spaceman": {
        "zh": "五十年代铁皮玩具范儿的圆头盔太空人，握着花束形射线枪，小短腿悬空漂着，一脸茫然。他还没适应失重。1024×1024。",
        "en": "A fifties tin-toy spaceman with a round helmet, holding a bouquet-shaped ray gun, stubby legs drifting above the floor, looking lost. He has not adapted to weightlessness. 1024×1024.",
    },
    "fusionfolk-hologram": {
        "zh": "悬空盘坐、手指点向空白全息竹简屏的发髻书生，一脸专注。屏幕上什么都没有，他说这叫留白。1024×1024。",
        "en": "A top-knotted scholar in hanfu, sitting cross-legged in mid-air, finger pointed at a blank floating holographic bamboo screen, deeply focused. The screen is empty; he calls it negative space. 1024×1024.",
    },
    "blades-tentmace": {
        "zh": "锤头分裂成数条金属触手的黑铁战锤，每条末端坠一颗尖刺锤球。挨一下，等于挨好几下。1024×1024。",
        "en": "A black-iron war hammer whose head splits into curling metal tentacles, each tipped with a spiked ball. One hit counts as several. 1024×1024.",
    },
    "giantfolk-twisthorn": {
        "zh": "头顶弯牛角、提着巨大锈肉钩的杂货巨人，油渍围裙配条纹长衫。他不问你要买什么，先问你饿不饿。1024×1024。",
        "en": "A giant grocer with curved ox horns and a swollen belly, oil-stained apron over a striped gown, amber-gold eyes, a huge rusty meat hook in hand. He does not ask what you want to buy; first he asks whether you are hungry. 1024×1024.",
    },
    "giantfolk-starvex": {
        "zh": "背破烂星纹旗、手指细长如星轨的瘦高巨人，长袍补丁摞补丁，握一柄巨刃长戟。他放牧的东西，一般人看不见。1024×1024。",
        "en": "A gaunt giant herder with a ragged star-flag on his back, fingers thin as star-tracks, a patched wanderer's robe and wide hat, deep-purple eyes, a great-bladed halberd in hand. What he herds, most people cannot see. 1024×1024.",
    },
    "skulls-ember": {
        "zh": "粗糙火山岩颅骨上，熔岩橙裂纹蛛网般爬满颅芯，双眼是两团炽热余烬。它还在冷却，脾气还没有。1024×1024。",
        "en": "A rough volcanic-rock skull, lava-orange cracks webbing across the crown, both eyes burning embers. It is still cooling; the temper has not arrived yet. 1024×1024.",
    },
    "oddweapons-steamgonne": {
        "zh": "箍着铆钉铁环的粗短黄铜炮，压力表上一个刻度都没有，尾部阀门嘶嘶漏汽。炮口熏黑还瘪了一块，威力请目测。1024×1024。",
        "en": "A stubby brass cannon hoop-banded with riveted iron rings, a welded-on pressure gauge with no markings at all, the rear valve hissing steam. The muzzle is soot-blackened and dented; power is a matter of eyeballing. 1024×1024.",
    },
    "wpn-flail": {
        "zh": "链节分明、铁球带刺的战链锤，链环空隙完整保留。512×512，实物级还原，挥起来自带保险条款。",
        "en": "A war flail with clearly legible links and a spiked iron ball, the chain gaps fully preserved. 512×512, object-level fidelity; swinging it comes with its own insurance clause.",
    },
    "flora-pulse-pod": {
        "zh": "半透明囊壶半开一道缝，壶里猎物残影悬在琥珀消化液中，三根倒刺须像护肋拱在壶顶。整株微微鼓胀，它还在消化。1024×1024。",
        "en": "A translucent pod half-open along a vertical seam, a prey's dissolving silhouette suspended in amber digestive fluid, pulsing veins on the wall, three stiff barbed tendrils arched over the top like guard ribs. The whole plant swells faintly; it is still digesting. 1024×1024.",
    },
    "planet-molten-core": {
        "zh": "地表龟裂、裂缝里透出炽热熔核的星球，看着像随时要炸。本地居民搬家频率很高。1024×1024。",
        "en": "A planet with cracked crust and glowing molten core showing through the fissures, looking ready to blow. Local residents move house frequently. 1024×1024.",
    },
    "food-cake": {
        "zh": "三层海绵夹粉奶油、切面淋草莓酱的蛋糕，顶上一颗带叶草莓，白瓷盘配薄荷。它只负责好看，热量归你。1024×1024。",
        "en": "A three-layer sponge with pink strawberry cream, strawberry sauce on the cut face, a leaf-topped strawberry on top, white plate and mint. It handles the looks; the calories are yours. 1024×1024.",
    },
    "figure-primitive-gatherer": {
        "zh": "编发缀羽毛骨珠、背负藤篮的采集女，手捧一把刚采的红果，腰间挂只小葫芦。她的一天，从找到早餐开始。1024×1024。",
        "en": "A smiling primitive woman, braids tied with feathers and bone beads, woven basket on her back, a handful of just-picked red berries and a small gourd at her waist. Her day starts when she finds breakfast. 1024×1024.",
    },
    "ammo-shotgun": {
        "zh": "深红纸壳配黄铜底帽的霰弹，卷边压痕分明，纸壳带细微磨损。复古狩猎海报风，工伤预备役。1024×1024。",
        "en": "A dark-red paper shotgun shell with a brass base cap, crimp marks crisp, the paper faintly worn. Retro hunting poster styling; occupational injury reserve. 1024×1024.",
    },
    "veh-engine": {
        "zh": "横置铸铁锅炉配大飞轮和三组活塞连杆的主机，黄铜阀组手轮齐全，烟囱冒淡烟。蒸汽朋克的心脏，烧的是煤和信仰。1024×1024。",
        "en": "A horizontal cast-iron boiler engine with a big flywheel and three piston rods, brass valve assembly and handwheel complete, chimney trailing pale smoke. A steampunk heart fuelled by coal and conviction. 1024×1024.",
    },
    "flora-floating-pod": {
        "zh": "悬浮半空的金色球形种荚，外壳分片镶满发光籽粒，卷曲藤须往下垂。它不落地，因为还没挑好地方。1024×1024。",
        "en": "A golden spherical seed-pod floating in mid-air, its shell panelled with glowing grains, curly vine tendrils hanging below. It stays aloft because it has not picked a place yet. 1024×1024.",
    },
    "impl-staff": {
        "zh": "插地而立的瘤节浮木法杖，杖头三股木叉托着一枚缓缓悬浮的黑曜石球，一道细紫光绕球公转。它从不发言，只是悬着。1024×1024。",
        "en": "A gnarled driftwood staff planted in the ground, its three-pronged head cradling a slowly floating polished obsidian sphere with a thin purple light orbiting it. It never speaks; it simply hovers. 1024×1024.",
    },
    "castle-ruins": {
        "zh": "锯齿状坍塌的深灰断塔，藤蔓苔藓爬满每块残石，蕨草从石缝里钻出来。城堡输了，植物赢了。1024×1024。",
        "en": "Two sawtooth-collapsed granite towers, thick vines and moss over every stone, ferns pushing from the cracks. The castle lost; the plants won. 1024×1024.",
    },
    "tech-grav": {
        "zh": "悬在地面上的六角拉丝钢平台，三只喷口铺出柔和青光垫，光垫里漂着细微尘埃。上去可以，下来随缘。1024×1024。",
        "en": "A hexagonal brushed-steel platform hovering above the ground, three nozzles laying down a soft cyan light-pad with fine dust drifting inside it. Getting on is easy; getting off is fate. 1024×1024.",
    },
    "phys-powerfist": {
        "zh": "指节是黄铜墩、手背架粗钢弹簧的增压拳套，出拳全靠弹簧回弹加速。物理外挂，明码标价。1024×1024。",
        "en": "A purely mechanical powered gauntlet, brass-knuckle joints, two thick steel springs and piston rods on the back of the hand; every punch accelerates on spring rebound. Physics, openly equipped. 1024×1024.",
    },
    "scare-sunflower": {
        "zh": "脑袋是开歪的向日葵、胳膊换成扭动藤蔓的变异稻草人，指头是荆棘刺，胸口裂开往外涌稻草。它朝着太阳，太阳躲着它。1024×1024。",
        "en": "A mutant scarecrow with a crooked sunflower for a head, drooping petals, arms of twisting green vines, thorn fingers, straw bursting from a split chest. It faces the sun; the sun avoids it. 1024×1024.",
    },
    "astone-geode": {
        "zh": "一块其貌不扬的灰壳晶洞石，裂口处透出琥珀光泽，里面插着一簇尖利紫晶。低调是外壳，不是本意。1024×1024。",
        "en": "An unassuming grey-shelled geode, amber light glowing from the crack, a cluster of sharp purple crystals inside. The modesty is a shell, not the intent. 1024×1024.",
    },
    "sym-bronze": {
        "zh": "深青铜符碑上浮雕螺旋纹和三角符，属于世上不存在的文字体系。看得懂的人，还没出生。1024×1024。",
        "en": "A dark bronze stele carved with spiral and triangular sigils in a writing system that exists nowhere on earth. Whoever can read it has not been born yet. 1024×1024.",
    },
    "ship-orbpod": {
        "zh": "青铜质感的球形母舰舱，舷窗铆钉和触须状凸起布满表面，沉甸甸地悬着。它看着比你还紧张这次降落。1024×1024。",
        "en": "A bronze-textured spherical mothership pod, portholes, rivets and tentacle-like protrusions all over, hovering with obvious heaviness. It looks more nervous about the landing than you are. 1024×1024.",
    },
    "boot-maglev": {
        "zh": "白色科幻战靴，鞋底一圈青光把整只靴子托离地面，两侧还藏着螺旋桨。走路即将变成选配项。1024×1024。",
        "en": "White sci-fi battle boots, a cyan anti-gravity halo lifting the whole boot off the ground, a small propeller hidden on each side. Walking is about to become optional. 1024×1024.",
    },
    "eblk-starcube": {
        "zh": "青粉双色半透明晶石立方，内部一颗青色星形核心发光，外圈绕粉色碎晶。变身道具里的标准件。1024×1024。",
        "en": "A cyan-and-pink translucent crystal cube with a glowing star-shaped core inside, pink crystal shards orbiting it. A standard part among transformation items. 1024×1024.",
    },
    "mmon-chrome": {
        "zh": "蜷身而立的铬银机械兽人，橙红大眼和触手状的嘴，身后碎晶正从身上剥落。变形进入后半场，请勿靠近。1024×1024。",
        "en": "A chrome-silver mechanical beast-man crouched upright, orange-red eyes and a tentacle mouth, crystal shards flaking off behind it. Transformation is in its late stages; keep clear. 1024×1024.",
    },
    "cr-otter": {
        "zh": "抱着河石不撒手的浓毛水獭，浅色腹毛配棕毛。那块石头是它的碗、玩具和传家宝。512×512。",
        "en": "A thick-furred otter clutching a river stone, brown coat with a pale belly. That stone is its bowl, toy and heirloom. 512×512.",
    },
}
