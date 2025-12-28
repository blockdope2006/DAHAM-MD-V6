import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys"
import P from "pino"
import fs from "fs"
import { config } from "./config.js"
import { downloadFile } from "./downloader.js"

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session")

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: true
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (u) => {
    if (u.connection === "close" &&
      u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
    ) startBot()

    if (u.connection === "open")
      console.log("✅ DAHAM-MD V6 CONNECTED")
  })

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""

    if (!text.startsWith(config.prefix)) return

    const args = text.slice(1).split(" ")
    const cmd = args.shift().toLowerCase()

    if (cmd === "menu") {
      await sock.sendMessage(from, {
        text: `
🤖 ${config.botName}
👑 Owner: ${config.ownerName}

.movie <direct-link>
.gamepc <direct-link>
.sendfile <direct-link>
.ping
`
      })
    }

    if (cmd === "ping") {
      await sock.sendMessage(from, { text: "🏓 Pong!" })
    }

    if (["movie", "gamepc", "sendfile"].includes(cmd)) {
      if (!args[0]) return sock.sendMessage(from, { text: "❌ Link missing" })

      const file = `file_${Date.now()}.zip`
      await sock.sendMessage(from, { text: "⬇️ Downloading..." })

      await downloadFile(args[0], file)

      await sock.sendMessage(from, {
        document: fs.readFileSync(file),
        fileName: file,
        mimetype: "application/octet-stream"
      })

      fs.unlinkSync(file)
    }
  })
}

startBot()
