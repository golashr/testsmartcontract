pragma solidity ^0.5.1;
import "./SmartCertContract.sol";

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
