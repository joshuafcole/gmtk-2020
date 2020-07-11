import {Ref, PluralRef} from "../std/types";
import std from "../std/std";
import {App} from "../../gmtk";

const PROPAGATION_THRESHOLD = 160;

export interface Neuron {
  Nucleus: {x: number, y: number},
  Axon: {},
  Terminal: {x: number, y: number},

  Pulse: PluralRef<Pulse>;
}

export interface Pulse {
  p: number;

  strength: number;
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

    path(neuron: Neuron) {
      let {Nucleus:{x:x1, y:y1}, Terminal:{x:x2, y:y2}} = neuron;
      let theta = lib.axon.angle(neuron);

      let dax = 5 * cos(theta + HALF_PI);
      let day = 5 * sin(theta + HALF_PI);
      let dbx = 5 * cos(theta - HALF_PI);
      let dby = 5 * sin(theta - HALF_PI);

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
    propagate(pulse: Pulse, neuron: Neuron&Ref, app: App) {
      let receivers:Pulse[] = [];
      app.Neuron.each((other) => {
        if(std.is(neuron, other)) return;
        let dx = other.Nucleus.x - neuron.Terminal.x;
        let dy = other.Nucleus.y - neuron.Terminal.y;
        let dist = Math.hypot(dy, dx);
        if(dist < PROPAGATION_THRESHOLD) {
          // Copy current pulse
          receivers.push(
            other.Pulse.add({strength: pulse.strength})
          );
        }
      });

      for(let receiver of receivers) {
        receiver.strength /= receivers.length;
      }
    }
  },
};

export default lib;
