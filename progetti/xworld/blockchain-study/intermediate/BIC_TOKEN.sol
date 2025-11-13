// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title BICToken
 * @dev Token ERC-20 per l'ecosistema X World
 *
 * Features:
 * - Supply iniziale: 100,000,000 BIC
 * - Minting controllato (solo contratti autorizzati)
 * - Burnable quando usati per utility
 * - Transfer tax: 1% va a treasury
 * - Pausable per emergenze
 * - Role-based access control
 *
 * Roles:
 * - MINTER_ROLE: Può mintare nuovi token (staking contracts)
 * - BURNER_ROLE: Può bruciare token (utility contracts)
 * - PAUSER_ROLE: Può pausare il contratto
 */
contract BICToken is ERC20, ERC20Burnable, AccessControl, Pausable {

    // ============ Constants ============

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100M BIC
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B BIC max

    // Transfer tax (in basis points, 100 = 1%)
    uint256 public transferTaxBPS = 100; // 1%
    uint256 public constant MAX_TAX_BPS = 500; // Max 5%

    // ============ State Variables ============

    address public treasuryWallet;

    // Whitelist per evitare tasse (staking contracts, liquidity pools)
    mapping(address => bool) public taxExempt;

    // Tracking
    uint256 public totalTaxCollected;

    // ============ Events ============

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event TaxRateUpdated(uint256 oldRate, uint256 newRate);
    event TaxExemptionUpdated(address indexed account, bool exempt);
    event TaxCollected(address indexed from, address indexed to, uint256 amount);

    // ============ Constructor ============

    constructor(address _treasuryWallet) ERC20("BIC Token", "BIC") {
        require(_treasuryWallet != address(0), "Invalid treasury address");

        treasuryWallet = _treasuryWallet;

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        // Mint initial supply to deployer
        _mint(msg.sender, INITIAL_SUPPLY);

        // Treasury è tax exempt
        taxExempt[treasuryWallet] = true;
        taxExempt[msg.sender] = true;
    }

    // ============ Transfer with Tax ============

    /**
     * @dev Transfer con tassa dell'1% che va alla treasury
     * Esentati: treasury, contratti whitelisted, trasferimenti da/a 0x0
     */
    function _update(address from, address to, uint256 amount)
        internal
        override
        whenNotPaused
    {
        // Se è mint o burn, skip tax
        if (from == address(0) || to == address(0)) {
            super._update(from, to, amount);
            return;
        }

        // Se uno dei due è tax exempt, skip tax
        if (taxExempt[from] || taxExempt[to]) {
            super._update(from, to, amount);
            return;
        }

        // Calcola tax
        uint256 taxAmount = (amount * transferTaxBPS) / 10000;
        uint256 amountAfterTax = amount - taxAmount;

        // Transfer amount - tax
        super._update(from, to, amountAfterTax);

        // Transfer tax to treasury
        if (taxAmount > 0) {
            super._update(from, treasuryWallet, taxAmount);
            totalTaxCollected += taxAmount;
            emit TaxCollected(from, to, taxAmount);
        }
    }

    // ============ Minting & Burning ============

    /**
     * @dev Mint nuovi token (solo MINTER_ROLE)
     * Usato da staking contracts per rewards
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }

    /**
     * @dev Burn token di un utente (solo BURNER_ROLE)
     * Usato quando BIC vengono spesi per utility
     */
    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        super.burnFrom(account, amount);
    }

    // ============ Admin Functions ============

    /**
     * @dev Update treasury wallet
     */
    function setTreasuryWallet(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Invalid address");
        address oldTreasury = treasuryWallet;

        // Remove old treasury from exempt
        taxExempt[oldTreasury] = false;

        // Set new treasury
        treasuryWallet = newTreasury;
        taxExempt[newTreasury] = true;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Update transfer tax rate
     */
    function setTransferTaxBPS(uint256 newTaxBPS) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTaxBPS <= MAX_TAX_BPS, "Tax rate too high");
        uint256 oldRate = transferTaxBPS;
        transferTaxBPS = newTaxBPS;
        emit TaxRateUpdated(oldRate, newTaxBPS);
    }

    /**
     * @dev Add/remove address from tax exemption
     */
    function setTaxExempt(address account, bool exempt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Invalid address");
        taxExempt[account] = exempt;
        emit TaxExemptionUpdated(account, exempt);
    }

    /**
     * @dev Batch set tax exempt (per liquidità pools, staking, etc)
     */
    function batchSetTaxExempt(address[] calldata accounts, bool exempt)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "Invalid address");
            taxExempt[accounts[i]] = exempt;
            emit TaxExemptionUpdated(accounts[i], exempt);
        }
    }

    /**
     * @dev Pause token transfers (emergenza)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @dev Calculate tax for a transfer
     */
    function calculateTax(address from, address to, uint256 amount)
        external
        view
        returns (uint256 taxAmount, uint256 amountAfterTax)
    {
        if (from == address(0) || to == address(0) || taxExempt[from] || taxExempt[to]) {
            return (0, amount);
        }

        taxAmount = (amount * transferTaxBPS) / 10000;
        amountAfterTax = amount - taxAmount;
    }

    /**
     * @dev Check if address is tax exempt
     */
    function isTaxExempt(address account) external view returns (bool) {
        return taxExempt[account];
    }
}
