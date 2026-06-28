import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import userRouter from './routes/userRoutes.js'
import imageRouter from './routes/imageRoutes.js'

const PORT = process.env.PORT || 4000
const app = express()

app.use(express.json())
app.use(cors())

app.use('/api/user', userRouter)
app.use('/api/image', imageRouter)

app.get('/', (req, res) => res.send('API Working'))

app.listen(PORT, () => console.log('Server running on port ' + PORT))
