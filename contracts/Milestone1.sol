//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract Milestone1 is IERC20 {
    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;

    uint256 private _currentPrice;

    uint256 private immutable _duration;
    uint8 private immutable _minStartAuctionCapitalShare;

    uint256 private _votingNumber;
    uint256 private _votingPrice;
    uint256 private _endAuction;
    address[] _betAddreses;
    mapping(uint256 => mapping(address => int8)) _bets;

    constructor(uint256 initialAmount, uint256 duration, uint8 minStartAuctionCapitalShare, uint256 initPrice) {
        _mint(address(this), initialAmount);
        _minStartAuctionCapitalShare = minStartAuctionCapitalShare;
        _duration = duration;
        _currentPrice = initPrice;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        address owner = msg.sender;

        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = msg.sender;

        uint256 currentAllowance = allowance(from, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                uint256 newAmount = currentAllowance - amount;
                _allowances[from][spender] = newAmount;
                emit Approval(from, spender, newAmount);
            }
        }

        _transfer(from, to, amount);

        return true;
    }

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
        }
        _totalSupply -= amount;

        emit Transfer(account, address(0), amount);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
        }
        _balances[to] += amount;

        emit Transfer(from, to, amount);
    }

    function buy() external payable {
        uint256 amount = msg.value / _currentPrice;

        _transfer(address(this), msg.sender, amount);

        emit Buy(msg.sender, msg.value, amount);
    }

    function sell(uint256 amount) external {
        uint256 ethAmount = amount * _currentPrice;
        uint256 bankEthBalance = address(this).balance;
        require(bankEthBalance >= ethAmount, "Contract has not enought ETH");

        _transfer(msg.sender, address(this), amount);

        payable(msg.sender).transfer(ethAmount);

        emit Sell(msg.sender, amount, ethAmount);
    }

    function startVoting(uint256 votingPrice_) external {
        require(_votingPrice == 0, "Can not start voting before end previous");
        require(_balances[msg.sender] >= (_minStartAuctionCapitalShare / 100) * _totalSupply, "Not enought balance for starting voting");
        _votingNumber++;
        _votingPrice = votingPrice_;
        _endAuction = block.timestamp + _duration;

        emit StartVoting(_votingNumber, _votingPrice);
    }

    function vote(bool accept) external {
        require(_votingPrice != 0, "No active voting");
        require(block.timestamp < _endAuction, "Voting is over");
        require(_bets[_votingNumber][msg.sender] == 0, "Already voted");
        if (accept) {
            _bets[_votingNumber][msg.sender] = 1;
        } else {
            _bets[_votingNumber][msg.sender] = -1;
        }
        _betAddreses.push(msg.sender);
    }

    function endVoting() external {
        require(_balances[msg.sender] >= (_minStartAuctionCapitalShare / 100) * _totalSupply, "Not enought balance for ending voting");
        require(block.timestamp > _endAuction && _votingPrice > 0, "Voting is not over yet");

        uint256 acceptVotes = 0;
        uint256 declineVotes = 0;

        for (uint256 i = 0; i < _betAddreses.length; i++) {
            address better = _betAddreses[i];
            uint256 betAmount = _balances[better];
            int8 bet = _bets[_votingNumber][better];
            if (bet == 1) {
                acceptVotes += betAmount;
            } else if (bet == -1) {
                declineVotes += betAmount;
            }
        }

        if (acceptVotes > declineVotes) {
            _currentPrice = _votingPrice;
        }

        emit EndVoting(_votingNumber, _votingPrice, acceptVotes, declineVotes);

        delete _betAddreses;
        _votingPrice = 0;
    }

    function votingPrice() external view returns(uint256) {
        return _votingPrice;
    }

    function currentPrice() external view returns(uint256) {
        return _currentPrice;
    }

    event Buy(address indexed buyer, uint256 ethValue, uint256 tokenValue);

    event Sell(address indexed seller, uint256 tokenValue, uint256 ethValue);

    event StartVoting(uint256 indexed votingNumber, uint256 votingPrice);

    event EndVoting(uint256 indexed votingNumber, uint256 votingPrice, uint256 acceptVotes, uint256 declineVotes);
}