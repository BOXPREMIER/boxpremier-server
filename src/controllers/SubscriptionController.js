// controllers/subscriptions.controller.js
import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";

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
    const { user, subscriptionPlan, wineType, boxType, boxSize, startDate, nextPayDate, payMethod } = req.body;

    if (!subscriptionPlan || !payMethod) {
      return res.status(400).json({ message: "subscriptionPlan y payMethod son obligatorios" });
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
      isDeleted: false, // ← Soft delete
    });

    const doc = await findByIdWithPopulate(created._id);
    return res.status(201).json(doc);
  } catch (err) {
    console.error("createSubscription error:", err);
    return res.status(500).json({ message: "Error creando suscripción", error: err.message });
  }
};

// POST /subscriptions/gift (crear regalo)
export const createGift = async (req, res) => {
  try {
    const { user, subscriptionPlan, giftMessage, payMethod, startDate, nextPayDate } = req.body;

    if (!user || !subscriptionPlan || !payMethod) {
      return res.status(400).json({ message: "user, subscriptionPlan y payMethod son obligatorios" });
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
      status: "pending",
      isDeleted: false, // ← Soft delete
    });

    const doc = await findByIdWithPopulate(created._id);
    return res.status(201).json(doc);
  } catch (err) {
    console.error("createGift error:", err);
    return res.status(500).json({ message: "Error creando regalo", error: err.message });
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
    return res.status(500).json({ message: "Error listando suscripciones", error: err.message });
  }
};

// GET /subscriptions/gifts/sent (regalos enviados)
export const listGiftsSent = async (req, res) => {
  try {
    const docs = await findWithPopulate({ isGift: true, giftFromId: req.user?._id });
    return res.json(docs);
  } catch (err) {
    console.error("listGiftsSent error:", err);
    return res.status(500).json({ message: "Error listando regalos enviados", error: err.message });
  }
};

// GET /subscriptions/gifts/received (regalos recibidos)
export const listGiftsReceived = async (req, res) => {
  try {
    const docs = await findWithPopulate({ isGift: true, user: req.user?._id });
    return res.json(docs);
  } catch (err) {
    console.error("listGiftsReceived error:", err);
    return res.status(500).json({ message: "Error listando regalos recibidos", error: err.message });
  }
};

// GET /subscriptions/:id
export const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const sub = await Subscription.findOne({ _id: id, isDeleted: false }).populate(populateRefs);

    if (!sub) {
      return res.status(404).json({ message: "Suscripción no encontrada" });
    }

    if (!canRead(req, sub)) {
      return res.status(403).json({ message: "No tienes permisos para ver esta suscripción" });
    }

    return res.json(sub);
  } catch (err) {
    console.error("getSubscriptionById error:", err);
    return res.status(500).json({ message: "Error obteniendo suscripción", error: err.message });
  }
};

// PUT /subscriptions/:id/cancel
export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const sub = await Subscription.findOne({ _id: id, isDeleted: false });
    if (!sub) return res.status(404).json({ message: "Suscripción no encontrada" });

    if (!canRead(req, sub)) {
      return res.status(403).json({ message: "No puedes cancelar esta suscripción" });
    }

    if (["canceled", "expired"].includes(sub.status)) {
      return res.status(409).json({ message: `Esta suscripción ya está ${sub.status}` });
    }

    sub.status = "canceled";
    sub.endDate = new Date();
    await sub.save();

    const doc = await findByIdWithPopulate(id);
    return res.json(doc);
  } catch (err) {
    console.error("cancelSubscription error:", err);
    return res.status(500).json({ message: "Error cancelando suscripción", error: err.message });
  }
};

// DELETE /subscriptions/:id (SOFT DELETE - solo admin)
export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Solo un admin puede eliminar suscripciones" });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const sub = await Subscription.findOne({ _id: id, isDeleted: false });
    if (!sub) return res.status(404).json({ message: "Suscripción no encontrada" });

    // Soft delete: solo marca como eliminado
    sub.isDeleted = true;
    sub.deletedAt = new Date();
    await sub.save();

    return res.json({ message: "Suscripción eliminada (soft delete)" });
  } catch (err) {
    console.error("deleteSubscription error:", err);
    return res.status(500).json({ message: "Error eliminando suscripción", error: err.message });
  }
};

// PUT /subscriptions/:id/restore (RESTAURAR - solo admin)
export const restoreSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Solo un admin puede restaurar suscripciones" });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const sub = await Subscription.findOne({ _id: id, isDeleted: true });
    if (!sub) return res.status(404).json({ message: "Suscripción no encontrada o no está eliminada" });

    // Restaurar: quita las marcas de eliminado
    sub.isDeleted = false;
    sub.deletedAt = null;
    await sub.save();

    const doc = await findByIdWithPopulate(id);
    return res.json({ message: "Suscripción restaurada", subscription: doc });
  } catch (err) {
    console.error("restoreSubscription error:", err);
    return res.status(500).json({ message: "Error restaurando suscripción", error: err.message });
  }
};

// GET /subscriptions/deleted (listar eliminados - solo admin)
export const listDeletedSubscriptions = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Solo un admin puede ver suscripciones eliminadas" });
    }

    const docs = await Subscription.find({ isDeleted: true })
      .select("-__v")
      .sort({ deletedAt: -1 })
      .populate(populateRefs)
      .lean();

    return res.json(docs);
  } catch (err) {
    console.error("listDeletedSubscriptions error:", err);
    return res.status(500).json({ message: "Error listando suscripciones eliminadas", error: err.message });
  }
};