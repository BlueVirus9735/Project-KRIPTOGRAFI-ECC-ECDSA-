const fs = require("fs");
const pdf = require("pdf-parse");

let dataBuffer = fs.readFileSync(
  "C:\\laragon\\www\\PERUM_PERHUTANI\\SKRIPSI ADJI REVISI BAB I.pdf",
);

pdf(dataBuffer)
  .then(function (data) {
    console.log(data.text);
  })
  .catch(function (err) {
    console.log("Error:", err);
  });
