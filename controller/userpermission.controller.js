require("dotenv").config();
const Role = require("../model/role.model");
const Userpermission = require("../model/userpermission.model");

module.exports = {
  getAllUserpermissions: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allUserpermission = await Userpermission.find({ company: companyId });
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

      const filteredUserpermissions = await Userpermission.find(filterQuery).populate("user").populate("role");
      res.status(200).json({ success: true, data: filteredUserpermissions });
    } catch (error) {
      console.log("Error in fetching Userpermission with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Userpermission  with query.",
      });
    }
  },
  createUserpermission: (req, res) => {
    const companyId = req.user.companyId;
    const newUserpermission = new Userpermission({ ...req.body, company: companyId });
    newUserpermission
      .save()
      .then((savedData) => {
        console.log("Date saved", savedData);
        res.status(200).json({
          success: true,
          data: savedData,
          message: "Userpermission is Created Successfully.",
        });
      })
      .catch((e) => {
        console.log("ERRORO in Register", e);
        res
          .status(500)
          .json({ success: false, message: "Failed Creation of Userpermission." });
      });
  },
  getUserpermissionWithId: async (req, res) => {
    const id = req.params.id;
    const companyId = req.user.companyId;
    Userpermission.findOne({ _id: id, company: companyId }).populate("user").populate("role")
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Userpermission data not Available" });
        }
      })
      .catch((e) => {
        console.log("Error in getUserpermissionWithId", e);
        res
          .status(500)
          .json({ success: false, message: "Error in getting  Userpermission Data" });
      });
  },

  updateUserpermissionWithId: async (req, res) => {
    // Not providing the  companyId as userpermission Id will be unique.
    try {
      let id = req.params.id;
      console.log(req.body);
      await Userpermission.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
      const UserpermissionAfterUpdate = await Userpermission.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Userpermission Updated",
        data: UserpermissionAfterUpdate,
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

      await Userpermission.findOneAndDelete({ _id: id, company: companyId });
      const UserpermissionAfterDelete = await Userpermission.findOne({ _id: id });
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
