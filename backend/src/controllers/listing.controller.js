import Listing from "../models/listing.model.js";

export const getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'AVAILABLE' })
      .sort({ createdAt: -1 })
      .populate({ path: 'farmer', select: 'fullName email role' });
    return res.status(200).json(listings);
  } catch (error) {
    console.log("Error in getAllListings: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const getMyListings = async (req, res) => {
  try {
    const userId = req.user._id;
    const listings = await Listing.find({ farmer: userId }).sort({ createdAt: -1 });
    return res.status(200).json(listings);
  } catch (error) {
    console.log("Error in getMyListings: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const createListing = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cropName, pricePerKg, capacityKg, details, harvestedAt, images } = req.body || {};

    if (!cropName || pricePerKg == null || capacityKg == null || !harvestedAt) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Required fields missing" } });
    }

    const nameStr = String(cropName).trim();
    const validName = /^[A-Za-z0-9 ]+$/.test(nameStr);
    const priceNum = Number(pricePerKg);
    const capacityNum = Number(capacityKg);
    const validPrice = Number.isFinite(priceNum) && priceNum >= 0;
    const validCapacity = Number.isInteger(capacityNum) && capacityNum >= 0;
    const harvestedDate = new Date(harvestedAt);
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isFuture = harvestedDate > todayMidnight;

    if (!validName) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Crop name must contain letters and numbers only' } });
    }
    if (!validPrice) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Price must be a non-negative number' } });
    }
    if (!validCapacity) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Capacity must be a non-negative integer' } });
    }
    if (!(harvestedDate instanceof Date) || isNaN(harvestedDate.getTime())) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid harvested date' } });
    }
    if (isFuture) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Harvested date cannot be in the future' } });
    }

    let imageUrls = [];
    if (Array.isArray(images) && images.length) {
      const limited = images.slice(0, 4);
      try {
        const haveCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
        if (haveCloudinary) {
          const { v2: cloudinary } = await import('cloudinary');
          const uploads = await Promise.all(
            limited.map((img) => cloudinary.uploader.upload(img))
          );
          imageUrls = uploads.map(u => u.secure_url);
        } else {
          imageUrls = limited;
        }
      } catch (e) {
        console.log('Image upload error:', e.message);
        // continue without images instead of failing
        imageUrls = [];
      }
    }

    const listing = await Listing.create({
      farmer: userId,
      cropName: nameStr,
      pricePerKg: priceNum,
      capacityKg: capacityNum,
      details: details ? String(details).trim() : "",
      harvestedAt: harvestedDate,
      images: imageUrls,
      status: 'AVAILABLE',
    });

    return res.status(201).json(listing);
  } catch (error) {
    console.log("Error in createListing: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const updateListing = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { cropName, pricePerKg, capacityKg, details, harvestedAt, images, status } = req.body || {};

    const listing = await Listing.findOne({ _id: id, farmer: userId });
    if (!listing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } });
    }

    if (cropName != null) {
      const nameStr = String(cropName).trim();
      if (!/^[A-Za-z0-9 ]+$/.test(nameStr)) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Crop name must contain letters and numbers only' } });
      }
      listing.cropName = nameStr;
    }
    if (pricePerKg != null) {
      const priceNum = Number(pricePerKg);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Price must be a non-negative number' } });
      }
      listing.pricePerKg = priceNum;
    }
    if (capacityKg != null) {
      const capacityNum = Number(capacityKg);
      if (!Number.isInteger(capacityNum) || capacityNum < 0) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Capacity must be a non-negative integer' } });
      }
      listing.capacityKg = capacityNum;
    }
    if (details != null) listing.details = String(details).trim();
    if (harvestedAt != null) {
      const harvestedDate = new Date(harvestedAt);
      if (!(harvestedDate instanceof Date) || isNaN(harvestedDate.getTime())) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid harvested date' } });
      }
      const today = new Date();
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (harvestedDate > todayMidnight) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Harvested date cannot be in the future' } });
      }
      listing.harvestedAt = harvestedDate;
    }
    if (status != null) listing.status = String(status).toUpperCase();

    if (Array.isArray(images)) {
      const limited = images.slice(0, 4);
      let imageUrls = [];
      try {
        const haveCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
        if (haveCloudinary) {
          const { v2: cloudinary } = await import('cloudinary');
          const uploads = await Promise.all(
            limited.map((img) => cloudinary.uploader.upload(img))
          );
          imageUrls = uploads.map(u => u.secure_url);
        } else {
          imageUrls = limited;
        }
      } catch (e) {
        console.log('Image upload error:', e.message);
      }
      if (imageUrls.length) listing.images = imageUrls;
    }

    await listing.save();
    return res.status(200).json(listing);
  } catch (error) {
    console.log('Error in updateListing: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const listing = await Listing.findOneAndDelete({ _id: id, farmer: userId });
    if (!listing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.log('Error in deleteListing: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};


