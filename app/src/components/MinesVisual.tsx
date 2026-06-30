import React, { useRef, useEffect, useState, useCallback } from 'react';

/* ── Types ─────────────────────────────────────────────── */
interface TileData {
  index: number;
  revealed: boolean;
  isMine: boolean;
}

interface MinesVisualProps {
  tiles: TileData[];
  onReveal: (index: number) => void;
  loading: boolean;
  gameActive: boolean;
}

/* ── Constants ─────────────────────────────────────────── */
const TILE_SIZE = 84; // canvas internal resolution
const ANIM_DURATION = 350;

/* ── Canvas drawing helpers ────────────────────────────── */

/** Draw a faceted green gem (diamond) at (cx, cy) */
function drawGem(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const s = Math.min(cx, cy) * 0.4;

  // --- Main diamond shape (8-sided) ---
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);                      // top point
  ctx.lineTo(cx + s * 0.7, cy - s * 0.3);      // upper-right
  ctx.lineTo(cx + s * 0.9, cy + s * 0.1);      // right
  ctx.lineTo(cx + s * 0.55, cy + s * 0.8);     // lower-right
  ctx.lineTo(cx, cy + s * 0.55);               // bottom point
  ctx.lineTo(cx - s * 0.55, cy + s * 0.8);     // lower-left
  ctx.lineTo(cx - s * 0.9, cy + s * 0.1);      // left
  ctx.lineTo(cx - s * 0.7, cy - s * 0.3);      // upper-left
  ctx.closePath();

  // Gradient: top-left to bottom-right
  const grad = ctx.createLinearGradient(cx - s, cy - s, cx + s, cy + s);
  grad.addColorStop(0, '#AAFFD5');
  grad.addColorStop(0.25, '#00FF88');
  grad.addColorStop(0.65, '#00DDAA');
  grad.addColorStop(1, '#0077BB');
  ctx.fillStyle = grad;
  ctx.fill();

  // Edge highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // --- Top facet (highlight) ---
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.35, cy - s * 0.15);
  ctx.lineTo(cx, cy + s * 0.12);
  ctx.lineTo(cx - s * 0.35, cy - s * 0.15);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();

  // --- Bottom facet (shadow) ---
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.55);
  ctx.lineTo(cx + s * 0.35, cy + s * 0.35);
  ctx.lineTo(cx, cy + s * 0.15);
  ctx.lineTo(cx - s * 0.35, cy + s * 0.35);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fill();

  // --- Sparkle at top-left ---
  ctx.beginPath();
  ctx.arc(cx - s * 0.25, cy - s * 0.3, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fill();
}

/** Draw a bomb with fuse and sparks at (cx, cy) */
function drawBomb(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const r = Math.min(cx, cy) * 0.38;

  // --- Bomb body ---
  const bodyGrad = ctx.createRadialGradient(
    cx - r * 0.25, cy - r * 0.3, r * 0.05,
    cx, cy, r,
  );
  bodyGrad.addColorStop(0, '#6A6A7E');
  bodyGrad.addColorStop(0.55, '#3A3A4E');
  bodyGrad.addColorStop(1, '#1A1A2E');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Glossy highlight
  ctx.beginPath();
  ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();

  // --- Fuse base (brown cylinder) ---
  const fuseW = r * 0.18;
  const fuseH = r * 0.22;
  ctx.fillStyle = '#8B7355';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r - fuseH, fuseW, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - fuseW, cy - r - fuseH, fuseW * 2, fuseH);

  // --- Fuse cord ---
  ctx.beginPath();
  ctx.moveTo(cx + fuseW, cy - r - fuseH);
  ctx.quadraticCurveTo(cx + r * 0.55, cy - r - fuseH * 2.2, cx + r * 0.3, cy - r - fuseH * 3.2);
  ctx.strokeStyle = '#A08060';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // --- Flame at fuse tip ---
  const flameX = cx + r * 0.3;
  const flameY = cy - r - fuseH * 3.2;

  // Outer flame (orange)
  ctx.beginPath();
  ctx.moveTo(flameX, flameY + 1);
  ctx.quadraticCurveTo(flameX - 5, flameY - 7, flameX, flameY - 13);
  ctx.quadraticCurveTo(flameX + 5, flameY - 7, flameX, flameY + 1);
  ctx.fillStyle = '#FF6600';
  ctx.fill();

  // Inner flame (yellow)
  ctx.beginPath();
  ctx.moveTo(flameX, flameY + 1);
  ctx.quadraticCurveTo(flameX - 3, flameY - 4, flameX, flameY - 9);
  ctx.quadraticCurveTo(flameX + 3, flameY - 4, flameX, flameY + 1);
  ctx.fillStyle = '#FFDD00';
  ctx.fill();

  // --- Sparks ---
  const sparkPositions: Array<[number, number]> = [
    [flameX - 5, flameY - 2],
    [flameX + 4, flameY - 4],
    [flameX - 2, flameY - 11],
    [flameX + 2, flameY - 15],
    [flameX - 4, flameY - 8],
  ];
  for (const [sx, sy] of sparkPositions) {
    ctx.beginPath();
    ctx.arc(sx, sy, 1.3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFAA00';
    ctx.fill();
  }

  // --- Hazard/crackle lines ---
  ctx.strokeStyle = 'rgba(255, 51, 102, 0.35)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  const spikeAngles = [
    0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4,
    Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4,
  ];
  for (const angle of spikeAngles) {
    const x1 = cx + Math.cos(angle) * (r + 2);
    const y1 = cy + Math.sin(angle) * (r + 2);
    const x2 = cx + Math.cos(angle) * (r + 7);
    const y2 = cy + Math.sin(angle) * (r + 7);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

/** Draw an unrevealed tile (dark background + subtle grid lines) */
function drawUnrevealed(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isHovered: boolean,
  canInteract: boolean,
) {
  // Background
  ctx.fillStyle = '#101018';
  ctx.fillRect(0, 0, w, h);

  // Border
  ctx.strokeStyle = '#1E1E30';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  // Hover glow (crimson)
  if (isHovered && canInteract) {
    ctx.save();
    ctx.shadowColor = '#dc143c';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#dc143c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
    ctx.restore();

    // Faint inner glow fill
    ctx.fillStyle = 'rgba(220, 20, 60, 0.04)';
    ctx.fillRect(2, 2, w - 4, h - 4);
  }

  // Subtle ? mark
  ctx.fillStyle = '#3A3A5C';
  ctx.font = 'bold 22px "JetBrains Mono", "Space Grotesk", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', w / 2, h / 2 + 1);
}

/** Draw a revealed safe tile (green border + gem) */
function drawSafe(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0A1A10';
  ctx.fillRect(0, 0, w, h);

  // Green border with glow
  ctx.save();
  ctx.shadowColor = '#00FF88';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#00FF88';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  ctx.restore();

  // Gem
  drawGem(ctx, w / 2, h / 2);
}

/** Draw a revealed mine tile (red border + bomb) */
function drawMine(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#1A0A10';
  ctx.fillRect(0, 0, w, h);

  // Red border with glow
  ctx.save();
  ctx.shadowColor = '#FF3366';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#FF3366';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  ctx.restore();

  // Bomb
  drawBomb(ctx, w / 2, h / 2);
}

/** Master render function for a single tile canvas */
function renderTile(
  ctx: CanvasRenderingContext2D,
  tile: TileData,
  isHovered: boolean,
  loading: boolean,
  gameActive: boolean,
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const canInteract = !loading && gameActive && !tile.revealed;

  ctx.clearRect(0, 0, w, h);

  if (!tile.revealed) {
    drawUnrevealed(ctx, w, h, isHovered, canInteract);
  } else if (tile.isMine) {
    drawMine(ctx, w, h);
  } else {
    drawSafe(ctx, w, h);
  }
}

/* ── Component ─────────────────────────────────────────── */

const MinesVisual: React.FC<MinesVisualProps> = ({
  tiles,
  onReveal,
  loading,
  gameActive,
}) => {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animatingIndices, setAnimatingIndices] = useState<Set<number>>(new Set());
  const prevRevealedRef = useRef<Set<number>>(new Set());

  // Detect newly-revealed tiles and trigger flip animation
  useEffect(() => {
    const currentRevealed = new Set(
      tiles.filter((t) => t.revealed).map((t) => t.index),
    );
    const newlyRevealed: number[] = [];
    currentRevealed.forEach((i) => {
      if (!prevRevealedRef.current.has(i)) newlyRevealed.push(i);
    });

    if (newlyRevealed.length > 0) {
      const idxSet = new Set(newlyRevealed);
      setAnimatingIndices((prev) => new Set([...prev, ...idxSet]));
      const timer = setTimeout(() => {
        setAnimatingIndices((prev) => {
          const next = new Set(prev);
          idxSet.forEach((i) => next.delete(i));
          return next;
        });
      }, ANIM_DURATION);
      prevRevealedRef.current = currentRevealed;
      return () => clearTimeout(timer);
    }

    prevRevealedRef.current = currentRevealed;
  }, [tiles]);

  // Redraw canvases whenever state changes
  useEffect(() => {
    for (const tile of tiles) {
      const canvas = canvasRefs.current[tile.index];
      if (!canvas) continue;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      renderTile(ctx, tile, tile.index === hoveredIndex, loading, gameActive);
    }
  }, [tiles, hoveredIndex, loading, gameActive]);

  const handleClick = useCallback(
    (index: number) => {
      if (!loading && gameActive && tiles[index] && !tiles[index]!.revealed) {
        onReveal(index);
      }
    },
    [loading, gameActive, tiles, onReveal],
  );

  return (
    <div style={{ width: 440, maxWidth: '100%', margin: '0 auto' }}>
      <style>{`
        .mines-canvas-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }
        .mines-canvas-tile {
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }
        .mines-canvas-tile canvas {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }
        @keyframes mines-flip {
          0%   { transform: scaleY(1); }
          45%  { transform: scaleY(0.08); }
          55%  { transform: scaleY(0.08); }
          100% { transform: scaleY(1); }
        }
        .mines-canvas-tile.animating {
          animation: mines-flip ${ANIM_DURATION}ms ease-in-out;
        }
      `}</style>

      <div className="mines-canvas-grid">
        {tiles.map((tile) => {
          const isAnimating = animatingIndices.has(tile.index);
          const canInteract = !loading && gameActive && !tile.revealed;

          return (
            <div
              key={tile.index}
              className={`mines-canvas-tile${isAnimating ? ' animating' : ''}`}
              onClick={() => handleClick(tile.index)}
              onMouseEnter={() => setHoveredIndex(tile.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: canInteract ? 'pointer' : 'default' }}
            >
              <canvas
                ref={(el) => {
                  canvasRefs.current[tile.index] = el;
                }}
                width={TILE_SIZE}
                height={TILE_SIZE}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MinesVisual;
