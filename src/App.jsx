import { useState } from "react"
import Fretboard from "./Fretboard"
import ChordLibrary from "./chordlibrary"

export default function App() {
  const [view, setView] = useState("fretboard")
  return (
    <div>
      <div style={{ display:"flex", gap:"10px", padding:"12px", background:"#0a0a0a", borderBottom:"1px solid #222" }}>
        <button
          onClick={() => setView("fretboard")}
          style={{ background: view === "fretboard" ? "#f2c018" : "transparent", color: view === "fretboard" ? "#000" : "#f2c018", border:"1px solid #f2c018", padding:"8px 16px", cursor:"pointer", fontFamily:"'Courier New', monospace", letterSpacing:"2px", fontSize:"11px" }}>
          FRETBOARD
        </button>
        <button
          onClick={() => setView("chords")}
          style={{ background: view === "chords" ? "#f2c018" : "transparent", color: view === "chords" ? "#000" : "#f2c018", border:"1px solid #f2c018", padding:"8px 16px", cursor:"pointer", fontFamily:"'Courier New', monospace", letterSpacing:"2px", fontSize:"11px" }}>
          CHORD LIBRARY
        </button>
      </div>
      {view === "fretboard" ? <Fretboard /> : <ChordLibrary />}
    </div>
  )
}