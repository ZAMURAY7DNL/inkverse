// MascotaEngine.ts - Sistema de railes ortogonales

export interface Punto { x: number; y: number }

export interface Superficie {
  id: string
  top: number
  left: number
  right: number
  bottom: number
  el: Element
}

const SELECTORES_AUTO = [
  'header', 'nav', 'footer',
  '[data-clicka-node]',
  'section',
  '.rounded', '.rounded-sm', '.rounded-md', '.rounded-lg', '.rounded-xl',
  'button',
  'input',
  'a.rounded', 'a.rounded-sm', 'a.rounded-md', 'a.rounded-lg', 'a.rounded-xl',
  '[class*="card"]',
  '[class*="panel"]',
  '[class*="modal"]',
]

const MARGEN = 4
const MIN_AREA = 60 * 30
const NAVBAR_H = 64
const EPS = 3
const GRID_LIMIT = 900

function elementoValido(el: Element): boolean {
  const r = el.getBoundingClientRect()
  const absTop = r.top + window.scrollY
  const absBottom = r.bottom + window.scrollY
  const tag = el.tagName.toLowerCase()

  if (r.width <= 0 || r.height <= 0) return false
  if (absTop < -8 || absBottom < 0) return false
  if (r.top > window.innerHeight * 4) return false
  if (r.width * r.height < MIN_AREA) return false

  const esNavbar = tag === 'header' || tag === 'nav' || el.hasAttribute('data-clicka-node')
  if (absTop < NAVBAR_H && !esNavbar) return false

  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  if (parseFloat(style.opacity || '1') < 0.05) return false

  const bg = style.backgroundColor
  const hasBg = bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'
  const hasBorder = [
    style.borderTopWidth,
    style.borderRightWidth,
    style.borderBottomWidth,
    style.borderLeftWidth,
  ].some((w) => parseFloat(w) > 0)
  const hasShadow = style.boxShadow !== 'none'
  const semanticSurface = ['header', 'nav', 'footer', 'section', 'button', 'input', 'a'].includes(tag)

  return hasBg || hasBorder || hasShadow || semanticSurface || el.hasAttribute('data-clicka-node')
}

function elToSuperficie(el: Element, id: string): Superficie | null {
  if (!elementoValido(el)) return null
  const r = el.getBoundingClientRect()
  return {
    id,
    top: r.top + window.scrollY,
    left: r.left + window.scrollX,
    right: r.right + window.scrollX,
    bottom: r.bottom + window.scrollY,
    el,
  }
}

function rectKey(s: Superficie): string {
  return [
    Math.round(s.left),
    Math.round(s.top),
    Math.round(s.right),
    Math.round(s.bottom),
  ].join(':')
}

function borde(s: Superficie) {
  return {
    l: s.left - MARGEN,
    t: s.top - MARGEN,
    r: s.right + MARGEN,
    b: s.bottom + MARGEN,
  }
}

function esquinas(s: Superficie): Punto[] {
  const r = borde(s)
  return [
    { x: r.l, y: r.t },
    { x: r.r, y: r.t },
    { x: r.r, y: r.b },
    { x: r.l, y: r.b },
  ]
}

function esMismoPunto(a: Punto, b: Punto): boolean {
  return Math.abs(a.x - b.x) <= EPS && Math.abs(a.y - b.y) <= EPS
}

function normalizar(p: Punto): Punto {
  return { x: Math.round(p.x), y: Math.round(p.y) }
}

function key(p: Punto): string {
  const n = normalizar(p)
  return `${n.x}:${n.y}`
}

function dist2(a: Punto, b: Punto): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2
}

function distancia(a: Punto, b: Punto): number {
  return Math.sqrt(dist2(a, b))
}

function estaEnBorde(p: Punto, s: Superficie): boolean {
  const r = borde(s)
  const enX = p.x >= r.l - EPS && p.x <= r.r + EPS
  const enY = p.y >= r.t - EPS && p.y <= r.b + EPS
  const horizontal = (Math.abs(p.y - r.t) <= EPS || Math.abs(p.y - r.b) <= EPS) && enX
  const vertical = (Math.abs(p.x - r.l) <= EPS || Math.abs(p.x - r.r) <= EPS) && enY
  return horizontal || vertical
}

function estaDentroInterior(p: Punto, s: Superficie): boolean {
  return (
    p.x > s.left + EPS &&
    p.x < s.right - EPS &&
    p.y > s.top + EPS &&
    p.y < s.bottom - EPS
  )
}

function puntoBloqueado(p: Punto, sups: Superficie[], ignorarIds: string[]): boolean {
  if (sups.some((s) => estaEnBorde(p, s))) return false
  return sups.some((s) => !ignorarIds.includes(s.id) && estaDentroInterior(p, s))
}

// Chequea si un segmento recto cruza el INTERIOR de alguna superficie.
function segmentoCruza(a: Punto, b: Punto, sups: Superficie[], ignorarIds: string[]): boolean {
  // Nunca permitir segmentos diagonales — solo ortogonales
  if (Math.abs(a.x - b.x) > EPS && Math.abs(a.y - b.y) > EPS) return true
  const steps = Math.ceil(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) / 8)
  if (steps === 0) return false

  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const px = a.x + (b.x - a.x) * t
    const py = a.y + (b.y - a.y) * t
    if (puntoBloqueado({ x: px, y: py }, sups, ignorarIds)) return true
  }

  return false
}

function railRatio(a: Punto, b: Punto, sups: Superficie[]): number {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) / 8))
  let sobreRail = 0

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    }
    if (sups.some((s) => estaEnBorde(p, s))) sobreRail++
  }

  return sobreRail / (steps + 1)
}

function costeSegmento(a: Punto, b: Punto, sups: Superficie[]): number {
  const len = distancia(a, b)
  const fueraDeRail = len * (1 - railRatio(a, b, sups))
  return len + fueraDeRail * 10
}

function rutaPerimetroDesde(s: Superficie, entrada: Punto): Punto[] {
  const corners = esquinas(s)
  const r = borde(s)

  if (r.t < window.scrollY + 8) {
    const bottomLeft = corners[3]
    const bottomRight = corners[2]
    return entrada.x < (r.l + r.r) / 2
      ? [bottomLeft, bottomRight]
      : [bottomRight, bottomLeft]
  }

  const idx = corners.reduce((best, corner, i) =>
    dist2(entrada, corner) < dist2(entrada, corners[best]) ? i : best
  , 0)

  return [
    corners[idx],
    corners[(idx + 1) % 4],
    corners[(idx + 2) % 4],
    corners[(idx + 3) % 4],
  ]
}

function limpiarPath(path: Punto[], sups: Superficie[]): Punto[] {
  const sinDuplicados = path
    .map(normalizar)
    .filter((p, i, arr) => i === 0 || !esMismoPunto(p, arr[i - 1]))

  const limpio: Punto[] = []
  for (const p of sinDuplicados) {
    const prev = limpio[limpio.length - 1]
    const prevPrev = limpio[limpio.length - 2]

    if (
      prev &&
      prevPrev &&
      ((prevPrev.x === prev.x && prev.x === p.x) || (prevPrev.y === prev.y && prev.y === p.y)) &&
      !segmentoCruza(prevPrev, p, sups, [])
    ) {
      limpio[limpio.length - 1] = p
    } else {
      limpio.push(p)
    }
  }

  return limpio
}

function dedupeNumeros(valores: number[]): number[] {
  return Array.from(new Set(valores.map((v) => Math.round(v)))).sort((a, b) => a - b)
}

function rutaOrtogonalLibre(
  inicio: Punto,
  fin: Punto,
  sups: Superficie[],
  ignorarIds: string[],
): Punto[] | null {
  const visibles = sups.slice(0, 80)
  const xVals = dedupeNumeros([
    inicio.x,
    fin.x,
    window.scrollX + 8,
    window.scrollX + window.innerWidth - 8,
    ...visibles.flatMap((s) => {
      const r = borde(s)
      return [r.l, r.r]
    }),
  ])
  const yVals = dedupeNumeros([
    inicio.y,
    fin.y,
    window.scrollY + NAVBAR_H + 8,
    window.scrollY + window.innerHeight - 8,
    ...visibles.flatMap((s) => {
      const r = borde(s)
      return [r.t, r.b]
    }),
  ])

  if (xVals.length * yVals.length > GRID_LIMIT) {
    const simple = [
      [inicio, { x: inicio.x, y: fin.y }, fin],
      [inicio, { x: fin.x, y: inicio.y }, fin],
    ]
    return simple.find((r) =>
      !segmentoCruza(r[0], r[1], sups, ignorarIds) &&
      !segmentoCruza(r[1], r[2], sups, ignorarIds)
    ) ?? null
  }

  const puntos = new Map<string, Punto>()
  for (const x of xVals) {
    for (const y of yVals) {
      const p = { x, y }
      if (!puntoBloqueado(p, sups, ignorarIds)) puntos.set(key(p), p)
    }
  }

  puntos.set(key(inicio), normalizar(inicio))
  puntos.set(key(fin), normalizar(fin))

  const filas = new Map<number, Punto[]>()
  const columnas = new Map<number, Punto[]>()
  for (const p of Array.from(puntos.values())) {
    if (!filas.has(p.y)) filas.set(p.y, [])
    if (!columnas.has(p.x)) columnas.set(p.x, [])
    filas.get(p.y)!.push(p)
    columnas.get(p.x)!.push(p)
  }

  const vecinos = new Map<string, { to: string; cost: number }[]>()
  const conectar = (a: Punto, b: Punto) => {
    if (segmentoCruza(a, b, sups, ignorarIds)) return
    const ak = key(a)
    const bk = key(b)
    const cost = costeSegmento(a, b, sups)
    if (!vecinos.has(ak)) vecinos.set(ak, [])
    if (!vecinos.has(bk)) vecinos.set(bk, [])
    vecinos.get(ak)!.push({ to: bk, cost })
    vecinos.get(bk)!.push({ to: ak, cost })
  }

  for (const row of Array.from(filas.values())) {
    row.sort((a, b) => a.x - b.x)
    for (let i = 1; i < row.length; i++) conectar(row[i - 1], row[i])
  }

  for (const column of Array.from(columnas.values())) {
    column.sort((a, b) => a.y - b.y)
    for (let i = 1; i < column.length; i++) conectar(column[i - 1], column[i])
  }

  const startKey = key(inicio)
  const endKey = key(fin)
  const dist = new Map<string, number>([[startKey, 0]])
  const prev = new Map<string, string>()
  const abiertos = new Set<string>([startKey])

  while (abiertos.size > 0) {
    let actual = ''
    let mejor = Infinity
    for (const k of Array.from(abiertos)) {
      const d = dist.get(k) ?? Infinity
      if (d < mejor) {
        mejor = d
        actual = k
      }
    }

    if (actual === endKey) break
    abiertos.delete(actual)

    for (const edge of vecinos.get(actual) ?? []) {
      const next = (dist.get(actual) ?? Infinity) + edge.cost
      if (next < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, next)
        prev.set(edge.to, actual)
        abiertos.add(edge.to)
      }
    }
  }

  if (!dist.has(endKey)) return null

  const result: Punto[] = []
  let current = endKey
  while (current) {
    const p = puntos.get(current)
    if (p) result.push(p)
    if (current === startKey) break
    current = prev.get(current) ?? ''
  }

  return result.reverse()
}

export class MascotaEngine {
  private superficies: Map<string, Superficie> = new Map()
  private pathCache: Punto[] = []
  private mutObs: MutationObserver | null = null
  private resObs: ResizeObserver | null = null
  private onChange: () => void
  private rebuildTimer: ReturnType<typeof setTimeout> | null = null
  private idCounter = 0

  constructor(onChange: () => void) {
    this.onChange = onChange
  }

  start() {
    if (typeof window === 'undefined') return
    this.escanear()
    this.mutObs = new MutationObserver(() => this.scheduleRebuild())
    this.mutObs.observe(document.body, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['class', 'style', 'data-clicka-node'],
    })
    this.resObs = new ResizeObserver(() => this.scheduleRebuild())
    this.resObs.observe(document.body)
    window.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.onResize)
  }

  stop() {
    this.mutObs?.disconnect()
    this.resObs?.disconnect()
    window.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.onResize)
  }

  private onScroll = () => this.scheduleRebuild()
  private onResize = () => this.scheduleRebuild()

  private scheduleRebuild() {
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer)
    this.rebuildTimer = setTimeout(() => {
      this.escanear()
      this.onChange()
    }, 150)
  }

  private escanear() {
    this.superficies.clear()
    const vistos = new Set<Element>()
    const rects = new Set<string>()

    SELECTORES_AUTO.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (vistos.has(el)) return
        vistos.add(el)
        const id = `s-${this.idCounter++}`
        const sup = elToSuperficie(el, id)
        if (!sup) return
        const k = rectKey(sup)
        if (rects.has(k)) return
        rects.add(k)
        this.superficies.set(id, sup)
      })
    })

    this.buildPath()
  }

  private buildPath() {
    const allSups = Array.from(this.superficies.values())
    const sups = allSups
      .filter((s) =>
        s.top < window.scrollY + window.innerHeight + 900 &&
        s.bottom > window.scrollY - 160
      )
      .sort((a, b) => a.top - b.top || a.left - b.left)

    if (sups.length === 0) {
      this.pathCache = []
      return
    }

    const path: Punto[] = []

    for (const s of sups) {
      const corners = esquinas(s)

      if (path.length === 0) {
        path.push(...rutaPerimetroDesde(s, corners[3]))
        continue
      }

      const last = path[path.length - 1]
      let mejorRuta: Punto[] | null = null
      let mejorCosto = Infinity
      let mejorEntrada = corners[0]

      for (const entrada of corners) {
        const ruta = rutaOrtogonalLibre(last, entrada, allSups, [s.id])
        if (!ruta) continue
        const costo = ruta.reduce((sum, p, i) =>
          i === 0 ? 0 : sum + costeSegmento(ruta[i - 1], p, allSups)
        , 0)
        if (costo < mejorCosto) {
          mejorCosto = costo
          mejorRuta = ruta
          mejorEntrada = entrada
        }
      }

      if (!mejorRuta) continue

      path.push(...mejorRuta.slice(1))
      path.push(...rutaPerimetroDesde(s, mejorEntrada).slice(1))
    }

    this.pathCache = limpiarPath(path, allSups)

    ;(window as typeof window & {
      __CLICKA_MASCOTA_DEBUG__?: { path: Punto[]; superficies: Superficie[] }
    }).__CLICKA_MASCOTA_DEBUG__ = {
      path: this.pathCache,
      superficies: allSups,
    }
  }

  getPath(): Punto[] {
    return [...this.pathCache]
  }

  getPuntoEnBorde(): Punto {
    const vyMin = window.scrollY + 60
    const vyMax = window.scrollY + window.innerHeight - 60
    const vxMin = window.scrollX + 40
    const vxMax = window.scrollX + window.innerWidth - 40
    const supsVisibles = Array.from(this.superficies.values()).filter((s) =>
      s.bottom > vyMin && s.top < vyMax && s.right > vxMin && s.left < vxMax
    )
    const pool = supsVisibles.length > 0 ? supsVisibles : Array.from(this.superficies.values())
    if (pool.length === 0) return { x: window.scrollX + 200, y: window.scrollY + 200 }
    const sup = pool[Math.floor(Math.random() * pool.length)]
    const r = borde(sup)
    const lado = Math.floor(Math.random() * 4)
    const px = lado < 2 ? r.l + Math.random() * (r.r - r.l) : (lado === 2 ? r.l : r.r)
    const py = lado < 2 ? (lado === 0 ? r.t : r.b) : r.t + Math.random() * (r.b - r.t)
    return {
      x: Math.max(vxMin, Math.min(vxMax, px)),
      y: Math.max(vyMin, Math.min(vyMax, py)),
    }
  }

  getPuntoPathMasCercano(pos: Punto): number {
    const path = this.pathCache
    if (path.length === 0) return 0

    let minDist = Infinity
    let minIdx = 0

    path.forEach((p, i) => {
      const d = dist2(p, pos)
      if (d < minDist) {
        minDist = d
        minIdx = i
      }
    })

    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1]
      const b = path[i]
      const len2 = dist2(a, b)
      if (len2 === 0) continue
      const t = Math.max(0, Math.min(1, ((pos.x - a.x) * (b.x - a.x) + (pos.y - a.y) * (b.y - a.y)) / len2))
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
      const d = dist2(p, pos)
      if (d < minDist) {
        minDist = d
        minIdx = t > 0.5 ? i : i - 1
      }
    }

    return minIdx
  }

  getSuperficies(): Superficie[] {
    return Array.from(this.superficies.values())
  }
}


