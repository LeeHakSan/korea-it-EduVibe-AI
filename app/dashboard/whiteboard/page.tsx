"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Pencil, Eraser, Square, Circle, Minus, Type, Trash2,
  Download, Undo2, Redo2, ChevronDown, Palette,
} from "lucide-react"

// ────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────
type Tool = "pen" | "eraser" | "line" | "rect" | "ellipse" | "text"

interface Point { x: number; y: number }

interface DrawElement {
  id: string
  tool: Tool
  color: string
  width: number
  points: Point[]
  text?: string
  x?: number
  y?: number
}

// ────────────────────────────────────────────────
// 상수
// ────────────────────────────────────────────────
const COLORS = [
  "#3c3c3c", "#ff4b4b", "#ff9600", "#ffc800",
  "#58cc02", "#1cb0f6", "#9b59b6", "#ffffff",
]

const STROKE_SIZES = [2, 4, 8, 16]

const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: "pen",     icon: <Pencil   className="w-4 h-4" />, label: "펜" },
  { id: "eraser",  icon: <Eraser   className="w-4 h-4" />, label: "지우개" },
  { id: "line",    icon: <Minus    className="w-4 h-4" />, label: "선" },
  { id: "rect",    icon: <Square   className="w-4 h-4" />, label: "사각형" },
  { id: "ellipse", icon: <Circle   className="w-4 h-4" />, label: "타원" },
  { id: "text",    icon: <Type     className="w-4 h-4" />, label: "텍스트" },
]

// ────────────────────────────────────────────────
// 그리기 헬퍼
// ────────────────────────────────────────────────
function drawElement(ctx: CanvasRenderingContext2D, el: DrawElement, preview = false) {
  ctx.save()
  ctx.strokeStyle = el.tool === "eraser" ? "#ffffff" : el.color
  ctx.fillStyle   = el.color
  ctx.lineWidth   = el.width
  ctx.lineCap     = "round"
  ctx.lineJoin    = "round"
  if (preview) ctx.globalAlpha = 0.7

  const pts = el.points
  if (!pts.length) { ctx.restore(); return }

  switch (el.tool) {
    case "pen":
    case "eraser":
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      pts.forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.stroke()
      break

    case "line":
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
      ctx.stroke()
      break

    case "rect": {
      const x = Math.min(pts[0].x, pts[pts.length - 1].x)
      const y = Math.min(pts[0].y, pts[pts.length - 1].y)
      const w = Math.abs(pts[pts.length - 1].x - pts[0].x)
      const h = Math.abs(pts[pts.length - 1].y - pts[0].y)
      ctx.strokeRect(x, y, w, h)
      break
    }

    case "ellipse": {
      const cx = (pts[0].x + pts[pts.length - 1].x) / 2
      const cy = (pts[0].y + pts[pts.length - 1].y) / 2
      const rx = Math.abs(pts[pts.length - 1].x - pts[0].x) / 2
      const ry = Math.abs(pts[pts.length - 1].y - pts[0].y) / 2
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    }

    case "text":
      if (el.text) {
        ctx.font = `${el.width * 6 + 12}px Inter, sans-serif`
        ctx.fillText(el.text, pts[0].x, pts[0].y)
      }
      break
  }

  ctx.restore()
}

function redrawAll(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, elements: DrawElement[]) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // 흰 배경
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  elements.forEach((el) => drawElement(ctx, el))
}

// ────────────────────────────────────────────────
// 메인 컴포넌트
// ────────────────────────────────────────────────
export default function WhiteboardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  const [tool,       setTool]       = useState<Tool>("pen")
  const [color,      setColor]      = useState("#3c3c3c")
  const [strokeSize, setStrokeSize] = useState(4)
  const [showPalette,setShowPalette]= useState(false)

  const [elements, setElements] = useState<DrawElement[]>([])
  const [history,  setHistory]  = useState<DrawElement[][]>([[]])
  const [histIdx,  setHistIdx]  = useState(0)

  const drawing = useRef(false)
  const current = useRef<DrawElement | null>(null)

  // 텍스트 입력
  const [textInput,  setTextInput]  = useState("")
  const [textPos,    setTextPos]    = useState<Point | null>(null)
  const textInputRef = useRef<HTMLInputElement>(null)

  // ── 캔버스 크기 동기화
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap   = wrapRef.current
    if (!canvas || !wrap) return
    const resize = () => {
      canvas.width  = wrap.clientWidth
      canvas.height = wrap.clientHeight
      const ctx = canvas.getContext("2d")!
      redrawAll(ctx, canvas, elements)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── elements 바뀔 때 다시 그리기
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    redrawAll(ctx, canvas, elements)
  }, [elements])

  // ── 히스토리 저장
  const saveHistory = useCallback((els: DrawElement[]) => {
    setHistory((h) => {
      const trimmed = h.slice(0, histIdx + 1)
      return [...trimmed, els]
    })
    setHistIdx((i) => i + 1)
  }, [histIdx])

  const undo = useCallback(() => {
    if (histIdx <= 0) return
    const prev = history[histIdx - 1]
    setElements(prev)
    setHistIdx((i) => i - 1)
  }, [history, histIdx])

  const redo = useCallback(() => {
    if (histIdx >= history.length - 1) return
    const next = history[histIdx + 1]
    setElements(next)
    setHistIdx((i) => i + 1)
  }, [history, histIdx])

  // ── 좌표 변환
  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!
    const rect   = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  // ── 텍스트 확정
  const commitText = useCallback(() => {
    if (!textPos || !textInput.trim()) { setTextPos(null); setTextInput(""); return }
    const el: DrawElement = {
      id:     crypto.randomUUID(),
      tool:   "text",
      color,
      width:  strokeSize,
      points: [textPos],
      text:   textInput,
    }
    const next = [...elements, el]
    setElements(next)
    saveHistory(next)
    setTextPos(null)
    setTextInput("")
  }, [textPos, textInput, color, strokeSize, elements, saveHistory])

  // ── 마우스/터치 이벤트
  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === "text") {
      // 텍스트 모드: 클릭 위치에 입력창 팝
      if (textPos) commitText()
      setTextPos(getPos(e))
      setTimeout(() => textInputRef.current?.focus(), 50)
      return
    }
    drawing.current = true
    const pos = getPos(e)
    current.current = {
      id:     crypto.randomUUID(),
      tool,
      color:  tool === "eraser" ? "#ffffff" : color,
      width:  tool === "eraser" ? strokeSize * 4 : strokeSize,
      points: [pos],
    }
  }

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || !current.current) return
    const pos = getPos(e)
    current.current.points.push(pos)

    // 프리뷰 렌더
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext("2d")!
    redrawAll(ctx, canvas, elements)
    drawElement(ctx, current.current, true)
  }

  const onUp = () => {
    if (!drawing.current || !current.current) return
    drawing.current = false
    const next = [...elements, current.current]
    setElements(next)
    saveHistory(next)
    current.current = null
  }

  // ── 전체 지우기
  const clearAll = () => {
    const next: DrawElement[] = []
    setElements(next)
    saveHistory(next)
  }

  // ── 이미지로 저장
  const saveImage = () => {
    const canvas = canvasRef.current!
    const link   = document.createElement("a")
    link.download = `whiteboard-${Date.now()}.png`
    link.href     = canvas.toDataURL()
    link.click()
  }

  // ── 단축키
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); redo() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-0px)] overflow-hidden bg-[#f7f7f7]">

      {/* ── 상단 툴바 */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b-2 border-[#e5e5e5] flex-wrap">

        {/* 도구 선택 */}
        <div className="flex items-center gap-1 bg-[#f7f7f7] rounded-2xl p-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.label}
              onClick={() => { setTool(t.id); if (textPos) commitText() }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                tool === t.id
                  ? "bg-[#1cb0f6] text-white shadow-sm"
                  : "text-[#777] hover:bg-white hover:text-[#3c3c3c]"
              }`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* 구분선 */}
        <div className="w-px h-8 bg-[#e5e5e5]" />

        {/* 색상 팔레트 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPalette(!showPalette)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#f7f7f7] rounded-xl hover:bg-white transition-all"
          >
            <div className="w-5 h-5 rounded-full border-2 border-[#e5e5e5]" style={{ background: color }} />
            <Palette className="w-3.5 h-3.5 text-[#afafaf]" />
            <ChevronDown className="w-3 h-3 text-[#afafaf]" />
          </button>
          {showPalette && (
            <div className="absolute top-11 left-0 z-50 bg-white border-2 border-[#e5e5e5] rounded-2xl p-3 shadow-lg">
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setColor(c); setShowPalette(false) }}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      color === c ? "border-[#1cb0f6] scale-110" : "border-[#e5e5e5]"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 선 굵기 */}
        <div className="flex items-center gap-1 bg-[#f7f7f7] rounded-2xl p-1">
          {STROKE_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStrokeSize(s)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                strokeSize === s ? "bg-[#1cb0f6] shadow-sm" : "hover:bg-white"
              }`}
            >
              <div
                className="rounded-full bg-current"
                style={{
                  width: s + 4, height: s + 4,
                  background: strokeSize === s ? "white" : "#3c3c3c",
                }}
              />
            </button>
          ))}
        </div>

        {/* 구분선 */}
        <div className="w-px h-8 bg-[#e5e5e5]" />

        {/* 실행취소 / 재실행 */}
        <button
          type="button"
          title="실행취소 (Ctrl+Z)"
          onClick={undo}
          disabled={histIdx <= 0}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#777] hover:bg-[#f7f7f7] disabled:opacity-40 transition-all"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="다시실행 (Ctrl+Y)"
          onClick={redo}
          disabled={histIdx >= history.length - 1}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#777] hover:bg-[#f7f7f7] disabled:opacity-40 transition-all"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* 구분선 */}
        <div className="w-px h-8 bg-[#e5e5e5]" />

        {/* 전체 지우기 / 저장 */}
        <button
          type="button"
          title="전체 지우기"
          onClick={clearAll}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#ff4b4b] hover:bg-[#fff0f0] transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="이미지로 저장"
          onClick={saveImage}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#58cc02] text-white font-bold rounded-xl border-b-2 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all text-sm"
        >
          <Download className="w-4 h-4" />
          저장
        </button>
      </div>

      {/* ── 캔버스 영역 */}
      <div
        ref={wrapRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        style={{ cursor: tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair" }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
          className="absolute inset-0 touch-none"
          style={{ background: "white" }}
        />

        {/* 텍스트 입력 오버레이 */}
        {textPos && (
          <div
            className="absolute z-20 flex items-center"
            style={{ left: textPos.x, top: textPos.y - 20 }}
          >
            <input
              ref={textInputRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitText()
                if (e.key === "Escape") { setTextPos(null); setTextInput("") }
              }}
              placeholder="텍스트 입력 후 Enter"
              className="px-2 py-1 border-2 border-[#1cb0f6] rounded-lg outline-none bg-white/90 text-[#3c3c3c] font-semibold text-sm shadow-lg min-w-[160px]"
              style={{ fontSize: strokeSize * 6 + 12 }}
            />
          </div>
        )}

        {/* 안내 오버레이 (요소 없을 때) */}
        {elements.length === 0 && !drawing.current && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f7f7f7] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Pencil className="w-8 h-8 text-[#e5e5e5]" />
              </div>
              <p className="text-[#afafaf] font-bold text-sm">여기에 자유롭게 그려보세요!</p>
              <p className="text-[#afafaf] text-xs font-semibold mt-1">도구를 선택하고 클릭·드래그로 그리기</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
