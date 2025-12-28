import express from "express"
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import QRCode from "qrcode"

const app = express()
let qrData = ""

app.use(express.static("public"))

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const sock = makeWASocket({ auth: state })

  sock.ev.on("creds.update", saveCreds)
  sock.ev.on("connection.update", async (u) => {
    if (u.qr) qrData = await QRCode.toDataURL(u.qr)
  })
}
start()

app.get("/qr", (req, res) => {
  if (!qrData) return res.json({ status: false })
  res.json({ status: true, qr: qrData })
})

app.listen(3000, () =>
  console.log("🌐 Pair Site : http://localhost:3000")
)
