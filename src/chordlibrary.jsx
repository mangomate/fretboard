import { useState, useMemo } from "react";

const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const OPEN_S = [4,9,2,7,11,4]; // E A D G B e (C=0)
const IVL = ['1','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','△7'];
const STR_NAMES = ['E','A','D','G','B','e'];

// ── Voicing Engine ──────────────────────────────────────────────────────────
// For any root + interval set, finds the nearest chord-tone fret on each string
// starting from the barre position. Covers E-shape and A-shape barre positions.
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
  return {
    frets, startFret: Math.max(1, bf),
    label: bStr === 0 ? 'E-Shape' : 'A-Shape',
    sub: bf === 0 ? 'Open position' : `Barre at fret ${bf}`
  };
}

function genVoicings(root, ivs) {
  return [genBarre(root,ivs,0), genBarre(root,ivs,1)].filter(Boolean);
}

// ── Chord Database (42 types, all derived from interval formulas) ────────────
const CHORDS = [
  // Triads & Basic
  { id:'major',   name:'Major',           sym:'',       ivs:[0,4,7],       cats:['beginner','pop','rock','folk','country','blues','cinematic','funk'],   desc:'The foundation of western harmony. Bright and stable — root, major 3rd, perfect 5th.' },
  { id:'minor',   name:'Minor',           sym:'m',      ivs:[0,3,7],       cats:['beginner','pop','rock','folk','cinematic','metal','blues'],             desc:'Darker and melancholic. Lowered 3rd (minor 3rd) creates the emotional quality.' },
  { id:'dim',     name:'Diminished',      sym:'dim',    ivs:[0,3,6],       cats:['jazz','cinematic','classical','metal','blues'],                         desc:'Maximum tension. Three stacked minor 3rds. Wants desperately to resolve.' },
  { id:'aug',     name:'Augmented',       sym:'aug',    ivs:[0,4,8],       cats:['jazz','cinematic','blues','classical'],                                 desc:'Dreamy and unstable. Three stacked major 3rds. Used as a chromatic passing chord.' },
  { id:'sus2',    name:'Sus 2',           sym:'sus2',   ivs:[0,2,7],       cats:['beginner','pop','rock','folk','cinematic'],                            desc:'3rd replaced by 2nd. Airy and unresolved. Cadd9/Gadd9 share this open quality.' },
  { id:'sus4',    name:'Sus 4',           sym:'sus4',   ivs:[0,5,7],       cats:['beginner','pop','rock','blues'],                                       desc:'3rd replaced by 4th. Tense and wants to resolve. Your Gsus4 — massive in rock.' },
  { id:'power',   name:'Power (5th)',     sym:'5',      ivs:[0,7],         cats:['beginner','rock','metal'],                                             desc:'Root + 5th only. No 3rd — neither major nor minor. The essential rock/metal chord.' },

  // Added Note
  { id:'add9',    name:'Add 9',           sym:'add9',   ivs:[0,4,7,2],     cats:['beginner','pop','folk','cinematic','rock'],                            desc:'Major triad + 9th. No 7th. Open and airy. Your Cadd9 and Gadd9.' },
  { id:'madd9',   name:'Minor Add 9',     sym:'madd9',  ivs:[0,3,7,2],     cats:['pop','cinematic','folk','rnb'],                                        desc:'Minor triad + 9th. No 7th. Dark but lush — deeper than plain minor.' },
  { id:'add4',    name:'Add 4 (Add 11)',  sym:'add4',   ivs:[0,4,5,7],     cats:['folk','cinematic','modal','classical'],                                desc:'Major triad + 4th. Thick and medieval. Common in film scores and folk music.' },

  // Sixths
  { id:'maj6',    name:'Major 6',         sym:'6',      ivs:[0,4,7,9],     cats:['jazz','blues','folk','rnb','funk','country'],                          desc:'Warm and nostalgic. Adds major 6th to major triad. Classic jazz comping chord.' },
  { id:'min6',    name:'Minor 6',         sym:'m6',     ivs:[0,3,7,9],     cats:['jazz','cinematic','blues','classical'],                                 desc:'Minor triad with major 6th. Bittersweet and sophisticated — film scoring staple.' },
  { id:'six9',    name:'6/9',             sym:'6/9',    ivs:[0,4,7,9,2],   cats:['jazz','rnb','funk','pop'],                                             desc:'Major + 6th + 9th, no 7th. The Stevie Wonder chord. Essential R&B and jazz comping.' },

  // Sevenths
  { id:'maj7',    name:'Major 7',         sym:'maj7',   ivs:[0,4,7,11],    cats:['jazz','pop','rnb','cinematic','folk'],                                 desc:'Lush and romantic. Adds major 7th to major triad. Signature jazz and bossa nova.' },
  { id:'dom7',    name:'Dominant 7',      sym:'7',      ivs:[0,4,7,10],    cats:['blues','jazz','rock','folk','rnb','funk','country'],                   desc:'The engine of harmonic motion. Creates strong pull to resolve. Blues fundamental.' },
  { id:'min7',    name:'Minor 7',         sym:'m7',     ivs:[0,3,7,10],    cats:['jazz','rnb','pop','funk','blues'],                                     desc:'Soulful and smooth. The ii chord in jazz progressions. Minor + minor 7th.' },
  { id:'mmaj7',   name:'Minor Maj 7',     sym:'mΔ7',    ivs:[0,3,7,11],    cats:['jazz','cinematic','classical'],                                        desc:'Extremely tense and cinematic. Minor triad with a major 7th. Spy film sound.' },
  { id:'halfdim', name:'Half Dim (m7♭5)', sym:'ø',      ivs:[0,3,6,10],    cats:['jazz','cinematic','metal','classical'],                                 desc:'Minor 7 flat 5. Dark and ambiguous. Your Bm7♭5 — ii chord in minor keys.' },
  { id:'dim7',    name:'Diminished 7',    sym:'°7',     ivs:[0,3,6,9],     cats:['jazz','cinematic','classical','blues','metal'],                         desc:'Fully diminished 7th. Symmetric — same chord every 3 frets. Maximum tension.' },
  { id:'aug7',    name:'Augmented 7',     sym:'+7',     ivs:[0,4,8,10],    cats:['jazz','blues','cinematic'],                                            desc:'Dominant 7 with raised 5th. Otherworldly and unstable. Blues passing chord.' },
  { id:'augmaj7', name:'Aug Major 7',     sym:'+Δ7',    ivs:[0,4,8,11],    cats:['jazz','cinematic','classical'],                                        desc:'Augmented with major 7th. Peak harmonic colour and complexity.' },

  // Dominant Variants
  { id:'dom7s4',  name:'Dom 7 Sus4',      sym:'7sus4',  ivs:[0,5,7,10],    cats:['jazz','pop','rnb','funk','cinematic'],                                 desc:'Floating unresolved dominant. Think Stevie Wonder and Prince. Your A7sus4.' },
  { id:'sh9',     name:'7♯9 (Hendrix)',   sym:'7#9',    ivs:[0,4,7,10,3],  cats:['blues','rock','funk','jazz'],                                          desc:'The Hendrix chord. Major and minor sound simultaneously. Purple Haze.' },
  { id:'b9',      name:'7♭9',             sym:'7♭9',    ivs:[0,4,7,10,1],  cats:['jazz','blues','cinematic','classical'],                                 desc:'Dark dominant with flat 9. Flamenco and jazz tension. Resolves powerfully.' },
  { id:'sh11',    name:'7♯11',            sym:'7#11',   ivs:[0,4,7,10,6],  cats:['jazz','cinematic'],                                                    desc:'Lydian dominant. Bright and modern jazz. The tritone substitution sound.' },
  { id:'b13',     name:'7♭13',            sym:'7♭13',   ivs:[0,4,7,10,8],  cats:['jazz','blues'],                                                        desc:'Dominant with darkened 13th. Brooding and sophisticated jazz colour.' },
  { id:'alt',     name:'7alt (Altered)',  sym:'7alt',   ivs:[0,4,10,3,8],  cats:['jazz'],                                                                desc:'All extensions altered. Maximum jazz tension before resolution. Advanced vocabulary.' },

  // Ninths
  { id:'maj9',    name:'Major 9',         sym:'maj9',   ivs:[0,4,7,11,2],  cats:['jazz','pop','rnb','cinematic'],                                        desc:'Lush and dreamy. Major 7 + 9th. One of the richest major sonorities.' },
  { id:'dom9',    name:'Dom 9',           sym:'9',      ivs:[0,4,7,10,2],  cats:['jazz','blues','rnb','funk'],                                           desc:'Smooth and full. Dominant 7 + 9th. Huge in R&B and jazz comping.' },
  { id:'min9',    name:'Minor 9',         sym:'m9',     ivs:[0,3,7,10,2],  cats:['jazz','rnb','pop','cinematic'],                                        desc:'Silky and emotional. Minor 7 + 9th. The signature neo-soul and jazz chord.' },
  { id:'sh11_9',  name:'9♯11 (Lydian Dom)',sym:'9#11',  ivs:[0,4,7,10,2,6],cats:['jazz','cinematic','modal'],                                            desc:'Lydian dominant with 9th. Floating and luminous. Essential modern jazz.' },
  { id:'dom9s4',  name:'9sus4',           sym:'9sus4',  ivs:[0,5,7,10,2],  cats:['jazz','funk','rnb','pop'],                                             desc:'Floating, unresolved 9sus4. Massive in funk and modern R&B.' },

  // Elevenths
  { id:'maj11',   name:'Major 11',        sym:'maj11',  ivs:[0,4,7,11,2,5],cats:['jazz','cinematic','classical'],                                        desc:'Rich and orchestral. Often voiced without the 3rd to avoid clashing with the 11th.' },
  { id:'dom11',   name:'Dom 11',          sym:'11',     ivs:[0,4,7,10,2,5],cats:['jazz','funk','rnb'],                                                   desc:'Floating and massive. The 3rd is often omitted so the 11th can breathe.' },
  { id:'min11',   name:'Minor 11',        sym:'m11',    ivs:[0,3,7,10,2,5],cats:['jazz','rnb','cinematic'],                                              desc:'Deep and enveloping. One of the richest minor sounds in all of jazz.' },

  // Thirteenths
  { id:'maj13',   name:'Major 13',        sym:'maj13',  ivs:[0,4,7,11,2,9],cats:['jazz','rnb'],                                                          desc:'Full-spectrum major. The complete major jazz sound. Voice selectively on guitar.' },
  { id:'dom13',   name:'Dom 13',          sym:'13',     ivs:[0,4,7,10,2,9],cats:['jazz','blues','funk','rnb'],                                           desc:'The classic jazz dominant. Warm and expansive. Core comping vocabulary.' },
  { id:'min13',   name:'Minor 13',        sym:'m13',    ivs:[0,3,7,10,2,9],cats:['jazz','rnb'],                                                          desc:'The richest minor chord. Sophisticated jazz and neo-soul harmony.' },

  // Modal & Exotic
  { id:'quartal', name:'Quartal',         sym:'(4ths)', ivs:[0,5,10],      cats:['jazz','modal','cinematic'],                                            desc:'Built in 4ths not 3rds. Modern jazz — So What (Miles Davis), McCoy Tyner.' },
  { id:'quintal', name:'Quintal',         sym:'(5ths)', ivs:[0,7,2],       cats:['modal','cinematic','folk'],                                            desc:'Built in 5ths. Open and spacious. Common in modern film scoring and ambient music.' },
  { id:'phrydom', name:'Phrygian Dom',    sym:'7♭9♭13', ivs:[0,4,7,10,1,8],cats:['modal','jazz','cinematic','metal','blues'],                            desc:'Flamenco dominant — ♭9 and ♭13. Spanish and Middle Eastern flavour. Intense.' },
  { id:'lydian',  name:'Lydian Chord',    sym:'Δ7#11',  ivs:[0,4,7,11,6],  cats:['modal','jazz','cinematic'],                                            desc:'The Lydian sound — major 7 with raised 11th (tritone above root). Floating and luminous.' },
  { id:'neapol',  name:'Neapolitan',      sym:'♭II',    ivs:[0,4,7],       cats:['classical','cinematic','modal'],                                       desc:'Major chord on the flattened 2nd degree. Dramatic cinematic movement — opera and film.' },
];

const CATS = [
  {id:'all',label:'All'},{id:'beginner',label:'Beginner'},{id:'blues',label:'Blues'},
  {id:'jazz',label:'Jazz'},{id:'pop',label:'Pop & Indie'},{id:'rock',label:'Rock'},
  {id:'rnb',label:'R&B & Soul'},{id:'funk',label:'Funk'},{id:'folk',label:'Folk'},
  {id:'country',label:'Country'},{id:'cinematic',label:'Cinematic'},
  {id:'classical',label:'Classical'},{id:'metal',label:'Metal'},{id:'modal',label:'Modal'},
];

const COLORS = ['#f2c018','#78ff58','#50aaff','#ff60a8','#00ffe8','#ffc000','#ff6800','#c060ff','#ff4444','#44ffcc','#ffaa00','#88ff44'];

// ── SVG Chord Diagram ───────────────────────────────────────────────────────
function Diagram({ frets, startFret, color }) {
  const SS=24,FS=30,DR=10,SHOW=5,PL=22,PR=28,PT=38,PB=16;
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
      {sd>1&&<text x={PL+5*SS+5} y={PT+FS/2+4} fill="rgba(255,255,255,0.35)" fontSize={9} fontFamily="monospace">{sd}fr</text>}
      {frets.map((f,i)=>{
        if(f===null||f===0)return null;
        return <circle key={i} cx={sx(i)} cy={fy(f)} r={DR} fill={color} style={{filter:`drop-shadow(0 0 5px ${color}88)`}}/>;
      })}
      {frets.map((f,i)=>{
        const x=sx(i),y=PT-15;
        if(f===null)return<text key={i} x={x} y={y} textAnchor="middle" fill="#ff5555" fontSize={13} fontFamily="monospace">✕</text>;
        if(f===0)return<circle key={i} cx={x} cy={y} r={6} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5}/>;
        return null;
      })}
      {STR_NAMES.map((s,i)=>(
        <text key={i} x={sx(i)} y={PT+SHOW*FS+13} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.2)" fontFamily="monospace">{s}</text>
      ))}
    </svg>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function ChordLib() {
  const [root, setRoot]   = useState(0);
  const [cat, setCat]     = useState('all');
  const [q, setQ]         = useState('');
  const [exp, setExp]     = useState(null);

  const filtered = useMemo(() => CHORDS.filter(c => {
    const inCat = cat === 'all' || c.cats.includes(cat);
    const inQ   = !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.sym.toLowerCase().includes(q.toLowerCase());
    return inCat && inQ;
  }), [cat, q]);

  const voicings = useMemo(() => {
    if (!exp) return null;
    const chord = CHORDS.find(c => c.id === exp);
    return chord ? genVoicings(root, chord.ivs) : null;
  }, [exp, root]);

  const T = { bg:'#0c0a06', text:'#e8d89a', acc:'#f2c018', mut:'#5a4a20', bdr:'rgba(242,192,24,0.1)' };

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:'"Courier New",Courier,monospace',color:T.text,padding:'22px',boxSizing:'border-box'}}>

      {/* Header */}
      <div style={{marginBottom:'22px'}}>
        <div style={{fontSize:'26px',fontWeight:'bold',letterSpacing:'7px',color:T.acc}}>CHORD LIBRARY</div>
        <div style={{fontSize:'9px',letterSpacing:'4px',color:T.mut,marginTop:'5px'}}>WESTERN MUSIC · {CHORDS.length} CHORD TYPES · ALL 12 ROOTS · ALGORITHMICALLY GENERATED VOICINGS</div>
      </div>

      {/* Root selector */}
      <div style={{marginBottom:'16px'}}>
        <div style={{fontSize:'8px',letterSpacing:'3px',color:T.mut,marginBottom:'7px'}}>ROOT NOTE</div>
        <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
          {NOTES.map((n,i)=>(
            <button key={i} onClick={()=>setRoot(i)} style={{
              background:root===i?T.acc:'transparent',
              border:`1px solid ${root===i?T.acc:T.bdr}`,
              color:root===i?T.bg:T.text,
              padding:'5px 11px',cursor:'pointer',fontSize:'12px',
              fontFamily:'inherit',letterSpacing:'1px',transition:'all 0.15s',
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Search */}
      <input
        placeholder="Search chord name or symbol..."
        value={q} onChange={e=>setQ(e.target.value)}
        style={{
          background:'transparent',border:`1px solid ${T.bdr}`,color:T.text,
          padding:'7px 12px',fontSize:'11px',fontFamily:'inherit',
          outline:'none',width:'260px',letterSpacing:'1px',
          marginBottom:'12px',display:'block',
        }}
      />

      {/* Category tabs */}
      <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'16px'}}>
        {CATS.map(({id,label})=>(
          <button key={id} onClick={()=>setCat(id)} style={{
            background:cat===id?T.acc:'transparent',
            border:`1px solid ${cat===id?T.acc:T.bdr}`,
            color:cat===id?T.bg:T.mut,
            padding:'4px 11px',cursor:'pointer',fontSize:'8px',
            fontFamily:'inherit',letterSpacing:'2px',transition:'all 0.15s',
          }}>{label.toUpperCase()}</button>
        ))}
      </div>

      {/* Count */}
      <div style={{fontSize:'8px',color:T.mut,letterSpacing:'2px',marginBottom:'12px'}}>
        {filtered.length} CHORD{filtered.length!==1?'S':''} · {NOTES[root]} ROOT
      </div>

      {/* Chord list */}
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {filtered.map((c, ci) => {
          const col = COLORS[ci % COLORS.length];
          const isExp = exp === c.id;
          const chordName = `${NOTES[root]}${c.sym}`;

          return (
            <div key={c.id} style={{
              border:`1px solid ${isExp ? col+'44' : T.bdr}`,
              borderRadius:'2px',overflow:'hidden',transition:'border-color 0.2s',
            }}>
              {/* Row header */}
              <div
                onClick={()=>setExp(isExp ? null : c.id)}
                style={{
                  display:'flex',alignItems:'center',gap:'12px',
                  padding:'11px 14px',cursor:'pointer',
                  background:isExp?'rgba(255,255,255,0.02)':'transparent',
                }}
              >
                <div style={{width:7,height:7,borderRadius:'50%',background:col,boxShadow:`0 0 5px ${col}`,flexShrink:0}}/>
                <div style={{flex:1,display:'flex',alignItems:'baseline',gap:'12px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'15px',fontWeight:'bold',color:col,letterSpacing:'1px'}}>{chordName}</span>
                  <span style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',letterSpacing:'1px'}}>{c.name}</span>
                  <span style={{fontSize:'8px',color:T.mut}}>{c.ivs.map(i=>IVL[i]).join(' · ')}</span>
                </div>
                <div style={{display:'flex',gap:'3px',flexWrap:'wrap',maxWidth:'160px'}}>
                  {c.cats.slice(0,3).map(cg=>(
                    <span key={cg} style={{fontSize:'6px',color:T.mut,border:`1px solid ${T.bdr}`,padding:'2px 5px',letterSpacing:'1px'}}>{cg.toUpperCase()}</span>
                  ))}
                </div>
                <span style={{color:col,opacity:0.55,transform:isExp?'rotate(180deg)':'none',transition:'0.2s',fontSize:'12px'}}>▾</span>
              </div>

              {/* Expanded panel */}
              {isExp && (
                <div style={{padding:'0 14px 18px',borderTop:'1px solid rgba(255,255,255,0.04)'}}>

                  {/* Description */}
                  <div style={{margin:'12px 0',padding:'9px 12px',background:`${col}11`,border:`1px solid ${col}33`,fontSize:'11px',color:'rgba(255,255,255,0.55)',lineHeight:'1.75'}}>
                    <span style={{color:col}}>{c.name} · </span>{c.desc}
                  </div>

                  {/* Notes */}
                  <div style={{marginBottom:'14px',fontSize:'9px',color:T.mut,letterSpacing:'1px'}}>
                    NOTES IN {NOTES[root]}: {c.ivs.map(i=>NOTES[(root+i)%12]).join(' · ')}
                  </div>

                  {/* Voicing diagrams */}
                  {voicings && voicings.length > 0 ? (
                    <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                      {voicings.map((v,vi)=>(
                        <div key={vi} style={{
                          background:'rgba(255,255,255,0.015)',
                          border:'1px solid rgba(255,255,255,0.06)',
                          borderRadius:'2px',padding:'10px 10px 7px',
                          display:'flex',flexDirection:'column',alignItems:'center',gap:'7px',
                        }}>
                          <div style={{textAlign:'center'}}>
                            <div style={{fontSize:'11px',color:col,letterSpacing:'1px',fontWeight:'bold'}}>{v.label}</div>
                            <div style={{fontSize:'8px',color:'rgba(255,255,255,0.25)',marginTop:'2px'}}>{v.sub}</div>
                          </div>
                          <Diagram frets={v.frets} startFret={v.startFret} color={col}/>
                          <div style={{fontSize:'8px',color:'rgba(255,255,255,0.18)',letterSpacing:'2px'}}>
                            {v.frets.map(f=>f===null?'x':f).join('·')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{fontSize:'10px',color:T.mut,fontStyle:'italic',padding:'8px 0'}}>
                      This chord type works best in non-standard positions — try it on the fretboard visualiser.
                    </div>
                  )}

                  {/* Category filter links */}
                  <div style={{marginTop:'14px',display:'flex',gap:'5px',flexWrap:'wrap'}}>
                    {c.cats.map(ct=>(
                      <span key={ct}
                        onClick={e=>{e.stopPropagation();setCat(ct);}}
                        style={{fontSize:'7px',color:T.mut,border:`1px solid ${T.bdr}`,padding:'3px 8px',letterSpacing:'1px',cursor:'pointer'}}>
                        {ct.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{marginTop:'28px',paddingTop:'14px',borderTop:`1px solid ${T.bdr}`,fontSize:'8px',letterSpacing:'2px',color:'rgba(255,255,255,0.1)',textAlign:'center'}}>
        ALGORITHMICALLY GENERATED · E-SHAPE & A-SHAPE BARRE VOICINGS · STANDARD TUNING
      </div>
    </div>
  );
}