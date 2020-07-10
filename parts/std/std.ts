import { Program } from "@joshuafcole/sc2";
import { Ref } from "./types";

let _program: Program;

let _tick: any = undefined;
let _elapsed = 0;

function tick(delta: number) {
  _elapsed += delta;
  get_program()!
    .queue("tick", { delta, elapsed: _elapsed })
    .send();
  _tick = requestAnimationFrame(tick);
}

export function get_program(): Program | undefined {
  if (_program) return _program;
  else throw new Error("Program not running.");
}

let lib = {
  set_program(program: any) {
    _program = program;
  },

  //----------------------------------------------------------------------------
  // Math
  //----------------------------------------------------------------------------

  PI() {
    return Math.PI;
  },

  mod(num: number, by: number) {
    return num % by;
  },

  is_number(x: any) {
    return x !== undefined && !isNaN(x as any) && !isNaN(parseFloat(x));
  },

  geom: {
    distance(x1: number, y1: number, x2: number, y2: number) {
      return Math.hypot(x2 - x1, y2 - y1);
    }
  },

  //----------------------------------------------------------------------------
  // Ticks / Time
  //----------------------------------------------------------------------------

  start_ticking() {
    _elapsed = 0;
    if (_tick === undefined) tick(0);
  },

  stop_ticking() {
    _elapsed = 0;
    if (_tick !== undefined) {
      cancelAnimationFrame(_tick);
      _tick = undefined;
    }
  },

  wait(time: number, event: string, target?: Ref) {
    return setTimeout(
      () =>
        target ?
        target.send(event) :
        get_program()?.queue(event).send(),
      time
    );
  },
  cancel_wait(timeout_id?: number) {
    return clearTimeout(timeout_id);
  },

  in(a?: Ref) {
    return a && a.__instance !== undefined;
  },
  is(a?: Ref, b?: Ref) {
    if(a === b) return true;
    if(!a || !b) return false;
    if(a.__state !== b.__state) return false;
    return a.__instance === b.__instance;
  },
  changed(...args: any[]) {
    return true;
  },
  ternary(cond: boolean, then: any, otherwise: any) {
    return cond ? then : otherwise;
  },
  get_bounds(node: HTMLElement) {
    return node.getBoundingClientRect();
  },

  exclusive: {
    get(parent: any, property: any) {
      if (!parent) return;
      for (let child_name in parent.__proto__) {
        let child = parent[child_name];
        if (child && child.__state) return child[property];
      }
    },
    dashed_name(parent: any) {
      if (!parent) return;
      for (let child_name in parent.__proto__) {
        let child = parent[child_name];
        if (child && child.__state) {
          return child_name
            .split(/(?=[A=Z])/)
            .map(s => s.toLowerCase())
            .join("-");
        }
      }
    }
  },
};

export default lib;
