require("dotenv").config();
const Role = require("../model/role.model");
const Userpermission = require("../model/userpermission.model");
const User = require("../model/user.model");
const mongoose = require("mongoose");
module.exports = {
  getAllUserpermissions: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allUserpermission = await User.aggregate([
        // 1. Filter users by company
        {
          $match: {
            company: new mongoose.Types.ObjectId(companyId),
          },
        },
        {
          $lookup: {
            from: "userpermissions",
            localField: "_id",
            foreignField: "user",
            as: "permissions",
          },
        },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleData",
          },
        },
        {
          $unwind: {
            path: "$roleData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            user_code: 1,
            permissionCount: { $size: "$permissions" },
            role: "$roleData",
          },
        },
      ]);
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Userpermission",
        data: allUserpermission,
      });
    } catch (error) {
      console.log("Error in getAllUserpermission", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Userpermission. Try later",
      });
    }
  },
  getUserpermissionWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const companyId = req.user.companyId;
      filterQuery["company"] = companyId;
      if (req.query.hasOwnProperty("search")) {
        filterQuery.$or = [
          { user_name: { $regex: req.query.search, $options: "i" } },
          { role_name: { $regex: req.query.search, $options: "i" } },
        ];
      }

      // const filteredUserpermissions = await User.find(filterQuery)
      //  .populate("role");
      const filteredUserpermissions = await User.aggregate([
        // 1. Filter users by company
        {
          $match: {
            company: new mongoose.Types.ObjectId(companyId),
          },
        },
        {
          $lookup: {
            from: "userpermissions",
            localField: "_id",
            foreignField: "user",
            as: "permissions",
          },
        },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleData",
          },
        },
        {
          $unwind: {
            path: "$roleData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            user_code: 1,
            permissionCount: { $size: "$permissions" },
            role: "$roleData",
          },
        },
      ]);

      console.log(filteredUserpermissions);

      res.status(200).json({ success: true, data: filteredUserpermissions });
    } catch (error) {
      console.log("Error in fetching Userpermission with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Userpermission  with query.",
      });
    }
  },
  createUserpermission: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      let userpermissions = req.body?.userpermissionsDetails || [];

      userpermissions = userpermissions.map((item) => ({
        ...item,
        company: companyId,
      }));
      const userPermissionsNewData =
        await Userpermission.insertMany(userpermissions);
      res.status(200).json({
        success: true,
        message: "Userpermission Updated",
        data: userPermissionsNewData,
      });
    } catch (error) {
      console.log("Error in Create Userpermission", error.message);
      res.status(500).json({
        success: false,
        message: "Server Error in Create Userpermission. Try later",
      });
    }
  },
  getUserpermissionWithId: async (req, res) => {
    const id = req.params.id;
    const companyId = req.user.companyId;
    await Userpermission.find({ user: id, company: companyId })
      .populate("user")
      .populate("role")
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res.status(500).json({
            success: false,
            message: "Userpermission data not Available",
          });
        }
      })
      .catch((e) => {
        console.log("Error in getUserpermissionWithId", e);
        res.status(500).json({
          success: false,
          message: "Error in getting  Userpermission Data",
        });
      });
  },

  updateUserpermissionWithId: async (req, res) => {
    // Not providing the  companyId as userpermission Id will be unique.
    try {
      let id = req.params.id;
      const companyId = req.user.companyId;
      console.log(req.body);
      let userpermissions = req.body?.userpermissionsDetails || [];
      userpermissions = userpermissions.map((item) => ({
        ...item,
        company: companyId,
      }));
      await Userpermission.deleteMany({
        user: id,
        company: companyId,
      });
      const userPermissionsNewData =
        await Userpermission.insertMany(userpermissions);

      // const UserpermissionAfterUpdate = await Userpermission.find({
      //   user: id,
      //   company: companyId,
      // })
      //   .populate("user")
      //   .populate("role");

      res.status(200).json({
        success: true,
        message: "Userpermission Updated",
        data: userPermissionsNewData,
      });
    } catch (error) {
      console.log("Error in updateUserpermissionWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Userpermission. Try later",
      });
    }
  },
  deleteUserpermissionWithId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;

      await Userpermission.deleteMany({
        user: id,
        company: companyId,
      });

      const UserpermissionAfterDelete = await User.aggregate([
        // 1. Filter users by company
        {
          $match: {
            company: new mongoose.Types.ObjectId(companyId),
          },
        },
        {
          $lookup: {
            from: "userpermissions",
            localField: "_id",
            foreignField: "user",
            as: "permissions",
          },
        },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleData",
          },
        },
        {
          $unwind: {
            path: "$roleData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            user_code: 1,
            permissionCount: { $size: "$permissions" },
            role: "$roleData",
          },
        },
      ]);
      res.status(200).json({
        success: true,
        message: "Userpermission Deleted.",
        data: UserpermissionAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateUserpermissionWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Userpermission. Try later",
      });
    }
  },
};
