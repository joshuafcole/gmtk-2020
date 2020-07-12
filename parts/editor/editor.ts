import {NeuralScreen, App} from "../../gmtk";
import {Neuron, Thought} from "../neuron/neuron";

export interface EditorType {
  Normal?: {},
  Motor?: {},
  Logic?: {},
  Language?: {},
  Memory?: {}
}

let lib = {
  save_focused(app: App, prevent?:() => void) {
    app.NeuralScreen.each((screen) => {
      if(!screen.View.Focused) return;
      lib.save(screen);
    });
    if(prevent) prevent();
  },
  save(screen: NeuralScreen, prevent?: () => void) {
    let raw = screen.Neuron.to_json() as Partial<Neuron>[];
    for(let neuron of raw) {
      delete neuron.Interaction;
      delete neuron.Pulse;
      delete neuron.Nucleus!.Interaction;
      delete neuron.Terminal!.Interaction;
      delete neuron.Axon;
    }
    console.log(raw);
    fetch(`/ugc/screens/${screen.name}.json`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(raw)
    });
    if(prevent) prevent();
  },
  load_all(app: App) {
    app.NeuralScreen.each((screen) => {
      console.log("EY GURL", screen.name);
      lib.load(screen);
    });
  },
  async load(screen: NeuralScreen) {
    console.log("GOT", screen.name);
    try {
      let res = await fetch(`/ugc/screens/${screen.name}.json`);
      let raw:Neuron[] = await res.json();

      screen.Neuron.each((neuron) => neuron.remove());

      console.log("LOADING", screen.name);
      for(let raw_neuron of raw) {
        let neuron = screen.Neuron.add({});
        neuron.Nucleus.x = raw_neuron.Nucleus.x;
        neuron.Nucleus.y = raw_neuron.Nucleus.y;
        neuron.Terminal.x = raw_neuron.Terminal.x;
        neuron.Terminal.y = raw_neuron.Terminal.y;
        neuron.Axon.send("redraw");

        if(raw_neuron.Label) {
          let {p, content, side} = raw_neuron.Label;
          neuron.Label = {p, content, side} as any;
        }

        if(raw_neuron.Out) {
          let {action, delay} = raw_neuron.Out;
          neuron.Out = {action, delay} as any;
        }

        lib.convert_to(neuron, raw_neuron.Type);
      }
    } catch(err) {
      console.warn("Unable to load screen file! Please try reloading.");
      console.warn(err);
    }
  },

  convert_to(neuron: Neuron, type: Partial<Neuron["Type"]>) {
    if(type.Normal) {
      neuron.Type.Normal = {};
    } else if(type.Motor) {
      neuron.Type.Motor = {};
    } else if(type.Logic) {
      neuron.Type.Logic = {} as any;
    } else if(type.Language) {
      let {phoneme} = type.Language;
      neuron.Type.Language = {phoneme} as any;
    } else if(type.Memory) {
      let {icon, Thought} = type.Memory;
      let thoughts:Thought[] = Thought as any; // the type is actually a raw neuron here...
      neuron.Type.Memory = {icon} as any;
      if(thoughts && thoughts.length) {
        for(let thought of thoughts) {
          let {content, ix} = thought;
          neuron.Type.Memory!.Thought.add({content, ix});
        }
      }
    } else {
      throw new Error(`@FIXME: Unknown conversion type ${type}`);
    }
    return neuron;
  },

  nth_child(node: HTMLElement, ix: number) {
    return node.children[ix];
  },

  label(neuron: Neuron, content: string, p: number) {
    neuron.Label = {content, p, side: 1} as any;
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
