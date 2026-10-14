export type GameId = 'sand' | 'match3' | '2048' | 'birds' | 'memory' | 'mole' | 'mines' | 'reaction'
export interface Game { id: GameId; name: string; subtitle: string; category: string; tag: string; color: string; difficulty: string; duration: string }
export const games: Game[] = [
  { id: 'sand', name: '沙画消消', subtitle: '一桶一桶，装走小烦恼', category: '休闲解压', tag: '新游上线', color: 'sand', difficulty: '轻松入门', duration: '3–5 分钟' },
  { id: 'match3', name: '开心消消乐', subtitle: '萌萌小动物，连消好心情', category: '休闲解压', tag: '新游上线', color: 'candy', difficulty: '轻松入门', duration: '3–5 分钟' },
  { id: '2048', name: '经典 2048', subtitle: '数字碰撞，让快乐翻倍', category: '益智烧脑', tag: '人气 TOP 1', color: 'peach', difficulty: '轻松入门', duration: '3–5 分钟' },
  { id: 'birds', name: '愤怒的小鸟', subtitle: '拉满弹弓，把烦恼一击打飞', category: '街机经典', tag: '新游上线', color: 'sky', difficulty: '瞄准挑战', duration: '3–5 分钟' },
  { id: 'memory', name: '记忆翻翻乐', subtitle: '翻开惊喜，找到你的默契', category: '益智烧脑', tag: '锻炼记忆', color: 'lavender', difficulty: '轻松入门', duration: '2–3 分钟' },
  { id: 'mole', name: '地鼠出没', subtitle: '眼疾手快，烦恼一敲就散', category: '休闲解压', tag: '解压首选', color: 'butter', difficulty: '手速挑战', duration: '30 秒' },
  { id: 'mines', name: '小小扫雷', subtitle: '步步为营，解锁安全地带', category: '益智烧脑', tag: '脑力挑战', color: 'blue', difficulty: '小有挑战', duration: '3–5 分钟' },
  { id: 'reaction', name: '极速反应', subtitle: '准备好了吗？测测你的神反应', category: '敏捷挑战', tag: '手速测试', color: 'pink', difficulty: '轻松入门', duration: '30 秒' },
]
export const categories = ['全部游戏', '益智烧脑', '休闲解压', '街机经典', '敏捷挑战']
