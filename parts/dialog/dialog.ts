import { Ref, PluralRef} from "../std/types";
import std from "../std/std";

interface Dialog {
  Message: PluralRef<Message>;
  ActiveMessage?: Message;
}

interface Message {
  author: string;
  says: string;
  Next?: Message;
  End?: {};
  Branch: PluralRef<Branch>;
  Effect?: {
    action: string;
    args: any;
  };
}

interface Branch {
  Then: Message;

  Event: {
    Open?: {screen: string},
    OpenOther?: {screen: string}
  }
}

interface RawMessage {
  author: string;
  says: string;
  line: number;
  next?: number;
  join?: number;
  fallthrough?: number;
  return?: boolean;
  branches?: RawBranch[];
  effect?: string;
}

interface RawBranch {
  cond: string;
  then: number;
}

function parse_call(raw:string) {
  let split_ix = raw.indexOf(" ");
  let [action, raw_args] = split_ix === -1 ?
    [raw] :
    [raw.slice(0, split_ix), raw.slice(split_ix + 1)];
  let args:any;
  if(raw_args) {
    args = {};
    for(let raw_pair of raw_args.split(" ")) {
      if(raw_pair.trim() === "") continue;
      let [raw_key, raw_val] = raw_pair.split(":");
      let val = raw_val.trim();
      args[raw_key.trim()] = std.is_number(val) ? +val : val;
    }
  }
  return [action, args];
}

function parse_script(script:string, name: string) {
  let messages:RawMessage[] = [];

  let line_ix = 0;
  let prev:RawMessage|undefined;
  let stack:RawMessage[] = [];
  for(let line of script.split("\n")) {
    let prev = stack[stack.length - 1];
    if(line.trim() === "") {
      // white space
    } else if(line[0] === ">") {
      // Branch.
      if(!prev) {
        throw new Error(`Script Parse Error: Branch without previous msg in script ${name} L${line_ix}`);
      }
      if(!prev.branches) prev.branches = [];
      prev.branches.push({cond: line.slice(1).trim(), then: messages.length});

    } else if(line[0] === "<") {
      // End of branch
      stack.pop();

      // Fall through to next branch.
      if(line[1] === "$") {
        prev.fallthrough = line[2] ? +line[2] : 1;
      }
      if(line[1] === "^") {
        prev.return = true;
      }

      prev = stack[stack.length - 1];
      prev.join = messages.length;

    } else if(line[0] === " ") {
      // Continuation;
      if(!prev) {
        throw new Error(`Script Parse Error: Continuation without previous msg in script ${name} L${line_ix}`);
      }

      if(prev.branches?.length) {
        throw new Error(`Script Parse Error: Attempting to continue in empty branch ${name} L${line_ix}`);
      }

      prev.says += "\n" + line.trim();
    } else if(line[0] === "!") {
      // Effect
      if(!prev) {
        throw new Error(`Script Parse Error: Effect without previous msg in script ${name} L${line_ix}`);
      }
      prev.effect = line.slice(1).trim();
    } else {
      let split_ix = line.indexOf(":");
      if(split_ix === -1) {
        throw new Error(`Script Parse Error: Missing Author in script ${name} L${line_ix}`);
      }
      if(prev) {
        if(!prev.branches?.length) {
          prev.next = messages.length;
          stack.pop();
        }
      }
      let msg = {line: line_ix, author: line.slice(0, split_ix), says: line.slice(split_ix + 1).trim()};
      stack.push(msg);
      messages.push(msg);
    }

    line_ix += 1;
  }

  let msg_ix = 0;
  for(let msg of messages) {
    // Forward all branches to next message.
    let join = msg.join;
    let branch_ix = 0;
    for(let branch of msg.branches || []) {
      let cur = messages[branch.then];
      // Advance to last message in chain.
      while(cur?.next !== undefined) {
        cur = messages[cur.next];
      }

      if(!cur) {
        throw new Error(`Script Parse Error: Branch missing cur in script ${name} L${line_ix}`);
      }

      if(cur.fallthrough) {
        if(!msg.branches) {
          throw new Error(`Script Parse Error: Fallthrough specified for branchless msg script ${name} L${msg.line}`);
        }
        let next = msg.branches[branch_ix + cur.fallthrough]?.then;
        if(next === undefined || next >= messages.length) {
          throw new Error(`Script Parse Error: Fallthrough branch missing in script ${name} L${msg.line}`);
        }
        cur.next = next;
      } else if(cur.return) {
        cur.next = msg_ix;
      } else {
        cur.next = join;
      }

      branch_ix += 1;
    }

    msg_ix += 1;
  }

  return messages;
}

globalThis.parse_script = parse_script;


let lib = {
  load_script(dialog:Dialog, script_name:string) {
    let parsed = parse_script(test, script_name);
    let messages:Message[] = [];

    dialog.Message.each((msg) => msg.remove());

    for(let raw of parsed) {
      let {author, says} = raw;
      let msg = dialog.Message.add({author, says});
      messages.push(msg);

      if(raw.effect) {
        let [action, args] = parse_call(raw.effect);
        msg.Effect = {action, args};
      }
    }

    let msg_ix = 0;
    for(let raw of parsed) {
      let msg = messages[msg_ix];

      if(raw.next) msg.Next = messages[raw.next];
      for(let {cond, then} of raw.branches || []) {
        let branch = msg.Branch.add({});
        branch.Then = messages[then];
        let [event, args] = parse_call(cond);
        branch.Event[event] = args;;
      }
      msg_ix += 1;
    }

    return messages[0];
  },

  effect(action: string, args:any) {
    get_program()?.queue(action, args || {})?.send();
  }
};

export default lib;





// let test_cases = {
//   simple: `
// Bob: Hello, world!
// `,
//   partners: `
// Bob: Hey, Sue!
// Sue: Hey, Bob!
// `,
//   repeat: `
// Bob: Hey, Sue!
// Sue: Hey, Bob!
// Sue: What's the word?
// `,
//   cont: `
// Bob: Hey, Sue!
// Sue: Hey, Bob!
//      What's the word?
// `,
//   branch1: `
// Bob: You go, girl
// Jen: Thanks, Bob!
// > delay 100
// Jen: You still there?
// <
// Bob: Yep!
// `,
//   branch2: `
// Bob: You go, girl
// Jen: Thanks, Bob!
// > delay 100
// Jen: You still there?
// <
// > high_five
// Jen: You rule!
// <
// Bob: Yep!
// `,
//   branch_multi: `
// Bob: You go, girl
// Jen: Thanks, Bob!
// > delay 100
// Jen: You still there?
// Bob: Yep!
// Jen: K, cool.
// <
// Bob: Anyway, be seeing you!
// `,
//   fallthrough: `
// Bob: Did you file the TPS reports?
// > yes
// Jen: Sure did!
// <$
// > no
// Jen: Get off my back!
// <
// Bob: Okay, sheesh.
// `
// };
// for(let name in test_cases) {
//   console.groupCollapsed(name);
//   let test = test_cases[name];
//   console.info(test);
//   console.dir(parse_script(test, name));
//   console.groupEnd();
// }


import test from "../../assets/scripts/tutorial.txt";
import { get_program } from "../std/std";
console.log(parse_script(test, "test"));
