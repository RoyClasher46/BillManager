const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

const billsRouter = require('./routes/bills');
const storesRouter = require('./routes/stores');
const paymentsRouter = require('./routes/payments');
app.use('/api/bills', billsRouter);
app.use('/api/stores', storesRouter);
app.use('/api/payments', paymentsRouter);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("DB Error: ", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
