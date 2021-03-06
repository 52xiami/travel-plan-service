const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Travelplan = require("../models/travelplan");

const OngoingTravelplan = require("../models/ongoingTravelplan");
const path = require("path");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const { GcsFileUpload } = require("gcs-file-upload");

//@desc Get Single travelplan
//@route GET /api/v1/travelplan/read/:planId
//@access Private
exports.getSingleTravelPlan = asyncHandler(async (req, res, next) => {
  const travelPlan = await Travelplan.findById(req.params.planId);
  if (!travelPlan) {
    return next(
      new ErrorResponse(`No Travelplan found with id ${groupId}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: travelPlan,
  });
});

//@desc Get all travelplans
//@route GET /api/v1/travelplan/read
//@access Private
exports.getAllTravelplans = asyncHandler(async (req, res, next) => {
  const travelplans = await Travelplan.find();

  if (!travelplans || travelplans.length == 0) {
    return next(new ErrorResponse("No Travelplans found", 404));
  }
  res.status(200).json({
    success: true,
    count: travelplans.length,
    data: travelplans,
  });
});

//@desc Get all travelplans that a user finished
//@route GET /api/v1/travelplan/read_finished/:userId
//@access Private
exports.getAllTravelplansUserFinished = asyncHandler(async (req, res, next) => {
  const travelplans = await Travelplan.find({
    status: 3,
  });

  if (!travelplans || travelplans.length == 0) {
    return next(new ErrorResponse("No Travelplans found", 404));
  }

  const userFinishedTravelplans = travelplans.filter((item) => {
    return (
      item.travelMembers.includes(Number.parseInt(req.params.userId)) ||
      item.initiator === Number.parseInt(req.params.userId)
    );
  });

  if (!userFinishedTravelplans || userFinishedTravelplans.length == 0) {
    return next(new ErrorResponse("No Travelplans found", 404));
  }

  res.status(200).json({
    success: true,
    count: userFinishedTravelplans.length,
    data: userFinishedTravelplans,
  });
});

//@desc Get all unfinished travelplans that a user in travelmembers
//@route GET /api/v1/travelplan/read_unfinished/:userId
//@access Private
exports.getAllTravelplansUserUnfinished = asyncHandler(
  async (req, res, next) => {
    let travelplans = [];

    const travelplansPublished = await Travelplan.find({
      status: 1,
    });

    // if (!travelplansPublished || travelplansPublished.length === 0) {
    //   return next(new ErrorResponse("No Travelplans found", 404));
    // }
    if (travelplansPublished && travelplansPublished.length !== 0) {
      travelplans.concat(travelplansPublished);
    }
    const travelplansOngoing = await Travelplan.find({
      status: 2,
    });

    if (travelplansOngoing && travelplansOngoing.length !== 0) {
      travelplans.concat(travelplansOngoing);
    }
    const userUnfinishedPlans = travelplans.filter((item) => {
      return (
        item.travelMembers.includes(Number.parseInt(req.params.userId)) ||
        item.initiator === Number.parseInt(req.params.userId)
      );
    });

    if (!userUnfinishedPlans || userUnfinishedPlans.length == 0) {
      return next(new ErrorResponse("No Travelplans found", 404));
    }

    res.status(200).json({
      success: true,
      count: userUnfinishedPlans.length,
      data: userUnfinishedPlans,
    });
  }
);

//@desc Get all travelplans belonging to a travelgroup with id
//@route GET /api/v1/travelplan/read/plans_in/:groupId
//@access Private
exports.getAllTravelplansOfTravelgroup = asyncHandler(
  async (req, res, next) => {
    const travelplans = await Travelplan.find({
      travelGroup: req.params.groupId,
    }).sort({ updatedAt: -1 });

    if (!travelplans || travelplans.length === 0) {
      return next(new ErrorResponse("No Travelplans found", 404));
    }
    res.status(200).json({
      success: true,
      count: travelplans.length,
      data: travelplans,
    });
  }
);

//@desc Get all travelplans created by a user with userId
//@route GET /api/v1/travelplan/read/plans_createdby/:userId
//@access Private
exports.getAllTraveplansOfUser = asyncHandler(async (req, res, next) => {
  const travelplans = await Travelplan.find({
    initiator: req.params.userId,
  }).sort({ updatedAt: -1 });

  if (!travelplans || travelplans.length == 0) {
    return next(new ErrorResponse("No Travelplans found", 404));
  }
  res.status(200).json({
    success: true,
    count: travelplans.length,
    data: travelplans,
  });
});

//@desc Get an ongoing travelplan by userId
//@route GET /api/v1/travelplan/read_ongoing/:userId
//@access Private

exports.getOngoingTravelplanForUser = asyncHandler(async (req, res, next) => {
  const travelplans = await Travelplan.find({
    status: 2,
  });

  if (!travelplans || travelplans.length == 0) {
    return next(new ErrorResponse("No Ongoing travelplans found", 404));
  }

  travelplans.sort((a, b) => {
    const aDate = new Date(a.startDate);
    const bDate = new Date(b.startDate);
    return aDate - bDate;
  });

  console.log(travelplans);

  const ongoingTravelplanOfUser = travelplans.filter((item) => {
    return (
      item.travelMembers.includes(Number.parseInt(req.params.userId)) ||
      item.initiator === Number.parseInt(req.params.userId)
    );
  });
  //console.log(ongoingTravelplanOfUser);

  if (!ongoingTravelplanOfUser || ongoingTravelplanOfUser.length === 0) {
    return next(new ErrorResponse("No Ongoing travelplans found", 404));
  }

  //ongoingTravelplanOfUser;
  res.status(200).json({
    success: true,
    data: ongoingTravelplanOfUser[0],
  });
});

//@desc Add to a travelPlan by user with userId
//@route POST /api/v1/travelplan/create/:userId
//@access Private
exports.addTravelplan = asyncHandler(async (req, res, next) => {
  req.body.initiator = req.params.userId;
  const travelplan = await Travelplan.create(req.body);
  res.status(201).json({
    success: true,
    message: "New travelplan is added",
    data: travelplan,
  });
});

//@desc Update a travelplan with planId by a user with userId
//@route PUT /api/v1/travelplan/update/:userId/:planId
//@access Private
exports.updateTravelplan = asyncHandler(async (req, res, next) => {
  let travelplan = await Travelplan.find({
    _id: req.params.planId,
  });
  if (!travelplan || travelplan.length == 0) {
    return next(
      new ErrorResponse(
        `No travelplan found with planId ${req.params.planId} and userId ${req.params.userId}`
      )
    );
  }

  travelplan = await Travelplan.findByIdAndUpdate(req.params.planId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Travelplan is updtated",
    data: travelplan,
  });
});

//@desc Delete a travelplan with planId by a user with userId
//@route DELETE /api/v1/travelplan/delete/:userId/:planId
//@access Private

exports.deleteTravelplan = asyncHandler(async (req, res, next) => {
  const travelplan = await Travelplan.find({
    _id: req.params.planId,
    initiator: req.params.userId,
  });
  if (!travelplan || travelplan.length == 0) {
    return next(
      new ErrorResponse(
        `No travelplan found with planId ${req.params.id} and userId ${req.params.userId}`,
        404
      )
    );
  }

  if (travelplan[0].status === 2 || travelplan[0].status === 3) {
    return next(
      new ErrorResponse(
        `Cant't delete the travelplan with planId ${req.params.planId} that is ongoing or ended`,
        400
      )
    );
  }

  await Travelplan.findByIdAndDelete(req.params.planId);
  res.status(200).json({
    success: true,
    message: "Delete a travelplan is completed",
  });
});

//@desc Like a travelplan
//@route PUT /api/v1/travelplan/like/:userId/:planId
//@access Private
exports.likeTravelplan = asyncHandler(async (req, res, next) => {
  let travelplan = await Travelplan.findById(req.params.planId);
  if (!travelplan) {
    return next(
      new ErrorResponse(
        `No travelplan with planId ${req.params.planId} found`,
        404
      )
    );
  }
  if (travelplan.dislikes.includes(Number.parseInt(req.params.userId))) {
    const idxToRemove = travelplan.dislikes.indexOf(
      Number.parseInt(req.params.userId)
    );
    travelplan.dislikes.splice(idxToRemove, 1);
    await travelplan.save();
  }

  if (!travelplan.likes.includes(Number.parseInt(req.params.userId))) {
    travelplan.likes.push(Number.parseInt(req.params.userId));
    await travelplan.save();
    res.status(200).json({
      success: true,
      data: travelplan,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "You already liked this travlplan",
    });
  }
});

//@desc Dislike a travelplan
//@route PUT /api/v1/travelplan/dislike/:userId/:planId
//@access Private
exports.disLikeTravelplan = asyncHandler(async (req, res, next) => {
  let travelplan = await Travelplan.findById(req.params.planId);
  if (!travelplan) {
    return next(
      new ErrorResponse(
        `No travelplan with planId ${req.params.planId} found`,
        404
      )
    );
  }
  if (travelplan.likes.includes(Number.parseInt(req.params.userId))) {
    const idxToRemove = travelplan.likes.indexOf(req.params.userId);
    travelplan.likes.splice(idxToRemove, 1);
    await travelplan.save();
  }

  if (!travelplan.dislikes.includes(req.params.userId)) {
    travelplan.dislikes.push(req.params.userId);
    await travelplan.save();
    res.status(200).json({
      success: true,
      data: travelplan,
    });
  } else {
    res.status(400).json({
      message: "You already disliked this travelplan",
    });
  }
});

//@desc Unlike a travelplan
//@route PUT /api/v1/travelplan/unlike/:userId/:planId
//@access Private
exports.unLikeTravelplan = asyncHandler(async (req, res, next) => {
  let travelplan = await Travelplan.findById(req.params.planId);
  if (!travelplan) {
    return next(
      new ErrorResponse(
        `No travelplan with planId ${req.params.planId} found`,
        404
      )
    );
  }

  if (travelplan.likes.includes(req.params.userId)) {
    const idxToRemove = travelplan.likes.indexOf(req.params.userId);
    travelplan.likes.splice(idxToRemove, 1);
    await travelplan.save();
    res.status(200).json({
      success: true,
      data: travelplan,
    });
  } else {
    res.status(400).json({
      message: "User has not like this travelplan",
    });
  }
});

//@desc Undislike a travelplan
//@route PUT /api/v1/travelplan/undislike/:userId/:planId
//@access Private
exports.unDislikeTravelplan = asyncHandler(async (req, res, next) => {
  let travelplan = await Travelplan.findById(req.params.planId);
  if (!travelplan) {
    return next(
      new ErrorResponse(
        `No travelplan with planId ${req.params.planId} found`,
        404
      )
    );
  }

  if (travelplan.dislikes.includes(req.params.userId)) {
    const idxToRemove = travelplan.dislikes.indexOf(req.params.userId);
    travelplan.dislikes.splice(idxToRemove, 1);
    await travelplan.save();
    res.status(200).json({
      success: true,
      data: travelplan,
    });
  } else {
    res.status(400).json({
      message: "User has not like this travelplan",
    });
  }
});

//@desc Upload image for a travelplan
//@route PUT /api/v1/travelplan/updateimage/:userId/:planId
//@access Private

exports.uploadImageToTravelplan = asyncHandler(async (req, res, next) => {
  const myBucket = new GcsFileUpload(
    {
      keyFilename: path.join(__dirname, "../travel-group-service-key.json"),
      projectId: "travel-group-service",
    },
    "travel-group-plan-image-bucket"
  );
  const storage = new Storage({
    keyFilename: path.join(__dirname, "../travel-group-service-key.json"),
    projectId: "travel-group-service",
  });
  const bucketName = "travel-group-plan-image-bucket";

  const travelplan = await Travelplan.find({
    _id: req.params.planId,
    initiator: req.params.userId,
  });
  if (!travelplan || travelplan.length == 0) {
    return next(
      new ErrorResponse(
        `No travelplan found with planId ${req.params.id} and userId ${req.params.userId}`,
        404
      )
    );
  }
  if (!req.files) {
    return next(new ErrorResponse("Please upload a file", 400));
  }

  const imageToBeDelete = travelplan[0].image ? travelplan[0].image : null;

  const file = req.files.file;

  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse("Plese upload an image file", 400));
  }

  file.name =
    "plan" +
    `${path.parse(file.name).name}` +
    Date.now().toString() +
    `${path.parse(file.name).ext}`;

  const fileMetaData = {
    originalname: file.name,
    buffer: file.data,
    //Content-Type: file.mimetype
  };

  myBucket
    .uploadFile(fileMetaData)
    .then(async (data) => {
      console.log("upload file data");
      console.log(data);
      const words = data.split("/");
      const fileName = words[words.length - 1];
      await Travelplan.findByIdAndUpdate(req.params.planId, {
        image: fileName,
      });
      await storage
        .bucket(bucketName)
        .file(fileName)
        .setMetadata({ contentType: file.mimetype });
      if (imageToBeDelete && imageToBeDelete !== "no-image.jpg") {
        await storage.bucket(bucketName).file(imageToBeDelete).delete();
        console.log(`deleted file is  ${imageToBeDelete}`);
      }
    })
    .catch((err) => {
      console.log(err);
    });

  // await Travelplan.findByIdAndUpdate(req.params.planId, { image: file.name });

  //Delete the old image
  // if (imageToBeDelete && imageToBeDelete !== "no-image.jpg") {
  //   fs.unlink(`${process.env.FILE_UPLOAD_PATH}/${imageToBeDelete}`, (error) => {
  //     if (error) {
  //       console.log(error);
  //     }
  //   });
  // }

  res.status(200).json({
    success: true,
  });
});

//@desc Create PositionSharing by initiator
//@route POST /api/v1/travelplan/position/create/:userId/:planId
//@access Private

// exports.addPositionSharing = asyncHandler(async (req, res, next) => {
//   req.body.initiator = req.params.userId;
//   req.body.planId = req.params.planId;
//   const positionSharing = await PositionSharing.create(req.body);
//   res.status(201).json({
//     success: true,
//     data: positionSharing,
//   });
// });

//@desc Update user position inside a ongoing travelplan
//@route PUT /api/v1/travelplan/position/update/:userId/:planId/:lat/:lng
//@access Private

// exports.updatePositionSharing = asyncHandler(async (req, res, next) => {
//   const positionSharing = await PositionSharing.findOne({
//     planId: req.params.planId,
//   });
//   if (!positionSharing) {
//     return next(new ErrorResponse("positionsharing not found", 404));
//   }

//   // if (!positionSharing.positions || positionSharing.positions.length === 0) {
//   //   positionSharing.positions.push({
//   //     userId: req.params.userId,
//   //     lat: req.params.lat,
//   //     lng: req.params.lng,
//   //   });
//   // }
//   const target = positionSharing.positions.find(
//     (p) => p.userId === Number.parseInt(req.params.userId)
//   );
//   if (target) {
//     positionSharing.positions.forEach((p) => {
//       if (p.userId === Number.parseInt(req.params.userId)) {
//         console.log("matched");
//         p.lat = req.params.lat;
//         p.lng = req.params.lng;
//       }
//     });
//   } else {
//     positionSharing.positions.push({
//       userId: req.params.userId,
//       lat: req.params.lat,
//       lng: req.params.lng,
//     });
//   }

//   await positionSharing.save();
//   res.status(200).json({
//     success: true,
//   });
// });

//@desc Get all positons of user inside a ongoing travelplan
//@route GET /api/v1/travelplan/position/read/:planId
//@access Private

// exports.getUserPositionsOfTravelPlan = asyncHandler(async (req, res, next) => {
//   const positionSharing = await PositionSharing.findOne({
//     planId: req.params.planId,
//   });
//   if (!positionSharing) {
//     return next(new ErrorResponse("Travel is ended", 404));
//   }

//   res.status(200).json({
//     success: true,
//     data: positionSharing.positions,
//   });
// });

//@desc Delete a positionsharing by planId
//@route DELETE /api/v1/travelplan/position/delete/:userId/:planId
//@access Private

// exports.deletePositionSharing = asyncHandler(async (req, res, next) => {
//   const positionSharing = await PositionSharing.find({
//     planId: req.params.planId,
//     initiator: req.params.userId,
//   });
//   if (!positionSharing || positionSharing.length === 0) {
//     return next(new ErrorResponse("Not found positionsharing", 404));
//   }

//   await PositionSharing.findOneAndDelete({
//     planId: req.params.planId,
//     initiator: req.params.userId,
//   });

//   res.status(200).json({
//     success: true,
//   });
// });

//@desc Create an ongoing travelplan
//@route POST /api/v1/travelplan/ongoing/:userId/:planId
//@access Private
exports.createOngoingTravelplan = asyncHandler(async (req, res, next) => {
  const travelplan = await Travelplan.findById(req.params.planId);
  if (!travelplan) {
    return next(
      new ErrorResponse(
        `Travelplan with planId ${req.params.planId} doesn't exist`,
        404
      )
    );
  }

  if (travelplan.status === 3) {
    return next(
      new ErrorResponse(`Travelplan with id ${req.params.planId} is ended`, 400)
    );
  }

  if (travelplan.status !== 2) {
    if (Number.parseInt(req.params.userId) !== travelplan.initiator) {
      return next(
        new ErrorResponse(
          "Please wait travelplan initiator to start the plan",
          404
        )
      );
    }
  }
  req.body.planId = req.params.planId;
  req.body.userId = req.params.userId;
  const ongoingTravelplan = await OngoingTravelplan.create(req.body);

  res.status(201).json({
    success: true,
    data: ongoingTravelplan,
  });
});

//@desc Update an ongoing travelplan
//@route PUT /api/v1/travelplan/ongoing/:userId/:planId
//@access Private

exports.updateOngoingTravelplan = asyncHandler(async (req, res, next) => {
  const ongoingTravelplan = await OngoingTravelplan.findOne({
    planId: req.params.planId,
    userId: req.params.userId,
  });
  if (!ongoingTravelplan) {
    return next(new ErrorResponse("No ongoing travelplan found", 404));
  }

  const id = ongoingTravelplan._id;

  const newOngoingTravelplan = await OngoingTravelplan.findByIdAndUpdate(
    id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    success: true,
    data: newOngoingTravelplan,
  });
});

//@desc GET other users' positions inside an ongoing travelplan
//@route GET /api/v1/travelplan/ongoing/:planId
//@access Private

exports.getAllOngongingTravelplansById = asyncHandler(
  async (req, res, next) => {
    console.log(req.params.planId);
    const ongoingTravelplans = await OngoingTravelplan.find({
      planId: req.params.planId,
    });
    if (!ongoingTravelplans || ongoingTravelplans.length === 0) {
      return next(new ErrorResponse("No Ongoing Travelplans found", 404));
    }
    console.log(ongoingTravelplans);
    // const ongoingTravelPlansWihoutCurrUser = ongoingTravelplans.filter(
    //   (item) => {
    //     item.userId !== Number.parseInt(req.params.userId);
    //   }
    // );

    res.status(200).json({
      success: true,
      data: ongoingTravelplans,
    });
  }
);

//@desc Delete an ongoing travelplan
//@route DELETE /api/v1/travelplan/ongoing/:userId/:planId
//@access Private

exports.deleteOngoingTravelplan = asyncHandler(async (req, res, next) => {
  const ongoingTravelplans = await OngoingTravelplan.find({
    planId: req.params.planId,
    userId: req.params.userId,
  });

  if (ongoingTravelplans && ongoingTravelplans.length !== 0) {
    ongoingTravelplans.forEach(async (plan) => {
      await OngoingTravelplan.findByIdAndDelete(plan._id);
    });
  }
  res.status(200).json({
    success: true,
    message: "Ongoing Travel Plan is deleted",
  });
});
