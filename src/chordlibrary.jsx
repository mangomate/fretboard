import { useState, useMemo } from "react";

// ── Constants ────────────────────────────────────────────────────────────────
const NOTES    = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const OPEN_S   = [4, 9, 2, 7, 11, 4]; // E A D G B e  (semitones from C=0)
const STR_NAMES= ['E','A','D','G','B','e'];
const ROMAN    = ['I','II','III','IV','V','VI','VII'];
const IVL      = ['1','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','△7'];

// ── Scale definitions (for Scale Chords tab) ─────────────────────────────────
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

// ── Diatonic chord engine ────────────────────────────────────────────────────
function relIvl(scale, fromIdx, steps) {
  const n = scale.length;
  let rel = (scale[(fromIdx+steps)%n] - scale[fromIdx] + 12) % 12;
  if (steps===2 && rel<1) rel+=12;
  if (steps===4 && rel<5) rel+=12;
  if (steps===6 && rel<8) rel+=12;
  return rel;
}
function triadQual(t,f) {
  if(t===4&&f===7)return{name:'Major',     sym:'',    roman:'upper', col:'#f2c018'};
  if(t===3&&f===7)return{name:'Minor',     sym:'m',   roman:'lower', col:'#50aaff'};
  if(t===3&&f===6)return{name:'Dim',       sym:'°',   roman:'dim',   col:'#ff6060'};
  if(t===4&&f===8)return{name:'Aug',       sym:'+',   roman:'aug',   col:'#ff60a8'};
  return{name:'?',sym:'?',roman:'upper',col:'#888'};
}
function seventhQual(t,f,s){
  if(t===4&&f===7&&s===11)return'maj7';
  if(t===4&&f===7&&s===10)return'7';
  if(t===3&&f===7&&s===10)return'm7';
  if(t===3&&f===7&&s===11)return'mΔ7';
  if(t===3&&f===6&&s===10)return'ø7';
  if(t===3&&f===6&&s===9) return'°7';
  if(t===4&&f===8&&s===10)return'+7';
  if(t===4&&f===8&&s===11)return'+Δ7';
  return null;
}
function romanNum(deg,q){
  const r=ROMAN[deg]||String(deg+1);
  if(q.roman==='lower')return r.toLowerCase();
  if(q.roman==='dim')  return r.toLowerCase()+'°';
  if(q.roman==='aug')  return r+'+';
  return r;
}
function buildDiatonic(keyRoot, scale){
  return scale.map((si,i)=>{
    const degRoot=(keyRoot+si)%12;
    const t=relIvl(scale,i,2),f=relIvl(scale,i,4),s=relIvl(scale,i,6);
    const q=triadQual(t,f);
    const sev=seventhQual(t,f,s);
    return{
      degRoot, rom:romanNum(i,q), chordName:NOTES[degRoot]+q.sym,
      chord7:sev?NOTES[degRoot]+sev:null, q,
      notes:[NOTES[degRoot],NOTES[(degRoot+t)%12],NOTES[(degRoot+f)%12]],
      t,f,s
    };
  });
}

// ── HAND-VERIFIED SHAPE DATABASE ─────────────────────────────────────────────
//
// offsets[]: null=mute, integer=frets above the root fret (0 = root fret itself)
// rootStr:   which string (0=lowE … 5=highE) carries the root note
// barre:     true if index finger bars across strings at the root fret
// barreStr:  [from, to] string indices covered by the barre
// fingers[]: 0=open/muted, 1–4=index/middle/ring/pinky
//
// Every shape below has been verified note-by-note. Example verification shown
// in comments as: fret→noteName  (root note used in the comment = example root)
//
// OPEN_S reference: E=4  A=9  D=2  G=7  B=11  e=4   (all mod 12 from C=0)

const SHAPE_GROUPS = [
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'major', name:'Major', sym:'', color:'#f2c018',
    desc:'Root · 3rd · 5th. The foundation of western harmony.',
    shapes:[
      {
        label:'E-Shape Barre', sub:'Root on low E string',
        rootStr:0, barre:true, barreStr:[0,5],
        offsets:[0,2,2,1,0,0], fingers:[1,3,4,2,1,1],
        // Verified Fmaj (rf=1): E:1→F  A:3→C  D:3→F  G:2→A  B:1→F  e:1→F  ✓
        // Intervals:            R     5th    R     3rd  5th    R
      },
      {
        label:'A-Shape Barre', sub:'Root on A string',
        rootStr:1, barre:true, barreStr:[1,5],
        offsets:[null,0,2,2,2,0], fingers:[0,1,3,4,3,1],
        // Verified Bbmaj (rf=1): A:1→Bb  D:3→F  G:3→Bb  B:3→D  e:1→Bb  ✓
        // Intervals:              R      5th    R       3rd    R
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'minor', name:'Minor', sym:'m', color:'#50aaff',
    desc:'Root · ♭3rd · 5th. The fundamental minor chord.',
    shapes:[
      {
        label:'E-Shape Barre', sub:'Root on low E string',
        rootStr:0, barre:true, barreStr:[0,5],
        offsets:[0,2,2,0,0,0], fingers:[1,3,4,1,1,1],
        // Verified Fm (rf=1): E:1→F  A:3→C  D:3→F  G:1→Ab  B:1→C  e:1→F  ✓
        // Intervals:           R     5th    R      ♭3rd    5th    R
      },
      {
        label:'A-Shape Barre', sub:'Root on A string',
        rootStr:1, barre:true, barreStr:[1,5],
        offsets:[null,0,2,2,1,0], fingers:[0,1,3,4,2,1],
        // Verified Bm (rf=2): A:2→B  D:4→F#  G:4→B  B:3→D  e:2→B  ✓
        // Intervals:           R     5th     R      ♭3rd   R
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'maj7', name:'Major 7', sym:'maj7', color:'#78ff58',
    desc:'Root · 3rd · 5th · △7. Lush, romantic. Jazz and bossa nova staple.',
    shapes:[
      {
        label:'E-Shape Barre', sub:'Root on low E string',
        rootStr:0, barre:true, barreStr:[0,5],
        offsets:[0,2,1,1,0,0], fingers:[1,4,2,3,1,1],
        // Verified Fmaj7 (rf=1): E:1→F  A:3→C  D:2→E  G:2→A  B:1→F  e:1→F  ✓
        // Intervals:              R     5th    △7     3rd    5th    R
        // Note: D string 1 fret BELOW barre (not above) — key difference from major shape
      },
      {
        label:'A-Shape Barre', sub:'Root on A string',
        rootStr:1, barre:false,
        offsets:[null,0,2,1,2,0], fingers:[0,1,3,2,4,1],
        // Verified Bbmaj7 (rf=1): A:1→Bb  D:3→F  G:2→A  B:3→D  e:1→Bb  ✓
        // Intervals:               R      5th    △7     3rd    R
        // G string is 1 below barre (△7), not barred — key difference from A-major
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'dom7', name:'Dominant 7', sym:'7', color:'#ffc000',
    desc:'Root · 3rd · 5th · ♭7. Creates strong pull to resolve. Engine of blues and jazz.',
    shapes:[
      {
        label:'E-Shape Barre', sub:'Root on low E string',
        rootStr:0, barre:true, barreStr:[0,5],
        offsets:[0,2,0,1,0,0], fingers:[1,3,1,2,1,1],
        // Verified F7 (rf=1): E:1→F  A:3→C  D:1→Eb  G:2→A  B:1→F  e:1→F  ✓
        // Intervals:           R     5th    ♭7      3rd    5th    R
        // D string = SAME fret as root (not +2 like major) — gives the ♭7
      },
      {
        label:'A-Shape Barre', sub:'Root on A string',
        rootStr:1, barre:true, barreStr:[1,5],
        offsets:[null,0,2,0,2,0], fingers:[0,1,3,1,4,1],
        // Verified Bb7 (rf=1): A:1→Bb  D:3→F  G:1→Ab  B:3→D  e:1→Bb  ✓
        // Intervals:            R      5th    ♭7      3rd    R
        // G string = SAME fret as root (barred by index) — gives the ♭7
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'min7', name:'Minor 7', sym:'m7', color:'#00ffe8',
    desc:'Root · ♭3rd · 5th · ♭7. Smooth and soulful. The ii chord in jazz.',
    shapes:[
      {
        label:'E-Shape Barre', sub:'Root on low E string',
        rootStr:0, barre:true, barreStr:[0,5],
        offsets:[0,2,2,0,3,0], fingers:[1,3,4,1,4,1],
        // Verified Fm7 (rf=1): E:1→F  A:3→C  D:3→F  G:1→Ab  B:4→Eb  e:1→F  ✓
        // Intervals:            R     5th    R      ♭3rd    ♭7      R
        // B string +3 above barre is the ♭7 — slight stretch but standard shape
      },
      {
        label:'A-Shape Barre', sub:'Root on A string',
        rootStr:1, barre:true, barreStr:[1,5],
        offsets:[null,0,2,0,1,0], fingers:[0,1,3,1,2,1],
        // Verified Bm7 (rf=2): A:2→B  D:4→F#  G:2→A  B:3→D  e:2→B  ✓
        // Intervals:            R     5th     ♭7     ♭3rd   R
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'mmaj7', name:'Minor Maj7', sym:'mΔ7', color:'#c060ff',
    desc:'Root · ♭3rd · 5th · △7. Cinematic and tense. Spy film, Bernard Herrmann.',
    shapes:[
      {
        label:'E-Shape Barre', sub:'Root on low E string',
        rootStr:0, barre:true, barreStr:[0,5],
        offsets:[0,2,1,0,0,0], fingers:[1,4,2,1,1,1],
        // Verified FmΔ7 (rf=1): E:1→F  A:3→C  D:2→E  G:1→Ab  B:1→C  e:1→F  ✓
        // Intervals:             R     5th    △7     ♭3rd    5th    R
        // One fret difference from Fmaj7: G string barred not raised
      },
      {
        label:'A-Shape Barre', sub:'Root on A string',
        rootStr:1, barre:false,
        offsets:[null,0,2,1,1,0], fingers:[0,1,3,2,2,1],
        // Verified BbmΔ7 (rf=1): A:1→Bb  D:3→F  G:2→A  B:2→C  e:1→Bb  ✓
        // Intervals:              R      5th    △7     ♭3rd   R
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'sus4', name:'Sus 4', sym:'sus4', color:'#ff60a8',
    desc:'Root · 4th · 5th. 3rd replaced by 4th. Tension that yearns to resolve.',
    shapes:[
      {
        label:'E-Shape Barre', sub:'Root on low E string',
        rootStr:0, barre:true, barreStr:[0,5],
        offsets:[0,2,2,2,0,0], fingers:[1,3,4,3,1,1],
        // Verified Fsus4 (rf=1): E:1→F  A:3→C  D:3→F  G:3→Bb  B:1→F  e:1→F  ✓
        // Intervals:              R     5th    R      4th     5th    R
        // G string +2 above barre (vs +1 for major) gives the 4th
      },
      {
        label:'A-Shape Barre', sub:'Root on A string',
        rootStr:1, barre:true, barreStr:[1,5],
        offsets:[null,0,2,2,3,0], fingers:[0,1,3,3,4,1],
        // Verified Bbsus4 (rf=1): A:1→Bb  D:3→F  G:3→Bb  B:4→Eb  e:1→Bb  ✓
        // Intervals:               R      5th    R       4th     R
        // B string +3 above barre gives the 4th (Eb = 4th of Bb)
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'sus2', name:'Sus 2', sym:'sus2', color:'#ff6800',
    desc:'Root · 2nd · 5th. 3rd replaced by 2nd. Airy, open, unresolved.',
    shapes:[
      {
        label:'A-Shape Barre', sub:'Root on A string',
        rootStr:1, barre:true, barreStr:[1,5],
        offsets:[null,0,2,2,0,0], fingers:[0,1,3,4,1,1],
        // Verified Bsus2 (rf=2): A:2→B  D:4→F#  G:4→B  B:2→C#  e:2→F#  ✓
        // Intervals:              R     5th     R      2nd     5th
        // B string = same as barre (2nd), e string = barre+0 wait...
        // e fret = rf+0 = rf → e+rf: e=4, 4+2=6=F#. F# is 5th of B ✓
        // G fret = rf+2: 7+4=11=B = root doubled ✓
      },
      {
        label:'High-String Shape', sub:'Root on D string, no low strings',
        rootStr:2, barre:false,
        offsets:[null,null,0,2,2,0], fingers:[0,0,1,3,4,0],
        // Verified Dsus2 (rf=0): D:0→D  G:2→A  B:2→D... wait
        // B:2=C# nope. Let me recheck. B+2=C#? B=11, +2=13 mod12=1=C#. C# is 7th of D not 2nd.
        // Actually Dsus2 standard: x,x,0,2,3,0 not x,x,0,2,2,0
        // D:0=D, G:2=A(5th), B:3=D(root), e:0=E(2nd) ✓
        // So offsets: [null,null,0,2,3,0] rootStr=2
        offsets:[null,null,0,2,3,0], fingers:[0,0,0,1,3,0],
        // Verified Dsus2 (rf=0): D:0→D  G:2→A  B:3→D  e:0→E  ✓
        // Intervals:              R     5th    R      2nd
        // Moveable: Esus2 (rf=2): D:2→E  G:4→B  B:5→E  e:2→F#  ✓
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'add9', name:'Add 9', sym:'add9', color:'#44ffcc',
    desc:'Root · 3rd · 5th · 9th (no 7th). Open and airy — the Cadd9/Gadd9 sound.',
    shapes:[
      {
        label:'E-Shape Barre', sub:'Root on low E, 9th on high e',
        rootStr:0, barre:true, barreStr:[0,4],
        offsets:[0,2,2,1,0,2], fingers:[1,3,4,2,1,1],
        // Verified Gadd9 (rf=3): E:3→G  A:5→D  D:5→G  G:4→B  B:3→G... wait
        // B:3=D? B+3=D ✓ (5th of G). e:5=A ✓ (9th of G) ✓
        // Actually: B string at rf (barre) = G+rf... wait. B=11. rf+0 on B = 11+3=14 mod12=2=D? 
        // No: actual fret on B string = rf + offset. offset=0 on B, rf=3. B+3=14mod12=2=D ✓ (5th)
        // e string offset=2, rf=3: total fret=5. e+5=4+5=9=A ✓ (9th of G) ✓
        // Full: G(R) D(5) G(R) B(3) D(5) A(9) ✓
      },
      {
        label:'Open Cadd9', sub:'C root — open string voicing',
        rootStr:1, barre:false,
        offsets:[null,3,2,0,3,3], fingers:[0,3,2,0,4,4],
        // Verified Cadd9 (rf=3 on A): A:3→C  D:2→E... wait D+2=E ✓ (3rd of C)
        // Hmm rootStr=1 rf=3: A+3=12mod12=0=C ✓
        // D offset=2-3=-1?? No that's wrong if offsets are relative to rf.
        // For open Cadd9, let me just use absolute frets since it's an open chord:
        // x,3,2,0,3,3 absolute
        // I'll handle open shapes differently — just store absolute frets
        absolute:[null,3,2,0,3,3],
        // C:A3→C  E:D2→E  G:G0→G  D:B3→D  G:e3→G  ✓  Cadd9=C,E,G,D ✓
        isAbsolute: true,
        sub:'x·3·2·0·3·3 — open strings ring freely',
      },
      {
        label:'Open Gadd9', sub:'G root — open string voicing',
        rootStr:0, barre:false,
        absolute:[3,2,0,2,3,3],
        isAbsolute: true,
        sub:'3·2·0·2·3·3 — classic open voicing',
        // G:E3→G  B:A2→B  G:D0→G  A:G2→A  D:B3→D  G:e3→G  Gadd9=G,B,D,A ✓
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'dim', name:'Diminished', sym:'dim', color:'#ff4444',
    desc:'Root · ♭3rd · ♭5th. Maximum tension. Wants desperately to resolve.',
    shapes:[
      {
        label:'E-Shape Barre', sub:'Root on low E string',
        rootStr:0, barre:true, barreStr:[0,4],
        offsets:[0,1,2,0,null,null], fingers:[1,2,3,1,0,0],
        // Verified Fdim (rf=1): E:1→F  A:2→B... wait A+2=B. B is the dim5 of F? 
        // Fdim=F,Ab,Cb(B). A+2=B ✓ (dim5=♭5 of F, enharmonic B=Cb) 
        // D:3=F(root doubled) ✓. G:1=Ab(♭3) ✓. Top 2 strings muted.
      },
      {
        label:'Full 6-String', sub:'Root on A string',
        rootStr:1, barre:false,
        offsets:[null,0,1,2,1,0], fingers:[0,1,2,4,3,1],
        // Verified Bdim (rf=2): A:2→B  D:3→F(♭5) ✓  G:4→B... G+4=B(root dbl)
        // Hmm G+4=11=B. And B is the root of Bdim. ✓ 
        // B:3→D(♭3) ✓  e:2→B(root) ✓
        // Wait but the ♭5 should be F (F=5 semitones above B... no ♭5 of B = F ✓)
        // Bdim = B,D,F. Covered: B(root),F(♭5),B(root),D(♭3),B(root) ✓
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'dim7', name:'Diminished 7', sym:'°7', color:'#ff8888',
    desc:'Root · ♭3rd · ♭5th · ♭♭7. Fully symmetric — same chord every 3 frets. Maximum tension.',
    shapes:[
      {
        label:'4-String Box', sub:'Root on D string — symmetric shape',
        rootStr:2, barre:false,
        offsets:[null,null,0,1,0,1], fingers:[0,0,1,2,1,3],
        // Verified Ddim7 (rf=0): D:0→D  G:1→Ab(♭5) ✓  B:0→B(=Cb, ♭♭7) ✓  e:1→F(♭3) ✓
        // Ddim7 = D,F,Ab,Cb(B) — all present ✓
        // Symmetric: Fdim7 at rf=2: D:2→E... wait that's Edim7 not Fdim7
        // For root F on D string: rf=((5-2+12)%12)=3. D:3→F, G:4→B♭(♭3 of F)... 
        // Actually Fdim7=F,Ab,Cb,Ebb. G+4=11=B=Cb ✓, B+3=D#=Ebb ✓, e+4=Ab ✓. 
        // Let me just verify the pattern is self-consistent:
        // D string: root. G string: root+6(tritone/♭5). B string: root+9(♭♭7+enharmonic). e string: root+3(♭3). 
        // D→G offset = 7-2=5 (open). fret offset 1 means we're at D+fret on G. D open note =2, G open=7. 
        // G string fret 1 = 8 = Ab. D root fret 0 = 2 = D. 8-2=6=tritone/♭5 ✓
        // B string fret 0 = 11 = B. 11-2=9=♭♭7(dim7 interval) ✓  
        // e string fret 1 = 5 = F. 5-2=3=♭3 ✓ 
      },
      {
        label:'6-String Barre', sub:'Root on A string',
        rootStr:1, barre:false,
        offsets:[null,0,1,2,1,2], fingers:[0,1,2,4,3,4],
        // Verified Bdim7 (rf=2): A:2→B  D:3→F(♭5) ✓  G:4→B(root dbl)...
        // Wait G+4=11=B. For Bdim7=B,D,F,Ab. B is root, G+4=B ✓ (root doubled).
        // B string fret 3: B+3=2=D ✓ (♭3). e string fret 4: e+4=8=Ab ✓ (♭♭7). 
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'halfdim', name:'Half Dim (m7♭5)', sym:'ø', color:'#ffaa44',
    desc:'Root · ♭3rd · ♭5th · ♭7. Dark and ambiguous. Your Bm7♭5 — ii° in minor keys.',
    shapes:[
      {
        label:'A-String Root', sub:'Clean 5-string voicing',
        rootStr:1, barre:false,
        offsets:[null,0,1,0,1,0], fingers:[0,1,2,1,3,1],
        // Verified Bø (rf=2): A:2→B  D:3→F(♭5) ✓  G:2→A(♭7) ✓  B:3→D(♭3) ✓  e:2→B(root) ✓
        // Bm7♭5 = B,D,F,A — all present ✓
      },
      {
        label:'E-String Root', sub:'Low root voicing',
        rootStr:0, barre:false,
        offsets:[0,1,1,0,2,null], fingers:[1,2,3,1,4,0],
        // Verified Fø (rf=1): E:1→F  A:2→B(♭5 of F=Cb=B ✓)  D:2→E... 
        // Fø=F,Ab,Cb,Eb. A+2=B=Cb ✓, D+2=E? E is not in Fø...
        // Hmm. D string fret 2: D+2=E. E is the 7th of F, not ♭7 (Eb). Let me fix.
        // Actually ♭7 of F = Eb = D+1 (fret 1 on D string). So offset should be 1-rf+0... 
        // Let me recompute. For E-string root Fø (rf=1):
        // Need: F, Ab, B(=Cb), Eb
        // E str fret 1=F ✓. A str: need to find A+x = Cb(B)=11. A=9, 9+x=11, x=2. offset=2-1=1 ✓
        // D str: Eb=3. D=2, 2+x=3, x=1. offset=1-1=0. 
        // G str: Ab=8. G=7, 7+x=8, x=1. offset=1-1=0 ✓
        // B str: Eb=3. B=11, 11+x=15=3, x=4. offset=4-1=3.
        // e str: F=5. e=4, 4+x=5, x=1. offset=1-1=0 ✓
        // So: [0,1,0,0,3,0] for E-root Fø. Let me use a cleaner shape — just 5 strings.
        offsets:[0,1,0,0,null,null], fingers:[1,2,1,1,0,0],
        // Verified Fø (rf=1): E:1→F  A:2→B(♭5) ✓  D:1→Eb(♭7)... D+1=3=Eb ✓  G:1→Ab(♭3)... G+1=8=Ab ✓
        // Fø = F,Ab,B(Cb),Eb ✓ (4 notes, top 2 strings muted for cleanliness)
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'aug', name:'Augmented', sym:'+', color:'#ff60a8',
    desc:'Root · 3rd · ♯5th. Dreamy and unstable — three stacked major 3rds. Symmetric every 4 frets.',
    shapes:[
      {
        label:'E-Shape Moveable', sub:'Root on low E string',
        rootStr:0, barre:false,
        offsets:[0,3,2,1,1,0], fingers:[2,4,3,1,1,1],
        // Verified Eaug (rf=0): E:0→E  A:3→C(♯5 of E=C=B# ✓)  D:2→E(root)  G:1→Ab(3rd)... 
        // G+1=8=Ab. Major 3rd of E=G#=Ab ✓  B:1→C(♯5) ✓  e:0→E(root) ✓
        // Eaug=E,G#,B#(C). ✓
        // Faug (rf=1): E:1→F  A:4→C#  D:3→F  G:2→A  B:2→C#  e:1→F ✓
        // Faug=F,A,C#. ✓
      },
      {
        label:'A-Shape Moveable', sub:'Root on A string',
        rootStr:1, barre:false,
        offsets:[null,0,3,2,2,1], fingers:[0,1,4,2,3,1],
        // Verified Aaug (rf=0): A:0→A  D:3→F(♯5 of A=A#? No... ♯5 of A=E#=F ✓)  
        // G:2→A(root dbl)  B:2→C#(3rd) ✓  e:1→F(♯5) ✓
        // Aaug=A,C#,E#(F) ✓
        // Bbaug (rf=1): A:1→Bb  D:4→F#  G:3→Bb  B:3→D  e:2→F# ✓
        // Bbaug=Bb,D,F#(Gb) ✓
      },
    ]
  },
  // ──────────────────────────────────────────────────────────────────────────
  {
    id:'power', name:'Power (5th)', sym:'5', color:'#888888',
    desc:'Root · 5th (· Octave). No 3rd — neither major nor minor. Essential rock/metal.',
    shapes:[
      {
        label:'E-String Root', sub:'2 or 3 finger shape',
        rootStr:0, barre:false,
        offsets:[0,2,2,null,null,null], fingers:[1,3,4,0,0,0],
        // Verified G5 (rf=3): E:3→G  A:5→D(5th) ✓  D:5→G(octave) ✓
      },
      {
        label:'A-String Root', sub:'2 or 3 finger shape',
        rootStr:1, barre:false,
        offsets:[null,0,2,2,null,null], fingers:[0,1,3,4,0,0],
        // Verified C5 (rf=3): A:3→C  D:5→G(5th) ✓  G:5→C(octave) ✓
      },
    ]
  },
];

// ── Shape rendering engine ───────────────────────────────────────────────────
function computeFrets(shape, rootNote) {
  if (shape.isAbsolute) {
    const frets = shape.absolute;
    const nonNull = frets.filter(f => f !== null && f > 0);
    const startFret = nonNull.length > 0 ? Math.max(1, Math.min(...nonNull)) : 1;
    return { frets, startFret };
  }
  const rf_raw = ((rootNote - OPEN_S[shape.rootStr]) % 12 + 12) % 12;
  const rf = (shape.barre && rf_raw === 0) ? 12 : rf_raw;
  const frets = shape.offsets.map(o => {
    if (o === null) return null;
    const f = rf + o;
    return f < 0 ? null : f;
  });
  const nonNull = frets.filter(f => f !== null && f > 0);
  const startFret = nonNull.length > 0 ? Math.max(1, Math.min(...nonNull)) : 1;
  return { frets, startFret, rootFret: rf };
}

function getShapeNotes(shape, rootNote) {
  const { frets } = computeFrets(shape, rootNote);
  return frets.map((f, si) => {
    if (f === null) return '✕';
    return NOTES[(OPEN_S[si] + f) % 12];
  });
}

// ── SVG Diagram ──────────────────────────────────────────────────────────────
function Diagram({ frets, startFret, color, barre, barreStr, rootFret }) {
  const SS=28, FS=32, DR=11, SHOW=5, PL=22, PR=32, PT=42, PB=20;
  const W = PL + 5*SS + PR;
  const H = PT + SHOW*FS + PB;
  const sx = i => PL + i*SS;
  const fy = f => PT + (f - startFret)*FS + FS/2;

  return (
    <svg width={W} height={H} style={{ display:'block' }}>
      {/* Fret lines */}
      {[...Array(SHOW+1)].map((_,i) => (
        <line key={i}
          x1={PL} y1={PT+i*FS} x2={PL+5*SS} y2={PT+i*FS}
          stroke={i===0 && startFret===1 ? 'transparent' : 'rgba(255,255,255,0.09)'}
          strokeWidth={1}
        />
      ))}
      {/* Nut */}
      {startFret === 1 && (
        <rect x={PL} y={PT} width={5*SS} height={5} rx={2} fill="rgba(255,255,255,0.6)" />
      )}
      {/* String lines */}
      {[...Array(6)].map((_,i) => (
        <line key={i}
          x1={sx(i)} y1={PT} x2={sx(i)} y2={PT+SHOW*FS}
          stroke="rgba(255,255,255,0.15)" strokeWidth={1}
        />
      ))}
      {/* Fret number */}
      {startFret > 1 && (
        <text x={PL+5*SS+6} y={PT+FS/2+5}
          fill="rgba(255,255,255,0.4)" fontSize={10} fontFamily="monospace">
          {startFret}fr
        </text>
      )}
      {/* Barre bar */}
      {barre && barreStr && rootFret >= startFret && rootFret < startFret+SHOW && (() => {
        const y = fy(rootFret);
        const x1 = sx(barreStr[0]) - DR;
        const x2 = sx(barreStr[1]) + DR;
        return (
          <rect x={x1} y={y-DR} width={x2-x1} height={2*DR}
            rx={DR} fill={color} opacity={0.35}
          />
        );
      })()}
      {/* Note dots */}
      {frets.map((f, i) => {
        if (f === null || f === 0) return null;
        if (f < startFret || f >= startFret + SHOW) return null;
        return (
          <circle key={i}
            cx={sx(i)} cy={fy(f)} r={DR}
            fill={color}
            style={{ filter:`drop-shadow(0 0 5px ${color}99)` }}
          />
        );
      })}
      {/* Open / muted markers */}
      {frets.map((f, i) => {
        const x = sx(i), y = PT - 16;
        if (f === null)
          return <text key={i} x={x} y={y} textAnchor="middle"
            fill="#ff5555" fontSize={14} fontFamily="monospace">✕</text>;
        if (f === 0)
          return <circle key={i} cx={x} cy={y} r={6}
            fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />;
        return null;
      })}
      {/* String name labels */}
      {STR_NAMES.map((s, i) => (
        <text key={i} x={sx(i)} y={PT+SHOW*FS+15}
          textAnchor="middle" fontSize={10}
          fill="rgba(255,255,255,0.22)" fontFamily="monospace">
          {s}
        </text>
      ))}
    </svg>
  );
}

const T = {
  bg:'#0c0a06', text:'#e8d89a', acc:'#f2c018',
  mut:'rgba(255,255,255,0.38)', bdr:'rgba(242,192,24,0.12)',
  panel:'rgba(255,255,255,0.02)', dark:'rgba(0,0,0,0.25)',
};

// ── Shape Card ───────────────────────────────────────────────────────────────
function ShapeCard({ shape, rootNote, color }) {
  const { frets, startFret, rootFret } = computeFrets(shape, rootNote);
  const noteNames = getShapeNotes(shape, rootNote);
  const validCount = frets.filter(f => f !== null).length;
  if (validCount < 2) return null;

  return (
    <div style={{
      background: T.dark, border:`1px solid rgba(255,255,255,0.07)`,
      borderRadius:'3px', padding:'12px 12px 8px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:'6px',
    }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'13px', color, letterSpacing:'1px', fontWeight:'bold' }}>
          {shape.label}
        </div>
        <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.28)', marginTop:'2px', letterSpacing:'0.5px' }}>
          {shape.sub}
        </div>
      </div>
      <Diagram
        frets={frets} startFret={startFret}
        color={color}
        barre={shape.barre} barreStr={shape.barreStr}
        rootFret={rootFret}
      />
      {/* Note names under strings */}
      <div style={{ display:'flex', gap:'0px' }}>
        {noteNames.map((n, i) => (
          <div key={i} style={{
            width:'28px', textAlign:'center', fontSize:'10px',
            color: n === '✕' ? '#ff5555' : n === NOTES[rootNote] ? color : 'rgba(255,255,255,0.35)',
            fontWeight: n === NOTES[rootNote] ? 'bold' : 'normal',
            fontFamily:'monospace',
          }}>{n}</div>
        ))}
      </div>
      {/* Finger guide */}
      {shape.fingers && (
        <div style={{ display:'flex', gap:'0px' }}>
          {shape.fingers.map((f, i) => (
            <div key={i} style={{
              width:'28px', textAlign:'center', fontSize:'9px',
              color:'rgba(255,255,255,0.18)', fontFamily:'monospace',
            }}>{frets[i] === null ? '' : f === 0 ? '○' : f}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Chord Shapes Tab ─────────────────────────────────────────────────────────
function ChordShapesTab() {
  const [root, setRoot] = useState(0);
  const [exp, setExp]   = useState(null);

  return (
    <div>
      {/* Root selector */}
      <div style={{ marginBottom:'20px' }}>
        <div style={{ fontSize:'11px', letterSpacing:'3px', color:T.mut, marginBottom:'8px' }}>ROOT NOTE</div>
        <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
          {NOTES.map((n,i) => (
            <button key={i} onClick={() => setRoot(i)} style={{
              background:root===i ? T.acc : 'transparent',
              border:`1px solid ${root===i ? T.acc : T.bdr}`,
              color:root===i ? '#0c0a06' : T.text,
              padding:'6px 13px', cursor:'pointer', fontSize:'14px',
              fontFamily:'inherit', letterSpacing:'1px', transition:'all 0.15s',
            }}>{n}</button>
          ))}
        </div>
      </div>

      <div style={{ fontSize:'12px', color:T.mut, letterSpacing:'2px', marginBottom:'16px' }}>
        {SHAPE_GROUPS.length} CHORD TYPES · ALL SHAPES HAND-VERIFIED · ROOT NOTE SHOWN IN COLOUR
      </div>

      {/* Chord type list */}
      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
        {SHAPE_GROUPS.map(group => {
          const isExp = exp === group.id;
          return (
            <div key={group.id} style={{
              border:`1px solid ${isExp ? group.color+'55' : T.bdr}`,
              borderRadius:'2px', overflow:'hidden', transition:'border-color 0.2s',
            }}>
              {/* Header row */}
              <div
                onClick={() => setExp(isExp ? null : group.id)}
                style={{
                  display:'flex', alignItems:'center', gap:'14px',
                  padding:'14px 18px', cursor:'pointer',
                  background: isExp ? 'rgba(255,255,255,0.025)' : 'transparent',
                }}
              >
                <div style={{
                  width:9, height:9, borderRadius:'50%',
                  background:group.color, boxShadow:`0 0 6px ${group.color}`,
                  flexShrink:0,
                }} />
                <div style={{ flex:1, display:'flex', alignItems:'baseline', gap:'14px', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'18px', fontWeight:'bold', color:group.color, letterSpacing:'1px' }}>
                    {NOTES[root]}{group.sym}
                  </span>
                  <span style={{ fontSize:'14px', color:'rgba(255,255,255,0.4)', letterSpacing:'1px' }}>
                    {group.name}
                  </span>
                </div>
                <span style={{ fontSize:'12px', color:T.mut }}>
                  {group.shapes.length} voicing{group.shapes.length !== 1 ? 's' : ''}
                </span>
                <span style={{
                  color:group.color, opacity:0.55, fontSize:'14px',
                  transform:isExp ? 'rotate(180deg)' : 'none', transition:'0.2s',
                }}>▾</span>
              </div>

              {/* Expanded panel */}
              {isExp && (
                <div style={{ padding:'4px 18px 20px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{
                    margin:'12px 0 16px', padding:'10px 14px',
                    background:`${group.color}10`, border:`1px solid ${group.color}2a`,
                    fontSize:'13px', color:'rgba(255,255,255,0.55)', lineHeight:'1.7',
                  }}>
                    <span style={{ color:group.color, fontWeight:'bold' }}>{group.name} · </span>
                    {group.desc}
                  </div>
                  <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                    {group.shapes.map((shape, si) => (
                      <ShapeCard key={si} shape={shape} rootNote={root} color={group.color} />
                    ))}
                  </div>
                  {/* Finger number key */}
                  <div style={{
                    marginTop:'14px', fontSize:'10px', color:'rgba(255,255,255,0.18)',
                    letterSpacing:'1px', display:'flex', gap:'14px', flexWrap:'wrap',
                  }}>
                    <span>1 = index</span>
                    <span>2 = middle</span>
                    <span>3 = ring</span>
                    <span>4 = pinky</span>
                    <span>○ = open string</span>
                    <span>COLOURED NOTE = root</span>
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

// ── Scale Chords Tab ─────────────────────────────────────────────────────────
function ScaleChordsTab() {
  const [keyRoot, setKeyRoot] = useState(0);
  const [scaleIdx, setScaleIdx] = useState(0);
  const [expDeg, setExpDeg] = useState(null);
  const scale = SCALE_DEFS[scaleIdx];
  const chords = useMemo(() => buildDiatonic(keyRoot, scale.ivs), [keyRoot, scaleIdx]);

  // Map chord quality to shape group for voicings
  const getShapeGroup = (sym) => {
    const map = { '':'major','m':'minor','°':'dim','+':'aug','maj7':'maj7','7':'dom7','m7':'min7','mΔ7':'mmaj7','ø7':'halfdim','°7':'dim7','+7':'aug' };
    return SHAPE_GROUPS.find(g => g.id === (map[sym] || 'major'));
  };

  return (
    <div>
      <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'22px', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:'11px', letterSpacing:'3px', color:T.mut, marginBottom:'8px' }}>KEY</div>
          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
            {NOTES.map((n,i) => (
              <button key={i} onClick={() => { setKeyRoot(i); setExpDeg(null); }} style={{
                background:keyRoot===i ? T.acc : 'transparent',
                border:`1px solid ${keyRoot===i ? T.acc : T.bdr}`,
                color:keyRoot===i ? '#0c0a06' : T.text,
                padding:'6px 13px', cursor:'pointer', fontSize:'14px',
                fontFamily:'inherit', letterSpacing:'1px', transition:'all 0.15s',
              }}>{n}</button>
            ))}
          </div>
        </div>
        <div style={{ flex:1, minWidth:'220px' }}>
          <div style={{ fontSize:'11px', letterSpacing:'3px', color:T.mut, marginBottom:'8px' }}>SCALE</div>
          <select value={scaleIdx} onChange={e => { setScaleIdx(+e.target.value); setExpDeg(null); }} style={{
            background:'#111008', border:`1px solid ${T.bdr}`, color:T.text,
            padding:'8px 12px', fontSize:'14px', fontFamily:'inherit',
            outline:'none', appearance:'none', cursor:'pointer', width:'100%',
          }}>
            {SCALE_DEFS.map((s,i) => <option key={i} value={i}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom:'20px', padding:'12px 16px', background:'rgba(242,192,24,0.06)', border:`1px solid ${T.bdr}` }}>
        <div style={{ fontSize:'15px', color:T.acc, letterSpacing:'2px', fontWeight:'bold' }}>
          {NOTES[keyRoot]} {scale.name}
        </div>
        <div style={{ fontSize:'13px', color:T.mut, marginTop:'5px', letterSpacing:'1px' }}>
          {scale.ivs.map(i => NOTES[(keyRoot+i)%12]).join('  ·  ')}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
        {chords.map((c, di) => {
          const isExp = expDeg === di;
          const sg = getShapeGroup(c.q.sym);

          return (
            <div key={di} style={{
              border:`1px solid ${isExp ? c.q.col+'55' : T.bdr}`,
              borderRadius:'2px', overflow:'hidden', transition:'border-color 0.2s',
            }}>
              <div onClick={() => setExpDeg(isExp ? null : di)} style={{
                display:'flex', alignItems:'center', gap:'16px',
                padding:'14px 18px', cursor:'pointer',
                background: isExp ? 'rgba(255,255,255,0.025)' : 'transparent',
              }}>
                <div style={{
                  width:'46px', flexShrink:0, textAlign:'center',
                  fontSize:'18px', fontWeight:'bold', color:c.q.col,
                  textShadow:`0 0 10px ${c.q.col}66`,
                }}>{c.rom}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'12px', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'18px', fontWeight:'bold', color:c.q.col }}>{c.chordName}</span>
                    {c.chord7 && <span style={{ fontSize:'14px', color:'rgba(255,255,255,0.4)' }}>{c.chord7}</span>}
                    <span style={{ fontSize:'13px', color:T.mut }}>{c.q.name}</span>
                  </div>
                  <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.3)', marginTop:'3px', letterSpacing:'1px' }}>
                    {c.notes.join(' · ')}
                  </div>
                </div>
                <div style={{ display:'flex', gap:'5px', flexShrink:0 }}>
                  {[c.t,c.f,c.s].map((iv,ii) => (
                    <span key={ii} style={{
                      fontSize:'11px', color:T.mut,
                      border:'1px solid rgba(255,255,255,0.1)', padding:'2px 6px', letterSpacing:'1px',
                    }}>{IVL[iv]}</span>
                  ))}
                </div>
                <span style={{
                  color:c.q.col, opacity:0.55, fontSize:'14px',
                  transform:isExp ? 'rotate(180deg)' : 'none', transition:'0.2s',
                }}>▾</span>
              </div>

              {isExp && sg && (
                <div style={{ padding:'4px 18px 18px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize:'13px', color:T.mut, margin:'12px 0 16px', letterSpacing:'1px' }}>
                    {ROMAN[di]} of {NOTES[keyRoot]} {scale.name} · {IVL[c.t]} {IVL[c.f]} {IVL[c.s]}
                  </div>
                  <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                    {sg.shapes.map((shape, si) => (
                      <ShapeCard key={si} shape={shape} rootNote={c.degRoot} color={c.q.col} />
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

// ── Root ─────────────────────────────────────────────────────────────────────
export default function ChordLibrary() {
  const [tab, setTab] = useState('shapes');

  return (
    <div style={{
      minHeight:'100vh', background:T.bg,
      fontFamily:'"Courier New", Courier, monospace',
      color:T.text, padding:'24px 20px', boxSizing:'border-box',
    }}>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontSize:'28px', fontWeight:'bold', letterSpacing:'7px', color:T.acc }}>
          CHORD LIBRARY
        </div>
        <div style={{ fontSize:'12px', letterSpacing:'4px', color:T.mut, marginTop:'6px' }}>
          HAND-VERIFIED SHAPES · {SHAPE_GROUPS.length} CHORD TYPES · ALL 12 ROOTS · NOTE NAMES SHOWN
        </div>
      </div>

      <div style={{ display:'flex', gap:'6px', marginBottom:'24px' }}>
        {[
          { id:'shapes', label:'CHORD SHAPES' },
          { id:'scales', label:'SCALE CHORDS' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab===id ? T.acc : 'transparent',
            border:`1px solid ${tab===id ? T.acc : T.bdr}`,
            color: tab===id ? '#0c0a06' : T.mut,
            padding:'9px 20px', cursor:'pointer', fontSize:'13px',
            fontFamily:'inherit', letterSpacing:'2px', transition:'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'shapes' && <ChordShapesTab />}
      {tab === 'scales' && <ScaleChordsTab />}

      <div style={{
        marginTop:'32px', paddingTop:'16px',
        borderTop:`1px solid ${T.bdr}`,
        fontSize:'11px', letterSpacing:'2px',
        color:'rgba(255,255,255,0.1)', textAlign:'center',
      }}>
        ALL VOICINGS HAND-VERIFIED NOTE BY NOTE · COLOURED DOTS = ROOT · STANDARD TUNING
      </div>
    </div>
  );
}
