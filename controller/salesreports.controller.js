require("dotenv").config();
const axios = require("axios");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const mongoose = require("mongoose");

const Salesinvoice = require("../model/salesinvoice.model");
const Salesinvoicedetail = require("../model/salesinvoicedetail.model");

const Accountlevel = require("../model/accountlevel.model");
const Accountledger = require("../model/accountledger.model");

const Receipt = require("../model/receipt.model");
const Receiptdetail = require("../model/receiptdetail.model");

const Customer = require("../model/customer.model");
const Company = require("../model/company.model");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

module.exports = {
  getCustomerListPrint: async (req, res) => {
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

      const data = await await Customer.find(filterQuery)
        .populate("geolocation")
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

        // Company Name (bold)
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text(companyInfo.company_name || "Company Name", textStartX, logoY, {
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
          .text("Customer List Report", 0, titleY, {
            align: "center",
          });

        let y = titleY + 25; // 👉 proper gap after title

        // -----------------------------
        // 📊 TABLE HEADER START
        // -----------------------------

        const tableWidth = doc.page.width - 80; // full width with margins

        const columns = [
          { label: "Customer Name", key: "name", width: tableWidth * 0.15 },
          {
            label: "Customer Code",
            key: "customer_code",
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
              case "customer_code":
                value = row?.customer_code;
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
      console.error("Error generating Customerlist", err.message);
      res.status(500).json({
        success: false,
        message: "Error generating Customerlist",
      });
    }
  },
  printSalesSummaryCustomer: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const companyObjectId = new mongoose.Types.ObjectId(companyId);
      const companyInfo = await Company.findById(companyId).lean();

      let fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);

      let toDate = new Date();
      toDate.setHours(23, 59, 59, 999);

      if (req.query.fromDate) {
        fromDate = new Date(req.query.fromDate);
        fromDate.setHours(0, 0, 0, 0);
      }

      if (req.query.toDate) {
        toDate = new Date(req.query.toDate);
        toDate.setHours(23, 59, 59, 999);
      }

      let requesttype = "";
      if (req.query.requesttype) {
        requesttype = req.query?.requesttype;
      }

      let matchedCriteria = {
        company: companyObjectId,
        status: "valid",
      };
      let customer_id = "";
      let customer_name = "";
      let customer_code = "";
      if (req.query.customer) {
        customer_id = req.query?.customer?._id;
        customer_name = req.query?.customer?.name;
        customer_code = req.query?.customer?.customer_code;
        matchedCriteria.customer = new mongoose.Types.ObjectId(customer_id);
      }

      let item_id = "";
      let item_name = "";
      let item_code = "";
      if (req.query.item) {
        item_id = req.query?.item?._id;
        item_name = req.query?.item?.name;
        item_code = req.query?.item?.code;
        matchedCriteria.item = new mongoose.Types.ObjectId(item_id);
      }

      const data = await Salesinvoicedetail.aggregate([
        // 1. Filter detail records
        {
          $match: matchedCriteria,
        },

        // 2. Join Salesinvoice Header
        {
          $lookup: {
            from: "salesinvoices",
            localField: "siId",
            foreignField: "_id",
            as: "invoice",
          },
        },

        // 3. Convert invoice array to object
        {
          $unwind: "$invoice",
        },

        // 4. Filter based on Salesinvoice.invoiceDate
        {
          $match: {
            "invoice.invoiceDate": {
              $gte: new Date(fromDate),
              $lte: new Date(toDate),
            },
            "invoice.status": "valid",
          },
        },

        // 5. Group by customer
        {
          $group: {
            _id: "$customer",

            totalGrossAmount: {
              $sum: "$grossAmount",
            },

            totalDiscountAmount: {
              $sum: "$discountAmount",
            },

            totalTaxAmount: {
              $sum: "$tax_amount",
            },

            totalTaxableAmount: {
              $sum: "$taxable_amount",
            },

            totalNetAmount: {
              $sum: "$netAmount",
            },
          },
        },

        // 6. Populate Customer
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "_id",
            as: "customer",
          },
        },

        // 7. Convert customer array to object
        {
          $unwind: {
            path: "$customer",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 8. Select required fields
        {
          $project: {
            _id: 0,

            customerId: "$_id",

            customer: "$customer",

            totalGrossAmount: 1,
            totalDiscountAmount: 1,
            totalTaxAmount: 1,
            totalTaxableAmount: 1,
            totalNetAmount: 1,
          },
        },

        // 9. Sort
        {
          $sort: {
            totalNetAmount: -1,
          },
        },
      ]);

      console.log(data);

      // ✅ Grand Total of Net Amount for ALL Customers
      // =====================================
      // GRAND TOTALS OF ALL CUSTOMERS
      // =====================================

      const grandTotals = data.reduce(
        (total, row) => {
          total.grossAmount += Number(row.totalGrossAmount || 0);
          total.discountAmount += Number(row.totalDiscountAmount || 0);
          total.taxAmount += Number(row.totalTaxAmount || 0);
          total.taxableAmount += Number(row.totalTaxableAmount || 0);
          total.netAmount += Number(row.totalNetAmount || 0);

          return total;
        },
        {
          grossAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          taxableAmount: 0,
          netAmount: 0,
        },
      );

      console.log("Grand Totals:", grandTotals);

      const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      };

      if (requesttype === "PDF") {
        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape",
          margins: {
            top: 30,
            bottom: 30,
            left: 30,
            right: 30,
          },
          bufferPages: true,
        });

        // ✅ SET HEADERS BEFORE PIPE
        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            "attachment; filename=salessummarycustomer.pdf",
        });

        const drawFooter = (doc, pageNumber, totalPages) => {
          // Keep footer safely above the bottom margin
          const footerY = doc.page.height - 45;

          // Footer line
          doc
            .moveTo(40, footerY - 8)
            .lineTo(doc.page.width - 40, footerY - 8)
            .stroke();

          // Page number
          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor("black")
            .text(`Page ${pageNumber} of ${totalPages}`, 40, footerY, {
              width: doc.page.width - 80,
              align: "center",
              lineBreak: false, // ⭐ IMPORTANT
            });
        };

        doc.pipe(res);

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

        // Company Name (bold)
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text(companyInfo.company_name || "Company Name", textStartX, logoY, {
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
        let titleY = dividerY + 15;

        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Customer Sales Summary", 0, titleY, {
            align: "center",
          });

        if (customer_code || customer_name) {
          titleY = titleY + 25;
          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .text(
              "Customer : " + customer_code + "-" + customer_name,
              0,
              titleY,
              {
                align: "center",
              },
            );
        }

        if (item_code || item_name) {
          titleY = titleY + 25;
          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("Item : " + item_code + "-" + item_name, 0, titleY, {
              align: "center",
            });
        }

        let y = titleY + 25; // 👉 proper gap after title

        // -----------------------------
        // 📊 TABLE HEADER START
        // -----------------------------

        const tableWidth = doc.page.width - 80; // full width with margins

        const columns = [
          {
            label: "Customer Name",
            key: "name",
            width: tableWidth * 0.2,
            align: "left",
          },
          {
            label: "Customer Code",
            key: "customer_code",
            width: tableWidth * 0.1,
            align: "left",
          },
          {
            label: "Phone #",
            key: "phone_no",
            width: tableWidth * 0.1,
            align: "left",
          },
          {
            label: "Gross Amount",
            key: "totalGrossAmount",
            width: tableWidth * 0.12,
            align: "right",
          },
          {
            label: "Discount Amount",
            key: "totalDiscountAmount",
            width: tableWidth * 0.12,
            align: "right",
          },
          {
            label: "Taxable Amount",
            key: "totalTaxableAmount",
            width: tableWidth * 0.12,
            align: "right",
          },
          {
            label: "Tax Amount",
            key: "totalTaxAmount",
            width: tableWidth * 0.12,
            align: "right",
          },

          {
            label: "Net Amount",
            key: "totalNetAmount",
            width: tableWidth * 0.12,
            align: "right",
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
              align: col.align || "center",
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
                value = row?.customer?.name || "-";
                break;

              case "customer_code":
                value = row?.customer?.customer_code || "-";
                break;

              case "phone_no":
                value = row?.customer?.phone_no || "-";
                break;

              case "totalGrossAmount":
                value = formatAmount(row?.totalGrossAmount || 0);
                break;

              case "totalDiscountAmount":
                value = formatAmount(row?.totalDiscountAmount || 0);
                break;

              case "totalTaxableAmount":
                value = formatAmount(row?.totalTaxableAmount || 0);
                break;

              case "totalTaxAmount":
                value = formatAmount(row?.totalTaxAmount || 0);
                break;

              case "totalNetAmount":
                value = formatAmount(row?.totalNetAmount || 0);
                break;
            }
            const height = getTextHeight(doc, value, col.width);
            if (height > maxHeight) maxHeight = height;

            return value;
          });

          const rowHeight = maxHeight + 10;

          // 🔁 Page break
          // if (y + rowHeight > doc.page.height - 40) {
          if (y + rowHeight > doc.page.height - 65) {
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
              align: col.align || "left",
            });

            x += col.width;
          });

          y += rowHeight;
        };

        drawHeader();

        data.forEach((row, index) => {
          drawRow(row, index);
        });

        // =====================================
        // GRAND TOTAL ROW
        // =====================================

        const totalRowHeight = 25;

        const actualTableWidth = columns.reduce(
          (total, col) => total + col.width,
          0,
        );

        // Page break
        if (y + totalRowHeight > doc.page.height - 65) {
          doc.addPage();
          y = 50;
          drawHeader();
        }

        // Total row background
        doc
          .rect(40, y, actualTableWidth, totalRowHeight)
          .fill("#e6e6e6")
          .fillColor("black");

        // -------------------------------------
        // Draw cells
        // -------------------------------------

        let totalX = 40;

        columns.forEach((col) => {
          // Cell border
          doc.rect(totalX, y, col.width, totalRowHeight).stroke();

          // Customer columns
          if (col.key === "name") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text("Total", totalX + 5, y + 7, {
                width: col.width - 10,
                align: "left",
              });
          }

          // Empty customer code
          else if (col.key === "customer_code") {
            doc.text("", totalX + 5, y + 7, {
              width: col.width - 10,
            });
          }

          // Empty phone
          else if (col.key === "phone_no") {
            doc.text("", totalX + 5, y + 7, {
              width: col.width - 10,
            });
          }

          // Gross Amount
          else if (col.key === "totalGrossAmount") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text(formatAmount(grandTotals.grossAmount), totalX + 5, y + 7, {
                width: col.width - 10,
                align: "right",
              });
          }

          // Discount Amount
          else if (col.key === "totalDiscountAmount") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text(
                formatAmount(grandTotals.discountAmount),
                totalX + 5,
                y + 7,
                {
                  width: col.width - 10,
                  align: "right",
                },
              );
          }
          // Taxable Amount
          else if (col.key === "totalTaxableAmount") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text(
                formatAmount(grandTotals.taxableAmount),
                totalX + 5,
                y + 7,
                {
                  width: col.width - 10,
                  align: "right",
                },
              );
          }
          // Tax Amount
          else if (col.key === "totalTaxAmount") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text(formatAmount(grandTotals.taxAmount), totalX + 5, y + 7, {
                width: col.width - 10,
                align: "right",
              });
          }

          // Net Amount
          else if (col.key === "totalNetAmount") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text(formatAmount(grandTotals.netAmount), totalX + 5, y + 7, {
                width: col.width - 10,
                align: "right",
              });
          }

          totalX += col.width;
        });

        y += totalRowHeight;

        // =====================================
        // FOOTER - PAGE X OF TOTAL
        // =====================================

        const range = doc.bufferedPageRange();

        const totalPages = range.count;

        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(range.start + i);
          drawFooter(doc, i + 1, totalPages);
        }

        // =====================================
        // END PDF
        // =====================================

        doc.end();
      } else {
        res.status(200).json({
          success: true,
          data: data, // contains data
        });
      }
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  printSalesSummaryItem: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const companyObjectId = new mongoose.Types.ObjectId(companyId);
      const companyInfo = await Company.findById(companyId).lean();

      let fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);

      let toDate = new Date();
      toDate.setHours(23, 59, 59, 999);

      if (req.query.fromDate) {
        fromDate = new Date(req.query.fromDate);
        fromDate.setHours(0, 0, 0, 0);
      }

      if (req.query.toDate) {
        toDate = new Date(req.query.toDate);
        toDate.setHours(23, 59, 59, 999);
      }

      let requesttype = "";
      if (req.query.requesttype) {
        requesttype = req.query?.requesttype;
      }

      let matchedCriteria = {
        company: companyObjectId,
        status: "valid",
      };
      let customer_id = "";
      let customer_name = "";
      let customer_code = "";
      if (req.query.customer) {
        customer_id = req.query?.customer?._id;
        customer_name = req.query?.customer?.name;
        customer_code = req.query?.customer?.customer_code;
        matchedCriteria.customer = new mongoose.Types.ObjectId(customer_id);
      }

      let item_id = "";
      let item_name = "";
      let item_code = "";
      if (req.query.item) {
        item_id = req.query?.item?._id;
        item_name = req.query?.item?.name;
        item_code = req.query?.item?.code;
        matchedCriteria.item = new mongoose.Types.ObjectId(item_id);
      }

      const data = await Salesinvoicedetail.aggregate([
        // 1. Filter detail records
        {
          $match: matchedCriteria,
        },

        // 2. Join Sales Invoice Header
        {
          $lookup: {
            from: "salesinvoices",
            localField: "siId",
            foreignField: "_id",
            as: "invoice",
          },
        },

        // 3. Convert invoice array to object
        {
          $unwind: "$invoice",
        },

        // 4. Filter invoice date and status
        {
          $match: {
            "invoice.invoiceDate": {
              $gte: new Date(fromDate),
              $lte: new Date(toDate),
            },
            "invoice.status": "valid",
          },
        },

        // 5. GROUP BY ITEM
        {
          $group: {
            _id: "$item",

            totalGrossAmount: {
              $sum: "$grossAmount",
            },

            totalDiscountAmount: {
              $sum: "$discountAmount",
            },

            totalTaxAmount: {
              $sum: "$tax_amount",
            },

            totalTaxableAmount: {
              $sum: "$taxable_amount",
            },

            totalNetAmount: {
              $sum: "$netAmount",
            },
          },
        },

        // 6. Populate Item
        {
          $lookup: {
            from: "items",
            localField: "_id",
            foreignField: "_id",
            as: "item",
          },
        },

        // 7. Convert item array to object
        {
          $unwind: {
            path: "$item",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 8. Select required fields
        {
          $project: {
            _id: 0,
            itemId: "$_id",
            item: "$item",
            totalGrossAmount: 1,
            totalDiscountAmount: 1,
            totalTaxAmount: 1,
            totalTaxableAmount: 1,
            totalNetAmount: 1,
          },
        },

        // 9. Sort by Net Amount
        {
          $sort: {
            totalNetAmount: -1,
          },
        },
      ]);

      console.log(data);

      // ✅ Grand Total of Net Amount for ALL Customers
      // =====================================
      // GRAND TOTALS OF ALL CUSTOMERS
      // =====================================

      const grandTotals = data.reduce(
        (total, row) => {
          total.grossAmount += Number(row.totalGrossAmount || 0);
          total.discountAmount += Number(row.totalDiscountAmount || 0);
          total.taxAmount += Number(row.totalTaxAmount || 0);
          total.taxableAmount += Number(row.totalTaxableAmount || 0);
          total.netAmount += Number(row.totalNetAmount || 0);

          return total;
        },
        {
          grossAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          taxableAmount: 0,
          netAmount: 0,
        },
      );

      console.log("Grand Totals:", grandTotals);

      const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      };

      if (requesttype === "PDF") {
        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape",
          margins: {
            top: 30,
            bottom: 30,
            left: 30,
            right: 30,
          },
          bufferPages: true,
        });

        // ✅ SET HEADERS BEFORE PIPE
        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=salessummaryitem.pdf",
        });

        const drawFooter = (doc, pageNumber, totalPages) => {
          // Keep footer safely above the bottom margin
          const footerY = doc.page.height - 45;

          // Footer line
          doc
            .moveTo(40, footerY - 8)
            .lineTo(doc.page.width - 40, footerY - 8)
            .stroke();

          // Page number
          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor("black")
            .text(`Page ${pageNumber} of ${totalPages}`, 40, footerY, {
              width: doc.page.width - 80,
              align: "center",
              lineBreak: false, // ⭐ IMPORTANT
            });
        };

        doc.pipe(res);

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

        // Company Name (bold)
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text(companyInfo.company_name || "Company Name", textStartX, logoY, {
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
        let titleY = dividerY + 15;

        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Item Sales Summary", 0, titleY, {
            align: "center",
          });

        if (customer_code || customer_name) {
          titleY = titleY + 25;
          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .text(
              "Customer : " + customer_code + "-" + customer_name,
              0,
              titleY,
              {
                align: "center",
              },
            );
        }

        if (item_code || item_name) {
          titleY = titleY + 25;
          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("Item : " + item_code + "-" + item_name, 0, titleY, {
              align: "center",
            });
        }

        let y = titleY + 25; // 👉 proper gap after title

        // -----------------------------
        // 📊 TABLE HEADER START
        // -----------------------------

        const tableWidth = doc.page.width - 80; // full width with margins

        const columns = [
          {
            label: "Item Name",
            key: "name",
            width: tableWidth * 0.2,
            align: "left",
          },
          {
            label: "Item Code",
            key: "item_code",
            width: tableWidth * 0.1,
            align: "left",
          },
          {
            label: "Itemtype",
            key: "itemtype",
            width: tableWidth * 0.1,
            align: "left",
          },
          {
            label: "Gross Amount",
            key: "totalGrossAmount",
            width: tableWidth * 0.12,
            align: "right",
          },
          {
            label: "Discount Amount",
            key: "totalDiscountAmount",
            width: tableWidth * 0.12,
            align: "right",
          },
          {
            label: "Taxable Amount",
            key: "totalTaxableAmount",
            width: tableWidth * 0.12,
            align: "right",
          },
          {
            label: "Tax Amount",
            key: "totalTaxAmount",
            width: tableWidth * 0.12,
            align: "right",
          },

          {
            label: "Net Amount",
            key: "totalNetAmount",
            width: tableWidth * 0.12,
            align: "right",
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
              align: col.align || "center",
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
                value = row?.item?.name || "-";
                break;

              case "item_code":
                value = row?.item?.item_code || "-";
                break;

              case "itemtype":
                value = row?.item?.itemtype || "-";
                break;

              case "totalGrossAmount":
                value = formatAmount(row?.totalGrossAmount || 0);
                break;

              case "totalDiscountAmount":
                value = formatAmount(row?.totalDiscountAmount || 0);
                break;

              case "totalTaxableAmount":
                value = formatAmount(row?.totalTaxableAmount || 0);
                break;

              case "totalTaxAmount":
                value = formatAmount(row?.totalTaxAmount || 0);
                break;

              case "totalNetAmount":
                value = formatAmount(row?.totalNetAmount || 0);
                break;
            }
            const height = getTextHeight(doc, value, col.width);
            if (height > maxHeight) maxHeight = height;

            return value;
          });

          const rowHeight = maxHeight + 10;

          // 🔁 Page break
          // if (y + rowHeight > doc.page.height - 40) {
          if (y + rowHeight > doc.page.height - 65) {
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
              align: col.align || "left",
            });

            x += col.width;
          });

          y += rowHeight;
        };

        drawHeader();

        data.forEach((row, index) => {
          drawRow(row, index);
        });

        // =====================================
        // GRAND TOTAL ROW
        // =====================================

        const totalRowHeight = 25;

        const actualTableWidth = columns.reduce(
          (total, col) => total + col.width,
          0,
        );

        // Page break
        if (y + totalRowHeight > doc.page.height - 65) {
          doc.addPage();
          y = 50;
          drawHeader();
        }

        // Total row background
        doc
          .rect(40, y, actualTableWidth, totalRowHeight)
          .fill("#e6e6e6")
          .fillColor("black");

        // -------------------------------------
        // Draw cells
        // -------------------------------------

        let totalX = 40;

        columns.forEach((col) => {
          // Cell border
          doc.rect(totalX, y, col.width, totalRowHeight).stroke();

          // Item columns
          if (col.key === "name") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text("Total", totalX + 5, y + 7, {
                width: col.width - 10,
                align: "left",
              });
          }

          // Empty item code
          else if (col.key === "item_code") {
            doc.text("", totalX + 5, y + 7, {
              width: col.width - 10,
            });
          }

          // Empty itemtype
          else if (col.key === "itemtype") {
            doc.text("", totalX + 5, y + 7, {
              width: col.width - 10,
            });
          }

          // Gross Amount
          else if (col.key === "totalGrossAmount") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text(formatAmount(grandTotals.grossAmount), totalX + 5, y + 7, {
                width: col.width - 10,
                align: "right",
              });
          }

          // Discount Amount
          else if (col.key === "totalDiscountAmount") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text(
                formatAmount(grandTotals.discountAmount),
                totalX + 5,
                y + 7,
                {
                  width: col.width - 10,
                  align: "right",
                },
              );
          }
          // Taxable Amount
          else if (col.key === "totalTaxableAmount") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text(
                formatAmount(grandTotals.taxableAmount),
                totalX + 5,
                y + 7,
                {
                  width: col.width - 10,
                  align: "right",
                },
              );
          }
          // Tax Amount
          else if (col.key === "totalTaxAmount") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text(formatAmount(grandTotals.taxAmount), totalX + 5, y + 7, {
                width: col.width - 10,
                align: "right",
              });
          }

          // Net Amount
          else if (col.key === "totalNetAmount") {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("black")
              .text(formatAmount(grandTotals.netAmount), totalX + 5, y + 7, {
                width: col.width - 10,
                align: "right",
              });
          }

          totalX += col.width;
        });

        y += totalRowHeight;

        // =====================================
        // FOOTER - PAGE X OF TOTAL
        // =====================================

        const range = doc.bufferedPageRange();

        const totalPages = range.count;

        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(range.start + i);
          drawFooter(doc, i + 1, totalPages);
        }

        // =====================================
        // END PDF
        // =====================================

        doc.end();
      } else {
        res.status(200).json({
          success: true,
          data: data, // contains data
        });
      }
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
};
