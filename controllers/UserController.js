import userModel from '../models/userModel.js'
import transactionModel from '../models/transactionModel.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Razorpay from 'razorpay'

const plans = { Basic: { price: 10, credits: 100 }, Advanced: { price: 50, credits: 500 }, Business: { price: 250, credits: 5000 } }

let razorpayInstance = null
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return razorpayInstance
}

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

const paymentRazorpay = async (req, res) => {
  try {
    const { userId, planId } = req.body
    const userData = await userModel.findById(userId)

    if (!userData || !planId) {
      return res.json({ success: false, message: 'Missing Details' })
    }

    const plan = plans[planId]
    if (!plan) return res.json({ success: false, message: 'Plan not found' })

    const transaction = await transactionModel.create({ userId, planId, amount: plan.price, credits: plan.credits })

    const order = await getRazorpayInstance().orders.create({
      amount: plan.price * 100,
      currency: process.env.CURRENCY || 'INR',
      receipt: transaction._id,
    })

    res.json({ success: true, order })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.json({ success: false, message: 'Missing payment details' })
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.json({ success: false, message: 'Payment verification failed' })
    }

    const orderInfo = await getRazorpayInstance().orders.fetch(razorpay_order_id)
    if (orderInfo.status !== 'paid') {
      return res.json({ success: false, message: 'Payment not completed' })
    }

    const transaction = await transactionModel.findById(orderInfo.receipt)
    if (!transaction) {
      return res.json({ success: false, message: 'Transaction not found' })
    }
    if (transaction.payment) {
      return res.json({ success: false, message: 'Payment already processed' })
    }

    const user = await userModel.findById(transaction.userId)
    await userModel.findByIdAndUpdate(transaction.userId, { creditBalance: user.creditBalance + transaction.credits })
    await transactionModel.findByIdAndUpdate(transaction._id, { payment: true })

    res.json({ success: true, message: 'Payment verified, credits added' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { registerUser, loginUser, userCredits, paymentRazorpay, verifyRazorpay }
