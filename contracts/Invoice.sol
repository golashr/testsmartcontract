pragma solidity ^0.5.1;

contract Invoice {

    enum Status {
		INACTIVE,
		PENDING,
		ACTIVE
	}

	struct InvoiceStruct {
		bool isExist;
        string invoiceID;
		Status status;
	}

    mapping (string => InvoiceStruct) invoices;

    /* addInvoice function */
    function addInvoice(string memory invoiceID, string memory hash) public returns (bool) {
        invoices[hash].isExist = true;
        invoices[hash].invoiceID = invoiceID;
        invoices[hash].status = Status.ACTIVE;
        return true;
    }

    /* isHashExists function */
    function isHashExists(string memory hash) public view returns (bool) {
        if(invoices[hash].isExist)
            return true;
        else   
            return false;
    }

    /* getInvoiceID function */
    function getInvoiceID(string memory hash) public view returns (string memory) {
        if(!isHashExists(hash))
            return "";
        
        return invoices[hash].invoiceID;
    }
}
