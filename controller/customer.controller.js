require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWTSECRET;

const Customer = require("../model/customer.model");
const Attendance = require("../model/attendance.model");

const Documentattachment = require("../model/documentattachment.model");

const cloudinary = require("../config/cloudinary");

const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("../controller/numberseq.controller");

module.exports = {
  getCustomerWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const companyId = req.user.companyId;
      console.log(companyId, "companyId");
      filterQuery["company"] = companyId;
      // if (req.query.hasOwnProperty("search")) {
      //   filterQuery["name"] = { $regex: req.query.search, $options: "i" };
      // }
      if (req.query.hasOwnProperty("search")) {
        filterQuery.$or = [
          { name: { $regex: req.query.search, $options: "i" } },
          { customer_code: { $regex: req.query.search, $options: "i" } },
        ];
      }

      if (req.user?.role === "CUSTOMER") {
        filterQuery["_id"] = req.user.id;
      }

      const filteredCustomers = await Customer.find(filterQuery);
      res.status(200).json({ success: true, data: filteredCustomers });
    } catch (error) {
      console.log("Error in fetching Customer with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Customer  with query.",
      });
    }
  },

  registerCustomer: async (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Error parsing form data." });

      try {
        const existing = await Customer.find({ email: fields.email[0] });
        if (existing.length > 0)
          return res
            .status(500)
            .json({ success: false, message: "Email Already Exist!" });

        let photoUrl = null;
        if (files.image && files.image[0]) {
          const photo = files.image[0];
          const result = await cloudinary.uploader.upload(photo.filepath, {
            folder: "customers",
            public_id:
              Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
          });
          photoUrl = result.secure_url;
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(fields.password[0], salt);

        //*****Get Numberseq */
        const numberseqData = await getNumberseqWithScreenId({
          screen_id: "customer",
          companyId: req.user.companyId,
        });
        console.log("numberseqData.data", numberseqData);
        let seq = 1;
        let code = "";
        if (numberseqData) {
          seq = numberseqData.seq || 1;
          code = numberseqData.code || "";
        }
        //******** */

        // const newCustomer = new Customer({
        //   email: fields.email[0],
        //   name: fields.name[0],
        //   phone_no: fields.phone_no[0],
        //   joinDate: fields.joinDate[0],
        //   status: fields.status[0],
        //   customer_image: photoUrl,
        //   password: hashPassword,
        //   customer_code: code || "",
        //   registration_no: fields.registration_no[0],

        //   seq: seq || 1,
        //   company: req.user.id,
        // });

        // const newCustomer = new Customer({
        //   ...fields[0],
        //   customer_code: code,
        //   customer_image: photoUrl,
        //   password: hashPassword,
        //   seq: seq || 1,
        //   company: req.user.id,
        // });
        const newCustomer = new Customer({
          ...Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [key, value[0]]),
          ),
          customer_code: code,
          customer_image: photoUrl,
          password: hashPassword,
          seq: seq || 1,
          company: req.user.id,
        });

        const savedData = await newCustomer.save();

        //*****Update numberseq */
        const numberseqAfterUpdate = await updateNumberseqWithScreenId({
          screen_id: "customer",
          companyId: req.user.companyId,
        });
        console.log("numberseqAfterUpdate", numberseqAfterUpdate);
        //************ */

        res.status(200).json({
          success: true,
          data: savedData,
          message: "Customer is Registered Successfully.",
        });
      } catch (e) {
        console.log("Error in Register:", e);
        res
          .status(500)
          .json({ success: false, message: "Failed Registration." });
      }
    });
  },
  loginCustomer: async (req, res) => {
    Customer.find({ email: req.body.email }).then((resp) => {
      if (resp.length > 0) {
        const isAuth = bcrypt.compareSync(req.body.password, resp[0].password);
        if (isAuth) {
          const token = jwt.sign(
            {
              id: resp[0]._id,
              companyId: resp[0].company,
              email: resp[0].email,
              image_url: resp[0].image_url,
              name: resp[0].name,
              role: "CUSTOMER",
            },
            jwtSecret,
          );

          res.header("Authorization", token);

          res.status(200).json({
            success: true,
            message: "Success Login",
            user: {
              id: resp[0]._id,
              email: resp[0].email,
              image_url: resp[0].customer_image,
              name: resp[0].name,
              role: "CUSTOMER",
            },
          });
        } else {
          res
            .status(401)
            .json({ success: false, message: "Password doesn't match." });
        }
      } else {
        res
          .status(401)
          .json({ success: false, message: "Email not registerd." });
      }
    });
  },
  getCustomerWithId: async (req, res) => {
    const id = req.params.id;
    const companyId = req.user.companyId;
    try {
      const resp = await Customer.findOne({
        _id: id,
        company: companyId,
      });
      if (resp) {
        const documentAttachments = await Documentattachment.find({
          customer_id: id, // ✅ probably should be customer instead of _id
          company: companyId,
        })
          .populate("attachmenttype")
          .populate("attachmentstatus")
          .lean();

        res.status(200).json({
          success: true,
          data: resp,
          documentAttachments: documentAttachments,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Customer data not Available",
        });
      }
    } catch (e) {
      console.log("Error in getCustomerWithId", e);

      res.status(500).json({
        success: false,
        message: "Error in getting Customer Data",
      });
    }
  },
  getOwnDetails: async (req, res) => {
    const id = req.user.id;
    const companyId = req.user.companyId;
    Customer.findOne({ _id: id, company: companyId })
      .populate("customer_class")
      .populate("section")
      .populate("parent")
      .populate("bloodgroup")
      .populate("nationality")
      .populate("religion")
      .populate("mothertongue")
      .populate("modeoftransport")
      .populate("firstlanguage")
      .then((resp) => {
        if (resp) {
          console.log("data", resp);
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Customer data not Available" });
        }
      })
      .catch((e) => {
        console.log("Error in getCustomerWithId", e);
        res
          .status(500)
          .json({ success: false, message: "Error in getting  Customer Data" });
      });
  },
  updateCustomerWithId: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Error parsing form data." });

      try {
        const { id } = req.params;
        const customer = await Customer.findById(id);
        if (!customer)
          return res
            .status(404)
            .json({ success: false, message: "Customer not found." });

        // Update text fields
        Object.keys(fields).forEach((field) => {
          customer[field] = fields[field][0];
        });

        // Handle image upload to Cloudinary
        if (files.image && files.image[0]) {
          // Optional: Delete old image from Cloudinary if needed
          if (customer.customer_image && customer.public_id) {
            await cloudinary.uploader.destroy(customer.public_id);
          }

          const photo = files.image[0];
          const result = await cloudinary.uploader.upload(photo.filepath, {
            folder: "customers",
            public_id:
              Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
          });
          customer.customer_image = result.secure_url;
          customer.public_id = result.public_id;
        }
        await customer.save();
        res.status(200).json({
          success: true,
          message: "Customer updated successfully",
          data: customer,
        });
      } catch (e) {
        console.log("Error updating customer:", e);
        res.status(500).json({
          success: false,
          message: "Error updating customer details.",
        });
      }
    });
  },

  deleteCustomerWithId: async (req, res) => {
    try {
      let id = req.params.id;
      const companyId = req.user.companyId;
      await Attendance.deleteMany({ company: companyId, customer: id });
      await Customer.findOneAndDelete({ _id: id, company: companyId });
      const customerAfterDelete = await Customer.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Customer  deleted",
        data: customerAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateCustomerWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in deleted Customer. Try later",
      });
    }
  },
  documentAttachmentWithId: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Error parsing form data." });

      try {
        const { id } = req.params;
        const companyId = req.user.id;

        // Create payload object
        const mapRecord = {
          customer_id: id,
          attachmenttype: fields?.attachmenttype?.[0] || "",
          attachmentstatus: fields?.attachmentstatus?.[0] || "",
          attachment_image: "",
          public_id: "",
          year: fields?.year?.[0] || 0,
          company: companyId,
        };

        // Handle image upload to Cloudinary
        // Upload image if exists
        if (files?.image?.[0]) {
          const photo = files.image[0];

          const result = await cloudinary.uploader.upload(photo.filepath, {
            folder: "customers",
            public_id:
              Date.now() + "_" + photo.originalFilename.replace(/\s+/g, "_"),
          });

          // ✅ Correct assignment
          mapRecord.attachment_image = result.secure_url;
          mapRecord.public_id = result.public_id;
        }

        // If updating existing attachment
        if (fields?._id?.[0]) {
          const existingAttachment = await Documentattachment.findOne({
            _id: fields._id[0],
            company: companyId,
          });

          if (existingAttachment) {
            // Delete old cloudinary image if new image uploaded
            if (files?.image?.[0] && existingAttachment.public_id) {
              await cloudinary.uploader.destroy(existingAttachment.public_id);
            }

            // Update existing document
            await Documentattachment.findByIdAndUpdate(
              existingAttachment._id,
              mapRecord,
              { new: true },
            );
          }
        } else {
          // Create new document
          const newDocumentAttachment =
            await Documentattachment.create(mapRecord);
        }

        res.status(200).json({
          success: true,
          message: "Customer Document Attachment successfully",
          data: mapRecord,
        });
      } catch (e) {
        console.log("Error Document Attachment:", e);
        res.status(500).json({
          success: false,
          message: "Error Document Attachment customer details.",
        });
      }
    });
  },
  deleteDocumentAttachmentWithId: async (req, res) => {
    try {
      let id = req.params.id;
      const companyId = req.user.companyId;
      await Documentattachment.findOneAndDelete({
        _id: id,
        company: companyId,
      });
      const documentAttachmentAfterDelete = await Documentattachment.findOne({
        _id: id,
      });
      res.status(200).json({
        success: true,
        message: "Document attachment  deleted",
        data: documentAttachmentAfterDelete,
      });
    } catch (error) {
      console.log("Error in deleteDocumentAttachmentWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in deleted Document Attachment. Try later",
      });
    }
  },
  signOut: async (req, res) => {
    try {
      res.header("Authorization", "");
      ("Authorization");
      res.status(200).json({
        success: true,
        messsage: "Customer Signed Out  Successfully.",
      });
    } catch (error) {
      console.log("Error in Sign out", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Signing Out. Try later",
      });
    }
  },
  isCustomerLoggedIn: async (req, res) => {
    try {
      let token = req.header("Authorization");
      if (token) {
        var decoded = jwt.verify(token, jwtSecret);
        console.log(decoded);
        if (decoded) {
          res.status(200).json({
            success: true,
            data: decoded,
            message: "Customer is a logged in One",
          });
        } else {
          res
            .status(401)
            .json({ success: false, message: "You are not Authorized." });
        }
      } else {
        res
          .status(401)
          .json({ success: false, message: "You are not Authorized." });
      }
    } catch (error) {
      console.log("Error in isCustomerLoggedIn", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Customer Logged in check. Try later",
      });
    }
  },
};
async function saveDocumentAttachements(files) {}
