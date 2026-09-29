require("dotenv").config();

const Role = require("../model/role.model");
const Rolepermission = require("../model/rolepermission.model");
const mongoose = require("mongoose");

module.exports = {
  // GET ALL ROLES WITH PERMISSION COUNT
  getAllRolepermissions: async (req, res) => {
    try {
      const companyId = req.user.companyId;

      const allRolepermissions = await Role.aggregate([
        {
          $match: {
            company: new mongoose.Types.ObjectId(companyId),
          },
        },
        {
          $lookup: {
            from: "rolepermissions",
            localField: "_id",
            foreignField: "role",
            as: "permissions",
          },
        },
        {
          $project: {
            _id: 1,
            role_name: 1,
            permissionCount: {
              $size: "$permissions",
            },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        message: "Success in fetching all Rolepermissions",
        data: allRolepermissions,
      });
    } catch (error) {
      console.log("Error in getAllRolepermissions", error);

      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Rolepermissions. Try later",
      });
    }
  },

  // GET ROLES WITH SEARCH
  getRolepermissionWithQuery: async (req, res) => {
    try {
      const companyId = req.user.companyId;

      const matchStage = {
        company: new mongoose.Types.ObjectId(companyId),
      };

      if (req.query.search) {
        matchStage.role_name = {
          $regex: req.query.search,
          $options: "i",
        };
      }

      const roles = await Role.aggregate([
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: "rolepermissions",
            localField: "_id",
            foreignField: "role",
            as: "permissions",
          },
        },
        {
          $project: {
            _id: 1,
            role_name: 1,
            permissionCount: {
              $size: "$permissions",
            },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      console.log("Error in fetching Rolepermission with query", error);

      res.status(500).json({
        success: false,
        message: "Error in fetching Rolepermission with query.",
      });
    }
  },

  // CREATE ROLE PERMISSIONS
  createRolepermission: async (req, res) => {
    try {
      const companyId = req.user.companyId;

      let rolepermissions = req.body?.rolepermissionsDetails || [];

      rolepermissions = rolepermissions.map((item) => ({
        ...item,
        company: companyId,
      }));

      const rolepermissionsNewData =
        await Rolepermission.insertMany(rolepermissions);

      res.status(200).json({
        success: true,
        message: "Rolepermission Created",
        data: rolepermissionsNewData,
      });
    } catch (error) {
      console.log("Error in Create Rolepermission", error.message);

      res.status(500).json({
        success: false,
        message: "Server Error in Create Rolepermission. Try later",
      });
    }
  },

  // GET PERMISSIONS FOR ONE ROLE
  getRolepermissionWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      const rolepermissions = await Rolepermission.find({
        role: id,
        company: companyId,
      }).populate("role");

      res.status(200).json({
        success: true,
        data: rolepermissions,
      });
    } catch (error) {
      console.log("Error in getRolepermissionWithId", error);

      res.status(500).json({
        success: false,
        message: "Error in getting Rolepermission Data",
      });
    }
  },

  // UPDATE ROLE PERMISSIONS
  updateRolepermissionWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const companyId = req.user.companyId;

      let rolepermissions = req.body?.rolepermissionsDetails || [];

      rolepermissions = rolepermissions.map((item) => ({
        ...item,
        company: companyId,
        role: id,
      }));

      // Remove old permissions for this role
      await Rolepermission.deleteMany({
        role: id,
        company: companyId,
      });

      // Insert updated permissions
      const rolepermissionsNewData =
        await Rolepermission.insertMany(rolepermissions);

      res.status(200).json({
        success: true,
        message: "Rolepermission Updated",
        data: rolepermissionsNewData,
      });
    } catch (error) {
      console.log("Error in updateRolepermissionWithId", error);

      res.status(500).json({
        success: false,
        message: "Server Error in Update Rolepermission. Try later",
      });
    }
  },

  // DELETE ALL PERMISSIONS FOR ONE ROLE
  deleteRolepermissionWithId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const id = req.params.id;

      await Rolepermission.deleteMany({
        role: id,
        company: companyId,
      });

      // Get updated role list
      const rolesAfterDelete = await Role.aggregate([
        {
          $match: {
            company: new mongoose.Types.ObjectId(companyId),
          },
        },
        {
          $lookup: {
            from: "rolepermissions",
            localField: "_id",
            foreignField: "role",
            as: "permissions",
          },
        },
        {
          $project: {
            _id: 1,
            role_name: 1,
            permissionCount: {
              $size: "$permissions",
            },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        message: "Rolepermission Deleted.",
        data: rolesAfterDelete,
      });
    } catch (error) {
      console.log("Error in deleteRolepermissionWithId", error);

      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Rolepermission. Try later",
      });
    }
  },
};
