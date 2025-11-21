// import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import * as GaussianSplats3D from "../viewer/index.js"; // Adjust the path as necessary
import * as THREE from "three";
import { OBJLoader } from "three/addons";
import getPath from "./getPath.js";

// 全局变量
let viewer;
let scene;
let currentMesh;

// 从URL参数读取配置
function getConfigFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    method: urlParams.get("method") || "tavatar",
    subject: urlParams.get("subject") || "people-m3c",
    pose: urlParams.get("pose") || "t-pose",
    rand: urlParams.get("rand") === "true",
    folder: urlParams.get("folder") || "default-folder",
    z: 0,
    sh_degree: 0,
  };
}

// 当前配置
let currentConfig = getConfigFromURL();

// 标记是否正在加载场景
let isLoadingScene = false;

// GUI控制函数
window.toggleGUI = function () {
  const gui = document.getElementById("compactGui");
  gui.classList.toggle("collapsed");
};

// 新增函数：更新GUI状态
function updateGUIState() {
  // 同步 method 选择器状态
  const methodSelect = document.getElementById("methodSelect");
  if (methodSelect) {
    methodSelect.value = currentConfig.method;
  }

  // 更新区域显示/隐藏
  updateSectionVisibility();

  // 同步 subject 选择器状态
  const subjectSelect = document.getElementById("subjectSelect");
  if (
    subjectSelect &&
    subjectSelect.querySelector(`option[value="${currentConfig.subject}"]`)
  ) {
    subjectSelect.value = currentConfig.subject;
  }

  // 同步 pose 选择器状态
  const poseSelect = document.getElementById("poseSelect");
  if (poseSelect) {
    poseSelect.value = currentConfig.pose;
  }

  // 同步 rand 复选框状态
  const randCheckbox = document.getElementById("randCheckbox");
  if (randCheckbox) {
    randCheckbox.checked = currentConfig.rand;
  }

  const pathConfig = getPath(currentConfig.method, currentConfig);
  const hasMesh = pathConfig && pathConfig.meshPath !== null;

  // 获取mesh相关的radio buttons
  const meshRadio = document.getElementById("displayMesh");
  const meshFrameRadio = document.getElementById("displayMeshFrame");
  const comboRadio = document.getElementById("displayCombo");

  // 获取对应的labels
  const meshLabel = document.querySelector('label[for="displayMesh"]');
  const meshFrameLabel = document.querySelector(
    'label[for="displayMeshFrame"]'
  );
  const comboLabel = document.querySelector('label[for="displayCombo"]');

  if (hasMesh) {
    // 启用mesh相关选项
    meshRadio.disabled = false;
    meshFrameRadio.disabled = false;
    comboRadio.disabled = false;

    meshLabel.style.color = "#ccc";
    meshFrameLabel.style.color = "#ccc";
    comboLabel.style.color = "#ccc";
    meshLabel.style.opacity = "1";
    meshFrameLabel.style.opacity = "1";
    comboLabel.style.opacity = "1";
  } else {
    // 禁用mesh相关选项
    meshRadio.disabled = true;
    meshFrameRadio.disabled = true;
    comboRadio.disabled = true;

    meshLabel.style.color = "#666";
    meshFrameLabel.style.color = "#666";
    comboLabel.style.color = "#666";
    meshLabel.style.opacity = "0.5";
    meshFrameLabel.style.opacity = "0.5";
    comboLabel.style.opacity = "0.5";

    // 如果当前选中的是mesh相关模式，自动切换到3DGS模式
    const currentSelection = document.querySelector(
      'input[name="displayMode"]:checked'
    );
    if (
      currentSelection &&
      ["mesh", "mesh-frame", "combo"].includes(currentSelection.value)
    ) {
      document.getElementById("display3DGS").checked = true;
      updateDisplayMode();
    }
  }

  console.log(
    "GUI state updated. Method:",
    currentConfig.method,
    "Has mesh:",
    hasMesh
  );
}

// 新增GUI控制函数
window.updateDisplayMode = function () {
  const selectedMode = document.querySelector(
    'input[name="displayMode"]:checked'
  ).value;
  console.log("Display mode changed to:", selectedMode);

  // 隐藏所有内容
  hideAll();

  // 根据选择的模式显示对应内容
  switch (selectedMode) {
    case "3dgs":
      show3DGS(false); // 普通3DGS
      break;
    case "3dgs-ellipsoid":
      show3DGS(true); // 3DGS + setDebug
      break;
    case "mesh":
      showMesh();
      break;
    case "mesh-frame":
      showMeshFrame();
      break;
    case "combo":
      show3DGS(true); // 3DGS-Ellipsoid
      showMeshFrame(); // + Mesh-Frame
      break;
  }
};

function hideAll() {
  // 隐藏3DGS
  const splatMesh = viewer?.getSplatMesh();
  if (splatMesh) {
    splatMesh.visible = false;
    // 重置debug模式
    splatMesh.setDebug && splatMesh.setDebug(false);
  }

  // 隐藏mesh
  if (currentMesh) {
    currentMesh.visible = false;
  }
}

function show3DGS(enableDebug) {
  const splatMesh = viewer?.getSplatMesh();
  if (splatMesh) {
    splatMesh.visible = true;
    if (enableDebug && splatMesh.setDebug) {
      splatMesh.setDebug(true);
    }
    console.log("3DGS visibility:", true, "debug:", enableDebug);
  }
}

function showMesh() {
  if (!currentMesh) {
    console.warn("No mesh loaded yet");
    return;
  }

  currentMesh.visible = true;

  // 隐藏所有wireframe mesh
  if (currentMesh.userData.wireframeMeshes) {
    currentMesh.userData.wireframeMeshes.forEach(function (wireframeMesh) {
      wireframeMesh.visible = false;
    });
  }

  // 显示原始mesh（排除wireframe mesh）
  currentMesh.traverse(function (child) {
    if (child.isMesh && !currentMesh.userData.wireframeMeshes.includes(child)) {
      child.visible = true;
    }
  });

  console.log("Mesh visible");
}

function showMeshFrame() {
  if (!currentMesh) {
    console.warn("No mesh loaded yet for wireframe");
    return;
  }

  currentMesh.visible = true;

  // 隐藏所有原始mesh（排除wireframe mesh）
  currentMesh.traverse(function (child) {
    if (child.isMesh && !currentMesh.userData.wireframeMeshes.includes(child)) {
      child.visible = false;
    }
  });

  // 显示所有wireframe mesh
  if (currentMesh.userData.wireframeMeshes) {
    currentMesh.userData.wireframeMeshes.forEach(function (wireframeMesh) {
      wireframeMesh.visible = true;
    });
  }

  console.log("Mesh frame visible");
}

// 保留旧的函数以保持兼容性，但它们现在调用新的显示模式系统
window.toggle3DGSDisplay = function () {
  const isVisible = document.getElementById("show3DGS")?.checked;
  if (isVisible !== undefined) {
    if (isVisible) {
      document.getElementById("display3DGS").checked = true;
    }
    updateDisplayMode();
  }
};

window.toggleMeshDisplay = function () {
  // 兼容性函数，切换到mesh模式
  document.getElementById("displayMesh").checked = true;
  updateDisplayMode();
};

window.toggle3DGSEllipsoidDisplay = function () {
  // 兼容性函数，切换到3DGS-Ellipsoid模式
  document.getElementById("display3DGSEllipsoid").checked = true;
  updateDisplayMode();
};

window.toggleMeshFrame = function () {
  // 兼容性函数，切换到mesh-frame模式
  document.getElementById("displayMeshFrame").checked = true;
  updateDisplayMode();
};

// 更新 URL 参数
function updateURL() {
  const params = new URLSearchParams();
  params.set("method", currentConfig.method);
  params.set("subject", currentConfig.subject);
  params.set("pose", currentConfig.pose);
  params.set("rand", currentConfig.rand.toString());

  // 使用 replaceState 更新 URL 而不重新加载页面
  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({ path: newURL }, "", newURL);
  console.log("URL updated:", newURL);
}

// 更新 subject 选项
function updateSubjectOptions() {
  const subjectSelect = document.getElementById("subjectSelect");
  if (!subjectSelect) return;

  const currentValue = subjectSelect.value;
  let validSubjects = [];

  if (currentConfig.method === "tavatar" || currentConfig.method === "ihuman") {
    // tavatar/ihuman 方法使用 folder 格式的 subject
    validSubjects = [
      "male-3-casual",
      "male-4-casual",
      "female-3-casual",
      "female-4-casual",
    ];
    subjectSelect.innerHTML = `
      <option value="male-3-casual">male-3-casual</option>
      <option value="male-4-casual">male-4-casual</option>
      <option value="female-3-casual">female-3-casual</option>
      <option value="female-4-casual">female-4-casual</option>
    `;
    // 设置默认值
    if (!validSubjects.includes(currentValue)) {
      subjectSelect.value = "male-3-casual";
      currentConfig.subject = "male-3-casual";
    }
  } else if (currentConfig.method === "gart" || currentConfig.method === "gom") {
    // gart/gom 只支持 people 系列
    validSubjects = [
      "people-m3c",
      "people-m4c",
      "people-f3c",
      "people-f4c",
    ];
    subjectSelect.innerHTML = `
      <option value="people-m3c">m3c</option>
      <option value="people-m4c">m4c</option>
      <option value="people-f3c">f3c</option>
      <option value="people-f4c">f4c</option>
    `;
    // 设置默认值
    if (!validSubjects.includes(currentValue)) {
      subjectSelect.value = "people-m3c";
      currentConfig.subject = "people-m3c";
    }
  }

  // 更新 pose 选项（因为不同 subject 可能影响 pose）
  updatePoseOptions();
}

// 更新 pose 选项
function updatePoseOptions() {
  const poseSelect = document.getElementById("poseSelect");
  if (!poseSelect) return;

  const currentValue = poseSelect.value;
  let validPoses = [];
  let poseOptions = "";

  if (currentConfig.method === "tavatar" || currentConfig.method === "ihuman") {
    // tavatar/ihuman 支持的 pose（基于 predict_20 文件夹内容）
    validPoses = [
      "aist_demo",
      "balei1",
      "balei2",
      "dance1",
      "dance2",
      "da_pose_smpl",
      "t_pose_smpl",
    ];
    poseOptions = `
      <option value="aist_demo">aist_demo</option>
      <option value="balei1">balei1</option>
      <option value="balei2">balei2</option>
      <option value="dance1">dance1</option>
      <option value="dance2">dance2</option>
      <option value="da_pose_smpl">da_pose_smpl</option>
      <option value="t_pose_smpl">t_pose_smpl</option>
    `;
  } else if (currentConfig.method === "gart") {
    // gart 支持所有 pose 包括 da-pose
    validPoses = ["aist_demo", "eval", "t-pose", "da-pose"];
    poseOptions = `
      <option value="aist_demo">aist_demo</option>
      <option value="eval">eval</option>
      <option value="t-pose">t-pose</option>
      <option value="da-pose">da-pose</option>
    `;
  } else if (currentConfig.method === "gom") {
    // gom 只支持 aist_demo 和 eval
    validPoses = ["aist_demo", "eval"];
    poseOptions = `
      <option value="aist_demo">aist_demo</option>
      <option value="eval">eval</option>
    `;
  }

  poseSelect.innerHTML = poseOptions;

  // 设置默认值
  if (!validPoses.includes(currentValue)) {
    poseSelect.value = "aist_demo";
    currentConfig.pose = "aist_demo";
  }
}

// 更新区域显示/隐藏
function updateSectionVisibility() {
  const subjectPoseSection = document.getElementById("subjectPoseSection");

  // 所有方法都显示 subject/pose 选择
  if (subjectPoseSection) subjectPoseSection.style.display = "block";

  // 更新 subject 和 pose 选项
  updateSubjectOptions();
  // updatePoseOptions 会在 updateSubjectOptions 中调用
}



window.changeMethod = function () {
  if (isLoadingScene) {
    console.log("Scene is loading, please wait...");
    return;
  }

  const selectedMethod = document.getElementById("methodSelect").value;
  console.log("Method changed to:", selectedMethod);

  // 更新配置
  currentConfig.method = selectedMethod;

  // 更新区域显示
  updateSectionVisibility();

  // 更新 URL
  updateURL();

  // 重新加载场景
  reloadScene();
};

window.changeSubject = function () {
  if (isLoadingScene) {
    console.log("Scene is loading, please wait...");
    return;
  }

  const selectedSubject = document.getElementById("subjectSelect").value;
  console.log("Subject changed to:", selectedSubject);

  // 更新配置
  currentConfig.subject = selectedSubject;

  // 更新 URL
  updateURL();

  // 重新加载场景
  reloadScene();
};

window.changePose = function () {
  if (isLoadingScene) {
    console.log("Scene is loading, please wait...");
    return;
  }

  const selectedPose = document.getElementById("poseSelect").value;
  console.log("Pose changed to:", selectedPose);

  // 更新配置
  currentConfig.pose = selectedPose;

  // 更新 URL
  updateURL();

  // 重新加载场景
  reloadScene();
};

window.toggleRand = function () {
  if (isLoadingScene) {
    console.log("Scene is loading, please wait...");
    return;
  }

  const isRandEnabled = document.getElementById("randCheckbox").checked;
  console.log("Rand toggled to:", isRandEnabled);

  // 更新配置
  currentConfig.rand = isRandEnabled;

  // 更新 URL
  updateURL();

  // 重新加载场景
  reloadScene();
};

window.toggleAutoRotation = function () {
  if (typeof window.autoRotate !== "undefined") {
    const isEnabled = document.getElementById("autoRotate").checked;
    window.autoRotate = isEnabled;

    // 如果启动自动旋转，先更新相机参数
    if (isEnabled && viewer && viewer.camera) {
      const camera = viewer.camera;
      const controls = viewer.controls;
      const currentPosition = camera.position.clone();

      // 更新centerPoint为当前controls的target
      if (controls && controls.target) {
        window.centerPoint.copy(controls.target);
      }

      console.log("Updated center point to:", window.centerPoint);

      // 更新originalCameraY为当前相机Y坐标
      window.originalCameraY = currentPosition.y;

      // 更新旋转半径和角度（相对于centerPoint计算）
      window.rotationRadius = Math.sqrt(
        (currentPosition.x - window.centerPoint.x) *
          (currentPosition.x - window.centerPoint.x) +
          (currentPosition.z - window.centerPoint.z) *
            (currentPosition.z - window.centerPoint.z)
      );

      // 修正角度计算，确保从当前位置开始旋转
      window.rotationAngle = Math.atan2(
        currentPosition.z - window.centerPoint.z,
        currentPosition.x - window.centerPoint.x
      );

      console.log(
        "Auto rotate started - Camera Y:",
        window.originalCameraY,
        "Radius:",
        window.rotationRadius,
        "Angle:",
        window.rotationAngle
      );
    }

    console.log("Auto rotate:", window.autoRotate ? "ON" : "OFF");
  }
};

// 同步mesh与splatMesh的rotation
window.syncMeshRotation = function () {
  if (viewer && currentMesh) {
    const splatMesh = viewer.getSplatMesh();
    if (splatMesh) {
      currentMesh.rotation.copy(splatMesh.rotation);
      console.log("Synced mesh rotation with splatMesh:", splatMesh.rotation);
    }
  }
};

console.log("Current config:", currentConfig);

// 初始化场景
function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#fff");
  setupLighting();

  const pathConfig = getPath(currentConfig.method, currentConfig);

  if (!pathConfig) {
    console.error("无法获取路径配置");
    return;
  }

  const {
    meshPath,
    plyName,
    initialCameraPosition,
    initialCameraLookAt,
    rotation,
  } = pathConfig;

  console.log("Mesh path:", meshPath);
  console.log("PLY name:", plyName);
  console.log("Rotation:", rotation);

  // 加载mesh（如果存在）
  if (meshPath) {
    loadMesh(meshPath, rotation);
  }

  // 初始化viewer
  initViewer(plyName, initialCameraPosition, initialCameraLookAt, rotation);
}

// 设置光照
function setupLighting() {
  // 环境光
  const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
  scene.add(ambientLight);

  // 主光源
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(10, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // 补光
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, 5, 10);
  scene.add(fillLight);

  // 背光
  const backLight = new THREE.DirectionalLight(0xffffff, 0.2);
  backLight.position.set(0, 5, -10);
  scene.add(backLight);

  // 点光源
  const pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
  pointLight.position.set(5, 8, 5);
  scene.add(pointLight);

  const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 50);
  pointLight2.position.set(-5, -8, -5);
  scene.add(pointLight2);
}

// 加载mesh
function loadMesh(meshPath, rotation) {
  console.log("Starting to load mesh from:", meshPath);
  const objLoader = new OBJLoader();

  objLoader.load(
    meshPath,
    function (object) {
      console.log("Successfully loaded mesh", object);
      const wireframeMeshes = []; // 存储所有wireframe mesh

      object.traverse(function (child) {
        if (child.isMesh) {
          console.log("Processing mesh child:", child);
          // 创建wireframe mesh
          const wireframeMesh = child.clone();

          // 设置solid材质
          child.material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            wireframe: false,
            shininess: 100,
            specular: 0x444444,
            transparent: false,
            opacity: 1.0,
            emissive: 0x222222,
          });

          // 设置wireframe材质
          wireframeMesh.material = new THREE.MeshBasicMaterial({
            color: 0x00000,
            wireframe: true,
            wireframeLinewidth: 2,
          });

          wireframeMesh.material.needsUpdate = true;

          // 将wireframe mesh添加到主对象，而不是child.parent
          object.add(wireframeMesh);
          wireframeMeshes.push(wireframeMesh);

          // 启用阴影
          child.castShadow = true;
          child.receiveShadow = true;
          wireframeMesh.castShadow = false;
          wireframeMesh.receiveShadow = false;

          child.userData.wireframeMesh = wireframeMesh;
        }
      });

      // 将wireframe mesh列表存储到object上，方便查找
      object.userData.wireframeMeshes = wireframeMeshes;

      // 应用rotation到mesh
      if (rotation && rotation.length >= 4) {
        const quaternion = new THREE.Quaternion(
          rotation[0],
          rotation[1],
          rotation[2],
          rotation[3]
        );
        object.setRotationFromQuaternion(quaternion);
        console.log("Applied rotation to mesh:", rotation);
      }

      // 默认设置mesh可见，但子对象先设置为不可见，让GUI控制函数决定实际显示状态
      object.visible = true;

      // 初始化所有子mesh为不可见
      object.traverse(function (child) {
        if (child.isMesh) {
          child.visible = false;
        }
      });

      // 初始化所有wireframe mesh为不可见
      if (object.userData.wireframeMeshes) {
        object.userData.wireframeMeshes.forEach(function (wireframeMesh) {
          wireframeMesh.visible = false;
        });
      }

      scene.add(object);
      currentMesh = object;
      console.log("Mesh added to scene. currentMesh:", currentMesh);

      // 应用当前选中的显示模式
      updateDisplayMode();

      // 不再需要键盘控制，GUI已替代
    },
    function (progress) {
      //   console.log("Loading mesh progress:", progress);
    },
    function (error) {
      console.error("Failed to load mesh:", error);
      console.error("Mesh path was:", meshPath);
    }
  );
}

// 初始化viewer
function initViewer(
  plyName,
  initialCameraPosition,
  initialCameraLookAt,
  rotation
) {
  viewer = new GaussianSplats3D.Viewer({
    initialCameraPosition: initialCameraPosition || [
      -0.15752, 0.64824, -0.17046,
    ],
    initialCameraLookAt: initialCameraLookAt || [-0.16604, 0.67413, -0.03672],
    threeScene: scene,
    sphericalHarmonicsDegree: currentConfig.sh_degree,
    enableShadows: true,
  });

  // 自动旋转控制
  window.autoRotate = false;
  window.rotationRadius = 2.0;
  window.rotationSpeed = (3 * Math.PI) / (25 * 60);
  window.rotationAngle = 0;
  window.centerPoint = new THREE.Vector3(0, 0, 0);
  window.originalCameraY = 0;

  viewer
    .addSplatScene(plyName, {
      progressiveLoad: false,
      position: [0, 0, Number(currentConfig.z)],
      rotation: rotation || [0, 0, 0, 0], // 使用从getPath返回的rotation参数
    })
    .then(() => {
      viewer.start();

      // 获取splatMesh并同步rotation到mesh
      //   window.syncMeshRotation();

      const camera = viewer.camera;
      const controls = viewer.controls;
      window.originalCameraY = camera.position.y;

      // 更新centerPoint为相机的lookAt目标点或controls的target
      if (controls && controls.target) {
        window.centerPoint.copy(controls.target);
      } else {
        // 如果没有controls.target，使用initialCameraLookAt
        const lookAt = initialCameraLookAt || [-0.16604, 0.67413, -0.03672];
        window.centerPoint.set(lookAt[0], lookAt[1], lookAt[2]);
      }

      console.log("Center point set to:", window.centerPoint);

      const initialPosition = camera.position.clone();
      window.rotationRadius = Math.sqrt(
        (initialPosition.x - window.centerPoint.x) *
          (initialPosition.x - window.centerPoint.x) +
          (initialPosition.z - window.centerPoint.z) *
            (initialPosition.z - window.centerPoint.z)
      );

      // 初始化时也要正确计算角度
      window.rotationAngle = Math.atan2(
        initialPosition.z - window.centerPoint.z,
        initialPosition.x - window.centerPoint.x
      );

      // 动画循环
      function animate() {
        if (window.autoRotate && camera && controls) {
          window.rotationAngle += window.rotationSpeed;
          const x =
            window.centerPoint.x +
            window.rotationRadius * Math.cos(window.rotationAngle);
          const z =
            window.centerPoint.z +
            window.rotationRadius * Math.sin(window.rotationAngle);

          camera.position.set(x, window.originalCameraY, z);
          camera.lookAt(window.centerPoint);

          if (controls.update) {
            controls.target.copy(window.centerPoint);
            controls.update();
          }
        }
        requestAnimationFrame(animate);
      }

      animate();
    })
    .catch((error) => {
      console.error("Error loading PLY:", error);
    });
}

// 重新加载场景
function reloadScene() {
  if (isLoadingScene) {
    console.log("Scene is already loading, please wait...");
    return;
  }

  isLoadingScene = true;
  console.log("Reloading scene with config:", currentConfig);

  // 清理现有的viewer和mesh
  if (viewer) {
    try {
      viewer.dispose();
    } catch (e) {
      console.warn("Error disposing viewer:", e);
    }
    viewer = null;
  }

  if (currentMesh) {
    scene.remove(currentMesh);
    currentMesh = null;
  }

  // 保存当前的相机位置和显示模式
  const currentDisplayMode =
    document.querySelector('input[name="displayMode"]:checked')?.value ||
    "3dgs";
  const autoRotateEnabled =
    document.getElementById("autoRotate")?.checked || false;

  // 短暂延迟后重新初始化场景
  setTimeout(() => {
    initScene();

    // 恢复显示模式
    const modeRadio = document.getElementById(
      `display${
        currentDisplayMode === "3dgs"
          ? "3DGS"
          : currentDisplayMode === "3dgs-ellipsoid"
          ? "3DGSEllipsoid"
          : currentDisplayMode === "mesh"
          ? "Mesh"
          : currentDisplayMode === "mesh-frame"
          ? "MeshFrame"
          : "Combo"
      }`
    );
    if (modeRadio) {
      modeRadio.checked = true;
    }

    // 恢复自动旋转状态
    if (document.getElementById("autoRotate")) {
      document.getElementById("autoRotate").checked = autoRotateEnabled;
    }

    isLoadingScene = false;
  }, 100);
}

// 页面加载时初始化
document.addEventListener("DOMContentLoaded", function () {
  // 设置显示控制初始状态 - 默认选择3DGS
  document.getElementById("display3DGS").checked = true;
  document.getElementById("autoRotate").checked = false;

  // 监听URL变化（用于iframe重新加载时）
  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // URL发生变化，重新读取配置
      currentConfig = getConfigFromURL();
      console.log("URL changed, new config:", currentConfig);

      // 更新GUI状态
      updateGUIState();

      // 重新初始化场景
      if (viewer) {
        viewer.dispose();
        viewer = null;
      }
      if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh = null;
      }

      setTimeout(() => {
        initScene();
      }, 100);
    }
  };

  // 每秒检查一次URL变化（简单的方法）
  setInterval(checkUrlChange, 1000);

  // 初始化时更新GUI状态
  updateGUIState();

  // 添加键盘监听器：按 c 键切换 Control Panel 显示/隐藏
  document.addEventListener("keydown", function (event) {
    if (event.key === "c" || event.key === "C") {
      const gui = document.getElementById("compactGui");
      if (gui) {
        gui.classList.toggle("hidden");
        console.log(
          "Control Panel toggled:",
          gui.classList.contains("hidden") ? "hidden" : "visible"
        );
      }
    }
  });

  initScene();
});
