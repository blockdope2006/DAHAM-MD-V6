import axios from "axios"
import fs from "fs"

export async function downloadFile(url, path) {
  const res = await axios({
    method: "GET",
    url,
    responseType: "stream"
  })

  const writer = fs.createWriteStream(path)
  res.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve)
    writer.on("error", reject)
  })
}
