// models/Order.js — shape of one order in the "orders" collection
const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  // items is an array of sub-documents (one per cart line)
  items: [{
    name:     { type: String, required: true },
    price:    { type: Number, required: true },
    quantity: { type: Number, required: true },
  }],
  total:        { type: Number, required: true },
  customerName: { type: String, default: 'Guest' },
  createdAt:    { type: Date, default: Date.now },
})

module.exports = mongoose.model('Order', orderSchema)
