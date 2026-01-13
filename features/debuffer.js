

import { existsSync, mkdirSync, appendFileSync } from "node:fs"
import { join, resolve as locator } from "node:path"
import { coloris } from './coloris.js'
import { komponent } from './konsole.js'

export const Levels = {
	TRACE: 4,
	DEBUG: 4,
	INFO: 3,
	WARN: 2,
	ERROR: 1,
	OFF: 0
}

const deflevels = { 
	$default: Levels.INFO, 
	$intercepts: Levels.INFO,
	$console: Levels.INFO, 
	console: Levels.DEBUG 
}

export function debuffer ({ logsdir, logtoconsole=true, onerror, onreject, levels=deflevels}) {

	let pathname = (()=>{
		if (logsdir) {
			let pn = locator(logsdir);
			if (!existsSync(pn)) mkdirSync(pn, { recursive: true });
			return pn;
		}
	})();

    const formatter = {
    	date: new Intl.DateTimeFormat("en-US", { year: 'numeric', month: '2-digit', day: "2-digit" }),
    	time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    	format(date) {
    		return this.date.format(date).replace(/(\d+)\/(\d+)\/(\d+)/, "$3.$1.$2") + ":" + this.time.format(date);
    	}
    }

	function loggerfilename(l="debug") { 
		const today = new Date();
		function zf(z) { const y=`${z}`;return y.length > 1 ? y : "0"+y; }
		return join(pathname, `${l}_${zf(today.getMonth()+1) + zf(today.getDate()) + today.getFullYear()}.log`);
	}

	function log2all(msg, info) {
		let lvl = { 
			message: Levels[info.level.toUpperCase()],
			setting: (typeof logsdir !== 'undefined') ? (levels[info.logger] || levels.$default) : Levels.OFF,
			console: (logtoconsole) ? (info.logger === "console" ? levels.$intercepts : levels.$console) : Levels.OFF,
			file() {
				return this.setting >= this.message
			},
			stdout() {
				return this.console >= this.message
			}
		};

		let debugmode = [], infomode = []; 
		for (let idx in msg) {
			if (typeof msg[idx] === "object") {
				if (msg[idx] instanceof Error) {
					
					debugmode.push(msg[idx].message + "\n")
					debugmode.push(msg[idx].stack)
				
					let output = "";
					if (typeof msg[idx].fileName !== 'undefined'){
						output += "<" + msg[idx].fileName;
						if (msg[idx].lineNumber !== 'undefined'){
							output += "[line:" + msg[idx].fileName + "]"
						} 
						output += ">";
					}

					infomode.push (output)
					infomode.push (msg[idx].message)
					
				} else {
					let strimpl = (()=>{
						if (msg[idx].hasOwnProperty("toString")) {
							return msg[idx].toString();
						} else if (msg[idx].hasOwnProperty("valueOf")) {
							return msg[idx].valueOf();
						} else {
							return msg[idx];
						}
					})()
					
					if (strimpl) {
						debugmode.push(strimpl);
						infomode.push(strimpl);
					}

					debugmode.push("\n" + JSON.stringify(msg[idx], null, 2));
				}
			} else {
				debugmode.push(msg[idx]);
				infomode.push(msg[idx]);
			}
		}
		if (lvl.file()) {
			appendFileSync(loggerfilename(info.logger), `${formatme(info, false, (lvl.message === Levels.DEBUG ? debugmode : infomode)).join(" ")}\n`, "utf-8");
		}
		if (lvl.stdout()) {
			$internal.apply(console, formatme(info, true, lvl.message === Levels.DEBUG ? debugmode : infomode))
		}
	}

	const colors = {
		trace: "lavender",
		debug: "honeydew",
		info: "powderblue",
		warn: "lemonchiffon",
		error: "peachpuff",
	}

	function formatme(info, color, args) {
		let l, f, n = "", c = (l = (f = m => m));
		if (color) {
			c = coloris[colors[info.level]];
			n = (info.logger === "fatal" ? coloris.red : coloris.slategrey)(info.logger) + "/";
			l = coloris.powderblue
			f = coloris.skyblue
		}
        const prefix = `${formatter.format(new Date())} [${c(info.level.toUpperCase())}] (${n}${f(info.file)}${info.ext}@${l(info.line)})`
        return [ prefix, ...args ]
	}

	const API = {
		logger(name, defaultLevel){
			const _levels = {};
				
			(function levelFactory(level){
				const fff = function(...msg){
					let stacker = new Error().stack.split(/\n/);
					stacker.pop();
					const {file,line, ext} = (()=>{
						let caller, quit = false;
						while (!quit && (caller = stacker.pop())) {
							let starts = caller.substr(caller.lastIndexOf("/")+1).match(/([^:]+):(\d+):\d+/);
							if (starts) {
								let file = starts[1];
								if (file !== "debuffer.js" || stacker.length === 0) {
									quit = true;
									let line = starts[2];
									let ext = "", didx = file.lastIndexOf(".");
									if (didx > -1) {
										ext = file.substr(didx);
										file = file.substr(0, didx);
									}
									return { file, line, ext }
								}
							}
						}
					})()

					let info = { 
						logger: name,
						level, 
						file,
						line,
						ext
					}
					
					log2all(msg, info);
				}
				_levels[level] = fff;
				return levelFactory;
			})("debug")("info")("warn")("error")("trace");

			_levels.log = _levels.info;

			if (defaultLevel) _levels[name] = defaultLevel;
			return _levels;
		},

		konsole({ name, color, brackets, defaultLevel }) {
			const konsole = komponent(name, { color, brackets });
			return { 
				konsole: {
					write(...msg) {
						_levels.log.apply(_levels, msg);
						konsole.log.apply(konsole, msg);
					},
					replace(...msg) {
						_levels.log.apply(_levels, msg);
						konsole.replace.apply(konsole, msg);
					},
					raw(...msg) {
						_levels.log.apply(_levels, msg);
						konsole.raw.apply(konsole, msg);
					}
				}, 
				logger: API.logger(name, defaultLevel)
			}
		}
	};

	(function unhandles(){
		const errors = API.logger("fatal");

		process.on('unhandledRejection', (reason, promise) => {
			if (typeof onreject === 'function') onreject({ reason, promise });
	        errors.error('Unhandled Rejection:', reason, "at:", promise);
	    });
	    
		process.on('uncaughtException', err => {
			if (typeof onerror === 'function') onerror(err);
	    	errors.error('Uncaught Exception', err);
		});
	})();

	const $internal = (function takeover(){
		let output = (()=>{
			if (typeof console.$monkeypatched === 'undefined') {
				console.$internal = console.log;
	            console.$monkeypatched = true;
	        }
	        return console.$internal;
		})()

		const intercepts = API.logger("console");

        function solecons(object,method,label,level){
            let syscall = object[method];
            object[method] = function monkeylogger (...args) {
            	if (typeof level === 'undefined') {
		            let lvlstr = label || method;
		            intercepts[lvlstr]( ...args);
		        } else {
		        	log2all("console", args, level, label);
		        }
	        };
            return solecons;
        }

        solecons(console,"log","info")(console,"debug")(console,"info")(console,"warn")(console,"error")(console,"trace");

    	return output;
	})();

	return API
}
