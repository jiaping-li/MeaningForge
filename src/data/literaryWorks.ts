import type { LiteraryWork } from "@/types/literaryMapping";

export const builtInLiteraryWorks: LiteraryWork[] = [
  {
    id: "xinqiji-xijiangyue",
    title: "辛弃疾《西江月·夜行黄沙道中》",
    author: "辛弃疾",
    language: "zh",
    tradition: "Chinese classic",
    publicationNote: "南宋词；用于 MeaningForge formative study 的短文本案例。",
    sourceNote: "研究者整理的 public-domain 诗词片段；用于测试低负担 replacement probe。",
    passages: [
      {
        id: "xijiangyue-main",
        label: "明月、稻花香与蛙声",
        chapter: "主案例",
        text: "明月别枝惊鹊，清风半夜鸣蝉。稻花香里说丰年，听取蛙声一片。",
      },
    ],
  },
  {
    id: "dufu-chunwang",
    title: "杜甫《春望》",
    author: "杜甫",
    language: "zh",
    tradition: "Chinese classic",
    publicationNote: "唐诗；建议作为 MeaningForge transfer case，测试动作化/情感化意象。",
    sourceNote: "研究者整理的 public-domain 诗词片段；用于检验 replacement probe 是否能迁移到非气味/声音型载体。",
    passages: [
      {
        id: "chunwang-transfer",
        label: "国破、草木、花与鸟",
        chapter: "Transfer case",
        text: "国破山河在，城春草木深。感时花溅泪，恨别鸟惊心。",
      },
    ],
  },
  {
    id: "luxun-medicine",
    title: "鲁迅《药》",
    author: "鲁迅",
    language: "zh",
    tradition: "Chinese classic",
    publicationNote: "现代短篇小说；建议作为 Narrative Transfer Case，测试具体物件如何承载社会意义。",
    sourceNote: "本地全文来自维基文库《藥》渲染文本；当前默认片段是研究者整理的 narrative transfer case。",
    fullTextUrl: "/books/luxun-medicine-zh.txt",
    passages: [
      {
        id: "medicine-human-blood-bun",
        label: "人血馒头与治病承诺",
        chapter: "Narrative transfer case",
        text:
          "“这是包好！这是与众不同的。你想，趁热的拿来，趁热的吃下。”横肉的人只是嚷。“包好，包好！这样的趁热吃下。这样的人血馒头，什么痨病都包好！”",
      },
    ],
  },
  {
    id: "luxun-aq",
    title: "鲁迅《阿Q正传》",
    author: "鲁迅",
    language: "zh",
    tradition: "Chinese classic",
    publicationNote: "现代中篇叙事；建议作为 Long Narrative Case，测试章节推进中的意义关系和社会讽刺。",
    sourceNote: "本地全文来自维基文库《阿Q正传》渲染文本；默认片段是研究者整理的精神胜利法 narrative packet。",
    fullTextUrl: "/books/luxun-aq-zh.txt",
    passages: [
      {
        id: "aq-spiritual-victory",
        label: "精神胜利法与自我改写",
        chapter: "Long narrative case",
        text:
          "阿Q在形式上打败了，被人揪住黄辫子，在壁下碰了四五个响头，闲人这才心满意足的得胜的走了，阿Q站了一刻，心里想，“我总算被儿子打了，现在的世界真不像样……”于是也心满意足的得胜的走了。阿Q想在心里的，后来每每说出口来，所以凡有和阿Q玩笑的人们，几乎全知道他有这一种精神上的胜利法。",
      },
    ],
  },
  {
    id: "luxun-blessing",
    title: "鲁迅《祝福》",
    author: "鲁迅",
    language: "zh",
    tradition: "Chinese classic",
    publicationNote: "现代短篇小说；建议作为 Social Ritual Case，测试仪式、声音和人物命运如何共同建构意义。",
    sourceNote: "本地全文来自维基文库《祝福》渲染文本；默认片段是研究者整理的祝福仪式 narrative packet。",
    fullTextUrl: "/books/luxun-blessing-zh.txt",
    passages: [
      {
        id: "blessing-ritual-sound",
        label: "祝福仪式与被排除的人",
        chapter: "Narrative transfer case",
        text:
          "这是鲁镇年终的大典，致敬尽礼，迎接福神，拜求来年一年中的好运气的。杀鸡，宰鹅，买猪肉，用心细细的洗，女人的臂膊都在水里浸得通红，有的还带著绞丝银镯子。煮熟之后，横七竖八的插些筷子在这类东西上，可就称为“福礼”了，五更天陈列起来，并且点上香烛，恭请福神们来享用，拜的却只限于男人，拜完自然仍然是放爆竹。",
      },
    ],
  },
  {
    id: "luxun-hometown",
    title: "鲁迅《故乡》",
    author: "鲁迅",
    language: "zh",
    tradition: "Chinese classic",
    publicationNote: "现代短篇小说；建议作为 Memory Contrast Case，测试记忆图像、现实遭遇和希望隐喻的关系。",
    sourceNote: "本地全文来自维基文库《故乡》渲染文本；默认片段是研究者整理的圆月与少年闰土 narrative packet。",
    fullTextUrl: "/books/luxun-hometown-zh.txt",
    passages: [
      {
        id: "hometown-moon-runtu",
        label: "圆月、少年闰土与记忆图像",
        chapter: "Narrative transfer case",
        text:
          "这时候，我的脑里忽然闪出一幅神异的图画来：深蓝的天空中挂着一轮金黄的圆月，下面是海边的沙地，都种着一望无际的碧绿的西瓜，其间有一个十一二岁的少年，项带银圈，手捏一柄钢叉，向一匹猹尽力的刺去，那猹却将身一扭，反从他的胯下逃走了。",
      },
    ],
  },
  {
    id: "libai-jingyesi",
    title: "李白《静夜思》",
    author: "李白",
    language: "zh",
    tradition: "Chinese classic",
    publicationNote: "唐诗；建议作为 formative session 的 warm-up，不作为主分析材料。",
    sourceNote: "研究者整理的 public-domain 诗词片段；用于解释 replacement probe 的基本操作。",
    passages: [
      {
        id: "jingyesi-warmup",
        label: "明月光与思故乡",
        chapter: "Warm-up",
        text: "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
      },
    ],
  },
  {
    id: "dream-red-chamber",
    title: "Dream of the Red Chamber",
    author: "Cao Xueqin",
    language: "zh",
    tradition: "Chinese classic",
    publicationNote: "Qing dynasty novel; public-domain Chinese text from Project Gutenberg.",
    sourceNote: "Full traditional Chinese text is stored locally at /books/dream-of-the-red-chamber-zh.txt.",
    fullTextUrl: "/books/dream-of-the-red-chamber-zh.txt",
    passages: [
      {
        id: "dream-red-chamber-placeholder",
        label: "Full text not loaded",
        chapter: "Project Gutenberg",
        text:
          "Click Load full text to import the complete Chinese Project Gutenberg text of 紅樓夢 into the reader workspace.",
      },
    ],
  },
  {
    id: "journey-west",
    title: "Journey to the West",
    author: "Wu Cheng'en",
    language: "zh",
    tradition: "Chinese classic",
    publicationNote: "Ming dynasty novel; public-domain Chinese text from Project Gutenberg.",
    sourceNote: "Full traditional Chinese text is stored locally at /books/journey-to-the-west-zh.txt.",
    fullTextUrl: "/books/journey-to-the-west-zh.txt",
    passages: [
      {
        id: "journey-west-placeholder",
        label: "Full text not loaded",
        chapter: "Project Gutenberg",
        text:
          "Click Load full text to import the complete Chinese Project Gutenberg text of 西遊記 into the reader workspace.",
      },
    ],
  },
  {
    id: "hamlet",
    title: "Hamlet",
    author: "William Shakespeare",
    language: "en",
    tradition: "World classic",
    publicationNote: "Public-domain English play from Project Gutenberg.",
    sourceNote: "Full English text is stored locally at /books/hamlet.txt.",
    fullTextUrl: "/books/hamlet.txt",
    passages: [
      {
        id: "hamlet-placeholder",
        label: "Full text not loaded",
        chapter: "Project Gutenberg",
        text:
          "Click Load full text to import the complete Project Gutenberg text of Hamlet into the reader workspace.",
      },
    ],
  },
  {
    id: "great-gatsby",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    language: "en",
    tradition: "World classic",
    publicationNote: "Public-domain English novel from Project Gutenberg.",
    sourceNote: "Full English text is stored locally at /books/the-great-gatsby.txt.",
    fullTextUrl: "/books/the-great-gatsby.txt",
    passages: [
      {
        id: "gatsby-placeholder",
        label: "Full text not loaded",
        chapter: "Project Gutenberg",
        text:
          "Click Load full text to import the complete Project Gutenberg text of The Great Gatsby into the reader workspace.",
      },
    ],
  },
  {
    id: "pride-and-prejudice-full",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    language: "en",
    tradition: "World classic",
    publicationNote: "Public-domain novel from Project Gutenberg.",
    sourceNote: "Full text is stored locally at /books/pride-and-prejudice.txt and can be loaded into chapters.",
    fullTextUrl: "/books/pride-and-prejudice.txt",
    passages: [
      {
        id: "pride-placeholder",
        label: "Full text not loaded",
        chapter: "Project Gutenberg",
        text:
          "Click Load full text to import the complete Project Gutenberg text of Pride and Prejudice into the reader workspace.",
      },
    ],
  },
];
