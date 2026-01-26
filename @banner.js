
import { gradient } from './features/coloris.js'

// ASCII
// 
(`                                           
                          ▄▄  ▄▄           
    █▄       █▄          ██  ██            
    ██       ██         ▄██▄▄██▄      ▄    
 ▄████ ▄█▀█▄ ████▄ ██ ██ ██  ██ ▄█▀█▄ ████▄
 ██ ██ ██▄█▀ ██ ██ ██ ██ ██  ██ ██▄█▀ ██   
▄█▀███▄▀█▄▄▄▄████▀▄▀██▀█▄██ ▄██▄▀█▄▄▄▄█▀   
                         ██  ██            
                        ▀▀  ▀▀             `).split(/\n/).forEach(line=>{
	console.log(gradient.passion((line)));
});
