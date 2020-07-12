import {Ref} from "../std/types";
import std from "../std/std";
import {NeuralScreen, App} from "../../gmtk";
import {Neuron, Thought} from "../neuron/neuron";

import cached_screens from "../../ugc/screens.bundle.json";

export interface EditorType {
  Normal?: {},
  Motor?: {},
  Logic?: {},
  Language?: {},
  Memory?: {}
}

export interface Editor {
  State: {
    Disabled?: {},
    Enabled?: {
      Tool: {
        Add?: any,
        Flag?: any
      },
      Interaction: {
        None?: {},
        Adding?: {
          AddingNeuron: Neuron&Ref
        },
        Editing?: {
          SelectedNeuron: Neuron&Ref
        }
      }
    },

  }
}

let lib = {
  save_focused(app: App, prevent?:() => void) {
    app.NeuralScreen.each((screen) => {
      if(!screen.View.Focused) return;
      lib.save(screen, app.active_scene);
    });
    if(prevent) prevent();
  },
  save(screen: NeuralScreen, scene: string, prevent?: () => void) {
    let raw = screen.Neuron.to_json() as Partial<Neuron>[];
    for(let neuron of raw) {
      let n = neuron as any;
      delete n.id;
      delete n.Properties;
      delete n.Interaction;
      delete n.Pulse;
      delete n.Nucleus.Interaction;
      delete n.Nucleus.Flash;
      delete n.Nucleus.id;
      delete n.Terminal.Interaction;
      delete n.Terminal.Flash;
      delete n.Terminal.id;
      delete n.Axon;

      if(n.Out) {
        delete n.Out.id;
        delete n.Out.Properties;
      }

      if(n.Label) {
        delete n.Label.id;
        delete n.Label.Properties;
      }

      delete n.Type.id;
      if(n.Type.Normal) {
        delete n.Type;

      } else if(n.Type.Motor) {
        delete n.Type.Motor.id;
        delete n.Type.Motor.Properties;
        delete n.Type.Motor.TransientPulse;

      } else if(n.Type.Logic) {
        delete n.Type.Logic.id;
        delete n.Type.Logic.Properties;

      } else if(n.Type.Language) {
        delete n.Type.Language.id;
        delete n.Type.Language.Properties;
        delete n.Type.Language.Sound;

      } else if(n.Type.Memory) {
        delete n.Type.Memory.id;
        delete n.Type.Memory.Properties;
        delete n.Type.Memory.Icon;
      }
    }

    fetch(`/ugc/screens/${scene}/${screen.name}.json`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(raw)
    });
    if(prevent) prevent();
  },
  load_all(app: App, scene: string) {
    app.NeuralScreen.each((screen) => screen.remove());
    app.MotorScreen =
      app.NeuralScreen.add({name: "Motor"});
    app.LogicScreen =
      app.NeuralScreen.add({name: "Logic"});
    app.LanguageScreen =
      app.NeuralScreen.add({name: "Language"});
    app.MemoryScreen =
      app.NeuralScreen.add({name: "Memory"});
    app.NeuralScreen.each((screen) => {
      lib.load(screen, scene);
    });
  },
  async load(screen: NeuralScreen, scene: string) {
    try {
      // let res = await fetch(`/ugc/screens/${screen.name}.json`);
      // let raw:Neuron[] = await res.json();
      if(!cached_screens[scene]) {
        console.warn(`Attempted to load screens for non-bundled scene: '${scene}'`);
        return;
      }
      let raw:Neuron[] = cached_screens[scene][screen.name];

      screen.Neuron.each((neuron) => neuron.remove());

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

        if(raw_neuron.Type) lib.convert_to(neuron, raw_neuron.Type);
      }
    } catch(err) {
      console.warn("Unable to load screen file! Please try reloading.");
      console.warn(err);
    }
  },

  selected(neuron: Neuron&Ref, editor:Editor) {
    return std.is(neuron, editor.State.Enabled?.Interaction.Editing?.SelectedNeuron);
  },

  set_prop(target:any, prop:string, value:any, type = "number") {
    if(type === "number") target[prop] = +value;
    else target[prop] = value;
  },
  get_prop(target:any, prop:string) {
    return target[prop];
  },

  as_proxy(target:any) {
    return target;
  },

  convert_to(neuron: Neuron, type: Partial<Neuron["Type"]>) {
    if(type.Normal) {
      neuron.Type.Normal = {};
    } else if(type.Motor) {
      let {pulse_radius, pulse_growth, part} = type.Motor;
      neuron.Type.Motor = {pulse_radius, pulse_growth, part};
    } else if(type.Logic) {
      neuron.Type.Logic = {} as any;
    } else if(type.Language) {
      let {phoneme} = type.Language;
      neuron.Type.Language = {phoneme} as any;
    } else if(type.Memory) {
      let {icon, idea, Thought} = type.Memory;
      let thoughts:Thought[] = Thought as any; // the type is actually a raw neuron here...
      neuron.Type.Memory = {icon, idea} as any;
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

  out(neuron: Neuron, action: string, delay: number) {
    neuron.Out = {action, delay} as any;
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
