// controllers/subscriptions.controller.js
import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import { handleBadRequest, handleConflict, handleCreated, handleError, handleForbidden, handleNotFound } from "../utils/handleResponse.js";

// === Configuración de populate ===
const populateRefs = [
  { path: "user", select: "_id firstName lastName email" },
  { path: "giftFromId", select: "_id firstName lastName email" },
  { path: "subscriptionPlan", select: "_id name price currency cadence boxType bottlesPerBox" },
];

// === Helper para queries con populate (excluye borrados) ===
const findWithPopulate = (filter = {}) => 
  Subscription.find({ ...filter, isDeleted: false })
    .select("-__v")
    .populate(populateRefs)
    .lean();

const findByIdWithPopulate = (id) =>
  Subscription.findOne({ _id: id, isDeleted: false })
    .select("-__v")
    .populate(populateRefs)
    .lean();

// === Helpers de autorización ===
const isAdmin = (req) => req?.user?.userType === "admin";
const canRead = (req, sub) => {
  const userId = req.user?._id?.toString();
  return isAdmin(req) || 
         sub.user?.toString() === userId || 
         sub.giftFromId?.toString() === userId;
};

// === Controllers ===

// POST /subscriptions (crear suscripción normal)
export const createSubscription = async (req, res) => {
  try {
    const { 
      user, 
      subscriptionPlan, 
      wineType, 
      boxType, 
      boxSize, 
      startDate, 
      nextPayDate, 
      payMethod 
    } = req.body;

    if (!subscriptionPlan || !payMethod) {
      return handleBadRequest(res, "subscriptionPlan and payMethod are required" );
    }

    const created = await Subscription.create({
      user: user ?? req.user?._id,
      subscriptionPlan,
      wineType,
      boxType,
      boxSize,
      startDate,
      nextPayDate,
      status: "pending",
      isGift: false,
      payMethod,
      isDeleted: false,
    });

    const doc = await findByIdWithPopulate(created._id);
    return handleCreated(res, doc, "Subscription created");
  } catch (err) {
    console.error("createSubscription error:", err);
    return  handleError(res, err);
  }
};

// POST /subscriptions/gift (crear regalo)
export const createGift = async (req, res) => {
  try {
    const { 
      user, 
      subscriptionPlan, 
      giftMessage, 
      payMethod, 
      startDate, 
      nextPayDate,
      wineType,
      boxType,
      boxSize
    } = req.body;

    if (!user || !subscriptionPlan || !payMethod) {
         return handleBadRequest(res, "subscriptionPlan, payMethod and user are required" );
    }

    const created = await Subscription.create({
      user,
      subscriptionPlan,
      isGift: true,
      giftFromId: req.user?._id,
      giftMessage,
      payMethod,
      startDate,
      nextPayDate,
      wineType,
      boxType,
      boxSize,
      status: "pending",
      isDeleted: false,
    });

    const doc = await findByIdWithPopulate(created._id);
    return handleCreated(res, doc, "Gift created");
  } catch (err) {
    console.error("createGift error:", err);
   return  handleError(res, err);
  }
};

// GET /subscriptions (admin: todas; user: solo las suyas)
export const listSubscriptions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (!isAdmin(req)) filter.user = req.user?._id;
    if (status) filter.status = status;

    const docs = await findWithPopulate(filter);
    return res.json(docs);
  } catch (err) {
    console.error("listSubscriptions error:", err);
    return  handleError(res, err);
  }
};

// GET /subscriptions/gifts/sent (regalos enviados)
export const listGiftsSent = async (req, res) => {
  try {
    const docs = await findWithPopulate({ 
      isGift: true, 
      giftFromId: req.user?._id 
    });
    return res.json(docs);
  } catch (err) {
    console.error("listGiftsSent error:", err);
    return  handleError(res, err);
  }
};

// GET /subscriptions/gifts/received (regalos recibidos)
export const listGiftsReceived = async (req, res) => {
  try {
    const docs = await findWithPopulate({ 
      isGift: true, 
      user: req.user?._id 
    });
    return res.json(docs);
  } catch (err) {
    console.error("listGiftsReceived error:", err);
    return  handleError(res, err);
  }
};

// GET /subscriptions/:id
export const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {  
      return handleBadRequest(res, err);
    }

    const sub = await Subscription.findOne({ _id: id, isDeleted: false })
      .populate(populateRefs);

    if (!sub) {
      return handleNotFound(res, err);
    }

    if (!canRead(req, sub)) {
      return handleForbidden(res, err);
    }

    return res.json(sub);
  } catch (err) {
    console.error("getSubscriptionById error:", err);
    return  handleError(res, err);
  }
};

// PUT /subscriptions/:id/cancel
export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return handleBadRequest(res, err);;
    }

    const sub = await Subscription.findOne({ _id: id, isDeleted: false });
    if (!sub) {
       return handleNotFound(res, err);;
    }

    if (!canRead(req, sub)) {
      return handleForbidden(res, err);
    }

    if (["canceled", "expired"].includes(sub.status)) {
      return handleConflict(res, err);
    }

    sub.status = "canceled";
    sub.endDate = new Date();
    await sub.save();

    const doc = await findByIdWithPopulate(id);
    return res.json(doc);
  } catch (err) {
    console.error("cancelSubscription error:", err);
    return  handleError(res, err);
  }
};

// PUT /subscriptions/:id (actualizar suscripción)
export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { wineType, boxType, boxSize, status, nextPayDate } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return handleBadRequest(res, err);;
    }

    const sub = await Subscription.findOne({ _id: id, isDeleted: false });
    if (!sub) {
       return handleNotFound(res, err);
    }

    if (!canRead(req, sub)) {
      return handleForbidden(res, err);
    }

    // Solo permite actualizar ciertos campos
    if (wineType !== undefined) sub.wineType = wineType;
    if (boxType !== undefined) sub.boxType = boxType;
    if (boxSize !== undefined) sub.boxSize = boxSize;
    if (nextPayDate !== undefined) sub.nextPayDate = nextPayDate;
    
    // Solo admin puede cambiar el status
    if (status !== undefined && isAdmin(req)) {
      sub.status = status;
    }

    await sub.save();

    const doc = await findByIdWithPopulate(id);
    return res.json(doc);
  } catch (err) {
    console.error("updateSubscription error:", err);
    return  handleError(res, err);
  }
};

// DELETE /subscriptions/:id (SOFT DELETE - solo admin)
export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isAdmin(req)) {
      return handleForbidden(res, err);
    }

    if (!mongoose.isValidObjectId(id)) {
      return handleBadRequest(res, err);
    }

    const sub = await Subscription.findOne({ _id: id, isDeleted: false });
    if (!sub) {
      return handleNotFound(res, err);
    }

    // Soft delete: solo marca como eliminado
    sub.isDeleted = true;
    sub.deletedAt = new Date();
    await sub.save();

    return res.json({ message: "Suscripción eliminada (soft delete)" });
  } catch (err) {
    console.error("deleteSubscription error:", err);
    return  handleError(res, err);
  }
};

// PUT /subscriptions/:id/restore (RESTAURAR - solo admin)
export const restoreSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isAdmin(req)) {
      return handleForbidden(res, err);
    }

    if (!mongoose.isValidObjectId(id)) {
      return handleBadRequest(res, err);
    }

    const sub = await Subscription.findOne({ _id: id, isDeleted: true });
    if (!sub) {
        
      return handleNotFound(res, err);
    }

    // Restaurar: quita las marcas de eliminado
    sub.isDeleted = false;
    sub.deletedAt = null;
    await sub.save();

    const doc = await findByIdWithPopulate(id);
    return res.json({ message: "Suscripción restaurada", subscription: doc });
  } catch (err) {
    console.error("restoreSubscription error:", err);
    return  handleError(res, err);
  }
};

// GET /subscriptions/deleted (listar eliminados - solo admin)
export const listDeletedSubscriptions = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return handleForbidden(res, err);
    }

    const docs = await Subscription.find({ isDeleted: true })
      .select("-__v")
      .sort({ deletedAt: -1 })
      .populate(populateRefs)
      .lean();

    return res.json(docs);
  } catch (err) {
    console.error("listDeletedSubscriptions error:", err);
    return  handleError(res, err);
  }
};