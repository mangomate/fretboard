import { useState, useMemo } from "react";

const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const OPEN_S = [4,9,2,7,11,4];
const IVL = ['1','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','△7'];
const STR_NAMES = ['E','A','D','G','B','e'];
const ROMAN = ['I','II','III','IV','V','VI','VII'];

const SCALE_DEFS = [
  { name:'Major / Ionian',          ivs:[0,2,4,5,7,9,11] },
  { name:'Natural Minor / Aeolian', ivs:[0,2,3,5,7,8,10] },
  { name:'Dorian',                  ivs:[0,2,3,5,7,9,10] },
  { name:'Phrygian',                ivs:[0,1,3,5,7,8,10] },
  { name:'Lydian',                  ivs:[0,2,4,6,7,9,11] },
  { name:'Mixolydian',              ivs:[0,2,4,5,7,9,10] },
  { name:'Locrian',                 ivs:[0,1,3,5,6,8,10] },
  { name:'Harmonic Minor',          ivs:[0,2,3,5,7,8,11] },
  { name:'Melodic Minor',           ivs:[0,2,3,5,7,9,11] },
  { name:'Phrygian Dominant',       ivs:[0,1,4,5,7,8,10] },
  { name:'Lydian Dominant',         ivs:[0,2,4,6,7,9,10] },
  { name:'Hungarian Minor',         ivs:[0,2,3,6,7,8,11] },
  { name:'Double Harmonic',         ivs:[0,1,4,5,7,8,11] },
  { name:'Neapolitan Minor',        ivs:[0,1,3,5,7,8,11] },
  { name:'Neapolitan Major',        ivs:[0,1,3,5,7,9,11] },
  { name:'Super Locrian / Altered', ivs:[0,1,3,4,6,8,10] },
];

function relIvl(scale, fromIdx, steps) {
  const n = scale.length;
  const toIdx = (fromIdx + steps) % n;
  let rel = (scale[toIdx] - scale[fromIdx] + 12) % 12;
  if (steps === 2 && rel < 1) rel += 12;
  if (steps === 4 && rel < 5) rel += 12;
  if (steps === 6 && rel < 8) rel += 12;
  return rel;
}

function triadQual(t, f) {
  if (t===4&&f===7) return { name:'Major',      sym:'',    roman:'upper',  col:'#f2c018' };
  if (t===3&&f===7) return { name:'Minor',      sym:'m',   roman:'lower',  col:'#50aaff' };
  if (t===3&&f===6) return { name:'Diminished', sym:'°',   roman:'lower°', col:'#ff6060' };
  if (t===4&&f===8) return { name:'Augmented',  sym:'+',   roman:'upper+', col:'#ff60a8' };
  if (t===5&&f===7) return { name:'Sus4',       sym:'sus4',roman:'upper',  col:'#78ff58' };
  if (t===2&&f===7) return { name:'Sus2',       sym:'sus2',roman:'upper',  col:'#78ff58' };
  return { name:'?', sym:'?', roman:'upper', col:'#888' };
}

function seventhQual(t, f, s) {
  if (t===4&&f===7&&s===11) return 'maj7';
  if (t===4&&f===7&&s===10) return '7';
  if (t===3&&f===7&&s===10) return 'm7';
  if (t===3&&f===7&&s===11) return 'mΔ7';
  if (t===3&&f===6&&s===10) return 'ø7';
  if (t===3&&f===6&&s===9)  return '°7';
  if (t===4&&f===8&&s===10) return '+7';
  if (t===4&&f===8&&s===11) return '+Δ7';
  return null;
}

function romanNum(deg, q) {
  const r = ROMAN[deg] || String(deg+1);
  if (q.roman==='lower')  return r.toLowerCase();
  if (q.roman==='lower°') return r.toLowerCase()+'°';
  if (q.roman==='upper+') return r+'+';
  return r;
}

function buildDiatonic(keyRoot, scale) {
  return scale.map((si, i) => {
    const degRoot = (keyRoot + si) % 12;
    const t = relIvl(scale, i, 2);
    const f = relIvl(scale, i, 4);
    const s = relIvl(scale, i, 6);
    const q = triadQual(t, f);
    const sev = seventhQual(t, f, s);
    const rom = romanNum(i, q);
    const chordName = NOTES[degRoot] + q.sym;
    const chord7 = sev ? NOTES[degRoot] + sev : null;
    const notes = [NOTES[degRoot], NOTES[(degRoot+t)%12], NOTES[(degRoot+f)%12]];
    return { degRoot, rom, chordName, chord7, q, notes, t, f, s };
  });
}

function genBarre(root, ivs, bStr) {
  const bf = ((root - OPEN_S[bStr]) % 12 + 12) % 12;
  const ct = new Set(ivs.map(i => (root + i) % 12));
  const frets = OPEN_S.map((o, si) => {
    if (si < bStr) return null;
    for (let f = bf; f <= bf + 4; f++) {
      if (ct.has((o + f) % 12)) return f;
    }
    return null;
  });
  const active = frets.filter(f => f !== null);
  if (active.length < 3) return null;
  return { frets, startFret: Math.max(1, bf), label: bStr===0?'E-Shape':'A-Shape', sub: bf===0?'Open position':`Barre fret ${bf}` };
}

function genVoicings(root, ivs) {
  return [genBarre(root,ivs,0), genBarre(root,ivs,1)].filter(Boolean);
}

const CHORDS = [
  { id:'major',   name:'Major',           sym:'',       ivs:[0,4,7],       cats:['beginner','pop','rock','folk','country','blues','cinematic','funk'],   desc:'The foundation of western harmony. Bright and stable — root, major 3rd, perfect 5th.' },
  { id:'minor',   name:'Minor',           sym:'m',      ivs:[0,3,7],       cats:['beginner','pop','rock','folk','cinematic','metal','blues'],             desc:'Darker and melancholic. Lowered 3rd creates the emotional quality.' },
  { id:'dim',     name:'Diminished',      sym:'dim',    ivs:[0,3,6],       cats:['jazz','cinematic','classical','metal','blues'],                         desc:'Maximum tension. Three stacked minor 3rds. Wants desperately to resolve.' },
  { id:'aug',     name:'Augmented',       sym:'aug',    ivs:[0,4,8],       cats:['jazz','cinematic','blues','classical'],                                 desc:'Dreamy and unstable. Three stacked major 3rds. Used as a chromatic passing chord.' },
  { id:'sus2',    name:'Sus 2',           sym:'sus2',   ivs:[0,2,7],       cats:['beginner','pop','rock','folk','cinematic'],                             desc:'3rd replaced by 2nd. Airy and unresolved. Your Dsus2 / Cadd9 share this quality.' },
  { id:'sus4',    name:'Sus 4',           sym:'sus4',   ivs:[0,5,7],       cats:['beginner','pop','rock','blues'],                                        desc:'3rd replaced by 4th. Tense and wants to resolve. Your Gsus4 is huge in rock.' },
  { id:'power',   name:'Power (5th)',     sym:'5',      ivs:[0,7],         cats:['beginner','rock','metal'],                                              desc:'Root + 5th only. No 3rd — neither major nor minor. The essential rock/metal chord.' },
  { id:'add9',    name:'Add 9',           sym:'add9',   ivs:[0,4,7,2],     cats:['beginner','pop','folk','cinematic','rock'],                             desc:'Major triad + 9th. No 7th. Open and airy. Your Cadd9 and Gadd9.' },
  { id:'madd9',   name:'Minor Add 9',     sym:'madd9',  ivs:[0,3,7,2],     cats:['pop','cinematic','folk','rnb'],                                         desc:'Minor triad + 9th. No 7th. Dark but lush — deeper than plain minor.' },
  { id:'add4',    name:'Add 4 (Add 11)',  sym:'add4',   ivs:[0,4,5,7],     cats:['folk','cinematic','modal','classical'],                                  desc:'Major triad + 4th. Thick and medieval. Common in film scores and folk music.' },
  { id:'maj6',    name:'Major 6',         sym:'6',      ivs:[0,4,7,9],     cats:['jazz','blues','folk','rnb','funk','country'],                           desc:'Warm and nostalgic. Adds major 6th to major triad. Classic jazz comping chord.' },
  { id:'min6',    name:'Minor 6',         sym:'m6',     ivs:[0,3,7,9],     cats:['jazz','cinematic','blues','classical'],                                  desc:'Minor triad with major 6th. Bittersweet and sophisticated — film scoring staple.' },
  { id:'six9',    name:'6/9',             sym:'6/9',    ivs:[0,4,7,9,2],   cats:['jazz','rnb','funk','pop'],                                              desc:'Major + 6th + 9th, no 7th. The Stevie Wonder chord. Essential R&B and jazz comping.' },
  { id:'maj7',    name:'Major 7',         sym:'maj7',   ivs:[0,4,7,11],    cats:['jazz','pop','rnb','cinematic','folk'],                                   desc:'Lush and romantic. Adds major 7th to major triad. Signature jazz and bossa nova.' },
  { id:'dom7',    name:'Dominant 7',      sym:'7',      ivs:[0,4,7,10],    cats:['blues','jazz','rock','folk','rnb','funk','country'],                    desc:'The engine of harmonic motion. Creates strong pull to resolve. Blues fundamental.' },
  { id:'min7',    name:'Minor 7',         sym:'m7',     ivs:[0,3,7,10],    cats:['jazz','rnb','pop','funk','blues'],                                       desc:'Soulful and smooth. The ii chord in jazz progressions. Minor + minor 7th.' },
  { id:'mmaj7',   name:'Minor Maj 7',     sym:'mΔ7',    ivs:[0,3,7,11],    cats:['jazz','cinematic','classical'],                                          desc:'Extremely tense and cinematic. Minor triad with a major 7th. Spy film sound.' },
  { id:'halfdim', name:'Half Dim (m7♭5)', sym:'ø',      ivs:[0,3,6,10],    cats:['jazz','cinematic','metal','classical'],                                  desc:'Minor 7 flat 5. Dark and ambiguous. Your Bm7♭5 — ii chord in minor keys.' },
  { id:'dim7',    name:'Diminished 7',    sym:'°7',     ivs:[0,3,6,9],     cats:['jazz','cinematic','classical','blues','metal'],                          desc:'Fully diminished 7th. Symmetric — same chord every 3 frets. Maximum tension.' },
  { id:'aug7',    name:'Augmented 7',     sym:'+7',     ivs:[0,4,8,10],    cats:['jazz','blues','cinematic'],                                              desc:'Dominant 7 with raised 5th. Otherworldly and unstable. Blues passing chord.' },
  { id:'augmaj7', name:'Aug Major 7',     sym:'+Δ7',    ivs:[0,4,8,11],    cats:['jazz','cinematic','classical'],                                          desc:'Augmented with major 7th. Peak harmonic colour and complexity.' },
  { id:'dom7s4',  name:'Dom 7 Sus4',      sym:'7sus4',  ivs:[0,5,7,10],    cats:['jazz','pop','rnb','funk','cinematic'],                                   desc:'Floating unresolved dominant. Think Stevie Wonder and Prince. Your A7sus4.' },
  { id:'sh9',     name:'7♯9 (Hendrix)',   sym:'7#9',    ivs:[0,4,7,10,3],  cats:['blues','rock','funk','jazz'],                                            desc:'The Hendrix chord. Major and minor sound simultaneously. Purple Haze.' },
  { id:'b9',      name:'7♭9',             sym:'7♭9',    ivs:[0,4,7,10,1],  cats:['jazz','blues','cinematic','classical'],                                  desc:'Dark dominant with flat 9. Flamenco and jazz tension. Resolves powerfully.' },
  { id:'sh11',    name:'7♯11',            sym:'7#11',   ivs:[0,4,7,10,6],  cats:['jazz','cinematic'],                                                      desc:'Lydian dominant. Bright and modern jazz. The tritone substitution sound.' },
  { id:'b13',     name:'7♭13',            sym:'7♭13',   ivs:[0,4,7,10,8],  cats:['jazz','blues'],                                                          desc:'Dominant with darkened 13th. Brooding and sophisticated jazz colour.' },
  { id:'alt',     name:'7alt (Altered)',  sym:'7alt',   ivs:[0,4,10,3,8],  cats:['jazz'],                                                                  desc:'All extensions altered. Maximum jazz tension before resolution. Advanced vocabulary.' },
  { id:'maj9',    name:'Major 9',         sym:'maj9',   ivs:[0,4,7,11,2],  cats:['jazz','pop','rnb','cinematic'],                                          desc:'Lush and dreamy. Major 7 + 9th. One of the richest major sonorities.' },
  { id:'dom9',    name:'Dom 9',           sym:'9',      ivs:[0,4,7,10,2],  cats:['jazz','blues','rnb','funk'],                                             desc:'Smooth and full. Dominant 7 + 9th. Huge in R&B and jazz comping.' },
  { id:'min9',    name:'Minor 9',         sym:'m9',     ivs:[0,3,7,10,2],  cats:['jazz','rnb','pop','cinematic'],                                          desc:'Silky and emotional. Minor 7 + 9th. The signature neo-soul and jazz chord.' },
  { id:'sh11_9',  name:'9♯11',            sym:'9#11',   ivs:[0,4,7,10,2,6],cats:['jazz','cinematic','modal'],                                              desc:'Lydian dominant with 9th. Floating and luminous. Essential modern jazz.' },
  { id:'dom9s4',  name:'9sus4',           sym:'9sus4',  ivs:[0,5,7,10,2],  cats:['jazz','funk','rnb','pop'],                                               desc:'Floating, unresolved 9sus4. Massive in funk and modern R&B.' },
  { id:'maj11',   name:'Major 11',        sym:'maj11',  ivs:[0,4,7,11,2,5],cats:['jazz','cinematic','classical'],                                          desc:'Rich and orchestral. Often voiced without the 3rd to avoid clashing with the 11th.' },
  { id:'dom11',   name:'Dom 11',          sym:'11',     ivs:[0,4,7,10,2,5],cats:['jazz','funk','rnb'],                                                     desc:'Floating and massive. The 3rd is often omitted so the 11th can breathe.' },
  { id:'min11',   name:'Minor 11',        sym:'m11',    ivs:[0,3,7,10,2,5],cats:['jazz','rnb','cinematic'],                                                desc:'Deep and enveloping. One of the richest minor sounds in all of jazz.' },
  { id:'maj13',   name:'Major 13',        sym:'maj13',  ivs:[0,4,7,11,2,9],cats:['jazz','rnb'],                                                            desc:'Full-spectrum major. The complete major jazz sound.' },
  { id:'dom13',   name:'Dom 13',          sym:'13',     ivs:[0,4,7,10,2,9],cats:['jazz','blues','funk','rnb'],                                             desc:'The classic jazz dominant. Warm and expansive. Core comping vocabulary.' },
  { id:'min13',   name:'Minor 13',        sym:'m13',    ivs:[0,3,7,10,2,9],cats:['jazz','rnb'],                                                            desc:'The richest minor chord. Sophisticated jazz and neo-soul harmony.' },
  { id:'quartal', name:'Quartal',         sym:'(4ths)', ivs:[0,5,10],      cats:['jazz','modal','cinematic'],                                              desc:'Built in 4ths not 3rds. Modern jazz — So What (Miles Davis), McCoy Tyner.' },
  { id:'quintal', name:'Quintal',         sym:'(5ths)', ivs:[0,7,2],       cats:['modal','cinematic','folk'],                                              desc:'Built in 5ths. Open and spacious. Common in modern film scoring and ambient music.' },
  { id:'phrydom', name:'Phrygian Dom',    sym:'7♭9♭13', ivs:[0,4,7,10,1,8],cats:['modal','jazz','cinematic','metal','blues'],                             desc:'Flamenco dominant — ♭9 and ♭13. Spanish and Middle Eastern flavour. Intense.' },
  { id:'lydian',  name:'Lydian Chord',    sym:'Δ7#11',  ivs:[0,4,7,11,6],  cats:['modal','jazz','cinematic'],                                              desc:'The Lydian sound — major 7 with raised 11th. Floating and luminous.' },
  { id:'neapol',  name:'Neapolitan',      sym:'♭II',    ivs:[0,4,7],       cats:['classical','cinematic','modal'],                                         desc:'Major chord on the flattened 2nd degree. Dramatic cinematic movement.' },
];

const CATS = [
  {id:'all',label:'All'},{id:'beginner',label:'Beginner'},{id:'blues',label:'Blues'},
  {id:'jazz',label:'Jazz'},{id:'pop',label:'Pop'},{id:'rock',label:'Rock'},
  {id:'rnb',label:'R&B & Soul'},{id:'funk',label:'Funk'},{id:'folk',label:'Folk'},
  {id:'country',label:'Country'},{id:'cinematic',label:'Cinematic'},
  {id:'classical',label:'Classical'},{id:'metal',label:'Metal'},{id:'modal',label:'Modal'},
];

const COLORS = ['#f2c018','#78ff58','#50aaff','#ff60a8','#00ffe8','#ffc000','#ff6800','#c060ff','#ff4444','#44ffcc','#ffaa00','#88ff44'];

function Diagram({ frets, startFret, color }) {
  const SS=26,FS=32,DR=11,SHOW=5,PL=22,PR=30,PT=40,PB=18;
  const W=PL+5*SS+PR, H=PT+SHOW*FS+PB;
  const sd=startFret;
  const sx=i=>PL+i*SS;
  const fy=f=>PT+(f-sd)*FS+FS/2;
  return (
    <svg width={W} height={H} style={{display:'block'}}>
      {[...Array(SHOW+1)].map((_,i)=>(
        <line key={i} x1={PL} y1={PT+i*FS} x2={PL+5*SS} y2={PT+i*FS}
          stroke={i===0&&sd===1?"transparent":"rgba(255,255,255,0.09)"} strokeWidth={1}/>
      ))}
      {sd===1&&<rect x={PL} y={PT} width={5*SS} height={5} rx={2} fill="rgba(255,255,255,0.55)"/>}
      {[...Array(6)].map((_,i)=>(
        <line key={i} x1={sx(i)} y1={PT} x2={sx(i)} y2={PT+SHOW*FS}
          stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
      ))}
      {sd>1&&<text x={PL+5*SS+5} y={PT+FS/2+4} fill="rgba(255,255,255,0.35)" fontSize={10} fontFamily="monospace">{sd}fr</text>}
      {frets.map((f,i)=>{ if(f===null||f===0)return null; return <circle key={i} cx={sx(i)} cy={fy(f)} r={DR} fill={color} style={{filter:`drop-shadow(0 0 5px ${color}88)`}}/>; })}
      {frets.map((f,i)=>{
        const x=sx(i),y=PT-16;
        if(f===null)return<text key={i} x={x} y={y} textAnchor="middle" fill="#ff5555" fontSize={14} fontFamily="monospace">✕</text>;
        if(f===0)return<circle key={i} cx={x} cy={y} r={6} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5}/>;
        return null;
      })}
      {STR_NAMES.map((s,i)=>(<text key={i} x={sx(i)} y={PT+SHOW*FS+14} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.25)" fontFamily="monospace">{s}</text>))}
    </svg>
  );
}

const T = { bg:'#0c0a06', text:'#e8d89a', acc:'#f2c018', mut:'rgba(255,255,255,0.35)', bdr:'rgba(242,192,24,0.12)', panel:'rgba(255,255,255,0.02)' };

function ScaleChordsTab() {
  const [keyRoot, setKeyRoot] = useState(0);
  const [scaleIdx, setScaleIdx] = useState(0);
  const [expandedDeg, setExpandedDeg] = useState(null);
  const scale = SCALE_DEFS[scaleIdx];
  const chords = useMemo(() => buildDiatonic(keyRoot, scale.ivs), [keyRoot, scaleIdx]);

  return (
    <div>
      <div style={{display:'flex',gap:'16px',flexWrap:'wrap',marginBottom:'22px',alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:'11px',letterSpacing:'3px',color:T.mut,marginBottom:'8px'}}>KEY</div>
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
            {NOTES.map((n,i)=>(
              <button key={i} onClick={()=>{setKeyRoot(i);setExpandedDeg(null);}} style={{
                background:keyRoot===i?T.acc:'transparent', border:`1px solid ${keyRoot===i?T.acc:T.bdr}`,
                color:keyRoot===i?'#0c0a06':T.text, padding:'6px 13px',cursor:'pointer',
                fontSize:'14px',fontFamily:'inherit',letterSpacing:'1px',transition:'all 0.15s',
              }}>{n}</button>
            ))}
          </div>
        </div>
        <div style={{flex:1,minWidth:'220px'}}>
          <div style={{fontSize:'11px',letterSpacing:'3px',color:T.mut,marginBottom:'8px'}}>SCALE</div>
          <select value={scaleIdx} onChange={e=>{setScaleIdx(+e.target.value);setExpandedDeg(null);}} style={{
            background:'#111008',border:`1px solid ${T.bdr}`,color:T.text,
            padding:'8px 12px',fontSize:'14px',fontFamily:'inherit',
            outline:'none',appearance:'none',cursor:'pointer',width:'100%',
          }}>
            {SCALE_DEFS.map((s,i)=><option key={i} value={i}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{marginBottom:'20px',padding:'12px 16px',background:'rgba(242,192,24,0.06)',border:`1px solid ${T.bdr}`}}>
        <div style={{fontSize:'15px',color:T.acc,letterSpacing:'2px',fontWeight:'bold'}}>{NOTES[keyRoot]} {scale.name}</div>
        <div style={{fontSize:'13px',color:T.mut,marginTop:'5px',letterSpacing:'1px'}}>{scale.ivs.map(i=>NOTES[(keyRoot+i)%12]).join('  ·  ')}</div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {chords.map((c, di) => {
          const isExp = expandedDeg === di;
          return (
            <div key={di} style={{border:`1px solid ${isExp?c.q.col+'55':T.bdr}`,borderRadius:'2px',overflow:'hidden',transition:'border-color 0.2s'}}>
              <div onClick={()=>setExpandedDeg(isExp?null:di)} style={{display:'flex',alignItems:'center',gap:'16px',padding:'14px 18px',cursor:'pointer',background:isExp?'rgba(255,255,255,0.025)':'transparent'}}>
                <div style={{width:'46px',flexShrink:0,textAlign:'center',fontSize:'18px',fontWeight:'bold',color:c.q.col,letterSpacing:'1px',textShadow:`0 0 10px ${c.q.col}66`}}>{c.rom}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:'12px',flexWrap:'wrap'}}>
                    <span style={{fontSize:'18px',fontWeight:'bold',color:c.q.col}}>{c.chordName}</span>
                    {c.chord7&&<span style={{fontSize:'14px',color:'rgba(255,255,255,0.4)'}}>{c.chord7}</span>}
                    <span style={{fontSize:'13px',color:T.mut}}>{c.q.name}</span>
                  </div>
                  <div style={{fontSize:'13px',color:'rgba(255,255,255,0.3)',marginTop:'3px',letterSpacing:'1px'}}>{c.notes.join(' · ')}</div>
                </div>
                <div style={{display:'flex',gap:'5px',flexShrink:0}}>
                  {[c.t,c.f,c.s].map((iv,ii)=>(<span key={ii} style={{fontSize:'11px',color:T.mut,border:'1px solid rgba(255,255,255,0.1)',padding:'2px 6px',letterSpacing:'1px'}}>{IVL[iv]}</span>))}
                </div>
                <span style={{color:c.q.col,opacity:0.55,transform:isExp?'rotate(180deg)':'none',transition:'0.2s',fontSize:'14px'}}>▾</span>
              </div>
              {isExp && (
                <div style={{padding:'4px 18px 18px',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                  <div style={{fontSize:'13px',color:T.mut,margin:'12px 0 14px',letterSpacing:'1px'}}>Degree {ROMAN[di]} of {NOTES[keyRoot]} {scale.name} · Intervals: {IVL[c.t]} {IVL[c.f]} {IVL[c.s]}</div>
                  <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                    {genVoicings(c.degRoot,[0,c.t,c.f]).map((v,vi)=>(
                      <div key={vi} style={{background:T.panel,border:'1px solid rgba(255,255,255,0.06)',borderRadius:'2px',padding:'12px 12px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontSize:'13px',color:c.q.col,letterSpacing:'1px',fontWeight:'bold'}}>{v.label}</div>
                          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.25)',marginTop:'2px'}}>{v.sub}</div>
                        </div>
                        <Diagram frets={v.frets} startFret={v.startFret} color={c.q.col}/>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChordTypesTab() {
  const [root, setRoot]   = useState(0);
  const [cat, setCat]     = useState('all');
  const [q, setQ]         = useState('');
  const [exp, setExp]     = useState(null);

  const filtered = useMemo(() => CHORDS.filter(c => {
    const inCat = cat==='all'||c.cats.includes(cat);
    const inQ   = !q||c.name.toLowerCase().includes(q.toLowerCase())||c.sym.toLowerCase().includes(q.toLowerCase());
    return inCat&&inQ;
  }), [cat, q]);

  return (
    <div>
      <div style={{marginBottom:'18px'}}>
        <div style={{fontSize:'11px',letterSpacing:'3px',color:T.mut,marginBottom:'8px'}}>ROOT NOTE</div>
        <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
          {NOTES.map((n,i)=>(
            <button key={i} onClick={()=>setRoot(i)} style={{
              background:root===i?T.acc:'transparent',border:`1px solid ${root===i?T.acc:T.bdr}`,
              color:root===i?'#0c0a06':T.text,padding:'6px 13px',cursor:'pointer',
              fontSize:'14px',fontFamily:'inherit',letterSpacing:'1px',transition:'all 0.15s',
            }}>{n}</button>
          ))}
        </div>
      </div>
      <input placeholder="Search chord name or symbol..." value={q} onChange={e=>setQ(e.target.value)} style={{
        background:'transparent',border:`1px solid ${T.bdr}`,color:T.text,
        padding:'9px 14px',fontSize:'14px',fontFamily:'inherit',
        outline:'none',width:'280px',letterSpacing:'1px',marginBottom:'14px',display:'block',
      }}/>
      <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'16px'}}>
        {CATS.map(({id,label})=>(
          <button key={id} onClick={()=>setCat(id)} style={{
            background:cat===id?T.acc:'transparent',border:`1px solid ${cat===id?T.acc:T.bdr}`,
            color:cat===id?'#0c0a06':T.mut,padding:'6px 13px',cursor:'pointer',
            fontSize:'12px',fontFamily:'inherit',letterSpacing:'1px',transition:'all 0.15s',
          }}>{label.toUpperCase()}</button>
        ))}
      </div>
      <div style={{fontSize:'12px',color:T.mut,letterSpacing:'2px',marginBottom:'14px'}}>{filtered.length} CHORD{filtered.length!==1?'S':''} · {NOTES[root]} ROOT</div>
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {filtered.map((c,ci)=>{
          const col=COLORS[ci%COLORS.length];
          const isExp=exp===c.id;
          return (
            <div key={c.id} style={{border:`1px solid ${isExp?col+'44':T.bdr}`,borderRadius:'2px',overflow:'hidden',transition:'border-color 0.2s'}}>
              <div onClick={()=>setExp(isExp?null:c.id)} style={{display:'flex',alignItems:'center',gap:'14px',padding:'13px 16px',cursor:'pointer',background:isExp?'rgba(255,255,255,0.02)':'transparent'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:col,boxShadow:`0 0 5px ${col}`,flexShrink:0}}/>
                <div style={{flex:1,display:'flex',alignItems:'baseline',gap:'14px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'17px',fontWeight:'bold',color:col,letterSpacing:'1px'}}>{NOTES[root]}{c.sym}</span>
                  <span style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',letterSpacing:'1px'}}>{c.name}</span>
                  <span style={{fontSize:'12px',color:T.mut}}>{c.ivs.map(i=>IVL[i]).join(' · ')}</span>
                </div>
                <div style={{display:'flex',gap:'4px',flexWrap:'wrap',maxWidth:'180px'}}>
                  {c.cats.slice(0,3).map(cg=>(<span key={cg} style={{fontSize:'10px',color:T.mut,border:`1px solid ${T.bdr}`,padding:'2px 6px',letterSpacing:'1px'}}>{cg.toUpperCase()}</span>))}
                </div>
                <span style={{color:col,opacity:0.55,transform:isExp?'rotate(180deg)':'none',transition:'0.2s',fontSize:'14px'}}>▾</span>
              </div>
              {isExp&&(
                <div style={{padding:'0 16px 20px',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                  <div style={{margin:'14px 0',padding:'11px 14px',background:`${col}11`,border:`1px solid ${col}33`,fontSize:'13px',color:'rgba(255,255,255,0.6)',lineHeight:'1.8'}}>
                    <span style={{color:col}}>{c.name} · </span>{c.desc}
                  </div>
                  <div style={{marginBottom:'16px',fontSize:'13px',color:T.mut,letterSpacing:'1px'}}>NOTES IN {NOTES[root]}: {c.ivs.map(i=>NOTES[(root+i)%12]).join(' · ')}</div>
                  {genVoicings(root,c.ivs).length>0?(
                    <div style={{display:'flex',gap:'14px',flexWrap:'wrap'}}>
                      {genVoicings(root,c.ivs).map((v,vi)=>(
                        <div key={vi} style={{background:T.panel,border:'1px solid rgba(255,255,255,0.07)',borderRadius:'2px',padding:'12px 12px 9px',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
                          <div style={{textAlign:'center'}}>
                            <div style={{fontSize:'13px',color:col,letterSpacing:'1px',fontWeight:'bold'}}>{v.label}</div>
                            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.25)',marginTop:'2px'}}>{v.sub}</div>
                          </div>
                          <Diagram frets={v.frets} startFret={v.startFret} color={col}/>
                          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.2)',letterSpacing:'2px'}}>{v.frets.map(f=>f===null?'x':f).join('·')}</div>
                        </div>
                      ))}
                    </div>
                  ):(
                    <div style={{fontSize:'13px',color:T.mut,fontStyle:'italic',padding:'8px 0'}}>This chord type works best in non-standard positions — try it on the fretboard visualiser.</div>
                  )}
                  <div style={{marginTop:'16px',display:'flex',gap:'6px',flexWrap:'wrap'}}>
                    {c.cats.map(ct=>(<span key={ct} style={{fontSize:'11px',color:T.mut,border:`1px solid ${T.bdr}`,padding:'3px 9px',letterSpacing:'1px',cursor:'pointer'}}>{ct.toUpperCase()}</span>))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChordLibrary() {
  const [tab, setTab] = useState('types');
  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:'"Courier New",Courier,monospace',color:T.text,padding:'24px 20px',boxSizing:'border-box'}}>
      <div style={{marginBottom:'24px'}}>
        <div style={{fontSize:'28px',fontWeight:'bold',letterSpacing:'7px',color:T.acc}}>CHORD LIBRARY</div>
        <div style={{fontSize:'12px',letterSpacing:'4px',color:T.mut,marginTop:'6px'}}>{CHORDS.length} CHORD TYPES · {SCALE_DEFS.length} SCALES · ALL 12 KEYS · ALGORITHMICALLY GENERATED</div>
      </div>
      <div style={{display:'flex',gap:'6px',marginBottom:'24px'}}>
        {[{id:'types',label:'CHORD TYPES'},{id:'scales',label:'SCALE CHORDS'}].map(({id,label})=>(
          <button key={id} onClick={()=>setTab(id)} style={{
            background:tab===id?T.acc:'transparent',border:`1px solid ${tab===id?T.acc:T.bdr}`,
            color:tab===id?'#0c0a06':T.mut,padding:'9px 20px',cursor:'pointer',
            fontSize:'13px',fontFamily:'inherit',letterSpacing:'2px',transition:'all 0.15s',
          }}>{label}</button>
        ))}
      </div>
      {tab==='types'&&<ChordTypesTab/>}
      {tab==='scales'&&<ScaleChordsTab/>}
      <div style={{marginTop:'32px',paddingTop:'16px',borderTop:`1px solid ${T.bdr}`,fontSize:'11px',letterSpacing:'2px',color:'rgba(255,255,255,0.1)',textAlign:'center'}}>
        ALGORITHMICALLY GENERATED · E-SHAPE & A-SHAPE BARRE VOICINGS · STANDARD TUNING
      </div>
    </div>
  );
}