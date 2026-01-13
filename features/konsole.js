
import { coloris } from "./coloris.js"
import { StopWatch } from  "./stopwatch.js"
import chalk from 'chalk'

let $internal = (function(){
    if (!(console.$monkeypatched === true)) {
        console.$internal = console.log;
        console.$monkeypatched = true;
    }
    return console.$internal;
})()

function colorFactory(color, bold) {
    if (color) {
        if (color.startsWith("#")) {
            return chalk.hex(color);
        } else  {
            let c = coloris[color];
            if (!c) c = chalk(color);
            if (c) {
                return c;
            } else {
                return function(t){ return t }
            }
        }
    } 
    return function(t){ return t }
}

let _r_once = false;
let _r_mod;

const ANSI = "\u001B[1F\u001B[G\u001B[2K";

function factory(prefix){
    
    function komponent(name, { color, brackets }) {
        brackets = brackets || "[]";
        let _m_n = name;
        let _m_c = colorFactory(color);
        let bracket_b = brackets.substr(Math.ceil(brackets.length / 2));
        let bracket_a = brackets.substr(0, Math.ceil(brackets.length / 2));

        return factory(`${prefix||""}${bracket_a}${_m_c(_m_n)}${bracket_b}`);
    }

    function raw(...args) {
        _r_once = false;
        _r_mod = prefix;
        $internal.apply(null, args);
    }

    function write(...args) {
        _r_once = false;
        _r_mod = prefix;
        $internal.apply(null, [prefix].concat(args));
    }

    function replace(...args) {
        if (_r_once && _r_mod === prefix) {
            $internal.apply(null, [ANSI + prefix].concat(args));
        } else {
            _r_once = true;
            _r_mod = prefix;
            $internal.apply(null, [prefix].concat(args));
        }
    }

    return {
        komponent, log: write, write, replace, raw
    }
}


export const komponent = factory().komponent;

