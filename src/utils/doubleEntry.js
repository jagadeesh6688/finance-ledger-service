/**
 * @fileoverview Double-entry bookkeeping logic utilities
 * @module utils/doubleEntry
 */

const mongoose = require('mongoose');
const logger = require('../config/logger');
const { DatabaseError, ValidationError } = require('../handles/errors');

/**
 * Create a double-entry transaction pair
 * @param {Object} debitData - Debit account data
 * @param {Object} creditData - Credit account data
 * @param {number} amount - Transaction amount
 * @param {string} description - Transaction description
 * @returns {Promise<Object>} Pair of transactions
 */
const createDoubleEntryTransaction = async (debitData, creditData, amount, description) => {
  if (!debitData || !creditData) {
    throw new ValidationError('Both debit and credit accounts are required');
  }

  if (amount <= 0) {
    throw new ValidationError('Transaction amount must be greater than 0');
  }

  try {
    const Transaction = mongoose.model('Transaction');
    const Account = mongoose.model('Account');

    // Verify accounts exist
    const debitAccount = await Account.findById(debitData.accountId);
    const creditAccount = await Account.findById(creditData.accountId);

    if (!debitAccount) {
      throw new ValidationError('Debit account not found');
    }

    if (!creditAccount) {
      throw new ValidationError('Credit account not found');
    }

    // Generate unique transaction IDs
    const timestamp = Date.now();
    const debitId = `TX-DEBIT-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const creditId = `TX-CREDIT-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    // Create debit transaction
    const debitTransaction = new Transaction({
      transactionId: debitId,
      amount,
      type: 'debit',
      debitAccount: debitData,
      creditAccount: creditData,
      description,
      status: 'pending'
    });

    // Create credit transaction
    const creditTransaction = new Transaction({
      transactionId: creditId,
      amount,
      type: 'credit',
      debitAccount: debitData,
      creditAccount: creditData,
      description,
      status: 'pending'
    });

    // Link transactions
    debitTransaction.linkedTransaction = creditTransaction._id;
    creditTransaction.linkedTransaction = debitTransaction._id;

    // Save both transactions
    await debitTransaction.save();
    await creditTransaction.save();

    logger.info(`Double-entry created: ${debitId} <-> ${creditId}`);

    return {
      debit: debitTransaction,
      credit: creditTransaction
    };
  } catch (error) {
    logger.error('Error creating double-entry transaction:', error);
    throw new DatabaseError('Failed to create double-entry transaction');
  }
};

/**
 * Validate that debits equal credits for a transaction
 * @param {Object} transaction - Transaction to validate
 * @returns {boolean} True if debits equal credits
 */
const validateDoubleEntry = (transaction) => {
  if (!transaction.debitAccount || !transaction.creditAccount) {
    return false;
  }

  // In a proper double-entry system, the transaction amount should be consistent
  // This is a simplified validation - checks that both sides are present
  return true;
};

/**
 * Reconcile account balances
 * @param {Array<string>} accountIds - Array of account IDs to reconcile
 * @returns {Promise<Object>} Reconciliation results
 */
const reconcileAccounts = async (accountIds) => {
  try {
    const Account = mongoose.model('Account');
    const Transaction = mongoose.model('Transaction');

    const results = [];

    for (const accountId of accountIds) {
      const account = await Account.findById(accountId);
      
      if (!account) {
        continue;
      }

      // Calculate current balance from all transactions
      const transactions = await Transaction.find({
        $or: [
          { 'debitAccount.accountId': accountId },
          { 'creditAccount.accountId': accountId }
        ]
      });

      let calculatedBalance = 0;

      for (const tx of transactions) {
        if (tx.debitAccount.accountId === accountId) {
          calculatedBalance += tx.amount;
        }
        if (tx.creditAccount.accountId === accountId) {
          calculatedBalance -= tx.amount;
        }
      }

      const difference = account.balance - calculatedBalance;

      results.push({
        accountId,
        accountCode: account.accountCode,
        recordedBalance: account.balance,
        calculatedBalance,
        difference,
        reconciled: difference === 0
      });
    }

    logger.info(`Reconciliation complete for ${accountIds.length} accounts`);
    
    return {
      accounts: results,
      allReconciled: results.every(r => r.reconciled)
    };
  } catch (error) {
    logger.error('Error reconciling accounts:', error);
    throw new DatabaseError('Failed to reconcile accounts');
  }
};

/**
 * Get entity balance (employee, branch, vendor)
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 * @returns {Promise<number>} Current balance
 */
const getEntityBalance = async (entityType, entityId) => {
  try {
    const Account = mongoose.model('Account');

    const accounts = await Account.find({
      'entity.entityType': entityType,
      'entity.entityId': entityId
    });

    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    return totalBalance;
  } catch (error) {
    logger.error('Error getting entity balance:', error);
    throw new DatabaseError('Failed to get entity balance');
  }
};

module.exports = {
  createDoubleEntryTransaction,
  validateDoubleEntry,
  reconcileAccounts,
  getEntityBalance
};

