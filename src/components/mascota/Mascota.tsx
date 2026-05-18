'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MascotaEngine } from './MascotaEngine';
import type { Punto } from './MascotaEngine';

type Estado = 'patrullando' | 'cazando' | 'atacando' | 'celebrando' | 'idle';

interface Kaiju {
  id: string;
  pos: Punto;
  vivo: boolean;
  fase: 'portal' | 'vivo' | 'muriendo' | 'portal-abre';
}

function dist(a: Punto, b: Punto) {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function moverHaciaOrtogonal(actual: Punto, destino: Punto, speed: number): Punto {
  const dx = destino.x - actual.x;
  const dy = destino.y - actual.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: actual.x + Math.min(Math.abs(dx), speed) * Math.sign(dx), y: actual.y };
  } else {
    return { x: actual.x, y: actual.y + Math.min(Math.abs(dy), speed) * Math.sign(dy) };
  }
}

function ClickSVG({ estado, frame }: { estado: Estado; frame: number }) {
  const blink = frame % 180 < 6;
  const walk = Math.sin(frame * 0.18) * 2;
  const bodyColor =
    estado === 'atacando'   ? '#f87171' :
    estado === 'celebrando' ? '#34d399' :
    estado === 'cazando'    ? '#fbbf24' : '#a78bfa';
  const glow =
    estado === 'atacando'   ? 'drop-shadow(0 0 5px #ef4444)' :
    estado === 'celebrando' ? 'drop-shadow(0 0 5px #10b981)' :
    estado === 'cazando'    ? 'drop-shadow(0 0 4px #f59e0b)' :
    'drop-shadow(0 0 3px #7c3aed88)';

  return (
    <svg viewBox="0 0 40 48" style={{ width: '100%', height: '100%', filter: glow, overflow: 'visible' }}>
      <ellipse cx="20" cy={28 + walk * 0.3} rx="10" ry="9" fill={bodyColor} />
      <ellipse cx="17" cy={25 + walk * 0.3} rx="5" ry="4" fill="white" opacity="0.2" />
      <rect x="14" y={35 + walk * 0.3} width="4" height="6" rx="2"
        fill={bodyColor} transform={`rotate(${walk * 3}, 16, 35)`} />
      <rect x="22" y={35 - walk * 0.3} width="4" height="6" rx="2"
        fill={bodyColor} transform={`rotate(${-walk * 3}, 24, 35)`} />
      {estado === 'atacando' ? (
        <>
          <line x1="10" y1="27" x2="2"  y2="18" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="30" y1="27" x2="40" y2="20" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="30" y1="27" x2="44" y2="14" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="38" y1="17" x2="42" y2="21" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="10" y1="27" x2={6  + walk} y2={32 - walk} stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="30" y1="27" x2={34 - walk} y2={32 + walk} stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      <ellipse cx="20" cy="16" rx="12" ry="11" fill={bodyColor} />
      <ellipse cx="17" cy="13" rx="6"  ry="5"  fill="white" opacity="0.2" />
      <ellipse cx="9"  cy="11" rx="3.5" ry="4.5" fill={bodyColor} />
      <ellipse cx="31" cy="11" rx="3.5" ry="4.5" fill={bodyColor} />
      <ellipse cx="9"  cy="11" rx="1.5" ry="2.5" fill="#fda4ff" />
      <ellipse cx="31" cy="11" rx="1.5" ry="2.5" fill="#fda4ff" />
      <path d="M8 10 Q10 4 20 5 Q30 4 32 10" fill="#4c1d95" />
      <path d="M8 10 Q7 7 9 5"  fill="#4c1d95" />
      <path d="M32 10 Q33 7 31 5" fill="#4c1d95" />
      {blink ? (
        <>
          <path d="M13 16 Q16 14 17 16" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M23 16 Q26 14 27 16" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="15" cy="17" rx="3"   ry="3.5" fill="#1e1b4b" />
          <ellipse cx="25" cy="17" rx="3"   ry="3.5" fill="#1e1b4b" />
          <circle  cx="14" cy="15.5" r="1"  fill="white" />
          <circle  cx="24" cy="15.5" r="1"  fill="white" />
          <ellipse cx="15" cy="17.5" rx="1.5" ry="2" fill={bodyColor} opacity="0.6" />
          <ellipse cx="25" cy="17.5" rx="1.5" ry="2" fill={bodyColor} opacity="0.6" />
        </>
      )}
      {estado === 'celebrando' ? (
        <path d="M16 22 Q20 26 24 22" stroke="#1e1b4b" strokeWidth="1.5" fill="#fda4ff" strokeLinecap="round" />
      ) : estado === 'atacando' ? (
        <path d="M15 22 Q20 25 25 22" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M17 22 Q20 24 23 22" stroke="#1e1b4b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      )}
      <path d={`M20 37 Q${10 + walk * 2} ${44 + walk} 8 42`}
        stroke={bodyColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      {(estado === 'cazando' || estado === 'patrullando') && (
        <>
          <line x1="-2" y1="28" x2="-10" y2="28" stroke={bodyColor} strokeWidth="2"   opacity="0.2"  strokeLinecap="round" />
          <line x1="-2" y1="32" x2="-8"  y2="32" stroke={bodyColor} strokeWidth="1.5" opacity="0.12" strokeLinecap="round" />
        </>
      )}
      {estado === 'celebrando' && (
        <>
          <circle cx="6"  cy="6" r="2.5" fill="#fbbf24" opacity="0.9" />
          <circle cx="34" cy="6" r="2"   fill="#34d399" opacity="0.9" />
          <circle cx="20" cy="2" r="3"   fill="#f472b6" opacity="0.9" />
          <circle cx="10" cy="2" r="1.5" fill="#a78bfa" opacity="0.8" />
          <circle cx="30" cy="2" r="1.5" fill="#60a5fa" opacity="0.8" />
        </>
      )}
    </svg>
  );
}

function KaijuSVG({ fase }: { fase: Kaiju['fase'] }) {
  const color = fase === 'muriendo' ? '#ff6600' : '#dc2626';
  return (
    <svg viewBox="0 0 40 44" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <ellipse cx="20" cy="26" rx="12" ry="10" fill={color} opacity="0.95" />
      <ellipse cx="20" cy="14" rx="11" ry="10" fill={color} />
      <polygon points="11,8 8,0 14,6"  fill="#7f1d1d" />
      <polygon points="29,8 32,0 26,6" fill="#7f1d1d" />
      <polygon points="20,6 18,0 22,0" fill="#7f1d1d" />
      <ellipse cx="15" cy="14" rx="3.5" ry="3"   fill="#fef08a" />
      <ellipse cx="25" cy="14" rx="3.5" ry="3"   fill="#fef08a" />
      <ellipse cx="15" cy="14" rx="2"   ry="2.2" fill="#000" />
      <ellipse cx="25" cy="14" rx="2"   ry="2.2" fill="#000" />
      <circle  cx="14" cy="13" r="0.8" fill="white" />
      <circle  cx="24" cy="13" r="0.8" fill="white" />
      <path d="M13 20 L15 23 L18 21 L20 24 L22 21 L25 23 L27 20"
        stroke="#7f1d1d" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="33" width="5" height="7" rx="2.5" fill={color} />
      <rect x="25" y="33" width="5" height="7" rx="2.5" fill={color} />
      <path d="M20 36 Q28 40 32 38" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="8"  y1="24" x2="3"  y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="8"  y1="27" x2="2"  y2="27" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="24" x2="37" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="27" x2="38" y2="27" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {(fase === 'portal' || fase === 'portal-abre') && (
        <circle cx="20" cy="20" r="22" fill="none"
          stroke="#dc2626" strokeWidth="2" opacity="0.4" strokeDasharray="5 3" />
      )}
    </svg>
  );
}

export default function Mascota() {
  const [pos,         setPos]     = useState<Punto>({ x: -100, y: -100 });
  const [miraDerecha, setMira]    = useState(true);
  const [estado,      setEstado]  = useState<Estado>('idle');
  const [scrollY,     setScrollY] = useState(0);
  const [kaijus,      setKaijus]  = useState<Kaiju[]>([]);
  const [frame,       setFrame]   = useState(0);
  const [mounted,     setMounted] = useState(false);

  const engineRef    = useRef<MascotaEngine | null>(null);
  const pathRef      = useRef<Punto[]>([]);
  const pathIndexRef = useRef(0);
  const posRef       = useRef<Punto>({ x: -100, y: -100 });
  const animRef      = useRef(0);
  const estadoRef    = useRef<Estado>('idle');
  const kaijusRef    = useRef<Kaiju[]>([]);

  const setKaijusSafe = useCallback((fn: (prev: Kaiju[]) => Kaiju[]) => {
    setKaijus(prev => {
      const next = fn(prev);
      kaijusRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const engine = new MascotaEngine(() => {
      const p = engine.getPath();
      pathRef.current = p;
      if (pathIndexRef.current >= p.length) pathIndexRef.current = 0;
    });
    engineRef.current = engine;
    engine.start();

    setTimeout(() => {
      const p = engine.getPath();
      pathRef.current = p;
      if (p.length > 0) {
        posRef.current = p[0];
        setPos(p[0]);
        pathIndexRef.current = p.length > 1 ? 1 : 0;
        estadoRef.current = 'patrullando';
        setEstado('patrullando');
      }
    }, 1000);

    return () => engine.stop();
  }, []);

  const matarKaiju = useCallback((id: string) => {
    setKaijusSafe(p => p.map(k => k.id === id ? { ...k, fase: 'muriendo', vivo: false } : k));
    setTimeout(() => {
      setKaijusSafe(p => p.map(k => k.id === id ? { ...k, fase: 'portal-abre' } : k));
    }, 500);
    setTimeout(() => {
      setKaijusSafe(p => p.filter(k => k.id !== id));
      estadoRef.current = 'celebrando';
      setEstado('celebrando');
      setTimeout(() => {
        estadoRef.current = 'patrullando';
        setEstado('patrullando');
      }, 900);
    }, 1800);
  }, [setKaijusSafe]);

  useEffect(() => {
    const spawn = () => {
      setKaijusSafe(prev => {
        if (prev.filter(k => k.vivo).length >= 3) return prev;
        const engine = engineRef.current;
        const spawnPos = engine ? engine.getPuntoEnBorde() : { x: 200, y: 200 };
        const nuevo: Kaiju = {
          id: Math.random().toString(36).slice(2),
          pos: spawnPos,
          vivo: false,
          fase: 'portal',
        };
        setTimeout(() => {
          setKaijusSafe(p => p.map(k => k.id === nuevo.id ? { ...k, fase: 'vivo', vivo: true } : k));
        }, 1200);
        return [...prev, nuevo];
      });
    };

    const t  = setTimeout(spawn, 2500);
    const iv = setInterval(spawn, 9000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [setKaijusSafe]);

  useEffect(() => {
    const SPEED_PATROL = 1.2;
    const SPEED_HUNT   = 2.4;
    const RANGO        = 28;
    const UMBRAL       = 3;

    const loop = () => {
      setFrame(f => f + 1);

      const st = estadoRef.current;
      if (st === 'atacando' || st === 'celebrando' || st === 'idle') {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      const actual = posRef.current;
      const vivos  = kaijusRef.current.filter(k => k.vivo);
      const engine = engineRef.current;

      if (vivos.length > 0) {
        // Kaiju más cercano
        const masC = vivos.reduce((p, c) => dist(actual, c.pos) < dist(actual, p.pos) ? c : p);
        const d    = dist(actual, masC.pos);

        // Rango de ataque
        if (d < RANGO) {
          estadoRef.current = 'atacando';
          setEstado('atacando');
          setTimeout(() => matarKaiju(masC.id), 350);
          animRef.current = requestAnimationFrame(loop);
          return;
        }

        // Modo caza: navegar por el path hacia el punto más cercano al kaiju
        estadoRef.current = 'cazando';
        setEstado('cazando');

        const path = pathRef.current;
        if (path.length > 0 && engine) {
          const idxKaiju  = engine.getPuntoPathMasCercano(masC.pos);
          const idxActual = pathIndexRef.current;
          const destino   = path[idxActual];
          const dDestino  = dist(actual, destino);

          if (dDestino < UMBRAL) {
            // Llegó al waypoint — snap y avanzar en dirección al kaiju
            posRef.current = destino;
            setPos(destino);

            if (idxActual !== idxKaiju) {
              const len  = path.length;
              const fwd  = (idxKaiju - idxActual + len) % len;
              const bwd  = (idxActual - idxKaiju + len) % len;
              const paso = fwd <= bwd ? 1 : -1;
              pathIndexRef.current = (idxActual + paso + len) % len;
            }
          } else {
            // Moverse hacia el waypoint actual (ortogonal, sin diagonal)
            const siguiente = moverHaciaOrtogonal(actual, destino, SPEED_HUNT);
            setMira(siguiente.x > actual.x || (siguiente.x === actual.x && masC.pos.x > actual.x));
            posRef.current = siguiente;
            setPos(siguiente);
          }
        }

      } else {
        // Modo patrulla: recorrer el path completo en orden
        if (estadoRef.current !== 'patrullando') {
          estadoRef.current = 'patrullando';
          setEstado('patrullando');
        }

        const path = pathRef.current;
        if (path.length === 0) {
          animRef.current = requestAnimationFrame(loop);
          return;
        }

        const destino  = path[pathIndexRef.current];
        const dDestino = dist(actual, destino);

        if (dDestino < UMBRAL) {
          posRef.current = destino;
          setPos(destino);
          pathIndexRef.current = (pathIndexRef.current + 1) % path.length;
        } else {
          const siguiente = moverHaciaOrtogonal(actual, destino, SPEED_PATROL);
          setMira(siguiente.x > actual.x);
          posRef.current = siguiente;
          setPos(siguiente);
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [matarKaiju]);

  if (!mounted || typeof window === 'undefined') return null;

  const fixedLeft = pos.x - window.scrollX - 20;
  const fixedTop  = pos.y - scrollY - 24;

  const estilosKaiju: Record<Kaiju['fase'], React.CSSProperties> = {
    portal:        { transform: 'scale(0.1)', opacity: 0.5, transition: 'transform 1.2s cubic-bezier(.34,1.56,.64,1), opacity 1.2s' },
    vivo:          { transform: 'scale(1)',   opacity: 1,   filter: 'drop-shadow(0 0 5px #dc2626)', transition: 'none' },
    muriendo:      { transform: 'scale(2)',   opacity: 0,   filter: 'drop-shadow(0 0 20px #ff6600) brightness(3)', transition: 'transform 0.5s ease-out, opacity 0.5s' },
    'portal-abre': { transform: 'scale(0)',   opacity: 0,   filter: 'drop-shadow(0 0 12px #a855f7)', transition: 'transform 1.3s ease-in, opacity 1.3s' },
  };

  return (
    <>
      {kaijus.map(k => (
        <div key={k.id} style={{
          position:      'fixed',
          left:          k.pos.x - window.scrollX - 20,
          top:           k.pos.y - scrollY - 22,
          width:         44,
          height:        48,
          zIndex:        9998,
          pointerEvents: 'none',
          userSelect:    'none',
          ...estilosKaiju[k.fase],
        }}>
          <KaijuSVG fase={k.fase} />
        </div>
      ))}

      <div style={{
        position:      'fixed',
        left:          fixedLeft,
        top:           fixedTop,
        width:         40,
        height:        48,
        zIndex:        9999,
        pointerEvents: 'none',
        transform:     `scaleX(${miraDerecha ? 1 : -1})`,
        userSelect:    'none',
        willChange:    'left, top',
      }}>
        <ClickSVG estado={estado} frame={frame} />
      </div>
    </>
  );
}
