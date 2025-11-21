function getBaseName() {
  return "/w/tavatar";
}

export default function getPath(methodName, params = {}) {
  console.log("getPath methodName:", methodName);
  console.log("getPath params:", params);

  if (methodName === "tavatar") {
    // tavatar 方法统一使用 folder 路径
    return getFolderPath({ ...params, folder: "tavatar" });
  }
  if (methodName === "ihuman") {
    // ihuman 方法统一使用 folder 路径，对应 baseline
    return getFolderPath({ ...params, folder: "baseline" });
  }
  if (methodName === "gart") {
    return getGartPath(params);
  }
  if (methodName === "gom") {
    return getGomPath(params);
  }

  console.error("Unknown method:", methodName);
  return null;
}

export function getTavatarPath(params = {}, settings = "ihuman") {
  const subject = params.subject || "people-m3c";
  const pose = params.pose || "aist_demo";
  const isRand = params.rand || false;
  const baseName = getBaseName();

  const type = isRand ? "_rand" : "";
  const epochMap = {
    aist_demo: "1",
    "t-pose": "final",
    eval: "0",
  };

  // 判断是否为 xavatar 系列
  const isXavatar = subject.startsWith("xavatar-");

  const poseCameraMap = {
    aist_demo: {
      initialCameraPosition: [0.12118, 0.17839, -1.94035],
      initialCameraLookAt: [0.06241, 0.15307, 0.02273],
    },
    "t-pose": {
      initialCameraPosition: [0.03445, -0.02953, 1.9636],
      initialCameraLookAt: [0.0, 0.0, -0.0],
    },
    eval: {
      initialCameraPosition: [-0.05576, -0.08272, 3.73634],
      initialCameraLookAt: [-0.1642, 0.03897, 5.69506],
    },
  };

  const epoch = epochMap[pose] || "1";
  // 根据pose设置不同的rotation
  let rotation = [0, 0, -1, 0]; // 默认rotation
  if (pose === "t-pose") {
    rotation = [0, 0, 0, 0]; // t-pose使用默认rotation
  }

  // 根据是否为 xavatar 设置不同的路径格式
  const meshPath = isXavatar
    ? `${baseName}/assets/${settings}/${subject}/canonical_mesh_${epoch}.obj`
    : `${baseName}/assets/${settings}/${subject}/${pose}/canonical_mesh_${epoch}.obj`;
  const plyPath = isXavatar
    ? `${baseName}/assets/${settings}/${subject}/render_${epoch}${type}.ply`
    : `${baseName}/assets/${settings}/${subject}/${pose}/render_${epoch}${type}.ply`;

  return {
    meshPath: meshPath,
    plyName: plyPath,
    initialCameraPosition: poseCameraMap[pose]?.initialCameraPosition || [
      -0.15752, 0.64824, -0.17046,
    ],
    initialCameraLookAt: poseCameraMap[pose]?.initialCameraLookAt || [
      -0.16604, 0.67413, -0.03672,
    ],
    rotation: rotation,
  };
}

export function getGomPath(params = {}) {
  const subject = params.subject || "people-m3c";
  const pose = params.pose || "aist_demo";
  const isRand = params.rand || false;
  const baseName = getBaseName();

  const type = isRand ? "rand" : "color";

  const epochMap = {
    aist_demo: "000001",
    eval: "000000",
  };

  const poseCameraMap = {
    aist_demo: {
      initialCameraPosition: [0.54536, -0.36451, 2.00795],
      initialCameraLookAt: [-0.0801, -0.32968, 0.1132],
    },
    eval: {
      initialCameraPosition: [-0.04172, 0.0393, 1.99783],
      initialCameraLookAt: [0.01727, -0.28424, -0.1888],
    },
  };
  const epoch = epochMap[pose] || "000001";

  // GoM方法通常需要特殊旋转
  let rotation = [0, 0, 0, 0];

  return {
    meshPath: `${baseName}/assets/gom/${subject}/${pose}/frame_${epoch}.obj`,
    plyName: `${baseName}/assets/gom/${subject}/${pose}/frame_${epoch}_${type}.ply`,
    initialCameraPosition: poseCameraMap[pose]?.initialCameraPosition || [
      -0.15752, 0.64824, -0.17046,
    ],
    initialCameraLookAt: poseCameraMap[pose]?.initialCameraLookAt || [
      -0.16604, 0.67413, -0.03672,
    ],
    rotation: rotation,
  };
}

export function getGartPath(params = {}) {
  const subject = params.subject || "people-m3c";
  const pose = params.pose || "aist_demo";
  const isRand = params.rand || false;
  const baseName = getBaseName();

  const plyType = isRand ? "random_spherical_harmonics" : "full_3dgs_params";

  let rotation = [0, 0, -1, 0]; // 默认rotation

  const poseCameraMap = {
    aist_demo: {
      initialCameraPosition: [0.22433, 0.122, -1.94096],
      initialCameraLookAt: [0.06714, 0.14693, 0.15366],
    },
    "t-pose": {
      initialCameraPosition: [-0.10205, 0.34449, -1.95228],
      initialCameraLookAt: [0.0172, 0.24699, 0.00579],
    },
    "da-pose": {
      initialCameraPosition: [-0.04443, 0.68625, -1.79264],
      initialCameraLookAt: [0.0518, 0.35053, 0.04031],
    },
    eval: {
      initialCameraPosition: [0.03022, 0.08875, 3.7968],
      initialCameraLookAt: [-0.11899, 0.08192, 5.33373],
    },
  };

  return {
    meshPath: null, // GART方法没有mesh文件
    plyName: `${baseName}/assets/gart/${subject}/${pose}/${plyType}.ply`,
    initialCameraPosition: poseCameraMap[pose]?.initialCameraPosition || [
      -0.15752, 0.64824, -0.17046,
    ],
    initialCameraLookAt: poseCameraMap[pose]?.initialCameraLookAt || [
      -0.16604, 0.67413, -0.03672,
    ],

    rotation: rotation,
  };
}

export function getFolderPath(params = {}) {
  let baseName = getBaseName();
  const folder = params.folder || "tavatar";
  let isRand = params.rand || false;
  let subject = params.subject || "male-3-casual"; // male-3-casual || male-4-casual ....
  let pose = params.pose || "aist_demo"; // aist_demo, eval, etc.

  let plyName = isRand ? `gaussians_rand.ply` : `gaussians.ply`;
  let path = `${baseName}/assets/folders/${folder}/people_snapshot/${subject}/predict_20/${pose}/`;

  const poseCameraMap = {
    balei1: {
      initialCameraPosition: [-0.41538, 1.25481, -1.70498],
      initialCameraLookAt: [0.19101, 0.22705, 0.39242],
      rotation: [0, 0, -1, 0],
    },
    balei2: {
      initialCameraPosition: [0.48941, 0.57829, -1.90849],
      initialCameraLookAt: [-0.08468, 0.4025, 0.18494],
      rotation: [0, 0, -1, 0],
    },
    dance1: {
      initialCameraPosition: [1.55469, 0.4279, 0.95851],
      initialCameraLookAt: [0.22961, 0.24553, -0.06652],
      rotation: [0, 0, -1, 0],
    },
    dance2: {
      initialCameraPosition: [0.12865, -0.72415, -1.42647],
      initialCameraLookAt: [0.00747, 0.01017, 0.12764],
      rotation: [0, 0, -1, 0],
    },
    aist_demo: {
      initialCameraPosition: [0.09622, 0.55923, -1.88727],
      initialCameraLookAt: [0.07587, 0.21077, 0.2624],
      rotation: [0, 0, -1, 0],
    },
    da_pose_smpl: {
      initialCameraPosition: [-0.29201, 0.51159, 0.58536],
      initialCameraLookAt: [-0.06298, 0.2859, -0.08301],
    },
  };

  return {
    plyName: `${path}/${plyName}`,
    meshPath: `${path}/mesh.obj`,
    initialCameraPosition: poseCameraMap[pose]?.initialCameraPosition || [
      -0.00402, 0.30982, 1.57279,
    ],
    initialCameraLookAt: poseCameraMap[pose]?.initialCameraLookAt || [
      0.02659, -0.12982, 0.19683,
    ],
    rotation: poseCameraMap[pose]?.rotation || [0, 0, 0, 0],
  };
}
