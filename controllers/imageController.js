import axios from 'axios'
import userModel from '../models/userModel.js'

export const generateImage = async (req, res) => {
  try {
    const { userId, prompt } = req.body

    const user = await userModel.findById(userId)

    if (!user || !prompt) {
      return res.json({ success: false, message: 'Missing Details' })
    }

    if (user.creditBalance <= 0) {
      return res.json({ success: false, message: 'No Credit Balance', creditBalance: user.creditBalance })
    }

    // Pollinations.ai — free, no API key required
    const { data } = await axios.get(
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`,
      { responseType: 'arraybuffer' }
    )

    const base64Image = Buffer.from(data, 'binary').toString('base64')
    const resultImage = `data:image/jpeg;base64,${base64Image}`

    await userModel.findByIdAndUpdate(user._id, { creditBalance: user.creditBalance - 1 })

    res.json({ success: true, message: 'Image Generated', resultImage, creditBalance: user.creditBalance - 1 })

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}
