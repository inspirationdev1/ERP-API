require("dotenv").config();
const dayjs = require("dayjs");
const mongoose = require("mongoose");

const Salesorder = require("../model/salesorder.model");
const Salesorderdetail = require("../model/salesorderdetail.model");
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
  getAllSalesorders: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allSalesorder = await Salesorder.find({ company: companyId })
        .populate("customer")
        .populate("geolocation")
        .populate("company")
        .sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Salesorder",
        data: allSalesorder,
      });
    } catch (error) {
      console.log("Error in getAllSalesorder", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Salesorder. Try later",
      });
    }
  },
  getSalesorderWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const result = await Salesorder.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            company: new mongoose.Types.ObjectId(companyId),
          },
        },

        {
          $lookup: {
            from: "salesorderdetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "siId",
            as: "orderDetails",
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Salesorder not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains order + orderDetails[]
      });
    } catch (e) {
      console.error("Error in getSalesorderWithId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Salesorder",
      });
    }
  },
  createSalesorder: async (req, res) => {
    try {
      const companyId = req.user.companyId;

      const numberseqData = await getNumberseqWithScreenId({
        screen_id: "salesorder",
        companyId: companyId,
      });
      console.log("numberseqData.data", numberseqData);
      let seq = 1;
      let code = "";
      if (numberseqData) {
        seq = numberseqData.seq || 1;
        code = numberseqData.code || "";
      }

      // 1️⃣ Save sales order
      const formattedorderDate = dayjs(req?.body?.orderDate).format(
        "YYYY-MM-DD",
      );
      const [dd, mm, yyyy] = formattedorderDate.split("-").map(Number);

      // 2️⃣ Map order details
      const siDetail = req.body.orderDetails || [];

      let salesOrderDetails = siDetail.map((item) => ({
        ...item,
        company: companyId,
      }));

      // *****Start Check Accounts Integration******
      const isDrCrEqual = await check_accounttransaction(salesOrderDetails);
      if (!isDrCrEqual) {
        res.status(200).json({
          success: false,
          message: "Salesorder not Integrated",
          data: savedData,
        });
      }

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      const newSalesorder = new Salesorder({
        ...req.body,
        siCode: code,
        seq: seq,
        company: companyId,
        acctrans: acctrans,
      });

      const savedData = await newSalesorder.save();
      const siId = savedData._id || null;
      salesOrderDetails = salesOrderDetails.map((item) => ({
        ...item,
        company: companyId,
        siId: siId,
      }));

      // 3️⃣ Save order details
      if (salesOrderDetails.length > 0) {
        await Salesorderdetail.insertMany(salesOrderDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.siCode || "",
          doc_name: "salesorder",
          doc_date: savedData?.orderDate || "",
          doc_id: siId || "",
          customer: savedData?.customer || null,
          company: savedData?.company || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******
      }

      // ****Update Number Seq****
      const numberseqAfterUpdate = await updateNumberseqWithScreenId({
        screen_id: "salesorder",
        companyId: req.user.companyId,
      });
      console.log("numberseqAfterUpdate", numberseqAfterUpdate);
      // *********************

      // 4️⃣ Response
      res.status(200).json({
        success: true,
        data: savedData,
        message: "Salesorder is Created Successfully.",
      });
    } catch (e) {
      console.error("Error creating sales order:", e);
      res.status(500).json({
        success: false,
        message: "Failed Creation of Salesorder." + e.message,
      });
    }
  },
  updateSalesorderWithId: async (req, res) => {
    // Not providing the  companyId as salesorder Id will be unique.
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;
      console.log(req.body);

      // 2️⃣ Map order details
      const siDetail = req.body.orderDetails || [];
      const siId = id || null;
      const salesOrderDetails = siDetail.map((item) => ({
        ...item,
        company: companyId,
        siId: siId,
        customer: req.body?.customer || null,
      }));

      // 3️⃣ Save order details
      if (salesOrderDetails.length > 0) {
        // *****Start Check Accounts Integration******
        const isDrCrEqual = await check_accounttransaction(salesOrderDetails);
        if (!isDrCrEqual) {
          res.status(200).json({
            success: false,
            message: "Salesorder not Integrated",
            data: req?.body,
          });
        }

        let acctrans = isDrCrEqual?.accountTransactions || [];
        // *****End Check Accounts Integration******

        const savedData = await Salesorder.findOneAndUpdate(
          { _id: id },
          { $set: { ...req.body, acctrans: acctrans } },
          { new: true, runValidators: true },
        );

        await Salesorderdetail.deleteMany({
          siId: siId,
          company: companyId,
        });

        await Salesorderdetail.insertMany(salesOrderDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.siCode || "",
          doc_name: "salesorder",
          doc_date: savedData?.orderDate || "",
          doc_id: siId || "",
          customer: savedData?.customer || null,
          company: savedData?.company || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******

        const SalesorderAfterUpdate = await Salesorder.findOne({ _id: id });
        res.status(200).json({
          success: true,
          isIntegrated: isIntegrated?.success || false,
          message: "Salesorder Updated",
          data: SalesorderAfterUpdate,
        });
      }
    } catch (error) {
      console.log("Error in updateSalesorderWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Salesorder. Try later",
      });
    }
  },
  deleteSalesorderWithId: async (req, res) => {
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
          message: "Cannot Delete Order, Receipt is against this order",
        });
        return;
      }

      await Salesorder.findOneAndUpdate(
        { _id: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      await Salesorderdetail.updateMany(
        { siId: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      // await Salesorder.findOneAndDelete({ _id: id, company: companyId });
      const SalesorderAfterDelete = await Salesorder.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Salesorder Deleted.",
        data: SalesorderAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateSalesorderWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Salesorder. Try later",
      });
    }
  },
  getSalesorderPrint: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const result = await Salesorder.aggregate([
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
            from: "salesorderdetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "siId",
            as: "orderDetails",
          },
        },
        {
          $lookup: {
            from: "feestructures",
            localField: "orderDetails.feestructure",
            foreignField: "_id",
            as: "feeStructureData",
          },
        },
        {
          $addFields: {
            orderDetails: {
              $map: {
                input: "$orderDetails",
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
              $sum: "$orderDetails.grossAmount",
            },
            totalDiscountAmount: {
              $sum: "$orderDetails.discountAmount",
            },
            totalNetAmount: {
              $sum: "$orderDetails.netAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Salesorder not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains order + orderDetails[]
      });
    } catch (e) {
      console.error("Error in getSalesorderPrint", e);
      res.status(500).json({
        success: false,
        message: "Error fetching getSalesorderPrint",
      });
    }
  },
  getSalesorderWithCustomerId: async (req, res) => {
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

      var result = await Salesorder.aggregate([
        {
          $match: filterQuery,
        },

        {
          $lookup: {
            from: "salesorderdetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "siId",
            as: "orderDetails",
          },
        },
        // 🔹 SUM grossAmount
        {
          $addFields: {
            totalGrossAmount: {
              $sum: "$orderDetails.grossAmount",
            },
            totalDiscountAmount: {
              $sum: "$orderDetails.discountAmount",
            },
            totalNetAmount: {
              $sum: "$orderDetails.netAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Salesorder not found",
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
            console.log("Order Code:", item.siCode);
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
        data: result, // contains order + orderDetails[]
      });
    } catch (e) {
      console.error("Error in getSalesorderWithCustomerId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Salesorder",
      });
    }
  },

  getSalesorderWithQuery: async (req, res) => {
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

      if (req.query.hasOwnProperty("customer")) {
        const customerId = req.query.customer;
        filterQuery["customer"] = new mongoose.Types.ObjectId(customerId);
      }

      const filteredSalesorders = await Salesorder.find(filterQuery)
        .populate("customer")
        .populate("geolocation")
        .populate("company");
      res.status(200).json({ success: true, data: filteredSalesorders });
    } catch (error) {
      console.log("Error in fetching Customer with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Salesorder  with query.",
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
        screen: "salesorder",
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
