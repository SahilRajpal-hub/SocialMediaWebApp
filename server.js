const express = require('express')
const connectDb = require('./config/db')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

connectDb()

//Init middleware
app.use(express.json({ extended: false }))

app.get('/', (req, res) => {
  res.send('API is running...')
})

app.use('/api/users', require('./routes/apis/users'))
app.use('/api/auth', require('./routes/apis/auth'))
app.use('/api/profile', require('./routes/apis/profile'))
app.use('/api/post', require('./routes/apis/post'))

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server  connected to PORT ${PORT}`))
