// GUI-only configuration, no URL parameters
// 获取basename，考虑vite配置中的base路径
const getBaseName = () => {
  // 在生产环境中使用vite的base配置，开发环境为空
  if (
    location.hostname.includes("luohailin.top") ||
    location.hostname == "localhost"
  )
    return "";
  return import.meta.env.MODE === "production" ? "/w/tavatar" : "/w/tavatar";
};

export default function getPath(methodName, params = {}) {
  console.log("getPath methodName:", methodName);
  console.log("getPath params:", params);

  if (methodName === "tavatar") {
    return getTavatarPath(params, "tavatar");
  }
  if (methodName === "gart") {
    return getGartPath(params);
  }
  if (methodName === "gom") {
    return getGomPath(params);
  }
  if (methodName === "ihuman") {
    return getTavatarPath(params, "ihuman");
  }

  if (methodName === "folder") {
    return getFolderPath(params);
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

  return {
    meshPath: `${baseName}/assets/${settings}/${subject}/${pose}/canonical_mesh_${epoch}.obj`,
    plyName: `${baseName}/assets/${settings}/${subject}/${pose}/render_${epoch}${type}.ply`,
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
  const baseName = getBaseName();
  const folder = params.folder || "default-folder";
  let isRand = params.rand || false;
  // let pose = params.pose || "canonical";

  let plyName = isRand ? `gaussians_rand.ply` : `gaussians.ply`;

  return {
    plyName: `${baseName}/assets/folders/${folder}/${plyName}`,
    meshPath: `${baseName}/assets/folders/${folder}/mesh.obj`,
    initialCameraPosition: [-0.00402, 0.30982, 1.57279],
    initialCameraLookAt: [0.02659, -0.12982, 0.19683],
  };
}
