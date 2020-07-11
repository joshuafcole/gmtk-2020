import {Ref, PluralRef} from "./parts/std/types";

import std from "./parts/std/std";
import neuron, {Neuron} from "./parts/neuron/neuron";

export interface App {
  Neuron: PluralRef<Neuron>;
}

export let lib = {
  ...std,
  neuron,

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
