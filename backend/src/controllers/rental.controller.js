import RentalItem from "../models/rentalItem.model.js";

export const createRentalItem = async (req, res) => {
  try {
    const { productName, description, rentalPerDay, rentalPerWeek, images, totalQty } = req.body;

    const item = await RentalItem.create({
      productName,
      description: description || "",
      rentalPerDay,
      rentalPerWeek,
      images: Array.isArray(images) ? images.slice(0, 4) : [],
      totalQty,
      availableQty: totalQty,
    });

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const listRentalItems = async (_req, res) => {
  try {
    const items = await RentalItem.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRentalItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, description, rentalPerDay, rentalPerWeek, images, totalQty } = req.body;
    const update = {
      ...(productName !== undefined && { productName }),
      ...(description !== undefined && { description }),
      ...(rentalPerDay !== undefined && { rentalPerDay }),
      ...(rentalPerWeek !== undefined && { rentalPerWeek }),
      ...(Array.isArray(images) && { images: images.slice(0, 4) }),
      ...(totalQty !== undefined && { totalQty, availableQty: totalQty }),
    };
    const item = await RentalItem.findByIdAndUpdate(id, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteRentalItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await RentalItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};


