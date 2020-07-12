import {Ref, PluralRef} from "../std/types";
import std from "../std/std";
import {App} from "../../gmtk";

const PROPAGATION_THRESHOLD = 160;

export interface Neuron {
  Nucleus: {x: number, y: number, Interaction: any}&Ref;
  Axon: {}&Ref;
  Terminal: {x: number, y: number, Interaction: any}&Ref;

  Pulse: PluralRef<Pulse>;
  Out?: {action: string, delay: number}&Ref;
  Label?: {content: string, p: number, side: number}&Ref;

  Type: {
    Normal?: {};
    Motor?: {};
    Logic?: {
      decay_rate: number;
      decay: number;
      excitement: number;
      theta: number;
      base_length: number;
    },
    Memory?: Memory;
    Language?: Language;
    Autonomic?: {}
  };

  Interaction: any;
}

export interface NeuronContainer {
  Neuron: PluralRef<Neuron>;
}

export interface Pulse {
  p: number;

  strength: number;

  Memory?: {
    Linked: Memory;
    Icon: {};
  },
  Language?: {
    Linked: Language;
  },
}

export interface Language {
  phoneme: string;
}

export interface Memory {
  icon: string;
  Thought: PluralRef<Thought>
}

export interface Thought {
  content: string;
  ix: number;
}

const {atan2, cos, sin, round, min, max, PI} = Math;
const HALF_PI = PI / 2;

let lib = {
  axon: {
    angle(neuron: Neuron) {
      let {Nucleus:{x:x1, y:y1}, Terminal:{x:x2, y:y2}} = neuron;
      let dy = y2 - y1;
      let dx = x2 - x1;
      let theta = atan2(dy, dx);
      return theta;
    },
    length(neuron: Neuron) {
      let {Nucleus:{x:x1, y:y1}, Terminal:{x:x2, y:y2}} = neuron;
      let dy = y2 - y1;
      let dx = x2 - x1;
      return Math.hypot(dy, dx);
    },
    position(p: number, neuron: Neuron) {
      let {Nucleus:{x:x1, y:y1}, Terminal:{x:x2, y:y2}} = neuron;

      let dx = x2 - x1;
      let dy = y2 - y1;
      return {x: x1 + dx * p, y: y1 + dy * p};
    },

    path(neuron: Neuron, thick = 5) {
      let {Nucleus:{x:x1, y:y1}, Terminal:{x:x2, y:y2}} = neuron;
      let theta = lib.axon.angle(neuron);

      let ht = thick / 2;
      let dax = ht * cos(theta + HALF_PI);
      let day = ht * sin(theta + HALF_PI);
      let dbx = ht * cos(theta - HALF_PI);
      let dby = ht * sin(theta - HALF_PI);

      return `
        M ${x1 + dax} ${y1 + day}
        L ${x2 + dax} ${y2 + day}
        L ${x2 + dbx} ${y2 + dby}
        L ${x1 + dbx} ${y1 + dby}
        Z
      `;
    }
  },

  pulse: {
    propagate(pulse: Pulse, neuron: Neuron&Ref, container: NeuronContainer) {
      let receivers:Pulse[] = [];
      container.Neuron.each((other) => {
        if(std.is(neuron, other)) return;
        let dx = other.Nucleus.x - neuron.Terminal.x;
        let dy = other.Nucleus.y - neuron.Terminal.y;
        let dist = Math.hypot(dy, dx);
        if(dist < PROPAGATION_THRESHOLD) {
          // Copy current pulse
          let cur = other.Pulse.add({strength: pulse.strength});
          receivers.push(cur);

          // @NOTE: Pulsed memories should retain the earliest memory found,
          //        NOT the latest. This is opposite of other types.
          let memory = pulse.Memory?.Linked || other.Type.Memory;
          if(memory) {
            cur.Memory = {} as any;
            cur.Memory!.Linked = memory;
          }

          let language = other.Type.Language || pulse.Language?.Linked;
          if(language) {
            cur.Language = {} as any;
            cur.Language!.Linked = language;
          }
        }
      });

      for(let receiver of receivers) {
        receiver.strength /= receivers.length;
      }
    }
  },
};

export default lib;
