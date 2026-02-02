
import { coloris } from './coloris';

export class StopWatch {
    constructor() {
        this.start = new Date().getTime();
    }

    time() {
        const _n = new Date();
        return _n.getTime() - this.start;
    }

    display(runs) {
        const millis = this.time();
        const f = Math.floor;
        let seconds = f(millis/1000), minutes = f(seconds/60), hours = f(minutes/60), rate = 0;
        if (runs) rate = (runs/minutes).toFixed(2);

        seconds = (seconds - (minutes*60));
        minutes = (minutes - (hours*60)); 
        seconds = `${seconds<10?"0":""}${seconds}`
        minutes = `${minutes<10?"0":""}${minutes}`
        hours = `${hours<10?"0":""}${hours}`
        
        let out = {
            hours,
            minutes, 
            seconds,
            rate
        };
        return out;
    }

    customize({ hours='yellow', minutes='cyan', seconds='fuchsia', brackets='white', layout='[]' }){
        return function(){
            let timings = this.display();
            return `${coloris[brackets](layout.substr(0, layout.length/2))}${coloris[hours](timings.hours)}:${coloris[minutes](timings.minutes)}:${coloris[seconds](timings.seconds)}${coloris[brackets](layout.substr(0, layout.length/2))}
        }
    }
}

