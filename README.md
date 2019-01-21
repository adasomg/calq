# CalQ - convert between currencies with ease! Crypto, fiat, equities and more...

![](https://img.shields.io/npm/v/calq.svg)

CalQ is a simple CLI command for quikcly converting currencies.  
__As opposed to many others__, `calq`  __takes free-form text input__, think Google Search.

![calq-showcase](https://github.com/adasomg/calq/blob/master/showcase.gif)

All the converting is based on dollar values.  
For example: converting `ETH` to `RUB`, we'll first look up the dollar value for Ethereum and Rubles and use these to calculate.  

This means results __WILL deviate__ from real market condiitons.  
The upside is we __can easily perform many conversions__ without relying on too many APIs or introducing a lot of complexity.  

With enough demand, it may change.

# Installation
Get [NodeJS and npm from here](https://nodejs.org/en/download/current/) and:
```console
you@home:~$ npm install -g calq
```

Usage:
```console
you@home:~$ calq 4,700$ to ETH
4700 $ = 39.16997 ETH

you@home:~$ calq 39 ETH = 309294.93 RUB
39 ETH = 309294.93 RUB

you@home:~$ calq ETH/CNY
1 ETH = 810.61 CN¥

you@home:~$ calq -v ETH/CNY
Converting ETH (Ethereum) to CNY (Chinese Yuan)...

ETH is 119.921679087$
CNY is 0.1476$

1 ETH = 810.61 CN¥

your@home:~$ calq -P ETH/CNY
810.6074146612466124661246612466124661246612466124661246612466125

your@home:~$ calq -p 4 ETH/CNY
810.6074

you@home:~$ calq ETH
1 ETH = 119.75 $

you@home:~$ calq \$SNAP
1 SNAP = 5.74 $

you@home:~$ calq \$SNAP/EUR
1 SNAP = 5.04 €

you@home:~$ calq --help
NAME
       CalQ - convert between currencies, both fiat and crypto

IMPORTANT
       All conversions use USD prices for calculations.

SYNOPSIS
       calq [ OPTIONS ] QUANTITY-A QUANTITY-B

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

```
