require("dotenv").config();
const dayjs = require("dayjs");
const mongoose = require("mongoose");

const Purchaseinvoice = require("../model/purchaseinvoice.model");
const Purchaseinvoicedetail = require("../model/purchaseinvoicedetail.model");
const Supplier = require("../model/supplier.model");
const Taxrate = require("../model/taxrate.model");
const Accounttransaction = require("../model/accounttransaction.model");
const Accountsetup = require("../model/accountsetup.model");

const ReceiptdetailModel = require("../model/receiptdetail.model");
const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("./numberseq.controller");

module.exports = {
  getAllPurchaseinvoices: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allPurchaseinvoice = await Purchaseinvoice.find({
        company: companyId,
      })
        .populate("supplier")
        .populate("geolocation")
        .populate("company");
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Purchaseinvoice",
        data: allPurchaseinvoice,
      });
    } catch (error) {
      console.log("Error in getAllPurchaseinvoice", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Purchaseinvoice. Try later",
      });
    }
  },
  getPurchaseinvoiceWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const result = await Purchaseinvoice.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            company: new mongoose.Types.ObjectId(companyId),
          },
        },

        {
          $lookup: {
            from: "purchaseinvoicedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "piId",
            as: "invoiceDetails",
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Purchaseinvoice not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains invoice + invoiceDetails[]
      });
    } catch (e) {
      console.error("Error in getPurchaseinvoiceWithId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Purchaseinvoice",
      });
    }
  },
  createPurchaseinvoice: async (req, res) => {
    try {
      const companyId = req.user.companyId;

      const numberseqData = await getNumberseqWithScreenId({
        screen_id: "purchaseinvoice",
        companyId: companyId,
      });
      console.log("numberseqData.data", numberseqData);
      let seq = 1;
      let code = "";
      if (numberseqData) {
        seq = numberseqData.seq || 1;
        code = numberseqData.code || "";
      }

      // 1️⃣ Save purchase invoice
      const formattedinvoiceDate = dayjs(req?.body?.invoiceDate).format(
        "YYYY-MM-DD",
      );
      const [dd, mm, yyyy] = formattedinvoiceDate.split("-").map(Number);

      // 2️⃣ Map invoice details
      const piDetail = req.body.invoiceDetails || [];

      let purchaseInvoiceDetails = piDetail.map((item) => ({
        ...item,
        company: companyId,
      }));

      // *****Start Check Accounts Integration******
      const isDrCrEqual = await check_accounttransaction(
        purchaseInvoiceDetails,
      );
      if (!isDrCrEqual) {
        res.status(200).json({
          success: false,
          message: "Purchaseinvoice not Integrated",
          data: savedData,
        });
      }

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      const newPurchaseinvoice = new Purchaseinvoice({
        ...req.body,
        piCode: code,
        seq: seq,
        company: companyId,
        acctrans: acctrans,
      });

      const savedData = await newPurchaseinvoice.save();
      const piId = savedData._id || null;
      purchaseInvoiceDetails = purchaseInvoiceDetails.map((item) => ({
        ...item,
        company: companyId,
        piId: piId,
      }));

      // 3️⃣ Save invoice details
      if (purchaseInvoiceDetails.length > 0) {
        await Purchaseinvoicedetail.insertMany(purchaseInvoiceDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.piCode || "",
          doc_name: "purchaseinvoice",
          doc_date: savedData?.invoiceDate || "",
          doc_id: piId || "",
          supplier: savedData?.supplier || null,
          company: savedData?.company || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******
      }

      // ****Update Number Seq****
      const numberseqAfterUpdate = await updateNumberseqWithScreenId({
        screen_id: "purchaseinvoice",
        companyId: req.user.companyId,
      });
      console.log("numberseqAfterUpdate", numberseqAfterUpdate);
      // *********************

      // 4️⃣ Response
      res.status(200).json({
        success: true,
        data: savedData,
        message: "Purchaseinvoice is Created Successfully.",
      });
    } catch (e) {
      console.error("Error creating purchase invoice:", e);
      res.status(500).json({
        success: false,
        message: "Failed Creation of Purchaseinvoice." + e.message,
      });
    }
  },
  updatePurchaseinvoiceWithId: async (req, res) => {
    // Not providing the  companyId as purchaseinvoice Id will be unique.
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;
      console.log(req.body);

      // 2️⃣ Map invoice details
      const piDetail = req.body.invoiceDetails || [];
      const piId = id || null;
      const purchaseInvoiceDetails = piDetail.map((item) => ({
        ...item,
        company: companyId,
        piId: piId,
        supplier: req.body?.supplier || null,
      }));

      // 3️⃣ Save invoice details
      if (purchaseInvoiceDetails.length > 0) {
        // *****Start Check Accounts Integration******
        const isDrCrEqual = await check_accounttransaction(
          purchaseInvoiceDetails,
        );
        if (!isDrCrEqual) {
          res.status(200).json({
            success: false,
            message: "Purchaseinvoice not Integrated",
            data: req?.body,
          });
        }

        let acctrans = isDrCrEqual?.accountTransactions || [];
        // *****End Check Accounts Integration******

        const savedData = await Purchaseinvoice.findOneAndUpdate(
          { _id: id },
          { $set: { ...req.body, acctrans: acctrans } },
          { new: true, runValidators: true },
        );

        await Purchaseinvoicedetail.deleteMany({
          piId: piId,
          company: companyId,
        });

        await Purchaseinvoicedetail.insertMany(purchaseInvoiceDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.piCode || "",
          doc_name: "purchaseinvoice",
          doc_date: savedData?.invoiceDate || "",
          doc_id: piId || "",
          supplier: savedData?.supplier || null,
          company: savedData?.company || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******

        const PurchaseinvoiceAfterUpdate = await Purchaseinvoice.findOne({
          _id: id,
        });
        res.status(200).json({
          success: true,
          isIntegrated: isIntegrated?.success || false,
          message: "Purchaseinvoice Updated",
          data: PurchaseinvoiceAfterUpdate,
        });
      }
    } catch (error) {
      console.log("Error in updatePurchaseinvoiceWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Purchaseinvoice. Try later",
      });
    }
  },
  deletePurchaseinvoiceWithId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;

      const receiptDetails = await ReceiptdetailModel.find({
        piId: id,
        status: "valid",
      }).lean();
      if (receiptDetails.length > 0) {
        res.status(500).json({
          success: false,
          message: "Cannot Delete Invoice, Receipt is against this invoice",
        });
        return;
      }

      await Purchaseinvoice.findOneAndUpdate(
        { _id: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      await Purchaseinvoicedetail.updateMany(
        { piId: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      // await Purchaseinvoice.findOneAndDelete({ _id: id, company: companyId });
      const PurchaseinvoiceAfterDelete = await Purchaseinvoice.findOne({
        _id: id,
      });
      res.status(200).json({
        success: true,
        message: "Purchaseinvoice Deleted.",
        data: PurchaseinvoiceAfterDelete,
      });
    } catch (error) {
      console.log("Error in updatePurchaseinvoiceWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Purchaseinvoice. Try later",
      });
    }
  },
  getPurchaseinvoicePrint: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const result = await Purchaseinvoice.aggregate([
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
        // 🔹 Populate Supplier
        {
          $lookup: {
            from: "suppliers",
            localField: "supplier",
            foreignField: "_id",
            as: "supplier",
          },
        },
        {
          $unwind: {
            path: "$supplier",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "purchaseinvoicedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "piId",
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
          message: "Purchaseinvoice not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains invoice + invoiceDetails[]
      });
    } catch (e) {
      console.error("Error in getPurchaseinvoicePrint", e);
      res.status(500).json({
        success: false,
        message: "Error fetching getPurchaseinvoicePrint",
      });
    }
  },
  getPurchaseinvoiceWithSupplierId: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const filterQuery = {};
      filterQuery["company"] = new mongoose.Types.ObjectId(companyId);

      if (req.query.hasOwnProperty("supplier")) {
        const supplierId = req.query.supplier;
        filterQuery["supplier"] = new mongoose.Types.ObjectId(supplierId);
      }
      filterQuery["status"] = "valid";

      var result = await Purchaseinvoice.aggregate([
        {
          $match: filterQuery,
        },

        {
          $lookup: {
            from: "purchaseinvoicedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "piId",
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
          message: "Purchaseinvoice not found",
        });
      }

      if (result.length > 0) {
        // const receiptDetails = await ReceiptdetailModel.find(filterQuery).lean();
        const receiptDetails = await ReceiptdetailModel.aggregate([
          { $match: filterQuery },
          {
            $group: {
              _id: "$piId",
              piCode: { $first: "$piCode" },
              totalPaidAmount: { $sum: "$paidAmount" },
              receiptDetails: { $push: "$$ROOT" },
            },
          },
        ]);
        if (receiptDetails.length > 0) {
          console.log("receiptDetails:", receiptDetails);
          for (const item of result) {
            console.log("SI ID:", item._id);
            console.log("Invoice Code:", item.piCode);
            const piId = item._id;
            const filtered = receiptDetails.filter(
              (row) => row._id.toString() === piId.toString(),
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
      console.error("Error in getPurchaseinvoiceWithSupplierId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Purchaseinvoice",
      });
    }
  },

  getPurchaseinvoiceWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const companyId = req.user.companyId;

      filterQuery["company"] = companyId;
      if (req.query.search) {
        filterQuery.$or = [
          { piCode: { $regex: req.query.search, $options: "i" } },
          { supplier_name: { $regex: req.query.search, $options: "i" } },
        ];
      }

      const filteredPurchaseinvoices = await Purchaseinvoice.find(filterQuery)
        .populate("supplier")
        .populate("geolocation")
        .populate("company");
      res.status(200).json({ success: true, data: filteredPurchaseinvoices });
    } catch (error) {
      console.log("Error in fetching Supplier with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Purchaseinvoice  with query.",
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
        screen: "purchaseinvoice",
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
