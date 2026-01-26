## debuffer

debuffer is a set of logging and console enhancements, providing cool and useful  tools and effects for your console UI output and creating named loggers that output to different files, each with its own granular support for log levels from DEBUG to ERROR, similar to frameworks for other platforms like log4j.

### debuffer module
The debuffer module attaches to `console`
There are 3 different ways to setup the logging, with support for changing the runtime settings.
```javascript
import { debuffer, Levels } from 'debuffer' // #1 configure in code
debuffer({ logsdir: '/path/to/logs', levels: { $default: Levels.WARN, $console: "INFO", custom2: "DEBUG" })
```
	debuffer({ configfile: "/opt/mydemo.json5" }) // #2 import a named config file.
	
You can name a config file like the above example or drop a `debuffer.json5` (or `debuffer.json`) at the project root ( `import.meta.dirname`) for it to be picked up automatically (this is way #3).

#### debuffer .json5:
The config file need only specify where to log to ***`logsdir`*** and you can optionally adjust the levels of 2 special settings:

* **$default**: the level assigned to all named loggers except the ones that are listed  in levels.
* **$console**: the lowest level of messages sent to the console, particularly any messages logged by your dependencies. 

```json5
{ 
	logsdir: '/path/to/logs',
	levels: { 
		$default: 'WARN', 
		$console: "INFO", 
		custom1: "ERROR",
		custom2: "DEBUG"
	}
} 
```
***
### datadir module
Create a data directory on the system, selects different paths depending upon operating system.

```javascript
import datadir from 'debuffer/datadir'
// or //
import { default as datadir, local, share, home, cache, config } from 'debuffer/datadir'
```
All of the methods have the syntax: `function(name, ...subdirs)` if you pass in `("foo", "bar", "jar")`

On **Mac** all paths lead to `/Library/Preferences/foo/bar/jar`

#####datadir(): 
 **linux**: `/home/person/.local/share/foo/bar/jar/`<br/>
 **win** `C:/Users/person/AppData/Roaming/foo/bar/jar/`

#####datadir .local():
 **linux**: `/home/person/.local/share/foo/bar/jar/`<br/>
 **win** `C:/Users/person/AppData/Local/foo/bar/jar/`
 
 ###share
 **linux**: `/home/person/.local/share/foo/bar/jar/`<br/>
 **win** `C:/Users/person/AppData/Local/foo/bar/jar/`