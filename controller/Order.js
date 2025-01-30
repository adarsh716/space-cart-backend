const { Order } = require("../model/Order");
const { Product } = require("../model/Product");
const { User } = require("../model/User");
const { sendMail, invoiceTemplate } = require("../services/common");
const { Cart } = require("../model/Cart");
const mongoose = require("mongoose");

const Razorpay = require("razorpay");
const razorpayInstance = new Razorpay({
  key_id: "rzp_test_afCl1XYx5IYxRU",
  key_secret: "4vyGPSYs2QhOJUueFawmfY0p",
});

exports.fetchOrdersByUser = async (req, res) => {
  const { id } = req.user;
  try {
    const orders = await Order.find({ user: id }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.createOrder = async (req, res) => {
  const { totalAmount } = req.body;

  try {
    const paymentOrder = await razorpayInstance.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `order_${new Date().getTime()}`,
      payment_capture: 1,
    });

    res.status(201).json({ paymentOrder, id: paymentOrder?.id });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(400).json(err);
  }
};

exports.capturePayment = async (req, res) => {
  console.log(req.body);

  const { id, order } = req.body;
  const orderResponse = new Order(order);
  try {
    for (let item of order.items) {
      let product = await Product.findOne({ _id: item.product.id });
      product.stock -= item.quantity;
      await product.save();
    }

    orderResponse.paymentId = id;

    const doc = await orderResponse.save();

    const doc1 = await Cart.deleteMany({
      user: new mongoose.Types.ObjectId(order.user),
    });

    const user = await User.findById(order.user);

    sendMail({
      to: user.email,
      html: invoiceTemplate(order),
      subject: "Order Received",
    });

    res.status(201).json({ order: doc, success: true });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(400).json(err);
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndDelete(id);
    res.status(200).json(order);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(order);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchAllOrders = async (req, res) => {
  let query = Order.find({ deleted: { $ne: true } });
  let totalOrdersQuery = Order.find({ deleted: { $ne: true } });

  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
  }

  const totalDocs = await totalOrdersQuery.count().exec();
  console.log({ totalDocs });

  if (req.query._page && req.query._limit) {
    const pageSize = req.query._limit;
    const page = req.query._page;
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }

  try {
    const docs = await query.exec();
    res.set("X-Total-Count", totalDocs);
    res.status(200).json(docs);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.countOrders = async (req, res) => {
  try {
    const userOrders = await Order.countDocuments();
    res.status(200).json({
      success: true,
      userOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
