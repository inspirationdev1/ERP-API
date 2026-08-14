require("dotenv").config();
const dayjs = require("dayjs");
const mongoose = require("mongoose");

const Salesinvoice = require("../model/salesinvoice.model");
const Salesinvoicedetail = require("../model/salesinvoicedetail.model");
const Customer = require("../model/customer.model");
const Taxrate = require("../model/taxrate.model");
const Accounttransaction = require("../model/accounttransaction.model");
const Accountsetup = require("../model/accountsetup.model");

const ReceiptdetailModel = require("../model/receiptdetail.model");
const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("../controller/numberseq.controller");

module.exports = {
  getAllSalesinvoices: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allSalesinvoice = await Salesinvoice.find({ company: companyId })
        .populate("customer")
        .populate("geolocation")
        .populate("company");
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Salesinvoice",
        data: allSalesinvoice,
      });
    } catch (error) {
      console.log("Error in getAllSalesinvoice", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Salesinvoice. Try later",
      });
    }
  },
  getSalesinvoiceWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const result = await Salesinvoice.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            company: new mongoose.Types.ObjectId(companyId),
          },
        },

        {
          $lookup: {
            from: "salesinvoicedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "siId",
            as: "invoiceDetails",
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Salesinvoice not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains invoice + invoiceDetails[]
      });
    } catch (e) {
      console.error("Error in getSalesinvoiceWithId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Salesinvoice",
      });
    }
  },
  createSalesinvoice: async (req, res) => {
    try {
      const companyId = req.user.companyId;

      const numberseqData = await getNumberseqWithScreenId({
        screen_id: "salesinvoice",
        companyId: companyId,
      });
      console.log("numberseqData.data", numberseqData);
      let seq = 1;
      let code = "";
      if (numberseqData) {
        seq = numberseqData.seq || 1;
        code = numberseqData.code || "";
      }

      // 1️⃣ Save sales invoice
      const formattedinvoiceDate = dayjs(req?.body?.invoiceDate).format(
        "YYYY-MM-DD",
      );
      const [dd, mm, yyyy] = formattedinvoiceDate.split("-").map(Number);

      // 2️⃣ Map invoice details
      const siDetail = req.body.invoiceDetails || [];

      let salesInvoiceDetails = siDetail.map((item) => ({
        ...item,
        company: companyId,
      }));

      // *****Start Check Accounts Integration******
      const isDrCrEqual = await check_accounttransaction(salesInvoiceDetails);
      if (!isDrCrEqual) {
        res.status(200).json({
          success: false,
          message: "Salesinvoice not Integrated",
          data: savedData,
        });
      }

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      const newSalesinvoice = new Salesinvoice({
        ...req.body,
        siCode: code,
        seq: seq,
        company: companyId,
        acctrans: acctrans,
      });

      const savedData = await newSalesinvoice.save();
      const siId = savedData._id || null;
      salesInvoiceDetails = salesInvoiceDetails.map((item) => ({
        ...item,
        company: companyId,
        siId: siId,
      }));

      // 3️⃣ Save invoice details
      if (salesInvoiceDetails.length > 0) {
        await Salesinvoicedetail.insertMany(salesInvoiceDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.siCode || "",
          doc_name: "salesinvoice",
          doc_date: savedData?.invoiceDate || "",
          doc_id: siId || "",
          customer: savedData?.customer || null,
          company: savedData?.company || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******
      }

      // ****Update Number Seq****
      const numberseqAfterUpdate = await updateNumberseqWithScreenId({
        screen_id: "salesinvoice",
        companyId: req.user.companyId,
      });
      console.log("numberseqAfterUpdate", numberseqAfterUpdate);
      // *********************

      // 4️⃣ Response
      res.status(200).json({
        success: true,
        data: savedData,
        message: "Salesinvoice is Created Successfully.",
      });
    } catch (e) {
      console.error("Error creating sales invoice:", e);
      res.status(500).json({
        success: false,
        message: "Failed Creation of Salesinvoice." + e.message,
      });
    }
  },
  updateSalesinvoiceWithId: async (req, res) => {
    // Not providing the  companyId as salesinvoice Id will be unique.
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;
      console.log(req.body);

      // 2️⃣ Map invoice details
      const siDetail = req.body.invoiceDetails || [];
      const siId = id || null;
      const salesInvoiceDetails = siDetail.map((item) => ({
        ...item,
        company: companyId,
        siId: siId,
        customer: req.body?.customer || null,
      }));

      // 3️⃣ Save invoice details
      if (salesInvoiceDetails.length > 0) {
        // *****Start Check Accounts Integration******
        const isDrCrEqual = await check_accounttransaction(salesInvoiceDetails);
        if (!isDrCrEqual) {
          res.status(200).json({
            success: false,
            message: "Salesinvoice not Integrated",
            data: req?.body,
          });
        }

        let acctrans = isDrCrEqual?.accountTransactions || [];
        // *****End Check Accounts Integration******

        const savedData = await Salesinvoice.findOneAndUpdate(
          { _id: id },
          { $set: { ...req.body, acctrans: acctrans } },
          { new: true, runValidators: true },
        );

        await Salesinvoicedetail.deleteMany({
          siId: siId,
          company: companyId,
        });

        await Salesinvoicedetail.insertMany(salesInvoiceDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.siCode || "",
          doc_name: "salesinvoice",
          doc_date: savedData?.invoiceDate || "",
          doc_id: siId || "",
          customer: savedData?.customer || null,
          company: savedData?.company || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******

        const SalesinvoiceAfterUpdate = await Salesinvoice.findOne({ _id: id });
        res.status(200).json({
          success: true,
          isIntegrated: isIntegrated?.success || false,
          message: "Salesinvoice Updated",
          data: SalesinvoiceAfterUpdate,
        });
      }
    } catch (error) {
      console.log("Error in updateSalesinvoiceWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Salesinvoice. Try later",
      });
    }
  },
  deleteSalesinvoiceWithId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;

      const receiptDetails = await ReceiptdetailModel.find({
        siId: id,
        status: "valid",
      }).lean();
      if (receiptDetails.length > 0) {
        res.status(500).json({
          success: false,
          message: "Cannot Delete Invoice, Receipt is against this invoice",
        });
        return;
      }

      await Salesinvoice.findOneAndUpdate(
        { _id: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      await Salesinvoicedetail.updateMany(
        { siId: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      // await Salesinvoice.findOneAndDelete({ _id: id, company: companyId });
      const SalesinvoiceAfterDelete = await Salesinvoice.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Salesinvoice Deleted.",
        data: SalesinvoiceAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateSalesinvoiceWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Salesinvoice. Try later",
      });
    }
  },
  getSalesinvoicePrint: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const result = await Salesinvoice.aggregate([
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

        // 🔹 Populate Geolocation
        {
          $lookup: {
            from: "geolocations",
            localField: "geolocation",
            foreignField: "_id",
            as: "geolocation",
          },
        },
        {
          $unwind: {
            path: "$geolocation",
            preserveNullAndEmptyArrays: true,
          },
        },
        // 🔹 Populate Customer
        {
          $lookup: {
            from: "customers",
            localField: "customer",
            foreignField: "_id",
            as: "customer",
          },
        },
        {
          $unwind: {
            path: "$customer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "salesinvoicedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "siId",
            as: "invoiceDetails",
          },
        },
        {
          $lookup: {
            from: "feestructures",
            localField: "invoiceDetails.feestructure",
            foreignField: "_id",
            as: "feeStructureData",
          },
        },
        {
          $addFields: {
            invoiceDetails: {
              $map: {
                input: "$invoiceDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      feestructure: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$feeStructureData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.feestructure"],
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
            feeStructureData: 0, // cleanup
          },
        },
        // 🔹 SUM grossAmount
        {
          $addFields: {
            totalGrossAmount: {
              $sum: "$invoiceDetails.grossAmount",
            },
            totalDiscountAmount: {
              $sum: "$invoiceDetails.discountAmount",
            },
            totalNetAmount: {
              $sum: "$invoiceDetails.netAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Salesinvoice not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains invoice + invoiceDetails[]
      });
    } catch (e) {
      console.error("Error in getSalesinvoicePrint", e);
      res.status(500).json({
        success: false,
        message: "Error fetching getSalesinvoicePrint",
      });
    }
  },
  getSalesinvoiceWithCustomerId: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const filterQuery = {};
      filterQuery["company"] = new mongoose.Types.ObjectId(companyId);

      if (req.query.hasOwnProperty("customer")) {
        const customerId = req.query.customer;
        filterQuery["customer"] = new mongoose.Types.ObjectId(customerId);
      }
      filterQuery["status"] = "valid";

      var result = await Salesinvoice.aggregate([
        {
          $match: filterQuery,
        },

        {
          $lookup: {
            from: "salesinvoicedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "siId",
            as: "invoiceDetails",
          },
        },
        // 🔹 SUM grossAmount
        {
          $addFields: {
            totalGrossAmount: {
              $sum: "$invoiceDetails.grossAmount",
            },
            totalDiscountAmount: {
              $sum: "$invoiceDetails.discountAmount",
            },
            totalNetAmount: {
              $sum: "$invoiceDetails.netAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Salesinvoice not found",
        });
      }

      if (result.length > 0) {
        // const receiptDetails = await ReceiptdetailModel.find(filterQuery).lean();
        const receiptDetails = await ReceiptdetailModel.aggregate([
          { $match: filterQuery },
          {
            $group: {
              _id: "$siId",
              siCode: { $first: "$siCode" },
              totalPaidAmount: { $sum: "$paidAmount" },
              receiptDetails: { $push: "$$ROOT" },
            },
          },
        ]);
        if (receiptDetails.length > 0) {
          console.log("receiptDetails:", receiptDetails);
          for (const item of result) {
            console.log("SI ID:", item._id);
            console.log("Invoice Code:", item.siCode);
            const siId = item._id;
            const filtered = receiptDetails.filter(
              (row) => row._id.toString() === siId.toString(),
            );
            console.log("filtered:", filtered);
            if (filtered.length > 0) {
              item.totalPaidAmount = filtered[0].totalPaidAmount || 0;
            } else {
              item.totalPaidAmount = 0;
            }
            item.balanceAmount = item.totalNetAmount - item.totalPaidAmount;
          }
          result = result.filter((row) => row.balanceAmount > 0);
          console.log("result:", result);
        }
      }

      res.status(200).json({
        success: true,
        data: result, // contains invoice + invoiceDetails[]
      });
    } catch (e) {
      console.error("Error in getSalesinvoiceWithCustomerId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Salesinvoice",
      });
    }
  },

  getSalesinvoiceWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const companyId = req.user.companyId;

      filterQuery["company"] = companyId;
      if (req.query.search) {
        filterQuery.$or = [
          { siCode: { $regex: req.query.search, $options: "i" } },
          { customer_name: { $regex: req.query.search, $options: "i" } },
        ];
      }

      const filteredSalesinvoices = await Salesinvoice.find(filterQuery)
        .populate("customer")
        .populate("geolocation")
        .populate("company");
      res.status(200).json({ success: true, data: filteredSalesinvoices });
    } catch (error) {
      console.log("Error in fetching Customer with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Salesinvoice  with query.",
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
        screen: "salesinvoice",
      })
        .populate("accountledger")
        .lean();

      const totals = transDetails.reduce(
        (acc, item) => {
          acc.grossAmount += item.grossAmount || 0;
          acc.discountAmount += item.discountAmount || 0;
          acc.taxable_amount += item.taxable_amount || 0;
          acc.tax_amount += item.tax_amount || 0;
          acc.netAmount += item.netAmount || 0;

          return acc;
        },
        {
          grossAmount: 0,
          discountAmount: 0,
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
