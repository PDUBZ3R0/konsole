

import { existsSync, mkdirSync, appendFileSync } from "node:fs"
import { join, resolve as locate } from "node:path"

let verbose = (function isverbose() {                        
    for (const argv of process.argv){ if (argv==="--verbose") return true; } return false;
})();

export function debuffer (logsdir, opts={ console:true, exceptions:true, rejections:true }) {

	let pathname = locate(logsdir);
	if (!existsSync(pathname)) mkdirSync(pathname, { recursive: true });

	function _lf(l="debug") { 
		const today = new Date();
		function zf(z) { const y=`${z}`;return y.length > 1 ? y : "0"+y; }
		return join(pathname, `${l}_${zf(today.getMonth()+1) + zf(today.getDate()) + today.getFullYear()}.log`);
	}

	function _lo(path, msg, logger) {
		for (let idx in msg) {
			if (typeof msg[idx] === "object") {
				if (msg[idx] instanceof Error) {
					if (verbose || logger === "trace") {
						msg[idx] = msg[idx].message + "\n" + msg[idx].stack;
					} else {
						msg[idx] = msg[idx].message
					}
				} else {
					msg[idx] = JSON.stringify(msg[idx], null, 2);
				}
			}
		}
		appendFileSync(path, `${msg.join(" ")}\n`, "utf-8");
	}

	const API = {
		logger(name){
			const _p = _lf(name);
			const levels = {
				info(...msg){
					_lo(_p, msg,"info");
				},
				debug(...msg){
					if (verbose) _lo(_p, msg);
				},
				trace(...e){
					_lo(_p, e, "trace");
				},
				error(...e){
					_lo(_p, e, "error");
				}
			}
			levels.log = levels.info;
			return levels;
		}
	}

	if (opts.console) {
		let output = console.log;

		if (console.$monkeypatched === true) {
			output = console.$internal;
		} else {
			output = console.$internal = console.log;
            console.$monkeypatched = true;
		}

		const intercepts = API.logger("console");

        function solecons(object,method,label){
            let syscall = console[method];
            console[method] = function monkeylogger (...args) {
                if (method === "trace") intercepts.trace("[TRACE]", ...args);
                else intercepts.log(`[${(label||method).toUpperCase()}]`, ...args);
            }
            return solecons;
        }

        solecons(console,"log","info")(console,"debug")(console,"info")(console,"warn")(console,"error")(console,"trace");
    	solecons(process.stdout,"write","stdout")(process.stderr,"write","stderr");
	}

	if (opts.exceptions || opts.rejections) {
		const errors = API.logger("fatal");

		if (opts.rejections) {
			process.on('unhandledRejection', (reason, p) => {
	            errors.log('Unhandled Rejection:');
	            errors.trace(reason);
	            errors.log("  \\\\---> at Promise:");
	            errors.trace(p);
	        });
	    }

	    if (opts.exceptions) {
        	process.on('uncaughtException', err => {
            	errors.log('Uncaught Exception');
            	errors.trace(err);
        	});
        }
	}
	
	return API
}
