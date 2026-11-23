import storeModel from "../models/store.model.js";

// find stores within X km of user coordinates (includes closed stores)
export const getNearbyStoresDAO = async (
  lng,
  lat,
  radiusInKm = 5,
  page = 1,
  limit = 20,
) =>
  await storeModel.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        distanceField: "distanceMeters", // renamed from "distance"
        maxDistance: radiusInKm * 1000, // convert km to meters
        spherical: true,
        // removed: query: { isOpen: true } — now shows closed stores too
      },
    },
    {
      $lookup: {
        from: "partners",
        localField: "partner",
        foreignField: "_id",
        as: "partner",
      },
    },
    { $unwind: "$partner" },
    { $match: { "partner.isActive": true } }, // only active partners
    {
      $project: {
        name: 1,
        address: 1,
        image: 1,
        cuisine: 1,
        rating: 1,
        isOpen: 1, // frontend uses this to show "Closed" badge
        distanceMeters: 1,
        location: 1,
        "partner.name": 1,
      },
    },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);
