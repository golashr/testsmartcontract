pragma solidity ^0.5.1;
pragma experimental ABIEncoderV2;

//-------------------------------------------------------------------------
contract Owned {
  address private owner;     //Address of ControllerContract

  constructor() public {
     owner = msg.sender; // just set the ControllerContract
  }

  modifier onlyOwner{
    require(msg.sender == owner);
    _;
  }
}

//------------------------------------------------------------------
contract Certificate is Owned{

  string private certIdentifier; //Unique indetifier, to be given by DApp
  bool private isRevokedFlag;     //whether certificate is revoked by uni due to any reason
  bool private isExpiredFlag;     //whether certificate is expired or still active
  address private owner;          //Address of ControllerContract
  address private addressStudent; //Address of Student
  address private addressBatch;   //Address of Batch
  string private certHash;       //Hash of the certificate saved with DApp by SHA256notaryHash
  string private issuedOn;

  event CertGrantedCert(bool flag);

  constructor(address batchAddress, string memory _certIdentifier) public {
    owner = msg.sender;  // just set the ControllerContract
    certIdentifier = _certIdentifier;
    addressStudent = address(0x00);
    addressBatch = batchAddress;
    isRevokedFlag = false;
    isExpiredFlag = false;
  }

  //For CertIdentifier
  function getCertIdentifier() public view returns(string memory) {
    return certIdentifier;
  }

  //For Revocation
  function isRevoked() public view returns(bool) {
      return isRevokedFlag;
  }

  function revokeCert() onlyOwner public returns(bool) {
      isRevokedFlag = true;
      return true;
  }

  function suspendRevocation() onlyOwner public returns(bool) {
      isRevokedFlag = false;
      return true;
  }

  //For Expiry
  function isExpired() public view returns(bool) {
      return isExpiredFlag;
  }

  function expireCert() onlyOwner public returns(bool) {
      isExpiredFlag = true;
      return true;
  }

  function grantCertificate(address studentAddress, string memory timestamp) onlyOwner public returns(bool) {
      addressStudent = studentAddress;
      issuedOn = timestamp;
      emit CertGrantedCert(true);
      return true;
  }

  //For BatchAddress
  function getBatchAddress() public view returns(address) {
      return addressBatch;
  }

  //For student
  function getGrantedStudent() public view returns(address) {
      return addressStudent;
  }

  //For cert Hash
  function getCertHash() public view returns(string memory) {
      return certHash;
  }

  function setCertHash(string memory _certHash) public returns(bool) {
    certHash = _certHash;
  }
}
//----------------------------------------------------------
contract Student is Owned{
  address private owner;              //Address of ControllerContract
  address private batchAddress;       //Address of Batch
  string private studentIdentifier;

  event CertGranted(bool flag);

  struct CertStruct {
      address certificateAddress;
      bool isCertificateGranted;
      uint index;
  }
  mapping (address => CertStruct) private certStructs;
  address[] private certIndex;

  constructor(string memory _studentIdentifier) public {
    owner = msg.sender;  // just set the ControllerContract
    studentIdentifier = _studentIdentifier;
  }

  function isCertGranted(address certAddress) public view returns(bool) {
    if(certIndex.length == 0) return false;
    return ((certIndex[certStructs[certAddress].index] == certAddress) && (certStructs[certAddress].isCertificateGranted));
  }

  function grantCertificate(address _batchAddress, address certAddress, string memory timestamp) onlyOwner public returns(bool) {
    if(isCertGranted(certAddress)) return true;
    certStructs[certAddress].certificateAddress = certAddress;
    certStructs[certAddress].isCertificateGranted = true;
    certStructs[certAddress].index = certIndex.push(certAddress)-1;

    batchAddress = _batchAddress;

    //add Student address to Certiifcate as well!
    //Certificate cert = Certificate(certAddress);
    //cert.grantCertificate(this, timestamp);
    //CertGranted(true);
    return true;
  }

  function getBatchAddress() public view returns (address) {
    return batchAddress;
  }

  function getCertificateAt(uint index) public view returns (address) {
    if(index < certIndex.length)
      return certIndex[index];
    else
      return address(0x00);
  }

  function getNoOfCertificates() public view returns (uint) {
    return certIndex.length;
  }

  function getAllCertificate() public view returns(address[10] memory) {
     address[10] memory certificatesArray;
     for (uint index = 0; index < certIndex.length; index++) {
    if(certStructs[certIndex[index]].isCertificateGranted) //If flag is true
        certificatesArray[index] = certStructs[certIndex[index]].certificateAddress;
     }
     return certificatesArray;
  }
}
//------------------------------------------------------
contract Batch is Owned{
  address private owner;            //Address of ControllerContract
  address private addressCourse;    //Address of Course
  string private batchIdentifier;  //Unique indetifier, to be given by DApp
  string private merkelRootHash;   //This is merkel root of all the certs issued, by SHA256notaryHash

  event StudentAdded(bool flag);

  struct StudentStruct {
    address studentData;
    bool isStudent;
    uint index;
  }

  mapping (address => StudentStruct) private studentStructs;
  address[] private studentIndex;

  constructor(address _addressCourse, string memory _batchIdentifier) public{
    owner = msg.sender;  // just set the ControllerContract
    addressCourse = _addressCourse;
    batchIdentifier = _batchIdentifier;
  }

  //For batchIdentifier
  function getBatchIdentifier() public view returns(string memory) {
      return batchIdentifier;
  }

  //For CourseAddress
  function getCourseAddress() public view returns(address) {
      return addressCourse;
  }

  function isStudentExist(address studAddress) public view returns(bool) {
    if(studentIndex.length == 0) return false;
      return ((studentIndex[studentStructs[studAddress].index] == studAddress) && (studentStructs[studAddress].isStudent));
  }

  function addStudent(address studAddress) onlyOwner public returns(uint) {
    if(isStudentExist(studAddress)) return uint(9999);
    studentStructs[studAddress].studentData = studAddress;
    studentStructs[studAddress].isStudent = true;
    studentStructs[studAddress].index = studentIndex.push(studAddress)-1;
    emit StudentAdded(true);
    return studentIndex.length-1;
  }

  function getNoOfStudents() public view returns (uint) {
    return studentIndex.length;
  }

  function getStudentAt(uint index) public view returns (address) {
    if(index < studentIndex.length)
      return studentIndex[index];
    else
      return address(0x00);
  }

  function getAllStudents() public view returns(address[10] memory) {
    address[10] memory studentsArray;
    for (uint index = 0; index < studentIndex.length; index++) {
    if(studentStructs[studentIndex[index]].isStudent) //If flag is true
      studentsArray[index] = studentStructs[studentIndex[index]].studentData;
    }
    return studentsArray;
  }

  function getMerkelRoot() view public returns(string memory) {
    return merkelRootHash;
  }

  function setMerkelRoot(string memory _merkelRootHash) public returns(bool) {
    merkelRootHash = _merkelRootHash;
    return true;
  }
}
//----------------------------------------------------------------
contract Course is Owned{
  address private owner;              //Address of ControllerContract
  address private addressInstitute;   //Address of Institute
  string private courseIdentifier;   //Unique indetifier, to be given by DApp

  event BatchAdded(bool flag);

  struct BatchStruct {
    address batchData;
    bool isBatch;
    uint index;
  }
  mapping (address => BatchStruct) private batchStructs;
  address[] private batchIndex;

  constructor(address _addressInstitute, string memory _courseIdentifier) public {
    owner = msg.sender;  // just set the ControllerContract
    courseIdentifier = _courseIdentifier;
    addressInstitute = _addressInstitute;
  }

  //For courseIdentifier
  function getCourseIdentifier() public view returns(string memory) {
      return courseIdentifier;
  }

  //For addressInstitute
  function getInstituteAddress() public view returns(address) {
      return addressInstitute;
  }

  function isBatchExist(address batchAddress) public view returns(bool) {
    if(batchIndex.length == 0) return false;
      return ((batchIndex[batchStructs[batchAddress].index] == batchAddress) && (batchStructs[batchAddress].isBatch));
  }

  function addBatch(address batchAddress) onlyOwner public returns(uint) {
    if(isBatchExist(batchAddress)) return uint(9999);
    batchStructs[batchAddress].batchData = batchAddress;
    batchStructs[batchAddress].isBatch = true;
    batchStructs[batchAddress].index = batchIndex.push(batchAddress)-1;
    emit BatchAdded(true);
    return batchIndex.length-1;
  }

  function getNoOfBatches() public view returns (uint) {
    return batchIndex.length;
  }

  function getBatchAt(uint index) public view returns (address) {
    if(index < batchIndex.length)
      return batchIndex[index];
    else
      return address(0x00);
  }

  function getAllBatches() public view returns(address[10] memory) {
    address[10] memory batchesArray;
    for (uint index = 0; index < batchIndex.length; index++) {
    if(batchStructs[batchIndex[index]].isBatch) //If flag is true
      batchesArray[index] = batchStructs[batchIndex[index]].batchData;
    }
    return batchesArray;
  }
}
//---------------------------------------------------------------------------
contract Institute is Owned{

  address private owner;                //Address of ControllerContract
  address private addressUniversity;    //Address of University
  string private instituteIdentifier;  //Address of Course

  event CourseAdded(bool flag);

  struct courseStruct {
      address courseAddress;
      bool isCourse;
      uint index;
  }

  mapping (address => courseStruct) private courseStructs;
  address[] private courseIndex;

  constructor(address _addressUniversity, string memory _instituteIdentifier) public{
    owner = msg.sender;  // just set the self
    addressUniversity = _addressUniversity;
    instituteIdentifier = _instituteIdentifier;
  }

  //For addressUniversity
  function getAddressUniversity() public view returns(address) {
      return addressUniversity;
  }

  //For courseIdentifier
  function getInstituteIdentifier() public view returns(string memory) {
      return instituteIdentifier;
  }

  function isCourseExist(address courseAddress) public view returns(bool isIndeed) {
    if(courseIndex.length == 0) return false;
     return ((courseIndex[courseStructs[courseAddress].index] == courseAddress) && (courseStructs[courseAddress].isCourse));
  }

  function addCourse(address courseAddress) onlyOwner public returns(uint) {
      if(isCourseExist(courseAddress)) return uint(9999);
      courseStructs[courseAddress].courseAddress = courseAddress;
      courseStructs[courseAddress].isCourse = true;
      courseStructs[courseAddress].index = courseIndex.push(courseAddress)-1;
      emit CourseAdded(true);
      return courseIndex.length-1;
  }

  function getNoOfCourses() public view returns (uint) {
    return courseIndex.length;
  }

  function getCourseAt(uint index) public view returns (address) {
    if(index < courseIndex.length)
      return courseIndex[index];
    else
      return address(0x00);
  }

  function getAllCourses() public view returns(address[10] memory) {
    address[10] memory coursesArray;
    for (uint index = 0; index < courseIndex.length; index++) {
    if(courseStructs[courseIndex[index]].isCourse) //If flag is true
      coursesArray[index] = courseStructs[courseIndex[index]].courseAddress;
    }
    return coursesArray;
  }
}
//--------------------------------------------------------
contract University is Owned{
  address private owner;                 //Address of ControllerContract
  string private universityIdentifier;  ///universityIdentifier

  event InstituteAdded(bool flag);

  struct InstituteStruct {
    address instituteData;
    bool isInstitute;
    uint index;
  }
  mapping (address => InstituteStruct) private instituteStructs;
  address[] private instituteIndex;

  constructor(string memory _univIdentifier) public{
    owner = msg.sender;       // just set the ControllerContract
    universityIdentifier = _univIdentifier;
  }

  //For universityIdentifier
  function getUnivesityIdentifier() public view returns(string memory) {
      return universityIdentifier;
  }

  function isInstituteExist(address instituteAddress) public view returns(bool) {
    if(instituteIndex.length == 0) return false;
    return ((instituteIndex[instituteStructs[instituteAddress].index] == instituteAddress) && (instituteStructs[instituteAddress].isInstitute));
  }

  function getInstituteAt(uint index) view public returns(address) {
    if(index < instituteIndex.length)
      return instituteIndex[index];
    else
      return address(0x00);
  }

  function addInstitute(address instituteAddress) onlyOwner public returns(uint) {
    if(isInstituteExist(instituteAddress)) return uint(9999);
    instituteStructs[instituteAddress].instituteData = instituteAddress;
    instituteStructs[instituteAddress].isInstitute = true;
    instituteStructs[instituteAddress].index = instituteIndex.push(instituteAddress)-1;
    emit InstituteAdded(true);
    return instituteIndex.length-1;
  }
}
//--------------------------------------------------------

contract ControllerContract {

    address private owner;

    event UniversityAddress(address univ);
    event InstituteAddress(address institute);
    event CourseAddress(address course);
    event BatchAddress(string message, address batch);
    event StudentAddress(string _id,address student);
    //event CertificateAddress(address certificate, address batchAddr,string[2] _id);

    event StudentAdded(bool flag);
    event UniversityAdded(bool flag);
    event CertificateAdded(bool flag);
    event CertificateGranted(address batchAddress, address stuAddress, address certAddress, bool flag);

    struct CertificateStruct {
        address certificateAddress;
        bool isCertificate;
        uint index;
    }
    mapping (address => CertificateStruct) private certificateStructs;
    address[] private certificateIndex;

    struct StudentStruct {
        address studentAddress;
        bool isStudent;
        uint index;
    }
    mapping (address => StudentStruct) private studentStructs;
    address[] private studentIndex;

    struct UniversityStruct {
        address univAddress;
        bool isUniversity;
        uint index;
    }
    mapping (address => UniversityStruct) private univStructs;
    address[] private univIndex;

    constructor() public{
        owner = msg.sender;  // just set the self
    }

    function isUniExist(address uniAddress) public view returns(bool) {
        if(univIndex.length == 0) return false;
	        return ((univIndex[univStructs[uniAddress].index] == uniAddress) && (univStructs[uniAddress].isUniversity));
    }
    
    function getNoOfUniversity() public view returns (uint) {
        return univIndex.length;
    }

    function getUniversityAt(uint index) public view returns (address) {
        if(index <= univIndex.length)
            return univIndex[index];
        else
            return address(0x00);
    }

    function addUniversity(address univAddress) public returns(uint) {
        if(isUniExist(univAddress)) 
            return uint(9999);
        univStructs[univAddress].univAddress = univAddress;
        univStructs[univAddress].isUniversity = true;
        univStructs[univAddress].index = univIndex.push(univAddress)-1;
        emit UniversityAdded(true);
        return univIndex.length-1;
    }
    
    function isStudentExist(address studAddress) public view returns(bool) {
        if(studentIndex.length == 0) return false;
        return ((studentIndex[studentStructs[studAddress].index] == studAddress) && (studentStructs[studAddress].isStudent));
    }
    
    function getNoOfStudents() public view returns (uint) {
        return studentIndex.length;
    }

    function getStudentAt(uint index) public view returns (address) {
        if(index < studentIndex.length)
            return studentIndex[index];
        else
            return address(0x00);
    }
  
    function addStudent(address studentAddress) public returns (uint) {
        if(isStudentExist(studentAddress)) 
            return uint(9999);
        studentStructs[studentAddress].studentAddress = studentAddress;
        studentStructs[studentAddress].isStudent = true;
        studentStructs[studentAddress].index = studentIndex.push(studentAddress)-1;
        emit StudentAdded(true);
        return studentIndex.length-1;
    }
    
    function isCertificateExist(address certAddress) public view returns(bool) {
        if(certificateIndex.length == 0) return false;
            return ((certificateIndex[certificateStructs[certAddress].index] == certAddress) && (certificateStructs[certAddress].isCertificate));
    }

    function getNoOfCertificates() public view returns (uint) {
        return certificateIndex.length;
    }

    function getCertificateAt(uint index) public view returns (address) {
        if(index <= certificateIndex.length)
            return certificateIndex[index];
        else
            return address(0x00);
    }

    function addCertificate(address certificateAddress) public returns(uint) {
        if(isCertificateExist(certificateAddress)) 
            return uint(9999);
        certificateStructs[certificateAddress].certificateAddress = certificateAddress;
        certificateStructs[certificateAddress].isCertificate = true;
        certificateStructs[certificateAddress].index = certificateIndex.push(certificateAddress)-1;
        emit CertificateAdded(true);
        return certificateIndex.length-1;
    }

    function checkHierarchy(address univAddress,address instAddress,address courseAddress,address batchAddress) public view returns (bool) {
        if(!isUniExist(univAddress)) return false;

        University univ = University(univAddress);
        if(!univ.isInstituteExist(instAddress)) return false;

        Institute inst = Institute(instAddress);
        if(!inst.isCourseExist(courseAddress)) return false;

        Course course = Course(courseAddress);
        if(!course.isBatchExist(batchAddress)) return false;

        return true;
    }

    function issueCertificate(address batchAddress, address studAddress, address certAddress, string memory timestamp) public returns(bool) {
        Batch batch = Batch(batchAddress);
        if(!batch.isStudentExist(studAddress)) 
            return false;

        Student student = Student(studAddress);
        if(student.isCertGranted(certAddress)) 
            return true;

        //Actually granting the certificate
        bool flag = student.grantCertificate(batchAddress, certAddress, timestamp);
        emit CertificateGranted(batchAddress,studAddress,certAddress,flag);
        return flag;
    }

    function verifyCertificate(address studAddress, address certAddress) public view returns(bool) {
        Certificate cert = Certificate(certAddress);
        address batchAddress = cert.getBatchAddress();
        //emit BatchAddress("Certificate is associated with Batch :", batchAddress);
        Batch batch = Batch(batchAddress);
        if(!batch.isStudentExist(studAddress)) return false;

        Student student = Student(studAddress);
        if(!student.isCertGranted(certAddress)) 
            return false;
        return true;
    }
}


 

