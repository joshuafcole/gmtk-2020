import {Ref, PluralRef} from "./parts/std/types";

import std from "./parts/std/std";
import neuron, {Neuron} from "./parts/neuron/neuron";
import editor from "./parts/editor/editor";
import dialog from "./parts/dialog/dialog";

export interface NeuralScreen {
  name: string;
  View: {
    Mini?: {};
    Focused?: {};
  };
  Neuron: PluralRef<Neuron>;
}

export interface App {
  active_scene: string;

  NeuralScreen: PluralRef<NeuralScreen>;
}

export let lib = {
  ...std,
  neuron,
  editor,
  dialog,

  color_to_matrix(color:string) {
    let [r, g, b, a] = [
      (parseInt(color.slice(0, 2), 16) / 255).toFixed(2),
      (parseInt(color.slice(2, 4), 16) / 255).toFixed(2),
      (parseInt(color.slice(4, 6), 16) / 255).toFixed(2),
      (parseInt(color.slice(6, 8) || "FF", 16) / 255).toFixed(2)
    ];

    return `
      ${r} 0    0    0    0
      0    ${g} 0    0    0
      0    0    ${b} 0    0
      0    0    0    ${a} 0
    `;
  },

  //----------------------------------------------------------------------------
  // UI
  //----------------------------------------------------------------------------

  window_size() {
    return {width: window.innerWidth, height: window.innerHeight};
  },

  resize_svg(node: SVGSVGElement, elem) {
    // let {width, height} = node.parentElement!.getBoundingClientRect();
    let {w:width, h:height} = elem;
    let cur = node.viewBox.baseVal;

    if(!cur) {
      node.setAttributeNS(null, "viewBox", `0 0 ${width} ${height}`);

    } else if (width !== cur.width || height !== cur.height) {
      cur.width = width;
      cur.height = height;
    }
  },
};
