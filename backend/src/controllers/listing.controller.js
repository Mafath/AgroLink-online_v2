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
      cropName: String(cropName).trim(),
      pricePerKg: Number(pricePerKg),
      capacityKg: Number(capacityKg),
      details: details ? String(details).trim() : "",
      harvestedAt: new Date(harvestedAt),
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

    if (cropName != null) listing.cropName = String(cropName).trim();
    if (pricePerKg != null) listing.pricePerKg = Number(pricePerKg);
    if (capacityKg != null) listing.capacityKg = Number(capacityKg);
    if (details != null) listing.details = String(details).trim();
    if (harvestedAt != null) listing.harvestedAt = new Date(harvestedAt);
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


