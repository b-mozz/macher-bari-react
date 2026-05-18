// routes/orders.js — REST endpoints for orders
const express = require('express')
const router = express.Router()
const Order = require('../models/Order')

// GET /api/orders — list all orders, newest first
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/orders — place an order (called from the cart checkout)
router.post('/', async (req, res) => {
  try {
    const order = await Order.create(req.body)
    res.status(201).json(order)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
