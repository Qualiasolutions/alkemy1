// @ts-expect-error
function n(e) {
  // @ts-expect-error
  this.init(e || {})
}
n.prototype = {
  // @ts-expect-error
  init: function (e) {
    // @ts-expect-error
    this.phase = e.phase || 0
    // @ts-expect-error
    this.offset = e.offset || 0
    // @ts-expect-error
    this.frequency = e.frequency || 0.001
    // @ts-expect-error
    this.amplitude = e.amplitude || 1
  },
  update: function () {
    return (
      // @ts-expect-error
      (this.phase += this.frequency),
      // @ts-expect-error
      (e = this.offset + Math.sin(this.phase) * this.amplitude)
    )
  },
  value: () => e,
}

// @ts-expect-error
function Line(e) {
  // @ts-expect-error
  this.init(e || {})
}

Line.prototype = {
  // @ts-expect-error
  init: function (e) {
    // @ts-expect-error
    this.spring = e.spring + 0.1 * Math.random() - 0.05
    // @ts-expect-error
    this.friction = E.friction + 0.01 * Math.random() - 0.005
    // @ts-expect-error
    this.nodes = []
    for (let t, n = 0; n < E.size; n++) {
      t = new Node()
      // @ts-expect-error
      t.x = pos.x
      // @ts-expect-error
      t.y = pos.y
      // @ts-expect-error
      this.nodes.push(t)
    }
  },
  update: function () {
    // @ts-expect-error
    let e = this.spring,
      // @ts-expect-error
      t = this.nodes[0]
    // @ts-expect-error
    t.vx += (pos.x - t.x) * e
    // @ts-expect-error
    t.vy += (pos.y - t.y) * e
    // @ts-expect-error
    for (let n, i = 0, a = this.nodes.length; i < a; i++)
      // @ts-expect-error
      (t = this.nodes[i]),
        0 < i &&
          // @ts-expect-error
          ((n = this.nodes[i - 1]),
          (t.vx += (n.x - t.x) * e),
          (t.vy += (n.y - t.y) * e),
          (t.vx += n.vx * E.dampening),
          (t.vy += n.vy * E.dampening)),
        // @ts-expect-error
        (t.vx *= this.friction),
        // @ts-expect-error
        (t.vy *= this.friction),
        (t.x += t.vx),
        (t.y += t.vy),
        (e *= E.tension)
  },
  draw: function () {
    let e,
      t,
      // @ts-expect-error
      n = this.nodes[0].x,
      // @ts-expect-error
      i = this.nodes[0].y
    // @ts-expect-error
    ctx.beginPath()
    // @ts-expect-error
    ctx.moveTo(n, i)
    // @ts-expect-error
    for (let a = 1, o = this.nodes.length - 2; a < o; a++) {
      // @ts-expect-error
      e = this.nodes[a]
      // @ts-expect-error
      t = this.nodes[a + 1]
      n = 0.5 * (e.x + t.x)
      i = 0.5 * (e.y + t.y)
      // @ts-expect-error
      ctx.quadraticCurveTo(e.x, e.y, n, i)
    }
    // @ts-expect-error
    e = this.nodes[a]
    // @ts-expect-error
    t = this.nodes[a + 1]
    // @ts-expect-error
    ctx.quadraticCurveTo(e.x, e.y, t.x, t.y)
    // @ts-expect-error
    ctx.stroke()
    // @ts-expect-error
    ctx.closePath()
  },
}

// @ts-expect-error
function onMousemove(e) {
  function o() {
    lines = []
    for (let e = 0; e < E.trails; e++)
      lines.push(new Line({ spring: 0.45 + (e / E.trails) * 0.025 }))
  }
  // @ts-expect-error
  function c(e) {
    e.touches
      ? // @ts-ignore
        ((pos.x = e.touches[0].pageX), (pos.y = e.touches[0].pageY))
      : // @ts-ignore
        ((pos.x = e.clientX), (pos.y = e.clientY)),
      e.preventDefault()
  }
  // @ts-expect-error
  function l(e) {
    // @ts-expect-error
    1 === e.touches.length && ((pos.x = e.touches[0].pageX), (pos.y = e.touches[0].pageY))
  }
  document.removeEventListener('mousemove', onMousemove),
    document.removeEventListener('touchstart', onMousemove),
    document.addEventListener('mousemove', c),
    document.addEventListener('touchmove', c),
    document.addEventListener('touchstart', l),
    c(e),
    o(),
    render()
}

function render() {
  // @ts-expect-error
  if (ctx.running) {
    // @ts-expect-error
    ctx.globalCompositeOperation = 'source-over'
    // @ts-expect-error
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // @ts-expect-error
    ctx.globalCompositeOperation = 'lighter'
    // @ts-expect-error
    ctx.strokeStyle = `hsla(${Math.round(f.update())},100%,50%,0.025)`
    // @ts-expect-error
    ctx.lineWidth = 10
    for (let e, t = 0; t < E.trails; t++) {
      // @ts-expect-error
      ;(e = lines[t]).update()
      e.draw()
    }
    // @ts-expect-error
    ctx.frame++
    window.requestAnimationFrame(render)
  }
}

function resizeCanvas() {
  // @ts-expect-error
  ctx.canvas.width = window.innerWidth - 20
  // @ts-expect-error
  ctx.canvas.height = window.innerHeight
}

// @ts-expect-error
let ctx,
  // @ts-expect-error
  f,
  e = 0,
  pos = {},
  // @ts-expect-error
  lines = [],
  E = {
    debug: true,
    friction: 0.5,
    trails: 80,
    size: 50,
    dampening: 0.025,
    tension: 0.99,
  }
function Node() {
  this.x = 0
  this.y = 0
  this.vy = 0
  this.vx = 0
}

export const renderCanvas = () => {
  // @ts-expect-error
  const canvasElement = document.getElementById('canvas')
  if (!canvasElement) {
    console.warn('Canvas element not found, skipping renderCanvas initialization')
    return
  }
  // @ts-expect-error
  ctx = canvasElement.getContext('2d')
  ctx.running = true
  ctx.frame = 1
  f = new n({
    phase: Math.random() * 2 * Math.PI,
    amplitude: 85,
    frequency: 0.0015,
    offset: 285,
  })
  document.addEventListener('mousemove', onMousemove)
  document.addEventListener('touchstart', onMousemove)
  document.body.addEventListener('orientationchange', resizeCanvas)
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('focus', () => {
    // @ts-expect-error
    if (!ctx.running) {
      // @ts-expect-error
      ctx.running = true
      render()
    }
  })
  window.addEventListener('blur', () => {
    // @ts-expect-error
    ctx.running = true
  })
  resizeCanvas()

  // Initialize lines and start rendering immediately
  lines = []
  for (let i = 0; i < E.trails; i++) {
    lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }))
  }
  // Set initial mouse position to center of screen
  pos.x = window.innerWidth / 2
  pos.y = window.innerHeight / 2
  render()
}
