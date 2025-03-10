const { Client, GatewayIntentBits } = require('discord.js');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');

// Discordボットの設定
const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PORT = process.env.PORT || 8080; // Railwayのポートを使用
const DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || "localhost";  // ドメイン設定

// Express HTTPサーバーを作成
const app = express();
const server = http.createServer(app);

// Expressでpublicフォルダを静的ファイルとして提供
app.use(express.static('public'));  // ここを追加

// WebSocketサーバーの作成
const wss = new WebSocket.Server({ server });  // ExpressサーバーとWebSocketを統合

console.log(`WebSocketサーバーがポート${PORT}で起動しました。`);

// Discord Bot
const TARGET_CHANNEL_ID = '1256172324525441074'; // 画像のコマンドを入力するチャンネルID

// 画像の別名マッピング
const imageAliases = {
  "まりかす": "mks.png", "マリカス": "mks.png", "マリオカートスタジアム": "mks.png", "まりおかーとすたじあむ": "mks.png",
};

// Discordボットでメッセージ受信時の処理
discordClient.on('messageCreate', (message) => {
  if (message.channel.id === TARGET_CHANNEL_ID && !message.author.bot) {
    const content = message.content.trim();
    console.log(`Discordでの入力: ${content}`);

    // 入力されたコンテンツが別名マッピングにあるか確認
    let imageName = imageAliases[content] || `${content}.png`;  // マッピングがあればそれを使用、なければ拡張子を付けて使用

    // マッピングが見つからない場合も同じ処理
    if (!imageAliases[content] && !imageName.includes('.png')) {
      imageName = `${content}.png`; // 拡張子が指定されていない場合、.pngを追加
    }

    console.log(`使用する画像: ${imageName}`);

    // WebSocketクライアント全体に送信
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(imageName);
      }
    });
  }
});

// 環境変数からトークンを読み込み、ログイン
discordClient.login(process.env.TOKEN);

// Expressサーバーで静的ファイルを提供 (絶対パス)
app.use(express.static(__dirname + '/images'));  // imagesフォルダを静的に提供

// Expressサーバーをポート8080で起動
server.listen(PORT, () => {
  console.log(`HTTPサーバーがポート${PORT}で起動しました。`);
});







