import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Chess } from 'chess.js';

// Static image imports for full production bundler compatibility (Vite / Cloudflare Pages / GitHub)
import wp from './assets/images/w-p.png';
import wn from './assets/images/w-n.png';
import wb from './assets/images/w-b.png';
import wr from './assets/images/w-r.png';
import wq from './assets/images/w-q.png';
import wk from './assets/images/w-k.png';
import bp from './assets/images/b-p.png';
import bn from './assets/images/b-n.png';
import bb from './assets/images/b-b.png';
import br from './assets/images/b-r.png';
import bq from './assets/images/b-q.png';
import bk from './assets/images/b-k.png';
import { 
  Skull, 
  Shield, 
  Crown, 
  Sparkles, 
  Flame, 
  Volume2, 
  VolumeX, 
  Undo2, 
  RotateCcw, 
  User, 
  Swords, 
  Compass, 
  Award,
  CircleAlert,
  Frown,
  Trophy
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   TYPES AND CONFIGURATIONS
═══════════════════════════════════════════════ */
interface Piece {
  id: string; // stable ID like "w-p-a"
  color: 'w' | 'b';
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  square: string; // algebraic representation like "e2"
}

interface Opponent {
  id: number;
  name: string;
  elo: string;
  icon: string;
  threatLabel: string;
  threatClass: string;
  desc: string;
  greeting: string;
  checkLine: string;
  checkmateLine: string;
  stalemateLine: string;
  difficulty: 'easy_blunder' | 'medium_block' | 'aggressive_medium' | 'hard_minimax';
}

interface PiecePersonality {
  name: string;
  role: string;
  emoji: string;
  pitch: number; // synthesizer base pitch
  moves: string[];
  captures: string[];
}

const OPPONENTS: Opponent[] = [
  {
    id: 0,
    name: 'Peão do Túmulo',
    elo: 'ELO 400 · Iniciante',
    icon: '💀',
    threatLabel: 'Poder de Ossos: Instável',
    threatClass: 'from-amber-600 to-amber-900',
    desc: 'Mortos-vivos ressuscitados guardam estes portões sagrados. Seus movimentos são lentos e eles cometem erros amadores frequentes.',
    greeting: 'Mais um tolo ousou despertar os túmulos... Bem-vindo ao teu eterno sepulcro, reles mortal.',
    checkLine: 'O-o que?! Como ousas ameaçar o general das trevas?! Isso é impossível!',
    checkmateLine: 'Não... NÃO! O exército ruiu! Minha coroa rachou no lodo...',
    stalemateLine: 'Um impasse fúnebre... Tu tens sorte de eu estar cansado de empunhar espadas.',
    difficulty: 'easy_blunder'
  },
  {
    id: 1,
    name: 'Masmorra Abissal',
    elo: 'ELO 800 · Fácil',
    icon: '🏰',
    threatLabel: 'Estrutura Viva: Sólida',
    threatClass: 'from-slate-500 to-slate-800',
    desc: 'O próprio calabouço ganha vida. Ele foca o jogo no controle central sólido e prefere a proteção absoluta de suas fortalezas.',
    greeting: 'O labirinto de ferro te acolhe. Sinta o tremor das rochas pretas que sustentam os teus túmulos.',
    checkLine: 'Tu bates nas minhas pedras em vão, as linhas de defesa continuam cerradas!',
    checkmateLine: 'A fortaleza desmoronou... e eu fui enterrado sob minhas próprias muralhas.',
    stalemateLine: 'Nem luz nem trevas passam deste labirinto. Um empate de pedra sólida.',
    difficulty: 'medium_block'
  },
  {
    id: 2,
    name: 'Princesa da Peste',
    elo: 'ELO 1200 · Técnico',
    icon: '🔮',
    threatLabel: 'Névoa Pestilenta: Alta',
    threatClass: 'from-green-600 to-emerald-950',
    desc: 'Estrategista impiedosa que utiliza ataques velozes de flanco e punições implacáveis das diagonais de cura profana.',
    greeting: 'A praga invisível já infectou teu tabuleiro. Cada avanço que fazes apenas apressa tua decomposição.',
    checkLine: 'Teu xeque é apenas uma febre temporária. A infecção verdadeira recomeça agora!',
    checkmateLine: 'Conseguiste dissipar minha peste... mas o veneno permanecerá em tua alma!',
    stalemateLine: 'A névoa se acalmou, estagnada. Ninguém vive, ninguém morre hoje.',
    difficulty: 'aggressive_medium'
  },
  {
    id: 3,
    name: 'Cavaleiro do Pesadelo',
    elo: 'ELO 1600 · Lendário',
    icon: '🐴',
    threatLabel: 'Chamas do Purgatório: Letal',
    threatClass: 'from-purple-600 to-purple-950',
    desc: 'Montado num corcel de cinzas eternas. Ele calcula todas as linhas táticas usando a fúria suprema do abismo eterno.',
    greeting: 'Nenhum ser vivo jamais sobreviveu às runas do meu galope da morte. Saca tua espada, mortal.',
    checkLine: 'XEQUE?! Apenas uma cócega em minha armadura de obsidiana! Sinta as chamas contra-atacarem!',
    checkmateLine: 'O corcel das sombras foi derrubado... Minha lenda chegou ao fim. Tu és digno de respeito.',
    stalemateLine: 'A eternidade cessou em empate térmico. Que as chamas descansem por hoje.',
    difficulty: 'hard_minimax'
  }
];

const WHITE_PIECES_PERSONALITIES: Record<string, PiecePersonality> = {
  p: {
    name: "Peão",
    role: "Peão",
    emoji: "♟",
    pitch: 620,
    moves: [
      "A-avançar? Tem certeza cega disso, meu comandante?",
      "Um passo para a frente... Por favor, cubra os meus flancos!",
      "Apertando as correias do escudo... Consigo aguentar!",
      "Firmeza na vanguarda! A luz nos protege!"
    ],
    captures: [
      "Eu consegui! Eu realmente herdei a bravura dos heróis!",
      "Toma essa! O recruta aqui também sabe empunhar a lança!",
      "Pela glória solar legítima! Um inimigo purificado!"
    ]
  },
  n: {
    name: "Cavalo",
    role: "Cavalo",
    emoji: "♞",
    pitch: 520,
    moves: [
      "Pelos flancos oblíquos! Nenhum herói anda em linha perfeitamente reta!",
      "No galope heróico da justiça!",
      "Saltando sobre os abismos com vigor celestial!",
      "O destino nos aguarda na próxima colina!"
    ],
    captures: [
      "O mal será pisoteado sob os cascos da esperança!",
      "A lança solar divina rasga as espessas trevas!",
      "Por honra e glória imperial, desmoronai!"
    ]
  },
  b: {
    name: "Bispo",
    role: "Bispo",
    emoji: "♝",
    pitch: 460,
    moves: [
      "Que as diagonais da verdade absoluta guiem nossos passos.",
      "Purificando este solo corrompido de cinzas!",
      "A luz brilha mais forte quando focada de soslaio.",
      "Votos solenes de integridade moral."
    ],
    captures: [
      "Cinzas às cinzas! Seja purgado pelo fogo místico!",
      "O sacrilégio inimigo termina sob meu selo celestial!",
      "A heresia foi sumariamente banida deste reino!"
    ]
  },
  r: {
    name: "Torre",
    role: "Torre",
    emoji: "♜",
    pitch: 340,
    moves: [
      "A muralha majestosa desloca-se pesadamente.",
      "Mantenham o cordão tático sob estrita disciplina!",
      "Minha estrutura de pedra rúnica é inquebrável.",
      "Avançando no trilho da retidão solar."
    ],
    captures: [
      "Esmagado e sepultado pelas fundações sagradas do império!",
      "As defesas das trevas rruíram sob minha colisão retilínea!",
      "Impacto absoluto de concreto divino!"
    ]
  },
  q: {
    name: "Rainha",
    role: "Rainha",
    emoji: "♛",
    pitch: 780,
    moves: [
      "Todo o grid de combate curva-se ante o meu desígnio!",
      "Eu marcho pessoalmente para varrer os demônios deste tabuleiro!",
      "Disparando feixes purificadores de fótons solaris!",
      "Nenhuma sombra subsistirá contra meu fulgor real."
    ],
    captures: [
      "Ajoelhe-se diante do julgamento absoluto e eterno!",
      "Tua insignificância foi sua merecida ruína, fantoche escuro.",
      "Cinzas ao vento! Teu eclipse acaba aqui!"
    ]
  },
  k: {
    name: "Rei",
    role: "Rei",
    emoji: "♚",
    pitch: 400,
    moves: [
      "Um recuo real estratégico... Para coordenar a grande vitória.",
      "O Trono Solar soberano prevalecerá sobre este abismo infernal.",
      "A vida e segurança de meus súditos são meu dever real.",
      "Nunca percais a fé no destino solar!"
    ],
    captures: [
      "Até o rei deve empunhar sua espada santa no calor da batalha!",
      "A lâmina dourada da providência fez justiça!",
      "Cortamos a cabeça do dragão da heresia!"
    ]
  }
};

const BLACK_PIECES_PERSONALITIES: Record<string, PiecePersonality> = {
  p: {
    name: "Peão",
    role: "Peão",
    emoji: "♟",
    pitch: 280,
    moves: [
      "Mais servos para a grande fogueira do sacrifício.",
      "Escorregando silenciosamente na lama da morte.",
      "As sombras rastejam com as garras afiadas.",
      "Nós marchamos, mesmo que seja apenas para servir de escudo."
    ],
    captures: [
      "Sua chama tola de luz se extinguiu fácil demais...",
      "Sangue fresco para revigorar o murcho solo maldito!",
      "Comido de dentro para fora pelas trevas famintas."
    ]
  },
  n: {
    name: "Cavalo",
    role: "Cavalo",
    emoji: "♞",
    pitch: 240,
    moves: [
      "O pesadelo cavalga solto sob o manto eterno!",
      "Fuga inútil, a foice oblíqua te colherá no ar!",
      "Transpondo barreiras para decepar vossas linhas!",
      "O relinchar dos cavalos de ferro anuncia a ruína."
    ],
    captures: [
      "O som dos seus ossos estalando é música para mim!",
      "Foste ceifado no glorioso salto do terror abissal!",
      "Armadura arrebentada, corpo triturado na poeira!"
    ]
  },
  b: {
    name: "Bispo",
    role: "Bispo",
    emoji: "♝",
    pitch: 260,
    moves: [
      "Que as diagonais envenenadas derretam vossos passos santificados!",
      "Com o sangue puro dos fiéis, ergueremos nosso santuário.",
      "As escrituras profanas demandam suplício incansável.",
      "Rituais de profanação nas linhas de batalha."
    ],
    captures: [
      "Corrosão instantânea! Teu escudo desfez-se em ácido escuro!",
      "Sua fé estúpida queima no óleo negro das trevas!",
      "Abocanhado pela pálida criatura do eclipse!"
    ]
  },
  r: {
    name: "Torre",
    role: "Torre",
    emoji: "♜",
    pitch: 180,
    moves: [
      "As correntes da bastilha arrastam-se na rocha fria.",
      "Barricando qualquer réstia de esperança no sofrimento.",
      "O castelo de obsidiana clama por escravos eternos.",
      "Pesada, inexorável e ensurdecedora... A torre marcha!"
    ],
    captures: [
      "Sepultado no calabouço mais escuro do esquecimento!",
      "Vossos gritos pavimentam as fundações da nossa vitória!",
      "Aprisionado para sempre nas trevas perpétuas."
    ]
  },
  q: {
    name: "Rainha",
    role: "Rainha",
    emoji: "♛",
    pitch: 620,
    moves: [
      "A regente das trevas decreta seu banimento da existência!",
      "Que o eclipse gélido sufoque suas preces medíocres.",
      "Bailando na ruína e na tempestade de sangue perpétua.",
      "Sua dita inocência solar derrete diante da fúria da lua profana."
    ],
    captures: [
      "Deliciosamente indefeso... Chore ao ver seu império ruir!",
      "Tão doce desespero... Extinguir seu guerreiro mais valente me excita!",
      "Veja, reles comandante, quão frágil é sua valente tropa."
    ]
  },
  k: {
    name: "Rei",
    role: "Rei",
    emoji: "♚",
    pitch: 210,
    moves: [
      "O trono de crânios nos protegerá de vossas espadas fracas.",
      "A soberania sombria reinará por mais dez mil milênios.",
      "Recuar é apenas armar o próximo abatedouro de almas.",
      "As trevas consomem o próprio tempo."
    ],
    captures: [
      "Eu mesmo amasso vosso crânio real com meus punhos!",
      "O cetro negro de sangue derruba a ilusão!",
      "Sua ousadia heróica morre sob minha sola imunda."
    ]
  }
};

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

const PIECE_IMAGES: Record<string, string> = {
  'w-p': wp,
  'w-n': wn,
  'w-b': wb,
  'w-r': wr,
  'w-q': wq,
  'w-k': wk,
  'b-p': bp,
  'b-n': bn,
  'b-b': bb,
  'b-r': br,
  'b-q': bq,
  'b-k': bk,
};

// Piece-Square Evaluation tables for custom AI Minimax searching (evaluating from Black's perspective)
const pawnPST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const knightPST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const bishopPST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const rookPST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const queenPST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  5,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const kingPST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

/* ═══════════════════════════════════════════════
   INITIALIZE PIECE RECT STABLE IDS
═══════════════════════════════════════════════ */
function getInitialPieces(): Piece[] {
  const list: Piece[] = [];
  
  // White Pieces (Row 1 and 2)
  for (let i = 0; i < 8; i++) {
    const file = String.fromCharCode(97 + i);
    list.push({ id: `w-p-${file}`, color: 'w', type: 'p', square: `${file}2` });
  }
  const whiteOrder: ('r' | 'n' | 'b' | 'q' | 'k')[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let i = 0; i < 8; i++) {
    const file = String.fromCharCode(97 + i);
    list.push({ id: `w-${whiteOrder[i]}-${file}`, color: 'w', type: whiteOrder[i], square: `${file}1` });
  }

  // Black Pieces (Row 7 and 8)
  for (let i = 0; i < 8; i++) {
    const file = String.fromCharCode(97 + i);
    list.push({ id: `b-p-${file}`, color: 'b', type: 'p', square: `${file}7` });
  }
  const blackOrder: ('r' | 'n' | 'b' | 'q' | 'k')[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let i = 0; i < 8; i++) {
    const file = String.fromCharCode(97 + i);
    list.push({ id: `b-${blackOrder[i]}-${file}`, color: 'b', type: blackOrder[i], square: `${file}8` });
  }

  return list;
}

function squareToCoords(square: string) {
  const col = square.charCodeAt(0) - 97; // a=0, b=1 ...
  const row = 8 - parseInt(square.charAt(1)); // 8=0, 7=1 ...
  return { row, col };
}

/* ═══════════════════════════════════════════════
   SOUND SYNTHESIZER (WEB AUDIO API)
═══════════════════════════════════════════════ */
let audioCtx: AudioContext | null = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

const playBeep = (freq = 600, duration = 0.04) => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq + Math.random() * 80 - 40, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // browser auto-play block catch
  }
};

const playSlideSound = () => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.22);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch (e) {}
};

const playCaptureSound = () => {
  try {
    const ctx = getAudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.32);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(80, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(20, ctx.currentTime + 0.32);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.36);
    osc2.stop(ctx.currentTime + 0.36);
  } catch (e) {}
};

const playVictoryFanfare = () => {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const playTone = (f: number, start: number, dur: number, wave: OscillatorType = 'triangle') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(f, now + start);
      gain.gain.setValueAtTime(0.08, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    };

    playTone(261.63, 0.0, 0.15); // C4
    playTone(329.63, 0.15, 0.15); // E4
    playTone(392.00, 0.30, 0.15); // G4
    playTone(523.25, 0.45, 0.6, 'sawtooth'); // C5
  } catch (e) {}
};

const playDefeatFanfare = () => {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const playTone = (f: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + start);
      gain.gain.setValueAtTime(0.1, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    };

    playTone(220.00, 0.0, 0.25); // A3
    playTone(207.65, 0.25, 0.25); // G#3
    playTone(196.00, 0.50, 0.25); // G3
    playTone(146.83, 0.75, 0.7); // D3
  } catch (e) {}
};

const playPromotionChime = () => {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const playTone = (f: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + start);
      gain.gain.setValueAtTime(0.06, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    };

    playTone(440.00, 0.0, 0.12); // A4
    playTone(554.37, 0.08, 0.12); // C#5
    playTone(659.25, 0.16, 0.12); // E5
    playTone(880.00, 0.24, 0.4); // A5
  } catch (e) {}
};

/* ═══════════════════════════════════════════════
   CHESS AI ALGORITHM (ALPHA-BETA MINIMAX)
═══════════════════════════════════════════════ */
function evaluateBoard(chessInstance: Chess): number {
  let score = 0;
  const board = chessInstance.board();
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell) continue;

      const type = cell.type;
      const color = cell.color;
      const pieceValue = PIECE_VALUES[type];
      let pValue = 0;

      let tableRow = r;
      let tableCol = c;
      if (color === 'w') {
        tableRow = 7 - r; // invert row lookup for white positional tables
      }

      if (type === 'p') pValue = pawnPST[tableRow][tableCol];
      else if (type === 'n') pValue = knightPST[tableRow][tableCol];
      else if (type === 'b') pValue = bishopPST[tableRow][tableCol];
      else if (type === 'r') pValue = rookPST[tableRow][tableCol];
      else if (type === 'q') pValue = queenPST[tableRow][tableCol];
      else if (type === 'k') pValue = kingPST[tableRow][tableCol];

      const absoluteScore = pieceValue + pValue;
      if (color === 'b') {
        score += absoluteScore; // Black is maximizing player
      } else {
        score -= absoluteScore; // White is minimizing
      }
    }
  }
  return score;
}

function minimax(chessInstance: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): { score: number; move: any } {
  if (depth === 0 || chessInstance.isGameOver()) {
    return { score: evaluateBoard(chessInstance), move: null };
  }

  const moves = chessInstance.moves({ verbose: true });
  moves.sort((a, b) => {
    const scoreA = a.captured ? 100 : 0 + (a.promotion ? 50 : 0);
    const scoreB = b.captured ? 100 : 0 + (b.promotion ? 50 : 0);
    return scoreB - scoreA;
  });

  let bestMove: any = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chessInstance.move(move);
      const ev = minimax(chessInstance, depth - 1, alpha, beta, false).score;
      chessInstance.undo();

      if (ev > maxEval) {
        maxEval = ev;
        bestMove = move;
      }
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chessInstance.move(move);
      const ev = minimax(chessInstance, depth - 1, alpha, beta, true).score;
      chessInstance.undo();

      if (ev < minEval) {
        minEval = ev;
        bestMove = move;
      }
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

/* ═══════════════════════════════════════════════
   SPEAKER PORTRAIT HELPER
═══════════════════════════════════════════════ */
const getSpeakerSprite = (speaker: { name: string; role: string; portrait: string }, isBot: boolean): string | null => {
  const nameLower = (speaker.name || "").toLowerCase();
  
  if (!isBot) {
    if (nameLower.includes("peão")) return PIECE_IMAGES['w-p'];
    if (nameLower.includes("cavalo") || nameLower.includes("cavaleiro")) return PIECE_IMAGES['w-n'];
    if (nameLower.includes("bispo")) return PIECE_IMAGES['w-b'];
    if (nameLower.includes("torre")) return PIECE_IMAGES['w-r'];
    if (nameLower.includes("rainha") || nameLower.includes("dama")) return PIECE_IMAGES['w-q'];
    if (nameLower.includes("rei")) return PIECE_IMAGES['w-k'];
    if (nameLower.includes("arauto")) return PIECE_IMAGES['w-r'];
    
    // Emojis fallback
    if (speaker.portrait === "♟") return PIECE_IMAGES['w-p'];
    if (speaker.portrait === "♞") return PIECE_IMAGES['w-n'];
    if (speaker.portrait === "♝") return PIECE_IMAGES['w-b'];
    if (speaker.portrait === "♜") return PIECE_IMAGES['w-r'];
    if (speaker.portrait === "♛") return PIECE_IMAGES['w-q'];
    if (speaker.portrait === "♚") return PIECE_IMAGES['w-k'];
    
    return PIECE_IMAGES['w-k'];
  } else {
    if (nameLower.includes("peão")) return PIECE_IMAGES['b-p'];
    if (nameLower.includes("masmorra") || nameLower.includes("torre")) return PIECE_IMAGES['b-r'];
    if (nameLower.includes("princesa") || nameLower.includes("rainha") || nameLower.includes("dama")) return PIECE_IMAGES['b-q'];
    if (nameLower.includes("cavaleiro") || nameLower.includes("cavalo")) return PIECE_IMAGES['b-n'];
    if (nameLower.includes("bispo")) return PIECE_IMAGES['b-b'];
    if (nameLower.includes("rei")) return PIECE_IMAGES['b-k'];
    
    // Emojis/Icons fallback
    if (speaker.portrait === "♟") return PIECE_IMAGES['b-p'];
    if (speaker.portrait === "♞") return PIECE_IMAGES['b-n'];
    if (speaker.portrait === "♝") return PIECE_IMAGES['b-b'];
    if (speaker.portrait === "♜") return PIECE_IMAGES['b-r'];
    if (speaker.portrait === "♛") return PIECE_IMAGES['b-q'];
    if (speaker.portrait === "♚") return PIECE_IMAGES['b-k'];
    if (speaker.portrait === "💀") return PIECE_IMAGES['b-p'];
    if (speaker.portrait === "🏰") return PIECE_IMAGES['b-r'];
    if (speaker.portrait === "🔮") return PIECE_IMAGES['b-q'];
    if (speaker.portrait === "🐴") return PIECE_IMAGES['b-n'];
    
    return PIECE_IMAGES['b-k'];
  }
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [opponent, setOpponent] = useState<Opponent>(OPPONENTS[0]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Chess model states
  const [chessObj, setChessObj] = useState<Chess>(() => new Chess());
  const [pieces, setPieces] = useState<Piece[]>(getInitialPieces);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [lastMoveSquares, setLastMoveSquares] = useState<{ from?: string; to?: string }>({});
  
  // Game states
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameResult, setGameResult] = useState<'victory' | 'defeat' | 'draw' | null>(null);
  const [isPending, startTransition] = useTransition();

  // Dialog System - separate state for Bot and Player so they are displayed simultaneously at top and bottom
  const [botSpeaker, setBotSpeaker] = useState<{
    name: string;
    role: string;
    portrait: string;
  }>({
    name: "Peão do Túmulo",
    role: "Inimigo Imperial",
    portrait: "💀"
  });
  const [botText, setBotText] = useState("Selecione um adversário para começar a batalha...");
  const [botDisplayedText, setBotDisplayedText] = useState("");
  const botTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [playerSpeaker, setPlayerSpeaker] = useState<{
    name: string;
    role: string;
    portrait: string;
  }>({
    name: "Arauto do Reino",
    role: "Guia da Luz",
    portrait: "🏰"
  });
  const [playerText, setPlayerText] = useState("Prepara-te para defender o Trono no tabuleiro eterno.");
  const [playerDisplayedText, setPlayerDisplayedText] = useState("");
  const playerTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drag and Drop State and Handlers
  const handleDragStart = (e: React.DragEvent, square: string) => {
    if (!isPlayerTurn || isAiThinking || gameResult || promotionPending) {
      e.preventDefault();
      return;
    }
    const pOnTile = pieces.find(p => p.square === square);
    if (!pOnTile || pOnTile.color !== 'w') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", square);
    if (isAudioEnabled) playBeep(320 + (square.charCodeAt(0) * 1.5), 0.06);
    setSelectedSquare(square);
    const moves = chessObj.moves({ square: square, verbose: true }) as any[];
    setValidMoves(moves.map(m => m.to));
  };

  const handleDrop = (e: React.DragEvent, targetSquare: string) => {
    e.preventDefault();
    const sourceSquare = e.dataTransfer.getData("text/plain");
    if (!sourceSquare) return;
    
    if (validMoves.includes(targetSquare) && sourceSquare === selectedSquare) {
      executePlayerMove(sourceSquare, targetSquare);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // VFX
  const [shakeBoard, setShakeBoard] = useState(false);
  const [flashSquare, setFlashSquare] = useState<string | null>(null);
  const [promotedSquare, setPromotedSquare] = useState<string | null>(null);

  // Blood VFX System
  interface BloodPuddle {
    id: string;
    square: string;
    createdAt: number;
    initialOpacity: number;
    rotation: number;
    scale: number;
    variant: number;
  }

  interface BloodParticle {
    id: string;
    col: number;
    row: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    gravity: number;
  }

  const [bloodPuddles, setBloodPuddles] = useState<BloodPuddle[]>([]);
  const [bloodParticles, setBloodParticles] = useState<BloodParticle[]>([]);

  // Update loop for particles and puddles
  useEffect(() => {
    if (bloodParticles.length === 0 && bloodPuddles.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // Update particle positions, apply gravity, fade alpha
      setBloodParticles(prev => {
        if (prev.length === 0) return prev;
        return prev
          .map(p => {
            const nextX = p.x + p.vx;
            const nextY = p.y + p.vy;
            const nextVy = p.vy + 0.12; // gravity drop
            const nextAlpha = p.alpha - 0.055; // fade speed
            return {
              ...p,
              x: nextX,
              y: nextY,
              vy: nextVy,
              alpha: nextAlpha,
            };
          })
          .filter(p => p.alpha > 0);
      });

      // Maintain puddles and automatically clean up expired ones (fading out after 7s)
      setBloodPuddles(prev => {
        if (prev.length === 0) return prev;
        return prev.filter(p => now - p.createdAt < 7000); // 7 seconds total duration
      });
    }, 30);

    return () => clearInterval(interval);
  }, [bloodParticles.length, bloodPuddles.length]);

  const triggerBloodExplosion = (square: string) => {
    // 1. Spawning blood puddles on the ground
    const variant = Math.floor(Math.random() * 3);
    const scale = 0.55 + Math.random() * 0.45;
    const rotation = Math.floor(Math.random() * 360);
    const puddleId = `puddle-${Date.now()}-${Math.random()}`;

    setBloodPuddles(prev => [
      ...prev,
      {
        id: puddleId,
        square,
        createdAt: Date.now(),
        initialOpacity: 0.75 + Math.random() * 0.25,
        rotation,
        scale,
        variant,
      }
    ]);

    // 2. Spawn energetic red blood particle splatters bursting outwards
    const { row, col } = squareToCoords(square);
    const particlesCount = 45;
    const nextParticles: BloodParticle[] = [];
    const bloodColors = [
      '#7f1d1d', // red-900 (dark crimson)
      '#991b1b', // red-800
      '#b91c1c', // red-700 (venous)
      '#dc2626', // red-600 (arterial)
      '#4c0519', // rose-950
      '#3f0712', // deep burgundy
    ];

    for (let i = 0; i < particlesCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.12 + Math.random() * 0.58;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 0.16; // soft eject lift up
      
      nextParticles.push({
        id: `particle-${Date.now()}-${i}-${Math.random()}`,
        col,
        row,
        x: 0.5,
        y: 0.5,
        vx,
        vy,
        size: 3 + Math.random() * 8, // organic size variations
        color: bloodColors[Math.floor(Math.random() * bloodColors.length)],
        alpha: 0.9 + Math.random() * 0.1,
        gravity: 0.35,
      });
    }

    setBloodParticles(prev => [...prev, ...nextParticles]);
  };

  // Promotion Handling
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);

  /* ═══════════════════════
     TYPEWRITER DISPATCHERS
  ═══════════════════════ */
  useEffect(() => {
    if (botTypingTimerRef.current) clearTimeout(botTypingTimerRef.current);
    setBotDisplayedText("");
    
    let index = 0;
    const speed = 24;

    const step = () => {
      if (index < botText.length) {
        setBotDisplayedText(botText.slice(0, index + 1));
        const char = botText[index];
        index++;
        
        // play retro beep on each non-space character
        if (char !== " " && isAudioEnabled) {
          playBeep(250, 0.04);
        }

        const delay = (char === '.' || char === '!' || char === '?') ? speed * 5
                    : (char === ',')                               ? speed * 2.5
                    : speed + (Math.random() * 6 - 3);

        botTypingTimerRef.current = setTimeout(step, delay);
      }
    };

    if (botText) step();

    return () => {
      if (botTypingTimerRef.current) clearTimeout(botTypingTimerRef.current);
    };
  }, [botText, isAudioEnabled]);

  useEffect(() => {
    if (playerTypingTimerRef.current) clearTimeout(playerTypingTimerRef.current);
    setPlayerDisplayedText("");
    
    let index = 0;
    const speed = 24;

    const step = () => {
      if (index < playerText.length) {
        setPlayerDisplayedText(playerText.slice(0, index + 1));
        const char = playerText[index];
        index++;
        
        // play retro beep on each non-space character
        if (char !== " " && isAudioEnabled) {
          playBeep(550, 0.04);
        }

        const delay = (char === '.' || char === '!' || char === '?') ? speed * 5
                    : (char === ',')                               ? speed * 2.5
                    : speed + (Math.random() * 6 - 3);

        playerTypingTimerRef.current = setTimeout(step, delay);
      }
    };

    if (playerText) step();

    return () => {
      if (playerTypingTimerRef.current) clearTimeout(playerTypingTimerRef.current);
    };
  }, [playerText, isAudioEnabled]);

  const speakBot = (speaker: { name: string; role: string; portrait: string }, text: string) => {
    setBotSpeaker(speaker);
    setBotText(text);
  };

  const speakPlayer = (speaker: { name: string; role: string; portrait: string }, text: string) => {
    setPlayerSpeaker(speaker);
    setPlayerText(text);
  };

  /* ═══════════════════════
     GAME ACTION HANDLERS
  ═══════════════════════ */
  const startNewGame = (oppIdx: number) => {
    const opp = OPPONENTS[oppIdx];
    setOpponent(opp);
    
    // Reset Chess backend
    const freshChess = new Chess();
    setChessObj(freshChess);
    setPieces(getInitialPieces());
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMoveSquares({});
    setIsPlayerTurn(true);
    setIsAiThinking(false);
    setGameResult(null);
    setFlashSquare(null);
    setPromotedSquare(null);
    setPromotionPending(null);
    setBloodPuddles([]);
    setBloodParticles([]);

    setScreen('game');
    
    // Play audio trigger and start greeting dialogue
    if (isAudioEnabled) {
      playBeep(440, 0.1);
      setTimeout(() => playBeep(520, 0.1), 100);
    }

    speakBot({
      name: opp.name,
      role: "Monarca",
      portrait: opp.icon,
    }, opp.greeting);

    speakPlayer({
      name: "Arauto do Reino",
      role: "Guia da Luz",
      portrait: "🏰",
    }, "A batalha começou! Comande suas forças com precisão.");
  };

  const handleTileClick = (square: string) => {
    if (!isPlayerTurn || isAiThinking || gameResult || promotionPending) return;

    // Is there a white piece on this square?
    const pOnTile = pieces.find(p => p.square === square);
    
    // Clicking a coordinate of valid destination
    if (validMoves.includes(square) && selectedSquare) {
      executePlayerMove(selectedSquare, square);
      return;
    }

    // Selecting a white piece
    if (pOnTile && pOnTile.color === 'w') {
      if (isAudioEnabled) playBeep(320 + (square.charCodeAt(0) * 1.5), 0.06);
      setSelectedSquare(square);
      const moves = chessObj.moves({ square: square, verbose: true }) as any[];
      setValidMoves(moves.map(m => m.to));
    } else {
      // Clear selection
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const executePlayerMove = (from: string, to: string) => {
    // Check if it's a pawn promotion
    const movingPiece = pieces.find(p => p.square === from);
    const isPawn = movingPiece?.type === 'p';
    const isGoalRank = to.endsWith('8');

    if (isPawn && isGoalRank) {
      // open promotion dialog modal
      setPromotionPending({ from, to });
      if (isAudioEnabled) playBeep(680, 0.15);
      return;
    }

    applyMove(from, to, 'q'); // default normal move queen promotion
  };

  const applyMove = (from: string, to: string, promotionChar: 'q' | 'r' | 'b' | 'n' = 'q') => {
    try {
      const movingPiece = pieces.find(p => p.square === from);

      // Execute in Chess module
      const moveObj = chessObj.move({ from, to, promotion: promotionChar });
      if (!moveObj) return;

      // Capture detection should strictly use chess.js move output so normal moves do not trigger blood explosions
      const isCapture = !!moveObj.captured;

      // Juice visual/audio feedback
      if (isCapture) {
        if (isAudioEnabled) playCaptureSound();
        setShakeBoard(true);
        setFlashSquare(to);
        triggerBloodExplosion(to);
        setTimeout(() => setShakeBoard(false), 410);
        setTimeout(() => setFlashSquare(null), 600);
      } else {
        if (isAudioEnabled) playSlideSound();
      }

      setLastMoveSquares({ from, to });

      // Update physical grid pieces
      setPieces(prev => {
        let nextList = [...prev];
        // Handle physical deletion on captures
        if (moveObj.captured) {
          let capSquare = moveObj.to;
          if (moveObj.flags.includes('e')) { // En passant logic
            const f = moveObj.to[0];
            const r = moveObj.color === 'w' ? '5' : '4';
            capSquare = f + r;
          }
          nextList = nextList.filter(p => p.square !== capSquare);
        }

        // Apply position transitions
        nextList = nextList.map(p => {
          if (p.square === moveObj.from) {
            return {
              ...p,
              square: moveObj.to,
              type: moveObj.promotion ? moveObj.promotion : p.type
            };
          }
          return p;
        });

        // Castling mechanical synchronizations (Rook moves!)
        if (moveObj.flags.includes('k')) { // Kingside castle
          const r = moveObj.color === 'w' ? '1' : '8';
          nextList = nextList.map(p => {
            if (p.square === `h${r}` && p.type === 'r') {
              return { ...p, square: `f${r}` };
            }
            return p;
          });
        } else if (moveObj.flags.includes('q')) { // Queenside castle
          const r = moveObj.color === 'w' ? '1' : '8';
          nextList = nextList.map(p => {
            if (p.square === `a${r}` && p.type === 'r') {
              return { ...p, square: `d${r}` };
            }
            return p;
          });
        }

        return nextList;
      });

      setSelectedSquare(null);
      setValidMoves([]);

      // Speeches & Turn Switches
      const speakerPersonality = WHITE_PIECES_PERSONALITIES[movingPiece?.type || 'p'];
      
      if (chessObj.isCheckmate()) {
        speakPlayer({
          name: speakerPersonality.name,
          role: speakerPersonality.role,
          portrait: speakerPersonality.emoji,
        }, "Vitória majestosa! Teu eclipse profano desfez-se em poeira estelar!");
        speakBot({
          name: opponent.name,
          role: "Monarca",
          portrait: opponent.icon,
        }, "N-não pode ser... Minha corte foi completamente aniquilada!");
        if (isAudioEnabled) playVictoryFanfare();
        setGameResult('victory');
        return;
      }
  
      if (chessObj.isGameOver()) {
        speakPlayer({
          name: "Arauto do Reino",
          portrait: "⚖️",
          role: "Tabelião do Equilíbrio",
        }, "Um empate solene. As balanças místicas se estabilizaram sobre as cinzas.");
        speakBot({
          name: opponent.name,
          role: "Monarca",
          portrait: opponent.icon,
        }, "Nem luz, nem trevas. O destino cessou seu julgamento.");
        setGameResult('draw');
        return;
      }
  
      // Standard monologue
      const line = isCapture 
        ? speakerPersonality.captures[Math.floor(Math.random() * speakerPersonality.captures.length)]
        : speakerPersonality.moves[Math.floor(Math.random() * speakerPersonality.moves.length)];
  
      speakPlayer({
        name: speakerPersonality.name,
        portrait: speakerPersonality.emoji,
        role: speakerPersonality.role,
      }, line);

      // AI Queue
      setIsPlayerTurn(false);
      setIsAiThinking(true);
      setTimeout(triggerAiMove, 1200 + Math.random() * 800);

    } catch (err) {
      console.error(err);
    }
  };

  /* ═══════════════════════
     PROMOTION ACTION RESUME
  ═══════════════════════ */
  const handleSelectPromotion = (roleCode: 'q' | 'r' | 'b' | 'n') => {
    if (!promotionPending) return;
    const { from, to } = promotionPending;
    setPromotionPending(null);

    // Apply glowing particle flare effect
    setPromotedSquare(to);
    setTimeout(() => setPromotedSquare(null), 1800);

    if (isAudioEnabled) playPromotionChime();
    applyMove(from, to, roleCode);
  };

  /* ═══════════════════════
     AI COMPUTER PLAY ENGINE
  ═══════════════════════ */
  const triggerAiMove = () => {
    startTransition(() => {
    if (chessObj.isGameOver() || gameResult) {
      setIsAiThinking(false);
      return;
    }

    const moves = chessObj.moves({ verbose: true });
    if (moves.length === 0) {
      setIsAiThinking(false);
      return;
    }

    let selectedMove: any = null;

    // AI strategy based on choice card difficulty
    const style = opponent.difficulty;

    if (style === 'easy_blunder' && Math.random() < 0.38) {
      // 38% blunder rate for Tomb Pawn! Random choice.
      selectedMove = moves[Math.floor(Math.random() * moves.length)];
    } else if (style === 'medium_block' && Math.random() < 0.16) {
      // 16% blunder rate for Alive Keep!
      selectedMove = moves[Math.floor(Math.random() * moves.length)];
    } else {
      // Depth tuning based on opponent
      const depth = style === 'hard_minimax' ? 3 
                  : style === 'aggressive_medium' ? 3 
                  : 2;

      // Minimax optimized lookup
      const best = minimax(chessObj, depth, -Infinity, Infinity, true);
      selectedMove = best.move || moves[Math.floor(Math.random() * moves.length)];
    }

    if (!selectedMove) {
      selectedMove = moves[0];
    }

    // Apply move physically
    const destinationSq = selectedMove.to;
    const originsSq = selectedMove.from;

    const actualMove = chessObj.move(selectedMove);
    if (!actualMove) {
      setIsAiThinking(false);
      setIsPlayerTurn(true);
      return;
    }

    // Capture detection should strictly use chess.js move output so normal moves do not trigger blood explosions
    const isCapture = !!actualMove.captured;

    setLastMoveSquares({ from: originsSq, to: destinationSq });

    // Juice impact
    if (isCapture) {
      if (isAudioEnabled) playCaptureSound();
      setShakeBoard(true);
      setFlashSquare(destinationSq);
      triggerBloodExplosion(destinationSq);
      setTimeout(() => setShakeBoard(false), 410);
      setTimeout(() => setFlashSquare(null), 600);
    } else {
      if (isAudioEnabled) playSlideSound();
    }

    // Update physical coordinate list
    setPieces(prev => {
      let nextList = [...prev];
      if (actualMove.captured) {
        let capSquare = actualMove.to;
        if (actualMove.flags.includes('e')) {
          const f = actualMove.to[0];
          const r = actualMove.color === 'w' ? '5' : '4';
          capSquare = f + r;
        }
        nextList = nextList.filter(p => p.square !== capSquare);
      }

      nextList = nextList.map(p => {
        if (p.square === actualMove.from) {
          return {
            ...p,
            square: actualMove.to,
            type: actualMove.promotion ? actualMove.promotion : p.type
          };
        }
        return p;
      });

      // AI Castling moves corresponding Rook
      if (actualMove.flags.includes('k')) {
        const r = '8';
        nextList = nextList.map(p => {
          if (p.square === `h${r}` && p.type === 'r') {
            return { ...p, square: `f${r}` };
          }
          return p;
        });
      } else if (actualMove.flags.includes('q')) {
        const r = '8';
        nextList = nextList.map(p => {
          if (p.square === `a${r}` && p.type === 'r') {
            return { ...p, square: `d${r}` };
          }
          return p;
        });
      }

      return nextList;
    });

    // Check game condition
    if (chessObj.isCheckmate()) {
      speakBot({
        name: opponent.name,
        role: "Monarca",
        portrait: opponent.icon,
      }, opponent.checkmateLine);
      speakPlayer({
        name: "Arauto do Reino",
        role: "Guia da Luz",
        portrait: "🏰",
      }, "Fomos encurralados... O Trono Solar ruiu diante das forças do caos.");
      if (isAudioEnabled) playDefeatFanfare();
      setGameResult('defeat');
      setIsAiThinking(false);
      return;
    }

    if (chessObj.isGameOver()) {
      speakBot({
        name: opponent.name,
        role: "Monarca",
        portrait: opponent.icon,
      }, opponent.stalemateLine);
      speakPlayer({
        name: "Arauto do Reino",
        role: "Guia da Luz",
        portrait: "🏰",
      }, "O tabuleiro travou em equilíbrio eterno.");
      setGameResult('draw');
      setIsAiThinking(false);
      return;
    }

    // Standard AI piece speak line
    const piecePersonality = BLACK_PIECES_PERSONALITIES[actualMove.piece];
    let spokenPhrase = "";

    if (chessObj.isCheck()) {
      spokenPhrase = opponent.checkLine;
    } else {
      spokenPhrase = isCapture 
        ? piecePersonality.captures[Math.floor(Math.random() * piecePersonality.captures.length)]
        : piecePersonality.moves[Math.floor(Math.random() * piecePersonality.moves.length)];
    }

    speakBot({
      name: piecePersonality.name,
      role: `${opponent.name} (Servo)`,
      portrait: piecePersonality.emoji,
    }, spokenPhrase);

    setIsAiThinking(false);
    setIsPlayerTurn(true);
    });
  };

  const handleSurrender = () => {
    if (isAudioEnabled) playBeep(220, 0.2);
    setScreen('menu');
  };

  /* ═══════════════════════
     UTILITY: RENDER BOARD MATRIX
  ═══════════════════════ */
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className="min-h-screen text-[#cdc0a0] bg-[#060404] flex flex-col font-sans select-none relative overflow-x-hidden">
      
      {/* Dynamic Blood-Glow Ambience Background Panels */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-red-900 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-teal-900/60 rounded-full blur-[110px]" />
      </div>

      {/* Header Bar */}
      <header className="border-b border-[#2d1a1a]/80 bg-[#0a0707] py-3.5 px-4 md:px-8 flex items-center justify-between z-10 relative shadow-md">
        <div className="flex items-center gap-3">
          <Flame className="w-5 h-5 text-red-600 animate-pulse" />
          <div>
            <h1 className="text-sm font-semibold tracking-[0.2em] uppercase font-decorative text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]">
              Dark Chess
            </h1>
            <p className="text-[9px] tracking-[0.3em] font-medium text-[#5a4838] uppercase">
              Retro Tactical Confrontation
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const next = !isAudioEnabled;
            setIsAudioEnabled(next);
            if (next && window.AudioContext) {
              getAudioCtx(); // warm up context
            }
          }}
          className="p-1.5 rounded border border-[#3b1717]/60 text-[#a3937c] hover:text-amber-500 transition-all hover:bg-[#1a0e0e]"
          title={isAudioEnabled ? "Mutar Som" : "Ativar Som"}
        >
          {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Body Grid Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10 relative">

        {/* SCREEN 1: ADVERSARY SELECTOR LOBBY */}
        {screen === 'menu' && (
          <div className="w-full max-w-4xl flex flex-col items-center text-center animate-fade-in py-6">
            <div className="mb-6">
              <span className="text-[12px] uppercase tracking-[0.4em] font-semibold text-amber-500 font-sans">
                Selecione Seu Destino
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-[0.12em] font-decorative text-red-600 mt-2 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Confronto Com as Trevas
              </h2>
              <div className="flex items-center justify-center gap-3 mt-3.5">
                <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#8b1a1a] to-transparent" />
                <span className="text-[#8b1a1a] text-xs">✦</span>
                <div className="h-[1px] w-24 bg-gradient-to-l from-transparent via-[#8b1a1a] to-transparent" />
              </div>
            </div>

            {/* Boss Grid Tarot Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-6">
              {OPPONENTS.map((opp, idx) => (
                <div
                  key={opp.id}
                  onClick={() => startNewGame(idx)}
                  className="group relative cursor-pointer retro-panel border border-[#451616]/60 rounded p-5 transition-all duration-300 hover:-translate-y-2 hover:border-[#b52020] hover:shadow-[0_15px_40px_rgba(139,26,26,0.3)] select-none text-left flex flex-col h-[270px] overflow-hidden"
                >
                  {/* Decorative card stripes */}
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Frame Ornaments */}
                  <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-red-900/60 group-hover:border-red-500" />
                  <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-b border-r border-red-900/60 group-hover:border-red-500" />

                  {/* Icon */}
                  <span className="text-4xl block mb-4 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 filter drop-shadow-[0_0_12px_rgba(181,32,32,0.4)]">
                    {opp.icon}
                  </span>

                  {/* Stats */}
                  <h3 className="font-bold text-[#f2e6cf] group-hover:text-amber-400 transition-colors tracking-wider text-[14px] uppercase font-sans">
                    {opp.name}
                  </h3>
                  <span className="text-[10px] font-sans text-red-500 mt-0.5 tracking-wider block font-medium">
                    {opp.elo}
                  </span>

                  {/* Flavor descriptions */}
                  <p className="font-serif text-[11px] text-[#8a7868] mt-3 italic leading-relaxed flex-1 line-clamp-4">
                    {opp.desc}
                  </p>

                  <div className="mt-4 pt-1 border-t border-[#3a1515]/40 flex items-center justify-between text-[8px] tracking-[0.25em] text-[#5a4838] uppercase font-semibold">
                    <span>Dificuldade</span>
                    <span className="text-amber-500/80 group-hover:text-amber-400 font-sans font-bold">
                      {opp.difficulty === "hard_minimax" ? "Lendário" : opp.difficulty === "aggressive_medium" ? "Técnico" : opp.difficulty === "medium_block" ? "Sólido" : "Iniciante"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] font-mono tracking-[0.2em] text-[#5a4838] mt-12 uppercase">
              Desenvolvido sob as diretivas dos reinos sombrios
            </p>
          </div>
        )}

        {/* SCREEN 2: THE MAIN TACTICAL arena */}
        {screen === 'game' && (
          <div className="w-full max-w-[500px] flex flex-col gap-3 animate-fade-in flex-1 justify-center py-2">
            
            {/* Enemy Top Status Bar & Health Frame */}
            <div className="w-full bg-[#0a0707] border border-[#3b1c1c]/50 rounded p-3 relative shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-[#100c0c] border border-[#9a7a28]/60 flex items-center justify-center text-2xl relative shadow-inner overflow-hidden">
                  <div className="absolute inset-0 bg-red-950/20" />
                  <span className="relative z-10 animate-float">{opponent.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-mono text-xs font-bold text-red-500 uppercase tracking-widest truncate">
                      {opponent.name}
                    </h3>
                    <span className="text-[9px] font-sans text-[#a3937c]">
                      {opponent.elo}
                    </span>
                  </div>
                  {/* Boss Threat Level Indicator */}
                  <div className="w-full bg-[#1b1010] h-1.5 rounded-full mt-2 overflow-hidden border border-red-950/40 relative">
                    <div className={`h-full bg-gradient-to-r ${opponent.threatClass} w-full animate-pulse`} />
                  </div>
                  <span className="text-[8px] font-mono tracking-widest text-[#5a4838] uppercase mt-1 block">
                    {opponent.threatLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* ENEMY DIALOGUE ZONE (TOP OF BOARD, STYLE OF RETRO RPG, EXTRA RECONSTRUCTED OVERFLOW PIECES SPRITE) */}
            <div className="w-full min-h-[82px] bg-[#000000] border-t-2 border-[#d97706]/95 p-3.5 shadow-[0_5px_15px_rgba(0,0,0,0.9)] relative mt-8 overflow-visible flex gap-4">
              {/* Bottom Right corner bracket */}
              <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-[#d97706]/85" />
              
              {/* Faint elegant role prefix background badge on the right */}
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-900 font-serif italic text-xs md:text-sm tracking-[0.2em] uppercase select-none pointer-events-none">
                {botSpeaker.role}
              </span>

              {/* Portrait overflowing upwards */}
              <div className="relative w-20 h-20 -mt-10 shrink-0 self-end flex items-end justify-center select-none pointer-events-none z-10">
                <img
                  src={getSpeakerSprite(botSpeaker, true) || ''}
                  alt={botSpeaker.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-[140%] object-contain object-bottom filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)] transform scale-110"
                />
              </div>

              {/* Text content details */}
              <div className="flex-1 flex flex-col justify-center min-h-[50px] relative z-25">
                <div className="mb-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d97706] font-sans">
                    {botSpeaker.name}
                  </span>
                </div>
                <p className="font-serif italic text-sm leading-relaxed text-[#dfbec2] font-normal">
                  {botDisplayedText}
                  <span className="cursor-blink" />
                </p>
              </div>
            </div>

            {/* THE CHESSBOARD ARENA GRID */}
            <div className="relative w-full aspect-square border-4 border-amber-950/80 rounded bg-[#1c1816] shadow-[0_15px_50px_rgba(0,0,0,0.95)] overflow-hidden">
              <div className={`w-full h-full transition-all duration-300 relative ${shakeBoard ? 'animate-shake' : ''}`}>
                
                {/* 8x8 Grid Squares rendering */}
                <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
                  {ranks.map((rank, rankIdx) =>
                    files.map((file, fileIdx) => {
                      const squareName = `${file}${rank}`;
                      const isDark = (rankIdx + fileIdx) % 2 === 1;
                      
                      const isSelected = selectedSquare === squareName;
                      const isValidTarget = validMoves.includes(squareName);
                      const isLastMoveSource = lastMoveSquares.from === squareName;
                      const isLastMoveDest = lastMoveSquares.to === squareName;

                      // check if King is currently under attack (check highlights)
                      const isWhiteKingInCheck = chessObj.isCheck() && 
                        chessObj.turn() === 'w' && 
                        pieces.find(p => p.square === squareName && p.type === 'k' && p.color === 'w') !== undefined;

                      const isBlackKingInCheck = chessObj.isCheck() && 
                        chessObj.turn() === 'b' && 
                        pieces.find(p => p.square === squareName && p.type === 'k' && p.color === 'b') !== undefined;

                      return (
                        <div
                          key={squareName}
                          onClick={() => handleTileClick(squareName)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, squareName)}
                          className={`relative w-full h-full transition-colors duration-150 cursor-pointer flex items-center justify-center select-none ${
                            isDark ? 'bg-[#1c1816]' : 'bg-[#332a26]'
                          }`}
                        >
                          {/* Blood Puddles rendering layer */}
                          {bloodPuddles
                            .filter(bp => bp.square === squareName)
                            .map(bp => {
                              const elapsed = Date.now() - bp.createdAt;
                              // smooth fading in the last 3.5 seconds of the shorter 7-second lifetime
                              const currentOpacity = elapsed < 3500
                                ? bp.initialOpacity
                                : Math.max(0, bp.initialOpacity * (1 - (elapsed - 3500) / 3500));

                              const paths = [
                                "M12 2C6.48 2 2 6.48 2 12C2 17.52 5 19 8 20C11 21 14 20 17 18C20 16 22 13 22 10C22 7 17.52 2 12 2Z",
                                "M10 2C5 2 1 6 1 11C1 16 3 18 7 19C11 20 13 21 17 19C21 17 23 14 22 10C21 6 15 2 10 2Z",
                                "M12 4C7 2 3 7 3 12C3 17 6 19 10 20C14 21 18 19 21 16C24 13 22 8 18 5C14 2 17 6 12 4Z",
                              ];

                              return (
                                <div
                                  key={bp.id}
                                  className="absolute inset-[3%] pointer-events-none select-none transition-opacity duration-300 z-0"
                                  style={{
                                    transform: `rotate(${bp.rotation}deg) scale(${bp.scale})`,
                                    opacity: currentOpacity,
                                  }}
                                >
                                  {/* fill-[#801010] provides a gorgeous rich dark red instead of unrendered color falling back to black */}
                                  <svg viewBox="0 0 24 24" className="w-[115%] h-[115%] fill-[#801010]/85 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                                    <path d={paths[bp.variant]} />
                                  </svg>
                                  {/* tiny organic splat droplets */}
                                  <div className="absolute w-[3px] h-[3px] rounded-full bg-[#520909] top-[12%] left-[28%]" />
                                  <div className="absolute w-[4px] h-[4px] rounded-full bg-[#a11111] bottom-[18%] right-[14%]" />
                                  <div className="absolute w-[2.5px] h-[2.5px] rounded-full bg-[#520909] bottom-[10%] left-[20%]" />
                                </div>
                              );
                            })
                          }

                          {/* Highlight last source moves */}
                          {(isLastMoveSource || isLastMoveDest) && (
                            <div className="absolute inset-0 bg-yellow-500/10 pointer-events-none" />
                          )}

                          {/* Red highlight overlay on capture visual flashes */}
                          {flashSquare === squareName && (
                            <div className="absolute inset-0 bg-red-600/75 animate-flash-red pointer-events-none z-30" />
                          )}

                          {/* Selection indicator red border */}
                          {isSelected && (
                            <div className="absolute inset-0 border-2 border-red-500 shadow-[inset_0_0_15px_rgba(239,68,68,0.5)] z-20 pointer-events-none" />
                          )}

                          {/* Path glowing dots for valid movements */}
                          {isValidTarget && (
                            <div className="absolute w-[35%] h-[35%] rounded-full bg-amber-500/30 border border-amber-400 group flex items-center justify-center animate-pulse z-20">
                              <div className="w-[45%] h-[45%] rounded-full bg-amber-400" />
                            </div>
                          )}

                          {/* King checklist blinking aura */}
                          {(isWhiteKingInCheck || isBlackKingInCheck) && (
                            <div className="absolute inset-0 bg-red-500/20 border-2 border-red-600 animate-pulse z-10 pointer-events-none" />
                          )}

                          {/* Grid corner coordinate markers (runes) */}
                          {fileIdx === 0 && (
                            <span className="absolute top-0.5 left-1 text-[7px] font-mono text-[#5a4838] uppercase font-bold pointer-events-none">
                              {rank}
                            </span>
                          )}
                          {rankIdx === 7 && (
                            <span className="absolute bottom-0.5 right-1 text-[7px] font-mono text-[#5a4838] uppercase font-bold pointer-events-none">
                              {file}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* VISUAL LAYOUT PIECES OVERLAY with smooth inline transitions */}
                {pieces.map((p) => {
                  const { row, col } = squareToCoords(p.square);
                  
                  // Calculate exact grid square percentage placements
                  const left = col * 12.5;
                  const top = row * 12.5;
                  
                  const isBlack = p.color === 'b';
                  const shapeColor = isBlack 
                    ? "bg-[#1c1212]"
                    : "bg-[#fcfaf7]";

                  const badgeRoleName = isBlack 
                    ? BLACK_PIECES_PERSONALITIES[p.type]?.name 
                    : WHITE_PIECES_PERSONALITIES[p.type]?.name;

                  const isPromotedGlow = promotedSquare === p.square;
                  const isSelected = selectedSquare === p.square;
                  
                  // Render pieces closer to the front (bottom ranks / row index descending) with a higher z-index so they overlap pieces behind them
                  const zIndexValue = isSelected ? 150 : (row * 10 + 10);

                  // Determine precise visual scale and height classes to make pieces perfectly proportioned and aligned like the reference print
                  const pieceStyles: Record<string, string> = {
                    p: "w-[74%] h-[74%]",     // Pawn: shorter soldier, fits comfortably inside
                    r: "w-[85%] h-[85%]",     // Rook: sturdy tower, standard height
                    n: "w-[88%] h-[88%]",     // Knight/Horse: same-base size structure, clear and visible
                    b: "w-[88%] h-[92%]",     // Bishop: tall priest, within limits
                    q: "w-[92%] h-[95%]",     // Queen: taller, fits perfectly within boundary
                    k: "w-[95%] h-[98%]",     // King: tallest authority, max boundary height
                  };
                  const pieceImageClass = pieceStyles[p.type] || "w-[90%] h-[90%]";

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleTileClick(p.square)}
                      draggable={p.color === 'w'}
                      onDragStart={(e) => handleDragStart(e, p.square)}
                      className={`absolute w-[12.5%] h-[12.5%] p-0 cursor-pointer select-none transition-all duration-300 ease-in-out flex items-end justify-center ${
                        isPromotedGlow ? "animate-gold-shine scale-110 z-40" : ""
                      }`}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        zIndex: zIndexValue,
                      }}
                    >
                      {/* Pixel Art Sprite piece image directly inside square bounds resembling the reference print */}
                      <img 
                        src={PIECE_IMAGES[`${p.color}-${p.type}`]} 
                        alt={`${p.color}-${p.type}`} 
                        referrerPolicy="no-referrer"
                        className={`absolute bottom-[4%] left-1/2 -translate-x-1/2 object-contain max-w-none max-h-none transition-all duration-300 hover:scale-[1.12] hover:-translate-y-1 active:scale-95 filter drop-shadow-[0_5px_7px_rgba(0,0,0,0.65)] ${pieceImageClass}`}
                      />
                    </div>
                  );
                })}

                {/* Visual Blood Explosion Particles Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100]">
                  {bloodParticles.map(p => (
                    <div
                      key={p.id}
                      className="absolute rounded-full transition-all duration-[30ms] ease-linear shadow-[0_0_5px_rgba(239,68,68,0.4)]"
                      style={{
                        left: `${(p.col + p.x) * 12.5}%`,
                        top: `${(p.row + p.y) * 12.5}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        opacity: p.alpha,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  ))}
                </div>

              </div>
            </div>

            {/* PLAYER DIALOGUE ZONE (BOTTOM OF BOARD, STYLE OF RETRO RPG, EXTRA RECONSTRUCTED OVERFLOW PIECES SPRITE) */}
            <div className="w-full min-h-[82px] bg-[#000000] border-t-2 border-[#d97706]/95 p-3.5 shadow-[0_5px_15px_rgba(0,0,0,0.9)] relative mt-8 overflow-visible flex gap-4">
              {/* Bottom Right corner bracket */}
              <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-[#d97706]/85" />
              
              {/* Faint elegant role prefix background badge on the right */}
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-900 font-serif italic text-xs md:text-sm tracking-[0.2em] uppercase select-none pointer-events-none">
                {playerSpeaker.role}
              </span>

              {/* Portrait overflowing upwards */}
              <div className="relative w-20 h-20 -mt-10 shrink-0 self-end flex items-end justify-center select-none pointer-events-none z-10">
                <img
                  src={getSpeakerSprite(playerSpeaker, false) || ''}
                  alt={playerSpeaker.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-[140%] object-contain object-bottom filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)] transform scale-110"
                />
              </div>

              {/* Text content details */}
              <div className="flex-1 flex flex-col justify-center min-h-[50px] relative z-25">
                <div className="mb-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d97706] font-sans">
                    {playerSpeaker.name}
                  </span>
                </div>
                <p className="font-serif italic text-sm leading-relaxed text-[#dfd2be] font-normal">
                  {playerDisplayedText}
                  <span className="cursor-blink" />
                </p>
              </div>
            </div>

            {/* CONTROLS & ESCAPE BUTTONS */}
            <div className="flex items-center justify-between mt-1 px-1">
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border border-black ${
                  isAiThinking 
                    ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse' 
                    : 'bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.8)]'
                }`} />
                <span className="text-[9px] font-mono tracking-widest uppercase text-[#8a7868]">
                  {isAiThinking ? "Inimigo Calculando..." : "Seu Turno de Comando"}
                </span>
              </div>
              <button
                onClick={handleSurrender}
                className="flex items-center gap-1.5 px-3 py-1 bg-stone-950 border border-[#301616] rounded text-[8px] tracking-[0.2em] uppercase text-stone-400 hover:text-red-500 hover:border-red-600/60 transition-all font-mono"
              >
                <Undo2 className="w-3" />
                Fugir do Abismo
              </button>
            </div>

          </div>
        )}

      </main>

      {/* PAWN PROMOTION CHRONOS RETRO MODAL OVERLAY */}
      {promotionPending && (
        <div className="fixed inset-0 z-50 bg-[#000000]/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#090606] border-2 border-amber-600 rounded-lg p-6 text-center shadow-[0_0_50px_rgba(154,122,40,0.3)]">
            <Sparkles className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
            <h3 className="text-xl font-bold font-decorative tracking-[0.1em] text-amber-500 uppercase mt-2.5">
              Promoção Reivindicada
            </h3>
            <div className="h-[1px] w-32 bg-amber-600/40 mx-auto my-3" />
            <p className="font-serif italic text-xs text-[#a3937c] mb-6 leading-relaxed">
              Vosso humilde recruta alcançou o cume do tabuleiro eterno. Escolha qual avatar lendário do Trono Solar ele irá reencarnar:
            </p>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Option Queen */}
              <div
                onClick={() => handleSelectPromotion('q')}
                className="cursor-pointer border border-amber-600/20 rounded p-4 bg-[#140e0e] transition-all hover:border-amber-500 hover:bg-[#1a1111] hover:scale-[1.03] text-left group"
              >
                <Crown className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mb-1.5" />
                <h4 className="text-xs font-bold uppercase text-[#dfd2be] tracking-wider mb-0.5">Rainha</h4>
                <p className="text-[9px] font-serif italic text-[#5a4838]">A força absoluta tática.</p>
              </div>

              {/* Option Rook */}
              <div
                onClick={() => handleSelectPromotion('r')}
                className="cursor-pointer border border-amber-600/20 rounded p-4 bg-[#140e0e] transition-all hover:border-amber-500 hover:bg-[#1a1111] hover:scale-[1.03] text-left group"
              >
                <Shield className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mb-1.5" />
                <h4 className="text-xs font-bold uppercase text-[#dfd2be] tracking-wider mb-0.5">Torre</h4>
                <p className="text-[9px] font-serif italic text-[#5a4838]">A muralha impenetrável.</p>
              </div>

              {/* Option Bishop */}
              <div
                onClick={() => handleSelectPromotion('b')}
                className="cursor-pointer border border-amber-600/20 rounded p-4 bg-[#140e0e] transition-all hover:border-amber-500 hover:bg-[#1a1111] hover:scale-[1.03] text-left group"
              >
                <Flame className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mb-1.5" />
                <h4 className="text-xs font-bold uppercase text-[#dfd2be] tracking-wider mb-0.5">Bispo</h4>
                <p className="text-[9px] font-serif italic text-[#5a4838]">Fogo cruzado diagonal.</p>
              </div>

              {/* Option Knight */}
              <div
                onClick={() => handleSelectPromotion('n')}
                className="cursor-pointer border border-amber-600/20 rounded p-4 bg-[#140e0e] transition-all hover:border-amber-500 hover:bg-[#1a1111] hover:scale-[1.03] text-left group"
              >
                <Compass className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mb-1.5" />
                <h4 className="text-xs font-bold uppercase text-[#dfd2be] tracking-wider mb-0.5">Cavalo</h4>
                <p className="text-[9px] font-serif italic text-[#5a4838]">O salto da providência.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SUMMARY NOTIFICATIONS OVERLAYS */}
      {gameResult && (
        <div className="fixed inset-0 z-50 bg-[#000000]/98 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0707] border-2 border-red-700/60 rounded-xl p-8 text-center shadow-[0_0_100px_rgba(239,68,68,0.15)] animate-scale-up">
            
            {gameResult === 'victory' && (
              <>
                <Award className="w-14 h-14 text-amber-400 mx-auto animate-bounce mb-3" />
                <h2 className="text-3xl md:text-4xl font-extrabold font-decorative tracking-[0.15em] text-amber-400 uppercase">
                  Vitória
                </h2>
                <div className="h-[1px] w-40 bg-amber-400/30 mx-auto my-4" />
                <p className="font-serif italic text-sm text-[#cdc0a0] leading-relaxed mb-8">
                  Conseguiste purificar o abismo rúnico! O Lorde das Trevas {opponent.name} bateu em retirada amargando sua derrota histórica. Vosso nome foi esculpido nos anais celestres.
                </p>
              </>
            )}

            {gameResult === 'defeat' && (
              <>
                <Skull className="w-14 h-14 text-red-600 mx-auto animate-pulse mb-3" />
                <h2 className="text-3xl md:text-4xl font-extrabold font-decorative tracking-[0.15em] text-red-600 uppercase">
                  Derrota
                </h2>
                <div className="h-[1px] w-40 bg-red-600/30 mx-auto my-4" />
                <p className="font-serif italic text-sm text-[#dfd2be] leading-relaxed mb-8">
                  Vosso exército heróico decaiu perante as hostes negras de {opponent.name}. Vossas valorosas almas alimentam o Trono de Cinzas para toda a eternidade.
                </p>
              </>
            )}

            {gameResult === 'draw' && (
              <>
                <Trophy className="w-14 h-14 text-stone-400 mx-auto mb-3" />
                <h2 className="text-3xl md:text-4xl font-extrabold font-decorative tracking-[0.15em] text-[#a3937c] uppercase">
                  Empate Solene
                </h2>
                <div className="h-[1px] w-40 bg-[#a3937c]/30 mx-auto my-4" />
                <p className="font-serif italic text-sm text-[#dfd2be] leading-relaxed mb-8">
                  As forças místicas da Luz e do Abismo esgotaram-se por completo. O tabuleiro permanece intacto sob as névoas eternas do equilíbrio misterioso.
                </p>
              </>
            )}

            <button
              onClick={() => {
                if (isAudioEnabled) playBeep(500, 0.1);
                setGameResult(null);
                setScreen('menu');
              }}
              className="px-8 py-3 bg-gradient-to-b from-red-800 to-red-950 border border-red-600/60 rounded text-xs font-semibold tracking-[0.3em] uppercase text-white hover:from-red-700 hover:to-red-900 shadow-[0_4px_10px_rgba(239,68,68,0.2)] transition-all font-sans"
            >
              Reclamar Outro Destino
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
