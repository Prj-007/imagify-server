import userModel from '../models/userModel.js'
import transactionModel from '../models/transactionModel.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.json({ success: false, message: 'Missing Details' })
    }

    const existing = await userModel.findOne({ email })
    if (existing) {
      return res.json({ success: false, message: 'Email already registered' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = userModel({ name, email, password: hashedPassword })
    const user = await newUser.save()

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
    res.json({ success: true, token, user: { name: user.name } })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await userModel.findOne({ email })

    if (!user) {
      return res.json({ success: false, message: 'User does not exist' })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
      res.json({ success: true, token, user: { name: user.name } })
    } else {
      res.json({ success: false, message: 'Invalid credentials' })
    }
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const userCredits = async (req, res) => {
  try {
    const { userId } = req.body
    const user = await userModel.findById(userId)
    res.json({ success: true, credits: user.creditBalance, user: { name: user.name } })
  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}

// Demo mode — adds credits directly without real payment
const paymentRazorpay = async (req, res) => {
  try {
    const { userId, planId } = req.body
    const userData = await userModel.findById(userId)

    if (!userData || !planId) {
      return res.json({ success: false, message: 'Missing Details' })
    }

    const plans = { Basic: 100, Advanced: 500, Business: 5000 }
    const credits = plans[planId]
    if (!credits) return res.json({ success: false, message: 'Plan not found' })

    await userModel.findByIdAndUpdate(userId, { creditBalance: userData.creditBalance + credits })
    res.json({ success: true, message: `${credits} credits added (demo mode)`, creditBalance: userData.creditBalance + credits })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const verifyRazorpay = async (req, res) => {
  res.json({ success: true, message: 'Payment verified (demo mode)' })
}

const paymentStripe = async (req, res) => {
  try {
    const { userId, planId } = req.body
    const userData = await userModel.findById(userId)

    if (!userData || !planId) {
      return res.json({ success: false, message: 'Missing Details' })
    }

    const plans = { Basic: 100, Advanced: 500, Business: 5000 }
    const credits = plans[planId]
    if (!credits) return res.json({ success: false, message: 'Plan not found' })

    await userModel.findByIdAndUpdate(userId, { creditBalance: userData.creditBalance + credits })
    res.json({ success: true, session_url: null, message: `${credits} credits added (demo mode)` })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const verifyStripe = async (req, res) => {
  res.json({ success: true, message: 'Payment verified (demo mode)' })
}

export { registerUser, loginUser, userCredits, paymentRazorpay, verifyRazorpay, paymentStripe, verifyStripe }
