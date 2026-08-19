require("dotenv").config();
const mongoose = require("mongoose");
const Payment = require("../model/supplierpayment.model");
const Paymentdetail = require("../model/supplierpaymentdetail.model");
const Accounttransaction = require("../model/accounttransaction.model");
const Accountsetup = require("../model/accountsetup.model");

const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("./numberseq.controller");

module.exports = {
  getAllPayments: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allPayment = await Payment.find({ company: companyId }).sort({
        createdAt: -1,
      });
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Payment",
        data: allPayment,
      });
    } catch (error) {
      console.log("Error in getAllPayment", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Payment. Try later",
      });
    }
  },
  getPaymentWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const result = await Payment.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            company: new mongoose.Types.ObjectId(companyId),
          },
        },

        {
          $lookup: {
            from: "supplierpaymentdetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "paymentId",
            as: "paymentDetails",
          },
        },

        {
          $lookup: {
            from: "purchaseinvoices",
            localField: "paymentDetails.piId",
            foreignField: "_id",
            as: "purchaseinvoiceData",
          },
        },
        {
          $addFields: {
            paymentDetails: {
              $map: {
                input: "$paymentDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      piId: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$purchaseinvoiceData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.piId"],
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
            purchaseinvoiceData: 0, // cleanup
          },
        },
        {
          $lookup: {
            from: "suppliers",
            localField: "paymentDetails.supplier",
            foreignField: "_id",
            as: "supplierData",
          },
        },
        {
          $addFields: {
            paymentDetails: {
              $map: {
                input: "$paymentDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      supplier: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$supplierData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.supplier"],
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
            supplierData: 0, // cleanup
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains payment + paymentDetails[]
      });
    } catch (e) {
      console.error("Error in getPaymentWithId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Payment",
      });
    }
  },
  createPayment: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      //***Number seq */
      const numberseqData = await getNumberseqWithScreenId({
        screen_id: "supplierpayment",
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

      // 2️⃣ Map paymentDetails
      const paymentMethod = req.body?.paymentMethod || "";
      const payDetail = req.body.paymentDetails || [];
      let paymentDetails = payDetail.map((item) => ({
        ...item,
        company: companyId,
        paymentMethod: paymentMethod,
      }));

      // *****Start Check Accounts Integration******
      const isDrCrEqual = await check_accounttransaction(paymentDetails);
      if (!isDrCrEqual) {
        res.status(200).json({
          success: false,
          message: "Payment not Integrated",
          data: req?.body,
        });
      }

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      // 1️⃣ Save payment
      const newPayment = new Payment({
        ...req.body,
        paymentCode: code,
        seq: seq,
        company: companyId,
        acctrans: acctrans,
      });

      const savedData = await newPayment.save();

      // 2️⃣ Map paymentDetails
      //   const payDetail = req.body.paymentDetails || [];
      const payId = savedData._id || null;
      paymentDetails = paymentDetails.map((item) => ({
        ...item,
        company: companyId,
        paymentId: payId,
      }));

      // 3️⃣ Save paymentDetails
      if (paymentDetails.length > 0) {
        await Paymentdetail.insertMany(paymentDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.paymentCode || "",
          doc_name: "supplierpayment",
          doc_date: savedData?.paymentDate || "",
          doc_id: payId || "",
          company: savedData?.company || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******
      }

      // ****Update Number Seq****
      const numberseqAfterUpdate = await updateNumberseqWithScreenId({
        screen_id: "payment",
        companyId: req.user.companyId,
      });
      console.log("numberseqAfterUpdate", numberseqAfterUpdate);
      // *********************

      // 4️⃣ Response
      res.status(200).json({
        success: true,
        data: savedData,
        message: "Payment is Created Successfully.",
      });
    } catch (e) {
      console.error("Error creating payment:", e);
      res.status(500).json({
        success: false,
        message: "Failed Creation of Payment.",
      });
    }
  },
  updatePaymentWithId: async (req, res) => {
    // Not providing the  companyId as payment Id will be unique.
    try {
      const companyId = req.user.companyId;

      let id = req.params.id;
      console.log(req.body);

      // 2️⃣ Map paymentDetails
      const paymentMethod = req.body?.paymentMethod || "";
      const payDetail = req.body.paymentDetails || [];
      const payId = id || null;
      const paymentDetails = payDetail.map((item) => ({
        ...item,
        company: companyId,
        paymentId: payId,
        paymentMethod: paymentMethod,
      }));

      // *****Start Check Accounts Integration******
      const isDrCrEqual = await check_accounttransaction(paymentDetails);
      if (!isDrCrEqual) {
        res.status(200).json({
          success: false,
          message: "Payment not Integrated",
          data: req?.body,
        });
      }

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      const savedData = await Payment.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body, acctrans: acctrans } },
        { new: true, runValidators: true },
      );

      // 3️⃣ Save payment details
      if (paymentDetails.length > 0) {
        await Paymentdetail.deleteMany({
          paymentId: payId,
          company: companyId,
        });

        await Paymentdetail.insertMany(paymentDetails);
        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.paymentCode || "",
          doc_name: "supplierpayment",
          doc_date: savedData?.paymentDate || "",
          doc_id: payId || "",
          company: savedData?.company || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******
      }
      const PaymentAfterUpdate = await Payment.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Payment Updated",
        data: PaymentAfterUpdate,
      });
    } catch (error) {
      console.log("Error in updatePaymentWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Payment. Try later",
      });
    }
  },
  deletePaymentWithId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;

      await Payment.findOneAndUpdate(
        { _id: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      await Paymentdetail.updateMany(
        { paymentId: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      // await Payment.findOneAndDelete({ _id: id, company: companyId });
      const PaymentAfterDelete = await Payment.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Payment Deleted.",
        data: PaymentAfterDelete,
      });
    } catch (error) {
      console.log("Error in updatePaymentWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Payment. Try later",
      });
    }
  },
  getPaymentPrint: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const result = await Payment.aggregate([
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

        {
          $lookup: {
            from: "supplierpaymentdetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "paymentId",
            as: "paymentDetails",
          },
        },
        {
          $lookup: {
            from: "suppliers",
            localField: "paymentDetails.supplier",
            foreignField: "_id",
            as: "supplierData",
          },
        },
        {
          $addFields: {
            paymentDetails: {
              $map: {
                input: "$paymentDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      supplier: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$supplierData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.supplier"],
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
            supplierData: 0, // cleanup
          },
        },

        // 🔹 SUM grossAmount
        {
          $addFields: {
            totalexpenseAmount: {
              $sum: "$paymentDetails.invAmount",
            },
            totalpaidAmount: {
              $sum: "$paymentDetails.paidAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains payment + paymentDetails[]
      });
    } catch (e) {
      console.error("Error in getPaymentPrint", e);
      res.status(500).json({
        success: false,
        message: "Error fetching getPaymentPrint",
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
        screen: "supplierpayment",
        paymentMethod: transDetails[0]?.paymentMethod,
      })
        .populate("accountledger")
        .lean();

      const supplierTotals = Object.values(
        transDetails.reduce((acc, item) => {
          const supplierId = item.supplier;

          if (!acc[supplierId]) {
            acc[supplierId] = {
              supplier: supplierId,
              paidAmount: 0,
            };
          }

          acc[supplierId].paidAmount += item.paidAmount || 0;

          return acc;
        }, {}),
      );

      console.log(supplierTotals);

      const accountTransactions = [];

      let seq = 0;
      for (const emp of supplierTotals) {
        const supplierId = emp?.supplier || null;
        const paidAmount = emp?.paidAmount || 0;
        for (const item of accountsetupData) {
          if (item?.mapping_type === "net_amount" && paidAmount > 0) {
            seq++;
            accountTransactions.push({
              amount: paidAmount || 0,
              amount_type: item?.amount_type || "",
              mapping_type: item?.mapping_type || "",
              seq: seq,
              supplier: supplierId || null,
              account_type: item?.accountledger?.account_type || "",
              accountledger: item?.accountledger?._id || null,
              accountledger_code: item?.accountledger?.accountledger_code || "",
              accountledger_name: item?.accountledger?.accountledger_name || "",
            });
          }
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
