
let prog = `
//calculating fibonacci
//shove: push value to stack
//harder: duplicate the number of depth specified at the top of the stack
//stuck?: if deep value is greater than the shallow value return true
//pump: increment the value at stack head
//moan: output the top of the stack
//yell: reserved
//stroke: while loop. stack: inst1 inst2. after inst1, if head is truthy exec inst2. else continue

shove 10 shove 0 
        ((shove stuck?) shove 1 chain)
        ((shove moan) (shove pump) shove 2 chain) stroke
shove "mhm count my ass" moan
`;

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
        const len = stack.pop().value;
        const lst = [];
        for(let i = 0; i < len; i++){
            lst.push(stack.pop());
        }
        stack.push(lst);
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
    "stroke":function(stack,ctx){
        const inst = stack.pop();
        const cond = stack.pop();
        execAss(cond,stack,ctx);
        while(stack.pop().value){
            execAss(inst,stack,ctx);
            execAss(cond,stack,ctx);
        }
    }
};

const execAss = function(cmds,stack,ctx){
    const str = ctx.str;
    for(let i = 0; i < cmds.length; i++){
        let cmd = cmds[i];
        //console.log(stack,cmds[i].name || cmds[i].value);
        if(cmd.type === "op"){
            operators[cmd.name](stack,cmd,ctx);
        }else if(cmd.type === "id"){
            if(!(cmd.value in funcs))
                throwError(`function ${cmd.value} not found at ${getAtString(str,cmd)}`);
            funcs[cmd.value](stack,ctx);
        }else{
            throwError(`Error: Unexpected token at ${getAtString(str,cmd)}`);
        }
    }
};


const exec = function(str){
    const tokens = tokenize(str);
    console.log("tokens: ",tokens);
    const cmds = [];
    for(let i = 0; i < tokens.length; i++){
        let token = tokens[i];
        if(token.type === "id" && token.value in operators){
            if(i >= tokens.length-1)
                throwError(`Error: Operator without right hand side at ${getAtString(str,token)}`);
            cmds.push({
                type:"op",
                name:token.value,
                value:tokens[i+1],
                i:token.i
            });
            i++;
        }else{
            cmds.push(tokens[i]);
        }
    }
    //console.log(cmds);
    const stack = [];
    const ctx = {str};
    execAss(cmds,stack,ctx);
}

exec(prog);
//console.log(tokenize(prog));