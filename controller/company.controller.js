require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWTSECRET;

const Company = require("../model/company.model");
const cloudinary = require("../config/cloudinary");

module.exports = {
  getAllCompanys: async (req, res) => {
    try {
      const companys = await Company.find().select([
        "-_id",
        "-password",
        "-email",
        "-owner_name",
        "-createdAt",
      ]);
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Companys",
        data: companys,
      });
    } catch (error) {
      console.log("Error in getAllCompanys", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Companys. Try later",
      });
    }
  },
  registerCompany: async (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Error parsing form data." });

      try {
        const existing = await Company.find({ email: fields.email[0] });
        if (existing.length > 0)
          return res
            .status(500)
            .json({ success: false, message: "Email Already Exist!" });

        let photoUrl = null;
        if (files.image && files.image[0]) {
          const photo = files.image[0];
          const result = await cloudinary.uploader.upload(photo.filepath, {
            folder: "students",
            public_id:
              Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
          });
          photoUrl = result.secure_url;
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(fields.password[0], salt);

        const newCompany = new Company({
          company_name: fields.company_name[0],
          email: fields.email[0],
          owner_name: fields.owner_name[0],
          address: fields.address[0],
          city: fields.city[0],
          state: fields.state[0],
          zipcode: fields.zipcode[0],
          country: fields.country[0],
          password: hashPassword,
          company_image: photoUrl,
        });

        const savedData = await newCompany.save();
        res.status(200).json({
          success: true,
          data: savedData,
          message: "Company is Registered Successfully.",
        });
      } catch (e) {
        console.log("Error in Register:", e);
        res.status(500).json({
          success: false,
          message: "Failed Registration." + e.message,
        });
      }
    });
  },
  loginCompany: async (req, res) => {
    try {
      const resp = await Company.find({ email: req.body.email });

      if (resp.length > 0) {
        const isAuth = bcrypt.compareSync(req.body.password, resp[0].password);

        if (isAuth) {
          const token = jwt.sign(
            {
              id: resp[0]._id,
              companyId: resp[0]._id,
              company_name: resp[0].company_name,
              owner_name: resp[0].owner_name,
              image_url: resp[0].company_image,
              role: "COMPANY",
            },
            jwtSecret,
          );

          res.header("Authorization", token);

          return res.status(200).json({
            success: true,
            message: "Success Login",
            user: {
              id: resp[0]._id,
              owner_name: resp[0].owner_name,
              company_name: resp[0].company_name,
              image_url: resp[0].company_image,
              role: "COMPANY",
            },
          });
        } else {
          return res.status(401).json({
            success: false,
            message: "Password doesn't match.",
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: "Email not registered.",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  getCompanyOwnData: async (req, res) => {
    const id = req.user.id;
    Company.findById(id)
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Company data not Available" });
        }
      })
      .catch((e) => {
        console.log("Error in getCompanyWithId", e);
        res
          .status(500)
          .json({ success: false, message: "Error in getting  Company Data" });
      });
  },

  updateCompanyWithId: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      console.log(fields);
      if (err) {
        return res
          .status(400)
          .json({ message: "Error parsing the form data." });
      }
      try {
        const id = req.user.id;
        const company = await Company.findById(id);

        if (!company) {
          return res.status(404).json({ message: "Company not found." });
        }

        // Update text fields
        Object.keys(fields).forEach((field) => {
          company[field] = fields[field][0];
        });

        // Handle image upload to Cloudinary
        if (files.image && files.image[0]) {
          // Optional: Delete old image from Cloudinary if needed
          if (company.company_image && company.public_id) {
            await cloudinary.uploader.destroy(company.public_id);
          }

          const photo = files.image[0];
          const result = await cloudinary.uploader.upload(photo.filepath, {
            folder: "company",
            public_id:
              Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
          });
          company.company_image = result.secure_url;
          company.public_id = result.public_id;
        }
        // Save the updated company document
        await company.save();
        res
          .status(200)
          .json({ message: "Company updated successfully", data: company });
      } catch (e) {
        console.log(e);
        res
          .status(500)
          .json({ message: "Error updating company details." + e.message });
      }
    });
  },
  signOut: async (req, res) => {
    try {
      res.header("Authorization", "");
      // "Authorization"
      res
        .status(200)
        .json({ success: true, messsage: "Company Signed Out  Successfully." });
    } catch (error) {
      console.log("Error in Sign out", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Signing Out. Try later",
      });
    }
  },
  isCompanyLoggedIn: async (req, res) => {
    try {
      let token = req.header("Authorization");
      if (token) {
        var decoded = jwt.verify(token, jwtSecret);
        console.log(decoded);
        if (decoded) {
          res.status(200).json({
            success: true,
            data: decoded,
            message: "Company is a logged in One",
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
      console.log("Error in isCompanyLoggedIn", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Company Logged in check. Try later",
      });
    }
  },
};
