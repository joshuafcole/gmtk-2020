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
  }
};

export default lib;
