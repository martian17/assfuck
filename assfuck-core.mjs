import {FifoQueue} from "./queue.mjs";

const getByte = (()=>{
    let bytes = new FifoQueue;
    let resolvers = new FifoQueue;
    process.stdin.on("data", data=>{
        for(let byte of data){
            bytes.push(byte);
        }
        while(resolvers.size !== 0 && bytes.size !== 0){
            resolvers.pop()()
        }
    });
    return async function(){
        if(bytes.size === 0){
            await new Promise(res=>{
                resolvers.push(res);
            });
        }
        let res = bytes.pop();
        return res;
    };
})();

const tokenize = (function(){
    const consumeSpaces = function(str,i){
        while(i < str.length){
            if(str[i].match(/[\s\(\)\{\}]/)){
                i++;
            }else if(i < str.length-1 && str[i] === "/" && str[i+1] === "/"){
                while(i < str.length && str[i] !== "\n"){
                    i++;
                }
            }else{
                break;
            }
        }
        return i;
    };

    const tokenizeString = function(str,i){
        let chars = "";
        for(; i < str.length; i++){
            if(str[i] === "\\"){
                i++;
                chars += str[i];
            }else if(str[i] === "\""){
                i++;
                return [chars,i];
            }else{
                chars += str[i];
            }
        }
        return [chars,i];
    };

    const parseString = function(str,i){
        let chunk;
        [chunk,i] = tokenizeString(str,i);
        return [{
            type:"str",
            value:chunk,
            i
        },i];
    };

    const tokenizeChunk = function(str,i){
        let chars = "";
        for(; i < str.length; i++){
            if(str[i].match(/[\s\(\)\{\}]/)){//matched space
                return [chars,i];
            }else{
                chars += str[i];
            }
        }
        return [chars,i];
    };

    const parseChunk = function(str,i){
        let chunk;
        [chunk,i] = tokenizeChunk(str,i);
        if(chunk[0].match(/[a-zA-Z_?$]/)){
            //it's a id harry
            return [{
                type:"id",
                value:chunk,
                i
            },i];
        }else{//it's a number
            return [{
                type:"num",
                value:parseFloat(chunk),
                i
            },i];
        }
    };

    const parseToken = function(str,i){
        if(str[i] === "\""){
            i++;
            return parseString(str,i);
        }else{
            return parseChunk(str,i);
        }
    };

    const parse = function(str){
        let tokens = [];
        let i = 0;
        i = consumeSpaces(str,i);
        while(i < str.length){
            let token;
            [token,i] = parseToken(str,i);
            tokens.push(token);
            i = consumeSpaces(str,i);
        }
        return tokens;
    };
    return parse;
})();

const repeatstr = function(str,n){
    let r = "";
    for(let i = 0; i < n; i++){
        r += str;
    }
    return r;
};

const getAtString = function(str,cmd){
    const n = cmd.i;
    let line = 1;
    let chars = 1;
    for(let i = 0; i < n; i++){
        if(str[i] === "\n"){
            line++;
            chars = 1;
        }else{
            chars++;
        }
    }
    const lines = str.split("\n");
    
    return `line ${line}:${chars}\n${lines[line-1]}\n${repeatstr(" ",chars-1-(cmd.name||cmd.value).length/2)}^`;
};

const throwError = function(str){
    console.error("");
    console.error(str);
    process.exit(1);
};



const operators = {
    "shove":function(stack,cmd){
        stack.push(cmd.value);
    }
};

const funcs = {
    "expel":function(stack){
        stack.pop();
    },
    "stuck?":function(stack){
        const a = stack.pop();
        const b = stack.pop();
        let result = b.value > a.value;
        stack.push(b);
        stack.push(a);
        stack.push({
            type:"val",
            value:result,
            i:a.i
        });
    },
    "chain":function(stack){
        const lentoken = stack.pop();
        const len = lentoken.value;
        const lst = [];
        for(let i = 0; i < len; i++){
            lst.push(stack.pop());
        }
        lst.reverse();
        stack.push({
            type:"val",
            value:lst,
            i:lentoken.i
        });
    },
    "harder":function(stack){
        const len = stack.pop().value;
        const lst = [];
        for(let i = 0; i < len; i++){
            lst.push(stack.pop());
        }
        for(let i = 0; i < len; i++){
            lst.push(stack[len-i-1]);
        }
        for(let i = 0; i < len; i++){
            lst.push(stack[len-i-1]);
        }
    },
    "moan":function(stack){
        const a = stack.pop();
        console.log(a.value);
        stack.push(a);
    },
    "pump":function(stack){
        const a = stack.pop();
        a.value++;
        stack.push(a);
    },
    "relieve":function(stack){
        const a = stack.pop();
        a.value--;
        stack.push(a);
    },
    "nudge":function(stack){
        const a = stack.pop();
        const b = stack.pop();
        a.value += b.value;
        stack.push(b);
        stack.push(a);
    },
    "shave":function(stack){
        const a = stack.pop();
        const b = stack.pop();
        a.value += b.value;
        stack.push(b);
        stack.push(a);
    },
    "booba":function(stack){
        const a = stack.pop();
        const b = stack.pop();
        stack.push(a);
        stack.push(b);
    },
    "reverse":function(stack){
        const len = stack.pop().value;
        let lst = [];
        for(let i = 0; i < len; i++){
            lst.push(stack.pop());
        }
        for(let i = 0; i < len; i++){
            stack.push(lst[i]);
        }
    },
    "stroke":function(stack,ctx){
        const inst = stack.pop().value;
        const cond = stack.pop().value;
        execAss(cond,stack,ctx);
        while(stack.pop().value){
            execAss(inst,stack,ctx);
            execAss(cond,stack,ctx);
        }
    },
    // sucks a byte from stdin
    "suck":async function(stack){
        stack.push({
            type:"val",
            value:await getByte(),
            i:-1
        });
    }
};

const execAss = async function(cmds,stack,ctx){
    const str = ctx.str;
    for(let i = 0; i < cmds.length; i++){
        let cmd = cmds[i];
        //console.log(stack,cmds[i].name || cmds[i].value);
        if(cmd.type === "op"){
            operators[cmd.name](stack,cmd,ctx);
        }else if(cmd.type === "id"){
            if(!(cmd.value in funcs))
                throwError(`function ${cmd.value} not found at ${getAtString(str,cmd)}`);
            const res = funcs[cmd.value](stack,ctx);
            if(res instanceof Promise)await res;
        }else{
            throwError(`Error: Unexpected token at ${getAtString(str,cmd)}`);
        }
    }
};


export const exec = async function(str){
    const tokens = tokenize(str);
    console.log("assembled program:");
    console.log(tokens.map(a=>a.value).join(" "));
    console.log("");
    //console.log("tokens: ",tokens);
    const cmds = [];
    for(let i = 0; i < tokens.length; i++){
        const opchain = [];
        while(tokens[i].type === "id" && tokens[i].value in operators){
            opchain.push(tokens[i]);
            i++;
        }
        if(i >= tokens.length){
            console.log(cmds);
            throwError(`Error: Operator without right hand side at ${getAtString(str,cmds.pop())}`);
        }
        let cmd = tokens[i];
        while(opchain.length !== 0){
            let token = opchain.pop();
            cmd = {
                type:"op",
                name:token.value,
                value:cmd,
                i:token.i
            };
        }
        cmds.push(cmd);
    }
    //console.log(cmds);
    const stack = [];
    const ctx = {str};
    await execAss(cmds,stack,ctx);
};

