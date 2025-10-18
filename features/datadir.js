
import { join } from 'node:path';
import { existsSync, mkdirSync} from "node:fs";

function _datadir_(name, opt, ...extra) {
	let dir;
	if (process.platform === 'linux') {
		if (!opt || ["share", "local"].includes(opt.toLowerCase())) {
			dir = join(process.env.HOME, "/.local/share/", name);
		} else if (opt && opt === "cache") {
			dir = join(process.env.HOME, "/.cache/", name);
		} else if (opt && opt === "config") {
			dir = join(process.env.HOME, "/.config/", name);
		} else if (opt && opt === "home") {
			dir = join(process.env.HOME, `.${name}`);
		}
	
	// Windows | local: "AppData\Local\<name>"
	} else if (["local", "cache"].includes(opt) && process.env.LOCALAPPDATA) {
		dir = join(process.env.LOCALAPPDATA, name); 
		if ("cache" === opt) dir = join(dir, opt);

	// Windows | share(default): "AppData\Roaming\<name>"
	} else if (process.env.APPDATA && (!opt || (opt === "config" || opt === "share"))) {
		dir = join(process.env.APPDATA, name);

	// Windows | home: "My Documents/<name>" 	
	} else if (opt === "home" && process.env.USERPROFILE) {
		dir = join(process.env.USERPROFILE, "My Documents", name);

	// Mac Path
	} else if (process.platform == 'darwin') {
		dir = join(process.env.HOME, '/Library/Preferences', name);

	// Catch All for Others
	} else {
		if (existsSync(join(process.env.HOME, "My Documents"))) {
			dir = join(process.env.HOME, "My Documents", `${name}`);
		} else if (existsSync(join(process.env.HOME, "Documents"))) {
			dir = join(process.env.HOME, "Documents", `${name}`);
		} else {
			dir = join(process.env.HOME, `.${name}`);
		}
	}

	// Apply extras
	if (extra) dir = join(dir, ...extra);

	if (!existsSync(dir)){
		mkdirSync(dir, { recursive: true });
	}

	return dir;
}


export const datadir = {
	datadir(name, ...subdirs) {
		return _datadir_(name, null, ...subdirs)
	},
	
	local(name, ...subdirs) {
		return _datadir_(name, "local", ...subdirs)
	},

	share(name, ...subdirs) {
		return _datadir_(name, "share", ...subdirs)
	},

	home(name, ...subdirs) {
		return _datadir_(name, "home", ...subdirs)
	},

	cache(name, ...subdirs) {
		return _datadir_(name, "cache", ...subdirs)
	},

	config(name, ...subdirs) {
		return _datadir_(name, "config", ...subdirs)
	}
}