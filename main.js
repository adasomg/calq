const fetch = require('node-fetch');
const math = require('mathjs');
const {plus,minus,compare,equal,log10,floor,round,ceil,bignumber,abs,multiply,divide,max} = math;
const _ = require('lodash');
const {cryptos,fiats} = require('./data.js');

function log(...args) {
  if(prefs.INFO) Reflect.apply(console.log,this,args);
}
function logd(...args) {
  if(prefs.DEBUG) Reflect.apply(console.log,this,args);
}
function logp(...args) {
  if(prefs.PARANOID) Reflect.apply(console.log,this,args);
}

function serialize(o) {
  let a ;
  switch(o.type) {
  case "crypto":
    a="crypto_"+o.ticker;
    break
  case "fiat":
    a="fiat_"+o.ticker;
    break
  case "equity":
    a="equity_"+o.ticker.slice(1);
    break
  default:
    a="?"+o.ticker;
  }
  return a+"_"+fullFormat(o.qty);
}

switch(30) {
case 30:
  "4444"
}

function readNum(str) {
  if(math.isNumeric(str)) {
    if(!math.type.isBigNumber(str))
      return bignumber(str);
    else
      return str; //already a number
  }
  else if(!_.isString(str)) 
    throw "non-string, non-numeric passed to readNum"
  else
    try {
      return bignumber(str)
    } catch(err) {
      logp("readNum encountered a problem, but it's okay",err);
      return false;
    }
}

async function fetchJson(url) {
  logp("Fetching",url,'...');
  let text = await (await fetch(url)).text();
  let res = JSON.parse(text);
  logp(res);
  return res;
}

async function getYahoo(url) {
  let res = await fetchJson(url);
  let {meta} = res.chart.result[0];
  logp(meta);
  meta.price_usd = readNum(meta.previousClose);
  return meta;
}

async function getPrice({full,type}) {
  if (type=="crypto") {
    let j = await fetchJson(`https://api.coinmarketcap.com/v1/ticker/${full}/`);
    j = _.isArray(j) ? j[0] : j;
    return _.update(j,"price_usd",readNum);
  }
  // equities (and the likes) are prefixed with $
  else if (type=="equity") {
    return {...{ticker:full},...await getYahoo(`https://query1.finance.yahoo.com/v8/finance/chart/${full.slice(1)}`)}; 
  }
  else {
    if(full=="USD") 
      return {price_usd:1};
    else {
      return await getYahoo(`https://query1.finance.yahoo.com/v8/finance/chart/${full}USD=X`);
    }
  }
}

function readQuantity() {
  logp("Reading", args[0]);
  (args[0]).match(/from|to|\//i) && args.shift();
  maybeHelp();
  let deletions=""; 
  let o = {};
  let ticker;
  let x = args[0].split(/(?<=[\.0-9])(?=[a-zA-Z_]{3,})/);
  if (x.length == 1) {
    let maybenum  = readNum(args[0]);
    o.qty = maybenum
    if(maybenum) (deletions+=args.shift());
    maybeHelp();
    let maybeTicker = args[0].toUpperCase();
    let isTickerANumber = Number(maybeTicker);
    ticker = isTickerANumber ? "USD" : maybeTicker;
    if(!isTickerANumber)
      deletions+=" "+args.shift();
  } else {
    o.qty = readNum(x[0]);
    ticker = x[1].toUpperCase();
    deletions+=args.shift();
  }

  o = {...o,...cryptos[ticker] || {...fiats[ticker], ...(ticker.length == 3 ? {full: ticker, type: "fiat", ticker} : {full: ticker,type: "crypto"})}};

  if(ticker.startsWith('$'))
    o.type = "equity"

  logp(`Interpreted ${deletions} as:\n`,o,"\n");
  return o;
}

var options = {};
function addOption(trigger,fn) {
  options[trigger]=fn;  
}



// credit https://stackoverflow.com/a/51099524
// somewhat
function countDigits (n) { 
  n = abs(n);
  if (n < 0.0000000001) return -10;
  if (n < 0.000000001) return -9;
  if (n < 0.00000001) return -8;
  if (n < 0.0000001) return -7;
  if (n < 0.000001) return -6;
  if (n < 0.00001) return -5;
  if (n < 0.0001) return -4;
  if (n < 0.001) return -3;
  if (n < 0.01) return -2;
  if (n < 0.1) return -1;
  if (n < 2) return 0;
  if (n < 10) return 1;
  if (n < 100) return 2;
  if (n < 1000) return 3;
  if (n < 10000) return 4;
  if (n < 100000) return 5;
  if (n < 1000000) return 6;
  if (n < 10000000) return 7;
  if (n < 100000000) return 8;
  if (n < 1000000000) return 9;
  if (n < 10000000000) return 10;
  else return floor(log10(n));
}
function fullFormat(n) {
  return math.format(n,{upperExp:100,lowerExp:-100})
}

function countDecimals(n) {
  let str = fullFormat(n,{upperExp:100,lowerExp:-100});
  let d = str.split(/\./)[1]
  //logp(str,'\n',d);
  return d ? d.length : 0;
}

function autoFormat(A,B,n) {
  let dec = countDecimals(n); // How many can we possibly have?
  if(dec<=2) // if it's just 2 or less we're done
    return fullFormat(n);

  let userDecimals = countDecimals(A.qty); // user's own input shall define the minimum # of places
  let $ratio = divide(B.price_usd,A.price_usd); 
  let extraPlaces = countDigits($ratio) // every successive base10 warrants an additional decimal place

  let proposedLength = (userDecimals > 2 ? userDecimals : 2) + extraPlaces;
  let diff = dec - proposedLength;
  logp("Proposing decimal length:", proposedLength, "Difference from the full form:", diff);
  if (diff <= 2) // if it's very close, let's just show the whole thing
    return fullFormat(n);
  else {
    let precision = proposedLength > 2 ? proposedLength : 2;
    return math.format(n,{notation:"fixed",precision});  
  }
  
}

function readOptions() {
  maybeHelp();
  let opt = Object.keys(options).find(trigger=>args[0].startsWith(trigger));
  if(opt) {
    options[opt](args.shift());    
    return true;
  } else if (args[0]=="-") {
    return args.shift();    
  } else
    return false;
}

function maybeHelp() {
  if(args.length==0) help();
}

function help() {
  console.log(`
NAME
       CalQ - convert between currencies, both fiat and crypto

IMPORTANT
       All conversions use USD prices for calculations.

SYNOPSIS
       ccalc [ OPTIONS ] QUANTITY-A QUANTITY-B

       QUANTITY := [ <number> ] CURRENCY

       CURRENCY := { USD | BTC | $ | ETH | ... }

       OPTIONS := { --help | -v[v+] | -p <num> | -P }

OPTIONS

       --help     what you're seeing right now
       -v[v+]     verbosity levels, makes a difference up to 4
       -p <num>   precission, defines fixed number decimal places (defaults to 'auto')
       -P         maxes out the precision
       -b         rest all settings to the most minimal, useful for scripting

EXAMPLES

       calq 4,700$ to RUB

       calq 1.34 ETH to BTC

       calq from 10BTC to  CNY           
       
`);
  process.exit(1);
}

var prefs = {
  INFO: false,
  DEBUG: false,
  PARANOID: false,
  test_interpretation: false,
  verbosity: 1,
  precision: "auto",
}

var args; // we're gonna mutate it A LOT

async function main (argv) {
  args = argv;
  args.shift();args.shift();

  if(args.length==0) help();
  addOption("--help",help);

  addOption("-v",opt=>{
    prefs.verbosity = opt.length-1;
    prefs.INFO = prefs.verbosity > 0;
    prefs.DEBUG = prefs.verbosity > 1;
    prefs.PARANOID = prefs.verbosity > 2;
  });

  
  let f = () => {prefs.verbosity=0;prefs.precision='full'};
  ["-b","--bare"].forEach(x=>addOption(x,f));
  
  addOption("--test-interpretation",opt => {prefs.verbosity=0;prefs.test_interpretation = true;});
  addOption("-P",opt => prefs.precision = "full");
  addOption("-p",opt => prefs.precision = Number(args.shift()) || help() );

  while (readOptions())
    readOptions()
  
  logd("Prefs are:",prefs);
  
  args = args
    .map(x=>x.replace(/,/,"")) // ignore commas
    .map(x=>x.replace(/([0-9])\$/,"\$1USD")) // enable 10$
    .map(x=>x.split(/(?<=[a-zA-Z]{3})\/(?=[a-zA-Z\$]{3})/)); // enable ETH/USD...

  args = [].concat.apply([],args); //flatten
  
  logd("Cleaned up args as such:", args,"...\n");

  let A = readQuantity();

  if(args.length==0) args.push("USD"); // default to USD if the second quantity isn't provided
  let B = readQuantity();
  
  let [a,b] = await Promise.all([A,B].map(getPrice));
  A={...a,...A};  B={...b,...B};

  log(`Converting ${A.ticker} (${A.name}) to ${B.ticker} (${B.name})...\n`);
  log(`${A.ticker} is ${A.price_usd}$`);
  log(`${B.ticker} is ${B.price_usd}$\n`);

  if(!A.qty) A.qty = bignumber(1); //default qty to 1 if user hasn't specified

  //FOR TESTING
  if(prefs.test_interpretation) {console.log(serialize(A),serialize(B));process.exit(0)}

  let N = multiply(A.qty,
		   divide(a.price_usd, b.price_usd));
  let Nstr;

  if (prefs.precision=="full") Nstr = fullFormat(N)
  else if (prefs.precision=="auto") Nstr = autoFormat(A,B,N);
  else if(prefs.precision) Nstr = math.format(N,{notation: 'fixed',
						 precision: prefs.precision});
  
  switch(prefs.verbosity) {
  case 0:
    console.log(Nstr);
    break;
  case 1:
    console.log(`${A.qty} ${A.symbol||A.ticker||A.full} = ${Nstr} ${B.symbol||B.ticker||B.full}`);
    break;
  default:
    console.log(`${A.qty} ${A.name_plural||A.name||A.full} = ${Nstr} ${B.name_plural||B.name||B.full}`);
    break;
  }
  
  process.exit(0);
};

process.on('unhandledRejection', error => {
  logd('main.js unhandledRejection\n',error);
});


module.exports = main;
