import { useState, useMemo } from "react";

const NOTES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTES_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const IVLS = ['1','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','7'];
const TUNING = [4,11,7,2,9,4];
const STR_NAMES = ['e','B','G','D','A','E'];
const STR_THICK = [0.9,1.0,1.3,1.7,2.1,2.7];
const FRET_DOTS = new Set([3,5,7,9,12,15,17,19,21,24]);
const DBL_DOTS  = new Set([12,24]);

const SCALES = {
  'Major / Ionian'      :[0,2,4,5,7,9,11],
  'Dorian'              :[0,2,3,5,7,9,10],
  'Phrygian'            :[0,1,3,5,7,8,10],
  'Lydian'              :[0,2,4,6,7,9,11],
  'Mixolydian'          :[0,2,4,5,7,9,10],
  'Aeolian / Nat. Minor':[0,2,3,5,7,8,10],
  'Locrian'             :[0,1,3,5,6,8,10],
  'Harmonic Minor'      :[0,2,3,5,7,8,11],
  'Melodic Minor'       :[0,2,3,5,7,9,11],
  'Major Pentatonic'    :[0,2,4,7,9],
  'Minor Pentatonic'    :[0,3,5,7,10],
  'Blues'               :[0,3,5,6,7,10],
  'Major Blues'         :[0,2,3,4,7,9],
  'Whole Tone'          :[0,2,4,6,8,10],
  'Diminished HW'       :[0,1,3,4,6,7,9,10],
  'Diminished WH'       :[0,2,3,5,6,8,9,11],
  'Augmented'           :[0,3,4,7,8,11],
  'Chromatic'           :[0,1,2,3,4,5,6,7,8,9,10,11],
  'Phrygian Dominant'   :[0,1,4,5,7,8,10],
  'Lydian Dominant'     :[0,2,4,6,7,9,10],
  'Hungarian Minor'     :[0,2,3,6,7,8,11],
  'Double Harmonic'     :[0,1,4,5,7,8,11],
  'Neapolitan Minor'    :[0,1,3,5,7,8,11],
  'Neapolitan Major'    :[0,1,3,5,7,9,11],
  'Super Locrian'       :[0,1,3,4,6,8,10],
  'Tritone Scale'       :[0,1,4,6,7,10],
};

const SCALE_GROUPS = {
  'Modes'              :['Major / Ionian','Dorian','Phrygian','Lydian','Mixolydian','Aeolian / Nat. Minor','Locrian'],
  'Minor Scales'       :['Harmonic Minor','Melodic Minor'],
  'Pentatonic & Blues' :['Major Pentatonic','Minor Pentatonic','Blues','Major Blues'],
  'Symmetric'          :['Whole Tone','Diminished HW','Diminished WH','Augmented','Chromatic'],
  'Exotic'             :['Phrygian Dominant','Lydian Dominant','Hungarian Minor','Double Harmonic','Neapolitan Minor','Neapolitan Major','Super Locrian','Tritone Scale'],
};

const THEMES = {
  'Dark Wood':{
    bg:'#140b04', boardBg:'#2a1508',
    fretColor:'#b89025', fretGlow:'rgba(184,144,37,0.4)',
    stringColor:'#c8a850', inlayColor:'rgba(220,175,55,0.28)', nutColor:'#f2dea0',
    rootNote:'#f2c018', rootText:'#140b04',
    intervalNote:'#c86030', intervalText:'#fff8ee',
    dualA:'#50aaff', dualAText:'#001828',
    dualB:'#ff60a8', dualBText:'#280010',
    shared:'#78ff58', sharedText:'#001a00',
    panelBg:'rgba(20,11,4,0.96)', text:'#f0dfa0', accent:'#f2c018', muted:'#7a6030',
    border:'rgba(184,144,37,0.2)', boardBorder:'#9a7a18',
  },
  'Neon Noir':{
    bg:'#040412', boardBg:'#07071c',
    fretColor:'#141460', fretGlow:'rgba(60,60,220,0.35)',
    stringColor:'#282888', inlayColor:'rgba(160,0,255,0.14)', nutColor:'#4848b0',
    rootNote:'#ff00c0', rootText:'#ffffff',
    intervalNote:'#00ffe8', intervalText:'#000e10',
    dualA:'#ff00c0', dualAText:'#fff',
    dualB:'#00ccff', dualBText:'#000818',
    shared:'#ffee00', sharedText:'#181400',
    panelBg:'rgba(4,4,18,0.98)', text:'#8888d8', accent:'#ff00c0', muted:'#383878',
    border:'rgba(56,56,140,0.3)', boardBorder:'#1c1c88',
  },
  'Arctic Frost':{
    bg:'#d8eef8', boardBg:'#b8d4e8',
    fretColor:'#68a4c4', fretGlow:'rgba(88,156,196,0.3)',
    stringColor:'#3470a0', inlayColor:'rgba(235,250,255,0.75)', nutColor:'#ecf8ff',
    rootNote:'#14486a', rootText:'#d8f0ff',
    intervalNote:'#2480b0', intervalText:'#ffffff',
    dualA:'#14486a', dualAText:'#d8f0ff',
    dualB:'#982018', dualBText:'#fff8f0',
    shared:'#1a6038', sharedText:'#e0fff0',
    panelBg:'rgba(190,215,232,0.97)', text:'#081c30', accent:'#14486a', muted:'#5080a0',
    border:'rgba(64,128,160,0.28)', boardBorder:'#4490b8',
  },
  'Sunburst':{
    bg:'#180700', boardBg:'#281000',
    fretColor:'#886015', fretGlow:'rgba(255,145,0,0.3)',
    stringColor:'#b89025', inlayColor:'rgba(255,148,0,0.22)', nutColor:'#ffe080',
    rootNote:'#ff6800', rootText:'#ffffff',
    intervalNote:'#ffc000', intervalText:'#180700',
    dualA:'#ff3800', dualAText:'#ffffff',
    dualB:'#ffe000', dualBText:'#180c00',
    shared:'#ff8800', sharedText:'#ffffff',
    panelBg:'rgba(18,7,0,0.97)', text:'#ffe0a0', accent:'#ff8800', muted:'#886015',
    border:'rgba(136,96,21,0.3)', boardBorder:'#987020',
  },
  'Matrix':{
    bg:'#000800', boardBg:'#001000',
    fretColor:'#002800', fretGlow:'rgba(0,160,0,0.22)',
    stringColor:'#004400', inlayColor:'rgba(0,255,0,0.1)', nutColor:'#00a800',
    rootNote:'#00ff00', rootText:'#000800',
    intervalNote:'#006000', intervalText:'#00ff00',
    dualA:'#00ff00', dualAText:'#000800',
    dualB:'#00aaff', dualBText:'#000818',
    shared:'#ffff00', sharedText:'#181400',
    panelBg:'rgba(0,6,0,0.98)', text:'#00c000', accent:'#00ff00', muted:'#004400',
    border:'rgba(0,72,0,0.42)', boardBorder:'#003a00',
  },
};

const mkSel = t => ({
  background:'transparent', border:`1px solid ${t.border}`, color:t.text,
  padding:'5px 7px', fontSize:'11px', fontFamily:'inherit',
  cursor:'pointer', outline:'none', appearance:'none', WebkitAppearance:'none',
});
const mkInp = t => ({
  background:'transparent', border:`1px solid ${t.border}`, color:t.text,
  padding:'5px 4px', fontSize:'11px', fontFamily:'inherit',
  outline:'none', textAlign:'center', width:'48px',
});
const mkBtn = (t, active=false) => ({
  background: active ? t.accent : 'transparent',
  border:`1px solid ${active ? t.accent : t.border}`,
  color: active ? t.bg : t.text,
  padding:'5px 11px', cursor:'pointer', fontSize:'10px',
  fontFamily:'inherit', letterSpacing:'1px', transition:'all 0.15s ease',
});
const mkPanel = t => ({
  background:t.panelBg, border:`1px solid ${t.border}`, padding:'14px',
});

export default function Fretboard() {
  const themeKeys = Object.keys(THEMES);
  const [ti, setTi]             = useState(0);
  const [rootA, setRootA]       = useState(0);
  const [scaleA, setScaleA]     = useState('Major / Ionian');
  const [rootB, setRootB]       = useState(9);
  const [scaleB, setScaleB]     = useState('Minor Pentatonic');
  const [dual, setDual]         = useState(false);
  const [showIvl, setShowIvl]   = useState(true);
  const [useFlats, setUseFlats] = useState(false);
  const [fretS, setFretS]       = useState(0);
  const [fretE, setFretE]       = useState(12);
  const [zoom, setZoom]         = useState(1.0);

  const t   = THEMES[themeKeys[ti]];
  const nms = useFlats ? NOTES_FLAT : NOTES_SHARP;

  const setA = useMemo(() => new Set(SCALES[scaleA].map(i => (rootA+i)%12)), [rootA, scaleA]);
  const setB = useMemo(() => dual ? new Set(SCALES[scaleB].map(i => (rootB+i)%12)) : new Set(), [rootB, scaleB, dual]);

  const getNote = (si, f) => {
    const nv = (TUNING[si] + f) % 12;
    const inA = setA.has(nv), inB = setB.has(nv);
    if (!inA && !inB) return null;
    let color, tc;
    if (dual) {
      if (inA && inB) { color = t.shared; tc = t.sharedText; }
      else if (inA)   { color = t.dualA;  tc = t.dualAText; }
      else             { color = t.dualB;  tc = t.dualBText; }
    } else {
      const isR = (nv - rootA + 12) % 12 === 0;
      color = isR ? t.rootNote : t.intervalNote;
      tc    = isR ? t.rootText : t.intervalText;
    }
    const refRoot = (!dual || inA) ? rootA : rootB;
    const label   = showIvl ? IVLS[(nv - refRoot + 12) % 12] : nms[nv];
    return { color, tc, label };
  };

  const frets    = useMemo(() => Array.from({ length: Math.min(24,fretE) - Math.max(0,fretS) + 1 }, (_,i) => Math.max(0,fretS)+i), [fretS, fretE]);
  const hasOpen  = frets[0] === 0;
  const fretCols = hasOpen ? frets.slice(1) : frets;

  const fW   = Math.round(60 * zoom);
  const sH   = Math.round(46 * zoom);
  const oW   = Math.round(34 * zoom);
  const nD   = Math.round(27 * zoom);
  const fSz  = Math.max(8, Math.round(11 * zoom));
  const lW   = Math.round(30 * zoom);
  const fT   = Math.max(1, Math.round(2 * zoom));
  const ntW  = Math.max(3, Math.round(6 * zoom));
  const nrSz = Math.max(7, Math.round(9 * zoom));
  const dtSz = Math.max(4, Math.round(7 * zoom));
  const z6   = Math.round(6 * zoom);

  const fretBar = (side) => ({
    position:'absolute', [side]:0,
    width:`${fT}px`, height:'100%',
    background:t.fretColor,
    boxShadow:`0 0 3px ${t.fretGlow}`,
  });

  const FretNumRow = ({ mt, mb }) => (
    <div style={{ display:'flex', marginTop:mt||0, marginBottom:mb||0, paddingLeft:`${lW}px` }}>
      {hasOpen && <div style={{ width:`${oW}px`, flexShrink:0, textAlign:'center', fontSize:`${nrSz}px`, color:t.muted }}>○</div>}
      {hasOpen && <div style={{ width:`${ntW}px`, flexShrink:0 }} />}
      {fretCols.map(f => (
        <div key={f} style={{
          width:`${fW}px`, flexShrink:0, textAlign:'center', fontSize:`${nrSz}px`,
          color: FRET_DOTS.has(f) ? t.accent : t.muted,
          fontWeight: FRET_DOTS.has(f) ? 'bold' : 'normal',
        }}>
          {FRET_DOTS.has(f) ? f : <span style={{ opacity:0.3 }}>{f}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:t.bg, fontFamily:'"Courier New", Courier, monospace', color:t.text, padding:'18px', boxSizing:'border-box' }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' }}>
        <div>
          <div style={{ fontSize:'24px', fontWeight:'bold', letterSpacing:'7px', color:t.accent, lineHeight:1 }}>FRETBOARD</div>
          <div style={{ fontSize:'8px', letterSpacing:'4px', color:t.muted, marginTop:'4px' }}>SCALE VISUALIZER · STANDARD TUNING</div>
        </div>
        <button onClick={() => setTi((ti+1) % themeKeys.length)} style={{ ...mkBtn(t), border:`1px solid ${t.accent}`, color:t.accent, padding:'7px 15px', letterSpacing:'2px', fontSize:'9px' }}>
          ◈ {themeKeys[ti].toUpperCase()} ›
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'10px', marginBottom:'14px' }}>
        <div style={{ ...mkPanel(t), border:`1px solid ${dual ? t.dualA : t.accent}` }}>
          <div style={{ fontSize:'8px', letterSpacing:'3px', color: dual ? t.dualA : t.accent, marginBottom:'10px' }}>{dual ? '● SCALE A' : '● SCALE'}</div>
          <div style={{ display:'flex', gap:'6px', marginBottom:'7px' }}>
            <select value={rootA} onChange={e => setRootA(+e.target.value)} style={mkSel(t)}>
              {NOTES_SHARP.map((_,i) => <option key={i} value={i}>{nms[i]}</option>)}
            </select>
            <select value={scaleA} onChange={e => setScaleA(e.target.value)} style={{...mkSel(t), flex:1}}>
              {Object.entries(SCALE_GROUPS).map(([g,ss]) => (
                <optgroup key={g} label={g}>{ss.map(s => <option key={s} value={s}>{s}</option>)}</optgroup>
              ))}
            </select>
          </div>
          <div style={{ fontSize:'8px', color:t.muted, marginBottom:'2px' }}>{SCALES[scaleA].map(i => IVLS[i]).join(' · ')}</div>
          <div style={{ fontSize:'8px', color:t.text, opacity:0.5 }}>{SCALES[scaleA].map(i => nms[(rootA+i)%12]).join(' · ')}</div>
        </div>

        <div style={{ ...mkPanel(t), border:`1px solid ${dual ? t.dualB : t.border}`, opacity: dual ? 1 : 0.58, transition:'opacity 0.3s' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
            <div style={{ fontSize:'8px', letterSpacing:'3px', color:t.dualB }}>● SCALE B</div>
            <button onClick={() => setDual(!dual)} style={{ background: dual ? t.dualB : 'transparent', border:`1px solid ${t.dualB}`, color: dual ? '#000' : t.dualB, padding:'3px 9px', cursor:'pointer', fontSize:'8px', fontFamily:'inherit', letterSpacing:'2px' }}>{dual ? 'ON' : 'OFF'}</button>
          </div>
          <div style={{ display:'flex', gap:'6px', marginBottom:'7px' }}>
            <select value={rootB} onChange={e => setRootB(+e.target.value)} style={mkSel(t)} disabled={!dual}>
              {NOTES_SHARP.map((_,i) => <option key={i} value={i}>{nms[i]}</option>)}
            </select>
            <select value={scaleB} onChange={e => setScaleB(e.target.value)} style={{...mkSel(t), flex:1}} disabled={!dual}>
              {Object.entries(SCALE_GROUPS).map(([g,ss]) => (
                <optgroup key={g} label={g}>{ss.map(s => <option key={s} value={s}>{s}</option>)}</optgroup>
              ))}
            </select>
          </div>
          {dual && <>
            <div style={{ fontSize:'8px', color:t.muted, marginBottom:'2px' }}>{SCALES[scaleB].map(i => IVLS[i]).join(' · ')}</div>
            <div style={{ fontSize:'8px', color:t.text, opacity:0.5 }}>{SCALES[scaleB].map(i => nms[(rootB+i)%12]).join(' · ')}</div>
          </>}
        </div>

        <div style={mkPanel(t)}>
          <div style={{ fontSize:'8px', letterSpacing:'3px', color:t.accent, marginBottom:'10px' }}>● SETTINGS</div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
            <span style={{ fontSize:'8px', opacity:0.65, minWidth:'32px', letterSpacing:'1px' }}>FRETS</span>
            <input type="number" min="0" max="23" value={fretS} onChange={e => { const v=Math.max(0,Math.min(23,+e.target.value)); setFretS(v); if(v>=fretE) setFretE(Math.min(24,v+1)); }} style={mkInp(t)} />
            <span style={{ opacity:0.35, fontSize:'12px' }}>—</span>
            <input type="number" min="1" max="24" value={fretE} onChange={e => { const v=Math.max(1,Math.min(24,+e.target.value)); setFretE(v); if(v<=fretS) setFretS(Math.max(0,v-1)); }} style={mkInp(t)} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
            <span style={{ fontSize:'8px', opacity:0.65, minWidth:'32px', letterSpacing:'1px' }}>ZOOM</span>
            <button onClick={() => setZoom(z => Math.round(Math.max(0.5,z-0.1)*10)/10)} style={mkBtn(t)}>−</button>
            <span style={{ fontSize:'10px', minWidth:'30px', textAlign:'center' }}>{zoom.toFixed(1)}×</span>
            <button onClick={() => setZoom(z => Math.round(Math.min(2.5,z+0.1)*10)/10)} style={mkBtn(t)}>+</button>
            <button onClick={() => setZoom(1)} style={{...mkBtn(t), padding:'5px 7px', fontSize:'9px', opacity:0.7}}>↺</button>
          </div>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            <button onClick={() => setShowIvl(!showIvl)} style={mkBtn(t, showIvl)}>{showIvl ? 'INTERVALS' : 'NOTES'}</button>
            <button onClick={() => setUseFlats(!useFlats)} style={mkBtn(t, useFlats)}>{useFlats ? '♭ FLATS' : '♯ SHARPS'}</button>
          </div>
        </div>
      </div>

      {dual && (
        <div style={{ display:'flex', gap:'14px', marginBottom:'12px', flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:'8px', letterSpacing:'2px', opacity:0.45 }}>KEY:</span>
          {[{ color:t.dualA, label:`${nms[rootA]} ${scaleA} only` }, { color:t.dualB, label:`${nms[rootB]} ${scaleB} only` }, { color:t.shared, label:'Shared notes' }].map(({ color, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <div style={{ width:11, height:11, borderRadius:'50%', background:color, boxShadow:`0 0 5px ${color}aa` }} />
              <span style={{ fontSize:'8px', letterSpacing:'1px' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ overflowX:'auto', overflowY:'visible', marginBottom:'14px' }}>
        <div style={{ display:'inline-block', background:t.boardBg, border:`2px solid ${t.boardBorder}`, borderRadius:'6px', padding:`${Math.round(sH*0.38)}px ${Math.round(fW*0.22)}px` }}>
          <FretNumRow mb={3} />
          {TUNING.map((_, si) => (
            <div key={si} style={{ display:'flex', alignItems:'center', height:`${sH}px` }}>
              <div style={{ width:`${lW}px`, flexShrink:0, textAlign:'center', fontSize:`${Math.max(8, Math.round(10*zoom))}px`, color:t.stringColor, letterSpacing:'2px', fontWeight:'bold' }}>{STR_NAMES[si]}</div>
              {hasOpen && (() => {
                const ni = getNote(si, 0);
                return (
                  <div style={{ width:`${oW}px`, height:`${sH}px`, flexShrink:0, position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ position:'absolute', left:0, right:0, height:`${STR_THICK[si]}px`, background:t.stringColor, opacity:0.62, top:'50%', transform:'translateY(-50%)' }} />
                    {ni && <div style={{ position:'relative', zIndex:2, width:`${nD}px`, height:`${nD}px`, borderRadius:'50%', background:ni.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:`${fSz}px`, fontWeight:'bold', color:ni.tc, boxShadow:`0 0 ${z6}px ${ni.color}aa`, userSelect:'none' }}>{ni.label}</div>}
                  </div>
                );
              })()}
              {hasOpen && <div style={{ width:`${ntW}px`, height:`${Math.round(sH*0.82)}px`, flexShrink:0, background:t.nutColor, borderRadius:'2px', boxShadow:`0 0 ${Math.round(4*zoom)}px ${t.nutColor}55` }} />}
              {fretCols.map((f, fi) => {
                const ni = getNote(si, f);
                const showSingleDot = FRET_DOTS.has(f) && !DBL_DOTS.has(f) && si === 2;
                const showDblDot    = DBL_DOTS.has(f) && (si === 1 || si === 3);
                const needLeftBar   = fi === 0 && !hasOpen;
                return (
                  <div key={f} style={{ width:`${fW}px`, height:`${sH}px`, flexShrink:0, position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ position:'absolute', left:0, right:0, height:`${STR_THICK[si]}px`, background:t.stringColor, opacity:0.62, top:'50%', transform:'translateY(-50%)' }} />
                    {needLeftBar && <div style={fretBar('left')} />}
                    <div style={fretBar('right')} />
                    {(showSingleDot || showDblDot) && <div style={{ position:'absolute', bottom:`${Math.round(3*zoom)}px`, left:'50%', transform:'translateX(-50%)', width:`${dtSz}px`, height:`${dtSz}px`, borderRadius:'50%', background:t.inlayColor, border:`1px solid ${t.fretColor}66`, pointerEvents:'none' }} />}
                    {ni && <div style={{ position:'relative', zIndex:2, width:`${nD}px`, height:`${nD}px`, borderRadius:'50%', background:ni.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:`${fSz}px`, fontWeight:'bold', color:ni.tc, boxShadow:`0 0 ${z6}px ${ni.color}aa`, userSelect:'none', flexShrink:0 }}>{ni.label}</div>}
                  </div>
                );
              })}
            </div>
          ))}
          <FretNumRow mt={3} />
        </div>
      </div>

      {!dual && (
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'12px', alignItems:'center' }}>
          <span style={{ fontSize:'8px', letterSpacing:'2px', opacity:0.45, marginRight:'4px' }}>SCALE:</span>
          {SCALES[scaleA].map(i => {
            const isR = i === 0;
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background: isR ? t.rootNote : t.intervalNote, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:'bold', color: isR ? t.rootText : t.intervalText, boxShadow:`0 0 4px ${isR ? t.rootNote : t.intervalNote}88` }}>{IVLS[i]}</div>
                <span style={{ fontSize:'8px', color:t.muted }}>{nms[(rootA+i)%12]}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
        <div style={{ ...mkPanel(t), padding:'9px 14px', fontSize:'9px', letterSpacing:'1px' }}>
          <span style={{ color: dual ? t.dualA : t.accent }}>◆ {nms[rootA]} {scaleA}</span>
          <span style={{ marginLeft:'10px', opacity:0.48 }}>{SCALES[scaleA].map(i => nms[(rootA+i)%12]).join(' · ')}</span>
        </div>
        {dual && (
          <div style={{ ...mkPanel(t), padding:'9px 14px', fontSize:'9px', letterSpacing:'1px', border:`1px solid ${t.dualB}` }}>
            <span style={{ color:t.dualB }}>◆ {nms[rootB]} {scaleB}</span>
            <span style={{ marginLeft:'10px', opacity:0.48 }}>{SCALES[scaleB].map(i => nms[(rootB+i)%12]).join(' · ')}</span>
          </div>
        )}
        {dual && (() => {
          const shared = [...setA].filter(n => setB.has(n)).map(n => nms[n]);
          return shared.length > 0 ? (
            <div style={{ ...mkPanel(t), padding:'9px 14px', fontSize:'9px', letterSpacing:'1px', border:`1px solid ${t.shared}` }}>
              <span style={{ color:t.shared }}>◆ Shared</span>
              <span style={{ marginLeft:'10px', opacity:0.48 }}>{shared.join(' · ')}</span>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}