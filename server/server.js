// server.js — entry point for the Macher Bari backend
// run with: npm run dev

require('dotenv').config()               // loads server/.env into process.env

const express = require('express') 
const mongoose = require('mongoose')
const cors = require('cors')

const menuRoutes = require('./routes/menu')
const orderRoutes = require('./routes/orders')

const app = express()
const PORT = process.env.PORT || 5050   // tried 500 but it was taken by macOS airdrop something

// needed for frontend, check documentation on geeksForGeeks
app.use(cors())             // lets the React app (a different origin) call this API
app.use(express.json())     // parses a JSON request body into req.body. needed for post reqs, otherwise shows undefined

// ---- routes ----
app.get('/', (req, res) => res.send('Macher Bari API is running'))
app.use('/api/menu', menuRoutes)      // anything under /api/menu  -> routes/menu.js
app.use('/api/orders', orderRoutes)   // anything under /api/orders -> routes/orders.js

// ---- we connect to MongoDB first, then start listening ----
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('connected')          // <-- this is what I MUST see on console. Or not working
    // we are putting app listen inside this connect function
    //so that the server starts only if our mongoDB connection is working. Otherwise we catch error
    app.listen(PORT, () => console.log(`server running on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
  })
