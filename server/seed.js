// seed.js — one-time script to load the menu into MongoDB
// run with: node seed.js   (do NOT keep running it — see deleteMany below)

require('dotenv').config()
const mongoose = require('mongoose')
const MenuItem = require('./models/MenuItem')

// menu data copied from src/App.jsx, with a `category` added to each
const starters = [
  { name: 'Beguni', price: 7, desc: 'Crispy battered eggplant, tamarind chutney' },
  { name: 'Aloo Chop', price: 8, desc: 'Spiced potato croquettes, kasha filling' },
  { name: 'Shingara', price: 6, desc: 'Bengali samosa, potato and peanuts' },
]
const mains = [
  { name: 'Ilish Bhapa', price: 26, desc: 'Steamed hilsa, mustard-coconut, banana leaf' },
  { name: 'Chingri Malaikari', price: 22, desc: 'Prawns in coconut milk, whole spices' },
  { name: 'Kosha Mangsho', price: 24, desc: 'Slow-cooked mutton, onion-ginger gravy' },
  { name: 'Kolkata Biryani', price: 20, desc: 'Dum biryani, aloo, egg, saffron, kewra' },
]
const desserts = [
  { name: 'Nolen Gurer Payesh', price: 10, desc: 'Rice pudding, date palm jaggery' },
  { name: 'Mishti Doi', price: 8, desc: 'Sweetened yogurt in clay pots' },
  { name: 'Rasgulla', price: 9, desc: 'Spongy chenna balls in sugar syrup' },
]

// tag each item with its category and merge into one array
const allItems = [
  ...starters.map(i => ({ ...i, category: 'starter' })),
  ...mains.map(i => ({ ...i, category: 'main' })),
  ...desserts.map(i => ({ ...i, category: 'dessert' })),
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  await MenuItem.deleteMany({})        // wipe old menu so re-running won't create duplicates
  await MenuItem.insertMany(allItems)
  console.log(`seeded ${allItems.length} menu items`)
  await mongoose.disconnect()
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
