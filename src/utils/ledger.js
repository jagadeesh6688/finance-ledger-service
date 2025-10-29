/**
 * @fileoverview Ledger and balance calculation utilities
 * @module utils/ledger
 */

const mongoose = require("mongoose");
const logger = require("../config/logger");
const { DatabaseError, ValidationError } = require("../handles/errors");

/**
 * Calculate entity ledger (employee, branch, vendor, organization)
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Ledger entries
 */
const calculateEntityLedger = async (
  entityType,
  entityId,
  startDate,
  endDate
) => {
  if (!entityType || !entityId) {
    throw new ValidationError("Entity type and ID are required");
  }

  if (!startDate || !endDate) {
    throw new ValidationError("Start and end dates are required");
  }

  try {
    const Transaction = mongoose.model("Transaction");

    // Find all transactions for this entity
    const transactions = await Transaction.find({
      "reference.refType": entityType,
      "reference.refId": new mongoose.Types.ObjectId(entityId),
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: -1 });

    return transactions;
  } catch (error) {
    logger.error("Error calculating entity ledger:", error);
    throw new DatabaseError("Failed to calculate ledger");
  }
};

/**
 * Calculate running balance from transactions
 * @param {Array} transactions - Array of transactions
 * @returns {Array} Transactions with running balance
 */
const calculateRunningBalance = (transactions) => {
  let runningBalance = 0;

  return transactions.map((transaction) => {
    // Adjust balance based on transaction type
    if (transaction.type === "debit" || transaction.type === "purchase") {
      runningBalance += transaction.amount;
    } else if (transaction.type === "credit" || transaction.type === "refund") {
      runningBalance -= transaction.amount;
    }

    return {
      ...transaction.toObject(),
      runningBalance,
    };
  });
};

/**
 * Aggregate transactions by period
 * @param {Array} transactions - Array of transactions
 * @param {string} period - 'day', 'week', or 'month'
 * @returns {Object} Aggregated data
 */
const aggregateByPeriod = (transactions, period = "day") => {
  const aggregated = {};

  transactions.forEach((transaction) => {
    const date = new Date(transaction.createdAt);
    let key;

    switch (period) {
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        break;
      default:
        key = date.toISOString().split("T")[0];
    }

    if (!aggregated[key]) {
      aggregated[key] = {
        date: key,
        totalAmount: 0,
        count: 0,
        transactions: [],
      };
    }

    aggregated[key].totalAmount += transaction.amount;
    aggregated[key].count += 1;
    aggregated[key].transactions.push(transaction);
  });

  return Object.values(aggregated).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
};

/**
 * Generate balance sheet for organization
 * @param {string} orgId - Organization ID
 * @param {Date} date - As of date
 * @returns {Promise<Object>} Balance sheet data
 */
const generateBalanceSheet = async (orgId, date) => {
  try {
    const Account = mongoose.model("Account");

    // Get all asset accounts
    const assets = await Account.find({
      accountType: "asset",
      "entity.entityType": "organization",
      "entity.entityId": new mongoose.Types.ObjectId(orgId),
    });

    // Get all liability accounts
    const liabilities = await Account.find({
      accountType: "liability",
      "entity.entityType": "organization",
      "entity.entityId": new mongoose.Types.ObjectId(orgId),
    });

    // Get all equity accounts
    const equity = await Account.find({
      accountType: "equity",
      "entity.entityType": "organization",
      "entity.entityId": new mongoose.Types.ObjectId(orgId),
    });

    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce(
      (sum, acc) => sum + acc.balance,
      0
    );
    const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

    const balanceSheet = {
      asOfDate: date,
      assets: {
        accounts: assets,
        total: totalAssets,
      },
      liabilities: {
        accounts: liabilities,
        total: totalLiabilities,
      },
      equity: {
        accounts: equity,
        total: totalEquity,
      },
      balance: totalAssets === totalLiabilities + totalEquity,
    };

    logger.info(`Balance sheet generated for org ${orgId} on ${date}`);

    return balanceSheet;
  } catch (error) {
    logger.error("Error generating balance sheet:", error);
    throw new DatabaseError("Failed to generate balance sheet");
  }
};

/**
 * Calculate income statement (profit/loss)
 * @param {string} orgId - Organization ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Income statement data
 */
const generateIncomeStatement = async (orgId, startDate, endDate) => {
  try {
    const Account = mongoose.model("Account");
    const Transaction = mongoose.model("Transaction");

    // Get revenue accounts
    const revenueAccounts = await Account.find({
      accountType: "revenue",
      "entity.entityType": "organization",
      "entity.entityId": new mongoose.Types.ObjectId(orgId),
    });

    // Get expense accounts
    const expenseAccounts = await Account.find({
      accountType: "expense",
      "entity.entityType": "organization",
      "entity.entityId": new mongoose.Types.ObjectId(orgId),
    });

    // Calculate revenue
    const revenue = revenueAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Calculate expenses
    const expenses = expenseAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    const incomeStatement = {
      period: { startDate, endDate },
      revenue: {
        accounts: revenueAccounts,
        total: revenue,
      },
      expenses: {
        accounts: expenseAccounts,
        total: expenses,
      },
      netIncome: revenue - expenses,
    };

    logger.info(`Income statement generated for org ${orgId}`);

    return incomeStatement;
  } catch (error) {
    logger.error("Error generating income statement:", error);
    throw new DatabaseError("Failed to generate income statement");
  }
};

module.exports = {
  calculateEntityLedger,
  calculateRunningBalance,
  aggregateByPeriod,
  generateBalanceSheet,
  generateIncomeStatement,
};
