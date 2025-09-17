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


