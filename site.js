/* aibudgettool.com — shared helpers v2 */
(function(){
  'use strict';
  var A = window.ABT = {};

  /* nav */
  document.addEventListener('click', function(e){
    var l = e.target.closest('#site-nav a');
    if(l){ var nn=document.getElementById('site-nav'); nn.classList.remove('open'); var nb=document.querySelector('.nav-btn'); if(nb) nb.setAttribute('aria-expanded','false'); }
    var b = e.target.closest('.nav-btn');
    if(!b) return;
    var n = document.getElementById('site-nav');
    var open = n.classList.toggle('open');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* toast */
  var tt;
  A.toast = function(msg){
    var t = document.getElementById('toast');
    if(!t){ t = document.createElement('div'); t.id='toast'; t.className='toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(tt); tt = setTimeout(function(){ t.classList.remove('show'); }, 2400);
  };

  /* numbers */
  A.CURRENCIES = [
    ['USD','$','en-US'],['CAD','C$','en-CA'],['GBP','£','en-GB'],['EUR','€','de-DE'],['AUD','A$','en-AU'],
    ['INR','₹','en-IN'],['AED','AED ','en-AE'],
    ['SAR','SAR ','en-SA'],['SGD','S$','en-SG'],['JPY','¥','ja-JP'],
    ['CNY','¥','zh-CN'],['CHF','CHF ','de-CH'],['NZD','NZ$','en-NZ'],['ZAR','R','en-ZA'],['BRL','R$','pt-BR'],
    ['MXN','MX$','es-MX'],['KRW','₩','ko-KR'],['PKR','Rs ','en-PK'],['BDT','৳','en-BD'],['LKR','Rs ','en-LK'],
    ['NPR','Rs ','en-NP'],['MYR','RM ','en-MY']
  ];
  A.cur = function(code){ for(var i=0;i<A.CURRENCIES.length;i++){ if(A.CURRENCIES[i][0]===code) return A.CURRENCIES[i]; } return A.CURRENCIES[0]; };
  /* default is US dollars; a currency the visitor picks is remembered on this device */
  A.prefCur = function(){ var v=null; try{ v=localStorage.getItem('abt-cur'); }catch(e){} return (v && A.cur(v)[0]===v) ? v : 'USD'; };
  A.fillCurrencySelect = function(sel, def){
    def = def || A.prefCur();
    A.CURRENCIES.forEach(function(c){ var o=document.createElement('option'); o.value=c[0]; o.textContent=c[0]+' ('+c[1].trim()+')'; if(c[0]===def) o.selected=true; sel.appendChild(o); });
    sel.addEventListener('change', function(){ try{ localStorage.setItem('abt-cur', sel.value); }catch(e){} });
  };
  /* group digits: Indian style for INR, international otherwise */
  A.fmt = function(n, digits, code){
    if(!isFinite(n)) return '–';
    var loc = code==='INR' ? 'en-IN' : 'en-US';
    return Number(n).toLocaleString(loc, {minimumFractionDigits:digits||0, maximumFractionDigits:digits||0});
  };
  A.money = function(n, code, digits){ var c=A.cur(code); return c[1] + A.fmt(n, digits==null?0:digits, code); };
  /* "₹25 lakh", "$1.2 million" */
  A.words = function(n, code){
    if(!isFinite(n) || n<=0) return '';
    var c = A.cur(code)[1].trim(), v;
    function t(x){ return (Math.round(x*100)/100).toString(); }
    if(code==='INR'){
      if(n>=1e7) v=t(n/1e7)+' crore'; else if(n>=1e5) v=t(n/1e5)+' lakh'; else if(n>=1e3) v=t(n/1e3)+' thousand'; else return '';
    } else {
      if(n>=1e9) v=t(n/1e9)+' billion'; else if(n>=1e6) v=t(n/1e6)+' million'; else if(n>=1e3) v=t(n/1e3)+' thousand'; else return '';
    }
    return A.cur(code)[1]+v;
  };
  A.num = function(el){ var v=parseFloat(String(el.value).replace(/,/g,'')); return isFinite(v)?v:0; };
  A.clamp = function(v,a,b){ return Math.min(b,Math.max(a,v)); };

  /* range track fill */
  A.paintRange = function(r){ var min=+r.min||0, max=+r.max||100, v=+r.value; r.style.setProperty('--p', ((v-min)/(max-min)*100)+'%'); };
  document.addEventListener('input', function(e){ if(e.target.type==='range') A.paintRange(e.target); });
  document.addEventListener('DOMContentLoaded', function(){ document.querySelectorAll('input[type=range]').forEach(A.paintRange); });

  /* URL state: shareable results */
  A.params = function(){ var o={}; new URLSearchParams(location.search).forEach(function(v,k){o[k]=v;}); return o; };
  A.setParams = function(obj){
    var q = new URLSearchParams(); Object.keys(obj).forEach(function(k){ if(obj[k]!==''&&obj[k]!=null) q.set(k,obj[k]); });
    var url = location.pathname + '?' + q.toString();
    try{ history.replaceState(null,'',url); }catch(e){}
    return location.origin + url;
  };

  /* sharing */
  A.copy = function(text){
    if(navigator.clipboard && window.isSecureContext){ return navigator.clipboard.writeText(text).then(function(){A.toast('Link copied');}, function(){fallback();}); }
    fallback();
    function fallback(){ var a=document.createElement('textarea'); a.value=text; a.style.position='fixed'; a.style.opacity='0'; document.body.appendChild(a); a.select(); try{document.execCommand('copy'); A.toast('Link copied');}catch(e){A.toast('Copy failed. Select the address bar and copy it.');} document.body.removeChild(a); }
  };
  A.share = function(text){
    var url = location.href;
    if(navigator.share){ navigator.share({title:document.title, text:text, url:url}).catch(function(){}); }
    else A.copy(url);
  };
  A.whatsapp = function(text){ window.open('https://wa.me/?text='+encodeURIComponent(text+'\n'+location.href),'_blank','noopener'); };

  /* debounce */
  A.debounce = function(fn, ms){ var t; return function(){ var a=arguments,s=this; clearTimeout(t); t=setTimeout(function(){fn.apply(s,a);}, ms||200); }; };

  /* faster page changes: fetch a page when the pointer rests on its link (browsers without speculation rules) */
  var pre={};
  function prefetch(e){
    if(HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) return;
    var a=e.target.closest && e.target.closest('a[href]'); if(!a) return;
    var u; try{ u=new URL(a.href); }catch(x){ return; }
    if(u.origin!==location.origin || u.pathname===location.pathname || pre[u.pathname]) return;
    pre[u.pathname]=1; var l=document.createElement('link'); l.rel='prefetch'; l.href=u.pathname; document.head.appendChild(l);
  }
  document.addEventListener('pointerover', prefetch, {passive:true});
  document.addEventListener('touchstart', prefetch, {passive:true});

  document.addEventListener('DOMContentLoaded', function(){
    var y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  });
})();
