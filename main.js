const WebSocket = require('ws');
const readline = require('readline');
const { Client, GatewayIntentBits } = require('discord.js');

// Discord Botのトークンを設定
require('dotenv').config(); // .env を読み込む
const DISCORD_TOKEN = process.env.DISCORD_TOKEN; // 環境変数から取得

// 画像の別名マッピング
const imageAliases = {
  "まりかす": "mks.png","マリカス": "mks.png","マリオカートスタジアム": "mks.png","まりおかーとすたじあむ": "mks.png",
  "うぉたぱ": "wp.png","ウォタパ": "wp.png","ウォーターパーク": "wp.png","うぉーたーぱーく": "wp.png",
  "すいきゃに": "scc.png","スイキャニ": "scc.png",
  "いせき": "tr.png","どっすん": "tr.png","ドッスン": "tr.png","どっすんいせき": "tr.png","ドッスンいせき": "tr.png","遺跡": "tr.png",
  "まりさ": "mc.png","マリさ": "mc.png","マリサ": "mc.png","まりおさーきっと": "mc.png","マリオサーキット": "mc.png",
  "はーばー": ".png","ハーバー": ".png","きのぴおはーばー": ".png","キノピオハーバー": ".png",
  "ねじれ": "tm.png","ネジマン": "tm.png","ねじマン": "tm.png","ねじれまんしょん": "tm.png","ねじれマンション": "tm.png",
  "へいほー": ".png","ヘイホー": ".png","へいほーこうざん": ".png","ヘイホーこうざん": ".png",
  "くうこう": "sa.png","さんしゃいんくうこう": "sa.png","サンシャインくうこう": "sa.png","サンシャイン空港": "sa.png","空港": "sa.png",
  "どるみ": "ds.png","ドルミ": "ds.png",
  "えれど": "ed.png","えれどり": "ed.png","エレド": "ed.png","エレドリ": "ed.png",
  "わりすの": "wm.png","すの": "wm.png","ワリスノ": "wm.png","ワリスの": "wm.png","ゆきやま": "wm.png","雪山": "wm.png",
  "すかが": "cc.png","スカガ": "cc.png","すかいがーでん": "cc.png","スカイガーデン": "cc.png",
  "わりすた": "ws.png",
  "": ".png",
  "ワリオスタジアム": "ws.png",
  "べびぱ": "bp.png",
  "ベビーパーク": "bp.png",
  "れいんぼー": "rr.png",
  "レインボーロード": "rr.png",

  "ぱり": "pp.png","パリ": "pp.png",
  "きのさ": ".png","キノサ": ".png",
  "ここも": "cmo.png","ココモ": "cmo.png",
  "東京": "tb.png","とうきょう": "tb.png","とーきょー": "tb.png","トーキョー": "tb.png",
  "リッジ": ".png","りっじ": ".png","きのこりっじうぇい": ".png","キノコリッジウェイ": ".png",
  "gbaすかが": ".png","gbaスカガ": ".png","gbaスカが": ".png",
  "にんにん": "nh.png","ニンニン": "nh.png",
  "ニューヨーク": "nym.png","にゅーよーく": "nym.png","ny": "nym.png",
  "まりさ3": "mc3.png","マリさ3": "mc3.png","マリサ3": "mc3.png",
  "64からさば": ".png","64カラサバ": ".png","64カラさば": ".png",
  "わるぴん": "bwp.png","ワルピン": "bwp.png",
  "しどにー": "ss.png","シドニー": "ss.png",
  "すのらん": ".png","スノラン": ".png",
  "きのきゃに": "mg.png","キノキャニ": "mg.png",
  "あいす": "shs.png","アイス": "shs.png","あいびる": "shs.png","アイビル": "shs.png",
  "ろんどん": ".png","ロンドン": ".png",
  "てれれ": "bl.png","テレレ": "bl.png","てれされいく": "bl.png","テレサレイク": "bl.png",
  "ろくま": "rrm.png","ロクマ": "rrm.png","ろっくろっくまうんてん": "rrm.png","ロックロックマウンテン": "rrm.png",
  "めいぷる": "mt.png","メイプル": "mt.png",
  "べるりん": "bbb.png","ベルリン": "bbb.png",
  "ぴちが": "pg.png","ピチガ": "pg.png","ぴーちがーでん": "pg.png","ピーチガーテン": "pg.png",
  "めりま": "mm.png","メリマ": "mm.png",
  "wiiにじ": "brr.png","wii虹": "brr.png","wiiれいんぼーろーど": "brr.png","wiiレインボーロード": "brr.png",
};

// Discordクライアントの作成
const discordClient = new Client({ intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds] });
discordClient.once('ready', () => {
  console.log(`Discordボットが起動しました。ログイン中: ${discordClient.user.tag}`);
});

// WebSocketサーバーの作成
const wss = new WebSocket.Server({ port: 3000 });
console.log('WebSocketサーバーがポート3000で起動しました。');

// ターミナル入力を受け取る準備
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 入力を画像ファイル名に変換する関数
function getImageFileName(input) {
  return imageAliases[input] || `${input}.png`; // マッピングがなければそのまま拡張子追加
}

// メッセージを受け付けるチャンネルのIDを保持
let activeChannelId = null;

// WebSocket接続のハンドリング
wss.on('connection', (ws) => {
  console.log('クライアントが接続しました。');

  // ターミナルから入力を受け取ったらクライアントに送信
  rl.on('line', (line) => {
    if (line.trim()) {
      const imageName = getImageFileName(line.trim());
      ws.send(imageName);
    }
  });

  // クライアントが切断されたとき
  ws.on('close', () => {
    console.log('クライアントが切断されました。');
  });
});

// Discordでメッセージを受信したときの処理
discordClient.on('messageCreate', (message) => {
  if (message.author.bot) return; // ボットのメッセージは無視

  const content = message.content.trim();
  console.log(`Discordでの入力: ${content}`);

  // !start コマンドで指定されたチャネルをアクティブにする
  if (content === '!start') {
    activeChannelId = message.channel.id; // 現在のチャンネルIDを保存
    message.reply("メッセージ受信を開始しました。このチャンネルのみでメッセージを受け付けます。");
    return;
  }

  // !end コマンドで受信を停止する
  if (content === '!end') {
    activeChannelId = null; // チャンネルIDをクリア
    message.reply("メッセージ受信を終了しました。");
    return;
  }

  // アクティブなチャンネルの場合のみ処理
  if (activeChannelId && message.channel.id === activeChannelId) {
    const imageName = getImageFileName(content);

    // WebSocketクライアント全体に送信
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(imageName);
      }
    });
  }
});

// Discordボットをログイン
discordClient.login(DISCORD_TOKEN);



