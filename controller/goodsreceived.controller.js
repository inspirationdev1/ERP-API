require("dotenv").config();
const dayjs = require("dayjs");
const mongoose = require("mongoose");

const Goodsreceived = require("../model/goodsreceived.model");
const Goodsreceiveddetail = require("../model/goodsreceiveddetail.model");
const SupplierpaymentdetailModel = require("../model/supplierpaymentdetail.model");
const Accounttransaction = require("../model/accounttransaction.model");
const Accountsetup = require("../model/accountsetup.model");
const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("./numberseq.controller");

module.exports = {
  getAllGoodsreceiveds: async (req, res) => {
    try {
      const allGoodsreceived = await Goodsreceived.find({
        company: req.user.companyId,
      })
        .populate("supplier")
        .populate("geolocation")
        .populate("company");

      return res.status(200).json({
        success: true,
        message: "Success in fetching all Goodsreceived",
        data: allGoodsreceived,
      });
    } catch (error) {
      console.log("Error in getAllGoodsreceived", error);
      return res.status(500).json({
        success: false,
        message: "Server Error in Getting All Goodsreceived. Try later",
      });
    }
  },

  getGoodsreceivedWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Goods Received ID",
        });
      }

      const result = await Goodsreceived.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            company: new mongoose.Types.ObjectId(companyId),
          },
        },
        {
          $lookup: {
            from: "goodsreceiveddetails",
            localField: "_id",
            foreignField: "piId",
            as: "invoiceDetails",
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Goodsreceived not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error("Error in getGoodsreceivedWithId", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching Goodsreceived",
      });
    }
  },

  createGoodsreceived: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const details = req.body.goodsreceivedDetails || [];

      if (!Array.isArray(details) || details.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Goods Received details are required.",
        });
      }

      const numberseqData = await getNumberseqWithScreenId({
        screen_id: "goodsreceived",
        companyId,
      });

      const seq = numberseqData?.seq || 1;
      const code = numberseqData?.code || "";

      const goodsReceivedDetails = details.map((item) => ({
        ...item,
        company: companyId,
      }));

      const accountCheck = await check_accounttransaction(
        goodsReceivedDetails
      );

      if (!accountCheck?.success) {
        return res.status(400).json({
          success: false,
          message:
            accountCheck?.message || "Goods Received account integration failed.",
        });
      }

      const newGoodsreceived = new Goodsreceived({
        ...req.body,
        piCode: code,
        seq,
        company: companyId,
        acctrans: accountCheck.accountTransactions || [],
      });

      const savedData = await newGoodsreceived.save();

      const detailsToSave = goodsReceivedDetails.map((item) => ({
        ...item,
        company: companyId,
        piId: savedData._id,
        supplier: req.body.supplier || null,
      }));

      await Goodsreceiveddetail.insertMany(detailsToSave);

      const accountTransactions = (
        accountCheck.accountTransactions || []
      ).map((item) => ({
        ...item,
        doc_code: savedData.piCode || "",
        doc_name: "goodsreceived",
        doc_date: savedData.goodsreceivedDate || "",
        doc_id: savedData._id,
        supplier: savedData.supplier || null,
        company: savedData.company || null,
      }));

      if (accountTransactions.length > 0) {
        const integrationResult = await integrate_accounttransaction(
          accountTransactions
        );

        if (!integrationResult?.success) {
          console.error(
            "Goods Received account integration failed:",
            integrationResult?.message
          );
        }
      }

      await updateNumberseqWithScreenId({
        screen_id: "goodsreceived",
        companyId,
      });

      return res.status(201).json({
        success: true,
        data: savedData,
        message: "Goodsreceived is Created Successfully.",
      });
    } catch (error) {
      console.error("Error creating Goods Received:", error);
      return res.status(500).json({
        success: false,
        message: `Failed Creation of Goodsreceived. ${error.message}`,
      });
    }
  },

  updateGoodsreceivedWithId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const id = req.params.id;
      const details = req.body.goodsreceivedDetails || [];

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Goods Received ID",
        });
      }

      if (!Array.isArray(details) || details.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Goods Received details are required.",
        });
      }

      const goodsReceivedDetails = details.map((item) => ({
        ...item,
        company: companyId,
        piId: id,
        supplier: req.body.supplier || null,
      }));

      const accountCheck = await check_accounttransaction(
        goodsReceivedDetails
      );

      if (!accountCheck?.success) {
        return res.status(400).json({
          success: false,
          message:
            accountCheck?.message || "Goods Received account integration failed.",
        });
      }

      const savedData = await Goodsreceived.findOneAndUpdate(
        { _id: id, company: companyId },
        {
          $set: {
            ...req.body,
            acctrans: accountCheck.accountTransactions || [],
          },
        },
        { new: true, runValidators: true }
      );

      if (!savedData) {
        return res.status(404).json({
          success: false,
          message: "Goods Received record not found.",
        });
      }

      await Goodsreceiveddetail.deleteMany({
        piId: id,
        company: companyId,
      });

      await Goodsreceiveddetail.insertMany(goodsReceivedDetails);

      const accountTransactions = (
        accountCheck.accountTransactions || []
      ).map((item) => ({
        ...item,
        doc_code: savedData.piCode || "",
        doc_name: "goodsreceived",
        doc_date: savedData.goodsreceivedDate || "",
        doc_id: id,
        supplier: savedData.supplier || null,
        company: savedData.company || null,
      }));

      let integrationResult = { success: true };

      if (accountTransactions.length > 0) {
        integrationResult = await integrate_accounttransaction(
          accountTransactions
        );
      }

      return res.status(200).json({
        success: true,
        isIntegrated: Boolean(integrationResult?.success),
        message: "Goodsreceived Updated",
        data: savedData,
      });
    } catch (error) {
      console.error("Error in updateGoodsreceivedWithId", error);
      return res.status(500).json({
        success: false,
        message: `Server Error in Update Goodsreceived. ${error.message}`,
      });
    }
  },

  deleteGoodsreceivedWithId: async (req, res) => {
    try {
      const id = req.params.id;

      const paymentDetails = await SupplierpaymentdetailModel.find({
        piId: id,
        status: "valid",
      }).lean();

      if (paymentDetails.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot Delete Goodsreceived, Receipt is against this goodsreceived",
        });
      }

      await Goodsreceived.findOneAndUpdate(
        { _id: id, company: req.user.companyId },
        { $set: { status: "cancel" } },
        { new: true }
      );

      await Goodsreceiveddetail.updateMany(
        { piId: id, company: req.user.companyId },
        { $set: { status: "cancel" } }
      );

      const deletedData = await Goodsreceived.findOne({
        _id: id,
        company: req.user.companyId,
      });

      return res.status(200).json({
        success: true,
        message: "Goodsreceived Deleted.",
        data: deletedData,
      });
    } catch (error) {
      console.log("Error deleting Goodsreceived", error);
      return res.status(500).json({
        success: false,
        message: "Server Error in Deleting Goodsreceived. Try later",
      });
    }
  },

  getGoodsreceivedPrint: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Goods Received ID",
        });
      }

      const result = await Goodsreceived.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            company: new mongoose.Types.ObjectId(companyId),
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "company",
            foreignField: "_id",
            as: "company",
          },
        },
        { $unwind: "$company" },
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
            from: "goodsreceiveddetails",
            localField: "_id",
            foreignField: "piId",
            as: "invoiceDetails",
          },
        },
        {
          $addFields: {
            totalGrossAmount: { $sum: "$invoiceDetails.grossAmount" },
            totalDiscountAmount: { $sum: "$invoiceDetails.discountAmount" },
            totalNetAmount: { $sum: "$invoiceDetails.netAmount" },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Goodsreceived not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error("Error in getGoodsreceivedPrint", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching Goodsreceived print data",
      });
    }
  },

  getGoodsreceivedWithSupplierId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const filterQuery = {
        company: new mongoose.Types.ObjectId(companyId),
        status: "valid",
      };

      if (req.query.supplier) {
        if (!mongoose.Types.ObjectId.isValid(req.query.supplier)) {
          return res.status(400).json({
            success: false,
            message: "Invalid supplier ID",
          });
        }

        filterQuery.supplier = new mongoose.Types.ObjectId(req.query.supplier);
      }

      let result = await Goodsreceived.aggregate([
        { $match: filterQuery },
        {
          $lookup: {
            from: "goodsreceiveddetails",
            localField: "_id",
            foreignField: "piId",
            as: "invoiceDetails",
          },
        },
        {
          $addFields: {
            totalGrossAmount: { $sum: "$invoiceDetails.grossAmount" },
            totalDiscountAmount: { $sum: "$invoiceDetails.discountAmount" },
            totalNetAmount: { $sum: "$invoiceDetails.netAmount" },
          },
        },
      ]);

      if (!result.length) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      const paymentDetails = await SupplierpaymentdetailModel.aggregate([
        {
          $match: {
            company: new mongoose.Types.ObjectId(companyId),
            status: "valid",
          },
        },
        {
          $group: {
            _id: "$piId",
            totalPaidAmount: { $sum: "$paidAmount" },
          },
        },
      ]);

      result = result.map((item) => {
        const payment = paymentDetails.find(
          (row) => row._id.toString() === item._id.toString()
        );
        const totalPaidAmount = payment?.totalPaidAmount || 0;

        return {
          ...item,
          totalPaidAmount,
          balanceAmount: item.totalNetAmount - totalPaidAmount,
        };
      });

      result = result.filter((item) => item.balanceAmount > 0);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error in getGoodsreceivedWithSupplierId", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching Goodsreceived",
      });
    }
  },

  getGoodsreceivedWithQuery: async (req, res) => {
    try {
      const filterQuery = {
        company: req.user.companyId,
      };

      if (req.query.search) {
        filterQuery.$or = [
          { piCode: { $regex: req.query.search, $options: "i" } },
          { supplier_name: { $regex: req.query.search, $options: "i" } },
        ];
      }

      const filteredGoodsreceiveds = await Goodsreceived.find(filterQuery)
        .populate("supplier")
        .populate("geolocation")
        .populate("company");

      return res.status(200).json({
        success: true,
        data: filteredGoodsreceiveds,
      });
    } catch (error) {
      console.log("Error fetching Goodsreceived with query", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching Goodsreceived with query.",
      });
    }
  },
};

const check_accounttransaction = async (transDetails) => {
  try {
    if (!transDetails.length) {
      return {
        success: false,
        message: "Goods Received details are required.",
        accountTransactions: [],
      };
    }

    const accountsetupData = await Accountsetup.find({
      company: transDetails[0]?.company,
      screen: "goodsreceived",
    })
      .populate("accountledger")
      .lean();

    const totals = transDetails.reduce(
      (acc, item) => {
        acc.grossAmount += Number(item.grossAmount) || 0;
        acc.discountAmount += Number(item.discountAmount) || 0;
        acc.taxable_amount += Number(item.taxable_amount) || 0;
        acc.tax_amount += Number(item.tax_amount) || 0;
        acc.netAmount += Number(item.netAmount) || 0;
        return acc;
      },
      {
        grossAmount: 0,
        discountAmount: 0,
        taxable_amount: 0,
        tax_amount: 0,
        netAmount: 0,
      }
    );

    const accountTransactions = [];
    const taxCount = accountsetupData.filter(
      (item) => item.mapping_type === "tax_amount"
    ).length;

    let seq = 0;

    for (const item of accountsetupData) {
      let amount = 0;

      if (item.mapping_type === "net_amount") {
        amount = totals.netAmount;
      } else if (item.mapping_type === "taxable_amount") {
        amount = totals.taxable_amount;
      } else if (item.mapping_type === "tax_amount") {
        amount = taxCount > 1 ? totals.tax_amount / taxCount : totals.tax_amount;
      }

      if (amount > 0) {
        seq += 1;
        accountTransactions.push({
          amount,
          amount_type: item.amount_type || "",
          mapping_type: item.mapping_type || "",
          seq,
          account_type: item.accountledger?.account_type || "",
          accountledger: item.accountledger?._id || null,
          accountledger_code: item.accountledger?.accountledger_code || "",
          accountledger_name: item.accountledger?.accountledger_name || "",
        });
      }
    }

    const totalsDrCr = accountTransactions.reduce(
      (acc, item) => {
        if (item.amount_type === "dr") {
          acc.totalDebit += Number(item.amount) || 0;
        }

        if (item.amount_type === "cr") {
          acc.totalCredit += Number(item.amount) || 0;
        }

        return acc;
      },
      { totalDebit: 0, totalCredit: 0 }
    );

    const balanced =
      Math.abs(totalsDrCr.totalDebit - totalsDrCr.totalCredit) < 0.01;

    return {
      success: balanced,
      message: balanced
        ? "Accounts Transaction saved Successfully"
        : `Accounts Transaction Not saved, check Total Debit = ${totalsDrCr.totalDebit} And Total Credit = ${totalsDrCr.totalCredit}`,
      totalDebit: totalsDrCr.totalDebit,
      totalCredit: totalsDrCr.totalCredit,
      accountTransactions,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      accountTransactions: [],
    };
  }
};

const integrate_accounttransaction = async (accountTransactions) => {
  try {
    if (!accountTransactions.length) {
      return { message: "No account transactions to integrate", success: true };
    }

    await Accounttransaction.deleteMany({
      doc_id: accountTransactions[0]?.doc_id,
      company: accountTransactions[0]?.company,
    });

    await Accounttransaction.insertMany(accountTransactions);

    return {
      message: "Integration successful",
      success: true,
    };
  } catch (error) {
    return {
      message: error.message,
      success: false,
    };
  }
};