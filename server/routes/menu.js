// routes/menu.js — REST endpoints for menu items
const express = require('express')
const router = express.Router()
const MenuItem = require('../models/MenuItem')

// GET /api/menu — return every menu item (used by the React frontend)
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find() // we are not passing any argument to our find. returns the whole menu
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/menu — add a new menu item
router.post('/', async (req, res) => {
  try {
    const item = await MenuItem.create(req.body)
    res.status(201).json(item)            // 201 = created
  } catch (err) {
    res.status(400).json({ error: err.message })   // 400 = bad input
  }
})

// PUT /api/menu/:id — update an existing menu item
router.put('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }   // new: return the updated doc, not the old one
      // i found runValidators: true in the template. ig something to do with the database
    )
    if (!item) return res.status(404).json({ error: 'menu item not found' })
    res.json(item) // reminder res.json() always sends the http response. express doesnt look at return value
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/menu/:id — remove a menu item
router.delete('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ error: 'menu item not found' })
    res.json({ message: 'deleted', item })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
