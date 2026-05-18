// models/MenuItem.js — shape of one menu item in the "menuitems" collection
const mongoose = require('mongoose')

const menuItemSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  desc:     { type: String, required: true },
  // enum restricts category to these three values
  category: { type: String, enum: ['starter', 'main', 'dessert'], required: true },
})

// mongoose pluralizes "MenuItem" -> the collection is called "menuitems"
module.exports = mongoose.model('MenuItem', menuItemSchema)
