import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { addCard } from "./srs";

/* ═══════════ THEME ═══════════ */
const LIGHT_TH={bg:"#f7f5f0",bgAlt:"#efece5",surface:"#ffffff",border:"#e4ded4",borderLight:"#ece8e0",borderAccent:"rgba(232,148,10,0.25)",text:"#2a2a3a",textSecondary:"#5c5c6c",textMuted:"#8a8a96",textFaint:"#b0aeb8",accent:"#e8940a",accentLight:"#f5a623",accentBg:"rgba(245,166,35,0.07)",accentBgStrong:"rgba(245,166,35,0.13)",accentText:"#c47a00",purple:"#6366f1",green:"#22c55e",red:"#ef4444",pink:"#ec4899",cyan:"#06b6d4",greenBg:"rgba(34,197,94,0.06)",redBg:"rgba(239,68,68,0.06)",topBar:"rgba(247,245,240,0.95)",shadow:"0 1px 4px rgba(0,0,0,0.05)",cardShadow:"0 1px 8px rgba(0,0,0,0.04)"};
const DARK_TH={bg:"#111114",bgAlt:"#161619",surface:"#1c1c21",border:"#2c2c38",borderLight:"#222229",borderAccent:"rgba(245,166,35,0.3)",text:"#e2e2ec",textSecondary:"#9898b0",textMuted:"#606078",textFaint:"#38384a",accent:"#f5a623",accentLight:"#f5a623",accentBg:"rgba(245,166,35,0.12)",accentBgStrong:"rgba(245,166,35,0.18)",accentText:"#f5a623",purple:"#9b9ef8",green:"#4ade80",red:"#f87171",pink:"#f472b6",cyan:"#22d3ee",greenBg:"rgba(74,222,128,0.09)",redBg:"rgba(248,113,113,0.09)",topBar:"rgba(17,17,20,0.97)",shadow:"0 1px 4px rgba(0,0,0,0.35)",cardShadow:"0 1px 8px rgba(0,0,0,0.3)"};
let TH=LIGHT_TH;
const AC=[TH.accentLight,TH.purple,TH.green,TH.red,TH.pink,TH.cyan];

/* ═══════════ Unicode Math Formatter ═══════════ */
const SUP={"0":"\u2070","1":"\u00B9","2":"\u00B2","3":"\u00B3","4":"\u2074","5":"\u2075","6":"\u2076","7":"\u2077","8":"\u2078","9":"\u2079","n":"\u207F","x":"\u02E3","y":"\u02B8","a":"\u1D43","b":"\u1D47","c":"\u1D9C","d":"\u1D48","e":"\u1D49","f":"\u1DA0","g":"\u1D4D","h":"\u02B0","i":"\u2071","j":"\u02B2","k":"\u1D4F","l":"\u02E1","m":"\u1D50","o":"\u1D52","p":"\u1D56","r":"\u02B3","s":"\u02E2","t":"\u1D57","u":"\u1D58","v":"\u1D5B","w":"\u02B7","z":"\u1DBB","+":"\u207A","-":"\u207B","(":"\u207D",")":"\u207E"};
const SUB_MAP={"0":"\u2080","1":"\u2081","2":"\u2082","3":"\u2083","4":"\u2084","5":"\u2085","6":"\u2086","7":"\u2087","8":"\u2088","9":"\u2089","a":"\u2090","e":"\u2091","o":"\u2092","x":"\u2093","h":"\u2095","k":"\u2096","l":"\u2097","m":"\u2098","n":"\u2099","p":"\u209A","s":"\u209B","t":"\u209C","i":"\u1D62","r":"\u1D63","u":"\u1D64","v":"\u1D65","j":"\u2C7C","+":"\u208A","-":"\u208B","(":"\u208D",")":"\u208E","=":"\u208C"};

function formatMath(text){
  if(!text||typeof text!=="string")return text;
  let s=text;
  /* Protect **bold** and __underline__ markers from being mangled */
  const boldSafe=[];s=s.replace(/\*\*([^*]+)\*\*/g,(_,c)=>{boldSafe.push(c);return"\x00B"+boldSafe.length+"\x00";});
  const ulSafe=[];s=s.replace(/__([^_]+)__/g,(_,c)=>{ulSafe.push(c);return"\x00U"+ulSafe.length+"\x00";});
  /* Protect "value/time-unit" from fraction parser: $50M/año → $50M por año */
  s=s.replace(/\/(a\u00F1o|mes|d\u00EDa|trimestre|semestre|hora|minuto|segundo|unidad|acci\u00F3n|empleado|persona|cliente|usuario|trabajador)/gi," por $1");
  s=s.replace(/\/(year|month|day|quarter|semester|hour|minute|second|unit|share|employee|person|customer|user|worker)/gi," per $1");
  /* Convert [expr]/token → (expr)/(token) so the fraction renderer can pick it up.
     e.g. [f(x+h) − f(x)]/h  →  (f(x+h) − f(x))/(h)
     Excludes commas inside brackets so ∑[i=1,n] limit notation is not affected. */
  s=s.replace(/\[([^\],\[\]]+)\]\/\(([^)]+)\)/g,"($1)/($2)");
  s=s.replace(/\[([^\],\[\]]+)\]\/([a-zA-Z0-9\u03B1-\u03C9]+)/g,"($1)/($2)");
  /* Protect fractional exponents ^{n/d} and ^(n/d) before char-by-char mapping mangles them.
     Restore as ^(n⁄d) using U+2044 FRACTION SLASH so processFractions (which only checks ASCII /)
     will leave them alone; processExponents renders them as a tiny stacked superscript fraction. */
  const fracExpProtect=[];
  s=s.replace(/\^\{([^}]*\/[^}]*)\}/g,(_,inner)=>{fracExpProtect.push(inner);return"\x00FX"+fracExpProtect.length+"\x00";});
  s=s.replace(/\^\(([^)]*\/[^)]*)\)/g,(_,inner)=>{fracExpProtect.push(inner);return"\x00FX"+fracExpProtect.length+"\x00";});
  s=s.replace(/\^{([^}]+)}/g,(_,i)=>i.split("").map(c=>SUP[c]||SUP[c.toLowerCase()]||c).join(""));
  s=s.replace(/\^([0-9a-zA-Z+\-()])/g,(_,c)=>SUP[c]||SUP[c.toLowerCase()]||c);
  s=s.replace(/_{([^}]+)}/g,(_,i)=>i.split("").map(c=>SUB_MAP[c]||SUB_MAP[c.toLowerCase()]||c).join(""));
  s=s.replace(/_([0-9a-zA-Z+\-()=])(?![a-zA-Z0-9])/g,(_,c)=>SUB_MAP[c]||SUB_MAP[c.toLowerCase()]||c);
  s=s.replace(/sqrt\{([^}]+)\}/gi,"\u221A{$1}");
  s=s.replace(/sqrt\(([^)]+)\)/gi,"\u221A{$1}");
  /* Convert bare √ followed by number/token into √{token} for MathText rendering */
  s=s.replace(/\u221A\(([^)]+)\)/g,"\u221A{$1}");
  s=s.replace(/\u221A\[([^\]]+)\]/g,"\u221A{$1}");
  s=s.replace(/\u221A(?!\{)([a-zA-Z0-9\u03B1-\u03C9\u00B2\u00B3]+)/g,"\u221A{$1}");
  s=s.replace(/\bsqrt\b/gi,"\u221A");
  s=s.replace(/>=/g,"\u2265");s=s.replace(/<=/g,"\u2264");s=s.replace(/!=/g,"\u2260");
  s=s.replace(/\+-/g,"\u00B1");
  /* Accent-aware boundary: \b treats áéíóúñü as non-word chars, breaking Spanish words.
     e.g. \bsum\b matches "sumás" (Argentine voseo). Use lookahead/lookbehind for accented chars. */
  const AB="(?<![a-zA-Z\u00C0-\u024F])";const AE="(?![a-zA-Z\u00C0-\u024F])";
  s=s.replace(new RegExp(AB+"pi"+AE,"g"),"\u03C0");s=s.replace(new RegExp(AB+"PI"+AE,"g"),"\u03C0");
  s=s.replace(/\binfinity\b/gi,"\u221E");s=s.replace(new RegExp(AB+"inf"+AE,"g"),"\u221E");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s*\*\s*([a-zA-Z0-9\u03B1-\u03C9(])/g,"$1\u00D7$2");
  /* "3 x 4" or "2 X n" where x/X is used as multiplication between a digit and another token.
     Only convert when there is a DIGIT on the LEFT to avoid mangling variable x in f(x), etc. */
  s=s.replace(/(\d)\s+[xX]\s+(\d)/g,"$1\u00A0\u00D7\u00A0$2");
  s=s.replace(/(\d)\s+[xX]\s+([a-wyzA-WYZ\u03B1-\u03C9])/g,"$1\u00A0\u00D7\u00A0$2");
  /* ── Prose rescue: last-resort catches for banned phrases ─── */
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+squared\b/gi,"$1\u00B2");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+cubed\b/gi,"$1\u00B3");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+times\s+([a-zA-Z0-9\u03B1-\u03C9(])/gi,"$1\u00A0\u00D7\u00A0$2");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+multiplied\s+by\s+([a-zA-Z0-9\u03B1-\u03C9(])/gi,"$1\u00A0\u00D7\u00A0$2");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9)%])\s+divided\s+by\s+([a-zA-Z0-9\u03B1-\u03C9(])/gi,"$1\u00A0\u00F7\u00A0$2");
  s=s.replace(/\bthe\s+square\s+root\s+of\s+([a-zA-Z0-9\u03B1-\u03C9]+)/gi,"\u221A{$1}");
  s=s.replace(/\blog\s+base\s+([a-zA-Z0-9]+)\s+of\s*/gi,"log_{$1}(");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+to\s+the\s+power\s+of\s+([a-zA-Z0-9]+)/gi,(_,b,e)=>b+"^{"+e+"}");
  s=s.replace(/\btheta\b/gi,"\u03B8");s=s.replace(/\balpha\b/gi,"\u03B1");
  s=s.replace(/\bbeta\b/gi,"\u03B2");s=s.replace(/\bdelta\b/gi,"\u03B4");
  s=s.replace(/\bsigma\b/gi,"\u03C3");s=s.replace(/\blambda\b/gi,"\u03BB");
  s=s.replace(/\bgamma\b/gi,"\u03B3");s=s.replace(new RegExp(AB+"mu"+AE,"gi"),"\u03BC");
  s=s.replace(/\bomega\b/gi,"\u03C9");s=s.replace(/\bepsilon\b/gi,"\u03B5");
  s=s.replace(/\bphi\b/gi,"\u03C6");s=s.replace(/\brho\b/gi,"\u03C1");
  s=s.replace(new RegExp(AB+"tau"+AE,"gi"),"\u03C4");s=s.replace(/\bSigma\b/g,"\u03A3");
  s=s.replace(/\bDelta\b/g,"\u0394");s=s.replace(/\bOmega\b/g,"\u03A9");
  s=s.replace(new RegExp(AB+"int"+AE,"g"),"\u222B");s=s.replace(new RegExp(AB+"sum"+AE,"g"),"\u2211");
  s=s.replace(new RegExp(AB+"prod"+AE,"g"),"\u220F");s=s.replace(/\bpartial\b/gi,"\u2202");
  s=s.replace(/\bnabla\b/gi,"\u2207");s=s.replace(/\bforall\b/gi,"\u2200");
  s=s.replace(/\bexists\b/gi,"\u2203");
  s=s.replace(/\bapprox\b/gi,"\u2248");s=s.replace(/~=/g,"\u2248");
  /* Statistics notation */
  s=s.replace(/\bxbar\b/gi,"x\u0304");s=s.replace(/\bx_bar\b/gi,"x\u0304");s=s.replace(/X_bar/g,"X\u0304");
  s=s.replace(/\bybar\b/gi,"y\u0304");s=s.replace(/\bphat\b/gi,"p\u0302");s=s.replace(/p_hat/g,"p\u0302");
  s=s.replace(/\bmu_0\b/g,"\u03BC\u2080");s=s.replace(/\bsigma\^2\b/gi,"\u03C3\u00B2");
  s=s.replace(/\bH_0\b/g,"H\u2080");s=s.replace(/\bH_1\b/g,"H\u2081");s=s.replace(/\bH_a\b/g,"H\u2090");
  s=s.replace(/\bP\(([^)]+)\)/g,"P($1)");/* preserve P() notation */
  s=s.replace(/\bE\[([^\]]+)\]/g,"E[$1]");/* preserve E[] notation */
  s=s.replace(/\bVar\[([^\]]+)\]/g,"Var[$1]");
  s=s.replace(/\bCov\[([^\]]+)\]/g,"Cov[$1]");
  s=s.replace(/\bC\((\w+),(\w+)\)/g,"C($1,$2)");s=s.replace(/\bnCr\b/g,"C(n,r)");s=s.replace(/\bnPr\b/g,"P(n,r)");
  s=s.replace(/\bchi\b/gi,"\u03C7");s=s.replace(/\bchi_squared\b/gi,"\u03C7\u00B2");s=s.replace(/\bchi2\b/gi,"\u03C7\u00B2");
  s=s.replace(/\bzeta\b/gi,"\u03B6");s=s.replace(/\bkappa\b/gi,"\u03BA");s=s.replace(/\bnu\b/gi,"\u03BD");
  s=s.replace(/\bpsi\b/gi,"\u03C8");s=s.replace(/\bxi\b/gi,"\u03BE");
  s=s.replace(/\bprop_to\b/gi,"\u221D");s=s.replace(/\bpropto\b/gi,"\u221D");
  s=s.replace(/\bemptyset\b/gi,"\u2205");s=s.replace(/\bnotin\b/gi,"\u2209");
  s=s.replace(/\bsubset\b/gi,"\u2282");s=s.replace(/\bsuperset\b/gi,"\u2283");
  s=s.replace(/\bunion\b/gi,"\u222A");s=s.replace(/\bintersect\b/gi,"\u2229");
  /* ═══ STATS FORMULA RECOVERY: fix garbled API output ═══ */
  /* Garbled superscript parens: e⁽ → e^( */
  s=s.replace(/e\u207D/g,"e^(");s=s.replace(/\u207E/g,")");
  /* Garbled normal PDF exponent — ALL variants: */
  /* "e-(x-μ²2σ²)" with NO spaces */
  s=s.replace(/e[-\u2212]\(?x[-\u2212]\u03BC\)?\u00B2\/?2\u03C3\u00B2\)?/g,"e^(-(x - \u03BC)\u00B2/(2\u03C3\u00B2))");
  /* "-x-μ²2σ²" or "- x - μ²2σ²" with optional spaces → "-(x - μ)²/(2σ²)" */
  s=s.replace(/-\s*\(?x\s*[-\u2212]\s*\u03BC\)?\u00B2\s*\/?\s*\(?2\u03C3\u00B2\)?/g,"-(x - \u03BC)\u00B2/(2\u03C3\u00B2)");
  /* "e elevado...-(x-μ)²/(2σ²)" — already has the -(x-μ) form, leave the text, fix the math after it */
  s=s.replace(/potencia de\s*-\s*\(?x\s*[-\u2212]\s*\u03BC\)?\u00B2\s*\/?\s*\(?2\u03C3\u00B2\)?/g,"potencia de -(x - \u03BC)\u00B2/(2\u03C3\u00B2)");
  /* "1/σ√2π" without outer parens → "(1)/(σ√{2π})" */
  s=s.replace(/(?<![(\d])1\s*\/\s*\(?\u03C3\u221A/g,"(1)/(\u03C3\u221A");
  /* "σ√2π" → "σ√{2π}" — radical after sigma always needs braces */
  s=s.replace(/\u03C3\u221A(?!\{)([a-zA-Z0-9\u03B1-\u03C9\u00B2\u00B3]+)/g,"\u03C3\u221A{$1}");
  /* ═══ DISTRIBUTION NOTATION RECOVERY ═══ */
  /* "N(μ, σ²n)" or "Nμ, (σ²n)" → "N(μ, (σ²)/(n))" */
  s=s.replace(/N\u03BC,\s*\(?(\u03C3\u00B2)n\)?/g,"N(\u03BC, ($1)/(n))");
  s=s.replace(/N\(\u03BC,\s*(\u03C3\u00B2)n\)/g,"N(\u03BC, ($1)/(n))");
  s=s.replace(/N\(\u03BC,\s*(\u03C3\u00B2)\s*\/\s*n\)/g,"N(\u03BC, ($1)/(n))");
  /* "σ²n" as standalone → "(σ²)/(n)" */
  s=s.replace(/(?<=[\s,(=])(\u03C3\u00B2)n(?=[\s,).]|$)/g,"($1)/(n)");
  /* ═══ WHOLESALE FORMULA REPLACEMENT — matches entire garbled formula, outputs correct version ═══ */
  /* SLOPE: b = (n∑xy − (∑x)(∑y))/(n∑x² − (∑x)²)
     Key: (∑x)(∑y) = product of sums. ∑x² = sum of squares. (∑x)² = square of sum. */
  s=s.replace(/\bb\s*=\s*\(?[^.;\n]*?n\u2211xy[^.;\n]*?\u2211x[^.;\n]*?\u2211y[^.;\n]*?n\u2211x\u00B2[^.;\n]*?\u2211x[^.;\n]*?\u00B2\)?/g,"b = (n\u2211xy \u2212 (\u2211x)(\u2211y))/(n\u2211x\u00B2 \u2212 (\u2211x)\u00B2)");
  /* CORRELATION: r = (n∑xy − (∑x)(∑y))/(√{(n∑x² − (∑x)²)(n∑y² − (∑y)²)})
     Single radical form — clearer than two separate √. */
  s=s.replace(/\br\s*=\s*(?=.*\u2211x\u00B2)(?=.*\u2211y\u00B2)[^.;\n]+/g,"r = (n\u2211xy \u2212 (\u2211x)(\u2211y))/(\u221A{(n\u2211x\u00B2 \u2212 (\u2211x)\u00B2)(n\u2211y\u00B2 \u2212 (\u2211y)\u00B2)})");
  /* Z-SCORE: Z = (X − μ)/(σ) */
  s=s.replace(/\bZ\s*=\s*\(?\s*[Xx]\s*[-\u2212]\s*\u03BC\s*\)?\s*\/?\s*\(?\s*\u03C3\s*\)?/g,"Z = (X \u2212 \u03BC)/(\u03C3)");
  s=s.replace(/([Xx])\s*[-\u2212]\s*\u03BC\u03C3/g,"($1 \u2212 \u03BC)/(\u03C3)");
  /* √(...)(...)  → √{(...)(...)} for product under radical in correlation formula */
  s=s.replace(/\u221A\(\s*(\([^)]+\)\s*\([^)]+\))\s*\)/g,"\u221A{$1}");
  /* √(expr)(expr) without outer parens → √{(expr)(expr)} */
  s=s.replace(/\u221A\(([^)]+)\)\(([^)]+)\)/g,"\u221A{($1)($2)}");
  /* "SSE/SST" "SSR/SST" without parens → "(SSE)/(SST)" */
  s=s.replace(/\b(SS[ERT])\s*\/\s*(SS[ERT])\b/g,"($1)/($2)");
  /* "1 - SSE/SST" → "1 - (SSE)/(SST)" */
  s=s.replace(/1\s*[-\u2212]\s*(SS[ERT])\s*\/\s*(SS[ERT])/g,"1 - ($1)/($2)");
  /* "ȳ - bx̄" — these are fine, leave as-is */
  /* "Σ(xi - x̄)²" "Σ(yi - ŷ)²" — parenthesized already, fine */
  /* Generic: "expr₁/expr₂" where expr has Σ or Greek → wrap in parens */
  s=s.replace(/(\u2211[a-zA-Z\u00B2\u0304\u0302\u03B1-\u03C9]+(?:\s*[-\u2212+]\s*[a-zA-Z0-9\u00B7\u00D7\u0304\u0302\u03B1-\u03C9\u00B2]+)*)\s*\/\s*(\u2211[a-zA-Z\u00B2\u0304\u0302\u03B1-\u03C9]+(?:\s*[-\u2212+]\s*[a-zA-Z0-9\u00B7\u00D7\u0304\u0302\u03B1-\u03C9\u00B2]+)*)/g,"($1)/($2)");
  /* "n - 2" or "n - k" bare in denominator: √(SSE/n-2) → √{(SSE)/(n-2)} */
  s=s.replace(/\u221A\(?(SSE)\s*\/\s*(n\s*[-\u2212]\s*\d+)\)?/g,"\u221A{($1)/($2)}");
  /* Generic: unbraced fraction with Greek on either side: μ/σ → (μ)/(σ) when standalone */
  s=s.replace(/(?<=\s|=|:)(\u03BC)\s*\/\s*(\u03C3)(?=\s|,|$)/g,"($1)/($2)");
  /* ═══ FORMULA PRESENTATION ═══ */
  /* Multiple P() expressions chained with commas → newline-separated */
  s=s.replace(/(P\([^)]+\)\s*[\u2248\u2265\u2264=<>\u2245]\s*[\d.]+%?)\s*,\s*(?=P\()/g,"$1\n");
  /* Multiple formulas chained with commas where each has ≈ or = → newline-separated */
  s=s.replace(/(\S+\s*[\u2248=]\s*[\d.]+%?)\s*,\s*(\S+\s*[\u2248=]\s*[\d.]+)/g,"$1\n$2");
  /* "formula, donde/where var = expr y/and var = expr" → split each assignment to its own line */
  s=s.replace(/,\s*(donde|where)\s+/gi,"\n$1 ");
  s=s.replace(/\s+([yY]|and)\s+([a-zA-Z\u03B1-\u03C9]\u0304?\s*=)/g,"\n$2");
  /* Semicolons between formulas → newlines */
  s=s.replace(/;\s*(?=[a-zA-Z\u03B1-\u03C9])/g,"\n");
  /* Derivative notation: convert compact forms to fraction-renderable forms */
  s=s.replace(/\bd\u00B2y\/dx\u00B2\b/g,"(d\u00B2y)/(dx\u00B2)");
  s=s.replace(/\bd\u00B2f\/dx\u00B2\b/g,"(d\u00B2f)/(dx\u00B2)");
  s=s.replace(/\bdydx\b/g,"(dy)/(dx)");s=s.replace(/\bdfdx\b/g,"(df)/(dx)");
  s=s.replace(/\bdzdt\b/g,"(dz)/(dt)");s=s.replace(/\bdsdt\b/g,"(ds)/(dt)");
  s=s.replace(/\bdydt\b/g,"(dy)/(dt)");s=s.replace(/\bdxdt\b/g,"(dx)/(dt)");
  s=s.replace(/\bdudx\b/g,"(du)/(dx)");s=s.replace(/\bdvdx\b/g,"(dv)/(dx)");
  /* Catch-all for concatenated derivative notation dAdB → (dA)/(dB).
     Restricted to math variables ONLY — excludes a/e/i/o/u so it doesn't shred
     Spanish words like "dada", "dedo", "dado", "duda", "dudo". Math derivatives
     use x/y/z/t/s/u/v/r/n/f/g/w/h/k/p/q/m, almost never aeiou-only combos. */
  s=s.replace(/\bd([xyztsfvwrnkpqmhg])d([xyztsfvwrnkpqmhg])\b/g,"(d$1)/(d$2)");
  s=s.replace(/(?<!\w)d\/d([a-zA-Z])\b/g,"(d)/(d$1)");/* d/dx → (d)/(dx) */
  s=s.replace(/\u2202\/\u2202([a-zA-Z])/g,"(\u2202)/(\u2202$1)");/* ∂/∂x → (∂)/(∂x) */
  /* Prime notation: f'(x), g'(x) — render with proper prime symbol */
  s=s.replace(/([a-zA-Z])''\(/g,"$1\u2033\u2060(");/* f''( → f″⁠( */
  s=s.replace(/([a-zA-Z])'\(/g,"$1\u2032\u2060(");/* f'( → f′⁠( */
  s=s.replace(/([a-zA-Z])''/g,"$1\u2033");/* f'' → f″ */
  s=s.replace(/([a-zA-Z])'/g,"$1\u2032");/* f' → f′ */
  /* Catch any prime+paren combos that slipped through other paths */
  s=s.replace(/([a-zA-Z]\u2032)\((?!\u2060)/g,"$1\u2060(");
  s=s.replace(/([a-zA-Z]\u2033)\((?!\u2060)/g,"$1\u2060(");
  /* Final cleanup: catch any remaining _X or ^X patterns the API might send */
  s=s.replace(/_([a-zA-Z0-9])(?![a-zA-Z0-9])/g,(_,c)=>SUB_MAP[c]||SUB_MAP[c.toLowerCase()]||c);
  s=s.replace(/\^([a-zA-Z0-9])/g,(_,c)=>SUP[c]||SUP[c.toLowerCase()]||c);
  /* Strip any truly orphaned underscores between math tokens */
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])_(?=[a-zA-Z0-9\u03B1-\u03C9])/g,"$1");
  /* Prevent bad line breaks: use non-breaking hyphen (U+2011) between numbers/% */
  s=s.replace(/(\d)-(\d)/g,"$1\u2011$2");/* 15-20 → 15‑20 (won't break) */
  s=s.replace(/(\d)-([\$\u20AC\u00A3%])/g,"$1\u2011$2");/* 20-$ → 20‑$ */
  s=s.replace(/(%)(\s*)-(\s*)(\d)/g,"$1$2\u2011$3$4");/* %-5 → %‑5 */
  /* Prevent formula line breaks: replace spaces around math operators with non-breaking spaces (U+00A0)
     so "FCF = EBIT × (1 - Tasa Impositiva)" stays on one line */
  s=s.replace(/ ([=\u2212\u00D7\u00F7\u00B1\u2248\u2265\u2264\u2260~]) /g,"\u00A0$1\u00A0");/* space=space → nbsp=nbsp */
  s=s.replace(/ ([+\-]) (?=[\d\w\u03B1-\u03C9(])/g,"\u00A0$1\u00A0");/* space+space before math token */
  s=s.replace(/([=\u2212+\-\u00D7]) \(/g,"$1\u00A0(");/* = ( → =nbsp( */
  s=s.replace(/\) ([=\u2212+\-\u00D7\u00F7])/g,")\u00A0$1");/* ) = → )nbsp= */
  /* Normalize spaces around / in fraction contexts so processFractions can match.
     Haiku often outputs "(a + b) / (c - d)" with spaces — collapse them to "(a+b)/(c-d)". */
  s=s.replace(/\)\s+\/\s+\(/g,")/(");
  s=s.replace(/\)\s+\/\s+([a-zA-Z0-9\u03B1-\u03C9\u221A\u03A3\u2211])/g,")/$1");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+\/\s+\(/g,"$1/(");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+\/\s+([a-zA-Z0-9\u03B1-\u03C9])(?=\s|[^a-zA-Z0-9]|$)/g,"$1/$2");

  /* Collapse mid-sentence newlines: if a line ends with a regular letter, comma, or quote
     AND the next line starts with a lowercase letter, it's a prose wrap — join with a space.
     Lines ending with ), digits, Greek, or superscripts are formula newlines → keep the gap. */
  s=s.replace(/([a-z\u00E0-\u00FF'"\u2019\u201D,])\n([a-z\u00E0-\u00FF])/g,"$1 $2");
  /* Restore **bold** and __underline__ markers */
  s=s.replace(/\x00FX(\d+)\x00/g,(_,i)=>"^("+fracExpProtect[i-1].replace("/","\u2044")+")");
  s=s.replace(/\x00B(\d+)\x00/g,(_,n)=>"**"+boldSafe[n-1]+"**");
  s=s.replace(/\x00U(\d+)\x00/g,(_,n)=>"__"+ulSafe[n-1]+"__");
  return s;
}

/* ═══════════ MathText: renders fractions, radicals, integrals/sums with stacked limits, bold/underline ═══════════ */
const fracStyle={display:"inline-flex",flexDirection:"column",alignItems:"center",verticalAlign:"middle",margin:"0 3px",lineHeight:1.1,fontSize:"0.85em"};
const fracLine={width:"100%",height:"1.5px",background:"currentColor",margin:"2px 0",borderRadius:1};
const FRAC_SKIP=/^(true|false|and|or|yes|no|if|of|is|it|to|in|on|up|da|do|de|la|lo|le|el|en|es|su|se|si|ya|yo|mi|tu|va|al|un|te|me|ni|vs|eg|ie|dado|dada|donde|cuando|como|sino|pero|pues|bien|mal|hay|son|fue|han|ser|con|por|para|cada|ante|bajo|tras|solo|todo|verdadero|falso|otro|otra)$/i;

/* Radical style: √ with connected overline bar — professional math rendering */
const radicalStyle={display:"inline-flex",alignItems:"flex-end",verticalAlign:"middle",margin:"0 2px",position:"relative"};
const radSymStyle={fontSize:"1.2em",lineHeight:1,fontFamily:"'Times New Roman',serif",position:"relative",top:"-0.05em"};
const radBodyStyle={display:"inline-flex",alignItems:"center",borderTop:"1.8px solid currentColor",padding:"1px 4px 0 3px",marginLeft:"-1px",lineHeight:1.25,minHeight:"1.2em"};

/* Reverse maps: Unicode sub/sup → regular chars */
const SUB_REV={};for(const[k,v]of Object.entries(SUB_MAP))SUB_REV[v]=k;
const SUP_REV={};for(const[k,v]of Object.entries(SUP))SUP_REV[v]=k;
const SUB_SET=new Set(Object.values(SUB_MAP));
const SUP_SET=new Set(Object.values(SUP));
function decodeSub(s){return[...s].map(c=>SUB_REV[c]||c).join("");}
function decodeSup(s){return[...s].map(c=>SUP_REV[c]||c).join("");}

/* Styles for stacked operator limits (integrals, sums, products) */
const opLimitStyle={display:"inline-flex",alignItems:"center",verticalAlign:"middle",margin:"0 1px"};
const opStackStyle={display:"inline-flex",flexDirection:"column",alignItems:"center",lineHeight:1,margin:"0 1px",verticalAlign:"middle"};
const opSymStyle={fontSize:"1.35em",lineHeight:1};
const opLimFontStyle={fontSize:"0.7em",lineHeight:1,opacity:0.85,fontFamily:"'JetBrains Mono',monospace"};

function MathText({children}){
  if(typeof children!=="string")return children||null;
  const s=children;

  /* ——— Pass 1: Bracket-notation limits: ∫[a,b], ∑[i=1,n], ∏[k=1,n] ——— */
  const bracketLimitRe=/([\u222B\u2211\u220F])\[([^\],]*),([^\]]*)\]/g;
  /* ——— Pass 2: Unicode sub/sup limits right after ∫∑∏ ——— */
  const subCharsEsc=Object.values(SUB_MAP).map(c=>"\\u"+c.charCodeAt(0).toString(16).padStart(4,"0")).join("");
  const supCharsEsc=Object.values(SUP).map(c=>{const h=c.charCodeAt(0).toString(16).padStart(4,"0");return"\\u"+h;}).join("");
  /* ——— Pass 3: Fractions ——— */
  const fracRe=/\(([^)]+)\)\/\(([^)]+)\)|(?<![a-zA-Z])([a-zA-Z0-9\u00B2\u00B3\u03C0\u221A\u00B9\u2074-\u2079]+)\/([a-zA-Z0-9\u00B2\u00B3\u03C0\u221A\u00B9\u2074-\u2079]+)(?![a-zA-Z])/g;

  /* Combined approach: scan string, process operators first, then fractions */
  function processOperators(input){
    if(typeof input!=="string")return input;
    const parts=[];let last=0,m;

    /* First: bracket notation ∫[a,b] */
    const combined=new RegExp('([\\u222B\\u2211\\u220F])\\[([^\\],]*),([^\\]]*)\\]','g');
    while((m=combined.exec(input))!==null){
      if(m.index>last)parts.push(input.slice(last,m.index));
      const sym=m[1],lower=m[2].trim(),upper=m[3].trim();
      parts.push(<span key={"op"+m.index} style={opLimitStyle}><span style={opStackStyle}><span style={opLimFontStyle}>{upper}</span><span style={opSymStyle}>{sym}</span><span style={opLimFontStyle}>{lower}</span></span></span>);
      last=m.index+m[0].length;
    }
    if(last<input.length)parts.push(input.slice(last));
    if(parts.length<=1&&last===0)return input;
    return parts;
  }

  function processUnicodeLimits(input){
    if(typeof input!=="string")return input;
    const parts=[];let i=0;
    while(i<input.length){
      const c=input[i];
      if(c==="\u222B"||c==="\u2211"||c==="\u220F"){
        let sub="",sup="";let j=i+1;
        while(j<input.length&&SUB_SET.has(input[j])){sub+=input[j];j++;}
        while(j<input.length&&SUP_SET.has(input[j])){sup+=input[j];j++;}
        /* Also check sup first then sub */
        if(!sub&&!sup){let k=i+1;while(k<input.length&&SUP_SET.has(input[k])){sup+=input[k];k++;}while(k<input.length&&SUB_SET.has(input[k])){sub+=input[k];k++;}if(sub||sup)j=k;}
        if(sub||sup){
          const lower=decodeSub(sub);const upper=decodeSup(sup);
          parts.push(<span key={"uo"+i} style={opLimitStyle}><span style={opStackStyle}>{upper&&<span style={opLimFontStyle}>{upper}</span>}<span style={opSymStyle}>{c}</span>{lower&&<span style={opLimFontStyle}>{lower}</span>}</span></span>);
          i=j;
        }else{parts.push(c);i++;}
      }else{parts.push(c);i++;}
    }
    /* Merge consecutive strings */
    const merged=[];let buf="";
    for(const p of parts){if(typeof p==="string")buf+=p;else{if(buf){merged.push(buf);buf="";}merged.push(p);}}
    if(buf)merged.push(buf);
    if(merged.length<=1&&typeof merged[0]==="string")return merged[0]||input;
    return merged;
  }

  /* Find matching closing paren/brace for balanced nesting */
  function findBalanced(s,start,open,close){
    if(s[start]!==open)return -1;
    let d=0;
    for(let i=start;i<s.length;i++){if(s[i]===open)d++;if(s[i]===close)d--;if(d===0)return i;}
    return -1;
  }

  function processFractions(input){
    if(typeof input!=="string")return input;
    const parts=[];let i=0;
    const supC="\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079\u207F\u207A\u207B";
    const tokChars=/[\w\u00B2\u00B3\u03B1-\u03C9\u0394\u03A3\u03A9\u03C0\u221A\u00B9\u2074-\u2079\u207F\u2070\u2080-\u2089\u2099\u0304\u0302\u00D7.\u2032\u2033\u2212,]/;
    const FRAC_SKIP=/^(true|false|and|or|yes|no|if|of|is|it|to|in|on|up|da|do|de|la|lo|le|el|en|es|su|se|si|ya|yo|mi|tu|va|al|un|te|me|ni|vs|eg|ie|dado|dada|donde|cuando|como|sino|pero|pues|bien|mal|hay|son|fue|han|ser|con|por|para|cada|ante|bajo|tras|solo|todo|verdadero|falso|otro|otra)$/i;
    const PURE_NUM=/^[\d,.\s]+$/;/* Skip pure numeric fractions like 50,000/25,000 */

    while(i<input.length){
      /* Pattern 1: (balanced-expr)[sups]/(balanced-expr or token) */
      if(input[i]==="("){
        const closeNum=findBalanced(input,i,"(",")");
        if(closeNum>i+1){
          /* Check for superscripts after closing paren */
          let afterNum=closeNum+1;
          while(afterNum<input.length&&supC.includes(input[afterNum]))afterNum++;
          /* Check for / */
          if(afterNum<input.length&&input[afterNum]==="/"){
            const slashPos=afterNum;
            let num=input.slice(i+1,closeNum);
            let numSup=input.slice(closeNum+1,slashPos);
            let den=null,denEnd=slashPos+1;
            /* Denominator: balanced parens or token */
            if(slashPos+1<input.length&&input[slashPos+1]==="("){
              const closeDen=findBalanced(input,slashPos+1,"(",")");
              if(closeDen>slashPos+2){den=input.slice(slashPos+2,closeDen);denEnd=closeDen+1;}
            }
            if(!den){
              /* Token denominator */
              let j=slashPos+1;
              /* Handle √{...} as atomic token */
              if(j<input.length&&input[j]==="\u221A"&&j+1<input.length&&input[j+1]==="{"){
                const cb=findBalanced(input,j+1,"{","}");
                if(cb>j+2){j=cb+1;}else{while(j<input.length&&tokChars.test(input[j]))j++;}
              }else{
                while(j<input.length&&(tokChars.test(input[j])||input[j]==="\u221A"||input[j]==="{"))j++;
                /* Also consume a following (…) so P(B), f(x), P(A|B) are treated as one token */
                if(j>slashPos+1&&j<input.length&&input[j]==="("){
                  const cb=findBalanced(input,j,"(",")");
                  if(cb>j){j=cb+1;}
                }
              }
              if(j>slashPos+1){den=input.slice(slashPos+1,j);denEnd=j;}
            }
            if(den&&!FRAC_SKIP.test(num)&&!FRAC_SKIP.test(den)){
              parts.push(input.slice(0,0));/* flush previous handled by outer logic */
              const renderPart=(t)=>{let r=processCombiningMarks(t);const ap=(items,fn)=>{if(typeof items==="string")return fn(items);if(Array.isArray(items))return items.map(x=>typeof x==="string"?fn(x):x).flat();return items;};r=ap(r,processRadicals);r=ap(r,processExponents);return r;};
              if(i>0)parts.push(input.slice(parts.length===1?0:0,i));/* This is handled below */
              /* Recursively build remaining */
              const before=input.slice(0,i);
              const fracEl=<span key={"f"+i} style={fracStyle}><span style={{padding:"0 3px"}}>{renderPart(num+numSup)}</span><span style={fracLine}/><span style={{padding:"0 3px"}}>{renderPart(den)}</span></span>;
              const after=input.slice(denEnd);
              const result=[];
              if(before)result.push(before);
              result.push(fracEl);
              if(after){const rest=processFractions(after);if(Array.isArray(rest))result.push(...rest);else if(rest)result.push(rest);}
              return result;
            }
          }
        }
      }
      /* Pattern 2: simple token/token or token/(balanced) */
      if(tokChars.test(input[i])||input[i]==="\u221A"){
        let tokStart=i;
        /* Handle √{...} */
        if(input[i]==="\u221A"&&i+1<input.length&&input[i+1]==="{"){
          const cb=findBalanced(input,i+1,"{","}");
          if(cb>i+2)i=cb+1;else i++;
          continue;
        }
        while(i<input.length&&tokChars.test(input[i]))i++;
        if(i<input.length&&input[i]==="/"){
          const tok1=input.slice(tokStart,i);
          if(tok1&&!FRAC_SKIP.test(tok1)){
            const slashPos=i;
            let den=null,denEnd=slashPos+1;
            if(slashPos+1<input.length&&input[slashPos+1]==="("){
              const closeDen=findBalanced(input,slashPos+1,"(",")");
              if(closeDen>slashPos+2){den=input.slice(slashPos+2,closeDen);denEnd=closeDen+1;}
            }
            if(!den){
              let j=slashPos+1;
              if(j<input.length&&input[j]==="\u221A"&&j+1<input.length&&input[j+1]==="{"){
                const cb=findBalanced(input,j+1,"{","}");if(cb>j+2)j=cb+1;else while(j<input.length&&tokChars.test(input[j]))j++;
              }else{
                while(j<input.length&&tokChars.test(input[j]))j++;
                /* Also consume a following (…) so P(B), f(x), P(A|B) are treated as one token */
                if(j>slashPos+1&&j<input.length&&input[j]==="("){
                  const cb=findBalanced(input,j,"(",")");
                  if(cb>j){j=cb+1;}
                }
              }
              if(j>slashPos+1){den=input.slice(slashPos+1,j);denEnd=j;}
            }
            if(den&&!FRAC_SKIP.test(den)&&!(PURE_NUM.test(tok1)&&PURE_NUM.test(den))){
              const renderPart=(t)=>{let r=processCombiningMarks(t);const ap=(items,fn)=>{if(typeof items==="string")return fn(items);if(Array.isArray(items))return items.map(x=>typeof x==="string"?fn(x):x).flat();return items;};r=ap(r,processRadicals);r=ap(r,processExponents);return r;};
              const before=input.slice(0,tokStart);
              const fracEl=<span key={"f"+tokStart} style={fracStyle}><span style={{padding:"0 3px"}}>{renderPart(tok1)}</span><span style={fracLine}/><span style={{padding:"0 3px"}}>{renderPart(den)}</span></span>;
              const after=input.slice(denEnd);
              const result=[];
              if(before)result.push(before);
              result.push(fracEl);
              if(after){const rest=processFractions(after);if(Array.isArray(rest))result.push(...rest);else if(rest)result.push(rest);}
              return result;
            }
          }
        }
        continue;
      }
      i++;
    }
    return input;/* no fractions found, return original string */
  }

  /* Pipeline: operators → unicode limits → FRACTIONS → combining marks → radicals → exponents → bold/underline → newlines
     CRITICAL: fractions MUST run before radicals/combining marks. Those processors split the string
     into segments (React elements + remaining strings), which destroys fraction patterns like
     (num)/(√{...}) — the radical extractor would rip √{...} out of the denominator, leaving
     processFractions with an unmatched '(' and no way to see the full fraction. */
  let result=processOperators(s);
  function applyToSegments(items,fn){
    if(typeof items==="string")return fn(items);
    if(!Array.isArray(items))return items;
    return items.map((it,idx)=>typeof it==="string"?fn(it):it);
  }
  result=applyToSegments(result,processUnicodeLimits);
  if(Array.isArray(result))result=result.flat();

  /* Combining marks: x̄ (U+0304 macron), p̂ (U+0302 circumflex) → CSS-styled overline/hat */
  function processCombiningMarks(input){
    if(typeof input!=="string")return input;
    /* Restrict to known math/stats variables — avoids clobbering Spanish words
       like "dada","mama","para" that may carry stray combining chars from API */
    const re=/([xyprznmwXYPRZNMW\u03B1-\u03C9])(\u0304|\u0302)/g;
    const parts=[];let last=0,m;
    while((m=re.exec(input))!==null){
      if(m.index>last)parts.push(input.slice(last,m.index));
      const isBar=m[2]==="\u0304";
      parts.push(<span key={"cm"+m.index} style={{display:"inline-block",textDecoration:isBar?"overline":"none",textDecorationThickness:"1.5px",textUnderlineOffset:isBar?undefined:undefined,fontStyle:"normal",padding:"0 1px",position:"relative"}}>{m[1]}{isBar?"":<span style={{position:"absolute",top:"-0.35em",left:"50%",transform:"translateX(-50%)",fontSize:"0.65em",lineHeight:1}}>{"\u0302"}</span>}</span>);
      last=m.index+m[0].length;
    }
    if(last<input.length)parts.push(input.slice(last));
    if(parts.length<=1&&last===0)return input;
    return parts;
  }

  /* Radical processing: √{content}, √(content), √[content], or √token → rendered radical with overline */
  function processRadicals(input){
    if(typeof input!=="string")return input;
    const re=/\u221A\{([^}]+)\}|\u221A\(([^)]+)\)|\u221A\[([^\]]+)\]|\u221A([a-zA-Z0-9\u00B2\u00B3\u03C0\u03B1-\u03C9\u0304\u0302]+)/g;
    const parts=[];let last=0,m;
    while((m=re.exec(input))!==null){
      if(m.index>last)parts.push(input.slice(last,m.index));
      const body=m[1]||m[2]||m[3]||m[4];
      /* Recursively render radical body: combining marks + exponents */
      let renderedBody=processCombiningMarks(body);
      const apInner=(items,fn)=>{if(typeof items==="string")return fn(items);if(Array.isArray(items))return items.map(x=>typeof x==="string"?fn(x):x).flat();return items;};
      renderedBody=apInner(renderedBody,processExponents);
      parts.push(<span key={"r"+m.index} style={radicalStyle}><span style={radSymStyle}>{"\u221A"}</span><span style={radBodyStyle}>{renderedBody}</span></span>);
      last=m.index+m[0].length;
    }
    if(last<input.length)parts.push(input.slice(last));
    if(parts.length<=1&&last===0)return input;
    return parts;
  }

  /* Exponent rendering: base^(expr) → base with superscript block */
  function processExponents(input){
    if(typeof input!=="string")return input;
    /* Extended: `)` is valid base char (handles (expr)^(n/d) patterns).
       U+2044 ⁄ FRACTION SLASH signals a protected fractional exponent → rendered as tiny stacked fraction. */
    const re=/([a-zA-Z0-9\u03B1-\u03C9)])\^\(([^)]+)\)/g;
    const parts=[];let last=0,m;
    while((m=re.exec(input))!==null){
      if(m.index>last)parts.push(input.slice(last,m.index));
      const expInner=m[2];
      let supContent;
      if(expInner.includes("\u2044")){/* U+2044 fraction slash → tiny stacked fraction */
        const si=expInner.indexOf("\u2044");const n=expInner.slice(0,si);const d=expInner.slice(si+1);
        supContent=<span style={{display:"inline-flex",flexDirection:"column",alignItems:"center",verticalAlign:"middle",lineHeight:1.1,fontSize:"0.88em",margin:"0 1px"}}><span style={{padding:"0 2px"}}>{n}</span><span style={{width:"100%",height:"1px",background:"currentColor",margin:"1px 0",borderRadius:1}}/><span style={{padding:"0 2px"}}>{d}</span></span>;
      }else{supContent=expInner;}
      parts.push(<span key={"exp"+m.index} style={{display:"inline"}}>{m[1]}<sup style={{fontSize:"0.72em",lineHeight:1}}>{supContent}</sup></span>);
      last=m.index+m[0].length;
    }
    if(last<input.length)parts.push(input.slice(last));
    if(parts.length<=1&&last===0)return input;
    return parts;
  }

  /* Bold/underline MUST run FIRST — before fractions/radicals/marks split the string.
     Otherwise **a = (x)/(y)** gets split at the fraction, breaking the **..** pattern. */
  function processMathInner(t){
    const applyStr=(items,fn)=>{
      if(typeof items==="string")return fn(items);
      if(Array.isArray(items))return items.map(x=>typeof x==="string"?fn(x):x).flat();
      return items;
    };
    let r=processFractions(t);
    r=applyStr(r,processCombiningMarks);
    r=applyStr(r,processRadicals);
    r=applyStr(r,processExponents);
    return r;
  }
  function processBoldUnderline(input){
    if(typeof input!=="string")return input;
    const re=/\*\*([^*]+)\*\*|__([^_]+)__/g;
    const parts=[];let last=0,m;
    while((m=re.exec(input))!==null){
      if(m.index>last)parts.push(input.slice(last,m.index));
      if(m[1])parts.push(<strong key={"b"+m.index} style={{color:TH.text,fontWeight:700}}>{processMathInner(m[1])}</strong>);
      else if(m[2])parts.push(<span key={"u"+m.index} style={{textDecoration:"underline",textDecorationColor:TH.accent+"60",textUnderlineOffset:2,textDecorationThickness:1.5}}>{processMathInner(m[2])}</span>);
      last=m.index+m[0].length;
    }
    if(last<input.length)parts.push(input.slice(last));
    if(parts.length<=1&&last===0)return input;
    return parts;
  }
  /* Split newlines into <br/> */
  function processNewlines(input){
    if(typeof input!=="string"||!input.includes("\n"))return input;
    return input.split("\n").flatMap((line,i,arr)=>i<arr.length-1?[line,<span key={"nl"+i} style={{display:"block",height:8}}/>]:[line]).filter(x=>x!=="");
  }

  /* Step 1: Bold/underline (before anything splits the string) */
  result=applyToSegments(result,processBoldUnderline);
  if(Array.isArray(result))result=result.flat();

  /* Step 2: Newlines */
  result=applyToSegments(result,processNewlines);
  if(Array.isArray(result))result=result.flat();

  /* Step 3: Fractions (on remaining string segments) */
  result=applyToSegments(result,processFractions);
  if(Array.isArray(result))result=result.flat();

  /* Step 4: Combining marks, radicals, exponents */
  result=applyToSegments(result,processCombiningMarks);
  if(Array.isArray(result))result=result.flat();

  result=applyToSegments(result,processRadicals);
  if(Array.isArray(result))result=result.flat();

  result=applyToSegments(result,processExponents);
  if(Array.isArray(result))result=result.flat();

  if(typeof result==="string")return <>{result}</>;
  if(Array.isArray(result)&&result.length<=1&&typeof result[0]==="string")return <>{result[0]}</>;
  return <>{result}</>;
}

function deepFmt(obj){
  if(typeof obj==="string")return formatMath(obj);
  if(Array.isArray(obj))return obj.map(deepFmt);
  if(obj&&typeof obj==="object"){const o={};for(const[k,v]of Object.entries(obj)){o[k]=(k==="correctIndex"||k==="type"||k==="answer")?v:deepFmt(v);}return o;}
  return obj;
}

/* ═══════════ Sanitize AI thinking-out-loud from MC explanations ═══════════
   Fixes two Haiku symptoms that sometimes slip past the prompt:
   1. Reasoning trails bleed into the explanation field
      (e.g. "...espera, revisá: 2t+2 en t=3 es 8. La respuesta correcta es 8 ms, que es index 1.")
   2. correctIndex mismatches the option the prose reasoning actually endorses.

   Strategy:
   - Look for "index N" / "índice N" (0-indexed) — most reliable when present.
   - Fall back to "opción N" / "option N" (1-indexed).
   - Fall back to "la respuesta correcta es <value>" — match that value against options.
   - If any hint yields a valid index that differs from correctIndex, override.
   - Always strip the reasoning trail from the explanation text.                          */
const REASONING_TRAIL_RE=/\s*[.,;…]{0,3}\s*\b(esper[aá]|pero\s+esper[aá]|wait[,\s]+let\s+me|wait,?\s+|hmm+|hm+\b|no,?\s+(?:la\s+respuesta|esper[aá]|revis[aá]|esper[aá])|cambiando|re[-\s]?c[aá]lculo|recalculo|revis[aá]ndolo|revis[aá]\b|actualizo|actualizando|revisando|actually[,\s]+(?:the\s+|let\s+me)|let\s+me\s+(?:recheck|verify|double)|hold\s+on)\b[\s\S]*$/i;
const INDEX_HINT_RE=/\b(?:index|[ií]ndice)\s*(?:es\s+|is\s+)?(\d)\b/i;
const OPTION_HINT_RE=/\b(?:opci[oó]n|option)\s+(?:correcta\s+(?:es\s+(?:la\s+)?)?)?(\d)\b/i;
const ANSWER_HINT_RE=/\b(?:la\s+respuesta\s+correcta\s+es|the\s+correct\s+answer\s+is|respuesta\s*[:=]|answer\s*[:=])\s+([^.,;\n]{1,40}?)(?=[.,;\n]|\s+(?:que\s+es|which\s+is)|$)/i;

function sanitizeMCQuestion(q){
  if(!q||typeof q!=="object"||q.type!=="mc"||!Array.isArray(q.options)||q.options.length<2)return q;
  const origExpl=typeof q.explanation==="string"?q.explanation:"";
  const curIdx=parseInt(q.correctIndex,10);
  let intendedIdx=null;

  /* Heuristic 1: explicit 0-indexed "index N" */
  const m1=origExpl.match(INDEX_HINT_RE);
  if(m1){const n=parseInt(m1[1],10);if(n>=0&&n<q.options.length)intendedIdx=n;}

  /* Heuristic 2: 1-indexed "opción N" / "option N" (only if index hint absent) */
  if(intendedIdx===null){
    const m2=origExpl.match(OPTION_HINT_RE);
    if(m2){const n=parseInt(m2[1],10);if(n>=1&&n<=q.options.length)intendedIdx=n-1;}
  }

  /* Heuristic 3: "la respuesta correcta es X" — match X against option text */
  if(intendedIdx===null){
    const m3=origExpl.match(ANSWER_HINT_RE);
    if(m3){
      const hint=m3[1].trim().toLowerCase().replace(/[.,;]$/,"");
      /* Exact-ish match: option contains the hint or vice-versa (case/accent-insensitive) */
      const norm=(s)=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
      const nh=norm(hint);
      if(nh.length>=1){
        const candidates=q.options.map((opt,i)=>({i,v:norm(opt)}));
        /* Prefer exact match, then containment */
        let hit=candidates.find(c=>c.v===nh);
        if(!hit)hit=candidates.find(c=>c.v.includes(nh)||nh.includes(c.v));
        if(hit)intendedIdx=hit.i;
      }
    }
  }

  /* Heuristic 4: look for a percentage or numeric value in the explanation that matches an option */
  if(intendedIdx===null){
    const pctM=origExpl.match(/\b(\d+(?:[.,]\d+)?)\s*%/);
    if(pctM){
      const normStr=(s)=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
      const needle=normStr(pctM[0]);
      const hit=q.options.map((opt,i)=>({i,v:normStr(opt)})).find(c=>c.v.includes(needle)||needle.includes(c.v.replace(/[^0-9.%]/g,"")));
      if(hit)intendedIdx=hit.i;
    }
  }

  /* Strip the reasoning trail regardless (even if no index hint was found) */
  let cleaned=origExpl.replace(REASONING_TRAIL_RE,"").trim();
  /* Also strip lone trailing "pero" / "but" that marks an abruptly cut reasoning trail */
  cleaned=cleaned.replace(/,?\s*\bpero\b\s*\.?\s*$/i,"").trim();
  cleaned=cleaned.replace(/,?\s*\bbut\b\s*\.?\s*$/i,"").trim();
  /* Safety: never blank out the explanation — if cleaning ate everything, restore */
  if(!cleaned||cleaned.length<3)cleaned=origExpl;

  const out={...q,explanation:cleaned};
  /* Only override correctIndex if intended differs AND is in range */
  if(intendedIdx!==null&&intendedIdx!==curIdx&&intendedIdx>=0&&intendedIdx<q.options.length){
    out.correctIndex=intendedIdx;
  }
  return out;
}

function sanitizeAllMC(parsed){
  if(!parsed||typeof parsed!=="object")return parsed;
  const walk=(arr)=>Array.isArray(arr)?arr.map(sanitizeMCQuestion):arr;
  const out={...parsed};
  if(out.quiz)out.quiz=walk(out.quiz);
  if(out.exam)out.exam=walk(out.exam);
  if(out.examChallenge)out.examChallenge=walk(out.examChallenge);
  return out;
}

/* ═══════════ Shuffle MC options so correct answer isn't always A ═══════════ */
function shuffleMC(data){
  if(!data)return data;
  const d={...data};
  const shuffleQuestions=(qs)=>{
    if(!Array.isArray(qs))return qs;
    return qs.map(q=>{
      if(q.type!=="mc"||!Array.isArray(q.options)||q.options.length<2)return q;
      const correct=q.options[parseInt(q.correctIndex,10)];
      const indices=[...Array(q.options.length).keys()];
      /* Fisher-Yates shuffle */
      for(let i=indices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
      const newOpts=indices.map(i=>q.options[i]);
      const newIdx=newOpts.indexOf(correct);
      return{...q,options:newOpts,correctIndex:newIdx};
    });
  };
  if(d.quiz)d.quiz=shuffleQuestions(d.quiz);
  if(d.exam)d.exam=shuffleQuestions(d.exam);
  if(d.examChallenge)d.examChallenge=shuffleQuestions(d.examChallenge);
  return d;
}

/* ═══════════ i18n ═══════════ */
const T={
  en:{badge:"FOCUS: MATHEMATICS",title:"Mastery Module",subtitle:"Type a topic in math, statistics, economics, or finance. Get a first-principles breakdown, quiz, and study materials.",placeholder:"e.g. Derivatives, Normal Distribution, Supply & Demand\u2026",learn:"Learn",generating:"Generating\u2026",remove:"\u2715",understand:"Understand",quiz:"Quiz",tips:"Tips",exam:"Exam",deck:"Deck",feynman:"FEYNMAN EXPLANATION",keyConcepts:"Key Concepts",testYourself:"Quick Check",selectBest:"Pick the best answer.",score:"Score",submit:"Submit",retry:"Retry",why:"Why?",tips_title:"Mastery Tips",tips_sub:"How to actually learn this",examTitle:"Exam",examSub:"10 questions \u2014 solid foundation.",examSubFast:"5 questions \u2014 quick check.",examChallengeTitle:"\uD83D\uDD25 Want a Challenge?",examChallengeSub:"5 tricky multiple-choice + 3 open problems. Work them out, then reveal the solution.",summaryDeck:"Summary Deck",question:"Q",hint:"Hint",concept:"KEY CONCEPT",tipBadge:"TIP",slideTitle:"Mastery Module Summary",slideEnd:"Now Go Practice",slideEndSub:"Understanding = Explaining Simply",loadingSub:"~20 seconds",footer:"Learn by First Principles",invalidInput:"Please enter a math, statistics, economics, or finance topic.",goDeeper:"Watch on YouTube",ytLang:"in English",learnAgain:"\u2728 Explore a New Topic",pdfError:"Could not read this PDF.",fileReadError:"Could not read this file.",downloadSlides:"Download Slides",formatPDF:"PDF",formatHTML:"Web (HTML)",trueLabel:"True",falseLabel:"False",revealSolution:"Reveal Solution",hideSolution:"Hide Solution",yourTurn:"Your turn \u2014 solve it, then reveal.",tfInstruction:"True or False?",solveInstruction:"Work it out on paper, then check.",interestPlaceholder:"\uD83C\uDFAE What do you like? e.g. The Simpsons, Rugby, Minecraft\u2026",interestHint:"Optional \u2014 personalizes analogies & quiz with your interests",realWorld:"\uD83C\uDF0D Real-World Applications",realWorldSub:"Where this actually matters",thinking:"Thinking",almostThere:"Almost there!",modeFast:"Fast",modeThink:"Think",modeFastDesc:"Quick explanation + quiz",modeThinkDesc:"Full deep dive + exam + deck",modeLite:"Lite",modeLiteDesc:"Essential overview",examSubLite:"3 questions \u2014 essential check.",didntUnderstand:"\uD83E\uDD14 I didn\u2019t understand",simplifying:"Simplifying\u2026",simplerExplain:"SIMPLER EXPLANATION",addToReview:"+ Add to Review Deck",addedToReview:"\u2713 Added to deck",alreadyInReview:"Already in deck",
  feynmanTitle:"Feynman Challenge",feynmanSub:"Close your notes. Explain {topic} in your own words \u2014 as if teaching a friend from scratch.",feynmanPlaceholder:"Imagine explaining this to a friend who's never heard of it...",feynmanSubmit:"Grade My Explanation",feynmanGrading:"Grading\u2026",feynmanSkipHint:"Skip in {n}s\u2026",feynmanSkip:"Skip \u2192",feynmanNailed:"What you nailed",feynmanMissed:"What\u2019s missing",feynmanTip:"Key tip",feynmanTryAgain:"Try Again",feynmanContinue:"Continue \u2192",feynmanResultTitle:"Feynman Score",
  topicTypeConceptLabel:"\uD83D\uDCDA Concept",topicTypeProblemLabel:"\uD83D\uDD22 Exercise",relatedTopicsTitle:"Go Deeper",relatedTopicsSub:"Related topics to explore next"},
  es:{badge:"ENFOQUE: MATEM\u00C1TICA",title:"M\u00F3dulo de Dominio",subtitle:"Escrib\u00ED un tema de mate, estad\u00EDstica, econom\u00EDa o finanzas. Te lo explico desde cero.",placeholder:"ej. Derivadas, Distribuci\u00F3n Normal, Oferta y Demanda\u2026",learn:"Dale",generating:"Armando todo\u2026",remove:"\u2715",understand:"Entender",quiz:"Quiz",tips:"Tips",exam:"Examen",deck:"Slides",feynman:"EXPLICACI\u00D3N FEYNMAN",keyConcepts:"Conceptos Clave",testYourself:"Chequeo R\u00E1pido",selectBest:"Eleg\u00ED la mejor respuesta.",score:"Puntaje",submit:"Enviar",retry:"De nuevo",why:"\u00BFPor?",tips_title:"Tips para Dominar",tips_sub:"C\u00F3mo aprender esto posta",examTitle:"Examen",examSub:"10 preguntas \u2014 base s\u00F3lida.",examSubFast:"5 preguntas \u2014 chequeo r\u00E1pido.",examChallengeTitle:"\uD83D\uDD25 \u00BFTe la banc\u00E1s?",examChallengeSub:"5 m\u00FAltiple choice dif\u00EDciles + 3 problemas abiertos. Resolv\u00E9 y despu\u00E9s revel\u00E1.",summaryDeck:"Slides de Resumen",question:"P",hint:"Pista",concept:"CONCEPTO CLAVE",tipBadge:"TIP",slideTitle:"Resumen del M\u00F3dulo",slideEnd:"Ahora a Practicar",slideEndSub:"Entender = Explicar Simple",loadingSub:"~20 segundos",footer:"Aprend\u00E9 desde los Principios Fundamentales",invalidInput:"Met\u00E9 un tema de mate, estad\u00EDstica, econom\u00EDa o finanzas, dale.",goDeeper:"Ver en YouTube",ytLang:"en espa\u00F1ol",learnAgain:"\u2728 Explorar Otro Tema",pdfError:"No se pudo leer el PDF.",fileReadError:"No se pudo leer el archivo.",downloadSlides:"Descargar Slides",formatPDF:"PDF",formatHTML:"Web (HTML)",trueLabel:"Verdadero",falseLabel:"Falso",revealSolution:"Revelar",hideSolution:"Ocultar",yourTurn:"Tu turno \u2014 resolv\u00E9lo y despu\u00E9s revel\u00E1.",tfInstruction:"\u00BFVerdadero o Falso?",solveInstruction:"Resolv\u00E9 en papel y despu\u00E9s cheque\u00E1.",interestPlaceholder:"\uD83C\uDFAE \u00BFQu\u00E9 te copa? ej. Los Simpsons, F\u00FAtbol, Minecraft\u2026",interestHint:"Opcional \u2014 personaliza las analog\u00EDas y el quiz con lo que te gusta",realWorld:"\uD83C\uDF0D Aplicaciones en la Vida Real",realWorldSub:"D\u00F3nde se usa esto posta",thinking:"Pensando",almostThere:"\u00A1Ya casi!",modeFast:"R\u00E1pido",modeThink:"Profundo",modeFastDesc:"Explicaci\u00F3n r\u00E1pida + quiz",modeThinkDesc:"An\u00E1lisis completo + examen + slides",modeLite:"Lite",modeLiteDesc:"Resumen esencial",examSubLite:"3 preguntas \u2014 chequeo esencial.",didntUnderstand:"\uD83E\uDD14 No entend\u00ED",simplifying:"Simplificando\u2026",simplerExplain:"EXPLICACI\u00D3N M\u00C1S SIMPLE",addToReview:"+ Agregar al Mazo",addedToReview:"\u2713 Agregado al mazo",alreadyInReview:"Ya est\u00E1 en el mazo",
  feynmanTitle:"Desaf\u00EDo Feynman",feynmanSub:"Cerr\u00E1 los apuntes. Explic\u00E1 {topic} con tus propias palabras \u2014 como si se lo ense\u00F1aras a un amigo desde cero.",feynmanPlaceholder:"Imagin\u00E1 que se lo explic\u00E1s a alguien que nunca lo escuch\u00F3...",feynmanSubmit:"Evaluar mi explicaci\u00F3n",feynmanGrading:"Evaluando\u2026",feynmanSkipHint:"Pod\u00E9s saltar en {n}s\u2026",feynmanSkip:"Saltar \u2192",feynmanNailed:"Lo que sali\u00F3 bien",feynmanMissed:"Lo que falta",feynmanTip:"Tip clave",feynmanTryAgain:"Intentar de nuevo",feynmanContinue:"Continuar \u2192",feynmanResultTitle:"Puntaje Feynman",
  topicTypeConceptLabel:"\uD83D\uDCDA Concepto",topicTypeProblemLabel:"\uD83D\uDD22 Ejercicio",relatedTopicsTitle:"Segu\u00ED Aprendiendo",relatedTopicsSub:"Temas relacionados para explorar"},
};

/* ═══════════ Loading ═══════════ */
const ML={
en:[
// ─── Jokes ───
"Why was the equal sign so humble? It knew it wasn\u2019t less than or greater than anyone else.",
"Parallel lines have so much in common\u2026 it\u2019s a shame they\u2019ll never meet.",
"Why did the student do multiplication on the floor? The teacher told them not to use tables.",
"What do you call friends who love math? Algebros.",
"Why was the math book sad? Too many problems.",
"What did zero say to eight? Nice belt!",
"Why do plants hate math? It gives them square roots.",
"How does a mathematician plow fields? With a pro-tractor.",
"Why did the angle go to the beach? Because it was 90 degrees.",
"Why is 6 afraid of 7? Because 7, 8, 9.",
"What do you get when you cross a mosquito with a mountain climber? Nothing \u2014 you can\u2019t cross a vector with a scalar.",
"Why don\u2019t calculus majors throw house parties? Because you should never drink and derive.",
"A Roman walks into a bar and holds up two fingers. \u2018Five beers, please.\u2019",
"There are 10 kinds of people: those who understand binary, and those who don\u2019t.",
"Why was the fraction worried about marrying the decimal? Because they\u2019d have to convert.",
"What\u2019s a math teacher\u2019s favorite season? Sum-mer.",
"Why did the two fours skip lunch? Because they already 8.",
"Why is arithmetic hard work? All those numbers you have to carry.",
"Why do teens travel in groups of 3 or 5? Because they can\u2019t even.",
"What did the acorn say when it grew up? Ge-om-e-try! (Gee, I\u2019m a tree!)",
"I\u2019ll do algebra, I\u2019ll do trig, I\u2019ll even do statistics. But graphing is where I draw the line.",
"A mathematician sees three people walk into a building and five walk out. \u2018If two more go in, it\u2019ll be empty.\u2019",
"Why did the chicken cross the M\u00F6bius strip? To get to the same side.",
"What\u2019s the integral of 1/cabin? A natural log cabin.",
"Why don\u2019t mathematicians argue? Because they know it\u2019s pointless.",
"How do you make one vanish? Add a \u2018g\u2019 and it\u2019s gone.",
"What do you call a number that can\u2019t keep still? A roamin\u2019 numeral.",
"Why was the geometry book always tired? Too many exercises.",
"What\u2019s a butterfly\u2019s favorite subject? Moth-ematics.",
"Why did pi get its driver\u2019s license revoked? It didn\u2019t know when to stop.",
"An infinite number of mathematicians walk into a bar. The first orders 1 beer, the second 1/2, the third 1/4. The bartender pours 2 beers and says \u2018You should know your limits.\u2019",
"What did the zero say to the two? Nice abs!",
"A logician\u2019s wife: \u2018Please get a gallon of milk, and if they have eggs, get a dozen.\u2019 He came back with 12 gallons of milk. \u2018They had eggs.\u2019",
"Why was the math lecture so long? The professor kept going off on tangents.",
"What\u2019s purple and commutes? An abelian grape.",
// ─── Curiosities ───
"A pizza with radius z and thickness a has volume pi\u00D7z\u00D7z\u00D7a.",
"111,111,111 \u00D7 111,111,111 = 12,345,678,987,654,321. A perfect palindrome.",
"The word \u2018hundred\u2019 comes from the Norse \u2018hundrath\u2019 \u2014 which actually meant 120.",
"If you shuffle a deck of 52 cards, the order has almost certainly never existed before in human history.",
"A Rubik\u2019s Cube has 43 quintillion possible states. Only 1 is solved.",
"The digits of pi have been calculated to over 105 trillion places. No repeating pattern has ever been found.",
"Euler\u2019s identity e^(i\u03C0) + 1 = 0 links five of the most important numbers in all of mathematics.",
"Zero wasn\u2019t accepted as a number in Europe until the 12th century. It was considered dangerous.",
"The ancient Egyptians could only use fractions with 1 in the numerator. They\u2019d write 2/3 as a special case.",
"In a room of 23 people, there\u2019s a >50% chance two share a birthday. It\u2019s called the Birthday Paradox.",
"The symbol \u2018=\u2019 was invented in 1557 by Robert Recorde because he was tired of writing \u2018is equal to.\u2019",
"The Fibonacci sequence appears in sunflower spirals, pinecone scales, and galaxy arms.",
"Googol (10\u00B9\u2070\u2070) inspired the name Google. A googolplex is 10^googol \u2014 a number too large to write out.",
"There are more ways to arrange a deck of cards than atoms in the observable universe.",
"\u221A2 was the first number proven irrational \u2014 legend says a Pythagorean was drowned for revealing it.",
"Every even number greater than 2 may be the sum of two primes. Still unproven after 280+ years.",
"The \u2018equals\u2019 sign (=) looks like two parallel lines because Recorde said \u2018nothing is more equal.\u2019",
"Ancient Babylonians used base 60. That\u2019s why we have 60 seconds and 360 degrees.",
"The Bridges of K\u00F6nigsberg problem (1736) launched graph theory. Euler proved no walk crosses all 7 bridges exactly once.",
"Benford\u2019s Law: in natural data, ~30% of leading digits are 1, not ~11% as you\u2019d expect.",
"Gabriel\u2019s Horn has infinite surface area but finite volume. You can fill it with paint but can\u2019t paint its surface.",
"Cicadas emerge in cycles of 13 or 17 years \u2014 both prime \u2014 to avoid syncing with predators.",
"2520 is the smallest number divisible by every integer from 1 to 10.",
"The Mandelbrot set has infinite complexity generated from z\u00B2 + c. Simple rule, infinite beauty.",
"The sum 1 + 2 + 3 + \u2026 + 100 = 5050. Gauss found this as a 7-year-old in seconds.",
"Ramanujan wrote down 3,900+ identities. Many were so novel that mathematicians are still proving them today.",
"Cantor proved that some infinities are bigger than others. The real numbers are \u2018more infinite\u2019 than the integers.",
// ─── Quotes ───
"\u201CPure mathematics is, in its way, the poetry of logical ideas.\u201D \u2014 Albert Einstein",
"\u201CMathematics is the queen of the sciences.\u201D \u2014 Carl Friedrich Gauss",
"\u201CIn mathematics, you don\u2019t understand things. You just get used to them.\u201D \u2014 von Neumann",
"\u201CMathematics is not about numbers, equations, or algorithms: it is about understanding.\u201D \u2014 Thurston",
"\u201CDo not worry about your difficulties in mathematics. I can assure you mine are still greater.\u201D \u2014 Einstein",
"\u201CThe only way to learn mathematics is to do mathematics.\u201D \u2014 Paul Halmos",
"\u201CGod made the integers; all else is the work of man.\u201D \u2014 Leopold Kronecker",
"\u201CA mathematician is a device for turning coffee into theorems.\u201D \u2014 Alfr\u00E9d R\u00E9nyi",
"\u201CMathematics reveals its secrets only to those who approach it with pure love.\u201D \u2014 Archimedes",
"\u201CThe book of nature is written in the language of mathematics.\u201D \u2014 Galileo",
"\u201CIf I have seen further, it is by standing on the shoulders of giants.\u201D \u2014 Isaac Newton",
"\u201CThe essence of mathematics lies in its freedom.\u201D \u2014 Georg Cantor",
"\u201CAs far as the laws of mathematics refer to reality, they are not certain; as far as they are certain, they do not refer to reality.\u201D \u2014 Einstein",
"\u201CLife is a math equation. To gain the most, you have to know how to convert negatives into positives.\u201D \u2014 Anonymous",
"\u201CWithout mathematics, there\u2019s nothing you can do. Everything around you is mathematics.\u201D \u2014 Shakuntala Devi",
"\u201CMathematics is the art of giving the same name to different things.\u201D \u2014 Henri Poincar\u00E9",
"\u201CMathematics, rightly viewed, possesses not only truth, but supreme beauty.\u201D \u2014 Bertrand Russell",
"\u201COne of the endlessly alluring aspects of mathematics is that its thorniest paradoxes have a way of blooming into beautiful theories.\u201D \u2014 Philip Davis",
"\u201CThe mathematician\u2019s patterns, like the painter\u2019s or the poet\u2019s, must be beautiful.\u201D \u2014 G.H. Hardy",
"\u201CMathematics compares the most diverse phenomena and discovers the secret analogies that unite them.\u201D \u2014 Fourier",
"\u201CTo those who ask what the infinitely small quantity in mathematics is, we answer that it is actually zero.\u201D \u2014 Euler",
"\u201CNumber rules the universe.\u201D \u2014 Pythagoras",
"\u201CProblems worthy of attack prove their worth by fighting back.\u201D \u2014 Piet Hein",
],
es:[
// ─── Chistes ───
"\u00BFPor qu\u00E9 el signo igual era tan humilde? Sab\u00EDa que no era ni menor ni mayor que nadie.",
"Las l\u00EDneas paralelas tienen tanto en com\u00FAn\u2026 l\u00E1stima que nunca se van a encontrar.",
"\u00BFPor qu\u00E9 el alumno hac\u00EDa multiplicaciones en el piso? La profe le dijo que no use tablas.",
"\u00BFC\u00F3mo se llaman los amigos que aman las mates? \u00C1lgebros.",
"\u00BFPor qu\u00E9 el libro de mate estaba triste? Demasiados problemas.",
"\u00BFQu\u00E9 le dijo el 0 al 8? Lindo cintur\u00F3n.",
"\u00BFPor qu\u00E9 las plantas odian la matem\u00E1tica? Les da ra\u00EDces cuadradas.",
"\u00BFC\u00F3mo ara un matem\u00E1tico? Con un trans-portador.",
"\u00BFPor qu\u00E9 el \u00E1ngulo fue a la playa? Porque estaba a 90 grados.",
"\u00BFPor qu\u00E9 el 6 le tiene miedo al 7? Porque 7, 8, 9 (7 se comi\u00F3 al 9).",
"\u00BFQu\u00E9 obten\u00E9s al cruzar un mosquito con un alpinista? Nada: no pod\u00E9s cruzar un vector con un escalar.",
"\u00BFPor qu\u00E9 los de c\u00E1lculo no hacen fiestas? Porque nunca hay que tomar y derivar.",
"Un romano entra a un bar y levanta dos dedos: \u2018Cinco cervezas, por favor.\u2019",
"Hay 10 tipos de personas: las que entienden binario y las que no.",
"\u00BFPor qu\u00E9 la fracci\u00F3n dudaba en casarse con el decimal? Porque iba a tener que convertirse.",
"\u00BFCu\u00E1l es la bebida favorita del matem\u00E1tico argentino? El mate, pero siempre toma en cantidades irracionales.",
"\u00BFPor qu\u00E9 los dos cuatros no almorzaron? Porque ya se com\u00EDan (8).",
"\u00BFPor qu\u00E9 la aritm\u00E9tica cansa tanto? Por todos los n\u00FAmeros que ten\u00E9s que acarrear.",
"\u00BFPor qu\u00E9 los adolescentes van en grupos de 3 o 5? Porque no pueden ser pares.",
"\u00BFPor qu\u00E9 el tri\u00E1ngulo fue al psic\u00F3logo? Porque ten\u00EDa demasiados \u00E1ngulos en su vida.",
"Hago \u00E1lgebra, hago trigonometr\u00EDa, hasta estad\u00EDstica. Pero graficar es donde trazo la l\u00EDnea.",
"Un matem\u00E1tico ve 3 personas entrar a un edificio y 5 salir. \u2018Si entran 2 m\u00E1s, queda vac\u00EDo.\u2019",
"\u00BFPor qu\u00E9 el pollo cruz\u00F3 la banda de M\u00F6bius? Para llegar al mismo lado.",
"\u00BFCu\u00E1l es la integral de 1/caba\u00F1a? Un logaritmo natural de caba\u00F1a.",
"\u00BFPor qu\u00E9 los matem\u00E1ticos no discuten? Porque saben que no tiene punto.",
"\u00BFQu\u00E9 le dijo el cero al dos? Lindos abdominales.",
"Una cantidad infinita de matem\u00E1ticos entra a un bar. El primero pide 1 cerveza, el segundo 1/2, el tercero 1/4. El barman sirve 2: \u2018Conozcan sus l\u00EDmites.\u2019",
"Un l\u00F3gico va al s\u00FAper. Su esposa le dice: \u2018Compr\u00E1 un litro de leche, y si hay huevos, compr\u00E1 una docena.\u2019 Volvi\u00F3 con 12 litros de leche. \u2018Hab\u00EDa huevos.\u2019",
"\u00BFPor qu\u00E9 la clase de mate era tan larga? El profe se iba por la tangente.",
"\u00BFQu\u00E9 es morado y conmuta? Una uva abeliana.",
"\u00BFPor qu\u00E9 el libro de geometr\u00EDa estaba cansado? Muchos ejercicios.",
"\u00BFCu\u00E1l es la materia favorita de las mariposas? Mate-m\u00E1ticas.",
"\u00BFPor qu\u00E9 a pi le sacaron la licencia? No sab\u00EDa cu\u00E1ndo frenar.",
"\u00BFC\u00F3mo hac\u00E9s desaparecer al 1? Le agreg\u00E1s una \u2018i\u2019: ahora es imaginario.",
"\u00BFCu\u00E1l es el colmo de un n\u00FAmero racional? Que su vida no tenga per\u00EDodo.",
// ─── Curiosidades ───
"Una pizza con radio z y grosor a tiene volumen pi\u00D7z\u00D7z\u00D7a.",
"111.111.111 \u00D7 111.111.111 = 12.345.678.987.654.321. Un pal\u00EDndromo perfecto.",
"La palabra \u2018hundred\u2019 viene del n\u00F3rdico \u2018hundrath\u2019, que en realidad significaba 120.",
"Si mezcl\u00E1s un mazo de 52 cartas, ese orden probablemente nunca existi\u00F3 antes en la historia.",
"El cubo de Rubik tiene 43 trillones de estados posibles. Solo 1 est\u00E1 resuelto.",
"Los d\u00EDgitos de pi se calcularon a m\u00E1s de 105 billones de cifras. No se encontr\u00F3 ning\u00FAn patr\u00F3n.",
"La identidad de Euler e^(i\u03C0) + 1 = 0 conecta los 5 n\u00FAmeros m\u00E1s importantes de la matem\u00E1tica.",
"El cero no fue aceptado como n\u00FAmero en Europa hasta el siglo XII. Se consideraba peligroso.",
"Los egipcios solo usaban fracciones con 1 en el numerador. El 2/3 era un caso especial.",
"En un grupo de 23 personas, hay >50% de probabilidad de que dos compartan cumplea\u00F1os. Es la Paradoja del Cumplea\u00F1os.",
"El s\u00EDmbolo \u2018=\u2019 fue inventado en 1557 por Robert Recorde porque se cans\u00F3 de escribir \u2018es igual a.\u2019",
"La sucesi\u00F3n de Fibonacci aparece en espirales de girasoles, pi\u00F1as y brazos de galaxias.",
"Googol (10\u00B9\u2070\u2070) inspir\u00F3 el nombre Google. Un googolplex es 10^googol \u2014 imposible de escribir.",
"Hay m\u00E1s formas de ordenar un mazo de cartas que \u00E1tomos en el universo observable.",
"\u221A2 fue el primer n\u00FAmero demostrado irracional \u2014 cuenta la leyenda que ahogaron al pitag\u00F3rico que lo revel\u00F3.",
"Todo n\u00FAmero par mayor que 2 podr\u00EDa ser la suma de dos primos. Sin demostrar en 280+ a\u00F1os.",
"Los babilonios usaban base 60. Por eso tenemos 60 segundos y 360 grados.",
"El problema de los Puentes de K\u00F6nigsberg (1736) inici\u00F3 la teor\u00EDa de grafos.",
"La Ley de Benford: en datos naturales, ~30% de los primeros d\u00EDgitos son 1, no ~11%.",
"La Trompeta de Gabriel tiene \u00E1rea infinita pero volumen finito. Pod\u00E9s llenarla de pintura pero no pintarla.",
"Las cigarras emergen en ciclos de 13 o 17 a\u00F1os \u2014 ambos primos \u2014 para evitar sincronizar con depredadores.",
"2520 es el menor n\u00FAmero divisible por todos los enteros del 1 al 10.",
"El conjunto de Mandelbrot tiene complejidad infinita generada desde z\u00B2 + c. Regla simple, belleza infinita.",
"La suma 1 + 2 + 3 + \u2026 + 100 = 5050. Gauss lo descubri\u00F3 a los 7 a\u00F1os en segundos.",
"Ramanujan escribi\u00F3 3.900+ identidades. Muchas eran tan nuevas que los matem\u00E1ticos a\u00FAn las demuestran hoy.",
"Cantor prob\u00F3 que hay infinitos m\u00E1s grandes que otros. Los reales son \u2018m\u00E1s infinitos\u2019 que los enteros.",
"El n\u00FAmero \u03C4 (tau = 2\u03C0) tiene fans que dicen que es m\u00E1s natural que pi. Hay un D\u00EDa de Tau: 28 de junio.",
"El tri\u00E1ngulo de Pascal esconde la sucesi\u00F3n de Fibonacci, los n\u00FAmeros triangulares y los coeficientes binomiales.",
// ─── Frases ───
"\u201CLa matem\u00E1tica pura es, a su manera, la poes\u00EDa de las ideas l\u00F3gicas.\u201D \u2014 Albert Einstein",
"\u201CLa matem\u00E1tica es la reina de las ciencias.\u201D \u2014 Carl Friedrich Gauss",
"\u201CEn matem\u00E1tica no entend\u00E9s las cosas. Simplemente te acostumbr\u00E1s a ellas.\u201D \u2014 von Neumann",
"\u201CLa matem\u00E1tica no se trata de n\u00FAmeros, ecuaciones o algoritmos: se trata de entender.\u201D \u2014 Thurston",
"\u201CNo te preocupes por tus dificultades en matem\u00E1tica. Las m\u00EDas son a\u00FAn mayores.\u201D \u2014 Einstein",
"\u201CLa \u00FAnica manera de aprender matem\u00E1tica es hacer matem\u00E1tica.\u201D \u2014 Paul Halmos",
"\u201CDios hizo los enteros; todo lo dem\u00E1s es obra del hombre.\u201D \u2014 Kronecker",
"\u201CUn matem\u00E1tico es una m\u00E1quina que convierte caf\u00E9 en teoremas.\u201D \u2014 R\u00E9nyi",
"\u201CLa matem\u00E1tica revela sus secretos solo a quienes se acercan con amor puro.\u201D \u2014 Arqu\u00EDmedes",
"\u201CEl libro de la naturaleza est\u00E1 escrito en el lenguaje de las matem\u00E1ticas.\u201D \u2014 Galileo",
"\u201CSi vi m\u00E1s lejos, fue porque estuve parado sobre hombros de gigantes.\u201D \u2014 Newton",
"\u201CLa esencia de la matem\u00E1tica est\u00E1 en su libertad.\u201D \u2014 Georg Cantor",
"\u201CLas matem\u00E1ticas son el arte de dar el mismo nombre a cosas diferentes.\u201D \u2014 Poincar\u00E9",
"\u201CLa matem\u00E1tica, bien vista, posee no solo verdad, sino belleza suprema.\u201D \u2014 Bertrand Russell",
"\u201CSin matem\u00E1tica, no hay nada que puedas hacer. Todo a tu alrededor es matem\u00E1tica.\u201D \u2014 Shakuntala Devi",
"\u201CEl matem\u00E1tico no estudia la matem\u00E1tica pura porque sea \u00FAtil; la estudia porque se deleita en ella.\u201D \u2014 Poincar\u00E9",
"\u201CLos patrones del matem\u00E1tico, como los del pintor, deben ser bellos.\u201D \u2014 G.H. Hardy",
"\u201CLas matem\u00E1ticas comparan los fen\u00F3menos m\u00E1s diversos y descubren las analog\u00EDas secretas que los unen.\u201D \u2014 Fourier",
"\u201CEl n\u00FAmero gobierna el universo.\u201D \u2014 Pit\u00E1goras",
"\u201CProblemas dignos de atacar demuestran su valor al pelear de vuelta.\u201D \u2014 Piet Hein",
"\u201CLa imaginaci\u00F3n es m\u00E1s importante que el conocimiento.\u201D \u2014 Einstein",
"\u201CLa l\u00F3gica te llevar\u00E1 de A a B. La imaginaci\u00F3n te llevar\u00E1 a todas partes.\u201D \u2014 Einstein",
"\u201CLa matem\u00E1tica es el lenguaje con el que Dios escribi\u00F3 el universo.\u201D \u2014 Galileo",
]};


const CHIPS={math:{en:["Pythagorean Theorem","Integrals","Matrix Algebra","Fractals","Logarithms"],es:["Teorema de Pit\u00E1goras","Integrales","\u00C1lgebra de Matrices","Fractales","Logaritmos"]},stats:{en:["Normal Distribution","Bayes\u2019 Theorem","Hypothesis Testing","Regression","Confidence Intervals"],es:["Distribuci\u00F3n Normal","Teorema de Bayes","Test de Hip\u00F3tesis","Regresi\u00F3n","Intervalos de Confianza"]},econ:{en:["Supply & Demand","GDP & Growth","Elasticity","Mastery-Modulery Policy","Market Structures"],es:["Oferta y Demanda","PIB y Crecimiento","Elasticidad","Pol\u00EDtica Mastery-Moduleria","Estructuras de Mercado"]},finance:{en:["DCF Valuation","Financial Ratios","Options Pricing","Portfolio Theory","Capital Budgeting"],es:["Valuaci\u00F3n DCF","Ratios Financieros","Precio de Opciones","Teor\u00EDa de Portfolio","Presupuesto de Capital"]}};

/* ═══════════ Accent helper (used by validator) ═══════════ */
function stripAccents(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");}

/* Broad keyword lists for validator fast-pass and detection fallback */
const STATS_STRONG="statistics,probability,distribution,regression,correlation,hypothesis,confidence,sample,population,variance,deviation,mean,median,mode,average,normal distribution,poisson,bernoulli,binomial,bayes,bayesian,z-score,zscore,t-test,ttest,anova,chi-square,chisquare,pvalue,p-value,stochastic,markov,random variable,expected value,standard deviation,sampling,histogram,scatter,boxplot,quartile,percentile,outlier,skew,kurtosis,likelihood,posterior,prior,frequentist,estimator,bias,unbiased,census,survey,data,dataset,statistical,odds,risk,prevalence,incidence,contingency,frequency,bell curve,central limit,law of large numbers,monte carlo,survival analysis,logistic,linear regression,multiple regression,multivariate,covariance,joint probability,conditional probability,permutation,combination,factorial,event,outcome,experiment,independent,dependent,mutually exclusive,venn,tree diagram,exponential distribution,uniform distribution,geometric distribution,negative binomial,hypergeometric,weibull,gamma distribution,beta distribution,log normal,student t,f distribution,chi squared distribution,kolmogorov smirnov,shapiro wilk,durbin watson,heteroscedasticity,autocorrelation,multicollinearity,residual,prediction interval,confidence interval,significance level,type i error,type ii error,effect size,sample size,degrees of freedom,critical value,test statistic,null hypothesis,alternative hypothesis,parametric,nonparametric,mann whitney,wilcoxon,kruskal wallis,spearman,kendall,pearson,correlation coefficient,r squared,sum of squares,f test,anova table,factorial design,randomization,control group,treatment,placebo,double blind,experimental design,stratified,bootstrap,jackknife,cross validation,k fold,overfitting,underfitting,bias variance,regularization,lasso,ridge,principal component,factor analysis,cluster analysis,k means,discriminant analysis,logistic regression,probit,odds ratio,hazard ratio,kaplan meier,cox regression,survival function,time series,arima,moving average,autoregressive,stationarity,acf,pacf,garch,volatility,forecast,exponential smoothing,panel data,fixed effects,random effects,hausman test,instrumental variable,propensity score,meta analysis,maximum likelihood,em algorithm,gibbs sampler,mcmc,posterior distribution,prior distribution,credible interval,bayes factor,aic,bic,wald test,kernel density,generalized linear model,poisson regression,contingency table,cronbach alpha,structural equation,latent variable,goodness of fit,missing data,imputation,estadistica,probabilidad,distribucion,regresion,correlacion,hipotesis,confianza,muestra,poblacion,varianza,desviacion,promedio,mediana,moda,histograma,frecuencia,combinatoria,permutacion,aleatorio,dato,datos,encuesta,muestreo,sesgo,estimador,nivel de significancia,intervalo de confianza,prueba de hipotesis,muestreo aleatorio,serie de tiempo,variable aleatoria,valor esperado,regresion lineal,regresion logistica,analisis de varianza,componentes principales,correlacion de pearson,coeficiente de determinacion".split(",");

/* Economics keywords */
const ECON_STRONG="economics,economy,microeconomics,macroeconomics,supply,demand,supply and demand,gdp,gross domestic product,inflation,deflation,recession,depression,fiscal,Mastery-Modulery,Mastery-Modulery policy,fiscal policy,central bank,federal reserve,interest rate,exchange rate,trade,tariff,import,export,balance of payments,current account,capital account,budget,deficit,surplus,debt,national debt,tax,taxation,subsidy,price floor,price ceiling,equilibrium,market equilibrium,shortage,elasticity,price elasticity,income elasticity,cross elasticity,inelastic,elastic,marginal,marginal cost,marginal utility,marginal revenue,marginal product,diminishing returns,opportunity cost,comparative advantage,absolute advantage,trade off,production possibilities,ppf,consumer surplus,producer surplus,deadweight loss,externality,public good,free rider,market failure,monopoly,oligopoly,perfect competition,monopolistic competition,market structure,barriers to entry,price discrimination,antitrust,cartel,game theory,nash equilibrium,prisoner dilemma,aggregate demand,aggregate supply,keynesian,classical,neoclassical,phillips curve,okun,laffer curve,multiplier,crowding out,quantitative easing,open market operations,reserve ratio,Masteryy supply,velocity of Masteryy,quantity theory,cpi,consumer price index,ppi,unemployment,frictional,structural,cyclical,natural rate,stagflation,hyperinflation,business cycle,expansion,contraction,peak,trough,gdp deflator,real gdp,nominal gdp,gnp,gni,hdi,gini,lorenz curve,income distribution,wealth inequality,poverty,economic growth,solow,endogenous growth,human capital,capital accumulation,savings rate,investment,foreign direct investment,stock market,bond,yield,coupon,dividend,portfolio,risk,return,diversification,efficient market,arbitrage,moral hazard,adverse selection,asymmetric information,principal agent,rent seeking,regulation,deregulation,privatization,nationalization,welfare,social security,minimum wage,labor market,wage,profit,revenue,cost,fixed cost,variable cost,total cost,average cost,break even,economies of scale,diseconomies,returns to scale,isoquant,isocost,indifference curve,budget constraint,utility,cardinal,ordinal,revealed preference,giffen good,veblen good,inferior good,normal good,substitute,complement,ceteris paribus,rational choice,bounded rationality,behavioral economics,nudge,prospect theory,sunk cost,endowment effect,loss aversion,Mastery-Modulerism,Mastery-Modulerist,chicago school,austrian school,austrian economics,keynesianism,new keynesian,new classical,real business cycle,rational expectations,adaptive expectations,lucas critique,ricardian equivalence,mundell fleming,is lm,ad as,as ad,solow model,harrod domar,rostow,dependency theory,world systems,structuralism,import substitution,export led growth,washington consensus,austerity,stimulus,bail out,bailout,too big to fail,systemic risk,financial crisis,great recession,great depression,subprime,credit crunch,liquidity trap,zero lower bound,negative interest,helicopter Masteryy,modern Mastery-Modulery theory,mmt,supply side,trickle down,reaganomics,thatcherism,neoliberalism,free market,laissez faire,market economy,command economy,mixed economy,planned economy,socialism,capitalism,communism,mercantilism,physiocrats,classical economics,institutional economics,development economics,environmental economics,health economics,labor economics,public economics,public finance,public choice,welfare economics,normative,positive economics,economic model,economic indicator,leading indicator,lagging indicator,coincident indicator,purchasing power,purchasing power parity,ppp,big mac index,terms of trade,balance of trade,trade deficit,trade surplus,protectionism,free trade,nafta,usmca,wto,imf,world bank,european central bank,bank of england,fed funds rate,discount rate,prime rate,libor,treasury,government bond,corporate bond,junk bond,credit rating,credit default swap,derivative,futures,options,put,call,strike price,hedge,speculation,short selling,margin,leverage,securitization,collateral,mortgage,amortization,compound interest,simple interest,present value,future value,net present value,internal rate of return,irr,wacc,capm,beta,alpha,sharpe ratio,treynor,market capitalization,ipo,equity,debt,capital structure,modigliani miller,pecking order,dividend policy,retained earnings,working capital,cash flow,income statement,balance sheet,depreciation,amortization,ebitda,price earnings ratio,book value,market value,tobin q,real estate,housing market,rent,lease,property rights,intellectual property,patent,copyright,trademark,common pool,tragedy of commons,club good,excludable,rivalrous,coase theorem,pigouvian tax,cap and trade,emissions trading,carbon tax,green economics,circular economy,sustainable development,natural capital,human development index,genuine progress indicator,happiness economics,wellbeing,inequality,social mobility,intergenerational mobility,meritocracy,poverty line,poverty trap,microfinance,microcredit,financial inclusion,remittances,brain drain,demographic transition,malthus,population growth,urbanization,agglomeration,urban economics,regional economics,spatial economics,transport economics,network effects,platform economics,digital economics,gig economy,sharing economy,attention economy,information economics,mechanism design,auction,vickrey,dutch auction,english auction,sealed bid,winner curse,market design,matching market,stable matching,school choice,kidney exchange,spectrum auction,experimental economics,neuroeconomics,complexity economics,agent based model,evolutionary economics,schumpeter,creative destruction,innovation,entrepreneurship,startup,venture capital,disruption,technology adoption,diffusion of innovations,learning curve,experience curve,first mover advantage,network externality,switching cost,lock in,path dependence,increasing returns,economia,microeconomia,macroeconomia,oferta,demanda,inflacion,deflacion,recesion,politica Mastery-Moduleria,politica fiscal,banco central,tasa de interes,tipo de cambio,comercio,arancel,importacion,exportacion,presupuesto,deficit,superavit,deuda,impuesto,subsidio,equilibrio,escasez,elasticidad,costo marginal,utilidad marginal,costo de oportunidad,ventaja comparativa,ventaja absoluta,excedente del consumidor,excedente del productor,perdida de peso muerto,externalidad,bien publico,monopolio,oligopolio,competencia perfecta,competencia monopolistica,barrera de entrada,demanda agregada,oferta agregada,keynesiano,multiplicador,desempleo,ciclo economico,crecimiento economico,mercado laboral,salario,ganancia,ingreso,costo fijo,costo variable,rendimiento,inversion,Mastery-Modulerismo,Mastery-Modulerista,escuela de chicago,escuela austriaca,expectativas racionales,equivalencia ricardiana,trampa de liquidez,crisis financiera,gran recesion,gran depresion,riesgo sistemico,economia mixta,economia de mercado,libre mercado,socialismo,capitalismo,mercantilismo,economia ambiental,economia laboral,finanzas publicas,eleccion publica,bienestar,economia del desarrollo,comercio internacional,balanza comercial,balanza de pagos,proteccionismo,libre comercio,tipo de cambio,devaluacion,revaluacion,inflacion de costos,inflacion de demanda,estanflacion,hiperinflacion,curva de phillips,ley de okun,curva de laffer,teoria de juegos,equilibrio de nash,dilema del prisionero,falla de mercado,asimetria de informacion,riesgo moral,seleccion adversa,teoria del consumidor,teoria del productor,curva de indiferencia,restriccion presupuestaria,efecto ingreso,efecto sustitucion,bien giffen,bien veblen,bien inferior,bien normal,complementario,sustituto,rendimientos decrecientes,rendimientos a escala,costo hundido,economia conductual,aversion a la perdida,sesgo cognitivo,racionalidad limitada,valor presente,valor futuro,tasa interna de retorno,flujo de caja,estado de resultados,balance general,depreciacion,accion,bono,dividendo,cartera,diversificacion,mercado eficiente,burbuja,especulacion,derivado financiero".split(",");

/* Per-module config */
const MOD_CONF={
  general:{icon:"\uD83C\uDFAF",accent:"#64748b",accentLight:"#94a3b8",accentBg:"rgba(100,116,139,0.07)",accentBgStrong:"rgba(100,116,139,0.13)",accentText:"#475569",borderAccent:"rgba(100,116,139,0.25)",btnShadow:"rgba(100,116,139,0.2)",gradientA:"#c47a00",gradientB:"#e8940a",gradientC:"#ef4444",gradientD:"#6366f1",badgeEn:"MATH \u00B7 STATISTICS \u00B7 ECONOMICS \u00B7 FINANCE",badgeEs:"MATEM\u00C1TICA \u00B7 ESTAD\u00CDSTICA \u00B7 ECONOM\u00CDA \u00B7 FINANZAS",roleEn:"the Lead Learning Architect",roleEs:"el Arquitecto de Aprendizaje",notationPrompt:""},
  math:{icon:"\u2211",accent:"#e8940a",accentLight:"#f5a623",accentBg:"rgba(245,166,35,0.07)",accentBgStrong:"rgba(245,166,35,0.13)",accentText:"#c47a00",borderAccent:"rgba(232,148,10,0.25)",btnShadow:"rgba(232,148,10,0.2)",gradientA:"#c47a00",gradientB:"#e8940a",gradientC:"#ef4444",gradientD:"#6366f1",badgeEn:"FOCUS: MATHEMATICS",badgeEs:"ENFOQUE: MATEM\u00C1TICA",roleEn:"the Lead Learning Architect for math",roleEs:"el Arquitecto de Aprendizaje para matem\u00E1tica",notationPrompt:""},
  stats:{icon:"\u03C3",accent:"#4f46e5",accentLight:"#6366f1",accentBg:"rgba(99,102,241,0.07)",accentBgStrong:"rgba(99,102,241,0.13)",accentText:"#3730a3",borderAccent:"rgba(99,102,241,0.25)",btnShadow:"rgba(99,102,241,0.2)",gradientA:"#3730a3",gradientB:"#4f46e5",gradientC:"#6366f1",gradientD:"#8b5cf6",badgeEn:"FOCUS: PROBABILITY & STATISTICS",badgeEs:"ENFOQUE: PROBABILIDAD Y ESTAD\u00CDSTICA",roleEn:"the Lead Learning Architect for probability and statistics",roleEs:"el Arquitecto de Aprendizaje para probabilidad y estad\u00EDstica",notationPrompt:"\n\nSTATISTICS NOTATION \u2014 COPY THESE TEMPLATES EXACTLY:\n- Symbols: x\u0304 p\u0302 \u03C3\u00B2 H\u2080 H\u2081 \u03C7\u00B2. P(A|B), E[X], Var[X], C(n,r).\n- EVERY fraction: (numerator)/(denominator). Example: (X - \u03BC)/(\u03C3) NOT X-\u03BC\u03C3.\n- EVERY radical: \u221A{content}. Example: \u221A{2\u03C0} NOT \u221A2\u03C0.\n- DISTRIBUTIONS: X ~ N(\u03BC, \u03C3\u00B2). Sample mean: x\u0304 ~ N(\u03BC, (\u03C3\u00B2)/(n)). ALWAYS write (\u03C3\u00B2)/(n) as a fraction with parens.\n- Z-SCORE: Z = (X - \u03BC)/(\u03C3).\n- NORMAL PDF: Show BOTH a text explanation AND the formatted formula on separate lines:\n  1. Explain in words what the formula does.\n  2. Then on a NEW line show: Coefficient: (1)/(\u03C3\u221A{2\u03C0})\n  3. Then on a NEW line show: Exponent: -(x - \u03BC)\u00B2/(2\u03C3\u00B2)\n  NEVER write e^() or e-() or e\u207D(). NEVER concatenate the full PDF inline.\n- 68-95-99.7 RULE: MUST be a table block (type:\"table\"). Headers and row labels MUST be in the SAME LANGUAGE as the rest of the response (e.g. \"Rango\"/\"Probabilidad\" in Spanish, \"Range\"/\"Probability\" in English). Rows: [[\"\\u03BC \\u00B1 1\\u03C3\",\"68.27%\"],[\"\\u03BC \\u00B1 2\\u03C3\",\"95.45%\"],[\"\\u03BC \\u00B1 3\\u03C3\",\"99.73%\"]].\n- LINEAR REGRESSION formulas (COPY EXACTLY):\n  b = (n\u2211xy \u2212 (\u2211x)(\u2211y))/(n\u2211x\u00B2 \u2212 (\u2211x)\u00B2)\n  a = y\u0304 \u2212 bx\u0304\n  CRITICAL DISTINCTION: \u2211x\u00B2 means sum of squared values. (\u2211x)\u00B2 means square of the sum. These are DIFFERENT. Always use parentheses to disambiguate.\n  NEVER write \u2211x\u2211y \u2014 ALWAYS write (\u2211x)(\u2211y) with explicit parentheses.\n- CORRELATION (COPY EXACTLY):\n  r = (n\u2211xy \u2212 (\u2211x)(\u2211y))/(\u221A{(n\u2211x\u00B2 \u2212 (\u2211x)\u00B2)(n\u2211y\u00B2 \u2212 (\u2211y)\u00B2)})\n  Use SINGLE radical \u221A{...} with the full product inside, NOT two separate radicals.\n- R\u00B2 = 1 \u2212 (SSE)/(SST).\n- GENERAL: ONE formula per line. Use table/steps blocks for multiple formulas.\n- COMPLEX FORMULAS: ALWAYS show BOTH a plain-language explanation AND the properly formatted formula. Students need to see the actual math notation."},
  econ:{icon:"\u2696",accent:"#059669",accentLight:"#10b981",accentBg:"rgba(16,185,129,0.07)",accentBgStrong:"rgba(16,185,129,0.13)",accentText:"#047857",borderAccent:"rgba(5,150,105,0.25)",btnShadow:"rgba(5,150,105,0.2)",gradientA:"#047857",gradientB:"#059669",gradientC:"#10b981",gradientD:"#34d399",badgeEn:"FOCUS: ECONOMICS",badgeEs:"ENFOQUE: ECONOM\u00CDA",roleEn:"the Lead Learning Architect for economics (micro and macro)",roleEs:"el Arquitecto de Aprendizaje para econom\u00EDa (micro y macro)",notationPrompt:
"\n- Economics notation: use \u0394 for change (\u0394Q, \u0394P), \u03B5 for elasticity, \u03C0 for profit.\n- Fractions: (numerator)/(denominator) always with parentheses. Example: (\u0394Q)/(\u0394P) for slope.\n- Use \u2211 for aggregation. Use \u221E for long-run concepts.\n- Subscripts for time: GDP\u2080 GDP\u2081 etc. Use t for generic time: Y\u209C, P\u209C.\n- Use proper symbols: \u2265 \u2264 \u2260 \u00D7 directly.\n- CRITICAL LANGUAGE RULE: ALL economic terms, labels, and descriptions MUST be in the SAME language as the response. If Spanish: use 'Oferta', 'Demanda', 'Ingreso Marginal', 'Costo Marginal', 'Excedente del Consumidor', etc. NEVER mix English terms into a Spanish response."},
  finance:{icon:"$",accent:"#0891b2",accentLight:"#22d3ee",accentBg:"rgba(8,145,178,0.07)",accentBgStrong:"rgba(8,145,178,0.13)",accentText:"#0e7490",borderAccent:"rgba(8,145,178,0.25)",btnShadow:"rgba(8,145,178,0.2)",gradientA:"#0e7490",gradientB:"#0891b2",gradientC:"#22d3ee",gradientD:"#67e8f9",badgeEn:"FOCUS: FINANCE",badgeEs:"ENFOQUE: FINANZAS",roleEn:"the Lead Learning Architect for finance and accounting",roleEs:"el Arquitecto de Aprendizaje para finanzas y contabilidad",notationPrompt:"\n- Finance notation: use proper fraction format (numerator)/(denominator) for all ratios.\n- Use \u0394 for changes, % for percentages. Use \u2265 \u2264 for thresholds.\n- NPV = \u2211[t=0,n] (CF\u209C)/((1+r)\u1D57). IRR, WACC, CAPM, ROE, ROA: use standard abbreviations.\n- CRITICAL LANGUAGE RULE: ALL formula labels, ratio names, and descriptions MUST be in the SAME language as the response. If Spanish: use 'Ingreso Neto', 'Ingresos Totales', 'Activos Corrientes', 'Pasivos Corrientes', 'Margen de Ganancia', 'Costo de Capital', etc. NEVER mix English terms into a Spanish response."},
};

/* Stats loading messages */
const ML_STATS={
en:[
// ─── Jokes ───
"Why did the statistician drown crossing a river? It was 3 feet deep on average.",
"A statistician\u2019s spouse: \u2018You never tell me you love me.\u2019 \u2018I told you once. If anything changes, I\u2019ll update you.\u2019",
"Statistics are like bikinis: what they reveal is interesting, but what they conceal is essential.",
"Statistician\u2019s pickup line: \u2018I\u2019m 95% confident you\u2019re the one.\u2019",
"A statistician refuses to fly. \u2018The probability of a bomb on a plane is 1 in a million, too high!\u2019 So they bring their own bomb \u2014 \u2018Two bombs? That\u2019s 1 in a trillion!\u2019",
"How many statisticians does it take to change a lightbulb? 1\u20133, with 95% confidence.",
"Correlation doesn\u2019t imply causation. But it does waggle its eyebrows suggestively.",
"I made a statistics joke but it wasn\u2019t significant.",
"Old statisticians never die. They just get reduced to insignificance.",
"Why did the data analyst break up with the histogram? Too much baggage in every bar.",
"The average human has approximately one breast and one testicle. Statistics can be misleading.",
"A p-value walks into a bar. The bartender says, \u2018You\u2019re not significant enough to be served here.\u2019",
"Statistics show that 6 out of 7 dwarfs aren\u2019t Happy.",
"I asked a statistician for her phone number. She gave me an estimate.",
"Two data points walk into a bar. The bartender says, \u2018Is this a trend?\u2019",
"A data scientist drowned in a pool with an average depth of 6 inches. Never trust averages.",
"What\u2019s a Bayesian\u2019s favorite meal? Prior-ity seating at a restaurant.",
"\u2018I think there\u2019s a selection bias here.\u2019 \u2018Of course you do. You were selected to think that.\u2019",
"A confidence interval walks into a bar. Maybe. We\u2019re 95% sure.",
"Why do statisticians love nature? Natural sampling distributions.",
// ─── Curiosities ───
"The Central Limit Theorem says: average enough random things and you\u2019ll get a bell curve. Always.",
"Ronald Fisher invented the p-value in the 1920s. He later called 0.05 \u2018a low standard of significance.\u2019",
"Florence Nightingale pioneered statistical graphics \u2014 her polar area diagrams changed public health forever.",
"Bayes\u2019 Theorem was published posthumously in 1763. Thomas Bayes never saw its impact.",
"The birthday paradox: 23 people = 50% chance of a shared birthday. At 70 people it\u2019s 99.9%.",
"Regression to the mean was discovered by Francis Galton studying the heights of parents and children.",
"The Law of Large Numbers: flip a coin 10 times and anything can happen. Flip it 10,000 times and you\u2019ll get ~50/50.",
"Benford\u2019s Law has been used to detect fraud in tax returns and election results.",
"The Monte Carlo method was invented during the Manhattan Project to simulate neutron diffusion.",
"Abraham Wald told WWII engineers to armor the parts of returning planes that had NO bullet holes \u2014 survivorship bias.",
"Standard deviation was coined by Karl Pearson in 1893. Before that, statisticians used \u2018probable error.\u2019",
"The Monty Hall problem: switching doors doubles your chances from 1/3 to 2/3. Most PhDs get it wrong.",
"Simpson\u2019s Paradox: a trend in separate groups can reverse when combined. UC Berkeley admissions, 1973.",
"Zipf\u2019s Law: the most common word in a language appears roughly twice as often as the second most common.",
"A Poisson distribution models rare events \u2014 Ladislaus Bortkiewicz used it to count deaths by horse kicks in the Prussian army.",
"John Tukey invented the box plot in 1977 and coined the word \u2018bit\u2019 (binary digit) in 1947.",
"The bootstrap method (1979) lets you estimate statistics by resampling your own data thousands of times.",
"Galton boards (bean machines) physically demonstrate the Central Limit Theorem with falling balls.",
"The chi-squared test was introduced by Karl Pearson in 1900 to test if observed data fits expected distributions.",
"The randomized controlled trial was pioneered in 1948 for streptomycin. It changed medicine forever.",
// ─── Quotes ───
"\u201CAll models are wrong, but some are useful.\u201D \u2014 George Box",
"\u201CIn God we trust; all others must bring data.\u201D \u2014 W. Edwards Deming",
"\u201CThe best thing about being a statistician is that you get to play in everyone\u2019s backyard.\u201D \u2014 John Tukey",
"\u201CFar better an approximate answer to the right question than an exact answer to the wrong question.\u201D \u2014 Tukey",
"\u201CStatistics is the grammar of science.\u201D \u2014 Karl Pearson",
"\u201CTorture the data long enough and it will confess to anything.\u201D \u2014 Ronald Coase",
"\u201CIf you torture data enough, nature will always confess.\u201D \u2014 Ronald Coase",
"\u201CThe combination of some data and an aching desire for an answer does not ensure a correct answer.\u201D \u2014 Tukey",
"\u201CProbability is not a mere computation of odds on the dice or more complicated variants; it is the acceptance of the lack of certainty in our knowledge.\u201D \u2014 Nassim Taleb",
"\u201CTo call in the statistician after the experiment is done may be no more than asking him to perform a post-mortem.\u201D \u2014 R.A. Fisher",
"\u201CThe numbers have no way of speaking for themselves. We speak for them.\u201D \u2014 Nate Silver",
"\u201CData! Data! Data! I can\u2019t make bricks without clay.\u201D \u2014 Sherlock Holmes (Conan Doyle)",
"\u201CIt is a capital mistake to theorize before one has data.\u201D \u2014 Sherlock Holmes",
"\u201CThe plural of anecdote is not data.\u201D \u2014 Roger Brinner",
"\u201CStatistics are no substitute for judgment.\u201D \u2014 Henry Clay",
],
es:[
// ─── Chistes ───
"\u00BFPor qu\u00E9 se ahog\u00F3 el estad\u00EDstico cruzando un r\u00EDo? Porque ten\u00EDa 1 metro de profundidad promedio.",
"La pareja del estad\u00EDstico: \u2018Nunca me dec\u00EDs que me quer\u00E9s.\u2019 \u2018Ya te dije una vez. Si cambia algo, te aviso.\u2019",
"Las estad\u00EDsticas son como las bikinis: lo que revelan es interesante, pero lo que ocultan es esencial.",
"Frase de levante del estad\u00EDstico: \u2018Estoy 95% seguro de que sos la indicada.\u2019",
"\u00BFCu\u00E1ntos estad\u00EDsticos se necesitan para cambiar una lamparita? De 1 a 3, con 95% de confianza.",
"La correlaci\u00F3n no implica causalidad. Pero levanta las cejas de forma sugerente.",
"Hice un chiste de estad\u00EDstica pero no fue significativo.",
"Los estad\u00EDsticos viejos nunca mueren. Solo se reducen a insignificancia.",
"\u00BFPor qu\u00E9 el analista de datos cort\u00F3 con el histograma? Demasiado equipaje en cada barra.",
"El humano promedio tiene aproximadamente un seno y un test\u00EDculo. Las estad\u00EDsticas pueden enga\u00F1ar.",
"Un valor-p entra a un bar. El barman dice: \u2018No sos lo suficientemente significativo para que te atienda.\u2019",
"Las estad\u00EDsticas muestran que 6 de cada 7 enanitos no son Feliz.",
"Le ped\u00ED el n\u00FAmero a una estad\u00EDstica. Me dio una estimaci\u00F3n.",
"Dos datos entran a un bar. El barman dice: \u2018\u00BFEsto es una tendencia?\u2019",
"Un cient\u00EDfico de datos se ahog\u00F3 en una pileta con promedio de 15cm. Nunca conf\u00EDes en promedios.",
"\u00BFCu\u00E1l es la comida favorita de un bayesiano? Reserva prior-itaria en un restaurante.",
"\u2018Creo que hay un sesgo de selecci\u00F3n ac\u00E1.\u2019 \u2018Claro, fuiste seleccionado para pensar eso.\u2019",
"Un intervalo de confianza entra a un bar. Tal vez. Estamos 95% seguros.",
"El estad\u00EDstico lleg\u00F3 al bar y pidi\u00F3 \u2018el promedio de lo que toman todos\u2019. Le trajeron 1,3 vasos.",
"\u00BFCu\u00E1l es el colmo de un estad\u00EDstico? Que su vida sea insignificante.",
// ─── Curiosidades ───
"El Teorema Central del L\u00EDmite dice: promedi\u00E1 suficientes cosas aleatorias y siempre sale una campana.",
"Ronald Fisher invent\u00F3 el valor-p en los a\u00F1os 20. Despu\u00E9s dijo que 0.05 era \u2018un est\u00E1ndar bajo.\u2019",
"Florence Nightingale fue pionera en gr\u00E1ficos estad\u00EDsticos. Sus diagramas cambiaron la salud p\u00FAblica.",
"El Teorema de Bayes se public\u00F3 p\u00F3stumamente en 1763. Thomas Bayes nunca vio su impacto.",
"Paradoja del cumplea\u00F1os: 23 personas = 50% de chance de compartir cumplea\u00F1os. Con 70 es 99.9%.",
"La regresi\u00F3n a la media fue descubierta por Francis Galton estudiando alturas de padres e hijos.",
"Ley de Grandes N\u00FAmeros: tir\u00E1 una Masteryda 10 veces y pasa cualquier cosa. 10.000 veces y se acerca a 50/50.",
"La Ley de Benford se us\u00F3 para detectar fraude en declaraciones de impuestos y resultados electorales.",
"El m\u00E9todo Monte Carlo se invent\u00F3 durante el Proyecto Manhattan para simular difusi\u00F3n de neutrones.",
"Abraham Wald dijo que blindaran las partes de los aviones que NO ten\u00EDan agujeros de bala \u2014 sesgo de supervivencia.",
"La desviaci\u00F3n est\u00E1ndar fue acu\u00F1ada por Karl Pearson en 1893. Antes se usaba \u2018error probable.\u2019",
"El problema de Monty Hall: cambiar de puerta duplica tus chances de 1/3 a 2/3. La mayor\u00EDa de PhDs se equivoca.",
"La Paradoja de Simpson: una tendencia en grupos separados puede revertirse al combinarlos. Admisiones de Berkeley, 1973.",
"La Ley de Zipf: la palabra m\u00E1s com\u00FAn aparece el doble que la segunda m\u00E1s com\u00FAn.",
"La distribuci\u00F3n de Poisson modela eventos raros \u2014 Bortkiewicz la us\u00F3 para contar muertes por patadas de caballo.",
"John Tukey invent\u00F3 el diagrama de caja en 1977 y cre\u00F3 la palabra \u2018bit\u2019 en 1947.",
"El m\u00E9todo bootstrap (1979) te permite estimar estad\u00EDsticos remuestreando tus propios datos miles de veces.",
"Los tableros de Galton demuestran f\u00EDsicamente el Teorema Central del L\u00EDmite con bolitas cayendo.",
"La prueba chi-cuadrado fue introducida por Karl Pearson en 1900.",
"El ensayo controlado aleatorio fue pionero en 1948 con estreptomicina. Cambi\u00F3 la medicina para siempre.",
// ─── Frases ───
"\u201CTodos los modelos est\u00E1n equivocados, pero algunos son \u00FAtiles.\u201D \u2014 George Box",
"\u201CEn Dios confiamos; todos los dem\u00E1s deben traer datos.\u201D \u2014 W. Edwards Deming",
"\u201CLo mejor de ser estad\u00EDstico es jugar en el patio de todos.\u201D \u2014 John Tukey",
"\u201CMejor una respuesta aproximada a la pregunta correcta que una exacta a la pregunta equivocada.\u201D \u2014 Tukey",
"\u201CLa estad\u00EDstica es la gram\u00E1tica de la ciencia.\u201D \u2014 Karl Pearson",
"\u201CTortur\u00E1 los datos lo suficiente y van a confesar cualquier cosa.\u201D \u2014 Ronald Coase",
"\u201CLa combinaci\u00F3n de datos con un deseo desesperado de respuestas no garantiza respuestas correctas.\u201D \u2014 Tukey",
"\u201CLa probabilidad no es mero c\u00E1lculo de chances; es aceptar la falta de certeza.\u201D \u2014 Nassim Taleb",
"\u201CLlamar al estad\u00EDstico despu\u00E9s del experimento es pedirle una autopsia.\u201D \u2014 R.A. Fisher",
"\u201CLos n\u00FAmeros no hablan por s\u00ED mismos. Nosotros hablamos por ellos.\u201D \u2014 Nate Silver",
"\u201C\u00A1Datos! \u00A1Datos! \u00A1Datos! No puedo hacer ladrillos sin arcilla.\u201D \u2014 Sherlock Holmes",
"\u201CEs un error capital teorizar antes de tener datos.\u201D \u2014 Sherlock Holmes",
"\u201CEl plural de an\u00E9cdota no es datos.\u201D \u2014 Roger Brinner",
"\u201CLas estad\u00EDsticas no sustituyen al juicio.\u201D \u2014 Henry Clay",
"\u201CLa estad\u00EDstica es el arte de torturar n\u00FAmeros hasta que digan lo que quer\u00E9s.\u201D \u2014 An\u00F3nimo",
]};


/* Economics loading messages */
const ML_ECON={
en:[
// ─── Jokes ───
"How many economists does it take to change a lightbulb? None. If it needed changing, the market would\u2019ve done it.",
"An economist is someone who sees something working in practice and wonders if it works in theory.",
"Economics: where supply meets demand, and everyone disagrees on where.",
"Three economists went hunting. One shot left, one shot right. The third yelled, \u2018We got it!\u2019",
"Why did the economist break up with the calculator? They couldn\u2019t count on each other.",
"Economics is the only field where two people can win a Nobel Prize for saying opposite things.",
"An economist is an expert who will know tomorrow why the things he predicted yesterday didn\u2019t happen today.",
"How do you know an economist has a sense of humor? They use decimal points.",
"What do economists and computers have in common? You need to punch information into both of them.",
"A physicist, a chemist, and an economist are stranded on a desert island with a can of beans. The economist says: \u2018Assume we have a can opener.\u2019",
"Why did the supply curve break up with the demand curve? They could never find equilibrium.",
"Inflation is when you pay $10 for the $5 haircut you used to get for $3 when you had hair.",
"If all the economists were laid end to end, they\u2019d still never reach a conclusion.",
"\u2018Economists have predicted nine of the last five recessions.\u2019 \u2014 Paul Samuelson",
"Why did GDP go to therapy? It had too many contractions.",
"An economist\u2019s spouse: \u2018Do you love me or your work more?\u2019 \u2018Can\u2019t I maximize both utilities?\u2019",
"What\u2019s an economist\u2019s favorite sport? Fiscal hockey.",
"Why don\u2019t economists play poker? They can\u2019t handle the risk and uncertainty.",
"How many free-market economists does it take to screw in a lightbulb? None. It\u2019s the invisible hand\u2019s job.",
"Adam Smith walks into a bar. The bartender serves him because it\u2019s in both their self-interests.",
// ─── Curiosities ───
"Adam Smith was so absent-minded he once walked 15 miles in his nightgown, lost in thought.",
"The term \u2018invisible hand\u2019 appears only 3 times in all of Adam Smith\u2019s writings.",
"Hyperinflation in Zimbabwe (2008) peaked at 79.6 billion percent per month. Prices doubled every 24 hours.",
"The Big Mac Index, created by The Economist in 1986, compares purchasing power across countries using burger prices.",
"John Nash\u2019s equilibrium theory (1950) revolutionized game theory. He was 21 when he published it.",
"The 2008 financial crisis cost the global economy an estimated $22 trillion.",
"GDP was invented by Simon Kuznets in 1934, but he himself warned it shouldn\u2019t measure a nation\u2019s welfare.",
"The Dutch Tulip Mania (1637) is considered the first recorded speculative bubble. One bulb cost as much as a house.",
"The Laffer Curve was supposedly drawn on a napkin at a dinner with Dick Cheney in 1974.",
"OPEC controls ~40% of world oil production and has triggered multiple global economic crises.",
"The Bretton Woods system (1944) pegged currencies to the dollar, which was pegged to gold. It collapsed in 1971.",
"Behavioral economics shows people feel losses ~2x more intensely than equivalent gains (loss aversion).",
"The prisoner\u2019s dilemma shows why two rational individuals might not cooperate even when it\u2019s in both their interests.",
"South Korea went from one of the poorest countries in 1960 to the 10th largest economy by 2020.",
"Venezuela sits on the world\u2019s largest proven oil reserves but experienced economic collapse and hyperinflation.",
"The Gini coefficient measures income inequality: 0 = perfect equality, 1 = one person has everything.",
"The \u2018tragedy of the commons\u2019 was described by Garrett Hardin in 1968. It explains overuse of shared resources.",
"Keynes personally earned a fortune trading currencies, despite losing big multiple times.",
"Milton Friedman\u2019s \u2018pencil\u2019 example: no single person in the world knows how to make a pencil from scratch.",
"The Marshall Plan (1948) gave $13 billion ($170B today) to rebuild Europe after WWII \u2014 and it worked.",
"The Phillips Curve suggests a tradeoff between inflation and unemployment, but stagflation in the 1970s challenged it.",
"The concept of opportunity cost was formalized by Friedrich von Wieser in 1914.",
"Rent control was described by Swedish economist Assar Lindbeck as \u2018the most efficient technique for destroying a city.\u2019",
// ─── Quotes ───
"\u201CSupply creates its own demand.\u201D \u2014 Jean-Baptiste Say",
"\u201CIn the long run, we are all dead.\u201D \u2014 John Maynard Keynes",
"\u201CInflation is always and everywhere a Mastery-Modulery phenomenon.\u201D \u2014 Milton Friedman",
"\u201CIt is not from the benevolence of the butcher that we expect our dinner, but from their regard to their own interest.\u201D \u2014 Adam Smith",
"\u201CThe curious task of economics is to demonstrate to men how little they really know about what they imagine they can design.\u201D \u2014 F.A. Hayek",
"\u201CCapitalism is the worst system, except for all the others that have been tried.\u201D \u2014 paraphrasing Churchill",
"\u201CThe ideas of economists, both when they are right and wrong, are more powerful than is commonly understood.\u201D \u2014 Keynes",
"\u201CThere is no free lunch.\u201D \u2014 Milton Friedman",
"\u201CThe market can stay irrational longer than you can stay solvent.\u201D \u2014 Keynes",
"\u201CEconomics is a study of mankind in the ordinary business of life.\u201D \u2014 Alfred Marshall",
"\u201CThe first lesson of economics is scarcity. The first lesson of politics is to disregard the first lesson of economics.\u201D \u2014 Thomas Sowell",
"\u201CProfits are the lifeblood of the economic system.\u201D \u2014 Peter Drucker",
"\u201CWhenever you find yourself on the side of the majority, it is time to pause and reflect.\u201D \u2014 Mark Twain",
"\u201CThe best minds of my generation are thinking about how to make people click ads.\u201D \u2014 Jeff Hammerbacher",
],
es:[
// ─── Chistes ───
"\u00BFCu\u00E1ntos economistas se necesitan para cambiar una lamparita? Ninguno. Si hiciera falta, el mercado ya lo habr\u00EDa hecho.",
"Un economista ve algo que funciona en la pr\u00E1ctica y se pregunta si funcionar\u00E1 en teor\u00EDa.",
"Econom\u00EDa: donde la oferta se encuentra con la demanda, y todos discuten d\u00F3nde.",
"Tres economistas salen a cazar. Uno dispara a la izquierda, otro a la derecha. El tercero grita: \u2018\u00A1Le dimos!\u2019",
"La econom\u00EDa es la \u00FAnica disciplina donde dos personas ganan el Nobel diciendo cosas opuestas.",
"Un economista es un experto que ma\u00F1ana va a saber por qu\u00E9 lo que predijo ayer no pas\u00F3 hoy.",
"\u00BFC\u00F3mo sab\u00E9s que un economista tiene humor? Usa puntos decimales.",
"Un f\u00EDsico, un qu\u00EDmico y un economista naufragan con una lata de porotos. El economista dice: \u2018Supongamos que tenemos un abrelatas.\u2019",
"\u00BFPor qu\u00E9 la curva de oferta cort\u00F3 con la de demanda? Nunca encontraban el equilibrio.",
"La inflaci\u00F3n es cuando pag\u00E1s $10 por el corte de pelo de $5 que antes costaba $3 cuando ten\u00EDas pelo.",
"Si pusi\u00E9ramos a todos los economistas uno al lado del otro, nunca llegar\u00EDan a una conclusi\u00F3n.",
"\u2018Los economistas predijeron 9 de las \u00FAltimas 5 recesiones.\u2019 \u2014 Samuelson",
"\u00BFPor qu\u00E9 el PBI fue a terapia? Demasiadas contracciones.",
"La esposa del economista: \u2018\u00BFMe quer\u00E9s m\u00E1s a m\u00ED o a tu trabajo?\u2019 \u2018\u00BFNo puedo maximizar ambas utilidades?\u2019",
"\u00BFCu\u00E1l es el deporte favorito de un economista? Hockey fiscal.",
"\u00BFPor qu\u00E9 los economistas no juegan al p\u00F3ker? No pueden manejar el riesgo y la incertidumbre.",
"\u00BFCu\u00E1ntos economistas de libre mercado se necesitan para cambiar una lamparita? Ninguno. Es trabajo de la mano invisible.",
"Adam Smith entra a un bar. El barman lo atiende porque le conviene a los dos.",
"El colmo de un economista: tener una crisis de valores.",
"\u00BFPor qu\u00E9 los economistas aman el helado? Por los rendimientos marginales decrecientes despu\u00E9s del tercer sabor.",
// ─── Curiosidades ───
"Adam Smith era tan distra\u00EDdo que una vez camin\u00F3 24 km en camis\u00F3n de dormir, perdido en sus pensamientos.",
"El t\u00E9rmino \u2018mano invisible\u2019 aparece solo 3 veces en todos los escritos de Adam Smith.",
"La hiperinflaci\u00F3n en Zimbabue (2008) lleg\u00F3 a 79.600 millones % por mes. Los precios se duplicaban cada 24 horas.",
"El \u00CDndice Big Mac, creado por The Economist en 1986, compara poder adquisitivo con precios de hamburguesas.",
"John Nash public\u00F3 su teor\u00EDa del equilibrio a los 21 a\u00F1os. Revolucion\u00F3 la teor\u00EDa de juegos.",
"La crisis de 2008 le cost\u00F3 a la econom\u00EDa global unos 22 billones de d\u00F3lares.",
"El PBI fue inventado por Simon Kuznets en 1934, pero \u00E9l mismo advirti\u00F3 que no deber\u00EDa medir bienestar.",
"La Tulipoman\u00EDa holandesa (1637) fue la primera burbuja especulativa registrada. Un bulbo costaba como una casa.",
"La Curva de Laffer supuestamente se dibuj\u00F3 en una servilleta en una cena con Dick Cheney en 1974.",
"La OPEP controla ~40% de la producci\u00F3n mundial de petr\u00F3leo y provoc\u00F3 m\u00FAltiples crisis econ\u00F3micas.",
"Bretton Woods (1944) fij\u00F3 las Masterydas al d\u00F3lar y el d\u00F3lar al oro. Colaps\u00F3 en 1971.",
"La econom\u00EDa conductual muestra que sentimos las p\u00E9rdidas ~2x m\u00E1s que las ganancias equivalentes (aversi\u00F3n a la p\u00E9rdida).",
"El dilema del prisionero muestra por qu\u00E9 dos personas racionales pueden no cooperar aunque les convenga.",
"Corea del Sur pas\u00F3 de ser uno de los pa\u00EDses m\u00E1s pobres en 1960 a la 10\u00AA econom\u00EDa mundial en 2020.",
"Venezuela tiene las mayores reservas de petr\u00F3leo probadas del mundo pero sufri\u00F3 colapso econ\u00F3mico.",
"El coeficiente de Gini mide desigualdad: 0 = igualdad perfecta, 1 = una persona tiene todo.",
"La \u2018tragedia de los comunes\u2019 fue descrita por Garrett Hardin en 1968. Explica el sobreuso de recursos compartidos.",
"Keynes hizo una fortuna personal operando divisas, pese a perder fuerte varias veces.",
"Milton Friedman y su ejemplo del l\u00E1piz: nadie en el mundo sabe hacer un l\u00E1piz solo desde cero.",
"El Plan Marshall (1948) dio 13.000 millones ($170.000M hoy) para reconstruir Europa \u2014 y funcion\u00F3.",
"La Curva de Phillips sugiere un tradeoff entre inflaci\u00F3n y desempleo, pero la estanflaci\u00F3n de los 70 la cuestion\u00F3.",
"El concepto de costo de oportunidad fue formalizado por Friedrich von Wieser en 1914.",
"El control de alquileres fue descrito por el economista sueco Lindbeck como \u2018la t\u00E9cnica m\u00E1s eficiente para destruir una ciudad.\u2019",
// ─── Frases ───
"\u201CLa oferta crea su propia demanda.\u201D \u2014 Jean-Baptiste Say",
"\u201CA largo plazo, todos estamos muertos.\u201D \u2014 Keynes",
"\u201CLa inflaci\u00F3n es siempre y en todo lugar un fen\u00F3meno Mastery-Modulerio.\u201D \u2014 Milton Friedman",
"\u201CNo es por la benevolencia del carnicero que esperamos nuestra cena, sino por su inter\u00E9s propio.\u201D \u2014 Adam Smith",
"\u201CLa curiosa tarea de la econom\u00EDa es demostrar a los hombres cu\u00E1n poco saben sobre lo que imaginan poder dise\u00F1ar.\u201D \u2014 Hayek",
"\u201CEl capitalismo es el peor sistema, excepto por todos los dem\u00E1s que se han intentado.\u201D \u2014 parafraseando a Churchill",
"\u201CLas ideas de los economistas, tanto correctas como err\u00F3neas, son m\u00E1s poderosas de lo que se cree.\u201D \u2014 Keynes",
"\u201CNo existe el almuerzo gratis.\u201D \u2014 Milton Friedman",
"\u201CEl mercado puede mantenerse irracional m\u00E1s tiempo del que vos pod\u00E9s mantenerte solvente.\u201D \u2014 Keynes",
"\u201CLa econom\u00EDa es un estudio de la humanidad en los negocios ordinarios de la vida.\u201D \u2014 Alfred Marshall",
"\u201CLa primera lecci\u00F3n de econom\u00EDa es la escasez. La primera de pol\u00EDtica es ignorar la primera de econom\u00EDa.\u201D \u2014 Sowell",
"\u201CLas ganancias son la sangre del sistema econ\u00F3mico.\u201D \u2014 Peter Drucker",
"\u201CCada vez que te encontr\u00E1s del lado de la mayor\u00EDa, es momento de detenerte y reflexionar.\u201D \u2014 Mark Twain",
"\u201CLas mejores mentes de mi generaci\u00F3n est\u00E1n pensando c\u00F3mo hacer que la gente haga clic en anuncios.\u201D \u2014 Hammerbacher",
]};


/* Finance loading messages */
const ML_FINANCE={
en:[
// ─── Jokes ───
"A bank is a place that will lend you Masteryy if you can prove that you don\u2019t need it.",
"Why did the investor bring a ladder? They heard the market was going up.",
"My accountant told me my net worth was imaginary. Must be a complex number.",
"What\u2019s an actuary? An accountant who found accounting too exciting.",
"I tried to start a hot air balloon business, but it never took off. Much like my portfolio.",
"How do you become a millionaire in the stock market? Start as a billionaire.",
"A bear and a bull walk into a bar. They\u2019ve been arguing about the market ever since.",
"Why did the banker switch careers? He lost interest.",
"The stock market is the only store where people run away when things go on sale.",
"My financial advisor told me to diversify. So I lost Masteryy in multiple sectors.",
"Why did the accountant break up with the calculator? She felt she could count on someone better.",
"A CFO is just a person who worries about Masteryy on behalf of people who don\u2019t.",
"What\u2019s a stockbroker\u2019s favorite music? The blues when the market drops, jazz when it goes up.",
"Rule #1 of investing: Don\u2019t lose Masteryy. Rule #2: Don\u2019t forget Rule #1. \u2014 Buffett",
"Why don\u2019t financial analysts ever win at poker? They keep folding when they should hold.",
"What do you call an optimistic finance student? Someone who hasn\u2019t checked the market today.",
"A day trader\u2019s favorite exercise? Running from losses.",
"Why is Masteryy called dough? Because everyone kneads it.",
"I put all my Masteryy in stocks. Campbell\u2019s, mainly. At least I\u2019ll always have soup.",
"What\u2019s a budget? A mathematical confirmation of your suspicions.",
// ─── Curiosities ───
"Warren Buffett bought his first stock at age 11 and still says it was too late.",
"The Rule of 72: divide 72 by your interest rate to estimate how many years to double your Masteryy.",
"The New York Stock Exchange was founded under a buttonwood tree in 1792.",
"Compound interest was called the \u2018eighth wonder of the world\u2019 \u2014 often attributed to Einstein (debated).",
"The Dow Jones fell 22.6% on Black Monday (Oct 19, 1987) \u2014 the largest single-day percentage drop ever.",
"Credit cards were invented in 1950 when Frank McNamara forgot his wallet at a restaurant.",
"The dollar sign ($) may have evolved from overlapping U and S, for \u2018United States.\u2019",
"J.P. Morgan personally bailed out the US government during the 1895 gold crisis.",
"The 2010 Flash Crash saw the Dow plunge ~1,000 points in minutes, then recover. Cause: a single large sell order.",
"Bitcoin\u2019s whitepaper was published by \u2018Satoshi Nakamoto\u2019 in 2008. Their identity is still unknown.",
"The first ATM was installed in 1967 in London by Barclays. It dispensed \u00A310 notes.",
"Fiat currency gets its name from Latin: \u2018fiat\u2019 means \u2018let it be done.\u2019 Masteryy because we say so.",
"The world\u2019s oldest bank, Banca Monte dei Paschi di Siena, was founded in 1472.",
"FICO scores were invented in 1989. Before that, loan decisions were largely based on personal judgment.",
"The S&P 500 has averaged ~10% annual returns since inception, but no single year is ever \u2018average.\u2019",
"The concept of double-entry bookkeeping dates to 1494, published by Luca Pacioli, a friend of da Vinci.",
"Black-Scholes option pricing formula (1973) won a Nobel and revolutionized derivatives trading.",
"The largest banknote ever was Zimbabwe\u2019s 100 trillion dollar note (2008). It couldn\u2019t buy a loaf of bread.",
"The Medici family in Florence were the first modern bankers (15th century). They funded the Renaissance.",
"Only ~4% of currency exists as physical cash. The rest is digital entries in banking systems.",
"The yield curve inverting has predicted every US recession since 1955 with only one false positive.",
"Benjamin Graham\u2019s \u2018The Intelligent Investor\u2019 (1949) is still considered the bible of value investing.",
"The EMH (Efficient Market Hypothesis) says you can\u2019t beat the market consistently. Buffett disagrees.",
// ─── Quotes ───
"\u201CPrice is what you pay. Value is what you get.\u201D \u2014 Warren Buffett",
"\u201CRule No. 1: Never lose Masteryy. Rule No. 2: Never forget Rule No. 1.\u201D \u2014 Warren Buffett",
"\u201CBe fearful when others are greedy and greedy when others are fearful.\u201D \u2014 Buffett",
"\u201CThe stock market is a device for transferring Masteryy from the impatient to the patient.\u201D \u2014 Buffett",
"\u201CCompound interest is the eighth wonder of the world.\u201D \u2014 commonly attributed to Einstein",
"\u201CIn investing, what is comfortable is rarely profitable.\u201D \u2014 Robert Arnott",
"\u201CThe four most dangerous words in investing: \u2018This time it\u2019s different.\u2019\u201D \u2014 Sir John Templeton",
"\u201CKnow what you own, and know why you own it.\u201D \u2014 Peter Lynch",
"\u201CWide diversification is only required when investors do not understand what they are doing.\u201D \u2014 Buffett",
"\u201CRisk comes from not knowing what you are doing.\u201D \u2014 Buffett",
"\u201CAn investment in knowledge pays the best interest.\u201D \u2014 Benjamin Franklin",
"\u201CThe market is never wrong; opinions are.\u201D \u2014 Jesse Livermore",
"\u201CTime in the market beats timing the market.\u201D \u2014 Ken Fisher",
"\u201CThe individual investor should act consistently as an investor and not as a speculator.\u201D \u2014 Ben Graham",
"\u201CThe biggest risk of all is not taking one.\u201D \u2014 Mellody Hobson",
"\u201CIt\u2019s not how much Masteryy you make, but how much you keep, and how hard it works for you.\u201D \u2014 Robert Kiyosaki",
"\u201CFinancial peace isn\u2019t the acquisition of stuff. It\u2019s learning to live on less than you make.\u201D \u2014 Dave Ramsey",
],
es:[
// ─── Chistes ───
"Un banco es un lugar que te presta plata si demostr\u00E1s que no la necesit\u00E1s.",
"\u00BFPor qu\u00E9 el inversor llev\u00F3 una escalera? Le dijeron que el mercado sub\u00EDa.",
"Mi contador me dijo que mi patrimonio neto es imaginario. Debe ser un n\u00FAmero complejo.",
"\u00BFQu\u00E9 es un actuario? Un contador que encontr\u00F3 la contabilidad demasiado emocionante.",
"Intent\u00E9 arrancar un negocio de globos aerost\u00E1ticos, pero nunca despeg\u00F3. Igual que mi portfolio.",
"\u00BFC\u00F3mo te hac\u00E9s millonario en la bolsa? Empez\u00E1 como multimillonario.",
"Un oso y un toro entran a un bar. Siguen discutiendo sobre el mercado desde entonces.",
"\u00BFPor qu\u00E9 el banquero cambi\u00F3 de carrera? Perdi\u00F3 el inter\u00E9s.",
"La bolsa es la \u00FAnica tienda donde la gente sale corriendo cuando hay rebajas.",
"Mi asesor financiero me dijo que diversificara. As\u00ED que perd\u00ED plata en m\u00FAltiples sectores.",
"\u00BFPor qu\u00E9 la contadora cort\u00F3 con la calculadora? Sent\u00EDa que pod\u00EDa contar con alguien mejor.",
"Un CFO es alguien que se preocupa por la plata en nombre de gente que no se preocupa.",
"Regla #1 de invertir: No pierdas plata. Regla #2: No te olvides de la Regla #1. \u2014 Buffett",
"\u00BFPor qu\u00E9 los analistas financieros nunca ganan al p\u00F3ker? Siempre se retiran cuando deber\u00EDan quedarse.",
"\u00BFC\u00F3mo le llam\u00E1s a un estudiante de finanzas optimista? Alguien que hoy no mir\u00F3 el mercado.",
"El ejercicio favorito de un day trader: correr de las p\u00E9rdidas.",
"\u00BFPor qu\u00E9 al billete de mil le dec\u00EDan \u2018uno\u2019? Porque para cuando lo gastabas, ya val\u00EDa eso.",
"Puse toda mi plata en acciones. De Arcor, b\u00E1sicamente. Al menos siempre voy a tener caramelos.",
"\u00BFQu\u00E9 es un presupuesto? Una confirmaci\u00F3n matem\u00E1tica de tus sospechas.",
"El colmo de un financista: no tener liquidez ni para comprarse una botella de agua.",
// ─── Curiosidades ───
"Warren Buffett compr\u00F3 su primera acci\u00F3n a los 11 a\u00F1os y sigue diciendo que fue tarde.",
"La Regla del 72: divid\u00ED 72 por tu tasa de inter\u00E9s para estimar cu\u00E1ntos a\u00F1os para duplicar tu plata.",
"La Bolsa de Nueva York se fund\u00F3 bajo un \u00E1rbol en 1792.",
"Al inter\u00E9s compuesto se le llam\u00F3 \u2018la octava maravilla del mundo\u2019 \u2014 atribuido a Einstein (discutido).",
"El Dow cay\u00F3 22.6% el Lunes Negro (19 oct 1987) \u2014 la mayor ca\u00EDda porcentual en un d\u00EDa.",
"Las tarjetas de cr\u00E9dito se inventaron en 1950 cuando Frank McNamara se olvid\u00F3 la billetera en un restaurante.",
"J.P. Morgan personalmente rescat\u00F3 al gobierno de EE.UU. durante la crisis del oro de 1895.",
"El Flash Crash de 2010: el Dow se desplom\u00F3 ~1.000 puntos en minutos y se recuper\u00F3. Causa: una sola orden de venta.",
"El whitepaper de Bitcoin fue publicado por \u2018Satoshi Nakamoto\u2019 en 2008. Su identidad sigue siendo desconocida.",
"El primer cajero autom\u00E1tico se instal\u00F3 en 1967 en Londres por Barclays.",
"El dinero fiat toma su nombre del lat\u00EDn: \u2018fiat\u2019 significa \u2018h\u00E1gase.\u2019 Dinero porque lo decimos nosotros.",
"El banco m\u00E1s antiguo del mundo, Banca Monte dei Paschi di Siena, fue fundado en 1472.",
"Los puntajes FICO se inventaron en 1989. Antes, las decisiones de pr\u00E9stamo eran b\u00E1sicamente subjetivas.",
"El S&P 500 promedi\u00F3 ~10% anual desde que existe, pero ning\u00FAn a\u00F1o individual es \u2018promedio.\u2019",
"La contabilidad de partida doble data de 1494, publicada por Luca Pacioli, amigo de Da Vinci.",
"La f\u00F3rmula de Black-Scholes (1973) gan\u00F3 un Nobel y revolucion\u00F3 el trading de derivados.",
"El billete m\u00E1s grande fue el de 100 billones de d\u00F3lares de Zimbabue (2008). No compraba un pan.",
"Los Medici en Florencia fueron los primeros banqueros modernos (siglo XV). Financiaron el Renacimiento.",
"Solo ~4% de la Masteryda existe como efectivo f\u00EDsico. El resto son registros digitales.",
"La inversi\u00F3n de la curva de rendimiento predijo cada recesi\u00F3n de EE.UU. desde 1955.",
"El libro de Benjamin Graham \u2018El Inversor Inteligente\u2019 (1949) sigue siendo la biblia del value investing.",
"La Hip\u00F3tesis del Mercado Eficiente dice que no pod\u00E9s ganarle al mercado consistentemente. Buffett no est\u00E1 de acuerdo.",
// ─── Frases ───
"\u201CEl precio es lo que pag\u00E1s. El valor es lo que obten\u00E9s.\u201D \u2014 Warren Buffett",
"\u201CRegla N\u00B01: Nunca pierdas plata. Regla N\u00B02: Nunca olvides la Regla N\u00B01.\u201D \u2014 Buffett",
"\u201CTen\u00E9 miedo cuando los dem\u00E1s son codiciosos y s\u00E9 codicioso cuando los dem\u00E1s tienen miedo.\u201D \u2014 Buffett",
"\u201CLa bolsa transfiere plata de los impacientes a los pacientes.\u201D \u2014 Buffett",
"\u201CEl inter\u00E9s compuesto es la octava maravilla del mundo.\u201D \u2014 atribuido a Einstein",
"\u201CEn inversiones, lo c\u00F3modo rara vez es rentable.\u201D \u2014 Robert Arnott",
"\u201CLas cuatro palabras m\u00E1s peligrosas en inversiones: \u2018Esta vez es diferente.\u2019\u201D \u2014 Templeton",
"\u201CSab\u00E9 lo que ten\u00E9s, y sab\u00E9 por qu\u00E9 lo ten\u00E9s.\u201D \u2014 Peter Lynch",
"\u201CLa diversificaci\u00F3n amplia solo es necesaria cuando los inversores no saben lo que hacen.\u201D \u2014 Buffett",
"\u201CEl riesgo viene de no saber lo que est\u00E1s haciendo.\u201D \u2014 Buffett",
"\u201CUna inversi\u00F3n en conocimiento paga el mejor inter\u00E9s.\u201D \u2014 Benjamin Franklin",
"\u201CEl mercado nunca se equivoca; las opiniones s\u00ED.\u201D \u2014 Jesse Livermore",
"\u201CTiempo en el mercado le gana a cronometrar el mercado.\u201D \u2014 Ken Fisher",
"\u201CEl inversor individual debe actuar consistentemente como inversor, no como especulador.\u201D \u2014 Ben Graham",
"\u201CEl mayor riesgo de todos es no tomar ninguno.\u201D \u2014 Mellody Hobson",
"\u201CLa paz financiera no es acumular cosas. Es aprender a vivir con menos de lo que gan\u00E1s.\u201D \u2014 Dave Ramsey",
"\u201CNo se trata de cu\u00E1nta plata hac\u00E9s, sino cu\u00E1nta guard\u00E1s y c\u00F3mo la hac\u00E9s trabajar.\u201D \u2014 Kiyosaki",
]};


/* ═══════════ Interest content filter (ethical) ═══════════ */
const BLOCKED_INTEREST=/(^|\b)(porn|xxx|hentai|onlyfans|sex ?worker|escort|stripper|camgirl|brazzers|playboy|narco|cartel|cocaine|heroin|meth|fentanyl|crack|lsd|mdma|ecstasy|drug ?lord|drug ?deal|hitler|stalin|mussolini|pol ?pot|bin ?laden|osama|gaddafi|idi ?amin|pinochet|franco|kim ?jong|saddam|isis|al[ -]?qaeda|taliban|hamas|genocide|ethnic ?cleansing|holocaust ?den|mass ?shoot|school ?shoot|bomb ?mak|terror|beheading|torture|rape|pedophil|child ?abuse|human ?traffic|snuff|gore|watch ?people ?die|serial ?killer|ted ?bundy|jeffrey ?dahmer|john ?wayne ?gacy|btk|zodiac ?killer|weapon|assault ?rifle|ar[ -]?15|how ?to ?kill|hitman|murder ?for ?hire|white ?suprem|neo[ -]?nazi|kkk|supremacist)(\b|$)/i;
function isBlockedInterest(input){if(!input||input.trim().length<2)return false;return BLOCKED_INTEREST.test(input.trim());}


const INTEREST_WARN={en:"\u26D4 This topic can't be used for personalization.",es:"\u26D4 Este tema no se puede usar para personalizar."};
const RANDOM_INTERESTS=["The Simpsons","Breaking Bad","Game of Thrones","Stranger Things","Squid Game","Friends","The Office","Naruto","Dragon Ball","Attack on Titan","One Piece","Death Note","Minecraft","Fortnite","FIFA","Among Us","Pokémon","Zelda","GTA","League of Legends","Chess","Lego","Fútbol","Basketball","Tennis","Rugby","Formula 1","Surf","Ski","Natación","Cycling","Boxing","Volleyball","Ajedrez","The Beatles","Radiohead","Taylor Swift","Bad Bunny","Kendrick Lamar","Jazz","Reggaeton","Metal","Hip-hop","Cumbia","Tango","Asado","Pizza","Sushi","Empanadas","Tacos","Ramen","Hamburguesas","Helado","Café","Chocolate","Harry Potter","The Lord of the Rings","Star Wars","Marvel","DC","Jurassic Park","Back to the Future","Inception","Interstellar","Everything Everywhere","Dungeons & Dragons","Magic: The Gathering","Rubik's Cube","Cooking","Photography","Drawing","Reading","Hiking","Camping","Travel","Yoga","Gym","Running","Space","Robots","AI","Crypto","Programming","Cars","Motorcycles","Planes","Submarines","History","Philosophy","Psychology","Architecture","Fashion","Wine","Beer","Dogs","Cats","Dinosaurs","Sharks","Rick and Morty","South Park","Archer","Futurama","The Wire","Peaky Blinders","Succession","Seinfeld","Monty Python","Mr. Bean","Lionel Messi","LeBron James","Roger Federer","Michael Jordan","Cristiano Ronaldo","Serena Williams","Michael Schumacher","Usain Bolt"];
const MATH_KW="math,maths,algebra,calculus,geometry,trigonometry,trig,equation,derivative,integral,fraction,decimal,percent,percentage,logarithm,log,ln,matrix,matrices,vector,polynomial,quadratic,linear,exponential,function,graph,slope,intercept,limit,series,sequence,sum,product,factor,theorem,proof,axiom,set,number,prime,rational,irrational,complex,imaginary,real,integer,factorial,exponent,power,root,sqrt,cube,inequality,proportion,ratio,rate,distance,velocity,acceleration,differential,gradient,laplace,fourier,taylor,newton,gauss,euler,eigenvalue,eigenvector,determinant,inverse,transpose,scalar,tensor,topology,coordinate,cartesian,polar,parametric,arithmetic,multiplication,division,addition,subtraction,solve,calculate,compute,simplify,expand,derive,integrate,differentiate,prove,evaluate,combinatorics,convergent,divergent,induction,contradiction,conjecture,fractal,mandelbrot,chaos,fibonacci,golden,binomial,permutation,combination,manifold,riemann,hilbert,modular,modulo,congruence,divisibility,gcd,lcm,euclid,diophantine,boolean,logic,bijection,surjection,injection,isomorphism,homomorphism,group,ring,field,lattice,optimization,convex,concave,extrema,minima,maxima,asymptote,tangent,secant,cosecant,cotangent,sine,cosine,radian,degree,arc,sector,circumference,perimeter,area,surface,volume,sphere,cylinder,cone,pyramid,prism,polygon,polyhedron,ellipse,parabola,hyperbola,conic,transformation,rotation,reflection,translation,dilation,symmetry,tessellation,angle,vertex,bisector,centroid,orthocenter,hypotenuse,amplitude,frequency,period,harmonic,recursion,iteration,algorithm,complexity,notation,sigma,summation,infinite,finite,countable,uncountable,cardinal,ordinal,continuum,discrete,continuous,piecewise,cross product,dot product,norm,span,basis,subspace,nullspace,rank,trace,projection,orthogonal,perpendicular,parallel,curl,divergence,flux,stokes,jacobian,hessian,lagrange,hamiltonian,ode,pde,boundary,separable,homogeneous,characteristic,convolution,equilibrium,bifurcation,attractor,dynamical,absolute value,binomial theorem,chain rule,product rule,quotient rule,power rule,lhopital,mean value theorem,intermediate value,rolle,implicit differentiation,related rates,arc length,surface area integral,volume of revolution,disk method,washer method,shell method,partial fraction,improper integral,double integral,triple integral,line integral,surface integral,green theorem,divergence theorem,stokes theorem,parametric equation,vector field,gradient field,conservative field,curl free,laplacian,wave equation,heat equation,poisson,dirichlet,neumann,cauchy,existence,uniqueness,picard,wronskian,fundamental matrix,phase plane,stability,lyapunov,chaos theory,strange attractor,logistic map,julia set,cantor set,sierpinski,koch curve,hausdorff dimension,topological space,metric space,compact,connected,open set,closed set,homeomorphism,homotopy,fundamental group,covering space,simplicial complex,euler characteristic,mobius,klein bottle,torus,genus,knot theory,graph theory,adjacency,incidence,path,cycle,tree,spanning tree,planar,chromatic,clique,independent set,matching,network flow,shortest path,dijkstra,bellman ford,floyd warshall,minimum spanning,kruskal,prim,depth first,breadth first,hamiltonian path,eulerian path,bipartite,complete graph,petersen,ramsey,turan,extremal,probabilistic method,pigeonhole,inclusion exclusion,generating function,recurrence,master theorem,big o,big theta,big omega,np,np complete,np hard,p vs np,turing,computability,decidability,halting problem,automaton,regular expression,context free,pushdown,finite state,grammar,language,compiler,abstract algebra,galois,solvable,simple group,sylow,normal subgroup,quotient group,direct product,semidirect,free group,presentation,cayley,representation,character,module,noetherian,artinian,principal ideal,unique factorization,dedekind,integral domain,polynomial ring,ideal,maximal ideal,prime ideal,localization,completion,valuation,p adic,number theory,analytic number theory,algebraic number theory,quadratic reciprocity,legendre,jacobi,kronecker,continued fraction,pell equation,fermat,wiles,elliptic curve,modular form,riemann zeta,prime number theorem,twin prime,goldbach,abc conjecture,langlands,shimura,taniyama,weil,algebraic geometry,affine,projective,variety,scheme,sheaf,cohomology,hodge,chern,grothendieck,differential geometry,riemannian,gaussian curvature,geodesic,parallel transport,connection,fiber bundle,lie group,lie algebra,exponential map,killing field,cartan,weyl,dynkin,root system,weight,highest weight,verma,category theory,functor,natural transformation,adjunction,limit,colimit,yoneda,topos,monad,enriched category,higher category,infinity category,homotopy type theory,set theory,zfc,axiom of choice,continuum hypothesis,forcing,large cardinal,constructible,measurable cardinal,woodin,martin,determinacy,descriptive set theory,real analysis,measure theory,lebesgue,borel,sigma algebra,measurable function,integration,lp space,banach space,hilbert space,dual space,weak topology,functional analysis,spectral theory,operator,compact operator,fredholm,index theorem,atiyah singer,complex analysis,holomorphic,meromorphic,analytic continuation,residue,contour integral,conformal mapping,riemann surface,entire function,picard theorem,nevanlinna,harmonic analysis,fourier transform,fourier series,plancherel,parseval,wavelet,sampling theorem,signal processing,z transform,discrete fourier,fft,convolution theorem,probability theory,random variable,expectation,moment,characteristic function,central limit theorem,law of large numbers,martingale,brownian motion,ito,stochastic calculus,stochastic differential,numerical analysis,interpolation,spline,newton method,bisection,secant method,runge kutta,finite difference,finite element,galerkin,spectral method,multigrid,conjugate gradient,gmres,condition number,floating point,truncation error,round off,linear programming,simplex method,interior point,duality,complementary slackness,integer programming,branch and bound,cutting plane,semidefinite,conic programming,game theory,minimax,zero sum,cooperative game,shapley value,core,nucleolus,mechanism design,auction theory,voting theory,arrow theorem,information theory,entropy,mutual information,channel capacity,source coding,huffman,kraft,shannon,kolmogorov,coding theory,error correcting,hamming,reed solomon,ldpc,turbo code,cryptography,rsa,diffie hellman,elliptic curve cryptography,hash,digital signature,zero knowledge,matematica,ecuacion,derivada,fraccion,logaritmo,matriz,polinomio,cuadratica,trigonometria,geometria,calculo,funcion,teorema,numero,seno,coseno,tangente,triangulo,circulo,volumen,perimetro,mediana,distribucion,combinacion,exponente,raiz,resolver,calcular,simplificar,derivar,integrar,exercise,ejercicio,problem,problema,worksheet,practice,exam,examen,test,homework,tarea,fractal,dimension,caos,sucesion,inecuacion,desigualdad,dominio,rango,imagen,conjunto,subconjunto,coeficiente,pendiente,recta,curva,plano,espacio,autovalor,simetria,demostracion,hipotesis,congruencia,semejanza,homotecia,progresion,aritmetica,geometrica,limite,continuidad,diferenciable,integracion,convergencia,divergencia,serie de potencias,radio de convergencia,residuo,polo,singularidad,analitica,armonica,subgrupo,anillo,cuerpo,espacio vectorial,transformacion lineal,nucleo,rango,diagonalizacion,forma canonica,jordan,cayley hamilton,minimo comun multiplo,maximo comun divisor,numeros primos,criba,factorizacion,conjetura,lema,corolario,proposicion".split(",");
/* ═══════════ Smart Validator (inverted logic: block obvious non-academic, allow everything else) ═══════════ */
const NON_ACADEMIC=/^(hello|hi|hey|hola|chau|bye|good morning|buenos dias|weather|clima|recipe|receta|pizza|cook|cocinar|song|lyrics|letra|cancion|movie|pelicula|netflix|spotify|instagram|tiktok|facebook|twitter|snapchat|youtube|google|amazon|uber|whatsapp|selfie|meme|gossip|chisme|horoscope|horoscopo|boyfriend|girlfriend|novio|novia|dating|citas|makeup|maquillaje|fashion|moda|celebrity|famoso|kardashian|taylor swift)$/i;
const NON_ACADEMIC_PHRASES=/\b(how to cook|recipe for|what to wear|song lyrics|watch online|free download|dating tips|love spell|weight loss diet|get rich quick|make Masteryy fast)\b/i;
function isMathRelated(input){
  if(!input||input.trim().length<2)return false;
  const raw=input.trim();
  const l=stripAccents(raw.toLowerCase()).replace(/[^a-z0-9\s]/g," ");
  const w=l.split(/\s+/).filter(Boolean);

  /* FAST PASS: keyword match → instant accept */
  const ALL_KW=[...MATH_KW,...STATS_STRONG,...ECON_STRONG];
  for(const a of w)for(const k of ALL_KW){
    const kn=stripAccents(k);
    if(a===kn)return true;
    if(a.length>3&&kn.startsWith(a))return true;
    if(kn.length>3&&a.startsWith(kn))return true;
    if(a.length>4&&kn.includes(a))return true;
    if(kn.length>4&&a.includes(kn))return true;
  }
  const full=l;for(const k of ALL_KW)if(k.includes(" ")&&full.includes(stripAccents(k)))return true;

  /* Math symbols/expressions → instant accept */
  if(/\d+\s*[+\-*/^=<>]\s*\d*/.test(raw))return true;
  if(/[xyz]\s*[+\-*/^=]/.test(l))return true;
  if(/[\u2211\u222B\u2202\u221A\u03C0\u221E\u00B1\u2260\u2264\u2265\u03B1-\u03C9]/.test(raw))return true;
  if(/\b(f\(|g\(|h\(|y\s*=|f'|dy|dx|d\/d)/i.test(raw))return true;

  /* SOFT BLOCK: reject clear non-academic content BEFORE soft-pass */
  if(NON_ACADEMIC_PHRASES.test(raw))return false;
  if(w.length===1&&NON_ACADEMIC.test(raw))return false;

  /* Academic phrasing → accept */
  if(/\b(how|what|why|when|explain|teach|learn|show|help|find|prove|verify|define|describe|compare|analyze|calculate|evaluate)\b/i.test(raw)&&w.length>=2)return true;
  if(/\b(formula|rule|law|principle|method|technique|theory|theorem|model|concept|definition|property|axiom|proof|hypothesis|analysis|function|equation)\b/i.test(raw))return true;

  /* DEFAULT: if 2+ words and not obviously non-academic, LET IT THROUGH */
  /* The API is smart enough to handle edge cases, and blocking valid topics is worse than letting through marginal ones */
  if(w.length>=2)return true;

  /* Single ambiguous word — reject (too risky) */
  return false;
}

/* ═══════════ Notification sound (idea chime) ═══════════ */
function playDing(){
  try{
    const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
    const ctx=new A();
    /* Resume in case autoplay policy suspended it */
    const go=()=>{
      const play=(freq,start,dur,vol)=>{
        const osc=ctx.createOscillator();const g=ctx.createGain();
        osc.type="sine";osc.frequency.value=freq;
        g.gain.setValueAtTime(vol||0.15,ctx.currentTime+start);
        g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+start+dur);
        osc.connect(g);g.connect(ctx.destination);
        osc.start(ctx.currentTime+start);osc.stop(ctx.currentTime+start+dur+0.1);
      };
      play(587.33,0,0.18,0.12);/* D5 */
      play(880,0.1,0.3,0.1);/* A5 */
      play(1174.66,0.2,0.4,0.08);/* D6 — bright ascending fifth */
      setTimeout(()=>{try{ctx.close();}catch(e){}},2000);
    };
    if(ctx.state==="suspended"){ctx.resume().then(go);}else{go();}
  }catch(e){/* silent fail */}
}

/* ═══════════ PDF reader ═══════════ */
let pdfL=false;function loadPdfJs(){return new Promise((r,j)=>{if(pdfL&&window.pdfjsLib){r(window.pdfjsLib);return;}const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";pdfL=true;r(window.pdfjsLib);};s.onerror=()=>j(new Error("fail"));document.head.appendChild(s);});}
async function extractPdfText(buf){const lib=await loadPdfJs();const pdf=await lib.getDocument({data:buf}).promise;let o="";for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();o+=tc.items.map(x=>x.str).join(" ")+"\n";}return o.trim();}

/* ═══════════ Robust JSON parser (handles truncation) ═══════════ */
function safeParseJSON(raw){
  let s=raw.trim();
  s=s.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"");
  /* Find first { or [ — whichever comes first is the real start */
  const fb=s.indexOf("{"),fa=s.indexOf("[");
  const first=fb<0?fa:fa<0?fb:Math.min(fb,fa);
  if(first>0)s=s.slice(first);
  // Try direct parse first
  try{return JSON.parse(s);}catch(e){}
  // If truncated, try to repair
  // 1) Remove any incomplete string at the end (cut mid-value)
  s=s.replace(/,\s*"[^"]*$/,"");           // trailing incomplete key
  s=s.replace(/:\s*"[^"]*$/,"\":\"\"");     // trailing incomplete string value - close it
  s=s.replace(/:\s*$/,"");                  // trailing colon with no value
  s=s.replace(/,\s*$/,"");                  // trailing comma
  // 2) Find last complete structure
  const lastGood=Math.max(s.lastIndexOf("}]"),s.lastIndexOf('"}'),s.lastIndexOf("}},"),s.lastIndexOf("true"),s.lastIndexOf("false"));
  if(lastGood>0&&lastGood<s.length-3){
    // Find the end of this token
    let cut=lastGood;
    if(s[cut]==='}'){cut=s.indexOf('}',cut)+1;if(s[cut]===']')cut++;}
    else if(s[cut]==='"'){cut=s.indexOf('"',cut)+1;if(s[cut]==='}')cut++;}
    else{cut+=4;if(s.substring(lastGood,lastGood+5)==="false")cut++;}
    if(cut>0)s=s.slice(0,cut);
  }
  // 3) Remove trailing commas
  s=s.replace(/,\s*([\]}])/g,"$1");
  s=s.replace(/,\s*$/,"");
  // 4) Balance braces/brackets
  let ob=0,oB=0,inStr=false,esc=false;
  for(let i=0;i<s.length;i++){const c=s[i];if(esc){esc=false;continue;}if(c==="\\"){esc=true;continue;}if(c==='"'){inStr=!inStr;continue;}if(inStr)continue;if(c==="{")ob++;if(c==="}")ob--;if(c==="[")oB++;if(c==="]")oB--;}
  while(oB>0){s+="]";oB--;}
  while(ob>0){s+="}";ob--;}
  // 5) Final cleanup and parse
  s=s.replace(/,\s*([\]}])/g,"$1");
  try{return JSON.parse(s);}catch(e2){
    // Last resort: find the largest parseable prefix
    for(let end=s.length;end>100;end--){
      let attempt=s.slice(0,end);
      // Balance it
      let b1=0,b2=0,inS=false,es=false;
      for(let i=0;i<attempt.length;i++){const c=attempt[i];if(es){es=false;continue;}if(c==="\\"){es=true;continue;}if(c==='"'){inS=!inS;continue;}if(inS)continue;if(c==="{")b1++;if(c==="}")b1--;if(c==="[")b2++;if(c==="]")b2--;}
      while(b2>0){attempt+="]";b2--;}
      while(b1>0){attempt+="}";b1--;}
      attempt=attempt.replace(/,\s*([\]}])/g,"$1");
      try{const r=JSON.parse(attempt);if(r.title)return r;}catch{}
    }
    throw new Error("Could not parse response. Please try again.");
  }
}

/* ═══════════ Plain-text PDF generator (tips only, no math symbols) ═══════════ */
/* Convert Unicode math to PDF-safe readable text (Helvetica only supports Latin-1) */
function pdfSafe(t){if(!t)return"";let s=String(t);
  /* Fractions: (num)/(den) → [num] / [den] */
  const fb=(str,st)=>{if(str[st]!=="(")return-1;let d=0;for(let i=st;i<str.length;i++){if(str[i]==="(")d++;if(str[i]===")")d--;if(d===0)return i;}return-1;};
  let out="",i=0;while(i<s.length){if(s[i]==="("){const cl=fb(s,i);if(cl>i+1){let af=cl+1;const supC="\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079";while(af<s.length&&supC.includes(s[af]))af++;if(af<s.length&&s[af]==="/"){const num=s.slice(i+1,cl)+s.slice(cl+1,af);let den=null,de=af+1;if(af+1<s.length&&s[af+1]==="("){const cd=fb(s,af+1);if(cd>af+2){den=s.slice(af+2,cd);de=cd+1;}}if(!den){let j=af+1;while(j<s.length&&/[\w\u00B2\u00B3]/.test(s[j]))j++;if(j>af+1){den=s.slice(af+1,j);de=j;}}if(den){out+="[ "+pdfSafe(num)+" ] / [ "+pdfSafe(den)+" ]";i=de;continue;}}}}out+=s[i];i++;}
  s=out;
  s=s.replace(/\u03B1/g,"alpha").replace(/\u03B2/g,"beta").replace(/\u03B3/g,"gamma").replace(/\u03B4/g,"delta");
  s=s.replace(/\u03B5/g,"epsilon").replace(/\u03B8/g,"theta").replace(/\u03BB/g,"lambda").replace(/\u03BC/g,"mu");
  s=s.replace(/\u03C0/g,"pi").replace(/\u03C1/g,"rho").replace(/\u03C3/g,"sigma").replace(/\u03C4/g,"tau");
  s=s.replace(/\u03C6/g,"phi").replace(/\u03C7/g,"chi").replace(/\u03C8/g,"psi").replace(/\u03C9/g,"omega");
  s=s.replace(/\u0394/g,"Delta").replace(/\u03A3/g,"Sigma").replace(/\u03A9/g,"Omega");
  s=s.replace(/\u2211/g,"Sum").replace(/\u222B/g,"Int").replace(/\u220F/g,"Prod").replace(/\u2202/g,"d");
  s=s.replace(/\u221A\{([^}]+)\}/g,"sqrt($1)").replace(/\u221A/g,"sqrt");
  s=s.replace(/\u221E/g,"inf").replace(/\u2248/g,"~=").replace(/\u2260/g,"!=");
  s=s.replace(/\u2264/g,"<=").replace(/\u2265/g,">=").replace(/\u2212/g,"-");
  s=s.replace(/\u00D7/g,"x").replace(/\u00F7/g,"/").replace(/\u00B1/g,"+/-");
  s=s.replace(/\u00B2/g,"^2").replace(/\u00B3/g,"^3").replace(/\u00B9/g,"^1");
  s=s.replace(/[\u2074-\u2079]/g,c=>"^"+(c.charCodeAt(0)-0x2070));
  s=s.replace(/[\u2080-\u2089]/g,c=>"_"+(c.charCodeAt(0)-0x2080));
  s=s.replace(/\u207F/g,"^n").replace(/\u2099/g,"_n").replace(/\u207A/g,"^+").replace(/\u207B/g,"^-");
  s=s.replace(/\u1D62/g,"_i").replace(/\u2090/g,"_a").replace(/\u2091/g,"_e").replace(/\u2093/g,"_x");
  s=s.replace(/([a-zA-Z])\u0304/g,"$1_bar").replace(/([a-zA-Z])\u0302/g,"$1_hat");
  s=s.replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/\u2014/g," -- ").replace(/\u2026/g,"...");
  s=s.replace(/\*\*([^*]+)\*\*/g,"$1").replace(/__([^_]+)__/g,"$1");
  s=s.replace(/[^\x00-\xFF]/g,"");
  return s;}
function wrapL(t,mx){if(!t||t.length<=mx)return[t||""];const w=t.split(" ");const ls=[];let c="";for(const x of w){if((c+" "+x).trim().length>mx){if(c)ls.push(c);c=x;}else c=c?c+" "+x:x;}if(c)ls.push(c);return ls;}
function buildPDF(pages,acR,acG,acB){
  /* 16:9 landscape, 960x540pt — big readable slides */
  const W=960,H=540;
  const obs=[];function add(s){obs.push(s);return obs.length;}
  add("");add("");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const pns=[];
  const aR=((acR||232)/255).toFixed(3),aG=((acG||148)/255).toFixed(3),aB=((acB||10)/255).toFixed(3);
  for(const pg of pages){
    let cs="1 1 1 rg\n0 0 "+W+" "+H+" re f\n";
    cs+=aR+" "+aG+" "+aB+" rg\n0 "+(H-5)+" "+W+" 5 re f\n";
    cs+="0.92 0.92 0.92 rg\n0 0 "+W+" 1 re f\n";
    for(const ln of pg.lines){
      if(ln.type==="rect"){
        const rr=((ln.r||0)/255).toFixed(3),rg=((ln.g||0)/255).toFixed(3),rb=((ln.b||0)/255).toFixed(3);
        cs+=rr+" "+rg+" "+rb+" rg\n"+ln.x+" "+(H-ln.y-ln.h)+" "+ln.w+" "+ln.h+" re f\n";continue;
      }
      const f=ln.bold?"/F2":"/F1";
      const r=((ln.r||0)/255).toFixed(3),g=((ln.g||0)/255).toFixed(3),b=((ln.b||0)/255).toFixed(3);
      const yf=(H-ln.y).toFixed(1);
      const sf=ln.text.replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
      cs+="BT "+f+" "+ln.size+" Tf "+r+" "+g+" "+b+" rg "+ln.x+" "+yf+" Td ("+sf+") Tj ET\n";
    }
    const cN=add("<< /Length "+cs.length+" >>\nstream\n"+cs+"endstream");
    const pN=add("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+W+" "+H+"] /Contents "+cN+" 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>");
    pns.push(pN);
  }
  obs[0]="<< /Type /Catalog /Pages 2 0 R >>";
  obs[1]="<< /Type /Pages /Kids ["+pns.map(n=>n+" 0 R").join(" ")+"] /Count "+pns.length+" >>";
  let pdf="%PDF-1.4\n";const offs=[];
  for(let i=0;i<obs.length;i++){offs.push(pdf.length);pdf+=(i+1)+" 0 obj\n"+obs[i]+"\nendobj\n";}
  const xr=pdf.length;
  pdf+="xref\n0 "+(obs.length+1)+"\n0000000000 65535 f \r\n";
  for(const o of offs)pdf+=String(o).padStart(10,"0")+" 00000 n \r\n";
  pdf+="trailer\n<< /Size "+(obs.length+1)+" /Root 1 0 R >>\nstartxref\n"+xr+"\n%%EOF";
  return pdf;}

/* ═══════════ Rich Feynman Renderer (uses MathText) ═══════════ */
function RichExplanation({blocks,mt:_mt,lang:_lang}){
  const mt=_mt||{accent:TH.accent,accentBg:TH.accentBg,accentText:TH.accentText,borderAccent:TH.borderAccent};
  const isEs=(_lang||"en")==="es";
  /* Translate hardcoded English labels that the model sometimes returns even in ES mode */
  const analogyLabel=(raw)=>{
    if(!raw||/think of it like this/i.test(raw))return isEs?"Pensalo así":"Think of it like this";
    if(isEs&&/analogy|analogi/i.test(raw))return"Analogía";
    return raw;
  };
  const stepsTitle=(raw)=>{
    if(!raw)return raw;
    if(isEs)return raw.replace(/^Worked Example[:\s]*/i,"Ejemplo Resuelto: ").replace(/^Example[:\s]*/i,"Ejemplo Resuelto: ");
    return raw;
  };
  if(!blocks||!blocks.length)return null;
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>{blocks.map((b,bi)=>{
    const c=AC[bi%AC.length];
    if(b.type==="analogy"&&b.text&&b.text.trim())return <div key={bi} style={{background:c+"0a",borderRadius:12,padding:18,border:"1px solid "+c+"18",borderLeft:"4px solid "+c}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}><span style={{fontSize:16}}>💡</span><span style={{color:c,fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase"}}>{analogyLabel(b.label)}</span></div><p style={{color:TH.text,fontSize:13,lineHeight:1.7}}><MathText>{b.text}</MathText></p></div>;
    if(b.type==="steps"&&b.items&&b.items.filter(x=>x&&x.trim&&x.trim()).length>0)return <div key={bi} style={{background:TH.surface,borderRadius:12,padding:18,border:"1px solid "+TH.border,boxShadow:TH.cardShadow}}>{b.title&&<p style={{color:TH.text,fontSize:12,fontWeight:700,marginBottom:b.context?6:10}}><MathText>{stepsTitle(b.title)}</MathText></p>}{b.context&&<div style={{background:c+"08",borderRadius:8,padding:"10px 13px",marginBottom:12,border:"1px solid "+c+"15"}}><p style={{color:TH.textSecondary,fontSize:12,lineHeight:1.6}}><MathText>{b.context}</MathText></p></div>}<div style={{display:"flex",flexDirection:"column",gap:7}}>{(b.items||[]).map((item,ii)=><div key={ii} style={{display:"flex",gap:9,alignItems:"flex-start"}}><div style={{width:22,height:22,borderRadius:6,flexShrink:0,background:AC[ii%AC.length]+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:AC[ii%AC.length],fontFamily:"'Bricolage Grotesque',sans-serif"}}>{ii+1}</div><p style={{color:TH.textSecondary,fontSize:12,lineHeight:1.5,paddingTop:2}}><MathText>{item}</MathText></p></div>)}</div></div>;
    if(b.type==="keypoint"&&b.text&&b.text.trim())return <div key={bi} style={{background:mt.accentBg,borderRadius:12,padding:16,border:"1px solid "+mt.borderAccent}}><div style={{display:"flex",alignItems:"flex-start",gap:9}}><span style={{fontSize:15,flexShrink:0}}>{"\u26A1"}</span><div style={{color:mt.accentText,fontSize:13,lineHeight:1.7,fontWeight:600,overflow:"hidden"}}><MathText>{b.text}</MathText></div></div></div>;
    if(b.type==="keypoint")return null;/* skip empty keypoints */
    if(b.type==="table")return <div key={bi} style={{background:TH.surface,borderRadius:12,padding:16,border:"1px solid "+TH.border,overflowX:"auto",boxShadow:TH.cardShadow}}>{b.title&&<p style={{color:TH.text,fontSize:12,fontWeight:700,marginBottom:8}}>{b.title}</p>}<table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{(b.headers||[]).map((h,hi)=><th key={hi} style={{textAlign:"left",padding:"7px 10px",borderBottom:"2px solid "+mt.borderAccent,color:mt.accent,fontWeight:700,fontSize:10}}><MathText>{h}</MathText></th>)}</tr></thead><tbody>{(b.rows||[]).map((row,ri)=><tr key={ri}>{(Array.isArray(row)?row:[]).map((cell,ci)=><td key={ci} style={{padding:"6px 10px",borderBottom:"1px solid "+TH.borderLight,color:ci===0?TH.text:TH.textSecondary,fontWeight:ci===0?600:400}}><MathText>{cell}</MathText></td>)}</tr>)}</tbody></table></div>;
    if(!b.text||!b.text.trim())return null;/* skip any empty blocks */
    return <div key={bi} style={{background:TH.surface,borderRadius:12,padding:18,border:"1px solid "+TH.border,boxShadow:TH.cardShadow}}><p style={{color:TH.textSecondary,fontSize:15,lineHeight:1.75}}><MathText>{b.text}</MathText></p></div>;
  })}</div>;
}

/* ═══════════ YouTube ═══════════ */
function YouTubeRecs({searches,t,lang}){if(!searches||!searches.length)return null;return <div style={{marginTop:20,background:"rgba(239,68,68,0.03)",border:"1px solid rgba(239,68,68,0.1)",borderRadius:11,padding:14}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:9}}><span style={{fontSize:15}}>▶️</span><span style={{color:TH.text,fontSize:11,fontWeight:700}}>{t.goDeeper}</span></div><div style={{display:"flex",flexDirection:"column",gap:5}}>{searches.map((s,i)=>{const q=s+(lang==="es"?" en espa\u00F1ol":"");return <a key={i} href={"https://www.youtube.com/results?search_query="+encodeURIComponent(q)+"&sp=EgIQAQ%3D%3D"} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",background:TH.surface,border:"1px solid "+TH.border,borderRadius:8,textDecoration:"none",transition:"all 0.2s",boxShadow:TH.shadow}} onMouseOver={e=>{e.currentTarget.style.borderColor="rgba(239,68,68,0.3)";}} onMouseOut={e=>{e.currentTarget.style.borderColor=TH.border;}}><span style={{width:28,height:28,borderRadius:6,background:"rgba(239,68,68,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#ef4444",fontWeight:800,flexShrink:0}}>▶</span><span style={{color:TH.text,fontSize:12,flex:1,fontWeight:500}}>{s}</span><span style={{color:TH.textMuted,fontSize:10,whiteSpace:"nowrap"}}>{t.ytLang} →</span></a>;})}</div></div>;}

/* ═══════════ Quiz Card (MC) ═══════════ */
function QuizCard({q,index,selected,onSelect,submitted,t,prefix}){
  return <div style={{background:TH.surface,border:"1px solid",borderColor:submitted?(selected===parseInt(q.correctIndex,10)?"rgba(34,197,94,0.25)":selected!==undefined?"rgba(239,68,68,0.25)":TH.border):TH.border,borderRadius:11,padding:17,transition:"all 0.3s",boxShadow:TH.cardShadow}}>
    <p style={{color:TH.accent,fontSize:10,fontWeight:700,letterSpacing:1.5,marginBottom:4}}>{prefix||t.question}{index+1}</p>
    <p style={{color:TH.text,fontSize:14,fontWeight:600,lineHeight:1.5,marginBottom:11}}><MathText>{q.question}</MathText></p>
    <div style={{display:"flex",flexDirection:"column",gap:5}}>{(q.options||[]).map((opt,oi)=>{
      const isSel=selected===oi,isAns=oi===parseInt(q.correctIndex,10);
      let bg=TH.bgAlt,bdr=TH.border,clr=TH.textSecondary;
      if(isSel&&!submitted){bg=TH.accentBg;bdr=TH.borderAccent;clr=TH.accent;}
      if(submitted&&isAns){bg=TH.greenBg;bdr="rgba(34,197,94,0.3)";clr=TH.green;}
      if(submitted&&isSel&&!isAns){bg=TH.redBg;bdr="rgba(239,68,68,0.3)";clr=TH.red;}
      return <button key={oi} onClick={()=>!submitted&&onSelect(oi)} style={{background:bg,border:"1px solid "+bdr,borderRadius:8,padding:"8px 11px",textAlign:"left",cursor:submitted?"default":"pointer",color:clr,fontSize:12,fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,transition:"all 0.15s"}}><span style={{width:20,height:20,borderRadius:"50%",flexShrink:0,fontSize:9,fontWeight:700,border:"2px solid "+(isSel?clr:TH.border),display:"flex",alignItems:"center",justifyContent:"center"}}>{["A","B","C","D"][oi]}</span><MathText>{opt}</MathText></button>;
    })}</div>
    {submitted&&q.explanation&&<div style={{marginTop:8,padding:9,background:TH.accentBg,borderRadius:7,borderLeft:"3px solid "+TH.accent}}><p style={{color:TH.accent,fontSize:10,fontWeight:700,marginBottom:2}}>{t.why}</p><p style={{color:TH.textSecondary,fontSize:11,lineHeight:1.4}}><MathText>{q.explanation}</MathText></p></div>}
  </div>;
}

/* ═══════════ True/False Card ═══════════ */
function TFCard({q,index,selected,onSelect,submitted,t}){
  const isCorrect=submitted&&selected===q.answer;
  const isWrong=submitted&&selected!==undefined&&selected!==q.answer;
  return <div style={{background:TH.surface,border:"1px solid",borderColor:isCorrect?"rgba(34,197,94,0.25)":isWrong?"rgba(239,68,68,0.25)":TH.border,borderRadius:11,padding:17,boxShadow:TH.cardShadow}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
      <p style={{color:TH.purple,fontSize:10,fontWeight:700,letterSpacing:1.5}}>{t.question}{index+1}</p>
      <span style={{fontSize:8,color:TH.textMuted,background:"rgba(99,102,241,0.06)",padding:"1px 5px",borderRadius:4}}>{t.tfInstruction}</span>
    </div>
    <p style={{color:TH.text,fontSize:13,fontWeight:600,lineHeight:1.5,marginBottom:11}}><MathText>{q.statement}</MathText></p>
    <div style={{display:"flex",gap:8}}>
      {[true,false].map(val=>{
        const isSel=selected===val;
        let bg=TH.bgAlt,bdr=TH.border,clr=TH.textSecondary;
        if(isSel&&!submitted){bg=TH.accentBg;bdr=TH.borderAccent;clr=TH.accent;}
        if(submitted&&val===q.answer){bg=TH.greenBg;bdr="rgba(34,197,94,0.3)";clr=TH.green;}
        if(submitted&&isSel&&val!==q.answer){bg=TH.redBg;bdr="rgba(239,68,68,0.3)";clr=TH.red;}
        return <button key={String(val)} onClick={()=>!submitted&&onSelect(val)} style={{flex:1,background:bg,border:"1px solid "+bdr,borderRadius:8,padding:"9px 0",textAlign:"center",cursor:submitted?"default":"pointer",color:clr,fontSize:12,fontWeight:700,fontFamily:"inherit",transition:"all 0.15s"}}>{val?t.trueLabel:t.falseLabel}</button>;
      })}
    </div>
    {submitted&&q.explanation&&<div style={{marginTop:8,padding:9,background:TH.accentBg,borderRadius:7,borderLeft:"3px solid "+TH.accent}}><p style={{color:TH.accent,fontSize:10,fontWeight:700,marginBottom:2}}>{t.why}</p><p style={{color:TH.textSecondary,fontSize:11,lineHeight:1.4}}><MathText>{q.explanation}</MathText></p></div>}
  </div>;
}

/* ═══════════ Solve & Reveal Card (no auto-correction) ═══════════ */
function SolveCard({q,index,t}){
  const[show,setShow]=useState(false);
  return <div style={{background:TH.surface,border:"1px solid "+TH.border,borderRadius:11,padding:17,boxShadow:TH.cardShadow,borderLeft:"4px solid "+TH.red}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
      <p style={{color:TH.red,fontSize:10,fontWeight:700,letterSpacing:1.5}}>{"\uD83D\uDD25"} {index+1}</p>
      <span style={{fontSize:8,color:TH.textMuted,background:TH.redBg,padding:"1px 5px",borderRadius:4}}>{t.solveInstruction}</span>
    </div>
    <p style={{color:TH.text,fontSize:14,fontWeight:700,lineHeight:1.5,marginBottom:6}}><MathText>{q.problem}</MathText></p>
    {q.hint&&<div style={{display:"flex",alignItems:"center",gap:5,marginBottom:10,padding:"5px 9px",background:"rgba(99,102,241,0.04)",borderRadius:6,border:"1px solid rgba(99,102,241,0.08)"}}><span style={{fontSize:11}}>💡</span><p style={{color:TH.purple,fontSize:11,fontStyle:"italic"}}><MathText>{q.hint}</MathText></p></div>}
    <button onClick={()=>setShow(!show)} style={{background:show?"rgba(34,197,94,0.04)":"linear-gradient(135deg, "+TH.accentLight+", "+TH.accent+")",border:show?"1px solid rgba(34,197,94,0.15)":"none",borderRadius:7,padding:"8px 18px",color:show?TH.green:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",boxShadow:show?"none":"0 2px 8px rgba(232,148,10,0.15)"}}>{show?t.hideSolution:t.revealSolution}</button>
    {show&&<div style={{marginTop:10,padding:12,background:"rgba(34,197,94,0.03)",border:"1px solid rgba(34,197,94,0.1)",borderRadius:8,borderLeft:"3px solid "+TH.green}}>
      <p style={{color:TH.text,fontSize:12,lineHeight:1.6,whiteSpace:"pre-wrap"}}><MathText>{q.solution}</MathText></p>
    </div>}
  </div>;
}

/* ═══════════ Slide emojis ═══════════ */
const SE={title:["\uD83C\uDFAF","\uD83E\uDDE0"],concept:["\uD83D\uDD11","\uD83D\uDC8E","\u26A1"],tip:["\uD83D\uDCA1","\uD83D\uDE80","\uD83C\uDF93"],end:["\uD83C\uDFC1","\uD83C\uDF89"]};
function sEmoji(ty,i){const a=SE[ty]||SE.title;return a[i%a.length];}

/* ═══════════ Slide Deck with single download card ═══════════ */
function InlineDeck({content,t,lang,mt:_mt}){
  const mt=_mt||{accent:TH.accent,accentLight:TH.accentLight,accentBg:TH.accentBg,borderAccent:TH.borderAccent};
  const slides=[{type:"title",title:content.title,sub:t.slideTitle,idx:0},...(content.keyConcepts||[]).map((c,i)=>({type:"concept",title:c.title,body:c.description,formula:c.formula,idx:i})),...(content.tips||[]).map((tp,i)=>({type:"tip",title:tp.title,body:tp.content,idx:i})),{type:"end",title:t.slideEnd,sub:t.slideEndSub,idx:0}];
  const[cur,setCur]=useState(0);
  const s=slides[cur];

  /* Split body into short bullet points for presentation style */
  const toBullets=(text)=>{
    if(!text)return[];
    /* Split on periods that end a sentence (not abbreviations) */
    const raw=text.split(/(?<=[.!?])\s+/).filter(s=>s.trim().length>5);
    /* Take max 4 bullets, keep them short */
    return raw.slice(0,4).map(b=>b.trim().replace(/\.$/,""));
  };

  /* ═══ Math-to-HTML converter: replicates MathText rendering as inline CSS HTML ═══ */
  const mathToHTML=(text)=>{
    if(!text)return"";
    let s=String(text);
    /* Combining marks: x̄ → styled overline */
    s=s.replace(/([a-zA-Z\u03B1-\u03C9])(\u0304)/g,'<span style="text-decoration:overline;text-decoration-thickness:1.5px;padding:0 1px">$1</span>');
    s=s.replace(/([a-zA-Z\u03B1-\u03C9])(\u0302)/g,'<span style="display:inline-block;position:relative;padding:0 1px">$1<span style="position:absolute;top:-0.35em;left:50%;transform:translateX(-50%);font-size:0.65em">\u0302</span></span>');
    /* Radicals: √{content} → √ with overline bar */
    s=s.replace(/\u221A\{([^}]+)\}/g,'<span style="display:inline-flex;align-items:flex-end;vertical-align:middle;margin:0 2px"><span style="font-size:1.2em;font-family:serif;position:relative;top:-0.05em">\u221A</span><span style="display:inline-flex;align-items:center;border-top:1.8px solid currentColor;padding:1px 4px 0 3px;margin-left:-1px;line-height:1.25">$1</span></span>');
    /* Balanced-paren fractions: walk the string to find (num)/(den) with any nesting */
    const fb=(str,start)=>{if(str[start]!=="(")return-1;let d=0;for(let i=start;i<str.length;i++){if(str[i]==="(")d++;if(str[i]===")")d--;if(d===0)return i;}return-1;};
    let out="",i=0;
    while(i<s.length){
      if(s[i]==="("){
        const close=fb(s,i);
        if(close>i+1){
          let after=close+1;
          /* Check for superscripts between ) and / */
          const supC="\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079\u207F\u207A\u207B";
          while(after<s.length&&supC.includes(s[after]))after++;
          if(after<s.length&&s[after]==="/"){
            const slash=after;
            const numStr=s.slice(i+1,close)+s.slice(close+1,slash);
            let denStr=null,denEnd=slash+1;
            if(slash+1<s.length&&s[slash+1]==="("){
              const cd=fb(s,slash+1);
              if(cd>slash+2){denStr=s.slice(slash+2,cd);denEnd=cd+1;}
            }
            if(!denStr){
              /* Token denominator */
              let j=slash+1;
              const tokRe=/[\w\u00B2\u00B3\u03B1-\u03C9\u0394\u03A3\u03A9\u03C0\u221A\u00B9\u2074-\u2079\u207F\u2070\u2080-\u2089\u2099\u0304\u0302\u00D7.\u2032\u2033\u2212,]/;
              while(j<s.length&&tokRe.test(s[j]))j++;
              /* Also consume a following (…) so P(B), f(x), P(A|B) are treated as one token */
              if(j>slash+1&&j<s.length&&s[j]==="("){
                const cd=fb(s,j);
                if(cd>j){j=cd+1;}
              }
              if(j>slash+1){denStr=s.slice(slash+1,j);denEnd=j;}
            }
            if(denStr){
              const fracCSS="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 3px;line-height:1.1;font-size:0.88em";
              const lineCSS="width:100%;height:1.5px;background:currentColor;margin:2px 0;border-radius:1px";
              out+='<span style="'+fracCSS+'"><span style="padding:0 4px">'+numStr+'</span><span style="'+lineCSS+'"></span><span style="padding:0 4px">'+denStr+'</span></span>';
              i=denEnd;continue;
            }
          }
        }
      }
      out+=s[i];i++;
    }
    s=out;
    /* Simple token/token fractions (dy/dx, σ/μ, etc.) — skip pure numbers like 50,000/25,000 */
    const tokP="[a-zA-Z0-9\u00B2\u00B3\u03B1-\u03C9\u03C0\u0394\u00D7,]+";
    const simpleRe=new RegExp("(?<![a-zA-Z\u03B1-\u03C9])("+tokP+")/("+tokP+")(?![a-zA-Z\u03B1-\u03C9])","g");
    const pureNum2=/^[\d,.\s]+$/;
    s=s.replace(simpleRe,(m,a,b)=>{
      if(/^(true|false|and|or|yes|no|if|of|is|it|to|in|on|up)$/i.test(a))return m;
      if(pureNum2.test(a)&&pureNum2.test(b))return m;/* skip 50,000/25,000 */
      const fracCSS="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 3px;line-height:1.1;font-size:0.88em";
      const lineCSS="width:100%;height:1.5px;background:currentColor;margin:2px 0;border-radius:1px";
      return'<span style="'+fracCSS+'"><span style="padding:0 4px">'+a+'</span><span style="'+lineCSS+'"></span><span style="padding:0 4px">'+b+'</span></span>';
    });
    /* Bold and underline */
    s=s.replace(/\*\*([^*]+)\*\*/g,'<strong style="font-weight:700">$1</strong>');
    s=s.replace(/__([^_]+)__/g,'<span style="text-decoration:underline;text-decoration-color:rgba(232,148,10,0.4);text-underline-offset:2px">$1</span>');
    /* Newlines */
    s=s.replace(/\n/g,"<br/>");
    return s;
  };

  const buildSlideHTML=()=>{
    const ac=mt.accent||"#e8940a";const acL=mt.accentLight||"#f5a623";const acBg=mt.accentBg||"rgba(245,166,35,0.07)";const bdAc=mt.borderAccent||"rgba(232,148,10,0.25)";
    const bulletSplit=(text)=>{if(!text)return[];return text.split(/(?<=[.!?])\s+/).filter(s=>s.trim().length>5).slice(0,4).map(b=>b.trim().replace(/\.$/,""));};
    let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${content.title||"Slides"}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{font-family:'Bricolage Grotesque',system-ui,sans-serif;background:#f7f5f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.slide{width:100vw;min-height:100vh;display:flex;flex-direction:column;position:relative;background:#ffffff;page-break-inside:avoid;page-break-after:always}
.bar{position:absolute;top:0;left:0;right:0;height:7px;background:linear-gradient(90deg,${ac},${acL},#6366f1,#ec4899)}
.bot{position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${ac}33,transparent)}
.num{position:absolute;top:24px;right:36px;font-size:14px;color:#8a8a96;letter-spacing:2px;font-weight:700;font-family:'JetBrains Mono',monospace}
.center{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 10vw;text-align:center}
.left{flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 8vw}
.badge{font-size:14px;font-weight:800;padding:6px 16px;border-radius:7px;display:inline-block;letter-spacing:2px;text-transform:uppercase;margin-bottom:18px}
.emoji{font-size:64px;margin-bottom:20px}
.emoji-sm{font-size:32px}
.grad-title{font-size:clamp(36px,6vw,64px);font-weight:800;line-height:1.1;margin-bottom:14px;background:linear-gradient(135deg,${ac},#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.subtitle{color:#8a8a96;font-size:20px;letter-spacing:0.5px;margin-top:4px}
.slide-title{font-size:clamp(28px,4.5vw,48px);font-weight:800;line-height:1.15;margin-bottom:24px}
.bullet{display:flex;align-items:flex-start;gap:14px;margin-bottom:14px}
.bullet-dot{font-size:22px;line-height:1.45;flex-shrink:0;font-weight:800}
.bullet-text{font-size:22px;color:#5c5c6c;line-height:1.55;font-family:system-ui,sans-serif}
.formula-box{font-family:'JetBrains Mono',monospace;background:linear-gradient(135deg,${acBg},rgba(99,102,241,0.04));border:2px solid ${bdAc};border-radius:14px;padding:18px 28px;font-size:24px;color:${ac};display:block;max-width:100%;line-height:1.8;margin-top:20px;white-space:pre-wrap;word-break:break-word;overflow:hidden}
@media print{
  body{background:#fff}
  .slide{min-height:100vh;page-break-inside:avoid;page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{size:landscape;margin:0}
}
</style></head><body>`;

    slides.forEach((sl,si)=>{
      const pageNum=String(si+1).padStart(2,"0")+" / "+String(slides.length).padStart(2,"0");
      html+=`<div class="slide"><div class="bar"></div><div class="bot"></div><span class="num">${pageNum}</span>`;
      if(sl.type==="title"||sl.type==="end"){
        html+=`<div class="center"><div class="emoji">${sEmoji(sl.type,0)}</div><h2 class="grad-title">${sl.title}</h2><p class="subtitle">${sl.sub}</p></div>`;
      }else if(sl.type==="concept"){
        const bullets=bulletSplit(sl.body);
        html+=`<div class="left"><div style="display:flex;align-items:center;gap:12px;margin-bottom:18px"><span class="emoji-sm">${sEmoji("concept",sl.idx)}</span><span class="badge" style="background:${acBg};color:${ac}">${t.concept}</span></div>`;
        html+=`<h3 class="slide-title" style="color:${ac}">${mathToHTML(sl.title)}</h3>`;
        html+=`<div style="display:flex;flex-direction:column;gap:6px;${sl.formula?"margin-bottom:20px":""}">`;
        bullets.forEach(b=>{html+=`<div class="bullet"><span class="bullet-dot" style="color:${ac}">\u2022</span><span class="bullet-text">${mathToHTML(b)}</span></div>`;});
        html+=`</div>`;
        if(sl.formula)html+=`<div class="formula-box">${mathToHTML(sl.formula)}</div>`;
        html+=`</div>`;
      }else if(sl.type==="tip"){
        const bullets=bulletSplit(sl.body);
        html+=`<div class="left"><div style="display:flex;align-items:center;gap:12px;margin-bottom:18px"><span class="emoji-sm">${sEmoji("tip",sl.idx)}</span><span class="badge" style="background:rgba(99,102,241,0.08);color:#6366f1">${t.tipBadge}</span></div>`;
        html+=`<h3 class="slide-title" style="color:#2a2a3a">${sl.title}</h3>`;
        html+=`<div style="display:flex;flex-direction:column;gap:6px">`;
        bullets.forEach(b=>{html+=`<div class="bullet"><span class="bullet-dot" style="color:#6366f1">\u2022</span><span class="bullet-text">${mathToHTML(b)}</span></div>`;});
        html+=`</div></div>`;
      }
      html+=`</div>`;
    });

    html+=`</body></html>`;
    return html;
  };

  const[dlError,setDlError]=useState("");
  const dlRef=useRef(null);
  const[dlData,setDlData]=useState(null);
  const doDownload=()=>{
    setDlError("");
    try{
      const html=buildSlideHTML();
      const b64=btoa(unescape(encodeURIComponent(html)));
      const href="data:text/html;base64,"+b64;
      const name=(content.title||"slides").replace(/[^\w\s]/g,"").trim().replace(/\s+/g,"_")+".html";
      setDlData({href,name});
    }catch(e){console.error("Download error:",e);setDlError(e.message||"Error");}
  };
  /* Auto-click the hidden link once data is ready */
  useEffect(()=>{if(dlData&&dlRef.current){dlRef.current.click();setTimeout(()=>setDlData(null),500);}},[dlData]);

  return <div style={{animation:"fadeUp 0.3s ease"}}>
    <h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:19,fontWeight:700,color:TH.text,marginBottom:11}}>{t.summaryDeck}</h2>
    <div style={{background:TH.surface,borderRadius:16,border:"1px solid "+TH.border,boxShadow:"0 4px 24px rgba(0,0,0,0.07)",minHeight:280,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      {/* Top gradient bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:5,background:"linear-gradient(90deg, "+mt.accent+", "+mt.accentLight+", "+TH.purple+", "+TH.pink+")",borderRadius:"16px 16px 0 0"}}/>
      {/* Slide number */}
      <div style={{position:"absolute",top:16,right:20,fontSize:10,color:TH.textMuted,letterSpacing:1.5,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{String(cur+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</div>

      {/* TITLE / END slide */}
      {(s.type==="title"||s.type==="end")&&<div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:"36px clamp(24px,6vw,60px)",textAlign:"center",minHeight:240}}>
        <div style={{fontSize:44,marginBottom:12}}>{sEmoji(s.type,0)}</div>
        <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"clamp(22px,4vw,40px)",fontWeight:800,lineHeight:1.1,marginBottom:8,background:"linear-gradient(135deg, "+mt.accent+", "+TH.purple+")",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>{s.title}</h3>
        <p style={{color:TH.textMuted,fontSize:14,letterSpacing:0.5}}>{s.sub}</p>
      </div>}

      {/* CONCEPT slide — professional layout */}
      {s.type==="concept"&&<div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"36px clamp(24px,5vw,50px)"}}>
        {/* Badge */}
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
          <span style={{fontSize:22}}>{sEmoji("concept",s.idx)}</span>
          <span style={{background:mt.accentBg,color:mt.accent,fontSize:9,fontWeight:800,padding:"3px 10px",borderRadius:5,letterSpacing:1.5,textTransform:"uppercase"}}>{t.concept}</span>
        </div>
        {/* Title */}
        <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"clamp(20px,3vw,30px)",color:mt.accent,marginBottom:14,fontWeight:800,lineHeight:1.15}}><MathText>{s.title}</MathText></h3>
        {/* Bullet points — not paragraphs */}
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:s.formula?12:0}}>
          {toBullets(s.body).map((b,bi)=><div key={bi} style={{display:"flex",alignItems:"flex-start",gap:8}}>
            <span style={{color:mt.accent,fontSize:14,lineHeight:1.4,flexShrink:0,fontWeight:800}}>{"\u2022"}</span>
            <p style={{color:TH.textSecondary,fontSize:13,lineHeight:1.45}}><MathText>{b}</MathText></p>
          </div>)}
        </div>
        {/* Formula box */}
        {s.formula&&<div style={{fontFamily:"'JetBrains Mono',monospace",background:"linear-gradient(135deg, "+mt.accentBg+", rgba(99,102,241,0.04))",border:"1px solid "+mt.borderAccent,borderRadius:10,padding:"10px 16px",fontSize:14,color:mt.accent,maxWidth:"100%",overflow:"hidden",lineHeight:1.8,whiteSpace:"pre-wrap",wordBreak:"break-word"}}><MathText>{s.formula}</MathText></div>}
      </div>}

      {/* TIP slide */}
      {s.type==="tip"&&<div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"36px clamp(24px,5vw,50px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
          <span style={{fontSize:22}}>{sEmoji("tip",s.idx)}</span>
          <span style={{background:"rgba(99,102,241,0.08)",color:TH.purple,fontSize:9,fontWeight:800,padding:"3px 10px",borderRadius:5,letterSpacing:1.5,textTransform:"uppercase"}}>{t.tipBadge}</span>
        </div>
        <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"clamp(20px,3vw,28px)",color:TH.text,marginBottom:14,fontWeight:800,lineHeight:1.15}}>{s.title}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {toBullets(s.body).map((b,bi)=><div key={bi} style={{display:"flex",alignItems:"flex-start",gap:8}}>
            <span style={{color:TH.purple,fontSize:14,lineHeight:1.4,flexShrink:0,fontWeight:800}}>{"\u2022"}</span>
            <p style={{color:TH.textSecondary,fontSize:13,lineHeight:1.45}}><MathText>{b}</MathText></p>
          </div>)}
        </div>
      </div>}

      {/* Bottom decoration line */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:"linear-gradient(90deg, transparent, "+mt.accent+"20, transparent)"}}/>
    </div>
    {/* Nav */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:9}}>
      <button onClick={()=>setCur(Math.max(0,cur-1))} disabled={cur===0} style={{background:cur===0?TH.bgAlt:TH.surface,border:"1px solid "+TH.border,borderRadius:7,padding:"6px 14px",color:cur===0?TH.textFaint:TH.textSecondary,fontSize:11,fontWeight:600,cursor:cur===0?"default":"pointer",fontFamily:"inherit"}}>{"\u2190"}</button>
      <div style={{display:"flex",gap:3}}>{slides.map((_,si)=><button key={si} onClick={()=>setCur(si)} style={{width:si===cur?16:5,height:5,borderRadius:3,background:si===cur?TH.accent:TH.borderLight,border:"none",cursor:"pointer",transition:"all 0.3s"}}/>)}</div>
      <button onClick={()=>setCur(Math.min(slides.length-1,cur+1))} disabled={cur===slides.length-1} style={{background:cur===slides.length-1?TH.bgAlt:TH.surface,border:"1px solid "+TH.border,borderRadius:7,padding:"6px 14px",color:cur===slides.length-1?TH.textFaint:TH.textSecondary,fontSize:11,fontWeight:600,cursor:cur===slides.length-1?"default":"pointer",fontFamily:"inherit"}}>{"\u2192"}</button>
    </div>
    {/* Download — single click */}
    <div style={{marginTop:14,background:TH.surface,border:"1px solid "+TH.border,borderRadius:10,padding:"12px 16px",boxShadow:TH.cardShadow,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:14}}>💾</span>
        <span style={{fontSize:12,fontWeight:700,color:TH.text}}>{t.downloadSlides}</span>
      </div>
      <button onClick={doDownload} style={{background:"linear-gradient(135deg, "+mt.accentLight+", "+mt.accent+")",border:"none",borderRadius:7,padding:"7px 20px",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 6px "+mt.btnShadow,display:"flex",alignItems:"center",gap:5}}>{"\u2B07"} {lang==="es"?"Descargar":"Download"}</button>
      {dlError&&<span style={{color:TH.red,fontSize:10}}>{dlError}</span>}
    </div>
    {/* Hidden download link — auto-clicked by useEffect */}
    {dlData&&<a ref={dlRef} href={dlData.href} download={dlData.name} style={{display:"none"}}/>}
    <YouTubeRecs searches={content.youtubeSearches} t={t} lang={lang}/>
  </div>;
}

/* ═══════════ Feynman Prompt ═══════════ */
function FeynmanPrompt({topic,keyConcepts,mt,lang,t,onDone,session}){
  const[answer,setAnswer]=useState("");
  const[result,setResult]=useState(null);
  const[grading,setGrading]=useState(false);
  const[skippable,setSkippable]=useState(false);
  const[countdown,setCountdown]=useState(8);
  const skipRef=useRef(null);const cdRef=useRef(null);

  useEffect(()=>{
    skipRef.current=setTimeout(()=>setSkippable(true),8000);
    cdRef.current=setInterval(()=>setCountdown(c=>{if(c<=1){clearInterval(cdRef.current);return 0;}return c-1;}),1000);
    return()=>{clearTimeout(skipRef.current);clearInterval(cdRef.current);};
  },[]);

  useEffect(()=>{
    if(answer.length>0){clearTimeout(skipRef.current);clearInterval(cdRef.current);setSkippable(false);setCountdown(0);}
  },[answer]);

  const grade=async()=>{
    if(answer.trim().length<20||grading)return;
    setGrading(true);
    try{
      const concepts=(keyConcepts||[]).map(kc=>kc.title||kc).slice(0,6).join(", ");
      const sysP=lang==="es"
        ?"Sos un tutor evaluando si el estudiante entendió el tema. Respondé SOLO con un objeto JSON válido, sin markdown, sin texto extra."
        :"You are a tutor evaluating student understanding. Respond ONLY with a valid JSON object, no markdown, no extra text.";
      const userP=lang==="es"
        ?`Tema: "${topic}"\nConceptos clave: ${concepts}\n\nExplicación del estudiante:\n"${answer}"\n\nEvaluá y respondé SOLO con este JSON:\n{"score":0-100,"nailed":["1-3 cosas bien explicadas"],"missed":["1-3 conceptos importantes que faltaron"],"tip":"una oración concreta de qué mejorar","verdict":"una oración motivadora resumiendo el resultado"}\nSi es muy corta o irrelevante, score < 40.`
        :`Topic: "${topic}"\nKey concepts: ${concepts}\n\nStudent's explanation:\n"${answer}"\n\nEvaluate and respond ONLY with this JSON:\n{"score":0-100,"nailed":["1-3 things explained well"],"missed":["1-3 important missing concepts"],"tip":"one concrete sentence on what to improve","verdict":"one motivating sentence summarizing the result"}\nIf very short or irrelevant, score < 40.`;
      const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+(session?.access_token||"")},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:500,system:sysP,messages:[{role:"user",content:userP}]})});
      const data=await res.json();
      const raw=(data.content||[]).map(b=>b.text||"").join("");
      setResult(safeParseJSON(raw));
    }catch(e){console.error("Feynman grading error:",e);onDone();}
    setGrading(false);
  };

  const scoreColor=result?(result.score>=80?TH.green:result.score>=50?mt.accent:TH.red):mt.accent;
  const scoreBg=result?(result.score>=80?TH.greenBg:result.score>=50?mt.accentBg:TH.redBg):mt.accentBg;

  if(result)return(
    <div style={{marginTop:20,animation:"fadeUp 0.3s ease"}}>
      <div style={{background:TH.surface,borderRadius:14,border:"1px solid "+TH.border,overflow:"hidden",boxShadow:TH.cardShadow}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid "+TH.borderLight,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>🧠</span><span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:14,fontWeight:800,color:TH.text}}>{t.feynmanResultTitle}</span></div>
          <span style={{fontSize:16,fontWeight:800,fontFamily:"'Bricolage Grotesque',sans-serif",color:scoreColor,background:scoreBg,padding:"4px 12px",borderRadius:8}}>{result.score}/100</span>
        </div>
        <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:12}}>
          {result.nailed&&result.nailed.length>0&&<div>
            <div style={{fontSize:9,fontWeight:700,color:TH.green,letterSpacing:1,marginBottom:6}}>✅ {t.feynmanNailed}</div>
            {result.nailed.map((item,i)=><div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:3}}><span style={{color:TH.green,fontSize:12,flexShrink:0}}>·</span><span style={{color:TH.textSecondary,fontSize:12,lineHeight:1.5}}>{item}</span></div>)}
          </div>}
          {result.missed&&result.missed.length>0&&<div>
            <div style={{fontSize:9,fontWeight:700,color:mt.accent,letterSpacing:1,marginBottom:6}}>🔍 {t.feynmanMissed}</div>
            {result.missed.map((item,i)=><div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:3}}><span style={{color:mt.accent,fontSize:12,flexShrink:0}}>·</span><span style={{color:TH.textSecondary,fontSize:12,lineHeight:1.5}}>{item}</span></div>)}
          </div>}
          {result.tip&&<div style={{background:mt.accentBg,borderRadius:9,padding:"10px 13px",border:"1px solid "+TH.borderAccent}}><span style={{fontSize:12}}>💡 </span><span style={{color:mt.accentText,fontSize:12,fontWeight:600,lineHeight:1.5}}>{result.tip}</span></div>}
          {result.verdict&&<p style={{color:TH.textMuted,fontSize:11,lineHeight:1.5,margin:0,fontStyle:"italic"}}>{result.verdict}</p>}
        </div>
        <div style={{padding:"0 18px 16px",display:"flex",gap:8}}>
          <button onClick={()=>{setAnswer("");setResult(null);}} style={{flex:1,padding:"9px",border:"1px solid "+TH.border,borderRadius:9,background:TH.bg,color:TH.textSecondary,fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{t.feynmanTryAgain}</button>
          <button onClick={onDone} style={{flex:2,padding:"9px",border:"none",borderRadius:9,background:"linear-gradient(135deg,"+mt.accentLight+","+mt.accent+")",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{t.feynmanContinue}</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{marginTop:20,animation:"fadeUp 0.3s ease"}}>
      <div style={{background:TH.surface,borderRadius:14,border:"1px solid "+TH.border,padding:"18px",boxShadow:TH.cardShadow}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}><span style={{fontSize:18}}>🧠</span><span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:14,fontWeight:800,color:TH.text}}>{t.feynmanTitle}</span></div>
        <p style={{color:TH.textMuted,fontSize:11,marginBottom:12,lineHeight:1.5}}>{t.feynmanSub.replace("{topic}",topic)}</p>
        <textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder={t.feynmanPlaceholder} rows={4}
          style={{width:"100%",boxSizing:"border-box",padding:"11px 13px",border:"1px solid "+TH.border,borderRadius:10,fontSize:13,fontFamily:"inherit",background:TH.bg,color:TH.text,resize:"vertical",outline:"none",lineHeight:1.5}}
          onFocus={e=>e.target.style.borderColor=mt.accent} onBlur={e=>e.target.style.borderColor=TH.border}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,gap:8}}>
          <div style={{fontSize:10,color:TH.textFaint,display:"flex",alignItems:"center",gap:6}}>
            {answer.length===0&&countdown>0&&<span>{t.feynmanSkipHint.replace("{n}",countdown)}</span>}
            {answer.length>0&&<span>{answer.length} {lang==="es"?"chars":"chars"}</span>}
            {skippable&&answer.length===0&&<button onClick={onDone} style={{background:"none",border:"none",color:TH.textMuted,fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600,textDecoration:"underline",padding:0}}>{t.feynmanSkip}</button>}
          </div>
          <button onClick={grade} disabled={grading||answer.trim().length<20}
            style={{padding:"9px 22px",border:"none",borderRadius:9,background:answer.trim().length>=20?"linear-gradient(135deg,"+mt.accentLight+","+mt.accent+")":TH.bgAlt,color:answer.trim().length>=20?"#fff":TH.textFaint,fontWeight:700,fontSize:12,cursor:answer.trim().length>=20?"pointer":"default",fontFamily:"inherit",transition:"all 0.2s"}}>
            {grading?t.feynmanGrading:t.feynmanSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ File Upload Icon ═══════════ */
function FileUploadIcon({active}){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active?TH.accent:TH.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>;}

/* ═══════════ Related Topics chips ═══════════ */
function RelatedTopics({topics,t,mt,onSelect}){
  if(!topics||!Array.isArray(topics)||topics.length===0)return null;
  return(
    <div style={{marginTop:28,animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
        <span style={{fontSize:13}}>🧭</span>
        <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:14,fontWeight:700,color:TH.textSecondary}}>{t.relatedTopicsTitle}</h3>
        <span style={{color:TH.textFaint,fontSize:10,marginLeft:2}}>{t.relatedTopicsSub}</span>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {topics.map((item,i)=>(
          <button key={i} onClick={()=>onSelect(item.label)}
            style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:1,padding:"9px 13px",borderRadius:10,border:"1px solid "+TH.border,background:TH.surface,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",boxShadow:TH.cardShadow,maxWidth:180,textAlign:"left"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=mt.accent;e.currentTarget.style.background=mt.accentBg;e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 12px "+mt.btnShadow;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=TH.border;e.currentTarget.style.background=TH.surface;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=TH.cardShadow;}}>
            <span style={{fontSize:11,fontWeight:700,color:TH.text,lineHeight:1.3}}>{item.label}</span>
            {item.tagline&&<span style={{fontSize:9,color:TH.textMuted,lineHeight:1.3,fontWeight:400}}>{item.tagline}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ MAIN APP ═══════════ */
export default function MasteryModule({session, level, lang: langProp, dark, pendingLoad, onLoadDone}){
  /* Apply theme immediately before any renders */
  TH=dark?DARK_TH:LIGHT_TH;
  const[lang,setLang]=useState(()=>langProp||localStorage.getItem('mm_lang')||'en');const t=T[lang];
  const[topic,setTopic]=useState("");const[file,setFile]=useState(null);const[fileContent,setFileContent]=useState("");
  const[phase,setPhase]=useState("idle");const[loadingPhase,setLoadingPhase]=useState(0);const[loadingMsg,setLoadingMsg]=useState("");const[loadProg,setLoadProg]=useState(0);
  const[content,setContent]=useState(null);const[error,setError]=useState(null);const[validationError,setValidationError]=useState(false);
  const[cardStatus,setCardStatus]=useState(null);// null | 'adding' | 'added' | 'exists'
  const[quizAnswers,setQuizAnswers]=useState({});const[quizSubmitted,setQuizSubmitted]=useState(false);
  const[examAnswers,setExamAnswers]=useState({});const[examSubmitted,setExamSubmitted]=useState(false);
  const[challengeAnswers,setChallengeAnswers]=useState({});const[challengeSubmitted,setChallengeSubmitted]=useState(false);
  const[activeSection,setActiveSection]=useState("explain");const[fileError,setFileError]=useState("");
  const[interest,setInterest]=useState("");const[interestFocused,setInterestFocused]=useState(false);const[interestError,setInterestError]=useState(false);
  const[mod,setMod]=useState("general");
  const[classifierReady,setClassifierReady]=useState(true);/* true=ready, false=waiting for classifier */
  const[mode,setMode]=useState("fast");/* "fast" or "think" */
  const[topicType,setTopicType]=useState("concept");/* "concept" | "problem" — auto-detected */
  const[simplifiedBlocks,setSimplifiedBlocks]=useState(null);const[simplifying,setSimplifying]=useState(false);
  const[feynmanDone,setFeynmanDone]=useState(false);
  const mc=MOD_CONF[mod]||MOD_CONF.general;
  const mt={accent:mc.accent,accentLight:mc.accentLight,accentBg:mc.accentBg,accentBgStrong:mc.accentBgStrong,accentText:mc.accentText,borderAccent:mc.borderAccent,btnShadow:mc.btnShadow};
  const fileRef=useRef(null);const resultsRef=useRef(null);const usedRef=useRef(new Set());const classModRef=useRef("general");
  const[morphing,setMorphing]=useState(false);const prevLangRef=useRef(lang);const hasChangedLang=useRef(false);
  const switchLang=(newLang)=>{if(newLang===lang)return;hasChangedLang.current=true;prevLangRef.current=newLang;localStorage.setItem('mm_lang',newLang);setLang(newLang);};
  /* Sync when parent lang prop changes (e.g. changed in Profile) */
  useEffect(()=>{if(langProp&&langProp!==lang){hasChangedLang.current=true;prevLangRef.current=langProp;setLang(langProp);}},[langProp]);

  const pickMsg=useCallback(()=>{const pool=mod==="stats"?ML_STATS:mod==="econ"?ML_ECON:mod==="finance"?ML_FINANCE:ML;const p=pool[lang]||pool.en;if(usedRef.current.size>=p.length)usedRef.current.clear();let i;do{i=Math.floor(Math.random()*p.length);}while(usedRef.current.has(i));usedRef.current.add(i);return p[i];},[lang,mod]);
  useEffect(()=>{if(phase!=="loading")return;setLoadingMsg(pickMsg());const iv=setInterval(()=>{setLoadingMsg(pickMsg());setLoadingPhase(p=>(p+1)%5);},8000);return()=>clearInterval(iv);},[phase,lang,pickMsg]);
  useEffect(()=>{if(phase==="loading"){setLoadProg(0);const st=Date.now();const iv=setInterval(()=>{const el=(Date.now()-st)/1000;/* Smooth S-curve: fast start, steady cruise, slows near end */const p=96*(1-Math.exp(-el/18))+(el>5?Math.min(el-5,25)*0.25:0);setLoadProg(Math.min(97,p));},200);return()=>clearInterval(iv);}if(phase==="complete"){setLoadProg(100);const tm=setTimeout(()=>setLoadProg(0),600);return()=>clearTimeout(tm);}},[phase]);

  const handleFile=async(e)=>{const f=e.target.files?.[0];if(!f)return;setFile(f);setValidationError(false);setFileError("");const ext=f.name.split(".").pop().toLowerCase();try{if(ext==="pdf"||f.type==="application/pdf"){const buf=await f.arrayBuffer();const text=await extractPdfText(buf);if(!text||text.trim().length<10){setFileError(t.pdfError);setFile(null);setFileContent("");return;}setFileContent(text);}else{const text=await new Promise((r,j)=>{const rd=new FileReader();rd.onload=ev=>r(ev.target.result);rd.onerror=()=>j(new Error("fail"));rd.readAsText(f);});setFileContent(text);}}catch{setFileError(t.fileReadError);setFile(null);setFileContent("");}};

  const reset=()=>{setPhase("idle");setContent(null);setTopic("");setFile(null);setFileContent("");setError(null);setValidationError(false);setQuizAnswers({});setQuizSubmitted(false);setExamAnswers({});setExamSubmitted(false);setChallengeAnswers({});setChallengeSubmitted(false);setActiveSection("explain");setFileError("");setMod("general");setMode("fast");setTopicType("concept");setSimplifiedBlocks(null);setSimplifying(false);setFeynmanDone(false);usedRef.current.clear();window.scrollTo({top:0,behavior:"smooth"});};


  /* ── Save session to study history ── */
  const saveHistory=async(parsedContent,savedTopic)=>{
    if(!session?.user?.id)return;
    try{
      await supabase.from("study_history").insert({
        user_id:session.user.id,
        email:session.user.email,
        topic:savedTopic||topic||"Unknown",
        module:classModRef.current,
        mode,lang,level,
        content:parsedContent,
      });
    }catch(e){console.error("History save failed:",e);}
  };

  /* ── Add current topic to SRS review deck ── */
  const handleAddToReview=async()=>{
    if(!session?.user?.id||!content||cardStatus==="adding"||cardStatus==="added"||cardStatus==="exists")return;
    setCardStatus("adding");
    const result=await addCard(supabase,{
      userId:session.user.id,
      topic:topic||content.title||"Unknown",
      module:classModRef.current,
      lang,level,
      studyHistoryId:null,
    });
    if(!result){setCardStatus(null);return;}
    setCardStatus(result.alreadyExists?"exists":"added");
  };

  /* ── Load a history entry back into the module ── */
  useEffect(()=>{
    if(!pendingLoad)return;
    setContent(pendingLoad.content);
    setTopic(pendingLoad.topic||"");
    if(pendingLoad.mod&&["math","stats","econ","finance","general"].includes(pendingLoad.mod)){setMod(pendingLoad.mod);classModRef.current=pendingLoad.mod;}
    if(pendingLoad.mode)setMode(pendingLoad.mode);
    setPhase("complete");
    setQuizAnswers({});setQuizSubmitted(false);
    setExamAnswers({});setExamSubmitted(false);
    setChallengeAnswers({});setChallengeSubmitted(false);
    setSimplifiedBlocks(null);setActiveSection("explain");
    onLoadDone?.();
    setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth"}),300);
  },[pendingLoad]);

    const go=async(overrideTopic)=>{
    /* If a related-topic chip triggered this, set topic state and carry topicType forward */
    const activeTopic=overrideTopic!==undefined?overrideTopic:topic;
    if(overrideTopic!==undefined){setTopic(overrideTopic);}
    try{
    if(!activeTopic.trim()&&!fileContent)return;
    if(!fileContent&&!isMathRelated(activeTopic)){setValidationError(true);return;}
    /* Warm up AudioContext on user interaction so sound works when results arrive */
    try{const a=new(window.AudioContext||window.webkitAudioContext)();a.resume().then(()=>setTimeout(()=>{try{a.close();}catch(e){}},100));}catch(e){}
    setValidationError(false);setPhase("loading");setError(null);setContent(null);setSimplifiedBlocks(null);setSimplifying(false);
    setQuizAnswers({});setQuizSubmitted(false);setExamAnswers({});setExamSubmitted(false);setChallengeAnswers({});setChallengeSubmitted(false);
    setLoadingPhase(0);setActiveSection("explain");usedRef.current.clear();setCardStatus(null);
    setMod("general");setClassifierReady(false);/* reset module + show detecting state */
    /* ── Fire-and-forget AI classifier: snaps colors + jokes + topic type pill within ~1s ── */
    /* Fires BEFORE the if(isLite) branch, so it works for ALL modes: lite, fast, think      */
    const classifyInput=(activeTopic||fileContent||"").slice(0,400);
    const groupId=Date.now().toString(36)+Math.random().toString(36).slice(2,7);
    if(classifyInput.trim().length>=2){
      fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+(session?.access_token||"")},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:25,
          _meta:{topic:classifyInput,module:"classifier",mode:"classify",lang,level,request_group_id:groupId},
          system:"Reply with ONLY valid JSON, no markdown or explanation: {\"module\":\"math|stats|econ|finance\",\"type\":\"concept|problem\"}. 'concept' = a theory or topic to understand (e.g. 'Derivatives', 'Supply and Demand'). 'problem' = a specific exercise or calculation to solve (e.g. 'Find the derivative of 3x²', 'Solve 2x+4=10', a PDF with exercises).",
          messages:[{role:"user",content:"Input: "+classifyInput}]})})
      .then(r=>r.json())
      .then(d=>{
        const raw=(d.content||[]).map(b=>b.text||"").join("").trim();
        let parsed={};
        try{parsed=JSON.parse(raw);}catch(e){/* fallback: try to extract words */const m=raw.toLowerCase().replace(/[^a-z]/g," ");if(m.includes("stats"))parsed.module="stats";else if(m.includes("econ"))parsed.module="econ";else if(m.includes("finance"))parsed.module="finance";else if(m.includes("math"))parsed.module="math";if(m.includes("problem"))parsed.type="problem";else if(m.includes("concept"))parsed.type="concept";}
        if(["math","stats","econ","finance"].includes(parsed.module)){setMod(parsed.module);classModRef.current=parsed.module;}
        if(parsed.type==="problem"||parsed.type==="concept"){setTopicType(parsed.type);}
        setClassifierReady(true);
      })
      .catch(()=>{setClassifierReady(true);});
    }
    const detectedMod=mod;/* snapshot for _meta logging only — real mod set async above */

    const isFast=mode==="fast";
    const isLite=mode==="lite";
    const prompt=fileContent?"Topic: "+(activeTopic||"Analyze this math content")+"\n\nContent:\n"+fileContent.slice(0,5000):"Topic: "+activeTopic;
    const modConf=MOD_CONF[mod]||MOD_CONF.general;
    const roleStr=lang==="es"?modConf.roleEs:modConf.roleEn;
    const langRule=lang==="es"?"CRÍTICO — IDIOMA Y CALIDAD:\n1. TODO el contenido en español argentino natural (voseo, cálido e informal). Usá 'vos' no 'tú'. Ejemplos: 'Imaginá que...', 'Básicamente lo que pasa es...', 'Ponele que tenés...'\n2. ORTOGRAFÍA Y ACENTOS: escribí SIEMPRE con acentos correctos. Ejemplos: 'fichó' no 'fico', 'también' no 'tambien', 'después' no 'despues', 'así' no 'asi'. Revisá cada palabra.\n3. TÉRMINOS TÉCNICOS: los términos técnicos aceptados en español (backpropagation, machine learning, overfitting, clustering) pueden quedarse en inglés. Todo lo demás en español.\n4. ETIQUETAS OBLIGATORIAS EN ESPAÑOL: el campo 'label' de bloques analogy DEBE ser 'Pensalo así' (no 'Think of it like this'). El campo 'title' de bloques steps DEBE empezar con 'Ejemplo Resuelto:' (no 'Worked Example:'). Los pasos deben decir 'Paso 1:', 'Paso 2:' etc.\n5. NUNCA uses / (barra) entre palabras en texto explicativo. Escribí 'dado que' no 'dado/que', 'verdadero o falso' no 'verdadero/falso'.\n6. PROHIBIDO: insultos, malas palabras o lenguaje ofensivo en cualquier idioma (no 'jodido', 'mierda', 'pelotudo', 'carajo', ni similares). Mantené todo respetuoso y profesional.\n7. NUNCA uses términos en inglés como 'Net Income', 'Revenue', 'Current Assets' — usá 'Ingreso Neto', 'Ingresos', 'Activos Corrientes'. Abreviaturas estándar (ROE, ROA, NPV, WACC, CAPM) están bien.":"All JSON string values in English. NEVER use insults or offensive language in any language.";
    const ytLang=lang==="es"?"youtubeSearches: 3 VERY SPECIFIC YouTube search queries IN SPANISH. Include channel names.":"youtubeSearches: 3 VERY SPECIFIC YouTube search queries IN ENGLISH. Include channel names.";
    const safeInterest=interest.trim()&&!isBlockedInterest(interest)?interest.trim():"";
    const levelCtx=level==="beginner"
      ?" BEGINNER LEVEL. The student has ZERO prior knowledge. Rules: (1) NO jargon without an immediate plain-English definition. (2) Every analogy must use everyday objects (food, sports, Masteryy — nothing academic). (3) Worked examples use only small whole numbers. (4) NEVER skip a step. (5) No references to other math concepts the student may not know. Explain as if talking to a curious 10-year-old."
      :level==="advanced"
      ?" ADVANCED LEVEL. The student has a strong math/science background. Rules: (1) Use precise formal language and standard notation without defining basics. (2) Skip elementary steps — show only non-obvious derivations. (3) Worked examples must be challenging and non-trivial. (4) Go deep: edge cases, limitations, connections to related advanced concepts. (5) No dumbed-down analogies."
      :" INTERMEDIATE LEVEL. The student knows the basics but is not an expert. Rules: (1) Define specialized terms but skip obvious ones. (2) Mix intuitive explanation with formal notation. (3) Worked examples use realistic numbers, not trivial cases. (4) Include both the 'why it works' and the 'how to apply it'.";
    /* ── Interest context: split by call ── */
    const sonnetInterestCtx=safeInterest?"\n\nPERSONALIZATION (very important): The user loves \""+safeInterest+"\". You MUST:\n- Make ALL analogies and explanations reference \""+safeInterest+"\" creatively (characters, scenarios, themes from it).\n- In the exam: at least 2-3 questions should frame the math problem using \""+safeInterest+"\" context (e.g. if they like The Simpsons, use Homer/Bart in word problems).\n- Be creative and fun with the references, not forced. Make it feel like a fan made this module.":"";
    const haikuInterestCtx=safeInterest?"\n\nPERSONALIZATION: The user loves \""+safeInterest+"\". You MUST weave \""+safeInterest+"\" references naturally into tips. Be creative and fun, not forced.":"";
    const liteInterestCtx=safeInterest?"\n\nPERSONALIZATION (very important): The user loves \""+safeInterest+"\". You MUST:\n- Make the analogy block and explanations reference \""+safeInterest+"\" (characters, scenarios, themes from it).\n- At least 1 exam question should frame the problem using \""+safeInterest+"\" context.\n- Weave references into tips too. Be creative and fun, not forced.":"";
    /* ── Topic type: AI self-detects in main call; classifier updates pill early ── */
    const topicTypeCtx="\n\nTOPIC TYPE (CRITICAL — AUTO-DETECT AND OUTPUT IN JSON):\nBefore generating content, determine whether the input is:\n• CONCEPT/THEORY → a topic to understand (e.g. 'Derivatives', 'Central Limit Theorem', 'Supply & Demand')\n• PROBLEM/EXERCISE → a specific exercise, calculation, or file with problems to solve (e.g. 'Find the derivative of 3x\u00B2+2x', 'Solve 2x+4=10', a PDF worksheet)\nOutput \"topicType\":\"concept\" or \"topicType\":\"problem\" as a REQUIRED top-level JSON key.\nCRITICAL BLOCK ORDER based on detected type:\n• concept → standard order: analogy block first, then text/keypoint, steps block last as worked example.\n• problem → Feynman in reverse: steps block FIRST with the complete step-by-step solution to the exact problem, then text/analogy block explaining WHY each step works and the underlying principle. NEVER start with analogy when a problem was submitted.";

    try{
      if(isLite){
        /* ── LITE MODE: single Haiku call — all sections, minimal content ── */
        const controller=new AbortController();
        const timeout=setTimeout(()=>controller.abort(),60000);
        const liteSystem="You are "+roleStr+"."+levelCtx+"\n"+langRule+"\n\nNOTATION \u2014 CRITICAL RULES (Haiku makes specific mistakes \u2014 avoid ALL of them):\n\u2022 MULTIPLICATION: The ONLY allowed symbol is \u00D7. Write: (1)/(2)\u00D7ln(x), a\u00D7b, 2\u00D7n. NEVER use the letter x or X as a multiplication operator between terms. BAD: 'A x B', '2 x n'. GOOD: 'A\u00D7B', '2\u00D7n'. The letter x is ONLY a variable.\n\u2022 FRACTIONS: EVERY division needs (numerator)/(denominator) with parens on BOTH sides. MANDATORY in quiz/exam options. BAD: '1/2\u00D7ln(x)', '1/4 + C'. GOOD: '(1)/(2)\u00D7ln(x)', '(1)/(4) + C', '(x^3)/(3)'. Integration results: (x^3)/(3)\u00D7ln(x) \u2212 (x^3)/(9) + C. NEVER write 1/2 or x/3 without parens.\n\u2022 EXPONENTS: Multi-character exponents MUST use {}: e^{3t}, e^{-x}, x^{n+1}. Single char: x^2, e^n. NEVER drop the ^ symbol. BAD: 'e3t' (write e^{3t}), 'e(3t)' (write e^{3t}), 'x^32' (write (x^3)/(2)). If exponent has 2+ chars, ALWAYS use {}.\n\u2022 CALCULUS: Integrals: \u222B e^{3t} dt NOT '\u222B (e^3t3) dt'. Integration by parts: u = t, dv = e^{3t} dt NOT 'e3tdt'. Antiderivatives include + C. Derivatives: (dy)/(dx), f'(x).\n\u2022 Radicals: \u221A{content} \u2014 e.g. \u221A{2}, \u221A{x+1}. NEVER 'square root of'.\n\u2022 Absolute value: |x|. Logarithms: log_b(x), ln(x). Subscripts: x_0, x_i. Greek: \u03B1 \u03B2 \u03B3 \u03B4 \u03B5 \u03B8 \u03BB \u03BC \u03C0 \u03C3 \u03C6 \u03C9 (or spell out).\n\u2022 Comparisons: \u2265 \u2264 \u2260 \u2248 \u00B1 (or >=, <=, !=, approx, +-). NEVER use LaTeX \\\\frac or \\\\sqrt style."+modConf.notationPrompt+"\n\nRESPOND WITH ONLY A SINGLE JSON OBJECT. No markdown fences.\nRequired JSON keys (ALL MANDATORY):\n- \"title\": string\n- \"explanationBlocks\": array of 2-3 objects. BLOCK ORDER: analogy first, then text/keypoint, steps last.\n  {\"type\":\"analogy\",\"label\":\"Think of it like this\",\"text\":\"...\"} | {\"type\":\"text\",\"text\":\"...\"} | {\"type\":\"keypoint\",\"text\":\"...\"} | {\"type\":\"steps\",\"title\":\"Worked Example: [name]\",\"context\":\"Full problem. MANDATORY.\",\"items\":[\"Step 1:...\"]}\n  CRITICAL: every block MUST have non-empty text/items.\n- \"keyConcepts\": array of 2 objects {\"title\",\"description\",\"formula\"}\n- \"applications\": array of 1 object {\"title\",\"description\",\"example\"}\n- \"quiz\": array of 3 objects (2 mc + 1 tf).\n  MC: {\"type\":\"mc\",\"question\":\"...\",\"options\":[4 strings],\"correctIndex\":0-3,\"explanation\":\"1 sentence\"}\n  TF: {\"type\":\"tf\",\"statement\":\"A clear true-or-false claim\",\"answer\":true or false,\"explanation\":\"Why\"}\n- \"exam\": array of 3 mc objects {\"type\":\"mc\",\"question\",\"options\":[4 strings],\"correctIndex\":0-3,\"explanation\"}\n- \"tips\": array of 2 objects {\"title\",\"content\"}\n- "+ytLang+"\nKeep ALL sections concise: 1-2 sentences per block, 1 sentence per explanation. CURRENT YEAR IS 2026: use 2025-2026 context for any examples or data — never cite 2023 or earlier as recent/current. CORRECTNESS CHECK (CRITICAL): for every MC question, re-read options[correctIndex] and confirm it is the factually correct answer; your explanation MUST confirm that same option — a mismatch breaks the quiz. TOOL REFERENCES: if you mention any software tool (Excel, Python, R, etc.) in a question or example, you MUST briefly explain what that tool does in that context — never assume the student knows it. Vary correctIndex 0-3 randomly. NO REASONING IN EXPLANATIONS (CRITICAL): The \"explanation\" field of every quiz/exam MC question must be ONE clean sentence stating why the correctIndex option is correct. NEVER write \"espera\", \"esperá\", \"wait\", \"actually\", \"hmm\", \"let me recheck\", \"cambiando\", \"re-cálculo\", \"revisá\", \"no, la respuesta es\", or ANY meta-commentary, self-correction, or thinking-out-loud. Do all reasoning INTERNALLY before writing JSON; only output the final clean answer. NEVER mention \"index N\" or \"opción N\" in the explanation text — correctIndex already encodes that. If your answer changes mid-thought, rewrite correctIndex AND explanation cleanly; do NOT leave a trail."+liteInterestCtx+topicTypeCtx+"\n\nADDITIONAL REQUIRED JSON KEY:\n- \"relatedTopics\": array of 4-5 objects {\"label\":string,\"tagline\":string} — closely related subtopics or techniques to explore next. Keep labels short (2-5 words). Taglines: one brief phrase. NEVER list the current topic itself.";
        const liteRes=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+(session?.access_token||"")},signal:controller.signal,
          body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:5500,
            _meta:{topic:topic||"file",module:detectedMod,mode:"lite",lang,level,request_group_id:groupId},
            system:liteSystem,messages:[{role:"user",content:prompt}]})});
        const liteData=await liteRes.json();clearTimeout(timeout);
        if(liteData.error)throw new Error(liteData.error.message||liteData.error);
        const rawLite=(liteData.content||[]).map(b=>b.text||"").join("");
        if(!rawLite||rawLite.trim().length<10)throw new Error("Empty response from API. Please try again.");
        const parsed=safeParseJSON(rawLite);if(!parsed.title)throw new Error("Could not parse response. Please try again.");
        if(!parsed.exam||!Array.isArray(parsed.exam)||parsed.exam.length===0){parsed.exam=[{type:"mc",question:lang==="es"?"El examen no se gener\u00F3. Intent\u00E1 de nuevo.":"Exam was not generated. Please try again.",options:["\u2014","\u2014","\u2014","\u2014"],correctIndex:0,explanation:""}];}
        if(!parsed.tips||!Array.isArray(parsed.tips)||parsed.tips.length===0){parsed.tips=[{title:lang==="es"?"Practic\u00E1 con ejemplos":"Practice with examples",content:lang==="es"?"La mejor forma de aprender es resolver problemas paso a paso.":"The best way to learn is by solving problems step by step."}];}
        if(!parsed.quiz||!Array.isArray(parsed.quiz)||parsed.quiz.length===0){parsed.quiz=[{type:"mc",question:lang==="es"?"El quiz no se gener\u00F3. Intent\u00E1 de nuevo.":"Quiz was not generated. Please try again.",options:["\u2014","\u2014","\u2014","\u2014"],correctIndex:0,explanation:""}];}
        if(!parsed.keyConcepts||!Array.isArray(parsed.keyConcepts))parsed.keyConcepts=[];
        if(!parsed.applications||!Array.isArray(parsed.applications))parsed.applications=[];
        if(!parsed.explanationBlocks||!Array.isArray(parsed.explanationBlocks))parsed.explanationBlocks=[];
        const finalLite=shuffleMC(deepFmt(sanitizeAllMC(parsed)));setContent(finalLite);setPhase("complete");playDing();saveHistory(finalLite,activeTopic||"file");
        if(parsed.topicType==="problem"||parsed.topicType==="concept")setTopicType(parsed.topicType);
        setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth"}),200);
      }else{
        /* ── FAST / THINK: parallel Sonnet + Haiku calls ── */
        const controller=new AbortController();
        const timeout=setTimeout(()=>controller.abort(),120000);/* 2 min timeout */
        const authH={"Content-Type":"application/json","Authorization":"Bearer "+(session?.access_token||"")};

        /* ── Sonnet: explanation + keyConcepts + applications + exam (+ examChallenge in think) ── */
        const sonnetSystem="You are "+roleStr+"."+levelCtx+"\n"+langRule+"\n\nNOTATION \u2014 ALWAYS USE SYMBOLS, NEVER WRITE MATH IN WORDS:\n\u2022 Fractions/division: (num)/(den) ALWAYS with parens, \u00F7 for arithmetic. NEVER \'divided by\'.\n\u2022 Radicals: \u221A{content} or sqrt{content} \u2014 e.g. \u221A{2}, \u221A{x+1}. NEVER 'square root of'.\n\u2022 Powers: x^2, 2^3, e^n, x^{n+1}, (1+r)^n. NEVER 'squared', 'cubed', 'to the power of'.\n\u2022 Multiplication: \u00D7 directly \u2014 write a\u00D7b, 2\u00D7n. NEVER 'times' or 'multiplied by'.\n\u2022 Absolute value: |x|, |a-b|. NEVER 'absolute value of'.\n\u2022 Logarithms: log_b(x), log_{10}(x), ln(x). NEVER \'log base b of\'.\n\u2022 Subscripts: x_0, x_i, x_{n-1} (or \u2080\u2081\u2082 for simple cases).\n\u2022 Integrals: \u222B[a,b] f(x) dx. Sums: \u2211[i=1,n] a_i. Products: \u220F[i=1,n]. NEVER \'integral from...\', \'sum from...\'.\n\u2022 Limits: lim_{x\u2192a} f(x) or lim[x\u21920]. NEVER 'as x approaches'.\n\u2022 Derivatives: (dy)/(dx), f'(x), f''(x), (\u2202f)/(\u2202x). NEVER 'derivative of ... with respect to'.\n\u2022 Greek: \u03B1 \u03B2 \u03B3 \u03B4 \u03B5 \u03B8 \u03BB \u03BC \u03C0 \u03C3 \u03C6 \u03C9.\n\u2022 Comparisons: \u2265 \u2264 \u2260 \u2248 \u00B1 (or write >=, <=, !=, approx, +-). NEVER use LaTeX \\\\frac or \\\\sqrt style.\nDerivatives: (dy)/(dx) not dydx. f'(x) for prime."+modConf.notationPrompt+"\n\nFORMULA FORMATTING RULES (CRITICAL):\n1. EVERY fraction MUST have (numerator)/(denominator) with BOTH parentheses. Example: (n\u2211xy - \u2211x\u2211y)/(n\u2211x\u00B2 - (\u2211x)\u00B2). NEVER write num/den without parens.\n2. ONE formula per line. NEVER chain multiple formulas with commas. If showing slope AND intercept, put each on its OWN line.\n3. In keyConcepts formula field: put ONLY the main formula. If there are multiple related formulas, separate with \\n newline character.\n4. In keypoint blocks: if you include a formula, put it on its own line after the explanation text, separated by \\n.\n5. Formatting: **bold** key terms, __underline__ key formulas (explanations only, sparingly).\n\nRESPOND WITH ONLY A SINGLE JSON OBJECT. No markdown fences.\nRequired JSON keys (ALL are MANDATORY - never omit any):\n- \"title\": string\n- \"explanationBlocks\": array of "+(isFast?"3-4":"5-6")+" objects, each with \"type\" and fields. "+(isFast?"Include 1+ \"steps\" block.":"Include 2+ \"steps\" blocks.")+"\n  BLOCK ORDER (MANDATORY): Explain the concept FIRST, then show examples. Structure: 1) Start with an \"analogy\" block, 2) then \"text\" and \"keypoint\" blocks for theory/definitions/formulas, 3) put \"steps\" blocks LAST as worked examples. NEVER start with a steps block.\n  BLOCK FORMATS (follow exactly):\n  - {\"type\":\"analogy\", \"label\":\"Think of it like this\", \"text\":\"A concrete everyday analogy that makes the concept click. MUST NOT be empty.\"}\n  - {\"type\":\"text\", \"text\":\"A paragraph explaining theory, definitions, or intuition.\"}\n  - {\"type\":\"keypoint\", \"text\":\"A key takeaway or important formula.\"}\n  - {\"type\":\"steps\", \"title\":\"Worked Example: [name]\", \"context\":\"The FULL problem statement \u2014 what is given, what to find. MANDATORY.\", \"items\":[\"Step 1: ...\",\"Step 2: ...\"]}\n  CRITICAL: Every block MUST have non-empty \"text\" (for analogy/text/keypoint) or \"items\" (for steps). NEVER return empty strings.\n- \"keyConcepts\": array of 3 objects {\"title\",\"description\",\"formula\"}\n- \"applications\": array of "+(isFast?"2":"3")+" objects {\"title\",\"description\",\"example\"}\n- \"exam\": array of "+(isFast?"5":"10")+" objects, ALL mc with question, options, correctIndex, explanation.\n"+(isFast?"":"- \"examChallenge\": array of 8 objects. 5 hard mc + 3 solve.\n  Solve format: {\"type\":\"solve\",\"problem\":\"A word problem to solve on paper\",\"hint\":\"A brief clue\",\"solution\":\"Full step-by-step solution with calculations\"}\n  CRITICAL: solve MUST have \"problem\" (NOT \"question\"), \"hint\", and \"solution\".\n")+"OUTPUT LENGTH MANAGEMENT (CRITICAL): ALL sections above are MANDATORY. Keep explanationBlocks CONCISE (max 2-3 sentences per text block, max 4 steps). Keep keyConcepts to 1-2 sentences. Keep exam explanations to 1 sentence. PRIORITIZE completeness over verbosity. CURRENT YEAR IS 2026: use 2025-2026 context for any examples, data, or references — never cite 2023 or earlier as recent/current. CORRECTNESS CHECK (CRITICAL): for every MC question, re-read options[correctIndex] and confirm it is factually correct; the explanation MUST reference that same option — a mismatch makes the exam wrong. TOOL REFERENCES: if you mention any software tool (Excel, Python, R, a spreadsheet function, etc.) in any question or example, you MUST briefly explain what it does in that context — never assume the student knows the tool. Vary correctIndex 0-3 randomly. NO REASONING IN EXPLANATIONS (CRITICAL): The \"explanation\" field of every quiz/exam MC question must be ONE clean sentence stating why the correctIndex option is correct. NEVER write \"espera\", \"esperá\", \"wait\", \"actually\", \"hmm\", \"let me recheck\", \"cambiando\", \"re-cálculo\", \"revisá\", \"no, la respuesta es\", or ANY meta-commentary, self-correction, or thinking-out-loud. Do all reasoning INTERNALLY before writing JSON; only output the final clean answer. NEVER mention \"index N\" or \"opción N\" in the explanation text — correctIndex already encodes that. If your answer changes mid-thought, rewrite correctIndex AND explanation cleanly; do NOT leave a trail."+sonnetInterestCtx+topicTypeCtx+"\n\nADDITIONAL REQUIRED JSON KEY:\n- \"relatedTopics\": array of 4-5 objects {\"label\":string,\"tagline\":string} — closely related subtopics or techniques the student should explore AFTER mastering this topic. Examples for 'Derivatives': [{\"label\":\"Chain Rule\",\"tagline\":\"Derivatives of nested functions\"},{\"label\":\"Optimization Problems\",\"tagline\":\"Finding maxima and minima\"}]. Keep labels short (2-5 words). Taglines: one brief phrase. NEVER list the current topic itself.";

        /* ── Haiku: quiz + tips + youtubeSearches ── */
        const haikuSystem="You are "+roleStr+"."+levelCtx+"\n"+langRule+"\n\nNOTATION \u2014 CRITICAL RULES (Haiku makes specific mistakes \u2014 avoid ALL of them):\n\u2022 MULTIPLICATION: The ONLY allowed symbol is \u00D7. Write: (1)/(2)\u00D7ln(x), a\u00D7b, 2\u00D7n. NEVER use the letter x or X as a multiplication operator between terms. BAD: 'A x B', '2 x n'. GOOD: 'A\u00D7B', '2\u00D7n'. The letter x is ONLY a variable.\n\u2022 FRACTIONS: EVERY division needs (numerator)/(denominator) with parens on BOTH sides. MANDATORY in quiz/exam options. BAD: '1/2\u00D7ln(x)', '1/4 + C'. GOOD: '(1)/(2)\u00D7ln(x)', '(1)/(4) + C', '(x^3)/(3)'. Integration results: (x^3)/(3)\u00D7ln(x) \u2212 (x^3)/(9) + C. NEVER write 1/2 or x/3 without parens.\n\u2022 EXPONENTS: Multi-character exponents MUST use {}: e^{3t}, e^{-x}, x^{n+1}. Single char: x^2, e^n. NEVER drop the ^ symbol. BAD: 'e3t' (write e^{3t}), 'e(3t)' (write e^{3t}), 'x^32' (write (x^3)/(2)). If exponent has 2+ chars, ALWAYS use {}.\n\u2022 CALCULUS: Integrals: \u222B e^{3t} dt NOT '\u222B (e^3t3) dt'. Integration by parts: u = t, dv = e^{3t} dt NOT 'e3tdt'. Antiderivatives include + C. Derivatives: (dy)/(dx), f'(x).\n\u2022 Radicals: \u221A{content} \u2014 e.g. \u221A{2}, \u221A{x+1}. NEVER 'square root of'.\n\u2022 Absolute value: |x|. Logarithms: log_b(x), ln(x). Subscripts: x_0, x_i. Greek: \u03B1 \u03B2 \u03B3 \u03B4 \u03B5 \u03B8 \u03BB \u03BC \u03C0 \u03C3 \u03C6 \u03C9 (or spell out).\n\u2022 Comparisons: \u2265 \u2264 \u2260 \u2248 \u00B1 (or >=, <=, !=, approx, +-). NEVER use LaTeX \\\\frac or \\\\sqrt style."+modConf.notationPrompt+"\n\nRESPOND WITH ONLY A SINGLE JSON OBJECT. No markdown fences.\nRequired JSON keys (ALL are MANDATORY - never omit any):\n- \"quiz\": array of "+(isFast?"3":"5")+" objects. "+(isFast?"2 mc + 1 tf.":"3 mc + 2 tf.")+"\n  MC format: {\"type\":\"mc\",\"question\":\"...\",\"options\":[4 strings],\"correctIndex\":0-3,\"explanation\":\"1 sentence\"}\n  TF format: {\"type\":\"tf\",\"statement\":\"A clear true-or-false claim\",\"answer\":true or false,\"explanation\":\"Why\"}\n  CRITICAL: tf MUST have \"statement\" (NOT \"question\"), \"answer\" (boolean), and \"explanation\".\n- \"tips\": array of "+(isFast?"2":"3")+" objects {\"title\",\"content\"}\n- "+ytLang+"\nKeep quiz explanations to 1 sentence. CURRENT YEAR IS 2026: use 2025-2026 context for any examples or references — never cite 2023 or earlier as recent/current. CORRECTNESS CHECK (CRITICAL): for every MC question, re-read options[correctIndex] and verify it is the correct answer; the explanation MUST confirm that same option. TOOL REFERENCES: if you mention any software tool (Excel, Python, etc.) in a question, briefly explain what it does in that context. Vary correctIndex 0-3 randomly. NO REASONING IN EXPLANATIONS (CRITICAL): The \"explanation\" field of every quiz/exam MC question must be ONE clean sentence stating why the correctIndex option is correct. NEVER write \"espera\", \"esperá\", \"wait\", \"actually\", \"hmm\", \"let me recheck\", \"cambiando\", \"re-cálculo\", \"revisá\", \"no, la respuesta es\", or ANY meta-commentary, self-correction, or thinking-out-loud. Do all reasoning INTERNALLY before writing JSON; only output the final clean answer. NEVER mention \"index N\" or \"opción N\" in the explanation text — correctIndex already encodes that. If your answer changes mid-thought, rewrite correctIndex AND explanation cleanly; do NOT leave a trail."+haikuInterestCtx+topicTypeCtx;

        /* ── Fire both in parallel ── */
        const [sonnetRes,haikuRes]=await Promise.all([
          fetch("/api/claude",{method:"POST",headers:authH,signal:controller.signal,
            body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:isFast?8000:12000,
              _meta:{topic:topic||"file",module:detectedMod,mode,lang,level,request_group_id:groupId},
              system:sonnetSystem,messages:[{role:"user",content:prompt}]})}),
          fetch("/api/claude",{method:"POST",headers:authH,signal:controller.signal,
            body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:isFast?3500:5000,
              _meta:{topic:topic||"file",module:detectedMod,mode:mode+"_haiku",lang,level,request_group_id:groupId},
              system:haikuSystem,messages:[{role:"user",content:prompt}]})}),
        ]);
        const [sonnetData,haikuData]=await Promise.all([sonnetRes.json(),haikuRes.json()]);
        clearTimeout(timeout);
        if(sonnetData.error)throw new Error(sonnetData.error.message||sonnetData.error);
        if(haikuData.error)throw new Error(haikuData.error.message||haikuData.error);

        const rawSonnet=(sonnetData.content||[]).map(b=>b.text||"").join("");
        const rawHaiku=(haikuData.content||[]).map(b=>b.text||"").join("");
        if(!rawSonnet||rawSonnet.trim().length<10)throw new Error("Empty response from API. Please try again.");
        if(!rawHaiku||rawHaiku.trim().length<10)throw new Error("Empty response from API. Please try again.");

        const parsedSonnet=safeParseJSON(rawSonnet);
        const parsedHaiku=safeParseJSON(rawHaiku);
        if(!parsedSonnet.title)throw new Error("Could not parse response. Please try again.");

        /* ── Merge both responses ── */
        const parsed={...parsedSonnet,
          quiz:parsedHaiku.quiz,
          tips:parsedHaiku.tips,
          youtubeSearches:parsedHaiku.youtubeSearches,
        };

        /* Validate critical sections */
        if(!parsed.exam||!Array.isArray(parsed.exam)||parsed.exam.length===0){
          parsed.exam=[{type:"mc",question:lang==="es"?"El contenido del examen no se gener\u00F3 correctamente. Intent\u00E1 de nuevo.":"Exam content was not generated correctly. Please try again.",options:["\u2014","\u2014","\u2014","\u2014"],correctIndex:0,explanation:""}];
        }
        if(!parsed.tips||!Array.isArray(parsed.tips)||parsed.tips.length===0){
          parsed.tips=[{title:lang==="es"?"Practic\u00E1 con ejemplos":"Practice with examples",content:lang==="es"?"La mejor forma de aprender es resolver problemas paso a paso.":"The best way to learn is by solving problems step by step."}];
        }
        if(!parsed.quiz||!Array.isArray(parsed.quiz)||parsed.quiz.length===0){
          parsed.quiz=[{type:"mc",question:lang==="es"?"El quiz no se gener\u00F3. Intent\u00E1 de nuevo.":"Quiz was not generated. Please try again.",options:["\u2014","\u2014","\u2014","\u2014"],correctIndex:0,explanation:""}];
        }
        if(!parsed.keyConcepts||!Array.isArray(parsed.keyConcepts))parsed.keyConcepts=[];
        if(!parsed.applications||!Array.isArray(parsed.applications))parsed.applications=[];
        if(!parsed.explanationBlocks||!Array.isArray(parsed.explanationBlocks))parsed.explanationBlocks=[];
        const finalFull=shuffleMC(deepFmt(sanitizeAllMC(parsed)));setContent(finalFull);setPhase("complete");playDing();saveHistory(finalFull,activeTopic||"file");
        if(parsed.topicType==="problem"||parsed.topicType==="concept")setTopicType(parsed.topicType);
        setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth"}),200);
      }/* end fast/think else */
    }catch(err){
      console.error(err);
      const msg=err.name==="AbortError"?"Request timed out. Please try again.":(err.message||"Something went wrong. Please try again.");
      setError(msg);setPhase("idle");
    }

    }catch(outerErr){console.error("go() error:",outerErr);setError("Something went wrong: "+outerErr.message);setPhase("idle");}
  };

  /* ═══════════ "I didn't understand" — one-shot simpler explanation ═══════════ */
  const simplify=async()=>{
    if(simplifiedBlocks||simplifying||!content)return;
    setSimplifying(true);
    try{
      const modConf=MOD_CONF[mod]||MOD_CONF.general;
      const roleStr=lang==="es"?modConf.roleEs:modConf.roleEn;
      const langRule=lang==="es"?"CRÍTICO: Todo en español argentino (voseo). Acentos correctos siempre. El campo 'label' de analogy: 'Pensalo así'. El campo 'title' de steps: 'Ejemplo Resuelto: [nombre]'. Pasos: 'Paso 1:', 'Paso 2:'. Sin insultos ni malas palabras.":"All JSON string values in English.";
      const safeInterest=interest.trim()&&!isBlockedInterest(interest)?interest.trim():"";
      const interestNote=safeInterest?" The user loves \""+safeInterest+"\", use it in analogies.":"";
      const originalText=(content.explanationBlocks||[]).map(b=>b.text||b.title||(b.items||[]).join("; ")).join(" ").slice(0,2000);
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),90000);
      const res=await fetch("/api/claude",{
        method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+(session?.access_token||"")},
        signal:controller.signal,
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:4000,
          _meta:{topic:content.title||"simplify",module:mod,mode:"simplify",lang,request_group_id:Date.now().toString(36)+Math.random().toString(36).slice(2,7)},
          system:"You are "+roleStr+". The student did NOT understand the previous explanation. Your job: RE-EXPLAIN the same topic but MUCH SIMPLER.\n"+langRule+"\n\nRULES:\n1. Explain like you\u2019re talking to an 8-year-old. Zero jargon.\n2. Use a CONCRETE, EVERYDAY analogy as the backbone (pizza slices, sharing candy, filling a pool, etc.).\n3. Walk through ONE practical example step-by-step with actual numbers. Show EVERY calculation. IMPORTANT: explain the concept FIRST (analogy + text), THEN show the worked example (steps block) AFTER.\n4. Keep it SHORT \u2014 3-4 blocks max. No walls of text.\n5. Include a mini \"try this\" at the end: ONE super easy problem they can solve in 10 seconds with the answer.\n6. NOTATION \u2014 ALWAYS USE SYMBOLS, NEVER WRITE MATH IN WORDS: fractions (num)/(den) or \u00F7 (NEVER 'divided by'); radicals \u221A{content} or sqrt{content} (NEVER 'square root of'); powers x^2, 2^3, e^n (NEVER 'squared', 'to the power of'); multiplication \u00D7 directly, e.g. a\u00D7b (NEVER 'times'); absolute value |x| (NEVER 'absolute value of'); logarithms log_b(x), ln(x) (NEVER 'log base b of'); Greek \u03C3\u03BC\u03C0\u03B1\u03B2. NEVER use LaTeX \\\\frac or \\\\sqrt style."+modConf.notationPrompt+"\n"+interestNote+levelCtx+"\n\nRESPOND WITH ONLY A JSON ARRAY of explanation blocks. No markdown fences.\nEach block: {\"type\":\"analogy\"|\"steps\"|\"text\"|\"keypoint\", \"text\"?:string, \"label\"?:string, \"title\"?:string, \"context\"?:string (REQUIRED for steps — the full problem setup), \"items\"?:[strings]}.\nExample: [{\"type\":\"analogy\",\"label\":\"Think of it like this\",\"text\":\"Imagine you have 12 cookies...\"},{\"type\":\"steps\",\"title\":\"Let\u2019s solve one together\",\"context\":\"You have 12 cookies and want to share them equally among 3 friends. How many does each friend get?\",\"items\":[\"Step 1: ...\",\"Step 2: ...\"]},{\"type\":\"keypoint\",\"text\":\"The answer is 4! Try this: ...\"}]",
          messages:[{role:"user",content:"The student didn\u2019t understand this explanation of \""+content.title+"\":\n\n"+originalText+"\n\nRe-explain it MUCH more simply with a concrete step-by-step example."}],
        }),
      });
      const data=await res.json();clearTimeout(timeout);
      if(data.error)throw new Error(data.error.message);
      const raw=(data.content||[]).map(b=>b.text||"").join("");
      let parsed;
      try{parsed=safeParseJSON(raw);}catch(e){parsed=null;}
      /* Handle various response shapes: array, {blocks:[...]}, or single object */
      let blocks=null;
      if(Array.isArray(parsed)&&parsed.length>0)blocks=parsed;
      else if(parsed&&Array.isArray(parsed.blocks)&&parsed.blocks.length>0)blocks=parsed.blocks;
      else if(parsed&&Array.isArray(parsed.explanationBlocks)&&parsed.explanationBlocks.length>0)blocks=parsed.explanationBlocks;
      else if(parsed&&parsed.type&&parsed.text)blocks=[parsed];/* single block object */
      if(blocks){setSimplifiedBlocks(deepFmt(blocks));}
      else{throw new Error("Bad format");}
    }catch(err){console.error("simplify error:",err);setSimplifiedBlocks([{type:"text",text:lang==="es"?"No se pudo generar una explicaci\u00F3n m\u00E1s simple. Intent\u00E1 de nuevo con otro tema.":"Could not generate a simpler explanation. Try again with another topic."}]);}
    finally{setSimplifying(false);}
  };

  // Scoring
  const quizMC=(content?.quiz||[]).filter(q=>q.type==="mc");
  const quizTF=(content?.quiz||[]).filter(q=>q.type==="tf");
  const quizMCScore=quizMC.reduce((a,q,i)=>{const idx=(content?.quiz||[]).indexOf(q);return a+(quizAnswers[idx]===parseInt(q.correctIndex,10)?1:0);},0);
  const quizTFScore=quizTF.reduce((a,q)=>{const idx=(content?.quiz||[]).indexOf(q);return a+(quizAnswers[idx]===q.answer?1:0);},0);
  const quizScore=quizMCScore+quizTFScore;
  const quizTotal=(content?.quiz||[]).length;
  const quizAllAnswered=Object.keys(quizAnswers).length>=quizTotal;

  const examScore=content?.exam?content.exam.reduce((a,q,i)=>a+(examAnswers[i]===parseInt(q.correctIndex,10)?1:0),0):0;
  const examTotal=(content?.exam||[]).length;

  const challengeMC=(content?.examChallenge||[]).filter(q=>q.type==="mc");
  const challengeMCScore=challengeMC.reduce((a,q)=>{const idx=(content?.examChallenge||[]).indexOf(q);return a+(challengeAnswers[idx]===q.correctIndex?1:0);},0);

  const sections=[{id:"explain",label:t.understand,icon:"\uD83D\uDCA1"},{id:"quiz",label:t.quiz,icon:"\uD83E\uDDE0"},{id:"exam",label:t.exam,icon:"\uD83C\uDF93"},{id:"tips",label:t.tips,icon:"\uD83C\uDFAF"},...(mode==="think"?[{id:"deck",label:t.deck,icon:"\uD83D\uDCCA"}]:[])];
  const showResults=phase==="complete"&&content;
  const btnS=(on)=>({background:on?"linear-gradient(135deg, "+mt.accentLight+", "+mt.accent+")":TH.bgAlt,border:"none",borderRadius:7,padding:"9px 26px",color:on?"#fff":TH.textFaint,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",boxShadow:on?"0 2px 8px "+mt.btnShadow:"none"});
  const retBtn={background:TH.surface,border:"1px solid "+TH.border,borderRadius:7,padding:"9px 26px",color:TH.textSecondary,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"};

  return <div style={{minHeight:"100vh",background:TH.bg,color:TH.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
    <style>{"\n@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');\n@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}@keyframes sparkle{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes langMorphOut{0%{opacity:1;filter:blur(0px);transform:scale(1) translateY(0)}100%{opacity:0;filter:blur(10px);transform:scale(0.97) translateY(6px)}}@keyframes langMorphIn{0%{opacity:0;filter:blur(10px);transform:scale(0.97) translateY(-6px)}100%{opacity:1;filter:blur(0px);transform:scale(1) translateY(0)}}@keyframes langMorph{0%{opacity:0;filter:blur(12px);transform:scale(0.96) rotateX(8deg)}30%{opacity:0.5;filter:blur(5px);transform:scale(0.99) rotateX(3deg)}100%{opacity:1;filter:blur(0px);transform:scale(1) rotateX(0deg)}}@keyframes thinkDot{0%,80%,100%{opacity:0.2}40%{opacity:1}}@keyframes moduleReveal{from{opacity:0;transform:translateY(-4px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}*{margin:0;padding:0;box-sizing:border-box}body{background:"+TH.bg+"}::selection{background:rgba(245,166,35,0.25);color:#000}input::placeholder{color:"+TH.textFaint+"}\nbody{-webkit-text-size-adjust:100%;text-size-adjust:100%}\nbutton,a{-webkit-tap-highlight-color:transparent;tap-highlight-color:transparent;touch-action:manipulation}\ninput,textarea{touch-action:manipulation}\n/* iOS zoom fix: only on the main search inputs, not all inputs globally */\n@media(max-width:640px){\n  .mm-topic-input,.mm-interest-input{font-size:16px !important;padding:8px 0 !important}\n  .mm-results-padding{padding:4px 16px 32px !important}\n}\n"}</style>

    {/* TOP BAR */}
    <div style={{position:"fixed",top:48,left:0,right:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"7px 12px",background:TH.topBar,backdropFilter:"blur(14px)",borderBottom:showResults?"1px solid "+TH.border:"1px solid transparent",boxShadow:showResults?TH.shadow:"none"}}>
      {showResults&&<div key={"tabs-"+lang} style={{display:"flex",gap:2,background:TH.bgAlt,borderRadius:9,padding:2,border:"1px solid "+TH.border,animation:hasChangedLang.current?"langMorph 0.4s cubic-bezier(0.22,1,0.36,1)":"none"}}>{sections.map(sec=><button key={sec.id} onClick={()=>setActiveSection(sec.id)} style={{padding:"6px 10px",borderRadius:7,background:activeSection===sec.id?mt.accentBg:"transparent",border:activeSection===sec.id?"1px solid "+mt.borderAccent:"1px solid transparent",color:activeSection===sec.id?mt.accent:TH.textMuted,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap",transition:"all 0.2s"}}><span style={{fontSize:10}}>{sec.icon}</span>{sec.label}</button>)}</div>}
    </div>

    {/* MORPH WRAPPER — animates only on language switch, not first load */}
    <div key={"content-"+lang} style={{animation:hasChangedLang.current?"langMorph 0.45s cubic-bezier(0.22,1,0.36,1) forwards":"none",perspective:"800px",transformOrigin:"center top"}}>

    {/* HERO */}
    <div className="mm-hero-padding" style={{minHeight:phase==="idle"?"auto":"auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:phase==="idle"?"28px 20px 24px":"96px 20px 8px",transition:"all 0.5s",position:"relative"}}>
      <div style={{position:"absolute",top:"-20%",left:"50%",transform:"translateX(-50%)",width:600,height:600,background:"radial-gradient(circle, "+mt.accent+"0a 0%, transparent 70%)",pointerEvents:"none",transition:"background 0.6s ease"}}/>
      {/* ─── HEADER ─── */}
      <div style={{textAlign:"center",marginBottom:phase==="idle"?20:10,position:"relative",zIndex:1}}>
        {phase==="idle"&&<div style={{display:"inline-flex",alignItems:"center",gap:5,background:mt.accentBg,border:"1px solid "+mt.borderAccent,borderRadius:10,padding:"3px 10px",marginBottom:12,fontSize:9,color:mt.accent,fontWeight:700,letterSpacing:1.5,transition:"background 0.5s ease, border-color 0.5s ease, color 0.5s ease"}}>{mc.icon} {lang==="es"?mc.badgeEs:mc.badgeEn}</div>}
        <h1 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:phase==="idle"?"clamp(28px,5vw,48px)":20,fontWeight:800,lineHeight:1.1,color:TH.text,letterSpacing:"-0.02em"}}>{t.title}</h1>
        {phase==="idle"&&<p style={{color:TH.textMuted,fontSize:12,maxWidth:380,margin:"8px auto 0",lineHeight:1.5}}>{t.subtitle}</p>}
      </div>
      {/* ─── SEARCH + MODE CARD ─── */}
      <div style={{width:"100%",maxWidth:620,position:"relative",zIndex:1}}>
        {phase==="idle"&&<div style={{background:TH.surface,borderRadius:16,border:"1px solid "+TH.border,padding:"20px 20px 16px",boxShadow:"0 4px 24px rgba(0,0,0,0.04)",marginBottom:14}}>
          {/* Search bar */}
          <div style={{display:"flex",alignItems:"center",background:TH.bg,borderRadius:10,border:"1px solid "+(validationError?"rgba(239,68,68,0.4)":TH.borderLight),padding:"2px 2px 2px 13px",animation:validationError?"shake 0.4s ease":"none"}}>
            <span style={{fontSize:13,marginRight:7,opacity:0.35}}>{"\uD83D\uDD0D"}</span>
            <input type="text" className="mm-topic-input" placeholder={t.placeholder} value={topic} onChange={e=>{setTopic(e.target.value);setValidationError(false);}} onKeyDown={e=>e.key==="Enter"&&phase!=="loading"&&go()} style={{flex:1,background:"transparent",border:"none",outline:"none",color:TH.text,fontSize:13,fontFamily:"inherit",padding:"10px 0"}}/>
            <button onClick={()=>fileRef.current?.click()} style={{background:file?mt.accentBg:"transparent",border:"none",borderRadius:6,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginRight:3}}><FileUploadIcon active={!!file}/></button>
            <input ref={fileRef} type="file" accept="*/*" style={{display:"none"}} onChange={handleFile}/>
          </div>
          {validationError&&<div style={{marginTop:7,padding:"8px 12px",background:TH.redBg,border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,color:TH.red,fontSize:11,animation:"fadeUp 0.3s ease"}}>{"\u26A0\uFE0F"} {t.invalidInput}</div>}
          {fileError&&<div style={{marginTop:7,padding:"8px 12px",background:TH.redBg,border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,color:TH.red,fontSize:11,animation:"fadeUp 0.3s ease"}}>{"\u26A0\uFE0F"} {fileError}</div>}
          {/* ── Module recognition pill ── */}
          {!validationError&&!fileError&&topic.trim().length>=2&&mod!=="general"&&<div key={mod} style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:7,padding:"3px 10px",background:mt.accentBg,border:"1px solid "+mt.borderAccent,borderRadius:20,animation:"moduleReveal 0.35s cubic-bezier(0.22,1,0.36,1)",transition:"background 0.4s ease, border-color 0.4s ease"}}>
            <span style={{fontSize:11}}>{mc.icon}</span>
            <span style={{fontSize:9,fontWeight:700,color:mt.accent,letterSpacing:1,transition:"color 0.4s ease"}}>{lang==="es"?mc.badgeEs:mc.badgeEn}</span>
          </div>}
          {file&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}><span style={{fontSize:10,color:mt.accent}}>{"\uD83D\uDCC4"}</span><span style={{fontSize:10,color:TH.textSecondary}}>{file.name}</span><button onClick={()=>{setFile(null);setFileContent("");setFileError("");}} style={{background:"none",border:"none",color:TH.red,cursor:"pointer",fontSize:9,fontFamily:"inherit"}}>{t.remove}</button></div>}
          {/* Interest bar */}
          <div style={{marginTop:12,display:"flex",alignItems:"center",gap:8,background:interestFocused?TH.bg:interest?TH.bg:"linear-gradient(135deg, rgba(99,102,241,0.03), rgba(236,72,153,0.03))",borderRadius:10,border:"1px solid "+(interestError?"rgba(239,68,68,0.4)":interestFocused?"rgba(99,102,241,0.3)":interest?"rgba(99,102,241,0.15)":TH.borderLight),padding:"3px 12px",transition:"all 0.35s cubic-bezier(0.22,1,0.36,1)"}}>
            <span style={{fontSize:14,opacity:interest?1:0.4,transition:"opacity 0.3s",flexShrink:0}}>{"\uD83C\uDFAF"}</span>
            <input type="text" className="mm-interest-input" placeholder={t.interestPlaceholder} value={interest} onChange={e=>{setInterest(e.target.value);setInterestError(isBlockedInterest(e.target.value));}} onFocus={()=>setInterestFocused(true)} onBlur={()=>setInterestFocused(false)} onKeyDown={e=>e.key==="Enter"&&topic.trim()&&!interestError&&go()} style={{flex:1,background:"transparent",border:"none",outline:"none",color:interestError?TH.red:interest?TH.purple:TH.textMuted,fontSize:12,fontFamily:"inherit",padding:"9px 0",fontWeight:interest?500:400}}/>
            <button onClick={()=>{const r=RANDOM_INTERESTS[Math.floor(Math.random()*RANDOM_INTERESTS.length)];setInterest(r);setInterestError(false);}} title="Random interest" style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"3px 4px",borderRadius:4,opacity:0.55,transition:"all 0.15s",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.55"}>{"\uD83C\uDFB2"}</button>
            {interest&&<button onClick={()=>{setInterest("");setInterestError(false);}} style={{background:"rgba(0,0,0,0.04)",border:"none",color:TH.textFaint,cursor:"pointer",fontSize:9,padding:"3px 6px",borderRadius:4,fontFamily:"inherit"}}>{"\u2715"}</button>}
          </div>
          {interestError&&<div style={{marginTop:5,padding:"5px 10px",background:TH.redBg,border:"1px solid rgba(239,68,68,0.12)",borderRadius:6,color:TH.red,fontSize:10,textAlign:"center"}}>{INTEREST_WARN[lang]||INTEREST_WARN.en}</div>}
          {!interestError&&<p style={{textAlign:"center",color:TH.textFaint,fontSize:8,marginTop:4,letterSpacing:0.3}}>{t.interestHint}</p>}
          {/* Divider */}
          <div style={{height:1,background:TH.borderLight,margin:"14px 0 12px"}}/>
          {/* Mode toggle + Learn button */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{display:"flex",gap:4,flex:1}}>
              {["lite","fast","think"].map(m=><button key={m} onClick={()=>setMode(m)} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"7px 0",borderRadius:8,border:"1px solid "+(mode===m?mt.borderAccent:TH.borderLight),background:mode===m?mt.accentBg:"transparent",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",flex:1}}>
                <span style={{fontSize:11,fontWeight:700,color:mode===m?mt.accent:TH.textMuted}}>{m==="fast"?t.modeFast:m==="think"?t.modeThink:t.modeLite}</span>
                <span style={{fontSize:7.5,color:mode===m?mt.accentText:TH.textFaint,marginTop:1}}>{m==="fast"?t.modeFastDesc:m==="think"?t.modeThinkDesc:t.modeLiteDesc}</span>
              </button>)}
            </div>
            <button onClick={()=>go()} disabled={phase==="loading"||(!topic.trim()&&!fileContent)} style={{background:phase==="loading"?TH.bgAlt:"linear-gradient(135deg, "+mt.accentLight+", "+mt.accent+")",border:"none",borderRadius:10,padding:"14px 28px",color:phase==="loading"?TH.textMuted:"#fff",fontWeight:700,fontSize:13,cursor:phase==="loading"?"wait":"pointer",fontFamily:"inherit",opacity:(!topic.trim()&&!fileContent)?0.35:1,boxShadow:phase==="loading"?"none":"0 2px 12px "+mt.btnShadow,transition:"all 0.2s",letterSpacing:0.3}}>{phase==="loading"?t.generating:t.learn}</button>
          </div>
        </div>}
        {/* Non-idle: compact search bar */}
        {phase!=="idle"&&<div style={{display:"flex",alignItems:"center",background:TH.surface,borderRadius:10,border:"1px solid "+TH.border,padding:"2px 2px 2px 13px",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
          <span style={{fontSize:13,marginRight:7,opacity:0.35}}>{"\uD83D\uDD0D"}</span>
          <input type="text" className="mm-topic-input" placeholder={t.placeholder} value={topic} onChange={e=>{setTopic(e.target.value);setValidationError(false);}} onKeyDown={e=>e.key==="Enter"&&phase!=="loading"&&go()} style={{flex:1,background:"transparent",border:"none",outline:"none",color:TH.text,fontSize:13,fontFamily:"inherit",padding:"10px 0"}}/>
          <button onClick={()=>go()} disabled={phase==="loading"||(!topic.trim()&&!fileContent)} style={{background:phase==="loading"?TH.bgAlt:"linear-gradient(135deg, "+mt.accentLight+", "+mt.accent+")",border:"none",borderRadius:8,padding:"9px 18px",color:phase==="loading"?TH.textMuted:"#fff",fontWeight:700,fontSize:12,cursor:phase==="loading"?"wait":"pointer",fontFamily:"inherit",opacity:(!topic.trim()&&!fileContent)?0.35:1,boxShadow:phase==="loading"?"none":"0 2px 8px "+mt.btnShadow}}>{phase==="loading"?t.generating:t.learn}</button>
        </div>}
      </div>
      {/* ─── TOPIC CHIPS ─── */}
      {phase==="idle"&&!validationError&&<div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginTop:14,zIndex:1,position:"relative",maxWidth:540}}>{(mod==="general"?[...CHIPS.math[lang].slice(0,2),...CHIPS.stats[lang].slice(0,2),...CHIPS.econ[lang].slice(0,2),...CHIPS.finance[lang].slice(0,2)]:(CHIPS[mod]||CHIPS.math)[lang]).map(c=><button key={c} onClick={()=>{setTopic(c);setValidationError(false);}} style={{background:TH.surface,border:"1px solid "+TH.border,borderRadius:20,padding:"5px 12px",color:TH.textMuted,fontSize:10,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",boxShadow:TH.shadow}} onMouseOver={e=>{e.target.style.borderColor=mt.borderAccent;e.target.style.color=mt.accent;}} onMouseOut={e=>{e.target.style.borderColor=TH.border;e.target.style.color=TH.textMuted;}}>{c}</button>)}</div>}
    </div>

    {error&&<div style={{maxWidth:540,margin:"0 auto 8px",padding:"9px 14px",background:TH.redBg,border:"1px solid rgba(239,68,68,0.12)",borderRadius:7,color:TH.red,fontSize:11,textAlign:"center"}}>{error}</div>}

    {phase==="loading"&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"48px 20px 36px"}}>
      {/* Spinner — neutral until classifier resolves, then module-colored */}
      <div style={{position:"relative",width:50,height:50}}>
        <div style={{width:50,height:50,border:"2px solid "+TH.borderLight,borderTopColor:classifierReady?mt.accent:TH.textMuted,borderRadius:"50%",animation:"spin 1s linear infinite",transition:"border-top-color 0.4s ease"}}/>
        {classifierReady&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:18,animation:"fadeUp 0.3s ease"}}>{mc.icon}</div>}
      </div>
      {/* Thinking text — "Identifying topic" until ready, then normal thinking+dots */}
      <div style={{display:"flex",alignItems:"center",gap:2}}>
        {!classifierReady
          ?<span style={{color:TH.textMuted,fontSize:13,fontWeight:600,fontFamily:"'Bricolage Grotesque',sans-serif"}}>{lang==="es"?"Identificando tema":"Identifying topic"}<span style={{display:"inline-flex",gap:2,marginLeft:3}}>{[0,1,2].map(i=><span key={i} style={{width:4,height:4,borderRadius:"50%",background:TH.textMuted,animation:"thinkDot 1.4s ease-in-out infinite",animationDelay:i*0.2+"s"}}/>)}</span></span>
          :<><span style={{color:mt.accent,fontSize:13,fontWeight:600,fontFamily:"'Bricolage Grotesque',sans-serif"}}>{loadProg>=88?t.almostThere:t.thinking}</span>
          {loadProg<88&&<span style={{display:"inline-flex",gap:2,marginLeft:2}}>{[0,1,2].map(i=><span key={i} style={{width:4,height:4,borderRadius:"50%",background:mt.accent,animation:"thinkDot 1.4s ease-in-out infinite",animationDelay:i*0.2+"s"}}/>)}</span>}</>
        }
      </div>
      {/* Loading message — only show after classifier resolves */}
      {classifierReady&&<div style={{textAlign:"center",maxWidth:460,padding:"0 16px"}}>
        <p style={{color:TH.textSecondary,fontWeight:500,fontSize:12.5,lineHeight:1.65,fontStyle:loadingMsg.startsWith("\u201C")?"italic":"normal",animation:"fadeUp 0.5s ease",minHeight:52,marginBottom:8}} key={loadingMsg}>{loadingMsg}</p>
      </div>}
      <div style={{width:"100%",maxWidth:280,marginTop:6}}>
        <div style={{height:5,borderRadius:4,background:TH.borderLight,overflow:"hidden",position:"relative"}}>
          <div style={{height:"100%",borderRadius:4,background:"linear-gradient(90deg, "+(classifierReady?mt.accent:TH.textMuted)+", "+(classifierReady?mt.accentLight:TH.textSecondary)+", "+(classifierReady?mt.accent:TH.textMuted)+")",backgroundSize:"200% 100%",animation:"gradientShift 2s ease infinite",width:loadProg+"%",transition:"width 0.5s cubic-bezier(0.22,1,0.36,1)"}}/>
        </div>
        <p style={{color:TH.textFaint,fontSize:8,marginTop:6,textAlign:"center",letterSpacing:0.5}}>{Math.round(loadProg)}%</p>
      </div>
    </div>}

    {/* ═══════════ RESULTS ═══════════ */}
    {showResults&&<div ref={resultsRef} className="mm-results-padding" style={{maxWidth:820,margin:"0 auto",padding:"6px 28px 36px",animation:"fadeUp 0.3s ease"}}>

      {activeSection==="explain"&&<div style={{animation:"fadeUp 0.3s ease"}}>
        <h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:700,color:TH.text,marginBottom:3}}>{content.title}</h2>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          <span style={{display:"inline-block",background:mt.accentBg,borderRadius:4,padding:"2px 8px",fontSize:8,color:mt.accent,fontWeight:700,letterSpacing:1.5}}>{t.feynman}</span>
          {/* topicType badge — shows after AI detection, tappable to override */}
          <button onClick={()=>setTopicType(p=>p==="concept"?"problem":"concept")} style={{display:"inline-flex",alignItems:"center",gap:3,background:topicType==="problem"?"rgba(99,102,241,0.08)":TH.bgAlt,border:"1px solid "+(topicType==="problem"?"rgba(99,102,241,0.2)":TH.border),borderRadius:4,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
            <span style={{fontSize:9}}>{topicType==="problem"?"🔢":"📘"}</span>
            <span style={{fontSize:8,fontWeight:700,color:topicType==="problem"?TH.purple:TH.textMuted,letterSpacing:1}}>{topicType==="problem"?t.topicTypeProblemLabel:t.topicTypeConceptLabel}</span>
          </button>
          {interest&&<span style={{display:"inline-flex",alignItems:"center",gap:3,background:"rgba(99,102,241,0.07)",borderRadius:4,padding:"2px 8px",fontSize:8,color:TH.purple,fontWeight:700,letterSpacing:0.5}}>{"\uD83C\uDFAF"} {interest}</span>}
          <button onClick={handleAddToReview} disabled={cardStatus==="adding"||cardStatus==="added"||cardStatus==="exists"} style={{marginLeft:"auto",padding:"4px 12px",borderRadius:6,fontSize:10,fontWeight:700,cursor:(cardStatus==="adding"||cardStatus==="added"||cardStatus==="exists")?"default":"pointer",fontFamily:"inherit",border:"1px solid "+(cardStatus==="added"||cardStatus==="exists"?TH.green:mt.borderAccent),background:(cardStatus==="added"||cardStatus==="exists")?"rgba(34,197,94,0.08)":mt.accentBg,color:(cardStatus==="added"||cardStatus==="exists")?TH.green:mt.accent,transition:"all 0.2s",opacity:cardStatus==="adding"?0.6:1}}>
            {cardStatus==="adding"?"…":cardStatus==="added"?t.addedToReview:cardStatus==="exists"?t.alreadyInReview:t.addToReview}
          </button>
        </div>
        <RichExplanation blocks={content.explanationBlocks} mt={mt} lang={lang}/>
        {/* "I didn't understand" — one-shot simpler re-explanation */}
        {!simplifiedBlocks&&<div style={{display:"flex",justifyContent:"center",marginTop:18,marginBottom:4}}>
          <button onClick={simplify} disabled={simplifying} style={{background:"none",border:"1px dashed "+TH.border,borderRadius:9,padding:"9px 20px",color:TH.textMuted,fontSize:12,fontWeight:600,cursor:simplifying?"wait":"pointer",fontFamily:"inherit",transition:"all 0.2s",opacity:simplifying?0.6:1,...(simplifying?{}:{})}} onMouseEnter={e=>{if(!simplifying){e.target.style.borderColor=mt.accent;e.target.style.color=mt.accent;e.target.style.background=mt.accentBg;}}} onMouseLeave={e=>{e.target.style.borderColor=TH.border;e.target.style.color=TH.textMuted;e.target.style.background="none";}}>{simplifying?t.simplifying:t.didntUnderstand}</button>
        </div>}
        {simplifiedBlocks&&<div style={{marginTop:16,animation:"fadeUp 0.4s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:14}}>{"\uD83D\uDCA1"}</span><span style={{display:"inline-block",background:"rgba(34,197,94,0.08)",borderRadius:4,padding:"2px 8px",fontSize:8,color:TH.green,fontWeight:700,letterSpacing:1.5}}>{t.simplerExplain}</span></div>
          <RichExplanation blocks={simplifiedBlocks} mt={{...mt,accent:TH.green,accentLight:"#4ade80",accentBg:"rgba(34,197,94,0.06)",accentText:"#166534",borderAccent:"rgba(34,197,94,0.2)"}} lang={lang}/>
        </div>}
        <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:15,fontWeight:700,color:TH.textSecondary,marginTop:24,marginBottom:10}}>{t.keyConcepts}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(content.keyConcepts||[]).map((c,i)=><div key={i} style={{background:TH.surface,borderRadius:10,padding:16,border:"1px solid "+TH.border,borderLeft:"3px solid "+AC[i%AC.length],boxShadow:TH.cardShadow}}><h4 style={{color:TH.text,fontSize:13,fontWeight:700,marginBottom:4}}>{c.title}</h4><p style={{color:TH.textSecondary,fontSize:13,lineHeight:1.55}}><MathText>{c.description}</MathText></p>{c.formula&&<div style={{marginTop:8,fontFamily:"'JetBrains Mono',monospace",background:mt.accentBg,border:"1px solid "+mt.borderAccent,borderRadius:8,padding:"10px 14px",fontSize:14,color:mt.accent,overflow:"hidden",lineHeight:1.8,whiteSpace:"pre-wrap",wordBreak:"break-word"}}><MathText>{c.formula}</MathText></div>}</div>)}
        </div>
        {/* Real-World Applications */}
        {content.applications&&content.applications.length>0&&<>
          <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:15,fontWeight:700,color:TH.textSecondary,marginTop:24,marginBottom:10}}>{t.realWorld}</h3>
          <p style={{color:TH.textMuted,fontSize:10,marginBottom:10,marginTop:-6}}>{t.realWorldSub}</p>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {content.applications.map((app,i)=>{const appIcons=["\uD83C\uDFED","\uD83D\uDCBB","\uD83C\uDFE5","\uD83D\uDE80","\uD83C\uDFAE","\uD83C\uDF0D"];return <div key={i} style={{background:"linear-gradient(135deg, rgba(34,197,94,0.03), rgba(6,182,212,0.03))",borderRadius:11,padding:16,border:"1px solid rgba(34,197,94,0.12)",borderLeft:"4px solid "+[TH.green,TH.cyan,TH.purple][i%3],boxShadow:TH.cardShadow}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}><span style={{fontSize:16}}>{appIcons[i%appIcons.length]}</span><h4 style={{color:TH.text,fontSize:12,fontWeight:700}}>{app.title}</h4></div>
              <p style={{color:TH.textSecondary,fontSize:12,lineHeight:1.55,marginBottom:app.example?6:0}}><MathText>{app.description}</MathText></p>
              {app.example&&<div style={{background:"rgba(34,197,94,0.04)",borderRadius:7,padding:"8px 11px",border:"1px solid rgba(34,197,94,0.08)",marginTop:4}}><p style={{color:TH.green,fontSize:10,fontWeight:700,marginBottom:2}}>{"\u2192"} {lang==="es"?"Ejemplo":"Example"}</p><p style={{color:TH.textSecondary,fontSize:11,lineHeight:1.4}}><MathText>{app.example}</MathText></p></div>}
            </div>;})}
          </div>
        </>}
        <YouTubeRecs searches={content.youtubeSearches} t={t} lang={lang}/>
        {/* Related Topics — Go Deeper chips */}
        {content.relatedTopics&&content.relatedTopics.length>0&&<RelatedTopics topics={content.relatedTopics} t={t} mt={mt} onSelect={(label)=>{
          /* carry topicType forward — do not reset */
          setPhase("idle");setContent(null);setError(null);setSimplifiedBlocks(null);setSimplifying(false);setFeynmanDone(false);
          setQuizAnswers({});setQuizSubmitted(false);setExamAnswers({});setExamSubmitted(false);
          setChallengeAnswers({});setChallengeSubmitted(false);setActiveSection("explain");setMod("general");setCardStatus(null);
          window.scrollTo({top:0,behavior:"smooth"});
          /* small timeout so state flushes before go() reads activeTopic */
          setTimeout(()=>go(label),50);
        }}/>}
      </div>}
      {activeSection==="quiz"&&<div style={{animation:"fadeUp 0.3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:19,fontWeight:700,color:TH.text}}>{t.testYourself}</h2><p style={{color:TH.textMuted,fontSize:10,marginTop:1}}>{quizSubmitted?t.score+": "+quizScore+"/"+quizTotal:t.selectBest}</p></div>
          {quizSubmitted&&<span style={{fontSize:17,fontWeight:800,fontFamily:"'Bricolage Grotesque',sans-serif",color:quizScore===quizTotal?TH.green:mt.accent,background:quizScore===quizTotal?TH.greenBg:mt.accentBg,padding:"4px 12px",borderRadius:8}}>{Math.round((quizScore/Math.max(quizTotal,1))*100)}%</span>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {(content.quiz||[]).map((q,i)=>{
            if(q.type==="tf")return <TFCard key={i} q={q} index={i} selected={quizAnswers[i]} onSelect={v=>setQuizAnswers(p=>({...p,[i]:v}))} submitted={quizSubmitted} t={t}/>;
            return <QuizCard key={i} q={q} index={i} selected={quizAnswers[i]} onSelect={v=>setQuizAnswers(p=>({...p,[i]:v}))} submitted={quizSubmitted} t={t}/>;
          })}
        </div>
        <div style={{display:"flex",justifyContent:"center",marginTop:14}}>
          {!quizSubmitted?<button onClick={()=>setQuizSubmitted(true)} disabled={!quizAllAnswered} style={btnS(quizAllAnswered)}>{t.submit}</button>
          :<button onClick={()=>{setQuizAnswers({});setQuizSubmitted(false);}} style={retBtn}>{t.retry}</button>}
        </div>
        {quizSubmitted&&(mode==="fast"||mode==="think")&&!feynmanDone&&
          <FeynmanPrompt topic={topic||content?.title||""} keyConcepts={content?.keyConcepts} mt={mt} lang={lang} t={t} onDone={()=>setFeynmanDone(true)} session={session}/>}
        <YouTubeRecs searches={content.youtubeSearches} t={t} lang={lang}/>
      </div>}

      {/* EXAM + CHALLENGE */}
      {activeSection==="exam"&&<div style={{animation:"fadeUp 0.3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:19,fontWeight:700,color:TH.text}}>{t.examTitle} {"\uD83C\uDF93"}</h2><p style={{color:TH.textMuted,fontSize:10,marginTop:1}}>{examSubmitted?t.score+": "+examScore+"/"+examTotal:(mode==="think"?t.examSub:mode==="lite"?t.examSubLite:t.examSubFast)}</p></div>
          {examSubmitted&&<span style={{fontSize:17,fontWeight:800,fontFamily:"'Bricolage Grotesque',sans-serif",color:examScore>=examTotal*0.8?TH.green:examScore>=examTotal*0.5?mt.accent:TH.red,background:examScore>=examTotal*0.8?TH.greenBg:examScore>=examTotal*0.5?mt.accentBg:TH.redBg,padding:"4px 12px",borderRadius:8}}>{Math.round((examScore/Math.max(examTotal,1))*100)}%</span>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {(content.exam||[]).map((q,i)=><QuizCard key={i} q={q} index={i} selected={examAnswers[i]} onSelect={v=>setExamAnswers(p=>({...p,[i]:v}))} submitted={examSubmitted} t={t} prefix={t.exam+" "}/>)}
        </div>
        <div style={{display:"flex",justifyContent:"center",marginTop:14}}>
          {!examSubmitted?<button onClick={()=>setExamSubmitted(true)} disabled={Object.keys(examAnswers).length<examTotal} style={btnS(Object.keys(examAnswers).length>=examTotal)}>{t.submit}</button>
          :<button onClick={()=>{setExamAnswers({});setExamSubmitted(false);}} style={retBtn}>{t.retry}</button>}
        </div>
        {examSubmitted&&(mode==="fast"||mode==="think")&&!feynmanDone&&
          <FeynmanPrompt topic={topic||content?.title||""} keyConcepts={content?.keyConcepts} mt={mt} lang={lang} t={t} onDone={()=>setFeynmanDone(true)} session={session}/>}

        {/* CHALLENGE — Mixed MC + Solve & Reveal */}
        {mode==="think"&&content.examChallenge&&content.examChallenge.length>0&&<div style={{marginTop:32}}>
          <div style={{height:1,background:"linear-gradient(90deg, transparent, "+TH.border+", transparent)",marginBottom:16}}/>
          <div style={{background:"rgba(239,68,68,0.04)",borderRadius:12,padding:"12px 16px",border:"1px solid rgba(239,68,68,0.1)",marginBottom:12}}>
            <h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:700,color:TH.text}}>{t.examChallengeTitle}</h2>
            <p style={{color:TH.textMuted,fontSize:10,marginTop:2}}>{t.examChallengeSub}</p>
            {challengeSubmitted&&challengeMC.length>0&&<p style={{color:mt.accent,fontSize:11,fontWeight:700,marginTop:4}}>MC {t.score}: {challengeMCScore}/{challengeMC.length}</p>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {content.examChallenge.map((q,i)=>{
              if(q.type==="solve")return <SolveCard key={"s"+i} q={q} index={i} t={t}/>;
              return <QuizCard key={"c"+i} q={q} index={i} selected={challengeAnswers[i]} onSelect={v=>setChallengeAnswers(p=>({...p,[i]:v}))} submitted={challengeSubmitted} t={t} prefix={"\uD83D\uDD25 "}/>;
            })}
          </div>
          {challengeMC.length>0&&<div style={{display:"flex",justifyContent:"center",marginTop:14}}>
            {!challengeSubmitted?<button onClick={()=>setChallengeSubmitted(true)} disabled={Object.keys(challengeAnswers).length<challengeMC.length} style={{...(Object.keys(challengeAnswers).length>=challengeMC.length?{background:"linear-gradient(135deg, #ef4444, #dc2626)",color:"#fff",boxShadow:"0 2px 8px rgba(239,68,68,0.2)"}:{background:TH.bgAlt,color:TH.textFaint}),border:"none",borderRadius:7,padding:"9px 26px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{t.submit}</button>
            :<button onClick={()=>{setChallengeAnswers({});setChallengeSubmitted(false);}} style={retBtn}>{t.retry}</button>}
          </div>}
        </div>}
        <YouTubeRecs searches={content.youtubeSearches} t={t} lang={lang}/>
      </div>}

      {activeSection==="tips"&&<div style={{animation:"fadeUp 0.3s ease"}}>
        <h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:19,fontWeight:700,color:TH.text,marginBottom:3}}>{t.tips_title}</h2>
        <p style={{color:TH.textMuted,fontSize:10,marginBottom:12}}>{t.tips_sub}</p>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {(content.tips||[]).map((tip,i)=><div key={i} style={{background:TH.surface,borderRadius:10,padding:16,border:"1px solid "+TH.border,display:"flex",gap:11,alignItems:"flex-start",boxShadow:TH.cardShadow}}><div style={{width:28,height:28,borderRadius:8,flexShrink:0,background:AC[i%3]+"0d",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:AC[i%3],fontFamily:"'Bricolage Grotesque',sans-serif"}}>{i+1}</div><div><h4 style={{color:TH.text,fontSize:12,fontWeight:700,marginBottom:2}}>{tip.title}</h4><p style={{color:TH.textSecondary,fontSize:13,lineHeight:1.5}}><MathText>{tip.content}</MathText></p></div></div>)}
        </div>
        <YouTubeRecs searches={content.youtubeSearches} t={t} lang={lang}/>
      </div>}

      {activeSection==="deck"&&<InlineDeck content={content} t={t} lang={lang} mt={mt}/>}

      {/* learnAgain — gated behind Feynman for fast/think modes */}
      {(mode==="lite"||feynmanDone||(!quizSubmitted&&!examSubmitted))&&<div style={{display:"flex",justifyContent:"center",marginTop:36,marginBottom:8}}>
        <button onClick={reset} onMouseOver={e=>{e.currentTarget.style.transform="scale(1.04)";e.currentTarget.style.boxShadow="0 4px 24px "+mt.btnShadow;}} onMouseOut={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 2px 16px "+mt.btnShadow;}} style={{background:"linear-gradient(135deg, "+mt.accentLight+" 0%, "+mt.accent+" 100%)",border:"none",borderRadius:11,padding:"13px 30px",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Bricolage Grotesque',sans-serif",boxShadow:"0 2px 16px "+mt.btnShadow,transition:"all 0.25s ease"}}>{t.learnAgain}</button>
      </div>}
    </div>}
    <div style={{textAlign:"center",padding:"6px 20px 16px",color:TH.textFaint,fontSize:8}}>{t.footer}</div>
    </div>{/* end morph wrapper */}
  </div>;
}
