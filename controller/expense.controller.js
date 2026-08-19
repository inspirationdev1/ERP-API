require("dotenv").config();
const mongoose = require("mongoose");
const Expense = require("../model/expense.model");
const Expensedetail = require("../model/expensedetail.model");
const paymentdetailModel = require("../model/paymentdetail.model");
const Accounttransaction = require("../model/accounttransaction.model");
const Accountsetup = require("../model/accountsetup.model");

const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("../controller/numberseq.controller");

module.exports = {
  getAllExpenses: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allExpense = await Expense.find({ company: companyId }).sort({
        createdAt: -1,
      });
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Expense",
        data: allExpense,
      });
    } catch (error) {
      console.log("Error in getAllExpense", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Expense. Try later",
      });
    }
  },
  getExpenseWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const result = await Expense.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            company: new mongoose.Types.ObjectId(companyId),
          },
        },
        // 🧑‍💼 EMPLOYEE POPULATE
        {
          $lookup: {
            from: "employees",
            localField: "employee",
            foreignField: "_id",
            as: "employee",
          },
        },
        {
          $unwind: {
            path: "$employee",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "expensedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "expenseId",
            as: "expenseDetails",
          },
        },

        {
          $lookup: {
            from: "expensetypes",
            localField: "expenseDetails.expensetype",
            foreignField: "_id",
            as: "expenseTypeData",
          },
        },
        {
          $addFields: {
            expenseDetails: {
              $map: {
                input: "$expenseDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      expensetype: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$expenseTypeData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.expensetype"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            expenseTypeData: 0, // cleanup
          },
        },
        {
          $lookup: {
            from: "expensetypes",
            localField: "expenseDetails.expensetype",
            foreignField: "_id",
            as: "expenseTypeData",
          },
        },
        {
          $addFields: {
            expenseDetails: {
              $map: {
                input: "$expenseDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      expensetype: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$expenseTypeData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.expensetype"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            expenseTypeData: 0, // cleanup
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Expense not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains expense + expenseDetails[]
      });
    } catch (e) {
      console.error("Error in getExpenseWithId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Expense",
      });
    }
  },
  createExpense: async (req, res) => {
    try {
      const companyId = req.user.companyId;

      //***Number seq */
      const numberseqData = await getNumberseqWithScreenId({
        screen_id: "expense",
        companyId: req.user.companyId,
      });
      console.log("numberseqData.data", numberseqData);
      let seq = 1;
      let code = "";
      if (numberseqData) {
        seq = numberseqData.seq || 1;
        code = numberseqData.code || "";
      }
      //****** */

      // 2️⃣ Map expenseDetails
      const expDetail = req.body.expenseDetails || [];
      let expenseDetails = expDetail.map((item) => ({
        ...item,
        company: companyId,
      }));

      // *****Start Check Accounts Integration******
      const isDrCrEqual = await check_accounttransaction(expenseDetails);
      if (!isDrCrEqual) {
        res.status(200).json({
          success: false,
          message: "Expense not Integrated",
          data: req?.body,
        });
      }

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      // 1️⃣ Save expense
      const newExpense = new Expense({
        ...req.body,
        company: companyId,
        expenseCode: code,
        seq: seq,
        acctrans: acctrans,
      });

      const savedData = await newExpense.save();

      // 2️⃣ Map expenseDetails
      //   const expDetail = req.body.expenseDetails || [];
      const expId = savedData._id || null;
      expenseDetails = expenseDetails.map((item) => ({
        ...item,
        company: companyId,
        expenseId: expId,
      }));

      // 3️⃣ Save expenseDetails
      if (expenseDetails.length > 0) {
        await Expensedetail.insertMany(expenseDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.expenseCode || "",
          doc_name: "expense",
          doc_date: savedData?.expenseDate || "",
          doc_id: expId || "",
          employee: savedData?.employee || null,
          company: savedData?.company || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******
      }

      // ****Update Number Seq****
      const numberseqAfterUpdate = await updateNumberseqWithScreenId({
        screen_id: "expense",
        companyId: req.user.companyId,
      });
      console.log("numberseqAfterUpdate", numberseqAfterUpdate);
      // *********************

      // 4️⃣ Response
      res.status(200).json({
        success: true,
        data: savedData,
        message: "Expense is Created Successfully.",
      });
    } catch (e) {
      console.error("Error creating expense:", e);
      res.status(500).json({
        success: false,
        message: "Failed Creation of Expense.",
      });
    }
  },
  updateExpenseWithId: async (req, res) => {
    // Not providing the  companyId as expense Id will be unique.
    try {
      const companyId = req.user.companyId;

      let id = req.params.id;
      console.log(req.body);

      // 2️⃣ Map expenseDetails
      const expDetail = req.body.expenseDetails || [];
      const expId = id || null;
      let expenseDetails = expDetail.map((item) => ({
        ...item,
        company: companyId,
        expenseId: expId,
        employee: req.body?.employee || null,
      }));
      // *****Start Check Accounts Integration******
      const isDrCrEqual = await check_accounttransaction(expenseDetails);
      if (!isDrCrEqual) {
        res.status(200).json({
          success: false,
          message: "Expense not Integrated",
          data: req?.body,
        });
      }

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      const savedData = await Expense.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body, acctrans: acctrans } },
        { new: true, runValidators: true },
      );
      //   await Expense.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });

      // 3️⃣ Save expense details
      if (expenseDetails.length > 0) {
        await Expensedetail.deleteMany({
          expenseId: expId,
          company: companyId,
        });

        await Expensedetail.insertMany(expenseDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.expenseCode || "",
          doc_name: "expense",
          doc_date: savedData?.expenseDate || "",
          doc_id: expId || "",
          employee: savedData?.employee || null,
          company: savedData?.company || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******

        const ExpenseAfterUpdate = await Expense.findOne({ _id: id });
        res.status(200).json({
          success: true,
          message: "Expense Updated",
          isIntegrated: isIntegrated?.success || false,
          data: ExpenseAfterUpdate,
        });
      }
    } catch (error) {
      console.log("Error in updateExpenseWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Expense. Try later",
      });
    }
  },
  deleteExpenseWithId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;

      await Expense.findOneAndUpdate(
        { _id: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      await Expensedetail.updateMany(
        { expenseId: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      // await Expense.findOneAndDelete({ _id: id, company: companyId });
      const ExpenseAfterDelete = await Expense.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Expense Deleted.",
        data: ExpenseAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateExpenseWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Expense. Try later",
      });
    }
  },
  getExpenseWithEmployeeId: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const filterQuery = {};
      filterQuery["company"] = new mongoose.Types.ObjectId(companyId);

      if (req.query.hasOwnProperty("employee")) {
        const employeeId = req.query.employee;
        filterQuery["employee"] = new mongoose.Types.ObjectId(employeeId);
      }
      filterQuery["status"] = "valid";

      var result = await Expense.aggregate([
        {
          $match: filterQuery,
        },

        {
          $lookup: {
            from: "expensedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "expenseId",
            as: "expenseDetails",
          },
        },
        // 🔹 SUM grossAmount
        {
          $addFields: {
            totalExpenseAmount: {
              $sum: "$expenseDetails.expenseAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Expense not found",
        });
      }

      if (result.length > 0) {
        const paymentDetails = await paymentdetailModel.aggregate([
          { $match: filterQuery },
          {
            $group: {
              _id: "$expenseId",
              expenseCode: { $first: "$expenseCode" },
              totalPaidAmount: { $sum: "$paidAmount" },
              expenseDetails: { $push: "$$ROOT" },
            },
          },
        ]);
        if (paymentDetails.length > 0) {
          console.log("paymentDetails:", paymentDetails);
          for (const item of result) {
            console.log("SI ID:", item._id);
            console.log("Invoice Code:", item.expenseCode);
            const expenseId = item._id;
            const filtered = paymentDetails.filter(
              (row) => row._id.toString() === expenseId.toString(),
            );
            console.log("filtered:", filtered);
            if (filtered.length > 0) {
              item.totalPaidAmount = filtered[0].totalPaidAmount || 0;
            } else {
              item.totalPaidAmount = 0;
            }
            item.balanceAmount = item.totalExpenseAmount - item.totalPaidAmount;
          }
          result = result.filter((row) => row.balanceAmount > 0);
          console.log("result:", result);
        }
      }

      res.status(200).json({
        success: true,
        data: result, // contains invoice + expenseDetails[]
      });
    } catch (e) {
      console.error("Error in getExpenseWithEmployeeId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Expense",
      });
    }
  },
  getExpensePrint: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const result = await Expense.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            company: new mongoose.Types.ObjectId(companyId),
          },
        },
        // 🔹 Populate company
        {
          $lookup: {
            from: "companys", // collection name
            localField: "company",
            foreignField: "_id",
            as: "company",
          },
        },
        {
          $unwind: "$company", // convert array → object
        },

        // 🧑‍💼 EMPLOYEE POPULATE
        {
          $lookup: {
            from: "employees",
            localField: "employee",
            foreignField: "_id",
            as: "employee",
          },
        },
        {
          $unwind: {
            path: "$employee",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "expensedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "expenseId",
            as: "expenseDetails",
          },
        },
        {
          $lookup: {
            from: "expensetypes",
            localField: "expenseDetails.expensetype",
            foreignField: "_id",
            as: "expenseTypeData",
          },
        },
        {
          $addFields: {
            expenseDetails: {
              $map: {
                input: "$expenseDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      expensetype: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$expenseTypeData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.expensetype"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            expenseTypeData: 0, // cleanup
          },
        },

        // 🔹 SUM expenseAmount
        {
          $addFields: {
            totalexpenseAmount: {
              $sum: "$expenseDetails.expenseAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Expense not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains expense + expenseDetails[]
      });
    } catch (e) {
      console.error("Error in getExpensePrint", e);
      res.status(500).json({
        success: false,
        message: "Error fetching getExpensePrint",
      });
    }
  },
};

const check_accounttransaction = async (transDetails) => {
  try {
    // 3️⃣ Save Accounttransactions
    if (transDetails.length > 0) {
      const accountsetupData = await Accountsetup.find({
        company: transDetails[0]?.company,
        screen: "expense",
      })
        .populate("accountledger")
        .lean();

      //   const totals = transDetails.reduce(
      //     (acc, item) => {
      //       acc.netAmount += item.expenseAmount || 0;
      //       return acc;
      //     },
      //     {
      //       netAmount: 0,
      //     },
      //   );
      const totals = transDetails.reduce(
        (acc, item) => {
          acc.taxable_amount += item?.taxable_amount || 0;
          acc.tax_amount += item?.tax_amount || 0;
          acc.netAmount += item?.expenseAmount || 0;
          return acc;
        },
        {
          taxable_amount: 0,
          tax_amount: 0,
          netAmount: 0,
        },
      );

      const accountTransactions = [];
      const taxCount = accountsetupData.filter(
        (item) => item.mapping_type === "tax_amount",
      ).length;

      let seq = 0;
      for (const item of accountsetupData) {
        if (item?.mapping_type === "net_amount" && totals?.netAmount > 0) {
          seq++;
          accountTransactions.push({
            amount: totals?.netAmount || 0,
            amount_type: item?.amount_type || "",
            mapping_type: item?.mapping_type || "",
            seq: seq,
            account_type: item?.accountledger?.account_type || "",
            accountledger: item?.accountledger?._id || null,
            accountledger_code: item?.accountledger?.accountledger_code || "",
            accountledger_name: item?.accountledger?.accountledger_name || "",
          });
        } else if (
          item?.mapping_type === "taxable_amount" &&
          totals?.taxable_amount > 0
        ) {
          seq++;
          accountTransactions.push({
            amount: totals?.taxable_amount || 0,
            amount_type: item?.amount_type || "",
            mapping_type: item?.mapping_type || "",
            seq: seq,
            account_type: item?.accountledger?.account_type || "",
            accountledger: item?.accountledger?._id || null,
            accountledger_code: item?.accountledger?.accountledger_code || "",
            accountledger_name: item?.accountledger?.accountledger_name || "",
          });
        } else if (
          item?.mapping_type === "tax_amount" &&
          totals?.tax_amount > 0
        ) {
          let tax_amount = totals?.tax_amount || 0;
          if (taxCount > 1) {
            tax_amount = (totals?.tax_amount || 0) / taxCount;
          }

          seq++;
          accountTransactions.push({
            amount: tax_amount || 0,
            amount_type: item?.amount_type || "",
            mapping_type: item?.mapping_type || "",
            seq: seq,
            account_type: item?.accountledger?.account_type || "",
            accountledger: item?.accountledger?._id || null,
            accountledger_code: item?.accountledger?.accountledger_code || "",
            accountledger_name: item?.accountledger?.accountledger_name || "",
          });
        }
      }

      const totals_DR_CR = accountTransactions.reduce(
        (acc, item) => {
          if (item.amount_type === "dr") {
            acc.totalDebit += item.amount || 0;
          }

          if (item.amount_type === "cr") {
            acc.totalCredit += item.amount || 0;
          }

          return acc;
        },
        {
          totalDebit: 0,
          totalCredit: 0,
        },
      );

      console.log("Total Debit:", totals_DR_CR.totalDebit);
      console.log("Total Credit:", totals_DR_CR.totalCredit);
      if (totals_DR_CR.totalDebit === totals_DR_CR.totalCredit) {
        return {
          message: "Accounts Transaction saved Successfully",
          totalDebit: totals_DR_CR.totalDebit,
          totalCredit: totals_DR_CR.totalCredit,
          accountTransactions: accountTransactions,
          success: true,
        };
      } else {
        return {
          message:
            "Accounts Transaction Not saved, check Total Debit = " +
            totals_DR_CR.totalDebit +
            " And Total Credit = " +
            totals_DR_CR.totalCredit,
          totalDebit: totals_DR_CR.totalDebit,
          totalCredit: totals_DR_CR.totalCredit,
          accountTransactions: accountTransactions,
          success: false,
        };
      }
    }
  } catch (error) {
    return {
      message: error.message,
      totalDebit: totals_DR_CR.totalDebit,
      totalCredit: totals_DR_CR.totalCredit,
      accountTransactions: [],
      success: false,
    };
  }
};

const integrate_accounttransaction = async (accountTransactions) => {
  try {
    // 3️⃣ Save Accounttransactions
    if (accountTransactions.length > 0) {
      const deletData = await Accounttransaction.deleteMany({
        doc_id: accountTransactions[0]?.doc_id,
        company: accountTransactions[0]?.company,
      });
      console.log("deletData", deletData);

      await Accounttransaction.insertMany(accountTransactions);
      return { message: "Integration successfull", success: true };
    }
  } catch (error) {
    return { message: error.message, success: false };
  }
};
