const WebSocket = require('ws');
const readline = require('readline');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// 環境変数の取得
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 3000;

// Discordクライアントの作成
const discordClient = new Client({
  intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds]
});

discordClient.once('ready', () => {
  console.log(`Discordボットが起動しました。ログイン中: ${discordClient.user.tag}`);
});

// WebSocketサーバーの作成
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`WebSocketサーバーがポート${PORT}で起動しました。`);
});

// 画像の別名マッピング
const imageAliases = {
  "まりかす": "mks.png", "マリカス": "mks.png", "マリオカートスタジアム": "mks.png",
  "すいきゃに": "scc.png", "スイキャニ": "scc.png",
  "いせき": "tr.png", "どっすんいせき": "tr.png", "遺跡": "tr.png",
  "まりさ": "mc.png", "マリサ": "mc.png",
  "ねじれ": "tm.png", "ねじれまんしょん": "tm.png",
  "へいほー": "sh.png", "ヘイホーこうざん": "sh.png",
  "くうこう": "sa.png", "サンシャイン空港": "sa.png",
  "どるみ": "ds.png", "ドルミ": "ds.png",
  "えれど": "ed.png", "エレドリ": "ed.png"
};

// ターミナル入力
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 入力を画像ファイル名に変換する関数
function getImageFileName(input) {
  return imageAliases[input] || `${input}.png`;
}

// WebSocket接続
wss.on('connection', (ws) => {
  console.log('クライアントが接続しました。');

  rl.on('line', (line) => {
    if (line.trim()) {
      const imageName = getImageFileName(line.trim());
      ws.send(imageName);
    }
  });

  ws.on('close', () => {
    console.log('クライアントが切断されました。');
  });
});

// Discordボットのメッセージ処理
let activeChannelId = null;

discordClient.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();
  console.log(`Discord入力: ${content}`);

  if (content === '!start') {
    activeChannelId = message.channel.id;
    message.reply("このチャンネルのメッセージを受信します。");
    return;
  }

  if (content === '!end') {
    activeChannelId = null;
    message.reply("メッセージ受信を終了しました。");
    return;
  }

  if (activeChannelId && message.channel.id === activeChannelId) {
    const imageName = getImageFileName(content);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(imageName);
      }
    });
  }
});

// Discordボットのログイン
discordClient.login(DISCORD_TOKEN);




