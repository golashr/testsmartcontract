pragma solidity ^0.5.1;

contract Greeter {
    /* Define variable greeting of the type string */
    string private greeting;
    uint32 private myNumber;

    /* This runs when the contract is executed */
    constructor(string memory _greeting) public {
        greeting = _greeting;
        myNumber = 0;
    }

    /* greet function */
    function greet() public view returns (string memory) {
        return greeting;
    }

    /* setMyNumber function */
    function setMyNumber(uint32 value) public {
        myNumber = value;
    }

    /* getMyNumber function */
    function getMyNumber() public view returns (uint32) {
        return myNumber;
    }
}
