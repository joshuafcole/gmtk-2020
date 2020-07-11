import {Neuron} from "../neuron/neuron";

export interface EditorType {
  Normal?: {},
  Motor?: {},
  Logic?: {},
  Language?: {},
  Memory?: {}
}

let lib = {
  convert_to(neuron: Neuron, type: EditorType) {
    if(type.Normal) {
      neuron.Type.Normal = {};
    } else if(type.Motor) {
      neuron.Type.Motor = {};
    } else if(type.Logic) {
      neuron.Type.Logic = {} as any;
    } else if(type.Language) {
      neuron.Type.Language = {} as any;
    } else if(type.Memory) {
      neuron.Type.Memory = {} as any;
    } else {
      throw new Error(`@FIXME: Unknown conversion type ${type}`);
    }
    return neuron;
  },

  label(neuron: Neuron, content: string, p: number) {
    neuron.Label = {content, p, side: 1}
  },

  move_label(neuron: Neuron, p: number) {
    let s = neuron.Label!.side;
    neuron.Label!.side = s == 0 ? 1 : 0;
    neuron.Label!.p = p;
  },

  compute_p(neuron: Neuron, px: number, py: number) {
    let {x:ax, y:ay} = neuron.Nucleus;
    let {x:bx, y:by} = neuron.Terminal;

    let apx = px - ax;
    let apy = py - ay;
    let abx = bx - ax;
    let aby = by - ay;

    let mag_ab = Math.pow(by - ay, 2) + Math.pow(bx - ax, 2);
    let ab_ap_dot = abx * apx + aby * apy;
    let dist = ab_ap_dot / mag_ab;

    if(dist <= 0) return 0;
    if(dist >= 1) return 1;
    else return dist;
  }
};

export default lib;
