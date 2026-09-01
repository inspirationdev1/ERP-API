require("dotenv").config();
const axios = require("axios");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const mongoose = require("mongoose");

const Purcahseinvoice = require("../model/purchaseinvoice.model");
const Purcahseinvoicedetail = require("../model/purchaseinvoicedetail.model");

const Accountlevel = require("../model/accountlevel.model");
const Accountledger = require("../model/accountledger.model");

const Supplierpayment = require("../model/supplierpayment.model");
const Supplierpaymentdetail = require("../model/supplierpaymentdetail.model");

const Supplier = require("../model/supplier.model");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

module.exports = {
  getSupplierListPrint: async (req, res) => {
    try {
      const filterQuery = {};
      const companyId = req.user.companyId;
      console.log(companyId, "companyId");
      filterQuery["company"] = new mongoose.Types.ObjectId(companyId);

      if (req.query.class) {
        const classId = new mongoose.Types.ObjectId(req.query.class);
        filterQuery.student_class = classId;
      }

      if (req.query.section) {
        const sectionId = new mongoose.Types.ObjectId(req.query.section);
        filterQuery.section = sectionId;
      }
      let requesttype = "";
      if (req.query.requesttype) {
        requesttype = req.query?.requesttype;
      }

      const data = await await Supplier.find(filterQuery)
        .populate("company")
        .lean();

      if (requesttype === "PDF") {
        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape", // ✅ IMPORTANT
          margin: 30,
        });

        // ✅ SET HEADERS BEFORE PIPE
        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=studentlist.pdf",
        });

        doc.pipe(res);

        const companyInfo = data[0]?.company || {};
        // Logo (IMPORTANT)
        // -----------------------------
        // 🏫 HEADER LAYOUT
        // -----------------------------

        const logoX = 40;
        const logoY = 30;
        const logoWidth = 50;

        const textStartX = logoX + logoWidth + 15; // 👉 right of logo
        const textWidth = 400;

        // Logo
        if (companyInfo?.company_image) {
          try {
            const img = await axios.get(companyInfo.company_image, {
              responseType: "arraybuffer",
            });

            doc.image(img.data, logoX, logoY, {
              width: logoWidth,
              height: 50,
            });
          } catch (err) {
            console.log("Logo load failed");
          }
        }

        if (data.length == 0) {
          // No Data Found (bold)
          doc
            .font("Helvetica-Bold")
            .fontSize(14)
            .text("No Data Found", textStartX, logoY, {
              width: textWidth,
              align: "center",
            });
          doc.end();
          return;
        }

        // School Name (bold)
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text(companyInfo.company_name || "School Name", textStartX, logoY, {
            width: textWidth,
            align: "left",
          });

        // Address
        doc
          .font("Helvetica")
          .fontSize(10)
          .text(
            `${companyInfo.address || ""}, ${companyInfo.city || ""}, ${companyInfo.state || ""}`,
            textStartX,
            logoY + 20,
            {
              width: textWidth,
              align: "left",
            },
          );

        // -----------------------------
        // ➖ Divider Line
        // -----------------------------
        const dividerY = logoY + 60;

        doc
          .moveTo(40, dividerY)
          .lineTo(doc.page.width - 40, dividerY)
          .stroke();

        // -----------------------------
        // 📄 REPORT TITLE (with gap)
        // -----------------------------
        const titleY = dividerY + 15;

        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Supplier List Report", 0, titleY, {
            align: "center",
          });

        let y = titleY + 25; // 👉 proper gap after title

        // -----------------------------
        // 📊 TABLE HEADER START
        // -----------------------------

        const tableWidth = doc.page.width - 80; // full width with margins

        const columns = [
          { label: "Supplier Name", key: "name", width: tableWidth * 0.15 },
          {
            label: "Supplier Code",
            key: "supplier_code",
            width: tableWidth * 0.12,
          },
          { label: "Date", key: "joinDate", width: tableWidth * 0.12 },
          {
            label: "Phone #",
            key: "phone_no",
            width: tableWidth * 0.12,
          },
        ];

        const getTextHeight = (doc, text, width) => {
          return doc.heightOfString(text || "-", {
            width: width - 10,
          });
        };

        const drawHeader = () => {
          let x = 40;

          doc.font("Helvetica-Bold").fontSize(9);

          columns.forEach((col) => {
            // ✅ Draw background FIRST
            doc.rect(x, y, col.width, 25).fill("#f2f2f2");

            // ✅ Draw border AFTER
            doc.rect(x, y, col.width, 25).stroke();

            // ✅ Reset text color (VERY IMPORTANT)
            doc.fillColor("black");

            // ✅ Draw text LAST
            doc.text(col.label, x + 5, y + 7, {
              width: col.width - 10,
              align: "center",
            });

            x += col.width;
          });

          y += 25;
        };

        // doc.fontSize(9);
        doc.fontSize(10);

        const drawRow = (row, index) => {
          let x = 40;

          // 🔥 Calculate dynamic height
          let maxHeight = 0;

          const values = columns.map((col) => {
            let value = "-";

            switch (col.key) {
              case "name":
                value = row.name;
                break;
              case "supplier_code":
                value = row?.supplier_code;
                break;

              case "joinDate":
                value = row?.joinDate
                  ? dayjs(row.joinDate).format("DD-MM-YYYY")
                  : "-";
                break;
              case "phone_no":
                value = row?.phone_no;
                break;
            }

            const height = getTextHeight(doc, value, col.width);
            if (height > maxHeight) maxHeight = height;

            return value;
          });

          const rowHeight = maxHeight + 10;

          // 🔁 Page break
          if (y + rowHeight > doc.page.height - 40) {
            doc.addPage();
            y = 50;
            drawHeader();
          }

          // Zebra row (optional)
          if (index % 2 === 0) {
            doc
              .rect(40, y, tableWidth, rowHeight)
              .fill("#fafafa")
              .fillColor("black");
          }

          // Draw cells
          x = 40;

          values.forEach((value, i) => {
            const col = columns[i];
            // Border
            doc.rect(x, y, col.width, rowHeight).stroke();

            // Text (WRAPPED)
            doc.text(value || "-", x + 5, y + 5, {
              width: col.width - 10,
              align: "left",
            });

            x += col.width;
          });

          y += rowHeight;
        };

        drawHeader();

        data.forEach((row, index) => {
          drawRow(row, index);
        });

        doc.end();
      } else {
        res.status(200).json({
          success: true,
          data: data, // contains data
        });
      }
    } catch (err) {
      console.error(err);
      // res.status(500).send("Error generating PDF");
      console.error("Error generating Supplierlist", err.message);
      res.status(500).json({
        success: false,
        message: "Error generating Supplierlist",
      });
    }
  },
  
};
