
import { existsSync, mkdirSync, appendFileSync } from "node:fs"
import { join, resolve as locator } from "node:path"
import { default as JSON5 } from 'json5'
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

const START_LEVELS = { 
	$default: Levels.INFO,
	$console: Levels.INFO 
};

export function debuffer (opts={ configfile, logsdir, onerror, onreject, levels=START_LEVELS }) {

	function loadfile(conf){
		if (!conf) {
			let dirname = path.join(import.meta.dirname, "debuffer.json");
			if (fs.existsSync(dirname)) enturn({ configfile: dirname })
			dirname += "5";
			if (fs.existsSync(dirname)) enturn({ configfile: dirname })
		} else {
			enturn({ configfile: dirname, logsdir, onerror, onreject, levels=START_LEVELS })
		}
	}
}

export function enturn ({ configfile, logsdir, onerror, onreject, levels=START_LEVELS }) {
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
			setting: (typeof logsdir !== 'undefined') ? (info.logger === "console" ? levels.$console) : levels[info.logger] || levels.$default) : Levels.OFF,
			file() {
				return this.setting >= this.message
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
	}


	function formatme(info, color, args) {
        const prefix = `${formatter.format(new Date())} [${info.level.toUpperCase()}] (${info.logger}/${info.file}${info.ext}@${info.line})`
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
			const logger = API.logger(name, defaultLevel)

			return { 
				konsole: {
					write(...msg) {
						logger.info.apply(_levels, msg);
						konsole.log.apply(konsole, msg);
					},
					replace(...msg) {
						logger.debug.apply(_levels, msg);
						konsole.replace.apply(konsole, msg);
					},
					raw(...msg) {
						logger.info.apply(_levels, msg);
						konsole.raw.apply(konsole, msg);
					}
				},
				logger
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

        function solecons(object,method,label){
            let syscall = object[method];
            object[method] = function monkeylogger (...args) {
            	if (typeof level === 'undefined') {
		            let lvlstr = label || method;
		            intercepts[lvlstr]( ...args);
		        } else {
		        	log2all("console", args, label);
		        }
	        };
            return solecons;
        }

        solecons(console,"log","info")(console,"debug")(console,"info")(console,"warn")(console,"error")(console,"trace");

    	return output;
	})();

	return API
}
