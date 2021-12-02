# AssFuck
AssFuck is an esoteric language modeled after a stack based language model.
During the execution, a programmer gets a single stack to work on, and basically the programmer's job is to push and pop (shove and grab) the values and operate on them using pre-existing functions.

## Types
* String: basically javascript double quopted single line strings
* Number: basically javascript numbers
* Value: any intermediate produced by the functions, including any boolean
* Functions: pre-existing functions that operate on the stack members
* Shove operator: prefix values to denote they are intended to be pushed into the stack

## Operators
* shove: push value to stack
* grab: discard the top of the stack

## Functions
* harder: duplicate the number of depth specified at the top of the stack
* stuck?: if the deeper value is greater than the shallow value return true
* pump: increment the value at stack head
* moan: output the top of the stack
* yell: reserved
* stroke: while loop. stack: inst1 inst2. after inst1, if head is truthy exec inst2. else continue
