// macher bari restaurant site - react version
// everything is in this file. it works ok??
// - bimukti, cs395

import { useState, useEffect, useRef, createContext, useContext } from 'react'

// -------- menu data --------
// menu now lives in MongoDB - fetched from the backend at runtime (see useEffect below)
const API = 'http://localhost:5050'

const photos = [
  { num: '01', src: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80', alt: 'curry' },
  { num: '02', src: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80', alt: 'biryani' },
  { num: '03', src: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=500&q=80', alt: 'spread' },
  { num: '04', src: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', alt: 'fish' },
  { num: '05', src: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80', alt: 'samosa' },
  { num: '06', src: 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=500&q=80', alt: 'interior' },
]


// -------- cart context --------
// putting it here so i don't need a separate file
const CartContext = createContext()
const useCart = () => useContext(CartContext)


// -------- big main component, has everything --------
function App() {
  // cart state
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  // menu state - filled in from the backend
  const [menu, setMenu] = useState([])      // flat array of all menu items
  const [menuError, setMenuError] = useState('')

  // form fields (lifted up here bc why not)
  const [fName, setFName] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fMsg, setFMsg] = useState('')

  const trackRef = useRef(null)
  const galRef = useRef(null)

  // ---- load cart from localstorage ----
  useEffect(() => {
    const x = localStorage.getItem('cart')
    if (x) setCart(JSON.parse(x))
  }, [])

  // ---- fetch menu from the backend on first render ----
  useEffect(() => {
    fetch(API + '/api/menu')
      .then(res => {
        if (!res.ok) throw new Error('server returned ' + res.status)
        return res.json()
      })
      .then(data => setMenu(data))
      .catch(err => {
        console.error('could not load menu:', err)
        setMenuError('Could not load the menu. Is the backend running?')
      })
  }, [])

  // ---- the horizontal-scroll trick measures page width once on mount, but the
  // menu loads later and makes the page wider. fire a resize event when the
  // menu arrives so that trick recalculates the scrollable width. ----
  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [menu])

  // ---- save cart whenever it changes ----
  useEffect(()=>{
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart]);

  // ---- horizontal scroll trick (from old vanilla js version) ----
  // honestly idk why this works but it does. dont touch it
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    // must match Tailwind's `md` breakpoint (768px) - the track goes `md:fixed`
    // in CSS at 768px, so the JS has to switch modes at the exact same width.
    const isMobile = () => window.innerWidth < 768

    function setHeight() {
      if (isMobile()) {
        document.body.style.height = 'auto'
        track.style.transform = 'none'
        return
      }
      const totalWidth = track.scrollWidth
      document.body.style.height = (totalWidth - window.innerWidth + window.innerHeight) + 'px'
    }
    function onScroll() {
      if (isMobile()) return
      track.style.transform = 'translateX(' + (-window.scrollY) + 'px)'
    }

    function onResize() { setHeight(); onScroll() }

      function onLink(e) {
        if (isMobile()) return
        const a = e.target.closest('a[href^="#"]')
        if (!a) return
        const id = a.getAttribute('href')
        const t = document.querySelector(id)
        if (!t) return
        e.preventDefault()
        window.scrollTo({top:t.offsetLeft, behavior:'smooth'})
    }

    setHeight()
    window.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onResize)
    document.addEventListener('click', onLink)
    // TODO: add cleanup if there's time. probably leaks but who cares its just a school project
    return () => {
      window.removeEventListener('scroll', onScroll)
      // window.removeEventListener('resize', onResize)
      document.removeEventListener('click', onLink)
      document.body.style.height = 'auto'
    }
  }, [])

  // ---- cart functions ----
  function addToCart(name, price) {
    console.log('adding to cart:', name, price)
    let found = false
    const arr = []
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].name === name) {
        arr.push({ name: name, price: price, quantity: cart[i].quantity + 1 })
        found = true
      } else {
        arr.push(cart[i])
      }
    }
    if (!found) arr.push({ name: name, price: price, quantity: 1 })
    setCart(arr)
  }
  function removeFromCart(name){
    setCart(cart.filter(i=>i.name!==name))
  }


  function updateQty(name, delta) {
    const arr = []
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].name === name) {
        const q = cart[i].quantity + delta
        if (q > 0) arr.push({ ...cart[i], quantity: q })
      }
      else {
          arr.push(cart[i])
      }
    }
    setCart(arr)
  }
  function clearCart() {
    if (cart.length === 0) return
    if (confirm('Clear cart?')) setCart([])
  }
  // ---- checkout: save the order to the backend ----
  async function checkout() {
    if (cart.length === 0) { alert('Your cart is empty!'); return }

    // work out the total
    let t = 0
    for (let i = 0; i < cart.length; i++) t += cart[i].price * cart[i].quantity

    // build the order payload - shape must match the Order schema on the server
    const order = {
      items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
      total: t,
      customerName: fName || 'Guest',
    }

    try {
      const res = await fetch(API + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      })
      if (!res.ok) throw new Error('server returned ' + res.status)
      await res.json()                          // the saved order, with its _id
      alert('Thank you! Total: $' + t.toFixed(2))
      setCart([])                               // empty the cart after a successful order
      setCartOpen(false)
    } catch (err) {
      console.error('checkout failed:', err)
      alert('Sorry, could not place your order. Please try again.')
    }
  }

  // totals
  let total = 0, count = 0
  for (let i=0; i<cart.length; i++) {
    total += cart[i].price*cart[i].quantity
    count += cart[i].quantity
  }


  // ---- form ----
  // TODO: actually send the form somewhere instead of alert
  function submitForm(e) {
    e.preventDefault()
    // console.log({fName, fEmail, fMsg})
    alert('Dhonnobad! We will be in touch.')
    setFName('')
    setFEmail('')
    setFMsg('')
  }

  // input className - reused so put it in a var
  const inpCls = "bg-[var(--bg)] border border-black/10 text-[var(--text)] px-3.5 py-3 font-mono text-xs rounded outline-none focus:border-[var(--accent)] transition"

  // ---- gallery scroll ----
  function gal(dir) {
    galRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }

  // helper for menu rows
  function MenuRow({ name, price, desc }) {
    return (
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="serif text-[1.05rem] text-[var(--ink)] whitespace-nowrap">{name}</span>
          <span className="flex-1 border-b border-dotted border-[var(--muted)] opacity-30 mx-1"></span>
          <span className="text-xs font-medium text-[var(--accent)]">${price}</span>
        </div>
        <p className="text-xs text-[var(--muted)] leading-relaxed mt-1 mb-2">{desc}</p>
        <button
          onClick={() => addToCart(name, price)}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--cream)] rounded text-xs font-medium uppercase hover:bg-[var(--pop)] transition"
        >
          Add to Cart
        </button>
      </div>
    )
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, total, count }}>



      {/* ===== NAV ===== */}
       <nav className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center px-10 py-4 bg-black/30 backdrop-blur">
        <a href="#hero" className="serif text-white text-lg">Macher Bari</a>
        <ul className={`gap-7 md:flex ${navOpen ? 'flex' : 'hidden'} text-white text-[0.65rem] uppercase tracking-[0.15em]`}>
          {/* tried to map these but it broke for some reason so just hardcoded */}
          <li><a href="#hero" onClick={() => setNavOpen(false)} className="hover:opacity-50">Home</a></li>
          <li><a href="#menu" onClick={() => setNavOpen(false)} className="hover:opacity-50">Menu</a></li>
          <li><a href="#gallery" onClick={() => setNavOpen(false)} className="hover:opacity-50">Gallery</a></li>
          <li><a href="#about" onClick={() => setNavOpen(false)} className="hover:opacity-50">About</a></li>
          <li><a href="#contact" onClick={() => setNavOpen(false)} className="hover:opacity-50">Contact</a></li>
        </ul>
        <div className="flex items-center gap-4">
          <button onClick={() => setNavOpen(!navOpen)} className="md:hidden text-white text-2xl">☰</button>
          <button onClick={() => setCartOpen(true)} className="relative w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/10">
            🛒
            <span className="absolute -top-1.5 -right-1.5 bg-[var(--accent)] text-[var(--cream)] text-[0.65rem] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--ink)]">{count}</span>
          </button>
        </div>
      </nav>

      {/* ===== CART SIDEBAR ===== */}
      <div onClick={() => setCartOpen(false)} className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${cartOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} />
      <div className={`fixed top-0 right-0 h-screen w-[400px] max-w-full bg-[var(--cream)] shadow-2xl z-50 flex flex-col transition-transform duration-300 ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center p-6 border-b border-[var(--surface)]">
          <h3 className="serif text-2xl text-[var(--ink)]">Your Cart</h3>
          <button onClick={() => setCartOpen(false)} className="w-9 h-9 rounded-full text-[var(--muted)] text-2xl leading-none flex items-center justify-center hover:bg-[var(--surface)] hover:text-[var(--ink)] transition">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 && <p className="text-center text-sm text-[var(--muted)] py-12">Your cart is empty</p>}
          {cart.map((it) => (
            <div key={it.name} className="bg-[var(--bg)] border border-[var(--surface)] rounded-md p-4 mb-3">
              <div className="flex justify-between items-baseline mb-3">
                <span className="serif text-base text-[var(--ink)]">{it.name}</span>
                <span className="text-sm font-medium text-[var(--accent)]">${it.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(it.name, -1)} className="w-7 h-7 rounded border border-[var(--muted)] bg-[var(--cream)] text-[var(--ink)] text-sm hover:bg-[var(--accent)] hover:text-[var(--cream)] hover:border-[var(--accent)] transition">-</button>
                <span className="text-sm font-medium text-[var(--ink)] min-w-[24px] text-center">{it.quantity}</span>
                <button onClick={() => updateQty(it.name, 1)} className="w-7 h-7 rounded border border-[var(--muted)] bg-[var(--cream)] text-[var(--ink)] text-sm hover:bg-[var(--accent)] hover:text-[var(--cream)] hover:border-[var(--accent)] transition">+</button>
                <button onClick={() => removeFromCart(it.name)} className="ml-auto w-7 h-7 rounded border border-[var(--accent)]/30 text-[var(--accent)] text-lg leading-none flex items-center justify-center hover:bg-[var(--accent)] hover:text-[var(--cream)] transition">×</button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-[var(--surface)] bg-[var(--bg)]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-base font-medium text-[var(--ink)]">Total:</span>
            <span className="serif text-2xl text-[var(--accent)]">${total.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={checkout} className="flex-1 py-3 bg-[var(--accent)] text-[var(--cream)] rounded font-mono text-[0.7rem] font-medium tracking-[0.1em] uppercase hover:bg-[var(--pop)] hover:-translate-y-px transition">Checkout</button>
            <button onClick={clearCart} className="flex-1 py-3 bg-[var(--muted)] text-[var(--cream)] rounded font-mono text-[0.7rem] font-medium tracking-[0.1em] uppercase hover:bg-[var(--accent)] transition">Clear</button>
          </div>
        </div>
      </div>

      {/* ===== TRACK (all sections side by side on desktop) ===== */}
      <div ref={trackRef} className="flex flex-col md:flex-row md:fixed md:top-0 md:left-0 md:h-screen will-change-transform">

        {/* HERO */}
        <div className="md:w-screen md:h-screen md:shrink-0">
          <section id="hero" className="md:h-full flex flex-col md:flex-row items-center justify-center gap-16 px-16 pt-24 pb-16 bg-[var(--accent)] text-[var(--cream)] min-h-screen">
            <div className="flex-1 max-w-xl">
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-white/50 mb-4">Est. 2019 — Jackson Heights, Queens</p>
                      <h1 className="serif text-7xl md:text-9xl leading-none mb-4 text-[var(--cream)]">
                Macher<br /><i className="text-[var(--bg)]">Bari</i>
              </h1>
              <p className="text-xs text-white/60 leading-relaxed mb-6">Bengali kitchen. Home cooking. No shortcuts.</p>
              <a href="#menu" className="inline-block px-6 py-2 border border-white/40 rounded-full text-[0.7rem] tracking-[0.1em] uppercase hover:bg-[var(--cream)] hover:text-[var(--accent)] transition">See menu →</a>
            </div>
            <div className="flex-1 max-w-xl">
              <img src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80" alt="food" className="w-full h-[400px] object-cover rounded-lg" />
            </div>
          </section>
        </div>

        {/* MENU */}
        <div className="md:w-[120vw] md:h-screen md:shrink-0">
          <section id="menu" className="md:h-full flex flex-col justify-center px-16 pt-24 pb-16 bg-[var(--cream)]">
            <div className="mb-8">
              <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[var(--muted)] mb-1">01</span>
              <h2 className="serif text-5xl md:text-6xl text-[var(--ink)]">Menu</h2>
            </div>

            {menuError && <p className="font-mono text-xs text-red-600 mb-4">{menuError}</p>}

            <div className="flex flex-col md:flex-row gap-16">
                <div className="min-w-[240px]">
                  <h3 className="font-mono text-xs font-medium uppercase tracking-widest text-[var(--accent)] border-b border-[var(--accent)] pb-1 mb-5 inline-block">Starters</h3>
                  {menu.filter(it => it.category === 'starter').map(it => <MenuRow key={it._id} {...it} />)}
                </div>

              <div className="min-w-[240px]">
                <h3 className="font-mono text-xs font-medium uppercase tracking-widest text-[var(--accent)] border-b border-[var(--accent)] pb-1 mb-5 inline-block">Mains</h3>
                {menu.filter(it => it.category === 'main').map(it => <MenuRow key={it._id} {...it} />)}
              </div>
              <div className="min-w-[240px]">
              <h3 className="font-mono text-xs font-medium uppercase tracking-widest text-[var(--accent)] border-b border-[var(--accent)] pb-1 mb-5 inline-block">Desserts</h3>
                {menu.filter(it => it.category === 'dessert').map(it => <MenuRow key={it._id} {...it} />)}
              </div>
            </div>
          </section>
        </div>

        {/* GALLERY */}
        <div className="md:w-[120vw] md:h-screen md:shrink-0">
          <section id="gallery" className="md:h-full flex flex-col justify-center px-16 pt-24 pb-16 bg-[var(--pop)] text-[var(--cream)]">
            <div className="mb-8">
              <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-white/40 mb-1">02</span>
              <h2 className="serif text-5xl md:text-6xl text-[var(--cream)]">Gallery</h2>
            </div>
            <div ref={galRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {photos.map(p => (
                <div key={p.num} className="flex-shrink-0">
                  <span className="block text-[0.55rem] uppercase tracking-[0.15em] text-white/35 mb-1">{p.num}</span>
                  <img src={p.src} alt={p.alt} className="w-[200px] h-[200px] object-cover rounded hover:scale-[1.03] transition-transform" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => gal(-1)} className="w-9 h-9 rounded-full border border-white/30 text-[var(--cream)] hover:bg-[var(--cream)] hover:text-[var(--pop)] transition">←</button>
              <button onClick={() => gal(1)} className="w-9 h-9 rounded-full border border-white/30 text-[var(--cream)] hover:bg-[var(--cream)] hover:text-[var(--pop)] transition">→</button>
            </div>
          </section>
        </div>

        {/* ABOUT */}
        <div className="md:w-screen md:h-screen md:shrink-0">
          <section id="about" className="md:h-full flex flex-col justify-center px-16 pt-24 pb-16 bg-[var(--bg)]">
            <div className="mb-8">
              <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[var(--muted)] mb-1">03</span>
              <h2 className="serif text-5xl md:text-6xl text-[var(--ink)]">About</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-10 items-start">
              <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&q=80" alt="cooking" className="w-[220px] h-[220px] object-cover rounded flex-shrink-0" />
              <div className="max-w-md text-[var(--muted)] text-xs leading-loose space-y-3">
                <p>Macher Bari started in 2019 when Rina Dasgupta left her corporate job and opened a kitchen on 74th Street in Jackson Heights. She grew up in North Kolkata watching her thamma slow-cook ilish in mustard paste.</p>
                <p>We source our hilsa from Bangladeshi importers, our mustard oil is cold-pressed from Burdwan, and our spices arrive whole from Koley Market. Nothing here comes from a packet.</p>
                <p>Every paste is ground fresh. Every jhol is simmered slow.</p>
              </div>
            </div>
          </section>
        </div>

        {/* CONTACT */}
        <div className="md:w-screen md:h-screen md:shrink-0">
          <section id="contact" className="md:h-full flex flex-col justify-center px-16 pt-24 pb-16 bg-[var(--cream)]">
            <div className="mb-8">
              <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[var(--muted)] mb-1">04</span>
              <h2 className="serif text-5xl md:text-6xl text-[var(--ink)]">Contact</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-10 max-w-3xl">
              <form onSubmit={submitForm} className="flex-1 flex flex-col gap-3">
                  <input type="text"  placeholder="Name"  value={fName}  onChange={e=>setFName(e.target.value)} className={inpCls} />
                <input type="email" placeholder="Email" value={fEmail} onChange={e=>setFEmail(e.target.value)} className={inpCls} />
                <textarea rows="4" placeholder="Message" value={fMsg} onChange={e=>setFMsg(e.target.value)} className={inpCls} />

                <button type="submit" className="bg-[var(--accent)] text-[var(--cream)] py-3 rounded font-mono text-xs font-medium tracking-widest uppercase hover:opacity-80 transition">Send</button>
              </form>
              <div className="flex-1">
                <iframe title="map" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3021.5!2d-73.891!3d40.7496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25f1987b0f30d%3A0x2a3e0f1a5d5b5e0!2sJackson+Heights%2C+NY!5e0!3m2!1sen!2sus!4v1" className="w-full min-h-[240px] h-full border-0 rounded" />
              </div>
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="md:w-[70vw] md:h-screen md:shrink-0">
          <footer className="md:h-full flex flex-col justify-center px-16 pt-24 pb-12 bg-[var(--ink)] text-[var(--surface)]">
            <h2 className="serif text-[clamp(2rem,4vw,3.5rem)] text-[var(--cream)] mb-8">
              Macher <i className="text-[var(--accent)]">Bari</i>
            </h2>
            <div className="flex flex-wrap gap-12 mb-8">
              <div className="min-w-[140px]">
                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--muted)] mb-1">Address</p>
                <p className="text-xs text-[var(--muted)] leading-relaxed">37-47 74th Street<br />Jackson Heights, NY 11372</p>
              </div>
              <div className="min-w-[140px]">
                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--muted)] mb-1">Hours</p>
                <p className="text-xs text-[var(--muted)] leading-relaxed">Mon–Thu 12–10 PM<br />Fri–Sat 12–11 PM<br />Sun 11 AM–10 PM</p>
              </div>
              <div className="min-w-[140px]">
                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--muted)] mb-1">Say hi</p>
                <p className="text-xs text-[var(--muted)] leading-relaxed">+1 (718) 555-0247<br />hello@macherbari.com</p>
              </div>
              <div className="min-w-[140px]">
                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--muted)] mb-1">Social</p>
                <a href="#" className="block text-xs text-[var(--muted)] leading-loose hover:text-[var(--accent)]">Facebook</a>
                <a href="#" className="block text-xs text-[var(--muted)] leading-loose hover:text-[var(--accent)]">Instagram</a>
                <a href="#" className="block text-xs text-[var(--muted)] leading-loose hover:text-[var(--accent)]">Twitter</a>
                  <a href="#" className="block text-xs text-[var(--muted)] leading-loose hover:text-[var(--accent)]">Yelp</a>
              </div>
            </div>
            <p className="text-[0.6rem] text-[var(--muted)] opacity-40">© 2026 Macher Bari</p>
          </footer>
        </div>

      </div>
    </CartContext.Provider>
  )
}

export default App
