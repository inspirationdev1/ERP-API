require("dotenv").config();

const Menu = require("../model/menu.model");

module.exports = {
  getAllMenu: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allMenu = await Menu.find({ company: companyId });

      res.status(200).json({
        success: true,
        message: "Success in fetching all  Menu",
        data: allMenu,
      });
    } catch (error) {
      console.log("Error in getAllMenu", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Menu. Try later",
      });
    }
  },

  getMenuWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const companyId = req.user.companyId;
      filterQuery["company"] = companyId;
      if (req.query.hasOwnProperty("search")) {
        filterQuery.$or = [
          { menu_code: { $regex: req.query.search, $options: "i" } },
          { menu_name: { $regex: req.query.search, $options: "i" } },
        ];
      }



      const filteredMenus = await Menu.find(filterQuery);
      res.status(200).json({ success: true, data: filteredMenus });
    } catch (error) {
      console.log("Error in fetching Menu with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Menu  with query.",
      });
    }
  },

  createMenu: (req, res) => {
    const companyId = req.user.companyId;
    const newMenu = new Menu({ ...req.body, company: companyId });
    newMenu
      .save()
      .then((savedData) => {
        console.log("Date saved", savedData);
        res.status(200).json({
          success: true,
          data: savedData,
          message: "Menu is Created Successfully.",
        });
      })
      .catch((e) => {
        console.log("ERRORO in Register", e);
        res
          .status(500)
          .json({ success: false, message: "Failed Creation of Menu." });
      });
  },
  getMenuWithId: async (req, res) => {
    const id = req.params.id;
    const companyId = req.user.companyId;
    Menu.findOne({ _id: id, company: companyId })
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Menu data not Available" });
        }
      })
      .catch((e) => {
        console.log("Error in getMenuWithId", e);
        res
          .status(500)
          .json({ success: false, message: "Error in getting  Menu Data" });
      });
  },

  updateMenuWithId: async (req, res) => {
    // Not providing the  schoolId as menu Id will be unique.
    try {
      let id = req.params.id;
      console.log(req.body);
      await Menu.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
      const MenuAfterUpdate = await Menu.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Menu Updated",
        data: MenuAfterUpdate,
      });
    } catch (error) {
      console.log("Error in updateMenuWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Menu. Try later",
      });
    }
  },
  deleteMenuWithId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;

      await Menu.findOneAndDelete({ _id: id, company: companyId });
      const MenuAfterDelete = await Menu.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Menu Deleted.",
        data: MenuAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateMenuWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Menu. Try later",
      });
    }
  },
};
