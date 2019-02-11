pragma solidity >=0.4.0 <0.6.0;

import "./libSafeMath.sol";
import "./libMsgCode.sol";
import "./libSharing.sol";


library TokenFunc {
    
    using SafeMath for uint256;
    
    
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event NewTradable(address indexed _from, address indexed _to, uint _amount, uint indexed _date);
    event NewAllocated(address _from, address indexed _to, uint _amount, uint indexed _dateAdded);
    event NewVesting(address _from, address indexed _to, uint _amount, uint indexed _date);
    event NewLien(address _from, address indexed _to, uint _amount, uint indexed _dateAdded, uint indexed _lienPeriod);
    event MovedToTradable(address indexed _holder, Sharing.TokenCat _sitCat, uint256 catIndex);
    event NewShareholder(address indexed __holder);
    event shareHolderUpdated(address indexed _holder,bool _isEnabled, bool _isWithhold);
    event shareHolderRemoved(address _holder);
    event Withdrawn(address initiator, address indexed _holder, Sharing.TokenCat _sitCat, uint256 _amount, bytes _data);
    

    function totalSupply(Sharing.DataToken storage self) internal view  returns (uint256) {
        return self.uTotalSupply;
    }

    function balanceOf(Sharing.DataToken storage self, address _tokenOwner) internal view returns (uint256) {
        return self.mBalances[_tokenOwner];
    }
    
    function transfer(Sharing.DataToken storage self, address _to, uint256 _amount) internal returns (bool) {
        verifyTransfer (self, msg.sender, _to, _amount);
        self.mBalances[msg.sender] = self.mBalances[msg.sender].sub(_amount);
        self.mBalances[_to] = self.mBalances[_to].add(_amount);
        emit Transfer(msg.sender, _to, _amount);
        return true;
    }

    function transferFrom(Sharing.DataToken storage self, address _from, address _to, uint256 _amount) internal returns (bool success) {
        verifyTransfer (self,_from, _to, _amount);
        require(self.mAllowed[_from][msg.sender] >= _amount, MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.SPENDER_BALANCE_ERROR)));
        self.mBalances[_from] = self.mBalances[_from].sub(_amount);
        self.mAllowed[_from][msg.sender] = self.mAllowed[_from][msg.sender].sub(_amount);
        self.mBalances[_to] = self.mBalances[_to].add(_amount);
        emit Transfer(_from, _to, _amount);
        return true;
    }

    function approve(Sharing.DataToken storage self, address _spender, uint256 _amount) internal returns (bool) {
        require(self.shareHolders[_spender].isEnabled, MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.SEND_TRANSFER_BLOCKED)));
        self.mAllowed[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }
    
    function allowance(Sharing.DataToken storage self, address _owner, address _spender) internal view  returns (uint256) {
        return self.mAllowed[_owner][_spender];
    }
    
    function verifyTransfer (Sharing.DataToken storage self, address _from,address _to,uint256 _amount)internal view returns (bool success){
        MessagesAndCodes.Reason restrictionCode = detectTransferRestriction(self, _from, _to, _amount);
        require(MessagesAndCodes.isOk(uint8(restrictionCode)), messageForTransferRestriction(uint8(restrictionCode)));
        return true;
    }
    
    function detectTransferRestriction (Sharing.DataToken storage self, address _from, address _to, uint256 _amount) internal view returns (MessagesAndCodes.Reason)
    {
        MessagesAndCodes.Reason restrictionCode = MessagesAndCodes.Reason.SUCCESS;
        if (!self.shareHolders[_from].isEnabled) {
            restrictionCode = MessagesAndCodes.Reason.SEND_TRANSFER_BLOCKED;
        } else if (!self.shareHolders[_to].isEnabled) {
            restrictionCode = MessagesAndCodes.Reason.RECEIPT_TRANSFER_BLOCKED;
        } else if (self.mBalances[_from] < _amount) {
            restrictionCode = MessagesAndCodes.Reason.INSUFFICIENT_FUND_ERROR;
        } else if (_amount <= 0 && self.mBalances[_to].add(_amount) <= self.mBalances[_to]) {
            restrictionCode = MessagesAndCodes.Reason.INVALID_ERROR;
        } else if (self.shareHolders[_from].isWithhold) {
            restrictionCode = MessagesAndCodes.Reason.ACCOUNT_WITHHOLD_ERROR;
        }
        return restrictionCode;
    }
    
    
    function messageForTransferRestriction (uint8 restrictionCode) public view returns (string memory){
        return MessagesAndCodes.appCode(restrictionCode);
    }
        
    function getRecordByCat(Sharing.DataToken storage self, address _holder, Sharing.TokenCat _sitCat, uint _catIndex) internal view returns (uint256 amount, uint256 dateAdded, uint256 duration, bool isMovedToTradable, bool isWithdrawn) {
        
        if (Sharing.TokenCat.Lien == _sitCat) {
            Sharing.Lien memory _lien = self.mLiens[_holder][_catIndex];
            return(_lien.amount, _lien.dateAdded, _lien.lienPeriod, _lien.isMovedToTradable, _lien.isWithdrawn);
        } else  if (Sharing.TokenCat.Vesting == _sitCat) {
            Sharing.Vesting memory _vesting = self.mVestings[_holder][_catIndex];
            return(_vesting.amount, _vesting.dateAdded, 0, _vesting.isMovedToTradable, _vesting.isWithdrawn);
        } else  if (Sharing.TokenCat.Allocated == _sitCat) {
            Sharing.Allocated memory _allocate = self.mAllocations[_holder][_catIndex];
            return(_allocate.amount, _allocate.dateAdded,0, _allocate.isMovedToTradable, _allocate.isWithdrawn);
        } 
    }
    
    function totalRecordsByCat(Sharing.DataToken storage self, address _holder, Sharing.TokenCat _sitCat) internal view returns (uint) {
        if (Sharing.TokenCat.Lien == _sitCat) {
            return self.mLiens[_holder].length;
        } else  if (Sharing.TokenCat.Vesting == _sitCat) {
            return self.mVestings[_holder].length;
        } else  if (Sharing.TokenCat.Allocated == _sitCat) {
            return self.mAllocations[_holder].length;
        } 
    }
    
    function _addToAllocated (Sharing.DataToken storage self, address _holder, uint _amount, uint _dateAdded, uint _dateDue) internal returns(bool success) {
        self.mAllocations[_holder].push(Sharing.Allocated(_amount, _dateAdded, _dateDue, false, false));
        emit NewAllocated(msg.sender, _holder, _amount, _dateAdded);
        return true;
    }
    
    function _addToVesting (Sharing.DataToken storage self, address _holder, uint _amount, uint _dateAdded) internal returns(bool success) {
        self.mVestings[_holder].push(Sharing.Vesting(_amount, _dateAdded, false, false));
        emit NewVesting(msg.sender, _holder, _amount, _dateAdded);
        return true;
    }
    
    function _addToLien (Sharing.DataToken storage self, address _holder, uint _amount, uint _dateAdded, uint _lienPeriod) internal returns(bool success) {
        self.mLiens[_holder].push(Sharing.Lien(_amount, _dateAdded, _lienPeriod, false, false));
        emit NewLien(msg.sender, _holder, _amount, _dateAdded, _lienPeriod);
        return true;
    }    
    
    function moveToTradable(Sharing.DataToken storage self, address _holder, Sharing.TokenCat _sitCat, uint _recordId) internal returns (string memory success) {
        if (Sharing.TokenCat.Lien == _sitCat) {
            require(!self.mLiens[_holder][_recordId].isWithdrawn, MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.NOTALLOWED_ERROR)));
            require(self.mLiens[_holder][_recordId].dateAdded.add(self.mLiens[_holder][_recordId].lienPeriod) >= now, MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.MOVE_LIEN_ERROR)));
            self.mLiens[_holder][_recordId].isMovedToTradable = true;
            self.mBalances[_holder] = self.mBalances[_holder].add(self.mLiens[_holder][_recordId].amount);
            emit MovedToTradable(_holder,_sitCat, _recordId);
        } else  if (Sharing.TokenCat.Vesting == _sitCat) {
            require(!self.mVestings[_holder][_recordId].isWithdrawn, MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.NOTALLOWED_ERROR)));
            self.mVestings[_holder][_recordId].isMovedToTradable = true;
            self.mBalances[_holder] = self.mBalances[_holder].add(self.mVestings[_holder][_recordId].amount);
            emit MovedToTradable(_holder,_sitCat, _recordId);
        } else  if (Sharing.TokenCat.Allocated == _sitCat) {
            require(!self.mAllocations[_holder][_recordId].isWithdrawn, MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.NOTALLOWED_ERROR)));
            self.mAllocations[_holder][_recordId].isMovedToTradable = true;
            self.mBalances[_holder] = self.mBalances[_holder].add(self.mAllocations[_holder][_recordId].amount);
            emit MovedToTradable(_holder,_sitCat, _recordId);
        } 
        success = MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.SUCCESS));
    }
    
    function addShareholder(Sharing.DataToken storage self, address _holder, bool _isEnabled, bool _isWithhold) internal returns(string memory success) { 
        require(!self.shareHolders[_holder].uniqueHolder, MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.UNIQUENESS_ERROR)));
        Sharing.SitBalanceByCat memory _holderBalance = Sharing.SitBalanceByCat(0, 0, 0);
        self.shareHolders[_holder] = Sharing.SitHolder(true, _isEnabled,_isWithhold, _holderBalance);
        emit NewShareholder(_holder);
        return MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.SUCCESS));
    }
    
    function getShareHolder(Sharing.DataToken storage self, address _holder) internal view returns(bool isEnabled, bool isWithhold, uint tradable, uint allocated, uint vesting, uint lien ) { 
        return (self.shareHolders[_holder].isEnabled, self.shareHolders[_holder].isWithhold, self.mBalances[_holder], self.shareHolders[_holder].sitBalances.allocated, self.shareHolders[_holder].sitBalances.vesting, self.shareHolders[_holder].sitBalances.lien);
    }

    function updateShareHolder(Sharing.DataToken storage self, address _holder, bool _isEnabled, bool _isWithhold) internal returns(string memory success) { 

        self.shareHolders[_holder].isEnabled = _isEnabled;
        self.shareHolders[_holder].isWithhold = _isWithhold;           
        emit shareHolderUpdated(_holder, _isEnabled, _isWithhold);
        return MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.SUCCESS));
    }
    
    function removeShareHolder(Sharing.DataToken storage self, address _holder, bool _isEnabled, bool _isWithhold) internal returns(string memory success) { 
        delete self.shareHolders[_holder];
        emit shareHolderRemoved(_holder);
        return  MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.SUCCESS));
    }
    
    function withdraw(Sharing.DataToken storage self, uint8 _granularity, address _coinBase, address _holder, uint256 _amount, Sharing.TokenCat _sitCat, uint _recordId, bytes memory _reason) internal returns (string memory success) {
 
        require(_amount % _granularity == 0, MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.TOKEN_GRANULARITY_ERROR)));
        if (Sharing.TokenCat.Lien == _sitCat) {
            require(!self.mLiens[_holder][_recordId].isMovedToTradable, MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.NOTALLOWED_ERROR)));
            self.mLiens[_holder][_recordId].amount = 0;
            self.mLiens[_holder][_recordId].isWithdrawn = true;
            self.shareHolders[_holder].sitBalances.lien = self.shareHolders[_holder].sitBalances.lien.sub(_amount);
        } else  if (Sharing.TokenCat.Vesting == _sitCat) {
            require(!self.mVestings[_holder][_recordId].isMovedToTradable, MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.NOTALLOWED_ERROR)));
            self.mVestings[_holder][_recordId].amount = 0;
            self.mVestings[_holder][_recordId].isWithdrawn = true;
            self.shareHolders[_holder].sitBalances.vesting = self.shareHolders[_holder].sitBalances.vesting.sub(_amount);
        } else if (Sharing.TokenCat.Allocated == _sitCat) {
            require(!self.mAllocations[_holder][_recordId].isMovedToTradable, MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.NOTALLOWED_ERROR)));
            self.mAllocations[_holder][_recordId].amount = 0;
            self.mAllocations[_holder][_recordId].isWithdrawn = true;
            self.shareHolders[_holder].sitBalances.allocated = self.shareHolders[_holder].sitBalances.allocated.sub(_amount);
        } else if (Sharing.TokenCat.Tradable == _sitCat) {
            if(balanceOf(self, _holder) < _amount){
                return MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.INSUFFICIENT_FUND_ERROR));
            }
            self.mBalances[_holder] = self.mBalances[_holder].sub(_amount);
        }
        
        self.mBalances[_coinBase] = self.mBalances[_coinBase].add(_amount);
        emit Withdrawn(msg.sender, _holder, _sitCat, _amount, _reason);
        return MessagesAndCodes.appCode(uint8(MessagesAndCodes.Reason.SUCCESS));
    }
}
